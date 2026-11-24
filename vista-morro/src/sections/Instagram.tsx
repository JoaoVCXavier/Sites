import { useLayoutEffect, useRef } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { brand } from '../data/brand'
import { asset, findModel, srcAtLeast, srcSet } from '../data/catalog'
import type { Model, ProductImage } from '../data/types'
import { InstagramIcon } from '../components/SocialIcons'
import { gsap, prefersReducedMotion } from '../lib/gsap'

/*
 * Colagem com fotos OFICIAIS das peças (as mesmas do catálogo da marca), no formato retrato do feed.
 * Não são publicações do Instagram e não imitam a interface dele: sem curtidas, comentários ou contadores.
 * `speed` define o parallax de cada foto (camadas mais próximas andam mais).
 */
const TILES: {
  slug: string
  image: number
  panel: string
  place: string
  aspect: string
  tilt: number
  speed: number
}[] = [
  {
    slug: 'do-morro',
    image: 0,
    panel: '#d9d5cc',
    place: 'left-[30%] top-0 w-[60%] z-[1]',
    aspect: 'aspect-[4/5]',
    tilt: 0,
    speed: -6,
  },
  {
    slug: 'kiss-me',
    image: 2,
    panel: '#1b1b1a',
    place: 'left-0 top-[36%] w-[46%] z-[2]',
    aspect: 'aspect-[4/5]',
    tilt: -3,
    speed: 10,
  },
  {
    slug: 'stamp',
    image: 3,
    panel: '#bdb8ae',
    place: 'left-[58%] top-[58%] w-[40%] z-[3]',
    aspect: 'aspect-square',
    tilt: 3.5,
    speed: 18,
  },
]

const shots = TILES.flatMap((t) => {
  const model = findModel(t.slug)
  const image = model?.regular.images[t.image] ?? model?.hero
  return model && image ? [{ ...t, model, image }] : []
})

export function Instagram() {
  const root = useRef<HTMLElement>(null)
  const { instagram } = brand.links

  useLayoutEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      // tipografia: cada linha sobe de dentro da sua máscara
      gsap.from('[data-ig-line]', {
        yPercent: 105,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 72%', once: true },
      })
      gsap.from('[data-ig-in]', {
        y: 24,
        opacity: 0,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.07,
        delay: 0.25,
        scrollTrigger: { trigger: el, start: 'top 72%', once: true },
      })
      // fotos: revelação de baixo para cima, em sequência
      gsap.utils.toArray<HTMLElement>('[data-ig-tile]').forEach((tile, i) => {
        gsap.fromTo(
          tile,
          { clipPath: 'inset(100% 0% 0% 0%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.3,
            ease: 'expo.out',
            delay: 0.15 + i * 0.12,
            clearProps: 'clipPath',
            scrollTrigger: { trigger: el, start: 'top 68%', once: true },
          },
        )
      })
      // parallax sutil + leve giro conforme a rolagem (camadas em velocidades diferentes)
      gsap.utils.toArray<HTMLElement>('[data-ig-layer]').forEach((layer) => {
        const speed = Number(layer.dataset.speed ?? 0)
        gsap.fromTo(
          layer,
          { yPercent: speed * 0.5, rotate: -speed * 0.04 },
          {
            yPercent: -speed * 0.5,
            rotate: speed * 0.04,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
          },
        )
      })
      gsap.fromTo(
        '[data-ig-glyph]',
        { rotate: -8, yPercent: 10 },
        {
          rotate: 6,
          yPercent: -10,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section
      id="instagram"
      ref={root}
      aria-labelledby="instagram-title"
      className="relative isolate overflow-hidden bg-ink pt-24 pb-0 text-paper sm:pt-36"
    >
      <div aria-hidden="true" className="grain -z-10" />

      <div className="mx-auto grid max-w-[1600px] items-center gap-14 px-4 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
        {/* Texto */}
        <div className="relative z-10">
          <h2 id="instagram-title" className="display text-[clamp(3.5rem,8.4vw,7.5rem)] leading-[0.86]">
            {['A rua', 'também é', 'digital.'].map((line) => (
              <span key={line} className="block overflow-hidden pb-[0.04em]">
                <span data-ig-line className="block">
                  {line}
                </span>
              </span>
            ))}
          </h2>

          <p className="mt-8 max-w-[40ch] text-lg leading-relaxed text-paper/75" data-ig-in>
            Siga a Vista Morro no Instagram e acompanhe os lançamentos, as novidades e tudo que faz parte da nossa
            identidade.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4" data-ig-in>
            <a
              href={instagram.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group press inline-flex h-14 items-center gap-3 rounded-full bg-paper pr-6 pl-2 text-ink hover:bg-white"
            >
              <span className="grid size-10 place-items-center rounded-full bg-ink text-paper transition-transform duration-300 ease-[var(--ease-out)] group-hover:scale-110 group-hover:-rotate-12">
                <InstagramIcon className="size-5" />
              </span>
              <span className="label">Seguir no Instagram</span>
              <ArrowUpRight
                className="size-4 transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
              <span className="sr-only">(abre em nova aba)</span>
            </a>
            <p className="editorial text-2xl text-paper/90">{instagram.handle}</p>
          </div>
        </div>

        {/* Colagem */}
        <div className="relative mx-auto aspect-[1/1.08] w-full max-w-[40rem] lg:max-w-none">
          <span
            data-ig-glyph
            aria-hidden="true"
            className="pointer-events-none absolute -top-[6%] -left-[10%] w-[52%] text-paper/[0.06]"
          >
            <InstagramIcon className="h-auto w-full" strokeWidth={1.1} />
          </span>

          {shots.map((s) => (
            <figure key={s.slug} className={`absolute ${s.place}`} data-ig-layer data-speed={s.speed}>
              <div style={{ rotate: `${s.tilt}deg` }}>
                <Tile model={s.model} image={s.image} panel={s.panel} aspect={s.aspect} />
              </div>
            </figure>
          ))}
        </div>
      </div>

      <p className="mx-auto mt-4 max-w-[1600px] px-4 text-xs text-smoke sm:mt-10 sm:px-8 lg:mt-4 lg:text-right">
        Na colagem: fotos oficiais das camisetas {shots.map((s) => s.model.name).join(', ')}.
      </p>
    </section>
  )
}

function Tile({ model, image, panel, aspect }: { model: Model; image: ProductImage; panel: string; aspect: string }) {
  return (
    <div
      data-ig-tile
      className={`group relative overflow-hidden rounded-sm shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] ring-1 ring-line ${aspect}`}
      style={{ backgroundColor: panel }}
    >
      <img
        src={asset(srcAtLeast(image, 720))}
        srcSet={srcSet(image)}
        sizes="(max-width: 1024px) 60vw, 30vw"
        width={image.width}
        height={image.height}
        alt={`${model.fullName}, foto oficial`}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 m-auto h-[80%] w-[86%] object-contain transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
      />
    </div>
  )
}
