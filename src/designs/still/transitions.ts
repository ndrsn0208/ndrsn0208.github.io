import { flushSync } from 'react-dom'

export const stillEase = 'cubic-bezier(0.22, 1, 0.36, 1)'
export const stillSpring = { type: 'spring' as const, stiffness: 420, damping: 34, mass: 0.75 }

export function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

let swapVersion = 0
let activeSwap: { skipTransition: () => void } | undefined
let fallbackAnimation: Animation | undefined
let pendingFallback: (() => void) | undefined

/** Keep the actual DOM, scroll, focus, and reader state underneath a visual swap. */
export function transitionStill(update: () => void, kind: 'forward' | 'back' | 'edition' | 'study' | 'controls' = 'forward') {
  if (pendingFallback) {
    const pending = pendingFallback
    pendingFallback = undefined
    pending()
  }
  const version = ++swapVersion
  activeSwap?.skipTransition()
  fallbackAnimation?.cancel()
  delete document.documentElement.dataset.stillTransition
  if (reducedMotion()) {
    update()
    return
  }

  if (typeof document.startViewTransition === 'function') {
    document.documentElement.dataset.stillTransition = kind
    const swap = document.startViewTransition(() => {
      flushSync(update)
    })
    activeSwap = swap
    void swap.ready.catch(() => {})
    void swap.finished.catch(() => {}).finally(() => {
      if (version !== swapVersion) return
      activeSwap = undefined
      delete document.documentElement.dataset.stillTransition
    })
    return
  }

  // Older browsers get the same short exit and entrance using the Web Animations API.
  const selector = kind === 'controls' ? '.still-controls' : '.quiet'
  const outgoing = document.querySelector<HTMLElement>(selector)
  if (!outgoing) { update(); return }
  const exit = outgoing.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 110, fill: 'forwards', easing: 'ease-out' })
  fallbackAnimation = exit
  pendingFallback = update
  void exit.finished.then(() => {
    if (version !== swapVersion) return
    pendingFallback = undefined
    flushSync(update)
    exit.cancel()
    const incoming = document.querySelector<HTMLElement>(selector)
    fallbackAnimation = incoming?.animate(
      kind === 'edition'
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ opacity: 0, translate: '0 7px' }, { opacity: 1, translate: '0 0' }],
      { duration: 360, easing: stillEase },
    )
  }).catch(() => {})
}
