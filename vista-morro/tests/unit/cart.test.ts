import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  cartReducer,
  cartTotals,
  lineKey,
  MAX_QTY,
  parseStoredCart,
  reconcileCart,
  serializeCart,
  type CartLine,
  type NewLine,
} from '../../src/commerce/cart.ts'

const doMorro: NewLine = {
  productId: 'p-do-morro',
  slug: 'do-morro',
  name: 'Camiseta VM Do Morro',
  version: 'regular',
  color: 'Preta',
  size: 'G',
  unitCents: 12900,
  image: 'catalog/x/a-480.webp',
}

const add = (lines: CartLine[], line: NewLine, qty = 1) => cartReducer(lines, { type: 'add', line, qty })

test('adiciona uma camiseta', () => {
  const lines = add([], doMorro)
  assert.equal(lines.length, 1)
  assert.equal(lines[0].qty, 1)
  assert.equal(lines[0].key, lineKey('p-do-morro', 'Preta', 'G'))
})

test('adiciona várias camisetas diferentes', () => {
  let lines = add([], doMorro)
  lines = add(lines, { ...doMorro, productId: 'p-urban', slug: 'urban', name: 'Camiseta VM Urban', unitCents: 10900 }, 2)
  assert.equal(lines.length, 2)
  assert.equal(cartTotals(lines).units, 3)
})

test('mesma variação soma quantidades', () => {
  let lines = add([], doMorro, 2)
  lines = add(lines, doMorro, 3)
  assert.equal(lines.length, 1)
  assert.equal(lines[0].qty, 5)
})

test('cor, tamanho ou modelo diferentes ficam separados', () => {
  let lines = add([], doMorro)
  lines = add(lines, { ...doMorro, color: 'Off white' })
  lines = add(lines, { ...doMorro, size: 'GG' })
  lines = add(lines, { ...doMorro, productId: 'p-do-morro-plus', version: 'plus', size: 'G1', unitCents: 13900 })
  assert.equal(lines.length, 4)
  assert.equal(new Set(lines.map((l) => l.key)).size, 4)
})

test('altera quantidade e remove ao chegar a zero', () => {
  let lines = add([], doMorro, 2)
  const key = lines[0].key
  lines = cartReducer(lines, { type: 'setQty', key, qty: 7 })
  assert.equal(lines[0].qty, 7)
  lines = cartReducer(lines, { type: 'setQty', key, qty: 0 })
  assert.equal(lines.length, 0)
})

test('rejeita quantidades negativas, fracionadas ou inválidas', () => {
  assert.deepEqual(add([], doMorro, -3), [])
  assert.deepEqual(add([], doMorro, Number.NaN), [])
  const lines = add([], doMorro, 2.9)
  assert.equal(lines[0].qty, 2)
  const capped = cartReducer(lines, { type: 'setQty', key: lines[0].key, qty: 10_000 })
  assert.equal(capped[0].qty, MAX_QTY)
  const neg = cartReducer(lines, { type: 'setQty', key: lines[0].key, qty: -1 })
  assert.equal(neg.length, 0)
})

test('soma nunca ultrapassa o limite por linha', () => {
  const lines = add(add([], doMorro, MAX_QTY), doMorro, 5)
  assert.equal(lines[0].qty, MAX_QTY)
})

test('remove um item', () => {
  let lines = add(add([], doMorro), { ...doMorro, size: 'M' })
  lines = cartReducer(lines, { type: 'remove', key: lines[0].key })
  assert.equal(lines.length, 1)
  assert.equal(lines[0].size, 'M')
})

test('subtotais e total em centavos inteiros', () => {
  let lines = add([], doMorro, 2) // 2 × 129,00
  lines = add(lines, { ...doMorro, productId: 'p-urban', unitCents: 10990 }, 3) // 3 × 109,90
  const t = cartTotals(lines)
  assert.equal(t.knownCents, 2 * 12900 + 3 * 10990)
  assert.equal(t.knownCents, 58770)
  assert.equal(t.complete, true)
})

test('produto sem preço não vira gratuito nem completa o total', () => {
  let lines = add([], doMorro)
  lines = add(lines, { ...doMorro, productId: 'p-sem-preco', unitCents: null }, 2)
  const t = cartTotals(lines)
  assert.equal(t.units, 3)
  assert.equal(t.knownCents, 12900)
  assert.equal(t.unpricedLines, 1)
  assert.equal(t.complete, false)
})

test('sacola vazia', () => {
  assert.deepEqual(cartTotals([]), { units: 0, knownCents: 0, unpricedLines: 0, complete: true })
  assert.deepEqual(cartReducer([], { type: 'clear' }), [])
})

test('persiste e recupera (ida e volta)', () => {
  const lines = add(add([], doMorro, 2), { ...doMorro, color: null, size: 'M', unitCents: null })
  assert.deepEqual(parseStoredCart(serializeCart(lines)), lines)
})

test('estado inválido no localStorage não quebra', () => {
  for (const raw of [null, '', '{', 'null', '42', '[]', '{"v":2,"lines":[]}', '{"v":1,"lines":"x"}']) {
    assert.deepEqual(parseStoredCart(raw), [], String(raw))
  }
  const mixed = JSON.stringify({
    v: 1,
    lines: [
      { ...doMorro, qty: 1 },
      { ...doMorro, qty: -4 },
      { ...doMorro, qty: 1, unitCents: 12.5 },
      { ...doMorro, qty: 1, version: 'gigante' },
      { ...doMorro, qty: 'dois' },
      null,
      'lixo',
      { ...doMorro, qty: 2 }, // duplicata: soma
    ],
  })
  const parsed = parseStoredCart(mixed)
  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].qty, 3)
})

test('revalida contra o catálogo: atualiza preço e remove o que deixou de existir', () => {
  let lines = add([], doMorro, 2)
  lines = add(lines, { ...doMorro, productId: 'p-esgotado' })
  lines = add(lines, { ...doMorro, size: 'XXG' })
  const catalog: Record<string, { available: boolean; priceCents: number | null; sizes: string[]; colors: string[]; name: string }> = {
    'p-do-morro': { available: true, priceCents: 11900, sizes: ['P', 'M', 'G', 'GG'], colors: ['Preta', 'Off white'], name: 'Camiseta VM Do Morro' },
    'p-esgotado': { available: false, priceCents: 9900, sizes: ['G'], colors: ['Preta'], name: 'x' },
  }
  const out = reconcileCart(lines, (id) => catalog[id])
  assert.equal(out.length, 1)
  assert.equal(out[0].unitCents, 11900)
  assert.equal(out[0].qty, 2)
  // nada mudou → mesma referência (evita re-renderização e regravação)
  assert.equal(reconcileCart(out, (id) => catalog[id]), out)
})

test('revalida a foto: caminho que deixou de existir após nova sincronização é trocado', () => {
  const lines = add([], { ...doMorro, image: 'catalog/x/antiga-480.webp' })
  const p = {
    available: true,
    priceCents: 12900,
    sizes: ['G'],
    colors: ['Preta'],
    name: 'Camiseta VM Do Morro',
    images: ['catalog/x/nova-480.webp', 'catalog/x/nova-720.webp'],
    image: 'catalog/x/nova-480.webp',
  }
  assert.equal(reconcileCart(lines, () => p)[0].image, 'catalog/x/nova-480.webp')
  const ok = add([], { ...doMorro, image: 'catalog/x/nova-720.webp' })
  assert.equal(reconcileCart(ok, () => p), ok)
})
