import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Arrow, papers, paperHref, paperSummary, profile, topics, type Publication } from '../../shared'
import './style.css'

const years = [2022, 2024, 2025, 2026] as const
type Year = (typeof years)[number]
type Point = { x: number; y: number; tags: string[] }
type Drawing = { width: number; height: number; points: Point[] }

const chapters: Record<Year, { title: string; introduction: string }> = {
  2022: {
    title: 'Language, in service of learning.',
    introduction: 'I explore how language technology can help instructors give useful feedback in large classes.',
  },
  2024: {
    title: 'The questions still open.',
    introduction: 'I contribute to a collaborative view of the research questions that large language models leave unanswered.',
  },
  2025: {
    title: 'Interaction. Concepts. Structure.',
    introduction: 'I study learning through demonstrations, shared neural–symbolic representations, and hierarchies for discovery and retrieval.',
  },
  2026: {
    title: 'Remembering, composing, understanding.',
    introduction: 'I investigate how models retain knowledge, discover concepts, and represent the world.',
  },
}

const orderedPapers = [...papers].sort((a, b) => a.year - b.year)
const threadClasses: Record<string, string> = {
  'language models': 'timeline-thread-language',
  'concept learning': 'timeline-thread-concept',
  'continual learning': 'timeline-thread-continual',
  compositionality: 'timeline-thread-composition',
  'diffusion models': 'timeline-thread-diffusion',
  'reinforcement learning': 'timeline-thread-reinforcement',
}
const defaultThreads = ['language models', 'concept learning', 'continual learning']

function curveThrough(points: Point[], lane: number): string {
  if (!points.length) return ''
  return points.reduce((path, point, index) => {
    if (!index) return `M ${point.x} ${point.y}`
    const previous = points[index - 1]
    const bend = Math.max(18, (point.y - previous.y) * 0.46)
    return `${path} C ${lane} ${previous.y + bend}, ${lane} ${point.y - bend}, ${point.x} ${point.y}`
  }, '')
}

function PaperEntry({ paper, position }: { paper: Publication; position: number }) {
  const side = position === 0 || position % 2 === 0 ? 'right' : 'left'
  const number = orderedPapers.findIndex((item) => item.id === paper.id) + 1
  return (
    <article
      className={`timeline-paper timeline-paper-${side} ${position === 0 ? 'timeline-paper-first' : ''}`}
      id={`timeline-paper-${paper.id}`}
      style={{ gridRow: position === 0 ? 1 : Math.ceil(position / 2) + 1 }}
      aria-labelledby={`timeline-title-${paper.id}`}
    >
      <span className="timeline-paper-node" data-timeline-tags={paper.tags.join('|')} aria-hidden="true" />
      <div className="timeline-paper-meta">
        <span>{paper.venue}</span>
        <span className="timeline-paper-number">
          <span className="timeline-visually-hidden">Paper </span>
          {String(number).padStart(2, '0')}
          <span className="timeline-visually-hidden"> of {papers.length}</span>
        </span>
      </div>
      <h3 id={`timeline-title-${paper.id}`}>{paper.title}</h3>
      <p className="timeline-paper-summary">{paperSummary(paper)}</p>
      <ul className="timeline-paper-tags" aria-label="Research topics">
        {paper.tags.map((tag) => <li key={tag}>{tag}</li>)}
      </ul>
      <details className="timeline-paper-details">
        <summary>
          Authors & research details
          <span className="timeline-details-mark" aria-hidden="true" />
        </summary>
        <div className="timeline-paper-expanded">
          <p className="timeline-detail-label">Authors</p>
          <p className="timeline-authors">
            {paper.authors.map((author, index) => (
              <span key={`${author}-${index}`}>
                {index > 0 && ', '}
                {author === profile.name ? <strong>{author}</strong> : author}
              </span>
            ))}
          </p>
          <p className="timeline-detail-label">A closer look</p>
          <p>{paper.summary}</p>
        </div>
      </details>
      <div className="timeline-paper-links">
        <a href={paperHref(paper)} target="_blank" rel="noreferrer" aria-label={`Read paper: ${paper.title}`}>
          Read paper <Arrow className="timeline-arrow" />
        </a>
        {paper.pdfUrl && (
          <a href={paper.pdfUrl} target="_blank" rel="noreferrer" aria-label={`PDF: ${paper.title}`}>
            PDF <Arrow className="timeline-arrow" />
          </a>
        )}
      </div>
    </article>
  )
}

