import { useMemo } from 'react'
import type { PaperGradient } from '@/types'
import {
  generateGradient,
  gradientBackground,
  highlightBackground,
  noiseBackground,
} from '@/lib/gradient'

interface Props {
  /** Paper id — used as the seed when no precomputed gradient is supplied. */
  id: string
  /** Tag list — feeds the color palette mix. */
  tags: string[]
  /** Optional precomputed gradient from publications.json. */
  gradient?: PaperGradient
  /** Children render on top of the foil (typically venue label + title). */
  children?: React.ReactNode
  className?: string
}

/* The signature visual element of the site. Each paper has its own
   conic-gradient + specular highlight + SVG noise overlay, derived
   deterministically from its id and tags. */
export default function PublicationGradient({
  id,
  tags,
  gradient,
  children,
  className,
}: Props) {
  const g = useMemo(() => gradient ?? generateGradient(id, tags), [id, tags, gradient])

  const bg = gradientBackground(g)
  const hi = highlightBackground(g)
  const noise = noiseBackground(g)

  return (
    <div
      className={`relative overflow-hidden ${className ?? ''}`}
      style={{ background: bg }}
    >
      <div className="foil-vignette" />
      <div className="foil-highlight" style={{ background: hi }} />
      <div
        className="foil-noise"
        style={{ backgroundImage: noise, opacity: g.noiseOpacity }}
      />
      {children}
    </div>
  )
}
