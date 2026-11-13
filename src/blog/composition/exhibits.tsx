import type { CSSProperties, ReactNode } from 'react'
import Exhibit from '../essay/Exhibit'
import { Frontier, type FrontierAxis, type FrontierPlace, type FrontierPoint } from '../essay/Frontier'
import { compositionEssay } from './article'
import { colorPairLevels, colorPairs, distinctLevels, distinctPrototypes, mainResults, prototypeCount, prototypeCounts, tradeoff } from './evidence'
import Pairs, { type PairMark } from './Pairs'
import { Tile, sheets } from './tiles'
import './exhibits.css'

const essay = compositionEssay
const specs = compositionEssay.exhibits
const eight = [0, 1, 2, 3, 4, 5, 6, 7] as const

/* Opening figure, on the grid of pairs: training leaves a pair out, a query of that pair arrives,
   mode ascent ends at prototypes of seen pairs, and their product of experts makes the pair. */

/** The query's pair: a green digit on deep red. */
const queryPair = { row: 1, column: 0 } as const
/** Five of the eight selected prototypes, each in the cell of the pair it shows. `tile` is its column in the sheet. */
const composePrototypes = [
  { row: 2, column: 0, tile: 0 },   // cyan on deep red: the query's background
  { row: 1, column: 3, tile: 1 },   // green on dark brown: the query's digit color
  { row: 0, column: 3, tile: 5 },   // yellow on dark brown
  { row: 2, column: 2, tile: 6 },   // cyan on dark purple
  { row: 3, column: 2, tile: 4 },   // pink on dark purple
] as const

function Compose({ lead }: { lead: boolean }) {
  return (
    <Exhibit id="compose" spec={specs.compose} essay={essay} lead={lead} rest={4} dwell={[3800, 3400, 4200, 4600, 4800]}>
      {({ step }) => {
        const marks: PairMark[] = []
        if (step >= 1) marks.push({ ...queryPair, kind: step >= 3 ? 'made' : 'query', content: step >= 3 ? <Tile sheet={sheets.compose} column={0} row={5} /> : undefined })
        if (step >= 2) for (const prototype of composePrototypes) marks.push({ row: prototype.row, column: prototype.column, kind: 'reached', content: <Tile sheet={sheets.compose} column={prototype.tile} row={2} /> })
        return (
          <div className="compose">
            <div className="compose-side" data-there={step >= 1 || undefined} aria-hidden="true">
              <p className="exhibit-label">Query</p>
              <Tile sheet={sheets.compose} column={0} row={0} />
            </div>
            <Pairs marks={marks} row={step >= 3 ? queryPair.row : undefined} column={step >= 3 ? queryPair.column : undefined}
              label={specs.compose.steps[step].say} />
            <div className="compose-side compose-samples" data-there={step >= 4 || undefined} aria-hidden="true">
              <p className="exhibit-label">Samples</p>
              <div className="compose-tiles">{eight.map(column => <Tile key={column} sheet={sheets.compose} column={column} row={4} />)}</div>
            </div>
          </div>
        )
      }}
    </Exhibit>
  )
}

/* A noisy marginal in one dimension at three noise levels, with the modes that two images reach. A diagram. */

const centres = [-3.05, -2.2, -.55, .45, 2.65] as const
const shares = [.2, .22, .2, .2, .18] as const
const widths = [.2, .62, 1.5] as const
const span = [-4.7, 4.7] as const
const levelNames = ['Low noise level', 'Higher noise level', 'High noise level'] as const
/** Where the noised copies of the two images start. */
const starts = { image: .62, other: -.78 } as const

const density = (x: number, width: number) => centres.reduce((sum, centre, index) => {
  const variance = .16 ** 2 + width ** 2
  return sum + shares[index] * Math.exp(-((x - centre) ** 2) / (2 * variance)) / Math.sqrt(2 * Math.PI * variance)
}, 0)

/** Mode ascent: follow the slope of the log-density until it vanishes. */
function ascend(start: number, width: number) {
  let x = start
  for (let step = 0; step < 4000; step += 1) {
    const slope = (Math.log(density(x + 1e-4, width)) - Math.log(density(x - 1e-4, width))) / 2e-4
    if (Math.abs(slope) < 1e-5) break
    x += .01 * Math.max(-8, Math.min(8, slope))
  }
  return x
}

