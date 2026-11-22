# Vista Morro — vitrine institucional

Site vitrine da marca de streetwear **Vista Morro** (“Da rua pra rua.”). Nesta fase não há carrinho,
checkout, pagamentos, frete ou estoque: os pedidos continuam no
[catálogo oficial](https://meucatalogo.app/vistamorro).

## Executar localmente

Requisitos: Node 20.19+ (testado com Node 22).

```bash
cd vista-morro
npm install
npm run dev        # http://localhost:5173
npm run build      # gera dist/ (site estático, caminhos relativos)
npm run preview    # serve dist/ em http://localhost:4173
npm run lint
```

## Atualizar as peças a partir do catálogo

Todos os produtos, fotos, categorias, cores, tamanhos e fichas técnicas vêm do catálogo oficial.
Para sincronizar (somente leitura):

```bash
npm run sync:catalog   # baixa dados + fotos, recorta e otimiza em WebP (480/960px)
npm run build:og       # regenera public/og.jpg
```

O script grava `src/data/catalog.generated.json` e `public/catalog/**`. Não edite esses arquivos à mão.
Atrás de um proxy corporativo, rode com `NODE_USE_ENV_PROXY=1` (Node ≥ 22.21).

A **curadoria** (qual foto vai no cabide, ordem da arara, recortes do lookbook) fica em
`src/data/catalog.ts` e `src/sections/Lookbook.tsx`. Os textos institucionais estão em `src/data/brand.ts`,
e cada um indica de onde foi tirado.

## Estrutura

```
src/
  data/        tipos, snapshot do catálogo, curadoria, textos verificados
  components/  Header, Hanger/HangingGarment, ProductDialog, Marquee, SectionLabel
  sections/    Hero, Showcase (arara), Collections, Lookbook, About, Contact
  lib/         GSAP/ScrollTrigger, easing, useReveal
scripts/       sync-catalog.mjs, build-og.mjs
```

O modelo de dados (`CatalogProduct` = SKU do catálogo; `Model` = desenho com versões Regular/Plus Size)
foi pensado para receber preço, estoque e carrinho num e-commerce futuro sem mudar a interface.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · Motion (interações e estados) · GSAP + ScrollTrigger
(animações ligadas à rolagem) · Lucide · fontes self-hosted (Archivo variável com eixo de largura,
Instrument Serif, IBM Plex Mono).

Acessibilidade: navegação completa por teclado na arara (setas/Home/End/Enter), `<dialog>` nativo com
foco gerenciado, link para pular ao conteúdo, `prefers-reduced-motion` respeitado em Motion, GSAP e CSS.

## Ambiente de testes (Vercel)

O projeto Vercel `vista-morro-preview` está ligado a este repositório (raiz `vista-morro`, Vite, saída `dist`).

- Cada push na branch `claude/vista-morro-website-wo88gt` gera um deploy de **Preview** automaticamente, pelo
  app da Vercel no GitHub (não depende de token de API).
- O endereço fixo da branch sempre aponta para o deploy mais recente dessa branch.
- Outras branches e builds de produção são ignorados pelo *Ignored Build Step* do projeto.
- Previews são públicos e não indexados: cabeçalho `X-Robots-Tag: noindex` da Vercel e
  `<meta name="robots" content="noindex, nofollow">` inserido no build quando `VERCEL_ENV=preview`.
