import { Arrow, featuredPapers, paperHref, profile } from '../shared'

export default function HomeSelectedPublications({ onAllPublications }: { onAllPublications: () => void }) {
  return (
    <section className="quiet-selected" aria-labelledby="quiet-selected-title">
      <div className="quiet-selected-heading">
        <h2 id="quiet-selected-title">Selected Publications</h2>
        <a href="#publications" onClick={(event) => {
          event.preventDefault()
          onAllPublications()
        }}>
          All publications <Arrow direction="right" />
        </a>
      </div>
      <ol className="quiet-selected-list">
        {featuredPapers.map((paper) => (
          <li key={paper.id}>
            <p className="quiet-selected-venue">{paper.venue}</p>
            <article aria-labelledby={`quiet-selected-${paper.id}`}>
              <h3 id={`quiet-selected-${paper.id}`}>
                <a href={paperHref(paper)} target="_blank" rel="noreferrer">{paper.title}</a>
              </h3>
              <p className="quiet-selected-authors">
                {paper.authors.map((author, index) => (
                  <span key={`${author}-${index}`}>
                    {index > 0 && ', '}
                    {author === profile.name ? <strong>{author}</strong> : author}
                    {paper.equalContribution?.includes(author) && <sup aria-label="equal contribution">*</sup>}
                  </span>
                ))}
              </p>
              <div className="quiet-selected-links">
                <a href={paper.pdfUrl ?? paperHref(paper)} target="_blank" rel="noreferrer">Paper <Arrow /></a>
                {paper.arxivId === '2605.07076' && (
                  <a href="/blog/self-consolidating-language-models/">Read the blog <Arrow direction="right" /></a>
                )}
              </div>
            </article>
          </li>
        ))}
      </ol>
      <p className="quiet-selected-note">* Equal contribution.</p>
    </section>
  )
}
