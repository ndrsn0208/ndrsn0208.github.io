import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import {
  citationFor,
  formatAuthors,
  paperHref,
  papers,
  paperSummary,
  profile,
  researchThreads,
  type Publication,
} from '../../shared'
import './style.css'

const chapters = [
  { id: 'introduction', title: 'Introduction', subtitle: 'A note from me', numeral: 'I' },
  { id: 'remembering', title: 'Remembering', subtitle: 'Learning without forgetting', numeral: 'II' },
  { id: 'composing', title: 'Composing', subtitle: 'Putting concepts together', numeral: 'III' },
  { id: 'understanding', title: 'Understanding', subtitle: 'Learning from experience', numeral: 'IV' },
  { id: 'bibliography', title: 'Bibliography', subtitle: `All ${papers.length} publications`, numeral: 'V' },
] as const

type ChapterId = (typeof chapters)[number]['id']
type ResearchChapter = Exclude<ChapterId, 'introduction' | 'bibliography'>
type Navigate = (event: MouseEvent<HTMLAnchorElement>, chapter: ChapterId, paperId?: string) => void

const research: Record<ResearchChapter, {
  title: string
  introduction: string
  body: string
  term: string
  definition: string
  related: ResearchChapter
  connection: string
  paperIds: string[]
}> = {
  remembering: {
    title: researchThreads[0].question,
    introduction: 'I study how a model can make room for new knowledge while keeping the skills it has already learned.',
    body: 'This question takes different forms in language models, diffusion models, and robotic policies. In my work, I look at which parts of a model to update, how to protect earlier knowledge, and how replaying past experience can help a model keep learning.',
    term: 'Continual learning',
    definition: researchThreads[0].description,
    related: 'composing',
    connection: 'Preserving a concept is only part of the story. The next question is how to use it again.',
    paperIds: ['2605.07076', '2602.02417', '2509.23593'],
  },
  composing: {
    title: researchThreads[1].question,
    introduction: 'I’m interested in concepts that can be discovered, organized, and reused in combinations a model has not seen before.',
    body: 'My work connects concept discovery in diffusion models with hierarchical representations. I study how useful pieces of knowledge emerge, how they fit into a larger structure, and how that structure can connect neural and symbolic learning.',
    term: 'Compositionality',
    definition: 'Reusing familiar parts in new combinations. A useful concept can travel beyond the example in which it was learned.',
    related: 'understanding',
    connection: 'A reusable representation also raises a deeper question: what has the model understood?',
    paperIds: ['2605.07078', '2509.23602', '2505.24601'],
  },
  understanding: {
    title: researchThreads[2].question,
    introduction: 'I study how language, perception, and interaction shape the concepts a model learns.',
    body: 'I use comparisons with human judgments and development to ask what visual models learn about shape and number. Alongside this work, I examine how visual grounding changes language representations and how trials and demonstrations can support language learning.',
    term: 'Grounding',
    definition: 'Connecting a representation to perception or interaction, and asking how that connection changes what a model learns.',
    related: 'remembering',
    connection: 'Learning from an experience is a beginning. Carrying that knowledge into the next experience brings us back to remembering.',
    paperIds: ['2505.13281', '2601.18065', '2405.13828'],
  },
}

const years = [...new Set(papers.map((paper) => paper.year))]
const referenceNumber = (paper: Publication) => String(papers.indexOf(paper) + 1).padStart(2, '0')
const chapterHref = (chapter: ChapterId, paperId?: string) =>
  paperId ? `#monograph-reference-${paperId}` : `#monograph-${chapter}`

function chapterFromLocation(): ChapterId {
  if (typeof window === 'undefined') return 'introduction'
  if (window.location.hash.startsWith('#monograph-reference-')) return 'bibliography'
  return chapters.find((chapter) => window.location.hash === chapterHref(chapter.id))?.id ?? 'introduction'
}

function Direction({ back = false, external = false }: { back?: boolean; external?: boolean }) {
  return (
    <svg className="monograph-arrow" width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d={external ? 'M5 15 15 5M5 5h10v10' : back ? 'M16 10H4m5-5-5 5 5 5' : 'M4 10h12m-5-5 5 5-5 5'}
        stroke="currentColor" strokeWidth="1.25"
      />
    </svg>
  )
}

