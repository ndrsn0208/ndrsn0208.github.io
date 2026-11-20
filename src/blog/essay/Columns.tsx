import type { CSSProperties } from 'react'

/* Measured values as columns from zero, one column per series in every group.
   One series is ours and is blue. With one group every column carries its number
   and its name. With several groups the numbers of ours are written, and the
   others are read by choosing them. Where the series of a page keep a colour of
   their own, every column has its colour. The same numbers are in a table for a
   reader who cannot see the drawing. */

export type ColumnGroup = {
  name: string
  /** One value per series. null where the source reports none: a dash, never a column of zero. */
  values: readonly (number | null)[]
}

export function Columns({ title, axis, names, short, groups, ours, colors, unit = '%', digits = 1, signed = false }: {
  title: string
  axis: { name: string, min?: number, max: number, ticks: readonly number[] }
  /** The series, in the order of the values. */
  names: readonly string[]
  /** Their names on a narrow screen. */
  short?: readonly string[]
  groups: readonly ColumnGroup[]
  /** The series that is ours, by index. */
  ours: number
  /** The colour each series keeps in every drawing of its page. Blue for ours and grey for the others, unless this is set. */
  colors?: readonly string[]
  unit?: string
  digits?: number
  /** Values are differences: they carry their sign. */
  signed?: boolean
}) {
  const min = axis.min ?? 0
  const span = axis.max - min
  const up = (value: number) => (value - min) / span * 100
  const zero = up(0)
  const write = (value: number) => `${signed && value > 0 ? '+' : ''}${value.toFixed(digits)}`.replace('-', '−')
  const single = groups.length === 1

  return (
    <div className="columns" data-single={single || undefined}>
      <div className="columns-plot" aria-hidden="true">
        <span className="columns-axis">{axis.name}</span>
        <div className="columns-field">
          {axis.ticks.map(tick => <span key={tick} className="columns-grid" data-zero={tick === 0 || undefined} style={{ bottom: `${up(tick)}%` }}><span>{tick}</span></span>)}
          <div className="columns-groups" style={{ '--groups': groups.length, '--series': names.length } as CSSProperties}>
            {groups.map(group => (
              <div key={group.name} className="columns-group">
                {group.values.map((value, index) => (
                  <span key={names[index]} className="column" data-ours={index === ours || undefined} data-none={value === null || undefined} data-keyed={colors ? '' : undefined}
                    style={value === null ? undefined : { '--from': `${Math.min(zero, up(value))}%`, '--size': `${Math.abs(up(value) - zero)}%`, '--top': `${Math.max(zero, up(value))}%`, ...(colors ? { '--series': colors[index] } : {}) } as CSSProperties}>
                    {value !== null && <span className="column-bar" />}
                    {(single || index === ours) && <span className="column-value" data-below={value !== null && value < 0 || undefined}>{value === null ? '–' : write(value)}</span>}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="columns-names" style={{ '--groups': groups.length, '--series': names.length } as CSSProperties}>
          {single
            ? <div className="columns-group">{names.map((name, index) => (
              <span key={name} className="columns-name" data-ours={index === ours || undefined}>
                <span className="columns-name-full">{name}</span><span className="columns-name-short">{short?.[index] ?? name}</span>
              </span>
            ))}</div>
            : groups.map(group => (
              <span key={group.name} className="columns-name">
                {group.name}
                {/* On a narrow screen a number has no room over its column, so ours is written under the group's name. */}
                <span className="columns-name-value">{group.values[ours] === null ? '–' : write(group.values[ours]!)}</span>
              </span>
            ))}
        </div>
      </div>
      <div className="site-hidden">
        <table>
          <caption>{title}</caption>
          <thead><tr><th scope="col">{axis.name}</th>{groups.map(group => <th scope="col" key={group.name}>{group.name}</th>)}</tr></thead>
          <tbody>
            {names.map((name, index) => (
              <tr key={name}>
                <th scope="row">{name}</th>
                {groups.map(group => <td key={group.name}>{group.values[index] === null ? 'not reported' : `${write(group.values[index]!)}${unit}`}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
