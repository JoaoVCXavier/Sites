import { useId, type CSSProperties } from 'react'

/**
 * Cabide de metal desenhado em SVG. O gancho fica acima da gola; os ombros
 * ficam por trás da peça (como num cabide real, dentro da camiseta).
 * viewBox: 0 0 200 64 — o topo do gancho toca a arara em y≈2.
 */
export function Hanger({ className, style }: { className?: string; style?: CSSProperties }) {
  const gid = `vm-metal-${useId().replace(/:/g, '')}`
  return (
    <svg viewBox="0 0 200 64" className={className} style={style} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gid} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#d8d6d0" />
          <stop offset="0.45" stopColor="#8d8b86" />
          <stop offset="1" stopColor="#4a4946" />
        </linearGradient>
      </defs>
      <path
        d="M100 40 C100 30 100 26 104 22 C111 15 113 8 107 3.6 C101 -0.6 93 2 92.5 8.5"
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path
        d="M100 40 L22 60 Q14 62 18 63 L182 63 Q186 62 178 60 Z"
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="100" cy="40.5" r="3.2" fill="#6f6d69" />
    </svg>
  )
}
