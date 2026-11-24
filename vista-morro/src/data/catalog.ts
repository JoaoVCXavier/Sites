import snapshot from './catalog.generated.json'
import type { CatalogProduct, CatalogSnapshot, CollectionId, Model, ProductImage, Tone, Version } from './types'
import type { CatalogLookup } from '../commerce/cart.ts'

export const catalog = snapshot as CatalogSnapshot

const PLUS = /\s*plus\s*size\s*$/i

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/** "Camiseta VM Kiss me" → "Kiss Me" */
const shortName = (title: string) =>
  title
    .replace(PLUS, '')
    .replace(/^camiseta\s+vm\s+/i, '')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

/**
 * Curadoria editorial (escolha de foto e ordem na arara).
 * `image` é o índice na galeria oficial do produto regular; `tone` descreve a cor da peça na foto.
 * Apenas seleciona fotos reais — nada é alterado.
 */
const curation: Record<string, { image: number; tone: Tone }> = {
  urban: { image: 2, tone: 'paper' },
  'kiss-me': { image: 0, tone: 'ink' },
  'money-run': { image: 0, tone: 'paper' },
  angel: { image: 1, tone: 'smoke' },
  'do-morro': { image: 0, tone: 'ink' },
  stamp: { image: 3, tone: 'paper' },
  signature: { image: 0, tone: 'ink' },
  riqueza: { image: 3, tone: 'paper' },
  authentic: { image: 0, tone: 'ink' },
}
const railOrder = Object.keys(curation)

function buildModels(products: CatalogProduct[]): Model[] {
  const groups = new Map<string, { regular?: CatalogProduct; plus?: CatalogProduct }>()
  for (const p of products) {
    const slug = slugify(shortName(p.title))
    const g = groups.get(slug) ?? {}
    if (PLUS.test(p.title)) g.plus = p
    else g.regular = p
    groups.set(slug, g)
  }

  const models: Model[] = []
  for (const [slug, g] of groups) {
    const regular = g.regular ?? g.plus
    if (!regular || regular.images.length === 0) continue
    const c = curation[slug]
    const hero: ProductImage = regular.images[c?.image ?? 0] ?? regular.images[0]
    const name = shortName(regular.title)
    models.push({
      slug,
      name,
      // Nome de exibição consistente ("Kiss me" e "Kiss Me" aparecem no catálogo): "Camiseta VM Kiss Me"
      fullName: `Camiseta VM ${name}`,
      category: regular.category,
      regular,
      // Versão Plus Size só conta se tiver fotos; um desenho só-Plus usa o mesmo produto nos dois campos.
      plus: g.plus && g.plus.images.length > 0 ? g.plus : null,
      hero,
      heroTone: c?.tone ?? 'ink',
      available: regular.available || Boolean(g.plus?.available),
    })
  }

  const rank = (m: Model) => {
    const i = railOrder.indexOf(m.slug)
    return i === -1 ? railOrder.length : i
  }
  return models.sort((a, b) => rank(a) - rank(b))
}

export const models = buildModels(catalog.products)

export const collections: {
  id: Exclude<CollectionId, 'todas'>
  title: string
  description: string
  filter: (m: Model) => boolean
  cover: string
}[] = [
  {
    id: 'lancamentos',
    title: 'Lançamentos',
    description: 'Os desenhos mais recentes da marca.',
    filter: (m) => m.category === 'Lançamentos',
    cover: 'stamp',
  },
  {
    id: 'camisetas',
    title: 'Camisetas',
    description: 'A linha principal de camisetas oversized.',
    filter: (m) => m.category === 'Camisetas',
    cover: 'kiss-me',
  },
  {
    id: 'plus-size',
    title: 'Plus Size',
    description: 'Os mesmos desenhos na modelagem Plus Size.',
    filter: (m) => m.plus !== null,
    cover: 'do-morro',
  },
]

export function modelsFor(id: CollectionId): Model[] {
  if (id === 'todas') return models
  const c = collections.find((c) => c.id === id)
  return c ? models.filter(c.filter) : models
}

export const findModel = (slug: string) => models.find((m) => m.slug === slug)

