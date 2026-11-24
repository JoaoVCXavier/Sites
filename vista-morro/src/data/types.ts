/**
 * Modelo de dados da loja. `CatalogProduct` espelha um SKU do catálogo oficial;
 * `Model` agrupa as versões (Regular / Plus Size) de um mesmo desenho.
 */

/** Medidas da peça na foto, em frações da imagem recortada (geradas por scripts/sync-catalog.mjs). */
export interface GarmentAnchor {
  /** centro horizontal da gola */
  neckX: number
  /** topo da gola (ponto mais alto da peça) */
  neckY: number
  /** largura da faixa da gola */
  neckW: number
  /** extremidades da linha dos ombros */
  shoulderL: number
  shoulderR: number
  shoulderY: number
}

export interface ProductImage {
  id: string
  width: number
  height: number
  srcset: Record<string, string>
  /** tom predominante da peça na foto (luminância dos pixels opacos) */
  tone: 'dark' | 'light'
  anchor: GarmentAnchor
}

export interface CatalogProduct {
  id: string
  title: string
  available: boolean
  /** preço publicado em centavos; null = sem preço publicado ("Consulte o valor") */
  priceCents: number | null
  /** preço anterior publicado ("de"), em centavos */
  compareAtCents: number | null
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

export type Version = 'regular' | 'plus'

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
