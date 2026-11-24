import { useId, type CSSProperties } from 'react'
import { HOOK } from '../data/rig'

/**
 * Gancho de cabide de arame (SVG). Só a parte que aparece numa peça pendurada de verdade:
 * a curva que abraça a barra, o anel de torção e a haste que desce até a gola.
 * Os braços do cabide ficam dentro da camiseta — e, como a foto é opaca, não são desenhados.
 *
 * viewBox 0 0 48 120 · ponto de contato com a barra em (24, 7.6) — ver HOOK em data/rig.ts.
 * A haste termina em y=120, abaixo do topo da gola, escondida atrás do tecido.
 */
export function Hanger({ className, style }: { className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg
      viewBox={`0 0 ${HOOK.viewW} ${HOOK.viewH}`}
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
      overflow="visible"
    >
      <defs>
        {/*
          aço escovado: luz vinda de cima/esquerda, como a luz da vitrine.
          userSpaceOnUse é obrigatório: a haste é uma linha vertical (caixa de largura zero) e um
          gradiente em objectBoundingBox não pinta nada nesse caso.
        */}
        <linearGradient id={`${id}-steel`} gradientUnits="userSpaceOnUse" x1="12" x2="35" y1="0" y2="0">
          <stop offset="0" stopColor="#f2f0ea" />
          <stop offset="0.35" stopColor="#b9b7b1" />
          <stop offset="0.7" stopColor="#6d6b67" />
          <stop offset="1" stopColor="#3a3936" />
        </linearGradient>
        <linearGradient id={`${id}-stem`} gradientUnits="userSpaceOnUse" x1="22.5" x2="25.5" y1="0" y2="0">
          <stop offset="0" stopColor="#d6d4ce" />
          <stop offset="0.5" stopColor="#99978f" />
          <stop offset="1" stopColor="#4a4946" />
        </linearGradient>
      </defs>
      {/* sombra de contato discreta sobre a barra */}
      <path
        d="M33 32 C33 17 29.5 6 24 6 C17.5 6 13.5 10.5 13.5 17"
        fill="none"
        stroke="rgba(0,0,0,0.55)"
        strokeWidth="3.4"
        strokeLinecap="round"
        transform="translate(0.9 1.4)"
      />
      {/* haste */}
      <path d="M24 120 V60" stroke={`url(#${id}-stem)`} strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* curva do gancho */}
      <path
        d="M24 56 C24 46 33 43 33 32 C33 17 29.5 6 24 6 C17.5 6 13.5 10.5 13.5 17 C13.5 19.6 14.5 21.6 16.1 22.6"
        fill="none"
        stroke={`url(#${id}-steel)`}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* reflexo especular no topo da curva */}
      <path
        d="M27.5 8.2 C25.8 7.1 22.6 7 20.6 8.4"
        fill="none"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      {/* anel de torção (onde o arame do gancho se enrola na haste) */}
      <rect x="20.6" y="52" width="6.8" height="12" rx="2.4" fill={`url(#${id}-steel)`} />
      <path d="M21 55.5 H27 M21 58.5 H27 M21 61.5 H27" stroke="rgba(0,0,0,0.35)" strokeWidth="0.7" />
    </svg>
  )
}
