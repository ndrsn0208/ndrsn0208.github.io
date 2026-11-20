import { useEffect, useRef, useState, type CSSProperties } from 'react'

/* Measured values along an ordered axis, one line per series. One series is ours:
   it is blue, and its numbers are written on the drawing. The others are grey and
   carry their names at the end of the line. A dashed line is a reference that the
   others are read against. Where the series of a page keep a colour of their own,
   every line has its colour and ours is the heavy one. A drawing may carry rows of
   values under its axis, one value per position. The same numbers are in a table
   for a reader who cannot see the drawing. */

export type CurveSeries = {
  /** The row of the table, and the name at the end of the line. */
  name: string
  /** The name on a narrow screen. */
  short?: string
  /** One value per position. null where the source reports none: the line is broken there. */
  values: readonly (number | null)[]
  /** The positions of the values along the axis. The axis ticks, unless this is set. */
  at?: readonly number[]
  ours?: boolean
  /** A reference: a scripted agent, a control, or a level computed from other values. */
  dashed?: boolean
  /** Points with no line through them. */
  loose?: boolean
  /** The positions that carry a point. Every position, or none on a smooth curve drawn through many values, unless this is set. */
  marks?: readonly number[]
  /** Write the values at the points. Ours carries its numbers and the others do not, unless this is set. */
  numbers?: boolean
  /** The values read under their points: at every position, or at the positions given. Above, unless this is set. */
  under?: boolean | readonly number[]
  /** Not yet part of the argument. */
  hidden?: boolean
  /** The colour the series keeps in every drawing of its page. Blue for ours and grey for the others, unless this is set. */
  color?: string
}

/** Values that belong to the positions of the axis and are no line: a difference between two series, for one. Written in a row under the axis. */
export type CurveRow = {
  name: string
  /** The name on a narrow screen. */
  short?: string
  /** One per position. null where there is none. */
  values: readonly (string | null)[]
  /** The same values written shorter, for a narrow screen. */
  narrow?: readonly (string | null)[]
}

const paint = (item: CurveSeries | undefined) => item?.color ? { '--series': item.color } as CSSProperties : undefined

export type CurveAxis = {
  name: string
  /** The name on a narrow screen, where the axis is named beside its ticks. */
  short?: string
  min: number
  max: number
  ticks: readonly number[]
  /** What is written at each tick, when it is not the tick's own number. */
  tickLabels?: readonly string[]
  /** On a narrow screen every second tick is written a line lower. For an axis of words. */
  stagger?: boolean
}

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Numbers that move to their new values over a short time, so that a line and its points move together. */
function useEased(target: readonly number[], duration = 520) {
  const [shown, setShown] = useState(target)
  const from = useRef(target)
  const key = target.join(',')
  useEffect(() => {
    const start = from.current
    if (reduced() || start.length !== target.length) { from.current = target; setShown(target); return }
    let frame = 0
    const began = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - began) / duration)
      const eased = 1 - (1 - t) ** 3
      const next = target.map((value, index) => start[index] + (value - start[index]) * eased)
      from.current = next
      setShown(next)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
    // The values themselves are the dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, duration])
  return shown.length === target.length ? shown : target
}

/** Names at the ends of the lines, moved apart so that none sits on another. Positions are in percent of the height.
    Names that would sit on one another form a group, and a group stands around the middle of the values it names,
    inside the drawing. Lines that end at the same value keep the order in which they arrive there. */
function apart(wanted: readonly number[], gap: number, before: readonly (readonly number[])[]) {
  const earlier = (a: number, b: number) => {
    for (let back = before[a].length - 1; back >= 0; back -= 1) if (before[a][back] !== before[b][back]) return before[a][back] - before[b][back]
    return 0
  }
  const order = wanted.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value || earlier(a.index, b.index))
  type Group = { from: number, count: number, sum: number }
  const reach = (group: Group) => (group.count - 1) * gap / 2
  const middle = (group: Group) => Math.min(100 - reach(group), Math.max(reach(group), group.sum / group.count))
  const groups: Group[] = []
  order.forEach((item, at) => {
    groups.push({ from: at, count: 1, sum: item.value })
    while (groups.length > 1) {
      const upper = groups[groups.length - 1]
      const lower = groups[groups.length - 2]
      if (middle(upper) - reach(upper) - (middle(lower) + reach(lower)) >= gap) break
      groups.splice(groups.length - 2, 2, { from: lower.from, count: lower.count + upper.count, sum: lower.sum + upper.sum })
    }
  })
  const placed = new Array<number>(wanted.length)
  for (const group of groups) {
    const lowest = middle(group) - reach(group)
    for (let at = 0; at < group.count; at += 1) placed[order[group.from + at].index] = lowest + at * gap
  }
  return placed
}

