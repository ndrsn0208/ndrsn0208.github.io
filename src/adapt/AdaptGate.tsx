import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { ADAPT_ENABLED_KEY, adaptationPageKey } from './model'
import './adapt-gate.css'

const AdaptPlayground = lazy(() => import('./AdaptPlayground'))

function enabledHere(): boolean {
  try { return localStorage.getItem(ADAPT_ENABLED_KEY) === '1' }
  catch { return false }
}

class AdaptBoundary extends Component<{ children: ReactNode; onExit: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) {
      return <div className="adapt-load-state" data-adapt-ui>
        <p>The playground couldn’t open.</p>
        <button type="button" onClick={this.props.onExit}>Return to the website</button>
      </div>
    }
    return this.props.children
  }
}

export default function AdaptGate() {
  const { pathname } = useLocation()
  const [enabled, setEnabled] = useState(enabledHere)
  const pageKey = adaptationPageKey(pathname)
  const supported = !/^\/(still|typography|mobile|designs)(\/|$)/.test(pathname)

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === ADAPT_ENABLED_KEY || event.key === null) setEnabled(enabledHere())
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  function changeEnabled(next: boolean) {
    try { localStorage.setItem(ADAPT_ENABLED_KEY, next ? '1' : '0') } catch { /* The playground also works in memory. */ }
    setEnabled(next)
  }

  if (!supported) return null
  if (!enabled) {
    return <div className="adapt-launcher" data-adapt-ui>
      <button type="button" onClick={() => changeEnabled(true)} aria-label="Continually adapt this website">
        <span className="adapt-launcher-mark" aria-hidden="true">a<span>′</span></span>
        Adapt this website
      </button>
    </div>
  }

  return <AdaptBoundary onExit={() => changeEnabled(false)}>
    <Suspense fallback={<div className="adapt-load-state" data-adapt-ui>
      <span>Opening the playground…</span>
      <button type="button" onClick={() => changeEnabled(false)}>Cancel</button>
    </div>}>
      <AdaptPlayground pageKey={pageKey} routeKey={pathname} onExit={() => changeEnabled(false)} />
    </Suspense>
  </AdaptBoundary>
}
