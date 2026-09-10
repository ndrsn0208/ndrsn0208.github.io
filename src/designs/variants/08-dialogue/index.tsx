import { useEffect, useRef, useState } from 'react'
import { Arrow, papers, paperHref, paperSummary, profile, topics, type Publication } from '../../shared'
import './style.css'

type Question = 'curiosity' | 'learning' | 'reading' | 'contact'
type View = Question | 'publications'

interface Answer {
  question: string
  eyebrow: string
  title: string
  continuation: string
  introduction: string
  trailTitle: string
  trail: { arxivId: string; note: string }[]
  next: View
  nextLabel: string
}

const answers: Record<Question, Answer> = {
  curiosity: {
    question: 'What are you curious about?',
    eyebrow: '01 / The question behind my work',
    title: 'AI that keeps',
    continuation: 'on learning.',
    introduction:
      'I study how AI can learn new things without losing what it already knows. How can a model remember, discover useful concepts, and put those concepts together in new ways?',
    trailTitle: 'Two threads to pick up',
    trail: [
      { arxivId: '2605.07076', note: 'Making room for new knowledge' },
      { arxivId: '2605.07078', note: 'Making more of familiar concepts' },
    ],
    next: 'learning',
    nextLabel: 'How can AI keep learning?',
  },
  learning: {
    question: 'How can AI keep learning?',
    eyebrow: '02 / Learning without starting over',
    title: 'New skills.',
    continuation: 'Old knowledge.',
    introduction:
      'Learning something new can overwrite what a model already knows. I explore how to choose what changes, protect what matters, and build on earlier experience.',
    trailTitle: 'Three ways into the problem',
    trail: [
      { arxivId: '2605.07076', note: '01 / Learn what to update' },
      { arxivId: '2509.23593', note: '02 / Protect earlier knowledge' },
      { arxivId: '2602.02417', note: '03 / Connect stability and adaptation' },
    ],
    next: 'reading',
    nextLabel: 'Where should I start reading?',
  },
  reading: {
    question: 'Where should I start reading?',
    eyebrow: '03 / A suggested reading path',
    title: 'Three papers.',
    continuation: 'A way in.',
    introduction:
      'I’d start with concepts: how a model discovers them, combines them, and keeps learning. These three papers trace that path. Each has a short introduction below.',
    trailTitle: 'From concepts to continual learning',
    trail: [
      { arxivId: '2509.23602', note: '01 / First, discover the building blocks' },
      { arxivId: '2605.07078', note: '02 / Then, put them together' },
      { arxivId: '2605.07076', note: '03 / Keep adding to what you know' },
    ],
    next: 'publications',
    nextLabel: `Explore all ${papers.length} publications`,
  },
  contact: {
    question: 'Can we get in touch?',
    eyebrow: '04 / Keep the conversation going',
    title: 'Yes. Let’s',
    continuation: 'compare notes.',
    introduction:
      'If something here connects with a question you’re working on, I’d be glad to hear about it. Email is the simplest way to reach me.',
    trailTitle: 'One possible conversation starter',
    trail: [
      { arxivId: '2605.07076', note: 'What should a learning system remember?' },
    ],
    next: 'curiosity',
    nextLabel: 'Back to the questions',
  },
}

const questions = Object.keys(answers) as Question[]
const publicationYears = [...new Set(papers.map((paper) => paper.year))]

