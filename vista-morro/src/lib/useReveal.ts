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
      ScrollTrigger.batch(els, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.09, overwrite: true }),
      })
    }, root)
    return () => ctx.revert()
  }, [])
  return ref
}
