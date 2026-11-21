import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Header } from './components/Header'
import { Marquee } from './components/Marquee'
import { ProductDialog } from './components/ProductDialog'
import { Hero } from './sections/Hero'
import { Showcase } from './sections/Showcase'
import { Collections } from './sections/Collections'
import { Lookbook } from './sections/Lookbook'
import { About } from './sections/About'
import { Contact } from './sections/Contact'
import { brand } from './data/brand'
import type { CollectionId, Model } from './data/types'

const scrollToId = (id: string) => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

export default function App() {
  const [filter, setFilter] = useState<CollectionId>('todas')
  const [selected, setSelected] = useState<{ model: Model; preferPlus: boolean } | null>(null)

  // Link direto para uma seção (ex.: /#contato): a SPA monta depois do carregamento, então rola manualmente.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (!id) return
    const go = () => document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' })
    requestAnimationFrame(go)
    // as fontes alteram as alturas das seções: reposiciona quando terminarem de carregar
    document.fonts?.ready.then(() => requestAnimationFrame(go))
  }, [])

  const exploreCollection = useCallback((id: CollectionId) => {
    setFilter(id)
    scrollToId('vitrine')
  }, [])

  return (
    <>
      <Header />
      <div id="conteudo" tabIndex={-1} className="outline-none">
        <main>
          <Hero onExplore={() => scrollToId('colecoes')} />
          <Marquee
            items={[brand.signature, brand.descriptor, brand.name]}
            className="display border-y border-ink bg-paper py-4 text-[clamp(2rem,5vw,4rem)] text-ink"
          />
          <Showcase
            filter={filter}
            onFilter={setFilter}
            onOpen={(model, preferPlus) => setSelected({ model, preferPlus })}
          />
          <Collections onExplore={exploreCollection} />
          <Lookbook />
          <About />
        </main>
        <Contact />
      </div>

      <AnimatePresence>
        {selected && (
          <ProductDialog
            key={selected.model.slug}
            model={selected.model}
            preferPlus={selected.preferPlus}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
