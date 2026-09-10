import { useMotionTemplate, useSpring } from 'motion/react'
import type { CSSProperties, PointerEvent } from 'react'
import { reducedMotion } from './transitions'

/** Light follows the pointer; the control itself stays still and easy to target. */
export function useGlassLight() {
  const x = useSpring(28, { stiffness: 170, damping: 28, mass: 0.55 })
  const y = useSpring(0, { stiffness: 170, damping: 28, mass: 0.55 })
  const position = useMotionTemplate`${x}% ${y}%`

  return {
    style: { '--glass-position': position } as CSSProperties,
    onPointerMove(event: PointerEvent<HTMLElement>) {
      if (event.pointerType !== 'mouse' || reducedMotion()) return
      const bounds = event.currentTarget.getBoundingClientRect()
      x.set(((event.clientX - bounds.left) / bounds.width) * 100)
      y.set(((event.clientY - bounds.top) / bounds.height) * 100)
    },
    onPointerLeave() {
      x.set(28)
      y.set(0)
    },
  }
}
