import { useId } from 'react'
import DiffusionFigureShare from './DiffusionFigureShare'
import { recoveryMethods as methods, recoveryPanels as panels, recoveryPaper as paper, recoveryTable } from './recovery-data'
import './recovery-story.css'

export default function RecoveryStory() {
  const uid = useId()
  return (
    <figure className="diff-recovery-story" aria-labelledby={`${uid}-title`}>
      <header className="diff-recovery-heading">
        <h3 id={`${uid}-title`}>Fast recovery during continual learning</h3>
        <p>
          The model keeps learning new tasks while we evaluate <strong>Task 1</strong>.
          This tests whether its earlier skill stays easy to recover.
          Gray dashed lines mark task transitions. The horizontal axis counts gradient updates.
        </p>
      </header>

      <div className="diff-recovery-legend" aria-label="Methods in both original figures">
        {methods.map(method => (
          <span key={method.name}>
            <svg viewBox="0 0 34 8" aria-hidden="true">
              <line x1="0" x2="34" y1="4" y2="4" stroke={method.color} strokeWidth="2.5" strokeDasharray={method.dash} opacity=".8" />
            </svg>
            {method.name}
          </span>
        ))}
      </div>

      <p className="diff-recovery-pan-hint">Swipe across each figure to inspect the full training run.</p>
      {panels.map(panel => (
        <section id={`recovery-${panel.id}`} className="diff-recovery-panel" key={panel.id} aria-labelledby={`${uid}-${panel.id}`}>
          <header>
            <div>
              <h4 id={`${uid}-${panel.id}`}>{panel.title}</h4>
              <p>{panel.measure}</p>
            </div>
            <a href={panel.src} target="_blank" rel="noreferrer" aria-label={`Open the original ${panel.title} figure at full size`}>Full size ↗</a>
          </header>
          <div className="diff-recovery-viewport" role="region" aria-label={`${panel.title} original figure. Scroll horizontally on narrow screens.`} tabIndex={0}>
            <img className="diff-recovery-image" src={panel.src} alt={panel.alt} width={panel.width} height={panel.height} loading="lazy" />
          </div>
          <DiffusionFigureShare id={`recovery-${panel.id}`} />
        </section>
      ))}

      <figcaption className="diff-recovery-source">
        <p>
          <a href={paper} target="_blank" rel="noreferrer">Figure 2, Trust Region Continual Learning as an Implicit Meta-Learner.</a>
          {' '}Original figure panels from the paper. The curves average Task 1 performance over random seeds.
        </p>
        <p>
          Exact recovery counts at each task transition are reported in{' '}
          <a href={recoveryTable} target="_blank" rel="noreferrer">Table 2</a>.
        </p>
      </figcaption>
    </figure>
  )
}
