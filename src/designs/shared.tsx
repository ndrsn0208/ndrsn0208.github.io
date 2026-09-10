import { useEffect, useRef, useState } from 'react'
import config from '../data/config.json'
import publicationData from '../data/publications.json'
import type { Publication } from '../types'

export type { Publication } from '../types'

export const profile = {
  ...config,
  shortAffiliation: 'Georgia Tech',
  email: config.contacts.email,
  scholar: config.contacts.googleScholar,
  linkedin: config.contacts.linkedin,
  github: 'https://github.com/ndrsn0208',
  cv: '/cv.pdf',
  intro:
    "I'm Zekun, a computer science PhD student at Georgia Tech, advised by Christopher MacLellan. I study how AI can learn new things without losing what it already knows.",
  research:
    'My work connects continual learning, compositionality, and concept learning across language models, diffusion models, and robotic policies.',
  question: 'How can a learning system keep growing without starting over?',
}

export const papers: Publication[] = [...publicationData.publications].sort(
  (a, b) => b.year - a.year || b.addedAt.localeCompare(a.addedAt),
)

export const topics = config.researchInterests

export const featuredPapers: Publication[] = config.featuredPaperIds
  .map((id) => papers.find((paper) => paper.arxivId === id))
  .filter((paper): paper is Publication => Boolean(paper))

export const researchThreads = [
  {
    id: 'remember',
    title: 'Learning without forgetting',
    question: 'What should a model hold on to?',
    description:
      'Making room for new knowledge while preserving the skills and structure a model has already learned.',
    tags: ['continual learning', 'diffusion models'],
  },
  {
    id: 'compose',
    title: 'Putting ideas together',
    question: 'Can familiar concepts become something new?',
    description:
      'Finding reusable concepts and studying how they combine, from generative models to hierarchical representations.',
    tags: ['compositionality', 'concept learning'],
  },
  {
    id: 'ground',
    title: 'Learning from experience',
    question: 'How does experience become understanding?',
    description:
      'Connecting language, perception, and interaction to study how useful knowledge takes shape.',
    tags: ['language models', 'reinforcement learning', 'concept learning'],
  },
] as const

const plainSummaries: Record<string, string> = {
  '2605.07078':
    'A diffusion model can discover useful concepts at test time, then combine them to generate beyond the combinations it has seen.',
  '2605.07076':
    'What if a language model could decide how to remember? SCoL learns which parts of itself to update as new context arrives.',
  '2505.13281':
    'Do vision models see geometry the way we do? This study compares their sensitivity to 43 geometric and topological concepts with human judgments.',
  '2511.15029':
    'Following a vision model through training reveals where its developing sense of shape and number resembles that of children.',
  '2601.18065':
    'Grounding language in vision changes how models represent concrete ideas. We compare matched language and vision-language models to study how.',
  '2602.02417':
    'Learning new tasks need not mean starting over. This work connects generative replay and trust-region updates to implicit meta-learning.',
  '2604.14489':
    'Topics rarely arrive all at once. CobwebTM grows a hierarchy of concepts as documents stream in, without fixing the number of topics in advance.',
  '2509.23593':
    'A compact approximation of the Fisher information helps diffusion models protect earlier knowledge while learning something new.',
  '2603.29895':
    'An information-theoretic account of categorization connects hierarchical concept learning with classic experiments on human judgment.',
  '2405.13828':
    'A language model learns through a cycle of trying, receiving demonstrations, and trying again—bringing interaction into learning from scratch.',
  '2510.02539':
    'Organizing meaning into a concept tree gives retrieval a structure to search through, from broad ideas to specific documents.',
  '2505.24601':
    'Taxonomic networks give neural and symbolic learners a shared language, making it possible to translate between their representations.',
  '2509.23602':
    'Discovering concepts at several levels of abstraction lets a model learn a hierarchy of prototypes from unlabeled images.',
  '2305.12544':
    'Language models leave many important questions open. This collaborative paper maps research directions that academic labs can pursue.',
  '2205.02829':
    'Studying short-answer responses at scale offers a way to help instructors give more useful formative feedback.',
}

export function paperSummary(paper: Publication): string {
  return plainSummaries[paper.arxivId ?? ''] ?? paper.tldr ?? paper.summary
}

export function papersForTopic(topic: string): Publication[] {
  return topic === 'all' ? papers : papers.filter((paper) => paper.tags.includes(topic))
}

export function paperHref(paper: Publication): string {
  return paper.arxivUrl ?? paper.pdfUrl ?? profile.scholar
}

export function formatAuthors(paper: Publication, limit = 5): string {
  return paper.authors.length > limit
    ? `${paper.authors.slice(0, limit).join(', ')}, et al.`
    : paper.authors.join(', ')
}

export function citationFor(paper: Publication): string {
  return `${paper.authors.join(', ')}. (${paper.year}). ${paper.title}. ${paper.venue}. ${paperHref(paper)}`
}

export function Arrow({ direction = 'up', className = '' }: { direction?: 'up' | 'right'; className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {direction === 'up' ? (
        <path d="M6 18 18 6M6 6h12v12" stroke="currentColor" strokeWidth="1.5" />
      ) : (
        <path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" />
      )}
    </svg>
  )
}

export function PaperLinks({ paper, className = '' }: { paper: Publication; className?: string }) {
  return (
    <div className={className}>
      <a href={paperHref(paper)} target="_blank" rel="noreferrer">Read paper <Arrow /></a>
      {paper.pdfUrl && <a href={paper.pdfUrl} target="_blank" rel="noreferrer">PDF <Arrow /></a>}
    </div>
  )
}

export function CitationButton({ paper, className = '' }: { paper: Publication; className?: string }) {
  const [status, setStatus] = useState('')
  const [showCitation, setShowCitation] = useState(false)
  useEffect(() => { setStatus(''); setShowCitation(false) }, [paper.id])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(citationFor(paper))
      setStatus('Citation copied')
    } catch {
      setShowCitation(true)
      setStatus('Select the citation below to copy')
    }
  }
  return (
    <div className={className}>
      <button type="button" onClick={copy}>Copy citation</button>
      <span className="ds-copy-status" role="status">{status}</span>
      {showCitation && <p className="ds-citation-text">{citationFor(paper)}</p>}
    </div>
  )
}

export function PaperDialog({
  paper,
  onClose,
  className = '',
}: {
  paper: Publication | null
  onClose: () => void
  className?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (paper && dialog && !dialog.open) dialog.showModal()
    if (!paper && dialog?.open) dialog.close()
    return () => { if (dialog?.open) dialog.close() }
  }, [paper])
  return (
    <dialog
      ref={ref}
      className={`ds-paper-dialog ${className}`}
      aria-labelledby="ds-paper-dialog-title"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      {paper && (
        <article className="ds-paper-dialog-inner">
          <div className="ds-paper-dialog-top">
            <span>{paper.venue}</span>
            <button type="button" onClick={onClose} aria-label="Close paper details" autoFocus>Close <span aria-hidden="true">×</span></button>
          </div>
          <h2 id="ds-paper-dialog-title">{paper.title}</h2>
          <p className="ds-paper-authors">{paper.authors.join(', ')}</p>
          <p className="ds-paper-intro">{paperSummary(paper)}</p>
          <details className="ds-paper-abstract">
            <summary>Read the research summary</summary>
            <p>{paper.summary}</p>
          </details>
          <div className="ds-paper-tags">{paper.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          <PaperLinks paper={paper} className="ds-paper-links" />
          <CitationButton paper={paper} className="ds-paper-citation" />
        </article>
      )}
    </dialog>
  )
}
