import {
  ADAPT_LIMITS,
  type AdaptPage,
  type AdaptStroke,
  type AdaptTool,
  type AdaptWeapon,
} from './model.ts'

export interface EffectsCursor {
  /** Viewport CSS pixels, including for the diffuse tool. */
  x: number
  y: number
  radius: number
  tool: AdaptTool
  pressed: boolean
}

export interface EffectsFrame {
  page: AdaptPage
  scrollY: number
  /** Viewport CSS size; width also maps normalized document x. */
  width: number
  height: number
  cursor?: EffectsCursor | null
  stroke?: AdaptStroke | null
  /** Suppresses transient weapon bursts. */
  reducedMotion?: boolean
}

export interface AdaptEffects {
  render(frame: EffectsFrame): void
  /** The impact point is in viewport CSS pixels. */
  burst(weapon: AdaptWeapon, x: number, y: number, color: string, text?: string): void
  destroy(): void
}

interface Point { x: number; y: number }
interface Bounds { left: number; top: number; right: number; bottom: number }
interface Palette { ink: string; light: string; dark: string }
interface StrokeGeometry { samples: Float64Array; bounds: Bounds; path?: Path2D }
interface StrokePaint { path: Path2D; palette: Palette }
interface Scene {
  width: number
  height: number
  scrollY: number
  strokes: StrokePaint[]
  cursor?: EffectsCursor | null
}
interface Particle {
  angle: number
  speed: number
  radius: number
  size: number
  spin: number
  lifetime: number
  glyph: string
}
interface Burst {
  weapon: AdaptWeapon
  x: number
  y: number
  start: number
  duration: number
  palette: Palette
  particles: Particle[]
}

const TAU = Math.PI * 2
const MAX_PIXELS = 6_000_000
const MAX_EDGE = 8192
const MAX_PARTICLES = 144
const PARTICLES_PER_BURST = 36
const MAX_BURSTS = MAX_PARTICLES / PARTICLES_PER_BURST
const MAX_RADIUS = 512
const MAX_STROKE_WIDTH = 96
const MAX_PALETTES = 32

function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback
}

function bound(value: number, min: number, max: number, fallback = min): number {
  return Math.max(min, Math.min(max, finite(value, fallback)))
}

function smooth(value: number): number {
  const t = bound(value, 0, 1)
  return t * t * (3 - 2 * t)
}

function hash01(seed: number, channel: number, knot: number): number {
  let h = (seed | 0) ^ Math.imul(channel | 0, 0x9e3779b1) ^ Math.imul(knot | 0, 0x85ebca77)
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d)
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b)
  return ((h ^ (h >>> 16)) >>> 0) / 0x1_0000_0000
}

function closedPath(points: Point[]): Path2D {
  const path = new Path2D()
  if (!points.length) return path
  const first = points[0]
  const last = points[points.length - 1]
  path.moveTo((first.x + last.x) / 2, (first.y + last.y) / 2)
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    // Midpoint quadratics stay inside their control-point hull: no overshoot.
    path.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2)
  }
  path.closePath()
  return path
}

function circle(path: Path2D, x: number, y: number, radius: number): void {
  path.moveTo(x + radius, y)
  path.arc(x, y, radius, 0, TAU)
  path.closePath()
}

function paletteFor(color: string): Palette {
  const match = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(color)
  const hex = match ? match[1] : 'd87550'
  const full = hex.length === 3 ? [...hex].map(c => c + c).join('') : hex
  const rgb = [0, 2, 4].map(i => Number.parseInt(full.slice(i, i + 2), 16))
  const mix = (target: number[], weight: number) => rgb.map(
    (value, i) => Math.round(value + (target[i] - value) * weight),
  ).join(', ')
  return {
    ink: `rgb(${rgb.join(', ')})`,
    light: `rgb(${mix([255, 248, 232], 0.68)})`,
    dark: `rgb(${mix([18, 24, 32], 0.65)})`,
  }
}

function intersects(bounds: Bounds, width: number, height: number, scrollY = 0): boolean {
  return bounds.right >= 0 && bounds.left <= width
    && bounds.bottom >= scrollY && bounds.top <= scrollY + height
}

function visiblePoint(x: number, y: number, radius: number, scene: Scene): boolean {
  return x + radius >= 0 && x - radius <= scene.width
    && y + radius >= 0 && y - radius <= scene.height
}

