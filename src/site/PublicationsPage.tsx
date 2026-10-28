import { useId, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { config, lastUpdated, publications } from '@/lib/publications'
import type { Publication } from '@/types'
import { useBlogMetadata } from '@/blog/BlogLayout'
import SiteFrame, { useSiteTheme } from './SiteFrame'
import PublicationEntry from './PublicationEntry'
import { filterPublications } from './publication-content'

function PublicationsContent() {
  const { href } = useSiteTheme()
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const id = useId()
  const searchField = useRef<HTMLInputElement>(null)
  const query = params.get('q') ?? ''
  const topic = params.get('tag') ?? ''
  const filtered = filterPublications(publications, query, topic)
  const hasFilters = Boolean(query.trim() || topic)
  const groups = new Map<number, Publication[]>()
  for (const paper of filtered) {
    const group = groups.get(paper.year) ?? []
    group.push(paper)
    groups.set(paper.year, group)
  }
  const updated = new Date(lastUpdated)
  const updatedLabel = Number.isNaN(updated.getTime()) ? null
    : new Intl.DateTimeFormat('en', { year: 'numeric', month: 'long', day: 'numeric' }).format(updated)

  useBlogMetadata({
    title: `Publications · ${config.name}`,
    description: 'Work on continual learning, adaptation, and reusable knowledge.',
    path: '/publications/',
    image: '/site-card.png',
    imageAlt: 'Zekun Wang. Continual learning for adaptation and generalization.',
  })

  function updateFilters(changes: { q?: string, tag?: string }, replace = true) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    const search = next.toString()
    navigate(href(`${location.pathname}${search ? `?${search}` : ''}${location.hash}`), { replace, preventScrollReset: true })
  }

  function clearFilters() {
    updateFilters({ q: '', tag: '' }, false)
    searchField.current?.focus({ preventScroll: true })
  }

  return (
    <main id="site-main" className="publications-page site-container site-page-enter" tabIndex={-1}>
      <header className="site-page-intro">
        <h1>Publications</h1>
        <p>Work on continual learning, adaptation, and reusable knowledge.</p>
      </header>

      <section className="publications-tools" aria-label="Filter publications">
        <form className="publications-search" role="search" onSubmit={event => event.preventDefault()}>
          <label htmlFor={`${id}-search`}>Search publications</label>
          <div className="publications-search-field">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" />
            </svg>
            <input ref={searchField} id={`${id}-search`} type="search" autoComplete="off" value={query}
              placeholder="Title, author, venue, or idea" aria-controls="publication-results"
              onChange={event => updateFilters({ q: event.target.value })} />
            {query && <button type="button" aria-label="Clear search" onClick={() => {
              updateFilters({ q: '' })
              searchField.current?.focus({ preventScroll: true })
            }}>Clear</button>}
          </div>
        </form>
        <fieldset className="publications-topics" aria-labelledby={`${id}-topics-label`}>
          <legend>
            <span id={`${id}-topics-label`}>Research topics</span>
            <button className="publications-topic-all" type="button" aria-pressed={!topic}
              aria-controls="publication-results" onClick={() => updateFilters({ tag: '' }, false)}>All topics</button>
          </legend>
          <div className="publications-topic-options">
            {config.researchInterests.map(tag => <button key={tag} type="button" aria-pressed={topic === tag}
              aria-controls="publication-results" onClick={() => updateFilters({ tag: topic === tag ? '' : tag }, false)}>{tag}</button>)}
          </div>
        </fieldset>
      </section>

      <div className="publications-result-heading">
        <p role="status" aria-live="polite" aria-atomic="true">
          <span>{filtered.length} {filtered.length === 1 ? 'publication' : 'publications'}</span>
          {hasFilters && <> of {publications.length}</>}
          {topic && <> in {topic}</>}
        </p>
        {hasFilters && filtered.length > 0 && <button type="button" onClick={clearFilters}>Clear filters</button>}
      </div>

      <div id="publication-results" className="publications-record">
        {[...groups].map(([year, papers]) => (
          <section className="publications-year" key={year} aria-labelledby={`publication-year-${year}`}>
            <h2 id={`publication-year-${year}`} className="publications-year-heading">{year}</h2>
            <ol className="publications-year-list" role="list">
              {papers.map(paper => <li key={paper.id} id={`publication-${paper.id}`}><PublicationEntry paper={paper} /></li>)}
            </ol>
          </section>
        ))}
        {filtered.length === 0 && <section className="publications-empty" aria-labelledby={`${id}-empty`}>
          <h2 id={`${id}-empty`}>No publications found</h2>
          <p>Try another title, author, or topic.</p>
          {hasFilters && <button type="button" onClick={clearFilters}>Clear filters</button>}
        </section>}
      </div>
      {updatedLabel && <p className="publications-updated">Last updated <time dateTime={lastUpdated}>{updatedLabel}</time></p>}
    </main>
  )
}

export default function PublicationsPage() {
  return <SiteFrame page="publications"><PublicationsContent /></SiteFrame>
}
