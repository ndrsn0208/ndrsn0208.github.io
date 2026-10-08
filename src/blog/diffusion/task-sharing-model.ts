import type {
  ArgumentSceneProps,
  SceneMarker,
  ScenePanel,
  ScenePath,
  ScenePoint,
  SceneRegion,
  SceneTone,
} from './argument-scene-types'

export type SharingTask = 1 | 2 | 3
export type SharingMethod = 'ewc' | 'replay' | 'hybrid'
type Ellipse = { center: ScenePoint; major: number; minor: number; angle: number }

export const sharingExtent = 1.7
export const sharingValueRange = [0, 1] as const
export const sharedSolution: ScenePoint = { x: 0.12, y: 0.03 }
export const sharingCheckpoints = [
  { x: -0.85, y: -0.4 },
  { x: -0.35, y: 0.02 },
] as const

const taskTones: Record<SharingTask, SceneTone> = { 1: 'task1', 2: 'task2', 3: 'task3' }
const taskOne: Ellipse = {
  center: { x: -0.55, y: -0.25 }, major: 1, minor: 0.34, angle: 0.4,
}
const taskTwo: Ellipse = {
  center: { x: -0.38, y: 0.3 }, major: 0.95, minor: 0.36, angle: -0.5,
}
const taskThreeShared: Ellipse = {
  center: { x: 0.15, y: -0.02 }, major: 0.65, minor: 0.3, angle: -0.1,
}
const taskThreeDistant: Ellipse = {
  center: { x: 1.04, y: 0.64 }, major: 0.43, minor: 0.29, angle: 0.35,
}
// Figure 1(a) is a separate case. This Task 3 region is disjoint from Task 1
// but overlaps Task 2, so the earlier shared checkpoint cannot fit all three.
const taskThreeEwc: Ellipse = {
  center: { x: -0.1, y: 0.75 }, major: 0.45, minor: 0.15, angle: 1.1,
}
const ewcTaskThree: ScenePoint = { x: -0.2, y: 0.5 }

// Generated examples can admit extra low-loss regions that the original tasks do not.
// Both methods using replay receive these same aliases while learning Task 3.
const replayAliases: Record<1 | 2, Ellipse> = {
  1: { center: { x: 1, y: 0.6 }, major: 0.43, minor: 0.34, angle: 0.35 },
  2: { center: { x: 1.12, y: 0.69 }, major: 0.42, minor: 0.32, angle: -0.35 },
}

/** Tasks 1 and 2 are common. EWC has its own Task 3 case from Figure 1(a). */
export function sharingTaskEllipses(task: SharingTask, method: SharingMethod = 'hybrid'): readonly Ellipse[] {
  if (task === 1) return [taskOne]
  if (task === 2) return [taskTwo]
  return method === 'ewc' ? [taskThreeEwc] : [taskThreeShared, taskThreeDistant]
}

/** The replay surrogate includes the original regions as well as generated aliases. */
export function sharingReplayEllipses(task: 1 | 2, learningTask: SharingTask = 3): readonly Ellipse[] {
  const original = sharingTaskEllipses(task)
  return learningTask === 3 ? [...original, replayAliases[task]] : original
}

export function sharingQuadratic(point: ScenePoint, ellipse: Ellipse): number {
  const dx = point.x - ellipse.center.x
  const dy = point.y - ellipse.center.y
  const c = Math.cos(ellipse.angle)
  const s = Math.sin(ellipse.angle)
  const along = (c * dx + s * dy) / ellipse.major
  const across = (-s * dx + c * dy) / ellipse.minor
  return along * along + across * across
}

export function sharingTaskLoss(task: SharingTask, point: ScenePoint, method: SharingMethod = 'hybrid'): number {
  return Math.min(...sharingTaskEllipses(task, method).map(ellipse => sharingQuadratic(point, ellipse)))
}

export function sharingReplayLoss(task: 1 | 2, point: ScenePoint, learningTask: SharingTask = 3): number {
  return Math.min(...sharingReplayEllipses(task, learningTask).map(ellipse => sharingQuadratic(point, ellipse)))
}

const fieldCache = new Map<string, (x: number, y: number) => number>()
/** Shared display scaling. Only EWC's Task 3 field differs from the replay case. */
export function sharingField(learningTask: SharingTask, method: SharingMethod = 'hybrid'): (x: number, y: number) => number {
  const key = `${learningTask}-${learningTask === 3 && method === 'ewc' ? 'ewc' : 'replay'}`
  const cached = fieldCache.get(key)
  if (cached) return cached
  const field = (x: number, y: number) => {
    let total = 0
    for (let task = 1; task <= learningTask; task += 1) {
      const loss = sharingTaskLoss(task as SharingTask, { x, y }, method)
      total += loss / (1 + loss)
    }
    return total / learningTask
  }
  fieldCache.set(key, field)
  return field
}

