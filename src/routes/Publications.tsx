import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { featuredPublications, publications } from '@/lib/publications'
import type { Publication } from '@/types'

const pad = (n: number) => (n < 10 ? '0' : '') + n
const venueShort = (venue: string) => venue.replace(/\s*\d{4}\s*$/, '').trim()

function PubRow({ p, index }: { p: Publication; index: number }) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()

  const links: { label: string; href: string }[] = []
  if (p.arxivUrl) links.push({ label: 'arXiv ↗', href: p.arxivUrl })
  if (p.arxivHtmlAvailable && p.arxivHtmlUrl) links.push({ label: 'HTML ↗', href: p.arxivHtmlUrl })
  if (p.pdfUrl) links.push({ label: 'PDF ↗', href: p.pdfUrl })
  if (p.scholarUrl) links.push({ label: 'Scholar ↗', href: p.scholarUrl })

  const authors = p.authors.join(', ')

  return (
    <>
      <div
        className="workrow"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label={`${p.title}, ${p.venue}. ${open ? 'Collapse' : 'Expand'} details.`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((o) => !o)
          }
        }}
      >
        <div className="w-idx">
          <span className="n">{pad(index + 1)}</span>
        </div>
        <div className="w-title">
          <h3>{p.title}</h3>
          {authors && <span className="authors">{authors}</span>}
        </div>
        <div className="w-venue">
          <div className="v">{venueShort(p.venue)}</div>
          <div className="y">{p.year}</div>
          {p.award && <span className="award">{p.award}</span>}
        </div>
        <div className="w-arrow">
          <span className="k">
            {open ? 'Close' : 'Details'} <span className="glyph" aria-hidden>+</span>
          </span>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="workdetail"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="workdetail-inner">
              <div className="workdetail-abs">
                <p>{p.summary || p.tldr}</p>
              </div>
              <div className="workdetail-side">
                {p.tags.length > 0 && (
                  <div className="workdetail-tags">
                    {p.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                )}
                {links.length > 0 && (
                  <div className="workdetail-links">
                    {links.map((l) => (
                      <a
                        key={l.label}
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {l.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default function Publications() {
  const [params] = useSearchParams()
  const tag = params.get('tag')

  // Featured first, then the rest newest-first.
  const featured = featuredPublications()
  const featuredIds = new Set(featured.map((p) => p.id))
  const rest = publications
    .filter((p) => !featuredIds.has(p.id))
    .sort((a, b) => b.year - a.year || b.addedAt.localeCompare(a.addedAt))
  let ordered = [...featured, ...rest]
  if (tag) ordered = ordered.filter((p) => p.tags.includes(tag))

  return (
    <section id="work" aria-labelledby="work-h">
      <div className="page-band reveal" data-d="1">
        <div className="cell band-idx">
          <div className="idx">02</div>
        </div>
        <div className="cell band-title">
          <h2 id="work-h">Publications</h2>
        </div>
        <div className="cell band-sub">
          {tag ? (
            <p>
              Tagged <span style={{ color: 'var(--red)' }}>{tag}</span> · {ordered.length} paper
              {ordered.length === 1 ? '' : 's'} ·{' '}
              <Link to="/publications" style={{ borderBottom: '2px solid var(--red)' }}>
                clear ✕
              </Link>
            </p>
          ) : (
            <p>{ordered.length} papers · click a row for the abstract and links</p>
          )}
        </div>
      </div>

      {ordered.length > 0 ? (
        <div className="works reveal" data-d="2">
          {ordered.map((p, i) => (
            <PubRow key={p.id} p={p} index={i} />
          ))}
        </div>
      ) : (
        <div
          className="reveal"
          data-d="2"
          style={{
            padding: '40px 14px 48px',
            borderBottom: '2px solid var(--ink)',
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          No publications tagged <strong style={{ color: 'var(--red)' }}>{tag}</strong> yet.{' '}
          <Link to="/publications" style={{ borderBottom: '2px solid var(--red)' }}>
            See all publications →
          </Link>
        </div>
      )}
    </section>
  )
}
