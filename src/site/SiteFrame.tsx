import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useNavigationType, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { getStillEdition, stillEditionStorageKey } from '../designs/still/editions'
import config from '../data/config.json'
// The adaptation playground offers these faces in its Edit tool. They load only when used.
import '../designs/typography/fonts.css'
import './site.css'

export type SitePage = 'home' | 'publications' | 'blog' | 'about' | 'cv'
export type SiteEdition = 'paper' | 'black'

const SiteTheme = createContext<{
  edition: SiteEdition
  toggleEdition: () => void
  href: (path: string) => string
}>({ edition: 'paper', toggleEdition: () => {}, href: path => path })

export const useSiteTheme = () => useContext(SiteTheme)
const positions = new Map<string, number>()

/* The document root carries the appearance. A page hands it to the next one,
   or to the loading frame, in the same commit, so the root never falls back to
   the archived studies' black default between two site pages. */
let appearanceHolders = 0
function holdAppearance(edition: SiteEdition) {
  const root = document.documentElement
  const color = edition === 'black' ? '#000000' : '#ffffff'
  appearanceHolders += 1
  root.dataset.siteEdition = edition
  root.style.setProperty('--paper', color)
  root.style.backgroundColor = color
  root.style.colorScheme = edition === 'black' ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
  return () => {
    appearanceHolders -= 1
    setTimeout(() => {
      if (appearanceHolders > 0) return
      delete root.dataset.siteEdition
      root.style.removeProperty('--paper')
      root.style.removeProperty('background-color')
      root.style.removeProperty('color-scheme')
    }, 0)
  }
}

const links: { page: SitePage, label: string, path: string }[] = [
  { page: 'publications', label: 'Papers', path: '/publications' },
  { page: 'blog', label: 'Writing', path: '/blog/' },
  { page: 'about', label: 'About', path: '/about' },
  { page: 'cv', label: 'CV', path: '/cv' },
]

export function sitePageForPath(pathname: string): SitePage {
  if (pathname.startsWith('/publications')) return 'publications'
  if (pathname.startsWith('/blog')) return 'blog'
  if (pathname.startsWith('/about') || pathname.startsWith('/photography')) return 'about'
  if (pathname.startsWith('/cv')) return 'cv'
  return 'home'
}

