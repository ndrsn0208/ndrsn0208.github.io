import { useEffect, useId, useRef, useState } from 'react'
import { useDiffusionReducedMotion } from './useMotionPreference'
import {
  GRADIENT_DURATION,
  GRADIENT_PARAMETERS,
  GRADIENT_STAGE_ENDS,
  GRADIENT_STAGE_STARTS,
  gradientCellReveal,
  gradientFrameAt,
  gradientStoryModel,
} from './gradient-story-model'
import type { GradientFrame, GradientMatrix, GradientStage, GradientVector } from './gradient-story-model'
import './gradient-story.css'

export { gradientStoryModel } from './gradient-story-model'

const PAPER = 'https://arxiv.org/html/2509.23593v2'
const model = gradientStoryModel
const steps = [
  {
    label: 'Build Fisher',
    text: 'Put the same sample gradient across the top and down the side. Multiply each pair of components to fill one outer product. Averaging these products gives the empirical Fisher.',
  },
  {
    label: 'Keep the diagonal',
    text: 'The diagonal keeps each parameter’s squared gradient, but removes every cross term. Compare it with the full Fisher on the right. The relationships between different parameters disappear.',
  },
  {
    label: 'Rebuild with the mean',
    text: 'Now use the mean gradient as both the row and the column, then match the strength with one scale, c. The dominant pattern returns, including its off-diagonal entries. Small residual terms still differ.',
  },
] as const

const GRID = { x: 106, y: 92, step: 64, size: 58 }

function number(value: number) {
  if (Math.abs(value) < 0.005) return '0'
  return String(Number(value.toFixed(2))).replace('-', '−')
}

function useGradientPlayback() {
  const root = useRef<HTMLElement>(null)
  const reduced = useDiffusionReducedMotion()
  const [time, setTime] = useState(GRADIENT_STAGE_ENDS[0] - 0.01)
  const [playing, setPlaying] = useState(false)
  const [run, setRun] = useState(0)
  const elapsed = useRef(time)
  const stopAt = useRef<number>(GRADIENT_DURATION)
  const hasStarted = useRef(false)
  const previousPreference = useRef(reduced)

  function moveTo(next: number) {
    elapsed.current = next
    setTime(next)
  }

  useEffect(() => {
    const element = root.current?.querySelector('.gs-drawing')
    if (!element || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        setPlaying(false)
      } else if (entry.intersectionRatio >= 0.22 && !hasStarted.current && !reduced && document.visibilityState === 'visible') {
        hasStarted.current = true
        stopAt.current = GRADIENT_DURATION
        moveTo(0)
        setRun(current => current + 1)
        setPlaying(true)
      }
    }, { threshold: 0.22 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [reduced])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') setPlaying(false)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    if (previousPreference.current !== reduced) {
      previousPreference.current = reduced
      setPlaying(false)
      hasStarted.current = true
      const stage = gradientFrameAt(elapsed.current).stage
      moveTo(GRADIENT_STAGE_ENDS[stage] - 0.01)
    }
  }, [reduced])

  useEffect(() => {
    if (!playing || reduced) return
    let request = 0
    let previous = performance.now()
    let rendered = previous
    const tick = (now: number) => {
      if (document.visibilityState !== 'visible') {
        setPlaying(false)
        return
      }
      elapsed.current = Math.min(stopAt.current, elapsed.current + now - previous)
      previous = now
      if (now - rendered >= 1000 / 30 || elapsed.current >= stopAt.current) {
        rendered = now
        setTime(elapsed.current)
      }
      if (elapsed.current >= stopAt.current) setPlaying(false)
      else request = requestAnimationFrame(tick)
    }
    request = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(request)
  }, [playing, reduced, run])

  function selectStage(stage: GradientStage) {
    hasStarted.current = true
    stopAt.current = GRADIENT_STAGE_ENDS[stage] - 0.01
    moveTo(reduced ? stopAt.current : GRADIENT_STAGE_STARTS[stage])
    setRun(current => current + 1)
    setPlaying(!reduced)
  }

  function toggle() {
    const firstPlay = !hasStarted.current
    hasStarted.current = true
    if (reduced) {
      selectStage(((gradientFrameAt(elapsed.current).stage + 1) % 3) as GradientStage)
    } else if (playing) {
      setPlaying(false)
    } else {
      if (firstPlay || elapsed.current >= GRADIENT_DURATION - 0.1) moveTo(0)
      stopAt.current = GRADIENT_DURATION
      setRun(current => current + 1)
      setPlaying(true)
    }
  }

  function replay() {
    hasStarted.current = true
    stopAt.current = GRADIENT_DURATION
    moveTo(reduced ? GRADIENT_STAGE_ENDS[0] - 0.01 : 0)
    setRun(current => current + 1)
    setPlaying(!reduced)
  }

  return { root, reduced, time, frame: gradientFrameAt(time), playing, selectStage, toggle, replay }
}

