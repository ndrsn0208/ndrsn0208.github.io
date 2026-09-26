import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from 'motion/react'
import './meta-learning.css'

type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6
type CandidateId = 'A' | 'B' | 'C'
type Candidate = {
  id: CandidateId
  layers: number[]
  acquisition: number
  forgetting: number
}

// These are teaching examples, not measurements or recorded model selections.
const CANDIDATES: Candidate[] = [
  { id: 'A', layers: [4, 12, 20], acquisition: 0.8, forgetting: 0.5 },
  { id: 'B', layers: [8, 18, 25], acquisition: 0.7, forgetting: 0.1 },
  { id: 'C', layers: [2, 16, 26], acquisition: 0.5, forgetting: 0.03 },
]

const STAGES = [
  { short: 'Propose', title: 'The current model chooses where it could learn' },
  { short: 'Update', title: 'Try each selection from the same starting state' },
  { short: 'Compare', title: 'Compare what is learned and what is lost' },
  { short: 'Commit', title: 'Keep the chosen update' },
  { short: 'Continue', title: 'Let the updated model read the next chunk' },
  { short: 'Learn', title: 'Train the model that began the round' },
  { short: 'Begin again', title: 'A new starting point for the next round' },
] as const

const STAGE_MS = [4200, 4200, 6200, 5000, 5000, 5600, 4400]
const LAST_STAGE = (STAGES.length - 1) as Stage
const EPSILON = 1e-9

function reward(candidate: Candidate, lambda: number) {
  return candidate.acquisition - lambda * candidate.forgetting
}

function comparison(lambda: number) {
  const ranked = [...CANDIDATES].sort((a, b) => reward(b, lambda) - reward(a, lambda))
  const highest = ranked.filter(candidate => Math.abs(reward(candidate, lambda) - reward(ranked[0], lambda)) < EPSILON)
  const pairs = CANDIDATES.flatMap(better =>
    CANDIDATES
      .filter(worse => reward(better, lambda) > reward(worse, lambda) + EPSILON)
      .map(worse => ({ better: better.id, worse: worse.id })),
  )
  return { winner: ranked[0], highest, pairs }
}

function describeStage(stage: Stage, lambda: number) {
  const { winner, highest } = comparison(lambda)
  const descriptions = [
    'The model reads the current chunk and proposes alternative layer lists. Its weights already carry the changes made for earlier chunks.',
    'Each list is tried on a separate copy of the same current model. The chunk and learning procedure stay the same. Only the update locations differ.',
    `A candidate earns reward for acquisition and loses reward for forgetting. At λ = ${lambda.toFixed(1)}, candidate ${winner.id} ${highest.length > 1 ? 'shares' : 'has'} the highest illustrative reward.`,
    `Keep candidate ${winner.id} and merge its adapter into the running model. For this chunk, the committed changes are in layers [${winner.layers.join(', ')}].`,
    `The next chunk now reaches the model with candidate ${winner.id}’s changes. It generates a fresh set of candidate layer lists for this new text. The committed update remains part of its weights.`,
    'After all remaining chunks, preferences collected across the full stream train the saved round-start model with IPO. This improves the starting policy for another round.',
    'The improved starting policy begins another stream of updates. Its own changes will again shape its later selections. Earlier information can still be lost.',
  ]
  return descriptions[stage]
}

function Theta({ index, round = 'r' }: { index: string, round?: string }) {
  return (
    <span
      className="scol-meta-theta"
      role="math"
      aria-label={`Model weights theta ${index.replace('−', ' minus ')} in round ${round.replace('+', ' plus ')}`}
    >
      <span aria-hidden="true">θ</span>
      <span className="scol-meta-scripts" aria-hidden="true">
        <span>({round})</span>
        <span>{index}</span>
      </span>
    </span>
  )
}

