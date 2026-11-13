/* The essay's one scene, in the plane of two parameters. It follows Figure 1
   of the Trust Region paper: three tasks, each with a low-loss region.

   Task 1 and Task 2 are the old tasks. Their low-loss regions cross, and the
   parameters start in the crossing, at the old-task optimum. Task 3 is the new
   task. The trust region is the Fisher-metric neighbourhood of the crossing,
   built from one rank-1 Fisher per old task.

   Overparameterized models have many equivalent solutions, so Task 1 and
   Task 2 have a second pair of low-loss regions that cross far from the
   old-task optimum. Where all three tasks overlap is a shared basin: one inside
   the trust region, one far away.

   The paper draws EWC for a new task whose low-loss region does not overlap
   the trust region. `reach` selects that case (false) or a new task that
   reaches it (true).

   Lengths are in scene units. The scene illustrates parameter updates. It
   carries no measurements. The NeurIPS poster build reads this file too, so it
   imports nothing. */

export type Point = { x: number, y: number }
export type Ellipse = { at: Point, a: number, b: number, turn: number }

const degrees = Math.PI / 180
const dir = (angle: number): Point => ({ x: Math.cos(angle), y: Math.sin(angle) })
const add = (p: Point, q: Point, k = 1): Point => ({ x: p.x + k * q.x, y: p.y + k * q.y })
const toward = (from: Point, to: Point, share: number): Point => ({ x: from.x + (to.x - from.x) * share, y: from.y + (to.y - from.y) * share })

/** Where the two old tasks' valleys cross, their directions, and their half-width. */
const crossing: Point = { x: 0, y: 0 }
const valley1 = 33 * degrees
const valley2 = -27 * degrees
const width = .44

/** Task 1 and Task 2 around the old-task optimum. */
export const near1: Ellipse = { at: add(crossing, dir(valley1), -.30), a: 1, b: width, turn: valley1 }
export const near2: Ellipse = { at: add(crossing, dir(valley2), .22), a: 1.05, b: width, turn: valley2 }
/** Their second low-loss regions, far from it. */
export const far1: Ellipse = { at: { x: 2.62, y: -.10 }, a: .78, b: .33, turn: 62 * degrees }
export const far2: Ellipse = { at: { x: 2.55, y: -.32 }, a: .82, b: .33, turn: -58 * degrees }
/** Task 3. With `reach` its low-loss region overlaps the trust region. */
export const task3 = (reach: boolean): Ellipse => reach
  ? { at: { x: 1.75, y: -.14 }, a: 1.80, b: .50, turn: -3 * degrees }
  : { at: { x: 2.37, y: -.17 }, a: 1.18, b: .50, turn: -3 * degrees }

/** The parameters after Task 1, and after Task 2: the old-task optimum. */
export const before: Point = add(crossing, dir(valley1), -.95)
export const start: Point = add(crossing, dir(valley2), -.30)

/** How far out of an ellipse a point is. Inside is below 1. */
export function inside(shape: Ellipse, point: Point) {
  const dx = point.x - shape.at.x
  const dy = point.y - shape.at.y
  const cos = Math.cos(shape.turn)
  const sin = Math.sin(shape.turn)
  return ((dx * cos + dy * sin) / shape.a) ** 2 + ((-dx * sin + dy * cos) / shape.b) ** 2
}

export function outline(shape: Ellipse, steps = 96): Point[] {
  const cos = Math.cos(shape.turn)
  const sin = Math.sin(shape.turn)
  return Array.from({ length: steps + 1 }, (_, index) => {
    const angle = index / steps * Math.PI * 2
    const u = shape.a * Math.cos(angle)
    const v = shape.b * Math.sin(angle)
    return { x: shape.at.x + u * cos - v * sin, y: shape.at.y + u * sin + v * cos }
  })
}

/** A point of an ellipse's long axis, as a share of its half-length from the middle. */
export const along = (shape: Ellipse, share: number): Point => add(shape.at, dir(shape.turn), share * shape.a)

