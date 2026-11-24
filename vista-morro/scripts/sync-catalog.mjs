/**
 * Sincroniza a vitrine com o catálogo oficial da Vista Morro (meucatalogo.app/vistamorro).
 *
 * - Lê, somente leitura, os dados públicos da loja pela mesma API GraphQL usada pelo catálogo
 *   (inclui preço e preço anterior publicados).
 * - Baixa as fotos oficiais no tamanho original (1200 × 1200, fundo transparente) e guarda uma cópia
 *   intacta em `.catalog-originals/` (fora do git). Nada é ampliado artificialmente.
 * - Recorta a área útil e exporta WebP em larguras responsivas, até a largura nativa da peça.
 * - Mede cada foto pelo canal alfa: ponto da gola, linha dos ombros e tom (claro/escuro).
 *   Esses dados posicionam o cabide em `src/data/rig.ts`.
 * - Escreve src/data/catalog.generated.json — a interface nunca edita este arquivo manualmente.
 *
 * Uso: npm run sync:catalog            (baixa dados e fotos)
 *      npm run sync:catalog -- --cached (reprocessa as fotos a partir de .catalog-originals)
 */
import { mkdir, writeFile, readFile, rm, cp, access } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const STORE_ID = 'vistamorro'
const API = 'https://graph.meucatalogo.app'
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC_DIR = join(ROOT, 'public')
const IMG_DIR = join(PUBLIC_DIR, 'catalog')
const ORIGINALS_DIR = join(ROOT, '.catalog-originals')
// As fotos novas são gravadas aqui e só substituem as atuais se a sincronização terminar sem erros.
const TMP_IMG_DIR = join(PUBLIC_DIR, '.catalog-tmp')
const OUT_JSON = join(ROOT, 'src', 'data', 'catalog.generated.json')
/** Larguras-alvo; a maior variante é sempre a largura nativa do recorte (nunca maior). */
const WIDTHS = [480, 720]
const CACHED = process.argv.includes('--cached')

async function gql(operationName, query, variables) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://meucatalogo.app' },
    body: JSON.stringify({ operationName, query, variables }),
  })
  if (!res.ok) throw new Error(`${operationName}: HTTP ${res.status}`)
  const json = await res.json()
  if (json.errors) throw new Error(`${operationName}: ${JSON.stringify(json.errors)}`)
  return json.data
}

