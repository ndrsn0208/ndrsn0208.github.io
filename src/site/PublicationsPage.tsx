import { useId, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { config, publications } from '@/lib/publications'
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
  const sharedCredit = filtered.some(paper => paper.equalContribution?.length)

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
    <main id="site-main" className="papers-page site-container" tabIndex={-1}>
      <header className="site-page-intro papers-intro">
        <h1>Papers</h1>
        <form className="papers-search" role="search" onSubmit={event => event.preventDefault()}>
          <label className="site-hidden" htmlFor={`${id}-search`}>Search papers</label>
          <input ref={searchField} id={`${id}-search`} type="search" autoComplete="off" value={query}
            placeholder="Search" aria-controls="publication-results"
            onChange={event => updateFilters({ q: event.target.value })} />
        </form>
      </header>

      <section className="papers-tools" aria-label="Filter papers">
        <div className="papers-topics" role="group" aria-label="Research topics">
          <button type="button" aria-pressed={!topic} aria-controls="publication-results" onClick={() => updateFilters({ tag: '' }, false)}>All</button>
          {config.researchInterests.map(tag => <button key={tag} type="button" aria-pressed={topic === tag}
            aria-controls="publication-results" onClick={() => updateFilters({ tag: topic === tag ? '' : tag }, false)}>{tag}</button>)}
        </div>
      </section>

      <p className={hasFilters ? 'site-note papers-count' : 'site-hidden'} role="status" aria-live="polite" aria-atomic="true">
        {filtered.length} {hasFilters ? `of ${publications.length} ` : ''}{filtered.length === 1 && !hasFilters ? 'paper' : 'papers'}{topic ? ` in ${topic}` : ''}
        {hasFilters && <button className="site-link" type="button" onClick={clearFilters}>Clear</button>}
      </p>

      <div id="publication-results" className="papers-record">
        {[...groups].map(([year, papers]) => (
          <section className="papers-year" key={year} aria-labelledby={`publication-year-${year}`}>
            <h2 id={`publication-year-${year}`} className="site-row-title papers-year-heading">{year}</h2>
            <ol className="site-list" role="list">
              {papers.map(paper => <li key={paper.id} id={`publication-${paper.id}`}><PublicationEntry paper={paper} /></li>)}
            </ol>
          </section>
        ))}
        {filtered.length === 0 && <section className="papers-empty" aria-labelledby={`${id}-empty`}>
          <h2 id={`${id}-empty`} className="site-title">No papers match.</h2>
          <button className="site-link" type="button" onClick={clearFilters}>Show all papers</button>
        </section>}
      </div>
      {sharedCredit && <p className="site-note papers-footnote">* Equal contribution</p>}
    </main>
  )
}

export default function PublicationsPage() {
  return <SiteFrame page="publications"><PublicationsContent /></SiteFrame>
}
