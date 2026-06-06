import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Hero from '@/components/Hero'
import PublicationItem from '@/components/PublicationItem'
import { config, featuredPublications, publications } from '@/lib/publications'

export default function Home() {
  const featured = featuredPublications()
  return (
    <>
      <Hero />

      {/* Selected publications — title + blocks, no cards. */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 md:mt-10 pb-24 md:pb-32">
        <div className="flex items-baseline justify-between mb-5 gap-4 flex-wrap">
          <h2 className="font-mono text-[12px] uppercase tracking-[0.28em] text-ink-dim flex items-center gap-3">
            <span className="text-ink">02</span> — selected
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            <InlineSearch />
            <Link
              to="/publications"
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-dim hover:text-ink transition flex items-center gap-1.5 whitespace-nowrap"
            >
              all {publications.length} →
            </Link>
          </div>
        </div>

        <div className="border-t" style={{ borderColor: 'var(--border-soft)' }}>
          {featured.map((pub, i) => (
            <PublicationItem key={pub.id} pub={pub} index={i} />
          ))}
        </div>

        <footer className="mt-16 md:mt-20 font-mono text-[10px] uppercase tracking-[0.28em] text-ink-dim flex items-center gap-3">
          <span className="h-px w-8 bg-white/10" />
          <span>{config.name} · {new Date().getFullYear()}</span>
          <span className="h-px flex-1 bg-white/5" />
          <a
            href={config.contacts.email ? `mailto:${config.contacts.email}` : '#'}
            className="hover:text-ink transition"
          >
            {config.contacts.email}
          </a>
        </footer>
      </section>
    </>
  )
}

/* Compact search input shown next to the heading. Submitting navigates to
   /publications?q=… so the full search page handles matching. */
function InlineSearch() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        const v = q.trim()
        navigate(v ? `/publications?q=${encodeURIComponent(v)}` : '/publications')
      }}
      className="flex items-center gap-2 px-3 py-2 rounded-[6px]"
      style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--border-soft)' }}
    >
      <svg
        className="h-4 w-4 text-ink-dim shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="search papers…"
        type="search"
        autoComplete="off"
        spellCheck={false}
        className="bg-transparent outline-none text-[13px] font-mono placeholder:text-ink-dim/70 text-ink w-[180px] sm:w-[220px]"
      />
      <kbd className="hidden sm:inline font-mono text-[10px] text-ink-dim px-1.5 py-0.5 rounded border border-white/10">
        ↵
      </kbd>
    </form>
  )
}
