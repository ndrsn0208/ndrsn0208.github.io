import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useNavigationType, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { getStillEdition, stillEditionStorageKey } from '../designs/still/editions'
import config from '../data/config.json'
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

export default function SiteFrame({ children, page, mainId = 'site-main', initialAnchor }: {
  children: ReactNode
  page: SitePage
  mainId?: string
  initialAnchor?: string
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

  useEffect(() => {
    const requested = getStillEdition(params.get('edition'))
    if (requested) setEdition(requested.id)
  }, [params])

  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.siteEdition = edition
    root.style.setProperty('--paper', edition === 'black' ? '#000000' : '#f5f1e8')
    root.style.backgroundColor = edition === 'black' ? '#000000' : '#f5f1e8'
    root.style.colorScheme = edition === 'black' ? 'dark' : 'light'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', edition === 'black' ? '#000000' : '#f5f1e8')
    return () => {
      delete root.dataset.siteEdition
      root.style.removeProperty('--paper')
      root.style.removeProperty('background-color')
      root.style.removeProperty('color-scheme')
    }
  }, [edition])

  useEffect(() => {
    const update = () => {
      scrollPosition.current = window.scrollY
      setScrolled(window.scrollY > 16)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  useEffect(() => {
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
  }, [location.pathname, initialAnchor])

  useEffect(() => {
    if (previousHash.current === location.hash) return
    previousHash.current = location.hash
    if (!location.hash) return
    let id: string
    try { id = decodeURIComponent(location.hash.slice(1)) }
    catch { id = location.hash.slice(1) }
    if (page === 'home' && id === 'contact') id = 'site-contact'
    if (page === 'home' && id === 'blog') id = 'writing'
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' }))
    return () => cancelAnimationFrame(frame)
  }, [location.hash, page, reduced])

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

  const links: { page: SitePage, label: string, path: string }[] = [
    { page: 'home', label: 'Overview', path: '/' },
    { page: 'publications', label: 'Publications', path: '/publications' },
    { page: 'blog', label: 'Blog', path: '/blog/' },
    { page: 'about', label: 'About', path: '/about' },
    { page: 'cv', label: 'CV', path: '/cv' },
  ]

  return <SiteTheme.Provider value={{ edition, toggleEdition, href }}>
    <div className="site-shell" data-edition={edition} data-page={page}>
      <a className="site-skip" href={`#${mainId}`}>Skip to content</a>
      <header className="site-header" data-scrolled={scrolled || undefined}>
        <div className="site-header-inner site-container">
          <nav aria-label="Main navigation" className="site-nav">
            {links.map(link => <Link key={link.page} to={href(link.path)} aria-current={page === link.page ? 'page' : undefined}>
              {link.label}
              {page === link.page && <motion.span className="site-nav-line" layoutId="site-navigation" transition={{ duration: reduced ? 0 : .28 }} />}
            </Link>)}
          </nav>
          <div className="site-header-actions">
            <button className="site-appearance" data-adapt-key="appearance" onClick={toggleEdition} type="button" aria-label={`Switch to ${edition === 'paper' ? 'Black' : 'Paper'} appearance`} title={`Switch to ${edition === 'paper' ? 'Black' : 'Paper'} appearance`}>
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.25" /><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" /></svg>
            </button>
          </div>
        </div>
      </header>
      {children}
      <footer className="site-footer site-container" id="site-contact">
        <div className="site-footer-top">
          <a className="site-footer-email" href={`mailto:${config.contacts.email}`}>{config.contacts.email}</a>
        </div>
        <div className="site-footer-bottom">
          <Link to={href('/')} className="site-footer-name">Zekun Wang</Link>
          <nav aria-label="Professional profiles">
            <a href={config.contacts.googleScholar} target="_blank" rel="noreferrer">Google Scholar</a>
            <a href={config.contacts.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            <a href="https://github.com/ndrsn0208" target="_blank" rel="noreferrer">GitHub</a>
          </nav>
          <span className="site-footer-year">© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  </SiteTheme.Provider>
}
