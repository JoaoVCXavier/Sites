import { useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import {
  cartReducer,
  cartTotals,
  parseStoredCart,
  reconcileCart,
  serializeCart,
  STORAGE_KEY,
  type CartLine,
} from './cart.ts'
import { catalogLookup } from '../data/catalog'
import { ActionsCtx, StateCtx, type CartActions, type CartState } from './cartContext.ts'

function readStorage(): CartLine[] {
  try {
    return reconcileCart(parseStoredCart(window.localStorage.getItem(STORAGE_KEY)), catalogLookup)
  } catch {
    // modo privado / armazenamento bloqueado: a sacola funciona só durante a visita
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(cartReducer, undefined, readStorage)
  const [open, setOpen] = useState(false)
  const skipWrite = useRef(true)

  // grava a cada mudança (exceto a leitura inicial e mudanças vindas de outra aba)
  useEffect(() => {
    if (skipWrite.current) {
      skipWrite.current = false
      return
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, serializeCart(lines))
    } catch {
      /* cota cheia ou armazenamento bloqueado: segue em memória */
    }
  }, [lines])

  // outra aba alterou a sacola → sincroniza
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      skipWrite.current = true
      dispatch({ type: 'replace', lines: reconcileCart(parseStoredCart(e.newValue), catalogLookup) })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const actions = useMemo<CartActions>(
    () => ({
      add: (line, qty) => dispatch({ type: 'add', line, qty }),
      setQty: (key, qty) => dispatch({ type: 'setQty', key, qty }),
      remove: (key) => dispatch({ type: 'remove', key }),
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
    }),
    [],
  )

  const totals = useMemo(() => cartTotals(lines), [lines])
  const state = useMemo<CartState>(() => ({ lines, totals, open }), [lines, totals, open])

  return (
    <ActionsCtx value={actions}>
      <StateCtx value={state}>{children}</StateCtx>
    </ActionsCtx>
  )
}
