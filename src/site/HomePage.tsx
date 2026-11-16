import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { config, featuredPublications } from '../lib/publications'
import news from '../data/news.json'
import { useBlogMetadata } from '../blog/BlogLayout'
import SiteFrame, { useSiteTheme } from './SiteFrame'
import Landscape from './Landscape'
import { directions, type DirectionId } from './scenes'
import { publicationResources } from './publication-content'
import { essays } from './essays'
import './home.css'

const selected = featuredPublications()
const month = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' })

function HomeContent() {
  const { href } = useSiteTheme()
  // The research direction on the drawing. The drawing moves through the directions on its own until the visitor chooses one.
  const [direction, setDirection] = useState<DirectionId>(directions[0].id)
  const [chosen, setChosen] = useState(false)
  // Who this is, what the research is about, and the research interests. Three short paragraphs and no more.
  const bio = <>
    <p className="site-inline">I’m a third-year PhD student in Computer Science at Georgia Tech, advised by <a href={config.advisorUrl} target="_blank" rel="noreferrer">{config.advisor}</a>, and a research intern at Amazon. Prior to that, I received my M.S. from the University of Michigan and my B.S. from Penn State.</p>
    <p>I study continual learning for adaptation and generalization in foundation models.</p>
    <p className="home-interests"><span>Research interests:</span> {config.researchInterests.join(', ')}.</p>
  </>
  useBlogMetadata({
    title: 'Zekun Wang · Research & writing',
    description: 'Continual learning for deployment-time adaptation and generalization. Research, publications, and illustrated essays by Zekun Wang, a Computer Science PhD student at Georgia Tech.',
    path: '/',
    image: 'https://ndrsn0208.github.io/site-card.png',
    imageAlt: 'Zekun Wang. Continual learning for adaptation and generalization.',
  })

  return <main id="site-main" className="home-page">
    <section className="home-hero" id="introduction" aria-labelledby="home-name">
      <Landscape direction={direction} auto={!chosen} onAdvance={setDirection} />
      <div className="site-container home-hero-copy">
        {/* The drawing leaves room for the name and the question only, so the introduction never makes it smaller. */}
        <div className="home-lead" data-landscape-clear>
          <h1 id="home-name" className="home-name">{config.name}</h1>
          <p id="home-question" className="home-question">{config.researchQuestion}</p>
        </div>
        <div className="home-bio" data-place="beside">{bio}</div>
        {/* The research directions. Each is a scene of the drawing, and the point marks the one that is on it. */}
        <div className="home-directions" role="group" aria-label="Research directions">
          {directions.map(item => <button key={item.id} type="button" aria-pressed={item.id === direction} aria-controls="home-landscape"
            onClick={() => { setDirection(item.id); setChosen(true) }}>{item.name}</button>)}
        </div>
      </div>
    </section>

    {/* On a screen too narrow to hold it beside the name, the introduction follows the drawing. */}
    <section className="site-container home-bio" data-place="below" aria-label="Introduction">{bio}</section>

    <section className="site-container site-section" id="news" aria-labelledby="news-heading">
      <div className="site-section-heading">
        <h2 id="news-heading">News</h2>
      </div>
      <ol className="site-list">
        {news.map(item => <li key={item.id} data-adapt-key={`news:${item.id}`}>
          <div className="site-row home-news-row">
            <p className="home-news-text site-inline">{item.content.map((part, index) => {
              if (!('href' in part) || !part.href) return <span key={index}>{part.text}</span>
              return part.href.startsWith('/')
                ? <Link key={index} to={href(part.href)}>{part.text}</Link>
                : <a key={index} href={part.href} target="_blank" rel="noreferrer">{part.text}</a>
            })}</p>
            <time className="site-row-meta" dateTime={item.date}>{month.format(new Date(`${item.date}-01T00:00:00Z`))}</time>
          </div>
        </li>)}
      </ol>
    </section>

    <section className="site-container site-section" id="selected-publications" aria-labelledby="selected-heading">
      <span id="publications" className="home-anchor" />
      <span id="work" className="home-anchor" />
      <div className="site-section-heading">
        <h2 id="selected-heading">Selected papers</h2>
        <Link to={href('/publications')} className="site-text-link">All papers</Link>
      </div>
      <ol className="site-list">
        {selected.map(paper => {
          const target = publicationResources(paper).primary
          return <li key={paper.id} data-adapt-key={`paper:${paper.id}`}>
            <a className="site-row" href={target} target="_blank" rel="noopener noreferrer">
              <span className="site-row-title">{paper.title}</span>
              <span className="site-row-meta">{paper.venue}</span>
            </a>
          </li>
        })}
      </ol>
    </section>

    <section className="site-container site-section" id="writing" aria-labelledby="writing-heading">
      <div className="site-section-heading">
        <h2 id="writing-heading">Writing</h2>
      </div>
      <ol className="site-list">
        {essays.map(essay => <li key={essay.path} data-adapt-key={`essay:${essay.id}`}>
          <Link className="site-row" to={href(essay.path)}>
            <span className="site-row-title">{essay.title}</span>
            <time className="site-row-meta" dateTime={essay.date}>{essay.month}</time>
          </Link>
        </li>)}
      </ol>
    </section>
  </main>
}

export default function HomePage() {
  const { search, hash } = useLocation()
  if (hash === '#cv' || hash === '#resume') return <Navigate to={{ pathname: '/cv', search }} replace />
  if (hash === '#education') return <Navigate to={{ pathname: '/about', search, hash }} replace />
  if (hash === '#about') return <Navigate to={{ pathname: '/about', search }} replace />
  return <SiteFrame page="home" nameAnchor="home-name"><HomeContent /></SiteFrame>
}
