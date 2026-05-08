import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Hero from '@/components/Hero'
import PublicationCard from '@/components/PublicationCard'
import { config, featuredPublications, publications } from '@/lib/publications'

export default function Home() {
  const featured = featuredPublications()
  return (
    <>
      <Hero />

      <hr className="line max-w-6xl mx-auto" />

      {/* Featured — heading + inline search + 'all N' link in one row.
          (The research-interests grid moved into the Hero as large
          colored clickable display words.) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-12 md:mt-16 pb-24 md:pb-32">
        <div className="flex items-end justify-between mb-5 md:mb-6 gap-4 flex-wrap">
          <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
            <span className="metal-text">Featured</span>
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

        <div className="grid grid-cols-12 gap-4 sm:gap-5">
          {featured.map((pub, i) => (
            <div key={pub.id} className="col-span-12 sm:col-span-6 lg:col-span-3">
              <PublicationCard pub={pub} index={i} />
            </div>
          ))}
        </div>

        <footer className="mt-20 md:mt-24 font-mono text-[10px] uppercase tracking-[0.28em] text-ink-dim flex items-center gap-3">
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

/* Compact search input shown next to the Featured heading.
   Submitting navigates to /publications?q=… so the full search page handles
   matching. The home grid stays curated. */
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
      className="flex items-center gap-2 px-3 py-2 rounded-sm"
      style={{ background: 'rgba(0,0,0,.35)', border: '1px solid rgba(255,255,255,.06)' }}
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
