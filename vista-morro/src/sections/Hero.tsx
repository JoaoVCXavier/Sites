import { useLayoutEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowDown } from 'lucide-react'
import { brand } from '../data/brand'
import { findModel } from '../data/catalog'
import { HangingGarment } from '../components/HangingGarment'
import { gsap, prefersReducedMotion } from '../lib/gsap'
import { easeOutExpo } from '../lib/ease'

const heroModel = findModel('do-morro')
// Foto oficial da VM Do Morro off-white (estampa monocromática) — contrasta com o fundo preto.
const heroImage = heroModel?.regular.images[3] ?? heroModel?.hero
/** ponto de fixação da corda, bem acima da peça: centro do pêndulo */
const PIVOT = '50% -45vh'

function Letters({ word, delay }: { word: string; delay: number }) {
  return (
    <span aria-hidden="true" className="flex overflow-hidden">
      {word.split('').map((ch, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ y: '105%' }}
          animate={{ y: '0%' }}
          transition={{ duration: 1.2, ease: easeOutExpo, delay: delay + i * 0.045 }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  )
}

export function Hero({ onExplore }: { onExplore: () => void }) {
  const root = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  // Saída por rolagem: as palavras se afastam, a peça sobe e o conteúdo escurece.
  useLayoutEffect(() => {
    if (prefersReducedMotion() || !root.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
      })
      tl.to('[data-hero="vista"]', { xPercent: -18, ease: 'none' }, 0)
        .to('[data-hero="morro"]', { xPercent: 18, ease: 'none' }, 0)
        .to('[data-hero="garment"]', { yPercent: -22, scale: 0.92, ease: 'none' }, 0)
        .to('[data-hero="fade"]', { opacity: 0, ease: 'none' }, 0)
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section
      id="topo"
      ref={root}
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ink pt-20 text-paper sm:pt-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: 'radial-gradient(70% 60% at 50% 42%, #262523 0%, #0e0e0d 60%, #080808 100%)' }}
      />
      <div aria-hidden="true" className="grain -z-10" />

      <div className="relative z-20 mx-auto flex w-full max-w-[1600px] items-start justify-between px-4 sm:px-8" data-hero="fade">
        <motion.p
          className="label text-smoke"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.9, ease: easeOutExpo }}
        >
          <span lang="en">{brand.descriptor}</span>
        </motion.p>
        <motion.p
          className="label hidden text-right text-smoke sm:block"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1, ease: easeOutExpo }}
        >
          Camisetas oversized
          <br />
          100% algodão
        </motion.p>
      </div>

      {/* Composição central: VISTA / peça pendurada / MORRO */}
      <div className="relative flex flex-1 flex-col justify-center gap-5 py-4 sm:gap-0 sm:py-6">
        <h1
          id="hero-title"
          // no celular a peça fica abaixo do título: as letras passam à frente da corda (sm+: a peça fica à frente)
          className="display relative z-20 mx-auto sm:z-0 flex w-full max-w-[1600px] flex-col px-3 text-[clamp(5.5rem,26vw,24rem)] leading-[0.8] sm:px-6"
        >
          <span className="sr-only">Vista Morro</span>
          <span data-hero="vista" className="self-start">
            <Letters word="VISTA" delay={0.15} />
          </span>
          <span data-hero="morro" className="self-end">
            <Letters word="MORRO" delay={0.35} />
          </span>
        </h1>

        {heroImage && (
          <div
            data-hero="garment"
            className="pointer-events-none relative z-10 mx-auto mt-2 w-[min(80vw,22rem)] sm:absolute sm:inset-x-0 sm:top-0 sm:mt-0 sm:w-[min(34vw,30rem)]"
          >
            {/*
              Entrada original recuperada (fe0451c): a peça desce do alto e balança numa mola pouco amortecida.
              O pivô agora fica no alto da corda (fora da tela), não na gola: a peça oscila como pêndulo
              e a corda acompanha sem "dobrar" no ponto de amarração.
            */}
            <motion.div
              style={{ transformOrigin: PIVOT }}
              initial={reduced ? false : { y: '-115%', rotate: -6 }}
              animate={{ y: '0%', rotate: 0 }}
              transition={{
                y: { duration: 1.4, ease: easeOutExpo, delay: 0.55 },
                rotate: { type: 'spring', stiffness: 38, damping: 3.2, mass: 1.1, delay: 0.9 },
              }}
            >
              <div style={{ transformOrigin: PIVOT }} className="motion-safe:animate-[vm-sway_8s_ease-in-out_infinite]">
                {/* espaço da corda acima da peça (a corda em si vem do HangingGarment e segue até o topo) */}
                <div aria-hidden="true" className="hidden h-[12vh] sm:block" />
                <HangingGarment
                  image={heroImage}
                  suspension="cord"
                  alt={`${heroModel?.fullName ?? 'Camiseta Vista Morro'} na cor off-white, suspensa por uma corda`}
                  sizes="(max-width: 640px) 60vw, 34vw"
                  priority
                />
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <div data-hero="fade">
      <motion.div
        className="mx-auto grid w-full max-w-[1600px] grid-cols-1 items-end gap-5 px-4 pb-6 sm:grid-cols-2 sm:gap-6 sm:px-8 sm:pb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.25, ease: easeOutExpo }}
      >
        <p className="editorial text-[clamp(1.75rem,3.4vw,3rem)] leading-none">{brand.signature}</p>

        <div className="sm:justify-self-end">
          <button
            type="button"
            onClick={onExplore}
            className="group label inline-flex h-14 items-center gap-4 whitespace-nowrap rounded-full bg-paper pr-2 pl-6 text-ink transition-transform duration-500 hover:scale-[1.03] active:scale-[0.98]"
          >
            Ver a arara
            <span className="grid size-10 place-items-center rounded-full bg-ink text-paper transition-transform duration-500 group-hover:rotate-[-45deg]">
              <ArrowDown className="size-4" aria-hidden="true" />
            </span>
          </button>
        </div>
      </motion.div>
      </div>
    </section>
  )
}
