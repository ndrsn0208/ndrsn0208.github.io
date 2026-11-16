import { useEffect, useRef } from 'react'
import { useSiteTheme } from './SiteFrame'
import { clamp, drawRidges, makeView, mix, smooth, type Point } from './terrain'
import { directions, makeScenes, type DirectionId, type Pen, type Side } from './scenes'

/* The site's one drawing: a surface in hairlines, with the research directions as its scenes
   (`scenes.ts`). The blue point is the model. In every scene the pointer moves what is new.

   One scene is on the drawing at a time. When the direction changes, the surface turns into the
   next scene's surface while the marks of one scene leave and those of the other arrive. With
   `auto`, the drawing moves on to the next direction once a scene has shown what it shows. */

/** The drawing-in plays once per visit. Changing the appearance redraws the finished state. */
let opened = false

export default function Landscape({ direction = 'continual', auto = false, onAdvance, className = '' }: {
  direction?: DirectionId
  /** Move on to the next direction when a scene has been shown and the visitor is not pointing at the drawing. */
  auto?: boolean
  onAdvance?: (next: DirectionId) => void
  className?: string
}) {
  const { edition } = useSiteTheme()
  const canvas = useRef<HTMLCanvasElement>(null)
  const scenes = useRef(makeScenes())
  // The scenes keep their state when the appearance changes, so the drawing goes on from where it was.
  const begun = useRef(false)
  const wanted = useRef(direction)
  const moves = useRef({ auto, onAdvance })
  const wake = useRef(() => {})
  wanted.current = direction
  moves.current = { auto, onAdvance }

  // A drawing that stands still is redrawn when its direction changes.
  useEffect(() => { wake.current() }, [direction])

  useEffect(() => {
    const element = canvas.current
    const context = element?.getContext('2d')
    if (!element || !context) return
    const host = element.parentElement ?? element
    const words = host.querySelector<HTMLElement>('[data-landscape-clear]')
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const styles = getComputedStyle(element)
    const line = styles.getPropertyValue('--site-field-line').trim() || '0, 0, 0'
    const paper = styles.getPropertyValue('--site-paper').trim() || '#ffffff'
    const accent = styles.getPropertyValue('--site-accent').trim() || '#0071e3'
    const muted = styles.getPropertyValue('--site-muted').trim() || '#666666'
    const family = styles.fontFamily || 'sans-serif'
    const all = scenes.current

    let view = makeView(1, 1)
    let current = wanted.current
    let leaving: DirectionId | null = null
    /** How far the surface has turned from the leaving scene into the current one. */
    let turn = 1
    let pointer: Point | null = null
    let frame = 0
    let visible = true
    let began = 0
    let last = 0

    const heightAt = (x: number, y: number) => leaving
      ? mix(all[leaving].height(x, y), all[current].height(x, y), smooth(turn))
      : all[current].height(x, y)
    const at = (point: Point) => view.project(point.x, point.y, heightAt(point.x, point.y))

    function trace(points: Point[], closed = false) {
      context!.beginPath()
      points.forEach((point, index) => {
        const [x, y] = at(point)
        if (index === 0) context!.moveTo(x, y)
        else context!.lineTo(x, y)
      })
      if (closed) context!.closePath()
    }
    const ink = (alpha: number) => `rgba(${line}, ${alpha})`
    const pen: Pen = {
      region(points, alpha) {
        if (alpha <= 0) return
        trace(points, true)
        context!.fillStyle = accent
        context!.globalAlpha = .05 * alpha
        context!.fill()
        context!.globalAlpha = alpha
        context!.strokeStyle = accent
        context!.lineWidth = 1.25
        context!.stroke()
      },
      path(points, alpha) {
        if (alpha <= 0 || points.length < 2) return
        trace(points)
        context!.globalAlpha = alpha
        context!.strokeStyle = accent
        context!.lineWidth = 2
        context!.stroke()
      },
      dashed(points, alpha, closed = false) {
        if (alpha <= 0) return
        trace(points, closed)
        context!.globalAlpha = 1
        context!.setLineDash([3, 6])
        context!.strokeStyle = ink(.5 * alpha)
        context!.lineWidth = 1.25
        context!.stroke()
        context!.setLineDash([])
      },
      ring(point, alpha) {
        if (alpha <= 0) return
        const [x, y] = at(point)
        context!.globalAlpha = alpha
        context!.beginPath()
        context!.arc(x, y, 4, 0, Math.PI * 2)
        context!.fillStyle = paper
        context!.fill()
        context!.strokeStyle = ink(.9)
        context!.lineWidth = 1.25
        context!.stroke()
      },
      cross(point, alpha) {
        if (alpha <= 0) return
        const [x, y] = at(point)
        context!.globalAlpha = alpha
        context!.beginPath()
        context!.moveTo(x - 7, y); context!.lineTo(x + 7, y)
        context!.moveTo(x, y - 7); context!.lineTo(x, y + 7)
        context!.strokeStyle = ink(.9)
        context!.lineWidth = 1.25
        context!.stroke()
      },
      model(point, alpha) {
        if (alpha <= 0) return
        const [x, y] = at(point)
        context!.fillStyle = accent
        context!.beginPath()
        context!.arc(x, y, 12, 0, Math.PI * 2)
        context!.globalAlpha = .14 * alpha
        context!.fill()
        context!.globalAlpha = alpha
        context!.beginPath()
        context!.arc(x, y, 5.5, 0, Math.PI * 2)
        context!.fill()
      },
      joint(point, alpha) {
        if (alpha <= 0) return
        const [x, y] = at(point)
        context!.globalAlpha = alpha
        context!.beginPath()
        context!.arc(x, y, 3.25, 0, Math.PI * 2)
        context!.fillStyle = accent
        context!.fill()
      },
      sample(point, alpha) {
        if (alpha <= 0) return
        const [x, y] = at(point)
        context!.globalAlpha = alpha
        context!.beginPath()
        context!.arc(x, y, 3, 0, Math.PI * 2)
        context!.fillStyle = ink(.9)
        context!.fill()
      },
      name(text, point, side: Side, alpha, otherwise: Side = 's') {
        if (alpha <= 0) return
        const [x, y] = at(point)
        context!.font = `400 15px ${family}`
        context!.textAlign = 'left'
        context!.textBaseline = 'middle'
        const wide = context!.measureText(text).width
        // A name that has no room beside its mark goes under it, or where the scene says.
        const fits = side === 'e' ? x + 16 + wide <= view.width - 8 : side === 'w' ? x - 16 - wide >= 8 : true
        const where = fits ? side : otherwise
        const from = where === 'e' ? x + 16 : where === 'w' ? x - 16 - wide : x - wide / 2
        const left = clamp(from, 8, view.width - wide - 8)
        const row = clamp(y + (where === 'n' ? -23 : where === 's' ? 25 : 0), view.top + 12, view.height - 12)
        context!.globalAlpha = alpha
        // A little paper around the letters keeps them clear of the ridges.
        context!.lineJoin = 'round'
        context!.strokeStyle = paper
        context!.lineWidth = 5
        context!.strokeText(text, left, row)
        context!.fillStyle = muted
        context!.fillText(text, left, row)
      },
    }

    function resize() {
      const bounds = element!.getBoundingClientRect()
      const ratio = Math.min(2, window.devicePixelRatio || 1)
      const width = Math.max(1, Math.round(bounds.width))
      const height = Math.max(1, Math.round(bounds.height))
      element!.width = Math.round(width * ratio)
      element!.height = Math.round(height * ratio)
      context!.setTransform(ratio, 0, 0, ratio, 0, 0)
      const clear = words ? words.getBoundingClientRect().bottom - bounds.top : 0
      view = makeView(width, height, clear)
      for (const scene of Object.values(all)) scene.fit(view)
      if (!begun.current) {
        begun.current = true
        all[current].begin(!opened)
      }
    }

    function draw(now: number) {
      const { width, height: tall } = view
      const elapsed = (now - began) / 1000
      const still = motionQuery.matches
      const arrival = still || opened ? 1 : smooth(elapsed / 1.3)
      if (elapsed > 1.9) opened = true
      context!.clearRect(0, 0, width, tall)
      context!.lineJoin = 'round'
      context!.lineCap = 'round'
      drawRidges(context!, view, heightAt, paper, line, arrival)
      // The marks of the scene that leaves go first, and those of the scene that arrives follow.
      if (leaving) all[leaving].paint(pen, arrival * (1 - smooth(turn / .4)))
      all[current].paint(pen, arrival * (leaving ? smooth((turn - .45) / .5) : 1))
      context!.globalAlpha = 1
    }

    function tick(now: number) {
      frame = 0
      if (!began) began = now
      const step = Math.min(.05, (now - (last || now)) / 1000)
      last = now
      const still = motionQuery.matches
      if (wanted.current !== current && (turn >= 1 || still)) {
        leaving = still ? null : current
        current = wanted.current
        turn = still ? 1 : 0
        all[current].begin(false)
      }
      if (leaving) {
        turn = Math.min(1, turn + step / 1.15)
        all[leaving].advance(step, null, still)
        if (turn >= 1) leaving = null
      }
      all[current].advance(step, pointer, still)
      draw(now)
      const { auto, onAdvance } = moves.current
      if (auto && !still && !pointer && !leaving && wanted.current === current && all[current].shown()) {
        const index = directions.findIndex(item => item.id === current)
        onAdvance?.(directions[(index + 1) % directions.length].id)
      }
      if (visible && !document.hidden && !still) frame = requestAnimationFrame(tick)
    }
    const start = () => { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick) }
    wake.current = start

    const onMove = (event: PointerEvent) => {
      const bounds = element.getBoundingClientRect()
      const px = event.clientX - bounds.left
      const py = event.clientY - bounds.top
      // A control over the drawing is pressed, not pointed at.
      const control = event.target instanceof Element && event.target.closest('a, button')
      if (control || py < view.top * .8 || py > bounds.height) { pointer = null; start(); return }
      let point = view.ground(px, py)
      for (let pass = 0; pass < 3; pass += 1) point = view.ground(px, py, all[current].under(point))
      const reach = view.reach(point.y) * .94
      pointer = { x: clamp(point.x, -reach, reach), y: point.y }
      start()
    }
    const onLeave = () => { pointer = null; last = 0; start() }
    const onResize = () => { resize(); start() }
    const onVisibility = () => { last = 0; start() }

    resize()
    const sizes = new ResizeObserver(onResize)
    sizes.observe(element)
    if (words) sizes.observe(words)
    const watcher = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; last = 0; start() })
    watcher.observe(element)
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerdown', onMove)
    host.addEventListener('pointerleave', onLeave)
    document.addEventListener('visibilitychange', onVisibility)
    motionQuery.addEventListener('change', onVisibility)
    // The names are set in the site's typeface, which may arrive after the first drawing.
    document.fonts?.ready.then(start)
    start()

    return () => {
      wake.current = () => {}
      cancelAnimationFrame(frame)
      sizes.disconnect()
      watcher.disconnect()
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerdown', onMove)
      host.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      motionQuery.removeEventListener('change', onVisibility)
    }
  }, [edition])

  return <canvas
    ref={canvas}
    id="home-landscape"
    className={`site-landscape ${className}`.trim()}
    role="img"
    aria-label={directions.find(item => item.id === direction)!.picture}
  />
}
