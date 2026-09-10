import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { StillEditionId } from './editions'
import { useGlassLight } from './useGlassLight'
import { stillSpring } from './transitions'

export default function AppearanceSwitch({ edition, onChange, glass = true }: {
  edition: StillEditionId
  onChange: (edition: StillEditionId) => void
  glass?: boolean
}) {
  const reduce = useReducedMotion()
  const light = useGlassLight()
  const dark = edition === 'black'
  return (
    <motion.button
      {...(glass ? light : {})}
      className={`still-appearance${glass ? ' still-glass' : ''}`}
      type="button"
      onClick={() => onChange(dark ? 'paper' : 'black')}
      aria-label={`Switch to ${dark ? 'Paper' : 'Black'} appearance`}
      title={dark ? 'Paper · Light appearance' : 'Black · Dark appearance'}
      whileTap={reduce ? undefined : glass ? { scale: 0.92 } : { opacity: 0.6 }}
      transition={reduce ? { duration: 0 } : glass ? stillSpring : { duration: 0.18 }}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          className="still-appearance-icon"
          key={edition}
          initial={reduce ? false : glass ? { opacity: 0, rotate: -40, scale: 0.7 } : { opacity: 0, y: 3 }}
          animate={{ opacity: 1, rotate: 0, scale: 1, y: 0 }}
          exit={glass ? { opacity: 0, rotate: 40, scale: 0.7 } : { opacity: 0, y: -3 }}
          transition={{ duration: reduce ? 0 : 0.16 }}
          aria-hidden="true"
        >
          {dark ? (
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M19.7 14.8A8.2 8.2 0 0 1 9.2 4.3 8.2 8.2 0 1 0 19.7 14.8Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          )}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