async function download(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`download ${url}: HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

const exists = (p) => access(p).then(() => true, () => false)

const STORE_Q = `query store($publicId: String!) { store(publicId: $publicId) {
  id name color publicId categories { id description } logo { url }
  socialMedia { type address countryPhoneCode }
  companyInfo { name about email address { city state } }
} }`

const LIST_Q = `query products($storeId: String!, $skip: Int!, $first: Int!, $search: String, $orderBy: String!) {
  productList(publicStoreId: $storeId, orderBy: $orderBy, search: $search, skip: $skip, first: $first) {
    total products { id }
  } }`

const PRODUCT_Q = `query product($id: String!) { product(id: $id) {
  id title description available price oldPrice
  category { id description }
  variations { id name options { id name } }
  gallery { images { id url } }
} }`

/** Extrai "Chave: valor" do bloco DETALHES DO PRODUTO da descrição oficial. */
function parseSpecs(description = '') {
  const specs = {}
  for (const key of ['Modelagem', 'Composição', 'Malha', 'Gramatura', 'Fio']) {
    const m = description.match(new RegExp(`${key}:\\s*([^\\n]+)`))
    if (m) specs[key] = m[1].trim()
  }
  return specs
}

/** Linhas da tabela de medidas, exatamente como publicadas. */
function parseMeasures(description = '') {
  const block = description.split(/TABELA DE MEDIDAS/i)[1]
  const lines = (block ?? description).split('\n').map((l) => l.trim())
  const header = block ? lines[0].replace(/[()]/g, '').trim() : ''
  const rows = lines.filter((l) => /^(PP|P|M|G|GG|XG|G1|G2|G3|Tamanho\s+\w+)\b.*\d/i.test(l))
  return { header, rows }
}

/** Frase de abertura da descrição — ignorada quando a primeira linha é uma medida (ex.: "Tamanho M - 74cm…"). */
function intro(description = '') {
  const first = description.split('\n')[0].trim()
  return /\d\s*cm\b/i.test(first) ? '' : first
}

/** Reais publicados → centavos inteiros. Ausente, zero ou inválido → null ("Consulte o valor"). */
const toCents = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v * 100) : null)

/**
 * Mede a peça pelo canal alfa do recorte:
 * - gola: ponto mais alto do contorno na faixa central (a gola de trás, onde o gancho entra);
 * - ombros: onde o contorno superior cai além de 14% da altura a partir da gola (início das mangas);
 * - tom: luminância média dos pixels opacos.
 * Tudo em frações da imagem recortada, para não depender da resolução exportada.
 */
async function measureGarment(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H, channels: C } = info
  const top = new Int32Array(W).fill(H)
  let lum = 0
  let count = 0
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C
      const a = data[i + 3]
      if (a > 160) {
        if (top[x] === H) top[x] = y
        if (a > 230) {
          lum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
          count++
        }
      }
    }
  }
  const x0 = Math.floor(W * 0.3)
  const x1 = Math.ceil(W * 0.7)
  let collarTop = H
  for (let x = x0; x < x1; x++) collarTop = Math.min(collarTop, top[x])
  // colunas da gola: até 1% da altura abaixo do ponto mais alto, na faixa central
  const tol = Math.max(2, Math.round(H * 0.01))
  let nl = -1
  let nr = -1
  for (let x = x0; x < x1; x++) {
    if (top[x] <= collarTop + tol) {
      if (nl === -1) nl = x
      nr = x
    }
  }
  // sem gola detectável na faixa central (foto atípica): usa o centro, sem inventar medidas
  if (nl === -1) {
    nl = nr = Math.round(W / 2)
    collarTop = 0
  }
  const neckX = (nl + nr) / 2
  // ombros: caminha do centro para fora enquanto o contorno superior não "despenca" para a manga
  const drop = collarTop + H * 0.14
  let sl = Math.round(neckX)
  while (sl > 0 && top[sl - 1] <= drop) sl--
  let sr = Math.round(neckX)
  while (sr < W - 1 && top[sr + 1] <= drop) sr++
  const shoulderY = Math.max(top[Math.min(W - 1, sl + 2)], top[Math.max(0, sr - 2)])
  const r = (v) => Math.round(v * 10000) / 10000
  return {
    tone: count ? (lum / count / 255 < 0.42 ? 'dark' : 'light') : 'dark',
    anchor: {
      neckX: r(neckX / W),
      neckY: r(collarTop / H),
      neckW: r((nr - nl) / W),
      shoulderL: r(sl / W),
      shoulderR: r(sr / W),
      shoulderY: r(shoulderY / H),
    },
  }
}

async function originalFor(productId, image) {
  const file = join(ORIGINALS_DIR, productId, `${image.id}.webp`)
  if (await exists(file)) return readFile(file)
  if (CACHED) throw new Error(`original ausente em cache: ${file}`)
  const raw = await download(image.url)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, raw)
  return raw
}

async function processImage(productId, image) {
  const raw = await originalFor(productId, image)
  // As fotos oficiais têm fundo transparente: trim recorta exatamente o contorno da peça.
  const trimmed = await sharp(raw).trim({ threshold: 1 }).png().toBuffer({ resolveWithObject: true })
  const { width, height } = trimmed.info
  const dir = join(TMP_IMG_DIR, productId)
  await mkdir(dir, { recursive: true })
  const srcset = {}
  const targets = [...WIDTHS.filter((w) => w < width), width]
  for (const w of targets) {
    const file = `${image.id}-${w}.webp`
    let pipe = sharp(trimmed.data)
    if (w < width) {
      // redução com Lanczos + nitidez leve de reamostragem (não cria detalhe: só compensa a suavização da redução)
      pipe = pipe.resize({ width: w, kernel: 'lanczos3' }).sharpen({ sigma: 0.45, m1: 0.6, m2: 1.2 })
    }
    await pipe
      .webp({ quality: w === width ? 92 : 88, alphaQuality: 100, smartSubsample: true, effort: 6 })
      .toFile(join(dir, file))
    srcset[w] = `catalog/${productId}/${file}`
  }
  const measured = await measureGarment(trimmed.data)
  return { id: image.id, width, height, srcset, ...measured }
}

async function buildLogoMask(url) {
  const raw = await download(url)
  // Logo oficial: monograma branco sobre preto. A luminância vira canal alfa (branco = opaco).
  const size = 1024
  const alpha = await sharp(raw)
    .resize(size, size, { kernel: 'lanczos3' })
    .greyscale()
    .blur(0.6)
    .linear(1.9, -150) // reforça a borda sem alterar o desenho
    .extractChannel(0)
    .toBuffer()
  const white = await sharp({ create: { width: size, height: size, channels: 3, background: '#ffffff' } })
    .joinChannel(alpha, { raw: undefined })
    .png()
    .toBuffer()
  const trimmed = await sharp(white).trim({ threshold: 1 }).webp({ lossless: true, effort: 6 }).toBuffer({ resolveWithObject: true })
  await writeFile(join(PUBLIC_DIR, 'brand', 'vm-monogram.webp'), trimmed.data)
  await writeFile(join(PUBLIC_DIR, 'brand', 'logo-original.webp'), raw)
  // Favicon/ícone: monograma oficial original em 180px e 32px.
  await sharp(raw).resize(180, 180).png().toFile(join(PUBLIC_DIR, 'apple-touch-icon.png'))
  await sharp(raw).resize(32, 32).png().toFile(join(PUBLIC_DIR, 'favicon.png'))
  return { width: trimmed.info.width, height: trimmed.info.height }
}

/** Modo --cached: reaproveita o JSON atual e só refaz as fotos a partir dos originais guardados. */
async function reprocessCached() {
  const current = JSON.parse(await readFile(OUT_JSON, 'utf8'))
  await rm(TMP_IMG_DIR, { recursive: true, force: true })
  for (const p of current.products) {
    p.images = await Promise.all(p.images.map((img) => processImage(p.id, { id: img.id })))
    console.log(`  ✓ ${p.title}`)
  }
  return current
}

async function fetchAll() {
  console.log('→ loja')
  const { store } = await gql('store', STORE_Q, { publicId: STORE_ID })
  const PAGE = 100
  const ids = []
  let total = Infinity
  while (ids.length < total) {
    const { productList } = await gql('products', LIST_Q, {
      storeId: STORE_ID, skip: ids.length, first: PAGE, orderBy: 'createdAt_DESC',
    })
    total = productList.total
    if (productList.products.length === 0) break
    ids.push(...productList.products.map((p) => p.id))
  }
  console.log(`→ ${ids.length} de ${total} produtos`)

  await rm(TMP_IMG_DIR, { recursive: true, force: true })
  await mkdir(join(PUBLIC_DIR, 'brand'), { recursive: true })
  const logo = await buildLogoMask(store.logo.url)

  const products = []
  for (const id of ids) {
    const { product: p } = await gql('product', PRODUCT_Q, { id })
    const variation = (name) =>
      (p.variations ?? []).find((v) => v.name?.toLowerCase() === name)?.options.map((o) => o.name) ?? []
    const images = []
    for (const image of p.gallery?.images ?? []) images.push(await processImage(p.id, image))
    products.push({
      id: p.id,
      title: p.title.trim(),
      available: p.available,
      priceCents: toCents(p.price),
      compareAtCents: toCents(p.oldPrice),
      category: p.category?.description ?? null,
      intro: intro(p.description),
      specs: parseSpecs(p.description),
      measures: parseMeasures(p.description),
      sizes: variation('tamanho'),
      colors: variation('cor'),
      images,
      catalogUrl: `https://meucatalogo.app/${STORE_ID}/product/${p.id}`,
    })
    console.log(`  ✓ ${p.title} (${images.length} fotos)`)
  }

  const whatsapp = store.socialMedia?.find((s) => s.type === 'WHATSAPP')
  return {
    syncedAt: new Date().toISOString(),
    source: `https://meucatalogo.app/${STORE_ID}`,
    store: {
      name: store.name,
      color: store.color,
      categories: store.categories.map((c) => c.description),
      whatsapp: whatsapp ? `${whatsapp.countryPhoneCode}${whatsapp.address}`.replace(/\D/g, '') : null,
      about: store.companyInfo?.about ?? null,
      logoMask: { src: 'brand/vm-monogram.webp', ...logo },
    },
    products,
  }
}