const marginals = widths.map(width => {
  const xs = Array.from({ length: 241 }, (_, index) => span[0] + (span[1] - span[0]) * index / 240)
  const top = Math.max(...xs.map(x => density(x, width)))
  const across = (x: number) => (x - span[0]) / (span[1] - span[0]) * 100
  const up = (x: number) => density(x, width) / top * 78
  const trail = (from: number, to: number) => Array.from({ length: 41 }, (_, index) => from + (to - from) * index / 40).map(x => `${across(x)},${100 - up(x)}`).join(' ')
  const modes = { image: ascend(starts.image, width), other: ascend(starts.other, width) }
  return {
    curve: xs.map(x => `${across(x)},${100 - up(x)}`).join(' '),
    shared: Math.abs(modes.image - modes.other) < .05,
    image: { start: across(starts.image), at: across(modes.image), height: up(modes.image), trail: trail(starts.image, modes.image), from: up(starts.image) },
    other: { start: across(starts.other), at: across(modes.other), height: up(modes.other), trail: trail(starts.other, modes.other), from: up(starts.other) },
  }
})

function Modes() {
  return (
    <Exhibit id="modes" spec={specs.modes} essay={essay}>
      {() => (
        <div className="modes" aria-hidden="true">
          {marginals.map((marginal, index) => (
            <div className="modes-level" key={levelNames[index]}>
              <p className="exhibit-label">{levelNames[index]}</p>
              <div className="modes-field">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
                  <polyline className="modes-curve" points={marginal.curve} />
                  <line className="modes-start" x1={marginal.other.start} x2={marginal.other.start} y1="100" y2={100 - marginal.other.from} />
                  <line className="modes-start" data-ours x1={marginal.image.start} x2={marginal.image.start} y1="100" y2={100 - marginal.image.from} />
                  <polyline className="modes-trail" points={marginal.other.trail} />
                  <polyline className="modes-trail" data-ours points={marginal.image.trail} />
                </svg>
                {!marginal.shared && <span className="modes-point" style={{ left: `${marginal.other.at}%`, bottom: `${marginal.other.height}%` }} />}
                <span className="modes-point" data-ours style={{ left: `${marginal.image.at}%`, bottom: `${marginal.image.height}%` }}>
                  <span className="modes-name">{marginal.shared ? 'Shared prototype' : 'Prototype'}</span>
                </span>
              </div>
            </div>
          ))}
          <div className="modes-key">
            <span className="exhibit-label"><i data-ours />Noised copy of an image</span>
            <span className="exhibit-label"><i />Noised copy of another image</span>
          </div>
        </div>
      )}
    </Exhibit>
  )
}

/* The prototypes of one image at increasing noise levels, on four pretrained models. */

const levelModels = [
  { sheet: { file: 'levels-cifar10.png', columns: 8, rows: 2 }, levels: [70, 140, 220, 290, 370, 440, 520] },
  { sheet: { file: 'levels-celebahq.webp', columns: 8, rows: 2 }, levels: [90, 210, 330, 440, 560, 680, 800] },
  { sheet: { file: 'levels-dit.webp', columns: 8, rows: 2 }, levels: [60, 120, 190, 250, 310, 380, 440] },
  { sheet: { file: 'levels-ldm.webp', columns: 8, rows: 2 }, levels: [80, 170, 270, 360, 450, 550, 640] },
] as const

function Levels() {
  return (
    <Exhibit id="levels" spec={specs.levels} essay={essay}>
      {({ tab }) => {
        const model = levelModels[tab]
        return (
          <div className="levels" aria-hidden="true">
            <div className="levels-line">
              <span className="exhibit-label">Image</span>
              <span />
              <span className="exhibit-label levels-over">Prototype at noise level t</span>
            </div>
            {[0, 1].map(row => (
              <div className="levels-line" key={row}>
                <Tile sheet={model.sheet} column={0} row={row} />
                <span />
                {model.levels.map((level, index) => <Tile key={level} sheet={model.sheet} column={index + 1} row={row} />)}
              </div>
            ))}
            <div className="levels-line levels-scale">
              <span />
              <span />
              {model.levels.map(level => <span key={level}>{level}</span>)}
            </div>
          </div>
        )
      }}
    </Exhibit>
  )
}

