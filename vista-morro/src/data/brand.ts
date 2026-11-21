import { catalog } from './catalog'

/**
 * Informações institucionais — SOMENTE dados verificados.
 * Cada item indica a fonte. Não acrescente nada que não esteja publicado pela marca.
 */
export const brand = {
  name: 'Vista Morro',
  /** Assinatura no fim das descrições oficiais do catálogo. */
  signature: 'Da rua pra rua.',
  /** Primeira frase de todas as descrições oficiais do catálogo. */
  statement:
    'Nossas camisetas unem estilo e autenticidade para quem veste sua própria identidade, sem seguir padrões.',
  /** Texto impresso nas camisetas VM Urban (fotos oficiais). */
  descriptor: 'Brazilian Streetwear Brand',
  /** Frase impressa na estampa da camiseta VM Riqueza (fotos oficiais). */
  printQuote: { text: 'Minha riqueza nasce do improvável', source: 'Estampa VM Riqueza' },
  /** Especificações publicadas nas descrições do catálogo. */
  craft: [
    { label: 'Modelagem', value: 'Oversized' },
    { label: 'Composição', value: '100% algodão' },
    { label: 'Malha penteada', value: '180 g · fio 26.1' },
    { label: 'Suedine (linha Authentic)', value: '240 g · fio 30.1 penteado' },
  ],
  links: {
    instagram: { href: 'https://www.instagram.com/vistamorro/', handle: '@vistamorro' },
    catalog: { href: catalog.source, label: 'meucatalogo.app/vistamorro' },
    whatsapp: catalog.store.whatsapp
      ? {
          href: `https://wa.me/${catalog.store.whatsapp}`,
          label: formatPhone(catalog.store.whatsapp),
        }
      : null,
  },
} as const

function formatPhone(n: string) {
  // 5511990120825 → +55 11 99012-0825
  const m = n.match(/^(\d{2})(\d{2})(\d{4,5})(\d{4})$/)
  return m ? `+${m[1]} ${m[2]} ${m[3]}-${m[4]}` : `+${n}`
}

export const nav = [
  { href: '#vitrine', label: 'Vitrine' },
  { href: '#colecoes', label: 'Coleções' },
  { href: '#lookbook', label: 'Lookbook' },
  { href: '#sobre', label: 'Sobre' },
  { href: '#contato', label: 'Contato' },
] as const