function MarginNote({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="monograph-margin-note">
      <h2 className="monograph-small-label">{label}</h2>
      {children}
    </section>
  )
}

function ConceptFigure({ chapter }: { chapter: ResearchChapter }) {
  const labels = chapter === 'remembering'
    ? ['Earlier knowledge', 'New experience', 'Continued learning']
    : chapter === 'composing'
      ? ['Discover concepts', 'Organize structure', 'Combine & reuse']
      : ['Perception', 'Interaction', 'Learned concepts']
  return (
    <figure className="monograph-figure">
      <svg className="monograph-concept-diagram" viewBox="0 0 540 118" role="img" aria-labelledby={`monograph-figure-${chapter}`}>
        <title id={`monograph-figure-${chapter}`}>{labels.join(' connects to ')}</title>
        <g fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M105 49h104m-7-4 7 4-7 4M313 49h104m-7-4 7 4-7 4" />
          {chapter === 'remembering' ? (
            <>
              <circle cx="70" cy="49" r="22" /><circle cx="70" cy="49" r="5" fill="currentColor" />
              <circle cx="270" cy="49" r="22" strokeDasharray="3 4" /><path d="M261 49h18m-9-9v18" />
              <circle cx="470" cy="49" r="26" /><circle cx="462" cy="49" r="16" />
              <circle cx="462" cy="49" r="4" fill="currentColor" /><path d="M480 43v12m-6-6h12" />
            </>
          ) : chapter === 'composing' ? (
            <>
              <circle cx="54" cy="42" r="12" /><path d="m82 40 12 22H70Z" />
              <path d="M270 29v18m0 0-24 20m24-20 24 20" /><circle cx="270" cy="24" r="6" fill="currentColor" />
              <circle cx="242" cy="72" r="7" /><path d="m297 66 7 12h-14Z" />
              <circle cx="466" cy="47" r="20" /><path d="m476 33 20 35h-40Z" />
            </>
          ) : (
            <>
              <path d="M39 49s12-19 31-19 31 19 31 19-12 19-31 19-31-19-31-19Z" /><circle cx="70" cy="49" r="9" />
              <path d="M247 40c9-18 36-18 45 0m-8-1 9 3 2-9m-2 24c-9 18-36 18-45 0m8 1-9-3-2 9" />
              <path d="M447 66V32h47v34Zm0-17h47m-24-17v34" />
              <circle cx="458" cy="41" r="3" fill="currentColor" /><circle cx="481" cy="58" r="3" fill="currentColor" />
            </>
          )}
        </g>
        {labels.map((label, index) => <text key={label} x={[70, 270, 470][index]} y="106" textAnchor="middle">{label}</text>)}
      </svg>
      <figcaption>
        <span>Fig. {chapters.findIndex((item) => item.id === chapter)}.</span>{' '}
        {chapter === 'remembering'
          ? 'The aim: learn something new while carrying earlier knowledge forward.'
          : chapter === 'composing'
            ? 'From reusable parts to structure, and from structure to new combinations.'
            : 'Different sources of experience offer different ways to learn a concept.'}
      </figcaption>
    </figure>
  )
}

function PaperReference({ paper, navigate }: { paper: Publication; navigate: Navigate }) {
  return (
    <li className="monograph-reading-entry">
      <a className="monograph-reference-number" href={chapterHref('bibliography', paper.id)}
        onClick={(event) => navigate(event, 'bibliography', paper.id)}
        aria-label={`Reference ${referenceNumber(paper)} in the bibliography`}>[{referenceNumber(paper)}]</a>
      <div>
        <p className="monograph-paper-venue">{paper.venue}</p>
        <h3><a href={paperHref(paper)} target="_blank" rel="noreferrer">{paper.title} <Direction external /></a></h3>
        <p className="monograph-paper-note">{paperSummary(paper)}</p>
      </div>
    </li>
  )
}

