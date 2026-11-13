import type { CSSProperties } from 'react'

/* Two measurements of each method as one point: the first across, the second
   up. Up and to the right is better. The dashed line is the Pareto frontier,
   and the tint under it is what the methods on the frontier outperform on both
   measurements. The same numbers are in a table for a reader who cannot see
   the drawing. */

export type FrontierPlace = 'e' | 'w' | 'n' | 's' | 'ne' | 'nw' | 'se' | 'sw'

export type FrontierPoint = {
  /** The method, as the paper's table names it. */
  label: string
  /** What is written next to the point. The label, unless this is set. */
  name?: string
  x: number
  /** null when the source reports no second measurement. The method is then listed and not drawn. */
  y: number | null
  /** One standard error, drawn as a whisker. */
  xError?: number
  yError?: number
  ours?: boolean
  /** The side of the point its name sits on. */
  place?: FrontierPlace
  /** Points that share a path are joined in the order given. */
  path?: string
}

export type FrontierAxis = { name: string, min: number, max: number, ticks: readonly number[] }

type Drawn = FrontierPoint & { y: number }

const format = (value: number, digits: number, unit: string) => `${value.toFixed(digits)}${unit}`

/** The points that no other point matches or exceeds on both measurements, from left to right. */
function paretoFront(points: readonly Drawn[]) {
  return points
    .filter(point => !points.some(other => other !== point && other.x >= point.x && other.y >= point.y && (other.x > point.x || other.y > point.y)))
    .sort((a, b) => a.x - b.x)
}

export function Frontier({ title, x, y, points, frontier = true, unit = '%', digits = 1 }: {
  title: string
  x: FrontierAxis
  y: FrontierAxis
  points: readonly FrontierPoint[]
  /** Draw the Pareto frontier. Off for paths, where each path is read on its own. */
  frontier?: boolean
  unit?: string
  digits?: number
}) {
  const across = (value: number) => (value - x.min) / (x.max - x.min) * 100
  const up = (value: number) => (value - y.min) / (y.max - y.min) * 100
  const drawn = points.filter((point): point is Drawn => point.y !== null)
  const front = frontier ? paretoFront(drawn) : []

  // The frontier as a staircase from the left axis to the bottom axis, in a 100 by 100 box with y running down.
  const stairs: [number, number][] = []
  front.forEach((point, index) => {
    if (index === 0) stairs.push([0, 100 - up(point.y)])
    stairs.push([across(point.x), 100 - up(point.y)])
    stairs.push([across(point.x), index + 1 < front.length ? 100 - up(front[index + 1].y) : 100])
  })
  const line = stairs.map(([left, top]) => `${left},${top}`).join(' ')

  const paths = new Map<string, Drawn[]>()
  for (const point of drawn) if (point.path) paths.set(point.path, [...(paths.get(point.path) ?? []), point])

  return (
    <div className="frontier">
      <p className="frontier-title">{title}</p>
      <div className="frontier-plot" aria-hidden="true">
        <span className="frontier-axis" data-axis="y">{y.name} ({unit})</span>
        <div className="frontier-field">
          <svg className="frontier-lines" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
            {x.ticks.map(tick => <line key={`x${tick}`} className="frontier-grid" x1={across(tick)} x2={across(tick)} y1="0" y2="100" />)}
            {y.ticks.map(tick => <line key={`y${tick}`} className="frontier-grid" x1="0" x2="100" y1={100 - up(tick)} y2={100 - up(tick)} />)}
            {front.length > 0 && <polygon className="frontier-region" points={`0,100 ${line}`} />}
            {front.length > 0 && <polyline className="frontier-edge" points={line} />}
            {[...paths].map(([name, steps]) => (
              <polyline key={name} className="frontier-path" data-ours={steps[0].ours || undefined}
                points={steps.map(step => `${across(step.x)},${100 - up(step.y)}`).join(' ')} />
            ))}
            {drawn.map(point => (
              <g key={point.label} className="frontier-whisker" data-ours={point.ours || undefined}>
                {point.xError ? <line x1={across(point.x - point.xError)} x2={across(point.x + point.xError)} y1={100 - up(point.y)} y2={100 - up(point.y)} /> : null}
                {point.yError ? <line x1={across(point.x)} x2={across(point.x)} y1={100 - up(point.y - point.yError)} y2={100 - up(point.y + point.yError)} /> : null}
              </g>
            ))}
          </svg>
          {x.ticks.map(tick => <span key={tick} className="frontier-tick" data-axis="x" style={{ left: `${across(tick)}%` }}>{tick}</span>)}
          {y.ticks.map(tick => <span key={tick} className="frontier-tick" data-axis="y" style={{ bottom: `${up(tick)}%` }}>{tick}</span>)}
          {front.length > 0 && <span className="frontier-edge-name" style={{ bottom: `${up(front[0].y)}%` }}>Pareto frontier</span>}
          {drawn.map(point => (
            <span key={point.label} className="frontier-point" data-ours={point.ours || undefined}
              style={{ left: `${across(point.x)}%`, bottom: `${up(point.y)}%` } as CSSProperties}>
              <span className="frontier-name" data-place={point.place ?? 'e'}>{point.name ?? point.label}</span>
            </span>
          ))}
        </div>
        <span className="frontier-axis" data-axis="x">{x.name} ({unit})</span>
      </div>
      {/* A table does not clip to a given size, so the wrapper is what is hidden from view. */}
      <div className="site-hidden">
      <table>
        <caption>{title}</caption>
        <thead><tr><th scope="col">Method</th><th scope="col">{x.name}, then {y.name}</th></tr></thead>
        <tbody>
          {points.map(point => (
            <tr key={point.label}>
              <th scope="row">{point.label}</th>
              <td>
                <span>{x.name}: {format(point.x, digits, unit)}</span>{' '}
                {point.y !== null && <span>{y.name}: {format(point.y, digits, unit)}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
