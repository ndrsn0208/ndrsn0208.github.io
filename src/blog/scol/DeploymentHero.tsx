import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { CSSProperties } from 'react'
import { motion } from 'motion/react'
import { storyExample } from './story-example'
import './deployment-hero.css'

export interface DeploymentHeroProps {
  compact?: boolean
}

type Phase = 'arrive' | 'write' | 'clear' | 'question' | 'answer'
type Frame = { phase: Phase; chunk: number; duration: number; label: string }
type Point = { x: number; y: number }
type Port = 'write' | 'queryIn' | 'queryOut' | 'answerIn' | 'answerOut'
type Geometry = {
  width: number
  height: number
  updates: string[]
  branches: string[]
  question: string
  answer: string
}

// A finite storyboard, with schematic locations rather than measured weights.
const WEIGHT_GROUPS: readonly (readonly number[])[] = [
  [3, 14, 32],
  [10, 25, 39],
  [19, 34, 45],
]
const WEIGHTS = Array.from({ length: 48 }, (_, index) => index)
// Let the packet reach the port and hold there before any weight fill starts.
const WRITE_TIMING = { arrival: 0.5, reveal: 0.56, stagger: 0.08, fill: 0.24 } as const
const FRAMES: Frame[] = [
  ...storyExample.chunks.flatMap((chunk, index): Frame[] => [
    { phase: 'arrive', chunk: index, duration: 2000, label: `${chunk.label} arrives as context` },
    { phase: 'write', chunk: index, duration: 1400, label: `${chunk.label} changes selected weights` },
  ]),
  { phase: 'clear', chunk: 2, duration: 1800, label: 'The original prompt context is cleared' },
  { phase: 'question', chunk: 2, duration: 2400, label: 'Only the new question enters the model' },
  { phase: 'answer', chunk: 2, duration: 0, label: 'The same model answers from its changed weights' },
]
const STARTS = FRAMES.map((_, index) => FRAMES.slice(0, index).reduce((sum, frame) => sum + frame.duration, 0))
const TOTAL_DURATION = STARTS[STARTS.length - 1]
const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect
const clamp = (value: number) => Math.max(0, Math.min(1, value))
const MOTION_PREFERENCE = '(prefers-reduced-motion: reduce)'

function subscribeToMotionPreference(onChange: () => void) {
  const query = window.matchMedia(MOTION_PREFERENCE)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function readMotionPreference() {
  return window.matchMedia(MOTION_PREFERENCE).matches
}

function curve(from: Point, to: Point, vertical = false) {
  const delta = vertical ? to.y - from.y : to.x - from.x
  const bend = Math.max(16, Math.abs(delta) * 0.48) * (delta < 0 ? -1 : 1)
  return vertical
    ? `M${from.x},${from.y} C${from.x},${from.y + bend} ${to.x},${to.y - bend} ${to.x},${to.y}`
    : `M${from.x},${from.y} C${from.x + bend},${from.y} ${to.x - bend},${to.y} ${to.x},${to.y}`
}

function roundedPath(rawPoints: Point[], radius = 6) {
  const points = rawPoints.filter((point, index) => index === 0
    || Math.hypot(point.x - rawPoints[index - 1].x, point.y - rawPoints[index - 1].y) > 0.1)
  let path = `M${points[0].x},${points[0].y}`
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1]
    const point = points[index]
    const next = points[index + 1]
    const before = Math.hypot(previous.x - point.x, previous.y - point.y)
    const after = Math.hypot(next.x - point.x, next.y - point.y)
    const rounding = Math.min(radius, before / 2, after / 2)
    path += ` L${point.x + (previous.x - point.x) * rounding / before},${point.y + (previous.y - point.y) * rounding / before}`
    path += ` Q${point.x},${point.y} ${point.x + (next.x - point.x) * rounding / after},${point.y + (next.y - point.y) * rounding / after}`
  }
  const last = points[points.length - 1]
  return `${path} L${last.x},${last.y}`
}

function ControlIcon({ kind }: { kind: 'play' | 'pause' | 'replay' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {kind === 'play' && <path d="m6 3.5 10 6.5-10 6.5Z" />}
      {kind === 'pause' && <path d="M6.5 3.5v13M13.5 3.5v13" />}
      {kind === 'replay' && <path d="M4 8a6.5 6.5 0 1 1 .5 6M4 3v5h5" />}
    </svg>
  )
}

