import { useEffect, type RefObject } from 'react'

/*
 * Trava de rolagem com contagem: dois modais podem coexistir por alguns instantes
 * (ex.: o painel da peça saindo enquanto a sacola entra). Só destrava quando o último fecha.
 */
let locks = 0
let saved = ''

function lockScroll() {
  if (locks++ === 0) {
    saved = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
  }
}

function unlockScroll() {
  locks = Math.max(0, locks - 1)
  if (locks === 0) document.documentElement.style.overflow = saved
}

/**
 * `<dialog>` nativo como modal: abre com showModal (foco preso, Esc, fundo inerte),
 * trava a rolagem e, ao fechar, devolve o foco a quem abriu — a menos que outro modal
 * ainda esteja aberto (aí o foco fica com ele).
 */
export function useModalDialog(
  dialogRef: RefObject<HTMLDialogElement | null>,
  initialFocusRef?: RefObject<HTMLElement | null>,
  fallbackFocusId?: string,
) {
  useEffect(() => {
    const dialog = dialogRef.current
    const previous = document.activeElement as HTMLElement | null
    dialog?.showModal()
    initialFocusRef?.current?.focus()
    lockScroll()
    return () => {
      unlockScroll()
      if (dialog?.open) dialog.close()
      const otherOpen = [...document.querySelectorAll('dialog[open]')].some((d) => d !== dialog)
      if (otherOpen) return
      if (previous?.isConnected && previous !== document.body) previous.focus({ preventScroll: true })
      else if (fallbackFocusId) document.getElementById(fallbackFocusId)?.focus({ preventScroll: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- executa uma vez por abertura
  }, [])
}
