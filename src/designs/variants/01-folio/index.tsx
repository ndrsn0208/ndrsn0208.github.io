import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Arrow,
  citationFor,
  featuredPapers,
  formatAuthors,
  paperHref,
  paperSummary,
  papers,
  papersForTopic,
  profile,
  topics,
  type Publication,
} from '../../shared'
import './style.css'

const folioYears = [...new Set(papers.map((paper) => paper.year))]
const folioFirstYear = Math.min(...folioYears)
const folioLastYear = Math.max(...folioYears)
const folioLead = featuredPapers[0] ?? papers[0]
const folioCompanion = featuredPapers[1] ?? papers[1]
const folioThird = featuredPapers[3] ?? papers[2]
const folioPreviewCount = 5

function FolioEmblem() {
  return (
    <svg className="folio-emblem" viewBox="0 0 60 60" fill="none" aria-hidden="true">
      {[0, 45, 90, 135].map((angle) => (
        <ellipse key={angle} cx="30" cy="30" rx="10" ry="25" transform={`rotate(${angle} 30 30)`} />
      ))}
      <circle cx="30" cy="30" r="4" />
    </svg>
  )
}

function FolioIllustration() {
  return (
    <figure className="folio-figure">
      <div className="folio-figure-label">
        <span>Fig. 01</span>
        <span>Knowledge, in the making</span>
      </div>
      <svg
        className="folio-illustration"
        viewBox="0 0 460 440"
        role="img"
        aria-labelledby="folio-illustration-title folio-illustration-description"
      >
        <title id="folio-illustration-title">Growing a structure of knowledge</title>
        <desc id="folio-illustration-description">
          A conceptual illustration: layers of remembered experience form a foundation.
          Branches connect familiar geometric concepts, while an oxblood sphere introduces
          something new. Connections bring the old and the new together.
        </desc>
        <defs>
          <pattern id="folio-fine-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">
            <path d="M0 0V5" stroke="currentColor" strokeWidth="0.65" />
          </pattern>
          <pattern id="folio-red-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(24)">
            <path d="M0 0V4" stroke="#f4f0e7" strokeWidth="1" />
          </pattern>
          <clipPath id="folio-orb-clip">
            <circle cx="332" cy="117" r="59" />
          </clipPath>
        </defs>
        <path className="folio-art-guide" d="M38 349H427M232 29V395" />
        <path className="folio-art-guide" d="M34 344v10m393-10v10M227 31h10m-10 361h10" />
        <g className="folio-art-memory" fill="none">
          {Array.from({ length: 19 }, (_, index) => (
            <path
              key={index}
              d={`M ${70 + index * 0.8} ${292 + index * 3.2}
                C ${67 + index * 0.5} ${247 + index * 3.1},
                  ${180 - index * 0.6} ${221 + index * 3.2},
                  ${273 - index * 0.8} ${246 + index * 3.1}
                C ${381 - index * 1.1} ${275 + index * 2.7},
                  ${391 - index * 0.8} ${321 + index * 2.3},
                  ${307 - index * 0.6} ${342 + index * 2.5}
                C ${222 - index * 0.2} ${363 + index * 2.5},
                  ${86 + index * 0.4} ${342 + index * 3},
                  ${70 + index * 0.8} ${292 + index * 3.2} Z`}
            />
          ))}
          <ellipse cx="220" cy="284" rx="100" ry="30" transform="rotate(7 220 284)" />
          <ellipse cx="220" cy="284" rx="63" ry="18" transform="rotate(7 220 284)" />
        </g>
        <g className="folio-art-branches" fill="none">
          <path d="M219 283V209c0-24-48-30-66-62" />
          <path d="M223 284V210c0-24 52-41 72-62" />
          <path d="M216 284V215c0-20-78-14-99-1" />
          <path d="M226 282V227c0-23 73-22 101-11" />
          <path d="M221 213V91" />
          <path d="M153 147c11-21 42-43 68-43" strokeDasharray="3 5" />
          <path d="M296 149c-4 31-5 45 30 67" strokeDasharray="3 5" />
        </g>
        <path className="folio-art-paper" d="m125 114 30-18 29 17-30 19z" />
        <path className="folio-art-hatched" d="m125 114 29 18v34l-29-17z" />
        <path className="folio-art-paper" d="m154 132 30-19v34l-30 19z" />
        <path className="folio-art-fine" d="m134 115 21-12 19 10m-41 12v20m8-16v19m20-16 15-9" />
        <g className="folio-art-new">
          <circle cx="332" cy="117" r="59" />
          <circle cx="332" cy="117" r="59" fill="url(#folio-red-hatch)" />
          <g clipPath="url(#folio-orb-clip)" fill="none">
            {Array.from({ length: 9 }, (_, index) => (
              <ellipse key={index} cx={309 + index * 7} cy="117" rx={8 + index * 5} ry="59" />
            ))}
          </g>
        </g>
        <path className="folio-art-paper" d="m221 55 22 38h-44z" />
        <path className="folio-art-hatched" d="m221 55 4 38h18z" />
        <circle className="folio-art-paper" cx="106" cy="222" r="18" />
        <circle className="folio-art-fine" cx="106" cy="222" r="11" />
        <path className="folio-art-paper" d="m324 193 23 13v27l-23 13-23-13v-27z" />
        <path className="folio-art-hatched" d="m324 219 23-13v27l-23 13z" />
        <path className="folio-art-fine" d="m301 206 23 13v27" />
        <g className="folio-art-joints">
          <circle cx="221" cy="212" r="4" />
          <circle cx="221" cy="284" r="4" />
          <circle cx="153" cy="176" r="2.5" />
        </g>
        <g className="folio-art-annotation">
          <path d="M75 77h48l16 17M360 186v-12M66 378h49l20-13" />
          <text x="43" y="67">familiar concepts</text>
          <text x="302" y="203">new experience</text>
          <text x="35" y="401">a memory to build on</text>
        </g>
        <text className="folio-art-plus" x="245" y="161">+</text>
      </svg>
      <figcaption>
        Learning is more than adding information.
        <br />
        It’s finding structure in what comes next.
      </figcaption>
    </figure>
  )
}

