import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/*
 * As posições dos gatilhos dependem da altura final do documento, que muda quando as
 * fontes e imagens carregam. Recalcula (com debounce) sempre que a altura do <body> mudar.
 */
if (typeof window !== 'undefined') {
  let t: number | undefined
  const refresh = () => {
    window.clearTimeout(t)
    t = window.setTimeout(() => ScrollTrigger.refresh(), 120)
  }
  document.fonts?.ready.then(refresh)
  let lastH = 0
  new ResizeObserver(([entry]) => {
    const h = Math.round(entry.contentRect.height)
    if (Math.abs(h - lastH) > 2) {
      lastH = h
      refresh()
    }
  }).observe(document.body)
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export { gsap, ScrollTrigger }
