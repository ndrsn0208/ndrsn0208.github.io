import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import BlogLayout, { useBlogMetadata } from '../BlogLayout'
import ArticleHeader from '../ArticleHeader'
import ArticleOutline from '../ArticleOutline'
import ArticleRelatedReading from '../ArticleRelatedReading'
import ArticleShare from '../ArticleShare'
import ContextJourney from './ContextJourney'
import DeploymentHero from './DeploymentHero'
import MetaLearning from './MetaLearning'
import ResultsFigure from './ResultsFigure'
import FisherAlignment from './FisherAlignment'
import Equation from './Equation'
import { paragraphCitations, paragraphParts, scolArticle } from './article'

const paperUrl = '/papers/self-consolidating-language-models.pdf'
const articleUrl = 'https://ndrsn0208.github.io/blog/self-consolidating-language-models/'
const chapterLinks = [
  { id: 'history', label: 'The context problem' },
  { id: 'memory', label: 'Learning from context' },
  { id: 'consolidation', label: 'Writing into weights' },
  { id: 'forgetting', label: 'What can be forgotten' },
  { id: 'selection', label: 'Choosing the update' },
  { id: 'learning', label: 'Two learning loops' },
  { id: 'results', label: 'Acquisition & retention' },
  { id: 'fisher', label: 'Fisher alignment' },
  { id: 'outlook', label: 'Looking ahead' },
  { id: 'paper', label: 'The paper' },
  { id: 'references', label: 'Further reading' },
]
const sceneForId = {
  history: 'context',
  memory: 'memory',
  consolidation: 'consolidation',
  forgetting: 'forgetting',
  selection: 'selection',
} as const
type SceneId = keyof typeof sceneForId

const firstCitations = new Map<number, string>()
for (const [section, paragraphs] of Object.entries(paragraphCitations)) {
  for (const [index, references] of Object.entries(paragraphs)) {
    for (const reference of references) {
      if (!firstCitations.has(reference)) firstCitations.set(reference, `scol-text-${section}-${index}`)
    }
  }
}

function Paragraphs({ id, paragraphs, offset = 0 }: { id: string, paragraphs: readonly string[], offset?: number }) {
  return <>{paragraphs.map((paragraph, index) => {
    const position = index + offset
    const references = paragraphCitations[id]?.[position] ?? []
    return (
      <p key={`${id}-${position}`} id={`scol-text-${id}-${position}`}>
        {paragraphParts(id, position, paragraph).map((part, partIndex) => part.emphasis
          ? <strong key={partIndex}>{part.text}</strong>
          : part.text)}
        {references.length > 0 && <sup className="scol-citation">
          {references.map((reference, citationIndex) => <span key={reference}>
            {citationIndex > 0 && <span aria-hidden="true">, </span>}
            <a href={`#reference-${reference}`} aria-label={`Reference ${reference}: ${scolArticle.references[reference - 1].title}`} title={scolArticle.references[reference - 1].title}>{reference}</a>
          </span>)}
        </sup>}
      </p>
    )
  })}</>
}

