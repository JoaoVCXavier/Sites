/**
 * Sacola de compras: estado e regras puras (sem React, sem DOM), testáveis com `npm test`.
 *
 * Regras:
 * - cada linha é identificada pela combinação produto + cor + tamanho (`lineKey`), estável entre sessões;
 * - a mesma combinação soma quantidades; combinações diferentes ficam separadas;
 * - quantidades são inteiras entre 1 e MAX_QTY; zero remove a linha;
 * - o preço é um instantâneo em centavos (null = "Consulte o valor") e é revalidado contra o catálogo.
 */
import { lineTotal } from './money.ts'
import type { Version } from '../data/types.ts'

export const MAX_QTY = 99
export const STORAGE_KEY = 'vm:sacola:v1'

export interface CartLine {
  key: string
  productId: string
  slug: string
  /** nome do desenho, ex.: "Camiseta VM Do Morro" */
  name: string
  version: Version
  /** null quando o produto não publica opções de cor */
  color: string | null
  size: string
  qty: number
  unitCents: number | null
  /** caminho do arquivo em /public (sem o base do Vite) */
  image: string
}

export type NewLine = Omit<CartLine, 'key' | 'qty'>

export type CartAction =
  | { type: 'add'; line: NewLine; qty: number }
  | { type: 'setQty'; key: string; qty: number }
  | { type: 'remove'; key: string }
  | { type: 'clear' }
  | { type: 'replace'; lines: CartLine[] }

export const lineKey = (productId: string, color: string | null, size: string) =>
  [productId, color ?? '-', size].map(encodeURIComponent).join('|')

export const clampQty = (qty: number) =>
  Number.isFinite(qty) ? Math.min(MAX_QTY, Math.max(0, Math.trunc(qty))) : 0

export function cartReducer(lines: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case 'add': {
      const qty = clampQty(action.qty)
      if (qty < 1) return lines
      const key = lineKey(action.line.productId, action.line.color, action.line.size)
      const existing = lines.find((l) => l.key === key)
      if (existing) {
        const next = clampQty(existing.qty + qty)
        return next === existing.qty ? lines : lines.map((l) => (l.key === key ? { ...l, ...action.line, key, qty: next } : l))
      }
      return [...lines, { ...action.line, key, qty }]
    }
    case 'setQty': {
      const qty = clampQty(action.qty)
      if (qty < 1) return lines.filter((l) => l.key !== action.key)
      return lines.map((l) => (l.key === action.key && l.qty !== qty ? { ...l, qty } : l))
    }
    case 'remove':
      return lines.filter((l) => l.key !== action.key)
    case 'clear':
      return lines.length ? [] : lines
    case 'replace':
      return action.lines
  }
}

export interface CartTotals {
  /** total de peças (soma das quantidades) */
  units: number
  /** soma dos subtotais com preço conhecido */
  knownCents: number
  /** linhas sem preço publicado */
  unpricedLines: number
  /** true quando todos os itens têm preço: só então o total é o valor do pedido */
  complete: boolean
}

export function cartTotals(lines: readonly Pick<CartLine, 'qty' | 'unitCents'>[]): CartTotals {
  let units = 0
  let knownCents = 0
  let unpricedLines = 0
  for (const l of lines) {
    units += l.qty
    const sub = lineTotal(l.unitCents, l.qty)
    if (sub === null) unpricedLines++
    else knownCents += sub
  }
  return { units, knownCents, unpricedLines, complete: unpricedLines === 0 }
}

/* ---------- persistência ---------- */

const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length < 300
const isCents = (v: unknown): v is number | null => v === null || (Number.isSafeInteger(v) && (v as number) > 0)

/** Lê o conteúdo salvo; qualquer entrada malformada é descartada sem quebrar a aplicação. */
export function parseStoredCart(raw: string | null): CartLine[] {
  if (!raw) return []
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return []
  }
  const list = (data as { v?: unknown; lines?: unknown })?.lines
  if ((data as { v?: unknown })?.v !== 1 || !Array.isArray(list)) return []
  const out: CartLine[] = []
  for (const item of list.slice(0, 200)) {
    const l = item as Partial<CartLine>
    const qty = clampQty(Number(l?.qty))
    if (
      !l ||
      !isStr(l.productId) ||
      !isStr(l.slug) ||
      !isStr(l.name) ||
      (l.version !== 'regular' && l.version !== 'plus') ||
      !(l.color === null || isStr(l.color)) ||
      !isStr(l.size) ||
      !isStr(l.image) ||
      !isCents(l.unitCents) ||
      qty < 1
    )
      continue
    const line: NewLine = {
      productId: l.productId,
      slug: l.slug,
      name: l.name,
      version: l.version,
      color: l.color,
      size: l.size,
      unitCents: l.unitCents,
      image: l.image,
    }
    // passa pelo reducer: chaves recalculadas e duplicatas somadas
    const merged = cartReducer(out, { type: 'add', line, qty })
    out.splice(0, out.length, ...merged)
  }
  return out
}

export const serializeCart = (lines: CartLine[]) => JSON.stringify({ v: 1, lines })

/* ---------- revalidação contra o catálogo atual ---------- */

export interface CatalogLookup {
  (productId: string):
    | {
        available: boolean
        priceCents: number | null
        sizes: string[]
        colors: string[]
        name: string
        /** caminhos de imagem válidos do produto e uma foto padrão para substituir caminhos antigos */
        images?: string[]
        image?: string
      }
    | undefined
}

/**
 * Atualiza preço e nome a partir do catálogo e remove linhas que deixaram de existir
 * (produto removido, indisponível, ou cor/tamanho que não são mais publicados).
 * Devolve o mesmo array quando nada mudou.
 */
export function reconcileCart(lines: CartLine[], lookup: CatalogLookup): CartLine[] {
  let changed = false
  const out: CartLine[] = []
  for (const l of lines) {
    const p = lookup(l.productId)
    const colorOk = p && (p.colors.length === 0 ? l.color === null : l.color !== null && p.colors.includes(l.color))
    if (!p || !p.available || !p.sizes.includes(l.size) || !colorOk) {
      changed = true
      continue
    }
    const image = p.images && p.image && !p.images.includes(l.image) ? p.image : l.image
    if (p.priceCents !== l.unitCents || p.name !== l.name || image !== l.image) {
      changed = true
      out.push({ ...l, unitCents: p.priceCents, name: p.name, image })
    } else out.push(l)
  }
  return changed ? out : lines
}