export function sharingRegionBoundary(ellipse: Ellipse, samples = 96): ScenePoint[] {
  const c = Math.cos(ellipse.angle)
  const s = Math.sin(ellipse.angle)
  return Array.from({ length: samples + 1 }, (_, index) => {
    const angle = index / samples * Math.PI * 2
    const x = ellipse.major * Math.cos(angle)
    const y = ellipse.minor * Math.sin(angle)
    return { x: ellipse.center.x + c * x - s * y, y: ellipse.center.y + s * x + c * y }
  })
}

/** Clip two convex sampled level sets, retaining the actual intersection. */
function intersectRegions(subject: readonly ScenePoint[], boundary: readonly ScenePoint[]): ScenePoint[] {
  let output = [...subject]
  for (let edge = 0; edge < boundary.length && output.length > 0; edge += 1) {
    const a = boundary[edge]
    const b = boundary[(edge + 1) % boundary.length]
    const signedDistance = (p: ScenePoint) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)
    const input = output
    output = []
    let previous = input[input.length - 1]
    let previousDistance = signedDistance(previous)
    for (const current of input) {
      const currentDistance = signedDistance(current)
      if ((currentDistance >= 0) !== (previousDistance >= 0)) {
        const t = previousDistance / (previousDistance - currentDistance)
        output.push({
          x: previous.x + t * (current.x - previous.x),
          y: previous.y + t * (current.y - previous.y),
        })
      }
      if (currentDistance >= 0) output.push(current)
      previous = current
      previousDistance = currentDistance
    }
  }
  return output
}

const feasibleRegionCache = new Map<string, readonly ScenePoint[][]>()

/** Common low-loss set C_1 ∩ … ∩ C_t. This is not a Fisher penalty contour. */
export function sharingFeasibleRegions(task: SharingTask, method: SharingMethod): readonly ScenePoint[][] {
  const key = `${method}-${task}`
  const cached = feasibleRegionCache.get(key)
  if (cached) return cached
  let regions = sharingTaskEllipses(1, method).map(ellipse => sharingRegionBoundary(ellipse, 192).slice(0, -1))
  for (let next = 2; next <= task; next += 1) {
    const boundaries = sharingTaskEllipses(next as SharingTask, method)
      .map(ellipse => sharingRegionBoundary(ellipse, 192).slice(0, -1))
    regions = regions.flatMap(region => boundaries.map(boundary => intersectRegions(region, boundary)))
      .filter(region => region.length >= 3)
  }
  feasibleRegionCache.set(key, regions)
  return regions
}

export function sharingModelPoint(method: SharingMethod, task: SharingTask): ScenePoint {
  if (task === 1) return sharingCheckpoints[0]
  if (task === 2) return sharingCheckpoints[1]
  if (method === 'ewc') return ewcTaskThree
  return method === 'replay' ? taskThreeDistant.center : sharedSolution
}

export function sharingFit(point: ScenePoint, learningTask: SharingTask, method: SharingMethod = 'hybrid') {
  const fit: SharingTask[] = []
  const missed: SharingTask[] = []
  for (let task = 1; task <= learningTask; task += 1) {
    const typedTask = task as SharingTask
    if (sharingTaskLoss(typedTask, point, method) <= 1 + 1e-10) fit.push(typedTask)
    else missed.push(typedTask)
  }
  return { fit, missed }
}

/** Replay covers earlier tasks only. Membership uses the same regions drawn in the scene. */
export function sharingReplayFit(point: ScenePoint, learningTask: SharingTask) {
  const fit: SharingTask[] = []
  const missed: SharingTask[] = []
  for (const task of [1, 2] as const) {
    if (task >= learningTask) continue
    if (sharingReplayLoss(task, point, learningTask) <= 1 + 1e-10) fit.push(task)
    else missed.push(task)
  }
  return { fit, missed }
}

function taskRegions(learningTask: SharingTask, method: SharingMethod): SceneRegion[] {
  return Array.from({ length: learningTask }, (_, i) => (i + 1) as SharingTask)
    .flatMap(task => sharingTaskEllipses(task, method).map((ellipse, index) => ({
      id: `original-${task}-${task === 3 && method === 'ewc' ? 'ewc' : index}`,
      boundary: sharingRegionBoundary(ellipse),
      tone: taskTones[task],
      opacity: 0.92,
      fill: false,
      dashed: false,
    })))
}

