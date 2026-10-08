import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import katex from 'katex'
import { homePose, SurfacePanel } from './ArgumentScene'
import {
  sharingFeasibleRegions, sharingFit, sharingFocusScene, sharingMovingPoint,
  type SharingMethod, type SharingTask,
} from './task-sharing-model'
import { useDiffusionReducedMotion } from './useMotionPreference'
import 'katex/dist/katex.min.css'
import './task-sharing.css'

const math = (tex: string) => katex.renderToString(tex, {
  throwOnError: false, output: 'html', displayMode: false,
})
const objectives = {
  ewc: math(String.raw`\mathcal L_t(\theta)+R_F(\theta)`),
  replay: math(String.raw`\mathcal L_t(\theta)+\beta\,\mathcal L_{\mathrm{Replay}}(\theta)`),
  hybrid: math(String.raw`\mathcal L_t(\theta)+\beta\,\mathcal L_{\mathrm{Replay}}(\theta)+R_F(\theta)`),
  penalty: math(String.raw`R_F(\theta)=\frac{\lambda}{2}\sum_{i<t}(\theta-\theta_i^\star)^\top F_i\,(\theta-\theta_i^\star)`),
}
const methods = [
  { id: 'ewc', label: 'EWC', ingredient: 'Fisher penalty' },
  { id: 'replay', label: 'Replay', ingredient: 'Generated earlier examples' },
  { id: 'hybrid', label: 'Trust Region', ingredient: 'Replay + Fisher penalty' },
] as const
const outcomes = {
  ewc: {
    title: 'No feasible overlap.',
    text: 'The shaded region fits Tasks 1 and 2. Task 3 does not intersect it. Moving toward Task 3 leaves that feasible set and loses the fit to Task 1.',
    case: 'Figure 1a: incompatible task regions.',
  },
  replay: {
    title: 'Replay can drift.',
    text: 'Generated examples admit a distant solution. The model fits those examples and Task 3, but misses the original Tasks 1 and 2.',
    case: 'Figure 1b–c: a shared solution exists.',
  },
  hybrid: {
    title: 'Keep a shared solution.',
    text: 'Replay supports learning across tasks. The Fisher penalty keeps the update near a useful solution that still fits all three.',
    case: 'Figure 1b–c: a shared solution exists.',
  },
}

