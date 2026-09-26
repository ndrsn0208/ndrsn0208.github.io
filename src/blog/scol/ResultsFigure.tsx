import { useId, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
  lengthRegimes,
  lengthResults,
  resultsModel,
  retentionPassages,
  retentionResults,
  sampledAnswersPerExample,
} from './evidence'
import type { AccuracyEstimate, LengthRegime, RetentionResult } from './evidence'
import './results-figure.css'

export type ResultsFigureProps = {
  kind: 'retention' | 'length'
}

type Tone = 'neutral' | 'accent' | 'loss'
type RetentionMetric = 'acquisition' | 'retention'
const accuracyMaximum = { retention: 40, length: 50 } as const

const continualResults = retentionResults.filter(
  (result): result is RetentionResult & { retention: number } => result.retention !== null,
)

const retentionMetrics: readonly {
  key: RetentionMetric
  title: string
}[] = [
  { key: 'acquisition', title: 'Acquisition' },
  { key: 'retention', title: 'Retention' },
]

// Animation interpolates between two reported length conditions, never training
// steps. Initial and server-rendered marks already show the measured values.
function AccuracyMark({
  value,
  maximum,
  standardError,
  tone = 'neutral',
  measure,
  duration,
}: {
  value: number
  maximum: number
  standardError?: number
  tone?: Tone
  measure?: RetentionMetric
  duration: number
}) {
  const position = `${(value / maximum) * 100}%`
  const transition = { duration, ease: [0.22, 0.61, 0.36, 1] as const }

  return (
    <span className="scol-results__track" data-tone={tone} data-measure={measure} aria-hidden="true">
      <span className="scol-results__track-rule" />
      <motion.span
        className="scol-results__bar"
        initial={false}
        animate={{ width: position }}
        transition={transition}
      />
      {standardError !== undefined && (
        <motion.span
          className="scol-results__whisker"
          initial={false}
          animate={{
            left: `${((value - standardError) / maximum) * 100}%`,
            width: `${((standardError * 2) / maximum) * 100}%`,
          }}
          transition={transition}
        >
          <span className="scol-results__cap scol-results__cap--start" />
          <span className="scol-results__cap scol-results__cap--end" />
        </motion.span>
      )}
      {standardError !== undefined && (
        <motion.span
          className="scol-results__point"
          initial={false}
          animate={{ left: position }}
          transition={transition}
        />
      )}
    </span>
  )
}

function AccuracyAxis({ kind }: ResultsFigureProps) {
  const ticks = kind === 'retention' ? [0, 20, 40] : [0, 10, 20, 30, 40, 50]
  return (
    <div className={`scol-results__axis scol-results__axis--${kind}`} aria-hidden="true">
      {kind === 'retention' && <span className="scol-results__axis-label">Measure</span>}
      <span className="scol-results__scale">
        {ticks.map(tick => (
          <span key={tick} style={{ left: `${(tick / accuracyMaximum[kind]) * 100}%` }}>{tick}%</span>
        ))}
      </span>
      {kind === 'retention' && <span className="scol-results__axis-value">Accuracy</span>}
    </div>
  )
}

function Estimate({ mean, standardError }: AccuracyEstimate) {
  return (
    <span className="scol-results__estimate">
      <data value={mean}>{mean.toFixed(1)}%</data>
      <span className="scol-results__standard-error">
        <span aria-hidden="true">± {standardError.toFixed(1)}</span>
        <span className="scol-results__sr-only">
          {' '}Standard error {standardError.toFixed(1)} percentage points
        </span>
      </span>
    </span>
  )
}

