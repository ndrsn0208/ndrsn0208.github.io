import { Fragment, type ReactNode } from 'react'

/* The essay's one drawing: every pair of digit color and background color in
   ColorMNIST. A filled cell is a pair the model is trained on. A dashed cell
   is a pair that training leaves out. Every figure about composition is drawn
   on this grid, and what the model produces is placed in the cell of its pair. */

export const digitColors = ['yellow', 'green', 'cyan', 'pink'] as const
export const backgroundColors = ['deep red', 'navy', 'dark purple', 'dark brown'] as const

/** The four held-out pairs, as [digit color, background color]. The paper's appendix on the benchmarks lists them. */
export const heldOutPairs = [[0, 2], [1, 0], [2, 3], [3, 1]] as const

export type PairMark = {
  row: number
  column: number
  /** `query`: the held-out pair in question. `made`: that pair, once it is generated. `reached`: a seen pair that something ends on. */
  kind: 'query' | 'made' | 'reached'
  /** What sits in the cell: an image, or a name. */
  content?: ReactNode
}

export default function Pairs({ marks = [], row, column, arrow, label }: {
  marks?: readonly PairMark[]
  /** The digit color and the background color that are being read off, drawn as a band across the grid. */
  row?: number
  column?: number
  /** A move from one cell to another, as [row, column] of each. */
  arrow?: { from: readonly [number, number], to: readonly [number, number] }
  label: string
}) {
  const at = (index: number) => (index + .5) * 25
  return (
    <div className="pairs" role="img" aria-label={label}>
      <span className="pairs-axis" data-axis="column">Background color</span>
      <span className="pairs-axis" data-axis="row">Digit color</span>
      {/* Every cell has its own place, so that the arrow can lie over the cells. */}
      {backgroundColors.map((name, index) => <span className="pairs-name" data-axis="column" data-on={column === index || undefined} key={name} style={{ gridColumn: index + 2 }}>{name}</span>)}
      {digitColors.map((name, r) => (
        <Fragment key={name}>
          <span className="pairs-name" data-axis="row" data-on={row === r || undefined} style={{ gridRow: r + 3 }}>{name}</span>
          {backgroundColors.map((_, c) => {
            const mark = marks.find(item => item.row === r && item.column === c)
            return (
              <span className="pair" key={c} data-kind={mark?.kind} style={{ gridRow: r + 3, gridColumn: c + 2 }}
                data-held={heldOutPairs.some(([heldRow, heldColumn]) => heldRow === r && heldColumn === c) || undefined}
                data-band={row === r || column === c || undefined}>
                {mark?.content}
              </span>
            )
          })}
        </Fragment>
      ))}
      {arrow && (() => {
        // From the middle of the first cell to the edge of the second. The cells form a square, so the box keeps its shape.
        const [x1, y1, x2, y2] = [at(arrow.from[1]), at(arrow.from[0]), at(arrow.to[1]), at(arrow.to[0])]
        const length = Math.hypot(x2 - x1, y2 - y1)
        const [ux, uy] = [(x2 - x1) / length, (y2 - y1) / length]
        return (
          <svg className="pairs-arrow" viewBox="0 0 100 100" focusable="false" aria-hidden="true">
            <circle cx={x1} cy={y1} r="1.8" />
            <line x1={x1} y1={y1} x2={x2 - ux * 17.5} y2={y2 - uy * 17.5} />
            <path d="M0 -2.4 L5 0 L0 2.4 Z" transform={`translate(${x2 - ux * 17.5} ${y2 - uy * 17.5}) rotate(${Math.atan2(uy, ux) * 180 / Math.PI})`} />
          </svg>
        )
      })()}
    </div>
  )
}
