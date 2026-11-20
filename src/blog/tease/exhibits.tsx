import type { ReactNode } from 'react'
import Exhibit from '../essay/Exhibit'
import { Curves, Readout, type CurveSeries } from '../essay/Curves'
import { Columns } from '../essay/Columns'
import { essayType } from '../essay/format'
import { teaseEssay } from './article'
import {
  atomLevel, budgetRatios, budgets, carriedOver, compositeLevel, continualLearning, firstMove, functions, models, scriptedAgents, share, shownBefore, stepCounts,
  type ModelId,
} from './evidence'
import './exhibits.css'

/* The page's figures. The page opens with the main results (`Results`, after the
   curves it draws). The pictures are the renders the agent receives on a table
   (public/blog-assets/tease/, cut by tools/tease_assets.py in the author's
   papers-2026-11 folder). The charts read their numbers from evidence.ts. In
   every chart a model has the colour it has in the paper's figures. The model
   chosen above a chart is the heavy one and carries its numbers. */

const essay = teaseEssay
const specs = teaseEssay.exhibits
const assets = '/blog-assets/tease'
// Under a column a name may stand on two lines. It does not break inside GPT-6.2.
const names = models.map(model => essayType(model.name))
const shortNames = ['Astra', 'Fable', 'Sol', 'Opus'] as const
// The colours of the four models, set in exhibits.css from the palette of the paper's figures.
const colors = ['var(--tease-astra)', 'var(--tease-fable)', 'var(--tease-sol)', 'var(--tease-opus)'] as const
const percent = (value: number) => `${value.toFixed(1)}%`
const hundred = { min: 0, max: 100, ticks: [0, 25, 50, 75, 100] } as const

/** One cell of a sheet of pictures. A sheet is a grid of square cells. */
function Cell({ sheet, columns, rows, index }: { sheet: string, columns: number, rows: number, index: number }) {
  const at = (position: number, count: number) => count > 1 ? position / (count - 1) * 100 : 0
  return <span className="tease-cell" style={{
    backgroundImage: `url(${assets}/${sheet})`,
    backgroundSize: `${columns * 100}% ${rows * 100}%`,
    backgroundPosition: `${at(index % columns, columns)}% ${at(Math.floor(index / columns), rows)}%`,
  }} />
}

/* A composite table of five steps from above, before each move of its plan. The blue rings are
   the tool and the target of the move. Beside the picture are their close-ups, named for the reader. */

type Named = { letter: string, name: string, cell: number, at: readonly [number, number] }
const plan: readonly { move: string, tools: readonly Named[], targets: readonly Named[] }[] = [
  { move: 'use(E, A)', tools: [{ letter: 'E', name: 'bent knitting needle', cell: 0, at: [54.5, 87.6] }], targets: [{ letter: 'A', name: 'cabinet that opens by a ring', cell: 1, at: [62.5, 24.2] }] },
  { move: 'use(O, R)', tools: [{ letter: 'O', name: 'steel ruler', cell: 2, at: [44.4, 37.6] }], targets: [{ letter: 'R', name: 'paint can', cell: 3, at: [26.2, 88.2] }] },
  { move: 'use(D, M)', tools: [{ letter: 'D', name: 'iron weight', cell: 4, at: [16.7, 80] }], targets: [{ letter: 'M', name: 'block of ice', cell: 5, at: [24, 62] }] },
  { move: 'tie(G, H, K)', tools: [{ letter: 'G', name: 'rubber band', cell: 6, at: [24.2, 62.6] }], targets: [{ letter: 'H', name: 'dowel', cell: 7, at: [42.9, 68] }, { letter: 'K', name: 'drumstick', cell: 8, at: [54.2, 66.2] }] },
  { move: 'use(W, N)', tools: [{ letter: 'W', name: 'the two sticks, tied', cell: 9, at: [47.3, 75.4] }], targets: [{ letter: 'N', name: 'high shelf with the ball L', cell: 10, at: [81.9, 23.4] }] },
]

function Named({ item }: { item: Named }) {
  return (
    <span className="tease-named">
      <Cell sheet="plan-tiles.webp" columns={4} rows={3} index={item.cell} />
      <span className="exhibit-label"><b>{item.letter}</b> {item.name}</span>
    </span>
  )
}

