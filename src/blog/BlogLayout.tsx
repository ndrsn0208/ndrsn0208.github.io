import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { getStillEdition, stillEditionStorageKey } from '../designs/still/editions'
import '../designs/typography/fonts.css'
import './blog.css'

type Edition = 'black' | 'paper'
const BlogTheme = createContext<Edition>('paper')
export const useBlogTheme = () => useContext(BlogTheme)

export function ArrowIcon({ direction = 'right' }: { direction?: 'right' | 'left' | 'up' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: `rotate(${direction === 'left' ? 180 : direction === 'up' ? -45 : 0}deg)` }}>
      <path d="M4 12h15m-6-6 6 6-6 6" />
    </svg>
  )
}

export function useBlogMetadata({ title, description, path, article = false }: {
  title: string
  description: string
  path: string
  article?: boolean
}) {
  useEffect(() => {
    const oldTitle = document.title
    document.title = title
    const changes: (() => void)[] = []
    const meta = (attribute: 'name' | 'property', name: string, content: string) => {
      const found = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`)
      const element = found ?? document.createElement('meta')
      const old = element.getAttribute('content')
      element.setAttribute(attribute, name)
      element.content = content
      if (!found) document.head.append(element)
      changes.push(() => {
        if (!found) element.remove()
        else if (old !== null) element.content = old
        else element.removeAttribute('content')
      })
    }
    const url = `https://ndrsn0208.github.io${path}`
    meta('name', 'description', description)
    meta('property', 'og:title', title)
    meta('property', 'og:description', description)
    meta('property', 'og:type', article ? 'article' : 'website')
    meta('property', 'og:url', url)
    meta('property', 'og:image', 'https://ndrsn0208.github.io/blog-assets/scol/social-card.png')
    meta('property', 'og:image:alt', 'Self-Consolidating Language Models. Writing context into model weights at test time.')
    meta('name', 'twitter:card', 'summary_large_image')
    const previousCanonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    const canonical = previousCanonical ?? document.createElement('link')
    const oldHref = canonical.getAttribute('href')
    canonical.rel = 'canonical'
    canonical.href = url
    if (!previousCanonical) document.head.append(canonical)
    return () => {
      document.title = oldTitle
      changes.forEach(restore => restore())
      if (!previousCanonical) canonical.remove()
      else if (oldHref !== null) canonical.setAttribute('href', oldHref)
    }
  }, [title, description, path, article])
}

export default function BlogLayout({ children }: { children: ReactNode }) {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const [edition, setEdition] = useState<Edition>(() => {
    const requested = getStillEdition(params.get('edition'))
    if (requested) return requested.id
    try { return getStillEdition(localStorage.getItem(stillEditionStorageKey))?.id ?? 'paper' }
    catch { return 'paper' }
  })

  useEffect(() => {
    const requested = getStillEdition(params.get('edition'))
    if (requested) setEdition(requested.id)
  }, [params])

  useLayoutEffect(() => {
    const root = document.documentElement
    const background = edition === 'black' ? '#000000' : '#f5f1e8'
    root.dataset.blogEdition = edition
    root.style.setProperty('--paper', background)
    root.style.backgroundColor = background
    root.style.colorScheme = edition === 'black' ? 'dark' : 'light'
    document.body.style.backgroundColor = background
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background)
    return () => {
      delete root.dataset.blogEdition
      root.style.removeProperty('--paper')
      root.style.removeProperty('background-color')
      root.style.removeProperty('color-scheme')
      document.body.style.removeProperty('background-color')
    }
  }, [edition])

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    const frame = requestAnimationFrame(() => {
      const id = decodeURIComponent(location.hash.slice(1))
      document.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
    })
    return () => cancelAnimationFrame(frame)
  }, [location.pathname])

  const changeEdition = () => {
    const next = edition === 'paper' ? 'black' : 'paper'
    setEdition(next)
    try { localStorage.setItem(stillEditionStorageKey, next) } catch { /* Reading does not depend on storage. */ }
    const nextParams = new URLSearchParams(params)
    nextParams.set('edition', next)
    navigate({ pathname: location.pathname, search: `?${nextParams}`, hash: window.location.hash }, { replace: true, preventScrollReset: true })
  }

  return (
    <BlogTheme.Provider value={edition}>
      <div className="scol-blog" data-edition={edition}>
        <a className="scol-skip" href="#blog-main">Skip to article</a>
        <header className="scol-masthead">
          <div className="scol-masthead-inner">
            <Link to={`/?edition=${edition}`} className="scol-home-link"><ArrowIcon direction="left" /><span>Zekun Wang</span></Link>
            <span className="scol-masthead-label">Research notes</span>
            <nav aria-label="Blog navigation">
              <Link to={`/blog?edition=${edition}`} aria-current={location.pathname.replace(/\/$/, '') === '/blog' ? 'page' : undefined}>Blog</Link>
              <motion.button
                type="button"
                className="scol-appearance"
                onClick={changeEdition}
                aria-label={`Switch to ${edition === 'black' ? 'Paper' : 'Black'} appearance`}
                title={edition === 'black' ? 'Paper appearance' : 'Black appearance'}
                whileTap={reduce ? undefined : { scale: 0.9 }}
              >
                {edition === 'black'
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M19.7 14.8A8.2 8.2 0 0 1 9.2 4.3 8.2 8.2 0 1 0 19.7 14.8Z" /></svg>}
              </motion.button>
            </nav>
          </div>
        </header>
        {children}
        <footer className="scol-site-footer">
          <Link to={`/?edition=${edition}`}>Zekun Wang</Link>
          <span>Georgia Institute of Technology</span>
          <a href="mailto:zekun@gatech.edu">Get in touch <ArrowIcon direction="up" /></a>
        </footer>
      </div>
    </BlogTheme.Provider>
  )
}
