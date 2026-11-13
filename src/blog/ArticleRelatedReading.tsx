import { Link } from 'react-router-dom'
import { useSiteTheme } from '../site/SiteFrame'
import { essays } from '../site/essays'
import EssayFigure from './EssayFigure'

/** The other essay, listed the way the Writing page lists it. */
export default function ArticleRelatedReading({ current }: { current: 'scol' | 'diffusion' }) {
  const { href } = useSiteTheme()
  const next = essays.find(essay => essay.id !== current)!
  return (
    <section className="article-related" aria-labelledby="article-related-title">
      <div className="article-related-heading">
        <h2 id="article-related-title">Keep reading</h2>
        <Link className="site-text-link" to={href('/blog/')}>All writing</Link>
      </div>
      <Link className="essay-row" to={href(next.path)}>
        <EssayFigure id={next.id} />
        <div className="essay-row-copy">
          <h3 className="site-row-title">{next.title}</h3>
          <p className="essay-row-deck">{next.subtitle}.</p>
        </div>
        <time className="site-row-meta" dateTime={next.date}>{next.month}</time>
      </Link>
    </section>
  )
}