function QuestionSculpture({ learning = false }: { learning?: boolean }) {
  return (
    <figure className={`dialogue-sculpture${learning ? ' dialogue-sculpture-learning' : ''}`} aria-hidden="true">
      {learning ? (
        <svg className="dialogue-knowledge-svg" viewBox="0 0 250 300" fill="none">
          <ellipse cx="125" cy="139" rx="106" ry="106" stroke="#b9a3c9" strokeDasharray="3 7" />
          <path d="M62 92 167 66 180 186 72 220 62 92ZM62 92 180 186M167 66 72 220" stroke="#b9a3c9" strokeWidth="1.5" />
          <path d="M62 92Q50 143 72 220Q127 240 180 186" stroke="#684174" strokeWidth="3" />
          <circle cx="62" cy="92" r="30" fill="#ded1ee" />
          <circle cx="167" cy="66" r="23" fill="#ede5f6" stroke="#b9a3c9" />
          <circle cx="180" cy="186" r="36" fill="#684174" />
          <circle cx="72" cy="220" r="17" fill="#d6b98f" />
          <path d="M52 92h20m-10-10v20M170 186h20m-10-10v20" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="167" cy="66" r="5" fill="#684174" />
          <text x="19" y="45" fill="#684174">remember</text>
          <text x="163" y="123" fill="#684174">connect</text>
          <text x="86" y="280" fill="#684174">keep growing</text>
        </svg>
      ) : (
        <svg className="dialogue-question-svg" viewBox="0 0 250 300" fill="none">
          <path d="M48 87C48 42 78 24 119 24C161 24 191 44 191 79C191 111 163 126 145 140C128 153 124 166 124 185" stroke="#bba2d0" strokeWidth="44" strokeLinecap="round" transform="translate(7 6)" />
          <path d="M48 87C48 42 78 24 119 24C161 24 191 44 191 79C191 111 163 126 145 140C128 153 124 166 124 185" stroke="#dfd1ef" strokeWidth="44" strokeLinecap="round" />
          <path d="M36 83C36 42 69 13 114 13" stroke="#f9f5fd" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="124" cy="155" rx="123" ry="40" transform="rotate(-24 124 155)" stroke="#a186b1" strokeWidth="1.2" />
          <circle cx="232" cy="109" r="7" fill="#684174" />
          <circle cx="26" cy="202" r="5" fill="#d6b98f" />
          <circle cx="129" cy="248" r="27" fill="#684174" />
          <path d="M112 243a16 16 0 0 1 13-12" stroke="#a58ab7" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M216 239v18m-9-9h18" stroke="#a186b1" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </figure>
  )
}

function PaperEntry({ paper, note, number, compact = false }: {
  paper: Publication
  note?: string
  number: number
  compact?: boolean
}) {
  return (
    <li className={`dialogue-paper${compact ? ' dialogue-paper-compact' : ''}`}>
      <span className="dialogue-paper-number" aria-hidden="true">{String(number).padStart(2, '0')}</span>
      <article className="dialogue-paper-body">
        <div className="dialogue-paper-meta">
          {note && <span className="dialogue-paper-note">{note}</span>}
          <span className="dialogue-paper-venue">{paper.venue}</span>
        </div>
        <h3 className="dialogue-paper-title">
          <a href={paperHref(paper)} target="_blank" rel="noreferrer">
            {paper.title}<Arrow className="dialogue-arrow" />
          </a>
        </h3>
        <p className="dialogue-paper-summary">{paperSummary(paper)}</p>
        <details className="dialogue-paper-details">
          <summary>Authors &amp; paper links <span className="dialogue-details-mark" aria-hidden="true">+</span></summary>
          <p className="dialogue-paper-authors">{paper.authors.join(', ')}</p>
          <div className="dialogue-paper-tags">
            {paper.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          <div className="dialogue-paper-links">
            <a href={paperHref(paper)} target="_blank" rel="noreferrer">Read on arXiv <Arrow className="dialogue-arrow" /></a>
            {paper.pdfUrl && <a href={paper.pdfUrl} target="_blank" rel="noreferrer">PDF <Arrow className="dialogue-arrow" /></a>}
          </div>
        </details>
      </article>
    </li>
  )
}

export default function Dialogue() {
  const [view, setView] = useState<View>('curiosity')
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('all')
  const [year, setYear] = useState('all')
  const [announcement, setAnnouncement] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const shouldFocusResponse = useRef(false)
  const answer = view === 'publications' ? null : answers[view]

  const focusResponse = () => {
    headingRef.current?.focus({ preventScroll: true })
    headingRef.current?.scrollIntoView({
      block: window.matchMedia('(max-width: 960px)').matches ? 'start' : 'nearest',
      behavior: 'auto',
    })
  }

  useEffect(() => {
    if (shouldFocusResponse.current) {
      shouldFocusResponse.current = false
      focusResponse()
    }
  }, [view])

  const chooseView = (next: View) => {
    if (next === 'publications') {
      setQuery('')
      setTopic('all')
      setYear('all')
    }
    setAnnouncement(next === 'publications'
      ? `All ${papers.length} publications. Search or choose a topic to explore.`
      : `${answers[next].question} ${answers[next].title} ${answers[next].continuation}`)
    if (next === view) {
      focusResponse()
    } else {
      shouldFocusResponse.current = true
      setView(next)
    }
  }

  const searchWords = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  const filteredPapers = papers.filter((paper) => {
    if (topic !== 'all' && !paper.tags.includes(topic)) return false
    if (year !== 'all' && paper.year !== Number(year)) return false
    const searchable = [
      paper.title, paper.authors.join(' '), paper.venue, paper.year,
      paper.tags.join(' '), paperSummary(paper),
    ].join(' ').toLocaleLowerCase()
    return searchWords.every((word) => searchable.includes(word))
  })
  const hasFilters = Boolean(query || topic !== 'all' || year !== 'all')
  const resetFilters = () => {
    setQuery('')
    setTopic('all')
    setYear('all')
    searchRef.current?.focus({ preventScroll: true })
  }

  return (
    <div className="design-surface dialogue" lang="en">
      <a className="dialogue-skip" href="#dialogue-response">Skip to the answer</a>
      <header className="dialogue-header">
        <div className="dialogue-identity">
          <svg className="dialogue-brand-mark" width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden="true">
            <path d="M19 4v30M4 19h30M8.5 8.5l21 21m0-21-21 21" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
            <circle cx="19" cy="19" r="4" fill="#f2ecf8" />
          </svg>
          <div>
            <p className="dialogue-name">{profile.name}</p>
            <p className="dialogue-position">CS PhD student <span aria-hidden="true">·</span> {profile.shortAffiliation}</p>
          </div>
        </div>
        <nav className="dialogue-direct-nav" aria-label="Publications and contact links">
          <button type="button" className="dialogue-publications-button" onClick={() => chooseView('publications')} aria-controls="dialogue-response" aria-pressed={view === 'publications'}>
            All publications <span className="dialogue-count">{papers.length}</span>
          </button>
          <a href={profile.scholar} target="_blank" rel="noreferrer">Scholar <Arrow className="dialogue-arrow" /></a>
          <a href={profile.cv} target="_blank" rel="noreferrer">CV <Arrow className="dialogue-arrow" /></a>
          <a href={`mailto:${profile.email}`}>Email <Arrow className="dialogue-arrow" /></a>
        </nav>
      </header>

      <main className="dialogue-main">
        <aside className="dialogue-question-rail" aria-label="An introduction through questions">
          <p className="dialogue-eyebrow">Hello, I’m Zekun.</p>
          <h1 className="dialogue-welcome">It starts with<br />a question<span className="dialogue-welcome-dot">.</span></h1>
          <p className="dialogue-invitation">A few ways into what I do.<br />Choose whatever you’re curious about.</p>
          <nav className="dialogue-questions" aria-label="Choose a question">
            {questions.map((question, index) => (
              <button
                className="dialogue-question"
                type="button"
                key={question}
                aria-pressed={view === question}
                aria-controls="dialogue-response"
                onClick={() => chooseView(question)}
              >
                <span className="dialogue-question-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <span className="dialogue-question-label">{answers[question].question}</span>
                <Arrow direction="right" className="dialogue-arrow" />
              </button>
            ))}
          </nav>
          <div className="dialogue-about-note">
            <span className="dialogue-note-star" aria-hidden="true">✳</span>
            <p>I’m a computer science PhD student at <strong>{profile.shortAffiliation}</strong>, advised by <strong>{profile.advisor}</strong>. My work connects continual learning, compositionality, and concept learning.</p>
          </div>
          <a className="dialogue-rail-email" href={`mailto:${profile.email}`}>{profile.email}<Arrow className="dialogue-arrow" /></a>
        </aside>

        <section
          id="dialogue-response"
          className={`dialogue-response${view === 'publications' ? ' dialogue-response-publications' : ''}`}
          aria-labelledby="dialogue-response-title"
          tabIndex={-1}
        >
          <p className="dialogue-sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
          <div className="dialogue-response-topline">
            <p className="dialogue-eyebrow">{answer?.eyebrow ?? `The complete collection / ${Math.min(...publicationYears)}–${Math.max(...publicationYears)}`}</p>
            <span className="dialogue-response-dot" aria-hidden="true" />
          </div>
          <div className={`dialogue-answer-heading${view === 'publications' ? ' dialogue-answer-heading-wide' : ''}`}>
            <div className="dialogue-answer-copy">
              <h2 className="dialogue-response-title" id="dialogue-response-title" ref={headingRef} tabIndex={-1}>
                {answer ? <>{answer.title}{' '}<span>{answer.continuation}</span></> : <>All publications<span className="dialogue-title-period">.</span></>}
              </h2>
              <p className="dialogue-answer-introduction">
                {answer?.introduction ?? 'Find a paper, follow a topic, or browse the questions I’ve worked on. These are all of my publications, with a short introduction to each.'}
              </p>
            </div>
            {answer && <QuestionSculpture learning={view === 'learning'} />}
          </div>
          {view === 'contact' && (
            <div className="dialogue-contact">
              <p className="dialogue-eyebrow">You can reach me at</p>
              <a className="dialogue-contact-email" href={`mailto:${profile.email}`}>{profile.email}<Arrow className="dialogue-arrow" /></a>
              <div className="dialogue-contact-links">
                <a href={profile.cv} target="_blank" rel="noreferrer">My CV <Arrow className="dialogue-arrow" /></a>
                <a href={profile.scholar} target="_blank" rel="noreferrer">Google Scholar <Arrow className="dialogue-arrow" /></a>
                <a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn <Arrow className="dialogue-arrow" /></a>
              </div>
            </div>
          )}
          {answer ? (
            <>
              <div className="dialogue-trail-heading">
                <p>{answer.trailTitle}</p>
                <span>{String(answer.trail.length).padStart(2, '0')} {answer.trail.length === 1 ? 'paper' : 'papers'}</span>
              </div>
              <ol className="dialogue-paper-trail" key={view}>
                {answer.trail.map((stop, index) => {
                  const paper = papers.find((item) => item.arxivId === stop.arxivId)
                  return paper ? <PaperEntry key={paper.id} paper={paper} note={stop.note} number={index + 1} /> : null
                })}
              </ol>
              <div className="dialogue-answer-footer">
                <span className="dialogue-next-label">Follow the thought</span>
                <button type="button" onClick={() => chooseView(answer.next)} aria-controls="dialogue-response">
                  {answer.nextLabel}<Arrow direction="right" className="dialogue-arrow" />
                </button>
              </div>
              {view !== 'reading' && (
                <button className="dialogue-all-papers-link" type="button" onClick={() => chooseView('publications')} aria-controls="dialogue-response">
                  Or browse all {papers.length} publications <Arrow direction="right" className="dialogue-arrow" />
                </button>
              )}
            </>
          ) : (
            <div className="dialogue-publications">
              <div className="dialogue-search-row">
                <div className="dialogue-search-field">
                  <label htmlFor="dialogue-paper-search">Search the collection</label>
                  <div className="dialogue-search-control">
                    <svg className="dialogue-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                      <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <input id="dialogue-paper-search" ref={searchRef} type="search" value={query} placeholder="Title, author, venue, or idea" onChange={(event) => setQuery(event.target.value)} aria-controls="dialogue-publication-results" autoComplete="off" />
                  </div>
                </div>
                <div className="dialogue-year-field">
                  <label htmlFor="dialogue-year-filter">Year</label>
                  <select id="dialogue-year-filter" value={year} onChange={(event) => setYear(event.target.value)} aria-controls="dialogue-publication-results">
                    <option value="all">All years</option>
                    {publicationYears.map((publicationYear) => <option key={publicationYear} value={publicationYear}>{publicationYear}</option>)}
                  </select>
                </div>
              </div>
              <div className="dialogue-topic-filters" role="group" aria-label="Filter publications by topic">
                {['all', ...topics].map((item) => (
                  <button key={item} type="button" aria-pressed={topic === item} aria-controls="dialogue-publication-results" onClick={() => setTopic(item)}>
                    {item === 'all' ? 'All topics' : item}
                  </button>
                ))}
              </div>
              <div className="dialogue-results-bar">
                <p role="status" aria-live="polite" aria-atomic="true">
                  {filteredPapers.length} of {papers.length} papers
                  <span className="dialogue-sr-only">{topic !== 'all' ? ` in ${topic}` : ''}{year !== 'all' ? ` from ${year}` : ''}{query.trim() ? ` matching ${query.trim()}` : ''}</span>
                </p>
                {hasFilters ? <button type="button" onClick={resetFilters}>Clear filters <span aria-hidden="true">×</span></button> : <span>Newest first</span>}
              </div>
              <div id="dialogue-publication-results">
                {filteredPapers.length ? (
                  <ol className="dialogue-publication-list">
                    {filteredPapers.map((paper, index) => <PaperEntry key={paper.id} paper={paper} number={index + 1} compact />)}
                  </ol>
                ) : (
                  <div className="dialogue-empty">
                    <h3>No papers found for that combination.</h3>
                    <p>Try a broader phrase, another topic, or a different year.</p>
                    <button type="button" onClick={resetFilters}>Show all {papers.length} papers <Arrow direction="right" className="dialogue-arrow" /></button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
      <footer className="dialogue-footer">
        <p>{profile.name} <span aria-hidden="true">/</span> {profile.affiliation}</p>
        <a href={`mailto:${profile.email}`}>Every good connection starts somewhere. <Arrow className="dialogue-arrow" /></a>
      </footer>
    </div>
  )
}
