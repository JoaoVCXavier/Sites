import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
  type AnimationPlaybackControls,
  type MotionValue,
} from 'motion/react'
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react'
import { collections, modelsFor } from '../data/catalog'
import type { CollectionId, Model } from '../data/types'
import { HangingGarment } from '../components/HangingGarment'
import { SectionLabel } from '../components/SectionLabel'
import { easeOutExpo } from '../lib/ease'

interface ShowcaseProps {
  filter: CollectionId
  onFilter: (id: CollectionId) => void
  onOpen: (model: Model, preferPlus: boolean) => void
}

const FILTERS: { id: CollectionId; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  ...collections.map((c) => ({ id: c.id, label: c.title })),
]

export function Showcase({ filter, onFilter, onOpen }: ShowcaseProps) {
  const items = useMemo(() => modelsFor(filter), [filter])

  return (
    <section
      id="vitrine"
      aria-labelledby="vitrine-title"
      className="relative isolate overflow-hidden bg-ink pt-20 pb-14 text-paper sm:pt-24 sm:pb-20"
    >
      {/* luz de vitrine */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 55% at 50% 38%, #3b3a37 0%, #1d1c1b 48%, #080808 100%), #080808',
        }}
      />
      <div aria-hidden="true" className="grain -z-10" />

      <div className="mx-auto flex max-w-[1600px] flex-col gap-8 px-4 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <SectionLabel index="01">Vitrine</SectionLabel>
          <h2 id="vitrine-title" className="display mt-4 text-[clamp(3.25rem,8vw,7rem)]">
            A arara
          </h2>
        </div>

        <div className="flex flex-col gap-4 lg:items-end">
          <div role="group" aria-label="Filtrar peças por coleção" className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const pressed = filter === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => onFilter(f.id)}
                  className={`label min-h-11 rounded-full border px-4 transition-colors duration-300 ${
                    pressed
                      ? 'border-paper bg-paper text-ink'
                      : 'border-line text-paper/80 hover:border-paper/60 hover:text-paper'
                  }`}
                >
                  {f.label}
                  <span className="ml-2 opacity-60">{modelsFor(f.id).length}</span>
                </button>
              )
            })}
          </div>
          <p className="label text-smoke">
            <span className="pointer-coarse:hidden">Arraste, clique ou use as setas do teclado</span>
            <span className="hidden pointer-coarse:inline">Deslize para os lados · toque para ver detalhes</span>
          </p>
        </div>
      </div>

      {/* `key` reinicia a arara (posição e animação de entrada) ao trocar de coleção */}
      {items.length > 0 ? (
        <Rail key={filter} items={items} preferPlus={filter === 'plus-size'} onOpen={onOpen} />
      ) : (
        <p className="editorial mx-auto mt-16 max-w-[1600px] px-4 text-3xl text-smoke sm:px-8">
          Nenhuma peça publicada nesta coleção no momento.
        </p>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------------------------------ */

interface Metrics {
  width: number
  height: number
  itemW: number
  spacing: number
  compact: boolean
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** altura da peça pendurada ÷ largura (cabide + foto oficial ≈ 1.3:1) */
const GARMENT_RATIO = 0.98

/** Distribuição em profundidade: centro em destaque, laterais menores e mais distantes. */
function layout(d: number, m: Metrics) {
  const a = Math.abs(d)
  const reach = a <= 1 ? a : 1 + (a - 1) * (m.compact ? 0.5 : 0.66)
  return {
    x: Math.sign(d) * reach * m.spacing,
    scale: a <= 1 ? 1 - 0.3 * a : Math.max(0.42, 0.7 - (a - 1) * 0.12),
    opacity: a <= 1 ? 1 - 0.22 * a : Math.max(0, 0.78 - (a - 1) * 0.3),
  }
}

function Rail({
  items,
  preferPlus,
  onOpen,
}: {
  items: Model[]
  preferPlus: boolean
  onOpen: ShowcaseProps['onOpen']
}) {
  const n = items.length
  const initial = Math.floor((n - 1) / 2)
  const reduced = useReducedMotion()

  const pos = useMotionValue(initial)
  const [active, setActive] = useState(initial)
  const activeRef = useRef(initial)
  const stageRef = useRef<HTMLDivElement>(null)
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([])
  const anim = useRef<AnimationPlaybackControls | null>(null)
  const [m, setM] = useState<Metrics>({ width: 1200, height: 432, itemW: 400, spacing: 300, compact: false })

  // Medidas responsivas da arara
  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    // A largura da peça vem da largura do palco (limitada pela altura da janela);
    // a altura do palco deriva da peça — sem faixa vazia abaixo dela.
    const measure = () => {
      const width = el.getBoundingClientRect().width
      const vh = document.documentElement.clientHeight
      const compact = width < 640
      const byWidth = compact ? width * 0.68 : width < 1024 ? width * 0.42 : width * 0.32
      const byHeight = (Math.min(vh * 0.6, 660) - 40) / GARMENT_RATIO
      const itemW = Math.round(clamp(Math.min(byWidth, byHeight), 150, 560))
      setM({
        width,
        itemW,
        height: Math.round(itemW * GARMENT_RATIO + 40),
        spacing: itemW * (compact ? 0.7 : 0.8),
        compact,
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    // altura da janela: só reage a mudanças grandes (evita saltos com a barra de endereço do celular)
    let lastVh = document.documentElement.clientHeight
    const onResize = () => {
      const vh = document.documentElement.clientHeight
      if (Math.abs(vh - lastVh) > 120) {
        lastVh = vh
        measure()
      }
    }
    window.addEventListener('resize', onResize)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [])

  useMotionValueEvent(pos, 'change', (v) => {
    const r = clamp(Math.round(v), 0, n - 1)
    if (r !== activeRef.current) {
      activeRef.current = r
      setActive(r)
    }
  })

  const goTo = useCallback(
    (i: number) => {
      const target = clamp(i, 0, n - 1)
      anim.current?.stop()
      anim.current = animate(pos, target, reduced
        ? { duration: 0 }
        : { type: 'spring', stiffness: 170, damping: 26, mass: 1 })
    },
    [n, pos, reduced],
  )

  // Balanço das peças: derivado da velocidade da arara, com mola pouco amortecida (pêndulo).
  const velocity = useVelocity(pos)
  const swingTarget = useTransform(velocity, (v) => (reduced ? 0 : clamp(-v * 4.2, -11, 11)))
  const swing = useSpring(swingTarget, { stiffness: 70, damping: 5.5, mass: 0.9 })

  /* ---------- arrastar / swipe ---------- */
  const drag = useRef<{ id: number; x0: number; p0: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    anim.current?.stop()
    drag.current = { id: e.pointerId, x0: e.clientX, p0: pos.get(), moved: false }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x0
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true
      stageRef.current?.setPointerCapture(e.pointerId)
    }
    if (!d.moved) return
    let p = d.p0 - dx / m.spacing
    if (p < 0) p *= 0.35
    if (p > n - 1) p = n - 1 + (p - (n - 1)) * 0.35
    pos.set(p)
  }

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    if (!d.moved) return
    suppressClick.current = true
    requestAnimationFrame(() => (suppressClick.current = false))
    const projected = pos.get() + clamp(pos.getVelocity(), -12, 12) * 0.14
    goTo(Math.round(projected))
  }

  // Trackpad horizontal
  const wheelTimer = useRef<number | undefined>(undefined)
  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 1) return
    anim.current?.stop()
    pos.set(clamp(pos.get() + e.deltaX / m.spacing, -0.4, n - 0.6))
    window.clearTimeout(wheelTimer.current)
    wheelTimer.current = window.setTimeout(() => goTo(Math.round(pos.get())), 110)
  }
  useEffect(() => () => window.clearTimeout(wheelTimer.current), [])

  /* ---------- teclado ---------- */
  const focusAfterMove = useRef(false)
  const onKeyDown = (e: React.KeyboardEvent) => {
    const map: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: n - 1,
    }
    if (e.key in map) {
      e.preventDefault()
      focusAfterMove.current = true
      goTo(map[e.key])
    }
  }
  useEffect(() => {
    if (focusAfterMove.current) {
      buttonsRef.current[active]?.focus({ preventScroll: true })
      focusAfterMove.current = false
    }
  }, [active])

  const current = items[active]
  const open = () => current && onOpen(current, preferPlus)

  return (
    <div className="relative mt-6 sm:mt-8">
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {current ? `${current.fullName}, ${active + 1} de ${n}` : ''}
      </p>

      {/* Palco da arara. Teclado: as teclas chegam por bubbling dos botões (tabindex rotativo). */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={stageRef}
        role="group"
        aria-roledescription="arara de roupas"
        aria-label="Peças da Vista Morro"
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheel}
        style={{ height: m.height }}
        className="relative cursor-grab touch-pan-y overscroll-x-contain select-none active:cursor-grabbing"
      >
        {/* barra metálica */}
        <div
          aria-hidden="true"
          className="absolute top-3 right-0 left-0 h-[3px] bg-gradient-to-b from-[#d9d7d1] via-[#8a8884] to-[#3a3937] shadow-[0_6px_14px_rgba(0,0,0,0.6)]"
        />
        {items.map((model, i) => (
          <RailItem
            key={model.slug}
            model={model}
            index={i}
            initial={initial}
            pos={pos}
            swing={swing}
            metrics={m}
            isActive={i === active}
            buttonRef={(el) => (buttonsRef.current[i] = el)}
            onSelect={() => {
              if (suppressClick.current) return
              if (i === activeRef.current) open()
              else goTo(i)
            }}
          />
        ))}
      </div>

      {/* Peça selecionada */}
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 items-end gap-6 px-4 sm:px-8 md:grid-cols-[1fr_auto] lg:grid-cols-[minmax(0,14rem)_1fr_auto]">
        <div className="label flex items-center gap-3 text-smoke lg:flex-col lg:items-start lg:gap-1">
          <span className="tabular-nums text-paper">
            N° {String(active + 1).padStart(2, '0')}
            <span className="text-smoke"> / {String(n).padStart(2, '0')}</span>
          </span>
          {current?.category && <span>{current.category}</span>}
          {current?.plus && (
            <span className="inline-flex items-center gap-1">
              <Plus className="size-3" aria-hidden="true" /> Plus Size
            </span>
          )}
        </div>

        <div className="relative min-h-[1em] overflow-hidden text-[clamp(2.75rem,8vw,7rem)] leading-none md:col-start-1 lg:col-start-2 lg:text-[clamp(2.75rem,6.5vw,7rem)] xl:text-[clamp(2.75rem,8vw,7rem)]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.h3
              key={current?.slug}
              className="display block whitespace-nowrap"
              initial={{ y: '100%' }}
              animate={{ y: '0%' }}
              exit={{ y: '-100%' }}
              transition={{ duration: 0.7, ease: easeOutExpo }}
            >
              <span className="sr-only">{current?.fullName}</span>
              <span aria-hidden="true">
                <span className="mr-[0.18em] text-smoke">VM</span>
                {current?.name}
              </span>
            </motion.h3>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 md:row-start-1 md:col-start-2 md:row-span-2 md:self-end lg:col-start-3 lg:row-span-1">
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
            aria-label="Peça anterior"
            className="grid size-12 place-items-center rounded-full border border-line transition hover:border-paper disabled:opacity-30"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            disabled={active === n - 1}
            aria-label="Próxima peça"
            className="grid size-12 place-items-center rounded-full border border-line transition hover:border-paper disabled:opacity-30"
          >
            <ArrowRight className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={open}
            className="label ml-2 inline-flex h-12 items-center gap-3 rounded-full bg-paper px-6 text-ink transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
          >
            Ver detalhes
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function RailItem({
  model,
  index,
  initial,
  pos,
  swing,
  metrics,
  isActive,
  buttonRef,
  onSelect,
}: {
  model: Model
  index: number
  initial: number
  pos: MotionValue<number>
  swing: MotionValue<number>
  metrics: Metrics
  isActive: boolean
  buttonRef: (el: HTMLButtonElement | null) => void
  onSelect: () => void
}) {
  const d = useTransform(pos, (p) => index - p)
  const x = useTransform(d, (v) => layout(v, metrics).x)
  const scale = useTransform(d, (v) => layout(v, metrics).scale)
  const opacity = useTransform(d, (v) => layout(v, metrics).opacity)
  const zIndex = useTransform(d, (v) => 100 - Math.round(Math.abs(v) * 10))
  const visibility = useTransform(d, (v) => (Math.abs(v) > 3.4 ? 'hidden' : 'visible'))
  // peças mais distantes balançam um pouco menos (mais "pesadas" na perspectiva)
  const rotate = useTransform(swing, (s) => s * (isActive ? 1 : 0.75))

  return (
    <motion.div
      className="absolute top-[13px] left-1/2 origin-top"
      style={{ x, scale, opacity, zIndex, visibility, width: metrics.itemW, marginLeft: -metrics.itemW / 2 }}
    >
      <motion.div
        initial={{ y: -90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.1, ease: easeOutExpo, delay: 0.08 * Math.abs(index - initial) }}
      >
        <motion.div style={{ rotate }} className="origin-top">
          <button
            ref={buttonRef}
            type="button"
            tabIndex={isActive ? 0 : -1}
            aria-label={isActive ? `${model.fullName} — ver detalhes` : `Selecionar ${model.fullName}`}
            aria-current={isActive ? 'true' : undefined}
            onClick={onSelect}
            className="block w-full cursor-[inherit] rounded-sm focus-visible:outline-offset-8"
          >
            <div className={isActive ? 'motion-safe:animate-[vm-sway_7s_ease-in-out_infinite] origin-top' : ''}>
              <HangingGarment
                image={model.hero}
                alt=""
                sizes="(max-width: 640px) 70vw, 34vw"
                priority={Math.abs(index - initial) <= 1}
              />
            </div>
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
