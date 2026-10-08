import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const equations = {
  denoising: {
    tex: String.raw`x_t = \sqrt{\bar{\alpha}_t}\,x_0 + \sqrt{1-\bar{\alpha}_t}\,\epsilon`,
    label: 'A noisy sample combines a clean sample x zero with Gaussian noise epsilon. The diffusion timestep t controls their relative amounts.',
    caption: 'The same noise prediction principle can generate an image or an action sequence. Here t is a diffusion timestep, not the index of a new task.',
    terms: [['x₀', 'an image or action sequence'], ['ε', 'Gaussian noise'], ['t', 'diffusion timestep']],
  },
  fisher: {
    tex: String.raw`\begin{aligned}F & = \mathbb{E}[g\,g^\top] \\[4pt]\mathcal{L}_{\mathrm{EWC}} & = \tfrac12\,(\theta-\theta^\star)^\top F\,(\theta-\theta^\star)\end{aligned}`,
    label: 'The empirical Fisher is the expected outer product of per-sample gradients. EWC penalizes displacement from an old model using that matrix.',
    caption: 'The papers use an empirical Fisher built from diffusion loss gradients as a local curvature surrogate. Correlations between parameter directions determine which changes receive a large penalty.',
    terms: [['g', 'a per-sample gradient'], ['θ*', 'an earlier model'], ['F', 'stored sensitivity']],
  },
} as const

export default function DiffusionEquation({ kind }: { kind: keyof typeof equations }) {
  const equation = equations[kind]
  const markup = useMemo(() => katex.renderToString(equation.tex, {
    displayMode: true,
    throwOnError: false,
    output: 'html',
  }), [equation.tex])

  return (
    <figure className="diff-equation" aria-label={equation.label}>
      <div className="diff-equation-math" aria-hidden="true" dangerouslySetInnerHTML={{ __html: markup }} />
      <dl>
        {equation.terms.map(([symbol, meaning]) => <div key={symbol}><dt>{symbol}</dt><dd>{meaning}</dd></div>)}
      </dl>
      <figcaption>{equation.caption}</figcaption>
    </figure>
  )
}