function Citation({ paper }: { paper: Publication }) {
  const [status, setStatus] = useState('')
  const [fallback, setFallback] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(citationFor(paper))
      setStatus('Citation copied.')
      setFallback(false)
    } catch {
      setFallback(true)
      setStatus('Select the citation below to copy it.')
    }
  }
  return (
    <div className="monograph-citation">
      <button type="button" className="monograph-text-button" onClick={copy}>Copy citation <span aria-hidden="true">↗</span></button>
      <span className="monograph-citation-status" role="status">{status}</span>
      {fallback && <textarea className="monograph-citation-text" aria-label={`Citation for ${paper.title}`} readOnly rows={5}
        value={citationFor(paper)} onFocus={(event) => event.currentTarget.select()} />}
    </div>
  )
}

function Bibliography() {
  const [query, setQuery] = useState('')
  const [year, setYear] = useState('all')
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean)
  const matches = papers.filter((paper) => {
    const text = `${paper.title} ${paper.authors.join(' ')} ${paper.venue} ${paper.arxivId ?? ''} ${paper.tags.join(' ')} ${paperSummary(paper)}`.toLocaleLowerCase()
    return (year === 'all' || String(paper.year) === year) && words.every((word) => text.includes(word))
  })
  const hasFilters = Boolean(query || year !== 'all')
  const clearFilters = () => { setQuery(''); setYear('all') }
  return (
    <div className="monograph-bibliography">
      <div className="monograph-bibliography-preface">
        <p>My papers, collected in one place. Open a reading note for a plain-language introduction and a citation.</p>
        <a href={profile.scholar} target="_blank" rel="noreferrer">Google Scholar <Direction external /></a>
      </div>
      <form className="monograph-search" role="search" aria-label="Search the bibliography" onSubmit={(event) => event.preventDefault()}>
        <div className="monograph-search-field">
          <label htmlFor="monograph-paper-search">Find a paper</label>
          <div className="monograph-search-input-wrap">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="5.5" stroke="currentColor" /><path d="m12 12 5 5" stroke="currentColor" /></svg>
            <input id="monograph-paper-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title, author, topic…" autoComplete="off" />
          </div>
        </div>
        <div className="monograph-year-field">
          <label htmlFor="monograph-paper-year">Year</label>
          <select id="monograph-paper-year" value={year} onChange={(event) => setYear(event.target.value)}>
            <option value="all">All years</option>
            {years.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </form>
      <div className="monograph-results-line">
        <p role="status" aria-live="polite">{matches.length} of {papers.length} papers <span aria-hidden="true">·</span> Most recent first</p>
        {hasFilters && <button type="button" className="monograph-text-button" onClick={clearFilters}>Clear filters</button>}
      </div>
      {matches.length ? (
        <ol className="monograph-bibliography-list">
          {matches.map((paper) => (
            <li key={paper.id} id={`monograph-reference-${paper.id}`} className="monograph-bibliography-entry" tabIndex={-1}>
              <span className="monograph-bibliography-number" aria-label={`Reference ${referenceNumber(paper)}`}>[{referenceNumber(paper)}]</span>
              <div className="monograph-bibliography-body">
                <p className="monograph-paper-venue">{paper.venue}</p>
                <h3><a href={paperHref(paper)} target="_blank" rel="noreferrer">{paper.title} <Direction external /></a></h3>
                <p className="monograph-authors">{formatAuthors(paper)}</p>
                <div className="monograph-publication-actions">
                  <a href={paperHref(paper)} target="_blank" rel="noreferrer">Read paper <Direction external /></a>
                  {paper.pdfUrl && <a href={paper.pdfUrl} target="_blank" rel="noreferrer">PDF <Direction external /></a>}
                </div>
                <details className="monograph-reading-note">
                  <summary>Reading note & citation <span aria-hidden="true">+</span></summary>
                  <div className="monograph-reading-note-body">
                    <p className="monograph-plain-summary">{paperSummary(paper)}</p>
                    {paper.authors.length > 5 && <p className="monograph-full-authors"><strong>All authors.</strong> {paper.authors.join(', ')}</p>}
                    <p className="monograph-research-summary">{paper.summary}</p>
                    <p className="monograph-paper-topics">{paper.tags.join(' · ')}</p>
                    <Citation paper={paper} />
                  </div>
                </details>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="monograph-empty">
          <h3>No papers match this search.</h3>
          <p>Try a surname, a shorter phrase, or a topic such as “concept learning”.</p>
          <button type="button" className="monograph-text-button" onClick={clearFilters}>Show all {papers.length} papers <Direction /></button>
        </div>
      )}
      <p className="monograph-bibliography-end"><span aria-hidden="true">❧</span> End of {hasFilters ? 'these results' : 'the bibliography'}</p>
    </div>
  )
}

export default function Monograph() {
  const [chapterId, setChapterId] = useState<ChapterId>(chapterFromLocation)
  const [contentsOpen, setContentsOpen] = useState(false)
  const [navigationVersion, setNavigationVersion] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const pageRef = useRef<HTMLElement>(null)
  const navigationRef = useRef<HTMLDivElement>(null)
  const contentsButtonRef = useRef<HTMLButtonElement>(null)
  const shouldFocus = useRef(false)
  const chapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId)
  const chapter = chapters[chapterIndex]
  const previous = chapters[chapterIndex - 1]
  const next = chapters[chapterIndex + 1]

  const navigate: Navigate = (event, destination, paperId) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    const hash = chapterHref(destination, paperId)
    if (window.location.hash !== hash) window.history.pushState(window.history.state, '', hash)
    shouldFocus.current = true
    setChapterId(destination)
    setContentsOpen(false)
    setNavigationVersion((version) => version + 1)
  }

  useEffect(() => {
    const syncLocation = () => {
      const hash = window.location.hash
      if (hash && !hash.startsWith('#monograph-reference-') && !chapters.some((item) => hash === chapterHref(item.id))) return
      shouldFocus.current = true
      setChapterId(chapterFromLocation())
      setContentsOpen(false)
      setNavigationVersion((version) => version + 1)
    }
    window.addEventListener('popstate', syncLocation)
    window.addEventListener('hashchange', syncLocation)
    return () => {
      window.removeEventListener('popstate', syncLocation)
      window.removeEventListener('hashchange', syncLocation)
    }
  }, [])

  useEffect(() => {
    const referenceHash = window.location.hash.startsWith('#monograph-reference-')
    if (!shouldFocus.current && !referenceHash) return
    const frame = window.requestAnimationFrame(() => {
      const reference = referenceHash ? document.getElementById(window.location.hash.slice(1)) : null
      const focusTarget = reference ?? headingRef.current
      const scrollTarget = reference ?? pageRef.current
      focusTarget?.focus({ preventScroll: true })
      scrollTarget?.scrollIntoView({ block: 'start', behavior: 'auto' })
      shouldFocus.current = false
    })
    return () => window.cancelAnimationFrame(frame)
  }, [chapterId, navigationVersion])

  useEffect(() => {
    if (!contentsOpen) return
    const dismissOutside = (event: PointerEvent) => {
      if (!navigationRef.current?.contains(event.target as Node)) setContentsOpen(false)
    }
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContentsOpen(false)
        contentsButtonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', dismissOutside)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [contentsOpen])

  return (
    <div className="design-surface monograph">
      <a className="monograph-skip-link" href="#monograph-reading-page" onClick={(event) => {
        event.preventDefault()
        pageRef.current?.focus({ preventScroll: true })
        pageRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' })
      }}>Skip to the reading page</a>
      <header className="monograph-jacket-head">
        <a className="monograph-brand" href={chapterHref('introduction')} onClick={(event) => navigate(event, 'introduction')}>
          <svg className="monograph-book-mark" width="23" height="25" viewBox="0 0 23 25" fill="none" aria-hidden="true">
            <path d="M3 3h16v19H3V3Zm4 0v19M10 7h6m-6 4h6m-6 4h4" stroke="currentColor" strokeWidth="1.1" />
          </svg>
          {profile.name}
        </a>
        <p className="monograph-jacket-description">Computer science <span aria-hidden="true">/</span> {profile.shortAffiliation}</p>
        <div className="monograph-jacket-links">
          <a href={profile.cv} target="_blank" rel="noreferrer">CV <Direction external /></a>
          <a href={`mailto:${profile.email}`}>Contact <Direction external /></a>
        </div>
      </header>

      <div className="monograph-book">
        <div className="monograph-navigation" ref={navigationRef} onBlur={(event) => {
          if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setContentsOpen(false)
        }}>
          <div className="monograph-mobile-bar">
            <button ref={contentsButtonRef} type="button" aria-expanded={contentsOpen} aria-controls="monograph-contents" onClick={() => setContentsOpen((open) => !open)}>
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" /></svg>
              Contents <span className="monograph-mobile-current">{chapter.numeral}</span>
            </button>
            <a href={chapterHref('bibliography')} onClick={(event) => navigate(event, 'bibliography')}>All {papers.length} papers <Direction /></a>
          </div>
          <aside id="monograph-contents" className={`monograph-contents${contentsOpen ? ' monograph-contents-open' : ''}`} aria-label="Book contents and author links">
            <p className="monograph-small-label">A personal monograph</p>
            <a className="monograph-book-title" href={chapterHref('introduction')} onClick={(event) => navigate(event, 'introduction')}>On learning<br />& knowing.</a>
            <p className="monograph-book-author">by {profile.name}</p>
            <div className="monograph-contents-heading"><h2>Contents</h2><span>Chapter</span></div>
            <nav aria-label="Chapters">
              <ol className="monograph-chapter-list">
                {chapters.map((item) => (
                  <li key={item.id}>
                    <a href={chapterHref(item.id)} onClick={(event) => navigate(event, item.id)} aria-current={chapterId === item.id ? 'page' : undefined}>
                      <span className="monograph-chapter-label"><span>{item.title}</span><small>{item.subtitle}</small></span>
                      <span className="monograph-contents-numeral">{item.numeral}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="monograph-contents-resources">
              <p className="monograph-small-label">Elsewhere</p>
              <a href={profile.cv} target="_blank" rel="noreferrer">Curriculum vitae <span>PDF <Direction external /></span></a>
              <a href={profile.scholar} target="_blank" rel="noreferrer">Google Scholar <Direction external /></a>
              <a className="monograph-email" href={`mailto:${profile.email}`}>{profile.email} <Direction external /></a>
            </div>
            <div className="monograph-colophon">
              <span className="monograph-colophon-mark" aria-hidden="true">zw.</span>
              <p>{profile.title}<br />{profile.affiliation}</p>
            </div>
          </aside>
        </div>

        <main id="monograph-reading-page" className="monograph-page" ref={pageRef} tabIndex={-1}>
          <div className="monograph-running-head" aria-hidden="true"><span>{profile.name}</span><span>On learning & knowing</span></div>
          <article id={`monograph-${chapterId}`} className={`monograph-chapter monograph-chapter-${chapterId}`}>
            <header className="monograph-chapter-header">
              <p className="monograph-chapter-eyebrow"><span>{chapter.numeral}</span> {chapter.title}</p>
              <h1 id="monograph-chapter-heading" className="monograph-chapter-heading" ref={headingRef} tabIndex={-1}>
                {chapterId === 'introduction'
                  ? <>Learning without<br /><em>starting over.</em></>
                  : chapterId === 'bibliography'
                    ? <>The bibliography<span className="monograph-title-period">.</span></>
                    : research[chapterId].title}
              </h1>
            </header>

            {chapterId === 'introduction' ? (
              <div className="monograph-reading-layout">
                <div className="monograph-prose">
                  <p className="monograph-introduction"><span className="monograph-drop-cap">{profile.intro.charAt(0)}</span>{profile.intro.slice(1)}</p>
                  <p>{profile.research}</p>
                  <p>I’m interested in the knowledge that carries forward: what a model remembers, which concepts it can reuse, and how those concepts come to mean something.</p>
                  <p className="monograph-signature">Zekun Wang</p>
                  <div className="monograph-direct-bibliography">
                    <p>Looking for a particular paper?</p>
                    <a href={chapterHref('bibliography')} onClick={(event) => navigate(event, 'bibliography')}>Open the bibliography <span>{papers.length} papers</span> <Direction /></a>
                  </div>
                </div>
                <aside className="monograph-margin" aria-label="Introduction margin notes">
                  <MarginNote label="The author">
                    <p>{profile.title}<br />{profile.affiliation}</p>
                    <p>Advised by<br /><span className="monograph-note-name">{profile.advisor}</span></p>
                  </MarginNote>
                  <MarginNote label="A way through">
                    <p>Three connected questions guide my research.</p>
                    <ol className="monograph-margin-route">
                      <li><a href={chapterHref('remembering')} onClick={(event) => navigate(event, 'remembering')}><span>II</span> What to keep <Direction /></a></li>
                      <li><a href={chapterHref('composing')} onClick={(event) => navigate(event, 'composing')}><span>III</span> What to combine <Direction /></a></li>
                      <li><a href={chapterHref('understanding')} onClick={(event) => navigate(event, 'understanding')}><span>IV</span> What to understand <Direction /></a></li>
                    </ol>
                  </MarginNote>
                </aside>
              </div>
            ) : chapterId === 'bibliography' ? <Bibliography key={navigationVersion} /> : (
              <div className="monograph-reading-layout">
                <div className="monograph-prose">
                  <p className="monograph-research-introduction">{research[chapterId].introduction}</p>
                  <p>{research[chapterId].body}</p>
                  <ConceptFigure chapter={chapterId} />
                  <section className="monograph-chapter-papers" aria-labelledby="monograph-further-reading">
                    <div className="monograph-section-label"><h2 id="monograph-further-reading">Related reading</h2><span>3 papers</span></div>
                    <ol className="monograph-reading-list">
                      {research[chapterId].paperIds.map((id) => {
                        const paper = papers.find((item) => item.arxivId === id)
                        return paper ? <PaperReference key={paper.id} paper={paper} navigate={navigate} /> : null
                      })}
                    </ol>
                    <a className="monograph-all-papers" href={chapterHref('bibliography')} onClick={(event) => navigate(event, 'bibliography')}>All {papers.length} papers in the bibliography <Direction /></a>
                  </section>
                </div>
                <aside className="monograph-margin" aria-label={`${chapter.title} margin notes`}>
                  <MarginNote label="In the margin"><p className="monograph-note-term">{research[chapterId].term}</p><p>{research[chapterId].definition}</p></MarginNote>
                  <MarginNote label="A connection">
                    <p>{research[chapterId].connection}</p>
                    <a className="monograph-note-link" href={chapterHref(research[chapterId].related)} onClick={(event) => navigate(event, research[chapterId].related)}>
                      {chapters.find((item) => item.id === research[chapterId].related)?.title} <Direction />
                    </a>
                  </MarginNote>
                  <MarginNote label="Reading the references"><p>Numbered references lead to the bibliography. Paper titles open the original publication.</p></MarginNote>
                </aside>
              </div>
            )}
          </article>
          <footer className="monograph-page-footer" aria-label="Chapter navigation">
            {previous ? (
              <a className="monograph-page-turn monograph-page-turn-back" href={chapterHref(previous.id)} onClick={(event) => navigate(event, previous.id)}>
                <Direction back /><span><small>Previous chapter</small>{previous.title}</span>
              </a>
            ) : <p className="monograph-opening-mark">A few notes on<br />a continuing question.</p>}
            <span className="monograph-folio" aria-label={`Chapter ${chapterIndex + 1} of ${chapters.length}`}>{String(chapterIndex + 1).padStart(2, '0')}<span> / {String(chapters.length).padStart(2, '0')}</span></span>
            <a className="monograph-page-turn monograph-page-turn-next" href={chapterHref(next?.id ?? 'introduction')} onClick={(event) => navigate(event, next?.id ?? 'introduction')}>
              <span><small>{next ? 'Next chapter' : 'Back to the beginning'}</small>{next?.title ?? 'Introduction'}</span><Direction />
            </a>
          </footer>
        </main>
      </div>
      <p className="monograph-jacket-foot">Remembering <span aria-hidden="true">·</span> Composing <span aria-hidden="true">·</span> Understanding</p>
      <span className="monograph-sr-only" role="status" aria-live="polite">Chapter {chapterIndex + 1} of {chapters.length}: {chapter.title}</span>
    </div>
  )
}
