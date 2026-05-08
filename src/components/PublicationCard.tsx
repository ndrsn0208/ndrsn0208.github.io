import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import type { Publication } from '@/types'
import PublicationGradient from './PublicationGradient'

interface Props {
  pub: Publication
  /** Card aspect — 'tall' (4:5 portrait) for grids, 'wide' (16:10) for featured rails. */
  aspect?: 'tall' | 'wide'
  /** Index for stagger / numbering. */
  index?: number
}

export default function PublicationCard({ pub, aspect = 'tall', index = 0 }: Props) {
  const reduce = useReducedMotion()
  const aspectClass = aspect === 'tall' ? 'aspect-[4/5]' : 'aspect-[16/10]'

  return (
    <motion.article
      layout
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduce ? 0 : 0.5,
        delay: reduce ? 0 : Math.min(index * 0.05, 0.4),
        ease: [0.2, 0.8, 0.2, 1],
      }}
      className="card-tilt chrome rounded-2xl overflow-hidden h-full flex flex-col"
    >
      <Link to={`/publications/${pub.id}`} className="flex-1 flex flex-col">
        {/* Gradient panel: venue label at top, paper title set in display
            type at the bottom. Title is smaller now per user — clearly
            smaller than the previous 22–26 px treatment. */}
        <PublicationGradient
          id={pub.id}
          tags={pub.tags}
          gradient={pub.gradient}
          className={aspectClass}
        >
          <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between foil-meta foil-text">
              <span className="flex items-center gap-2 flex-wrap">
                <span>
                  {pub.venue.split(' ').slice(0, -1).join(' ') || pub.venue} · {pub.year}
                </span>
                {pub.award && (
                  <span className="px-1.5 py-0.5 rounded-sm text-[10px] tracking-[0.14em] bg-white/15">
                    {pub.award}
                  </span>
                )}
              </span>
              <span>#{String(index + 1).padStart(2, '0')}</span>
            </div>
            <h3 className="font-display foil-text font-semibold text-[22px] sm:text-[24px] lg:text-[26px] leading-[1.05] tracking-tightest line-clamp-4">
              {pub.title}
            </h3>
          </div>
        </PublicationGradient>

        {/* Body: authors + AI tldr + tags. */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col">
          <div className="text-[13px] font-mono text-ink truncate">
            {abbreviateAuthors(pub.authors)}
          </div>
          <p className="mt-2 text-[13px] text-ink-dim leading-relaxed line-clamp-3">
            {pub.tldr}
          </p>
          <div className="mt-auto pt-3 flex gap-1.5 flex-wrap">
            {pub.tags.map((t) => (
              <span
                key={t}
                className="font-mono text-[10px] uppercase tracking-wider text-ink-dim px-2 py-0.5 rounded-sm border border-white/10"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

function abbreviateAuthors(authors: string[]): string {
  const abbreviated = authors.map((a) => {
    const parts = a.trim().split(/\s+/)
    if (parts.length < 2) return a
    const last = parts[parts.length - 1]
    const initials = parts.slice(0, -1).map((p) => `${p[0]}.`).join(' ')
    return `${initials} ${last}`
  })
  return abbreviated.join(', ')
}
