import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import BlogLayout, { ArrowIcon, useBlogMetadata, useBlogTheme } from './BlogLayout'
import DeploymentHero from './scol/DeploymentHero'

function BlogIndexContent() {
  const edition = useBlogTheme()
  const reduce = useReducedMotion()
  useBlogMetadata({
    title: 'Research notes · Zekun Wang',
    description: 'Research notes on how models learn, adapt, and retain what they know.',
    path: '/blog/',
  })

  return (
    <motion.main id="blog-main" className="scol-index scol-width" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
      <header className="scol-index-heading">
        <p className="scol-eyebrow">Blog</p>
        <h1>Research notes</h1>
        <p>A closer look at how models learn, adapt, and retain what they know.</p>
      </header>
      <article className="scol-index-entry">
        <div className="scol-index-copy">
          <div className="scol-entry-meta"><time dateTime="2026-09-25">September 2026</time><span>Continual learning</span></div>
          <h2><Link to={`/blog/self-consolidating-language-models?edition=${edition}`}>Self-Consolidating<br className="scol-index-break" /> Language Models</Link></h2>
          <p className="scol-index-subtitle">Writing context into model weights at test time.</p>
          <p>What changes when a language model learns from each new piece of context? An illustrated account of consolidation, forgetting, and learning where to update.</p>
          <Link className="scol-text-link" to={`/blog/self-consolidating-language-models?edition=${edition}`}>Read the story <ArrowIcon /></Link>
        </div>
        <div className="scol-index-illustration" aria-label="Context enters a model through sparse updates">
          <DeploymentHero compact />
        </div>
      </article>
    </motion.main>
  )
}

export default function BlogIndex() {
  return <BlogLayout><BlogIndexContent /></BlogLayout>
}
