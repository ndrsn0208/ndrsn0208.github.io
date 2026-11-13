import { useEffect, useRef } from 'react'
import { useSiteTheme } from './SiteFrame'
import { clamp, drawRidges, makeView, smooth, type Point, type View } from './terrain'

/* The site's one drawing: a loss surface in parameter space, in hairlines.

   A hollow ring marks where the model stood after earlier tasks, and the blue
   boundary around it is a trust region. The cross is a new task. The blue point
   is the model: it descends toward the new task and stops where the region ends.
   The dashed line is the rest of the way, which it does not take.

   This is an illustration of the idea, not a measured loss. The pointer moves
   the new task. With no pointer the task drifts on its own. */

/** The drawing-in plays once per visit. Changing the appearance redraws the finished state. */
let opened = false

function makeScene(view: View) {
  const anchor = view.ground(view.width * .36, view.top + (view.height - view.top) * .5)
  const unit = Math.min(view.reach(anchor.y), 2.4)
  const tilt = -.34
  return {
    anchor, unit, tilt,
    a: unit * .34,
    b: unit * .19,
    cos: Math.cos(tilt),
    sin: Math.sin(tilt),
  }
}
type Scene = ReturnType<typeof makeScene>

const toLocal = (scene: Scene, point: Point): Point => {
  const dx = point.x - scene.anchor.x
  const dy = point.y - scene.anchor.y
  return { x: dx * scene.cos + dy * scene.sin, y: -dx * scene.sin + dy * scene.cos }
}
const toWorld = (scene: Scene, local: Point): Point => ({
  x: scene.anchor.x + local.x * scene.cos - local.y * scene.sin,
  y: scene.anchor.y + local.x * scene.sin + local.y * scene.cos,
})

/** The closest point of the region's boundary to a point outside it. */
function closestOnBoundary(a: number, b: number, point: Point): Point {
  const px = Math.abs(point.x)
  const py = Math.abs(point.y)
  let tx = .7071
  let ty = .7071
  for (let step = 0; step < 4; step += 1) {
    const ex = (a * a - b * b) * tx ** 3 / a
    const ey = (b * b - a * a) * ty ** 3 / b
    const rx = a * tx - ex
    const ry = b * ty - ey
    const qx = px - ex
    const qy = py - ey
    const r = Math.hypot(rx, ry)
    const q = Math.hypot(qx, qy) || 1
    tx = clamp((qx * r / q + ex) / a, 0, 1)
    ty = clamp((qy * r / q + ey) / b, 0, 1)
    const length = Math.hypot(tx, ty) || 1
    tx /= length
    ty /= length
  }
  return { x: Math.sign(point.x || 1) * a * tx, y: Math.sign(point.y || 1) * b * ty }
}

/** Where descent toward the new task leads when it may not leave the region. */
function learn(scene: Scene, task: Point) {
  const local = toLocal(scene, task)
  const outside = (local.x / scene.a) ** 2 + (local.y / scene.b) ** 2
  if (outside <= 1) return { path: [scene.anchor, task], rest: null as Point[] | null, model: task }
  const reachEdge = 1 / Math.sqrt(outside)
  const edge = { x: local.x * reachEdge, y: local.y * reachEdge }
  const end = closestOnBoundary(scene.a, scene.b, local)
  const from = Math.atan2(edge.y / scene.b, edge.x / scene.a)
  let turn = Math.atan2(end.y / scene.b, end.x / scene.a) - from
  if (turn > Math.PI) turn -= 2 * Math.PI
  if (turn < -Math.PI) turn += 2 * Math.PI
  const path = [scene.anchor]
  for (let index = 0; index <= 18; index += 1) {
    const angle = from + turn * index / 18
    path.push(toWorld(scene, { x: scene.a * Math.cos(angle), y: scene.b * Math.sin(angle) }))
  }
  return { path, rest: [toWorld(scene, edge), task], model: path[path.length - 1] }
}

function height(scene: Scene, task: Point, x: number, y: number) {
  const u = scene.unit
  const local = toLocal(scene, { x, y })
  const known = (local.x / (scene.a * 1.3)) ** 2 + (local.y / (scene.b * 1.3)) ** 2
  const fresh = ((x - task.x) ** 2 + (y - task.y) ** 2) / (u * .25) ** 2
  const ground = .075 * Math.sin(1.5 * x / u + .5) * Math.cos(1.2 * y / u - .3)
    + .045 * Math.sin(2.7 * x / u - 1.3 * y / u + 1.7)
    + .03 * Math.cos(3.9 * y / u + .9 * x / u)
  return u * (ground - .12 * Math.exp(-known / 2) - .2 * Math.exp(-fresh / 2))
}

