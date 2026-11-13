import type { CSSProperties } from 'react'

/* Two measurements of each method as one point: the first across, the second
   up. With `frontier`, up and to the right is better: the dashed line is the
   Pareto frontier, and the tint under it is what the methods on the frontier
   outperform on both measurements. Without it, points that share a path are
   joined, and each path is read on its own. The same numbers are in a table
   for a reader who cannot see the drawing. */

export type FrontierPlace = 'e' | 'w' | 'n' | 's' | 'ne' | 'nw' | 'se' | 'sw'

export type FrontierPoint = {
  /** The row of the table: the method, or the method and its setting. */
  label: string
  /** What is written next to the point. The label, unless this is set. An empty name writes nothing. */
  name?: string
  x: number
  /** null when the source reports no second measurement. The method is then listed and not drawn. */
  y: number | null
  /** One standard error, drawn as a whisker. */
  xError?: number
  yError?: number
  ours?: boolean
  /** A point along a path, drawn smaller than a method's own point. */
  minor?: boolean
  /** The side of the point its name sits on. */
  place?: FrontierPlace
  /** Points that share a path are joined in the order given. */
  path?: string
}

export type FrontierAxis = {
  name: string
  min: number
  max: number
  ticks: readonly number[]
  /** What is written at each tick, when it is not the tick's own number. */
  tickLabels?: readonly string[]
  /** Written after the axis name and after every value. A percent sign unless set. */
  unit?: string
  /** Decimals of a value in the table. One unless set. */
  digits?: number
  /** A value as the table writes it, when the position along the axis is not the value itself. */
  say?: (position: number) => string
}

/** A level that the points are read against, drawn across the plot. */
export type FrontierLine = { y: number, name: string }

type Drawn = FrontierPoint & { y: number }

const value = (number: number, axis: FrontierAxis) => axis.say?.(number) ?? `${number.toFixed(axis.digits ?? 1)}${axis.unit ?? '%'}`
const title = (axis: FrontierAxis) => (axis.unit ?? '%') ? `${axis.name} (${axis.unit ?? '%'})` : axis.name

/** The points that no other point matches or exceeds on both measurements, from left to right. */
function paretoFront(points: readonly Drawn[]) {
  return points
    .filter(point => !points.some(other => other !== point && other.x >= point.x && other.y >= point.y && (other.x > point.x || other.y > point.y)))
    .sort((a, b) => a.x - b.x)
}

export function Frontier({ title: heading, x, y, points, frontier = true, lines = [] }: {
  title: string
  x: FrontierAxis
  y: FrontierAxis
  points: readonly FrontierPoint[]
  /** Draw the Pareto frontier. Off for paths, where each path is read on its own. */
  frontier?: boolean
  lines?: readonly FrontierLine[]
}) {
  const across = (number: number) => (number - x.min) / (x.max - x.min) * 100
  const up = (number: number) => (number - y.min) / (y.max - y.min) * 100
  const drawn = points.filter((point): point is Drawn => point.y !== null)
  const front = frontier ? paretoFront(drawn) : []

  // The frontier as a staircase from the left axis to the bottom axis, in a 100 by 100 box with y running down.
  const stairs: [number, number][] = []
  front.forEach((point, index) => {
    if (index === 0) stairs.push([0, 100 - up(point.y)])
    stairs.push([across(point.x), 100 - up(point.y)])
    stairs.push([across(point.x), index + 1 < front.length ? 100 - up(front[index + 1].y) : 100])
  })
  const edge = stairs.map(([left, top]) => `${left},${top}`).join(' ')

  const paths = new Map<string, Drawn[]>()
  for (const point of drawn) if (point.path) paths.set(point.path, [...(paths.get(point.path) ?? []), point])

  return (
    <div className="frontier">
      <p className="frontier-title">{heading}</p>
      <div className="frontier-plot" aria-hidden="true">
        <span className="frontier-axis" data-axis="y">{title(y)}</span>
        <div className="frontier-field">
          <svg className="frontier-lines" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
            {x.ticks.map(tick => <line key={`x${tick}`} className="frontier-grid" x1={across(tick)} x2={across(tick)} y1="0" y2="100" />)}
            {y.ticks.map(tick => <line key={`y${tick}`} className="frontier-grid" x1="0" x2="100" y1={100 - up(tick)} y2={100 - up(tick)} />)}
            {front.length > 0 && <polygon className="frontier-region" points={`0,100 ${edge}`} />}
            {front.length > 0 && <polyline className="frontier-edge" points={edge} />}
            {lines.map(line => <line key={line.name} className="frontier-level" x1="0" x2="100" y1={100 - up(line.y)} y2={100 - up(line.y)} />)}
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
          {x.ticks.map((tick, index) => <span key={tick} className="frontier-tick" data-axis="x" style={{ left: `${across(tick)}%` }}>{x.tickLabels?.[index] ?? tick}</span>)}
          {y.ticks.map((tick, index) => <span key={tick} className="frontier-tick" data-axis="y" style={{ bottom: `${up(tick)}%` }}>{y.tickLabels?.[index] ?? tick}</span>)}
          {front.length > 0 && <span className="frontier-edge-name" style={{ bottom: `${up(front[0].y)}%` }}>Pareto frontier</span>}
          {lines.map(line => <span key={line.name} className="frontier-level-name" style={{ bottom: `${up(line.y)}%` }}>{line.name}</span>)}
          {drawn.map(point => (
            <span key={point.label} className="frontier-point" data-ours={point.ours || undefined} data-minor={point.minor || undefined}
              style={{ left: `${across(point.x)}%`, bottom: `${up(point.y)}%` } as CSSProperties}>
              {(point.name ?? point.label) && <span className="frontier-name" data-place={point.place ?? 'e'}>{point.name ?? point.label}</span>}
            </span>
          ))}
        </div>
        <span className="frontier-axis" data-axis="x">{title(x)}</span>
      </div>
      {/* A table does not clip to a given size, so the wrapper is what is hidden from view. */}
      <div className="site-hidden">
        <table>
          <caption>{heading}</caption>
          <thead><tr><th scope="col">Row</th><th scope="col">{x.name}, then {y.name}</th></tr></thead>
          <tbody>
            {points.map(point => (
              <tr key={point.label}>
                <th scope="row">{point.label}</th>
                <td>
                  <span>{x.name}: {value(point.x, x)}</span>{' '}
                  {point.y !== null && <span>{y.name}: {value(point.y, y)}</span>}
                </td>
              </tr>
            ))}
            {lines.map(line => (
              <tr key={line.name}>
                <th scope="row">{line.name}</th>
                <td><span>{y.name}: {value(line.y, y)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
