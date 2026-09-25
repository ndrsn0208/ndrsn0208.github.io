import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from 'react'
import { motion, useMotionValue, useReducedMotion } from 'motion/react'
import AppearanceSwitch from './AppearanceSwitch'
import StillNavigation from './StillNavigation'
import type { StillEditionId } from './editions'

type NavigationProps = Pick<ComponentProps<typeof StillNavigation>, 'mode' | 'info' | 'onPublications' | 'onInfo' | 'panels' | 'contactInline'>

function Dock({ active, ...props }: NavigationProps & { active: boolean }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const opacity = useMotionValue(0)
  const latestActive = useRef(active)
  const [hidden, setHidden] = useState(!active)

  useLayoutEffect(() => {
    latestActive.current = active
    if (ref.current) ref.current.inert = !active
    if (active || reduce) setHidden(!active)
  }, [active, reduce])

  return (
    <motion.div
      ref={ref}
      className="quiet-dock"
      aria-hidden={!active || undefined}
      data-exiting={!active && !hidden || undefined}
      style={{ opacity, visibility: active || !hidden ? 'visible' : 'hidden', pointerEvents: active ? 'auto' : 'none' }}
      initial={false}
      animate={active ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 12, scale: 0.99 }}
      transition={reduce ? { duration: 0 } : {
        default: { type: 'spring', stiffness: 360, damping: 38, mass: 0.9 },
        opacity: { duration: active ? 0.24 : 0.16, ease: 'easeOut' },
      }}
      onAnimationComplete={() => {
        // A cancelled entrance can finish after a reversal. Only the currently
        // transparent surface may be hidden; a stale callback must not cut it off.
        if (!latestActive.current && opacity.get() === 0) setHidden(true)
      }}
    >
      <StillNavigation {...props} primary inline docked />
    </motion.div>
  )
}

/** The original navigation keeps its space; only its active surface changes. */
export default function AdaptiveNavigation({
  edition, onEditionChange, dockOffset = 0, ...navigation
}: NavigationProps & {
  edition: StillEditionId
  onEditionChange: (edition: StillEditionId) => void
  dockOffset?: number
}) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const [aboveViewport, setAboveViewport] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const previousDocked = useRef(false)
  const restoreDestination = useRef<string | null>(null)
  // Keep a dialog's trigger in place until it closes, including on rotation.
  const docked = navigation.panels ? false : navigation.info ? previousDocked.current : aboveViewport && !keyboardOpen

  useLayoutEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    const update = (anchorBottom: number) => {
      const bottom = anchorBottom - dockOffset
      if (bottom >= 18) {
        // Capture before the departing dock becomes inert and the browser blurs it.
        const active = document.activeElement as HTMLElement | null
        restoreDestination.current = active?.closest('.quiet-dock') ? active.dataset.navDestination ?? null : null
      }
      // A short return threshold avoids flickering around the viewport edge.
      setAboveViewport((previous) => previous ? bottom < 18 : bottom <= 0)
    }
    update(anchor.getBoundingClientRect().bottom)
    const observer = new IntersectionObserver(() => {
      update(anchor.getBoundingClientRect().bottom)
    }, { threshold: [0, 0.4, 1], rootMargin: `-${dockOffset}px 0px 0px 0px` })
    observer.observe(anchor)
    // A fast fling can skip the anchor entirely on a short screen. The home
    // starts in view, so observing it also catches that otherwise silent jump.
    const introduction = anchor.closest('.quiet-home')
    if (introduction) observer.observe(introduction)
    return () => observer.disconnect()
  }, [dockOffset])

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    let restingHeight = viewport.height
    let restingWidth = viewport.width
    let frame = 0
    const update = () => {
      const editing = document.activeElement?.matches('input, textarea, [contenteditable="true"]') ?? false
      const rotated = Math.abs(viewport.width - restingWidth) > 80
      if (rotated) {
        restingHeight = viewport.height
        restingWidth = viewport.width
      } else if (!editing) {
        restingHeight = Math.max(restingHeight, viewport.height)
      }
      setKeyboardOpen(editing && viewport.scale < 1.05 && restingHeight - viewport.height > 120)
    }
    const afterFocus = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }
    viewport.addEventListener('resize', update)
    document.addEventListener('focusin', afterFocus)
    document.addEventListener('focusout', afterFocus)
    return () => {
      cancelAnimationFrame(frame)
      viewport.removeEventListener('resize', update)
      document.removeEventListener('focusin', afterFocus)
      document.removeEventListener('focusout', afterFocus)
    }
  }, [])

  useLayoutEffect(() => {
    const active = document.activeElement as HTMLElement | null
    if (!docked && previousDocked.current) {
      const destination = restoreDestination.current ?? (active?.closest('.quiet-dock') ? active.dataset.navDestination : null)
      if (destination && (!active || active === document.body || active.closest('.quiet-dock'))) {
        anchorRef.current?.querySelector<HTMLElement>(`[data-nav-destination="${destination}"]`)?.focus({ preventScroll: true })
      }
      restoreDestination.current = null
    }
    previousDocked.current = docked
  }, [docked])

  return (
    <>
      <div ref={anchorRef} className="quiet-navigation quiet-navigation-anchor" data-docked={docked || undefined}>
        <StillNavigation {...navigation} primary inline inactive={docked} />
        <AppearanceSwitch edition={edition} onChange={onEditionChange} glass={false} />
      </div>
      <div className="quiet-dock-positioner">
        <Dock active={docked} {...navigation} />
      </div>
    </>
  )
}
