import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Maximize2, X } from 'lucide-react'
import { asset, findModel, srcSet } from '../data/catalog'
import type { Model, ProductImage } from '../data/types'
import { SectionLabel } from '../components/SectionLabel'
import { gsap, prefersReducedMotion, ScrollTrigger } from '../lib/gsap'
import { easeOutExpo } from '../lib/ease'

/**
 * Curadoria do lookbook: fotos oficiais do catálogo em composição editorial.
 * `detail` aproxima a câmera de uma área da mesma foto (recorte, sem alterar a peça).
 */
const TILES: {
  slug: string
  image: number
  panel: string
  layout: string
  aspect: string
  detail?: { scale: number; origin: string }
}[] = [
  { slug: 'do-morro', image: 1, panel: '#d9d5cc', layout: 'lg:col-span-7 lg:row-span-2', aspect: 'aspect-[4/5]' },
  { slug: 'kiss-me', image: 2, panel: '#1b1b1a', layout: 'lg:col-span-5 lg:mt-24', aspect: 'aspect-square' },
  {
    slug: 'stamp',
    image: 1,
    panel: '#e9e6df',
    layout: 'lg:col-span-5',
    aspect: 'aspect-[5/4]',
    detail: { scale: 2.1, origin: '50% 46%' },
  },
  { slug: 'angel', image: 0, panel: '#121211', layout: 'lg:col-span-4', aspect: 'aspect-[3/4]' },
  {
    slug: 'riqueza',
    image: 1,
    panel: '#cfcac0',
    layout: 'lg:col-span-4 lg:mt-20',
    aspect: 'aspect-[3/4]',
    detail: { scale: 1.75, origin: '50% 38%' },
  },
  { slug: 'urban', image: 0, panel: '#e9e6df', layout: 'lg:col-span-4', aspect: 'aspect-[3/4]' },
  {
    slug: 'authentic',
    image: 1,
    panel: '#bdb8ae',
    layout: 'lg:col-span-6',
    aspect: 'aspect-[16/11]',
    detail: { scale: 1.9, origin: '18% 40%' },
  },
  { slug: 'money-run', image: 0, panel: '#1b1b1a', layout: 'lg:col-span-6 lg:mt-16', aspect: 'aspect-[16/11]' },
]

interface Shot {
  model: Model
  image: ProductImage
  tile: (typeof TILES)[number]
}

const shots: Shot[] = TILES.flatMap((tile) => {
  const model = findModel(tile.slug)
  const image = model?.regular.images[tile.image] ?? model?.hero
  return model && image ? [{ model, image, tile }] : []
})

