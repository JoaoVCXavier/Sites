import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { ShoppingBag } from 'lucide-react'
import { brand, nav } from '../data/brand'
import { easeInOutQuart, easeOutExpo } from '../lib/ease'
import { useCart, useCartActions } from '../commerce/cartContext'
import { contactLink } from '../commerce/fromCatalog'

export function Header() {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()
  const menuButton = useRef<HTMLButtonElement>(null)
  const { totals } = useCart()
  const { openCart } = useCartActions()
  const units = totals.units
  const whatsapp = contactLink()

  // Peça adicionada: o header (que se esconde ao rolar para baixo) volta a aparecer,
  // para o contador animado ficar à vista e a sacola continuar a um toque — essencial no celular.
  const lastUnits = useRef(units)
  useEffect(() => {
    if (units > lastUnits.current) setHidden(false)
    lastUnits.current = units
  }, [units])

  useMotionValueEvent(scrollY, 'change', (y) => {
    const delta = y - (scrollY.getPrevious() ?? 0)
    setScrolled(y > 40)
    if (y <= 320 || delta < -4) setHidden(false)
    else if (delta > 4) setHidden(true)
  })

  // Menu mobile: Esc fecha e devolve o foco ao botão; rolagem da página bloqueada.
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const main = document.getElementById('conteudo')
    root.style.overflow = 'hidden'
    main?.setAttribute('inert', '')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        menuButton.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      root.style.overflow = ''
      main?.removeAttribute('inert')
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <a
        href="#conteudo"
        className="label fixed top-3 left-3 z-[70] -translate-y-24 rounded-full bg-paper px-4 py-3 text-ink focus:translate-y-0"
      >
        Pular para o conteúdo
      </a>

      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        onFocusCapture={() => setHidden(false)}
        animate={{ y: hidden && !open ? '-100%' : '0%' }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
      >
        <div
          className={`absolute inset-0 -z-10 transition-opacity duration-500 ${
            open ? 'opacity-0' : 'opacity-100'
          } ${scrolled ? 'bg-ink/80 backdrop-blur-md' : 'bg-ink'}`}
          aria-hidden="true"
        />
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 text-paper sm:h-[4.5rem] sm:px-8">
          <a href="#topo" className="group flex min-h-11 min-w-11 items-center gap-3" aria-label="Vista Morro, início">
            <span className="monogram h-9 transition-transform duration-500 group-hover:-rotate-6 sm:h-10" aria-hidden="true" />
            <span className="label hidden tracking-[0.22em] xs:inline">Vista Morro</span>
          </a>

          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex items-center gap-8">
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="label inline-flex min-h-11 items-center text-paper/80 transition-colors hover:text-paper">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <button
              id="botao-sacola"
              type="button"
              onClick={() => {
                setOpen(false)
                openCart()
              }}
              aria-label={units ? `Abrir sacola, ${units} ${units === 1 ? 'peça' : 'peças'}` : 'Abrir sacola, vazia'}
              className="press relative z-[60] flex h-11 items-center gap-2 rounded-full border border-line pr-3 pl-3.5 hover:border-paper"
            >
              <ShoppingBag className="size-[1.125rem]" strokeWidth={1.75} aria-hidden="true" />
              <span className="label hidden sm:inline">Sacola</span>
              <span className="relative grid h-5 min-w-5 place-items-center overflow-hidden rounded-full bg-paper px-1 text-ink">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={units}
                    className="price block text-xs leading-none"
                    initial={{ y: '110%' }}
                    animate={{ y: '0%' }}
                    exit={{ y: '-110%' }}
                    transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                  >
                    {units}
                  </motion.span>
                </AnimatePresence>
              </span>
            </button>
            <button
              ref={menuButton}
              type="button"
              className="label relative z-[60] flex h-11 items-center gap-3 rounded-full px-3 md:hidden"
              aria-expanded={open}
              aria-controls="menu-mobile"
              onClick={() => setOpen((o) => !o)}
            >
              <span>{open ? 'Fechar' : 'Menu'}</span>
              <span aria-hidden="true" className="relative block h-3 w-6">
                <motion.span
                  className="absolute left-0 h-px w-full bg-current"
                  animate={open ? { top: '50%', rotate: 45 } : { top: '0%', rotate: 0 }}
                  transition={{ duration: 0.4, ease: easeOutExpo }}
                />
                <motion.span
                  className="absolute left-0 h-px w-full bg-current"
                  animate={open ? { top: '50%', rotate: -45 } : { top: '100%', rotate: 0 }}
                  transition={{ duration: 0.4, ease: easeOutExpo }}
                />
              </span>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu-mobile"
            className="fixed inset-0 z-40 flex flex-col overflow-y-auto overscroll-contain bg-ink px-4 pt-24 pb-8 text-paper md:hidden"
            initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            transition={{ duration: 0.7, ease: easeInOutQuart }}
          >
            <nav aria-label="Menu mobile" className="flex-1">
              <ul className="flex flex-col">
                {nav.map((item, i) => (
                  <li key={item.href} className="overflow-hidden border-b border-line">
                    <motion.a
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="display flex items-baseline justify-between py-3 text-[clamp(2.25rem,min(16vw,11svh),5rem)] focus-visible:shadow-none focus-visible:outline-paper focus-visible:outline-offset-[-4px]"
                      initial={{ y: '110%' }}
                      animate={{ y: '0%' }}
                      exit={{ y: '-110%' }}
                      transition={{ duration: 0.7, delay: 0.15 + i * 0.06, ease: easeOutExpo }}
                    >
                      {item.label}
                      <span aria-hidden="true" className="label text-smoke">0{i + 1}</span>
                    </motion.a>
                  </li>
                ))}
              </ul>
            </nav>
            <motion.div
              className="mt-8 flex flex-col gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.45 } }}
              exit={{ opacity: 0 }}
            >
              <ul className="flex flex-wrap gap-2">
                <li>
                  <a
                    href={brand.links.instagram.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label press inline-flex h-11 items-center rounded-full border border-line px-5 hover:border-paper"
                  >
                    Instagram<span className="sr-only"> (abre em nova aba)</span>
                  </a>
                </li>
                {whatsapp && (
                  <li>
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="label press inline-flex h-11 items-center rounded-full border border-line px-5 hover:border-paper"
                    >
                      Fale conosco<span className="sr-only"> pelo WhatsApp (abre em nova aba)</span>
                    </a>
                  </li>
                )}
              </ul>
              <div className="flex items-end justify-between gap-4" aria-hidden="true">
                <p className="editorial text-2xl">{brand.signature}</p>
                <span className="monogram h-14 text-paper/80" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
