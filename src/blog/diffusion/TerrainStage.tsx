import { useEffect, useRef } from 'react'
import { useSiteTheme } from '../../site/SiteFrame'
import { clamp, drawRidges, makeView, smooth, type View } from '../../site/terrain'
import {
  anchored, before, close, depth, diagonalOutline, drifted, driftedOn, far1, far2, fineTuned, gradients, held,
  near1, near2, outline, place, prior, sharedFar, sharedNear, start, task3, trustOutline, unplace, whole, type Point,
} from './scene'

/* The landscape the essay is drawn on, in the same hairlines as the overview.

     outlines        the low-loss region of each task, named on the drawing
     darker ground   a shared basin, where all three tasks overlap
     hollow ring     the old-task optimum
     cross           the new-task optimum
     blue outline    the trust region
     blue line       the path of the parameters
     blue point      the parameters
     grey line       the path replay alone takes

   Each figure shows the same scene and adds one thing to it. The comparison of
   methods shows the scene three times, one strip per method, as Figure 1 of the
   Trust Region paper does. */

/** `emblem` is the Trust Region strip alone and without names, for a small picture of the essay. */
export type TerrainMode = 'forgetting' | 'region' | 'methods' | 'emblem'

/** How much of each part of the scene is shown, from 0 to 1. */
type Parts = { fresh: number, far: number, region: number, diagonal: number, arrows: number, prior: number, ghost: number }
type Route = { path: Point[], rest?: Point[], seconds: number }
type Strip = { name?: string, reach: boolean, parts: Parts, route: Route | null }

const none: Parts = { fresh: 0, far: 0, region: 0, diagonal: 0, arrows: 0, prior: 0, ghost: 0 }

/** What each figure draws at a station: one strip, or one per method. */
function stripsFor(mode: TerrainMode, step: number): Strip[] {
  if (mode === 'forgetting') {
    return [{
      reach: true,
      parts: { ...none, fresh: step >= 1 ? 1 : 0, prior: step >= 1 ? 1 : 0 },
      route: step === 0 ? { path: prior, seconds: 1.3 } : step === 2 ? { path: fineTuned, seconds: 1.6 } : null,
    }]
  }
  if (mode === 'region') {
    return [{ reach: true, parts: { ...none, arrows: step === 0 ? 1 : .32, region: step >= 1 ? 1 : 0, diagonal: step >= 2 ? 1 : 0 }, route: null }]
  }
  const shown = { ...none, fresh: 1, far: 1, prior: 1 }
  if (mode === 'emblem') return [{ reach: true, parts: { ...shown, far: 0, prior: 0, region: 1, ghost: 1 }, route: { path: anchored, seconds: 1.3 } }]
  return [
    { name: 'EWC', reach: false, parts: { ...shown, region: 1 }, route: { path: held.path, rest: held.rest, seconds: 1.3 } },
    { name: 'Replay', reach: true, parts: shown, route: { path: drifted, seconds: 2.6 } },
    { name: 'Trust Region', reach: true, parts: { ...shown, region: 1, ghost: 1 }, route: { path: anchored, seconds: 1.3 } },
  ]
}

/** What each figure frames, how far the scene is turned on the ground, and how much of the stage it fills. */
const frames = {
  forgetting: { extent: [...[near1, near2, task3(true)].flatMap(shape => outline(shape, 24)), before], turn: .15, wide: .9, tall: .62, middle: .54 },
  region: { extent: [...close, ...gradients.flatMap(bundle => bundle.tips)], turn: .3, wide: .66, tall: .58, middle: .54 },
  methods: { extent: whole, turn: .12, wide: .9, tall: .68, middle: .545 },
  emblem: { extent: [...close, { x: 1.55, y: -.5 }, { x: 1.55, y: .3 }], turn: .2, wide: .88, tall: .62, middle: .56 },
}

type Placed = { view: View, top: number, tall: number, unit: number, toGround: (point: Point) => Point, toScene: (point: Point) => Point }