export function Lookbook() {
  const root = useRef<HTMLElement>(null)
  const [open, setOpen] = useState<number | null>(null)

  useLayoutEffect(() => {
    if (!root.current || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-tile]').forEach((tile) => {
        const media = tile.querySelector('[data-parallax]')
        const reveal = gsap.fromTo(
          tile,
          { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out', paused: true, clearProps: 'clipPath' },
        )
        const play = () => reveal.play()
        ScrollTrigger.create({ trigger: tile, start: 'top 88%', onEnter: play, onLeave: play, onEnterBack: play })
        if (media)
          gsap.fromTo(
            media,
            { yPercent: -7 },
            { yPercent: 7, ease: 'none', scrollTrigger: { trigger: tile, start: 'top bottom', end: 'bottom top', scrub: true } },
          )
      })
      gsap.fromTo(
        '[data-lookbook-title]',
        { xPercent: 6 },
        { xPercent: -6, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } },
      )
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="lookbook" ref={root} aria-labelledby="lookbook-title" className="relative overflow-hidden bg-ink py-24 text-paper sm:py-36">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
        <SectionLabel index="03" className="text-smoke">
          Fotos oficiais
        </SectionLabel>
        <h2
          id="lookbook-title"
          data-lookbook-title
          className="display mt-4 text-[clamp(4rem,17vw,16rem)] whitespace-nowrap"
        >
          Lookbook
        </h2>
        <div className="mt-6 grid gap-6 sm:mt-10 lg:grid-cols-2">
          <p className="editorial max-w-xl text-2xl leading-snug text-paper/85 sm:text-3xl">
            As peças em detalhe — estampas, cores e acabamentos, a partir das fotos oficiais do catálogo.
          </p>
        </div>

        <ul className="mt-16 grid grid-cols-2 gap-3 sm:gap-5 lg:mt-24 lg:grid-cols-12 lg:gap-6">
          {shots.map((shot, i) => (
            <li key={shot.tile.slug} className={`${i % 3 === 0 ? 'col-span-2' : 'col-span-1'} ${shot.tile.layout}`}>
              <figure>
                <button
                  type="button"
                  data-tile
                  onClick={() => setOpen(i)}
                  className={`group relative block w-full overflow-hidden rounded-sm ${shot.tile.aspect} ${
                    i === 0 ? 'lg:aspect-auto lg:h-full lg:min-h-[44rem]' : ''
                  }`}
                  style={{ backgroundColor: shot.tile.panel }}
                  aria-label={`Ampliar foto: ${shot.model.fullName}${shot.tile.detail ? ' (detalhe)' : ''}`}
                >
                  <div data-parallax className="absolute -inset-y-[8%] inset-x-0">
                    <img
                      src={asset(shot.image.srcset['960'])}
                      srcSet={srcSet(shot.image)}
                      sizes="(max-width: 1024px) 50vw, 40vw"
                      width={shot.image.width}
                      height={shot.image.height}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 m-auto h-[78%] w-[82%] object-contain transition-transform duration-[1.4s] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                      style={
                        shot.tile.detail
                          ? { transform: `scale(${shot.tile.detail.scale})`, transformOrigin: shot.tile.detail.origin }
                          : undefined
                      }
                    />
                  </div>
                  <span className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-paper/90 text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Maximize2 className="size-4" aria-hidden="true" />
                  </span>
                </button>
                <figcaption className="label mt-3 flex items-baseline justify-between gap-3 text-smoke">
                  <span>
                    <span className="text-paper">{shot.model.fullName.replace(/^Camiseta\s+/i, '')}</span>
                    {shot.tile.detail && ' · detalhe'}
                  </span>
                  <span className="tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>

      <AnimatePresence>
        {open !== null && <Lightbox index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </section>
  )
}

function Lightbox({ index, onIndex, onClose }: { index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const shot = shots[index]
  const go = useCallback((d: number) => onIndex((index + d + shots.length) % shots.length), [index, onIndex])

  useEffect(() => {
    const dialog = ref.current
    const previous = document.activeElement as HTMLElement | null
    dialog?.showModal()
    closeRef.current?.focus()
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
      if (dialog?.open) dialog.close()
      previous?.focus({ preventScroll: true })
    }
  }, [])

  return (
    <dialog
      ref={ref}
      aria-label={`Lookbook — ${shot.model.fullName}`}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1)
        if (e.key === 'ArrowLeft') go(-1)
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 text-paper"
    >
      <motion.div
        className="absolute inset-0 bg-ink"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 flex flex-col p-4 sm:p-8">
        <div className="pointer-events-auto flex items-center justify-between">
          <p className="label">
            {String(index + 1).padStart(2, '0')} / {String(shots.length).padStart(2, '0')} —{' '}
            <span className="text-smoke">{shot.model.fullName}</span>
          </p>
          <button
            type="button"
            ref={closeRef}
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-12 place-items-center rounded-full bg-paper text-ink transition hover:rotate-90"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="relative flex-1">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.img
              key={shot.image.id}
              src={asset(shot.image.srcset['960'])}
              srcSet={srcSet(shot.image)}
              sizes="90vw"
              width={shot.image.width}
              height={shot.image.height}
              alt={`${shot.model.fullName} — foto oficial`}
              className="absolute inset-0 m-auto max-h-[86%] w-auto max-w-[92%] object-contain"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.03 }}
              transition={{ duration: 0.6, ease: easeOutExpo }}
            />
          </AnimatePresence>
        </div>

        <div className="pointer-events-auto flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Foto anterior"
            className="grid size-12 place-items-center rounded-full border border-line transition hover:border-paper"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Próxima foto"
            className="grid size-12 place-items-center rounded-full border border-line transition hover:border-paper"
          >
            <ArrowRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </dialog>
  )
}
