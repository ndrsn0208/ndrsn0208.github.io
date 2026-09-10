import { useState } from 'react'
import {
  Arrow,
  formatAuthors,
  paperHref,
  papers,
  paperSummary,
  profile,
  researchThreads,
  topics,
  type Publication,
} from '../../shared'
import './style.css'

type Shape = 'circle' | 'triangle' | 'square'
type Tone = 'blue' | 'coral'
type Mode = 'remember' | 'compose'
type Observation = { shape: Shape; tone: Tone }

const shapes: Shape[] = ['circle', 'triangle', 'square']
const tones: Tone[] = ['blue', 'coral']
const startingObservations: Observation[] = [
  { shape: 'circle', tone: 'blue' },
  { shape: 'circle', tone: 'coral' },
  { shape: 'triangle', tone: 'blue' },
]
const readingTrails: Record<Mode, string[]> = {
  remember: ['2604.14489', '2605.07076', '2509.23593'],
  compose: ['2605.07078', '2509.23602', '2505.24601'],
}
const years = [...new Set(papers.map((paper) => paper.year))]
const observationKey = ({ shape, tone }: Observation) => `${tone}-${shape}`
const observationName = ({ shape, tone }: Observation) =>
  `${tone === 'blue' ? 'Blue' : 'Coral'} ${shape}`

function ShapeGlyph({
  shape,
  tone = 'blue',
  size = 20,
  outline = false,
}: {
  shape: Shape
  tone?: Tone
  size?: number
  outline?: boolean
}) {
  return (
    <g
      className={`workbench-glyph workbench-glyph-${tone}`}
      fill={outline ? 'none' : 'currentColor'}
      stroke={tone === 'coral' && !outline ? 'var(--workbench-coral-ink)' : 'currentColor'}
      strokeWidth={outline ? 2.5 : 1}
      strokeLinejoin="round"
    >
      {shape === 'circle' && <circle r={size} />}
      {shape === 'triangle' && (
        <path d={`M 0 ${-size * 1.1} L ${size} ${size * 0.85} L ${-size} ${size * 0.85} Z`} />
      )}
      {shape === 'square' && (
        <rect x={-size * 0.86} y={-size * 0.86} width={size * 1.72} height={size * 1.72} rx="2" />
      )}
    </g>
  )
}

