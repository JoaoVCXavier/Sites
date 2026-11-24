import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { ArrowUp, ArrowUpRight } from 'lucide-react'
import { brand } from '../data/brand'
import { contactLink } from '../commerce/fromCatalog'
import { InstagramIcon, WhatsAppIcon } from '../components/SocialIcons'
import { gsap, prefersReducedMotion } from '../lib/gsap'

const FOOTER_NAV = [
  { href: '#topo', label: 'Início' },
  { href: '#vitrine', label: 'Vitrine' },
  { href: '#colecoes', label: 'Coleções' },
  { href: '#lookbook', label: 'Lookbook' },
  { href: '#sobre', label: 'Sobre' },
] as const

/**
 * Encerramento do site: chamada da marca + dois atalhos de contato, e o rodapé.
 * Uma única linha (desenhada na rolagem) faz a passagem do contato para o rodapé.
 */
export function Contact() {
  const root = useRef<HTMLElement>(null)
  const whatsapp = contactLink()
  const { instagram } = brand.links

  // Entrada: textos sobem em sequência curta; a linha de passagem se desenha da esquerda.
  useLayoutEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 78%', once: true } })
      tl.from('[data-in]', { y: 28, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07 })
        .from('[data-line]', { scaleX: 0, transformOrigin: '0% 50%', duration: 1.2, ease: 'expo.inOut' }, 0.25)
        .from('[data-foot]', { y: 16, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.05 }, 0.55)
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section id="contato" ref={root} aria-label="Contato" className="relative isolate overflow-hidden bg-ink text-paper">
      {/* marca d'água: monograma oficial, recortado pela borda da seção */}
      <span
        aria-hidden="true"
        className="monogram pointer-events-none absolute -right-[6%] -bottom-[18%] -z-10 h-[min(34rem,70vw)] text-paper/[0.03]"
      />

      <div className="mx-auto max-w-[1600px] px-4 pt-24 sm:px-8 sm:pt-32">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-end lg:gap-20">
          <div>
            <h2 id="contato-title" className="editorial text-[clamp(3rem,6.2vw,5.5rem)] leading-[0.95]" data-in>
              {brand.signature}
            </h2>
            <p className="mt-6 max-w-[42ch] text-lg leading-relaxed text-paper/75" data-in>
              As peças novas aparecem primeiro no Instagram. Dúvida sobre tamanho ou sobre o seu pedido? Fale com a gente
              pelo WhatsApp.
            </p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <li data-in>
              <ContactAction
                href={instagram.href}
                icon={<InstagramIcon className="size-6" />}
                kicker="Instagram"
                title={instagram.handle}
              />
            </li>
            {whatsapp && (
              <li data-in>
                <ContactAction
                  href={whatsapp}
                  icon={<WhatsAppIcon className="size-6" />}
                  kicker="Atendimento"
                  title="Fale no WhatsApp"
                />
              </li>
            )}
          </ul>
        </div>

        <div data-line aria-hidden="true" className="mt-20 h-px bg-line sm:mt-28" />

        <footer className="grid gap-10 py-12 sm:grid-cols-2 sm:py-14 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex items-start gap-4 sm:col-span-2 lg:col-span-1" data-foot>
            <span className="monogram h-14 shrink-0" aria-hidden="true" />
            <div>
              <p className="display text-3xl">{brand.name}</p>
              <p className="editorial mt-1 text-lg text-smoke">{brand.signature}</p>
            </div>
          </div>

          <nav aria-label="Rodapé" data-foot>
            <h3 className="label text-smoke">Navegação</h3>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-1">
              {FOOTER_NAV.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="link-underline pb-0.5 text-paper/80 hover:text-paper">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div data-foot>
            <h3 className="label text-smoke">Atendimento</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {whatsapp && (
                <li>
                  <FooterLink href={whatsapp} icon={<WhatsAppIcon className="size-[1.125rem]" />}>
                    WhatsApp<span className="sr-only"> (abre em nova aba)</span>
                  </FooterLink>
                </li>
              )}
              <li>
                <FooterLink href={instagram.href} icon={<InstagramIcon className="size-[1.125rem]" />}>
                  {instagram.handle}
                  <span className="sr-only"> no Instagram (abre em nova aba)</span>
                </FooterLink>
              </li>
            </ul>
          </div>
        </footer>

        <div className="flex flex-col gap-4 border-t border-line py-6 text-sm text-smoke sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.name}. Todos os direitos reservados.
          </p>
          <a href="#topo" className="group inline-flex min-h-11 w-fit items-center gap-2 hover:text-paper">
            Voltar ao início
            <ArrowUp
              className="size-4 transition-transform duration-200 ease-[var(--ease-out)] group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>
    </section>
  )
}

/** Atalho de contato: ícone da rede num círculo que "acende" no hover, texto curto e seta. */
function ContactAction({
  href,
  icon,
  kicker,
  title,
}: {
  href: string
  icon: ReactNode
  kicker: string
  title: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group press flex items-center gap-4 rounded-full border border-line bg-ink-2/60 py-2.5 pr-5 pl-2.5 transition-colors duration-200 hover:border-paper/50 hover:bg-ink-3"
    >
      <span className="grid size-14 shrink-0 place-items-center rounded-full bg-paper/[0.06] text-paper transition-[background-color,color,transform] duration-300 ease-[var(--ease-out)] group-hover:-rotate-6 group-hover:bg-paper group-hover:text-ink">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="label block text-smoke">{kicker}</span>
        <span className="mt-0.5 block text-lg leading-snug font-semibold">{title}</span>
        <span className="sr-only"> (abre em nova aba)</span>
      </span>
      <ArrowUpRight
        className="size-5 shrink-0 text-smoke transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-paper"
        aria-hidden="true"
      />
    </a>
  )
}

function FooterLink({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-2.5 text-paper/80 hover:text-paper"
    >
      <span className="transition-transform duration-200 ease-[var(--ease-out)] group-hover:scale-110">{icon}</span>
      <span className="link-underline pb-0.5">{children}</span>
    </a>
  )
}
