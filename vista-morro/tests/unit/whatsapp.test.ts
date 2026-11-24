import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatBRL } from '../../src/commerce/money.ts'
import { buildOrderMessage, normalizePhone, whatsappUrl, type OrderLine } from '../../src/commerce/whatsapp.ts'

const PHONE = '5511990120825'

const a: OrderLine = { name: 'Camiseta VM Do Morro', version: 'regular', color: 'Preta', size: 'G', qty: 2, unitCents: 12900 }
const b: OrderLine = { name: 'Camiseta VM Kiss Me', version: 'plus', color: 'Off white', size: 'G2', qty: 1, unitCents: 12900 }

test('formata reais com centavos inteiros', () => {
  assert.equal(formatBRL(12900), 'R$ 129,00')
  assert.equal(formatBRL(5), 'R$ 0,05')
  assert.equal(formatBRL(123456789), 'R$ 1.234.567,89')
  assert.throws(() => formatBRL(1.5))
})

test('pedido completo com vários produtos', () => {
  const msg = buildOrderMessage([a, b])
  assert.equal(
    msg,
    [
      'Olá, Vista Morro! Gostaria de realizar um pedido pelo site.',
      '',
      '*MEU PEDIDO*',
      '',
      '*1. Camiseta VM Do Morro*',
      'Modelo: Regular',
      'Cor: Preta',
      'Tamanho: G',
      'Quantidade: 2',
      'Valor unitário: R$ 129,00',
      'Subtotal: R$ 258,00',
      '',
      '*2. Camiseta VM Kiss Me*',
      'Modelo: Plus Size',
      'Cor: Off white',
      'Tamanho: G2',
      'Quantidade: 1',
      'Valor unitário: R$ 129,00',
      'Subtotal: R$ 129,00',
      '',
      '*Quantidade total: 3 peças*',
      '',
      '*Total do pedido: R$ 387,00*',
      '',
      'Gostaria de confirmar a disponibilidade, o valor final, as opções de entrega e as formas de pagamento.',
    ].join('\n'),
  )
})

test('compra individual (Comprar agora)', () => {
  const msg = buildOrderMessage([{ ...a, qty: 1 }], { kind: 'peca' })
  assert.match(msg, /^Olá, Vista Morro! Quero comprar esta peça pelo site\./)
  assert.match(msg, /\*MINHA PEÇA\*/)
  assert.match(msg, /\*Quantidade total: 1 peça\*/)
  assert.match(msg, /\*Total do pedido: R\$ 129,00\*/)
})

test('produto sem cor publicada omite a linha de cor', () => {
  const msg = buildOrderMessage([{ ...a, color: null }])
  assert.doesNotMatch(msg, /Cor:/)
})

test('produtos sem preço: nada de total enganoso', () => {
  const semPreco: OrderLine = { ...b, unitCents: null }
  const misto = buildOrderMessage([a, semPreco])
  assert.match(misto, /Valor: a confirmar no atendimento/)
  assert.doesNotMatch(misto, /Total do pedido/)
  assert.match(misto, /\*Soma dos itens com valor informado: R\$ 258,00\*/)
  assert.match(misto, /O valor de 1 item será confirmado pelo atendimento/)

  const tudoSemPreco = buildOrderMessage([semPreco])
  assert.doesNotMatch(tudoSemPreco, /Total do pedido|Soma dos itens|R\$ 0,00/)
  assert.match(tudoSemPreco, /Os valores serão confirmados pelo atendimento\./)
})

test('pedido vazio não gera mensagem', () => {
  assert.throws(() => buildOrderMessage([]))
})

test('número de destino: somente dígitos, formato internacional', () => {
  assert.equal(normalizePhone('+55 (11) 99012-0825'), PHONE)
  assert.throws(() => normalizePhone('123'))
  assert.ok(whatsappUrl(PHONE, 'x').startsWith(`https://wa.me/${PHONE}?text=`))
})

test('codificação: acentos, quebras de linha, asteriscos e símbolos sobrevivem ida e volta', () => {
  const msg = buildOrderMessage([{ ...a, name: 'Camiseta VM Ação & Coração #1 + 50% ?' }, b])
  const url = whatsappUrl(PHONE, msg)
  const encoded = url.split('?text=')[1]
  assert.doesNotMatch(encoded, /[\s&#?\n]/, 'nada que quebre a URL fica sem codificar')
  assert.match(encoded, /%0A/, 'quebras de linha codificadas')
  assert.equal(decodeURIComponent(encoded), msg)
  assert.equal(new URL(url).searchParams.get('text'), msg)
})
