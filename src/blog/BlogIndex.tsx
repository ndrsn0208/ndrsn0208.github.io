import { Link } from 'react-router-dom'
import SiteFrame, { useSiteTheme } from '../site/SiteFrame'
import ResearchPreview from '../site/ResearchPreview'
import { useBlogMetadata } from './BlogLayout'
import { diffusionArticle } from './diffusion/article'
import { diffusionImage, diffusionImageAlt, diffusionPapers, diffusionPath } from './diffusion/format'
import { scolArticle } from './scol/article'
import './blog-index.css'

const scolPath = '/blog/self-consolidating-language-models/'
const scolPaper = '/papers/self-consolidating-language-models.pdf'

function BlogIndexContent() {
  const { href } = useSiteTheme()

  useBlogMetadata({
    title: 'Research notes · Zekun Wang',
    description: 'Illustrated research notes on continual learning, diffusion models, and learning from context.',
    path: '/blog/',
    image: diffusionImage,
    imageAlt: diffusionImageAlt,
  })

  return (
    <main id="blog-main" className="blog-index site-container">
      <header className="blog-index-intro">
        <h1>Research notes</h1>
        <div className="blog-index-intro-copy">
          <p>A closer look at how models learn, adapt, and retain what they know. The questions, the figures, and the papers behind the work.</p>
          <nav aria-label="Articles on this page" className="blog-index-contents">
            <a href="#diffusion">Generation &amp; control</a>
            <a href="#scol">Language &amp; memory</a>
          </nav>
        </div>
      </header>

      <article id="diffusion" className="blog-index-feature" aria-labelledby="diffusion-title">
        <div className="blog-index-feature-story">
          <header className="blog-index-feature-copy">
            <div className="blog-index-meta">
              <time dateTime={diffusionArticle.date}>October 2026</time>
            </div>
            <h2 id="diffusion-title"><Link to={href(diffusionPath)}>{diffusionArticle.title}</Link></h2>
            <p className="blog-index-deck">{diffusionArticle.subtitle}.</p>
            <p className="blog-index-description">A robot returns to an earlier skill after learning nine more. Follow the comparison into Fisher geometry, replay, and the experiments behind two connected papers.</p>
            <Link to={href(diffusionPath)} className="site-text-link blog-index-read">
              Read the illustrated article
            </Link>
          </header>
          <ResearchPreview kind="diffusion" layout="feature" />
        </div>

        <div className="blog-index-paper-strip">
          <ul className="blog-index-papers">
            {diffusionPapers.map(paper => (
              <li key={paper.id}>
                <span className="blog-index-paper-venue">{paper.venue}</span>
                <a href={paper.pdf} target="_blank" rel="noreferrer">
                  <span>{paper.title}</span>
                  <span className="blog-index-paper-format">PDF</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </article>

      <article id="scol" className="blog-index-secondary" aria-labelledby="scol-title">
        <div className="blog-index-secondary-date">
          <time dateTime="2026-09-25">September<br className="blog-index-date-break" /> 2026</time>
        </div>
        <header className="blog-index-secondary-copy">
          <h2 id="scol-title"><Link to={href(scolPath)}>{scolArticle.title}</Link></h2>
          <p className="blog-index-deck">{scolArticle.subtitle}.</p>
          <p className="blog-index-description">What changes when a model learns from the context itself? An illustrated account of consolidation, forgetting, and learning where to update.</p>
          <div className="blog-index-secondary-links">
            <Link to={href(scolPath)} className="site-text-link blog-index-read">Read the story</Link>
            <a href={scolPaper} target="_blank" rel="noreferrer" className="site-text-link" aria-label="Read the Self-Consolidating Language Models paper, PDF">
              Read the paper <span className="blog-index-pdf-label">PDF</span>
            </a>
          </div>
        </header>
        <ResearchPreview kind="scol" layout="compact" />
      </article>

      <aside className="blog-index-record" aria-label="Complete publication record">
        <p>For the full research record, including abstracts and citations.</p>
        <Link to={href('/publications')} className="site-text-link">Browse publications</Link>
      </aside>
    </main>
  )
}

export default function BlogIndex() {
  return <SiteFrame page="blog" mainId="blog-main"><BlogIndexContent /></SiteFrame>
}