function paint(value: number, maximum: number) {
  return {
    color: value < 0 ? 'var(--gs-negative)' : 'var(--gs-positive)',
    opacity: Math.abs(value) < 0.001 ? 0 : 0.13 + 0.33 * Math.min(1, Math.abs(value) / maximum),
  }
}

export function FisherMatrixDrawing({ matrix, operand, reveal = 1, activeCell = null, diagonalProgress = 0, scaled = false, label }: {
  matrix: GradientMatrix
  operand?: GradientVector
  reveal?: number
  activeCell?: number | null
  diagonalProgress?: number
  scaled?: boolean
  label: string
}) {
  const activeRow = activeCell === null ? -1 : Math.floor(activeCell / 4)
  const activeColumn = activeCell === null ? -1 : activeCell % 4

  return (
    <svg className="gs-matrix-drawing" viewBox="0 0 386 366" role="img" aria-label={label}>
      <g aria-hidden="true">
        {GRADIENT_PARAMETERS.map((parameter, index) => {
          const start = GRID.x + index * GRID.step
          const top = GRID.y + index * GRID.step
          const tint = operand ? paint(operand[index], model.vectorMaximum) : null
          return (
            <g key={parameter}>
              <text className="gs-coordinate" x={start + GRID.size / 2} y={operand ? 20 : 69} textAnchor="middle">{parameter}</text>
              <text className="gs-coordinate" x={operand ? 17 : 79} y={top + GRID.size / 2 + 6} textAnchor="middle">{parameter}</text>
              {operand && tint && <>
                <rect x={start} y="33" width={GRID.size} height="38" rx="3" fill={tint.color} fillOpacity={tint.opacity} />
                <rect x="43" y={top + 10} width="44" height="38" rx="3" fill={tint.color} fillOpacity={tint.opacity} />
                {activeColumn === index && <rect className="gs-operand-active" x={start - 1} y="32" width={GRID.size + 2} height="40" rx="3" />}
                {activeRow === index && <rect className="gs-operand-active" x="42" y={top + 9} width="46" height="40" rx="3" />}
                <text className="gs-operand-value" x={start + GRID.size / 2} y="58" textAnchor="middle">{number(operand[index])}</text>
                <text className="gs-operand-value" x="65" y={top + 36} textAnchor="middle">{number(operand[index])}</text>
              </>}
            </g>
          )
        })}
        {operand && <text className="gs-multiply" x="66" y="59" textAnchor="middle">{scaled ? 'c×' : '×'}</text>}
        {matrix.flatMap((row, i) => row.map((value, j) => {
          const index = i * 4 + j
          const visible = gradientCellReveal(reveal, index)
          const tint = paint(value, model.colorMaximum)
          const x = GRID.x + j * GRID.step
          const y = GRID.y + i * GRID.step
          const dropped = i !== j && diagonalProgress > 0.99
          return (
            <g key={index} data-fisher-row={i} data-fisher-column={j} data-fisher-value={value}>
              <rect className="gs-cell-outline" x={x} y={y} width={GRID.size} height={GRID.size} rx="3" />
              <g opacity={visible}>
                <rect x={x} y={y} width={GRID.size} height={GRID.size} rx="3" fill={tint.color} fillOpacity={tint.opacity} />
                <text className={`gs-cell-value${dropped ? ' gs-cell-zero' : ''}`} x={x + GRID.size / 2} y={y + GRID.size / 2 + 7} textAnchor="middle" textLength={number(value).length > 5 ? 50 : undefined} lengthAdjust="spacingAndGlyphs">{number(value)}</text>
              </g>
              {activeCell === index && <rect className="gs-cell-active" x={x - 1} y={y - 1} width={GRID.size + 2} height={GRID.size + 2} rx="3" />}
            </g>
          )
        }))}
        <path className="gs-matrix-bracket" d="M100 88 H95 V346 H100 M364 88 H369 V346 H364" />
      </g>
    </svg>
  )
}

