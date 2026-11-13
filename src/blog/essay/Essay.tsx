import type { ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { getPublication } from '@/lib/publications'
import { PublicationEntry } from '../../site/PublicationEntry'
import BlogLayout, { useBlogMetadata } from '../BlogLayout'
import ArticleOutline from '../ArticleOutline'
import ArticleRelatedReading from '../ArticleRelatedReading'
import ArticleShare from '../ArticleShare'
import MathBlock from './MathBlock'
import { essayCard, essayParts, essayType } from './format'
import type { Essay as EssayData } from './types'
import './essay.css'

/* Every essay is laid out by this one component: what the work is called and
   what it does, the opening figure, a short summary, then sections whose
   headings state what they show. The essay supplies its words and how to draw
   its figures. */

const origin = 'https://ndrsn0208.github.io'
const day = new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/** The figure an address names, by its id or by an earlier address for it. */
export function essayFigure(essay: EssayData, name: string | undefined) {
  if (!name) return undefined
  return Object.keys(essay.exhibits).find(id => id === name || essay.exhibits[id].aliases?.includes(name))
}

function Text({ essay, text }: { essay: EssayData, text: string }) {
  return <>{essayParts(text).map((part, index) => {
    if (part.kind === 'strong') return <strong key={index}>{essayType(part.text)}</strong>
    if (part.kind === 'cite') {
      const at = essay.references.findIndex(reference => reference.id === part.text)
      const reference = essay.references[at]
      return reference && <sup className="essay-cite" key={index}>
        <a href={`#ref-${reference.id}`} aria-label={`Reference ${at + 1}: ${reference.title}`}>{at + 1}</a>
      </sup>
    }
    return essayType(part.text)
  })}</>
}

function EssayContent({ essay, draw, figure }: {
  essay: EssayData
  draw: (id: string, lead: boolean) => ReactNode
  figure?: string
}) {
  const shared = figure ? essay.exhibits[figure] : undefined
  useBlogMetadata({
    title: shared ? `${shared.title} · ${essay.name}` : `${essay.name} · Zekun Wang`,
    description: shared?.description ?? essay.description,
    path: shared && figure ? `${essay.path}figures/${figure}/` : essay.path,
    article: true,
    image: shared && figure ? essayCard(essay.id, figure) : essay.image,
    imageAlt: shared?.description ?? essay.imageAlt,
  })
  const papers = essay.papers.map(getPublication).filter(paper => paper !== undefined)
  const chapters = [
    ...essay.sections.map(section => ({ id: section.id, label: section.label })),
    { id: 'papers', label: papers.length > 1 ? 'The papers' : 'The paper' },
    { id: 'references', label: 'References' },
  ]

  return (
    <main id="blog-main" className="essay" data-essay={essay.id}>
      <header className="essay-header site-container">
        <h1>
          <span className="essay-name">{essay.name}</span>
          <span className="site-hidden">: </span>
          <span className="essay-claim">{essayType(essay.headline)}</span>
        </h1>
        <div className="essay-byline">
          <p className="essay-authors">
            {essay.authors.map((author, index) => (
              <span key={author.name}>
                {index > 0 && index === essay.authors.length - 1 && 'and '}
                {author.name}{author.equal && <sup>*</sup>}{index < essay.authors.length - 1 && essay.authors.length > 2 && ','}
              </span>
            ))}
          </p>
          <p className="essay-meta">
            <span>{essay.affiliation}</span>
            <time dateTime={essay.date}>{day.format(new Date(essay.date))}</time>
            {essay.authorNote && <span>{essay.authorNote}</span>}
          </p>
        </div>
        <div className="essay-actions">
          <nav className="essay-links" aria-label="The work behind this essay">
            {essay.links.map(link => (
              <a className="site-text-link" key={link.href} href={link.href}
                target={link.href.startsWith('#') ? undefined : '_blank'} rel={link.href.startsWith('#') ? undefined : 'noreferrer'}>{link.label}</a>
            ))}
          </nav>
          <ArticleShare title={essay.name} subtitle={essay.headline} url={`${origin}${essay.path}`} />
        </div>
      </header>

      <div className="essay-body site-container">
        <ArticleOutline items={chapters} />
        <article className="essay-flow" data-essay-flow>
          {draw(essay.lead, true)}
          <div className="essay-summary">
            {essay.summary.map((paragraph, index) => <p key={index}><Text essay={essay} text={paragraph} /></p>)}
          </div>

          {essay.sections.map(section => (
            <section className="essay-section" id={section.id} key={section.id} aria-labelledby={`${section.id}-heading`}>
              <h2 id={`${section.id}-heading`}>{essayType(section.heading)}</h2>
              {section.blocks.map((block, index) => {
                if ('p' in block) return <p key={index}><Text essay={essay} text={block.p} /></p>
                if ('math' in block) return <MathBlock key={index} tex={block.math} label={block.label} />
                return <div key={block.exhibit} style={{ display: 'contents' }}>{draw(block.exhibit, false)}</div>
              })}
            </section>
          ))}

          <section className="essay-section essay-papers" id="papers" aria-labelledby="papers-heading">
            <h2 id="papers-heading">{papers.length > 1 ? 'The papers' : 'The paper'}</h2>
            <ol className="site-list">
              {papers.map(paper => <li key={paper.id}><PublicationEntry paper={paper} inEssay /></li>)}
            </ol>
          </section>

          <section className="essay-section essay-references" id="references" aria-labelledby="references-heading">
            <h2 id="references-heading">References</h2>
            <ol>
              {essay.references.map(reference => (
                <li id={`ref-${reference.id}`} key={reference.id}>
                  <a className="site-link" href={reference.url} target="_blank" rel="noreferrer">{reference.title}</a>
                  {reference.detail && <span>{reference.detail}</span>}
                </li>
              ))}
            </ol>
          </section>

          <ArticleRelatedReading current={essay.id} />
        </article>
      </div>
    </main>
  )
}

export default function Essay({ essay, draw }: { essay: EssayData, draw: (id: string, lead: boolean) => ReactNode }) {
  const { figureId } = useParams()
  const figure = essayFigure(essay, figureId)
  if (figureId && !figure) return <Navigate to={essay.path} replace />
  return <BlogLayout initialAnchor={figure && `figure-${figure}`}><EssayContent essay={essay} draw={draw} figure={figure} /></BlogLayout>
}
