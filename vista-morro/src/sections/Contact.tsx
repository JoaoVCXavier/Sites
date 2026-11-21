import { ArrowUpRight } from 'lucide-react'
import { brand } from '../data/brand'
import { catalog } from '../data/catalog'
import { SectionLabel } from '../components/SectionLabel'
import { useReveal } from '../lib/useReveal'

export function Contact() {
  const ref = useReveal<HTMLElement>()
  const { instagram, catalog: cat, whatsapp } = brand.links
  const channels = [
    { label: 'Instagram', value: instagram.handle, href: instagram.href },
    { label: 'Catálogo oficial', value: cat.label, href: cat.href },
    ...(whatsapp ? [{ label: 'WhatsApp', value: whatsapp.label, href: whatsapp.href }] : []),
  ]

  return (
    <section id="contato" ref={ref} aria-labelledby="contato-title" className="relative bg-ink pt-24 text-paper sm:pt-36">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
        <SectionLabel index="05" className="text-smoke">
          Contato
        </SectionLabel>
        <h2 id="contato-title" className="display mt-4 text-[clamp(3.5rem,12vw,11rem)]" data-reveal>
          Fale com a
          <br />
          Vista Morro
        </h2>

        <ul className="mt-16 border-t border-line sm:mt-24">
          {channels.map((c) => (
            <li key={c.label} className="border-b border-line" data-reveal>
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 py-7 sm:grid-cols-[16rem_1fr_auto] sm:py-10"
              >
                <span className="label text-smoke">{c.label}</span>
                <span className="col-start-1 row-start-2 text-[clamp(1.5rem,4vw,3.25rem)] leading-tight break-words transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-3 sm:col-start-2 sm:row-start-1">
                  {c.value.split('/').map((part, i) => (
                    <span key={i}>
                      {i > 0 && (
                        <>
                          /<wbr />
                        </>
                      )}
                      {part}
                    </span>
                  ))}
                </span>
                <span className="col-start-2 row-span-2 grid size-12 place-items-center rounded-full border border-line transition-all duration-500 group-hover:border-paper group-hover:bg-paper group-hover:text-ink sm:col-start-3 sm:row-span-1 sm:size-16">
                  <ArrowUpRight className="size-5 transition-transform duration-500 group-hover:rotate-45" aria-hidden="true" />
                </span>
                <span className="sr-only">(abre em nova aba)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <footer className="mx-auto mt-24 max-w-[1600px] px-4 pb-8 sm:mt-36 sm:px-8">
        <div className="flex flex-col gap-10 border-t border-line pt-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-5">
            <span className="monogram h-20 sm:h-28" aria-hidden="true" />
            <div>
              <p className="display text-4xl sm:text-5xl">Vista Morro</p>
              <p className="editorial mt-1 text-xl text-smoke">{brand.signature}</p>
            </div>
          </div>
          <div className="label flex flex-col gap-2 text-smoke sm:items-end sm:text-right">
            <p>Vitrine institucional · pedidos pelo catálogo oficial</p>
            <p>
              Peças sincronizadas do catálogo em{' '}
              <time dateTime={catalog.syncedAt}>{new Date(catalog.syncedAt).toLocaleDateString('pt-BR')}</time>
            </p>
            <p>© {new Date().getFullYear()} Vista Morro</p>
          </div>
        </div>
      </footer>
    </section>
  )
}
