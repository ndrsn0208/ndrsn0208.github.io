import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import {
  Arrow,
  citationFor,
  formatAuthors,
  papers,
  paperSummary,
  profile,
  topics,
  type Publication,
} from '../../shared'
import './style.css'

const years = [...new Set(papers.map((paper) => paper.year))].sort((a, b) => b - a)
const numberFor = (paper: Publication) => String(papers.indexOf(paper) + 1).padStart(2, '0')
const topicLabel = (topic: string) => topic.charAt(0).toUpperCase() + topic.slice(1)
const normalize = (text: string) =>
  text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

const searchablePapers = papers.map((paper) => ({
  paper,
  text: normalize([paper.title, ...paper.authors, ...paper.tags, paper.venue, paper.year].join(' ')),
}))

function SearchIcon() {
  return (
    <svg className="index-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function Chevron({ direction = 'down' }: { direction?: 'down' | 'left' | 'right' }) {
  return (
    <svg
      className={`index-icon index-chevron index-chevron-${direction}`}
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>
  const pattern = new RegExp(`(${[...terms].sort((a, b) => b.length - a.length).join('|')})`, 'giu')
  return (
    <>
      {text.split(pattern).map((part, index) =>
        terms.includes(normalize(part)) ? (
          <mark className="index-match" key={index}>{part}</mark>
        ) : part,
      )}
    </>
  )
}

function Citation({ paper }: { paper: Publication }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'manual'>('idle')
  const citationRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (status === 'manual') {
      citationRef.current?.focus()
      citationRef.current?.select()
    }
  }, [status])

  async function copyCitation() {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(citationFor(paper))
      setStatus('copied')
    } catch {
      setStatus('manual')
    }
  }

  return (
    <div className="index-citation">
      <button className="index-citation-button" type="button" onClick={copyCitation}>
        <svg className="index-icon" width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M7 3h9v11H7zM4 6H3v11h9v-1" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        Copy citation
      </button>
      <span className="index-copy-status" role="status" aria-live="polite">
        {status === 'copied' && 'Citation copied.'}
        {status === 'manual' && 'Select and copy the citation below.'}
      </span>
      {status === 'manual' && (
        <div className="index-citation-fallback">
          <label htmlFor="index-citation-text">Plain-text citation</label>
          <textarea
            id="index-citation-text"
            ref={citationRef}
            readOnly
            value={citationFor(paper)}
            rows={6}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      )}
    </div>
  )
}

