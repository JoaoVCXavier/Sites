import { useLayoutEffect, useRef } from 'react'
import { brand } from '../data/brand'
import { SectionLabel } from '../components/SectionLabel'
import { gsap, prefersReducedMotion } from '../lib/gsap'
import { useReveal } from '../lib/useReveal'

/** Sobre a marca — apenas informações publicadas pela Vista Morro (ver src/data/brand.ts). */
export function About() {
  const sectionRef = useReveal<HTMLElement>()
  const statementRef = useRef<HTMLParagraphElement>(null)

  // A declaração oficial "acende" palavra por palavra conforme a rolagem.
  useLayoutEffect(() => {
    const el = statementRef.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('[data-word]'),
        { opacity: 0.32 },
        {
          opacity: 1,
          stagger: 0.08,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section id="sobre" ref={sectionRef} aria-labelledby="sobre-title" className="relative overflow-hidden bg-paper py-24 text-ink sm:py-36">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
        <div className="flex items-start justify-between gap-6">
          <SectionLabel index="04" className="text-ash">
            Sobre a marca
          </SectionLabel>
          <span className="monogram h-16 text-ink sm:h-24" aria-hidden="true" />
        </div>

        <h2 id="sobre-title" className="display mt-10 text-[clamp(4rem,16vw,15rem)]" data-reveal>
          {brand.signature.replace('.', '')}
          <span className="text-ash">.</span>
        </h2>

        <div className="mt-16 grid gap-16 lg:mt-24 lg:grid-cols-[1.4fr_1fr] lg:gap-24">
          <p ref={statementRef} className="editorial text-[clamp(2rem,4.4vw,4rem)] leading-[1.05]">
            <span className="sr-only">{brand.statement}</span>
            <span aria-hidden="true">
              {brand.statement.split(' ').map((w, i) => (
                <span key={i} data-word className="inline-block pr-[0.25em]">
                  {w}
                </span>
              ))}
            </span>
          </p>

          <div className="flex flex-col gap-10">
            <dl className="divide-y divide-line-ink border-y border-line-ink" data-reveal>
              {brand.craft.map((c) => (
                <div key={c.label} className="flex items-baseline justify-between gap-6 py-4">
                  <dt className="label text-ash">{c.label}</dt>
                  <dd className="text-right text-lg">{c.value}</dd>
                </div>
              ))}
            </dl>
            <p className="label text-ash" data-reveal>
              Fonte: descrições oficiais do catálogo Vista Morro.
            </p>
          </div>
        </div>

        <figure className="mt-24 border-t border-line-ink pt-10 sm:mt-36" data-reveal>
          <blockquote className="display text-[clamp(2.75rem,9vw,8.5rem)]">
            “{brand.printQuote.text}”
          </blockquote>
          <figcaption className="label mt-6 text-ash">— {brand.printQuote.source}</figcaption>
        </figure>
      </div>
    </section>
  )
}
