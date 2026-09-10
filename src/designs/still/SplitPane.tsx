import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { StillDestination } from './StillNavigation'

const wideLayout = '(min-width: 1024px)'

export function useSplitLayout() {
  const [wide, setWide] = useState(() => window.matchMedia(wideLayout).matches)
  useEffect(() => {
    const query = window.matchMedia(wideLayout)
    const update = () => setWide(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return wide
}

/** Keep each reader mounted, including its scroll position and expanded details. */
export default function SplitPane({ name, enabled, active, titleId, enterDelay = 0, children }: {
  name: StillDestination
  enabled: boolean
  active: boolean
  titleId: string
  enterDelay?: number
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useLayoutEffect(() => {
    if (ref.current) ref.current.inert = !active
  }, [active])

  return (
    <motion.div
      ref={ref}
      id={`quiet-pane-${name}`}
      className={`quiet-pane quiet-pane-${name}`}
      data-active={active || undefined}
      aria-hidden={!active || undefined}
      role={enabled ? 'region' : undefined}
      aria-labelledby={enabled ? titleId : undefined}
      tabIndex={enabled ? -1 : undefined}
      initial={false}
      animate={{ opacity: active ? 1 : 0, y: enabled && !active && !reduce ? 10 : 0 }}
      transition={reduce || !enabled ? { duration: 0 } : {
        opacity: { duration: active ? 0.32 : 0.16, delay: active ? enterDelay : 0 },
        y: { duration: 0.5, delay: active ? enterDelay : 0, ease: [0.22, 1, 0.36, 1] },
      }}
    >
      {children}
    </motion.div>
  )
}
