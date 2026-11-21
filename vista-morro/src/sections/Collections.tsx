import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { collections, findModel, models } from '../data/catalog'
import type { CollectionId } from '../data/types'
import { HangingGarment } from '../components/HangingGarment'
import { SectionLabel } from '../components/SectionLabel'
import { useReveal } from '../lib/useReveal'
import { easeOutExpo } from '../lib/ease'

export function Collections({ onExplore }: { onExplore: (id: CollectionId) => void }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const sectionRef = useReveal<HTMLElement>()

  // Prévia flutuante que segue o cursor (apenas dispositivos com mouse)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 180, damping: 22 })
  const y = useSpring(my, { stiffness: 180, damping: 22 })

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const r = listRef.current?.getBoundingClientRect()
    if (!r) return
    mx.set(e.clientX - r.left)
    my.set(e.clientY - r.top)
  }

  const preview = collections.find((c) => c.id === hovered)
  const previewModel = preview ? findModel(preview.cover) : null

  return (
    <section
      id="colecoes"
      ref={sectionRef}
      aria-labelledby="colecoes-title"
      className="relative bg-paper py-24 text-ink sm:py-36"
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,28rem)] lg:items-end">
          <div>
            <SectionLabel index="02" className="text-ash">
              Categorias do catálogo
            </SectionLabel>
            <h2 id="colecoes-title" className="display mt-4 text-[clamp(3.5rem,11vw,9.5rem)]" data-reveal>
              Coleções
            </h2>
          </div>
          <p className="editorial text-2xl leading-snug text-ink/80 sm:text-3xl" data-reveal>
            {models.length} modelos publicados no catálogo oficial. Escolha uma coleção para vê-la na arara.
          </p>
        </div>

        <ul
          ref={listRef}
          className="relative mt-16 border-t border-line-ink sm:mt-24"
          onPointerMove={onMove}
          onPointerLeave={() => setHovered(null)}
        >
          {collections.map((c, i) => {
            const list = models.filter(c.filter)
            return (
              <li key={c.id} className="border-b border-line-ink" data-reveal>
                <button
                  type="button"
                  onClick={() => onExplore(c.id)}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(c.id)}
                  onFocus={() => setHovered(c.id)}
                  onBlur={() => setHovered(null)}
                  className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-3 py-8 text-left sm:gap-x-10 sm:py-12 lg:grid-cols-[6rem_1fr_minmax(0,22rem)_auto]"
                  aria-label={`Explorar ${c.title} na vitrine — ${list.length} modelos`}
                >
                  <span className="label self-start pt-2 text-ash tabular-nums sm:pt-4">0{i + 1}</span>
                  <span className="display text-[clamp(3rem,9vw,8rem)] transition-[font-stretch,letter-spacing] duration-700 ease-[var(--ease-out-expo)] group-hover:tracking-[0.01em] [font-stretch:62%] group-hover:[font-stretch:80%]">
                    {c.title}
                  </span>
                  <span className="col-span-3 col-start-1 flex flex-col gap-2 text-ink/75 sm:col-start-2 lg:col-span-1 lg:col-start-3">
                    <span className="label text-ash">
                      {c.kicker} · {list.length} modelos
                    </span>
                    <span className="text-base leading-relaxed">{c.description}</span>
                    <span className="text-sm text-ash">{list.map((m) => m.name).join(' · ')}</span>
                  </span>
                  <span className="col-start-3 row-start-1 grid size-12 place-items-center rounded-full border border-line-ink transition-all duration-500 group-hover:bg-ink group-hover:text-paper sm:size-16 lg:col-start-4">
                    <ArrowUpRight className="size-5 transition-transform duration-500 group-hover:rotate-45" aria-hidden="true" />
                  </span>
                </button>

                {/* Prévia em linha para toque / telas pequenas */}
                <div className="-mt-2 flex gap-3 overflow-x-auto pb-8 no-scrollbar lg:hidden" aria-hidden="true">
                  {list.map((m) => (
                    <div key={m.slug} className="w-24 shrink-0 rounded-sm bg-paper-2 p-2">
                      <img
                        src={`${import.meta.env.BASE_URL}${m.hero.srcset['480']}`}
                        alt=""
                        width={m.hero.width}
                        height={m.hero.height}
                        loading="lazy"
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </li>
            )
          })}

          <AnimatePresence>
            {previewModel && (
              <motion.div
                key="preview"
                aria-hidden="true"
                className="pointer-events-none absolute top-0 left-0 z-10 hidden w-64 lg:block xl:w-72"
                style={{ x, y, translateX: '-50%', translateY: '-30%' }}
                initial={{ opacity: 0, scale: 0.8, rotate: -6 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 6 }}
                transition={{ duration: 0.5, ease: easeOutExpo }}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={previewModel.slug}
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    transition={{ duration: 0.45, ease: easeOutExpo }}
                  >
                    <HangingGarment image={previewModel.hero} alt="" sizes="288px" />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </ul>
      </div>
    </section>
  )
}
