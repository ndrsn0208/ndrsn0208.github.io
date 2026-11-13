import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import Exhibit from '../essay/Exhibit'
import { Bars, type BarRow } from '../essay/Bars'
import { diffusionEssay } from './article'
import { diffusionBenchmarks, diffusionRecovery } from './evidence'
import { recording } from './media'
import TerrainStage, { type TerrainMode } from './TerrainStage'
import './exhibits.css'

const essay = diffusionEssay
const specs = diffusionEssay.exhibits

/* The opening figure: the author's recording of four diffusion policies on
   CW10 Task 1. One video holds all eight views. Each cell shows its own part
   of it, without the labels drawn into the recording. */

const columns = [213, 458, 703, 947]
const rows = [134, 503]
// Inside each view's frame and above its badge.
const view = { inset: 6, width: 222, height: 178 }
const methods = [
  { name: 'Trust Region', ours: true, after: 'Succeeds' },
  { name: 'Replay', after: 'Fails' },
  { name: 'EWC', after: 'Fails' },
  { name: 'Finetuning', after: 'Fails' },
] as const

function RobotReturn({ lead }: { lead: boolean }) {
  const video = useRef<HTMLVideoElement>(null)
  const cells = useRef<(HTMLCanvasElement | null)[]>([])
  const started = useRef(false)
  const [playing, setPlaying] = useState(false)
  // The still is the last frame of the recording.
  const [position, setPosition] = useState(1)

  const paint = useCallback((source: CanvasImageSource) => {
    rows.forEach((top, row) => columns.forEach((left, column) => {
      const cell = cells.current[row * columns.length + column]
      const context = cell?.getContext('2d')
      if (!cell || !context) return
      context.drawImage(source, left + view.inset, top + view.inset, view.width, view.height, 0, 0, cell.width, cell.height)
    }))
  }, [])

  useEffect(() => {
    const image = new Image()
    image.onload = () => { if (!started.current) paint(image) }
    image.src = recording.still
    return () => { image.onload = null }
  }, [paint])

  useEffect(() => {
    const element = video.current
    if (!element || !playing) return
    let frame = 0
    const step = () => {
      paint(element)
      setPosition(element.duration ? element.currentTime / element.duration : 0)
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [playing, paint])

  const toggle = useCallback(() => {
    const element = video.current
    if (!element) return
    if (element.paused) { started.current = true; void element.play().catch(() => {}) }
    else element.pause()
  }, [])

  const seek = useCallback((value: number) => {
    const element = video.current
    if (!element) return
    started.current = true
    element.pause()
    const show = () => { paint(element); setPosition(value) }
    element.addEventListener('seeked', show, { once: true })
    element.currentTime = value * (element.duration || recording.seconds)
  }, [paint])

  // The opening figure plays once it is in view, and rests when it is not.
  const onSeen = useCallback((seen: boolean, still: boolean) => {
    const element = video.current
    if (!element) return
    if (!seen) element.pause()
    else if (lead && !still && !started.current) { started.current = true; void element.play().catch(() => {}) }
  }, [lead])

  return (
    <Exhibit id="return" spec={specs.return} essay={essay} lead={lead} progress={{ value: position, playing, toggle, seek }} onSeen={onSeen}>
      {() => <div className="robots">
        <video ref={video} className="site-hidden" src={recording.src} muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1}
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
        <div className="robots-head" aria-hidden="true">
          <span />
          {methods.map(method => <span key={method.name} data-ours={'ours' in method || undefined}>{method.name}</span>)}
        </div>
        {['After Task 1', 'After Task 10'].map((moment, row) => (
          <div className="robots-row" key={moment} role="group" aria-label={moment}>
            <p className="robots-moment">{moment}</p>
            {methods.map((method, column) => (
              <div className="robots-cell" key={method.name} data-ours={'ours' in method || undefined}>
                <canvas ref={element => { cells.current[row * columns.length + column] = element }} width={view.width * 2} height={view.height * 2}
                  role="img" aria-label={`${method.name}, ${moment.replace('After', 'after')}: ${row === 0 ? 'succeeds' : method.after.toLowerCase()}`} />
                <p data-outcome={row === 0 ? 'Succeeds' : method.after}><span className="robots-name">{method.name}</span>{row === 0 ? 'Succeeds' : method.after}</p>
              </div>
            ))}
          </div>
        ))}
      </div>}
    </Exhibit>
  )
}

/* The landscape figures share one scene. */
function Terrain({ id, mode, rest }: { id: 'forgetting' | 'region' | 'methods', mode: TerrainMode, rest: number }) {
  const spec = specs[id]
  return (
    <Exhibit id={id} spec={spec} essay={essay} rest={rest} dwell={mode === 'methods' ? [3600, 4400, 4200] : 3600}>
      {({ step, still, seen }) => <TerrainStage mode={mode} step={step} still={still} seen={seen} label={`${spec.description} ${spec.steps[step].say}`} />}
    </Exhibit>
  )
}

/* Re-convergence: gradient updates until Task 1 returns to a threshold, after every task transition. */

const thresholds = {
  'trust-cw10': [
    { id: 'sr-80', title: '80% of initial success rate' },
    { id: 'sr-90', title: '90% of initial success rate' },
    { id: 'sr-99', title: '99% of initial success rate' },
  ],
  'trust-imagenet500': [
    { id: 'fid-30', title: 'FID within +30% of initial' },
    { id: 'fid-20', title: 'FID within +20% of initial' },
    { id: 'fid-10', title: 'FID within +10% of initial' },
  ],
} as const
const decades = [1, 10, 100, 1000, 10000]
const decadeNames = ['1', '10', '100', '1k', '10k']

function RecoveryPanel({ title, tasks, replay, trust, axis }: {
  title: string
  tasks: readonly number[]
  replay: readonly (number | null)[]
  trust: readonly (number | null)[]
  axis: boolean
}) {
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(300)
  useLayoutEffect(() => {
    const element = box.current
    if (!element) return
    const measure = () => setWidth(Math.max(200, Math.round(element.getBoundingClientRect().width)))
    measure()
    const sizes = new ResizeObserver(measure)
    sizes.observe(element)
    return () => sizes.disconnect()
  }, [])
  const height = 218
  const left = axis ? 42 : 12
  const right = 10
  const top = 30
  const bottom = 26
  const plot = { width: width - left - right, height: height - top - bottom }
  const x = (index: number) => left + plot.width * (index + .5) / tasks.length
  const y = (value: number) => top + plot.height * (1 - Math.log10(value) / 4)
  const lost = 13
  const series = [
    { name: 'Replay', values: replay, ours: false },
    { name: 'Trust Region', values: trust, ours: true },
  ]
  const told = tasks.map((task, index) => {
    const say = (value: number | null) => value === null ? 'not re-converged' : `${value.toLocaleString('en')} gradient updates`
    return `Task ${task}: Trust Region ${say(trust[index])}, Replay ${say(replay[index])}.`
  }).join(' ')

  return (
    <div className="recovery-panel" ref={box}>
      <p className="recovery-title">{title}</p>
      <svg width={width} height={height} role="img" aria-label={`${title}. ${told}`}>
        {decades.map((decade, index) => (
          <g key={decade}>
            <line className="recovery-grid" x1={left} x2={width - right} y1={y(decade)} y2={y(decade)} />
            {axis && <text className="recovery-tick" x={left - 8} y={y(decade)} textAnchor="end" dominantBaseline="middle">{decadeNames[index]}</text>}
          </g>
        ))}
        {tasks.map((task, index) => <text className="recovery-tick" key={task} x={x(index)} y={height - 6} textAnchor="middle">{task}</text>)}
        {series.map(item => {
          // A line joins task transitions after which the method re-converged. A cross marks one where it did not.
          const runs: string[] = []
          let run = ''
          item.values.forEach((value, index) => {
            if (value === null) { if (run) runs.push(run); run = ''; return }
            run += `${run ? 'L' : 'M'}${x(index).toFixed(1)} ${y(value).toFixed(1)}`
          })
          if (run) runs.push(run)
          return (
            <g key={item.name} className="recovery-series" data-ours={item.ours || undefined}>
              {runs.map((d, index) => <path key={index} d={d} />)}
              {item.values.map((value, index) => value === null
                ? <path key={index} className="recovery-lost" d={`M${x(index) - 4} ${lost - 4}l8 8m0 -8l-8 8`} transform={`translate(${item.ours ? 5 : -5} 0)`} />
                : <circle key={index} cx={x(index)} cy={y(value)} r={item.ours ? 3.5 : 6} />)}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function useStacked() {
  const [stacked, setStacked] = useState(false)
  useLayoutEffect(() => {
    const query = window.matchMedia('(max-width: 760px)')
    const update = () => setStacked(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return stacked
}

function Recovery() {
  const stacked = useStacked()
  return (
    <Exhibit id="recovery" spec={specs.recovery} essay={essay}>
      {({ tab }) => {
        const benchmark = tab === 0 ? 'trust-cw10' : 'trust-imagenet500'
        const record = diffusionRecovery.find(item => item.benchmark === benchmark)!
        return (
          <div className="recovery">
            <p className="recovery-key">
              <span><svg width="14" height="14" aria-hidden="true"><circle className="recovery-key-ours" cx="7" cy="7" r="3.5" /></svg>Trust Region</span>
              <span><svg width="14" height="14" aria-hidden="true"><circle className="recovery-key-other" cx="7" cy="7" r="6" /></svg>Replay</span>
              <span><svg width="14" height="14" aria-hidden="true"><path className="recovery-key-lost" d="M3 3l8 8m0 -8l-8 8" /></svg>Not re-converged</span>
            </p>
            <div className="recovery-panels">
              {thresholds[benchmark].map((threshold, index) => {
                const row = record.targets.find(item => item.id === threshold.id)!
                return <RecoveryPanel key={threshold.id} title={threshold.title} tasks={record.learningTasks} replay={row.replay} trust={row.trustRegion} axis={index === 0 || stacked} />
              })}
            </div>
            <p className="recovery-axis">Gradient updates for Task 1 to re-converge, after the transition to each task</p>
          </div>
        )
      }}
    </Exhibit>
  )
}

/* Results: every method on every benchmark, from the papers' tables. */

const order = ['iclr-imagenet1k', 'trust-imagenet500', 'trust-cw10'] as const
const ceilings: Record<typeof order[number], readonly [number, number]> = {
  'iclr-imagenet1k': [95, 62],
  'trust-imagenet500': [185, 140],
  'trust-cw10': [100, 80],
}

function Results() {
  return (
    <Exhibit id="results" spec={specs.results} essay={essay}>
      {({ tab }) => {
        const benchmark = diffusionBenchmarks.find(item => item.id === order[tab])!
        const [performanceMax, forgettingMax] = ceilings[benchmark.id]
        const percent = benchmark.metrics.performance.unit === 'percent'
        const performance: BarRow[] = benchmark.results.map(result => ({
          label: result.method, value: result.performance.mean, error: result.performance.standardError, ours: result.role === 'proposed',
        }))
        const forgetting: BarRow[] = benchmark.results.map(result => ({
          label: result.method, value: result.forgetting?.mean ?? null, error: result.forgetting?.standardError, ours: result.role === 'proposed',
        }))
        return (
          <div className="exhibit-pair">
            <Bars title={percent ? 'Average success rate' : 'Average FID'} hint={percent ? 'higher is better' : 'lower is better'}
              rows={performance} max={performanceMax} unit={percent ? '%' : ''} />
            <Bars title="Forgetting" hint="lower is better" rows={forgetting} max={forgettingMax} />
          </div>
        )
      }}
    </Exhibit>
  )
}

/** Draws one of the essay's figures. */
export function drawDiffusion(id: string, lead: boolean): ReactNode {
  if (id === 'return') return <RobotReturn lead={lead} />
  if (id === 'forgetting') return <Terrain id="forgetting" mode="forgetting" rest={2} />
  if (id === 'region') return <Terrain id="region" mode="region" rest={2} />
  if (id === 'methods') return <Terrain id="methods" mode="methods" rest={2} />
  if (id === 'recovery') return <Recovery />
  if (id === 'results') return <Results />
  return null
}
