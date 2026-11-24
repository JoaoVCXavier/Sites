import { Minus, Plus } from 'lucide-react'
import { MAX_QTY } from '../commerce/cart'

/** Controle de quantidade: inteiros entre `min` e o limite por item da sacola. */
export function Stepper({
  value,
  onChange,
  labelledBy,
  label,
  min = 1,
  size = 'md',
}: {
  value: number
  onChange: (v: number) => void
  labelledBy?: string
  label?: string
  min?: number
  size?: 'sm' | 'md'
}) {
  const btn = size === 'sm' ? 'size-10' : 'size-12'
  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      aria-label={label}
      className="inline-flex items-center rounded-full border border-line"
    >
      <button
        type="button"
        // aria-disabled (e não disabled): o botão continua focável e o teclado não perde o lugar
        onClick={() => value > min && onChange(value - 1)}
        aria-disabled={value <= min}
        aria-label="Diminuir quantidade"
        className={`press grid ${btn} place-items-center rounded-full hover:bg-paper/10 aria-disabled:cursor-not-allowed aria-disabled:opacity-30`}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <output aria-live="polite" className="price min-w-8 text-center text-base">
        {value}
      </output>
      <button
        type="button"
        onClick={() => value < MAX_QTY && onChange(value + 1)}
        aria-disabled={value >= MAX_QTY}
        aria-label="Aumentar quantidade"
        className={`press grid ${btn} place-items-center rounded-full hover:bg-paper/10 aria-disabled:cursor-not-allowed aria-disabled:opacity-30`}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