async function main() {
  const out = CACHED ? await reprocessCached() : await fetchAll()
  // Tudo processado: troca as fotos e grava o JSON.
  if (!(await exists(TMP_IMG_DIR))) throw new Error('nenhuma foto foi processada; as fotos atuais foram mantidas')
  // Copia para uma pasta irmã primeiro e só então troca: uma falha na cópia mantém as fotos atuais.
  // (cp + rm em vez de rename: no Windows o rename falha com EPERM se o servidor de desenvolvimento observa /public.)
  const NEXT_DIR = `${IMG_DIR}.next`
  await rm(NEXT_DIR, { recursive: true, force: true })
  await cp(TMP_IMG_DIR, NEXT_DIR, { recursive: true })
  await rm(IMG_DIR, { recursive: true, force: true })
  await cp(NEXT_DIR, IMG_DIR, { recursive: true })
  await rm(NEXT_DIR, { recursive: true, force: true })
  await rm(TMP_IMG_DIR, { recursive: true, force: true })
  await mkdir(dirname(OUT_JSON), { recursive: true })
  await writeFile(OUT_JSON, JSON.stringify(out, null, 2) + '\n')
  console.log(`✓ ${OUT_JSON}`)
}

main().catch(async (err) => {
  await rm(TMP_IMG_DIR, { recursive: true, force: true })
  console.error(err)
  process.exit(1)
})
