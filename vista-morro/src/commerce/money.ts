/**
 * Valores monetários em centavos inteiros: nenhuma conta usa ponto flutuante.
 * A formatação é determinística (não depende do Intl do navegador) para que a
 * mensagem do WhatsApp seja idêntica em qualquer dispositivo.
 */

export function formatBRL(cents: number): string {
  if (!Number.isSafeInteger(cents)) throw new RangeError(`valor inválido em centavos: ${cents}`)
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  const reais = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const centavos = String(abs % 100).padStart(2, '0')
  return `${sign}R$ ${reais},${centavos}`
}

/** Multiplica preço unitário por quantidade; null se o preço não for conhecido. */
export function lineTotal(unitCents: number | null, qty: number): number | null {
  return unitCents === null ? null : unitCents * qty
}
