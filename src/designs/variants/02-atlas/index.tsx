import { useState, type CSSProperties } from 'react'
import {
  Arrow,
  formatAuthors,
  paperHref,
  papers,
  papersForTopic,
  paperSummary,
  profile,
  topics,
  type Publication,
} from '../../shared'
import './style.css'

type Point = { x: number; y: number }
type MapLayout = 'desktop' | 'mobile'
type View = 'map' | 'list'

// Coordinates arrange the drawing, not a measure of similarity. Every edge
// below is derived from a paper's canonical tags.
const atlasTopicPoints: Record<string, Point> = {
  'continual learning': { x: 160, y: 142 },
  compositionality: { x: 770, y: 150 },
  'language models': { x: 145, y: 380 },
  'reinforcement learning': { x: 240, y: 578 },
  'concept learning': { x: 750, y: 465 },
  'diffusion models': { x: 510, y: 275 },
}

const atlasPaperPoints: Record<string, Point> = {
  '2605.07078': { x: 758, y: 296 },
  '2605.07076': { x: 315, y: 269 },
  '2505.13281': { x: 920, y: 356 },
  '2511.15029': { x: 916, y: 514 },
  '2601.18065': { x: 504, y: 386 },
  '2602.02417': { x: 373, y: 87 },
  '2604.14489': { x: 383, y: 324 },
  '2509.23593': { x: 340, y: 185 },
  '2603.29895': { x: 862, y: 591 },
  '2405.13828': { x: 68, y: 495 },
  '2510.02539': { x: 518, y: 486 },
  '2505.24601': { x: 734, y: 570 },
  '2509.23602': { x: 608, y: 585 },
  '2305.12544': { x: 63, y: 195 },
  '2205.02829': { x: 57, y: 427 },
}

const atlasReference = (paper: Publication) =>
  `P${String(papers.findIndex((item) => item.id === paper.id) + 1).padStart(2, '0')}`

const atlasPaperCount = (count: number) => `${count} ${count === 1 ? 'paper' : 'papers'}`

function topicPoint(topic: string, index: number, layout: MapLayout): Point {
  return layout === 'mobile'
    ? { x: 184, y: 61 + index * 80 }
    : atlasTopicPoints[topic] ?? { x: 160 + (index % 3) * 310, y: 142 + Math.floor(index / 3) * 320 }
}

function paperPoint(paper: Publication, index: number, layout: MapLayout): Point {
  return layout === 'mobile'
    ? { x: 342, y: 37 + index * 32 }
    : atlasPaperPoints[paper.arxivId ?? ''] ?? { x: 400 + (index % 4) * 70, y: 100 + Math.floor(index / 4) * 120 }
}

function membershipPath(from: Point, to: Point): string {
  const bend = (from.x + to.x) / 2
  return `M ${from.x} ${from.y} C ${bend} ${from.y}, ${bend} ${to.y}, ${to.x} ${to.y}`
}

function ViewIcon({ view }: { view: View }) {
  return (
    <svg className="atlas-view-icon" width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {view === 'map' ? (
        <>
          <path d="m4 5 11 2-7 8-4-10Z" stroke="currentColor" />
          <circle cx="4" cy="5" r="2" fill="currentColor" />
          <circle cx="15" cy="7" r="2" fill="currentColor" />
          <circle cx="8" cy="15" r="2" fill="currentColor" />
        </>
      ) : (
        <path d="M7 5h10M7 10h10M7 15h10M2 5h2M2 10h2M2 15h2" stroke="currentColor" strokeWidth="1.5" />
      )}
    </svg>
  )
}