function RetentionTable() {
  return (
    <details className="scol-results__data">
      <summary>All five methods and exact values</summary>
      <p className="scol-results__note">
        {resultsModel}. The paper compares acquisition and retention over {retentionPassages} SQuAD passages.
      </p>
      <div className="scol-results__table-scroll" role="region" aria-label="Complete SQuAD results" tabIndex={0}>
        <table className="scol-results__table">
          <caption>SQuAD accuracy over a stream of 100 passages</caption>
          <thead>
            <tr>
              <th scope="col">Method</th>
              <th scope="col">Acquisition</th>
              <th scope="col">Retention</th>
            </tr>
          </thead>
          <tbody>
            {retentionResults.map(result => (
              <tr key={result.id} data-highlight={result.id === 'scol' || undefined}>
                <th scope="row">
                  {result.method}
                  <span className="scol-results__table-note">{result.note}</span>
                </th>
                <td>{result.acquisition.toFixed(2)}%</td>
                <td>
                  {result.retention === null
                    ? <span className="scol-results__unreported">Not reported</span>
                    : `${result.retention.toFixed(2)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="scol-results__note">
        The source table does not report retention for Prompting only or Batch TTT.
      </p>
    </details>
  )
}

function RetentionFigure() {
  const id = useId()
  const reducedMotion = useReducedMotion()
  const withoutForgetting = continualResults.find(result => result.id === 'scol-no-forgetting')!
  const withForgetting = continualResults.find(result => result.id === 'scol')!

  return (
    <figure
      className="scol-results scol-results--retention"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-definition`}
    >
      <figcaption className="scol-results__heading">
        <p className="scol-results__context">SQuAD · {retentionPassages} passages</p>
        <h3 id={`${id}-title`}>Acquisition and retention</h3>
      </figcaption>

      <div className="scol-results__retention-chart">
        <AccuracyAxis kind="retention" />
        <ul className="scol-results__rows" role="list" aria-label="Continual SQuAD results">
          {continualResults.map(result => (
            <li className="scol-results__retention-group" key={result.id}>
              <div className="scol-results__method-heading">
                <h4 className="scol-results__method" data-highlight={result.id === 'scol' || undefined}>
                  {result.method}
                </h4>
                <p className="scol-results__method-note">{result.note}</p>
              </div>
              <dl className="scol-results__retention-pair">
                {retentionMetrics.map(metric => (
                  <div className="scol-results__retention-row" key={metric.key}>
                    <dt>{metric.title}</dt>
                    <dd className="scol-results__measurement">
                      <AccuracyMark
                        value={result[metric.key]}
                        maximum={accuracyMaximum.retention}
                        tone={result.id === 'scol' ? 'accent' : 'neutral'}
                        measure={metric.key}
                        duration={reducedMotion === false ? 0.28 : 0}
                      />
                      <data className="scol-results__value" value={result[metric.key]}>
                        {result[metric.key].toFixed(2)}%
                      </data>
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      </div>

      <p className="scol-results__gain">
        Adding the forgetting term raises acquisition by{' '}
        <strong>{(withForgetting.acquisition - withoutForgetting.acquisition).toFixed(2)} points</strong>
        {' '}and retention by{' '}
        <strong>{(withForgetting.retention - withoutForgetting.retention).toFixed(2)} points</strong>.
      </p>
      <div className="scol-results__caption">
        <p id={`${id}-definition`}>
          Acquisition is accuracy just after each update. Retention is accuracy on earlier passages
          after the full stream, not a percentage of the accuracy originally acquired.
        </p>
      </div>
      <RetentionTable />
    </figure>
  )
}

function LengthTable() {
  return (
    <details className="scol-results__data">
      <summary>Both lengths and all standard errors</summary>
      <p className="scol-results__note">
        Evaluation uses {lengthRegimes.short.passages} short and {lengthRegimes.long.passages} long
        passages, with {sampledAnswersPerExample} sampled answers per example. The reported accuracy
        averages these sampled answers.
      </p>
      <p className="scol-results__note">
        Whiskers show ±1 standard error. The appendix computes SE = √(v / 10), where v is the
        sample variance of scores across the 10 sampled evaluation answers.
      </p>
      <div className="scol-results__table-scroll" role="region" aria-label="Complete LongBench v2 results" tabIndex={0}>
        <table className="scol-results__table">
          <caption>LongBench v2 mean accuracy and standard error</caption>
          <thead>
            <tr>
              <th scope="col">Method</th>
              <th scope="col">Short<span className="scol-results__table-note">16k to 32k</span></th>
              <th scope="col">Long<span className="scol-results__table-note">32k to 64k</span></th>
            </tr>
          </thead>
          <tbody>
            {lengthResults.map(result => (
              <tr key={result.id} data-highlight={result.id === 'scol' || undefined}>
                <th scope="row">{result.method}</th>
                <td><Estimate {...result.short} /></td>
                <td><Estimate {...result.long} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="scol-results__note">
        Means and standard errors match the paper’s appendix. Standard errors are in percentage points.
      </p>
    </details>
  )
}

function LengthFigure() {
  const id = useId()
  const reducedMotion = useReducedMotion()
  const [regime, setRegime] = useState<LengthRegime>('short')
  const [announcement, setAnnouncement] = useState('')
  const current = lengthRegimes[regime]
  const leader = lengthResults.reduce((best, result) => result[regime].mean > best[regime].mean ? result : best)

  function changeRegime(next: LengthRegime) {
    setRegime(next)
    setAnnouncement(next === 'short'
      ? 'Short contexts selected. SCoL has the highest mean accuracy at 42.3 percent.'
      : 'Long contexts selected. Batch TTT has the highest mean accuracy at 41.5 percent. SCoL reaches 37.0 percent.')
  }

  return (
    <figure
      className="scol-results scol-results--length"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-training ${id}-access`}
    >
      <figcaption className="scol-results__heading">
        <p className="scol-results__context">LongBench v2 · {resultsModel}</p>
        <h3 id={`${id}-title`}>From short to longer contexts</h3>
        <p className="scol-results__training-note" id={`${id}-training`}>
          SCoL was meta-trained only on short contexts, 16k to 32k tokens.
        </p>
      </figcaption>

      <fieldset className="scol-results__controls">
        <legend>Context length at evaluation</legend>
        <div className="scol-results__options">
          {(['short', 'long'] as const).map(option => (
            <label className="scol-results__option" key={option} data-selected={regime === option || undefined}>
              <input
                type="radio"
                name={`${id}-length`}
                value={option}
                checked={regime === option}
                aria-controls={`${id}-chart`}
                onChange={() => changeRegime(option)}
              />
              <span>
                <strong>
                  {lengthRegimes[option].label}{option === 'long' ? ' (generalization)' : ''}
                </strong>{' '}
                <span className="scol-results__option-range">{lengthRegimes[option].tokens} tokens</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="scol-results__length-chart" id={`${id}-chart`}>
        <div className="scol-results__chart-heading">
          <p>Accuracy</p>
          <p className="scol-results__note">Mean ± standard error</p>
        </div>
        <AccuracyAxis kind="length" />
        <ul className="scol-results__rows" role="list" aria-label={`${current.label}-context results`}>
          {lengthResults.map(result => (
            <li className="scol-results__length-row" key={result.id}>
              <span className="scol-results__method" data-highlight={result.id === 'scol' || undefined}>
                {result.method}
              </span>
              <AccuracyMark
                value={result[regime].mean}
                standardError={result[regime].standardError}
                maximum={accuracyMaximum.length}
                tone={result.id === 'scol' ? 'accent' : regime === 'long' && result.id === 'sequential-ft' ? 'loss' : 'neutral'}
                duration={reducedMotion === false ? 0.28 : 0}
              />
              <Estimate {...result[regime]} />
            </li>
          ))}
        </ul>
        <p className="scol-results__leader">
          Highest mean at this length: <strong>{leader.method}, {leader[regime].mean.toFixed(1)}%</strong>.
        </p>
      </div>

      <div className="scol-results__caption">
        <p className="scol-results__access-note" id={`${id}-access`}>
          Batch TTT has the highest long-context accuracy at 41.5%. It adapts with access to the full passage.
        </p>
      </div>
      <LengthTable />
      <p className="scol-results__sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </figure>
  )
}

export default function ResultsFigure({ kind }: ResultsFigureProps) {
  return kind === 'retention' ? <RetentionFigure /> : <LengthFigure />
}