export function Curves({ title, x, y, series, band, rows, ranges = false, unit = '%', digits = 0, narrowDigits, nameGap = 7.4, say }: {
  title: string
  x: CurveAxis
  y: CurveAxis
  series: readonly CurveSeries[]
  /** Two series, by index. The space between them is tinted. */
  band?: readonly [number, number]
  rows?: readonly CurveRow[]
  /** Join the points of each position by a thin line from the lowest to the highest. For points with no line through them. */
  ranges?: boolean
  unit?: string
  digits?: number
  /** The digits of the numbers on a narrow screen, where the positions stand closer. Those of `digits`, unless this is set. */
  narrowDigits?: number
  /** The least distance between two names at the ends of lines, in percent of the height. More in a small drawing. */
  nameGap?: number
  /** A value as the table writes it. */
  say?: (value: number) => string
}) {
  const across = (value: number) => (value - x.min) / (x.max - x.min) * 100
  const up = (value: number) => (value - y.min) / (y.max - y.min) * 100
  const write = (value: number) => narrowDigits === undefined || narrowDigits === digits ? value.toFixed(digits)
    : <><span className="curves-wide">{value.toFixed(digits)}</span><span className="curves-narrow">{value.toFixed(narrowDigits)}</span></>
  const spoken = (value: number) => say?.(value) ?? `${value.toFixed(Math.max(1, digits))}${unit}`

  // Every value of every series in one list, so that all of them move together.
  const flat = series.flatMap(item => item.values.map(value => value ?? 0))
  const eased = useEased(flat)
  let offset = 0
  const drawn = series.map(item => {
    const positions = item.at ?? x.ticks
    const values = item.values.map((value, index) => value === null ? null : eased[offset + index])
    offset += item.values.length
    const points = values.map((value, index) => value === null ? null : { left: across(positions[index]), bottom: up(value), value: item.values[index]!, index })
    // A line runs through neighbouring values and breaks where one is missing.
    const runs: string[] = []
    let run: string[] = []
    for (const point of points) {
      if (point) run.push(`${point.left},${100 - point.bottom}`)
      else if (run.length) { runs.push(run.join(' ')); run = [] }
    }
    if (run.length) runs.push(run.join(' '))
    const last = [...points].reverse().find(point => point !== null) ?? null
    return { item, points, runs, last }
  })
  const ends = apart(drawn.map(line => line.last ? line.last.bottom : 0), nameGap, drawn.map(line => line.points.map(point => point ? point.bottom : 0)))
  // The span of the series at each position, as a thin line that holds the points of one position together.
  const spans = ranges ? x.ticks.map((tick, index) => {
    const values = drawn.filter(line => !line.item.hidden).map(line => line.points[index]).filter(point => point !== null && point !== undefined)
    return values.length > 1 ? { left: across(tick), low: Math.min(...values.map(point => point!.bottom)), high: Math.max(...values.map(point => point!.bottom)) } : null
  }) : []
  const between = band && drawn[band[0]].points.every(Boolean) && drawn[band[1]].points.every(Boolean)
    ? [...drawn[band[0]].points.map(point => `${point!.left},${100 - point!.bottom}`), ...[...drawn[band[1]].points].reverse().map(point => `${point!.left},${100 - point!.bottom}`)].join(' ')
    : null

  return (
    <div className="curves">
      <div className="curves-plot" data-stagger={x.stagger || undefined} data-rows={rows?.length ? '' : undefined} style={rows?.length ? { '--rows': rows.length } as CSSProperties : undefined} aria-hidden="true">
        <span className="curves-axis" data-axis="y">{y.name}</span>
        <div className="curves-field">
          <svg className="curves-lines" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
            {y.ticks.map(tick => <line key={tick} className="curves-grid" data-zero={tick === 0 || undefined} x1="0" x2="100" y1={100 - up(tick)} y2={100 - up(tick)} />)}
            {between && <polygon className="curves-band" style={paint(series[band![0]])} points={between} />}
            {spans.map((span, index) => span && <line key={index} className="curves-range" x1={span.left} x2={span.left} y1={100 - span.low} y2={100 - span.high} />)}
            {drawn.map(line => !line.item.loose && line.runs.map((run, index) => (
              <polyline key={`${line.item.name}-${index}`} className="curves-line" data-ours={line.item.ours || undefined} style={paint(line.item)}
                data-dashed={line.item.dashed || undefined} data-hidden={line.item.hidden || undefined} points={run} />
            )))}
          </svg>
          {y.ticks.map((tick, index) => <span key={tick} className="curves-tick" data-axis="y" style={{ bottom: `${up(tick)}%` }}>{y.tickLabels?.[index] ?? tick}</span>)}
          {x.ticks.map((tick, index) => <span key={tick} className="curves-tick" data-axis="x" data-low={(x.stagger && index % 2 === 1) || undefined} style={{ left: `${across(tick)}%` }}>{x.tickLabels?.[index] ?? tick}</span>)}
          {drawn.map((line, at) => {
            // A smooth curve is drawn through many values. Only the values that are named carry a point.
            const marked = line.item.marks ?? (line.item.at ? [] : line.points.map((_, index) => index))
            const numbered = line.item.numbers ?? line.item.ours ?? false
            return (
              <div key={line.item.name} className="curves-series" data-ours={line.item.ours || undefined} data-dashed={line.item.dashed || undefined}
                data-hidden={line.item.hidden || undefined} style={paint(line.item)}>
                {line.points.map(point => point && marked.includes(point.index) && (
                  <span key={point.index} className="curves-point" style={{ left: `${point.left}%`, bottom: `${point.bottom}%` }}>
                    {numbered && <span className="curves-value" data-under={(Array.isArray(line.item.under) ? line.item.under.includes(point.index) : line.item.under) || undefined}>{write(point.value)}</span>}
                  </span>
                ))}
                {/* A value the source does not report is a dash, never a point at zero. */}
                {line.item.ours && line.points.map((point, index) => point === null && (
                  <span key={`none-${index}`} className="curves-none" style={{ left: `${across((line.item.at ?? x.ticks)[index])}%` }}>–</span>
                ))}
                {line.last && <span className="curves-name" style={{ left: `${line.last.left}%`, bottom: `${ends[at]}%` }}>
                  <span className="curves-name-full">{line.item.name}</span>
                  <span className="curves-name-short">{line.item.short ?? line.item.name}</span>
                </span>}
              </div>
            )
          })}
          {/* With rows under the axis, the axis is named where the rows are named: at the end of its line of ticks. */}
          {rows?.length ? <div className="curves-row" style={{ '--row': -1 } as CSSProperties}>
            <span className="curves-row-name"><span className="curves-name-full">{x.name}</span><span className="curves-name-short">{x.short ?? x.name}</span></span>
          </div> : null}
          {rows?.map((row, at) => (
            <div key={row.name} className="curves-row" style={{ '--row': at } as CSSProperties}>
              {x.ticks.map((tick, index) => row.values[index] != null && <span key={tick} className="curves-row-value" style={{ left: `${across(tick)}%` }}>
                {row.narrow ? <><span className="curves-wide">{row.values[index]}</span><span className="curves-narrow">{row.narrow[index]}</span></> : row.values[index]}
              </span>)}
              <span className="curves-row-name"><span className="curves-name-full">{row.name}</span><span className="curves-name-short">{row.short ?? row.name}</span></span>
            </div>
          ))}
        </div>
        {!rows?.length && <span className="curves-axis" data-axis="x">{x.name}</span>}
      </div>
      {/* A table does not clip to a given size, so the wrapper is what is hidden from view. */}
      <div className="site-hidden">
        <table>
          <caption>{title}</caption>
          <thead><tr><th scope="col">{x.name}</th>{series.filter(item => !item.hidden).map(item => <th scope="col" key={item.name}>{item.name}</th>)}{rows?.map(row => <th scope="col" key={row.name}>{row.name}</th>)}</tr></thead>
          <tbody>
            {x.ticks.map((tick, row) => (
              <tr key={tick}>
                <th scope="row">{x.tickLabels?.[row] ?? tick}</th>
                {series.filter(item => !item.hidden).map(item => {
                  const index = (item.at ?? x.ticks).indexOf(tick)
                  const value = index < 0 ? null : item.values[index]
                  return <td key={item.name}>{value === null ? 'not reported' : spoken(value)}</td>
                })}
                {rows?.map(item => <td key={item.name}>{item.values[row] ?? 'not reported'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** The figures a reader should leave a chart with, set large above it. */
export function Readout({ figures }: { figures: readonly { value: string, label: string }[] }) {
  return (
    <dl className="readout">
      {figures.map(figure => (
        <div key={figure.label}>
          <dt>{figure.label}</dt>
          <dd>{figure.value}</dd>
        </div>
      ))}
    </dl>
  )
}