export default function Landscape({ className = '' }: { className?: string }) {
  const { edition } = useSiteTheme()
  const canvas = useRef<HTMLCanvasElement>(null)

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

    let view = makeView(1, 1)
    let scene = makeScene(view)
    let task: Point = { x: 0, y: 0 }
    let placed = false
    let pointer: Point | null = null
    let frame = 0
    let visible = true
    let began = 0
    let last = 0

    const drift = (seconds: number): Point => view.ground(
      view.width * (.6 + .2 * Math.cos(.31 * seconds + .4)),
      view.top + (view.height - view.top) * (.5 + .24 * Math.sin(.43 * seconds - .2)),
    )

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
      scene = makeScene(view)
      if (!placed) { task = drift(0); placed = true }
    }

    function trace(points: Point[], share = 1) {
      const count = Math.max(2, Math.round(1 + (points.length - 1) * share))
      context!.beginPath()
      for (let index = 0; index < count && index < points.length; index += 1) {
        const point = points[index]
        const [x, y] = view.project(point.x, point.y, height(scene, task, point.x, point.y))
        if (index === 0) context!.moveTo(x, y)
        else context!.lineTo(x, y)
      }
    }

    function draw(now: number) {
      const { width, height: tall } = view
      const elapsed = (now - began) / 1000
      const still = motionQuery.matches
      const surface = still || opened ? 1 : smooth(elapsed / 1.3)
      const route = still || opened ? 1 : smooth((elapsed - .7) / 1.1)
      if (elapsed > 1.9) opened = true
      context!.clearRect(0, 0, width, tall)
      context!.lineJoin = 'round'
      context!.lineCap = 'round'

      drawRidges(context!, view, (x, y) => height(scene, task, x, y), paper, line, surface)

      const learned = learn(scene, task)
      const boundary: Point[] = []
      for (let index = 0; index <= 96; index += 1) {
        const angle = index / 96 * Math.PI * 2
        boundary.push(toWorld(scene, { x: scene.a * Math.cos(angle), y: scene.b * Math.sin(angle) }))
      }
      context!.globalAlpha = surface
      trace(boundary)
      context!.closePath()
      context!.fillStyle = accent
      context!.globalAlpha = .05 * surface
      context!.fill()
      context!.globalAlpha = surface
      context!.strokeStyle = accent
      context!.lineWidth = 1.25
      context!.stroke()

      if (learned.rest && route > 0) {
        trace(learned.rest)
        context!.setLineDash([3, 6])
        context!.strokeStyle = `rgba(${line}, ${.5 * route})`
        context!.lineWidth = 1.25
        context!.stroke()
        context!.setLineDash([])
      }
      if (route > 0) {
        trace(learned.path, route)
        context!.strokeStyle = accent
        context!.lineWidth = 2
        context!.stroke()
      }

      const mark = (point: Point) => view.project(point.x, point.y, height(scene, task, point.x, point.y))
      const [ax, ay] = mark(scene.anchor)
      context!.beginPath()
      context!.arc(ax, ay, 4, 0, Math.PI * 2)
      context!.fillStyle = paper
      context!.fill()
      context!.strokeStyle = `rgba(${line}, .9)`
      context!.lineWidth = 1.25
      context!.stroke()

      const [tx, ty] = mark(task)
      context!.beginPath()
      context!.moveTo(tx - 7, ty); context!.lineTo(tx + 7, ty)
      context!.moveTo(tx, ty - 7); context!.lineTo(tx, ty + 7)
      context!.strokeStyle = `rgba(${line}, .9)`
      context!.lineWidth = 1.25
      context!.stroke()

      if (route > 0) {
        const steps = learned.path
        const reached = steps[Math.min(steps.length - 1, Math.max(1, Math.round((steps.length - 1) * route)))]
        const [mx, my] = mark(route >= 1 ? learned.model : reached)
        context!.beginPath()
        context!.arc(mx, my, 12, 0, Math.PI * 2)
        context!.fillStyle = accent
        context!.globalAlpha = .14 * surface
        context!.fill()
        context!.globalAlpha = surface
        context!.beginPath()
        context!.arc(mx, my, 5.5, 0, Math.PI * 2)
        context!.fill()
      }
      context!.globalAlpha = 1
    }

    function tick(now: number) {
      frame = 0
      if (!began) began = now
      const step = Math.min(.05, (now - (last || now)) / 1000)
      last = now
      const still = motionQuery.matches
      const goal = pointer ?? (still ? task : drift((now - began) / 1000))
      const ease = still ? 1 : 1 - Math.exp(-step / (pointer ? .12 : .5))
      task = { x: task.x + (goal.x - task.x) * ease, y: task.y + (goal.y - task.y) * ease }
      draw(now)
      if (visible && !document.hidden && !still) frame = requestAnimationFrame(tick)
    }
    const wake = () => { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick) }

    const onMove = (event: PointerEvent) => {
      const bounds = element.getBoundingClientRect()
      const px = event.clientX - bounds.left
      const py = event.clientY - bounds.top
      if (py < view.top * .8 || py > bounds.height) { pointer = null; return }
      let point = view.ground(px, py)
      for (let pass = 0; pass < 3; pass += 1) point = view.ground(px, py, height(scene, point, point.x, point.y))
      const reach = view.reach(point.y) * .94
      pointer = { x: clamp(point.x, -reach, reach), y: point.y }
      wake()
    }
    const onLeave = () => { pointer = null; last = 0; wake() }
    const onResize = () => { resize(); wake() }
    const onVisibility = () => { last = 0; wake() }

    resize()
    const sizes = new ResizeObserver(onResize)
    sizes.observe(element)
    if (words) sizes.observe(words)
    const watcher = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; last = 0; wake() })
    watcher.observe(element)
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerdown', onMove)
    host.addEventListener('pointerleave', onLeave)
    document.addEventListener('visibilitychange', onVisibility)
    motionQuery.addEventListener('change', onVisibility)
    wake()

    return () => {
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
    className={`site-landscape ${className}`.trim()}
    role="img"
    aria-label="An illustration of a loss surface. A model moves toward a new task and stops at the boundary of the region where earlier tasks still work."
  />
}
