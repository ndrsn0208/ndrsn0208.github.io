import { useEffect, useRef } from 'react'

/* The drawn Swiss column rules (11 verticals across the 12-col grid) plus
   the toggleable red baseline overlay. Pure decoration; pointer-events off. */
export default function GridLines() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const gl = ref.current
    if (!gl || gl.childElementCount) return
    for (let i = 1; i < 12; i++) {
      const c = document.createElement('div')
      c.className = 'col'
      c.style.left = `${(i / 12) * 100}%`
      c.style.transitionDelay = `${0.25 + i * 0.045}s`
      gl.appendChild(c)
    }
  }, [])

  return (
    <>
      <div className="gridlines" aria-hidden ref={ref} />
      <div className="baseline" aria-hidden />
    </>
  )
}