export function middle(points: Point[]): Point {
  const sum = points.reduce((total, point) => ({ x: total.x + point.x, y: total.y + point.y }), { x: 0, y: 0 })
  return { x: sum.x / points.length, y: sum.y / points.length }
}

/** Where every one of the shapes holds: the boundary points of each that lie inside the others, in order. */
export function overlap(shapes: Ellipse[], steps = 180): Point[] {
  const points: Point[] = []
  shapes.forEach((shape, index) => {
    for (const point of outline(shape, steps).slice(1)) {
      if (shapes.every((other, at) => at === index || inside(other, point) <= 1)) points.push(point)
    }
  })
  if (points.length < 3) return []
  const centre = middle(points)
  points.sort((p, q) => Math.atan2(p.y - centre.y, p.x - centre.x) - Math.atan2(q.y - centre.y, q.x - centre.x))
  return [...points, points[0]]
}

/* The trust region. Each old task's rank-1 Fisher constrains one direction:
   the direction of its mean gradient, across its valley. The two penalties add
   to an ellipse around the crossing. `budget` is the penalty on its boundary. */
const across1 = dir(valley1 + Math.PI / 2)
const across2 = dir(valley2 + Math.PI / 2)
export const budget = 1.55
export function penalty(point: Point) {
  const dx = point.x - crossing.x
  const dy = point.y - crossing.y
  return ((dx * across1.x + dy * across1.y) / width) ** 2 + ((dx * across2.x + dy * across2.y) / width) ** 2
}
/** In the axes of the valleys' bisector the penalty is diagonal: these are its two curvatures. */
const half = (valley1 - valley2) / 2
const bisector = (valley1 + valley2) / 2
const curve = { along: 2 * Math.sin(half) ** 2 / width ** 2, across: 2 * Math.cos(half) ** 2 / width ** 2 }
export const trust: Ellipse = { at: crossing, a: Math.sqrt(budget / curve.along), b: Math.sqrt(budget / curve.across), turn: bisector }
export const trustOutline = (steps = 120) => outline(trust, steps)

/** The diagonal Fisher at the same budget. It keeps the per-parameter terms only, in parameter axes turned from the scene's. */
export const parameterAxes = bisector + 38 * degrees
export const diagonal: Ellipse = (() => {
  const cos = Math.cos(parameterAxes - bisector)
  const sin = Math.sin(parameterAxes - bisector)
  const first = curve.along * cos * cos + curve.across * sin * sin
  const second = curve.along * sin * sin + curve.across * cos * cos
  return { at: crossing, a: Math.sqrt(budget / first), b: Math.sqrt(budget / second), turn: parameterAxes }
})()
export const diagonalOutline = (steps = 120) => outline(diagonal, steps)

/** Per-sample gradients of an old task: nearly one direction, across its valley. */
const bundle = (at: Point, across: number): { at: Point, tips: Point[] } => ({
  at,
  tips: [-.08, -.035, 0, .04, .085].map((spread, index) => add(at, dir(across + spread), [.25, .34, .30, .37, .28][index])),
})
export const gradients = [bundle(before, valley1 + Math.PI / 2), bundle(start, valley2 + Math.PI / 2)]

/** The shared basins: where all three tasks overlap, near the old-task optimum and far from it. */
export const sharedNear = (reach: boolean) => reach ? overlap([near1, near2, task3(true)]) : []
export const sharedFar = (reach: boolean) => overlap([far1, far2, task3(reach)])

/* Paths. Each is a smooth line through a few points. */
function through(points: Point[], steps = 16): Point[] {
  const path: Point[] = []
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(0, index - 1)]
    const p1 = points[index]
    const p2 = points[index + 1]
    const p3 = points[Math.min(points.length - 1, index + 2)]
    for (let step = 0; step < steps; step += 1) {
      const t = step / steps
      path.push({
        x: .5 * (2 * p1.x + (p2.x - p0.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t * t + (3 * p1.x - p0.x - 3 * p2.x + p3.x) * t ** 3),
        y: .5 * (2 * p1.y + (p2.y - p0.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t * t + (3 * p1.y - p0.y - 3 * p2.y + p3.y) * t ** 3),
      })
    }
  }
  path.push(points[points.length - 1])
  return path
}

