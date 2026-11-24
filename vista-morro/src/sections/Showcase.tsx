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
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import { collections, modelsFor } from '../data/catalog'
import { rigFor } from '../data/rig'
import type { CollectionId, Model } from '../data/types'
import { HangingGarment } from '../components/HangingGarment'
import { Price } from '../components/Price'
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
      className="relative isolate overflow-hidden bg-ink pt-14 pb-12 text-paper sm:pt-24 sm:pb-20 short:pt-6 short:pb-6"
    >
      {/* luz de vitrine: um foco sobre a peça da frente */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(42% 48% at 50% 40%, #3d3c39 0%, #232220 45%, #0c0c0b 82%, #080808 100%), #080808',
        }}
      />
      <div aria-hidden="true" className="grain -z-10" />

      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 sm:gap-6 sm:px-8 lg:flex-row lg:items-end lg:justify-between short:flex-row short:items-center short:justify-between short:gap-4">
        <h2 id="vitrine-title" className="display shrink-0 text-[clamp(3.25rem,8vw,6rem)] short:text-4xl">
          A arara
        </h2>

        <div className="flex flex-col gap-3 lg:items-end">
          <div
            role="group"
            aria-label="Filtrar peças por coleção"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 short:flex-nowrap short:overflow-x-auto"
          >
            {FILTERS.map((f) => {
              const pressed = filter === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => onFilter(f.id)}
                  className={`label press min-h-11 shrink-0 rounded-full border px-4 ${
                    pressed
                      ? 'border-paper bg-paper text-ink'
                      : 'border-line text-paper/80 hover:border-paper/60 hover:text-paper'
                  }`}
                >
                  {f.label}
                  <span className="ml-2 tabular-nums opacity-60">{modelsFor(f.id).length}</span>
                </button>
              )
            })}
          </div>
          <p className="text-sm text-smoke max-sm:text-[0.8125rem] short:hidden">
            <span className="pointer-coarse:hidden">Arraste a arara, clique numa peça ou use as setas do teclado.</span>
            <span className="hidden pointer-coarse:inline">Deslize para ver as peças. Toque para escolher o tamanho.</span>
          </p>
        </div>
      </div>

      {/* `key` reinicia a arara (posição e animação de entrada) ao trocar de coleção */}
      {items.length > 0 ? (
        <Rail key={filter} items={items} preferPlus={filter === 'plus-size'} onOpen={onOpen} />
      ) : (
        <p className="editorial mx-auto mt-16 max-w-[1600px] px-4 text-3xl text-smoke sm:px-8">
          Nenhuma peça nesta coleção no momento.
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
  /** distância do centro até a primeira peça lateral */
  spacing: number
  /** distância entre as peças laterais seguintes (arara cheia: bem juntas) */
  packing: number
  compact: boolean
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** altura da peça pendurada ÷ largura: gancho (≈0,16) + foto oficial (≈0,77) + sombra */
const GARMENT_RATIO = 1.0
/** a barra fica BAR_Y px abaixo do topo do palco; o pivô de cada peça fica exatamente nessa linha */
const BAR_Y = 18

/**
 * Posição de cada peça em função da distância `d` até a peça da frente.
 * A da frente fica aberta (sem rotação); as demais giram de lado, como numa arara real,
 * cada vez mais juntas e mais ao fundo.
 */
function layout(d: number, m: Metrics) {
  const a = Math.abs(d)
  const s = Math.sign(d)
  const near = Math.min(a, 1)
  const far = Math.max(0, a - 1)
  return {
    x: s * (near * m.spacing + far * m.packing),
    rotateY: -s * (near * 58 + Math.min(far, 3) * 4),
    scale: 1 - near * 0.12 - Math.min(far, 4) * 0.035,
    opacity: a <= 1 ? 1 - near * 0.12 : Math.max(0, 0.88 - far * 0.12 - Math.max(0, far - 3) * 0.5),
    /** véu escuro sobre as peças ao fundo (luz da vitrine caindo) */
    shade: Math.min(0.48, near * 0.26 + far * 0.07),
  }
}

/** molas: arrastar/clique (com peso) e teclado (curta, para não atrasar quem navega pelo teclado) */
const SPRING = { type: 'spring', stiffness: 150, damping: 24, mass: 1.1 } as const
const SPRING_KEYS = { type: 'spring', stiffness: 420, damping: 42, mass: 0.8 } as const

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
  const [m, setM] = useState<Metrics>({
    width: 1200,
    height: 460,
    itemW: 420,
    spacing: 300,
    packing: 110,
    compact: false,
  })

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
      const byWidth = compact ? width * 0.7 : width < 1024 ? width * 0.44 : width * 0.3
      // celular deitado: a peça cabe na altura útil, com o nome e os botões logo abaixo
      const short = vh <= 520 && window.innerWidth > vh
      const byHeight = (short ? vh - 195 : Math.min(vh * 0.58, 640) - BAR_Y) / GARMENT_RATIO
      const itemW = Math.round(clamp(Math.min(byWidth, byHeight), 150, 540))
      setM({
        width,
        itemW,
        height: Math.round(itemW * GARMENT_RATIO + BAR_Y),
        spacing: itemW * (compact ? 0.66 : 0.74),
        packing: itemW * (compact ? 0.2 : 0.26),
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
    (i: number, via: 'pointer' | 'keys' = 'pointer') => {
      const target = clamp(i, 0, n - 1)
      anim.current?.stop()
      anim.current = animate(pos, target, reduced ? { duration: 0 } : via === 'keys' ? SPRING_KEYS : SPRING)
    },
    [n, pos, reduced],
  )
  useEffect(() => () => anim.current?.stop(), [])

  // Balanço: a arara acelera → as peças ficam para trás (pêndulo). Alvo comum; cada peça tem sua mola.
  const velocity = useVelocity(pos)
  const swingTarget = useTransform(velocity, (v) => (reduced ? 0 : clamp(-v * 3.6, -9, 9)))

  /* ---------- arrastar / swipe ---------- */
  const drag = useRef<{ id: number; x0: number; p0: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)

  const onPointerDown = (e: React.PointerEvent) => {
    // um único ponteiro por vez: um segundo dedo não "teleporta" a arara
    if (drag.current || (e.pointerType === 'mouse' && e.button !== 0)) return
    anim.current?.stop()
    drag.current = { id: e.pointerId, x0: e.clientX, p0: pos.get(), moved: false }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    // botão solto fora do palco antes de o arraste começar: o gesto acabou
    if (e.pointerType === 'mouse' && e.buttons === 0) {
      drag.current = null
      return
    }
    const dx = e.clientX - d.x0
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true
      stageRef.current?.setPointerCapture(e.pointerId)
    }
    if (!d.moved) return
    // a primeira peça lateral está a `spacing`; arrastar essa distância troca uma peça
    let p = d.p0 - dx / m.spacing
    // atrito progressivo além das pontas, em vez de um batente
    if (p < 0) p = -(1 - 1 / (1 + -p * 0.9)) * 0.55
    if (p > n - 1) p = n - 1 + (1 - 1 / (1 + (p - (n - 1)) * 0.9)) * 0.55
    pos.set(p)
  }

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    if (!d.moved) return
    suppressClick.current = true
    requestAnimationFrame(() => (suppressClick.current = false))
    // lançamento: a velocidade do gesto projeta onde a arara para
    const v = clamp(pos.getVelocity(), -14, 14)
    const projected = pos.get() + v * 0.16
    const target = Math.abs(v) > 1.2 && Math.round(projected) === d.p0 ? d.p0 + Math.sign(v) : Math.round(projected)
    goTo(target)
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
      const target = clamp(map[e.key], 0, n - 1)
      // só move o foco se a peça realmente mudar (Home na primeira, seta na última: nada a fazer)
      if (target !== activeRef.current) {
        focusAfterMove.current = true
        goTo(target, 'keys')
      }
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
  const product = current && (preferPlus && current.plus ? current.plus : current.regular)

  return (
    <div className="relative mt-4 sm:mt-8 short:mt-2">
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
        <RailBar />
        {items.map((model, i) => (
          <RailItem
            key={model.slug}
            model={model}
            index={i}
            initial={initial}
            pos={pos}
            swingTarget={swingTarget}
            reduced={Boolean(reduced)}
            metrics={m}
            preferPlus={preferPlus}
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
      <div className="mx-auto mt-2 grid max-w-[1600px] grid-cols-1 items-end gap-x-8 gap-y-5 px-4 sm:px-8 md:grid-cols-[minmax(0,1fr)_auto] short:grid-cols-[minmax(0,1fr)_auto] short:gap-y-2">
        <div className="min-w-0">
          <div className="label flex flex-wrap items-center gap-x-3 gap-y-1 text-smoke">
            <span className="tabular-nums text-paper">
              {String(active + 1).padStart(2, '0')}
              <span className="text-smoke"> / {String(n).padStart(2, '0')}</span>
            </span>
            {current?.category && <span className="short:hidden">{current.category}</span>}
            {current?.plus && <span className="short:hidden">Também em Plus Size</span>}
          </div>

          <div className="relative mt-2 overflow-hidden text-[clamp(2.75rem,7.5vw,6rem)] leading-none short:mt-1 short:text-4xl">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.h3
                key={current?.slug}
                className="display block truncate pb-[0.04em]"
                initial={reduced ? { opacity: 0 } : { y: '100%' }}
                animate={reduced ? { opacity: 1 } : { y: '0%' }}
                exit={reduced ? { opacity: 0 } : { y: '-100%' }}
                transition={{ duration: 0.5, ease: easeOutExpo }}
              >
                <span className="sr-only">{current?.fullName}</span>
                <span aria-hidden="true">
                  <span className="mr-[0.16em] text-smoke">VM</span>
                  {current?.name}
                </span>
              </motion.h3>
            </AnimatePresence>
          </div>

          {product && (
            <p className="mt-3 flex flex-wrap items-baseline gap-x-3 text-lg short:mt-1 short:text-base">
              {product.available ? (
                <Price cents={product.priceCents} compareAt={product.compareAtCents} />
              ) : (
                <span className="text-smoke">Indisponível no momento</span>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
            aria-label="Peça anterior"
            className="press grid size-12 place-items-center rounded-full border border-line hover:border-paper disabled:opacity-30"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            disabled={active === n - 1}
            aria-label="Próxima peça"
            className="press grid size-12 place-items-center rounded-full border border-line hover:border-paper disabled:opacity-30"
          >
            <ArrowRight className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={open}
            className="label press ml-1 inline-flex h-12 items-center gap-3 rounded-full bg-paper pr-5 pl-6 text-ink hover:bg-white"
          >
            {current?.available ? 'Escolher tamanho' : 'Ver detalhes'}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}

/** Barra da arara: tubo de aço com brilho no topo e sombra projetada na parede. */
function RailBar() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0" style={{ top: BAR_Y - 3 }}>
      <div className="absolute inset-x-0 top-4 h-6 bg-black/50 blur-lg" />
      <div
        className="relative h-[6px]"
        style={{
          background:
            'linear-gradient(180deg, #8f8d88 0%, #f4f2ec 22%, #b4b2ac 45%, #5b5a56 72%, #2a2a28 100%)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.06), 0 4px 10px rgba(0,0,0,0.55)',
        }}
      />
    </div>
  )
}

function RailItem({
  model,
  index,
  initial,
  pos,
  swingTarget,
  reduced,
  metrics,
  preferPlus,
  isActive,
  buttonRef,
  onSelect,
}: {
  model: Model
  index: number
  initial: number
  pos: MotionValue<number>
  swingTarget: MotionValue<number>
  reduced: boolean
  metrics: Metrics
  preferPlus: boolean
  isActive: boolean
  buttonRef: (el: HTMLButtonElement | null) => void
  onSelect: () => void
}) {
  const rig = useMemo(() => rigFor(model.hero, model.slug, preferPlus && model.plus ? 'plus' : 'regular'), [model, preferPlus])
  const d = useTransform(pos, (p) => index - p)
  const x = useTransform(d, (v) => layout(v, metrics).x)
  const scale = useTransform(d, (v) => layout(v, metrics).scale)
  const rotateY = useTransform(d, (v) => (reduced ? 0 : layout(v, metrics).rotateY))
  const opacity = useTransform(d, (v) => layout(v, metrics).opacity)
  const shade = useTransform(d, (v) => layout(v, metrics).shade)
  const zIndex = useTransform(d, (v) => 100 - Math.round(Math.abs(v) * 10))
  const visibility = useTransform(d, (v) => (Math.abs(v) > 4.5 ? 'hidden' : 'visible'))
  // Cada peça tem a própria mola: as mais pesadas respondem mais devagar e balançam por mais tempo.
  const swing = useSpring(swingTarget, { stiffness: 64 / rig.mass, damping: 5.2 * Math.sqrt(rig.mass), mass: rig.mass })

  return (
    <motion.div
      className="absolute left-1/2 origin-top"
      style={{
        top: BAR_Y,
        x,
        scale,
        opacity,
        zIndex,
        visibility,
        width: metrics.itemW,
        marginLeft: -metrics.itemW / 2,
      }}
    >
      <motion.div
        className="origin-top"
        initial={reduced ? false : { y: -70, opacity: 0, rotate: -4 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        transition={{
          duration: 0.9,
          ease: easeOutExpo,
          delay: 0.06 * Math.abs(index - initial),
          rotate: { type: 'spring', stiffness: 60, damping: 6, delay: 0.06 * Math.abs(index - initial) + 0.2 },
        }}
      >
        {/* balanço em torno do gancho (plano da arara) */}
        <motion.div style={{ rotate: swing }} className="origin-top">
          {/* giro de lado em torno do eixo vertical do gancho */}
          <motion.div style={{ rotateY, transformPerspective: 1300 }} className="origin-top">
            <button
              ref={buttonRef}
              type="button"
              tabIndex={isActive ? 0 : -1}
              aria-label={isActive ? `${model.fullName}: escolher tamanho` : `Ver ${model.fullName}`}
              aria-current={isActive ? 'true' : undefined}
              onClick={onSelect}
              className="relative block w-full cursor-[inherit] rounded-sm focus-visible:outline-offset-8"
            >
              <div className={isActive ? 'origin-top motion-safe:animate-[vm-sway_7s_ease-in-out_infinite]' : 'origin-top'}>
                <HangingGarment
                  image={model.hero}
                  rig={rig}
                  alt=""
                  sizes={`${metrics.itemW}px`}
                  priority={Math.abs(index - initial) <= 1}
                  shade={shade}
                />
              </div>
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
