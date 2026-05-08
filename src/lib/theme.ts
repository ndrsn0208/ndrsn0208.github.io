import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'theme'

function readInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  // The bootstrap script in index.html sets data-theme before paint —
  // trust whatever it landed on so SSR/CSR stay in sync.
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr === 'dark' || attr === 'light') return attr
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    /* localStorage may be unavailable */
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
}

export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void } {
  const [theme, setThemeState] = useState<Theme>(() => readInitialTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return {
    theme,
    setTheme: setThemeState,
    toggle: () => setThemeState((cur) => (cur === 'dark' ? 'light' : 'dark')),
  }
}