export default function TerrainStage({ mode, step, still, seen, label }: {
  mode: TerrainMode
  step: number
  still: boolean
  seen: boolean
  label: string
}) {
  const { edition } = useSiteTheme()
  const canvas = useRef<HTMLCanvasElement>(null)
  const state = useRef({ mode, step, still, seen })
  const wake = useRef<() => void>(() => {})
  // When the current station was entered. A figure arrives already drawn, and a path is traced only when its station is chosen.
  const entered = useRef(-1e9)

  useEffect(() => {
    const changed = state.current.step !== step || state.current.mode !== mode
    state.current = { mode, step, still, seen }
    if (changed) entered.current = 0
    wake.current()
  }, [mode, step, still, seen])

  useEffect(() => {
    const element = canvas.current
    const context = element?.getContext('2d')
    if (!element || !context) return
    const styles = getComputedStyle(element)
    const line = styles.getPropertyValue('--site-field-line').trim() || '0, 0, 0'
    const paper = styles.getPropertyValue('--site-paper').trim() || '#ffffff'
    const accent = styles.getPropertyValue('--site-accent').trim() || '#0071e3'
    const family = styles.fontFamily
    const ink = (alpha: number) => `rgba(${line}, ${alpha})`

    let width = 1
    let placed: Placed[] = []
    let frame = 0
    let last = 0
    // A figure with one strip eases between stations. The strips of the comparison do not change.
    let now: Parts = { ...stripsFor(state.current.mode, state.current.step)[0].parts }
    let travelled = 1

    function resize() {
      const bounds = element!.getBoundingClientRect()
      const ratio = Math.min(2, window.devicePixelRatio || 1)
      width = Math.max(1, Math.round(bounds.width))
      const height = Math.max(1, Math.round(bounds.height))
      element!.width = Math.round(width * ratio)
      element!.height = Math.round(height * ratio)
      context!.setTransform(ratio, 0, 0, ratio, 0, 0)
      const current = state.current.mode
      const { extent, turn, wide, tall: share, middle } = frames[current]
      const count = current === 'methods' ? 3 : 1
      const tall = height / count
      placed = Array.from({ length: count }, (_, index) => {
        const pitch = current === 'region' ? (width < 560 ? 58 : 48) : current === 'methods' ? (width < 560 ? 63 : 52) : width < 560 ? 52 : 44
        const view = makeView(width, tall, tall * .03, pitch)
        // Place the scene inside the strip. Perspective bends the fit, so settle it in a few passes.
        let anchor = view.ground(width * .3, tall * .55)
        let unit = view.reach(anchor.y) * .6
        for (let pass = 0; pass < 7; pass += 1) {
          const toGround = place(anchor, unit, turn)
          let left = Infinity
          let right = -Infinity
          let top = Infinity
          let bottom = -Infinity
          for (const point of extent) {
            const ground = toGround(point)
            const [x, y] = view.project(ground.x, ground.y, 0)
            left = Math.min(left, x); right = Math.max(right, x)
            top = Math.min(top, y); bottom = Math.max(bottom, y)
          }
          const grow = Math.min(width * (width < 560 ? Math.max(wide, .92) : wide) / (right - left), tall * share / (bottom - top))
          const [ax, ay] = view.project(anchor.x, anchor.y, 0)
          const scaled = view.ground(width / 2 + (ax - (left + right) / 2) * grow, tall * middle + (ay - (top + bottom) / 2) * grow)
          unit *= grow * view.reach(scaled.y) / view.reach(anchor.y)
          anchor = scaled
        }
        return { view, top: index * tall, tall, unit, toGround: place(anchor, unit, turn), toScene: unplace(anchor, unit, turn) }
      })
    }

    function drawStrip(at: Placed, strip: Strip, parts: Parts, share: number, named: boolean, current: TerrainMode) {
      const { view, unit, toGround, toScene } = at
      const surface = { reach: strip.reach, fresh: parts.fresh, far: parts.far }
      const pixel = (point: Point): [number, number] => {
        const ground = toGround(point)
        return view.project(ground.x, ground.y, unit * depth(point, surface))
      }
      const trace = (points: Point[], upTo = 1) => {
        const count = Math.max(2, Math.round(1 + (points.length - 1) * upTo))
        context!.beginPath()
        for (let index = 0; index < count && index < points.length; index += 1) {
          const [x, y] = pixel(points[index])
          if (index === 0) context!.moveTo(x, y)
          else context!.lineTo(x, y)
        }
      }
      const words = (text: string, point: Point, dx: number, dy: number, color: string, align: CanvasTextAlign = 'center') => {
        const [x, y] = pixel(point)
        context!.font = `400 15px ${family}`
        context!.textAlign = align
        context!.textBaseline = 'middle'
        // A little paper behind the words keeps them clear of the ridges.
        const wide = context!.measureText(text).width
        const from = align === 'left' ? x + dx : align === 'right' ? x + dx - wide : x + dx - wide / 2
        const left = clamp(from, 4, width - wide - 4)
        const row = clamp(y + dy, 13, at.tall - 13)
        const alpha = context!.globalAlpha
        context!.fillStyle = paper
        context!.globalAlpha = alpha * .86
        context!.fillRect(left - 5, row - 11, wide + 10, 22)
        context!.globalAlpha = alpha
        context!.fillStyle = color
        context!.textAlign = 'left'
        context!.fillText(text, left, row)
      }
      const farthest = (points: Point[], score: (x: number, y: number) => number) => points.reduce((best, point) => score(...pixel(point)) > score(...pixel(best)) ? point : best)
      const lowest = (points: Point[]) => farthest(points, (_, y) => y)
      const highest = (points: Point[]) => farthest(points, (_, y) => -y)
      const area = (points: Point[], fill: number, stroke: number, alpha = 1) => {
        if (points.length < 3 || alpha < .01) return
        context!.globalAlpha = alpha
        trace(points)
        context!.closePath()
        if (fill > 0) { context!.fillStyle = ink(fill); context!.fill() }
        if (stroke > 0) { context!.strokeStyle = ink(stroke); context!.lineWidth = 1; context!.stroke() }
        context!.globalAlpha = 1
      }

      context!.save()
      context!.beginPath()
      context!.rect(0, at.top, width, at.tall)
      context!.clip()
      context!.translate(0, at.top)
      context!.lineJoin = 'round'
      context!.lineCap = 'round'

      drawRidges(context!, view, (x, y) => unit * depth(toScene({ x, y }), surface), paper, line, 1, clamp(Math.round(at.tall / 8.4), 16, width < 700 ? 46 : 62))

      // Where each task has low loss, and where all three do.
      const three = outline(task3(strip.reach))
      area(outline(far1), .045, .5, parts.far)
      area(outline(far2), .045, .5, parts.far)
      area(outline(near1), .045, .5)
      area(outline(near2), .045, .5)
      area(three, .045, .62, parts.fresh)
      area(sharedNear(strip.reach), .1, 0, parts.fresh)
      area(sharedFar(strip.reach), .1, 0, parts.fresh * parts.far)

      // The regions a penalty describes.
      if (parts.diagonal > .01) {
        context!.globalAlpha = parts.diagonal
        trace(diagonalOutline())
        context!.closePath()
        context!.setLineDash([4, 4])
        context!.strokeStyle = ink(.85)
        context!.lineWidth = 1.25
        context!.stroke()
        context!.setLineDash([])
        context!.globalAlpha = 1
      }
      if (parts.region > .01) {
        trace(trustOutline())
        context!.closePath()
        context!.fillStyle = accent
        context!.globalAlpha = .07 * parts.region
        context!.fill()
        context!.globalAlpha = parts.region
        context!.strokeStyle = accent
        context!.lineWidth = 1.5
        context!.stroke()
        context!.globalAlpha = 1
      }

      // Per-sample gradients of each old task, at the parameters where its Fisher is computed.
      if (parts.arrows > .01) {
        context!.globalAlpha = parts.arrows
        context!.strokeStyle = accent
        context!.fillStyle = accent
        context!.lineWidth = 1.25
        for (const bundle of gradients) {
          const [ox, oy] = pixel(bundle.at)
          for (const tip of bundle.tips) {
            const [gx, gy] = pixel(tip)
            context!.beginPath()
            context!.moveTo(ox, oy)
            context!.lineTo(gx, gy)
            context!.stroke()
            const heading = Math.atan2(gy - oy, gx - ox)
            context!.beginPath()
            context!.moveTo(gx, gy)
            context!.lineTo(gx - 6 * Math.cos(heading - .38), gy - 6 * Math.sin(heading - .38))
            context!.lineTo(gx - 6 * Math.cos(heading + .38), gy - 6 * Math.sin(heading + .38))
            context!.closePath()
            context!.fill()
          }
        }
        context!.globalAlpha = 1
      }

      // The paths: the update for Task 2, what replay alone does, and the update for the new task.
      const { route } = strip
      if (parts.prior > .01) {
        context!.globalAlpha = parts.prior
        trace(prior)
        context!.setLineDash([1, 5])
        context!.strokeStyle = ink(.62)
        context!.lineWidth = 1.5
        context!.stroke()
        context!.setLineDash([])
        context!.globalAlpha = 1
      }
      if (parts.ghost > .01) {
        context!.globalAlpha = parts.ghost
        trace(driftedOn)
        context!.strokeStyle = ink(.36)
        context!.lineWidth = 1.5
        context!.stroke()
        context!.globalAlpha = 1
      }
      if (route?.rest && share > .98) {
        trace(route.rest)
        context!.setLineDash([3, 6])
        context!.strokeStyle = ink(.5)
        context!.lineWidth = 1.25
        context!.stroke()
        context!.setLineDash([])
      }
      if (route) {
        trace(route.path, share)
        context!.strokeStyle = accent
        context!.lineWidth = 2
        context!.stroke()
      }

      // The Task 1 optimum, the old-task optimum, the new-task optimum, and the parameters.
      const ring = (point: Point, radius: number, alpha = 1) => {
        const [x, y] = pixel(point)
        context!.globalAlpha = alpha
        context!.beginPath()
        context!.arc(x, y, radius, 0, Math.PI * 2)
        context!.fillStyle = paper
        context!.fill()
        context!.strokeStyle = ink(.9)
        context!.lineWidth = 1.25
        context!.stroke()
        context!.globalAlpha = 1
      }
      const tracing = current === 'forgetting' && route?.path === prior
      if (parts.prior > .01 || tracing || current === 'region') ring(before, 4.5, tracing || current === 'region' ? 1 : parts.prior)
      ring(start, 8.5)
      if (current === 'forgetting' && parts.fresh > .01) {
        const [tx, ty] = pixel(task3(true).at)
        context!.globalAlpha = parts.fresh
        context!.beginPath()
        context!.moveTo(tx - 7, ty); context!.lineTo(tx + 7, ty)
        context!.moveTo(tx, ty - 7); context!.lineTo(tx, ty + 7)
        context!.strokeStyle = ink(.9)
        context!.lineWidth = 1.25
        context!.stroke()
        context!.globalAlpha = 1
      }
      const model = route ? route.path[Math.min(route.path.length - 1, Math.round((route.path.length - 1) * share))] : start
      const [mx, my] = pixel(model)
      context!.beginPath()
      context!.arc(mx, my, 12, 0, Math.PI * 2)
      context!.fillStyle = accent
      context!.globalAlpha = .14
      context!.fill()
      context!.globalAlpha = 1
      context!.beginPath()
      context!.arc(mx, my, 5, 0, Math.PI * 2)
      context!.fill()

      if (current === 'emblem') { context!.restore(); return }
      // Names, on the drawing.
      words('Task 1', lowest(outline(near1, 96).filter(point => point.x < near1.at.x)), 0, 17, ink(1))
      words('Task 2', outline(near2, 2)[1], -8, -15, ink(1), 'right')
      if (parts.fresh > .01) {
        context!.globalAlpha = parts.fresh
        // Over the stretch of Task 3's region between the two crossings.
        const three = task3(strip.reach)
        const top = outline(three, 192).filter(point => Math.abs(point.x - (strip.reach ? (width < 560 ? 1.5 : 1.02) : 1.62)) < .05)
        words('Task 3', highest(top), 0, -17, ink(1))
        context!.globalAlpha = 1
      }
      if (parts.far > .01) {
        // The old tasks' second low-loss regions carry the same names.
        context!.globalAlpha = parts.far
        words('Task 1', highest(outline(far1, 48)), 6, -16, ink(1))
        words('Task 2', lowest(outline(far2, 48)), 10, 17, ink(1))
        context!.globalAlpha = 1
      }
      if (current === 'region') {
        if (parts.region > .01) {
          context!.globalAlpha = parts.region
          words('Rank-1 Fisher', lowest(trustOutline(48)), 0, 18, accent)
          context!.globalAlpha = 1
        }
        if (parts.diagonal > .01) {
          context!.globalAlpha = parts.diagonal
          words('Diagonal Fisher', highest(diagonalOutline(48)), 0, -18, ink(1))
          context!.globalAlpha = 1
        }
      } else if (parts.region > .01) {
        context!.globalAlpha = parts.region
        words('Trust region', highest(trustOutline(48)), width < 560 ? 10 : 44, -16, accent)
        context!.globalAlpha = 1
      }
      if (parts.ghost > .01) words('Shared basin', lowest(sharedNear(true)), 0, 18, ink(1))
      if (strip.name) {
        context!.font = `400 15px ${family}`
        context!.textAlign = 'left'
        context!.textBaseline = 'middle'
        context!.fillStyle = named ? ink(1) : ink(.56)
        context!.fillText(strip.name, 0, 14)
      }
      context!.restore()
    }

    function draw() {
      const { mode: current, step: at } = state.current
      const strips = stripsFor(current, at)
      context!.clearRect(0, 0, width, element!.height)
      strips.forEach((strip, index) => {
        if (!placed[index]) return
        const one = strips.length === 1
        // In the comparison, the strip of the current station is the one being traced.
        drawStrip(placed[index], strip, one ? now : strip.parts, one || index === at ? travelled : 1, index === at, current)
      })
    }

    function tick(time: number) {
      frame = 0
      const { mode: current, step: at, still: quiet, seen: visible } = state.current
      const elapsed = Math.min(.05, (time - (last || time)) / 1000)
      last = time
      if (!entered.current) entered.current = time
      const strips = stripsFor(current, at)
      const aims = strips[0].parts
      const ease = quiet ? 1 : 1 - Math.exp(-elapsed / .16)
      let settled = true
      for (const key of Object.keys(aims) as (keyof Parts)[]) {
        now[key] += (aims[key] - now[key]) * ease
        if (Math.abs(aims[key] - now[key]) > .004) settled = false
        else now[key] = aims[key]
      }
      const route = strips[Math.min(strips.length - 1, strips.length === 1 ? 0 : at)].route
      travelled = !route || quiet ? 1 : smooth((time - entered.current) / 1000 / route.seconds)
      if (route && travelled < 1) settled = false
      draw()
      if (!settled && visible && !document.hidden) frame = requestAnimationFrame(tick)
      else last = 0
    }
    wake.current = () => { if (!frame) frame = requestAnimationFrame(tick) }

    const onResize = () => { resize(); wake.current() }
    resize()
    const sizes = new ResizeObserver(onResize)
    sizes.observe(element)
    document.addEventListener('visibilitychange', wake.current)
    void document.fonts?.ready.then(() => wake.current())
    wake.current()

    return () => {
      cancelAnimationFrame(frame)
      sizes.disconnect()
      document.removeEventListener('visibilitychange', wake.current)
      wake.current = () => {}
    }
  }, [edition])

  return <canvas ref={canvas} className="terrain" data-mode={mode} role="img" aria-label={label} />
}
