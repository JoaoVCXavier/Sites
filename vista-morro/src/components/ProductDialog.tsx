import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight, Check, X } from 'lucide-react'
import type { Model, Version } from '../data/types'
import { asset, imageIndexForColor, measuresFor, productFor, sortedSizes, srcSet } from '../data/catalog'
import { useCart, useCartActions } from '../commerce/cartContext'
import { lineKey, MAX_QTY } from '../commerce/cart'
import { contactLink, orderLink, toCartLine } from '../commerce/fromCatalog'
import { formatBRL } from '../commerce/money'
import { Price } from './Price'
import { Stepper } from './Stepper'
import { easeInOutQuart, easeOutExpo } from '../lib/ease'
import { useModalDialog } from '../lib/useModalDialog'

interface Props {
  model: Model
  preferPlus: boolean
  onClose: () => void
}

const SPEC_ORDER = ['Modelagem', 'Composição', 'Malha', 'Gramatura', 'Fio'] as const

/**
 * Painel da peça: fotos oficiais, preço publicado, escolha de modelo/cor/tamanho/quantidade,
 * "Adicionar à sacola" e "Comprar agora" (WhatsApp, só esta peça; a sacola não é alterada).
 */
export function ProductDialog({ model, preferPlus, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const sizeRef = useRef<HTMLFieldSetElement>(null)
  const colorRef = useRef<HTMLFieldSetElement>(null)
  const reduced = useReducedMotion()
  const uid = useId()
  const { add, openCart } = useCartActions()
  const { lines } = useCart()

  const hasVersions = model.plus !== null && model.plus !== model.regular
  // abre na versão pedida; se ela estiver indisponível e a outra não, abre na disponível
  const [version, setVersion] = useState<Version>(() => {
    const want: Version = preferPlus && model.plus ? 'plus' : 'regular'
    const other: Version = want === 'plus' ? 'regular' : 'plus'
    if (productFor(model, want).available || !model.plus) return want
    return productFor(model, other).available ? other : want
  })
  const product = productFor(model, version)
  const colors = product.colors
  const sizes = sortedSizes(product.sizes)
  const [color, setColor] = useState<string | null>(colors.length === 1 ? colors[0] : null)
  const [size, setSize] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [showErrors, setShowErrors] = useState(false)
  /** retorno da última adição: 'ok' troca o botão por "Na sacola"; 'limite' explica o teto por item */
  const [notice, setNotice] = useState<{ n: number; kind: 'ok' | 'limite'; text: string } | null>(null)
  const added = notice?.kind === 'ok'

  // Começa na foto escolhida para o cabide quando ela existe nesta versão; senão, na primeira.
  const [imageIndex, setImageIndex] = useState(() => Math.max(0, product.images.findIndex((i) => i.id === model.hero.id)))
  const image = product.images[imageIndex] ?? product.images[0] ?? model.hero

  useModalDialog(ref, closeRef)

  useEffect(() => {
    if (!notice) return
    const t = window.setTimeout(() => setNotice(null), 6000)
    return () => window.clearTimeout(t)
  }, [notice])

  const switchVersion = (v: Version) => {
    if (v === version) return
    const next = productFor(model, v)
    setVersion(v)
    // tamanhos são diferentes entre Regular (P–GG) e Plus Size (G1–G3): a escolha recomeça
    setSize(null)
    setColor((c) => (c && next.colors.includes(c) ? c : next.colors.length === 1 ? next.colors[0] : null))
    setImageIndex(0)
    setShowErrors(false)
    setNotice(null)
  }

  const chooseColor = (c: string) => {
    setColor(c)
    const i = imageIndexForColor(product, c)
    if (i >= 0) setImageIndex(i)
  }

  const missingColor = colors.length > 0 && !color
  const missingSize = !size
  const canBuy = product.available

  /** valida; se faltar algo, mostra o aviso e leva o foco ao primeiro campo pendente */
  const validate = () => {
    if (!missingColor && !missingSize) return true
    setShowErrors(true)
    const target = missingColor ? colorRef.current : sizeRef.current
    target?.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' })
    target?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true })
    return false
  }

  const line = () => toCartLine(model, product, version, colors.length ? color : null, size!, image)

  const onAdd = () => {
    if (!canBuy || !validate()) return
    const l = line()
    const inBag = lines.find((x) => x.key === lineKey(l.productId, l.color, l.size))?.qty ?? 0
    const room = MAX_QTY - inBag
    const n = (notice?.n ?? 0) + 1
    if (room <= 0) {
      setNotice({ n, kind: 'limite', text: `A sacola já tem o máximo de ${MAX_QTY} unidades desta peça.` })
      return
    }
    const qtyAdded = Math.min(qty, room)
    add(l, qtyAdded)
    setNotice({
      n,
      kind: 'ok',
      text:
        qtyAdded < qty
          ? `Adicionamos ${qtyAdded}: o limite é ${MAX_QTY} unidades por peça.`
          : qtyAdded === 1
            ? 'Peça adicionada à sacola.'
            : `${qtyAdded} peças adicionadas à sacola.`,
    })
  }

  const onBuyNow = () => {
    if (!canBuy || !validate()) return
    const url = orderLink([{ ...line(), qty }], 'peca')
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  const specs = SPEC_ORDER.filter((k) => product.specs[k])
  const measures = measuresFor(product)
  const subtotal = product.priceCents !== null && qty > 1 ? product.priceCents * qty : null
  const contact = contactLink(`Olá, Vista Morro! Tenho interesse na ${model.fullName}.`)

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${uid}-titulo`}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0"
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-ink/75 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.25 } }}
        transition={{ duration: 0.35 }}
        onClick={onClose}
      />

      <motion.div
        className="absolute inset-0 grid grid-cols-[minmax(0,1fr)] overflow-y-auto overscroll-contain bg-ink text-paper md:inset-y-3 md:right-3 md:left-auto md:w-[min(1180px,calc(100vw-1.5rem))] md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:overflow-hidden md:rounded-sm"
        initial={reduced ? { opacity: 0 } : { clipPath: 'inset(100% 0% 0% 0%)' }}
        animate={reduced ? { opacity: 1 } : { clipPath: 'inset(0% 0% 0% 0%)' }}
        exit={reduced ? { opacity: 0 } : { clipPath: 'inset(0% 0% 100% 0%)', transition: { duration: 0.5, ease: easeInOutQuart } }}
        transition={{ duration: 0.7, ease: easeInOutQuart }}
      >
        {/* Galeria */}
        <div className="relative flex min-h-[max(40svh,16rem)] sm:min-h-[max(52svh,18rem)] min-w-0 flex-col bg-paper-2 text-ink md:min-h-0">
          <div className="relative flex-1">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.img
                key={image.id}
                src={asset(image.srcset['720'] ?? Object.values(image.srcset)[0])}
                srcSet={srcSet(image)}
                sizes="(max-width: 768px) 92vw, 52vw"
                width={image.width}
                height={image.height}
                alt={`${model.fullName}, foto ${imageIndex + 1} de ${product.images.length}`}
                className="absolute inset-0 m-auto max-h-[84%] w-[88%] object-contain drop-shadow-[0_28px_28px_rgba(0,0,0,0.22)]"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: easeOutExpo }}
              />
            </AnimatePresence>
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto px-4 pb-4 no-scrollbar sm:px-5 sm:pb-5" role="group" aria-label="Fotos da peça">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setImageIndex(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  aria-pressed={i === imageIndex}
                  className={`press relative size-16 shrink-0 rounded-sm bg-paper p-1.5 sm:size-[4.5rem] ${
                    i === imageIndex ? 'ring-2 ring-ink' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={asset(img.srcset['480'] ?? Object.values(img.srcset)[0])}
                    alt=""
                    width={img.width}
                    height={img.height}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações e compra */}
        <div className="relative flex min-w-0 flex-col md:overflow-y-auto">
          <button
            type="button"
            onClick={onClose}
            ref={closeRef}
            aria-label="Fechar"
            className="press fixed top-3 right-3 z-20 grid size-12 place-items-center rounded-full bg-paper text-ink md:absolute md:top-5 md:right-5"
          >
            <X className="size-5" aria-hidden="true" />
          </button>

          <motion.div
            className="flex flex-col gap-7 px-5 pt-7 pb-6 sm:px-9 sm:pt-10"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: easeOutExpo }}
          >
            <div className="pr-14">
              <h2 id={`${uid}-titulo`} className="display text-[clamp(2.75rem,6vw,4.75rem)]">
                <span className="sr-only">{model.fullName}</span>
                <span aria-hidden="true">
                  <span className="text-smoke">VM </span>
                  {model.name}
                </span>
              </h2>
              <p className="mt-4 text-xl">
                {canBuy ? (
                  <Price cents={product.priceCents} compareAt={product.compareAtCents} />
                ) : (
                  <span className="text-smoke">Indisponível no momento</span>
                )}
              </p>
            </div>

            {product.intro && <p className="max-w-[48ch] text-base leading-relaxed text-paper/80">{product.intro}</p>}

            {hasVersions && !canBuy && (
              <div className="border-t border-line pt-6">
                <Options legend="Modelo" name={`${uid}-modelo-indisp`}>
                  {(['regular', 'plus'] as const).map((v) => (
                    <Chip
                      key={v}
                      name={`${uid}-modelo-indisp`}
                      checked={version === v}
                      onChange={() => switchVersion(v)}
                      label={v === 'regular' ? 'Regular' : 'Plus Size'}
                      hint={productFor(model, v).available ? sizeRange(productFor(model, v).sizes) : 'indisponível'}
                    />
                  ))}
                </Options>
              </div>
            )}

            {canBuy && (
              <div className="flex flex-col gap-6 border-t border-line pt-6">
                {hasVersions && (
                  <Options legend="Modelo" name={`${uid}-modelo`}>
                    {(['regular', 'plus'] as const).map((v) => (
                      <Chip
                        key={v}
                        name={`${uid}-modelo`}
                        checked={version === v}
                        onChange={() => switchVersion(v)}
                        label={v === 'regular' ? 'Regular' : 'Plus Size'}
                        hint={productFor(model, v).available ? sizeRange(productFor(model, v).sizes) : 'indisponível'}
                      />
                    ))}
                  </Options>
                )}

                {colors.length > 0 && (
                  <Options
                    legend="Cor"
                    name={`${uid}-cor`}
                    fieldRef={colorRef}
                    error={showErrors && missingColor ? 'Escolha uma cor.' : null}
                    value={color}
                  >
                    {colors.map((c) => (
                      <Chip key={c} name={`${uid}-cor`} checked={color === c} onChange={() => chooseColor(c)} label={c} />
                    ))}
                  </Options>
                )}

                <Options
                  legend="Tamanho"
                  name={`${uid}-tamanho`}
                  fieldRef={sizeRef}
                  error={showErrors && missingSize ? 'Escolha um tamanho.' : null}
                  value={size}
                >
                  {sizes.map((s) => (
                    <Chip key={s} name={`${uid}-tamanho`} checked={size === s} onChange={() => setSize(s)} label={s} square />
                  ))}
                </Options>

                {measures.length === 0 && sizes.length > 0 && (
                  <p className="-mt-2 text-sm text-smoke">Medidas desta peça confirmadas no atendimento.</p>
                )}
                {measures.length > 0 && (
                  <details className="group -mt-2 text-sm text-smoke">
                    <summary className="w-fit cursor-pointer list-none underline decoration-line underline-offset-4 hover:text-paper">
                      Tabela de medidas
                    </summary>
                    <table className="mt-3 w-full max-w-sm text-left">
                      <caption className="sr-only">Medidas publicadas: {product.measures.header || 'largura x comprimento'}</caption>
                      <tbody className="divide-y divide-line">
                        {measures.map((r) => (
                          <tr key={r.size} className={r.size === size ? 'text-paper' : ''}>
                            <th scope="row" className="w-14 py-2 pr-4 font-semibold tabular-nums">
                              {r.size}
                            </th>
                            <td className="py-2 tabular-nums">{r.text}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                )}

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p id={`${uid}-qtd`} className="label text-smoke">
                      Quantidade
                    </p>
                    {subtotal !== null && <p className="price mt-1 text-sm text-smoke">Subtotal {formatBRL(subtotal)}</p>}
                  </div>
                  <Stepper value={qty} onChange={setQty} labelledBy={`${uid}-qtd`} />
                </div>
              </div>
            )}

            {specs.length > 0 && (
              <div className="border-t border-line pt-6">
                <h3 className="label text-smoke">Ficha técnica</h3>
                <dl className="mt-3 divide-y divide-line">
                  {specs.map((k) => (
                    <div key={k} className="flex items-baseline justify-between gap-6 py-2.5">
                      <dt className="text-sm text-smoke">{k}</dt>
                      <dd className="text-right">{product.specs[k]}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="flex flex-col gap-2 border-t border-line pt-6 text-sm leading-relaxed text-smoke">
              {canBuy ? (
                <p>
                  Comprar agora abre o WhatsApp só com esta peça, sem mexer na sacola. Disponibilidade, entrega e
                  pagamento são combinados no atendimento.
                </p>
              ) : (
                <p>Esta peça está indisponível no momento.</p>
              )}
            </div>
          </motion.div>

          {/* Barra de compra: fica visível ao rolar no celular */}
          <div className="sticky bottom-0 z-10 mt-auto border-t border-line bg-ink/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:px-9 sm:pt-4 sm:pb-6">
            {canBuy ? (
              <>
                <div className="grid grid-cols-1 gap-2 xs:grid-cols-2">
                  <button
                    type="button"
                    onClick={onAdd}
                    className="label press relative h-12 overflow-hidden rounded-full bg-paper px-5 text-ink hover:bg-white sm:h-14"
                  >
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={added ? 'ok' : 'idle'}
                        className="flex items-center justify-center gap-2"
                        initial={{ opacity: 0, filter: 'blur(4px)', y: 6 }}
                        animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                        exit={{ opacity: 0, filter: 'blur(4px)', y: -6 }}
                        transition={{ duration: 0.2, ease: easeOutExpo }}
                      >
                        {added ? (
                          <>
                            <Check className="size-4" aria-hidden="true" /> Na sacola
                          </>
                        ) : (
                          'Adicionar à sacola'
                        )}
                      </motion.span>
                    </AnimatePresence>
                  </button>
                  <button
                    type="button"
                    onClick={onBuyNow}
                    className="label press inline-flex h-12 items-center justify-center gap-2 rounded-full border border-paper/40 px-5 hover:border-paper hover:bg-paper/5 sm:h-14"
                  >
                    Comprar agora
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                    <span className="sr-only">(abre o WhatsApp em nova aba)</span>
                  </button>
                </div>
                <p className={`text-sm text-smoke ${notice ? 'mt-2.5' : 'sr-only'}`} aria-live="polite" aria-atomic="true">
                  {notice ? (
                    <span key={notice.n}>
                      {notice.text}{' '}
                      <button
                        type="button"
                        onClick={() => {
                          onClose()
                          openCart()
                        }}
                        className="font-semibold text-paper underline underline-offset-4"
                      >
                        Ver sacola
                      </button>
                    </span>
                  ) : null}
                </p>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                {contact && (
                  <a
                    href={contact}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label press inline-flex h-12 items-center justify-center gap-2 rounded-full bg-paper px-6 text-ink hover:bg-white sm:h-14"
                  >
                    Perguntar pelo WhatsApp
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                    <span className="sr-only">(abre em nova aba)</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </dialog>
  )
}

/** "P a GG", "G1 a G3": faixa a partir dos tamanhos publicados (nunca fixa no código). */
const sizeRange = (list: string[]) => {
  const s = sortedSizes(list)
  return s.length > 1 ? `${s[0]} a ${s.at(-1)}` : s[0]
}

/* ---------- controles ---------- */

function Options({
  legend,
  name,
  children,
  error = null,
  value,
  fieldRef,
}: {
  legend: string
  name: string
  children: ReactNode
  error?: string | null
  value?: string | null
  fieldRef?: React.Ref<HTMLFieldSetElement>
}) {
  const errorId = `${name}-erro`
  return (
    <fieldset ref={fieldRef} aria-describedby={error ? errorId : undefined} className="min-w-0">
      <legend className="label flex w-full items-baseline justify-between gap-3 text-smoke">
        <span>{legend}</span>
        {value && <span className="normal-case tracking-normal text-paper">{value}</span>}
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            id={errorId}
            role="alert"
            className="mt-2 text-sm font-medium text-paper"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span aria-hidden="true" className="mr-1.5 inline-block size-1.5 -translate-y-0.5 rounded-full bg-paper" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </fieldset>
  )
}

/** Opção como "etiqueta": rádio nativo (setas do teclado, leitores de tela) com aparência de chip. */
function Chip({
  name,
  label,
  hint,
  checked,
  onChange,
  square,
}: {
  name: string
  label: string
  hint?: string
  checked: boolean
  onChange: () => void
  square?: boolean
}) {
  return (
    <label
      className={`press relative inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border text-[0.9375rem] font-medium transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-paper ${
        square ? 'min-w-12 px-3 tabular-nums' : 'px-5'
      } ${checked ? 'border-paper bg-paper text-ink' : 'border-line text-paper hover:border-paper/60'}`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      {label}
      {hint && <span className={`text-xs ${checked ? 'text-ink/60' : 'text-smoke'}`}>{hint}</span>}
    </label>
  )
}
