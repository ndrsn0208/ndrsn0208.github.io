import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { config } from '@/lib/publications'
import type { Publication } from '@/types'
import { useSiteTheme } from './SiteFrame'
import { publicationBibtex, publicationResources, publicationSummary } from './publication-content'
import './publications.css'

export interface PublicationEntryProps {
  paper: Publication
  /** Listed at the end of its own essay, where a link to that essay would lead nowhere new. */
  inEssay?: boolean
}

const shortLabels: Record<string, string> = { 'arXiv HTML': 'HTML' }

/** One paper. The title opens it. The plus opens its summary, links, and citation in place. */
export function PublicationEntry({ paper, inEssay = false }: PublicationEntryProps) {
  const { href } = useSiteTheme()
  const id = useId()
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [citing, setCiting] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'manual'>('idle')
  const citationField = useRef<HTMLTextAreaElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const resources = publicationResources(paper)
  const summary = publicationSummary(paper)
  const citation = publicationBibtex(paper)
  const award = paper.award?.replace(/^🏆\s*/, '')

  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (citing && copyState === 'manual') {
      citationField.current?.focus({ preventScroll: true })
      citationField.current?.select()
    }
  }, [copyState, citing])

  async function copyCitation() {
    clearTimeout(timer.current)
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(citation)
      setCopyState('copied')
      timer.current = setTimeout(() => setCopyState('idle'), 2600)
    } catch {
      setCopyState('manual')
    }
  }

  return (
    <article className="paper" data-open={open || undefined} data-adapt-key={`paper:${paper.id}`} aria-labelledby={`${id}-title`}>
      <div className="paper-head">
        <div className="paper-main">
          <h3 id={`${id}-title`} className="site-row-title paper-title">
            {resources.primary
              ? <a href={resources.primary} target="_blank" rel="noopener noreferrer">{paper.title}</a>
              : paper.title}
          </h3>
          <p className="paper-authors">
            {paper.authors.map((author, index) => (
              <span key={`${author}-${index}`} className={author === config.name ? 'paper-author paper-author-self' : 'paper-author'}>
                {author}
                {paper.equalContribution?.includes(author) && <sup aria-label="Equal contribution" title="Equal contribution">*</sup>}
                {index < paper.authors.length - 1 && ', '}
              </span>
            ))}
          </p>
        </div>
        <p className="site-row-meta paper-venue">
          {paper.venue}
          {award && <span className="paper-award">{award}</span>}
        </p>
        <button className="paper-toggle" type="button" aria-expanded={open} aria-controls={`${id}-detail`}
          aria-label={`${open ? 'Hide' : 'Show'} summary and links for ${paper.title}`} onClick={() => setOpen(value => !value)}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M9 2.5v13M2.5 9h13" fill="none" stroke="currentColor" strokeWidth="1.25" /></svg>
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && <motion.div className="paper-detail" id={`${id}-detail`} key="detail"
          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          transition={{ duration: reduced ? 0 : .3, ease: [.2, .7, .2, 1] }}>
          <div className="paper-detail-inner">
            {summary && <p className="paper-summary">{summary}</p>}
            <div className="paper-actions" role="group" aria-label={`Links for ${paper.title}`}>
              {resources.artifacts.map(link => (
                <a className="site-link" href={link.href} key={link.href} target="_blank" rel="noopener noreferrer">{shortLabels[link.label] ?? link.label}</a>
              ))}
              {resources.article && !inEssay && <Link className="site-link" to={href(resources.article)}>Essay</Link>}
              <button className="site-link" type="button" aria-expanded={citing} aria-controls={`${id}-citation`} onClick={() => { setCiting(value => !value); setCopyState('idle') }}>BibTeX</button>
            </div>
            {citing && <div className="paper-citation" id={`${id}-citation`}>
              <textarea ref={citationField} className="paper-citation-field" readOnly spellCheck={false}
                aria-label={`BibTeX for ${paper.title}`} aria-describedby={`${id}-copy-status`}
                value={citation} rows={Math.min(14, citation.split('\n').length)} />
              <div className="paper-citation-actions">
                <button className="site-link" type="button" onClick={copyCitation}>{copyState === 'copied' ? 'Copied' : 'Copy'}</button>
                <p className="site-note" role="status" id={`${id}-copy-status`}>
                  {copyState === 'manual' ? 'Select the citation and copy it.' : ''}
                </p>
              </div>
            </div>}
          </div>
        </motion.div>}
      </AnimatePresence>
    </article>
  )
}

export default PublicationEntry