/* A table of measured values. A darker cell is a higher value. */

function Shades({ title, columns, rows }: {
  title: string
  columns: readonly string[]
  rows: readonly { name: string, detail?: string, cells: readonly { text: string, share: number }[] }[]
}) {
  return (
    <div className="shades" role="table" aria-label={title} style={{ '--columns': columns.length } as CSSProperties}>
      <p className="shades-title" aria-hidden="true">{title}</p>
      <div role="rowgroup">
        <div className="shades-row" role="row">
          <span className="shades-name" role="columnheader"><span className="site-hidden">Row</span></span>
          {columns.map(column => <span className="shades-level" role="columnheader" key={column}>{column}</span>)}
        </div>
      </div>
      <div role="rowgroup">
        {rows.map(row => (
          <div className="shades-row" role="row" key={row.name}>
            <span className="shades-name" role="rowheader">{row.name}{row.detail && <span className="shades-detail"> {row.detail}</span>}</span>
            {row.cells.map((cell, index) => (
              <span className="shades-cell" role="cell" key={index} data-dark={cell.share >= .54 || undefined} style={{ '--share': cell.share } as CSSProperties}>{cell.text}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function Sharing() {
  return (
    <Exhibit id="sharing" spec={specs.sharing} essay={essay}>
      {() => <Shades title="Distinct prototypes that the images of each model reach, by noise level t"
        columns={distinctLevels.map(String)}
        rows={distinctPrototypes.map(model => ({
          name: model.model,
          detail: `${model.images} images`,
          cells: model.counts.map(reached => ({ text: String(reached), share: reached / model.images })),
        }))} />}
    </Exhibit>
  )
}

/* Mode ascent from a held-out pair and from a seen pair: where the held-out pair ends on the grid,
   the model's images step by step, and the share of ascents that keep their pair. */

/** The column of the ascent sheet shown at each station: the noised copy, then 1, 3, 10 and 40 ascent steps. */
const ascentColumns = [1, 2, 4, 6, 7] as const
/** The two noise levels shown, with their rows in the sheet and the cell where the ascent from the held-out pair ends. */
const ascentLevels = [
  { heldOut: 4, seen: 5, ends: [0, 0], pair: 'yellow on deep red', keeps: 'background', gives: 'digit color' },   // t = 300
  { heldOut: 6, seen: 7, ends: [1, 3], pair: 'green on dark brown', keeps: 'digit color', gives: 'background' },   // t = 400
] as const

function Ascent() {
  return (
    <Exhibit id="ascent" spec={specs.ascent} essay={essay} rest={4} dwell={[2600, 2400, 2400, 2600, 4600]}>
      {({ step, tab }) => {
        const level = ascentLevels[tab]
        return (
          <div className="ascent">
            <div className="ascent-top">
              <Pairs arrow={{ from: [queryPair.row, queryPair.column], to: level.ends }}
                marks={[{ ...queryPair, kind: 'query' }, { row: level.ends[0], column: level.ends[1], kind: 'reached', content: step === 4 ? <Tile sheet={sheets.ascent} column={7} row={level.heldOut} /> : undefined }]}
                label={`Mode ascent from the held-out pair, green on deep red, ends on a seen pair, ${level.pair}. It keeps the ${level.keeps} and replaces the ${level.gives}.`} />
              <div className="ascent-pairs" aria-hidden="true">
                {(['Held-out color pair', 'Seen color pair'] as const).map((name, start) => (
                  <div className="ascent-pair" key={name}>
                    <p className="exhibit-label">{name}</p>
                    <div className="ascent-tiles">
                      <div><Tile sheet={sheets.ascent} column={0} row={start === 0 ? level.heldOut : level.seen} /><span className="exhibit-label">Image</span></div>
                      <div><Tile sheet={sheets.ascent} column={ascentColumns[step]} row={start === 0 ? level.heldOut : level.seen} /><span className="exhibit-label">{specs.ascent.steps[step].label}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Shades title="Ascents whose prototype keeps the color pair of the image they start from, by noise level t"
              columns={colorPairLevels.map(String)}
              rows={colorPairs.map(start => ({ name: start.start, cells: start.kept.map(share => ({ text: `${share.toFixed(1)}%`, share: share / 100 })) }))} />
          </div>
        )
      }}
    </Exhibit>
  )
}

/* The eight prototypes selected for the query, their per-dimension weights, and the mean of their product of experts. */

function Weights() {
  return (
    <Exhibit id="weights" spec={specs.weights} essay={essay}>
      {() => (
        <div className="weights" aria-hidden="true">
          <div className="weights-rows">
            {([['Prototype', 2], ['Weights', 3]] as const).map(([name, row]) => (
              <div className="weights-row" key={name}>
                <span className="exhibit-label">{name}</span>
                <div className="weights-tiles">{eight.map(column => <Tile key={column} sheet={sheets.compose} column={column} row={row} />)}</div>
              </div>
            ))}
          </div>
          <div className="weights-mean">
            <span className="exhibit-label">Mean of the product of experts</span>
            <Tile sheet={sheets.compose} column={0} row={5} />
          </div>
        </div>
      )}
    </Exhibit>
  )
}

/* One query, three of its prototypes, and five samples of each method. On ColorMNIST the grid shows the pair each method's samples have. */

const methods = ['Ours', 'Comp. 1', 'Comp. 3', 'SDEdit'] as const
const classes = ['Held-out class: digit 0, green on deep red', 'Held-out class: Big Lips, Blond Hair, No Beard, Oval Face, Smiling, Wavy Hair'] as const

function Samples() {
  return (
    <Exhibit id="samples" spec={specs.samples} essay={essay}>
      {({ tab }) => {
        const sheet = tab === 0 ? sheets.colormnist : sheets.celeba
        return (
          <div className="samples" data-grid={tab === 0 || undefined}>
            {tab === 0 && <Pairs
              marks={[
                { ...queryPair, kind: 'made', content: <span className="pair-names"><b>Ours</b><span>SDEdit</span></span> },
                { row: 2, column: 0, kind: 'reached', content: <span className="pair-names"><span>Comp. 1</span></span> },
                { row: 1, column: 2, kind: 'reached', content: <span className="pair-names"><span>Comp. 3</span></span> },
              ]}
              label="The samples of our method and of SDEdit have the held-out pair of the query, green on deep red. The samples of Comp. 1 have a seen pair with the same background, cyan on deep red. The samples of Comp. 3 have a seen pair with the same digit color, green on dark purple." />}
            <div className="samples-tiles" aria-hidden="true">
              <p className="samples-class">{classes[tab]}</p>
              <div className="samples-grid">
                <div className="samples-column samples-query">
                  <span className="exhibit-label">Query</span>
                  <Tile sheet={sheet} column={0} row={0} />
                  <span className="exhibit-label">Prototypes</span>
                  {[1, 2, 3].map(row => <Tile key={row} sheet={sheet} column={0} row={row} />)}
                </div>
                {methods.map((method, index) => (
                  <div className="samples-column" key={method} data-ours={index === 0 || undefined}>
                    <span className="exhibit-label">{method}</span>
                    {[0, 1, 2, 3, 4].map(row => <Tile key={row} sheet={sheet} column={index + 1} row={row} />)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }}
    </Exhibit>
  )
}

/* Attribute correctness against KID: SDEdit over its noise level, our method over the scale of the product's variance. */

const axis = (name: string, min: number, max: number, ticks: readonly number[], more: Partial<FrontierAxis> = {}): FrontierAxis => ({ name, min, max, ticks, ...more })
type Places = Readonly<Record<string, FrontierPlace>>

function tradeoffPoints(benchmark: 'colormnist' | 'celeba', places: Places): FrontierPoint[] {
  const data = tradeoff[benchmark]
  return [
    ...data.sdedit.map((point, index) => ({
      label: `SDEdit, t0 = ${point.setting}`,
      name: index === 0 ? `SDEdit, t0 = ${point.setting}` : String(point.setting),
      x: point.correctness, y: point.kid, path: 'sdedit', minor: true, place: places[`sdedit-${point.setting}`],
    })),
    ...data.oursOverScale.map((point, index) => ({
      label: `Ours with K = 5, S = ${point.setting}`,
      name: index === 0 ? `S = ${point.setting}` : String(point.setting),
      x: point.correctness, y: point.kid, path: 'ours', ours: true, minor: true, place: places[`scale-${point.setting}`],
    })),
    { label: 'Ours', x: data.ours.correctness, y: data.ours.kid, ours: true, place: places.ours },
  ]
}

const kid = (min: number, max: number, ticks: readonly number[]) => axis('KID per query batch', min, max, ticks, { unit: '', digits: 3, tickLabels: ticks.map(tick => tick.toFixed(2)) })

function Results() {
  return (
    <Exhibit id="results" spec={specs.results} essay={essay}>
      {({ tab }) => tab === 0
        ? <Frontier title="ColorMNIST, 40 held-out classes. A lower KID is better." frontier={false}
          x={axis('Attribute correctness', 89.5, 93.4, [90, 91, 92, 93])} y={kid(.066, .111, [.07, .08, .09, .10, .11])}
          points={tradeoffPoints('colormnist', {
            'sdedit-50': 'w', 'sdedit-100': 'w', 'sdedit-150': 'w', 'sdedit-200': 'nw', 'sdedit-250': 'n', 'sdedit-300': 'n',
            'scale-1': 'e', 'scale-2': 'sw', 'scale-3': 's', 'scale-4': 's', 'scale-6': 's', ours: 'se',
          })} />
        : <Frontier title="CelebA, 23 held-out classes. A lower KID is better." frontier={false}
          x={axis('Attribute correctness', 73.2, 78.8, [74, 75, 76, 77, 78])} y={kid(.122, .226, [.14, .16, .18, .20, .22])}
          points={tradeoffPoints('celeba', {
            'sdedit-50': 'w', 'sdedit-100': 'e', 'sdedit-150': 'nw', 'sdedit-200': 'nw', 'sdedit-250': 'nw', 'sdedit-300': 'nw', 'sdedit-400': 'nw', 'sdedit-500': 'n',
            'scale-1': 's', 'scale-16': 's', 'scale-64': 's', ours: 'se',
          })} />}
    </Exhibit>
  )
}

/* Attribute correctness against the number of selected prototypes, with and without ascents from the query. */

function countPoints(benchmark: 'colormnist' | 'celeba'): FrontierPoint[] {
  const data = prototypeCount[benchmark]
  return [
    ...data.withQuery.map((value, index) => ({
      label: `Pool with ascents from the query, K = ${prototypeCounts[index]}`,
      name: index === 0 ? 'Pool with ascents from the query' : '',
      x: index, y: value, path: 'with', ours: true, minor: true, place: 'se' as const,
    })),
    ...data.withoutQuery.map((value, index) => ({
      label: `No ascent from the query, K = ${prototypeCounts[index]}`,
      name: index === 0 ? 'No ascent from the query' : '',
      x: index, y: value, path: 'without', minor: true, place: 'se' as const,
    })),
  ]
}

const countAxis = axis('Number of prototypes K', -.35, 5.35, [0, 1, 2, 3, 4, 5], { unit: '', tickLabels: prototypeCounts.map(String), say: position => String(prototypeCounts[position]) })
const level = (benchmark: 'colormnist' | 'celeba', id: string) => mainResults[benchmark].find(result => result.id === id)!.correctness

function Count() {
  return (
    <Exhibit id="number" spec={specs.number} essay={essay}>
      {({ tab }) => {
        const benchmark = tab === 0 ? 'colormnist' : 'celeba'
        return <Frontier title={tab === 0 ? 'ColorMNIST, 40 held-out classes' : 'CelebA, 23 held-out classes'} frontier={false}
          x={countAxis} y={tab === 0 ? axis('Attribute correctness', 28, 100, [40, 60, 80, 100]) : axis('Attribute correctness', 56, 80.5, [60, 65, 70, 75, 80])}
          lines={[{ y: level(benchmark, 'sdedit-50'), name: 'Near copy of the query' }, { y: level(benchmark, 'comp-1'), name: 'Comp. 1' }]}
          points={countPoints(benchmark)} />
      }}
    </Exhibit>
  )
}

/** Draws one of the essay's figures. */
export function drawComposition(id: string, lead: boolean): ReactNode {
  if (id === 'compose') return <Compose lead={lead} />
  if (id === 'modes') return <Modes />
  if (id === 'levels') return <Levels />
  if (id === 'sharing') return <Sharing />
  if (id === 'ascent') return <Ascent />
  if (id === 'weights') return <Weights />
  if (id === 'samples') return <Samples />
  if (id === 'results') return <Results />
  if (id === 'number') return <Count />
  return null
}
