import type { CSSProperties } from 'react'

/* Measured values as bars from zero. One row is ours and is blue. Every bar
   carries its number, so no legend or axis is needed. */

export type BarRow = {
  label: string
  /** null keeps a value the source does not report. It is never drawn as zero. */
  value: number | null
  /** One standard error, drawn as a whisker. */
  error?: number
  ours?: boolean
}

const format = (value: number, digits: number, unit: string) => `${value.toFixed(digits)}${unit}`

export function Bars({ title, hint, rows, max, unit = '', digits = 1 }: {
  title: string
  hint?: string
  rows: readonly BarRow[]
  max: number
  unit?: string
  digits?: number
}) {
  return (
    <table className="bars">
      <caption><span className="bars-title">{title}</span>{hint && <span className="bars-hint">{hint}</span>}</caption>
      <tbody>
        {rows.map(row => (
          <tr key={row.label} data-ours={row.ours || undefined}>
            <th scope="row">{row.label}</th>
            <td>
              {row.value === null
                ? <span className="bars-none"><span aria-hidden="true">–</span><span className="site-hidden">not reported</span></span>
                : <span className="bar-line" style={{ '--v': row.value / max, '--e': (row.error ?? 0) / max } as CSSProperties}>
                  <span className="bar" data-error={row.error ? true : undefined} />
                  <span className="bar-value">{format(row.value, digits, unit)}</span>
                </span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export type PairRow = {
  label: string
  first: number
  /** null when the second measurement does not apply to this method. */
  second: number | null
  firstError?: number
  secondError?: number
  ours?: boolean
}

/** Two measurements of the same method: an outlined bar and, under it, a solid one. */
export function PairedBars({ title, first, second, rows, max, unit = '%', digits = 1 }: {
  title: string
  /** What the outlined bar measures. */
  first: string
  /** What the solid bar measures. */
  second: string
  rows: readonly PairRow[]
  max: number
  unit?: string
  digits?: number
}) {
  return (
    <table className="bars bars-paired">
      <caption>
        <span className="bars-title">{title}</span>
        <span className="bars-key"><span className="bar-swatch" data-kind="first" aria-hidden="true" />{first}</span>
        <span className="bars-key"><span className="bar-swatch" data-kind="second" aria-hidden="true" />{second}</span>
      </caption>
      <thead className="site-hidden"><tr><th scope="col">Method</th><th scope="col">{first}, then {second}</th></tr></thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.label} data-ours={row.ours || undefined}>
            <th scope="row">{row.label}</th>
            <td>
              <span className="bar-line" style={{ '--v': row.first / max, '--e': (row.firstError ?? 0) / max } as CSSProperties}>
                <span className="bar" data-kind="first" data-error={row.firstError ? true : undefined} />
                <span className="bar-value"><span className="site-hidden">{first}: </span>{format(row.first, digits, unit)}</span>
              </span>
              {row.second !== null && <span className="bar-line" style={{ '--v': row.second / max, '--e': (row.secondError ?? 0) / max } as CSSProperties}>
                <span className="bar" data-kind="second" data-error={row.secondError ? true : undefined} />
                <span className="bar-value"><span className="site-hidden">{second}: </span>{format(row.second, digits, unit)}</span>
              </span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
