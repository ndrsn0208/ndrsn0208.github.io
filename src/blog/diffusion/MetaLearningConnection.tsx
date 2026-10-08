import { useId } from 'react'
import katex from 'katex'
import { metaLearningConnection } from './meta-learning-connection'
import 'katex/dist/katex.min.css'
import './meta-learning-connection.css'

// Inline KaTeX retains natural breaks at relations on narrow screens.
// Compile the canonical expressions once; the derivation needs no client state.
const math = (tex: string) => katex.renderToString(tex, {
  displayMode: false,
  output: 'html',
  throwOnError: true,
})

const steps = metaLearningConnection.steps.map(step => ({
  ...step,
  sharedHtml: math(step.sharedTex),
  trustHtml: math(step.trustTex),
  mamlHtml: math(step.mamlTex),
}))
const conditionHtml = math(metaLearningConnection.conditionTex)
const notation = metaLearningConnection.notation.map(([symbol, meaning]) => ({
  symbol, meaning, html: math(symbol),
}))

function Equation({ html, label }: { html: string, label: string }) {
  return (
    <span className="diff-meta-math" role="math" aria-label={label}>
      <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
    </span>
  )
}

export default function MetaLearningConnection() {
  const uid = useId()

  return (
    <figure className="diff-meta-connection" aria-labelledby={`${uid}-title`}>
      <figcaption className="diff-meta-heading">
        <h3 id={`${uid}-title`}>{metaLearningConnection.title}</h3>
        <p>{metaLearningConnection.introduction}</p>
      </figcaption>

      <div className="diff-meta-columns" aria-hidden="true">
        <span>Trust Region</span>
        <span>One-step MAML</span>
      </div>

      <ol className="diff-meta-steps" role="list">
        {steps.map((step, index) => (
          <li className="diff-meta-step" key={step.id}>
            <div className="diff-meta-bridge">
              <h4><span aria-hidden="true">{index + 1}. </span>{step.label}.</h4>{' '}
              <p>{step.text}</p>{' '}
              <Equation html={step.sharedHtml} label={step.sharedLabel} />
            </div>

            <div className="diff-meta-pair">
              <div className="diff-meta-formula">
                <span className="diff-meta-method" aria-hidden="true">Trust Region</span>
                <Equation html={step.trustHtml} label={step.trustLabel} />
              </div>
              <div className="diff-meta-formula">
                <span className="diff-meta-method" aria-hidden="true">One-step MAML</span>
                <Equation html={step.mamlHtml} label={step.mamlLabel} />
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="diff-meta-conclusion">
        <p className="diff-meta-condition">
          <span>Matching descent directions require</span>
          <Equation html={conditionHtml} label={metaLearningConnection.conditionLabel} />
        </p>
        <p>{metaLearningConnection.conclusion}</p>
      </div>

      <dl className="diff-meta-notation" aria-label="Notation">
        {notation.map(({ symbol, meaning, html }) => (
          <div key={symbol}><dt><Equation html={html} label={meaning} /></dt><dd>{meaning}</dd></div>
        ))}
      </dl>

      <div className="diff-meta-sources">
        <a href={metaLearningConnection.source} target="_blank" rel="noreferrer">
          Paper · §3.3, Eqs. 5–13
        </a>
        <a href={metaLearningConnection.appendix} target="_blank" rel="noreferrer">
          Appendix derivation
        </a>
      </div>
    </figure>
  )
}
