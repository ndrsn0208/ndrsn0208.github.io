import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import Exhibit from '../essay/Exhibit'
import { Bars, PairedBars } from '../essay/Bars'
import { scolEssay } from './article'
import { lengthResults, retentionResults } from './evidence'
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

const candidates = [
  { layers: [1, 4, 8, 13, 19, 24, 26], acquisition: .58, forgetting: .31 },
  { layers: [0, 6, 10, 15, 21, 27], acquisition: .49, forgetting: .12 },
  { layers: [3, 5, 9, 12, 18, 22, 25, 27], acquisition: .71, forgetting: .40 },
  { layers: [2, 7, 11, 16, 20, 23, 26], acquisition: .74, forgetting: .11 },
  { layers: [1, 2, 3, 14, 15, 16], acquisition: .41, forgetting: .22 },
  { layers: [5, 10, 17, 20, 24, 27], acquisition: .55, forgetting: .09 },
  { layers: [0, 8, 9, 13, 21, 22, 25], acquisition: .63, forgetting: .27 },
  { layers: [4, 6, 12, 18, 19, 23], acquisition: .52, forgetting: .33 },
  { layers: [2, 11, 14, 17, 24, 26, 27], acquisition: .66, forgetting: .19 },
  { layers: [3, 7, 10, 15, 20, 25], acquisition: .60, forgetting: .24 },
].map((candidate, index) => ({ ...candidate, id: index, reward: candidate.acquisition - candidate.forgetting }))
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

/* Results: acquisition and retention on SQuAD, and accuracy by context length on LongBench v2. */

function Results() {
  return (
    <Exhibit id="results" spec={specs.results} essay={essay}>
      {({ tab }) => tab === 0
        ? <PairedBars title="Accuracy on a stream of 100 SQuAD passages" first="Acquisition" second="Retention" max={46}
          rows={retentionResults.map(result => ({ label: result.method, first: result.acquisition, second: result.retention, ours: result.id === 'scol' }))} />
        : <PairedBars title="Accuracy on LongBench v2" first="Short contexts, 16k to 32k tokens" second="Long contexts, 32k to 64k tokens" max={52}
          rows={lengthResults.map(result => ({
            label: result.method, first: result.short.mean, firstError: result.short.standardError,
            second: result.long.mean, secondError: result.long.standardError, ours: result.id === 'scol',
          }))} />}
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
  if (id === 'fisher') return <Fisher />
  return null
}
