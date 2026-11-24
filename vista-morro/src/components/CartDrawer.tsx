import { useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight, X } from 'lucide-react'
import { useCart, useCartActions } from '../commerce/cartContext'
import { orderLink } from '../commerce/fromCatalog'
import { formatBRL, lineTotal } from '../commerce/money'
import type { CartLine } from '../commerce/cart'
import { asset } from '../data/catalog'
import { Stepper } from './Stepper'
import { useModalDialog } from '../lib/useModalDialog'

/** curva de gaveta (iOS/Ionic): sai rápido, assenta suave */
const DRAWER = [0.32, 0.72, 0, 1] as const
const VERSION_LABEL = { regular: 'Regular', plus: 'Plus Size' } as const

export function CartDrawer() {
  const { open } = useCart()
  return <AnimatePresence>{open && <Drawer />}</AnimatePresence>
}

function Drawer() {
  const ref = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const reduced = useReducedMotion()
  const { lines, totals } = useCart()
  const { closeCart, setQty, remove } = useCartActions()

  useModalDialog(ref, closeRef, 'botao-sacola')

  const checkout = orderLink(lines)
  const empty = lines.length === 0

  const goShopping = () => {
    closeCart()
    // ao continuar comprando com a sacola vazia, leva à arara
    if (empty) document.getElementById('vitrine')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="sacola-titulo"
      onCancel={(e) => {
        e.preventDefault()
        closeCart()
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0"
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-ink/70 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
        transition={{ duration: 0.3 }}
        onClick={closeCart}
      />

      <motion.section
        className="absolute inset-y-0 right-0 flex w-full flex-col bg-paper text-ink sm:w-[min(30rem,100vw)] sm:shadow-[-24px_0_60px_rgba(0,0,0,0.35)]"
        initial={reduced ? { opacity: 0 } : { x: '100%' }}
        animate={reduced ? { opacity: 1 } : { x: 0 }}
        exit={reduced ? { opacity: 0 } : { x: '100%', transition: { duration: 0.28, ease: DRAWER } }}
        transition={{ duration: 0.45, ease: DRAWER }}
      >
        <header className="flex items-center justify-between gap-4 border-b border-line-ink px-5 py-4 sm:px-7">
          <h2 id="sacola-titulo" ref={titleRef} tabIndex={-1} className="display text-4xl outline-none">
            Sacola
            {totals.units > 0 && (
              <span className="price ml-3 align-middle text-base font-semibold tracking-normal normal-case text-ash">
                {totals.units} {totals.units === 1 ? 'peça' : 'peças'}
              </span>
            )}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={closeCart}
            aria-label="Fechar sacola"
            className="press grid size-12 place-items-center rounded-full border border-line-ink hover:bg-ink hover:text-paper"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        {empty ? (
          <div className="flex flex-1 flex-col items-start justify-center gap-6 px-5 sm:px-7">
            <span className="monogram h-20 text-ink/15" aria-hidden="true" />
            <div>
              <p className="editorial text-4xl">Sua sacola está vazia.</p>
              <p className="mt-3 max-w-[34ch] text-ash">
                Escolha uma camiseta na arara, selecione o tamanho e ela aparece aqui.
              </p>
            </div>
            <button
              type="button"
              onClick={goShopping}
              className="label press h-12 rounded-full bg-ink px-6 text-paper hover:bg-ink-3"
            >
              Ver a arara
            </button>
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-7" aria-label="Itens da sacola">
            <AnimatePresence initial={false}>
              {lines.map((l) => (
                <Line key={l.key} line={l} onQty={(q) => setQty(l.key, q)} onRemove={() => {
                    remove(l.key)
                    // a linha some: o foco vai para o título (que anuncia a nova contagem) em vez de cair no body
                    titleRef.current?.focus()
                  }}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}

        <footer className="border-t border-line-ink px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-7">
          {!empty && (
            <div className="mb-4 flex flex-col gap-1.5">
              {totals.knownCents > 0 && (
              <dl className="flex items-baseline justify-between gap-4">
                <dt className="text-ash">{totals.complete ? 'Total' : 'Itens com valor'}</dt>
                <dd className="price text-2xl">{formatBRL(totals.knownCents)}</dd>
              </dl>
              )}
              {!totals.complete && (
                <p className="text-sm text-ash">
                  {totals.unpricedLines === 1 ? '1 item sem valor publicado' : `${totals.unpricedLines} itens sem valor publicado`}
                  : o total final é confirmado no atendimento.
                </p>
              )}
              <p className="text-sm text-ash">Entrega, pagamento e disponibilidade são combinados pelo WhatsApp.</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {checkout && !empty ? (
              <a
                href={checkout}
                target="_blank"
                rel="noopener noreferrer"
                className="label press inline-flex h-14 items-center justify-center gap-2 rounded-full bg-ink px-6 text-paper hover:bg-ink-3"
              >
                Finalizar pelo WhatsApp
                <ArrowUpRight className="size-4" aria-hidden="true" />
                <span className="sr-only">(abre em nova aba com o pedido pronto)</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="label h-14 cursor-not-allowed rounded-full bg-ink/10 px-6 text-ink/45"
              >
                Finalizar pelo WhatsApp
              </button>
            )}
            {!empty && (
              <button
                type="button"
                onClick={goShopping}
                className="label press h-12 rounded-full px-6 text-ink underline-offset-4 hover:underline"
              >
                Continuar comprando
              </button>
            )}
          </div>
          {!empty && (
            <p className="mt-3 text-xs leading-relaxed text-ash">
              O WhatsApp abre com a mensagem pronta; é só enviar. A sacola continua salva aqui.
            </p>
          )}
        </footer>
      </motion.section>
    </dialog>
  )
}

function Line({ line, onQty, onRemove }: { line: CartLine; onQty: (q: number) => void; onRemove: () => void }) {
  const sub = lineTotal(line.unitCents, line.qty)
  const details = [VERSION_LABEL[line.version], line.color, `Tam. ${line.size}`].filter(Boolean).join(' · ')
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] } }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="overflow-hidden border-b border-line-ink last:border-b-0"
    >
      <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 py-5">
        <div className="grid aspect-[4/5] place-items-center rounded-sm bg-paper-2 p-2">
          <img src={asset(line.image)} alt="" className="max-h-full w-full object-contain" loading="lazy" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold leading-snug">{line.name}</p>
            <p className="price shrink-0">{sub === null ? <span className="text-ash">a confirmar</span> : formatBRL(sub)}</p>
          </div>
          <p className="text-sm text-ash">{details}</p>
          <p className="price text-sm text-ash">
            {line.unitCents === null ? 'Consulte o valor' : `${formatBRL(line.unitCents)} cada`}
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-ink [&_[role=group]]:border-line-ink [&_button:hover]:bg-ink/5">
              <Stepper value={line.qty} onChange={onQty} label={`Quantidade de ${line.name}, tamanho ${line.size}`} size="sm" />
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="press min-h-11 px-1 text-sm text-ash underline decoration-line-ink underline-offset-4 hover:text-ink"
            >
              Remover<span className="sr-only"> {line.name}, tamanho {line.size}</span>
            </button>
          </div>
        </div>
      </div>
    </motion.li>
  )
}