export const productFor = (model: Model, version: Version): CatalogProduct =>
  version === 'plus' && model.plus ? model.plus : model.regular

/* ---------- imagens ---------- */

/** Resolve um caminho de /public respeitando o `base` do Vite. */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

const widthsOf = (img: ProductImage) =>
  Object.keys(img.srcset)
    .map(Number)
    .sort((a, b) => a - b)

export function srcSet(img: ProductImage) {
  return widthsOf(img)
    .map((w) => `${asset(img.srcset[w])} ${w}w`)
    .join(', ')
}

export const largestSrc = (img: ProductImage) => asset(img.srcset[widthsOf(img).at(-1)!])
export const smallestSrc = (img: ProductImage) => asset(img.srcset[widthsOf(img)[0]])
/** Menor arquivo com pelo menos `w` pixels de largura (ou o maior disponível). */
export const srcAtLeast = (img: ProductImage, w: number) => {
  const ws = widthsOf(img)
  return img.srcset[ws.find((x) => x >= w) ?? ws.at(-1)!]
}

/* ---------- variações ---------- */

const SIZE_ORDER = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG', 'G1', 'G2', 'G3', 'G4']

/** Tamanhos exatamente como publicados, em ordem crescente (o catálogo os lista fora de ordem). */
export const sortedSizes = (sizes: string[]) =>
  [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a.toUpperCase())
    const ib = SIZE_ORDER.indexOf(b.toUpperCase())
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

/**
 * Linhas da tabela de medidas que correspondem aos tamanhos publicados.
 * Quando a tabela do catálogo não bate com os tamanhos do produto (ex.: tabela P–GG num Plus Size),
 * nenhuma linha é exibida — melhor omitir do que mostrar uma medida errada.
 */
export function measuresFor(product: CatalogProduct): { size: string; text: string }[] {
  const out: { size: string; text: string }[] = []
  for (const size of sortedSizes(product.sizes)) {
    const row = product.measures.rows.find((r) => new RegExp(`^(Tamanho\\s+)?${size}\\b`, 'i').test(r))
    if (row) out.push({ size, text: row.replace(new RegExp(`^(Tamanho\\s+)?${size}\\s*[:\\-–]?\\s*`, 'i'), '') })
  }
  return out.length === product.sizes.length ? out : []
}

const COLOR_TONES: [RegExp, ProductImage['tone']][] = [
  [/off\s*-?\s*white|branc|cru|bege/i, 'light'],
  [/pret|black|grafite|chumbo/i, 'dark'],
]
const toneOfColor = (color: string) => COLOR_TONES.find(([re]) => re.test(color))?.[1]

/**
 * Foto correspondente a uma cor, quando é possível saber com segurança: cada cor do produto precisa
 * corresponder a um tom diferente (ex.: "Preta" × "Off white") e existir uma foto medida com esse tom.
 * Em casos ambíguos ("Preta c/ logo preta" × "Preta c/ logo branca") devolve -1 e a galeria não muda.
 */
export function imageIndexForColor(product: CatalogProduct, color: string): number {
  if (product.colors.length < 2) return -1
  const tones = product.colors.map(toneOfColor)
  if (tones.some((t) => !t) || new Set(tones).size !== tones.length) return -1
  const tone = toneOfColor(color)
  return product.images.findIndex((img) => img.tone === tone)
}

/* ---------- comercial ---------- */

/** Ponte entre a sacola salva e o catálogo atual (preço, disponibilidade e opções vigentes). */
export const catalogLookup: CatalogLookup = (productId) => {
  const p = catalog.products.find((x) => x.id === productId)
  if (!p) return undefined
  const model = models.find((m) => m.regular.id === productId || m.plus?.id === productId)
  return {
    available: p.available,
    priceCents: p.priceCents,
    sizes: p.sizes,
    colors: p.colors,
    name: model?.fullName ?? p.title.replace(PLUS, ''),
    images: p.images.flatMap((img) => Object.values(img.srcset)),
    image: p.images[0] ? srcAtLeast(p.images[0], 240) : undefined,
  }
}

export const whatsappNumber = catalog.store.whatsapp