/** Learning Task 2: from the Task 1 optimum into the crossing. */
export const prior = through([before, add(before, { x: .30, y: .30 }), start])

/** Where the trust region ends on the way from one point toward another. */
function edge(from: Point, to: Point): Point {
  let low = 0
  let high = 1
  for (let pass = 0; pass < 40; pass += 1) {
    const mid = (low + high) / 2
    if (penalty(toward(from, to, mid)) <= budget) low = mid
    else high = mid
  }
  return toward(from, to, low)
}

/** EWC: toward the new task until the trust region ends. The new task lies beyond it. */
export const held = (() => {
  const tip = outline(task3(false), 240).reduce((best, point) => point.x < best.x ? point : best)
  const stop = edge(start, tip)
  return { path: through([start, toward(start, stop, .5), stop]), rest: [stop, tip] }
})()

/** Trust Region: into the shared basin inside the trust region. */
const settle: Point = (() => {
  const basin = sharedNear(true).filter(point => penalty(point) <= budget)
  // A little toward the old-task optimum from the basin's middle.
  return toward(middle(basin), start, .12)
})()
const upTo = [start, toward(start, settle, .55), settle]
export const anchored = through(upTo)

/** Replay: through the same shared basin and on, along the new task's valley, to the far one. */
const drift = 14
export const drifted = through([...upTo, { x: .98, y: -.22 }, { x: 1.62, y: -.02 }, { x: 2.16, y: -.20 }, middle(sharedFar(true))], drift)
/** The part of it beyond the shared basin near the old-task optimum. */
export const driftedOn = drifted.slice(2 * drift)

/** Finetuning: to the new-task optimum, the middle of Task 3's low-loss region. */
export const fineTuned = through([start, { x: .66, y: .06 }, task3(true).at])

/* The surface: rolling ground, with a valley for each task's low-loss region.
   Depth is negative downward, in scene units. `fresh` fades the new task in,
   and `far` the old tasks' second regions. */
const well = (shape: Ellipse, point: Point) => Math.exp(-.82 * inside(shape, point) ** 1.1)
const either = (a: number, b: number) => 1 - (1 - a) * (1 - b)
export function depth(point: Point, { reach = true, fresh = 1, far = 1 }: { reach?: boolean, fresh?: number, far?: number } = {}) {
  const ground = .05 * Math.sin(1.3 * point.x + .5) * Math.cos(1.5 * point.y - .3)
    + .03 * Math.sin(2.6 * point.x - 1.7 * point.y + 1.7)
    + .02 * Math.cos(3.9 * point.y + 1.2 * point.x)
  const first = either(well(near1, point), far * well(far1, point))
  const second = either(well(near2, point), far * well(far2, point))
  const third = well(task3(reach), point) * fresh
  // Valleys deepen where they cross, by less each time.
  return ground - .44 * (1 - (1 - .5 * first) * (1 - .5 * second) * (1 - .56 * third))
}

/** What a view frames: the whole scene, or the old tasks around the old-task optimum. */
export const whole: Point[] = [near1, near2, far1, far2, task3(true)].flatMap(shape => outline(shape, 24))
export const close: Point[] = [near1, near2].flatMap(shape => outline(shape, 24))

/** From scene axes to the ground of a view, around an anchor, at a scale, turned by an angle. */
export function place(anchor: Point, unit: number, turn: number) {
  const cos = Math.cos(turn)
  const sin = Math.sin(turn)
  return (point: Point): Point => ({
    x: anchor.x + unit * (point.x * cos - point.y * sin),
    y: anchor.y + unit * (point.x * sin + point.y * cos),
  })
}

/** And back. */
export function unplace(anchor: Point, unit: number, turn: number) {
  const cos = Math.cos(turn)
  const sin = Math.sin(turn)
  return (point: Point): Point => {
    const dx = (point.x - anchor.x) / unit
    const dy = (point.y - anchor.y) / unit
    return { x: dx * cos + dy * sin, y: -dx * sin + dy * cos }
  }
}
