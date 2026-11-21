import snapshot from './catalog.generated.json'
import type { CatalogProduct, CatalogSnapshot, CollectionId, Model, ProductImage, Tone } from './types'

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
    models.push({
      slug,
      name: shortName(regular.title),
      fullName: regular.title.replace(PLUS, ''),
      category: regular.category,
      regular,
      plus: g.regular ? (g.plus ?? null) : null,
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
  kicker: string
  description: string
  filter: (m: Model) => boolean
  cover: string
}[] = [
  {
    id: 'lancamentos',
    title: 'Lançamentos',
    kicker: 'Categoria do catálogo',
    description: 'Os modelos mais recentes publicados no catálogo oficial da marca.',
    filter: (m) => m.category === 'Lançamentos',
    cover: 'stamp',
  },
  {
    id: 'camisetas',
    title: 'Camisetas',
    kicker: 'Categoria do catálogo',
    description: 'Camisetas oversized da linha principal do catálogo oficial.',
    filter: (m) => m.category === 'Camisetas',
    cover: 'kiss-me',
  },
  {
    id: 'plus-size',
    title: 'Plus Size',
    kicker: 'Versões do catálogo',
    description: 'Os mesmos desenhos também publicados em versão Plus Size.',
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

/** Resolve um caminho de /public respeitando o `base` do Vite. */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

export function srcSet(img: ProductImage) {
  return Object.entries(img.srcset)
    .map(([w, src]) => `${asset(src)} ${w}w`)
    .join(', ')
}

export const largestSrc = (img: ProductImage) => {
  const widths = Object.keys(img.srcset).map(Number).sort((a, b) => b - a)
  return asset(img.srcset[widths[0]])
}

export const smallestSrc = (img: ProductImage) => {
  const widths = Object.keys(img.srcset).map(Number).sort((a, b) => a - b)
  return asset(img.srcset[widths[0]])
}