/**
 * Keep a bounded numeric snapshot instead of assuming the caller never mutates
 * a stroke in place. Equality scans are cheap; expensive paths are built only
 * for changed, visible strokes. Color and scrolling do not invalidate paths.
 */
function strokeGeometry(stroke: AdaptStroke, width: number, cached?: StrokeGeometry): StrokeGeometry {
  const count = Math.min(stroke.points.length, ADAPT_LIMITS.points)
  const size = bound(stroke.width, 0.5, MAX_STROKE_WIDTH, 4)
  const length = count * 3
  let same = cached?.samples.length === length
  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity
  // Allocate only on a cache miss; leave the existing snapshot unmodified.
  let samples: Float64Array | undefined
  for (let i = 0; i < count; i++) {
    const point = stroke.points[i]
    const x = bound(point.x, -2, 3, 0) * width
    const y = bound(point.y, -1_000_000, 1_000_000, 0)
    const radius = size * (0.55 + 0.9 * bound(point.pressure ?? 0.5, 0, 1, 0.5)) / 2
    const offset = i * 3
    if (same && cached && (cached.samples[offset] !== x
      || cached.samples[offset + 1] !== y || cached.samples[offset + 2] !== radius)) same = false
    if (!same && !samples) {
      samples = new Float64Array(length)
      if (cached) samples.set(cached.samples.subarray(0, Math.min(offset, cached.samples.length)))
    }
    if (samples) {
      samples[offset] = x
      samples[offset + 1] = y
      samples[offset + 2] = radius
    }
    left = Math.min(left, x - radius - 3)
    right = Math.max(right, x + radius + 3)
    top = Math.min(top, y - radius - 3)
    bottom = Math.max(bottom, y + radius + 3)
  }
  if (same && cached) return cached
  return { samples: samples ?? new Float64Array(0), bounds: { left, top, right, bottom } }
}

function inkPath(samples: Float64Array): Path2D {
  const count = samples.length / 3
  const left: Point[] = []
  const right: Point[] = []
  for (let i = 0; i < count; i++) {
    const offset = i * 3
    const prev = Math.max(0, i - 1) * 3
    const next = Math.min(count - 1, i + 1) * 3
    const dx = samples[next] - samples[prev]
    const dy = samples[next + 1] - samples[prev + 1]
    const length = Math.hypot(dx, dy)
    const radius = samples[offset + 2]
    const nx = length > 0.001 ? dy / length * radius : 0
    const ny = length > 0.001 ? -dx / length * radius : -radius
    left.push({ x: samples[offset] + nx, y: samples[offset + 1] + ny })
    right.push({ x: samples[offset] - nx, y: samples[offset + 1] - ny })
  }
  const path = closedPath([...left, ...right.reverse()])
  if (count) {
    circle(path, samples[0], samples[1], samples[2])
    const end = (count - 1) * 3
    circle(path, samples[end], samples[end + 1], samples[end + 2])
  }
  return path
}

function paintStroke(ctx: CanvasRenderingContext2D, stroke: StrokePaint): void {
  ctx.save()
  ctx.lineJoin = 'round'
  ctx.lineWidth = 2.5
  ctx.globalAlpha = 0.22
  ctx.strokeStyle = stroke.palette.dark
  ctx.stroke(stroke.path)
  ctx.lineWidth = 1.2
  ctx.globalAlpha = 0.65
  ctx.strokeStyle = stroke.palette.light
  ctx.stroke(stroke.path)
  ctx.globalAlpha = 0.92
  ctx.fillStyle = stroke.palette.ink
  ctx.fill(stroke.path)
  ctx.restore()
}

function particlePosition(burst: Burst, particle: Particle, age: number): Point {
  const t = Math.max(0, age) / 1000
  const progress = bound(age / particle.lifetime, 0, 1)
  if (burst.weapon === 'vortex') {
    const radius = particle.radius * (1 - smooth(progress))
    const angle = particle.angle + 8 * progress + particle.spin * progress * 0.12
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * 0.72 }
  }
  const travel = particle.speed * (1 - Math.exp(-3.2 * t)) / 3.2
  return {
    x: Math.cos(particle.angle) * travel,
    y: Math.sin(particle.angle) * travel
      + (burst.weapon === 'hammer' ? 280 : 65) * t * t,
  }
}

