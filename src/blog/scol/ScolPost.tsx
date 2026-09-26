import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from 'motion/react'
import BlogLayout, { ArrowIcon, useBlogMetadata } from '../BlogLayout'
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
  { id: 'history', number: '01', title: 'Context' },
  { id: 'consolidation', number: '02', title: 'Consolidation' },
  { id: 'learning', number: '03', title: 'Learning to update' },
  { id: 'results', number: '04', title: 'Evidence' },
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

function useWideReading() {
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 1024px)').matches)
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)')
    const update = () => setWide(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return wide
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
    <section className="scol-paper-section" id="paper" aria-labelledby="scol-paper-title">
      <div className="scol-paper-top">
        <a href={paperUrl} target="_blank" rel="noreferrer" className="scol-paper-cover" aria-label="Open Self-Consolidating Language Models PDF">
          <img src="/blog-assets/scol/paper-cover.png" alt="The first page of Self-Consolidating Language Models in the Folio edition" loading="lazy" width="612" height="792" />
        </a>
        <div>
          <p className="scol-eyebrow">The paper</p>
          <h2 id="scol-paper-title">Self-Consolidating<br />Language Models</h2>
          <p className="scol-paper-authors">Zekun Wang, Anant Gupta, Zihan Dong,<br />and Christopher J. MacLellan</p>
          <p className="scol-paper-note">The full method, experiments, and analysis.<br />Folio edition · 26 pages</p>
          <div className="scol-paper-actions">
            <a className="scol-text-link" href={paperUrl} target="_blank" rel="noreferrer">Read the paper <ArrowIcon direction="up" /></a>
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
          <p><a href={paperUrl} target="_blank" rel="noreferrer">Open the PDF in a separate tab <ArrowIcon direction="up" /></a></p>
        </motion.div>}
      </AnimatePresence>
    </section>
  )
}