function replayRegions(): SceneRegion[] {
  return ([1, 2] as const).map(task => ({
    id: `replay-${task}-alias`,
    boundary: sharingRegionBoundary(replayAliases[task]),
    tone: taskTones[task],
    opacity: 0.92,
    fill: false,
    dashed: true,
  }))
}

function taskLabels(learningTask: SharingTask, method: SharingMethod): SceneMarker[] {
  const markers: SceneMarker[] = Array.from({ length: learningTask }, (_, index) => {
    const task = (index + 1) as SharingTask
    const ellipses = sharingTaskEllipses(task, method)
    const ellipse = task === 3 ? ellipses[ellipses.length - 1] : ellipses[0]
    const boundary = sharingRegionBoundary(ellipse)
    return {
      id: `label-${task}`,
      point: boundary[task === 1 ? 53 : task === 2 ? 40 : 24],
      tone: taskTones[task],
      label: `Task ${task}`,
      labelOnly: true,
    }
  })
  return markers
}

function replayLabels(): SceneMarker[] {
  return [{
    id: 'label-replay-fit',
    point: sharingRegionBoundary(replayAliases[2])[0],
    tone: 'muted',
    label: 'Replayed T1 + T2',
    labelOnly: true,
  }]
}

function pathPoint(start: ScenePoint, end: ScenePoint, progress: number): ScenePoint {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const middle = { x: (start.x + end.x) / 2 + 0.12 * dy, y: (start.y + end.y) / 2 - 0.12 * dx }
  const t = Math.max(0, Math.min(1, progress))
  const s = 1 - t
  return {
    x: s * s * start.x + 2 * s * t * middle.x + t * t * end.x,
    y: s * s * start.y + 2 * s * t * middle.y + t * t * end.y,
  }
}

export function sharingMovingPoint(method: SharingMethod, task: SharingTask, progress = 1): ScenePoint {
  if (task === 1) return sharingModelPoint(method, task)
  return pathPoint(
    sharingModelPoint(method, (task - 1) as SharingTask),
    sharingModelPoint(method, task),
    progress,
  )
}

function modelPaths(method: SharingMethod, task: SharingTask, progress: number): ScenePath[] {
  return ([2, 3] as const).filter(step => step <= task).map(step => ({
    id: `learning-task-${step}`,
    points: Array.from({ length: 49 }, (_, index) =>
      sharingMovingPoint(method, step, index / 48 * (task === step ? progress : 1))),
    tone: step === task ? 'reference' : 'muted',
    opacity: step === task ? 1 : 0.48,
    width: step === task ? 2.6 : 1.8,
  }))
}

function panel(task: SharingTask, method: SharingMethod, progress: number): ScenePanel {
  const point = sharingMovingPoint(method, task, progress)
  const { fit, missed } = sharingFit(point, task, method)
  const usesReplay = method !== 'ewc'
  const markers = taskLabels(task, method)
  const regions = taskRegions(task, method)
  if (usesReplay && task === 3) {
    regions.push(...replayRegions())
    markers.push(...replayLabels())
  }
  const atEarlierShared = method === 'ewc' && task >= 2
    && Math.hypot(point.x - sharingCheckpoints[1].x, point.y - sharingCheckpoints[1].y) < 1e-10
  markers.push({ id: 'current-model', point, tone: 'reference', label: atEarlierShared ? 'Shared T1 + T2' : 'Model' })
  if (method === 'ewc' && task >= 2 && !atEarlierShared) {
    markers.push({
      id: 'shared-earlier-solution',
      point: sharingCheckpoints[1],
      tone: 'rank',
      label: 'Shared T1 + T2',
      hollow: true,
    })
  }
  if (usesReplay && task === 3 && missed.length > 0) {
    markers.push({ id: 'shared-solution', point: sharedSolution, tone: 'rank', label: 'Shared solution', hollow: true })
  }
  let note = missed.length > 0
    ? `Outside the ${missed.map(value => `Task ${value}`).join(' and ')} regions.`
    : task === 3 ? 'Inside a region shared by all three original tasks.'
      : task === 2 ? 'Fits both original tasks.' : 'All methods start at the same Task 1 solution.'
  if (usesReplay && task > 1) {
    const replay = sharingReplayFit(point, task)
    note += replay.fit.length > 0
      ? ` Low replay loss on ${replay.fit.map(value => `Task ${value}`).join(' and ')}.`
      : ' Outside all earlier replay regions.'
    if (replay.fit.length > 0 && replay.missed.length > 0) {
      note += ` Outside the ${replay.missed.map(value => `Task ${value}`).join(' and ')} replay regions.`
    }
  }
  return {
    id: `${method}-original`,
    title: method === 'ewc' ? '(a) EWC alone' : method === 'replay' ? '(b) Replay alone' : '(c) Trust Region',
    subtitle: method === 'ewc'
      ? 'Fisher penalty in a case with no common region for all three tasks'
      : method === 'replay'
        ? 'Learn from new data and generated earlier examples'
        : 'Use the same replay data, with a Fisher penalty from earlier tasks',
    field: sharingField(task, method),
    extent: sharingExtent,
    valueRange: sharingValueRange,
    paths: modelPaths(method, task, progress),
    regions,
    markers,
    metric: {
      label: 'Low loss on the original tasks',
      value: missed.length === 0
        ? (task === 1 ? 'Task 1' : `All ${task} tasks`)
        : fit.length > 0 ? `Task ${fit.join(' + ')} only` : 'None',
      note,
      tone: missed.length === 0 ? 'rank' : 'reference',
    },
  }
}