function Table() {
  return (
    <Exhibit id="table" spec={specs.table} essay={essay} rest={0} dwell={[4600, 3600, 3600, 4000, 4400]}>
      {({ step }) => {
        const now = plan[step]
        return (
          <div className="tease-table" role="img" aria-label={specs.table.steps[step].say}>
            <div className="tease-picture">
              {plan.map((_, index) => <img key={index} src={`${assets}/plan-${index}.webp`} alt="" width={1320} height={1078} data-shown={index === step || undefined}
                loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />)}
              {[...now.tools, ...now.targets].map(item => <span key={`${step}-${item.letter}`} className="tease-ring" style={{ left: `${item.at[0]}%`, top: `${item.at[1]}%` }} />)}
            </div>
            <div className="tease-side" aria-hidden="true">
              <div>
                <p className="exhibit-label">Goal</p>
                <p className="tease-line">get L down from N.</p>
              </div>
              <div>
                <p className="exhibit-label">Move {step + 1} of {plan.length}</p>
                <p className="tease-line tease-move">{now.move}</p>
              </div>
              <div className="tease-uses" key={step}>
                {now.tools.map(item => <Named key={item.letter} item={item} />)}
                <span className="tease-on">on</span>
                {now.targets.map(item => <Named key={item.letter} item={item} />)}
              </div>
            </div>
          </div>
        )
      }}
    </Exhibit>
  )
}

/* The eight atoms. For each function, a non-typical object that has the attribute and a similar-looking object that lacks it. */

const atoms = [
  { name: 'cut', attribute: 'sharp edge', has: 'stone flake', lacks: 'smooth pebble' },
  { name: 'hook', attribute: 'hooked end', has: 'tent peg', lacks: 'straight peg' },
  { name: 'poke', attribute: 'long rigid shaft', has: 'clothes pole', lacks: 'snapped pole' },
  { name: 'heat', attribute: 'hot or burning', has: 'burning oil lamp', lacks: 'lamp that is out' },
  { name: 'pound', attribute: 'heavy and hard', has: 'dumbbell', lacks: 'inflatable dumbbell' },
  { name: 'contain', attribute: 'hollow and watertight', has: 'rain boot', lacks: 'clog with holes' },
  { name: 'tie', attribute: 'long and flexible', has: 'belt', lacks: 'belt cut into pieces' },
  { name: 'pry', attribute: 'thin, flat, rigid tip', has: 'coin', lacks: 'chocolate coin' },
] as const

