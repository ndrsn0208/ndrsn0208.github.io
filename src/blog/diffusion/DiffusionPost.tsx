import { useEffect, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import BlogLayout, { useBlogMetadata } from '../BlogLayout'
import ArticleHeader from '../ArticleHeader'
import ArticleOutline from '../ArticleOutline'
import ArticleRelatedReading from '../ArticleRelatedReading'
import ArticleShare from '../ArticleShare'
import FigureShare from '../FigureShare'
import DiffusionFigureShare from './DiffusionFigureShare'
import DiffusionLead from './DiffusionLead'
import FisherComparison from './FisherComparison'
import GradientStory from './GradientStory'
import TaskSharing from './TaskSharing'
import RecoveryStory from './RecoveryStory'
import MetaLearningConnection from './MetaLearningConnection'
import DiffusionResults from './DiffusionResults'
import DiffusionEquation from './DiffusionEquation'
import { diffusionArticle } from './article'
import { metaLearningConnection } from './meta-learning-connection'
import { diffusionImage, diffusionImageAlt, diffusionPapers, diffusionPath, diffusionTextParts, diffusionUrl } from './format'
import { diffusionFigurePath, getDiffusionFigure, type DiffusionFigure } from './figure-shares'
import './diffusion.css'

const chapters = [
  { id: 'problem', label: 'The problem' },
  { id: 'fisher', label: 'What Fisher preserves' },
  { id: 'rank-one', label: 'One shared direction' },
  { id: 'trust-region', label: 'A region to learn in' },
  { id: 'meta-learning', label: 'Learning to recover' },
  { id: 'results', label: 'Measured results' },
  { id: 'outlook', label: 'Looking ahead' },
  { id: 'papers', label: 'The two papers' },
  { id: 'references', label: 'Further reading' },
] as const

function Paragraphs({ paragraphs, id, citations = [] }: { paragraphs: readonly string[], id: string, citations?: readonly string[] }) {
  return <>{paragraphs.map((paragraph, index) => (
    <p key={`${id}-${index}`} id={`diff-text-${id}-${index}`}>
      {diffusionTextParts(paragraph).map((part, partIndex) => part.emphasis
        ? <strong key={partIndex}>{part.text}</strong>
        : part.text)}
      {index === paragraphs.length - 1 && citations.length > 0 && (
        <sup className="diff-citation">
          {citations.map((referenceId, referenceIndex) => {
            const position = diffusionArticle.references.findIndex(reference => reference.id === referenceId)
            const reference = diffusionArticle.references[position]
            return reference && <span key={referenceId}>
              {referenceIndex > 0 && ', '}
              <a href={`#reference-${referenceId}`} aria-label={`Reference ${position + 1}: ${reference.title}`}>{position + 1}</a>
            </span>
          })}
        </sup>
      )}
    </p>
  ))}</>
}

function PaperLinks() {
  const [openCitation, setOpenCitation] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => clearTimeout(timer.current), [])

  async function copyCitation(paper: typeof diffusionPapers[number]) {
    clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(paper.bibtex)
      setCopied(paper.id)
      timer.current = setTimeout(() => setCopied(null), 2600)
    } catch {
      setOpenCitation(paper.id)
    }
  }

  return (
    <section className="diff-papers article-paper-library" id="papers" aria-labelledby="diff-papers-title">
      <h2 id="diff-papers-title">Read the full work</h2>
      <p className="diff-papers-intro">The derivations, experimental protocols, and complete results are in the papers.</p>
      {diffusionPapers.map(paper => (
        <article className="diff-paper article-paper-record" key={paper.id} id={paper.id}>
          <a className="diff-paper-cover" href={paper.pdf} target="_blank" rel="noreferrer" aria-label={`Read ${paper.title}`}>
            <img src={paper.cover} alt={`First page of ${paper.title}`} width="850" height="1100" loading="lazy" />
          </a>
          <div>
            <p className="diff-paper-venue">{paper.venue}</p>
            <h3><a href={paper.pdf} target="_blank" rel="noreferrer">{paper.title}</a></h3>
            <p className="diff-paper-authors">{paper.authors}</p>
            <p className="diff-paper-description">{paper.description}</p>
            <div className="diff-paper-actions">
              <a href={paper.pdf} target="_blank" rel="noreferrer">Read PDF</a>
              <a href={paper.url} target="_blank" rel="noreferrer">arXiv</a>
              <button type="button" onClick={() => copyCitation(paper)}>{copied === paper.id ? 'Citation copied' : 'Copy citation'}</button>
              <button type="button" aria-expanded={openCitation === paper.id} aria-controls={`citation-${paper.id}`} onClick={() => setOpenCitation(openCitation === paper.id ? null : paper.id)}>BibTeX</button>
            </div>
            {openCitation === paper.id && <pre tabIndex={0} className="diff-bibtex" id={`citation-${paper.id}`} aria-label={`BibTeX for ${paper.title}`}>{paper.bibtex}</pre>}
          </div>
        </article>
      ))}
      <span className="sr-only" role="status">{copied ? 'Paper citation copied to clipboard.' : ''}</span>
    </section>
  )
}

