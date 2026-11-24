# Vista Morro · loja

Site da marca de streetwear **Vista Morro** ("Da rua pra rua."). O cliente escolhe as camisetas na arara,
seleciona modelo (Regular ou Plus Size), cor, tamanho e quantidade, monta a sacola e finaliza o pedido pelo
**WhatsApp** oficial da loja, numa única mensagem. Não há pagamento online nem backend: disponibilidade,
entrega e pagamento são combinados no atendimento.

## Executar localmente

Requisitos: Node 22.18+ (os testes usam TypeScript nativo do Node; testado com Node 24).

```bash
cd vista-morro
npm install
npm run dev        # http://localhost:5173
npm test           # testes unitários (sacola, valores, mensagem do WhatsApp)
npm run lint
npm run typecheck  # app + testes
npm run build      # gera dist/ (site estático, caminhos relativos)
npm run preview    # serve dist/ em http://localhost:4173
```

QA visual em várias larguras (com o `npm run dev` rodando):
`http://localhost:5173/tests/visual/frames.html?set=phones#vitrine` (conjuntos: `phones`, `tablets`, `wide`, `landscape`).

## Catálogo, preços e fotos

Produtos, preços (`price` e `oldPrice`), disponibilidade, fotos, categorias, cores, tamanhos e fichas técnicas vêm do
catálogo oficial ([meucatalogo.app/vistamorro](https://meucatalogo.app/vistamorro)). Para sincronizar (somente leitura):

```bash
npm run sync:catalog              # baixa dados + fotos originais e gera as variantes
npm run sync:catalog -- --cached  # só reprocessa as fotos a partir dos originais já baixados
npm run build:og                  # regenera public/og.jpg
```

- Os originais publicados (1200 × 1200, fundo transparente) ficam intactos em `.catalog-originals/` (fora do git).
- As variantes WebP vão para `public/catalog/**` em 480, 720 e na **largura nativa** do recorte (≈ 900 a 975 px).
  Nada é ampliado artificialmente.
- O script mede cada foto pelo canal alfa (gola, ombros, tom claro/escuro) e grava em `src/data/catalog.generated.json`.
  Não edite esse arquivo à mão.
- Preço ausente vira "Consulte o valor" (nunca R$ 0,00). Não há controle de estoque por variação no catálogo: a
  disponibilidade é confirmada no atendimento.

Atrás de um proxy corporativo, rode com `NODE_USE_ENV_PROXY=1` (Node ≥ 22.21).

## Onde fica cada coisa

```
src/
  commerce/    sacola (regras puras + provider), valores em centavos, mensagem e link do WhatsApp
  data/        tipos, snapshot do catálogo, curadoria, rig dos cabides, textos verificados
  components/  Header, Hanger/HangingGarment, ProductDialog, CartDrawer, Stepper, Price, Marquee
  sections/    Hero, Showcase (arara), Collections, Lookbook, About, Contact
  lib/         GSAP/ScrollTrigger, easing, useReveal, useModalDialog
scripts/       sync-catalog.mjs, build-og.mjs
tests/unit/    testes da sacola e do WhatsApp (node:test)
tests/visual/  página de QA com iframes em várias larguras
```

- **Curadoria** (foto do cabide, ordem da arara, recortes do lookbook): `src/data/catalog.ts` e `src/sections/Lookbook.tsx`.
- **Cabides**: `src/data/rig.ts`. O gancho encaixa na gola medida em cada foto; ajustes finos por desenho ficam em `OVERRIDES`.
- **Textos institucionais**: `src/data/brand.ts`, cada um com a fonte.
- **Mensagem do WhatsApp**: `src/commerce/whatsapp.ts` (`buildOrderMessage`), coberta por testes.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · Motion (interações, molas da arara, sacola) · GSAP + ScrollTrigger
(animações ligadas à rolagem) · Lucide · fontes self-hosted (OFL): Bricolage Grotesque (títulos e voz da marca) e
Instrument Sans (textos, menus, preços).

Acessibilidade: navegação completa por teclado na arara (setas/Home/End/Enter), `<dialog>` nativo com foco gerenciado
(também com dois modais em sequência), opções de cor/tamanho como rádios nativos, avisos de seleção com `role="alert"`,
link para pular ao conteúdo e `prefers-reduced-motion` respeitado em Motion, GSAP e CSS.

## Ambiente de testes (Vercel)

O projeto Vercel `vista-morro-preview` está ligado a este repositório (raiz `vista-morro`, Vite, saída `dist`).

- Cada push na branch `claude/vista-morro-website-wo88gt` gera um deploy de **Preview** automaticamente, pelo
  app da Vercel no GitHub (não depende de token de API).
- O endereço fixo da branch sempre aponta para o deploy mais recente dessa branch.
- Outras branches e builds de produção são ignorados pelo *Ignored Build Step* do projeto.
- Previews são públicos e não indexados: cabeçalho `X-Robots-Tag: noindex` da Vercel e
  `<meta name="robots" content="noindex, nofollow">` inserido no build quando `VERCEL_ENV=preview`.
