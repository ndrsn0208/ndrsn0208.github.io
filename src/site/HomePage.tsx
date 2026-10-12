import { Link, Navigate, useLocation } from 'react-router-dom'
import { config, featuredPublications } from '../lib/publications'
import news from '../data/news.json'
import { useBlogMetadata } from '../blog/BlogLayout'
import SiteFrame, { useSiteTheme } from './SiteFrame'
import PublicationEntry from './PublicationEntry'
import ResearchPreview from './ResearchPreview'
import './home.css'

const selected = featuredPublications()
const month = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' })

function HomeContent() {
  const { href } = useSiteTheme()
  useBlogMetadata({
    title: 'Zekun Wang · Research & writing',
    description: 'Continual learning for deployment-time adaptation and generalization. Research, publications, and illustrated essays by Zekun Wang, a Computer Science PhD student at Georgia Tech.',
    path: '/',
    image: 'https://ndrsn0208.github.io/site-card.png',
    imageAlt: 'Zekun Wang. Continual learning for adaptation and generalization.',
  })

  return <main id="site-main" className="home-page site-container site-page-enter">
    <section className="home-introduction" id="introduction" aria-labelledby="home-name">
      <div className="home-identity">
        <h1 id="home-name">Zekun Wang</h1>
        <div className="home-contact">
          <a href={`mailto:${config.contacts.email}`}>{config.contacts.email}</a>
          <span aria-hidden="true">/</span>
          <a href={config.contacts.googleScholar} target="_blank" rel="noreferrer">Google Scholar</a>
        </div>
        <p className="home-question">How can models keep learning<br className="home-question-break" /> after deployment?</p>
        <p className="home-intro-copy">I study <strong>continual learning for adaptation and generalization</strong>. My work asks how foundation models and AI agents can learn from new experience while preserving what they already know.</p>
        <div className="home-intro-links">
          <Link className="site-text-link" to={href('/about')}>More about my research</Link>
          <a className="site-text-link" href="#selected-publications">Selected publications</a>
        </div>
      </div>
      <aside className="home-affiliations" aria-label="Current education and industry experience">
        <div className="home-affiliation">
          <h2>Georgia Tech</h2>
          <p>PhD, Computer Science</p>
          <p className="home-affiliation-date">2024–2029 expected</p>
          <p className="home-advisor">Advised by <a href={config.advisorUrl} target="_blank" rel="noreferrer">{config.advisor}</a></p>
        </div>
        <div className="home-affiliation">
          <h2>Amazon</h2>
          <p>Research Intern</p>
          <p className="home-affiliation-date">Washington · Fall 2026</p>
          <p className="home-affiliation-note">Deployment-time agent adaptation.</p>
        </div>
        <Link to={href('/cv')} className="site-text-link home-cv-link">Curriculum vitae</Link>
      </aside>
    </section>

    <section className="home-news" id="news" aria-labelledby="news-heading">
      <div className="home-section-label"><h2 id="news-heading">News</h2></div>
      <ol className="home-news-list">
        {news.map(item => <li key={item.id}>
          <time dateTime={item.date}>{month.format(new Date(`${item.date}-01T00:00:00Z`))}</time>
          <p>{item.content.map((part, index) => {
            if (!('href' in part) || !part.href) return <span key={index}>{part.text}</span>
            return part.href.startsWith('/')
              ? <Link key={index} to={href(part.href)}>{part.text}</Link>
              : <a key={index} href={part.href} target="_blank" rel="noreferrer">{part.text}</a>
          })}</p>
        </li>)}
      </ol>
    </section>

    <section className="home-stories" id="writing" aria-labelledby="stories-heading">
      <div className="site-section-heading">
        <h2 id="stories-heading">Inside the research</h2>
        <Link to={href('/blog/')} className="site-text-link">Explore the blog</Link>
      </div>
      <article className="home-story home-story-feature">
        <div className="home-story-copy">
          <p className="home-story-meta"><time dateTime="2026-10">October 2026</time></p>
          <h3><Link to={href('/blog/continual-learning-diffusion-models/')}>Continual Learning Diffusion Models</Link></h3>
          <p>After ten tasks, the robot still remembers how to use a hammer.</p>
          <p className="home-story-description">Two connected studies of replay, Fisher geometry, and learning new tasks without losing earlier abilities.</p>
          <Link className="site-text-link" to={href('/blog/continual-learning-diffusion-models/')}>Read the illustrated article</Link>
        </div>
        <ResearchPreview kind="diffusion" layout="feature" />
      </article>
      <article className="home-story home-story-secondary">
        <div className="home-story-copy">
          <p className="home-story-meta"><time dateTime="2026-09">September 2026</time></p>
          <h3><Link to={href('/blog/self-consolidating-language-models/')}>Self-Consolidating Language Models</Link></h3>
          <p>Writing context into model weights at test time.</p>
          <p className="home-story-description">Why carry all the context when a model could learn from it? A closer look at consolidation, forgetting, and learning where to update.</p>
          <Link className="site-text-link" to={href('/blog/self-consolidating-language-models/')}>Read the story</Link>
        </div>
        <ResearchPreview kind="scol" layout="compact" />
      </article>
    </section>

    <section className="home-selected" id="selected-publications" aria-labelledby="selected-heading">
      <span id="publications" className="home-anchor" />
      <span id="work" className="home-anchor" />
      <div className="site-section-heading">
        <h2 id="selected-heading">Selected publications</h2>
        <Link to={href('/publications')} className="site-text-link">All publications</Link>
      </div>
      <div className="home-selected-list">{selected.map(paper => <PublicationEntry key={paper.id} paper={paper} compact />)}</div>
    </section>

    <section className="home-about" id="about" aria-labelledby="home-about-heading">
      <h2 id="home-about-heading">Learning from experience.<br />Looking a little closer.</h2>
      <div className="home-about-copy">
        <p>I’m inspired by how people learn so much from so little, and how familiar ideas become the starting point for something new.</p>
        <p>Outside research, I’m a semi-professional photographer. I also help organize the <a href="https://ttcl-agents.github.io/" target="_blank" rel="noreferrer">TTCL workshop at NeurIPS 2026</a>.</p>
        <Link to={href('/about')} className="site-text-link">About me</Link>
      </div>
    </section>
  </main>
}

export default function HomePage() {
  const { search, hash } = useLocation()
  if (hash === '#cv' || hash === '#resume') return <Navigate to={{ pathname: '/cv', search }} replace />
  if (hash === '#education') return <Navigate to={{ pathname: '/about', search, hash }} replace />
  return <SiteFrame page="home"><HomeContent /></SiteFrame>
}
