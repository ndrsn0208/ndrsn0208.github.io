import { papers, topics } from '../shared'

const counts = new Map(topics.map((topic) => [
  topic,
  papers.filter((paper) => paper.tags.includes(topic)).length,
]))

export default function ResearchTopics({ selected, onChange }: {
  selected: string
  onChange: (topic: string) => void
}) {
  return (
    <section className="quiet-research-topics" aria-labelledby="quiet-topics-title">
      <div className="quiet-topics-heading">
        <h3 id="quiet-topics-title">Research topics</h3>
        <button
          type="button" className="quiet-topic-all" aria-pressed={selected === 'all'}
          onClick={() => onChange('all')}
        >All papers <span aria-hidden="true">{papers.length}</span></button>
      </div>
      <div className="quiet-topic-options" role="group" aria-label="Research topics">
        {topics.map((topic) => (
          <button
            key={topic} type="button" className="quiet-topic-option" data-topic={topic}
            aria-pressed={selected === topic}
            onClick={() => onChange(selected === topic ? 'all' : topic)}
          >
            <span>{topic}</span>
            <span className="quiet-topic-count" aria-hidden="true">{counts.get(topic)}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