function SampleMarkers({ frame }: { frame: GradientFrame }) {
  return (
    <div className="gs-sample-markers" aria-label={frame.stage === 0 ? `Example ${frame.sample + 1} of 4` : 'Four sampled gradients'}>
      {model.samples.map((sample, index) => (
        <span className="gs-sample-marker" data-active={frame.stage === 0 && frame.sample === index} key={index}>
          <span>g<sub>{index + 1}</sub></span>
          <svg viewBox="0 0 64 15" width="64" height="15" aria-hidden="true">
            {sample.map((value, coordinate) => {
              const tint = paint(value, model.vectorMaximum)
              return <rect key={coordinate} x={coordinate * 16} width="13" height="15" rx="1" fill={tint.color} fillOpacity={tint.opacity + 0.15} />
            })}
          </svg>
        </span>
      ))}
    </div>
  )
}

export function GradientStory() {
  const id = `gradient-story-${useId().replace(/:/g, '')}`
  const playback = useGradientPlayback()
  const { frame, playing, reduced } = playback
  const [matrixView, setMatrixView] = useState<'estimate' | 'full'>('estimate')
  const index = frame.sample + 1
  const symbol = frame.stage === 0 ? '→' : frame.stage === 1 ? '≠' : '≈'
  const comparisonVisible = frame.stage === 0 || (frame.stage === 1 ? frame.diagonalProgress > 0.95 : frame.scaleProgress > 0.95)

  return (
    <figure ref={playback.root} className="diff-gradient-story" aria-labelledby={`${id}-title`} data-stage={frame.stage} data-playing={playing}>
      <header className="gs-header">
        <div>
          <h3 id={`${id}-title`}>Watch the Fisher matrix take shape</h3>
          <p>Four parameters, four example gradients, one shared pattern.</p>
        </div>
        <div className="gs-playback">
          <button className="gs-play" type="button" onClick={playback.toggle} aria-controls={`${id}-drawing`} aria-label={reduced ? 'Show the next construction step' : playing ? 'Pause Fisher construction' : 'Play Fisher construction'}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              {playing ? <path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="2" /> : <path d="m5 3 8 5-8 5Z" fill="currentColor" />}
            </svg>
            {reduced ? 'Next step' : playing ? 'Pause' : 'Play'}
          </button>
          <button className="gs-replay" type="button" onClick={playback.replay} aria-label="Replay Fisher construction from the first example">↺<span className="gs-sr-only"> Replay</span></button>
        </div>
      </header>

      <div className="gs-steps" role="group" aria-label="Fisher construction steps">
        {steps.map((step, stage) => (
          <button type="button" key={step.label} aria-pressed={frame.stage === stage} onClick={() => playback.selectStage(stage as GradientStage)}>
            <span className="gs-step-number">0{stage + 1}</span>
            <span>{step.label}</span>
            <span className="gs-step-progress" style={{ transform: `scaleX(${frame.stage > stage ? 1 : frame.stage < stage ? 0 : Math.min(1, (playback.time - GRADIENT_STAGE_STARTS[stage]) / (GRADIENT_STAGE_ENDS[stage] - GRADIENT_STAGE_STARTS[stage]))})` }} />
          </button>
        ))}
      </div>
      <div className="gs-workbench">
        <div className="gs-context">
          <p className="gs-narration" key={frame.stage} role="status">{steps[frame.stage].text}</p>
          <div className="gs-legend" aria-label="Matrix color key">
            <span><i className="gs-positive-key" />Positive product</span>
            <span><i className="gs-negative-key" />Negative product</span>
            <span>Stronger shade = larger magnitude</span>
          </div>
          <p className="gs-takeaway">
            <strong>Rank-1 stores μ and a scale.</strong> Their outer product keeps the relationships between parameters.
          </p>
        </div>

        <div className="gs-comparison">
          <div className="gs-matrix-switcher" role="group" aria-label="Choose a matrix to inspect">
            <button type="button" aria-pressed={matrixView === 'estimate'} aria-controls={`${id}-estimate`} onClick={() => setMatrixView('estimate')}>Construction</button>
            <button type="button" aria-pressed={matrixView === 'full'} aria-controls={`${id}-full`} onClick={() => setMatrixView('full')}>Full Fisher</button>
          </div>
          <div className="gs-drawing" id={`${id}-drawing`}>
            <section className="gs-matrix-panel" id={`${id}-estimate`} data-selected={matrixView === 'estimate'} aria-labelledby={`${id}-estimate-title`}>
              <div className="gs-panel-heading">
                <h4 id={`${id}-estimate-title`}>{frame.stage === 0 ? 'One gradient, one outer product' : frame.stage === 1 ? 'Diagonal Fisher' : 'Rank-1 approximation'}</h4>
                <p className="gs-formula">
                  {frame.stage === 0 ? <>g<sub>{index}</sub> g<sub>{index}</sub><sup>T</sup></> : frame.stage === 1 ? <>diag(F)</> : <>{frame.scaleProgress > 0 ? 'c ' : ''}μ μ<sup>T</sup></>}
                </p>
              </div>
              <FisherMatrixDrawing
                key={frame.stage}
                matrix={frame.left}
                operand={frame.operand}
                reveal={frame.reveal}
                activeCell={frame.activeCell}
                diagonalProgress={frame.diagonalProgress}
                scaled={frame.stage === 2 && frame.scaleProgress > 0}
                label={frame.stage === 0 ? `Outer product of sample gradient ${index}. Each cell multiplies its row and column components.` : frame.stage === 1 ? 'The diagonal approximation removes the twelve off-diagonal entries.' : 'The outer product of the mean gradient reconstructs the dominant Fisher pattern.'}
              />
              <p className="gs-panel-note">
                {frame.stage === 0 ? <>Example {index} of 4</> : frame.stage === 1 ? <><strong>4 entries retained.</strong> Cross terms are removed.</> : <>Keep <strong>μ and one scale</strong>, c = 10/9.</>}
              </p>
            </section>

            <div className="gs-connection" aria-hidden="true" style={{ opacity: comparisonVisible ? 1 : 0 }}>{symbol}</div>

            <section className="gs-matrix-panel gs-reference" id={`${id}-full`} data-selected={matrixView === 'full'} aria-labelledby={`${id}-fisher-title`}>
              <div className="gs-panel-heading">
                <h4 id={`${id}-fisher-title`}>Full empirical Fisher</h4>
                <p className="gs-formula">F = average of g g<sup>T</sup></p>
              </div>
              <FisherMatrixDrawing
                matrix={frame.right}
                reveal={frame.rightReveal}
                label={frame.stage === 0 ? `Running average after ${frame.completedSamples} of four sample outer products.` : 'Full empirical Fisher from all four sample gradients, held fixed for comparison.'}
              />
              <p className="gs-panel-note">
                {frame.stage === 0 ? <>{frame.transfer > 0 && frame.transfer < 1 ? 'Adding this product…' : `${frame.completedSamples} of 4 products averaged`}</> : <><strong>16 entries.</strong> The full matrix stays here for comparison.</>}
              </p>
            </section>
          </div>
          <SampleMarkers frame={frame} />
        </div>
      </div>

      <figcaption className="gs-evidence">
        <p>
          This is a constructed example with slightly misaligned gradients. Rank-1 retains the dominant pattern, with a small residual difference from the full Fisher.
          The paper’s MNIST experiment reports <strong>λ₂/λ₁ = 0.022</strong> at diffusion timestep 700{' '}
          (<a href={`${PAPER}#S3.F3.sf3`} target="_blank" rel="noreferrer">Fig. 3c</a>).
        </p>
        <details>
          <summary>The approximation and its scale</summary>
          <p>
            Empirical Fisher is the uncentered second moment F = E[g g<sup>T</sup>], not the centered covariance.
            With μ = E[g], the scale is c = E[(μ<sup>T</sup>g)²] / ‖μ‖⁴.
            The constructed gradients give F = 2.5 u u<sup>T</sup> + 0.16 v v<sup>T</sup>, where u and v are orthogonal.
            Here μ = 1.5u, so c μ μ<sup>T</sup> = 2.5 u u<sup>T</sup>. The smaller residual is omitted.
          </p>
          <p>
            The paper studies approximate alignment at low SNR near convergence, for squared-error,
            variance-preserving diffusion under a local-linearity assumption{' '}
            (<a href={`${PAPER}#S3.SS1`} target="_blank" rel="noreferrer">§3.1</a>).
            Its scaled outer product gives the{' '}
            <a href={`${PAPER}#S3.E6`} target="_blank" rel="noreferrer">EWC penalty in Eq. 6</a>.
            Rank-1 describes the importance matrix and does not restrict parameter updates to one direction.
          </p>
        </details>
      </figcaption>
    </figure>
  )
}

export default GradientStory