function ResearchMap({
  topic,
  selectedPaper,
  visiblePapers,
  onTopic,
  onPaper,
}: {
  topic: string
  selectedPaper: Publication
  visiblePapers: Publication[]
  onTopic: (topic: string) => void
  onPaper: (paper: Publication) => void
}) {
  const visibleIds = new Set(visiblePapers.map((paper) => paper.id))

  const drawMap = (layout: MapLayout) => (
    <svg
      className={`atlas-map-drawing atlas-map-drawing-${layout}`}
      viewBox={layout === 'desktop' ? '0 0 1000 650' : '0 0 400 520'}
      preserveAspectRatio={layout === 'mobile' ? 'none' : 'xMidYMid meet'}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {layout === 'desktop' && (
        <g className="atlas-map-guides">
          <path d="M24 24h24M24 24v24M976 24h-24M976 24v24M24 626h24M24 626v-24M976 626h-24M976 626v-24" />
          <path d="M333 24v602M666 24v602M24 217h952M24 434h952" strokeDasharray="2 8" />
        </g>
      )}
      {/* Draw the inspected paper last so its real memberships stay legible. */}
      {[...papers].sort((a, b) => Number(a.id === selectedPaper.id) - Number(b.id === selectedPaper.id)).map((paper) => {
        const index = papers.findIndex((item) => item.id === paper.id)
        const point = paperPoint(paper, index, layout)
        return topics.filter((item) => paper.tags.includes(item)).map((item) => (
          <path
            key={`${paper.id}-${item}`}
            className="atlas-map-connection"
            data-selected={paper.id === selectedPaper.id}
            data-muted={!visibleIds.has(paper.id)}
            d={membershipPath(topicPoint(item, topics.indexOf(item), layout), point)}
          />
        ))
      })}
      {topics.map((item, index) => {
        const point = topicPoint(item, index, layout)
        return (
          <g key={item} className="atlas-map-junction" data-related={selectedPaper.tags.includes(item)} data-selected={topic === item}>
            <circle cx={point.x} cy={point.y} r={layout === 'desktop' ? 9 : 6} />
            <circle cx={point.x} cy={point.y} r="2" />
          </g>
        )
      })}
      {layout === 'mobile' && papers.map((paper, index) => {
        const point = paperPoint(paper, index, layout)
        return (
          <g
            key={paper.id}
            className="atlas-map-reference"
            data-selected={paper.id === selectedPaper.id}
            data-muted={!visibleIds.has(paper.id)}
          >
            <rect x={point.x - 4} y={point.y - 4} width="8" height="8" />
            <text x={point.x + 13} y={point.y + 4}>{atlasReference(paper)}</text>
          </g>
        )
      })}
    </svg>
  )

  return (
    <section className="atlas-map-region" aria-labelledby="atlas-map-heading">
      <div className="atlas-map-heading">
        <h3 id="atlas-map-heading">Six research interests</h3>
        <span className="atlas-map-heading-note">Choose a topic to explore</span>
      </div>
      <div className="atlas-map-canvas" role="group" aria-label="Research topics" aria-describedby="atlas-map-caption">
        {drawMap('desktop')}
        {drawMap('mobile')}
        {topics.map((item, index) => {
          const desktop = topicPoint(item, index, 'desktop')
          const mobile = topicPoint(item, index, 'mobile')
          const position = {
            '--atlas-topic-x': `${desktop.x / 10}%`,
            '--atlas-topic-y': `${desktop.y / 6.5}%`,
            '--atlas-topic-mobile-y': `${mobile.y / 5.2}%`,
          } as CSSProperties
          return (
            <button
              key={item}
              type="button"
              className="atlas-map-topic"
              style={position}
              aria-pressed={topic === item}
              aria-controls="atlas-papers atlas-inspector"
              aria-label={`${item}, ${atlasPaperCount(papersForTopic(item).length)}`}
              data-related={selectedPaper.tags.includes(item)}
              onClick={() => onTopic(item)}
            >
              <span className="atlas-topic-meta">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span>{atlasPaperCount(papersForTopic(item).length)}</span>
              </span>
              <span className="atlas-topic-name">{item}</span>
            </button>
          )
        })}
        {papers.map((paper, index) => {
          const point = paperPoint(paper, index, 'desktop')
          return (
            <button
              key={paper.id}
              type="button"
              className="atlas-map-paper"
              style={{ left: `${point.x / 10}%`, top: `${point.y / 6.5}%` }}
              aria-label={`${atlasReference(paper)}: ${paper.title}`}
              aria-pressed={selectedPaper.id === paper.id}
              aria-controls="atlas-inspector"
              disabled={!visibleIds.has(paper.id)}
              onClick={() => onPaper(paper)}
            >
              <span className="atlas-paper-pin">{atlasReference(paper)}</span>
            </button>
          )
        })}
      </div>
      <div className="atlas-map-caption" id="atlas-map-caption">
        <p><span className="atlas-legend-line" aria-hidden="true" /> Lines connect papers to their topics. Citron traces the paper in focus.</p>
        <a href="#atlas-papers">Browse {atlasPaperCount(visiblePapers.length)} <Arrow className="atlas-arrow" direction="right" /></a>
      </div>
    </section>
  )
}