function Layers({ selected = [], updated = false }: { selected?: number[], updated?: boolean }) {
  return (
    <svg className="scol-meta-layers" viewBox="0 0 104 76" aria-hidden="true" focusable="false">
      {Array.from({ length: 28 }, (_, layer) => (
        <rect
          key={layer}
          data-layer={layer}
          data-selected={selected.includes(layer)}
          x={4 + (layer % 4) * 25}
          y={5 + Math.floor(layer / 4) * 10}
          width="20"
          height="5"
          rx="1"
          className={selected.includes(layer)
            ? `scol-meta-layer scol-meta-layer-selected${updated ? ' scol-meta-layer-updated' : ''}`
            : 'scol-meta-layer'}
        />
      ))}
    </svg>
  )
}

function ModelCard({
  label, index, round = 'r', selected = [], updated = false, policy = false, layoutId,
}: {
  label: string
  index: string
  round?: string
  selected?: number[]
  updated?: boolean
  policy?: boolean
  layoutId?: string
}) {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      className="scol-meta-model"
      data-updated={updated || policy}
      data-selected-layers={selected.join(',')}
      layoutId={layoutId}
      transition={{ layout: { duration: reducedMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] } }}
    >
      <div className="scol-meta-model-interior">
        <Layers selected={selected} updated={updated} />
        <Theta index={index} round={round} />
      </div>
      <p className="scol-meta-model-label">{label}</p>
      {policy && <span className="scol-meta-model-note">Updated selection policy</span>}
    </motion.div>
  )
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 30 36" aria-hidden="true" focusable="false">
      <path d="M4 2h15l7 7v25H4zM19 2v8h7M9 16h12M9 21h12M9 26h8" />
    </svg>
  )
}

function Chunk({ index, label }: { index: string, label: string }) {
  return (
    <div className="scol-meta-chunk">
      <DocumentIcon />
      <span><span className="scol-meta-chunk-name">{label}</span><span className="scol-meta-chunk-symbol">c<sub>{index}</sub></span></span>
    </div>
  )
}

function Arrow({ label, down = false }: { label?: string, down?: boolean }) {
  return (
    <div className={`scol-meta-arrow${down ? ' scol-meta-arrow-down' : ''}`}>
      {label && <span className="scol-meta-arrow-label">{label}</span>}
      <svg viewBox="0 0 56 18" aria-hidden="true" focusable="false">
        <path d="M2 9h49m-6-5 6 5-6 5" />
      </svg>
    </div>
  )
}

