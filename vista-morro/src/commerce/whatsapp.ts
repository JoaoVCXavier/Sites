/**
 * Mensagem de pedido para o WhatsApp — função única e testável.
 * Formatação do WhatsApp: *texto* = negrito. Nenhum dado pessoal do cliente é pedido ou incluído.
 */
import { cartTotals, type CartLine } from './cart.ts'
import { formatBRL, lineTotal } from './money.ts'

export type OrderLine = Pick<CartLine, 'name' | 'version' | 'color' | 'size' | 'qty' | 'unitCents'>

const VERSION_LABEL: Record<OrderLine['version'], string> = { regular: 'Regular', plus: 'Plus Size' }

const pecas = (n: number) => `${n} ${n === 1 ? 'peça' : 'peças'}`

export interface OrderMessageOptions {
  /** "pedido" = sacola completa; "peca" = compra direta de uma peça (Comprar agora) */
  kind?: 'pedido' | 'peca'
}

export function buildOrderMessage(lines: readonly OrderLine[], { kind = 'pedido' }: OrderMessageOptions = {}): string {
  if (lines.length === 0) throw new Error('pedido vazio')
  const totals = cartTotals(lines)
  const out: string[] = []

  out.push(
    kind === 'peca'
      ? 'Olá, Vista Morro! Quero comprar esta peça pelo site.'
      : 'Olá, Vista Morro! Gostaria de realizar um pedido pelo site.',
    '',
    kind === 'peca' ? '*MINHA PEÇA*' : '*MEU PEDIDO*',
  )

  lines.forEach((l, i) => {
    const sub = lineTotal(l.unitCents, l.qty)
    out.push('', `*${i + 1}. ${l.name}*`, `Modelo: ${VERSION_LABEL[l.version]}`)
    if (l.color) out.push(`Cor: ${l.color}`)
    out.push(`Tamanho: ${l.size}`, `Quantidade: ${l.qty}`)
    if (l.unitCents === null) out.push('Valor: a confirmar no atendimento')
    else out.push(`Valor unitário: ${formatBRL(l.unitCents)}`, `Subtotal: ${formatBRL(sub as number)}`)
  })

  out.push('', `*Quantidade total: ${pecas(totals.units)}*`)

  if (totals.complete) {
    out.push('', `*Total do pedido: ${formatBRL(totals.knownCents)}*`)
  } else {
    const n = totals.unpricedLines
    if (totals.knownCents > 0) out.push('', `*Soma dos itens com valor informado: ${formatBRL(totals.knownCents)}*`)
    out.push(
      '',
      n === lines.length
        ? 'Os valores serão confirmados pelo atendimento.'
        : `${n === 1 ? 'O valor de 1 item será confirmado' : `Os valores de ${n} itens serão confirmados`} pelo atendimento; o total final será informado na conversa.`,
    )
  }

  out.push('', 'Gostaria de confirmar a disponibilidade, o valor final, as opções de entrega e as formas de pagamento.')
  return out.join('\n')
}

/** Número no formato internacional, somente dígitos (ex.: 5511990120825). */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (!/^\d{10,15}$/.test(digits)) throw new Error(`número de WhatsApp inválido: ${phone}`)
  return digits
}

export const whatsappUrl = (phone: string, message: string) =>
  `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`
