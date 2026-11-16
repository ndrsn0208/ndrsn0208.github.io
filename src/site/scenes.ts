import { clamp, mix, smooth, type Point, type View } from './terrain'

/* The research directions, each as a scene on the site's one drawing.

   The marks mean the same thing in every scene. The blue point is the model,
   and blue lines are its paths. A hollow ring is a place the model already
   knows. A cross is what is new. A dashed line is what is not there or not
   taken. Names sit beside the marks.

   The scenes illustrate the ideas. They are not measurements. */

export const directions = [
  {
    id: 'continual',
    name: 'Continual learning',
    picture: 'An illustration of a loss surface. A model moves toward a new task and stops at the boundary of the trust region, where the old tasks still work.',
  },
  {
    id: 'adaptation',
    name: 'Test-time adaptation',
    picture: 'An illustration of a loss surface. A new task appears, and the model reaches it in three steps, from three samples or from three interactions.',
  },
  {
    id: 'composition',
    name: 'Compositional generalization',
    picture: 'An illustration of a surface with a grid of modes. One combination is held out of training. The model finds a prototype in its row and one in its column and composes the held-out combination from them.',
  },
] as const
export type DirectionId = typeof directions[number]['id']

export type Side = 'n' | 's' | 'e' | 'w'

/** What a scene draws with. Every mark sits on the surface, and `alpha` is how much of it is there. */
export type Pen = {
  /** A closed region the model stays in. */
  region(points: Point[], alpha: number): void
  /** A path of the model. */
  path(points: Point[], alpha: number): void
  /** A way that is not taken, or a place that is not there. */
  dashed(points: Point[], alpha: number, closed?: boolean): void
  ring(point: Point, alpha: number): void
  cross(point: Point, alpha: number): void
  model(point: Point, alpha: number): void
  /** Where the model stood between two steps. */
  joint(point: Point, alpha: number): void
  sample(point: Point, alpha: number): void
  /** A name beside a mark. `otherwise` is the side it takes when the first has no room. */
  name(text: string, point: Point, side: Side, alpha: number, otherwise?: Side): void
}

export type Scene = {
  fit(view: View): void
  /** The scene becomes the one on the drawing. `opening` is the first drawing of a visit, which the surface takes longer to reach. */
  begin(opening: boolean): void
  /** Time passes. `pointer` is where the visitor points on the ground. `still` asks for the finished state with no motion. */
  advance(step: number, pointer: Point | null, still: boolean): void
  /** True once the scene has shown what it shows, so that the next direction can follow. */
  shown(): boolean
  height(x: number, y: number): number
  /** The height under the pointer once the scene's new thing has moved there. */
  under(point: Point): number
  paint(pen: Pen, presence: number): void
}

type Place = ReturnType<typeof place>

/** The part of a view that scenes share: a spot by its share of the drawing, the place of the ring, and a length. */
function place(view: View) {
  const spot = (across: number, down: number) => view.ground(view.width * across, view.top + (view.height - view.top) * down)
  const anchor = spot(.36, .5)
  return { view, spot, anchor, unit: Math.min(view.reach(anchor.y), 2.4) }
}

const waves = (unit: number, x: number, y: number) => .075 * Math.sin(1.5 * x / unit + .5) * Math.cos(1.2 * y / unit - .3)
  + .045 * Math.sin(2.7 * x / unit - 1.3 * y / unit + 1.7)
  + .03 * Math.cos(3.9 * y / unit + .9 * x / unit)
const bowl = (dx: number, dy: number, radius: number) => Math.exp(-(dx * dx + dy * dy) / (2 * radius * radius))
const between = (from: Point, to: Point, share: number): Point => ({ x: from.x + (to.x - from.x) * share, y: from.y + (to.y - from.y) * share })
const toward = (from: Point, to: Point, step: number, time: number): Point => between(from, to, 1 - Math.exp(-step / time))

/* Continual learning. The ring is where the model stood after the old tasks, and the blue boundary around it is
   a trust region. The model descends toward the new task and stops where the region ends. The dashed line is the
   rest of the way, which it does not take. The pointer moves the new task. */