function MeasuredPaths({ kind, still, stage = 0 }: { kind: 'branches' | 'return', still: boolean, stage?: number }) {
  const uid = `scol-arrow-${useId().replace(/:/g, '')}`
  const rootRef = useRef<HTMLDivElement>(null)
  const [geometry, setGeometry] = useState({ width: 1, height: 1, paths: [] as string[] })

  useLayoutEffect(() => {
    const root = rootRef.current
    const scope = root?.closest(kind === 'branches' ? '.scol-meta-branch-scene' : '.scol-meta-outer')
    const source = scope?.querySelector(kind === 'branches' ? '.scol-meta-origin .scol-meta-model' : '.scol-meta-outer-evidence')
    const targets = kind === 'branches'
      ? [...(scope?.querySelectorAll('.scol-meta-candidate') ?? [])]
      : [scope?.querySelector('.scol-meta-outer-flow .scol-meta-model')].filter((node): node is Element => Boolean(node))
    if (!root || !source || !targets.length) return
    const measure = () => {
      const box = root.getBoundingClientRect()
      const from = source.getBoundingClientRect()
      if (!box.width || !box.height) return
      const paths = targets.flatMap(target => {
        const to = target.getBoundingClientRect()
        if (!to.width || !to.height) return []
        if (kind === 'branches') {
          const x1 = from.right - box.left
          const y1 = from.top + from.height / 2 - box.top
          const x2 = to.left - box.left - 2
          const y2 = to.top + to.height / 2 - box.top
          const mid = (x1 + x2) / 2
          return [`M${x1} ${y1} C${mid} ${y1} ${mid} ${y2} ${x2} ${y2}`]
        }
        const x1 = from.left + from.width / 2 - box.left
        const y1 = from.bottom - box.top
        const x2 = to.left + to.width / 2 - box.left
        const y2 = to.top - box.top - 2
        const mid = (y1 + y2) / 2
        return [`M${x1} ${y1} C${x1} ${mid} ${x2} ${mid} ${x2} ${y2}`]
      })
      const next = { width: box.width, height: box.height, paths }
      setGeometry(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next)
    }
    measure()
    const observer = new ResizeObserver(measure)
    for (const node of [root, source, ...targets]) observer.observe(node)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [kind, stage])

  return (
    <div ref={rootRef} className={kind === 'branches' ? 'scol-meta-branches' : 'scol-meta-return'} aria-hidden="true">
      {kind === 'return' && <span>Return to the saved start</span>}
      <svg className={kind === 'branches' ? 'scol-meta-branches-wide' : 'scol-meta-return-wide'} viewBox={`0 0 ${geometry.width} ${geometry.height}`} preserveAspectRatio="none" focusable="false">
        <defs><marker id={uid} markerWidth="8" markerHeight="8" refX="7" refY="4" markerUnits="userSpaceOnUse" orient="auto"><path d="M1 1L7 4L1 7" /></marker></defs>
        {geometry.paths.map((path, index) => <motion.path
          key={index}
          d={path}
          markerEnd={`url(#${uid})`}
          initial={still || kind === 'branches' ? false : { pathLength: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: still ? 0 : 0.65, ease: 'easeInOut' }}
          vectorEffect="non-scaling-stroke"
        />)}
      </svg>
      <svg className={kind === 'branches' ? 'scol-meta-branches-narrow' : 'scol-meta-return-narrow'} viewBox="0 0 24 38" focusable="false">
        <path d="M12 1v32m-5-5 5 5 5-5" />
      </svg>
    </div>
  )
}

function RoundTrack({ stage }: { stage: Stage }) {
  const next = stage === LAST_STAGE
  const round = next ? 'r + 1' : 'r'
  return (
    <div className="scol-meta-round-track" aria-label={`Model states along ${next ? 'the next' : 'this'} round`}>
      <span className="scol-meta-round-label">Round <i>{round}</i></span>
      <div className="scol-meta-track-node" data-current={stage === 5 || next}>
        <Theta index="0" round={round} />
        <span>{next ? 'New start' : 'Saved start'}</span>
      </div>
      <span className="scol-meta-track-link" aria-hidden="true">···</span>
      <div className="scol-meta-track-node" data-current={stage < 5}>
        <Theta index={next ? '1' : stage < 3 ? 't−1' : 't'} round={round} />
        <span>{next ? 'First update' : stage === 5 ? 'Earlier commit' : stage < 3 || stage === 4 ? 'Current model' : 'Kept update'}</span>
      </div>
      <span className="scol-meta-track-link" aria-hidden="true">···</span>
      <div className="scol-meta-track-node">
        <Theta index="T" round={round} />
        <span>Stream end</span>
      </div>
    </div>
  )
}

function Preferences({ lambda, fullStream = false }: { lambda: number, fullStream?: boolean }) {
  const { pairs } = comparison(lambda)
  return (
    <div className="scol-meta-preferences">
      <div className="scol-meta-preference-heading">
        <DocumentIcon />
        <span>{fullStream ? 'Preferences from the full stream' : 'Preferences from this comparison'}</span>
      </div>
      {fullStream && <p className="scol-meta-buffer-label">Shown here: the comparison for chunk cₜ</p>}
      <ul className="scol-meta-pairs" aria-label="Preferred layer selections">
        {pairs.map(pair => (
          <li key={`${pair.better}-${pair.worse}`} aria-label={`Selection ${pair.better} preferred to selection ${pair.worse}`}>
            <span aria-hidden="true">{pair.better} <span className="scol-meta-pair-sign">›</span> {pair.worse}</span>
          </li>
        ))}
      </ul>
      <p>{fullStream ? 'The buffer also contains comparisons from the other chunks.' : 'Keep the better and worse selections for later learning.'}</p>
    </div>
  )
}

function CandidateComparison({
  stage, lambda, focus, onFocus, onLambda, uid, still,
}: {
  stage: 0 | 1 | 2
  lambda: number
  focus: CandidateId
  onFocus: (id: CandidateId) => void
  onLambda: (value: number) => void
  uid: string
  still: boolean
}) {
  const scored = stage === 2
  const { winner, highest } = comparison(lambda)
  return (
    <div className="scol-meta-comparison">
      <div className="scol-meta-branch-scene">
        <div className="scol-meta-origin">
          <Chunk index="t" label="Current chunk" />
          <Arrow down />
          <ModelCard label="Current model" index="t−1" />
          <p className="scol-meta-origin-note">
            {stage === 0 ? 'This model generates every candidate list.' : 'Every copy starts from these same weights.'}
          </p>
        </div>
        <MeasuredPaths kind="branches" still={still} stage={stage} />
        {scored && (
          <div className="scol-meta-reward-control">
            <div className="scol-meta-reward-formula" role="math" aria-label="Reward equals acquisition minus lambda times forgetting">
              <span>Reward</span><span aria-hidden="true">u − λf</span>
            </div>
            <div className="scol-meta-slider-group">
              <label htmlFor={`${uid}-lambda`}>
                <span>Penalty for forgetting</span>
                <span className="scol-meta-lambda-value" aria-hidden="true">λ = {lambda.toFixed(1)}</span>
              </label>
              <input
                id={`${uid}-lambda`}
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={lambda}
                onChange={event => onLambda(Number(event.target.value))}
                aria-valuetext={`${lambda.toFixed(1)}. Candidate ${winner.id} has the highest illustrative reward, ${reward(winner, lambda).toFixed(2)}`}
                aria-describedby={`${uid}-lambda-help`}
              />
              <p id={`${uid}-lambda-help`}>0 considers acquisition alone. 1 also penalizes forgetting.</p>
            </div>
          </div>
        )}
        <div className="scol-meta-candidate-group">
          <div className="scol-meta-candidate-tabs" role="group" aria-label="Inspect an illustrative candidate">
            {CANDIDATES.map(candidate => (
              <button
                type="button"
                key={candidate.id}
                aria-pressed={focus === candidate.id}
                aria-controls={`${uid}-candidate-${candidate.id}`}
                onClick={() => onFocus(candidate.id)}
                aria-label={`Inspect candidate ${candidate.id}${scored ? `, reward ${reward(candidate, lambda).toFixed(2)}` : ''}`}
              >
                <span>{candidate.id}</span>
                {scored && <span>{reward(candidate, lambda).toFixed(2)}</span>}
                {scored && highest.includes(candidate) && <span className="scol-meta-candidate-dot" aria-hidden="true" />}
              </button>
            ))}
          </div>
          <div className="scol-meta-candidates">
            {CANDIDATES.map(candidate => {
              const best = scored && highest.includes(candidate)
              return (
                <article
                  className="scol-meta-candidate"
                  id={`${uid}-candidate-${candidate.id}`}
                  key={candidate.id}
                  data-focused={focus === candidate.id}
                  data-scored={scored}
                  data-best={best}
                  aria-label={`Illustrative candidate ${candidate.id}`}
                >
                  <span className="scol-meta-candidate-letter" aria-hidden="true">{candidate.id}</span>
                  <div className="scol-meta-candidate-selection">
                    <span>{stage === 0 ? 'Proposed layers' : 'Selected layers'}</span>
                    <span className="scol-meta-layer-list">[{candidate.layers.join(', ')}]</span>
                  </div>
                  {scored ? (
                    <div className="scol-meta-metrics">
                      <div className="scol-meta-metric" data-kind="acquisition">
                        <span>Acquisition <i>u</i><b>{candidate.acquisition.toFixed(2)}</b></span>
                        <span className="scol-meta-meter" aria-hidden="true">
                          <motion.span initial={false} animate={{ scaleX: candidate.acquisition }} transition={{ duration: still ? 0 : 0.3 }} />
                        </span>
                      </div>
                      <div className="scol-meta-metric" data-kind="forgetting">
                        <span>Forgetting <i>f</i><b>{candidate.forgetting.toFixed(2)}</b></span>
                        <span className="scol-meta-meter" aria-hidden="true">
                          <motion.span initial={false} animate={{ scaleX: candidate.forgetting }} transition={{ duration: still ? 0 : 0.3 }} />
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="scol-meta-candidate-copy">
                      <Layers selected={candidate.layers} updated={stage === 1} />
                      <span>{stage === 0 ? 'A possible update' : 'Learn from this chunk'}</span>
                    </div>
                  )}
                  {scored && (
                    <div className="scol-meta-score">
                      <span>{best ? highest.length > 1 ? 'Joint highest' : 'Highest reward' : 'Reward'}</span>
                      <strong>{reward(candidate, lambda).toFixed(2)}</strong>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </div>
      </div>
      <p className="scol-meta-scene-note">
        {scored
          ? 'Checks on the current chunk measure acquisition. Forgetting measures deterioration on earlier contexts relative to their evaluation baseline.'
          : stage === 1
            ? 'Colored marks are updated layers. The other layers keep their current weights.'
            : 'The small grids represent the same model with 28 Transformer layers. Outlined marks identify each proposed selection.'}
      </p>
    </div>
  )
}

function CommitScene({ lambda, modelId }: { lambda: number, modelId: string }) {
  const { winner } = comparison(lambda)
  const others = CANDIDATES.filter(candidate => candidate.id !== winner.id)
  return (
    <div className="scol-meta-commit">
      <p className="scol-meta-choice">
        <span className="scol-meta-choice-letter">{winner.id}</span>
        <span>Keep candidate {winner.id}<span className="scol-meta-choice-reward">Reward {reward(winner, lambda).toFixed(2)} at λ = {lambda.toFixed(1)}</span></span>
      </p>
      <div className="scol-meta-commit-flow">
        <div className="scol-meta-winning-update">
          <span>Selected update for cₜ</span>
          <strong className="scol-meta-layer-list">[{winner.layers.join(', ')}]</strong>
          <Layers selected={winner.layers} updated />
        </div>
        <Arrow label="Merge adapter" />
        <div className="scol-meta-kept-state">
          <ModelCard label="Running model" index="t" selected={winner.layers} updated layoutId={modelId} />
          <p>Updated layers <strong className="scol-meta-layer-list">[{winner.layers.join(', ')}]</strong></p>
        </div>
      </div>
      <div className="scol-meta-commit-record">
        <p className="scol-meta-set-aside">
          <span aria-hidden="true">{others.map(candidate => <span key={candidate.id}>{candidate.id}</span>)}</span>
          Candidates {others.map(candidate => candidate.id).join(' and ')} are set aside. Only {winner.id} continues.
        </p>
        <Preferences lambda={lambda} />
      </div>
      <p className="scol-meta-scene-note">The chosen layer list and its weight changes stay together. The next chunk arrives in the following step.</p>
    </div>
  )
}

function FreshProposals({ first = false }: { first?: boolean }) {
  return (
    <div className="scol-meta-next-list scol-meta-fresh-proposals">
      <span>{first ? 'Candidates for the first chunk' : 'Fresh candidates for cₜ₊₁'}</span>
      <span className="scol-meta-proposal-marks" aria-hidden="true"><i /><i /><i /></span>
      <strong>Sample 10 layer lists</strong>
      <span>Try their updates, compare rewards, then commit one.</span>
    </div>
  )
}

function ContinueScene({ lambda, modelId }: { lambda: number, modelId: string }) {
  const { winner } = comparison(lambda)
  return (
    <div className="scol-meta-continue">
      <p className="scol-meta-commit-reminder">
        <span>Already committed for cₜ</span>
        <strong>Candidate {winner.id} <span className="scol-meta-layer-list">[{winner.layers.join(', ')}]</span></strong>
      </p>
      <div className="scol-meta-forward-flow">
        <Chunk index="t+1" label="Next chunk" />
        <Arrow label="Read" />
        <ModelCard label="Same running model" index="t" selected={winner.layers} updated layoutId={modelId} />
        <Arrow label="Propose" />
        <FreshProposals />
      </div>
      <p className="scol-meta-scene-note">
        New text prompts a new decision. The model keeps the committed changes while it proposes where to learn next.
      </p>
      <p className="scol-meta-repeat-stream">Repeat this inner loop for the remaining chunks, collecting preferences along the way.</p>
    </div>
  )
}

function OuterScene({ lambda, still }: { lambda: number, still: boolean }) {
  return (
    <div className="scol-meta-outer">
      <p className="scol-meta-stream-complete">All chunks have been processed. The preference buffer spans the full stream.</p>
      <div className="scol-meta-outer-evidence"><Preferences lambda={lambda} fullStream /></div>
      <MeasuredPaths kind="return" still={still} />
      <div className="scol-meta-outer-flow">
        <ModelCard label="Saved round-start model" index="0" />
        <div className="scol-meta-ipo">
          <strong>IPO</strong>
          <Arrow />
          <span>Train how the model selects layers</span>
        </div>
        <ModelCard label="Next round-start model" index="0" round="r + 1" policy />
      </div>
      <p className="scol-meta-target-note">
        <span>Outer training starts from <Theta index="0" />.</span>
        <span>The final stream model <Theta index="T" /> is not the model being trained here.</span>
      </p>
    </div>
  )
}

function NextRoundScene() {
  return (
    <div className="scol-meta-next-round">
      <div className="scol-meta-forward-flow">
        <Chunk index="1" label="First chunk" />
        <Arrow label="Read" />
        <ModelCard label="Improved starting model" index="0" round="r + 1" policy />
        <Arrow label="Propose" />
        <FreshProposals first />
      </div>
      <div className="scol-meta-new-stream">
        <span>The model changes again</span>
        <Theta index="0" round="r + 1" />
        <Arrow />
        <Theta index="1" round="r + 1" />
        <span aria-hidden="true">···</span>
        <Theta index="T" round="r + 1" />
      </div>
      <p className="scol-meta-next-round-note">
        Learning a better starting policy does not guarantee perfect retention. The new round still has to balance acquisition and forgetting.
      </p>
    </div>
  )
}

function ControlIcon({ kind }: { kind: 'play' | 'pause' | 'replay' | 'previous' | 'next' }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      {kind === 'play' && <path d="m6 3 10 7-10 7z" />}
      {kind === 'pause' && <path d="M6 3v14M14 3v14" />}
      {kind === 'replay' && <path d="M4 7a7 7 0 1 1-.5 5M4 2v5h5" />}
      {kind === 'previous' && <path d="m12 4-6 6 6 6" />}
      {kind === 'next' && <path d="m8 4 6 6-6 6" />}
    </svg>
  )
}

export default function MetaLearning() {
  const uid = `scol-meta-${useId().replace(/:/g, '')}`
  const reducedMotion = Boolean(useReducedMotion())
  const [stage, setStage] = useState<Stage>(0)
  const [lambda, setLambda] = useState(1)
  const [candidateFocus, setCandidateFocus] = useState<CandidateId>('A')
  const [playing, setPlaying] = useState(false)
  const [visible, setVisible] = useState(false)
  const [documentVisible, setDocumentVisible] = useState(true)
  const [replayVersion, setReplayVersion] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const [stageHeight, setStageHeight] = useState<number>()
  const figureRef = useRef<HTMLElement>(null)
  const stageProgress = useMotionValue(0)
  const controlsRef = useRef<HTMLDivElement>(null)
  const narrationRef = useRef<HTMLDivElement>(null)
  const stageMeasureRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const revealFrameRef = useRef<number | null>(null)
  const budgetRef = useRef({ stage: 0 as Stage, remaining: STAGE_MS[0] })

  useEffect(() => {
    const node = stageMeasureRef.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const measure = () => setStageHeight(Math.ceil(node.getBoundingClientRect().height))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => () => {
    if (revealFrameRef.current !== null) window.cancelAnimationFrame(revealFrameRef.current)
  }, [])

  useEffect(() => {
    const node = figureRef.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const update = () => setDocumentVisible(document.visibilityState === 'visible')
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  // Preserve the remaining dwell time when the figure or document is hidden.
  // Each effect owns its budget object, so an old cleanup cannot shorten a replay.
  useEffect(() => {
    if (budgetRef.current.stage !== stage) {
      budgetRef.current = { stage, remaining: STAGE_MS[stage] }
    }
    const budget = budgetRef.current
    stageProgress.set(1 - budget.remaining / STAGE_MS[stage])
    if (!playing || !visible || !documentVisible) return
    const progressAnimation = reducedMotion ? undefined : animate(stageProgress, 1, {
      duration: Math.max(0, budget.remaining) / 1000,
      ease: 'linear',
    })
    const started = performance.now()
    let expired = false
    const timer = window.setTimeout(() => {
      expired = true
      if (stage === LAST_STAGE) {
        setPlaying(false)
      } else {
        setStage((stage + 1) as Stage)
      }
    }, Math.max(0, budget.remaining))
    return () => {
      window.clearTimeout(timer)
      progressAnimation?.stop()
      if (!expired) budget.remaining = Math.max(0, budget.remaining - (performance.now() - started))
    }
  }, [stage, playing, visible, documentVisible, reducedMotion, replayVersion, stageProgress])

  // A reader can bring the diagram into view when starting playback.
  // Subsequent timed stages and reward changes leave scrolling under their control.
  function revealStage(focusScene = false) {
    if (revealFrameRef.current !== null) window.cancelAnimationFrame(revealFrameRef.current)
    revealFrameRef.current = window.requestAnimationFrame(() => {
      revealFrameRef.current = null
      const controls = controlsRef.current
      const target = focusScene ? sceneRef.current : narrationRef.current
      if (!controls || !target) return
      const bar = controls.getBoundingClientRect()
      const stickyTop = parseFloat(window.getComputedStyle(controls).top) || 0
      const narrationTop = target.getBoundingClientRect().top
        + (parseFloat(window.getComputedStyle(target).paddingTop) || 0)
      const visibleTop = Math.max(stickyTop, bar.top) + bar.height
      if (focusScene || narrationTop < visibleTop || narrationTop > window.innerHeight - 100) {
        window.scrollTo({
          top: Math.max(0, window.scrollY + narrationTop - stickyTop - bar.height - 12),
          behavior: reducedMotion ? 'instant' : 'smooth',
        })
      }
    })
  }

  function goToStage(next: number) {
    const target = Math.max(0, Math.min(LAST_STAGE, next)) as Stage
    setPlaying(false)
    budgetRef.current = { stage: target, remaining: STAGE_MS[target] }
    setStage(target)
    if (target === 2) setCandidateFocus(comparison(lambda).winner.id)
    setAnnouncement(`Step ${target + 1} of ${STAGES.length}. ${STAGES[target].title}. ${describeStage(target, lambda)}`)
    revealStage()
  }

  function replay() {
    budgetRef.current = { stage: 0, remaining: STAGE_MS[0] }
    setStage(0)
    setCandidateFocus('A')
    setReplayVersion(version => version + 1)
    setPlaying(true)
    setAnnouncement(`Back to step 1. The forgetting penalty remains ${lambda.toFixed(1)}.`)
    revealStage(true)
  }

  function togglePlayback() {
    if (stage === LAST_STAGE && !playing) {
      replay()
    } else {
      if (!playing) revealStage(true)
      setPlaying(value => !value)
    }
  }

  function changeLambda(value: number) {
    const next = Math.round(Math.max(0, Math.min(1, value)) * 10) / 10
    setPlaying(false)
    setLambda(next)
    setCandidateFocus(comparison(next).winner.id)
  }

  const sceneKey = stage < 3 ? 'compare' : String(stage)

  return (
    <figure className="scol-meta" ref={figureRef} data-stage={stage} data-playing={playing} aria-labelledby={`${uid}-title`} aria-describedby={`${uid}-caption`}>
      <div className="scol-meta-shell">
        <div className="scol-meta-heading">
          <p id={`${uid}-title`}>One model, two learning loops</p>
          <span>Interactive illustration</span>
        </div>
        <div className="scol-meta-controls" ref={controlsRef}>
          <nav aria-label="Training stages">
            <ol className="scol-meta-steps">
              {STAGES.map((step, index) => (
                <li key={step.short}>
                  <button
                    type="button"
                    aria-current={stage === index ? 'step' : undefined}
                    aria-controls={`${uid}-scene`}
                    aria-label={`Step ${index + 1}. ${step.title}`}
                    onClick={() => goToStage(index)}
                  >
                    <span className="scol-meta-step-number">{index + 1}</span>
                    <span className="scol-meta-step-word">{step.short}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <div className="scol-meta-playback" role="group" aria-label="Playback controls">
            <button type="button" className="scol-meta-icon-button" onClick={() => goToStage(stage - 1)} disabled={stage === 0} aria-label="Previous stage">
              <ControlIcon kind="previous" />
            </button>
            <button
              type="button"
              className="scol-meta-play"
              onClick={togglePlayback}
              aria-pressed={playing}
              aria-describedby={reducedMotion ? `${uid}-motion-note` : undefined}
              aria-label={playing ? 'Pause the explanation' : stage === LAST_STAGE ? 'Play the explanation again' : 'Play the explanation'}
            >
              <ControlIcon kind={playing ? 'pause' : 'play'} />
              {playing ? 'Pause' : 'Play'}
            </button>
            <button type="button" className="scol-meta-icon-button" onClick={() => goToStage(stage + 1)} disabled={stage === LAST_STAGE} aria-label="Next stage">
              <ControlIcon kind="next" />
            </button>
            <button type="button" className="scol-meta-replay" onClick={replay} aria-label="Replay from the first stage, keeping the forgetting penalty">
              <ControlIcon kind="replay" />Replay
            </button>
          </div>
          <div className="scol-meta-play-progress" aria-hidden="true">
            <motion.span style={{ scaleX: stageProgress }} />
          </div>
        </div>
        {reducedMotion && <p className="scol-meta-motion-note" id={`${uid}-motion-note`}>Reduced motion is on. Play advances through still frames.</p>}
        <motion.div
          className="scol-meta-stage-frame"
          initial={false}
          animate={{ height: stageHeight ?? 'auto' }}
          transition={{ height: { duration: reducedMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] } }}
        >
          <div className="scol-meta-stage-measure" ref={stageMeasureRef}>
            <div className="scol-meta-narration" ref={narrationRef}>
              <p className="scol-meta-loop-label">{stage < 5 ? 'Inner learning' : stage === 5 ? 'Outer learning' : 'Next round'}<span>{stage + 1} / {STAGES.length}</span></p>
              <h3 id={`${uid}-stage-title`}>{STAGES[stage].title}</h3>
              <p id={`${uid}-description`}>{describeStage(stage, lambda)}</p>
            </div>
            <RoundTrack stage={stage} />
            <div
              className="scol-meta-scene"
              id={`${uid}-scene`}
              ref={sceneRef}
              role="group"
              aria-labelledby={`${uid}-stage-title`}
              aria-describedby={`${uid}-description`}
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                  key={sceneKey}
                  className="scol-meta-scene-content"
                  initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : -5 }}
                  transition={{ duration: reducedMotion ? 0 : 0.22, ease: 'easeOut' }}
                >
                  {stage < 3 && (
                    <CandidateComparison
                      stage={stage as 0 | 1 | 2}
                      lambda={lambda}
                      focus={candidateFocus}
                      onFocus={candidate => { setCandidateFocus(candidate); setPlaying(false) }}
                      onLambda={changeLambda}
                      uid={uid}
                      still={reducedMotion}
                    />
                  )}
                  {stage === 3 && <CommitScene lambda={lambda} modelId={`${uid}-running-model`} />}
                  {stage === 4 && <ContinueScene lambda={lambda} modelId={`${uid}-running-model`} />}
                  {stage === 5 && <OuterScene lambda={lambda} still={reducedMotion} />}
                  {stage === 6 && <NextRoundScene />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
        <p className="scol-meta-sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
      </div>
      <figcaption className="scol-meta-caption" id={`${uid}-caption`}>
        <p><strong>Illustration of candidate comparison.</strong> Three candidates stand in for the K = 10 sampled during training. Layer lists and scores are illustrative, not experimental results. The scores have no accuracy units.</p>
        <p>Inner learning uses LoRA adapters for a causal language modeling update on selected layers. Outer learning uses IPO, Identity Preference Optimisation, to train the saved round-start model’s policy for choosing layers, using preferences collected across the full stream.</p>
      </figcaption>
    </figure>
  )
}
