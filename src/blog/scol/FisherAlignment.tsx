import { useEffect, useId, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
  compareFisherLayers,
  fisherExamples,
  fisherLayerCount,
  fisherPassageCount,
  fisherResults,
} from './fisher-evidence'
import type { FisherExample, FisherResult } from './fisher-evidence'
import './fisher-alignment.css'

type Step = 0 | 1 | 2

const steps = [
  { label: 'Chosen layers', duration: 1000 },
  { label: 'Reveal Fisher', duration: 1600 },
  { label: 'See overlap', duration: 1800 },
] as const

// One column per layer, shared by the profile, chosen set and HTML axis.
// The inset leaves room for the endpoint labels without moving their centers.
const layers = Array.from({ length: fisherLayerCount }, (_, layer) => layer)
const plotInset = 8
const baseline = 130
const profileHeight = 114
const selectionY = 148
const plotHeight = 162

function LayerProfile({
  example,
  step,
  reducedMotion,
}: {
  example: FisherExample
  step: Step
  reducedMotion: boolean
}) {
  const id = useId()
  const profileRef = useRef<SVGSVGElement>(null)
  const [plotWidth, setPlotWidth] = useState(660)
  const { selected, highest, overlap } = compareFisherLayers(example)
  const layerPitch = (plotWidth - plotInset * 2) / fisherLayerCount
  const columnWidth = Math.min(layerPitch * 0.85, layerPitch - 2.5)
  const revealed = step >= 1
  const compared = step === 2
  const transition = { duration: reducedMotion ? 0 : 0.4, ease: [0.22, 0.61, 0.36, 1] as const }
  const describeLayers = (values: number[]) => values.length ? values.join(', ') : 'none'

  useEffect(() => {
    const profile = profileRef.current
    if (!profile) return
    const measure = (width: number) => {
      if (width > 0) setPlotWidth(width)
    }
    // Match SVG units to rendered pixels so rings stay circular at phone widths.
    measure(profile.getBoundingClientRect().width)
    const observer = new ResizeObserver(([entry]) => measure(entry.contentRect.width))
    observer.observe(profile)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="scol-fisher__plot">
      <p className="scol-fisher__plot-label">Layers 0–{fisherLayerCount - 1}</p>
      <svg
        ref={profileRef}
        className="scol-fisher__profile"
        viewBox={`0 0 ${plotWidth} ${plotHeight}`}
        preserveAspectRatio="none"
        role="img"
        aria-labelledby={`${id}-title ${id}-description`}
      >
        <title id={`${id}-title`}>{example.label}, all {fisherLayerCount} layers from 0 to {fisherLayerCount - 1}</title>
        <desc id={`${id}-description`}>
          Schematic, not measured data. Chosen layers: {describeLayers([...selected])}.
          {revealed ? ' Bar height illustrates relative Fisher sensitivity.' : ' Fisher scores are hidden.'}
          {compared ? ` Colored columns and double rings show overlap with the top 10: ${describeLayers(overlap)}.` : ''}
        </desc>
        <line className="scol-fisher__baseline" x1={plotInset} x2={plotWidth - plotInset} y1={baseline} y2={baseline} />
        {layers.map(layer => {
          const center = plotInset + (layer + 0.5) * layerPitch
          const height = (example.sensitivity[layer] / 100) * profileHeight
          const shared = compared && selected.has(layer) && highest.has(layer)
          return (
            <g key={layer} data-layer={layer} data-selected={selected.has(layer) || undefined} data-overlap={shared || undefined}>
              {selected.has(layer) && <rect
                className="scol-fisher__chosen-column"
                x={center - columnWidth / 2}
                y="5"
                width={columnWidth}
                height={plotHeight - 7}
                rx="2"
              />}
              <line
                className="scol-fisher__guide"
                x1={center}
                x2={center}
                y1="16"
                y2={baseline}
                strokeDasharray="2 5"
              />
              <motion.rect
                className="scol-fisher__bar"
                x={center - layerPitch * 0.3}
                width={layerPitch * 0.6}
                initial={false}
                animate={{ y: revealed ? baseline - height : baseline, height: revealed ? height : 0 }}
                transition={transition}
              />
              <motion.line
                className="scol-fisher__top-mark"
                x1={center - layerPitch * 0.35}
                x2={center + layerPitch * 0.35}
                initial={false}
                animate={{
                  y1: baseline - height - 4,
                  y2: baseline - height - 4,
                  opacity: compared && highest.has(layer) ? 1 : 0,
                }}
                transition={transition}
              />
              <circle
                className="scol-fisher__selection"
                data-selected={selected.has(layer) || undefined}
                cx={center}
                cy={selectionY}
                r={selected.has(layer) ? Math.min(3.8, layerPitch * 0.22) : Math.min(1.5, layerPitch * 0.1)}
              />
              <motion.circle
                className="scol-fisher__overlap-ring"
                cx={center}
                cy={selectionY}
                r={Math.min(6.5, layerPitch * 0.32)}
                initial={false}
                animate={{ opacity: shared ? 1 : 0 }}
                transition={transition}
              />
            </g>
          )
        })}
      </svg>
      <div className="scol-fisher__layer-labels" style={{ paddingInline: plotInset }} aria-hidden="true">
        {layers.map(layer => (
          <span
            key={layer}
            data-tick={layer % 3 === 0 || undefined}
            data-selected={selected.has(layer) || undefined}
            data-overlap={compared && overlap.includes(layer) || undefined}
          >
            {layer}
          </span>
        ))}
      </div>
    </div>
  )
}

function ResultRow({ result }: { result: FisherResult }) {
  const uncertainty = result.reportedUncertainty
  return (
    <li className="scol-fisher__result" data-method={result.id}>
      <span className="scol-fisher__method">
        <strong>{result.label}</strong>
        <span>{result.note}</span>
      </span>
      <svg
        className="scol-fisher__result-track"
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line className="scol-fisher__result-rule" x1="0" x2="100" y1="10" y2="10" />
        <rect className="scol-fisher__result-bar" x="0" y="7" width={result.recallPercent} height="6" />
        <line className="scol-fisher__chance" x1="35.7" x2="35.7" y1="0" y2="20" strokeDasharray="3 3" />
        {uncertainty !== undefined && (
          <g className="scol-fisher__uncertainty">
            <line x1={result.recallPercent - uncertainty} x2={result.recallPercent + uncertainty} y1="10" y2="10" />
            <line x1={result.recallPercent - uncertainty} x2={result.recallPercent - uncertainty} y1="4" y2="16" />
            <line x1={result.recallPercent + uncertainty} x2={result.recallPercent + uncertainty} y1="4" y2="16" />
          </g>
        )}
      </svg>
      <span className="scol-fisher__estimate">
        <data value={result.recallPercent}>{result.recallPercent.toFixed(1)}%</data>
        {uncertainty !== undefined && (
          <span className="scol-fisher__reported-uncertainty">
            <span aria-hidden="true"> ± {uncertainty.toFixed(1)}</span>
            <span className="scol-fisher__sr-only">
              , reported uncertainty {uncertainty.toFixed(1)} percentage points, type unspecified
            </span>
          </span>
        )}
      </span>
    </li>
  )
}

export default function FisherAlignment() {
  const id = useId()
  const reduceMotion = useReducedMotion() !== false
  const [exampleIndex, setExampleIndex] = useState(0)
  const [step, setStep] = useState<Step>(2)
  const [playing, setPlaying] = useState(false)
  // Start with the complete comparison visible. Play explains how the two sets
  // produce this overlap, without requiring interaction to see the result.
  const [stepProgress, setStepProgress] = useState(1)
  const progressRef = useRef(1)
  const example = fisherExamples[exampleIndex]
  const { overlap } = compareFisherLayers(example)

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let disposed = false
    const duration = steps[step].duration
    const started = performance.now() - progressRef.current * duration
    let lastPaint = 0

    function tick(now: number) {
      if (disposed) return
      const progress = Math.min(1, (now - started) / duration)
      progressRef.current = progress
      // Progress represents elapsed playback time, rather than a decorative loop.
      if (now - lastPaint >= 32 || progress === 1) {
        setStepProgress(progress)
        lastPaint = now
      }
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      } else if (step < 2) {
        progressRef.current = 0
        setStepProgress(0)
        setStep((step + 1) as Step)
      } else {
        setPlaying(false)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
    }
  }, [playing, step])

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) setPlaying(false)
    }
    document.addEventListener('visibilitychange', pauseWhenHidden)
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden)
  }, [])

  function chooseStep(next: Step) {
    setPlaying(false)
    progressRef.current = 1
    setStepProgress(1)
    setStep(next)
  }

  function togglePlayback() {
    if (playing) {
      setPlaying(false)
      return
    }
    if (progressRef.current >= 1) {
      progressRef.current = 0
      setStepProgress(0)
      setStep(step === 2 ? 0 : (step + 1) as Step)
    }
    setPlaying(true)
  }

  function nextPassage() {
    setPlaying(false)
    progressRef.current = 1
    setStepProgress(1)
    setExampleIndex(index => (index + 1) % fisherExamples.length)
  }

  const descriptions = [
    'The model has chosen 10 of 28 layers. We keep those choices fixed as we reveal the diagnostic.',
    'Reveal sensitivity on the same model state, before a new adapter. Taller bars indicate higher Fisher scores.',
    'The colored columns are selected by the model and among Fisher’s top 10. Each column refers to the same layer in both sets.',
  ]
  const timelineProgress = ((step + (reduceMotion ? 1 : stepProgress)) / steps.length) * 100
  const playLabel = playing ? 'Pause' : 'Play'
  const gain = (fisherResults[0].recallPercent - fisherResults[2].recallPercent).toFixed(1)

  return (
    <figure className="scol-fisher" aria-labelledby={`${id}-title`} aria-describedby={`${id}-caption`}>
      <figcaption className="scol-fisher__heading">
        <p className="scol-fisher__eyebrow">Fisher alignment</p>
        <h3 id={`${id}-title`}>Where the learned selections land</h3>
        <p>
          Compare the chosen layers with their Fisher sensitivity before the next update.
        </p>
      </figcaption>

      <div className="scol-fisher__illustration">
        <p className="scol-fisher__schematic">
          Schematic layer profiles · illustrative values
        </p>
        <div className="scol-fisher__steps" role="group" aria-label="Fisher explanation steps">
          {steps.map((item, index) => (
            <button
              key={item.label}
              type="button"
              aria-pressed={step === index}
              aria-controls={`${id}-stage`}
              onClick={() => chooseStep(index as Step)}
            >
              <span className="scol-fisher__step-number" aria-hidden="true">{index + 1}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="scol-fisher__toolbar">
          <button
            className="scol-fisher__play"
            type="button"
            onClick={togglePlayback}
            aria-label={`${playLabel} Fisher explanation`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              {playing
                ? <path d="M4 3v10M12 3v10" fill="none" stroke="currentColor" strokeWidth="3" />
                : <path d="M4 2.5 13 8 4 13.5Z" fill="currentColor" />}
            </svg>
            {playLabel}
          </button>
          <span className="scol-fisher__passage">{example.label}</span>
          <button className="scol-fisher__next" type="button" onClick={nextPassage}>
            Next passage <span aria-hidden="true">→</span>
          </button>
        </div>

        <div
          className="scol-fisher__progress"
          role="progressbar"
          aria-label="Explanation progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(timelineProgress)}
          aria-valuetext={`Step ${step + 1} of 3: ${steps[step].label}`}
        >
          <span style={{ transform: `scaleX(${timelineProgress / 100})` }} />
        </div>

        <div id={`${id}-stage`} className="scol-fisher__stage" data-step={step}>
          <p className="scol-fisher__description" aria-live="polite" aria-atomic="true">
            {step === 2 && <><strong className="scol-fisher__overlap-count">{overlap.length} of 10 layers overlap.</strong>{' '}</>}
            {descriptions[step]}
          </p>
          <LayerProfile example={example} step={step} reducedMotion={reduceMotion} />
          <ul className="scol-fisher__legend" aria-label="Plot legend">
            <li><span className="scol-fisher__legend-selected" aria-hidden="true" />Chosen layer</li>
            <li><span className="scol-fisher__legend-top" aria-hidden="true" />Fisher top 10</li>
            <li><span className="scol-fisher__legend-overlap" aria-hidden="true" />In both</li>
          </ul>
        </div>
      </div>

      <section className="scol-fisher__evidence" aria-labelledby={`${id}-results`}>
        <h4 id={`${id}-results`}>Evidence across {fisherPassageCount} passages</h4>
        <p className="scol-fisher__metric">SQuAD · overlap with Fisher’s top k layers (recall@k)</p>
        <div className="scol-fisher__axis" aria-hidden="true">
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
        <ul className="scol-fisher__results" aria-label="Reported Fisher alignment">
          {fisherResults.map(result => <ResultRow key={result.id} result={result} />)}
        </ul>
        <p className="scol-fisher__uncertainty-note">
          Dashed marks show the random expectation. Bars include the reported uncertainty.
        </p>
        <p className="scol-fisher__finding">
          <strong>{gain} percentage points above chance.</strong>{' '}
          The learned selections align with layers sensitive to the current passage.
          Retention is evaluated separately.
        </p>
      </section>

      <p className="scol-fisher__caption" id={`${id}-caption`}>
        The aggregate results above come from {fisherPassageCount} SQuAD passages.
      </p>
      <details className="scol-fisher__details">
        <summary>Measurement details</summary>
        <p>
          Recall compares the chosen layers with the equally sized set of highest-Fisher
          layers for that passage. Randomly choosing 10 of {fisherLayerCount} layers gives
          an expected recall of 35.7%.
        </p>
        <p>
          The ± values reproduce the table’s reported uncertainty. The source does not
          specify its type.
        </p>
        <p>
          Appendix B.14 measures Fisher on the running model’s base projections using the
          passage’s implication lines, before attaching a new LoRA adapter.
          These scores are used only for analysis.
        </p>
      </details>
    </figure>
  )
}