function continual(): Scene {
  const tilt = -.34
  const cos = Math.cos(tilt)
  const sin = Math.sin(tilt)
  let at: Place | null = null
  let a = 0
  let b = 0
  let task: Point = { x: 0, y: 0 }
  let seconds = 0
  let clock = 0
  let lead = .7
  let route = 0

  const drift = (time: number) => at!.spot(.6 + .2 * Math.cos(.31 * time + .4), .5 + .24 * Math.sin(.43 * time - .2))
  const toLocal = (point: Point): Point => {
    const dx = point.x - at!.anchor.x
    const dy = point.y - at!.anchor.y
    return { x: dx * cos + dy * sin, y: -dx * sin + dy * cos }
  }
  const toWorld = (local: Point): Point => ({
    x: at!.anchor.x + local.x * cos - local.y * sin,
    y: at!.anchor.y + local.x * sin + local.y * cos,
  })

  /** The closest point of the region's boundary to a point outside it. */
  const closestOnBoundary = (point: Point): Point => {
    const px = Math.abs(point.x)
    const py = Math.abs(point.y)
    let tx = .7071
    let ty = .7071
    for (let pass = 0; pass < 4; pass += 1) {
      const ex = (a * a - b * b) * tx ** 3 / a
      const ey = (b * b - a * a) * ty ** 3 / b
      const rx = a * tx - ex
      const ry = b * ty - ey
      const qx = px - ex
      const qy = py - ey
      const r = Math.hypot(rx, ry)
      const q = Math.hypot(qx, qy) || 1
      tx = Math.min(1, Math.max(0, (qx * r / q + ex) / a))
      ty = Math.min(1, Math.max(0, (qy * r / q + ey) / b))
      const length = Math.hypot(tx, ty) || 1
      tx /= length
      ty /= length
    }
    return { x: Math.sign(point.x || 1) * a * tx, y: Math.sign(point.y || 1) * b * ty }
  }

  /** Where descent toward the new task leads when it may not leave the region. */
  const learn = () => {
    const local = toLocal(task)
    const outside = (local.x / a) ** 2 + (local.y / b) ** 2
    if (outside <= 1) return { path: [at!.anchor, task], rest: null as Point[] | null }
    const reachEdge = 1 / Math.sqrt(outside)
    const edge = { x: local.x * reachEdge, y: local.y * reachEdge }
    const end = closestOnBoundary(local)
    const from = Math.atan2(edge.y / b, edge.x / a)
    let turn = Math.atan2(end.y / b, end.x / a) - from
    if (turn > Math.PI) turn -= 2 * Math.PI
    if (turn < -Math.PI) turn += 2 * Math.PI
    const path = [at!.anchor]
    for (let index = 0; index <= 18; index += 1) {
      const angle = from + turn * index / 18
      path.push(toWorld({ x: a * Math.cos(angle), y: b * Math.sin(angle) }))
    }
    return { path, rest: [toWorld(edge), task] }
  }

  const surface = (target: Point, x: number, y: number) => {
    const u = at!.unit
    const local = toLocal({ x, y })
    const known = (local.x / (a * 1.3)) ** 2 + (local.y / (b * 1.3)) ** 2
    const fresh = ((x - target.x) ** 2 + (y - target.y) ** 2) / (u * .25) ** 2
    return u * (waves(u, x, y) - .12 * Math.exp(-known / 2) - .2 * Math.exp(-fresh / 2))
  }

  return {
    fit(view) {
      const first = !at
      at = place(view)
      a = at.unit * .34
      b = at.unit * .19
      if (first) task = drift(0)
    },
    begin(opening) {
      clock = 0
      lead = opening ? .7 : .5
      route = 0
    },
    advance(step, pointer, still) {
      clock += step
      if (still) {
        if (pointer) task = pointer
        route = 1
        return
      }
      seconds += step
      task = toward(task, pointer ?? drift(seconds), step, pointer ? .12 : .5)
      route = smooth((clock - lead) / 1.1)
    },
    shown: () => clock > 9.5,
    height: (x, y) => surface(task, x, y),
    under: point => surface(point, point.x, point.y),
    paint(pen, presence) {
      const learned = learn()
      const boundary: Point[] = []
      for (let index = 0; index < 96; index += 1) {
        const angle = index / 96 * Math.PI * 2
        boundary.push(toWorld({ x: a * Math.cos(angle), y: b * Math.sin(angle) }))
      }
      pen.region(boundary, presence)
      const steps = learned.path
      const reached = Math.min(steps.length - 1, Math.max(1, Math.round((steps.length - 1) * route)))
      if (route > 0) {
        if (learned.rest) pen.dashed(learned.rest, presence * route)
        pen.path(steps.slice(0, reached + 1), presence)
      }
      pen.ring(at!.anchor, presence)
      pen.cross(task, presence)
      if (route > 0) pen.model(steps[reached], presence)
      // Each name sits on the side its mark has free.
      pen.name('old tasks', at!.anchor, task.x >= at!.anchor.x ? 'w' : 'e', presence)
      pen.name('new task', task, task.x >= steps[reached].x ? 'e' : 'w', presence)
    },
  }
}