export function sharingScene(task: SharingTask, progress = 1): ArgumentSceneProps {
  return {
    panels: [panel(task, 'ewc', progress), panel(task, 'replay', progress), panel(task, 'hybrid', progress)],
    legend: [
      { label: 'Task 1', tone: 'task1' },
      ...(task >= 2 ? [{ label: 'Task 2', tone: 'task2' as const }] : []),
      ...(task === 3 ? [{ label: 'Task 3', tone: 'task3' as const }] : []),
      ...(task === 3 ? [
        { label: 'Replay T1', tone: 'task1' as const, dashed: true },
        { label: 'Replay T2', tone: 'task2' as const, dashed: true },
      ] : []),
      { label: 'Model path', tone: 'reference' },
    ],
    heightLabel: 'Height = scaled original task loss · schematic',
    description: `Figure 1 shows different schematic cases, here while learning Task ${task}. All three paths start at the same Task 1 solution and reach the same shared Task 1 and Task 2 checkpoint. In the EWC case from Figure 1(a), Task 3 is disjoint from Task 1, so no region fits all three tasks. EWC departs the earlier shared checkpoint toward Task 3 and ends fitting Tasks 2 and 3 while losing Task 1 compatibility. Replay alone and Trust Region use the same separate case, where a shared solution exists. Both receive identical replay surrogates, including the original earlier-task regions and the dashed aliases near the distant Task 3 basin. Replay alone can fit generated earlier examples while missing the original earlier tasks. Trust Region ends inside all three original task regions. Solid loops show original task regions and dashed loops show generated aliases. These paths are schematic, not solver outputs or guarantees. No loop is a Fisher penalty boundary.`,
  }
}

/** A single view. The legend and explanation live outside the terrain. */
export function sharingFocusScene(method: SharingMethod, task: SharingTask, progress = 1): ScenePanel {
  const source = panel(task, method, progress)
  const regions = [...(source.regions ?? [])]
  if (method === 'ewc' && task >= 2) {
    // Retain C1∩C2 when Task 3 arrives so the missing overlap is visible.
    // Its fill is a task-fit set, never an invented closed Fisher boundary.
    regions.push(...sharingFeasibleRegions(2, method).map((boundary, index) => ({
      id: `earlier-feasible-${index}`,
      boundary,
      tone: 'reference' as const,
      opacity: 0.3,
      fill: true,
      outline: false,
    })))
    if (task === 3) {
      for (let index = 0; index < regions.length; index += 1) {
        if (regions[index].id === 'original-3-ewc') {
          regions[index] = { ...regions[index], fill: true, opacity: 0.16 }
        }
      }
    }
  }
  return {
    ...source,
    title: method === 'ewc' ? 'EWC' : method === 'replay' ? 'Replay' : 'Trust Region',
    subtitle: undefined,
    metric: undefined,
    surfaceStyle: 'subtle',
    regions,
    markers: [{
      id: 'current-model',
      point: sharingMovingPoint(method, task, progress),
      tone: 'reference',
    }],
    paths: source.paths?.map(path => ({
      ...path,
      width: path.id === `learning-task-${task}` ? 3 : 1.6,
      opacity: path.id === `learning-task-${task}` ? 1 : 0.35,
    })),
  }
}