export default function TaskSharing() {
  const [method, setMethod] = useState<SharingMethod>('ewc')
  const [task, setTask] = useState<SharingTask>(3)
  const [progress, setProgress] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [moving, setMoving] = useState(false)
  const [inView, setInView] = useState(false)
  const [pose, setPose] = useState(homePose)
  const root = useRef<HTMLDivElement>(null)
  const animation = useRef<number>()
  const resumeSequence = useRef(false)
  const reducedMotion = useDiffusionReducedMotion()
  const previousMotion = useRef(reducedMotion)
  const uid = useId()
  const scene = useMemo(() => sharingFocusScene(method, task, progress), [method, task, progress])
  const feasible = useMemo(() => {
    const empty = sharingFeasibleRegions(task, method).length === 0
    return {
      empty,
      equation: math(Array.from({ length: task }, (_, index) => String.raw`\mathcal C_${index + 1}`).join(String.raw`\cap`)
        + (empty ? String.raw`=\varnothing` : String.raw`\ne\varnothing`)),
    }
  }, [method, task])
  const fit = sharingFit(sharingMovingPoint(method, task, progress), task, method).fit
  const outcome = task === 1
    ? { title: 'Learn the first task.', text: 'All three methods start here. There is no earlier task to preserve yet.' }
    : task === 2
      ? method === 'ewc'
        ? { title: 'A feasible overlap.', text: 'The shaded overlap fits both Tasks 1 and 2. The model reaches it while learning Task 2 and preserving Task 1.' }
        : { title: 'Two tasks, one solution.', text: 'The model reaches the overlap between Tasks 1 and 2. It can learn the new task and still fit the first.' }
      : outcomes[method]
  const ingredient = methods.find(value => value.id === method)!.ingredient
  const active = playing || moving

  const cancelMovement = useCallback(() => {
    if (animation.current !== undefined) window.cancelAnimationFrame(animation.current)
    animation.current = undefined
    setMoving(false)
  }, [])
  const showTask = useCallback((next: SharingTask, smooth = false, from = 0) => {
    cancelMovement()
    setTask(next)
    if (!smooth || reducedMotion || !inView || next === 1) {
      setProgress(1)
      return
    }
    setProgress(from)
    setMoving(true)
    const started = performance.now()
    // First let the reader see that Task 3 misses the earlier feasible set.
    const hold = method === 'ewc' && next === 3 && from === 0 ? 550 : 0
    let lastRender = 0
    const tick = (now: number) => {
      const elapsed = Math.max(0, Math.min(1, (now - started - hold) / (1500 * (1 - from))))
      if (now - lastRender >= 1000 / 30 || elapsed === 1) {
        setProgress(from + (1 - from) * elapsed * elapsed * (3 - 2 * elapsed))
        lastRender = now
      }
      if (elapsed < 1) animation.current = window.requestAnimationFrame(tick)
      else {
        animation.current = undefined
        setMoving(false)
      }
    }
    animation.current = window.requestAnimationFrame(tick)
  }, [cancelMovement, reducedMotion, inView, method])

  useEffect(() => {
    if (!root.current) return
    const pause = () => {
      setPlaying(false)
      cancelMovement()
      setProgress(1)
    }
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting)
      if (!entry.isIntersecting) pause()
    }, { threshold: 0.08 })
    observer.observe(root.current)
    const onVisibility = () => { if (document.hidden) pause() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      cancelMovement()
    }
  }, [cancelMovement])

  useEffect(() => {
    if (previousMotion.current !== reducedMotion) {
      setPlaying(false)
      cancelMovement()
      setProgress(1)
    }
    previousMotion.current = reducedMotion
  }, [reducedMotion, cancelMovement])

  useEffect(() => {
    if (!playing || !inView || document.hidden) return
    const timer = window.setTimeout(() => {
      if (task === 3) setPlaying(false)
      else showTask((task + 1) as SharingTask, true)
    }, task === 1 ? 1100 : 2500)
    return () => window.clearTimeout(timer)
  }, [playing, inView, task, showTask])

  return (
    <figure className="diff-sharing" aria-labelledby={`${uid}-title`}
      data-method={method} data-task={task} data-progress={progress} data-playing={playing} data-moving={moving}>
      <header className="diff-sharing-heading">
        <h3 id={`${uid}-title`}>EWC, replay, and Trust Region</h3>
      </header>
      <div className="diff-sharing-methods" role="group" aria-label="Compare learning methods">
        {methods.map(value => <button key={value.id} type="button"
          aria-pressed={method === value.id} aria-controls={`${uid}-comparison`}
          onClick={() => {
            setPlaying(false)
            cancelMovement()
            setProgress(1)
            setMethod(value.id)
          }}>{value.label}</button>)}
      </div>

      <div className="diff-sharing-comparison" id={`${uid}-comparison`} ref={root}>
        <div className="diff-sharing-visual">
          <div className="diff-sharing-key" aria-label="Figure legend">
            {([1, 2, 3] as const).map(value => <span key={value} data-future={value > task}>
              <i data-task-tone={value} aria-hidden="true" />Task {value}
            </span>)}
            <span><i className="diff-sharing-model-key" aria-hidden="true" />Model</span>
          </div>
          <div className="arg-scene diff-sharing-landscape" aria-describedby={`${uid}-geometry`}>
            <SurfacePanel panel={scene} pose={pose} onPose={setPose} selected bare zoom={1.75} offsetY={0.4} minWidth={5}
              id={`${uid}-surface`} />
          </div>
          <div className="diff-sharing-controls">
            <div className="diff-sharing-tasks" role="group" aria-label="Task being learned">
              {([1, 2, 3] as const).map(value => <button type="button" key={value}
                aria-pressed={task === value} aria-controls={`${uid}-surface`}
                onClick={() => {
                  setPlaying(false)
                  showTask(value, value > 1)
                }}>Task {value}</button>)}
            </div>
            <button type="button" className="diff-sharing-play" aria-pressed={active}
              aria-label={active ? 'Pause animation' : progress < 1 ? 'Resume animation' : 'Play tasks 1 to 3'}
              onClick={() => {
                if (active) {
                  resumeSequence.current = playing
                  setPlaying(false)
                  cancelMovement()
                } else if (progress < 1) {
                  showTask(task, true, progress)
                  setPlaying(resumeSequence.current)
                } else {
                  showTask(1)
                  setPlaying(true)
                }
              }}>
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                {active
                  ? <path d="M6 4v12M14 4v12" fill="none" stroke="currentColor" strokeWidth="2.6" />
                  : <path d="M6 3.5 16 10 6 16.5Z" fill="currentColor" />}
              </svg>
              {active ? 'Pause' : progress < 1 ? 'Resume' : 'Play'}
            </button>
          </div>
        </div>

        <aside className="diff-sharing-reading" aria-live="polite" aria-atomic="true">
          <p className="diff-sharing-ingredient">{ingredient}</p>
          <div className="diff-sharing-outcome" key={`${method}-${task}`}>
            <h4>{outcome.title}</h4>
            <p>{outcome.text}</p>
          </div>
          {method === 'ewc' && task >= 2 ? <div className="diff-sharing-feasibility" data-empty={feasible.empty}>
            <span>Common feasible set</span>
            <div role="math" aria-label={`The common low-loss region for Tasks ${Array.from({ length: task }, (_, i) => i + 1).join(', ')} is ${feasible.empty ? 'empty' : 'nonempty'}.`}
              dangerouslySetInnerHTML={{ __html: feasible.equation }} />
          </div> : <p className="diff-sharing-fit" aria-live="off">
            <span>Fits original tasks</span>
            <strong>{fit.length ? fit.join(', ') : 'None at this point'}</strong>
          </p>}
          <div className="diff-sharing-reading-notes">
            <p className="diff-sharing-case">{task === 3 ? outcomes[method].case : 'The same starting case for all three methods.'}</p>
            <p className="diff-sharing-dashes" data-visible={task === 3 && method !== 'ewc'}>
              <i aria-hidden="true" />Dashed loops fit generated examples.
            </p>
          </div>
          <div className="diff-sharing-view">
            <span>Drag to rotate</span>
            <button type="button" onClick={() => setPose(homePose)}>Reset view</button>
          </div>
        </aside>
      </div>

      <figcaption className="diff-sharing-caption">
        <p id={`${uid}-geometry`}>Colored loops show low task loss. Height shows scaled task loss. Illustrative paths, adapted from Figure 1.</p>
        <details>
          <summary>Objectives and the paper</summary>
          <div className="diff-sharing-objectives">
            {methods.map(value => <p key={value.id}>
              <strong>{value.label}</strong>
              <span dangerouslySetInnerHTML={{ __html: objectives[value.id] }} />
            </p>)}
          </div>
          <p>Fisher defines EWC’s penalty. Replay supplies generated examples of earlier tasks. Trust Region combines both.</p>
          <div className="diff-sharing-penalty" dangerouslySetInnerHTML={{ __html: objectives.penalty }} />
          <p>
            Figure 1(a) illustrates a case with no common fit for all three tasks.
            Here C_i denotes the low-loss set of Task i. The shaded set is the
            intersection of the Task 1 and Task 2 regions, computed from the plotted boundaries.
            It is disjoint from the Task 3 region, so the three-task feasible set is empty.
            The EWC path reaches the Task 1 and Task 2 overlap, then leaves it to learn Task 3.
            Figure 1(b) and (c) use a different case, with a shared solution.
            Replay and Trust Region use identical task regions and replay examples in this view.
          </p>
          <p>
            Fits are computed from the colored regions, not experimental scores.
            The trajectories illustrate the argument, rather than simulate an optimizer.
            The Fisher term is a soft penalty. A single rank-1 term can be unbounded
            in orthogonal directions. None of the loops is a Fisher constraint boundary.
          </p>
          <p className="diff-sharing-source">
            <a href="https://arxiv.org/html/2602.02417v1#S3.F1" target="_blank" rel="noreferrer">Trust Region Figure 1</a>
            {' · '}
            <a href="https://arxiv.org/html/2509.23593v2#S3.SS4" target="_blank" rel="noreferrer">Parameter sharing, §3.4</a>
          </p>
        </details>
      </figcaption>
    </figure>
  )
}