/* Test-time adaptation. A new task appears where the model has not been. From three samples of it the model
   takes three steps and is there, and the task's low-loss region forms on the surface as the samples arrive.
   The next task gives no samples: the model acts, and three interactions are enough. The ring is where the
   model stood before. The pointer moves the new task. */
function adaptation(): Scene {
  const spots: [number, number][] = [[.66, .42], [.3, .62], [.7, .66], [.4, .36]]
  /** When each sample arrives, or each interaction ends, in seconds from the task's appearance. */
  const arrives = [.75, 1.7, 2.65]
  const holds = 5.2
  let at: Place | null = null
  let start: Point = { x: 0, y: 0 }
  let task: Point = { x: 0, y: 0 }
  let episode = 0
  let begun = 0
  let clock = 0
  let out = 0
  // The state of the frame, worked out once and read by the surface and the marks.
  let low: Point = { x: 0, y: 0 }
  let depth = 0
  let model: Point = { x: 0, y: 0 }
  let samples: Point[] = []
  let steps: Point[] = []
  let arrived = [0, 0, 0]
  let stepped = [0, 0, 0]

  const interactive = () => episode % 2 === 1

  const frame = () => {
    const u = at!.unit
    const turn = 1.4 + episode * .9
    samples = [0, 1, 2].map(index => ({
      x: task.x + .13 * u * Math.cos(turn + index * 2 * Math.PI / 3),
      y: task.y + .1 * u * Math.sin(turn + index * 2 * Math.PI / 3),
    }))
    arrived = arrives.map(time => smooth((clock - time) / .45))
    stepped = arrives.map(time => smooth((clock - time - .14) / .55))
    const dx = task.x - start.x
    const dy = task.y - start.y
    if (interactive()) {
      // The model tries, sees where that led, and corrects.
      const side = episode % 4 === 1 ? 1 : -1
      steps = [
        { x: start.x + .5 * dx - .2 * side * dy, y: start.y + .5 * dy + .2 * side * dx },
        { x: start.x + .84 * dx + .08 * side * dy, y: start.y + .84 * dy - .08 * side * dx },
        task,
      ]
      low = task
    } else {
      // Each step heads for the mean of the samples seen so far.
      const one = samples[0]
      const two = between(samples[0], samples[1], .5)
      steps = [between(start, one, .56), between(start, two, .84), task]
      low = between(between(one, two, arrived[1]), task, arrived[2])
    }
    model = start
    steps.forEach((point, index) => {
      const from = index === 0 ? start : steps[index - 1]
      model = { x: model.x + (point.x - from.x) * stepped[index], y: model.y + (point.y - from.y) * stepped[index] }
    })
    // Once the task is learned its low-loss region stays, shallower, as a place the model knows.
    depth = (.45 * arrived[0] + .3 * arrived[1] + .25 * arrived[2]) * (1 - .55 * smooth(out))
  }

  const surface = (x: number, y: number, center: Point, share: number) => {
    const u = at!.unit
    return u * (waves(u, x, y) - .09 * bowl(x - start.x, y - start.y, .25 * u) - .2 * share * bowl(x - center.x, y - center.y, .25 * u))
  }

  return {
    fit(view) {
      const first = !at
      at = place(view)
      if (first) {
        start = at.anchor
        task = at.spot(...spots[0])
      }
      frame()
    },
    begin() {
      begun = episode
      clock = -.45
      out = 0
      frame()
    },
    advance(step, pointer, still) {
      if (still) {
        clock = holds
        out = 0
        if (pointer) task = pointer
        frame()
        return
      }
      if (pointer) {
        task = toward(task, pointer, step, .12)
        clock = Math.min(clock + step, holds)
        out = Math.max(0, out - step / .3)
      } else {
        clock += step
        if (clock > holds) out += step / .7
        if (out >= 1) {
          start = task
          episode += 1
          task = at!.spot(...spots[episode % spots.length])
          clock = 0
          out = 0
        }
      }
      frame()
    },
    shown: () => episode - begun >= 2,
    height: (x, y) => surface(x, y, low, depth),
    under: point => surface(point.x, point.y, point, 1),
    paint(pen, presence) {
      const there = presence * (1 - smooth(out))
      const appears = there * smooth((clock + .1) / .45)
      pen.ring(start, presence)
      pen.cross(task, appears)
      if (!interactive()) samples.forEach((point, index) => pen.sample(point, there * arrived[index]))
      const taken = [start]
      steps.forEach((point, index) => { if (stepped[index] >= 1) taken.push(point) })
      taken.push(model)
      pen.path(taken, there)
      steps.slice(0, 2).forEach((point, index) => pen.joint(point, there * (stepped[index] >= 1 ? 1 : 0)))
      pen.model(model, presence)
      const count = arrived.filter(share => share > .5).length
      const what = interactive() ? 'interaction' : 'sample'
      pen.name(count ? `new task, ${count} ${what}${count > 1 ? 's' : ''}` : 'new task', task, task.x >= start.x ? 'e' : 'w', appears)
    },
  }
}