function RememberDrawing({
  observations,
  latest,
}: {
  observations: Observation[]
  latest: string | null
}) {
  const groups = shapes.filter((shape) => observations.some((item) => item.shape === shape))
  const positions = groups.length === 2 ? [190, 430] : [112, 310, 508]
  const description = groups
    .map((shape) => `${shape}s: ${observations.filter((item) => item.shape === shape).map(observationName).join(', ')}`)
    .join('. ')

  return (
    <svg
      className="workbench-diagram"
      viewBox="0 0 620 414"
      role="img"
      aria-labelledby="workbench-tree-title workbench-tree-description"
    >
      <title id="workbench-tree-title">Remember: a growing concept hierarchy</title>
      <desc id="workbench-tree-description">
        A conceptual tree groups observations by shape. {description}.
        {latest ? ` The most recently added observation is ${latest.replace('-', ' ')}; it has a dashed outline.` : ' Add an observation using the controls below.'}
      </desc>
      <defs>
        <marker id="workbench-tree-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 1 1 L 8 5 L 1 9" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </marker>
        <pattern id="workbench-tree-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <path d="M 0 0 V 8" className="workbench-hatch-line" />
        </pattern>
      </defs>
      <text className="workbench-diagram-overline" x="310" y="24" textAnchor="middle">A GROWING CONCEPT TREE</text>
      <g className="workbench-tree-root" transform="translate(310 75)">
        <circle r="28" />
        <path d="M 0 -12 V 0 M -12 12 V 0 H 12 V 12" />
        <circle cx="0" cy="-12" r="3" />
        <circle cx="-12" cy="12" r="3" />
        <circle cx="12" cy="12" r="3" />
      </g>
      <g className="workbench-drawing-note">
        <text x="48" y="73">a place for</text>
        <text x="48" y="95">what I know</text>
        <path d="M 167 82 C 203 64 237 65 267 73" markerEnd="url(#workbench-tree-arrow)" />
      </g>
      <g className="workbench-drawing-note workbench-drawing-note-right">
        <text x="476" y="90">room to grow</text>
        <path d="M 537 103 C 572 125 581 164 566 192" markerEnd="url(#workbench-tree-arrow)" />
      </g>
      {groups.map((shape, groupIndex) => {
        const x = positions[groupIndex]
        const members = observations.filter((item) => item.shape === shape)
        const isNewGroup = !startingObservations.some((item) => item.shape === shape)
        return (
          <g key={shape}>
            <path
              className={`workbench-tree-branch${isNewGroup ? ' workbench-tree-branch-new' : ''}`}
              d={`M 310 104 C 310 148 ${x} 122 ${x} 164`}
            />
            <circle className="workbench-concept-orbit" cx={x} cy="211" r="55" />
            {isNewGroup && <circle cx={x} cy="211" r="55" fill="url(#workbench-tree-hatch)" />}
            <g transform={`translate(${x} 200)`}>
              <ShapeGlyph shape={shape} size={23} outline />
            </g>
            <text className="workbench-diagram-label" x={x} y="243" textAnchor="middle">{shape}s</text>
            {members.map((item, index) => {
              const leafX = x + (index - (members.length - 1) / 2) * 76
              const isLatest = observationKey(item) === latest
              return (
                <g key={observationKey(item)}>
                  <path
                    className={`workbench-tree-branch workbench-tree-twig${isLatest ? ' workbench-tree-branch-new' : ''}`}
                    d={`M ${x} 266 C ${x} 301 ${leafX} 286 ${leafX} 324`}
                  />
                  <circle className="workbench-observation-back" cx={leafX} cy="346" r="29" />
                  {isLatest && <circle className="workbench-new-observation" cx={leafX} cy="346" r="37" />}
                  <g transform={`translate(${leafX} 346)`}>
                    <ShapeGlyph shape={item.shape} tone={item.tone} size={18} />
                  </g>
                  {isLatest && (
                    <text className="workbench-new-label" x={leafX} y="405" textAnchor="middle">just added</text>
                  )}
                </g>
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}

function ComposeDrawing({ selection, composed }: { selection: Observation; composed: boolean }) {
  return (
    <svg
      className="workbench-diagram"
      viewBox="0 0 620 414"
      role="img"
      aria-labelledby="workbench-compose-title workbench-compose-description"
    >
      <title id="workbench-compose-title">Compose: combine reusable concepts</title>
      <desc id="workbench-compose-description">
        A {selection.shape} and the color {selection.tone} connect to {composed ? 'a composed' : 'a preview of a'} {selection.tone} {selection.shape}.
        This is a conceptual illustration of combining attributes.
      </desc>
      <defs>
        <pattern id="workbench-compose-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <path d="M 0 0 V 9" className="workbench-hatch-line" />
        </pattern>
      </defs>
      <text className="workbench-diagram-overline" x="310" y="24" textAnchor="middle">FAMILIAR PARTS, A NEW COMBINATION</text>
      <path className="workbench-composition-path" d="M 171 197 C 171 265 310 213 310 287 M 449 197 C 449 265 310 213 310 287" />
      <circle className="workbench-composition-orbit" cx="171" cy="131" r="76" />
      <circle className="workbench-concept-orbit" cx="171" cy="131" r="62" />
      <g transform="translate(171 125)"><ShapeGlyph shape={selection.shape} size={32} outline /></g>
      <text className="workbench-diagram-label" x="171" y="180" textAnchor="middle">{selection.shape}</text>
      <circle className="workbench-composition-orbit" cx="449" cy="131" r="76" />
      <circle className="workbench-color-orbit" cx="449" cy="131" r="62" />
      <circle cx="449" cy="131" r="62" fill="url(#workbench-compose-hatch)" />
      <circle className={`workbench-glyph-${selection.tone}`} cx="449" cy="125" r="30" fill="currentColor" />
      <text className="workbench-diagram-label" x="449" y="180" textAnchor="middle">{selection.tone}</text>
      <path className="workbench-composition-plus" d="M 297 127 H 323 M 310 114 V 140" />
      <text className="workbench-diagram-overline" x="310" y="170" textAnchor="middle">COMBINE</text>
      <circle className={`workbench-composition-result${composed ? ' workbench-composition-result-ready' : ''}`} cx="310" cy="328" r="58" />
      <g transform="translate(310 328)">
        <ShapeGlyph shape={selection.shape} tone={selection.tone} size={31} outline={!composed} />
      </g>
      <g className="workbench-drawing-note">
        <text x="59" y="320">the same parts,</text>
        <text x="59" y="342">put together</text>
        <path d="M 202 334 Q 220 343 240 332" />
      </g>
      {composed && <path className="workbench-composition-spark" d="M 387 291 V 309 M 378 300 H 396 M 404 321 V 331 M 399 326 H 409" />}
      <text className="workbench-result-label" x="310" y="411" textAnchor="middle">
        {composed ? `${selection.tone} ${selection.shape}` : 'a possible combination'}
      </text>
    </svg>
  )
}

function PaperResources({ paper }: { paper: Publication }) {
  return (
    <div className="workbench-paper-resources">
      <a href={paperHref(paper)} target="_blank" rel="noreferrer">
        Read paper <Arrow className="workbench-arrow" />
      </a>
      {paper.pdfUrl && (
        <a href={paper.pdfUrl} target="_blank" rel="noreferrer">
          PDF <Arrow className="workbench-arrow" />
        </a>
      )}
    </div>
  )
}

export default function Workbench() {
  const [mode, setMode] = useState<Mode>('remember')
  const [observations, setObservations] = useState<Observation[]>(startingObservations)
  const [shape, setShape] = useState<Shape>('square')
  const [tone, setTone] = useState<Tone>('coral')
  const [latest, setLatest] = useState<string | null>(null)
  const [composition, setComposition] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('all')
  const [year, setYear] = useState('all')

  const selection = { shape, tone }
  const selectionKey = observationKey(selection)
  const isKnown = observations.some((item) => observationKey(item) === selectionKey)
  const hasShape = observations.some((item) => item.shape === shape)
  const isComposed = composition === selectionKey
  const allObserved = observations.length === shapes.length * tones.length
  const thread = researchThreads.find((item) => item.id === mode)!
  const relatedPapers = readingTrails[mode]
    .map((id) => papers.find((paper) => paper.arxivId === id))
    .filter((paper): paper is Publication => Boolean(paper))
  const searchWords = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  const matchingPapers = papers.filter((paper) => {
    const text = [paper.title, ...paper.authors, paper.venue, paper.year, ...paper.tags, paperSummary(paper)].join(' ').toLocaleLowerCase()
    return (topic === 'all' || paper.tags.includes(topic))
      && (year === 'all' || paper.year.toString() === year)
      && searchWords.every((word) => text.includes(word))
  })
  const hasFilters = Boolean(query || topic !== 'all' || year !== 'all')

  let selectionHelp: string
  if (mode === 'compose') {
    selectionHelp = isComposed
      ? `${observationName(selection)}: a familiar shape and color, combined. Change either part to try another concept.`
      : `${observationName(selection)} is the combination to try. Bring these two reusable parts together.`
  } else if (allObserved) {
    selectionHelp = 'Every shape–color pair is now in the tree. Reset to explore the first step again.'
  } else if (isKnown) {
    selectionHelp = `${observationName(selection)} is already in the tree. Choose another pair to add an observation.`
  } else {
    selectionHelp = hasShape
      ? `${observationName(selection)} will join the existing ${shape} branch. The earlier observations remain connected.`
      : `${observationName(selection)} will open a new branch. The earlier observations remain connected.`
  }

  function addOrCompose() {
    if (mode === 'compose') {
      setComposition(selectionKey)
      setMessage(`${observationName(selection)} brings a familiar shape and color together. Try changing one of its parts.`)
      return
    }
    if (isKnown) return
    setObservations((current) => current.some((item) => observationKey(item) === selectionKey) ? current : [...current, selection])
    setLatest(selectionKey)
    setMessage(observations.length + 1 === shapes.length * tones.length
      ? `${observationName(selection)} added. Every shape–color pair is now here. Reset to explore the first step again.`
      : `${observationName(selection)} added ${hasShape ? `to the ${shape} branch` : 'on a new branch'}. All earlier observations remain connected.`)
  }

  function resetIllustration() {
    setMode('remember')
    setObservations(startingObservations)
    setShape('square')
    setTone('coral')
    setLatest(null)
    setComposition(null)
    setMessage('Reset. The original observations are back. Try adding a coral square to make a new branch.')
  }

  function clearFilters() {
    setQuery('')
    setTopic('all')
    setYear('all')
  }

  return (
    <div className="design-surface workbench" id="workbench-top">
      <a className="workbench-skip" href="#workbench-lab">Skip to the illustration</a>
      <header className="workbench-header">
        <a className="workbench-wordmark" href="#workbench-top" aria-label="Zekun Wang, back to top">
          <svg className="workbench-mark" width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
            <path d="M 8 8 L 26 26 M 26 8 L 8 26" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8" cy="8" r="5" fill="currentColor" />
            <circle cx="26" cy="8" r="5" fill="currentColor" />
            <circle cx="8" cy="26" r="5" fill="currentColor" />
            <circle className="workbench-mark-coral" cx="26" cy="26" r="5" />
          </svg>
          <span>Zekun Wang<span className="workbench-wordmark-caption">A research workbench</span></span>
        </a>
        <nav className="workbench-nav" aria-label="Page navigation">
          <a href="#workbench-lab">Explore <span aria-hidden="true">↘</span></a>
          <a href="#workbench-archive">Research <span className="workbench-nav-count">{papers.length}</span></a>
          <a href={profile.cv} target="_blank" rel="noreferrer">CV <Arrow className="workbench-arrow" /></a>
        </nav>
      </header>

      <main className="workbench-main">
        <div className="workbench-split">
          <aside className="workbench-profile" aria-labelledby="workbench-name">
            <div className="workbench-profile-inner">
              <p className="workbench-eyebrow">Hello, I’m</p>
              <h1 id="workbench-name">{profile.name}<span className="workbench-name-dot">.</span></h1>
              <div className="workbench-position">
                <p>{profile.title}</p>
                <p>{profile.affiliation}</p>
              </div>
              <p className="workbench-introduction">
                I study how AI can learn new things without losing what it already knows.
              </p>
              <p className="workbench-advisor">I’m advised by {profile.advisor}.</p>
              <div className="workbench-profile-links">
                <a href={`mailto:${profile.email}`}>{profile.email} <Arrow className="workbench-arrow" /></a>
                <a href={profile.scholar} target="_blank" rel="noreferrer">Google Scholar <Arrow className="workbench-arrow" /></a>
                <a href={profile.cv} target="_blank" rel="noreferrer">Curriculum vitae <Arrow className="workbench-arrow" /></a>
              </div>
              <div className="workbench-margin-note">
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
                  <path d="M 15 1 V 29 M 1 15 H 29 M 5 5 L 25 25 M 25 5 L 5 25" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <p>{profile.research}</p>
              </div>
              <a className="workbench-profile-archive" href="#workbench-archive">
                Follow the questions <span aria-hidden="true">↓</span>
              </a>
            </div>
          </aside>

          <div className="workbench-exploration">
            <section className="workbench-lab" id="workbench-lab" aria-labelledby="workbench-lab-title" tabIndex={-1}>
              <div className="workbench-lab-heading">
                <p className="workbench-eyebrow"><span className="workbench-section-number">01</span> A thought to play with</p>
                <span className="workbench-conceptual-label">Conceptual illustration</span>
              </div>
              <h2 id="workbench-lab-title">A little room for new ideas.</h2>
              <div className="workbench-mode-row">
                <div className="workbench-modes" role="group" aria-label="Choose a learning idea">
                  {(['remember', 'compose'] as const).map((item, index) => (
                    <button
                      className="workbench-mode"
                      type="button"
                      aria-pressed={mode === item}
                      aria-controls="workbench-illustration workbench-related"
                      onClick={() => { setMode(item); setMessage('') }}
                      key={item}
                    >
                      <span className="workbench-mode-letter" aria-hidden="true">{index === 0 ? 'A' : 'B'}</span>
                      {item === 'remember' ? 'Remember' : 'Compose'}
                    </button>
                  ))}
                </div>
                <button className="workbench-reset" type="button" onClick={resetIllustration}>
                  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M 3 8 A 7 7 0 1 1 4 15 M 3 3 V 8 H 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Reset
                </button>
              </div>
              <p className="workbench-instruction">
                {mode === 'remember'
                  ? 'Add an observation. Let the hierarchy grow without losing its earlier examples.'
                  : 'Choose a shape and a color. See how familiar parts can become a new concept.'}
              </p>
              <figure className="workbench-figure" id="workbench-illustration">
                {mode === 'remember'
                  ? <RememberDrawing observations={observations} latest={latest} />
                  : <ComposeDrawing selection={selection} composed={isComposed} />}
                <div className="workbench-controls">
                  <fieldset className="workbench-choice">
                    <legend>Choose a shape</legend>
                    <div className="workbench-choice-options">
                      {shapes.map((item) => (
                        <label className="workbench-shape-option" key={item}>
                          <input
                            type="radio"
                            name="workbench-shape"
                            value={item}
                            checked={shape === item}
                            onChange={() => { setShape(item); setMessage('') }}
                          />
                          <span className="workbench-shape-face">
                            <svg width="24" height="24" viewBox="-16 -16 32 32" aria-hidden="true">
                              <ShapeGlyph shape={item} size={10} outline />
                            </svg>
                            <span className="workbench-visually-hidden">{item}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="workbench-choice">
                    <legend>Choose a color</legend>
                    <div className="workbench-choice-options">
                      {tones.map((item) => (
                        <label className="workbench-tone-option" key={item}>
                          <input
                            type="radio"
                            name="workbench-tone"
                            value={item}
                            checked={tone === item}
                            onChange={() => { setTone(item); setMessage('') }}
                          />
                          <span className="workbench-tone-face">
                            <span className={`workbench-swatch workbench-swatch-${item}`} aria-hidden="true" />
                            {item === 'blue' ? 'Blue' : 'Coral'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <button
                    className="workbench-action"
                    type="button"
                    disabled={mode === 'remember' ? isKnown : isComposed}
                    onClick={addOrCompose}
                    aria-describedby="workbench-feedback"
                  >
                    <span aria-hidden="true">{mode === 'remember' ? '+' : '↗'}</span>
                    {mode === 'remember'
                      ? (allObserved ? 'All observations added' : isKnown ? 'Already in the tree' : 'Add observation')
                      : (isComposed ? 'Concept composed' : 'Compose concepts')}
                  </button>
                </div>
                <p className="workbench-feedback" id="workbench-feedback" role="status" aria-atomic="true">
                  <span className="workbench-feedback-mark" aria-hidden="true">↳</span>
                  {message || selectionHelp}
                </p>
                <figcaption className="workbench-figure-caption">
                  A conceptual sketch of how a growing system organizes experience.
                </figcaption>
              </figure>
            </section>

            <section className="workbench-related" id="workbench-related" aria-labelledby="workbench-related-title">
              <div className="workbench-related-heading">
                <div>
                  <p className="workbench-eyebrow">Follow this idea into my work</p>
                  <h3 id="workbench-related-title">{thread.title}</h3>
                </div>
                <span className="workbench-reading-mark" aria-hidden="true">↙</span>
              </div>
              <p className="workbench-related-description">{thread.description}</p>
              <ol className="workbench-reading-list">
                {relatedPapers.map((paper, index) => (
                  <li className="workbench-reading-item" key={paper.id}>
                    <span className="workbench-reading-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                    <article className="workbench-reading-paper">
                      <p className="workbench-paper-venue">{paper.venue}</p>
                      <h4><a href={paperHref(paper)} target="_blank" rel="noreferrer">{paper.title}<Arrow className="workbench-arrow" /></a></h4>
                      <p className="workbench-reading-summary">{paperSummary(paper)}</p>
                    </article>
                  </li>
                ))}
              </ol>
              <a className="workbench-all-research" href="#workbench-archive">Browse all {papers.length} papers <Arrow direction="right" className="workbench-arrow" /></a>
            </section>
          </div>
        </div>

        <section className="workbench-archive" id="workbench-archive" aria-labelledby="workbench-archive-title">
          <div className="workbench-archive-heading">
            <div>
              <p className="workbench-eyebrow"><span className="workbench-section-number">02</span> The research archive</p>
              <h2 id="workbench-archive-title">The questions keep growing.</h2>
              <p>Explore my papers. Open a title for a short introduction and links to the work.</p>
            </div>
            <div className="workbench-archive-stamp" aria-label={`${papers.length} papers, ${Math.min(...years)} to ${Math.max(...years)}`}>
              <span>{papers.length}</span>
              <span>papers</span>
              <span>{Math.min(...years)}–{Math.max(...years)}</span>
            </div>
          </div>
          <form className="workbench-search-form" role="search" onSubmit={(event) => event.preventDefault()}>
            <div className="workbench-search-field">
              <label htmlFor="workbench-search">Find a paper</label>
              <div className="workbench-search-input-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="m 15.5 15.5 5 5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <input
                  id="workbench-search"
                  type="search"
                  placeholder="Titles, authors, or ideas…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-controls="workbench-results"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="workbench-filter-field">
              <label htmlFor="workbench-topic">Research topic</label>
              <select id="workbench-topic" value={topic} onChange={(event) => setTopic(event.target.value)} aria-controls="workbench-results">
                <option value="all">All research topics</option>
                {topics.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="workbench-filter-field workbench-year-field">
              <label htmlFor="workbench-year">Year</label>
              <select id="workbench-year" value={year} onChange={(event) => setYear(event.target.value)} aria-controls="workbench-results">
                <option value="all">All years</option>
                {years.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </form>
          <div className="workbench-results-bar">
            <p role="status" aria-atomic="true">{matchingPapers.length} of {papers.length} papers<span className="workbench-results-order"> · newest first</span></p>
            <button type="button" onClick={clearFilters} disabled={!hasFilters}>Clear filters <span aria-hidden="true">×</span></button>
          </div>
          <div id="workbench-results">
            {matchingPapers.length === 0 ? (
              <div className="workbench-empty">
                <h3>No papers found.</h3>
                <p>Try another word, a broader topic, or clear the filters to see all my work.</p>
              </div>
            ) : (
              <ol className="workbench-archive-list">
                {matchingPapers.map((paper) => (
                  <li className="workbench-archive-item" key={paper.id}>
                    <details className="workbench-paper" id={`workbench-paper-${paper.id}`}>
                      <summary className="workbench-paper-toggle">
                        <h3 className="workbench-paper-heading">
                          <span className="workbench-paper-year">{paper.year}</span>
                          <span className="workbench-paper-overview">
                            <span className="workbench-paper-title">{paper.title}</span>
                            <span className="workbench-paper-byline">{formatAuthors(paper, 4)}</span>
                          </span>
                          <span className="workbench-paper-venue">{paper.venue}</span>
                          <span className="workbench-paper-expand" aria-hidden="true">+</span>
                        </h3>
                      </summary>
                      <div className="workbench-paper-detail">
                        <p className="workbench-paper-authors">
                          {paper.authors.map((author, index) => (
                            <span key={`${author}-${index}`}>
                              {index > 0 && ', '}{author === profile.name ? <strong>{author}</strong> : author}
                            </span>
                          ))}
                        </p>
                        <p className="workbench-paper-summary">{paperSummary(paper)}</p>
                        <div className="workbench-paper-tags">{paper.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                        <PaperResources paper={paper} />
                      </div>
                    </details>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </main>
      <footer className="workbench-footer">
        <p>{profile.name}<span aria-hidden="true"> / </span>{profile.shortAffiliation}</p>
        <a href={`mailto:${profile.email}`}>{profile.email} <Arrow className="workbench-arrow" /></a>
        <a href="#workbench-top">Back to the workbench <span aria-hidden="true">↑</span></a>
      </footer>
    </div>
  )
}