function Paper() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const reduce = useReducedMotion()
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => clearTimeout(timer.current), [])

  async function copyCitation() {
    try {
      const response = await fetch('/papers/self-consolidating-language-models.bib')
      if (!response.ok) return
      await navigator.clipboard.writeText(await response.text())
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2400)
    } catch {
      window.open('/papers/self-consolidating-language-models.bib', '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <section className="scol-paper-section article-paper-library" id="paper" aria-labelledby="scol-paper-title">
      <div className="scol-paper-top article-paper-record">
        <a href={paperUrl} target="_blank" rel="noreferrer" className="scol-paper-cover" aria-label="Open Self-Consolidating Language Models PDF">
          <img src="/blog-assets/scol/paper-cover.png" alt="The first page of Self-Consolidating Language Models in the Folio edition" loading="lazy" width="612" height="792" />
        </a>
        <div>
          <h2 id="scol-paper-title">Self-Consolidating Language Models</h2>
          <p className="scol-paper-authors">Zekun Wang, Anant Gupta, Zihan Dong, and Christopher J. MacLellan</p>
          <p className="scol-paper-note">The full method, experiments, and analysis. Folio edition · 26 pages</p>
          <div className="scol-paper-actions">
            <a className="scol-text-link" href={paperUrl} target="_blank" rel="noreferrer">Read the paper</a>
            <a href={paperUrl} download="self-consolidating-language-models.pdf">Download PDF</a>
            <button type="button" onClick={copyCitation} aria-live="polite">{copied ? 'Citation copied' : 'Copy citation'}</button>
          </div>
          <button className="scol-preview-toggle" type="button" aria-expanded={open} aria-controls="scol-paper-preview" onClick={() => setOpen(!open)}>
            {open ? 'Close preview' : 'Preview here'} <span aria-hidden="true">{open ? '−' : '+'}</span>
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && <motion.div id="scol-paper-preview" className="scol-paper-preview" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduce ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <iframe src={`${paperUrl}#view=FitH`} title="Self-Consolidating Language Models PDF, 26 pages" />
          <p><a href={paperUrl} target="_blank" rel="noreferrer">Open the PDF in a separate tab</a></p>
        </motion.div>}
      </AnimatePresence>
    </section>
  )
}

