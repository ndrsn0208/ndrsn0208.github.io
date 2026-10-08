import { Fragment, useId, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  diffusionBenchmarks,
  diffusionEvidence,
  diffusionPapers,
  diffusionSourceHref,
  diffusionSources,
} from './evidence'
import type { DiffusionBenchmark, DiffusionCitedText, DiffusionMetricId, DiffusionSource } from './evidence'
import './diffusion-results.css'

const metricIds = ['performance', 'forgetting'] as const
const assetRoot = '/blog-assets/diffusion/results'

function SourceLinks({ sources }: { sources: readonly DiffusionSource[] }) {
  return (
    <span className="diff-results-sources">
      {sources.map(source => (
        <a
          className="diff-results-source"
          key={`${source.paper}-${source.anchor}`}
          href={diffusionSourceHref(source)}
          title={diffusionPapers[source.paper].title}
        >
          {source.label}
        </a>
      ))}
    </span>
  )
}

function CitedText({ item }: { item: DiffusionCitedText }) {
  return (
    <p className="diff-results-note">
      {item.text}{' '}
      <SourceLinks sources={item.sources} />
    </p>
  )
}

function MetricChart({ benchmark, metricId, column, id, selected }: {
  benchmark: DiffusionBenchmark
  metricId: DiffusionMetricId
  column: number
  id: string
  selected: boolean
}) {
  const metric = benchmark.metrics[metricId]
  const errorUnit = metric.unit === 'percent' ? 'percentage points' : metric.unit

  return (
    <figure
      id={id}
      className="diff-results-metric"
      data-benchmark={benchmark.id}
      data-metric={metricId}
      data-selected={selected}
      aria-labelledby={`${id}-title`}
      style={{
        '--diff-results-column': column + 1,
        '--diff-results-row': metricId === 'performance' ? 2 : 3,
      } as CSSProperties}
    >
      <figcaption className="diff-results-metric-caption">
        <h5 className="diff-results-metric-title" id={`${id}-title`}>
          <span className="diff-results-sr-only">{benchmark.label}: </span>
          {metricId === 'forgetting' ? 'Forgetting' : metric.unit === 'percent' ? 'Final success' : 'Final FID'}
        </h5>
        <p className="diff-results-chart-key">
          <span>{metric.direction === 'lower' ? '↓ Lower is better' : '↑ Higher is better'}</span>
        </p>
      </figcaption>
      {(['paper', 'black'] as const).map(theme => (
        <div className={`diff-results-image diff-results-image--${theme}`} key={theme}>
          <img
            className="diff-results-asset-cell"
            src={`${assetRoot}/${benchmark.id}-${metricId}-${theme}-cell.svg?v=compact1`}
            width={320}
            height={200}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
          />
        </div>
      ))}
      <ul className="diff-results-sr-only" aria-label={`${benchmark.label}, ${metric.label}`}>
        {benchmark.results.map(result => {
          const estimate = result[metricId]
          return (
            <li key={result.id}>
              {result.method}: {estimate === null ? 'Not reported' :
                `mean ${estimate.mean.toFixed(1)} ${metric.unit}, standard error ${estimate.standardError.toFixed(1)} ${errorUnit}`}
            </li>
          )
        })}
      </ul>
    </figure>
  )
}

function ProtocolNotes({ id }: { id: string }) {
  return (
    <details className="diff-results-protocols" aria-labelledby={`${id}-protocols-title`}>
      <summary className="diff-results-protocols-title" id={`${id}-protocols-title`}>Protocol details</summary>
      <CitedText item={{
        text: 'Final scores average across tasks after the last task. FID measures image quality against held-out images. Forgetting is the FID increase or success drop since each task was first learned. Compare methods within each protocol. FID values are not comparable between ImageNet-1k and ImageNet-500.',
        sources: [diffusionSources.rankMetrics, diffusionSources.trustImageMetrics, diffusionSources.trustPolicySetup],
      }} />
      <div className="diff-results-protocol">
        <h5>ImageNet-1k</h5>
        <CitedText item={{
          text: 'All 1,000 classes in their original order, with 50 classes per task. Non-CL abbreviates the non-continual reference. “Diag. EWC” and “Rank-1 EWC” use regularization alone. Trust Region is the paper’s “Rank-1 (ours)” row, combining rank-1 EWC with generative distillation (GD). Replay (GD) is “GD” and Diagonal EWC + replay is “Diag”. Standard errors use 3 seeds.',
          sources: [diffusionSources.rankSetup, diffusionSources.rankResults],
        }} />
      </div>
      <div className="diff-results-protocol">
        <h5>ImageNet-500</h5>
        <CitedText item={{
          text: 'The first 500 classes, with 50 classes per task. This shorter sequence has its own FID scale. Standard errors use 3 seeds.',
          sources: [diffusionSources.trustImageSetup, diffusionSources.trustImageTraining],
        }} />
      </div>
      <div className="diff-results-protocol">
        <h5>CW10</h5>
        <CitedText item={{
          text: 'A diffusion policy trained on 2,500 offline expert trajectories per task, evaluated with 100 rollouts per task in simulation. Success errors and forgetting are in percentage points. The seed count is unresolved because Table 4 lists 4 seeds and Figure 2(b) lists 3.',
          sources: [diffusionSources.trustPolicySetup, diffusionSources.trustPolicyTraining, diffusionSources.trustPolicyCurve],
        }} />
      </div>
      <CitedText item={{
        text: 'On ImageNet-500 and CW10, FTML and VR-MCL use first-order approximations, generative replay and one inner adaptation step.',
        sources: [diffusionSources.trustBaselines, diffusionSources.trustImageMetrics, diffusionSources.trustPolicySetup],
      }} />
    </details>
  )
}

export default function DiffusionResults() {
  const id = useId()
  const [selected, setSelected] = useState<string>(diffusionBenchmarks[0].id)

  return (
    <section className="diff-results-section" aria-labelledby={`${id}-title`}>
      <header className="diff-results-header">
        <h3 className="diff-results-title" id={`${id}-title`}>{diffusionEvidence.title}</h3>
        <p className="diff-results-introduction">
          Final averages after the last task, with ±1 SE error bars. Performance is above, forgetting below.
        </p>
      </header>
      <div className="diff-results-switcher" role="group" aria-label="Choose a benchmark">
        {diffusionBenchmarks.map(benchmark => <button type="button" key={benchmark.id}
          aria-pressed={selected === benchmark.id}
          aria-controls={`${id}-${benchmark.id}-performance ${id}-${benchmark.id}-forgetting`}
          onClick={() => setSelected(benchmark.id)}>{benchmark.label}</button>)}
      </div>
      <div className="diff-results-grid" aria-label="Final performance in the first row, forgetting in the second row">
        {diffusionBenchmarks.map((benchmark, column) => (
          <Fragment key={benchmark.id}>
            <header
              className="diff-results-column-heading"
              data-selected={selected === benchmark.id}
              style={{ '--diff-results-column': column + 1 } as CSSProperties}
            >
              <h4>{benchmark.label}</h4>
              <p>{benchmark.taskCount} tasks · <SourceLinks sources={[benchmark.source]} /></p>
            </header>
            {metricIds.map(metricId => (
              <MetricChart
                key={metricId}
                benchmark={benchmark}
                metricId={metricId}
                column={column}
                id={`${id}-${benchmark.id}-${metricId}`}
                selected={selected === benchmark.id}
              />
            ))}
          </Fragment>
        ))}
      </div>
      <ProtocolNotes id={id} />
    </section>
  )
}
