import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, X } from 'lucide-react'
import type { Model } from '../data/types'
import { asset, srcSet } from '../data/catalog'
import { easeInOutQuart, easeOutExpo } from '../lib/ease'

interface Props {
  model: Model
  preferPlus: boolean
  onClose: () => void
}

const SPEC_ORDER = ['Modelagem', 'Composição', 'Malha', 'Gramatura', 'Fio'] as const

/**
 * Detalhes da peça — somente informação publicada no catálogo oficial.
 * Sem preço, carrinho ou estoque: o pedido acontece no catálogo.
 */
export function ProductDialog({ model, preferPlus, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [version, setVersion] = useState<'regular' | 'plus'>(preferPlus && model.plus ? 'plus' : 'regular')
  const product = version === 'plus' && model.plus ? model.plus : model.regular
  const [imageIndex, setImageIndex] = useState(() =>
    Math.max(0, model.regular.images.findIndex((i) => i.id === model.hero.id)),
  )
  const image = product.images[imageIndex] ?? product.images[0]

  useEffect(() => {
    const dialog = ref.current
    const previous = document.activeElement as HTMLElement | null
    dialog?.showModal()
    closeRef.current?.focus()
    const root = document.documentElement
    const prevOverflow = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = prevOverflow
      if (dialog?.open) dialog.close()
      previous?.focus({ preventScroll: true })
    }
  }, [])

  const switchVersion = (v: 'regular' | 'plus') => {
    setVersion(v)
    setImageIndex(0)
  }

  const specs = SPEC_ORDER.filter((k) => product.specs[k])

  return (
    <dialog
      ref={ref}
      aria-labelledby="produto-titulo"
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
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        onClick={onClose}
      />

      <motion.div
        className="absolute inset-0 grid overflow-y-auto overscroll-contain bg-ink text-paper md:inset-y-3 md:right-3 md:left-auto md:w-[min(1180px,calc(100vw-1.5rem))] md:grid-cols-[1.15fr_1fr] md:overflow-hidden md:rounded-sm"
        initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
        animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
        exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
        transition={{ duration: 0.85, ease: easeInOutQuart }}
      >
        {/* Galeria */}
        <div className="relative flex min-h-[58svh] flex-col bg-[#e6e3dc] text-ink md:min-h-0">
          <div className="relative flex-1">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.img
                key={image.id}
                src={asset(image.srcset['960'] ?? Object.values(image.srcset)[0])}
                srcSet={srcSet(image)}
                sizes="(max-width: 768px) 100vw, 55vw"
                width={image.width}
                height={image.height}
                alt={`${product.title} — foto ${imageIndex + 1} de ${product.images.length}`}
                className="absolute inset-0 m-auto max-h-[82%] w-[86%] object-contain drop-shadow-[0_30px_30px_rgba(0,0,0,0.25)]"
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.7, ease: easeOutExpo }}
              />
            </AnimatePresence>
            <p className="label absolute top-5 left-5 text-ash">Foto oficial · catálogo Vista Morro</p>
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto px-5 pb-5 no-scrollbar" role="group" aria-label="Fotos da peça">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setImageIndex(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  aria-pressed={i === imageIndex}
                  className={`relative size-16 shrink-0 rounded-sm bg-[#d9d5cc] p-1.5 transition sm:size-20 ${
                    i === imageIndex ? 'ring-2 ring-ink' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={asset(img.srcset['480'])}
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

        {/* Informações */}
        <motion.div
          className="relative flex flex-col gap-8 px-5 py-8 sm:px-10 sm:py-12 md:overflow-y-auto"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: easeOutExpo }}
        >
          <button
            type="button"
            onClick={onClose}
            ref={closeRef}
            aria-label="Fechar detalhes"
            className="fixed top-4 right-4 z-10 grid size-12 place-items-center rounded-full bg-paper text-ink transition hover:rotate-90 md:absolute md:top-6 md:right-6"
          >
            <X className="size-5" aria-hidden="true" />
          </button>

          <div className="pr-14">
            <p className="label text-smoke">{model.category ?? 'Camiseta'}</p>
            <h2 id="produto-titulo" className="display mt-3 text-[clamp(3rem,7vw,5.75rem)]">
              <span className="sr-only">{product.title}</span>
              <span aria-hidden="true">
                <span className="text-smoke">VM </span>
                {model.name}
              </span>
            </h2>
          </div>

          {model.plus && (
            <div role="group" aria-label="Versão" className="inline-flex w-fit rounded-full border border-line p-1">
              {(['regular', 'plus'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={version === v}
                  onClick={() => switchVersion(v)}
                  className={`label rounded-full px-4 py-2 transition-colors ${
                    version === v ? 'bg-paper text-ink' : 'text-paper/70 hover:text-paper'
                  }`}
                >
                  {v === 'regular' ? 'Regular' : 'Plus Size'}
                </button>
              ))}
            </div>
          )}

          {product.intro && <p className="editorial text-2xl leading-snug text-paper/90 sm:text-3xl">{product.intro}</p>}

          <dl className="grid grid-cols-1 gap-6 border-t border-line pt-6 sm:grid-cols-2">
            {product.colors.length > 0 && (
              <div>
                <dt className="label text-smoke">Cores</dt>
                <dd className="mt-3 flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <span key={c} className="rounded-full border border-line px-3 py-1.5 text-sm">
                      {c}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {product.sizes.length > 0 && (
              <div>
                <dt className="label text-smoke">Tamanhos</dt>
                <dd className="mt-3 flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <span
                      key={s}
                      className="grid h-9 min-w-9 place-items-center rounded-full border border-line px-2 text-sm tabular-nums"
                    >
                      {s}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>

          {specs.length > 0 && (
            <div className="border-t border-line pt-6">
              <h3 className="label text-smoke">Ficha técnica</h3>
              <dl className="mt-4 divide-y divide-line">
                {specs.map((k) => (
                  <div key={k} className="flex items-baseline justify-between gap-6 py-3">
                    <dt className="text-sm text-smoke">{k}</dt>
                    <dd className="text-right text-base">{product.specs[k]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="mt-auto flex flex-col gap-3 border-t border-line pt-6">
            <a
              href={product.catalogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="label group inline-flex h-14 items-center justify-between rounded-full bg-paper px-6 text-ink"
            >
              Ver no catálogo oficial
              <ArrowUpRight
                className="size-5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
              <span className="sr-only">(abre em nova aba)</span>
            </a>
            <p className="text-sm text-smoke">
              Disponibilidade e pedidos diretamente no catálogo oficial da Vista Morro.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </dialog>
  )
}
