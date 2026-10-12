import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './styles/globals.css'

const Homepage = lazy(() => import('./site/HomePage'))
const PublicationsPage = lazy(() => import('./site/PublicationsPage'))
const AboutPage = lazy(() => import('./site/AboutPage'))
const CvPage = lazy(() => import('./site/CvPage'))
const NotFoundPage = lazy(() => import('./site/NotFoundPage'))
const DesignStudio = lazy(() => import('./designs/DesignStudio'))
const StillStudio = lazy(() => import('./designs/still/StillStudio'))
const TypographyStudio = lazy(() => import('./designs/typography/TypographyStudio'))
const MobileStudio = lazy(() => import('./designs/mobile/MobileStudio'))
const BlogIndex = lazy(() => import('./blog/BlogIndex'))
const ScolPost = lazy(() => import('./blog/scol/ScolPost'))
const DiffusionPost = lazy(() => import('./blog/diffusion/DiffusionPost'))

function PhotographyRedirect() {
  const { search } = useLocation()
  return <Navigate to={{ pathname: '/about', search, hash: '#photography' }} replace />
}

// Handle the GH Pages SPA fallback hand-off: 404.html stashes the
// original deep-link path in `?_redirect=...` and bounces here.
;(function rehydrateDeepLink() {
  const params = new URLSearchParams(window.location.search)
  const redirect = params.get('_redirect')
  if (redirect) {
    window.history.replaceState(null, '', redirect)
  }
})()

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element in index.html')

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Suspense fallback={<div style={{ minHeight: '100svh', background: 'var(--paper, #f5f1e8)' }} />}><Homepage /></Suspense>} />
        <Route path="/publications" element={<Suspense fallback={<div style={{ minHeight: '100svh', background: 'var(--paper, #f5f1e8)' }} />}><PublicationsPage /></Suspense>} />
        <Route path="/about" element={<Suspense fallback={<div style={{ minHeight: '100svh', background: 'var(--paper, #f5f1e8)' }} />}><AboutPage /></Suspense>} />
        <Route path="/cv" element={<Suspense fallback={<div style={{ minHeight: '100svh', background: 'var(--paper, #f5f1e8)' }} />}><CvPage /></Suspense>} />
        <Route path="/photography" element={<PhotographyRedirect />} />
        <Route path="/blog" element={<Suspense fallback={<div style={{ minHeight: '100svh', background: 'var(--paper, #f5f1e8)' }} />}><BlogIndex /></Suspense>} />
        <Route path="/blog/self-consolidating-language-models" element={<Suspense fallback={<div style={{ minHeight: '100svh', background: 'var(--paper, #f5f1e8)' }} />}><ScolPost /></Suspense>} />
        <Route path="/blog/continual-learning-diffusion-models" element={<Suspense fallback={<div style={{ minHeight: '100svh', background: 'var(--paper, #f5f1e8)' }} />}><DiffusionPost /></Suspense>} />
        <Route path="/blog/continual-learning-diffusion-models/figures/:figureId" element={<Suspense fallback={<div style={{ minHeight: '100svh', background: 'var(--paper, #f5f1e8)' }} />}><DiffusionPost /></Suspense>} />
        <Route path="/still" element={<Suspense fallback={<div style={{ minHeight: '100svh', background: 'var(--still-screen, #000000)' }} />}><StillStudio /></Suspense>} />
        <Route path="/typography/*" element={<Suspense fallback={<div style={{ minHeight: '100svh', background: '#f5f1e8' }} />}><TypographyStudio /></Suspense>} />
        <Route path="/mobile/*" element={<Suspense fallback={<div style={{ minHeight: '100svh', background: '#f5f1e8' }} />}><MobileStudio /></Suspense>} />
        <Route path="/designs/*" element={<Suspense fallback={<div style={{ minHeight: '100vh', background: '#f4f3ee' }} />}><DesignStudio /></Suspense>} />
        <Route path="*" element={<Suspense fallback={<div style={{ minHeight: '100svh', background: 'var(--paper, #f5f1e8)' }} />}><NotFoundPage /></Suspense>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
