import { createContext, use } from 'react'
import type { CartLine, CartTotals, NewLine } from './cart.ts'

/**
 * Estado da sacola, persistido no localStorage.
 * Dois contextos separados: quem só dispara ações (botões "Adicionar") não re-renderiza quando a sacola muda.
 */
export interface CartState {
  lines: CartLine[]
  totals: CartTotals
  open: boolean
}

export interface CartActions {
  add: (line: NewLine, qty: number) => void
  setQty: (key: string, qty: number) => void
  remove: (key: string) => void
  openCart: () => void
  closeCart: () => void
}

export const StateCtx = createContext<CartState | null>(null)
export const ActionsCtx = createContext<CartActions | null>(null)

export function useCart() {
  const ctx = use(StateCtx)
  if (!ctx) throw new Error('useCart precisa de <CartProvider>')
  return ctx
}

export function useCartActions() {
  const ctx = use(ActionsCtx)
  if (!ctx) throw new Error('useCartActions precisa de <CartProvider>')
  return ctx
}
