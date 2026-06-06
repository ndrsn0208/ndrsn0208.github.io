import { Link } from 'react-router-dom'
import type { Publication } from '@/types'

interface Props {
  pub: Publication
  /** 1-based index shown as the row number. */
  index?: number
}

/**
 * Monochrome publication row — title + blocks, no foil card.
 * Numbered, hairline-ruled, hover indents and reveals a → arrow.
 */
export default function PublicationItem({ pub, index = 0 }: Props) {
  const venueShort = pub.venue.split(' ').slice(0, -1).join(' ') || pub.venue
  return (
    <Link
      to={`/publications/${pub.id}`}
      className="group relative grid grid-cols-[40px_1fr] gap-5 py-5 px-2 border-b transition-[padding] duration-200 hover:pl-5"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <span className="font-mono text-[12px] text-ink-dim/70 pt-1 group-hover:text-ink transition-colors hidden sm:block">
        {String(index + 1).padStart(2, '0')}
      </span>

      <div className="min-w-0">
        <div className="flex items-center gap-3 font-mono text-[11px] text-ink-dim tracking-[0.06em] mb-2">
          <span className="text-ink font-bold">{pub.year}</span>
          <span className="px-1.5 py-0.5 rounded-[3px] border" style={{ borderColor: 'var(--border)' }}>
            {venueShort}
          </span>
          {pub.award && (
            <span className="px-1.5 py-0.5 rounded-[3px] bg-white text-black uppercase tracking-[0.12em] text-[10px]">
              {pub.award}
            </span>
          )}
        </div>

        <h3 className="font-mono text-[17px] sm:text-[18px] font-semibold leading-[1.32] tracking-tight text-ink/95 group-hover:text-white transition-colors max-w-[680px]">
          {pub.title}
        </h3>

        <div className="mt-2 font-mono text-[12.5px] text-ink-dim truncate">
          {abbreviateAuthors(pub.authors)}
        </div>

        <div className="mt-3 flex gap-2 flex-wrap">
          {pub.tags.map((t) => (
            <span key={t} className="font-mono text-[10px] uppercase tracking-[0.05em] text-ink-dim">
              [{t}]
            </span>
          ))}
        </div>
      </div>

      <span
        className="absolute right-2 top-5 font-mono text-[15px] text-white opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
        aria-hidden
      >
        →
      </span>
    </Link>
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
