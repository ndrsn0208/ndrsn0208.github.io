import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/globals.css'
import './styles/glass.css'

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
      <App />
    </BrowserRouter>
  </StrictMode>,
)
