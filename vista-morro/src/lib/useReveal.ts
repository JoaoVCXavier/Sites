import { useLayoutEffect, useRef } from 'react'
import { gsap, prefersReducedMotion, ScrollTrigger } from './gsap'

/**
 * Revela, em lote e com escalonamento, os elementos `[data-reveal]` dentro da seção
 * conforme entram na viewport. Sem animação quando o usuário prefere movimento reduzido.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    const root = ref.current
    if (!root || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const els = gsap.utils.toArray<HTMLElement>('[data-reveal]', root)
      gsap.set(els, { y: 48, opacity: 0 })
      const show = (batch: Element[]) =>
        gsap.to(batch, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.09, overwrite: true })
      // onLeave/onEnterBack: cobre a página carregada já rolada além da seção (âncora, restauração de rolagem).
      ScrollTrigger.batch(els, { start: 'top 90%', onEnter: show, onLeave: show, onEnterBack: show })
    }, root)
    return () => ctx.revert()
  }, [])
  return ref
}
