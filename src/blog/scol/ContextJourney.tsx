import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { cancelFrame, frame as motionFrame, motion, useAnimationControls, useInView, useReducedMotion, type TargetAndTransition } from 'motion/react'
import { storyExample } from './story-example'
import './context-journey.css'

export type ContextJourneyScene = 'context' | 'memory' | 'consolidation' | 'forgetting' | 'selection'
export interface ContextJourneyProps {
  scene: ContextJourneyScene
  compact?: boolean
}

type MemoryPath = 'full' | 'revisit' | 'retrieve'
type Playback = 'auto' | 'paused' | 'manual'
type Phase = 'read' | 'update' | 'clear' | 'question' | 'choose' | 'commit' | 'check'
type Frame = { chunk: number; version: number; phase: Phase; label: string; hold: number }
type Point = { x: number; y: number }
type Box = { x: number; y: number; width: number; height: number; opacity?: number }
type Geometry = { width: number; height: number; boxes: Record<string, Box> }
type Route = {
  id: string
  from: string
  to: string
  start: Point
  end: Point
  d: string
  dashed?: boolean
  accent?: boolean
  arrow?: boolean
}
type RouteState = {
  scene: ContextJourneyScene
  path: MemoryPath
  chunk: number
  showQuestion: boolean
  removed: boolean
  selectionOpen: boolean
  emit: boolean
  apply: boolean
  compact: boolean
  visibleNotes: boolean[]
}

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect
const ANIMATION_POSE = { current: (target: TargetAndTransition) => target }
const NOTES = storyExample.chunks
const STORY_CHAIN = [NOTES[0].relation, ...NOTES.slice(1).map(note => note.relation.split(' → ')[1])].join(' → ')
const LAYERS = Array.from({ length: 28 }, (_, index) => index)
// Illustrative zero-based IDs, within the paper's budget of at most 10 of 28.
const CHOICES: readonly (readonly number[])[] = [
  [1, 5, 10, 16, 21, 25],
  [3, 8, 13, 18, 23, 27],
  [2, 6, 11, 17, 22, 26],
]
const TITLES: Record<ContextJourneyScene, string> = {
  context: 'A story unfolds',
  memory: 'The weights stay fixed',
  consolidation: 'Learning the story into weights',
  forgetting: 'An earlier link can weaken',
  selection: 'The model chooses its update',
}
const FRAMES: Record<ContextJourneyScene, readonly Frame[]> = {
  context: [
    { chunk: 0, version: 0, phase: 'read', label: 'Read where Lina puts the key.', hold: 2300 },
    { chunk: 1, version: 0, phase: 'read', label: 'Omar moves the blue box.', hold: 2300 },
    { chunk: 2, version: 0, phase: 'read', label: 'Learn where the study is.', hold: 2300 },
    { chunk: 2, version: 0, phase: 'question', label: 'The answer needs all three links.', hold: 0 },
  ],
  memory: [{ chunk: 2, version: 0, phase: 'question', label: 'Each path supplies context to an unchanged model.', hold: 0 }],
  consolidation: [
    { chunk: 0, version: 0, phase: 'read', label: 'Read the key–box relation.', hold: 1100 },
    { chunk: 0, version: 1, phase: 'update', label: 'Update selected weights from note 1.', hold: 1400 },
    { chunk: 1, version: 1, phase: 'read', label: 'Read the box–study relation.', hold: 1100 },
    { chunk: 1, version: 2, phase: 'update', label: 'Continue from the changed weights.', hold: 1400 },
    { chunk: 2, version: 2, phase: 'read', label: 'Read that the study is upstairs.', hold: 1100 },
    { chunk: 2, version: 3, phase: 'update', label: 'Update selected weights from note 3.', hold: 1400 },
    { chunk: 2, version: 3, phase: 'clear', label: 'Remove the original notes from the prompt.', hold: 1500 },
    { chunk: 2, version: 3, phase: 'question', label: 'Only the question enters the later prompt.', hold: 0 },
  ],
  forgetting: [
    { chunk: 0, version: 1, phase: 'check', label: 'The first check can use the key–box link.', hold: 2300 },
    { chunk: 1, version: 2, phase: 'update', label: 'Learn the next link in the story.', hold: 2300 },
    { chunk: 2, version: 2, phase: 'read', label: 'Check the last clue before its update.', hold: 1600 },
    { chunk: 2, version: 3, phase: 'update', label: 'Later links improve while the first link weakens.', hold: 0 },
  ],
  selection: [
    { chunk: 2, version: 2, phase: 'read', label: 'The current model reads the last clue.', hold: 1700 },
    { chunk: 2, version: 2, phase: 'choose', label: 'That same model emits layer IDs.', hold: 2200 },
    { chunk: 2, version: 2, phase: 'update', label: 'Apply LoRA only at the selected layers.', hold: 1800 },
    { chunk: 2, version: 3, phase: 'commit', label: 'The changed model chooses again next time.', hold: 0 },
  ],
}
const MEMORY_PATHS = [
  { id: 'full', label: 'Full context', short: 'All notes', description: 'All three notes are supplied again in the prompt.' },
  { id: 'revisit', label: 'Revisit', short: 'Summary', description: 'Earlier notes are revisited and compressed into a summary.' },
  { id: 'retrieve', label: 'Retrieve', short: 'Find notes', description: 'Stored notes are retrieved and put back into the prompt.' },
] as const
// Qualitative illustration, not measured accuracy. The earliest relation
// weakens but does not vanish, while the two later relations become stronger.
const CHECKS: readonly (readonly (number | null)[])[] = [
  [0.86, 0.7, 0.7, 0.32],
  [null, 0.78, 0.78, 0.84],
  [null, null, 0.2, 0.9],
]

