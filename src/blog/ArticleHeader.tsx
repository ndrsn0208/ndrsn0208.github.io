import ArticleShare from './ArticleShare'

type Author = { name: string; equal?: boolean }
type Resource = { label: string; href: string }

export default function ArticleHeader({
  title, subtitle, summary, date, minutes, authors, authorNote, resources, url, kind,
}: {
  title: string
  subtitle: string
  summary?: string
  date: string
  minutes: number
  authors: readonly Author[]
  authorNote?: string
  resources: readonly Resource[]
  url: string
  kind: 'scol' | 'diffusion'
}) {
  const dateLabel = new Intl.DateTimeFormat('en', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(date))

  return (
    <header className="article-header site-container site-page-enter" data-article={kind}>
      <p className="article-header-date"><time dateTime={date}>{dateLabel}</time><span aria-hidden="true">·</span>{minutes} min read</p>
      <h1>{title}</h1>
      <p className="article-standfirst">{subtitle}</p>
      {summary && <p className="article-summary">{summary}</p>}
      <div className="article-byline">
        <p className="article-authors">
          {authors.map((author, index) => (
            <span key={author.name}>
              {index > 0 && index === authors.length - 1 && <span className="article-author-and">and </span>}
              <strong>{author.name}</strong>{author.equal && <sup>*</sup>}{index < authors.length - 1 && ','}
            </span>
          ))}
        </p>
        <div className="article-affiliation">
          <p>Georgia Institute of Technology</p>
          {authorNote && <p>{authorNote}</p>}
        </div>
      </div>
      <div className="article-header-actions">
        <nav className="article-resource-links" aria-label="Accompanying papers">
          {resources.map(resource => <a
            key={resource.href}
            href={resource.href}
            className="site-text-link"
            target={resource.href.startsWith('#') ? undefined : '_blank'}
            rel={resource.href.startsWith('#') ? undefined : 'noreferrer'}
          >{resource.label}</a>)}
        </nav>
        <ArticleShare title={title} subtitle={subtitle} url={url} />
      </div>
    </header>
  )
}