function DiffusionContent({ sharedFigure }: { sharedFigure?: DiffusionFigure }) {
  const sections = diffusionArticle.sections
  const words = [
    ...diffusionArticle.introduction,
    ...sections.flatMap(section => [
      ...section.paragraphs,
      ...('recoveryIntro' in section ? section.recoveryIntro ?? [] : []),
      ...('afterFigure' in section ? section.afterFigure ?? [] : []),
    ]),
    metaLearningConnection.introduction,
    ...metaLearningConnection.steps.map(step => step.text),
    metaLearningConnection.conclusion,
  ].join(' ').split(/\s+/).length

  useBlogMetadata({
    title: sharedFigure ? `${sharedFigure.title} · ${diffusionArticle.title}` : `${diffusionArticle.title} · Zekun Wang`,
    description: sharedFigure?.description ?? diffusionArticle.description,
    path: sharedFigure ? diffusionFigurePath(sharedFigure.id) : diffusionPath,
    article: true,
    image: sharedFigure?.image ?? diffusionImage,
    imageAlt: sharedFigure?.imageAlt ?? diffusionImageAlt,
  })

  return (
      <main id="blog-main" className="diff-post article-post">
        <ArticleHeader
          kind="diffusion"
          title={diffusionArticle.title}
          subtitle={diffusionArticle.subtitle}
          date={diffusionArticle.date}
          minutes={Math.ceil(words / 210)}
          authors={[{ name: diffusionArticle.author }]}
          resources={[{ label: 'Read the two papers', href: '#papers' }]}
          url={diffusionUrl}
        />
        <div id="diffusion-demonstration" className="article-cover article-cover-diffusion site-container">
          <div className="article-cover-media">
            <DiffusionLead />
            <FigureShare title={diffusionArticle.title} url={diffusionUrl} image={diffusionImage} article />
          </div>
        </div>

        <div className="article-reading site-container">
          <ArticleOutline items={chapters} />
          <article className="article-reading-content diff-body">
          <div className="article-opening diff-introduction scol-prose">
            <Paragraphs id="introduction" paragraphs={diffusionArticle.introduction} />
          </div>
          {sections.map(section => (
            <section id={section.id} className={`diff-section diff-section-${section.id} article-section`} key={section.id} aria-labelledby={`diff-heading-${section.id}`}>
              <div className="scol-prose">
                <h2 id={`diff-heading-${section.id}`}>{section.title}</h2>
                <Paragraphs id={section.id} paragraphs={section.paragraphs} citations={section.citations} />
              </div>
              {section.id === 'problem' && <DiffusionEquation kind="denoising" />}
              {section.id === 'fisher' && <>
                <DiffusionEquation kind="fisher" />
                <div id="fisher-explorer" className="diff-interactive diff-interactive-wide">
                  <FisherComparison />
                  <DiffusionFigureShare id="fisher-comparison" />
                </div>
              </>}
              {section.id === 'rank-one' && <div id="gradient-explorer" className="diff-interactive diff-interactive-wide">
                <GradientStory />
                <DiffusionFigureShare id="fisher-construction" />
              </div>}
              {section.id === 'trust-region' && <div id="trust-region-explorer" className="diff-interactive diff-interactive-wide">
                <TaskSharing />
                <DiffusionFigureShare id="parameter-sharing" />
              </div>}
              {section.id === 'meta-learning' && <>
                <div id="meta-learning-derivation" className="diff-interactive diff-interactive-wide">
                  <MetaLearningConnection />
                  <DiffusionFigureShare id="meta-learning" />
                </div>
                {'recoveryIntro' in section && section.recoveryIntro && (
                  <div className="scol-prose diff-after-figure">
                    <Paragraphs id="meta-learning-evidence" paragraphs={section.recoveryIntro} citations={['meta-alignment', 'recovery-curves']} />
                  </div>
                )}
                <div id="meta-learning-explorer" className="diff-interactive diff-interactive-wide">
                  <RecoveryStory />
                  <DiffusionFigureShare id="recovery" />
                </div>
              </>}
              {section.id === 'results' && <div id="diffusion-results" className="diff-interactive diff-interactive-wide">
                <DiffusionResults />
                <DiffusionFigureShare id="measured-results" />
              </div>}
              {'afterFigure' in section && section.afterFigure && <div className="scol-prose diff-after-figure"><Paragraphs id={`${section.id}-after`} paragraphs={section.afterFigure} /></div>}
              {'technicalNote' in section && typeof section.technicalNote === 'string' && (
                <details className="diff-technical-note">
                  <summary>{section.id === 'rank-one' ? 'The conditions behind the approximation' : 'The assumptions behind this connection'}</summary>
                  <p>{section.technicalNote}</p>
                </details>
              )}
            </section>
          ))}
          <PaperLinks />
          <div className="diff-closing-share article-closing-share">
            <p>Share this essay</p>
            <ArticleShare title={diffusionArticle.title} subtitle={diffusionArticle.subtitle} url={diffusionUrl} />
          </div>
          <ArticleRelatedReading current="diffusion" />
          <section className="diff-references article-references" id="references" aria-labelledby="diff-references-title">
            <h2 id="diff-references-title">Further reading</h2>
            <ol>
              {diffusionArticle.references.map(reference => (
                <li id={`reference-${reference.id}`} key={reference.id}>
                  <a href={reference.url} target="_blank" rel="noreferrer">{reference.title}</a>
                  <p>{reference.detail}</p>
                  <a className="diff-reference-back" href={`#diff-text-${sections.find(section => section.citations.includes(reference.id))?.id ?? 'problem'}-${(sections.find(section => section.citations.includes(reference.id))?.paragraphs.length ?? 1) - 1}`} aria-label={`Back to the text citing ${reference.title}`}>Back to the text</a>
                </li>
              ))}
            </ol>
          </section>
          </article>
        </div>
      </main>
  )
}

export default function DiffusionPost() {
  const { figureId } = useParams()
  const figure = getDiffusionFigure(figureId)
  if (figureId && !figure) return <Navigate to={diffusionPath} replace />
  return <BlogLayout initialAnchor={figure?.anchor}><DiffusionContent sharedFigure={figure} /></BlogLayout>
}
