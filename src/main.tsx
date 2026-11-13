import { lazy, StrictMode, Suspense, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './styles/globals.css'
import AdaptGate from './adapt/AdaptGate'
import { SiteLoading } from './site/SiteFrame'

const pages = {
  home: () => import('./site/HomePage'),
  publications: () => import('./site/PublicationsPage'),
  about: () => import('./site/AboutPage'),
  cv: () => import('./site/CvPage'),
  blog: () => import('./blog/BlogIndex'),
}
const Homepage = lazy(pages.home)
const PublicationsPage = lazy(pages.publications)
const AboutPage = lazy(pages.about)
const CvPage = lazy(pages.cv)
const BlogIndex = lazy(pages.blog)
const NotFoundPage = lazy(() => import('./site/NotFoundPage'))
const DesignStudio = lazy(() => import('./designs/DesignStudio'))
const StillStudio = lazy(() => import('./designs/still/StillStudio'))
const TypographyStudio = lazy(() => import('./designs/typography/TypographyStudio'))
const MobileStudio = lazy(() => import('./designs/mobile/MobileStudio'))
const ScolPost = lazy(() => import('./blog/scol/ScolPost'))
const DiffusionPost = lazy(() => import('./blog/diffusion/DiffusionPost'))

function PhotographyRedirect() {
  const { search } = useLocation()
  return <Navigate to={{ pathname: '/about', search, hash: '#photography' }} replace />
}

/** A live page. While its code loads, the site frame stays in place. */
const page = (element: ReactNode) => <Suspense fallback={<SiteLoading />}>{element}</Suspense>

// Handle the GH Pages SPA fallback hand-off: 404.html stashes the
// original deep-link path in `?_redirect=...` and bounces here.
;(function rehydrateDeepLink() {
  const params = new URLSearchParams(window.location.search)
  const redirect = params.get('_redirect')
  if (redirect) {
    window.history.replaceState(null, '', redirect)
  }
})()

// The five index pages are small. Fetch them once the first page is idle, so moving between them is immediate.
const whenIdle = window.requestIdleCallback ?? ((task: () => void) => window.setTimeout(task, 1200))
whenIdle(() => { for (const load of Object.values(pages)) void load().catch(() => {}) })

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element in index.html')

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={page(<Homepage />)} />
        <Route path="/publications" element={page(<PublicationsPage />)} />
        <Route path="/about" element={page(<AboutPage />)} />
        <Route path="/cv" element={page(<CvPage />)} />
        <Route path="/photography" element={<PhotographyRedirect />} />
        <Route path="/blog" element={page(<BlogIndex />)} />
        <Route path="/blog/self-consolidating-language-models" element={page(<ScolPost />)} />
        <Route path="/blog/self-consolidating-language-models/figures/:figureId" element={page(<ScolPost />)} />
        <Route path="/blog/continual-learning-diffusion-models" element={page(<DiffusionPost />)} />
        <Route path="/blog/continual-learning-diffusion-models/figures/:figureId" element={page(<DiffusionPost />)} />
        <Route path="/still" element={<Suspense fallback={<div style={{ minHeight: '100svh', background: 'var(--still-screen, #000000)' }} />}><StillStudio /></Suspense>} />
        <Route path="/typography/*" element={<Suspense fallback={<div style={{ minHeight: '100svh', background: '#ffffff' }} />}><TypographyStudio /></Suspense>} />
        <Route path="/mobile/*" element={<Suspense fallback={<div style={{ minHeight: '100svh', background: '#ffffff' }} />}><MobileStudio /></Suspense>} />
        <Route path="/designs/*" element={<Suspense fallback={<div style={{ minHeight: '100vh', background: '#f4f3ee' }} />}><DesignStudio /></Suspense>} />
        <Route path="*" element={page(<NotFoundPage />)} />
      </Routes>
      <AdaptGate />
    </BrowserRouter>
  </StrictMode>,
)
