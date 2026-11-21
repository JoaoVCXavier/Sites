import type { CSSProperties } from 'react'
import type { ProductImage } from '../data/types'
import { asset, srcSet } from '../data/catalog'
import { Hanger } from './Hanger'
import { HANGER } from './hangerGeometry'

interface Props {
  image: ProductImage
  alt: string
  sizes: string
  priority?: boolean
  className?: string
  style?: CSSProperties
  /** exibe a sombra suave projetada abaixo da peça */
  shadow?: boolean
}

/**
 * Peça pendurada: cabide + foto oficial (fundo transparente).
 * O ponto de giro natural (transform-origin) é o topo do gancho — use `origin-top`.
 */
export function HangingGarment({ image, alt, sizes, priority, className = '', style, shadow = true }: Props) {
  const hangerH = HANGER.heightRatio * 100 // em % da largura
  const overlap = hangerH * HANGER.overlap
  return (
    <div className={`relative w-full select-none ${className}`} style={style}>
      <div style={{ paddingTop: `${hangerH - overlap}%` }} aria-hidden="true" />
      <Hanger
        className="absolute top-0 left-1/2 -translate-x-1/2"
        style={{ width: `${HANGER.widthRatio * 100}%` }}
      />
      <div className="relative" style={{ aspectRatio: `${image.width} / ${image.height}` }}>
        {shadow && (
          <div
            aria-hidden="true"
            className="absolute -bottom-[6%] left-[8%] right-[8%] h-[14%] rounded-[50%] bg-black/45 blur-2xl"
          />
        )}
        <img
          src={asset(image.srcset['480'] ?? Object.values(image.srcset)[0])}
          srcSet={srcSet(image)}
          sizes={sizes}
          width={image.width}
          height={image.height}
          alt={alt}
          draggable={false}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          className="relative h-full w-full object-contain"
        />
      </div>
    </div>
  )
}
