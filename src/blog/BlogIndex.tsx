import { Link } from 'react-router-dom'
import SiteFrame, { useSiteTheme } from '../site/SiteFrame'
import { essays } from '../site/essays'
import { useBlogMetadata } from './BlogLayout'
import { essayCard, essayType } from './essay/format'
import EssayFigure from './EssayFigure'

function BlogIndexContent() {
  const { href } = useSiteTheme()

  useBlogMetadata({
    title: 'Writing · Zekun Wang',
    description: 'Research essays on continual learning in diffusion models and continual context consolidation in language models.',
    path: '/blog/',
    image: essayCard('diffusion', 'essay'),
    imageAlt: 'Continual Learning Diffusion Models. Generative replay with a rank-1 Fisher trust region.',
  })

  return (
    <main id="blog-main" className="writing-page site-container">
      <header className="site-page-intro">
        <h1>Writing</h1>
      </header>

      <ol className="site-list">
        {essays.map(essay => (
          <li key={essay.id} id={essay.id} data-adapt-key={`essay:${essay.id}`}>
            <Link className="essay-row" to={href(essay.path)}>
              <EssayFigure id={essay.id} />
              <div className="essay-row-copy">
                <h2 className="site-row-title">{essay.title}</h2>
                <p className="essay-row-deck">{essayType(essay.subtitle)}.</p>
              </div>
              <time className="site-row-meta" dateTime={essay.date}>{essay.month}</time>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  )
}

export default function BlogIndex() {
  return <SiteFrame page="blog" mainId="blog-main"><BlogIndexContent /></SiteFrame>
}