export default function Index() {
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('all')
  const [year, setYear] = useState('all')
  const [selectedId, setSelectedId] = useState(papers[0]?.id ?? '')
  const [reading, setReading] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1120px)').matches,
  )
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const readerRef = useRef<HTMLElement>(null)
  const readerBodyRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const rowRefs = useRef(new Map<string, HTMLButtonElement>())
  const catalogueScroll = useRef(0)
  const focusedElementRef = useRef<HTMLElement | null>(null)

  const terms = useMemo(() => [...new Set(normalize(query).split(' ').filter(Boolean))], [query])
  const queryMatches = useMemo(
    () => searchablePapers.filter(({ text }) => terms.every((term) => text.includes(term))).map(({ paper }) => paper),
    [terms],
  )
  const results = useMemo(
    () => queryMatches.filter((paper) =>
      (topic === 'all' || paper.tags.includes(topic)) && (year === 'all' || paper.year === Number(year)),
    ),
    [queryMatches, topic, year],
  )
  const selectedPaper = results.find((paper) => paper.id === selectedId) ?? results[0]
  const selectedIndex = selectedPaper ? results.indexOf(selectedPaper) : -1
  const hasFilters = query.length > 0 || topic !== 'all' || year !== 'all'
  const topicCount = (value: string) => queryMatches.filter((paper) =>
    (value === 'all' || paper.tags.includes(value)) && (year === 'all' || paper.year === Number(year)),
  ).length
  const yearCount = (value: string) => queryMatches.filter((paper) =>
    (value === 'all' || paper.year === Number(value)) && (topic === 'all' || paper.tags.includes(topic)),
  ).length

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1120px)')
    const update = () => {
      // CSS may hide the focused pane before the media-query event fires.
      const focused = document.activeElement === document.body
        ? focusedElementRef.current
        : document.activeElement
      setCompact(media.matches)
      if (!media.matches) setReading(false)
      else if (focused && readerRef.current?.contains(focused)) {
        setReading(true)
        requestAnimationFrame(() => {
          if (focused instanceof HTMLElement) focused.focus({ preventScroll: true })
        })
      }
    }
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    resultsRef.current?.scrollTo({ top: 0 })
  }, [query, topic, year])

  useEffect(() => {
    readerBodyRef.current?.scrollTo({ top: 0 })
  }, [selectedPaper?.id])

  function scrollToTop() {
    const top = (rootRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY
    window.scrollTo({ top, behavior: 'auto' })
  }

  function focusResult(paper = selectedPaper) {
    if (!paper) {
      searchRef.current?.focus()
      return
    }
    const row = rowRefs.current.get(paper.id)
    row?.focus({ preventScroll: true })
    row?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' })
  }

  function readPaper(paper: Publication, moveFocus = false) {
    setSelectedId(paper.id)
    if (compact) {
      if (!reading) catalogueScroll.current = window.scrollY
      setReading(true)
      setAboutOpen(false)
      requestAnimationFrame(() => {
        scrollToTop()
        titleRef.current?.focus({ preventScroll: true })
      })
    } else if (moveFocus) {
      requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true }))
    }
  }

  function returnToCatalogue(focusSearch = false) {
    setReading(false)
    setAboutOpen(false)
    requestAnimationFrame(() => {
      if (compact) {
        if (focusSearch) scrollToTop()
        else window.scrollTo({ top: catalogueScroll.current, behavior: 'auto' })
      }
      if (focusSearch) searchRef.current?.focus({ preventScroll: true })
      else focusResult()
    })
  }

  function reset() {
    setQuery('')
    setTopic('all')
    setYear('all')
    setSelectedId(papers[0]?.id ?? '')
    returnToCatalogue(true)
  }

  function browseTopic(value: string) {
    setQuery('')
    setYear('all')
    setTopic(value)
    returnToCatalogue(true)
  }

  function navigateResult(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return
    let nextIndex = currentIndex
    if (event.key === 'ArrowDown') nextIndex = Math.min(currentIndex + 1, results.length - 1)
    else if (event.key === 'ArrowUp') nextIndex = Math.max(currentIndex - 1, 0)
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = results.length - 1
    else if (event.key === 'ArrowRight') {
      event.preventDefault()
      readPaper(results[currentIndex], true)
      return
    } else if (event.key === 'Escape') {
      event.preventDefault()
      searchRef.current?.focus()
      return
    } else return
    event.preventDefault()
    const next = results[nextIndex]
    if (next) {
      setSelectedId(next.id)
      focusResult(next)
    }
  }

  function adjacentPaper(offset: number) {
    const next = results[selectedIndex + offset]
    if (next) readPaper(next)
  }

  return (
    <div
      className="design-surface index"
      ref={rootRef}
      data-index-view={compact && reading ? 'detail' : 'catalogue'}
      data-index-about={aboutOpen}
      onFocusCapture={(event) => {
        if (event.target instanceof HTMLElement) focusedElementRef.current = event.target
      }}
    >
      <a
        className="index-skip"
        href="#index-search"
        onClick={(event) => { event.preventDefault(); returnToCatalogue(true) }}
      >
        Skip to research index
      </a>

      <aside className="index-sidebar" aria-label="About Zekun Wang">
        <div className="index-identity">
          <div className="index-affiliation-mark">
            <svg className="index-shelf-mark" width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <path d="M4 4v20M10 4v20M16 4v20M20 5l5 18" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>{profile.shortAffiliation}</span>
          </div>
          <h2 className="index-name">{profile.name}</h2>
          <p className="index-mobile-affiliation">{profile.shortAffiliation} / Computer science</p>
          <button
            className="index-profile-toggle"
            type="button"
            aria-expanded={aboutOpen}
            aria-controls="index-profile-body"
            onClick={() => setAboutOpen(!aboutOpen)}
          >
            About & links <Chevron />
          </button>
        </div>

        <div className="index-profile-body" id="index-profile-body">
          <div className="index-position">
            <p>{profile.title}</p>
            <p>{profile.affiliation}</p>
          </div>
          <p className="index-bio">
            I study how AI can learn new things without losing what it already knows.
          </p>
          <p className="index-advisor">My advisor is <span>{profile.advisor}</span>.</p>

          <nav className="index-profile-links" aria-label="Research and profile">
            <a
              className="index-current-link"
              href="#index-catalogue"
              aria-current={!reading ? 'page' : undefined}
              onClick={(event) => { event.preventDefault(); returnToCatalogue(true) }}
            >
              <span>Research index</span>
              <span className="index-link-count">{String(papers.length).padStart(2, '0')}</span>
            </a>
            <a href={profile.cv} target="_blank" rel="noreferrer">
              <span>Curriculum vitae</span><Arrow className="index-icon" />
              <span className="index-sr-only"> (opens in a new tab)</span>
            </a>
            <a href={profile.scholar} target="_blank" rel="noreferrer">
              <span>Google Scholar</span><Arrow className="index-icon" />
              <span className="index-sr-only"> (opens in a new tab)</span>
            </a>
          </nav>

          <div className="index-research-note">
            <p className="index-eyebrow">My research</p>
            <p>{profile.research}</p>
          </div>
          <div className="index-contact">
            <span className="index-eyebrow">Correspondence</span>
            <a href={`mailto:${profile.email}`}>{profile.email}<Arrow className="index-icon" /></a>
          </div>
        </div>
      </aside>

      <main className="index-workspace">
        <section className="index-catalogue" id="index-catalogue" aria-labelledby="index-heading">
          <header className="index-catalogue-header">
            <div className="index-heading-line">
              <p className="index-eyebrow">Publications & preprints</p>
              <span className="index-date-range">{years[years.length - 1]}—{years[0]}</span>
            </div>
            <h1 className="index-heading" id="index-heading">Research index<span>.</span></h1>
            <p className="index-introduction">My work on learning, language, and the structure of knowledge.</p>

            <form
              className="index-search"
              role="search"
              aria-label="Search publications"
              onSubmit={(event) => { event.preventDefault(); focusResult() }}
            >
              <label className="index-sr-only" htmlFor="index-search">Search title, author, topic, or year</label>
              <div className="index-search-field">
                <SearchIcon />
                <input
                  id="index-search"
                  ref={searchRef}
                  type="search"
                  value={query}
                  placeholder="Title, author, topic, year…"
                  autoComplete="off"
                  spellCheck={false}
                  aria-controls="index-results"
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown' && results.length && !event.nativeEvent.isComposing) {
                      event.preventDefault()
                      focusResult()
                    }
                    if (event.key === 'Escape' && query) {
                      event.preventDefault()
                      setQuery('')
                    }
                  }}
                />
                {query && (
                  <button
                    className="index-clear-search"
                    type="button"
                    aria-label="Clear search"
                    onClick={() => { setQuery(''); searchRef.current?.focus() }}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                )}
              </div>
            </form>

            <div className="index-filters" role="group" aria-label="Filter publications">
              <label className="index-filter" htmlFor="index-topic">
                <span>Topic</span>
                <span className="index-select-wrap">
                  <select id="index-topic" value={topic} onChange={(event) => setTopic(event.target.value)}>
                    <option value="all">All topics</option>
                    {topics.map((value) => (
                      <option key={value} value={value}>
                        {topicLabel(value)} ({topicCount(value)})
                      </option>
                    ))}
                  </select>
                  <Chevron />
                </span>
              </label>
              <label className="index-filter" htmlFor="index-year">
                <span>Year</span>
                <span className="index-select-wrap">
                  <select id="index-year" value={year} onChange={(event) => setYear(event.target.value)}>
                    <option value="all">All years</option>
                    {years.map((value) => (
                      <option key={value} value={value}>{value} ({yearCount(String(value))})</option>
                    ))}
                  </select>
                  <Chevron />
                </span>
              </label>
            </div>

            <div className="index-results-bar">
              <p className="index-result-count" role="status" aria-live="polite" aria-atomic="true">
                <strong>{results.length} {results.length === 1 ? 'paper' : 'papers'}</strong>
                <span> / {papers.length} in the index</span>
              </p>
              <button
                className="index-reset"
                type="button"
                disabled={!hasFilters}
                onClick={reset}
                aria-label="Reset search and filters"
              >
                Reset <span aria-hidden="true">↺</span>
              </button>
            </div>
          </header>

          <div className="index-results" id="index-results" ref={resultsRef}>
            {results.length ? (
              <>
                <div className="index-list-guide">
                  <span>Newest first</span>
                  <p id="index-keyboard-help">
                    <kbd>↑</kbd><kbd>↓</kbd> select <span aria-hidden="true">·</span> <kbd>Enter</kbd> read
                  </p>
                </div>
                <ol className="index-paper-list" role="list" aria-label="Research papers" aria-describedby="index-keyboard-help">
                  {results.map((paper, position) => {
                    const selected = selectedPaper?.id === paper.id
                    const startsYear = position === 0 || results[position - 1].year !== paper.year
                    return (
                      <li className="index-record" key={paper.id}>
                        {startsYear && (
                          <div className="index-year-heading">
                            <h2>{paper.year}</h2>
                            <span>{String(results.filter((entry) => entry.year === paper.year).length).padStart(2, '0')}</span>
                          </div>
                        )}
                        <button
                          className={`index-paper-button${selected ? ' index-paper-selected' : ''}`}
                          type="button"
                          ref={(node) => {
                            if (node) rowRefs.current.set(paper.id, node)
                            else rowRefs.current.delete(paper.id)
                          }}
                          tabIndex={selected ? 0 : -1}
                          aria-current={selected ? 'true' : undefined}
                          aria-controls="index-reader"
                          onKeyDown={(event) => navigateResult(event, position)}
                          onClick={(event) => readPaper(paper, event.detail === 0)}
                        >
                          <span className="index-record-number" aria-hidden="true">{numberFor(paper)}</span>
                          <span className="index-record-content">
                            <span className="index-record-meta">
                              <span><Highlight text={paper.venue} terms={terms} /></span>
                              {selected && <span className="index-reading-label">Selected</span>}
                            </span>
                            <span className="index-record-title"><Highlight text={paper.title} terms={terms} /></span>
                            <span className="index-record-authors"><Highlight text={formatAuthors(paper, 4)} terms={terms} /></span>
                            <span className="index-record-topics">
                              {paper.tags.map((tag, index) => (
                                <span key={tag}>
                                  {index > 0 && <span className="index-topic-separator" aria-hidden="true"> / </span>}
                                  <Highlight text={tag} terms={terms} />
                                </span>
                              ))}
                            </span>
                          </span>
                          <Arrow className="index-record-arrow" direction="right" />
                        </button>
                      </li>
                    )
                  })}
                </ol>
                <p className="index-endnote">
                  End of index <span aria-hidden="true">/</span> {results.length} {results.length === 1 ? 'paper' : 'papers'}
                  {hasFilters && ' in this selection'}
                </p>
              </>
            ) : (
              <div className="index-empty">
                <span className="index-empty-symbol" aria-hidden="true">∅</span>
                <h2>No matching papers.</h2>
                <p>Try a broader search, or clear the topic and year filters to return to the full collection.</p>
                <button className="index-empty-reset" type="button" onClick={reset}>
                  Reset the index <Arrow className="index-icon" direction="right" />
                </button>
              </div>
            )}
          </div>
        </section>

        <section
          className="index-reader"
          id="index-reader"
          ref={readerRef}
          aria-label="Selected paper"
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !(event.target instanceof HTMLTextAreaElement)) {
              event.preventDefault()
              returnToCatalogue()
            }
            if (event.key === 'ArrowLeft' && event.target === titleRef.current) {
              event.preventDefault()
              returnToCatalogue()
            }
          }}
        >
          <header className="index-reader-toolbar">
            <span className="index-reader-label"><span aria-hidden="true" /> Reading pane</span>
            <button className="index-reader-back" type="button" onClick={() => returnToCatalogue()}>
              <Chevron direction="left" /> Back to index
            </button>
            <div className="index-reader-navigation" role="group" aria-label="Browse the current results">
              <span>{selectedPaper ? String(selectedIndex + 1).padStart(2, '0') : '00'} / {String(results.length).padStart(2, '0')}</span>
              <button
                className="index-page-button"
                type="button"
                aria-label="Previous paper"
                disabled={selectedIndex <= 0}
                onClick={() => adjacentPaper(-1)}
              >
                <Chevron direction="left" />
              </button>
              <button
                className="index-page-button"
                type="button"
                aria-label="Next paper"
                disabled={selectedIndex < 0 || selectedIndex >= results.length - 1}
                onClick={() => adjacentPaper(1)}
              >
                <Chevron direction="right" />
              </button>
            </div>
          </header>

          <div className="index-reader-body" ref={readerBodyRef}>
            {selectedPaper ? (
              <article className="index-paper" aria-labelledby="index-paper-title">
                <div className="index-paper-kicker">
                  <span className="index-eyebrow">Record {numberFor(selectedPaper)}</span>
                  <span className="index-paper-venue">{selectedPaper.venue}</span>
                </div>
                <h2 className="index-paper-title" id="index-paper-title" ref={titleRef} tabIndex={-1}>
                  {selectedPaper.title}
                </h2>
                <p className="index-paper-authors">
                  {selectedPaper.authors.map((author, position) => (
                    <span key={`${author}-${position}`}>
                      {position > 0 && ', '}
                      {author === profile.name ? <strong>{author}</strong> : author}
                    </span>
                  ))}
                </p>
                <dl className="index-paper-metadata">
                  <div><dt>Year</dt><dd>{selectedPaper.year}</dd></div>
                  <div><dt>arXiv</dt><dd>{selectedPaper.arxivId}</dd></div>
                </dl>
                <section className="index-overview" aria-labelledby="index-overview-heading">
                  <h3 className="index-eyebrow" id="index-overview-heading">In brief</h3>
                  <p>{paperSummary(selectedPaper)}</p>
                </section>
                <div className="index-paper-links">
                  {selectedPaper.arxivUrl && (
                    <a className="index-arxiv-link" href={selectedPaper.arxivUrl} target="_blank" rel="noreferrer">
                      View on arXiv <Arrow className="index-icon" />
                      <span className="index-sr-only"> (opens in a new tab)</span>
                    </a>
                  )}
                  {selectedPaper.pdfUrl && (
                    <a className="index-pdf-link" href={selectedPaper.pdfUrl} target="_blank" rel="noreferrer">
                      Read PDF <Arrow className="index-icon" />
                      <span className="index-sr-only"> (opens in a new tab)</span>
                    </a>
                  )}
                </div>
                <Citation key={selectedPaper.id} paper={selectedPaper} />
                <section className="index-abstract" aria-labelledby="index-abstract-heading">
                  <h3 className="index-eyebrow" id="index-abstract-heading">Abstract</h3>
                  <p>{abstracts[selectedPaper.arxivId ?? ''] ?? selectedPaper.summary}</p>
                </section>
                <section className="index-related-topics" aria-labelledby="index-related-heading">
                  <h3 className="index-eyebrow" id="index-related-heading">Filed under</h3>
                  <div>
                    {selectedPaper.tags.map((tag) => (
                      <button className="index-topic-link" type="button" key={tag} onClick={() => browseTopic(tag)}>
                        {topicLabel(tag)} <Arrow className="index-icon" direction="right" />
                      </button>
                    ))}
                  </div>
                </section>
                <footer className="index-paper-footer">
                  <button className="index-return-link" type="button" onClick={() => returnToCatalogue()}>
                    <Chevron direction="left" /> Return to index
                  </button>
                  <span>{numberFor(selectedPaper)} / {String(papers.length).padStart(2, '0')}</span>
                </footer>
              </article>
            ) : (
              <div className="index-reader-empty">
                <svg className="index-empty-page" width="44" height="52" viewBox="0 0 44 52" fill="none" aria-hidden="true">
                  <path d="M8 3h23l8 8v37H8zM31 3v9h8M15 23h17M15 29h17M15 35h10" stroke="currentColor" strokeWidth="1.3" />
                </svg>
                <h2>No paper selected</h2>
                <p>Adjust your search to find a paper to read.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

// Original abstracts from public/arxiv-cache; 2205.02829 is from its arXiv
// abstract page. Math is transcribed as readable Unicode; footnotes and keyword
// lists are omitted. Keep these separate from the shared plain-language summaries.
const abstracts: Record<string, string> = {
  '2605.07078': 'Compositional generalization requires models to produce novel configurations from familiar parts. In diffusion models, prior compositional generation methods typically assume that the relevant concepts or conditioning signals are already available. We instead ask whether a pretrained diffusion model can discover query-specific concepts from the time-indexed scores it learns for the noisy marginals pₜ(xₜ) and compose them at test time. Given a single out-of-distribution query, our method performs gradient ascent on sθ(xₜ, t) ≈ ∇ₓₜ log pₜ(xₜ) at multiple noising timesteps to recover local density modes, maps these modes into clean-space Gaussians, greedily selects relevant prototypes with a submodular likelihood objective, and combines them into a product-of-experts (PoE) teacher model with an analytic score. This teacher model can be sampled directly through classifier-free guidance or used to generate a sample pool for training a new class embedding and low-rank adapter. On held-out composition benchmarks built from ColorMNIST and CelebA, both the analytic PoE sampler and the low-rank adapted model outperform query-only and nearest trained-class baselines. These results suggest that the time-indexed score geometry of the diffusion model contains reusable density-mode concepts that support test-time compositional generation without a predefined concept library.',
  '2605.07076': 'Large language models (LLMs) increasingly receive information as streams of passages, conversations, and long-context workflows. While longer context windows expose more evidence, they do not ensure that useful information is preserved and reused. We study continual context consolidation: writing current context into model weights while limiting interference with previously consolidated information. We propose Self-Consolidating Language Models (SCoL), a post-training framework in which, given current context, an LLM learns to generate textual update instructions specifying which of its own Transformer layers should be updated. Because committed updates change the model that later generates future selections, we train SCoL with meta-reinforcement learning over an evolving model state. We instantiate SCoL with supervised QA rewards on SQuAD knowledge incorporation and intrinsic likelihood-based rewards for LongBench v2 long-context consolidation. Across both settings, SCoL improves acquisition and retention over prompting, summarization, batch test-time training, and sequential finetuning baselines. Analysis of learned selection patterns shows that SCoL encourages the LLM to generate sparse update locations that align with layers of high Fisher information, suggesting that the model learns to route plasticity toward loss-sensitive regions while limiting interference. Moreover, SCoL transfers from shorter meta-training streams to longer LongBench v2 streams at evaluation, suggesting that our framework supports scalable streaming consolidation.',
  '2505.13281': 'With the rapid improvement of machine learning (ML) models, cognitive scientists are increasingly asking about their alignment with how humans think. Here, we ask this question for computer vision models and human sensitivity to geometric and topological (GT) concepts. Under the core knowledge account, these concepts are innate and supported by dedicated neural circuitry. In this work, we investigate an alternative explanation, that GT concepts are learned “for free” through everyday interaction with the environment. We do so using computer visions models, which are trained on large image datasets. We build on prior studies to investigate the overall performance and human alignment of three classes of models – convolutional neural networks (CNNs), transformer-based models, and vision-language models – on an odd-one-out task testing 43 GT concepts spanning seven classes. Transformer-based models achieve the highest overall accuracy, surpassing that of young children. They also show strong alignment with children’s performance, finding the same classes of concepts easy vs. difficult. By contrast, vision-language models underperform their vision-only counterparts and deviate further from human profiles, indicating that naïve multimodality might compromise abstract geometric sensitivity. These findings support the use of computer vision models to evaluate the sufficiency of the learning account for explaining human sensitivity to GT concepts, while also suggesting that integrating linguistic and visual representations might have unpredicted deleterious consequences.',
  '2511.15029': 'Mathematical thinking is a fundamental aspect of human cognition. Cognitive scientists have investigated the mechanisms that underlie our ability to thinking geometrically and numerically, to take two prominent examples, and developmental scientists have documented the trajectories of these abilities over the lifespan. Prior research has shown that computer vision (CV) models trained on the unrelated task of image classification nevertheless learn latent representations of geometric and numerical concepts similar to those of adults. Building on this demonstrated cognitive alignment, the current study investigates whether CV models also show developmental alignment: whether their performance improvements across training to match the developmental progressions observed in children. In a detailed case study of the ResNet-50 model, we show that this is the case. For the case of geometry and topology, we find developmental alignment for some classes of concepts (Euclidean Geometry, Geometrical Figures, Metric Properties, Topology) but not others (Chiral Figures, Geometric Transformations, Symmetrical Figures). For the case of number, we find developmental alignment in the emergence of a human-like “mental number line” representation with experience. These findings show the promise of computer vision models for understanding the development of mathematical understanding in humans. They point the way to future research exploring additional model architectures and building larger benchmarks.',
  '2601.18065': 'Do vision–language models (VLMs) develop more human-like sensitivity to linguistic concreteness than text-only large language models (LLMs) when both are evaluated with text-only prompts? We study this question with a controlled comparison between matched Llama text backbones and their Llama Vision counterparts across multiple model scales, treating multimodal pretraining as an ablation on perceptual grounding rather than access to images at inference. We measure concreteness effects at three complementary levels: (i) output behavior, by relating question-level concreteness to QA accuracy; (ii) embedding geometry, by testing whether representations organize along a concreteness axis; and (iii) attention dynamics, by quantifying context reliance via attention-entropy measures. In addition, we elicit token-level concreteness ratings from models and evaluate alignment to human norm distributions, testing whether multimodal training yields more human-consistent judgments. Across benchmarks and scales, VLMs show larger gains on more concrete inputs, exhibit clearer concreteness-structured representations, produce ratings that better match human norms, and display systematically different attention patterns consistent with increased grounding.',
  '2602.02417': 'Continual learning aims to acquire tasks sequentially without catastrophic forgetting, yet standard strategies face a core tradeoff: regularization-based methods (e.g., EWC) can overconstrain updates when task optima are weakly overlapping, while replay-based methods can retain performance but drift due to imperfect replay. We study a hybrid perspective: trust region continual learning that combines generative replay with a Fisher-metric trust region constraint. We show that, under local approximations, the resulting update admits a MAML-style interpretation with a single implicit inner step: replay supplies an old-task gradient signal (query-like), while the Fisher-weighted penalty provides an efficient offline curvature shaping (support-like). This yields an emergent meta-learning property in continual learning: the model becomes an initialization that rapidly re-converges to prior task optima after each task transition, without explicitly optimizing a bilevel objective. Empirically, on task-incremental diffusion image generation and continual diffusion-policy control, trust region continual learning achieves the best final performance and retention, and consistently recovers early-task performance faster than EWC, replay, and continual meta-learning baselines.',
  '2604.14489': 'Topic modeling seeks to uncover latent semantic structure in text corpora with minimal supervision. Neural approaches achieve strong performance but require extensive tuning and struggle with lifelong learning due to catastrophic forgetting and fixed capacity, while classical probabilistic models lack flexibility and adaptability to streaming data. We introduce CobwebTM, a low-parameter lifelong hierarchical topic model based on incremental probabilistic concept formation. By adapting the Cobweb algorithm to continuous document embeddings, CobwebTM constructs semantic hierarchies online, enabling unsupervised topic discovery, dynamic topic creation, and hierarchical organization without predefining the number of topics. Across diverse datasets, CobwebTM achieves strong topic coherence, stable topics over time, and high-quality hierarchies, demonstrating that incremental symbolic concept formation combined with pretrained representations is an efficient approach to topic modeling.',
  '2509.23593': 'Catastrophic forgetting remains a central obstacle for continual learning in neural models. Popular approaches—replay and elastic weight consolidation (EWC)—have limitations: replay requires a strong generator and is prone to distributional drift, while EWC implicitly assumes a shared optimum across tasks and typically uses a diagonal Fisher approximation. In this work, we study the gradient geometry of diffusion models, which can already produce high-quality replay data. We provide theoretical and empirical evidence that, in the low signal-to-noise ratio (SNR) regime, per-sample gradients become strongly collinear, yielding an empirical Fisher that is effectively rank-1 and aligned with the mean gradient. Leveraging this structure, we propose a rank-1 variant of EWC that is as cheap as the diagonal approximation yet captures the dominant curvature direction. We pair this penalty with a replay-based approach to encourage parameter sharing across tasks while mitigating drift. On class-incremental image generation datasets (MNIST, FashionMNIST, CIFAR-10, ImageNet-1k), our method consistently improves average FID and reduces forgetting relative to replay-only and diagonal-EWC baselines. In particular, forgetting is nearly eliminated on MNIST and FashionMNIST and is more than halved on ImageNet-1k. These results suggest that diffusion models admit an approximately rank-1 Fisher. With a better Fisher estimate, EWC becomes a strong complement to replay: replay encourages parameter sharing across tasks, while EWC effectively constrains replay-induced drift.',
  '2603.29895': 'We present a new theory of categorization based on an information-theoretic rational analysis. To evaluate this theory, we investigate how well it can account for key findings from classic categorization experiments conducted by [10, 13, 16]. We find that it explains the human categorization behavior as well as (or better) than the independent cue and context models [13], the rational model of categorization [1], and a hierarchical Dirichlet process model [9].',
  '2405.13828': 'Humans are efficient language learners and inherently social creatures. Our language development is largely shaped by our social interactions, for example, the demonstration and feedback from caregivers. Contrary to human language learning, recent advancements in large language models have primarily adopted a non-interactive training paradigm, and refined pre-trained models through feedback afterward. In this work, we explore how corrective feedback from interactions influences neural language acquisition from scratch through systematically controlled experiments, assessing whether it contributes to word learning efficiency in language models. We introduce a trial-and-demonstration (TnD) learning framework that incorporates three distinct components: student trials, teacher demonstrations, and a reward conditioned on language competence at various developmental stages. Our experiments reveal that the TnD approach accelerates word acquisition for student models of equal and smaller numbers of parameters, and we highlight the significance of both trials and demonstrations. We further show that the teacher’s choices of words influence students’ word-specific learning efficiency, and a practice-makes-perfect effect is evident by a strong correlation between the frequency of words in trials and their respective learning curves. Our findings suggest that interactive language learning, with teacher demonstrations and active trials, can facilitate efficient word learning in language models.',
  '2510.02539': 'Neural document retrieval often treats a corpus as a flat cloud of vectors scored at a single granularity, leaving corpus structure underused and explanations opaque. We use Cobweb–a hierarchy-aware framework–to organize sentence embeddings into a prototype tree and rank documents via coarse-to-fine traversal. Internal nodes act as concept prototypes, providing multi-granular relevance signals and a transparent rationale through retrieval paths. We instantiate two inference approaches: a generalized best-first search and a lightweight path-sum ranker. We evaluate our approaches on MS MARCO and QQP with encoder (e.g., BERT/T5) and decoder (GPT-2) representations. Our results show that our retrieval approaches match the dot product search on strong encoder embeddings while remaining robust when kNN degrades: with GPT-2 vectors, dot product performance collapses whereas our approaches still retrieve relevant results. Overall, our experiments suggest that Cobweb provides competitive effectiveness, improved robustness to embedding quality, scalability, and interpretable retrieval via hierarchical prototypes.',
  '2505.24601': 'We introduce the concept of a neuro-symbolic pair—neural and symbolic approaches that are linked through a common knowledge representation. Next, we present taxonomic networks, a type of discrimination network in which nodes represent hierarchically organized taxonomic concepts. Using this representation, we construct a novel neuro-symbolic pair and evaluate its performance. We show that our symbolic method learns taxonomic nets more efficiently with less data and compute, while the neural method finds higher-accuracy taxonomic nets when provided with greater resources. As a neuro-symbolic pair, these approaches can be used interchangeably based on situational needs, with seamless translation between them when necessary. This work lays the foundation for future systems that more fundamentally integrate neural and symbolic computation.',
  '2509.23602': 'Inspired by the human ability to learn and organize knowledge into hierarchical taxonomies with prototypes, this paper addresses key limitations in current deep hierarchical clustering methods. Existing methods often tie the structure to the number of classes and underutilize the rich prototype information available at intermediate hierarchical levels. We introduce deep taxonomic networks, a novel deep latent variable approach designed to bridge these gaps. Our method optimizes a large latent taxonomic hierarchy, specifically a complete binary tree structured mixture-of-Gaussian prior within a variational inference framework, to automatically discover taxonomic structures and associated prototype clusters directly from unlabeled data without assuming true label sizes. We analytically show that optimizing the ELBO of our method encourages the discovery of hierarchical relationships among prototypes. Empirically, our learned models demonstrate strong hierarchical clustering performance, outperforming baselines across diverse image classification datasets using our novel evaluation mechanism that leverages prototype clusters discovered at all hierarchical levels. Qualitative results further reveal that deep taxonomic networks discover rich and interpretable hierarchical taxonomies, capturing both coarse-grained semantic categories and fine-grained visual distinctions.',
  '2305.12544': 'Recent progress in large language models (LLMs) has enabled the deployment of many generative NLP applications. At the same time, it has also led to a misleading public discourse that “it’s all been solved.” Not surprisingly, this has, in turn, made many NLP researchers – especially those at the beginning of their careers – worry about what NLP research area they should focus on. Has it all been solved, or what remaining questions can we work on regardless of LLMs? To address this question, this paper compiles NLP research directions rich for exploration. We identify fourteen different research areas encompassing 45 research directions that require new research and are not directly solvable by LLMs. While we identify many research areas, many others exist; we do not cover areas currently addressed by LLMs, but where LLMs lag behind in performance or those focused on LLM development. We welcome suggestions for other research directions to include: https://bit.ly/nlp-era-llm',
  '2205.02829': 'Research suggests "write-to-learn" tasks improve learning outcomes, yet constructed-response methods of formative assessment become unwieldy with large class sizes. This study evaluates natural language processing algorithms to assist this aim. Six short-answer tasks completed by 1,935 students were scored by several human raters, using a detailed rubric, and an algorithm. Results indicate substantial inter-rater agreement using quadratic weighted kappa for rater pairs (each QWK > 0.74) and group consensus (Fleiss Kappa = 0.68). Additionally, intra-rater agreement was estimated for one rater who had scored 178 responses seven years prior (QWK = 0.89). With compelling rater agreement, the study then pilots cluster analysis of response text toward enabling instructors to ascribe meaning to clusters as a means for scalable formative assessment.',
}
