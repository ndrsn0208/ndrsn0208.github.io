import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './styles/globals.css'

const App = lazy(() => import('./App'))
const DesignStudio = lazy(() => import('./designs/DesignStudio'))
const StillStudio = lazy(() => import('./designs/still/StillStudio'))

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
        <Route path="/" element={<Suspense fallback={<div style={{ minHeight: '100svh', background: 'var(--still-screen, #000000)' }} />}><StillStudio finalized /></Suspense>} />
        <Route path="/still" element={<Suspense fallback={<div style={{ minHeight: '100svh', background: 'var(--still-screen, #000000)' }} />}><StillStudio /></Suspense>} />
        <Route path="/designs/*" element={<Suspense fallback={<div style={{ minHeight: '100vh', background: '#f4f3ee' }} />}><DesignStudio /></Suspense>} />
        <Route path="*" element={<Suspense fallback={<div style={{ minHeight: '100svh', background: 'var(--paper, #000000)' }} />}><App /></Suspense>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