export default function SiteFrame({ children, page, mainId = 'site-main', initialAnchor, loading = false, nameAnchor }: {
  children: ReactNode
  page: SitePage
  mainId?: string
  initialAnchor?: string
  /** The id of a large name on the page. The header shows its own name only after that one scrolls away. */
  nameAnchor?: string
  /** The frame shown while a page's code loads. It leaves scrolling to the page that follows. */
  loading?: boolean
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const [params] = useSearchParams()
  const reduced = useReducedMotion()
  const [edition, setEdition] = useState<SiteEdition>(() => {
    const requested = getStillEdition(params.get('edition'))
    if (requested) return requested.id
    try { return getStillEdition(localStorage.getItem(stillEditionStorageKey))?.id ?? 'paper' }
    catch { return 'paper' }
  })
  const scrollPosition = useRef(0)
  const previousHash = useRef(location.hash)
  const [scrolled, setScrolled] = useState(false)
  const [nameAway, setNameAway] = useState(!nameAnchor)

  useEffect(() => {
    const requested = getStillEdition(params.get('edition'))
    if (requested) setEdition(requested.id)
  }, [params])

  useLayoutEffect(() => holdAppearance(edition), [edition])

  useEffect(() => {
    const update = () => {
      scrollPosition.current = window.scrollY
      setScrolled(window.scrollY > 8)
      const name = nameAnchor ? document.getElementById(nameAnchor) : null
      const header = document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0
      setNameAway(!name || name.getBoundingClientRect().bottom < header)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [nameAnchor])

  useEffect(() => {
    if (loading) return
    const path = location.pathname
    let cancelled = false
    let target = initialAnchor
    if (location.hash) {
      try { target = decodeURIComponent(location.hash.slice(1)) }
      catch { target = location.hash.slice(1) }
    }
    if (page === 'home' && target === 'contact') target = 'site-contact'
    if (page === 'home' && target === 'blog') target = 'writing'
    const apply = () => {
      if (cancelled) return
      if (target) document.getElementById(target)?.scrollIntoView({ behavior: 'instant', block: 'start' })
      else window.scrollTo({ top: navigationType === 'POP' ? positions.get(path) ?? 0 : 0, behavior: 'instant' })
    }
    const stop = () => { cancelled = true }
    const frame = requestAnimationFrame(apply)
    if (target) void document.fonts?.ready.then(apply)
    window.addEventListener('wheel', stop, { once: true, passive: true })
    window.addEventListener('touchstart', stop, { once: true, passive: true })
    window.addEventListener('pointerdown', stop, { once: true, passive: true })
    window.addEventListener('keydown', stop, { once: true })
    return () => {
      positions.set(path, scrollPosition.current)
      cancelled = true
      cancelAnimationFrame(frame)
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchstart', stop)
      window.removeEventListener('pointerdown', stop)
      window.removeEventListener('keydown', stop)
    }
    // Search/appearance changes keep the current reading position.
  }, [location.pathname, initialAnchor, loading])

  useEffect(() => {
    if (previousHash.current === location.hash) return
    previousHash.current = location.hash
    if (!location.hash || loading) return
    let id: string
    try { id = decodeURIComponent(location.hash.slice(1)) }
    catch { id = location.hash.slice(1) }
    if (page === 'home' && id === 'contact') id = 'site-contact'
    if (page === 'home' && id === 'blog') id = 'writing'
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' }))
    return () => cancelAnimationFrame(frame)
  }, [location.hash, page, reduced, loading])

  const href = useCallback((path: string) => {
    const target = new URL(path, 'https://ndrsn0208.github.io')
    target.searchParams.set('edition', edition)
    return `${target.pathname}${target.search}${target.hash}`
  }, [edition])

  const toggleEdition = () => {
    const next = edition === 'paper' ? 'black' : 'paper'
    setEdition(next)
    try { localStorage.setItem(stillEditionStorageKey, next) } catch { /* Appearance works without storage. */ }
    const search = new URLSearchParams(params)
    search.set('edition', next)
    navigate({ pathname: location.pathname, search: `?${search}`, hash: location.hash }, { replace: true, preventScrollReset: true })
  }

  return <SiteTheme.Provider value={{ edition, toggleEdition, href }}>
    <div className="site-shell" data-edition={edition} data-page={page}>
      <a className="site-skip" href={`#${mainId}`}>Skip to content</a>
      <header className="site-header" data-scrolled={scrolled || undefined}>
        <div className="site-header-inner site-container">
          <Link className="site-name" data-away={nameAway ? undefined : 'false'} to={href('/')} aria-label={config.name} aria-current={page === 'home' && location.pathname === '/' ? 'page' : undefined}>
            {config.name.split(' ')[0]}<span className="site-name-rest"> {config.name.split(' ').slice(1).join(' ')}</span>
          </Link>
          <div className="site-header-actions">
            <nav aria-label="Main navigation" className="site-nav">
              {links.map(link => <Link key={link.page} to={href(link.path)} aria-current={page === link.page ? 'page' : undefined}>
                {page === link.page && <motion.span className="site-nav-point" layoutId="site-navigation" transition={{ duration: reduced ? 0 : .32, ease: [.2, .7, .2, 1] }} />}
                {link.label}
              </Link>)}
            </nav>
            <button className="site-appearance" data-adapt-key="appearance" onClick={toggleEdition} type="button" aria-label={`Switch to ${edition === 'paper' ? 'Black' : 'White'} appearance`} title={`Switch to ${edition === 'paper' ? 'Black' : 'White'} appearance`}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M12 3.6a8.4 8.4 0 0 1 0 16.8Z" fill="currentColor" /></svg>
            </button>
          </div>
        </div>
      </header>
      {children}
      <footer className="site-footer site-container" id="site-contact">
        <a className="site-footer-email" href={`mailto:${config.contacts.email}`}>{config.contacts.email}</a>
        <nav aria-label="Professional profiles">
          <a href={config.contacts.googleScholar} target="_blank" rel="noreferrer">Google Scholar</a>
          <a href={config.contacts.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
          <a href="https://github.com/ndrsn0208" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </footer>
    </div>
  </SiteTheme.Provider>
}

/** Shown while a page's code loads. The header stays in place and the paper keeps its color. */
export function SiteLoading() {
  const { pathname } = useLocation()
  const page = sitePageForPath(pathname)
  return <SiteFrame page={page} mainId="site-loading" loading>
    <main id="site-loading" className="site-loading" aria-busy="true" />
  </SiteFrame>
}