function FolioPaperActions({ paper }: { paper: Publication }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'manual'>('idle')

  async function copyCitation() {
    try {
      await navigator.clipboard.writeText(citationFor(paper))
      setCopyState('copied')
    } catch {
      setCopyState('manual')
    }
  }

  return (
    <div className="folio-paper-actions">
      <div className="folio-paper-links">
        <a href={paperHref(paper)} target="_blank" rel="noreferrer">
          Read paper <Arrow className="folio-icon" />
        </a>
        {paper.pdfUrl && (
          <a href={paper.pdfUrl} target="_blank" rel="noreferrer">
            PDF <Arrow className="folio-icon" />
          </a>
        )}
        <button type="button" onClick={copyCitation}>Copy citation</button>
      </div>
      <p className="folio-copy-status" role="status">
        {copyState === 'copied' && 'Citation copied.'}
        {copyState === 'manual' && 'Select the citation below to copy.'}
      </p>
      {copyState === 'manual' && (
        <textarea
          className="folio-citation"
          aria-label={`Citation for ${paper.title}`}
          readOnly
          value={citationFor(paper)}
          onFocus={(event) => event.currentTarget.select()}
          rows={4}
        />
      )}
    </div>
  )
}

function FolioReader({ paper, onClose }: { paper: Publication | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !paper) return
    const previousFocus = document.activeElement
    dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true })
      }
    }
  }, [paper])

  return (
    <dialog
      className="folio-reader"
      ref={dialogRef}
      aria-labelledby="folio-reader-title"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom
        ) onClose()
      }}
    >
      {paper && (
        <article className="folio-reader-inner" key={paper.id}>
          <div className="folio-reader-top">
            <span className="folio-kicker">{paper.venue} · Research notes</span>
            <button className="folio-close" type="button" onClick={onClose} autoFocus>
              Close <span aria-hidden="true">×</span>
            </button>
          </div>
          <h2 id="folio-reader-title">{paper.title}</h2>
          <p className="folio-authors">{formatAuthors(paper, paper.authors.length)}</p>
          <p className="folio-reader-deck">{paperSummary(paper)}</p>
          <div className="folio-reader-summary">
            <h3 className="folio-kicker">A closer look</h3>
            <p>{paper.summary}</p>
          </div>
          <ul className="folio-paper-tags" aria-label="Research topics">
            {paper.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
          <FolioPaperActions paper={paper} />
        </article>
      )}
    </dialog>
  )
}