/* Compositional generalization. The surface has a mode for every combination seen in training, on a grid:
   a row shares one attribute value and a column the other. Three combinations are held out, and nothing is
   there. From a held-out query the model ascends to a prototype in its row and to one in its column, and
   composes them: a mode forms where there was none. The pointer chooses the held-out combination. */
function composition(): Scene {
  /** The held-out combinations as [row, column]. Row 0 is nearest. Every row and every column has one. */
  const held: [number, number][] = [[1, 1], [0, 2], [2, 0]]
  const climbs = [.6, .95]
  const forms = 1.9
  const holds = 5.6
  let at: Place | null = null
  let middle: Point = { x: 0, y: 0 }
  let wide = 0
  let deep = 0
  let radius = 0
  let seen: Point[] = []
  let query = 0
  let next: number | null = null
  let made = 0
  let begun = 0
  let clock = 0
  let out = 0
  let formed = 0

  const site = (row: number, column: number): Point => ({ x: middle.x + (column - 1) * wide, y: middle.y + (row - 1) * deep })
  const where = (index: number) => site(...held[index])
  /** The seen combinations next to a held-out one: in its row, and in its column. */
  const sources = (index: number): [Point, Point] => {
    const [row, column] = held[index]
    return [site(row, column > 0 ? column - 1 : column + 1), site(row > 0 ? row - 1 : row + 1, column)]
  }
  const nearest = (point: Point) => {
    let best = 0
    let least = Infinity
    held.forEach((_, index) => {
      const spot = where(index)
      const distance = ((point.x - spot.x) / wide) ** 2 + ((point.y - spot.y) / deep) ** 2
      if (distance < least) { least = distance; best = index }
    })
    return best
  }

  return {
    fit(view) {
      at = place(view)
      middle = at.spot(.5, .46)
      // A tall view is narrow, so the grid takes more of its width and less of its depth.
      const broad = clamp((view.width / view.height - .7) / 1.5, 0, 1)
      wide = Math.min(view.reach(middle.y) * mix(.58, .41, broad), 1.15)
      deep = Math.min(mix(.56, .7, broad), view.far - 1.15 - middle.y, middle.y - view.near - .55)
      radius = .3 * Math.min(wide, deep)
      seen = []
      for (let row = 0; row < 3; row += 1) {
        for (let column = 0; column < 3; column += 1) {
          if (!held.some(([heldRow, heldColumn]) => heldRow === row && heldColumn === column)) seen.push(site(row, column))
        }
      }
    },
    begin() {
      begun = made
      clock = -.45
      out = 0
      formed = 0
    },
    advance(step, pointer, still) {
      if (still) {
        if (pointer) query = nearest(pointer)
        clock = holds
        out = 0
        formed = 1
        return
      }
      const pointed = pointer ? nearest(pointer) : null
      if (pointed !== null && pointed !== query) next = pointed
      else if (pointed === query) next = null
      clock += step
      const leaving = next !== null || (pointed === null && clock > holds)
      if (leaving) out += step / (next !== null ? .3 : .7)
      else out = Math.max(0, out - step / .3)
      if (out >= 1) {
        query = next ?? (query + 1) % held.length
        next = null
        made += 1
        clock = 0
        out = 0
      }
      formed = smooth((clock - forms) / .85) * (1 - smooth(out))
    },
    shown: () => made - begun >= 2,
    height(x, y) {
      const u = at!.unit
      let modes = 0
      for (const mode of seen) modes += bowl(x - mode.x, y - mode.y, radius)
      const spot = where(query)
      return u * .35 * waves(u, x, y) - radius * (modes + formed * bowl(x - spot.x, y - spot.y, radius))
    },
    under(point) { return this.height(point.x, point.y) },
    paint(pen, presence) {
      const there = presence * (1 - smooth(out))
      const spot = where(query)
      const [inRow, inColumn] = sources(query)
      // A dashed circle is a combination that training leaves out.
      held.forEach((_, index) => {
        const center = where(index)
        const circle: Point[] = []
        for (let step = 0; step < 40; step += 1) {
          const angle = step / 40 * Math.PI * 2
          circle.push({ x: center.x + 1.25 * radius * Math.cos(angle), y: center.y + 1.25 * radius * Math.sin(angle) })
        }
        pen.dashed(circle, presence * (index === query ? 1 - formed : 1), true)
      })
      pen.cross(spot, there * smooth((clock + .1) / .45))
      const found = [inRow, inColumn].map((source, index) => {
        const climbed = smooth((clock - climbs[index]) / .7)
        if (climbed > 0) pen.path([spot, between(spot, source, climbed)], there)
        return climbed >= 1 ? smooth((clock - climbs[index] - .7) / .3) : 0
      })
      pen.ring(inRow, there * found[0])
      pen.ring(inColumn, there * found[1])
      pen.model(spot, there * smooth((clock - forms - .35) / .45))
      // Each name takes the side that no other mark of the scene holds.
      const nearer = inColumn.y < spot.y
      const [row, column] = held[query]
      const beside = held.some(([heldRow, heldColumn]) => heldRow === (row > 0 ? row - 1 : row + 1) && heldColumn === column + 1)
      pen.name('prototype', inRow, nearer ? 's' : 'n', there * found[0])
      pen.name('prototype', inColumn, beside ? 'w' : 'e', there * found[1], nearer ? 's' : 'n')
      pen.name('held-out combination', spot, nearer ? 'n' : 's', there * smooth((clock + .1) / .45))
    },
  }
}

export const makeScenes = (): Record<DirectionId, Scene> => ({ continual: continual(), adaptation: adaptation(), composition: composition() })