function Atoms() {
  return (
    <Exhibit id="atoms" spec={specs.atoms} essay={essay}>
      {() => (
        <div className="tease-atoms" role="img" aria-label={specs.atoms.description}>
          {[0, 4].map(start => (
            <div className="tease-atoms-block" key={start} aria-hidden="true">
              {atoms.slice(start, start + 4).map(atom => (
                <div className="tease-atom-head" key={atom.name}>
                  <p className="tease-atom-name">{atom.name}</p>
                  <p className="exhibit-label">{atom.attribute}</p>
                </div>
              ))}
              <p className="exhibit-label tease-atoms-row"><span>Has the attribute</span></p>
              {atoms.slice(start, start + 4).map((atom, index) => (
                <div className="tease-named" data-has key={atom.name}>
                  <Cell sheet="atoms.webp" columns={8} rows={2} index={start + index} />
                  <span className="exhibit-label">{atom.has}</span>
                </div>
              ))}
              <p className="exhibit-label tease-atoms-row"><span>Looks alike and lacks it</span></p>
              {atoms.slice(start, start + 4).map((atom, index) => (
                <div className="tease-named" key={atom.name}>
                  <Cell sheet="atoms.webp" columns={8} rows={2} index={8 + start + index} />
                  <span className="exhibit-label">{atom.lacks}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </Exhibit>
  )
}

/* What the agent receives on a table, and one turn: the pictures and the text, a move carried out by the robot hand, the result. */

const turnText = [
  ['Goal: get L down from N.', 'The hand can pick up: B, E, F, H, I, J, K, P, Q, S, T, U.', 'Fixed in place: A, N.', 'Out of the hand’s reach: G in M, L in N, O in A.'],
  ['use(E, A)'],
  ['Result: Something changed.', 'The hand can pick up: B, E, F, H, I, J, K, O, P, Q, S, T, U.', 'Out of the hand’s reach: G in M, L in N.'],
] as const

function Turn() {
  return (
    <Exhibit id="turn" spec={specs.turn} essay={essay} rest={0} dwell={[4200, 4200, 4600]}>
      {({ step }) => (
        <div className="tease-turn" role="img" aria-label={specs.turn.steps[step].say}>
          <div className="tease-turn-views" aria-hidden="true">
            <p className="exhibit-label">{step === 1 ? 'Four moments of the move' : 'Four views of the table'}</p>
            <div className="tease-frame" style={{ aspectRatio: '4 / 3' }}>
              {['views-0.webp', 'hand.webp', 'views-1.webp'].map((file, index) => <img key={file} src={`${assets}/${file}`} alt="" width={1600} height={1200}
                data-shown={index === step || undefined} loading="lazy" decoding="async" />)}
            </div>
          </div>
          <div className="tease-turn-closeups" aria-hidden="true">
            <p className="exhibit-label">Every object close up, under its letter</p>
            <div className="tease-frame" style={{ aspectRatio: '5 / 4' }}>
              {['closeups-0.webp', 'closeups-1.webp'].map((file, index) => <img key={file} src={`${assets}/${file}`} alt="" width={1200} height={960}
                data-shown={(step === 2 ? 1 : 0) === index || undefined} loading="lazy" decoding="async" />)}
            </div>
          </div>
          <div className="tease-turn-text" aria-hidden="true">
            <p className="exhibit-label">{['The text', 'The agent’s move', 'The text that follows'][step]}</p>
            {turnText[step].map(line => <p className="tease-line" data-move={step === 1 || undefined} key={line}>{line}</p>)}
          </div>
        </div>
      )}
    </Exhibit>
  )
}

/* A pair of tables of the atom level. The two tables differ in one object, B. */

const pairObjects = [
  { letter: 'A', name: 'toy knife' }, { letter: 'B', name: 'stone flake', counterpart: 'smooth pebble' }, { letter: 'C', name: 'putty knife' },
  { letter: 'D', name: 'bladeless scissors' }, { letter: 'G', name: 'spoon' }, { letter: 'H', name: 'fishing line' }, { letter: 'I', name: 'plastic lid' },
] as const

function Pair() {
  return (
    <Exhibit id="pair" spec={specs.pair} essay={essay} rest={2} dwell={[4600, 4600, 5200]}>
      {({ step }) => (
        <div className="tease-pair" role="img" aria-label={specs.pair.steps[step].say}>
          <div className="tease-frame tease-pair-front" style={{ aspectRatio: '2 / 1' }} aria-hidden="true">
            {['pair-S.webp', 'pair-N.webp'].map((file, index) => <img key={file} src={`${assets}/${file}`} alt="" width={1240} height={620}
              data-shown={(step === 1 ? 1 : 0) === index || undefined} loading="lazy" decoding="async" />)}
          </div>
          <p className="tease-line" aria-hidden="true"><span className="exhibit-label">Goal</span> get F out of E.</p>
          {(['Positive table', 'Negative table'] as const).map((table, row) => (
            <div className="tease-pair-row" key={table} data-quiet={(step === 0 && row === 1) || (step === 1 && row === 0) || undefined} aria-hidden="true">
              <p className="tease-pair-head"><span>{table}</span><span className="tease-line">{row === 0 ? 'use(B, E)' : 'none()'}</span></p>
              <div className="tease-pair-objects">
                {pairObjects.map((object, index) => (
                  <div className="tease-named" key={object.letter} data-has={object.letter === 'B' || undefined}>
                    <Cell sheet="pair-tiles.webp" columns={7} rows={2} index={row * 7 + index} />
                    {(row === 0 || 'counterpart' in object) && <span className="exhibit-label">{row === 1 && 'counterpart' in object ? object.counterpart : object.name}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Exhibit>
  )
}

/* One play of the composite table of five steps, read at two budgets. */

const play = [
  { move: 'use(H, L)', step: false }, { move: 'use(H, N)', step: false }, { move: 'use(U, M)', step: false },
  { move: 'use(E, A)', step: true }, { move: 'use(O, R)', step: true }, { move: 'use(D, M)', step: true }, { move: 'tie(G, H, K)', step: true }, { move: 'use(W, L)', step: true },
] as const

function Play() {
  return (
    <Exhibit id="play" spec={specs.play} essay={essay} rest={2} dwell={[4600, 4200, 5200]}>
      {({ step }) => {
        const budget = step === 1 ? 5 : 10
        return (
          <div className="tease-play" role="img" aria-label={specs.play.steps[step].say}>
            <p className="tease-play-result" aria-hidden="true">
              {step === 0 ? 'Eight moves. The goal is reached at move 8.' : step === 1 ? 'Budget k = 5 moves: not solved' : 'Budget twice k = 10 moves: solved'}
            </p>
            <ol className="tease-moves" aria-hidden="true">
              {Array.from({ length: 10 }, (_, index) => {
                const made = play[index]
                return (
                  <li key={index} data-in={(step === 0 ? index < play.length : index < budget) || undefined} data-budget={(step > 0 && index < budget) || undefined}>
                    <span className="tease-square" data-kind={!made ? 'none' : index === play.length - 1 ? 'goal' : made.step ? 'step' : 'nothing'} />
                    <span className="exhibit-label">{made?.move ?? ''}</span>
                  </li>
                )
              })}
            </ol>
            <p className="exhibit-label tease-play-key" aria-hidden="true">
              <span><span className="tease-square" data-kind="nothing" />nothing happens</span>
              <span><span className="tease-square" data-kind="step" />plan step</span>
              <span><span className="tease-square" data-kind="goal" />plan step that reaches the goal</span>
            </p>
          </div>
        )
      }}
    </Exhibit>
  )
}

/* Test-time continual learning: a sequence of eight stages, the notes between them, and the same tables alone. */

const stageOrder = ['cut', 'pry', 'poke', 'pound', 'contain', 'tie', 'heat', 'hook'] as const

function Stages() {
  return (
    <Exhibit id="stages" spec={specs.stages} essay={essay} rest={3} dwell={[3800, 5200, 5200, 4600]}>
      {({ step }) => (
        <div className="tease-stages" role="img" aria-label={specs.stages.steps[step].say}>
          {(['With notes', 'Alone'] as const).map((lane, row) => (
            <div className="tease-lane" key={lane} data-alone={row === 1 || undefined} data-quiet={(row === 1 && step < 3) || undefined} aria-hidden="true">
              <p className="exhibit-label">{lane}</p>
              <ol>
                {stageOrder.map((name, index) => (
                  <li key={name} data-on={(row === 1 ? step === 3 : step === 0 ? index === 0 : step === 1 ? index <= 1 : true) || undefined}
                    data-notes={(row === 0 && index > 0 && (step === 1 ? index === 1 : step >= 2)) || undefined}>
                    <span className="tease-stage">{index + 1}</span>
                    <span className="exhibit-label">{row === 1 ? '' : index === 0 ? name : `+ ${name}`}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
          <p className="exhibit-label tease-stages-key" aria-hidden="true">
            A number is the number of steps of the tables of a stage. <span className="tease-notes-mark" /> The agent rewrites its notes.
          </p>
        </div>
      )}
    </Exhibit>
  )
}

/* Results. In every chart a model has its colour, and the model chosen above the drawing is the heavy one. */

const ours = (tab: number, extra: Partial<CurveSeries> = {}) => (model: typeof models[number], index: number): Pick<CurveSeries, 'name' | 'short' | 'ours'> & Partial<CurveSeries> => ({
  name: model.name, short: shortNames[index], ours: index === tab, color: colors[index], ...extra,
})

function Pairs() {
  const measures = ['positive', 'negative', 'pairs'] as const
  return (
    <Exhibit id="pairs" spec={specs.pairs} essay={essay} rest={2} dwell={[4200, 4200, 4800]} tabColors={colors}>
      {({ step, tab }) => {
        const measure = measures[step]
        const title = ['Positive tables whose first move reaches the goal', 'Negative tables whose first move is none()', 'Pairs with both tables right'][step]
        return (
          <div className="tease-chart">
            <Readout figures={[{ value: percent(share(atomLevel[models[tab].id][measure])), label: title }]} />
            <Columns title={`${title}, by model`} axis={{ name: step === 2 ? 'Pairs right (%)' : 'Tables right (%)', ...hundred }} names={names} short={shortNames} ours={tab} colors={colors}
              groups={[{ name: title, values: models.map(model => share(atomLevel[model.id][measure])) }]} />
          </div>
        )
      }}
    </Exhibit>
  )
}

/** The recorded moves of the four models on the pair of the function cut shown in `Pair`. */
const pairPlays: Record<ModelId, { positive: readonly string[], negative: readonly string[] }> = {
  astra: { positive: ['use(B, E)'], negative: ['none()'] },
  fable: { positive: ['use(B, E)'], negative: ['use(D, E)', 'use(C, E)', 'use(B, C)', 'use(B, D)', 'use(A, E)', 'none()'] },
  sol: { positive: ['use(B, E)'], negative: ['use(C, E)', 'use(D, E)', 'use(B, C)', 'none()'] },
  opus: { positive: ['use(B, E)'], negative: ['use(D, E)', 'use(C, E)', 'use(A, E)', 'none()'] },
}

function Moves() {
  const tables = [
    { key: 'positive', name: 'Positive table', hint: 'B is a sharp stone flake. The right move is use(B, E).', right: 'use(B, E)' },
    { key: 'negative', name: 'Negative table', hint: 'B is a smooth pebble. The right answer is none().', right: 'none()' },
  ] as const
  return (
    <Exhibit id="moves" spec={specs.moves} essay={essay}>
      {() => (
        <div className="tease-plays">
          {tables.map(table => (
            <table key={table.key}>
              <caption><span className="tease-plays-name">{table.name}</span><span className="exhibit-label">{table.hint}</span></caption>
              <thead className="site-hidden"><tr><th scope="col">Model</th><th scope="col">Moves</th><th scope="col">Result</th></tr></thead>
              <tbody>
                {models.map(model => {
                  const moves = pairPlays[model.id][table.key]
                  const right = moves[0] === table.right
                  return (
                    <tr key={model.id} data-right={right || undefined}>
                      <th scope="row">{model.name}</th>
                      <td className="tease-line">{moves.map((move, index) => <span key={index} data-first={index === 0 || undefined}>{move}</span>)}</td>
                      <td>{right ? 'right' : 'wrong'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ))}
        </div>
      )}
    </Exhibit>
  )
}

function Functions() {
  return (
    <Exhibit id="functions" spec={specs.functions} essay={essay} tabColors={colors}>
      {({ tab }) => (
        <div className="tease-chart">
          <Curves title="Negative tables whose first move is none(), by function" ranges
            x={{ name: 'Function', min: -.5, max: functions.length - .5, ticks: functions.map((_, index) => index), tickLabels: functions, stagger: true }}
            y={{ name: 'Negative tables right (%)', ...hundred }}
            series={models.map((model, index) => ({
              ...ours(tab, { loose: true })(model, index),
              values: functions.map(name => { const count = atomLevel[model.id].byFunction[name].negative; return count ? share(count) : null }),
            }))} />
        </div>
      )}
    </Exhibit>
  )
}

/** The cubic through the first and the last value that is closest to the values between, as the paper's figure draws a share that rises with the budget. */
function smooth(xs: readonly number[], ys: readonly number[], count = 41) {
  const last = xs.length - 1
  const ts = xs.map(x => (x - xs[0]) / (xs[last] - xs[0]))
  let uu = 0, uv = 0, vv = 0, ur = 0, vr = 0
  ts.forEach((t, index) => {
    const u = t * (1 - t)
    const v = t * t * (1 - t)
    const rest = ys[index] - ys[0] - (ys[last] - ys[0]) * t
    uu += u * u; uv += u * v; vv += v * v; ur += u * rest; vr += v * rest
  })
  const det = uu * vv - uv * uv
  const a = (ur * vv - vr * uv) / det
  const b = (vr * uu - ur * uv) / det
  const at = Array.from({ length: count }, (_, index) => xs[0] + index / (count - 1) * (xs[last] - xs[0]))
  const values = at.map((_, index) => { const t = index / (count - 1); return ys[0] + (ys[last] - ys[0]) * t + t * (1 - t) * (a + b * t) })
  return { at, values, marks: [0, count - 1] }
}

const modelCurves = models.map(model => smooth(budgetRatios, compositeLevel[model.id].curve))
const planCurve = smooth(budgetRatios, scriptedAgents.knowsThePlan.curve)
const randomCurve = smooth(budgetRatios, scriptedAgents.randomMoves.curve)

/* Opening figure. The main results of the four models, one drawing per level: pairs of the atom level with
   both tables right, composite tables solved within a budget from k to twice k moves, and composite tables
   solved with notes at each stage of test-time continual learning. The path walks the three levels, and the
   blue rule marks the one it stands at. On a narrow screen only that level is shown. The lines of a small
   drawing cross one another, so the numbers of the model in blue stand above the drawing and not on its line. */

const thirds = { min: 0, max: 100, ticks: [0, 50, 100] } as const

function Results({ lead }: { lead: boolean }) {
  return (
    <Exhibit id="results" spec={specs.results} essay={essay} lead={lead} rest={0} dwell={[7000, 7000, 7600]} tabColors={colors}>
      {({ step, tab }) => {
        const model = models[tab].id
        const level = compositeLevel[model]
        const run = continualLearning[model].k
        return (
          <div className="tease-results">
            <div className="tease-result" data-focus={step === 0 || undefined}>
              <p className="tease-result-name">Atom level</p>
              <Readout figures={[{ value: percent(share(atomLevel[model].pairs)), label: 'pairs with both tables right' }]} />
              <Columns title="Pairs of the atom level with both tables right, by model" axis={{ name: 'Pairs right (%)', ...thirds }} names={names} short={shortNames} ours={tab} colors={colors}
                groups={[{ name: 'Pairs with both tables right', values: models.map(item => share(atomLevel[item.id].pairs)) }]} />
            </div>
            <div className="tease-result" data-focus={step === 1 || undefined}>
              <p className="tease-result-name">Composite level</p>
              <Readout figures={[
                { value: percent(100 * level.k / level.tables), label: 'solved within k moves' },
                { value: percent(100 * level.twiceK / level.tables), label: 'within twice k moves' },
              ]} />
              <Curves title="Composite tables solved within a budget of moves" digits={1} nameGap={11}
                x={{ name: 'Budget of moves', min: .94, max: 2.06, ticks: [1, 2], tickLabels: ['k moves', 'twice k moves'] }}
                y={{ name: 'Tables solved (%)', ...thirds }}
                series={models.map((item, index) => ({ ...ours(tab, { numbers: false })(item, index), ...modelCurves[index] }))} />
            </div>
            <div className="tease-result" data-focus={step === 2 || undefined}>
              <p className="tease-result-name">Test-time continual learning</p>
              <Readout figures={[
                { value: percent(100 * run.notes / run.tables), label: 'solved within k moves, with notes' },
                { value: percent(100 * run.alone / run.tables), label: 'of the same tables, alone' },
              ]} />
              <Curves title="Composite tables solved within k moves with notes, by stage" digits={0} nameGap={11}
                x={{ name: 'Stage (number of steps)', min: 1.6, max: 8.4, ticks: stepCounts }}
                y={{ name: 'Solved with notes (%)', ...thirds }}
                series={models.map((item, index) => ({
                  ...ours(tab, { numbers: false })(item, index),
                  values: stepCounts.map(stage => { const [notes, , tables] = continualLearning[item.id].k.stages[stage]; return 100 * notes / tables }),
                }))} />
            </div>
          </div>
        )
      }}
    </Exhibit>
  )
}

function Budget() {
  return (
    <Exhibit id="budget" spec={specs.budget} essay={essay} rest={2} dwell={[4800, 4800, 4800]} tabColors={colors}>
      {({ step, tab }) => {
        const level = compositeLevel[models[tab].id]
        return (
          <div className="tease-chart">
            <Readout figures={[
              { value: percent(100 * level.k / level.tables), label: 'solved within k moves' },
              { value: percent(100 * level.twiceK / level.tables), label: 'solved within twice k moves' },
            ]} />
            <Curves title="Composite tables solved within a budget of moves" digits={1}
              x={{ name: 'Budget of moves', min: .94, max: 2.06, ticks: [1, 2], tickLabels: ['k moves', 'twice k moves'] }}
              y={{ name: 'Tables solved (%)', ...hundred }}
              series={[
                ...models.map((model, index) => ({ ...ours(tab)(model, index), ...modelCurves[index] })),
                { name: 'Knows the plan', short: 'Plan', dashed: true, numbers: true, under: [planCurve.at.length - 1], hidden: step < 1, ...planCurve },
                { name: 'Oracle', dashed: true, hidden: step < 2, at: [1, 2], values: [100, 100], marks: [] },
                { name: 'Random moves', short: 'Random', dashed: true, hidden: step < 2, ...randomCurve, marks: [] },
              ]} />
          </div>
        )
      }}
    </Exhibit>
  )
}

function Steps() {
  return (
    <Exhibit id="steps" spec={specs.steps} essay={essay} rest={0} dwell={[5200, 4600]} tabColors={colors}>
      {({ step, tab }) => {
        const budget = step === 0 ? 'k' : 'twiceK'
        const model = models[tab].id
        const solved = (id: ModelId, steps: typeof stepCounts[number]) => 100 * compositeLevel[id].byK[steps][budget] / compositeLevel[id].byK[steps].tables
        const first = share(atomLevel[model].positive) / 100
        return (
          <div className="tease-chart">
            <Readout figures={[
              { value: percent(solved(model, 2)), label: 'of the tables of two steps' },
              { value: percent(solved(model, 8)), label: 'of the tables of eight steps' },
            ]} />
            <Curves title={`Composite tables solved within ${step === 0 ? 'k' : 'twice k'} moves, by the number of steps`} digits={1}
              x={{ name: 'Number of steps k', min: 1.6, max: 8.4, ticks: stepCounts }}
              y={{ name: `Tables solved within ${step === 0 ? 'k' : 'twice k'} moves (%)`, ...hundred }}
              series={[
                ...models.map((item, index) => ({ ...ours(tab)(item, index), values: stepCounts.map(steps => solved(item.id, steps)) })),
                { name: 'k one-move tables', short: 'One move', dashed: true, color: colors[tab], hidden: step > 0, marks: [], values: stepCounts.map(steps => 100 * first ** steps) },
              ]} />
          </div>
        )
      }}
    </Exhibit>
  )
}

/** A difference in points, with its sign, and with its standard error where it has one. */
const signed = (value: number, digits: number) => { const text = Math.abs(value).toFixed(digits); return `${Number(text) === 0 ? '' : value > 0 ? '+' : '−'}${text}` }
const points = (value: number, error?: number) => `${signed(value, 1)}${error === undefined ? '' : ` ± ${error.toFixed(1)}`}`

function Gain() {
  return (
    <Exhibit id="gain" spec={specs.gain} essay={essay} rest={2} dwell={[5200, 4200, 5600]} tabColors={colors}>
      {({ step, tab }) => {
        const run = continualLearning[models[tab].id][budgets[step]]
        const budget = ['k', '10', 'twice k'][step]
        const notes = stepCounts.map(stage => 100 * run.stages[stage][0] / run.stages[stage][2])
        const alone = stepCounts.map(stage => 100 * run.stages[stage][1] / run.stages[stage][2])
        // At a stage the higher of the two values is written above its point and the lower under it.
        const lower = stepCounts.map((_, index) => notes[index] < alone[index] ? index : -1).filter(index => index >= 0)
        return (
          <div className="tease-chart">
            <Readout figures={[
              { value: percent(100 * run.notes / run.tables), label: `solved within ${budget} moves, with notes` },
              { value: percent(100 * run.alone / run.tables), label: 'of the same tables, alone' },
              { value: points(run.difference, run.error), label: 'points, paired difference' },
            ]} />
            <Curves title={`Composite tables solved within ${budget} moves with notes and alone, by stage: ${models[tab].name}`} digits={1} narrowDigits={0} band={[0, 1]}
              x={{ name: 'Stage (number of steps)', short: 'Stage', min: 1.6, max: 8.4, ticks: stepCounts }}
              // Room under the zero line, for the number of a point that lies on it.
              y={{ name: `Tables solved within ${budget} moves (%)`, ...hundred, min: -9 }}
              rows={[{ name: 'Gain (points)', short: 'Gain', values: stepCounts.map((_, index) => points(notes[index] - alone[index])), narrow: stepCounts.map((_, index) => signed(notes[index] - alone[index], 0)) }]}
              series={[
                { name: 'With notes', short: 'Notes', ours: true, color: colors[tab], under: lower, values: notes },
                { name: 'Alone', numbers: true, under: stepCounts.map((_, index) => index).filter(index => !lower.includes(index)), values: alone },
              ]} />
          </div>
        )
      }}
    </Exhibit>
  )
}

const remaining = [1, 2, 3, 4, 5, 6, 7, 8] as const

function First() {
  return (
    <Exhibit id="first" spec={specs.first} essay={essay} rest={0} dwell={[5200, 5200]} tabColors={colors}>
      {({ step, tab }) => {
        const model = firstMove[models[tab].id]
        return (
          <div className="tease-chart">
            {step === 0
              ? <>
                <Readout figures={[
                  { value: percent(share(model.bySteps[1])), label: 'with one step still to do' },
                  { value: percent(share(model.bySteps[8])), label: 'with eight steps still to do' },
                ]} />
                <Curves title="States at which the first move is a plan step, by the number of steps still to do" digits={1}
                  x={{ name: 'Steps still to do', min: .6, max: 8.4, ticks: remaining }}
                  y={{ name: 'First move is a plan step (%)', ...hundred }}
                  series={models.map((item, index) => ({ ...ours(tab)(item, index), values: remaining.map(steps => share(firstMove[item.id].bySteps[steps])) }))} />
              </>
              : <>
                <Readout figures={[
                  { value: percent(share(model.byTool.freed)), label: 'tool freed by an earlier step' },
                  { value: percent(share(model.byTool.table)), label: 'tool on the table from the start' },
                ]} />
                <Columns title="Steps done at the first try, by where the tool of the step comes from" axis={{ name: 'Steps done at the first try (%)', ...hundred }}
                  names={names} short={shortNames} ours={tab} colors={colors}
                  groups={[
                    { name: 'On the table from the start', values: models.map(item => share(firstMove[item.id].byTool.table)) },
                    { name: 'Freed by an earlier step', values: models.map(item => share(firstMove[item.id].byTool.freed)) },
                    { name: 'Made by an earlier step', values: models.map(item => share(firstMove[item.id].byTool.made)) },
                  ]} />
              </>}
          </div>
        )
      }}
    </Exhibit>
  )
}

function Open() {
  return (
    <Exhibit id="open" spec={specs.open} essay={essay} tabColors={colors}>
      {({ tab }) => {
        const model = firstMove[models[tab].id].leftOpen
        return (
          <div className="tease-chart">
            <Readout figures={[
              { value: percent(share(model.makes)), label: 'of the steps that make a tool' },
              { value: percent(share(model.frees)), label: 'of the steps that free an object' },
            ]} />
            <Columns title="Reached steps left open when an unsolved table ends, by what the step does" axis={{ name: 'Reached steps left open (%)', max: 60, ticks: [0, 20, 40, 60] }}
              names={names} short={shortNames} ours={tab} colors={colors}
              groups={[
                { name: 'Frees an object', values: models.map(item => share(firstMove[item.id].leftOpen.frees)) },
                { name: 'Makes a tool', values: models.map(item => share(firstMove[item.id].leftOpen.makes)) },
              ]} />
          </div>
        )
      }}
    </Exhibit>
  )
}

const shownNames = { sameStep: 'Same step', sameTool: 'Same tool, other target', newTool: 'New tool, same function', newFunction: 'New function' } as const

function Shown() {
  return (
    <Exhibit id="shown" spec={specs.shown} essay={essay} rest={2} dwell={[4600, 4600, 5600]} tabColors={colors}>
      {({ step, tab }) => {
        const gain = (id: ModelId, shown: typeof shownBefore[number]) => { const [notes, alone, steps] = carriedOver[id][budgets[step]][shown]; return 100 * (notes - alone) / steps }
        const model = models[tab].id
        return (
          <div className="tease-chart">
            <Readout figures={[
              { value: points(gain(model, 'sameStep')), label: 'points on the same step' },
              { value: points(gain(model, 'newTool')), label: 'points on a new tool for a function shown before' },
            ]} />
            <Columns title={`Steps done at the first try, with notes minus the same tables alone, at the budget of ${['k', '10', 'twice k'][step]} moves`}
              axis={{ name: 'With notes minus alone (points)', min: -5, max: 35, ticks: [0, 10, 20, 30] }} names={names} short={shortNames} ours={tab} colors={colors} unit=" points" signed
              groups={shownBefore.map(shown => ({ name: shownNames[shown], values: models.map(item => gain(item.id, shown)) }))} />
          </div>
        )
      }}
    </Exhibit>
  )
}

/** Draws one of the page's figures. */
export function drawTease(id: string, lead: boolean): ReactNode {
  if (id === 'results') return <Results lead={lead} />
  if (id === 'table') return <Table />
  if (id === 'atoms') return <Atoms />
  if (id === 'turn') return <Turn />
  if (id === 'pair') return <Pair />
  if (id === 'play') return <Play />
  if (id === 'stages') return <Stages />
  if (id === 'pairs') return <Pairs />
  if (id === 'moves') return <Moves />
  if (id === 'functions') return <Functions />
  if (id === 'budget') return <Budget />
  if (id === 'steps') return <Steps />
  if (id === 'gain') return <Gain />
  if (id === 'first') return <First />
  if (id === 'open') return <Open />
  if (id === 'shown') return <Shown />
  return null
}
