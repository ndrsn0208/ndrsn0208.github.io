import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import Exhibit from '../essay/Exhibit'
import { Bars, PairedBars } from '../essay/Bars'
import { Frontier, type FrontierAxis, type FrontierPlace } from '../essay/Frontier'
import { scolEssay } from './article'
import { budgetResults, lengthResults, llamaResults, mmluResults, qwen27Results, shiftResults, squadResults, type StreamResult } from './evidence'
import { fisherPassages, fisherResults } from './fisher-evidence'
import Layers, { LayerValues, fill, say, written, type Cell } from './Layers'
import { storyExample } from './story-example'
import './exhibits.css'

const essay = scolEssay
const specs = scolEssay.exhibits

function Scale() {
  return <div className="layers-scale" aria-hidden="true"><span>Layer 1</span><span>28</span></div>
}

/* Opening figure: three contexts, consolidated one at a time. */

function Writing({ lead }: { lead: boolean }) {
  return (
    <Exhibit id="writing" spec={specs.writing} essay={essay} lead={lead} rest={4} dwell={[3400, 3400, 3000, 2800, 4200]}>
      {({ step }) => {
        const prompt = step < 3 ? storyExample.contexts[step].text : step === 4 ? storyExample.question : ''
        return (
          <div className="writing">
            <div className="writing-part">
              <p className="exhibit-label">Prompt</p>
              <p className="writing-prompt" data-empty={!prompt || undefined} key={prompt}>{prompt || <span className="site-hidden">The prompt is empty.</span>}</p>
            </div>
            <div className="writing-part">
              <p className="exhibit-label">Model</p>
              <Scale />
              {storyExample.contexts.map((context, index) => {
                const there = step >= index
                const cells = !there ? {} : fill(written[index], step === index ? 'on' : 'kept')
                return (
                  <div className="layer-row" key={context.id} data-there={there || undefined}>
                    <span className="layer-name">{context.label}</span>
                    <Layers cells={cells} label={there ? `${context.label} is consolidated into layers ${say(written[index])}.` : `${context.label} has not arrived.`} />
                  </div>
                )
              })}
            </div>
            <div className="writing-part writing-answer" data-there={step === 4 || undefined}>
              <p className="exhibit-label">Answer</p>
              <p className="writing-reply">{storyExample.answer}</p>
            </div>
          </div>
        )
      }}
    </Exhibit>
  )
}

/* Interference: the same layers, or different layers. */

function Interference() {
  const first = [4, 11, 18]
  const same = [4, 11, 23]
  const other = [7, 15, 23]
  return (
    <Exhibit id="interference" spec={specs.interference} essay={essay} rest={1}>
      {({ step }) => {
        const second = step === 1 ? same : other
        const overwritten = step === 1 ? first.filter(layer => same.includes(layer)) : []
        const firstCells = { ...fill(first, step === 0 ? 'on' : 'kept'), ...fill(overwritten, 'lost') }
        return (
          <div className="writing">
            <div className="writing-part">
              <Scale />
              <div className="layer-row" data-there>
                <span className="layer-name">Context 1</span>
                <Layers cells={firstCells} label={overwritten.length ? `Context 1 was consolidated into layers ${say(first)}. Layers ${say(overwritten)} have been overwritten.` : `Context 1 is consolidated into layers ${say(first)}.`} />
              </div>
              <div className="layer-row" data-there={step > 0 || undefined}>
                <span className="layer-name">Context 2</span>
                <Layers cells={step > 0 ? fill(second, 'on') : {}} label={step > 0 ? `Context 2 is consolidated into layers ${say(second)}.` : 'Context 2 has not arrived.'} />
              </div>
            </div>
          </div>
        )
      }}
    </Exhibit>
  )
}

/* One training step: ten candidate layer selections, one committed. The candidates are an example. */

