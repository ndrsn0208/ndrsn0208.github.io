import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ThemeToggle from './ThemeToggle'

const links = [
  { to: '/', label: 'about' },
  { to: '/publications', label: 'publications' },
  { to: '/blog', label: 'blog' },
  { to: '/photography', label: 'photography' },
]

export default function Nav() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  // ⌘K opens search (focuses the search input on the publications page).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        navigate('/publications')
        // small delay so the route mounts before we try to focus
        setTimeout(() => {
          const el = document.getElementById('search-input') as HTMLInputElement | null
          el?.focus()
        }, 50)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  return (
    <nav
      className="sticky top-0 z-40 backdrop-blur-md"
      style={{
        background:
          'linear-gradient(180deg, var(--surface-solid-1) 0%, var(--surface-solid-2) 100%)',
        borderBottom: '1px solid var(--border-soft)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2.5">
          <span
            className="inline-block h-6 w-6 rounded-sm"
            style={{
              background:
                'conic-gradient(from 110deg, #FF6B6B, #FFA94D, #C4B5FD, #FF6B6B)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.2)',
            }}
          />
          <span className="font-mono text-[12px] uppercase tracking-wider-4 font-medium text-ink">
            zekun.wang
          </span>
        </NavLink>

        <div className="hidden md:flex items-center gap-8 text-[13px] font-medium font-mono">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}>
              {({ isActive }) => (
                <span className="nav-link" data-active={isActive || undefined}>
                  {l.label}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim hidden lg:block">
            v.1.0 · 2026
          </span>
          <ThemeToggle />
          <button
            onClick={() => {
              navigate('/publications')
              setTimeout(() => {
                const el = document.getElementById('search-input') as HTMLInputElement | null
                el?.focus()
              }, 50)
            }}
            className="btn-chrome rounded-xl px-2.5 py-1.5 font-mono text-[11px] flex items-center gap-1.5 text-ink"
            aria-label="Open search"
          >
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <span className="hidden sm:inline">⌘K</span>
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            className="md:hidden btn-chrome rounded-xl p-1.5 text-ink"
            aria-label="Menu"
            aria-expanded={open}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div
          className="md:hidden border-t"
          style={{
            borderColor: 'var(--border-soft)',
            background: 'rgb(var(--bg-rgb) / 0.95)',
          }}
        >
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `font-mono text-[13px] uppercase tracking-[0.2em] py-2 px-2 rounded-sm ${
                    isActive ? 'text-ink bg-white/5' : 'text-ink-dim'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
