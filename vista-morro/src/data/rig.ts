import type { ProductImage } from './types'

/**
 * "Rig" de cada peça pendurada: onde o cabide encaixa na foto e como o conjunto gira.
 *
 * Os valores-base vêm das medições automáticas do canal alfa de cada foto
 * (`anchor`, gerado por scripts/sync-catalog.mjs). Ajustes finos por desenho ficam em `OVERRIDES`,
 * num único lugar, em vez de correções espalhadas pelos componentes.
 *
 * Unidades: frações da LARGURA da peça exibida, exceto onde indicado.
 */
export interface Rig {
  /** centro da gola na foto (fração da largura da imagem) */
  neckX: number
  /** topo da gola na foto (fração da ALTURA da imagem) */
  neckY: number
  /** distância vertical do ponto de apoio na arara (pivô) até o topo da gola */
  drop: number
  /** tamanho do gancho em relação à largura da peça (1 = padrão) */
  hookScale: number
  /** deslocamentos finais da foto em relação ao cabide (frações da largura) */
  offsetX: number
  offsetY: number
  /** inércia relativa no balanço (peças maiores/mais pesadas: > 1) */
  mass: number
}

/** Geometria do gancho (viewBox do SVG em `Hanger.tsx`), compartilhada com o layout. */
export const HOOK = {
  viewW: 48,
  viewH: 120,
  /** ponto de contato interno com a barra, dentro do viewBox */
  pivotX: 24,
  pivotY: 7.6,
  /** 1 unidade do viewBox = largura da peça / UNITS_PER_WIDTH (gancho ≈ 8,5% da largura, como um cabide real numa camiseta oversized) */
  unitsPerWidth: 565,
} as const

const BASE: Omit<Rig, 'neckX' | 'neckY'> = {
  drop: 0.16,
  hookScale: 1.18,
  offsetX: 0,
  offsetY: 0,
  mass: 1,
}

/** Ajustes por desenho (slug). Mantenha vazio sempre que a medição automática estiver correta. */
const OVERRIDES: Record<string, Partial<Rig>> = {
  // Suedine 240 g: tecido mais pesado, balança mais devagar.
  authentic: { mass: 1.25 },
}

export function rigFor(image: ProductImage, slug?: string, variant: 'regular' | 'plus' = 'regular'): Rig {
  const a = image.anchor
  const o = (slug && OVERRIDES[slug]) || {}
  return {
    ...BASE,
    neckX: a?.neckX ?? 0.5,
    neckY: a?.neckY ?? 0,
    ...o,
    // Plus Size: peça mais longa e pesada → um pouco mais de inércia.
    mass: (o.mass ?? BASE.mass) * (variant === 'plus' ? 1.12 : 1),
  }
}