/** The weight of the forgetting term in the SQuAD experiments. */
const lambda = 2
const candidates = [
  { layers: [1, 4, 8, 13, 19, 24, 26], acquisition: .58, forgetting: .155 },
  { layers: [0, 6, 10, 15, 21, 27], acquisition: .49, forgetting: .06 },
  { layers: [3, 5, 9, 12, 18, 22, 25, 27], acquisition: .71, forgetting: .20 },
  { layers: [2, 7, 11, 16, 20, 23, 26], acquisition: .74, forgetting: .055 },
  { layers: [1, 2, 3, 14, 15, 16], acquisition: .41, forgetting: .11 },
  { layers: [5, 10, 17, 20, 24, 27], acquisition: .55, forgetting: .045 },
  { layers: [0, 8, 9, 13, 21, 22, 25], acquisition: .63, forgetting: .135 },
  { layers: [4, 6, 12, 18, 19, 23], acquisition: .52, forgetting: .165 },
  { layers: [2, 11, 14, 17, 24, 26, 27], acquisition: .66, forgetting: .095 },
  { layers: [3, 7, 10, 15, 20, 25], acquisition: .60, forgetting: .12 },
].map((candidate, index) => ({ ...candidate, id: index, reward: candidate.acquisition - lambda * candidate.forgetting }))
const best = candidates.reduce((top, candidate) => candidate.reward > top.reward ? candidate : top)
const ranked = [...candidates].sort((a, b) => b.reward - a.reward)

function Loop() {
  return (
    <Exhibit id="loop" spec={specs.loop} essay={essay} rest={2} dwell={[3000, 3000, 4200, 3600, 5000]}>
      {({ step, still }) => {
        const rows = step === 4 ? ranked : candidates
        return (
          <div className="loop" data-step={step}>
            <div className="loop-head" aria-hidden="true">
              <Scale />
              <span className="loop-score-name">{step === 4 ? 'Ranked by reward' : 'Reward'}</span>
            </div>
            {rows.map(candidate => {
              const winner = candidate.id === best.id
              const state: Cell = step === 0 ? 'pick' : 'on'
              return (
                <motion.div className="loop-row" key={candidate.id} layout={!still} transition={{ duration: .7, ease: [.2, .7, .2, 1] }}
                  data-winner={winner || undefined} data-faded={step === 3 && !winner || undefined}>
                  <Layers cells={fill(candidate.layers, state)}
                    label={`Candidate ${candidate.id + 1}: layers ${say(candidate.layers)}.${step >= 2 && winner ? ' Highest reward.' : ''}${step >= 3 && winner ? ' Committed.' : ''}`} />
                  <span className="loop-score" data-shown={step >= 2 || undefined} aria-hidden="true">
                    <span className="loop-learned" style={{ width: `${candidate.acquisition * 100}%` }} />
                    <span className="loop-left" style={{ width: `${Math.max(0, candidate.reward) * 100}%` }} />
                  </span>
                </motion.div>
              )
            })}
          </div>
        )
      }}
    </Exhibit>
  )
}

/* Results: immediate accuracy against retention, as in the paper's Figure 3, and accuracy by context length on LongBench v2. */

const axis = (name: string, min: number, max: number, ticks: readonly number[]): FrontierAxis => ({ name, min, max, ticks })
type Places = Readonly<Record<string, FrontierPlace>>

/** Methods as points. A method without a retention value is listed and not drawn. With `diagonal` it is
    drawn where its retention equals its immediate accuracy, as the paper's Figure 3 draws
    Prompting-only and Batch TTT, which make no sequential updates. */
const streamPoints = (results: readonly StreamResult[], places: Places, diagonal = false) => results.map(result => ({
  label: result.method,
  x: result.immediate,
  xError: result.immediateError,
  y: result.retention ?? (diagonal ? result.immediate : null),
  yError: result.retentionError ?? (diagonal ? result.immediateError : undefined),
  ours: result.ours,
  place: places[result.id],
}))

/** One path per method across update budgets. The last point carries the method's name, the others their budget. */
const budgetPoints = (places: Places) => budgetResults.map(result => {
  const [method, budget] = result.id.split('-')
  return {
    label: result.method,
    name: budget === '20' ? result.method : budget,
    x: result.immediate,
    y: result.retention,
    ours: result.ours,
    place: places[result.id],
    path: method,
  }
})

function Results() {
  return (
    <Exhibit id="results" spec={specs.results} essay={essay}>
      {({ tab }) => tab === 0
        ? <Frontier title="Qwen2.5-7B-Instruct on a stream of 100 SQuAD passages"
          x={axis('Immediate accuracy', 25, 43.5, [28, 32, 36, 40])} y={axis('Retention', 18.5, 33.5, [20, 24, 28, 32])}
          points={streamPoints(squadResults, {
            prompting: 'ne', 'batch-ttt': 'se', 'seal-continual': 'ne', 'middle-10': 'se',
            'last-10': 'nw', 'random-10': 's', 'scol-lambda-zero': 'nw', scol: 'nw',
          }, true)} />
        : <PairedBars title="Accuracy on LongBench v2" first="Short contexts, 16k to 32k tokens" second="Long contexts, 32k to 64k tokens" max={52}
          rows={lengthResults.map(result => ({
            label: result.method, first: result.short.mean, firstError: result.short.standardError,
            second: result.long.mean, secondError: result.long.standardError, ours: result.id === 'scol',
          }))} />}
    </Exhibit>
  )
}

