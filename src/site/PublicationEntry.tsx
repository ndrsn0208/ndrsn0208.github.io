import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { config } from '@/lib/publications'
import type { Publication } from '@/types'
import { useSiteTheme } from './SiteFrame'
import { publicationBibtex, publicationContribution, publicationResources, publicationSummary } from './publication-content'
import './publications.css'

export interface PublicationEntryProps {
  paper: Publication
  compact?: boolean
}

export function PublicationEntry({ paper, compact = false }: PublicationEntryProps) {
  const { href } = useSiteTheme()
  const id = useId()
  const [detail, setDetail] = useState<'abstract' | 'citation' | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'manual'>('idle')
  const citationField = useRef<HTMLTextAreaElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const resources = publicationResources(paper)
  const contribution = publicationContribution(paper)
  const summary = publicationSummary(paper)
  const citation = publicationBibtex(paper)
  const equalContribution = paper.authors.some(author => paper.equalContribution?.includes(author))

  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (detail === 'citation' && copyState === 'manual') {
      citationField.current?.focus({ preventScroll: true })
      citationField.current?.select()
    }
  }, [copyState, detail])

  function toggleDetail(next: 'abstract' | 'citation') {
    clearTimeout(timer.current)
    setCopyState('idle')
    setDetail(current => current === next ? null : next)
  }

  async function copyCitation() {
    clearTimeout(timer.current)
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(citation)
      setCopyState('copied')
      timer.current = setTimeout(() => setCopyState('idle'), 2600)
    } catch {
      setCopyState('manual')
      citationField.current?.focus({ preventScroll: true })
      citationField.current?.select()
    }
  }

  return (
    <article className={`publication-entry${compact ? ' publication-entry--compact' : ''}`} aria-labelledby={`${id}-title`}>
      <div className="publication-entry-body">
        <h3 id={`${id}-title`} className="publication-entry-title">
          {resources.primary
            ? <a href={resources.primary} target="_blank" rel="noopener noreferrer">{paper.title}</a>
            : paper.title}
        </h3>
        <p className="publication-entry-authors">
          {paper.authors.map((author, index) => (
            <span key={`${author}-${index}`}>
              <span className="publication-entry-author">
                {author === config.name ? <strong>{author}</strong> : author}
                {paper.equalContribution?.includes(author) && <sup aria-label="Equal contribution" title="Equal contribution">*</sup>}
                {index < paper.authors.length - 1 && ','}
              </span>
              {index < paper.authors.length - 1 && ' '}
            </span>
          ))}
          {equalContribution && <span className="publication-entry-credit">* Equal contribution</span>}
        </p>
        {compact && contribution && <p className="publication-entry-contribution">{contribution}</p>}
        <div className="publication-entry-footer">
          <div className="publication-entry-meta">
            <p className="publication-entry-venue">{paper.venue}</p>
            {paper.award && <span className="publication-entry-distinction">{paper.award.replace(/^🏆\s*/, '')}</span>}
          </div>
          <div className="publication-entry-actions" role="group" aria-label={`Links and details for ${paper.title}`}>
            {resources.artifacts.filter(link => !compact || link.label !== 'arXiv HTML').map(link => (
              <a href={link.href} key={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
            ))}
            {resources.article && <Link className="publication-entry-article" to={href(resources.article)}>Read the article</Link>}
            {!compact && <>
              {summary && <button type="button" aria-expanded={detail === 'abstract'} aria-controls={`${id}-abstract`} onClick={() => toggleDetail('abstract')}>
                Abstract
              </button>}
              <button type="button" aria-expanded={detail === 'citation'} aria-controls={`${id}-citation`} onClick={() => toggleDetail('citation')}>
                BibTeX
              </button>
            </>}
          </div>
        </div>
        {!compact && <>
          {summary && <section className="publication-entry-detail" id={`${id}-abstract`} hidden={detail !== 'abstract'} aria-labelledby={`${id}-abstract-title`}>
            <h4 id={`${id}-abstract-title`} className="publication-entry-detail-label">Abstract summary</h4>
            <p className="publication-entry-abstract">{summary}</p>
          </section>}
          <section className="publication-entry-detail" id={`${id}-citation`} hidden={detail !== 'citation'} aria-labelledby={`${id}-citation-title`}>
            <div className="publication-entry-citation-heading">
              <h4 id={`${id}-citation-title`} className="publication-entry-detail-label">BibTeX citation</h4>
              <button type="button" onClick={copyCitation}>{copyState === 'copied' ? 'Copied' : 'Copy BibTeX'}</button>
            </div>
            <p className="publication-entry-copy-status" role="status" id={`${id}-copy-status`}>
              {copyState === 'manual' ? 'Select and copy the citation below.' : copyState === 'copied' ? 'Citation copied.' : ''}
            </p>
            <textarea ref={citationField} id={`${id}-citation-field`} className="publication-entry-citation" readOnly spellCheck={false}
              aria-label={`BibTeX for ${paper.title}`} aria-describedby={`${id}-copy-status`}
              value={citation} rows={Math.min(14, citation.split('\n').length + 1)} />
          </section>
        </>}
      </div>
    </article>
  )
}

export default PublicationEntry
