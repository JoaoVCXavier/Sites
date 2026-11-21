import { useLayoutEffect, useRef } from 'react'
import { gsap, prefersReducedMotion, ScrollTrigger } from '../lib/gsap'

/**
 * Faixa contínua com textos oficiais da marca. Velocidade base constante,
 * acelerada e invertida conforme a direção/velocidade da rolagem.
 */
export function Marquee({ items, className = '' }: { items: string[]; className?: string }) {
  const track = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = track.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const loop = gsap.to(el, { xPercent: -50, ease: 'none', duration: 28, repeat: -1 })
      let direction = 1
      const st = ScrollTrigger.create({
        onUpdate: (self) => {
          if (self.direction !== direction) direction = self.direction
          const boost = Math.min(Math.abs(self.getVelocity()) / 400, 4)
          gsap.to(loop, { timeScale: direction * (1 + boost), duration: 0.3, overwrite: true })
          gsap.to(loop, { timeScale: direction, duration: 1.2, delay: 0.3 })
        },
      })
      return () => st.kill()
    }, el)
    return () => ctx.revert()
  }, [])

  const row = (hidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((t, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6 sm:px-10">{t}</span>
          <span className="monogram h-[0.7em] opacity-70" aria-hidden="true" />
        </span>
      ))}
    </div>
  )

  return (
    <div className={`overflow-hidden ${className}`}>
      <div ref={track} className="flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </div>
  )
}
