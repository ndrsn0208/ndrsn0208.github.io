import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

/** A displayed equation. The sentence before it names its terms. */
export default function MathBlock({ tex, label }: { tex: string, label: string }) {
  const html = useMemo(() => katex.renderToString(tex, { displayMode: true, throwOnError: false, output: 'html' }), [tex])
  return (
    <div className="essay-math" role="math" aria-label={label} tabIndex={0}>
      <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
