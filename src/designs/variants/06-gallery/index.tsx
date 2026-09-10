import { useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { formatAuthors, paperHref, paperSummary, papers, profile, topics } from '../../shared'
import type { Publication } from '../../shared'
import './style.css'

type ArtworkKind = 'concepts' | 'memory' | 'composition'

interface Exhibit {
  kind: ArtworkKind
  label: string
  title: string
  color: string
  note: string
  paper: Publication
}

const exhibitSelection: Omit<Exhibit, 'paper'>[] = [
  {
    kind: 'concepts',
    label: 'Concept hierarchies',
    title: 'The shape of a concept.',
    color: '#d94727',
    note: 'A shared center branches into increasingly specific forms.',
  },
  {
    kind: 'memory',
    label: 'Memory & retention',
    title: 'Room for the next idea.',
    color: '#3d4cd5',
    note: 'A continuous thread holds its structure as new layers unfold.',
  },
  {
    kind: 'composition',
    label: 'Compositionality',
    title: 'More than the parts.',
    color: '#617c32',
    note: 'A small vocabulary of curves and angles becomes a new whole.',
  },
]

const exhibitPaperIds = ['2509.23602', '2509.23593', '2605.07078']
const exhibits: Exhibit[] = exhibitSelection.flatMap((exhibit, index) => {
  const paper = papers.find((item) => item.arxivId === exhibitPaperIds[index])
  return paper ? [{ ...exhibit, paper }] : []
})
const publicationYears = [...new Set(papers.map((paper) => paper.year))].sort((a, b) => b - a)
const collectionYears = `${Math.min(...publicationYears)}–${Math.max(...publicationYears)}`

function GalleryArrow({ direction = 'out' }: { direction?: 'out' | 'left' | 'right' | 'up' }) {
  const paths = {
    out: 'M5 19 19 5M5 5h14v14',
    left: 'M20 12H4m7-7-7 7 7 7',
    right: 'M4 12h16m-7-7 7 7-7 7',
    up: 'M12 20V4m-7 7 7-7 7 7',
  }
  return (
    <svg className="gallery-arrow" width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={paths[direction]} stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  )
}

function ExhibitMark({ kind }: { kind: ArtworkKind }) {
  return (
    <svg className="gallery-exhibit-mark" width="38" height="38" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      {kind === 'concepts' && (
        <>
          <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="5" strokeDasharray="20 3.56" />
          <circle cx="20" cy="20" r="7" stroke="currentColor" strokeWidth="4" />
          <circle cx="20" cy="20" r="2" fill="currentColor" />
        </>
      )}
      {kind === 'memory' && (
        <>
          <ellipse cx="13" cy="20" rx="7" ry="15" transform="rotate(20 13 20)" stroke="currentColor" strokeWidth="3" />
          <ellipse cx="21" cy="20" rx="7" ry="15" transform="rotate(20 21 20)" stroke="currentColor" strokeWidth="3" />
          <ellipse cx="29" cy="20" rx="7" ry="15" transform="rotate(20 29 20)" stroke="currentColor" strokeWidth="3" />
        </>
      )}
      {kind === 'composition' && (
        <path d="M3 19A16 16 0 0 1 19 3v8a8 8 0 0 0-8 8H3Zm18 2h8v8h8v8H21V21ZM3 23h8v6h6v8H3V23ZM23 3h14v14h-8v-6h-6V3Z" fill="currentColor" />
      )}
    </svg>
  )
}

function polar(radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180
  return [400 + radius * Math.cos(radians), 300 + radius * Math.sin(radians)]
}

function annularSegment(inner: number, outer: number, start: number, end: number) {
  const a = polar(outer, start)
  const b = polar(outer, end)
  const c = polar(inner, end)
  const d = polar(inner, start)
  const large = end - start > 180 ? 1 : 0
  return `M${a.join(',')} A${outer},${outer} 0 ${large} 1 ${b.join(',')} L${c.join(',')} A${inner},${inner} 0 ${large} 0 ${d.join(',')} Z`
}

function ConceptArtwork() {
  const levels = [
    { count: 2, inner: 52, outer: 101, gap: 8 },
    { count: 4, inner: 117, outer: 161, gap: 6 },
    { count: 8, inner: 177, outer: 211, gap: 4 },
    { count: 16, inner: 226, outer: 251, gap: 3 },
  ]
  return (
    <>
      <g fill="none" stroke="currentColor" strokeWidth="1" opacity=".7">
        {levels.map((level, depth) =>
          Array.from({ length: level.count }, (_, index) => {
            const angle = ((index + 0.5) * 360) / level.count - 12
            const parentAngle = ((Math.floor(index / 2) + 0.5) * 360) / (level.count / 2) - 12
            const parentRadius = depth === 0 ? 0 : levels[depth - 1].outer
            const middleRadius = (parentRadius + level.inner) / 2
            return (
              <path
                key={`gallery-branch-${depth}-${index}`}
                d={`M${polar(parentRadius, parentAngle).join(',')} C${polar(middleRadius, parentAngle).join(',')} ${polar(middleRadius, angle).join(',')} ${polar(level.inner, angle).join(',')}`}
              />
            )
          }),
        )}
      </g>
      <g fill="var(--gallery-accent)">
        <circle cx="400" cy="300" r="34" />
        {levels.map((level, depth) =>
          Array.from({ length: level.count }, (_, index) => (
            <path
              key={`gallery-sector-${depth}-${index}`}
              d={annularSegment(
                level.inner,
                level.outer,
                (index * 360) / level.count + level.gap - 12,
                ((index + 1) * 360) / level.count - level.gap - 12,
              )}
            />
          )),
        )}
      </g>
      <g fill="currentColor">
        <circle cx="400" cy="300" r="4" />
        {Array.from({ length: 16 }, (_, index) => {
          const angle = ((index + 0.5) * 360) / 16 - 12
          const [x, y] = polar(272, angle)
          return (
            <g key={`gallery-leaf-${index}`}>
              <path d={`M${polar(257, angle).join(',')} ${x},${y}`} stroke="currentColor" strokeWidth=".8" />
              <circle cx={x} cy={y} r="2.5" />
            </g>
          )
        })}
      </g>
      <path d="M105 99h62l33 33M600 468l33 33h62" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="200" cy="132" r="3" fill="currentColor" />
      <circle cx="600" cy="468" r="3" fill="currentColor" />
    </>
  )
}

function MemoryArtwork() {
  return (
    <>
      <g fill="none" stroke="currentColor" strokeWidth=".8" opacity=".25">
        <path d="M80 479 695 123M115 516 730 160" />
        <path d="m161 83 15 26m471 382 15 26" />
      </g>
      <g transform="translate(400 300) rotate(-22)" fill="none" stroke="var(--gallery-accent)">
        {[-174, 0, 174].map((center, layer) => (
          <g key={`gallery-memory-layer-${layer}`}>
            {Array.from({ length: 15 }, (_, line) => {
              const width = 43 + line * 4.9
              const height = 127 + line * 4.5
              return (
                <path
                  key={`gallery-memory-contour-${line}`}
                  d={`M${center},${-height} C${center + width},${-height} ${center + width + 24},${-height * 0.24} ${center + width - 4},36 C${center + width - 22},${height * 0.83} ${center + 18},${height} ${center - 15},${height} C${center - width},${height} ${center - width - 24},${height * 0.24} ${center - width + 4},-36 C${center - width + 22},${-height * 0.83} ${center - 18},${-height} ${center},${-height}Z`}
                  strokeWidth={line % 4 === 0 ? 3.4 : 1.7}
                />
              )
            })}
          </g>
        ))}
      </g>
      <path
        d="M77 369C161 406 208 216 308 251S458 397 515 300 631 193 723 228"
        fill="none"
        stroke="var(--gallery-art-ground)"
        strokeWidth="13"
      />
      <path
        d="M77 369C161 406 208 216 308 251S458 397 515 300 631 193 723 228"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <circle cx="77" cy="369" r="6" fill="var(--gallery-art-ground)" stroke="currentColor" strokeWidth="2" />
      <circle cx="723" cy="228" r="6" fill="currentColor" />
    </>
  )
}

function CompositionArtwork() {
  const modules = [
    { x: 270, y: 106, rotation: 0, shape: 'curve' },
    { x: 398, y: 106, rotation: 90, shape: 'curve' },
    { x: 526, y: 106, rotation: 0, shape: 'angle' },
    { x: 270, y: 234, rotation: 270, shape: 'curve' },
    { x: 398, y: 234, rotation: 0, shape: 'angle' },
    { x: 526, y: 234, rotation: 180, shape: 'curve' },
    { x: 270, y: 362, rotation: 180, shape: 'angle' },
    { x: 398, y: 362, rotation: 270, shape: 'curve' },
    { x: 526, y: 362, rotation: 180, shape: 'curve' },
  ]
  const curve = 'M128 0A128 128 0 0 1 0 128V72A72 72 0 0 0 72 0Z'
  const angle = 'M0 0H56L128 72V128H72L0 56Z'
  return (
    <>
      <g fill="none" stroke="currentColor" strokeWidth=".8" opacity=".4">
        <path d="M246 82h-12v12m444-12h12v12M234 502v12h12m432 0h12v-12M208 152v296" />
        <path d="M84 242h60m-30 47v24m-12-12h24M161 300h25m-8-8 8 8-8 8" />
      </g>
      <g fill="var(--gallery-accent)">
        <path d={curve} transform="translate(77 163) scale(.58)" />
        <path d={angle} transform="translate(77 359) scale(.58)" />
        {modules.map((module, index) => (
          <path
            key={`gallery-composition-module-${index}`}
            d={module.shape === 'curve' ? curve : angle}
            transform={`translate(${module.x} ${module.y}) rotate(${module.rotation} 64 64)`}
          />
        ))}
      </g>
      <g fill="var(--gallery-art-ground)" stroke="currentColor" strokeWidth="1.2">
        <circle cx="398" cy="234" r="5" />
        <circle cx="526" cy="362" r="5" />
        <circle cx="398" cy="490" r="5" />
      </g>
    </>
  )
}

function ResearchArtwork({ exhibit }: { exhibit: Exhibit }) {
  const descriptions: Record<ArtworkKind, string> = {
    concepts:
      'A vermilion radial hierarchy. A central concept divides into two, four, eight, then sixteen arc-shaped branches, connected by fine lines to increasingly specific prototypes.',
    memory:
      'Three overlapping blue coils made from many nested contours. A continuous black thread passes through all three, representing retained knowledge as learning continues.',
    composition:
      'Two green building blocks, a curved segment and an angular band, are rotated and combined into a larger interlocking geometric form.',
  }
  return (
    <svg
      className="gallery-artwork"
      viewBox="0 0 800 600"
      role="img"
      aria-labelledby={`gallery-art-title-${exhibit.kind} gallery-art-description-${exhibit.kind}`}
    >
      <title id={`gallery-art-title-${exhibit.kind}`}>{exhibit.title}</title>
      <desc id={`gallery-art-description-${exhibit.kind}`}>{descriptions[exhibit.kind]}</desc>
      {exhibit.kind === 'concepts' && <ConceptArtwork />}
      {exhibit.kind === 'memory' && <MemoryArtwork />}
      {exhibit.kind === 'composition' && <CompositionArtwork />}
    </svg>
  )
}

function PaperResources({ paper }: { paper: Publication }) {
  return (
    <div className="gallery-paper-links">
      <a className="gallery-read-paper" href={paperHref(paper)} target="_blank" rel="noreferrer">
        Read paper <GalleryArrow />
      </a>
      {paper.pdfUrl && (
        <a className="gallery-text-link" href={paper.pdfUrl} target="_blank" rel="noreferrer">
          PDF <GalleryArrow />
        </a>
      )}
    </div>
  )
}

function CollectionPaper({ paper, index }: { paper: Publication; index: number }) {
  return (
    <li className="gallery-collection-item">
      <details className="gallery-paper" id={`gallery-paper-${paper.id}`}>
        <summary className="gallery-paper-row">
          <span className="gallery-paper-number">{String(index + 1).padStart(2, '0')}</span>
          <span className="gallery-paper-heading">
            <span className="gallery-paper-title">{paper.title}</span>
            <span className="gallery-paper-author-preview">{formatAuthors(paper, 4)}</span>
          </span>
          <span className="gallery-paper-venue">{paper.venue}</span>
          <span className="gallery-expand" aria-hidden="true">
            <svg className="gallery-expand-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 10h14" stroke="currentColor" strokeWidth="1.3" />
              <path className="gallery-expand-vertical" d="M10 3v14" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </span>
        </summary>
        <div className="gallery-paper-content">
          <div className="gallery-paper-reading">
            <p className="gallery-paper-plain-summary">{paperSummary(paper)}</p>
            <details className="gallery-research-summary">
              <summary>Research summary</summary>
              <p>{paper.summary}</p>
            </details>
            <PaperResources paper={paper} />
          </div>
          <div className="gallery-paper-metadata">
            <h3 className="gallery-micro">Authors</h3>
            <p className="gallery-full-authors">{paper.authors.join(', ')}</p>
            <h3 className="gallery-micro">Research areas</h3>
            <ul className="gallery-paper-tags">
              {paper.tags.map((tag) => <li key={tag}>{tag}</li>)}
            </ul>
          </div>
        </div>
      </details>
    </li>
  )
}

export default function Gallery() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('all')
  const [year, setYear] = useState('all')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const searchRef = useRef<HTMLInputElement>(null)
  const activeExhibit = exhibits[activeIndex]
  const hasFilters = query !== '' || topic !== 'all' || year !== 'all'
  const filteredPapers = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
    return papers.filter((paper) => {
      if (topic !== 'all' && !paper.tags.includes(topic)) return false
      if (year !== 'all' && paper.year !== Number(year)) return false
      const searchable = [paper.title, ...paper.authors, paper.venue, paper.year, ...paper.tags, paperSummary(paper)]
        .join(' ')
        .toLocaleLowerCase()
      return terms.every((term) => searchable.includes(term))
    })
  }, [query, topic, year])

  function navigateExhibit(offset: number) {
    setActiveIndex((current) => (current + offset + exhibits.length) % exhibits.length)
  }

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex = index
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % exhibits.length
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + exhibits.length) % exhibits.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = exhibits.length - 1
    else return
    event.preventDefault()
    setActiveIndex(nextIndex)
    tabRefs.current[nextIndex]?.focus()
  }

  function resetCollection() {
    setQuery('')
    setTopic('all')
    setYear('all')
    searchRef.current?.focus()
  }

  if (!activeExhibit) return null
  const exhibitNumber = String(activeIndex + 1).padStart(2, '0')

  return (
    <div className="design-surface gallery" id="gallery-top">
      <a className="gallery-skip-link" href="#gallery-main">Skip to research</a>
      <div className="gallery-shell">
        <header className="gallery-header">
          <a className="gallery-wordmark" href="#gallery-top" aria-label="Zekun Wang, back to top">
            <svg className="gallery-wordmark-symbol" width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
              <path d="M1 1h10v4H5v6H1V1Zm14 0h10v10h-4V5h-6V1ZM1 15h4v6h6v4H1V15Zm20 0h4v10H15v-4h6v-6Z" fill="currentColor" />
            </svg>
            <span>ZW <span className="gallery-wordmark-divider">/</span> Research</span>
          </a>
          <nav className="gallery-navigation" aria-label="Main navigation">
            <a href="#gallery-exhibition">Selected work</a>
            <a href="#gallery-collection">Collection <span className="gallery-nav-count">{papers.length}</span></a>
            <a href="#gallery-about">About</a>
            <a href={profile.cv} target="_blank" rel="noreferrer">CV <GalleryArrow /></a>
          </nav>
        </header>

        <main className="gallery-main" id="gallery-main" tabIndex={-1}>
          <section className="gallery-intro" aria-labelledby="gallery-name">
            <div className="gallery-identity">
              <p className="gallery-micro">Concepts. Memory. Possibility.</p>
              <h1 id="gallery-name">{profile.name}</h1>
            </div>
            <div className="gallery-introduction">
              <p className="gallery-intro-statement">I study how AI can learn new things without losing what it already knows.</p>
              <p className="gallery-intro-affiliation">{profile.title}<br />{profile.affiliation}</p>
            </div>
          </section>

          <section
            className="gallery-exhibition"
            id="gallery-exhibition"
            aria-labelledby="gallery-exhibition-heading"
            style={{ '--gallery-accent': activeExhibit.color } as CSSProperties}
          >
            <div className="gallery-section-bar">
              <div className="gallery-section-label">
                <span className="gallery-section-dot" aria-hidden="true" />
                <h2 id="gallery-exhibition-heading">Selected work</h2>
                <span className="gallery-section-aside">Three studies in learning</span>
              </div>
              <div className="gallery-step-controls" aria-label="Exhibit navigation">
                <span className="gallery-step-count" aria-hidden="true">{exhibitNumber} / 03</span>
                <button type="button" onClick={() => navigateExhibit(-1)} aria-label="Previous exhibit" aria-controls="gallery-exhibit-panel">
                  <GalleryArrow direction="left" /><span>Previous</span>
                </button>
                <button type="button" onClick={() => navigateExhibit(1)} aria-label="Next exhibit" aria-controls="gallery-exhibit-panel">
                  <span>Next</span><GalleryArrow direction="right" />
                </button>
              </div>
            </div>

            <div className="gallery-exhibit-tabs" role="tablist" aria-label="Choose a research exhibit">
              {exhibits.map((exhibit, index) => (
                <button
                  className="gallery-exhibit-tab"
                  key={exhibit.kind}
                  id={`gallery-tab-${exhibit.kind}`}
                  role="tab"
                  type="button"
                  aria-selected={index === activeIndex}
                  aria-controls="gallery-exhibit-panel"
                  tabIndex={index === activeIndex ? 0 : -1}
                  ref={(element) => { tabRefs.current[index] = element }}
                  onClick={() => setActiveIndex(index)}
                  onKeyDown={(event) => handleTabKey(event, index)}
                  style={{ '--gallery-tab-color': exhibit.color } as CSSProperties}
                >
                  <span className="gallery-tab-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="gallery-tab-title">{exhibit.label}</span>
                  <ExhibitMark kind={exhibit.kind} />
                </button>
              ))}
            </div>

            <div
              className="gallery-exhibit-panel"
              id="gallery-exhibit-panel"
              role="tabpanel"
              aria-labelledby={`gallery-tab-${activeExhibit.kind}`}
              tabIndex={0}
            >
              <figure className="gallery-figure">
                <div className="gallery-art-stage">
                  <div className="gallery-art-meta" aria-hidden="true">
                    <span>Study {exhibitNumber}</span>
                    <span>{activeExhibit.label}</span>
                  </div>
                  <ResearchArtwork exhibit={activeExhibit} />
                  <span className="gallery-art-registration" aria-hidden="true">ZW / {exhibitNumber}</span>
                </div>
                <figcaption className="gallery-art-caption">
                  <span className="gallery-micro">Conceptual study, {exhibitNumber}</span>
                  <span>{activeExhibit.note}</span>
                </figcaption>
              </figure>

              <article className="gallery-exhibit-caption" key={activeExhibit.kind}>
                <div className="gallery-caption-heading">
                  <p className="gallery-micro">Exhibit {exhibitNumber} <span className="gallery-caption-slash" aria-hidden="true">/</span> {activeExhibit.label}</p>
                  <h3>{activeExhibit.title}</h3>
                </div>
                <div className="gallery-caption-paper">
                  <p className="gallery-caption-venue">{activeExhibit.paper.venue}</p>
                  <h4>{activeExhibit.paper.title}</h4>
                  <p className="gallery-caption-summary">{paperSummary(activeExhibit.paper)}</p>
                  <PaperResources paper={activeExhibit.paper} />
                  <details className="gallery-exhibit-details">
                    <summary>
                      Paper details
                      <span className="gallery-details-indicator" aria-hidden="true">+</span>
                    </summary>
                    <div className="gallery-exhibit-detail-content">
                      <h5 className="gallery-micro">Authors</h5>
                      <p>{activeExhibit.paper.authors.join(', ')}</p>
                      <h5 className="gallery-micro">Research summary</h5>
                      <p>{activeExhibit.paper.summary}</p>
                    </div>
                  </details>
                </div>
              </article>
            </div>
            <p className="gallery-visually-hidden" role="status" aria-live="polite" aria-atomic="true">
              Exhibit {activeIndex + 1} of {exhibits.length}: {activeExhibit.label}. {activeExhibit.paper.title}.
            </p>
            <div className="gallery-exhibition-footer">
              <span>A few ideas from my research.</span>
              <a className="gallery-text-link" href="#gallery-collection">Explore all {papers.length} publications <GalleryArrow direction="right" /></a>
            </div>
          </section>

          <section className="gallery-collection" id="gallery-collection" aria-labelledby="gallery-collection-heading">
            <div className="gallery-collection-heading">
              <div>
                <p className="gallery-micro">The complete collection <span aria-hidden="true">/</span> {collectionYears}</p>
                <h2 id="gallery-collection-heading">Ideas, in print<span className="gallery-heading-period">.</span></h2>
              </div>
              <p>Explore the papers behind the questions.<br />Select a title for a closer look.</p>
            </div>

            <div className="gallery-collection-filters" role="search" aria-label="Search and filter publications">
              <div className="gallery-search-field">
                <label className="gallery-micro" htmlFor="gallery-search">Search the collection</label>
                <div className="gallery-search-input-wrap">
                  <svg className="gallery-search-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <input
                    id="gallery-search"
                    className="gallery-search-input"
                    type="search"
                    placeholder="Title, author, or keyword"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    ref={searchRef}
                    aria-controls="gallery-publication-list"
                  />
                </div>
              </div>
              <div className="gallery-filter-field">
                <label className="gallery-micro" htmlFor="gallery-topic">Research area</label>
                <select id="gallery-topic" value={topic} onChange={(event) => setTopic(event.target.value)} aria-controls="gallery-publication-list">
                  <option value="all">All research areas</option>
                  {topics.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="gallery-filter-field">
                <label className="gallery-micro" htmlFor="gallery-year">Year</label>
                <select id="gallery-year" value={year} onChange={(event) => setYear(event.target.value)} aria-controls="gallery-publication-list">
                  <option value="all">All years</option>
                  {publicationYears.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </div>

            <div className="gallery-results-bar">
              <p role="status" aria-live="polite" aria-atomic="true">
                {filteredPapers.length} of {papers.length} publications
                <span className="gallery-results-order"> / newest first</span>
              </p>
              {hasFilters && <button className="gallery-clear-filters" type="button" onClick={resetCollection}>Clear filters <span aria-hidden="true">×</span></button>}
            </div>
            <ol className="gallery-publication-list" id="gallery-publication-list">
              {filteredPapers.map((paper) => <CollectionPaper key={paper.id} paper={paper} index={papers.indexOf(paper)} />)}
            </ol>
            {filteredPapers.length === 0 && (
              <div className="gallery-empty-state">
                <h3>No papers match these filters.</h3>
                <p>Try a different title, author, or research area.</p>
                <button className="gallery-reset-button" type="button" onClick={resetCollection}>Show all {papers.length} publications <GalleryArrow direction="right" /></button>
              </div>
            )}
            <a className="gallery-scholar-link gallery-text-link" href={profile.scholar} target="_blank" rel="noreferrer">
              Find my work on Google Scholar <GalleryArrow />
            </a>
          </section>

          <section className="gallery-about" id="gallery-about" aria-labelledby="gallery-about-heading">
            <div className="gallery-about-heading">
              <p className="gallery-micro">Behind the work</p>
              <h2 id="gallery-about-heading">Always<br />learning.</h2>
              <ExhibitMark kind="concepts" />
            </div>
            <div className="gallery-about-content">
              <p className="gallery-about-intro">{profile.intro}</p>
              <p className="gallery-about-research">{profile.research}</p>
              <dl className="gallery-profile-details">
                <div>
                  <dt className="gallery-micro">Affiliation</dt>
                  <dd>{profile.title}<br />{profile.affiliation}</dd>
                </div>
                <div>
                  <dt className="gallery-micro">Advisor</dt>
                  <dd>{profile.advisor}</dd>
                </div>
              </dl>
              <div className="gallery-profile-links">
                <a className="gallery-text-link" href={profile.cv} target="_blank" rel="noreferrer">Curriculum vitae <GalleryArrow /></a>
                <a className="gallery-text-link" href={profile.scholar} target="_blank" rel="noreferrer">Google Scholar <GalleryArrow /></a>
                <a className="gallery-text-link" href={profile.github} target="_blank" rel="noreferrer">GitHub <GalleryArrow /></a>
              </div>
              <div className="gallery-contact">
                <p className="gallery-micro">Get in touch</p>
                <a href={`mailto:${profile.email}`}>{profile.email}<GalleryArrow /></a>
              </div>
            </div>
          </section>
        </main>
        <footer className="gallery-footer">
          <p>{profile.name} <span aria-hidden="true">/</span> {profile.shortAffiliation}</p>
          <a href="#gallery-top">Back to top <GalleryArrow direction="up" /></a>
        </footer>
      </div>
    </div>
  )
}
