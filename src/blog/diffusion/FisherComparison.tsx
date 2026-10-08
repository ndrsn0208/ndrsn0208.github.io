import { useId, useState } from 'react'
import { SurfacePanel } from './ArgumentScene'
import FisherMatrix from './FisherMatrix'
import {
  errorPercent,
  FISHER_DIMENSION,
  FISHER_RESIDUAL,
  FISHER_SECONDARY,
  FISHER_TERTIARY,
  FISHER_VIEW,
  fisherEstimates,
  fisherMatrices,
  fisherPanels,
  matrixColorMaximum,
  type FisherEstimate,
} from './fisher-comparison-model'
import './fisher-comparison.css'

export default function FisherComparison() {
  const id = useId().replace(/:/g, '')
  const [highlight, setHighlight] = useState(false)
  const [selected, setSelected] = useState<FisherEstimate>('full')
  const [pose, setPose] = useState(FISHER_VIEW)

  return (
    <figure className="fisher-comparison arg-scene" aria-labelledby={`${id}-title`} aria-describedby={`${id}-caption`}>
      <header className="fisher-comparison-heading">
        <h3 id={`${id}-title`}>What diagonal Fisher misses</h3>
        <button
          type="button"
          className="fisher-correlation-toggle"
          aria-pressed={highlight}
          onClick={() => setHighlight(value => !value)}
        >
          <svg viewBox="0 0 18 18" aria-hidden="true">
            <path d="M3 3h3v3H3zm9 9h3v3h-3z" fill="currentColor" opacity={highlight ? '.25' : '1'} />
            <path d="M12 3h3v3h-3zM3 12h3v3H3z" fill="currentColor" />
          </svg>
          Highlight off-diagonal entries
        </button>
      </header>
      <p className="fisher-comparison-intro">
        Look beyond the diagonal. <strong>Rank-1 keeps the pattern that diagonal Fisher discards.</strong>
      </p>
      <div className="fisher-matrix-comparison">
        {fisherEstimates.map(({ id: estimate, title, description }) => (
          <section className="fisher-estimate" key={estimate} aria-labelledby={`${id}-${estimate}-title`}>
            <h4 id={`${id}-${estimate}-title`}>{title}</h4>
            <div className="fisher-matrix-and-reading">
              <div className="fisher-matrix-frame">
                <FisherMatrix
                  matrix={fisherMatrices[estimate]}
                  maximum={matrixColorMaximum}
                  label={`${title}. ${description}.`}
                  highlightOffDiagonal={highlight}
                />
              </div>
              <div className="fisher-matrix-reading">
                <p>{description}</p>
                {estimate === 'full'
                  ? <span className="fisher-matrix-error">Reference matrix</span>
                  : <span className="fisher-matrix-error"><strong>{errorPercent(estimate)}</strong> relative error</span>}
              </div>
            </div>
          </section>
        ))}
      </div>
      <div className="fisher-matrix-key">
        <span className="fisher-signed-key">
          <i data-sign="negative" /> Negative
          <i data-sign="zero" /> Zero
          <i data-sign="positive" /> Positive
        </span>
        <span>Same parameters, order, and color scale</span>
      </div>
      <div className="fisher-landscape-heading">
        <div>
          <strong>How the loss geometry changes</strong>
          <span>Shared nonlinear detail. Only the local Fisher changes.</span>
        </div>
        <button type="button" onClick={() => setPose(FISHER_VIEW)}>Reset view</button>
      </div>
      <div className="fisher-landscape-switcher" role="group" aria-label="Choose a loss surface">
        {fisherEstimates.map(({ id: estimate, title }) => (
          <button
            type="button"
            key={estimate}
            aria-pressed={selected === estimate}
            aria-controls={`${id}-surface-${estimate}`}
            onClick={() => setSelected(estimate)}
          >{title}</button>
        ))}
      </div>
      <div className="fisher-landscapes">
        {fisherPanels.map((panel, index) => (
          <SurfacePanel
            key={panel.id}
            id={`${id}-surface-${fisherEstimates[index].id}`}
            panel={panel}
            pose={pose}
            onPose={setPose}
            selected={selected === fisherEstimates[index].id}
            bare
            zoom={1.1}
            offsetY={0.2}
            resetPose={FISHER_VIEW}
            minWidth={7.1}
          />
        ))}
      </div>
      <div className="fisher-landscape-key">
        <span><i /> Same model checkpoint</span>
        <span>Height and color = loss · same scale</span>
        <span>Drag any surface to rotate all three</span>
      </div>
      <figcaption id={`${id}-caption`} className="fisher-comparison-caption">
        <strong>Full Fisher and rank-1 preserve nearly the same valley.</strong>{' '}
        Removing the off-diagonal entries changes its shape. These matrices and loss surfaces
        illustrate image-denoising geometry. Their values are constructed, with a small residual
        so rank-1 remains an approximation.
      </figcaption>
      <details className="fisher-comparison-details">
        <summary>How this illustration connects to the paper</summary>
        <p>
          Each matrix is computed from the same synthetic population of gradients in {FISHER_DIMENSION} parameter
          coordinates. Full Fisher averages their outer products. Diagonal keeps its diagonal entries.
          Rank-1 uses the paper’s scaled outer product of the mean gradient.
          The percentages report relative Frobenius error against the full matrix.
        </p>
        <p className="fisher-comparison-equation">L̃(δ) = ½δᵀF̂δ + R(δ)</p>
        <p>
          All three surfaces use the same two-dimensional parameter slice and the same nonlinear
          term R. This term adds asymmetric hills and valleys, but its value, gradient, and Hessian
          vanish at the central checkpoint. Only the local quadratic curvature changes between
          the panels. These are illustrative loss surrogates, not measured neural-network losses.
        </p>
        <p>
          The constructed Fisher has leading eigenvalues 1, {FISHER_SECONDARY}, and {FISHER_TERTIARY},
          with {FISHER_RESIDUAL} in the remaining directions. Its small residual explains the close
          match without making full Fisher exactly rank-1. The nonlinear detail is not part of the
          Fisher penalty and does not create a bounded rank-1 trust region.
        </p>
        <p>
          In the paper’s MNIST diffusion experiment, diagonal Fisher has relative error near 1.
          Rank-1 error becomes much smaller at later, low-SNR timesteps.
          {' '}<a href="https://arxiv.org/html/2509.23593v2#S3.F3" target="_blank" rel="noreferrer">Figure 3</a>{' '}
          provides those measurements. The derivation assumes low SNR, near convergence,
          and the paper’s score-model setting.
        </p>
      </details>
    </figure>
  )
}
