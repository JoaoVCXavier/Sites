import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Redes sociais exigem URLs absolutas em og:image. Defina SITE_URL no build
 * (ex.: SITE_URL=https://vistamorro.com.br npm run build) para gerar URLs absolutas e o canonical.
 */
function siteUrl(): Plugin {
  const url = process.env.SITE_URL?.replace(/\/$/, '')
  return {
    name: 'vm-site-url',
    transformIndexHtml(html) {
      if (!url) return html
      return html
        .replaceAll('content="./og.jpg"', `content="${url}/og.jpg"`)
        .replace('"logo": "./brand/logo-original.webp"', `"logo": "${url}/brand/logo-original.webp"`)
        .replace('</title>', `</title>\n    <link rel="canonical" href="${url}/" />\n    <meta property="og:url" content="${url}/" />`)
    },
  }
}

/**
 * Deploys de Preview (VERCEL_ENV=preview) ou NOINDEX=1: pede aos buscadores para não indexar.
 * Não afeta o build de produção oficial.
 */
function noindexOnPreview(): Plugin {
  const enabled = process.env.VERCEL_ENV === 'preview' || process.env.NOINDEX === '1'
  return {
    name: 'vm-noindex-preview',
    transformIndexHtml(html) {
      return enabled
        ? html.replace('<meta charset="UTF-8" />', '<meta charset="UTF-8" />\n    <meta name="robots" content="noindex, nofollow" />')
        : html
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), siteUrl(), noindexOnPreview()],
  base: './',
  build: {
    target: 'es2022',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/gsap')) return 'gsap'
          if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) return 'motion'
        },
      },
    },
  },
})
