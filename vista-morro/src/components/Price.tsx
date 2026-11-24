import { formatBRL } from '../commerce/money'

/**
 * Preço publicado no catálogo. Sem preço → "Consulte o valor" (nunca R$ 0,00).
 * O preço anterior ("de") aparece riscado apenas quando é maior que o atual.
 */
export function Price({
  cents,
  compareAt,
  className = '',
}: {
  cents: number | null
  compareAt?: number | null
  className?: string
}) {
  if (cents === null) return <span className={`text-smoke ${className}`}>Consulte o valor</span>
  const showCompare = compareAt != null && compareAt > cents
  return (
    <span className={`price inline-flex flex-wrap items-baseline gap-x-2.5 ${className}`}>
      {showCompare && (
        <s className="text-[0.82em] font-medium text-smoke decoration-1">
          <span className="sr-only">De </span>
          {formatBRL(compareAt)}
        </s>
      )}
      <span>
        {showCompare && <span className="sr-only">por </span>}
        {formatBRL(cents)}
      </span>
    </span>
  )
}
