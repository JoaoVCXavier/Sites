/**
 * Sincroniza a vitrine com o catálogo oficial da Vista Morro (meucatalogo.app/vistamorro).
 *
 * - Lê, somente leitura, os dados públicos da loja pela mesma API GraphQL usada pelo catálogo.
 * - Baixa as fotos oficiais (já com fundo transparente), recorta a área útil e gera WebP em 2 larguras.
 * - Gera uma máscara em alta resolução do monograma oficial a partir da logo publicada.
 * - Escreve src/data/catalog.generated.json — a interface nunca edita este arquivo manualmente.
 *
 * Uso: npm run sync:catalog
 */
import { mkdir, writeFile, rm, rename } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const STORE_ID = 'vistamorro'
const API = 'https://graph.meucatalogo.app'
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC_DIR = join(ROOT, 'public')
const IMG_DIR = join(PUBLIC_DIR, 'catalog')
// As fotos novas são gravadas aqui e só substituem as atuais se a sincronização terminar sem erros.
const TMP_IMG_DIR = join(PUBLIC_DIR, '.catalog-tmp')
const OUT_JSON = join(ROOT, 'src', 'data', 'catalog.generated.json')
const WIDTHS = [480, 960]

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
  id title description available
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

async function processImage(productId, image) {
  const raw = await download(image.url)
  // As fotos oficiais têm fundo transparente: trim recorta exatamente o contorno da peça.
  const trimmed = await sharp(raw).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true })
  const { width, height } = trimmed.info
  const dir = join(TMP_IMG_DIR, productId)
  await mkdir(dir, { recursive: true })
  const srcset = {}
  for (const w of WIDTHS) {
    const file = `${image.id}-${w}.webp`
    await sharp(trimmed.data)
      .resize({ width: Math.min(w, width) })
      .webp({ quality: 82, alphaQuality: 90, effort: 6 })
      .toFile(join(dir, file))
    srcset[w] = `catalog/${productId}/${file}`
  }
  return { id: image.id, width, height, srcset }
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

async function main() {
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
  const out = {
    syncedAt: new Date().toISOString(),
    source: `https://meucatalogo.app/${STORE_ID}`,
    store: {
      name: store.name,
      color: store.color,
      categories: store.categories.map((c) => c.description),
      whatsapp: whatsapp ? `${whatsapp.countryPhoneCode}${whatsapp.address}` : null,
      about: store.companyInfo?.about ?? null,
      logoMask: { src: 'brand/vm-monogram.webp', ...logo },
    },
    products,
  }
  // Tudo baixado: troca as fotos e grava o JSON.
  await rm(IMG_DIR, { recursive: true, force: true })
  await rename(TMP_IMG_DIR, IMG_DIR)
  await mkdir(dirname(OUT_JSON), { recursive: true })
  await writeFile(OUT_JSON, JSON.stringify(out, null, 2) + '\n')
  console.log(`✓ ${OUT_JSON}`)
}

main().catch(async (err) => {
  await rm(TMP_IMG_DIR, { recursive: true, force: true })
  console.error(err)
  process.exit(1)
})