function FolioArchiveEntry({ paper }: { paper: Publication }) {
  return (
    <li className="folio-archive-entry">
      <details className="folio-paper-detail">
        <summary className="folio-entry-heading">
          <span className="folio-entry-year">{paper.year}</span>
          <span className="folio-entry-title">{paper.title}</span>
          <span className="folio-entry-venue">{paper.venue}</span>
          <span className="folio-entry-toggle" aria-hidden="true" />
        </summary>
        <div className="folio-entry-body">
          <p className="folio-authors">{formatAuthors(paper, paper.authors.length)}</p>
          <p className="folio-entry-deck">{paperSummary(paper)}</p>
          <details className="folio-technical">
            <summary>Read the research summary</summary>
            <p>{paper.summary}</p>
          </details>
          <ul className="folio-paper-tags" aria-label="Research topics">
            {paper.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
          <FolioPaperActions paper={paper} />
        </div>
      </details>
    </li>
  )
}

export default function FolioPage() {
  const [readingPaper, setReadingPaper] = useState<Publication | null>(null)
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('all')
  const [year, setYear] = useState('all')
  const [archiveExpanded, setArchiveExpanded] = useState(false)
  const archiveRef = useRef<HTMLElement>(null)
  const archiveToggleRef = useRef<HTMLButtonElement>(null)
  const hasFilters = Boolean(query.trim()) || topic !== 'all' || year !== 'all'

  const matchingPapers = useMemo(() => {
    const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
    return papersForTopic(topic).filter((paper) => {
      const searchText = [
        paper.title, paper.authors.join(' '), paper.venue, paper.year,
        paper.tags.join(' '), paperSummary(paper), paper.summary,
      ].join(' ').toLocaleLowerCase()
      return (year === 'all' || String(paper.year) === year) &&
        words.every((word) => searchText.includes(word))
    })
  }, [query, topic, year])

  const visiblePapers = archiveExpanded || hasFilters
    ? matchingPapers
    : matchingPapers.slice(0, folioPreviewCount)

  function resetFilters() {
    setQuery('')
    setTopic('all')
    setYear('all')
  }

  function browseTopic(nextTopic: string) {
    setTopic(nextTopic)
    setQuery('')
    setYear('all')
    setArchiveExpanded(true)
    archiveRef.current?.focus({ preventScroll: true })
    archiveRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' })
  }

  function toggleArchive() {
    setArchiveExpanded((expanded) => !expanded)
    if (archiveExpanded) {
      requestAnimationFrame(() => {
        archiveToggleRef.current?.focus({ preventScroll: true })
        archiveToggleRef.current?.scrollIntoView({ block: 'center', behavior: 'auto' })
      })
    }
  }

  return (
    <div className="design-surface folio" id="folio-top">
      <a className="folio-skip" href="#folio-main">Skip to content</a>
      <div className="folio-sheet">
        <header className="folio-masthead">
          <div className="folio-edition-line">
            <span>A personal research folio</span>
            <span>{profile.affiliation}</span>
            <span>{folioFirstYear}–{folioLastYear}</span>
          </div>
          <div className="folio-nameplate">
            <h1>{profile.name}</h1>
            <FolioEmblem />
            <p>On learning,<br />remembering &<br /><em>making sense.</em></p>
          </div>
          <p className="folio-position">{profile.title} · {profile.shortAffiliation}</p>
          <nav className="folio-navigation" aria-label="Main navigation">
            <div className="folio-nav-sections">
              <a href="#folio-about"><span>01</span> About</a>
              <a href="#folio-recent"><span>02</span> Recent work</a>
              <a href="#folio-archive"><span>03</span> Archive</a>
            </div>
            <div className="folio-nav-resources">
              <a href={profile.cv} target="_blank" rel="noreferrer">CV <Arrow className="folio-icon" /></a>
              <a href={profile.scholar} target="_blank" rel="noreferrer">Scholar <Arrow className="folio-icon" /></a>
              <a href="#folio-contact">Contact <Arrow direction="right" className="folio-icon" /></a>
            </div>
          </nav>
        </header>

        <main id="folio-main" className="folio-main" tabIndex={-1}>
          <section className="folio-opening" id="folio-about" aria-labelledby="folio-opening-title">
            <div className="folio-opening-story">
              <p className="folio-kicker"><span className="folio-small-star" aria-hidden="true">✳</span> An ongoing inquiry</p>
              <h2 id="folio-opening-title">Learning,<br />without<br /><em>forgetting.</em></h2>
              <p className="folio-opening-deck">
                I study how AI can learn new things without losing what it already knows.
              </p>
              <a className="folio-text-link" href="#folio-recent">
                Explore my research <Arrow direction="right" className="folio-icon" />
              </a>
            </div>
            <FolioIllustration />
            <aside className="folio-author-note" aria-labelledby="folio-author-title">
              <p className="folio-kicker">A note from the author</p>
              <h3 id="folio-author-title">Hello, I’m Zekun.</h3>
              <p>
                I’m a PhD student in computer science at <strong>{profile.shortAffiliation}</strong>,
                advised by {profile.advisor}.
              </p>
              <p>{profile.research}</p>
              <div className="folio-author-contact">
                <span className="folio-kicker">Correspondence</span>
                <a href={`mailto:${profile.email}`}>{profile.email} <Arrow className="folio-icon" /></a>
              </div>
              <span className="folio-author-signature" aria-hidden="true">ZW.</span>
            </aside>
          </section>

          <div className="folio-subject-line">
            <span className="folio-kicker">In these pages</span>
            <div className="folio-subjects">
              {topics.map((item) => (
                <button type="button" key={item} onClick={() => browseTopic(item)}>{item}</button>
              ))}
            </div>
          </div>

          <section className="folio-recent" id="folio-recent" aria-labelledby="folio-recent-title">
            <div className="folio-section-heading">
              <div>
                <p className="folio-kicker">02 / Selected work</p>
                <h2 id="folio-recent-title">Questions I’m working on.</h2>
              </div>
              <a className="folio-text-link" href="#folio-archive">
                All {papers.length} papers <Arrow direction="right" className="folio-icon" />
              </a>
            </div>
            <div className="folio-research-spread">
              <article className="folio-lead-paper">
                <div className="folio-paper-meta">
                  <span className="folio-paper-number">01</span>
                  <span>{folioLead.venue}</span>
                  <span>continual learning</span>
                </div>
                <p className="folio-story-question">What if a model could decide how to remember?</p>
                <h3>
                  <button type="button" onClick={() => setReadingPaper(folioLead)}>{folioLead.title}</button>
                </h3>
                <p className="folio-lead-summary">{paperSummary(folioLead)}</p>
                <p className="folio-authors">{formatAuthors(folioLead)}</p>
                <div className="folio-story-links">
                  <button className="folio-text-link" type="button" onClick={() => setReadingPaper(folioLead)}>
                    A closer look <Arrow direction="right" className="folio-icon" />
                  </button>
                  <a href={paperHref(folioLead)} target="_blank" rel="noreferrer">
                    Read paper <Arrow className="folio-icon" />
                  </a>
                </div>
              </article>
              <div className="folio-side-stories">
                {[folioCompanion, folioThird].map((paper, index) => (
                  <article className="folio-brief" key={paper.id}>
                    <div className="folio-paper-meta">
                      <span className="folio-paper-number">0{index + 2}</span>
                      <span>{paper.venue}</span>
                    </div>
                    <h3>
                      <button type="button" onClick={() => setReadingPaper(paper)}>{paper.title}</button>
                    </h3>
                    <p>{paperSummary(paper)}</p>
                    <button className="folio-text-link" type="button" onClick={() => setReadingPaper(paper)}>
                      A closer look <Arrow direction="right" className="folio-icon" />
                      <span className="folio-sr-only"> at {paper.title}</span>
                    </button>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section
            className="folio-archive"
            id="folio-archive"
            ref={archiveRef}
            tabIndex={-1}
            aria-labelledby="folio-archive-title"
          >
            <div className="folio-archive-intro">
              <div>
                <p className="folio-kicker">03 / The collected research</p>
                <h2 id="folio-archive-title">An archive of ideas.</h2>
              </div>
              <p>
                Here’s my work so far. Follow a topic, find a familiar name,
                or open a paper to see what’s inside.
              </p>
              <div className="folio-archive-total" role="group" aria-label={`${papers.length} papers, ${folioFirstYear} to ${folioLastYear}`}>
                <span aria-hidden="true">{String(papers.length).padStart(2, '0')}</span>
                <span aria-hidden="true">papers<br />{folioFirstYear}–{folioLastYear}</span>
              </div>
            </div>
            <div className="folio-archive-tools">
              <div className="folio-search">
                <label htmlFor="folio-search" className="folio-sr-only">Search papers by title, author, or keyword</label>
                <svg className="folio-search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="m15 15 5 5" stroke="currentColor" strokeWidth="1.4" />
                </svg>
                <input
                  id="folio-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.currentTarget.value)}
                  placeholder="Search titles, authors, or ideas…"
                  autoComplete="off"
                  aria-controls="folio-archive-list"
                />
              </div>
              <div className="folio-year-filter">
                <label htmlFor="folio-year">Year</label>
                <select
                  id="folio-year"
                  value={year}
                  onChange={(event) => setYear(event.currentTarget.value)}
                  aria-controls="folio-archive-list"
                >
                  <option value="all">All years</option>
                  {folioYears.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </div>
            <div className="folio-topic-filters" role="group" aria-label="Filter papers by research topic">
              <button type="button" aria-pressed={topic === 'all'} onClick={() => setTopic('all')} aria-controls="folio-archive-list">
                All topics
              </button>
              {topics.map((item) => (
                <button
                  type="button"
                  key={item}
                  aria-pressed={topic === item}
                  onClick={() => setTopic(item)}
                  aria-controls="folio-archive-list"
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="folio-results-bar">
              <p role="status" aria-live="polite" aria-atomic="true">
                {hasFilters
                  ? `${matchingPapers.length} ${matchingPapers.length === 1 ? 'paper' : 'papers'} found`
                  : `Showing ${visiblePapers.length} of ${papers.length} papers`}
                <span className="folio-results-order"> · Newest first</span>
              </p>
              {hasFilters && <button type="button" onClick={resetFilters}>Clear filters <span aria-hidden="true">×</span></button>}
              {!hasFilters && <span className="folio-results-hint">Select a title to unfold</span>}
            </div>
            <ol className="folio-archive-list" id="folio-archive-list">
              {visiblePapers.map((paper) => <FolioArchiveEntry key={paper.id} paper={paper} />)}
            </ol>
            {matchingPapers.length === 0 && (
              <div className="folio-empty">
                <h3>No papers on this page of the index.</h3>
                <p>Try a broader search, another year, or a different topic.</p>
                <button className="folio-text-link" type="button" onClick={resetFilters}>
                  Clear all filters <Arrow direction="right" className="folio-icon" />
                </button>
              </div>
            )}
            {!hasFilters && (
              <button
                className="folio-archive-toggle"
                type="button"
                ref={archiveToggleRef}
                onClick={toggleArchive}
                aria-expanded={archiveExpanded}
                aria-controls="folio-archive-list"
              >
                <span>{archiveExpanded ? `Return to ${folioPreviewCount} recent papers` : 'Unfold the full archive'}</span>
                <span className="folio-archive-toggle-end">
                  {archiveExpanded ? 'Show less' : `${papers.length - folioPreviewCount} more papers`}
                  <span className="folio-toggle-symbol" aria-hidden="true">{archiveExpanded ? '−' : '+'}</span>
                </span>
              </button>
            )}
          </section>
        </main>

        <footer className="folio-footer" id="folio-contact">
          <div className="folio-footer-main">
            <div>
              <p className="folio-kicker">Correspondence</p>
              <h2>Let’s compare notes.</h2>
              <p>For questions about my work, you can reach me here.</p>
            </div>
            <div className="folio-footer-contact">
              <a className="folio-email" href={`mailto:${profile.email}`}>
                {profile.email} <Arrow className="folio-icon" />
              </a>
              <div className="folio-footer-links">
                <a href={profile.cv} target="_blank" rel="noreferrer">Curriculum vitae <Arrow className="folio-icon" /></a>
                <a href={profile.scholar} target="_blank" rel="noreferrer">Google Scholar <Arrow className="folio-icon" /></a>
              </div>
            </div>
          </div>
          <div className="folio-colophon">
            <span>{profile.name} <span aria-hidden="true">/</span> {profile.affiliation}</span>
            <a href="#folio-top">Back to the masthead <span aria-hidden="true">↑</span></a>
          </div>
        </footer>
      </div>
      <FolioReader paper={readingPaper} onClose={() => setReadingPaper(null)} />
    </div>
  )
}