export default function Atlas() {
  const [view, setView] = useState<View>('map')
  const [topic, setTopic] = useState('all')
  const [selectedId, setSelectedId] = useState(papers[0].id)
  const visiblePapers = papersForTopic(topic)
  const selectedPaper = visiblePapers.find((paper) => paper.id === selectedId) ?? visiblePapers[0]
  const selectedIndex = visiblePapers.findIndex((paper) => paper.id === selectedPaper.id)
  const firstYear = Math.min(...papers.map((paper) => paper.year))
  const lastYear = Math.max(...papers.map((paper) => paper.year))

  function selectTopic(nextTopic: string) {
    const nextPapers = papersForTopic(nextTopic)
    setTopic(nextTopic)
    if (!nextPapers.some((paper) => paper.id === selectedId)) {
      setSelectedId(nextPapers[0].id)
    }
  }

  return (
    <div className="design-surface atlas" id="atlas-top" lang="en">
      <a className="atlas-skip-link" href="#atlas-explore">Skip to research</a>
      <header className="atlas-masthead">
        <div className="atlas-identity">
          <a className="atlas-name" href="#atlas-top">
            <h1>{profile.name}</h1>
            <span className="atlas-name-mark" aria-hidden="true">↗</span>
          </a>
          <p>{profile.title} <span aria-hidden="true">/</span> {profile.shortAffiliation}</p>
        </div>
        <nav className="atlas-navigation" aria-label="Personal links">
          <a href="#atlas-about">About</a>
          <a href={`mailto:${profile.email}`}>Email <Arrow className="atlas-arrow" /></a>
          <a href={profile.cv} target="_blank" rel="noreferrer">CV <Arrow className="atlas-arrow" /></a>
          <a href={profile.scholar} target="_blank" rel="noreferrer">Scholar <Arrow className="atlas-arrow" /></a>
        </nav>
      </header>

      <main>
        <section className="atlas-explorer" id="atlas-explore" aria-labelledby="atlas-title" tabIndex={-1}>
          <div className="atlas-overview">
            <div>
              <p className="atlas-eyebrow">Research atlas <span aria-hidden="true">/</span> {firstYear}–{lastYear}</p>
              <h2 id="atlas-title">Learning, connected<span className="atlas-title-period">.</span></h2>
            </div>
            <p className="atlas-overview-copy">{profile.research}</p>
          </div>

          <div className="atlas-toolbar">
            <div className="atlas-view-toggle" role="group" aria-label="Research view">
              <button type="button" aria-pressed={view === 'map'} aria-controls="atlas-browse" onClick={() => setView('map')}>
                <ViewIcon view="map" /> Map <span className="atlas-view-word">view</span>
              </button>
              <button type="button" aria-pressed={view === 'list'} aria-controls="atlas-browse" onClick={() => setView('list')}>
                <ViewIcon view="list" /> List <span className="atlas-view-word">view</span>
              </button>
            </div>
            <p className="atlas-result-count">{String(visiblePapers.length).padStart(2, '0')} <span>/ {papers.length} papers</span></p>
            <button className="atlas-reset" type="button" onClick={() => selectTopic('all')} aria-pressed={topic === 'all'} aria-controls="atlas-browse">
              <span aria-hidden="true">↺</span> All topics
            </button>
          </div>
          <p className="atlas-sr-only" role="status" aria-live="polite" aria-atomic="true">
            {atlasPaperCount(visiblePapers.length)} in {topic === 'all' ? 'all topics' : topic}. Paper in focus: {selectedPaper.title}.
          </p>

          <div className="atlas-browse" id="atlas-browse" data-view={view}>
            {view === 'map' ? (
              <ResearchMap
                topic={topic}
                selectedPaper={selectedPaper}
                visiblePapers={visiblePapers}
                onTopic={selectTopic}
                onPaper={(paper) => setSelectedId(paper.id)}
              />
            ) : (
              <div className="atlas-list-filter">
                <p className="atlas-eyebrow" id="atlas-filter-label">Explore by research interest</p>
                <div className="atlas-filter-options" role="group" aria-labelledby="atlas-filter-label">
                  {topics.map((item, index) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={topic === item}
                      aria-controls="atlas-papers atlas-inspector"
                      onClick={() => selectTopic(item)}
                    >
                      <span className="atlas-filter-number">{String(index + 1).padStart(2, '0')}</span>
                      <span>{item}</span>
                      <span className="atlas-filter-count">{papersForTopic(item).length}<span className="atlas-sr-only"> {papersForTopic(item).length === 1 ? 'paper' : 'papers'}</span></span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <aside className="atlas-inspector" id="atlas-inspector" aria-labelledby="atlas-inspector-label">
              <div className="atlas-inspector-top">
                <h3 className="atlas-eyebrow" id="atlas-inspector-label">Paper in focus</h3>
                <span className="atlas-focus-reference">{atlasReference(selectedPaper)}</span>
              </div>
              <article className="atlas-inspector-article">
                <p className="atlas-paper-venue">{selectedPaper.venue}</p>
                <h4 className="atlas-inspector-title" id="atlas-inspector-title" tabIndex={-1}>{selectedPaper.title}</h4>
                <div className="atlas-authors">
                  <p>{formatAuthors(selectedPaper, 4)}</p>
                  {selectedPaper.authors.length > 4 && (
                    <details key={selectedPaper.id} className="atlas-authors-details">
                      <summary>All {selectedPaper.authors.length} authors</summary>
                      <p>{selectedPaper.authors.join(', ')}</p>
                    </details>
                  )}
                </div>
                <p className="atlas-paper-summary">{paperSummary(selectedPaper)}</p>
                <div className="atlas-paper-links">
                  <a className="atlas-read-paper" href={paperHref(selectedPaper)} target="_blank" rel="noreferrer">
                    Read paper <Arrow className="atlas-arrow" />
                  </a>
                  {selectedPaper.pdfUrl && (
                    <a className="atlas-read-pdf" href={selectedPaper.pdfUrl} target="_blank" rel="noreferrer">
                      PDF <Arrow className="atlas-arrow" />
                    </a>
                  )}
                </div>
                <div className="atlas-paper-membership">
                  <p className="atlas-eyebrow">Find this paper in</p>
                  <div className="atlas-membership-links" role="group" aria-label="This paper's research topics">
                    {topics.filter((item) => selectedPaper.tags.includes(item)).map((item) => (
                      <button type="button" key={item} onClick={() => selectTopic(item)} aria-pressed={topic === item} aria-controls="atlas-papers">
                        <span className="atlas-membership-dot" aria-hidden="true" />{item}<Arrow className="atlas-arrow" direction="right" />
                      </button>
                    ))}
                  </div>
                </div>
                <details className="atlas-technical-summary" key={selectedPaper.id}>
                  <summary>Research summary</summary>
                  <p>{selectedPaper.summary}</p>
                </details>
              </article>
              <div className="atlas-paper-pagination" role="group" aria-label="Browse papers in the current topic">
                <button
                  type="button"
                  disabled={selectedIndex === 0}
                  aria-label="Previous paper"
                  aria-controls="atlas-inspector"
                  onClick={() => setSelectedId(visiblePapers[selectedIndex - 1].id)}
                ><span aria-hidden="true">←</span> Prev</button>
                <span>{String(selectedIndex + 1).padStart(2, '0')} <span className="atlas-pagination-divider">/</span> {String(visiblePapers.length).padStart(2, '0')}</span>
                <button
                  type="button"
                  disabled={selectedIndex === visiblePapers.length - 1}
                  aria-label="Next paper"
                  aria-controls="atlas-inspector"
                  onClick={() => setSelectedId(visiblePapers[selectedIndex + 1].id)}
                >Next <span aria-hidden="true">→</span></button>
              </div>
              <a className="atlas-inspector-return" href="#atlas-papers">Back to publication index <span aria-hidden="true">↑</span></a>
            </aside>

            <section className="atlas-papers" id="atlas-papers" aria-labelledby="atlas-papers-title" tabIndex={-1}>
              <div className="atlas-index-heading">
                <div>
                  <p className="atlas-eyebrow">Publication index</p>
                  <h3 id="atlas-papers-title">{topic === 'all' ? 'All research' : topic}<span className="atlas-index-total">{visiblePapers.length}</span></h3>
                </div>
                <p>Select a title to inspect</p>
              </div>
              <ol className="atlas-paper-index">
                {visiblePapers.map((paper) => (
                  <li className="atlas-result" key={paper.id} data-selected={paper.id === selectedPaper.id}>
                    <span className="atlas-result-reference">{atlasReference(paper)}</span>
                    <div className="atlas-result-body">
                      <p className="atlas-result-venue">{paper.venue}</p>
                      <h4>
                        <a
                          className="atlas-result-title"
                          href="#atlas-inspector-title"
                          onClick={() => setSelectedId(paper.id)}
                          aria-current={paper.id === selectedPaper.id ? 'true' : undefined}
                        >{paper.title}</a>
                      </h4>
                      {view === 'list' && (
                        <>
                          <p className="atlas-result-summary">{paperSummary(paper)}</p>
                          <p className="atlas-result-tags">{paper.tags.join(' · ')}</p>
                        </>
                      )}
                    </div>
                    <a className="atlas-result-link" href={paperHref(paper)} target="_blank" rel="noreferrer" aria-label={`Read ${paper.title}`}>
                      <span className="atlas-result-read">Read</span><Arrow className="atlas-arrow" />
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </section>

        <section className="atlas-about" id="atlas-about" aria-labelledby="atlas-about-title">
          <div className="atlas-about-heading">
            <p className="atlas-eyebrow">Beyond the map</p>
            <h2 id="atlas-about-title">{profile.question}</h2>
          </div>
          <div className="atlas-about-copy">
            <p>{profile.intro}</p>
            <p>{profile.research}</p>
            <a className="atlas-email" href={`mailto:${profile.email}`}>{profile.email}<Arrow className="atlas-arrow" /></a>
          </div>
        </section>
      </main>
      <footer className="atlas-footer">
        <p>{profile.name} <span aria-hidden="true">/</span> {profile.affiliation}</p>
        <a href="#atlas-top">Back to the map <span aria-hidden="true">↑</span></a>
      </footer>
    </div>
  )
}