function ScolContent() {
  const reduce = useReducedMotion()
  const wide = useWideReading()
  const mainRef = useRef<HTMLElement>(null)
  const [scene, setScene] = useState<SceneId>('history')
  const [chapter, setChapter] = useState('history')
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 180, damping: 36, restDelta: 0.001 })
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

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const threshold = Math.max(180, window.innerHeight * 0.44)
      let nextScene: SceneId = 'history'
      for (const id of Object.keys(sceneForId) as SceneId[]) {
        if ((document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= threshold) nextScene = id
      }
      setScene(nextScene)
      let nextChapter = chapterLinks[0].id
      for (const link of chapterLinks) {
        if ((document.getElementById(link.id)?.getBoundingClientRect().top ?? Infinity) <= threshold) nextChapter = link.id
      }
      setChapter(nextChapter)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    update()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  const words = [
    scolArticle.deck, ...scolArticle.introduction, ...scolArticle.closing,
    ...sections.flatMap(section => [...section.paragraphs, ...('afterFigure' in section ? section.afterFigure ?? [] : [])]),
  ].join(' ').split(/\s+/).length

  return (
    <>
      <motion.div className="scol-reading-progress" style={{ scaleX: reduce ? scrollYProgress : progress }} aria-hidden="true" />
      <main id="blog-main" className="scol-post" ref={mainRef}>
        <motion.header className="scol-hero scol-width" initial={reduce ? false : { opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <div className="scol-hero-meta"><p className="scol-eyebrow">Continual learning</p><span><time dateTime="2026-09-25">September 25, 2026</time><span aria-hidden="true"> · </span>{Math.ceil(words / 210)} min read</span></div>
          <h1>{scolArticle.title}</h1>
          <p className="scol-subtitle">{scolArticle.subtitle}</p>
          <p className="scol-deck">{scolArticle.deck}</p>
          <div className="scol-author-row">
            <div className="scol-author-info">
              <p className="scol-authors">
                <span className="scol-author-name"><strong>Zekun Wang</strong><sup>*</sup>,</span>{' '}
                <span className="scol-author-name">Anant Gupta<sup>*</sup>,</span>{' '}
                <span className="scol-author-name">Zihan Dong,</span>{' '}
                <span className="scol-author-name">and Christopher J. MacLellan</span>
              </p>
              <p className="scol-affiliation">Georgia Institute of Technology <span>* Equal contribution</span></p>
            </div>
            <div className="scol-hero-actions">
              <a className="scol-text-link" href={paperUrl} target="_blank" rel="noreferrer">Paper <ArrowIcon direction="up" /></a>
              <ArticleShare title={scolArticle.title} subtitle={scolArticle.subtitle} url={articleUrl} />
            </div>
          </div>
        </motion.header>

        <div className="scol-hero-figure scol-width">
          <DeploymentHero />
        </div>

        <nav className="scol-chapters" aria-label="Article chapters">
          <div className="scol-width">
            {chapterLinks.map(link => <a key={link.id} href={`#${link.id}`} aria-current={chapter === link.id ? 'location' : undefined}><span>{link.number}</span>{link.title}</a>)}
            <a href="#paper" className="scol-chapter-paper">Paper <ArrowIcon direction="up" /></a>
          </div>
        </nav>

        <article className="scol-article scol-width">
          {scolArticle.introduction.length > 0 && <div className="scol-opening scol-prose">{scolArticle.introduction.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>}
          <div className="scol-story-grid">
            <div className="scol-story-prose">
              {(Object.keys(sceneForId) as SceneId[]).map((id, index) => {
                const section = byId(id)
                return (
                  <section id={id} className="scol-story-section scol-prose" key={id} aria-labelledby={`scol-heading-${id}`} data-scol-scene={sceneForId[id]}>
                    <div className="scol-section-label"><span>{String(index + 1).padStart(2, '0')}</span><span>{section.eyebrow}</span></div>
                    <h2 id={`scol-heading-${id}`}>{section.title}</h2>
                    <Paragraphs id={id} paragraphs={section.paragraphs} />
                    {id === 'consolidation' && <Equation kind="consolidation" />}
                    {id === 'selection' && <Equation kind="selection" />}
                    {!wide && <div className="scol-mobile-figure"><ContextJourney scene={sceneForId[id]} /></div>}
                    {'afterFigure' in section && section.afterFigure?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                  </section>
                )
              })}
            </div>
            {wide && <aside className="scol-story-visual" aria-label="Illustration accompanying the current section">
              <div className="scol-sticky-figure">
                <div className="scol-figure-overline"><span>A stream, a changing model</span><span>{String(Object.keys(sceneForId).indexOf(scene) + 1).padStart(2, '0')} / 05</span></div>
                <ContextJourney scene={sceneForId[scene]} />
                <div className="scol-scene-navigation" aria-label="Illustration sections">{(Object.keys(sceneForId) as SceneId[]).map((id, index) => <a key={id} href={`#${id}`} aria-label={`Read ${byId(id).title}`} aria-current={id === scene ? 'step' : undefined}><span>{index + 1}</span></a>)}</div>
              </div>
            </aside>}
          </div>

          <section id="learning" className="scol-learning" aria-labelledby="scol-heading-learning">
            <div className="scol-prose scol-centered">
              <div className="scol-section-label"><span>06</span><span>{learning.eyebrow}</span></div>
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

          <section id="results" className="scol-evidence" aria-labelledby="scol-heading-results">
            <div className="scol-prose scol-centered">
              <div className="scol-section-label"><span>07</span><span>{results.eyebrow}</span></div>
              <h2 id="scol-heading-results">{results.title}</h2>
              <Paragraphs id="results" paragraphs={results.paragraphs.slice(0, 2)} />
            </div>
            <ResultsFigure kind="retention" />
            <div className="scol-prose scol-centered scol-after-figure"><Paragraphs id="results" paragraphs={results.paragraphs.slice(2)} offset={2} /></div>
            <ResultsFigure kind="length" />
            {'afterFigure' in results && <div className="scol-prose scol-centered scol-after-figure">{results.afterFigure?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>}
          </section>

          <section id="fisher" className="scol-fisher-section" aria-labelledby="scol-heading-fisher">
            <div className="scol-prose scol-centered">
              <div className="scol-section-label"><span>08</span><span>{fisher.eyebrow}</span></div>
              <h2 id="scol-heading-fisher">{fisher.title}</h2>
              <Paragraphs id="fisher" paragraphs={fisher.paragraphs} />
              <Equation kind="fisher" />
            </div>
            <FisherAlignment />
            <div className="scol-prose scol-centered scol-after-figure">
              {'afterFigure' in fisher && <Paragraphs id="fisher-after" paragraphs={fisher.afterFigure} />}
            </div>
          </section>

          <section id="outlook" className="scol-outlook scol-prose scol-centered" aria-labelledby="scol-heading-outlook">
            <div className="scol-section-label"><span>09</span><span>{outlook.eyebrow}</span></div>
            <h2 id="scol-heading-outlook">{outlook.title}</h2>
            {outlook.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            {scolArticle.closing.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          </section>

          <Paper />

          <div className="scol-share-closing">
            <ArticleShare title={scolArticle.title} subtitle={scolArticle.subtitle} url={articleUrl} />
          </div>

          <section className="scol-references" aria-labelledby="scol-references-title">
            <h2 id="scol-references-title">Further reading</h2>
            <ol>{scolArticle.references.map((reference, index) => <li key={reference.url} id={`reference-${index + 1}`} tabIndex={-1}>
              <a href={reference.url} target="_blank" rel="noreferrer">{reference.title}<ArrowIcon direction="up" /></a>
              {firstCitations.has(index + 1) && <a className="scol-reference-back" href={`#${firstCitations.get(index + 1)}`} aria-label={`Back to the text citing reference ${index + 1}`}>↩</a>}
            </li>)}</ol>
            <p>Animations explain the method. Illustrative examples are labeled, and experimental values are taken from the accompanying paper.</p>
          </section>
        </article>
      </main>
    </>
  )
}

export default function ScolPost() {
  return <BlogLayout><ScolContent /></BlogLayout>
}
