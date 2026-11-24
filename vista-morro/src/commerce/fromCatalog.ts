import type { CatalogProduct, Model, ProductImage, Version } from '../data/types'
import { srcAtLeast, whatsappNumber } from '../data/catalog'
import type { NewLine } from './cart.ts'
import { buildOrderMessage, whatsappUrl, type OrderLine } from './whatsapp.ts'

/** Converte a escolha feita no painel da peça numa linha da sacola. */
export function toCartLine(
  model: Model,
  product: CatalogProduct,
  version: Version,
  color: string | null,
  size: string,
  image: ProductImage,
): NewLine {
  return {
    productId: product.id,
    slug: model.slug,
    name: model.fullName,
    version,
    color,
    size,
    unitCents: product.priceCents,
    image: srcAtLeast(image, 240),
  }
}

/** Link do WhatsApp com a mensagem pronta, ou null se a loja não publicou um número. */
export function orderLink(lines: readonly OrderLine[], kind: 'pedido' | 'peca' = 'pedido'): string | null {
  if (!whatsappNumber || lines.length === 0) return null
  return whatsappUrl(whatsappNumber, buildOrderMessage(lines, { kind }))
}

/** Conversa sem pedido (dúvidas, peça indisponível). */
export function contactLink(text = 'Olá, Vista Morro! Vim pelo site.'): string | null {
  return whatsappNumber ? whatsappUrl(whatsappNumber, text) : null
}
