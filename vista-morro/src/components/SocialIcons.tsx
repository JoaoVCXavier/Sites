import type { SVGProps } from 'react'

/*
 * Símbolos das redes, desenhados em traço único (monocromáticos, herdam `currentColor`).
 * O Lucide 1.x não traz mais ícones de marcas; estes seguem a mesma grade 24×24 e espessura de traço.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string }

const base = (size: IconProps['size']) => ({
  width: size ?? 24,
  height: size ?? 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  'aria-hidden': true,
  focusable: false,
})

/** Instagram: câmera (quadrado arredondado), lente e flash. */
export function InstagramIcon({ size, strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="5.25" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="17.4" cy="6.6" r="1.15" fill="currentColor" />
    </svg>
  )
}

/** WhatsApp: balão de conversa com o fone. */
export function WhatsAppIcon({ size, strokeWidth = 1.75, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path
        d="M12 2.9a9.1 9.1 0 0 0-7.86 13.68L2.9 21.1l4.64-1.2A9.1 9.1 0 1 0 12 2.9Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path
        d="M8.75 7.6c.2-.02.42-.02.6.02.17.05.3.26.4.48l.72 1.73c.06.17.04.36-.06.5l-.5.62c-.12.15-.14.36-.04.53.37.66.85 1.27 1.42 1.8.58.53 1.24.95 1.95 1.25.18.08.39.04.52-.1l.58-.64c.14-.15.36-.2.55-.12l1.73.8c.2.1.35.3.34.53-.03.65-.31 1.27-.82 1.65-.5.38-1.15.52-1.77.39-1.24-.27-2.46-.92-3.6-1.97-1.17-1.07-2.05-2.3-2.47-3.53-.2-.6-.13-1.27.2-1.8.27-.43.62-.77.89-.86Z"
        fill="currentColor"
      />
    </svg>
  )
}