function point(box: Box, side: 'left' | 'right' | 'top' | 'bottom', fraction = 0.5): Point {
  if (side === 'left' || side === 'right') return { x: box.x + (side === 'right' ? box.width : 0), y: box.y + box.height * fraction }
  return { x: box.x + box.width * fraction, y: box.y + (side === 'bottom' ? box.height : 0) }
}
const pair = (p: Point) => `${p.x} ${p.y}`

// Every endpoint comes from a measured border box in the same CSS-pixel
// coordinate system as the SVG. No guessed percentages or scaled markers.
function buildRoutes(geometry: Geometry, state: RouteState): Route[] {
  const boxes = geometry.boxes
  const model = boxes.model
  if (!model) return []
  const routes: Route[] = []
  const add = (route: Route) => routes.push(route)
  const curve = (id: string, from: string, to: string, start: Point, end: Point, accent = true) => {
    const middle = (start.x + end.x) / 2
    add({ id, from, to, start, end, accent, d: `M${pair(start)} C${middle} ${start.y} ${middle} ${end.y} ${pair(end)}` })
  }
  if (!state.removed) {
    if (state.scene === 'memory' && state.path === 'revisit' && boxes.summary && boxes.c1) {
      const start = point(boxes.summary, 'right')
      const end = point(boxes.c1, 'right', 0.25)
      const lane = start.x + (model.x - start.x) * 0.65
      add({ id: 'revisit-query', from: 'summary', to: 'c1', start, end, dashed: true,
        d: `M${pair(start)} H${lane} V${end.y} H${end.x}` })
      const collectorX = start.x + (model.x - start.x) * 0.22
      const summaryInput = point(boxes.summary, 'right', 0.25)
      const collectorTop = point(boxes.c1, 'right', 0.75).y
      NOTES.forEach(note => {
        const box = boxes[note.id]
        if (!box) return
        const source = point(box, 'right', 0.75)
        const end = { x: collectorX, y: source.y }
        add({ id: `summary-evidence-${note.id}`, from: note.id, to: 'summary-bus', start: source, end, accent: true, arrow: false,
          d: `M${pair(source)} H${end.x}` })
      })
      add({ id: 'summary-return', from: 'summary-bus', to: 'summary', start: { x: collectorX, y: collectorTop }, end: summaryInput, accent: true,
        d: `M${collectorX} ${collectorTop} V${summaryInput.y} H${summaryInput.x}` })
      curve('summary-input', 'summary', 'model', point(boxes.summary, 'right', 0.75), point(model, 'left'))
    } else {
      NOTES.forEach((note, index) => {
        const box = boxes[note.id]
        const relevant = state.compact || state.scene === 'context' || state.scene === 'memory' || index === state.chunk
        if (box && relevant && state.visibleNotes[index]) {
          curve(`note-input-${note.id}`, note.id, 'model', point(box, 'right'), point(model, 'left'))
        }
      })
    }
  }
  if (state.showQuestion && boxes.question) {
    const modelBottom = point(model, 'bottom')
    const question = boxes.question
    const start = { x: modelBottom.x, y: question.y }
    add({ id: 'question-input', from: 'question', to: 'model', start, end: modelBottom, dashed: true,
      d: `M${pair(start)} V${modelBottom.y}` })
    if (state.scene === 'memory' && state.path === 'retrieve' && boxes.store) {
      const end = point(boxes.store, 'right', 0.5)
      const lane = end.x + (model.x - end.x) * 0.35
      const queryStart = { x: lane, y: question.y }
      add({ id: 'retrieval-query', from: 'question', to: 'store', start: queryStart, end, dashed: true,
        d: `M${pair(queryStart)} V${end.y} H${end.x}` })
    }
  }
  if (state.selectionOpen && boxes.choice) {
    const start = point(model, 'bottom')
    const end = point(boxes.choice, 'right', 0.3)
    if (state.emit) add({ id: 'model-choice', from: 'model', to: 'choice', start, end,
      d: `M${pair(start)} V${end.y} H${end.x}` })
    if (state.apply) {
      const targets = CHOICES[2].flatMap(layer => boxes[`layer-${layer}`] ? [{ layer, box: boxes[`layer-${layer}`] }] : [])
      if (targets.length) {
        const lane = model.x - 12
        const top = point(targets[0].box, 'left').y
        const bottom = point(targets[targets.length - 1].box, 'left').y
        const updateStart = point(boxes.choice, 'right', 0.8)
        const bus = { x: lane, y: bottom }
        add({ id: 'lora-return', from: 'choice', to: 'update-bus', start: updateStart, end: bus, accent: true, arrow: false,
          d: `M${pair(updateStart)} H${lane} V${bus.y}` })
        add({ id: 'update-bus', from: 'update-bus', to: 'update-bus', start: { x: lane, y: top }, end: { x: lane, y: bottom }, accent: true, arrow: false,
          d: `M${lane} ${top} V${bottom}` })
        targets.forEach(({ layer, box }) => {
          const targetPoint = point(box, 'left')
          const branchStart = { x: lane, y: targetPoint.y }
          add({ id: `lora-layer-${layer}`, from: 'update-bus', to: `layer-${layer}`, start: branchStart, end: targetPoint, accent: true,
            d: `M${pair(branchStart)} H${targetPoint.x}` })
        })
      }
    }
  }
  return routes
}

