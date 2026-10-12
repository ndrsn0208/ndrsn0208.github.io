import { Link } from 'react-router-dom'
import { useSiteTheme } from '../site/SiteFrame'
import { diffusionRobot } from './diffusion/media'

const stories = {
  scol: {
    title: 'Self-Consolidating Language Models',
    path: '/blog/self-consolidating-language-models/',
    description: 'What if a language model could learn its context into its weights? An illustrated account of sparse updates, consolidation, and learning to remember.',
    image: '/blog-assets/scol/paper-cover.png',
    imageAlt: 'Self-Consolidating Language Models, first page',
  },
  diffusion: {
    title: 'Continual Learning Diffusion Models',
    path: '/blog/continual-learning-diffusion-models/',
    description: 'From image generation to robot policies, a geometric view of learning new tasks while preserving earlier abilities.',
    image: '/blog-assets/diffusion/cw10-hammer-paper-poster.png',
    imageAlt: 'Comparison of the CW10 hammer task before and after learning nine more skills',
  },
} as const

export default function ArticleRelatedReading({ current }: { current: keyof typeof stories }) {
  const { href, edition } = useSiteTheme()
  const next = stories[current === 'scol' ? 'diffusion' : 'scol']
  const image = current === 'scol'
    ? (edition === 'paper' ? diffusionRobot.paper.poster : diffusionRobot.black.poster)
    : next.image
  return (
    <section className="article-related" aria-labelledby="article-related-title">
      <div className="article-related-heading"><h2 id="article-related-title">Keep reading</h2><Link className="site-text-link" to={href('/blog/')}>All writing</Link></div>
      <Link className="article-related-story" to={href(next.path)}>
        <div className="article-related-image"><img src={image} alt={next.imageAlt} width={current === 'scol' ? 1200 : 612} height={current === 'scol' ? 756 : 792} loading="lazy" /></div>
        <div><h3>{next.title}</h3><p>{next.description}</p><span className="site-text-link">Read the essay</span></div>
      </Link>
    </section>
  )
}