/* Additional results: other models, update budgets, an out-of-distribution stream, and general ability. */

function Additional() {
  return (
    <Exhibit id="additional" spec={specs.additional} essay={essay}>
      {({ tab }) => tab === 0 ? <Frontier title="Llama-3.1-8B-Instruct on a stream of 100 SQuAD passages"
        x={axis('Immediate accuracy', 38.5, 58, [40, 45, 50, 55])} y={axis('Retention', 16, 37.5, [20, 25, 30, 35])}
        points={streamPoints(llamaResults, {
          'seal-continual': 'ne', 'last-10': 'nw', 'middle-10': 'ne', 'random-10': 'nw', 'scol-lambda-zero': 'sw', scol: 'nw',
        })} />
        : tab === 1 ? <Frontier title="Qwen3.8-27B on a stream of 100 SQuAD passages"
          x={axis('Immediate accuracy', 43, 52, [44, 46, 48, 50])} y={axis('Retention', 32, 46, [34, 38, 42])}
          points={streamPoints(qwen27Results, {
            'seal-continual': 'se', 'last-10': 's', 'middle-10': 'e', 'random-10': 'nw', scol: 'nw',
          })} />
        : tab === 2 ? <Frontier title="Qwen3.8-27B at update budgets of 5, 10, and 20 layers" frontier={false}
          x={axis('Immediate accuracy', 42, 57.5, [44, 48, 52, 56])} y={axis('Retention', 36.5, 46, [38, 40, 42, 44])}
          points={budgetPoints({
            'random-5': 's', 'random-10': 'sw', 'random-20': 'se', 'last-5': 'n', 'last-10': 's', 'last-20': 'e',
            'scol-5': 'n', 'scol-10': 's', 'scol-20': 'nw',
          })} />
        : tab === 3 ? <Frontier title="Qwen2.5-7B-Instruct on a stream of 100 New York Times paragraphs"
          x={axis('Immediate accuracy', 17, 32, [18, 22, 26, 30])} y={axis('Retention', 10.5, 22.5, [12, 16, 20])}
          points={streamPoints(shiftResults, {
            'seal-continual': 'n', 'last-10': 'e', 'middle-10': 'se', 'random-10': 's', 'scol-lambda-zero': 'n', scol: 'nw',
          })} />
        : <Bars title="5-shot MMLU accuracy of Qwen2.5-7B-Instruct after the stream of 100 SQuAD passages" max={84} unit="%"
          rows={mmluResults.map(result => ({ label: result.model, value: result.accuracy, error: result.error, ours: result.ours }))} />}
    </Exhibit>
  )
}

/* Fisher alignment: measured Fisher information and the selected layers of three passages, then recall@k. */

function Fisher() {
  return (
    <Exhibit id="fisher" spec={specs.fisher} essay={essay}>
      {({ tab }) => {
        const passage = fisherPassages[tab]
        const highest = passage.fisher.indexOf(Math.max(...passage.fisher))
        return (
          <div className="fisher">
            <div className="writing-part">
              <Scale />
              <div className="layer-row" data-there>
                <span className="layer-name">Fisher information</span>
                <LayerValues values={passage.fisher} label={`Layerwise Fisher information for the passage ${passage.title}. It is highest at layer ${highest + 1}.`} />
              </div>
              <div className="layer-row" data-there>
                <span className="layer-name">Selected layers</span>
                <Layers cells={fill(passage.selectedLayers, 'on')} label={`SCoL selected layers ${say(passage.selectedLayers)}.`} />
              </div>
            </div>
            <Bars title="Recall@k over 100 SQuAD passages" max={62} unit="%"
              rows={fisherResults.map(result => ({ label: result.label, value: result.recallPercent, error: result.reportedUncertainty, ours: result.id === 'scol' }))} />
          </div>
        )
      }}
    </Exhibit>
  )
}

/** Draws one of the essay's figures. */
export function drawScol(id: string, lead: boolean): ReactNode {
  if (id === 'writing') return <Writing lead={lead} />
  if (id === 'interference') return <Interference />
  if (id === 'loop') return <Loop />
  if (id === 'results') return <Results />
  if (id === 'additional') return <Additional />
  if (id === 'fisher') return <Fisher />
  return null
}
