import type { ReactNode } from 'react'

/** Etiqueta de seção no estilo ficha de catálogo: "01 — Vitrine". */
export function SectionLabel({ index, children, className = '' }: { index: string; children: ReactNode; className?: string }) {
  return (
    <p className={`label flex items-center gap-3 ${className}`}>
      <span className="tabular-nums">{index}</span>
      <span aria-hidden="true" className="h-px w-8 bg-current opacity-50" />
      <span>{children}</span>
    </p>
  )
}
