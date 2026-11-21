/**
 * Gera public/og.jpg (1200×630) para compartilhamento: monograma oficial + foto oficial da VM Do Morro.
 * Rode depois de `npm run sync:catalog`.
 */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const data = JSON.parse(await readFile(join(ROOT, 'src/data/catalog.generated.json'), 'utf8'))
const product = data.products.find((p) => /do morro$/i.test(p.title.trim()))
const shirt = product.images[3] ?? product.images[0]

const W = 1200
const H = 630
const mono = await sharp(join(ROOT, 'public', data.store.logoMask.src)).resize({ height: 300 }).toBuffer()
const tee = await sharp(join(ROOT, 'public', shirt.srcset['960'])).resize({ width: 560 }).toBuffer()
const teeMeta = await sharp(tee).metadata()

await sharp({ create: { width: W, height: H, channels: 3, background: '#080808' } })
  .composite([
    { input: mono, left: 110, top: Math.round((H - 300) / 2) },
    { input: tee, left: W - 560 - 90, top: Math.round((H - teeMeta.height) / 2) + 10 },
  ])
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(join(ROOT, 'public', 'og.jpg'))
console.log('✓ public/og.jpg')
