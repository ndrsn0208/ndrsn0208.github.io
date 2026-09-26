import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const equations = {
  consolidation: {
    tex: String.raw`\begin{aligned}\Delta\theta_t &= \operatorname{Adapt}(\theta_{t-1}, c_t, a_t)\\[4pt]\theta_t &= \theta_{t-1} \oplus \Delta\theta_t\end{aligned}`,
    label: 'The current chunk and selected update locations change the model from theta t minus one to theta t.',
    legend: [
      ['cₜ', 'incoming context'],
      ['aₜ', 'selected layers'],
      ['θₜ', 'updated weights'],
    ],
    caption: 'The updated weights become the starting point for the next chunk.',
  },
  selection: {
    tex: String.raw`a_t \sim \pi_{\theta_{t-1}}(\cdot \mid c_t)`,
    label: 'The current model generates a layer selection conditioned on the incoming context.',
    legend: [
      ['π', 'the language model'],
      ['θₜ₋₁', 'its current weights'],
      ['aₜ', 'a textual selection'],
    ],
    caption: 'The model making the selection has already changed through earlier updates.',
  },
  reward: {
    tex: String.raw`r_t = \underbrace{u_t}_{\text{acquisition}} - \lambda \underbrace{f_t}_{\text{forgetting}}`,
    label: 'Reward equals acquisition minus lambda times forgetting.',
    legend: [
      ['uₜ', 'learn the current context'],
      ['fₜ', 'loss on earlier contexts'],
      ['λ', 'weight given to forgetting'],
    ],
    caption: 'Evaluate the consequences of an update for both new and earlier information.',
  },
  fisher: {
    tex: String.raw`R(c)=\frac{|S(c)\cap\mathrm{Top}_{k}(F(c))|}{k}`,
    label: 'Fisher alignment is the fraction of selected layers that also appear among the top k Fisher layers.',
    legend: [
      ['S(c)', 'selected layers'],
      ['F(c)', 'layerwise Fisher scores'],
      ['k', 'number of selected layers'],
    ],
    caption: 'Compare equally sized layer sets on the same passage and current model.',
  },
}

export default function Equation({ kind }: { kind: keyof typeof equations }) {
  const equation = equations[kind]
  const html = useMemo(() => katex.renderToString(equation.tex, { displayMode: true, throwOnError: false, output: 'html' }), [equation.tex])
  return (
    <figure className="scol-equation" aria-label={equation.label}>
      <div className="scol-equation-math" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
      <dl className="scol-equation-key">
        {equation.legend.map(([symbol, definition]) => <div key={symbol}><dt>{symbol}</dt><dd>{definition}</dd></div>)}
      </dl>
      <figcaption>{equation.caption}</figcaption>
    </figure>
  )
}
