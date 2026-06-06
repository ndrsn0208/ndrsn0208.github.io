import ReactMarkdown from 'react-markdown'
import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'
import { config, publications } from '@/lib/publications'

const links = [
  { label: 'email',    href: (c: typeof config.contacts) => (c.email ? `mailto:${c.email}` : '#') },
  { label: 'scholar',  href: (c: typeof config.contacts) => c.googleScholar ?? '#' },
  { label: 'github',   href: (c: typeof config.contacts) => c.github ?? '#' },
  { label: 'twitter',  href: (c: typeof config.contacts) => c.twitter ?? '#' },
]

/* Paper count per interest — publications.json is static so compute once. */
const INTEREST_COUNT: Record<string, number> = (() => {
  const counts: Record<string, number> = {}
  for (const p of publications) {
    for (const t of p.tags) counts[t] = (counts[t] ?? 0) + 1
  }
  return counts
})()

/* Small monochrome window-chrome glyph: two hollow rings + one filled. */
function WinGlyph() {
  return (
    <span className="flex gap-1.5" aria-hidden>
      <span className="h-[9px] w-[9px] rounded-full border" style={{ borderColor: 'var(--border-strong)' }} />
      <span className="h-[9px] w-[9px] rounded-full border" style={{ borderColor: 'var(--border-strong)' }} />
      <span className="h-[9px] w-[9px] rounded-full bg-ink" />
    </span>
  )
}

export default function Hero() {
  const reduce = useReducedMotion()
  const [first, ...lastParts] = config.name.split(' ')
  const last = lastParts.join(' ')

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-18 md:pt-24 pb-10 md:pb-16">
      {/* kicker */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] uppercase tracking-[0.34em] text-ink-dim mb-6"
      >
        01 — about
      </motion.div>

      {/* name — both words solid white, terminal mono */}
      <h1 className="font-mono font-extrabold leading-[0.9] tracking-tightest text-[clamp(46px,9.4vw,108px)] text-ink">
        <motion.span
          className="inline"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {first} {last}
        </motion.span>
        <span className="inline-block w-[0.55ch] h-[0.86em] bg-ink ml-[0.12em] translate-y-[0.06em] blink" aria-hidden />
      </h1>

      <div className="mt-5 font-mono text-[12px] sm:text-[13px] uppercase tracking-[0.16em] text-ink-dim">
        PhD &nbsp;·&nbsp; <span className="text-ink">{abbrevAffiliation(config.affiliation)}</span> &nbsp;·&nbsp; advised by {shortAdvisor(config.advisor)}
      </div>

      {/* two card panels */}
      <div className="grid grid-cols-12 gap-4 md:gap-5 mt-9">
        {/* about.txt window */}
        <motion.div
          className="col-span-12 md:col-span-7"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="chrome overflow-hidden h-full">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b" style={{ borderColor: 'var(--border-soft)' }}>
              <WinGlyph />
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-dim">about.txt</span>
            </div>
            <div className="p-5 text-[14.5px] leading-relaxed text-ink/85">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                  strong: ({ children }) => <span className="font-semibold text-ink">{children}</span>,
                  a: ({ href, children }) => {
                    const h = href ?? '#'
                    const cls =
                      'text-ink underline underline-offset-4 decoration-1 decoration-white/40 hover:decoration-white transition'
                    if (h.startsWith('/')) {
                      return (
                        <Link to={h} className={cls}>
                          {children}
                        </Link>
                      )
                    }
                    return (
                      <a href={h} target="_blank" rel="noopener noreferrer" className={cls}>
                        {children}
                      </a>
                    )
                  },
                }}
              >
                {firstParagraph(config.bio)}
              </ReactMarkdown>
            </div>
          </div>
        </motion.div>

        {/* research directions — invert on hover */}
        <motion.div
          className="col-span-12 md:col-span-5"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="chrome overflow-hidden h-full">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b" style={{ borderColor: 'var(--border-soft)' }}>
              <WinGlyph />
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-dim">research</span>
              <span className="ml-auto font-mono text-[11px] text-ink-dim">{config.researchInterests.length}</span>
            </div>
            <div className="p-1.5">
              {config.researchInterests.map((tag) => {
                const count = INTEREST_COUNT[tag] ?? 0
                return (
                  <Link
                    key={tag}
                    to={`/publications?tag=${encodeURIComponent(tag)}`}
                    className="group flex items-center justify-between gap-3 px-3 py-2.5 rounded-[3px] transition-colors hover:bg-white"
                  >
                    <span className="font-mono text-[13.5px] text-ink/85 group-hover:text-black transition-colors">
                      <span className="text-ink-dim group-hover:text-black">›</span> {tag}
                    </span>
                    <span className="font-mono text-[11px] text-ink-dim group-hover:text-black transition-colors">
                      {String(count).padStart(2, '0')}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* contact row */}
      <div className="mt-8 flex items-center gap-2 flex-wrap">
        {links.map((l) => {
          const href = l.href(config.contacts)
          if (!href || href === '#') return null
          return (
            <a
              key={l.label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="btn-chrome px-3 sm:px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] flex items-center gap-2 text-ink"
            >
              {l.label === 'email' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              {l.label}
            </a>
          )
        })}
      </div>
    </section>
  )
}

function abbrevAffiliation(s: string): string {
  return s
    .replace(/Georgia Institute of Technology/i, 'Georgia Tech')
    .replace(/Massachusetts Institute of Technology/i, 'MIT')
    .replace(/University of California, Berkeley/i, 'UC Berkeley')
}

function shortAdvisor(s: string): string {
  const parts = s.trim().split(/\s+/)
  if (parts.length < 2) return s
  return `${parts[0][0]}. ${parts[parts.length - 1]}`
}

function firstParagraph(md: string): string {
  return md.split(/\n\s*\n/)[0]
}