function ScolContent() {
  const sections = scolArticle.sections
  const byId = (id: string) => sections.find(section => section.id === id)!
  const learning = byId('learning')
  const results = byId('results')
  const fisher = byId('fisher')
  const outlook = byId('outlook')

  useBlogMetadata({
    title: 'Self-Consolidating Language Models · Zekun Wang',
    description: 'Writing context into model weights at test time. An illustrated account of continual context consolidation, sparse updates, and learning to adapt while limiting forgetting.',
    path: '/blog/self-consolidating-language-models/',
    article: true,
  })

  const words = [
    scolArticle.deck, ...scolArticle.introduction, ...scolArticle.closing,
    ...sections.flatMap(section => [...section.paragraphs, ...('afterFigure' in section ? section.afterFigure ?? [] : [])]),
  ].join(' ').split(/\s+/).length

  return (
      <main id="blog-main" className="scol-post article-post">
        <ArticleHeader
          kind="scol"
          title={scolArticle.title}
          subtitle={scolArticle.subtitle}
          summary={scolArticle.deck}
          date="2026-09-25"
          minutes={Math.ceil(words / 210)}
          authors={[
            { name: 'Zekun Wang', equal: true },
            { name: 'Anant Gupta', equal: true },
            { name: 'Zihan Dong' },
            { name: 'Christopher J. MacLellan' },
          ]}
          authorNote="* Equal contribution"
          resources={[{ label: 'Read the paper', href: paperUrl }]}
          url={articleUrl}
        />
        <div className="article-cover site-container">
          <div className="article-cover-media"><DeploymentHero /></div>
        </div>

        <div className="article-reading site-container">
          <ArticleOutline items={chapterLinks} />
          <article className="article-reading-content">
          {scolArticle.introduction.length > 0 && <div className="article-opening scol-prose">{scolArticle.introduction.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>}
          <div className="article-context-sequence">
              {(Object.keys(sceneForId) as SceneId[]).map(id => {
                const section = byId(id)
                return (
                  <section id={id} className="article-section article-context-section" key={id} aria-labelledby={`scol-heading-${id}`} data-scol-scene={sceneForId[id]}>
                    <div className="scol-prose">
                    <h2 id={`scol-heading-${id}`}>{section.title}</h2>
                    <Paragraphs id={id} paragraphs={section.paragraphs} />
                    {id === 'consolidation' && <Equation kind="consolidation" />}
                    {id === 'selection' && <Equation kind="selection" />}
                    </div>
                    <div className="article-context-figure"><ContextJourney scene={sceneForId[id]} /></div>
                    {'afterFigure' in section && <div className="scol-prose article-after-figure">{section.afterFigure?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>}
                  </section>
                )
              })}
          </div>

          <section id="learning" className="scol-learning article-section" aria-labelledby="scol-heading-learning">
            <div className="scol-prose scol-centered">
              <h2 id="scol-heading-learning">{learning.title}</h2>
              <Paragraphs id="learning" paragraphs={learning.paragraphs} />
              <Equation kind="reward" />
            </div>
            <MetaLearning />
            <div className="scol-prose scol-centered scol-after-figure">{'afterFigure' in learning && <Paragraphs id="learning-after" paragraphs={learning.afterFigure} />}</div>
            <div className="scol-reward-notes">
              <div><span className="scol-small-label">When questions are available</span><h3>Check what the model can answer.</h3><p>On SQuAD, acquisition and forgetting are measured with questions about current and earlier passages.</p></div>
              <div><span className="scol-small-label">When context arrives without labels</span><h3>Use the text as a learning signal.</h3><p>For LongBench v2, likelihood changes supply the reward. Downstream question labels are reserved for evaluation.</p></div>
            </div>
          </section>

          <section id="results" className="scol-evidence article-section" aria-labelledby="scol-heading-results">
            <div className="scol-prose scol-centered">
              <h2 id="scol-heading-results">{results.title}</h2>
              <Paragraphs id="results" paragraphs={results.paragraphs.slice(0, 2)} />
            </div>
            <ResultsFigure kind="retention" />
            <div className="scol-prose scol-centered scol-after-figure"><Paragraphs id="results" paragraphs={results.paragraphs.slice(2)} offset={2} /></div>
            <ResultsFigure kind="length" />
            {'afterFigure' in results && <div className="scol-prose scol-centered scol-after-figure">{results.afterFigure?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>}
          </section>

          <section id="fisher" className="scol-fisher-section article-section" aria-labelledby="scol-heading-fisher">
            <div className="scol-prose scol-centered">
              <h2 id="scol-heading-fisher">{fisher.title}</h2>
              <Paragraphs id="fisher" paragraphs={fisher.paragraphs} />
              <Equation kind="fisher" />
            </div>
            <FisherAlignment />
            <div className="scol-prose scol-centered scol-after-figure">
              {'afterFigure' in fisher && <Paragraphs id="fisher-after" paragraphs={fisher.afterFigure} />}
            </div>
          </section>

          <section id="outlook" className="scol-outlook scol-prose scol-centered article-section" aria-labelledby="scol-heading-outlook">
            <h2 id="scol-heading-outlook">{outlook.title}</h2>
            {outlook.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            {scolArticle.closing.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          </section>

          <Paper />

          <div className="scol-share-closing article-closing-share">
            <p>Share this essay</p>
            <ArticleShare title={scolArticle.title} subtitle={scolArticle.subtitle} url={articleUrl} />
          </div>

          <ArticleRelatedReading current="scol" />

          <section className="scol-references article-references" id="references" aria-labelledby="scol-references-title">
            <h2 id="scol-references-title">Further reading</h2>
            <ol>{scolArticle.references.map((reference, index) => <li key={reference.url} id={`reference-${index + 1}`} tabIndex={-1}>
              <a href={reference.url} target="_blank" rel="noreferrer">{reference.title}</a>
              {firstCitations.has(index + 1) && <a className="scol-reference-back" href={`#${firstCitations.get(index + 1)}`} aria-label={`Back to the text citing reference ${index + 1}`}>Back to the text</a>}
            </li>)}</ol>
            <p>Animations explain the method. Illustrative examples are labeled, and experimental values are taken from the accompanying paper.</p>
          </section>
          </article>
        </div>
      </main>
  )
}

export default function ScolPost() {
  return <BlogLayout><ScolContent /></BlogLayout>
}