export default function Timeline() {
  const [topic, setTopic] = useState('all')
  const [activeYear, setActiveYear] = useState<Year>(2022)
  const [drawing, setDrawing] = useState<Drawing>({ width: 0, height: 0, points: [] })
  const riverRef = useRef<HTMLDivElement>(null)
  const visiblePapers = orderedPapers.filter((paper) => topic === 'all' || paper.tags.includes(topic))
  const visibleYears = years.filter((year) => visiblePapers.some((paper) => paper.year === year))
  const drawnThreads = topic === 'all' ? defaultThreads : [topic]

  // The paths attach to actual entry markers and adapt to wrapping and expansion.
  // The SVG never determines document layout or scrolling.
  useLayoutEffect(() => {
    const river = riverRef.current
    if (!river) return
    let frame = 0
    const measure = () => {
      const bounds = river.getBoundingClientRect()
      const points = Array.from(river.querySelectorAll<HTMLElement>('[data-timeline-tags]')).map((node) => {
        const rect = node.getBoundingClientRect()
        return {
          x: rect.left - bounds.left + rect.width / 2,
          y: rect.top - bounds.top + rect.height / 2,
          tags: (node.dataset.timelineTags ?? '').split('|'),
        }
      })
      setDrawing({ width: bounds.width, height: bounds.height, points })
    }
    const scheduleMeasure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    measure()
    const observer = new ResizeObserver(scheduleMeasure)
    observer.observe(river)
    river.querySelectorAll('.timeline-paper, .timeline-year-header').forEach((element) => observer.observe(element))
    window.addEventListener('resize', scheduleMeasure)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', scheduleMeasure)
    }
  }, [topic])

  useEffect(() => {
    let frame = 0
    const updateYear = () => {
      const sections = Array.from(riverRef.current?.querySelectorAll<HTMLElement>('[data-timeline-year]') ?? [])
      let current = sections[0]
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= window.innerHeight * 0.35) current = section
      }
      if (current) setActiveYear(Number(current.dataset.timelineYear) as Year)
    }
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(updateYear)
    }
    updateYear()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [topic])

  return (
    <div className="design-surface timeline" id="timeline-top">
      <a className="timeline-skip" href="#timeline-journey">Skip to research</a>
      <header className="timeline-masthead timeline-shell">
        <a className="timeline-identity" href="#timeline-top">
          <span className="timeline-name">{profile.name}<span aria-hidden="true">.</span></span>
          <span className="timeline-affiliation">Computer science · Georgia Tech</span>
        </a>
        <nav className="timeline-contact-nav" aria-label="Profile and contact">
          <a href="#timeline-journey">Research</a>
          <a href={profile.cv} target="_blank" rel="noreferrer">CV <Arrow className="timeline-arrow" /></a>
          <a href={profile.scholar} target="_blank" rel="noreferrer">Scholar <Arrow className="timeline-arrow" /></a>
          <a className="timeline-contact-link" href={`mailto:${profile.email}`}>
            Get in touch <Arrow className="timeline-arrow" />
          </a>
        </nav>
      </header>

      <main className="timeline-main timeline-shell">
        <aside className="timeline-rail" aria-label="Journey navigation">
          <div className="timeline-rail-inner">
            <p className="timeline-eyebrow timeline-rail-label">Along the way</p>
            <nav className="timeline-year-nav" aria-label="Publication years">
              {years.map((year) => {
                const count = visiblePapers.filter((paper) => paper.year === year).length
                return count ? (
                  <a
                    key={year}
                    href={`#timeline-year-${year}`}
                    aria-current={activeYear === year ? 'location' : undefined}
                    aria-label={`${year}, ${count} ${count === 1 ? 'paper' : 'papers'}`}
                    onClick={() => setActiveYear(year)}
                  >
                    <span className="timeline-nav-dot" aria-hidden="true" />
                    <span>{year}</span>
                    <span className="timeline-year-count">{String(count).padStart(2, '0')}</span>
                  </a>
                ) : (
                  <span className="timeline-year-unavailable" key={year}>
                    <span className="timeline-nav-dot" aria-hidden="true" />
                    <span>{year}</span>
                    <span className="timeline-year-count" aria-hidden="true">00</span>
                    <span className="timeline-visually-hidden">, no papers in this topic</span>
                  </span>
                )
              })}
            </nav>
            <a className="timeline-latest" href={`#timeline-year-${visibleYears[visibleYears.length - 1]}`}>
              Latest work <span aria-hidden="true">↘</span>
            </a>
            <div className="timeline-path-key">
              <p className="timeline-eyebrow">Reading the paths</p>
              <p>My papers, arranged by publication year. Curves trace shared topics.</p>
              <div className="timeline-key-threads">
                {drawnThreads.map((tag) => (
                  <span className={`timeline-key-thread ${threadClasses[tag]}`} key={tag}>
                    <span className="timeline-key-line" aria-hidden="true" />{tag}
                  </span>
                ))}
              </div>
              <a href="#timeline-journey">Choose a topic <span aria-hidden="true">↑</span></a>
            </div>
          </div>
        </aside>

        <div className="timeline-content">
          <section className="timeline-opening" aria-labelledby="timeline-heading">
            <p className="timeline-eyebrow timeline-opening-label">
              A research journey <span>2022 — 2026</span>
            </p>
            <h1 id="timeline-heading">A line of <em>inquiry.</em></h1>
            <div className="timeline-introduction">
              <p>{profile.intro}</p>
              <p>{profile.research}</p>
            </div>
          </section>

          <section className="timeline-journey" id="timeline-journey" aria-labelledby="timeline-journey-heading">
            <div className="timeline-lenses">
              <div className="timeline-lenses-heading">
                <h2 id="timeline-journey-heading">Follow a thread</h2>
                <p className="timeline-result-count" role="status" aria-live="polite" aria-atomic="true">
                  {topic === 'all' ? `All ${papers.length} papers` : `${visiblePapers.length} of ${papers.length} papers · ${topic}`}
                </p>
              </div>
              <div className="timeline-topic-options" role="group" aria-label="Filter papers by topic">
                {['all', ...topics].map((tag) => (
                  <button
                    key={tag}
                    className={`timeline-topic ${threadClasses[tag] ?? ''}`}
                    type="button"
                    aria-pressed={topic === tag}
                    aria-controls="timeline-paper-trail"
                    onClick={() => setTopic(tag)}
                  >
                    {tag !== 'all' && <span className="timeline-topic-dot" aria-hidden="true" />}
                    {tag === 'all' ? 'All work' : tag}
                    <span className="timeline-topic-count">
                      {tag === 'all' ? papers.length : papers.filter((paper) => paper.tags.includes(tag)).length}
                    </span>
                  </button>
                ))}
              </div>
              <p className="timeline-chronology-note">
                Follow publication years from earlier work to current questions, or trace a shared research topic.
              </p>
            </div>

            <div className="timeline-river" ref={riverRef} id="timeline-paper-trail">
              {drawing.width > 0 && (
                <svg
                  className="timeline-connectors"
                  width={drawing.width}
                  height={drawing.height}
                  viewBox={`0 0 ${drawing.width} ${drawing.height}`}
                  fill="none"
                  aria-hidden="true"
                >
                  <path className="timeline-chronological-path" d={curveThrough(drawing.points, drawing.width / 2)} />
                  {drawnThreads.map((tag, index) => (
                    <path
                      key={tag}
                      className={`timeline-topic-path ${threadClasses[tag]}`}
                      d={curveThrough(
                        drawing.points.filter((point) => point.tags.includes(tag)),
                        drawing.width / 2 + (index - (drawnThreads.length - 1) / 2) * 48,
                      )}
                    />
                  ))}
                </svg>
              )}
              {visibleYears.map((year) => {
                const entries = visiblePapers.filter((paper) => paper.year === year)
                return (
                  <section
                    className={`timeline-year timeline-chapter-${year}`}
                    id={`timeline-year-${year}`}
                    data-timeline-year={year}
                    aria-labelledby={`timeline-year-heading-${year}`}
                    key={year}
                  >
                    <header className="timeline-year-header">
                      <p className="timeline-chapter-count">
                        {String(entries.length).padStart(2, '0')} {entries.length === 1 ? 'paper' : 'papers'}
                        <span aria-hidden="true"> / </span> {topic === 'all' ? 'in the collection' : 'in this thread'}
                      </p>
                      <h2 id={`timeline-year-heading-${year}`}>
                        <span className="timeline-year-number">{year}</span>
                        <span className="timeline-year-title">{chapters[year].title}</span>
                      </h2>
                      <p className="timeline-year-intro">{chapters[year].introduction}</p>
                    </header>
                    {entries.map((paper, index) => <PaperEntry key={paper.id} paper={paper} position={index} />)}
                  </section>
                )
              })}
            </div>
          </section>

          <footer className="timeline-footer">
            <div>
              <p className="timeline-eyebrow">The conversation continues</p>
              <h2>Keep in touch.</h2>
              <a className="timeline-email" href={`mailto:${profile.email}`}>
                {profile.email} <Arrow className="timeline-arrow" />
              </a>
            </div>
            <div className="timeline-footer-profile">
              <p>{profile.name}<br />{profile.title}<br />{profile.affiliation}</p>
              <div className="timeline-footer-links">
                <a href={profile.cv} target="_blank" rel="noreferrer">CV <Arrow className="timeline-arrow" /></a>
                <a href={profile.scholar} target="_blank" rel="noreferrer">Google Scholar <Arrow className="timeline-arrow" /></a>
                <a href="#timeline-top">Back to the beginning <span aria-hidden="true">↑</span></a>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  )
}