function routeOpacity(route: Route, geometry: Geometry) {
  const source = geometry.boxes[route.from]?.opacity ?? 1
  const target = geometry.boxes[route.to]?.opacity ?? 1
  const summary = route.id.startsWith('summary-') ? geometry.boxes.summary?.opacity ?? 1 : 1
  const choice = route.id.startsWith('lora-') || route.id === 'update-bus' ? geometry.boxes.choice?.opacity ?? 1 : 1
  return Math.min(source, target, summary, choice)
}

function Theta({ version }: { version: number | 't' }) {
  return <span className="scol-journey-theta">θ<sub>{version}</sub></span>
}
function ControlIcon({ kind }: { kind: 'play' | 'pause' | 'replay' | 'back' | 'next' }) {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    {kind === 'play' && <path d="m7 4 9 6-9 6Z" />}
    {kind === 'pause' && <path d="M7 4v12M13 4v12" />}
    {kind === 'replay' && <path d="M4 8a6.5 6.5 0 1 1 .6 6M4 3v5h5" />}
    {kind === 'back' && <path d="m12 5-5 5 5 5" />}
    {kind === 'next' && <path d="m8 5 5 5-5 5" />}
  </svg>
}

export default function ContextJourney({ scene, compact = false }: ContextJourneyProps) {
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const nodes = useRef(new Map<string, HTMLElement>())
  const routeStateRef = useRef<RouteState | null>(null)
  const mounted = useRef(false)
  const animation = useAnimationControls()
  const inView = useInView(rootRef, { amount: 0.15 })
  const reduced = useReducedMotion()
  const [wide, setWide] = useState(false)
  const [pageVisible, setPageVisible] = useState(true)
  const [playback, setPlayback] = useState<Playback>('auto')
  const [memoryPath, setMemoryPath] = useState<MemoryPath>('full')
  const [playhead, setPlayhead] = useState({ scene, step: reduced ? FRAMES[scene].length - 1 : 0 })
  const [geometry, setGeometry] = useState<Geometry>({ width: 1, height: 326, boxes: {} })
  const id = useId().replace(/:/g, '')
  const titleId = `scol-journey-title-${id}`
  const captionId = `scol-journey-caption-${id}`
  const stageId = `scol-journey-stage-${id}`
  const frames = FRAMES[scene]
  const finalStep = frames.length - 1
  const step = playhead.scene === scene ? Math.min(playhead.step, finalStep) : reduced ? finalStep : 0
  const frame = compact ? FRAMES.consolidation[5] : frames[step]
  const atEnd = step === finalStep
  const wantsPlayback = playback === 'manual' || (playback === 'auto' && !reduced)
  const running = wantsPlayback && inView && pageVisible && !compact && !atEnd
  const duration = reduced || compact ? 0 : 0.5
  const transition = { duration, ease: [0.22, 0.68, 0, 1] as const }
  const removed = !compact && scene === 'consolidation' && (frame.phase === 'clear' || frame.phase === 'question')
  const showQuestion = !compact && frame.phase === 'question'
  const selectionOpen = !compact && scene === 'selection' && step >= 1
  const apply = selectionOpen && frame.phase === 'update'
  const emit = selectionOpen && frame.version === 2
  const showSummary = !compact && scene === 'memory' && memoryPath === 'revisit'
  const showStore = !compact && scene === 'memory' && memoryPath === 'retrieve'
  const weightScene = compact || scene === 'consolidation' || scene === 'selection' || scene === 'forgetting'
  const broad = !compact && scene === 'forgetting'
  const selectedIds = weightScene && frame.phase !== 'read' ? CHOICES[frame.chunk] : []
  const fullHeight = wide ? 78 : 94
  const shortHeight = 40
  const choiceY = 124 + fullHeight + 16

  // Read after Motion's render phase and write native SVG attributes before
  // paint. A React state update alone leaves connectors one frame behind.
  // Only node animation and layout changes schedule this work.
  const measure = useCallback(() => {
    const stage = stageRef.current
    if (!mounted.current || !stage) return
    const origin = stage.getBoundingClientRect()
    if (!origin.width || !origin.height) return
    const boxes: Record<string, Box> = {}
    nodes.current.forEach((element, name) => {
      const rect = element.getBoundingClientRect()
      boxes[name] = {
        x: rect.left - origin.left, y: rect.top - origin.top, width: rect.width, height: rect.height,
        opacity: Number.parseFloat(getComputedStyle(element).opacity),
      }
    })
    const next = { width: origin.width, height: origin.height, boxes }
    const svg = svgRef.current
    if (svg && routeStateRef.current) {
      svg.setAttribute('viewBox', `0 0 ${next.width} ${next.height}`)
      const routes = new Map(buildRoutes(next, routeStateRef.current).map(route => [route.id, route]))
      svg.querySelectorAll<SVGPathElement>('[data-route]').forEach(path => {
        const route = routes.get(path.dataset.route ?? '')
        if (!route) return
        path.setAttribute('d', route.d)
        path.dataset.start = `${route.start.x},${route.start.y}`
        path.dataset.end = `${route.end.x},${route.end.y}`
        path.style.opacity = String(routeOpacity(route, next))
      })
    }
    setGeometry(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next)
  }, [])
  const scheduleMeasure = useCallback(() => {
    if (mounted.current) motionFrame.postRender(measure)
  }, [measure])
  const nodeRef = (name: string) => (element: HTMLElement | null) => {
    if (element) nodes.current.set(name, element)
    else nodes.current.delete(name)
  }

  useBrowserLayoutEffect(() => {
    mounted.current = true
    const updateWidth = () => {
      if (rootRef.current) setWide(rootRef.current.getBoundingClientRect().width >= 440)
      scheduleMeasure()
    }
    updateWidth()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateWidth)
    if (rootRef.current) observer?.observe(rootRef.current)
    if (stageRef.current) observer?.observe(stageRef.current)
    nodes.current.forEach(element => observer?.observe(element))
    document.fonts?.ready.then(scheduleMeasure)
    return () => {
      mounted.current = false
      observer?.disconnect()
      cancelFrame(measure)
    }
  }, [measure, scheduleMeasure])
  useEffect(() => {
    setPlayhead({ scene, step: reduced ? FRAMES[scene].length - 1 : 0 })
  }, [scene, reduced])
  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== 'hidden')
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(() => {
      setPlayhead(previous => ({ scene, step: Math.min((previous.scene === scene ? previous.step : 0) + 1, finalStep) }))
    }, frame.hold)
    return () => window.clearTimeout(timer)
  }, [running, scene, step, finalStep, frame.hold])
  useEffect(() => {
    if (reduced || compact || !inView || !pageVisible) animation.set('current')
    else void animation.start('current')
    return () => animation.stop()
  }, [animation, scene, step, memoryPath, wide, compact, reduced, inView, pageVisible])

  function moveTo(next: number) {
    animation.stop()
    setPlayback('paused')
    setPlayhead({ scene, step: Math.max(0, Math.min(next, finalStep)) })
  }
  function togglePlayback() {
    if (atEnd) {
      setPlayhead({ scene, step: 0 })
      setPlayback('manual')
    } else {
      if (wantsPlayback) {
        animation.stop()
        animation.set('current')
        scheduleMeasure()
      }
      setPlayback(wantsPlayback ? 'paused' : 'manual')
    }
  }
  const poses = NOTES.map((_, index) => {
    const normal = { y: index === 0 ? 28 : 28 + fullHeight + 10 + (index - 1) * 48, height: index === 0 ? fullHeight : shortHeight, opacity: 1 }
    if (compact) return { y: 28 + index * 52, height: shortHeight, opacity: 1 }
    if (removed) return { y: index < frame.chunk ? 28 + index * 48 : 124, height: index === frame.chunk ? fullHeight : shortHeight, opacity: 0 }
    if (scene === 'memory') return showSummary ? { y: 28 + index * 48, height: shortHeight, opacity: 1 } : normal
    if (scene === 'context') return frame.phase === 'question' ? normal : {
      y: 28 + index * 48 + (index > frame.chunk ? fullHeight - shortHeight + 2 : 0),
      height: index === frame.chunk ? fullHeight : shortHeight,
      opacity: index <= frame.chunk ? 1 : 0,
    }
    if (index < frame.chunk) return { y: 28 + index * 48, height: shortHeight, opacity: 1 }
    if (index === frame.chunk) return { y: 124, height: fullHeight, opacity: 1 }
    return { y: 124 + fullHeight + 10 + (index - frame.chunk - 1) * 48, height: shortHeight, opacity: 1 }
  })
  const routeState: RouteState = {
    scene, path: memoryPath, chunk: frame.chunk, showQuestion, removed, selectionOpen, emit, apply, compact,
    visibleNotes: poses.map(pose => pose.opacity > 0),
  }
  const routes = buildRoutes(geometry, routeState)
  useBrowserLayoutEffect(() => {
    routeStateRef.current = routeState
    measure()
  }, [scene, step, memoryPath, wide, compact, measure])
  const modelState = compact ? 'Selected weights change' : scene === 'context' || scene === 'memory' ? 'Weights stay fixed'
    : scene === 'selection' && frame.phase === 'commit' ? 'This model chooses again' : frame.phase === 'update' ? 'Weights change' : 'One evolving model'

  return <figure ref={rootRef} className="scol-journey" data-scene={scene} data-wide={wide} data-compact={compact}
    data-step={step} data-phase={frame.phase} data-running={running} data-reduced-motion={Boolean(reduced)}
    aria-labelledby={titleId} aria-describedby={captionId}>
    <h3 id={titleId} className={`scol-journey-heading${compact ? ' scol-journey-sr-only' : ''}`}>{TITLES[scene]}</h3>

    {!compact && <div className="scol-journey-toolbar">
      {scene === 'memory' ? <div className="scol-journey-memory-options" role="group" aria-label="Ways to manage context with fixed weights">
        {MEMORY_PATHS.map(path => <button key={path.id} type="button" aria-pressed={memoryPath === path.id}
          aria-controls={stageId} onClick={() => setMemoryPath(path.id)}>
          <span>{path.label}</span><span>{path.short}</span>
        </button>)}
      </div> : <div className="scol-journey-controls">
        <button type="button" className="scol-journey-playback" onClick={togglePlayback} aria-controls={stageId}
          aria-label={atEnd ? 'Replay this scene' : wantsPlayback ? 'Pause this scene' : 'Play this scene'}>
          <ControlIcon kind={atEnd ? 'replay' : wantsPlayback ? 'pause' : 'play'} />
          {atEnd ? 'Replay' : wantsPlayback ? 'Pause' : 'Play'}
        </button>
        <div className="scol-journey-step-controls">
          <span>{step + 1} / {frames.length}</span>
          <button type="button" disabled={step === 0} onClick={() => moveTo(step - 1)} aria-label="Previous step" aria-controls={stageId}><ControlIcon kind="back" /></button>
          <button type="button" disabled={atEnd} onClick={() => moveTo(step + 1)} aria-label="Next step" aria-controls={stageId}><ControlIcon kind="next" /></button>
        </div>
      </div>}
    </div>}

    <div ref={stageRef} id={stageId} className="scol-journey-stage">
      <span className="scol-journey-source-label">{showStore ? 'External store' : removed ? 'Original notes' : 'Story notes'}</span>
      <div ref={nodeRef('store')} data-node="store" className="scol-journey-store" style={{ height: 28 + fullHeight + 10 + 48 + shortHeight - 20, opacity: showStore ? 1 : 0 }} aria-hidden="true" />
      <ol className="scol-journey-stream" aria-label={storyExample.label}>
        {NOTES.map((note, index) => {
          const expanded = poses[index].height === fullHeight && !compact
          const upcoming = !compact && scene !== 'memory' && index > frame.chunk
          const textTransition = (visible: boolean) => ({ duration: duration ? 0.12 : 0, delay: visible ? duration * 0.56 : 0 })
          return <motion.li key={note.id} ref={nodeRef(note.id)} data-node={note.id} className="scol-journey-card"
            data-current={weightScene ? index === frame.chunk : index === 0 && showQuestion}
            data-status={upcoming ? 'upcoming' : removed ? 'removed' : 'available'}
            aria-hidden={poses[index].opacity === 0} aria-label={upcoming ? `${note.label}. Upcoming. Not yet read.` : `${note.label}. ${note.text}`}
            initial={poses[index]} animate={animation} variants={ANIMATION_POSE} custom={poses[index]}
            transition={{ ...transition, duration: removed && showQuestion ? 0 : duration }}
            onUpdate={scheduleMeasure} onAnimationComplete={scheduleMeasure}>
            <motion.p initial={{ opacity: expanded ? 1 : 0 }} aria-hidden="true" animate={animation} variants={ANIMATION_POSE}
              custom={{ opacity: expanded ? 1 : 0 }} transition={textTransition(expanded)}>{upcoming ? '' : note.text}</motion.p>
            <motion.p className="scol-journey-relation" initial={{ opacity: expanded ? 0 : 1 }} aria-hidden="true" animate={animation} variants={ANIMATION_POSE}
              custom={{ opacity: expanded ? 0 : 1 }} transition={textTransition(!expanded)}>{upcoming ? `${note.label} · upcoming` : note.relation}</motion.p>
          </motion.li>
        })}
      </ol>
      <motion.div ref={nodeRef('summary')} data-node="summary" className="scol-journey-summary" aria-hidden={!showSummary}
        initial={{ opacity: showSummary ? 1 : 0 }} animate={animation} variants={ANIMATION_POSE} custom={{ opacity: showSummary ? 1 : 0 }}
        transition={{ ...transition, duration: showSummary ? duration : 0, delay: showSummary ? duration : 0 }} onUpdate={scheduleMeasure}>
        <span className="scol-journey-node-label">Summary</span><p>{STORY_CHAIN}</p>
      </motion.div>
      <motion.div className="scol-journey-cleared" aria-hidden={!removed} initial={{ opacity: removed ? 1 : 0 }}
        animate={animation} variants={ANIMATION_POSE} custom={{ opacity: removed ? 1 : 0 }}
        transition={{ ...transition, duration: removed ? duration : 0, delay: removed ? duration : 0 }}>
        <span>Original notes removed</span>
      </motion.div>
      <motion.div ref={nodeRef('question')} data-node="question" className="scol-journey-question" aria-hidden={!showQuestion}
        initial={{ opacity: showQuestion ? 1 : 0 }} animate={animation} variants={ANIMATION_POSE} custom={{ opacity: showQuestion ? 1 : 0 }}
        transition={{ ...transition, duration: showQuestion ? duration : 0 }} onUpdate={scheduleMeasure}>
        <span className="scol-journey-node-label">Later question</span><p>{storyExample.question}</p>
      </motion.div>
      <motion.div ref={nodeRef('choice')} data-node="choice" className="scol-journey-choice" style={{ top: choiceY }} aria-hidden={!selectionOpen}
        initial={{ opacity: selectionOpen ? 1 : 0 }} animate={animation} variants={ANIMATION_POSE} custom={{ opacity: selectionOpen ? 1 : 0 }}
        transition={transition} onUpdate={scheduleMeasure}>
        <span className="scol-journey-node-label">Emitted by <Theta version={2} /></span>
        <span className="scol-journey-layer-list">[{CHOICES[2].join(', ')}]</span>
      </motion.div>

      <div className="scol-journey-model" role="img"
        aria-label={`The same language model at theta ${compact ? 't' : frame.version}. 28 transformer layers. ${selectionOpen ? `Selected layer IDs: ${CHOICES[2].join(', ')}.` : ''} Layers are update locations, not separate fact slots.`}>
        <div className="scol-journey-model-heading" aria-hidden="true"><span>Model</span><Theta version={compact ? 't' : frame.version} /></div>
        <span className="scol-journey-layer-count" aria-hidden="true">28 layers</span>
        <div ref={nodeRef('model')} data-node="model" className="scol-journey-model-shell" aria-hidden="true">
          {LAYERS.map(layer => {
            const selected = broad ? frame.phase !== 'read' : selectedIds.includes(layer)
            return <div key={layer} className="scol-journey-layer" data-layer={layer} data-selected={selected} data-broad={broad}>
              <span ref={nodeRef(`layer-${layer}`)} data-node={`layer-${layer}`} className="scol-journey-layer-face">
                <motion.span className="scol-journey-layer-sweep" initial={{ scaleX: 0 }} animate={animation} variants={ANIMATION_POSE}
                  custom={{ scaleX: selected && (frame.phase === 'update' || frame.phase === 'commit' || compact) ? 1 : 0 }}
                  transition={{ duration: reduced || compact ? 0 : 0.7, delay: reduced || compact ? 0 : layer * 0.006 }} />
              </span>
              {selectionOpen && CHOICES[2].includes(layer) && <span className="scol-journey-layer-number">{layer}</span>}
            </div>
          })}
        </div>
      </div>

      <svg ref={svgRef} className="scol-journey-paths" viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true">
        <defs>{['ink', 'accent'].map(tone => <marker key={tone} id={`scol-journey-arrow-${tone}-${id}`} viewBox="0 0 10 8"
          refX="10" refY="4" markerWidth="10" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"
          className={`scol-journey-arrow-${tone}`}><path d="M0 0 10 4 0 8 1.5 4Z" /></marker>)}</defs>
        {routes.map(route => <path key={route.id} className={`scol-journey-path${route.accent ? ' scol-journey-path-accent' : ''}${route.dashed ? ' scol-journey-path-query' : ''}`}
          data-route={route.id} data-from={route.from} data-to={route.to} d={route.d}
          data-start={`${route.start.x},${route.start.y}`} data-end={`${route.end.x},${route.end.y}`}
          style={{ opacity: routeOpacity(route, geometry) }}
          strokeDasharray={route.dashed ? '8 7' : undefined} strokeDashoffset={route.dashed ? 0 : undefined}
          markerEnd={route.arrow === false ? undefined : `url(#scol-journey-arrow-${route.accent ? 'accent' : 'ink'}-${id})`} />)}
      </svg>
    </div>

    {!compact && <div className="scol-journey-detail">
      {scene === 'forgetting' ? <>
        <p className="scol-journey-check-heading">Knowledge checks <span>Illustrative · outside the model</span></p>
        <div className="scol-journey-checks">{NOTES.map((note, index) => {
          const value = CHECKS[index][step]
          const weaker = index === 0 && step > 0
          const status = value === null ? 'unread' : weaker ? 'weaker' : index === 2 && step === 2 ? 'before' : step === 3 ? 'stronger' : 'learned'
          return <div key={note.id} className="scol-journey-check" data-weaker={weaker}>
            <span>{note.relation}</span>
            <div className="scol-journey-check-track" role="img" aria-label={`${note.relation}: ${status}. Illustrative, not measured accuracy.`}>
              <motion.span initial={{ width: `${(value ?? 0) * 100}%` }} animate={animation} variants={ANIMATION_POSE}
                custom={{ width: `${(value ?? 0) * 100}%` }} transition={transition} />
              <motion.i initial={{ left: '86%', width: 0 }} animate={animation} variants={ANIMATION_POSE}
                custom={{ left: `${(value ?? 0) * 100}%`, width: `${weaker ? (0.86 - (value ?? 0)) * 100 : 0}%` }} transition={transition} />
            </div><span>{status}</span>
          </div>
        })}</div>
      </> : scene === 'memory' ? <>
        <p>{MEMORY_PATHS.find(path => path.id === memoryPath)?.description}</p>
        <p className="scol-journey-path-key"><span><i />Evidence</span><span><i />Query / revisit</span></p>
      </> : <>
        <p className="scol-journey-phase">{frame.label}</p>
        {scene === 'context' ? <p>{showQuestion ? <>Story answer: <strong>{storyExample.answer}</strong> The clues form one chain.</> : 'Read the notes in order. The question comes later.'}</p>
          : scene === 'selection' ? <p>{!selectionOpen ? 'The selection budget is at most 10 of 28 layers.'
            : frame.phase === 'commit' ? <>The resulting <Theta version={3} /> selects the next update.</>
              : <><strong>6 selected · at most 10 of 28.</strong> LoRA updates these layers.</>}</p>
            : <p><Theta version={frame.version} /> · {modelState}. {showQuestion ? `Story answer: ${storyExample.answer}` : 'Each note changes selected weights.'}</p>}
      </>}
    </div>}

    <figcaption id={captionId} className={`scol-journey-caption${compact ? ' scol-journey-sr-only' : ''}`}>
      <span className="scol-journey-caption-full">{scene === 'forgetting' ? 'Illustrative sequential fine-tuning. Broad updates strengthen later links while the key–box link weakens but remains.'
        : scene === 'consolidation' ? 'Illustrative story notes. LongBench v2 uses 2,048-token chunks. Layer color marks updates, not fact locations.'
          : scene === 'selection' ? 'Illustrative choices for Qwen2.5-7B-Instruct. Layer IDs are 0–27. Color marks updates, not fact locations.'
            : scene === 'memory' ? 'Illustrative paths through an unchanged model. Next, we let it learn the context into its weights.'
              : `${storyExample.label}. This is an illustration, not a model evaluation.`}</span>
      <span className="scol-journey-caption-short">{scene === 'forgetting' ? 'Illustrative sequential fine-tuning. Earlier ability weakens but remains.'
        : scene === 'selection' ? 'Illustrative layer choices, not separate fact locations.'
          : scene === 'consolidation' ? 'Illustrative updates. The later prompt holds only the question.'
            : scene === 'memory' ? 'Illustrative paths with fixed weights. Next, the model learns the context.'
              : 'Illustrative story. The answer needs all three links.'}</span>
    </figcaption>
    {!compact && <span className="scol-journey-sr-only" role="status" aria-live="polite" aria-atomic="true">
      {!running ? `${TITLES[scene]}. ${frame.label}` : ''}
      {scene === 'memory' ? ` ${MEMORY_PATHS.find(path => path.id === memoryPath)?.description}` : ''}
    </span>}
  </figure>
}
