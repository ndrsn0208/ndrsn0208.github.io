import ReactMarkdown from 'react-markdown'
import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'
import { config, publications } from '@/lib/publications'

const links = [
  { label: 'email',    href: (c: typeof config.contacts) => (c.email ? `mailto:${c.email}` : '#') },
  { label: 'scholar',  href: (c: typeof config.contacts) => c.googleScholar ?? '#' },
  { label: 'github',   href: (c: typeof config.contacts) => c.github ?? '#' },
  { label: 'twitter',  href: (c: typeof config.contacts) => c.twitter ?? '#' },
  { label: 'semantic', href: (c: typeof config.contacts) => c.semanticScholar ?? '#' },
]

/* Per-tag tone class — defined in src/styles/globals.css. Each tone
   exposes a `--hue` custom property; the silver-metal default of
   `.interest-text` swaps to that hue (and starts shimmering) when the
   surrounding `.interest-link` is hovered. */
const INTEREST_TONE: Record<string, string> = {
  'continual learning':     'tone-rose',
  'compositionality':       'tone-purple',
  'language models':        'tone-blue',
  'reinforcement learning': 'tone-yellow',
  'concept learning':       'tone-orange',
  'diffusion models':       'tone-cyan',
}

/* Pre-compute paper count per interest — publications.json is static
   so we do this once at module load. */
const INTEREST_COUNT: Record<string, number> = (() => {
  const counts: Record<string, number> = {}
  for (const p of publications) {
    for (const t of p.tags) counts[t] = (counts[t] ?? 0) + 1
  }
  return counts
})()

export default function Hero() {
  const reduce = useReducedMotion()
  const [first, ...lastParts] = config.name.split(' ')
  const last = lastParts.join(' ')

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 md:pt-24 pb-12 md:pb-20 grid grid-cols-12 gap-6 md:gap-10 items-end">
      {/* LEFT — bio + research goal (the original layout) */}
      <div className="col-span-12 md:col-span-7">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.32em] text-ink-dim mb-6 md:mb-8 flex items-center gap-3 flex-wrap"
        >
          <span className="h-px w-8" style={{ background: 'linear-gradient(90deg, transparent, #FFA94D)' }} />
          <span>[ 01 / about ]</span>
          <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400">online</span>
        </motion.div>

        <h1 className="font-display font-bold leading-[0.95] tracking-tightest text-[52px] sm:text-[68px] md:text-[80px] lg:text-[92px]">
          <motion.span
            className="metal-text block"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {first}
          </motion.span>
          <motion.span
            className="iri-text block"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {last}.
          </motion.span>
        </h1>

        <div className="mt-5 sm:mt-6 font-mono text-[12px] sm:text-[13px] uppercase tracking-[0.18em] text-ink">
          PhD &nbsp;·&nbsp; {abbrevAffiliation(config.affiliation)} &nbsp;·&nbsp; advised by {shortAdvisor(config.advisor)}
        </div>

        <div className="mt-6 sm:mt-7 text-[15px] sm:text-[17px] text-ink/85 max-w-xl leading-relaxed">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
              strong: ({ children }) => <span className="font-medium text-ink">{children}</span>,
              // Internal /publications/... links use React Router Link so
              // navigation stays SPA-fast; external links open in a new tab.
              a: ({ href, children }) => {
                const h = href ?? '#'
                if (h.startsWith('/')) {
                  return (
                    <Link
                      to={h}
                      className="text-orange-300/95 hover:text-orange-200 underline underline-offset-4 decoration-1 decoration-orange-300/40 hover:decoration-orange-300 transition"
                    >
                      {children}
                    </Link>
                  )
                }
                return (
                  <a
                    href={h}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-300/95 hover:text-orange-200 underline underline-offset-4 decoration-1 decoration-orange-300/40 hover:decoration-orange-300 transition"
                  >
                    {children}
                  </a>
                )
              },
            }}
          >
            {firstParagraph(config.bio)}
          </ReactMarkdown>
        </div>

        <div className="mt-7 md:mt-9 flex items-center gap-2 flex-wrap">
          {links.map((l, i) => {
            const href = l.href(config.contacts)
            if (!href || href === '#') return null
            return (
              <a
                key={l.label}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className={`btn-chrome rounded-xl px-3 sm:px-4 py-2 font-mono text-[11px] sm:text-[12px] uppercase tracking-[0.16em] flex items-center gap-2 text-ink ${
                  i >= 4 ? 'hidden sm:inline-flex' : ''
                }`}
              >
                {l.label === 'email' && <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />}
                {l.label}
              </a>
            )
          })}
        </div>
      </div>

      {/* RIGHT — research directions panel (metallic, liquid-glass) */}
      <motion.div
        className="col-span-12 md:col-span-5"
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="chrome rounded-2xl p-5 sm:p-6 relative overflow-hidden">
          {/* faint warm sheen across the panel — anchors it visually with the foil cards */}
          <div
            className="pointer-events-none absolute -inset-1 opacity-30 blur-3xl"
            style={{
              background:
                'conic-gradient(from 110deg at 30% 20%, rgba(255,107,107,.18), rgba(196,181,253,.16), rgba(255,169,77,.18), rgba(34,211,238,.14), rgba(255,107,107,.18))',
            }}
          />
          <div className="relative">
            <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-ink-dim mb-4 flex items-center gap-3">
              <span>research directions</span>
              <span className="h-px flex-1 bg-white/15" />
              <span className="text-ink-dim">{config.researchInterests.length}</span>
            </div>

            <ul className="space-y-1">
              {config.researchInterests.map((tag, i) => {
                const tone = INTEREST_TONE[tag] ?? 'tone-rose'
                const count = INTEREST_COUNT[tag] ?? 0
                return (
                  <motion.li
                    key={tag}
                    initial={reduce ? false : { opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: reduce ? 0 : 0.22 + i * 0.05,
                      ease: [0.2, 0.8, 0.2, 1],
                    }}
                  >
                    <Link
                      to={`/publications?tag=${encodeURIComponent(tag)}`}
                      className={`interest-link group ${tone} flex items-baseline justify-between gap-3 py-1 transition-transform hover:translate-x-1`}
                    >
                      <span className="interest-text font-display font-bold tracking-tightest text-[24px] sm:text-[28px] md:text-[30px] lg:text-[34px] leading-[1.1]">
                        {tag}
                      </span>
                      <span className="font-mono text-[11px] tracking-[0.2em] text-ink-dim flex items-baseline gap-2 shrink-0">
                        <span className="opacity-60">·{String(count).padStart(2, '0')}</span>
                        <span
                          className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                          aria-hidden
                        >
                          →
                        </span>
                      </span>
                    </Link>
                  </motion.li>
                )
              })}
            </ul>

            <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-ink-dim">
              <span>click → filter publications</span>
              <Link to="/publications" className="text-ink hover:text-warm-orange transition">
                all {publications.length} →
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
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
