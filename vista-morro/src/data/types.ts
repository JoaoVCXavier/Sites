/**
 * Modelo de dados da vitrine. Pensado para servir também a um e-commerce futuro:
 * `CatalogProduct` espelha um SKU do catálogo; `Model` agrupa as versões (regular / Plus Size)
 * de um mesmo desenho. Nenhum campo comercial (preço, estoque) é exibido nesta fase.
 */
export interface ProductImage {
  id: string
  width: number
  height: number
  srcset: Record<string, string>
}

export interface CatalogProduct {
  id: string
  title: string
  available: boolean
  category: string | null
  intro: string
  specs: Partial<Record<'Modelagem' | 'Composição' | 'Malha' | 'Gramatura' | 'Fio', string>>
  measures: { header: string; rows: string[] }
  sizes: string[]
  colors: string[]
  images: ProductImage[]
  catalogUrl: string
}

export interface CatalogSnapshot {
  syncedAt: string
  source: string
  store: {
    name: string
    color: string
    categories: string[]
    whatsapp: string | null
    about: string | null
    logoMask: { src: string; width: number; height: number }
  }
  products: CatalogProduct[]
}

export type Tone = 'ink' | 'paper' | 'smoke'

export interface Model {
  /** slug estável, ex.: "do-morro" */
  slug: string
  /** nome curto, ex.: "Do Morro" */
  name: string
  /** nome completo como no catálogo, ex.: "Camiseta VM Do Morro" */
  fullName: string
  category: string | null
  regular: CatalogProduct
  plus: CatalogProduct | null
  /** imagem escolhida para o cabide */
  hero: ProductImage
  heroTone: Tone
  available: boolean
}

export type CollectionId = 'todas' | 'lancamentos' | 'camisetas' | 'plus-size'
