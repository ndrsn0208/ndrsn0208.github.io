import { useEffect, useRef } from 'react'

/**
 * Breathing dot-matrix background — pure monochrome.
 * A faint global "breath" keeps the field alive; a bright halo of dots
 * swells around the cursor. Fixed, behind all content (z-0). Honors
 * prefers-reduced-motion by drawing a single static frame.
 */
export default function DotField() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    // non-null bindings so the nested render/size closures stay typed
    const cvEl: HTMLCanvasElement = cv
    const c2: CanvasRenderingContext2D = ctx
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let W = 0
    let H = 0
    let DPR = 1
    const GAP = 30 // css px between dots
    const R = 170 // cursor halo radius (css px)
    let mx = -9999
    let my = -9999
    let raf = 0

    function size() {
      DPR = Math.min(window.devicePixelRatio || 1, 2)
      W = cvEl.width = window.innerWidth * DPR
      H = cvEl.height = window.innerHeight * DPR
      cvEl.style.width = window.innerWidth + 'px'
      cvEl.style.height = window.innerHeight + 'px'
    }

    function paint(t: number) {
      c2.clearRect(0, 0, W, H)
      const g = GAP * DPR
      const rad = R * DPR
      for (let py = g * 0.5; py < H; py += g) {
        for (let px = g * 0.5; px < W; px += g) {
          // very subtle global breath
          let b = reduce
            ? 0.16
            : (Math.sin(t * 0.0008 + px * 0.0009 + py * 0.0012) * 0.5 + 0.5) * 0.22
          // cursor halo — the main source of life
          const dx = px - mx
          const dy = py - my
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < rad) {
            const k = 1 - d / rad
            b += k * k * 0.95
          }
          if (b > 1) b = 1
          const r = (0.5 + b * 1.7) * DPR
          const a = 0.05 + b * 0.55
          c2.beginPath()
          c2.arc(px, py, r, 0, 6.2832)
          c2.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')'
          c2.fill()
        }
      }
      if (!reduce) raf = requestAnimationFrame(paint)
    }

    function onMove(e: MouseEvent) {
      mx = e.clientX * DPR
      my = e.clientY * DPR
    }
    function onLeave() {
      mx = -9999
      my = -9999
    }
    function onResize() {
      size()
      if (reduce) paint(0)
    }

    size()
    if (reduce) {
      paint(0)
    } else {
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseleave', onLeave)
      raf = requestAnimationFrame(paint)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <>
      <canvas ref={ref} className="fixed inset-0 z-0 block" aria-hidden />
      {/* vignette to seat the dots and keep text legible */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(135% 100% at 50% 32%, transparent 52%, rgba(0,0,0,.82) 100%)',
        }}
        aria-hidden
      />
    </>
  )
}