function paintBurst(ctx: CanvasRenderingContext2D, burst: Burst, now: number, scene: Scene): boolean {
  const age = Math.max(0, now - burst.start)
  if (age >= burst.duration) return false
  const { x, y, palette, weapon } = burst
  let visible = false
  ctx.save()
  ctx.lineCap = 'round'
  const markLife = weapon === 'ray' ? burst.duration : 280
  if (age < markLife && visiblePoint(x, y, 48, scene)) {
    visible = true
    const progress = age / markLife
    ctx.globalAlpha = (1 - smooth(progress)) * 0.55
    ctx.beginPath()
    if (weapon === 'ray') {
      ctx.ellipse(x, y, 7 + progress * 11, 3 + progress * 5, -0.55, 0, TAU)
      ctx.fillStyle = palette.dark
      ctx.fill()
      ctx.lineWidth = 1.3
      ctx.strokeStyle = palette.light
      ctx.stroke()
    } else {
      ctx.arc(x, y, 6 + progress * 35, 0, TAU)
      ctx.lineWidth = 2
      ctx.strokeStyle = palette.dark
      ctx.stroke()
      ctx.lineWidth = 0.8
      ctx.strokeStyle = palette.light
      ctx.stroke()
    }
  }
  for (let i = 0; i < burst.particles.length; i++) {
    const particle = burst.particles[i]
    if (age >= particle.lifetime) continue
    const position = particlePosition(burst, particle, age)
    const px = x + position.x
    const py = y + position.y
    if (!visiblePoint(px, py, particle.size + 22, scene)) continue
    visible = true
    const progress = age / particle.lifetime
    ctx.globalAlpha = (1 - smooth((progress - 0.25) / 0.75))
      * (weapon === 'vortex' ? 0.85 * smooth(progress * 12) : 0.9)
    if (weapon === 'hammer') {
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(particle.angle + particle.spin * age / 1000)
      ctx.strokeStyle = palette.light
      ctx.fillStyle = i % 3 ? palette.ink : palette.dark
      ctx.lineWidth = 0.9
      if (particle.glyph) {
        ctx.font = `600 ${particle.size * 3 + 8}px ui-monospace, monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.strokeText(particle.glyph, 0, 0, 22)
        ctx.fillText(particle.glyph, 0, 0, 22)
      } else {
        const size = particle.size
        ctx.beginPath()
        ctx.moveTo(-size, -size * 0.6)
        ctx.lineTo(size * 0.7, -size)
        ctx.lineTo(size, size * 0.4)
        ctx.lineTo(-size * 0.35, size)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }
      ctx.restore()
    } else {
      const previous = particlePosition(burst, particle, Math.max(0, age - 28))
      ctx.beginPath()
      ctx.moveTo(x + previous.x, y + previous.y)
      ctx.lineTo(px, py)
      ctx.strokeStyle = palette.dark
      ctx.lineWidth = particle.size * 0.6 + 1.6
      ctx.stroke()
      ctx.strokeStyle = i % 3 ? palette.light : palette.ink
      ctx.lineWidth = particle.size * 0.35 + 0.6
      ctx.stroke()
    }
  }
  ctx.restore()
  return visible
}

function paintCursor(ctx: CanvasRenderingContext2D, cursor: EffectsCursor, scene: Scene): void {
  if (cursor.tool === 'browse' || !Number.isFinite(cursor.x) || !Number.isFinite(cursor.y)) return
  const radius = bound(cursor.radius, 2, MAX_RADIUS, 8)
  if (!visiblePoint(cursor.x, cursor.y, radius + 8, scene)) return
  ctx.save()
  ctx.translate(cursor.x, cursor.y)
  ctx.lineCap = 'round'
  ctx.globalAlpha = cursor.pressed ? 0.9 : 0.7
  const ring = cursor.tool === 'break' ? Math.min(radius, 18) : radius
  if (cursor.tool === 'diffuse') ctx.setLineDash([3, 5])
  ctx.beginPath()
  ctx.arc(0, 0, ring, 0, TAU)
  if (cursor.tool === 'break' || cursor.tool === 'edit' || cursor.tool === 'layout') {
    ctx.moveTo(-ring - 4, 0)
    ctx.lineTo(-ring + 3, 0)
    ctx.moveTo(ring - 3, 0)
    ctx.lineTo(ring + 4, 0)
    ctx.moveTo(0, -ring - 4)
    ctx.lineTo(0, -ring + 3)
    ctx.moveTo(0, ring - 3)
    ctx.lineTo(0, ring + 4)
  }
  ctx.strokeStyle = 'rgba(20, 25, 32, 0.65)'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255, 249, 237, 0.95)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.restore()
}

/**
 * Owns only this transparent canvas. The parent positions it over the viewport,
 * and calls render on input/scroll/resize. Diffuse changes DOM glyphs only.
 * Recreate on route changes; destroy on exit. No input listeners are installed.
 */
export function createAdaptEffects(canvas: HTMLCanvasElement): AdaptEffects {
  canvas.style.pointerEvents = 'none'
  let ctx: CanvasRenderingContext2D | null = null
  try {
    ctx = canvas.getContext('2d', { alpha: true })
  } catch { /* The site remains usable when Canvas2D is unavailable. */ }
  const doc = canvas.ownerDocument
  const view = doc.defaultView
  const motion = view?.matchMedia?.('(prefers-reduced-motion: reduce)')
  const strokeCache = new Map<string, StrokeGeometry>()
  const paletteCache = new Map<string, Palette>()
  let latest: EffectsFrame | null = null
  let scene: Scene | null = null
  let bursts: Burst[] = []
  let raf: number | null = null
  let observer: IntersectionObserver | undefined
  let intersecting = true
  let observedVisibility = false
  let destroyed = false
  let sequence = 0

  const now = () => view?.performance.now() ?? performance.now()
  const reducedMotion = () => latest?.reducedMotion ?? motion?.matches ?? false
  function visible(): boolean {
    if (destroyed || !ctx || doc.hidden || !canvas.isConnected || !intersecting
      || !scene || scene.width <= 0 || scene.height <= 0
      || canvas.width <= 0 || canvas.height <= 0) return false
    // Also cover the interval before the first observer notification, and
    // browsers without IntersectionObserver. Read only the owned canvas.
    if (!observer || !observedVisibility) {
      const rect = canvas.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0 || rect.right <= 0 || rect.bottom <= 0
        || rect.left >= (view?.innerWidth ?? scene.width)
        || rect.top >= (view?.innerHeight ?? scene.height)) return false
    }
    return true
  }

  function cancelTick(): void {
    if (raf !== null) view?.cancelAnimationFrame(raf)
    raf = null
  }

  function discardBursts(): void {
    bursts = []
    cancelTick()
  }

  function palette(color: string): Palette {
    const key = color.slice(0, 16)
    let result = paletteCache.get(key)
    if (!result) {
      result = paletteFor(key)
      if (paletteCache.size >= MAX_PALETTES) paletteCache.delete(paletteCache.keys().next().value!)
      paletteCache.set(key, result)
    }
    return result
  }

  function sizeCanvas(width: number, height: number): void {
    const dpr = Math.min(
      bound(view?.devicePixelRatio ?? 1, 1, 2, 1),
      Math.sqrt(MAX_PIXELS / Math.max(1, width * height)),
      MAX_EDGE / Math.max(1, width),
      MAX_EDGE / Math.max(1, height),
    )
    const backingWidth = Math.floor(width * dpr)
    const backingHeight = Math.floor(height * dpr)
    if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
      // Zero first, avoiding a large intermediate allocation on aspect changes.
      canvas.width = 0
      canvas.height = backingHeight
      canvas.width = backingWidth
    }
    const cssWidth = `${width}px`
    const cssHeight = `${height}px`
    if (canvas.style.width !== cssWidth) canvas.style.width = cssWidth
    if (canvas.style.height !== cssHeight) canvas.style.height = cssHeight
  }

  function prepare(frame: EffectsFrame, width: number, height: number): Scene {
    const scrollY = finite(frame.scrollY)
    const result: Scene = { width, height, scrollY, strokes: [], cursor: frame.cursor && { ...frame.cursor } }
    const strokeIds = new Set<string>()
    const addStroke = (stroke: AdaptStroke) => {
      strokeIds.add(stroke.id)
      const geometry = strokeGeometry(stroke, width, strokeCache.get(stroke.id))
      strokeCache.set(stroke.id, geometry)
      if (!geometry.samples.length || !intersects(geometry.bounds, width, height, scrollY)) return
      geometry.path ??= inkPath(geometry.samples)
      result.strokes.push({ path: geometry.path, palette: palette(stroke.color) })
    }
    for (let i = 0; i < Math.min(frame.page.strokes.length, ADAPT_LIMITS.strokes); i++) {
      const stroke = frame.page.strokes[i]
      if (stroke.id !== frame.stroke?.id) addStroke(stroke)
    }
    if (frame.stroke) addStroke(frame.stroke)
    for (const id of strokeCache.keys()) if (!strokeIds.has(id)) strokeCache.delete(id)

    return result
  }

  function paint(time: number): void {
    if (!ctx || !scene || !visible()) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.setTransform(canvas.width / scene.width, 0, 0, canvas.height / scene.height, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    ctx.lineJoin = 'round'
    ctx.setLineDash([])
    ctx.save()
    ctx.translate(0, -scene.scrollY)
    for (const stroke of scene.strokes) paintStroke(ctx, stroke)
    ctx.restore()
    if (reducedMotion()) discardBursts()
    bursts = bursts.filter(burst => paintBurst(ctx!, burst, time, scene!))
    if (scene.cursor) paintCursor(ctx, scene.cursor, scene)
  }

  function schedule(): void {
    if (raf !== null || !view || !bursts.length || !visible() || reducedMotion()) return
    raf = view.requestAnimationFrame(tick)
  }

  function tick(time: number): void {
    raf = null
    if (!visible()) {
      discardBursts()
      return
    }
    // Analytic trajectories and absolute deadlines never accumulate time debt.
    // The final paint clears expired particles before the chain stops.
    paint(time)
    schedule()
  }

  function render(frame: EffectsFrame): void {
    if (destroyed || !ctx) return
    latest = frame
    const width = bound(frame.width, 0, 32768, 0)
    const height = bound(frame.height, 0, 32768, 0)
    sizeCanvas(width, height)
    scene = { width, height, scrollY: finite(frame.scrollY), strokes: [] }
    if (!visible()) {
      discardBursts()
      return
    }
    scene = prepare(frame, width, height)
    paint(now())
    if (!bursts.length) cancelTick()
    schedule()
  }

  function onVisibility(): void {
    if (doc.hidden) discardBursts()
    else if (latest && !destroyed) render(latest)
  }

  if (ctx) {
    // Lifecycle observation only. Input, scroll, resize, and gestures belong to
    // the controller. All observers/listeners are removed by destroy().
    doc.addEventListener('visibilitychange', onVisibility)
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(entries => {
        const entry = entries[entries.length - 1]
        if (!entry || destroyed) return
        observedVisibility = true
        intersecting = entry.isIntersecting
        if (!intersecting) discardBursts()
        else if (latest) render(latest)
      })
      observer.observe(canvas)
    }
  }

  return {
    render,
    burst(weapon, x, y, color, text = '') {
      if (!visible() || !scene || reducedMotion() || !view
        || !Number.isFinite(x) || !Number.isFinite(y)
        || (weapon !== 'hammer' && weapon !== 'ray' && weapon !== 'vortex')
        || !visiblePoint(x, y, 0, scene)) return
      const seed = Math.imul(++sequence, 0x9e3779b1) ^ (x | 0) ^ Math.imul(y | 0, 31)
      const duration = weapon === 'hammer' ? 880 : weapon === 'ray' ? 640 : 1050
      const glyphs = weapon === 'hammer' ? Array.from(text.slice(0, 96)).filter(c => /\S/u.test(c)).slice(0, 12) : []
      const particles = Array.from({ length: PARTICLES_PER_BURST }, (_, i): Particle => ({
        angle: weapon === 'hammer'
          ? -Math.PI + hash01(seed, 1, i) * Math.PI
          : hash01(seed, 1, i) * TAU,
        speed: 95 + hash01(seed, 2, i) * 300,
        radius: 28 + hash01(seed, 3, i) * 96,
        size: 1.2 + hash01(seed, 4, i) * 3.2,
        spin: (hash01(seed, 5, i) - 0.5) * 12,
        lifetime: duration * (0.68 + hash01(seed, 6, i) * 0.32),
        glyph: i < glyphs.length ? glyphs[i] : '',
      }))
      while (bursts.length >= MAX_BURSTS) bursts.shift()
      bursts.push({ weapon, x, y, start: now(), duration, palette: palette(color), particles })
      paint(now())
      schedule()
    },
    destroy() {
      if (destroyed) return
      destroyed = true
      discardBursts()
      observer?.disconnect()
      doc.removeEventListener('visibilitychange', onVisibility)
      strokeCache.clear()
      paletteCache.clear()
      latest = null
      scene = null
      ctx = null
      // Releases the backing bitmap without removing the parent's canvas node.
      canvas.width = 0
      canvas.height = 0
    },
  }
}
