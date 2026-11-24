import type { CSSProperties } from 'react'
import { motion, type MotionValue } from 'motion/react'
import type { ProductImage } from '../data/types'
import { asset, srcAtLeast, srcSet } from '../data/catalog'
import { HOOK, rigFor, type Rig } from '../data/rig'
import { Hanger } from './Hanger'

interface Props {
  image: ProductImage
  alt: string
  sizes: string
  /** slug do desenho, para ajustes finos do rig */
  slug?: string
  rig?: Rig
  priority?: boolean
  className?: string
  style?: CSSProperties
  /** exibe a sombra suave projetada abaixo da peça */
  shadow?: boolean
  /** 0–1: quanto a peça recebe menos luz (peças ao fundo da arara) */
  shade?: MotionValue<number> | number
  /**
   * 'hook' (padrão): gancho apoiado numa barra (arara).
   * 'cord': peça suspensa por uma corda que desce de cima e entra atrás da gola (Home).
   */
  suspension?: 'hook' | 'cord'
}

/**
 * Peça pendurada: gancho + foto oficial (fundo transparente), montados como um único objeto.
 *
 * A BORDA SUPERIOR deste elemento é a linha de apoio na arara, e o centro horizontal é o ponto de
 * contato do gancho — use `transform-origin: 50% 0` (classe `origin-top`) para girar/escalar o conjunto
 * em torno do gancho. O gancho é desenhado ATRÁS da foto: a haste some atrás da gola, como num cabide real.
 */
export function HangingGarment({
  image,
  alt,
  sizes,
  slug,
  rig: rigProp,
  priority,
  className = '',
  style,
  shadow = true,
  shade,
  suspension = 'hook',
}: Props) {
  const base = rigProp ?? rigFor(image, slug)
  // na corda não há gancho: a foto começa no ponto de apoio
  const rig = suspension === 'cord' ? { ...base, drop: 0 } : base
  const unit = rig.hookScale / HOOK.unitsPerWidth // 1 unidade do viewBox em frações da largura
  const imgRatio = image.height / image.width
  const pct = (v: number) => `${v * 100}%`

  return (
    <div className={`relative w-full select-none ${className}`} style={style}>
      {suspension === 'hook' && (
        <Hanger
          className="pointer-events-none absolute top-0 left-1/2"
          style={{
            width: pct(HOOK.viewW * unit),
            // leva o ponto de contato do SVG exatamente para (50%, 0) deste elemento
            transform: `translate(-50%, -${(HOOK.pivotY / HOOK.viewH) * 100}%)`,
          }}
        />
      )}
      <div aria-hidden="true" style={{ paddingTop: pct(rig.drop) }} />
      <div
        className="relative w-full"
        style={{
          aspectRatio: `${image.width} / ${image.height}`,
          // alinha a gola medida na foto ao eixo do gancho
          marginLeft: pct(0.5 - rig.neckX + rig.offsetX),
          marginTop: pct(-(rig.neckY * imgRatio) + rig.offsetY),
        }}
      >
        {suspension === 'cord' && (
          // Corda: sobe da gola até além do topo da seção (a seção a recorta na borda, sem ponta solta).
          // Fica atrás da foto e termina 3% abaixo do topo da gola, escondida pelo tecido.
          <span
            aria-hidden="true"
            className="pointer-events-none absolute w-[1.5px] -translate-x-1/2"
            style={{
              left: pct(rig.neckX),
              bottom: pct(1 - rig.neckY - 0.03),
              height: '160vh',
              background: 'linear-gradient(90deg, #6f6d68 0%, #cfccc5 45%, #8d8b86 100%)',
              boxShadow: '1px 0 2px rgb(0 0 0 / 0.45)',
            }}
          />
        )}
        {shadow && (
          <div
            aria-hidden="true"
            className="absolute right-[12%] -bottom-[7%] left-[12%] h-[12%] rounded-[50%] bg-black/50 blur-2xl"
          />
        )}
        {shade !== undefined && (
          // véu de luz: escurece só a peça (a máscara é a própria foto, contorno exato pelo canal alfa)
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              opacity: shade,
              background: 'linear-gradient(180deg, rgb(8 8 8 / 0.35), rgb(8 8 8 / 0.9))',
              maskImage: `url(${asset(srcAtLeast(image, 480))})`,
              WebkitMaskImage: `url(${asset(srcAtLeast(image, 480))})`,
              maskSize: '100% 100%',
              WebkitMaskSize: '100% 100%',
            }}
          />
        )}
        <img
          src={asset(srcAtLeast(image, 720))}
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