export default function DeploymentHero({ compact = false }: DeploymentHeroProps) {
  const uid = `scol-deployment-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const reducedMotion = useSyncExternalStore(subscribeToMotionPreference, readMotionPreference, () => true)
  const rootRef = useRef<HTMLElement>(null)
  const diagramRef = useRef<HTMLDivElement>(null)
  const matrixRef = useRef<HTMLDivElement>(null)
  const sourcePorts = useRef<(HTMLSpanElement | null)[]>([])
  const weightNodes = useRef<(HTMLSpanElement | null)[]>([])
  const ports = useRef<Record<Port, HTMLSpanElement | null>>({
    write: null, queryIn: null, queryOut: null, answerIn: null, answerOut: null,
  })
  const elapsedRef = useRef(0)
  const interacted = useRef(false)
  const [elapsed, setElapsed] = useState(0)
  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [pageVisible, setPageVisible] = useState(true)
  const [geometry, setGeometry] = useState<Geometry | null>(null)

  const overview = compact || !started
  const frameIndex = STARTS.reduce((current, start, index) => elapsed >= start ? index : current, 0)
  const frame = FRAMES[frameIndex]
  const frameProgress = frame.duration ? clamp((elapsed - STARTS[frameIndex]) / frame.duration) : 1
  const atEnd = started && elapsed >= TOTAL_DURATION
  const cleared = !overview && ['clear', 'question', 'answer'].includes(frame.phase)
  const asking = overview || frame.phase === 'question' || frame.phase === 'answer'
  const answering = overview || frame.phase === 'answer'
  const writing = !overview && frame.phase === 'write'
  const written = overview || cleared ? storyExample.chunks.length : frame.chunk
  const transition = { duration: reducedMotion ? 0 : 0.24, ease: 'easeOut' as const }
  const status = overview ? 'Context → selected weights → answer' : frame.label

  // The rendered ports and weight cells are the geometry source. Both the
  // drawing and its travelling ink mark consume the resulting paths. No text
  // is inside a scaled SVG, and no second set of CSS node coordinates exists.
  useBrowserLayoutEffect(() => {
    const diagram = diagramRef.current
    const matrix = matrixRef.current
    if (!diagram || !matrix) return
    let disposed = false
    const measure = () => {
      if (disposed || Object.values(ports.current).some(port => !port)) return
      const bounds = diagram.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return
      const point = (element: HTMLElement): Point => {
        const rect = element.getBoundingClientRect()
        return {
          x: Math.round((rect.left + rect.width / 2 - bounds.left) * 10) / 10,
          y: Math.round((rect.top + rect.height / 2 - bounds.top) * 10) / 10,
        }
      }
      const anchors = Object.fromEntries(Object.entries(ports.current)
        .map(([name, element]) => [name, point(element!)])) as Record<Port, Point>
      const vertical = getComputedStyle(diagram).getPropertyValue('--scol-deployment-flow').trim() === 'vertical'
      const matrixBounds = matrix.getBoundingClientRect()
      const bus = vertical
        ? matrixBounds.right - bounds.left + 7
        : matrixBounds.left - bounds.left - 7
      const next: Geometry = {
        width: bounds.width,
        height: bounds.height,
        updates: sourcePorts.current.map(element => {
          const from = point(element!)
          return vertical
            ? roundedPath([
              from,
              { x: bounds.width - 7, y: from.y },
              { x: bounds.width - 7, y: anchors.write.y - 15 },
              { x: anchors.write.x, y: anchors.write.y - 15 },
              anchors.write,
            ])
            : curve(from, anchors.write)
        }),
        branches: weightNodes.current.map(element => {
          const rect = element!.getBoundingClientRect()
          const target = { x: point(element!).x, y: rect.top - bounds.top }
          const entry = vertical
            ? [{ x: anchors.write.x, y: matrixBounds.top - bounds.top - 7 }]
            : []
          return roundedPath([
            anchors.write,
            ...entry,
            { x: bus, y: vertical ? matrixBounds.top - bounds.top - 7 : anchors.write.y },
            { x: bus, y: target.y - 3 },
            { x: target.x, y: target.y - 3 },
            target,
          ], 2)
        }),
        question: curve(anchors.queryOut, anchors.queryIn, vertical),
        answer: curve(anchors.answerOut, anchors.answerIn, vertical || compact),
      }
      setGeometry(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next)
    }
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(diagram)
    observer?.observe(matrix)
    Object.values(ports.current).forEach(port => {
      if (port?.parentElement) observer?.observe(port.parentElement)
    })
    window.addEventListener('resize', measure)
    document.fonts?.addEventListener('loadingdone', measure)
    void document.fonts?.ready.then(measure)
    return () => {
      disposed = true
      observer?.disconnect()
      window.removeEventListener('resize', measure)
      document.fonts?.removeEventListener('loadingdone', measure)
    }
  }, [compact])

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== 'hidden')
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  // Visibility only schedules the first automatic play. A manual Play or
  // Replay always runs, including when most of a tall phone figure is offscreen.
  useEffect(() => {
    if (compact || reducedMotion || started || interacted.current || !pageVisible) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const cancel = () => {
      clearTimeout(timer)
      timer = undefined
    }
    const schedule = () => {
      if (timer !== undefined) return
      timer = setTimeout(() => {
        if (interacted.current) return
        elapsedRef.current = 0
        setElapsed(0)
        setStarted(true)
        setPlaying(true)
      }, 2800)
    }
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) schedule()
      else cancel()
    }, { threshold: 0 })
    if (observer && rootRef.current) observer.observe(rootRef.current)
    else schedule()
    return () => {
      cancel()
      observer?.disconnect()
    }
  }, [compact, reducedMotion, started, pageVisible])

  useEffect(() => {
    if (reducedMotion || compact) setPlaying(false)
  }, [reducedMotion, compact])

  // One clock controls the packet, sparse fills and progress. Pause preserves
  // the exact playhead. Reduced motion keeps manual playback as still steps.
  useEffect(() => {
    if (!playing || !pageVisible || compact) return
    let request = 0
    let previous = performance.now()
    const tick = (now: number) => {
      elapsedRef.current = Math.min(TOTAL_DURATION, elapsedRef.current + now - previous)
      previous = now
      setElapsed(elapsedRef.current)
      if (elapsedRef.current >= TOTAL_DURATION) setPlaying(false)
      else request = requestAnimationFrame(tick)
    }
    request = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(request)
  }, [playing, pageVisible, compact])

  function replay() {
    interacted.current = true
    elapsedRef.current = 0
    setElapsed(0)
    setStarted(true)
    setPlaying(true)
  }

  function togglePlay() {
    interacted.current = true
    if (overview || atEnd) replay()
    else setPlaying(previous => !previous)
  }

  function weightFill(index: number) {
    const group = WEIGHT_GROUPS.findIndex(selection => selection.includes(index))
    if (group < 0) return 0
    if (overview || group < written) return 1
    if (!writing || group !== frame.chunk) return 0
    if (reducedMotion) return 1
    const order = WEIGHT_GROUPS[group].indexOf(index)
    return clamp((frameProgress - WRITE_TIMING.reveal - order * WRITE_TIMING.stagger) / WRITE_TIMING.fill)
  }

  const modelStatus = overview || cleared
    ? 'Updated weights remain'
    : writing ? `Writing ${storyExample.chunks[frame.chunk].label.toLowerCase()}`
      : frame.chunk ? 'Earlier changes remain' : 'Ready to write context'

  return (
    <figure
      ref={rootRef}
      className="scol-deployment"
      data-compact={compact}
      data-phase={overview ? 'overview' : frame.phase}
      data-playing={playing}
      data-reduced-motion={reducedMotion}
      aria-labelledby={`${uid}-title`}
      aria-describedby={`${uid}-caption`}
    >
      <header className="scol-deployment-heading">
        <p className="scol-deployment-overline">At deployment time</p>
        <h3 id={`${uid}-title`}>
          {compact ? 'Context → weights → answer' : 'Context becomes memory in the weights'}
        </h3>
      </header>

      <div className="scol-deployment-diagram" ref={diagramRef}>
        {geometry && <svg
          className="scol-deployment-wires"
          width={geometry.width}
          height={geometry.height}
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          aria-hidden="true"
        >
          <defs>
            <marker id={`${uid}-update-arrow`} viewBox="0 0 8 8" refX="7.5" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto">
              <path d="M1 1 7.5 4 1 7" className="scol-deployment-arrow scol-deployment-arrow-update" />
            </marker>
            <marker id={`${uid}-query-arrow`} viewBox="0 0 8 8" refX="7.5" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto">
              <path d="M1 1 7.5 4 1 7" className="scol-deployment-arrow" />
            </marker>
          </defs>
          {geometry.updates.map((path, index) => <path
            key={storyExample.chunks[index].id}
            d={path}
            className="scol-deployment-wire scol-deployment-wire-update"
            opacity={overview || (!cleared && frame.chunk === index) ? 1 : 0}
            markerEnd={`url(#${uid}-update-arrow)`}
          />)}
          {writing && WEIGHT_GROUPS[frame.chunk].map(index => <path
            key={index}
            d={geometry.branches[index]}
            className="scol-deployment-wire scol-deployment-wire-branch"
            opacity={reducedMotion || frameProgress >= WRITE_TIMING.arrival ? 0.8 : 0}
          />)}
          <path
            d={geometry.question}
            className="scol-deployment-wire scol-deployment-wire-query"
            strokeDasharray="5 7"
            opacity={asking ? 1 : 0}
            markerEnd={`url(#${uid}-query-arrow)`}
          />
          <path
            d={geometry.answer}
            className="scol-deployment-wire scol-deployment-wire-answer"
            opacity={answering ? 1 : 0}
            markerEnd={`url(#${uid}-query-arrow)`}
          />
        </svg>}

        <section className="scol-deployment-context" aria-label="Original context">
          <div className="scol-deployment-node-label">
            <span>Context chunks</span>
            <span className="scol-deployment-context-state">
              {overview ? 'Then cleared' : cleared ? 'Cleared' : `${written} / ${storyExample.chunks.length} written`}
            </span>
          </div>
          <div className="scol-deployment-context-pages">
            <ol className="scol-deployment-chunks" aria-hidden={cleared}>
              {storyExample.chunks.map((chunk, index) => {
                const arrived = overview || index <= frame.chunk
                return (
                  <li
                    key={chunk.id}
                    className="scol-deployment-chunk"
                    data-current={!overview && !cleared && index === frame.chunk}
                    data-written={overview || index < written}
                  >
                    {!arrived && <span className="scol-deployment-waiting">{chunk.label} comes next</span>}
                    <motion.div
                      className="scol-deployment-sheet"
                      initial={false}
                      animate={{ opacity: arrived && !cleared ? 1 : 0 }}
                      transition={transition}
                      aria-hidden={!arrived || cleared}
                    >
                      <span className="scol-deployment-note-number" aria-label={chunk.label}>{index + 1}</span>
                      <p>{compact ? chunk.relation : chunk.text}</p>
                    </motion.div>
                    <span className="scol-deployment-port scol-deployment-source-port" ref={element => { sourcePorts.current[index] = element }} aria-hidden="true" />
                  </li>
                )
              })}
            </ol>
            <motion.div
              className="scol-deployment-cleared"
              initial={false}
              animate={{ opacity: cleared ? 1 : 0 }}
              transition={transition}
              aria-hidden={!cleared}
            >
              <svg viewBox="0 0 44 38" fill="none" aria-hidden="true">
                <path d="M9 4h26v30H9zM14 10h16M14 16h10M14 26h16" />
                <path d="m4 32 36-26" className="scol-deployment-erase-mark" />
              </svg>
              <strong>Original prompt empty</strong>
              <span>The notes have been removed</span>
            </motion.div>
          </div>
        </section>

        <section className="scol-deployment-model" aria-label="The same language model throughout the sequence">
          <div className="scol-deployment-node-label"><span>Same model</span></div>
          <div className="scol-deployment-model-stack">
            <div className="scol-deployment-model-face">
              <div className="scol-deployment-weight-grid" ref={matrixRef} aria-hidden="true">
                {WEIGHTS.map(index => {
                  const fill = weightFill(index)
                  return <span
                    key={index}
                    ref={element => { weightNodes.current[index] = element }}
                    className="scol-deployment-weight"
                    data-changed={fill > 0}
                    style={{ '--scol-deployment-fill': fill } as CSSProperties}
                  ><span /></span>
                })}
              </div>
              <div className="scol-deployment-weight-label"><i aria-hidden="true" />Selected weights</div>
              <p className="scol-deployment-model-status">{modelStatus}</p>
              <span className="scol-deployment-port scol-deployment-write-port" ref={element => { ports.current.write = element }} aria-hidden="true" />
              <span className="scol-deployment-port scol-deployment-model-query-port" ref={element => { ports.current.queryIn = element }} aria-hidden="true" />
              <span className="scol-deployment-port scol-deployment-model-answer-port" ref={element => { ports.current.answerOut = element }} aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="scol-deployment-question" aria-label="Later input">
          <div className="scol-deployment-question-card">
            <div className="scol-deployment-node-label"><span>Later input</span><span>Question only</span></div>
            <div className="scol-deployment-question-copy">
              <p className="scol-deployment-reserved-copy" aria-hidden={!asking} data-visible={asking}>{storyExample.question}</p>
              <p className="scol-deployment-pending-copy" aria-hidden={asking} data-visible={!asking}>A question arrives later</p>
            </div>
            <span className="scol-deployment-port scol-deployment-question-port" ref={element => { ports.current.queryOut = element }} aria-hidden="true" />
          </div>
        </section>

        <section className="scol-deployment-answer" aria-label="Answer from retained weights">
          <div className="scol-deployment-answer-card">
            <div className="scol-deployment-node-label"><span>Answer from weights</span></div>
            <div className="scol-deployment-reply">
              <motion.div initial={false} animate={{ opacity: answering ? 1 : 0 }} transition={transition} aria-hidden={!answering}>
                <p className="scol-deployment-answer-word">{storyExample.answer}</p>
                {!compact && <p className="scol-deployment-explanation">{storyExample.explanation}</p>}
              </motion.div>
              <p className="scol-deployment-pending-copy" data-visible={!answering} aria-hidden={answering}>The answer comes later</p>
            </div>
            <span className="scol-deployment-port scol-deployment-answer-port" ref={element => { ports.current.answerIn = element }} aria-hidden="true" />
          </div>
        </section>

        {geometry && writing && !reducedMotion && frameProgress < WRITE_TIMING.reveal && <span
          className="scol-deployment-ink-packet"
          aria-hidden="true"
          style={{
            offsetPath: `path("${geometry.updates[frame.chunk]}")`,
            offsetDistance: `${clamp(frameProgress / WRITE_TIMING.arrival) * 100}%`,
          }}
        />}
      </div>

      {!compact && <div className="scol-deployment-controls">
        <div className="scol-deployment-control-row">
          <div className="scol-deployment-buttons">
            <button type="button" className="scol-deployment-play" onClick={togglePlay} aria-label={`${playing ? 'Pause' : 'Play'} the deployment sequence`}>
              <ControlIcon kind={playing ? 'pause' : 'play'} />{playing ? 'Pause' : 'Play'}
            </button>
            <button type="button" onClick={replay} aria-label="Replay the deployment sequence from the first note">
              <ControlIcon kind="replay" />Replay
            </button>
          </div>
          <span className="scol-deployment-counter">{overview ? 'Overview' : atEnd ? 'Complete' : `${frameIndex + 1} / ${FRAMES.length}`}</span>
          <p className="scol-deployment-status" role="status" aria-live="polite" aria-atomic="true">{status}</p>
        </div>
        <div
          className="scol-deployment-progress"
          role="progressbar"
          aria-label="Playback progress"
          aria-valuemin={0}
          aria-valuemax={FRAMES.length}
          aria-valuenow={overview ? 0 : frameIndex + 1}
          aria-valuetext={overview ? 'Overview, ready to play' : `${frameIndex + 1} of ${FRAMES.length}. ${status}`}
        >
          <span style={{ width: `${overview ? 0 : reducedMotion ? (frameIndex + 1) / FRAMES.length * 100 : elapsed / TOTAL_DURATION * 100}%` }} />
        </div>
      </div>}

      <figcaption id={`${uid}-caption`} className="scol-deployment-caption">
        <span className="scol-deployment-legend">
          <span><i className="scol-deployment-key-update" aria-hidden="true" />Weight update</span>
          <span><i className="scol-deployment-key-query" aria-hidden="true" />Question</span>
        </span>
        <span>Illustrative sequence, including the answer.</span>
      </figcaption>
    </figure>
  )
}
