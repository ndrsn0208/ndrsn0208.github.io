import { useSyncExternalStore } from 'react'

const preferenceQuery = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  const preference = window.matchMedia(preferenceQuery)
  preference.addEventListener('change', onChange)
  return () => preference.removeEventListener('change', onChange)
}

function currentPreference() {
  return window.matchMedia(preferenceQuery).matches
}

/** Motion 11 reads the initial preference. These diagrams also follow live changes. */
export function useDiffusionReducedMotion() {
  return useSyncExternalStore(subscribe, currentPreference, () => false)
}
