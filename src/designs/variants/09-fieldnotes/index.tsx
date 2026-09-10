import { useRef, useState, type KeyboardEvent } from 'react'
import { Arrow, papers, paperHref, paperSummary, profile, topics, type Publication } from '../../shared'
import './style.css'

type InvestigationId = 'memory' | 'concepts' | 'experience'
type Annotation = { label: string; title: string; text: string; source: string }
type Investigation = {
  id: InvestigationId
  number: string
  label: string
  topic: string
  question: string
  introduction: string
  margin: string
  marginDetail: string
  caption: string
  annotations: Annotation[]
  references: string[]
}

const investigations: Investigation[] = [
  {
    id: 'memory', number: '01', label: 'Memory', topic: 'Continual learning',
    question: 'What should a model hold on to?',
    introduction: 'I study how new knowledge can take root without displacing what a model already knows.',
    margin: 'Growing a memory is also a question of what to preserve.',
    marginDetail: 'A longer context window exposes more evidence. It does not, by itself, make that knowledge last.',
    caption: 'Three approaches to remembering: selective updates, protection, and replay.',
    annotations: [
      { label: 'Select', title: 'Let the model choose what changes.', text: 'SCoL learns to select which of its own layers to update as new context arrives, balancing the incorporation of knowledge with the risk of forgetting.', source: '2605.07076' },
      { label: 'Protect', title: 'Preserve the structure that matters.', text: 'A rank-1 approximation of Fisher information captures important directions in a diffusion model, helping protect earlier knowledge during new learning.', source: '2509.23593' },
      { label: 'Revisit', title: 'Bring earlier knowledge back into view.', text: 'Generative replay revisits prior knowledge. Combined with a Fisher-metric trust region, the learning update connects to implicit meta-learning.', source: '2602.02417' },
    ],
    references: ['2605.07076', '2509.23593', '2602.02417'],
  },
  {
    id: 'concepts', number: '02', label: 'Compositional concepts', topic: 'Compositionality · Concept learning',
    question: 'Can familiar ideas become something new?',
    introduction: 'I look for reusable concepts in learned representations, and ways to put them together.',
    margin: 'Useful parts need not arrive with labels attached.',
    marginDetail: 'My work also studies hierarchies of concepts: representations that connect broad categories with more specific prototypes.',
    caption: 'Concept discovery and composition in a pretrained diffusion model.',
    annotations: [
      { label: 'Discover', title: 'Find concepts inside the model.', text: 'At test time, gradient ascent on a diffusion model’s scores finds density modes across noise levels. These modes provide candidates for useful concepts.', source: '2605.07078' },
      { label: 'Select', title: 'Keep a useful set of prototypes.', text: 'The discovered modes are mapped to clean-space Gaussians. A submodular selection objective chooses prototypes to use for the requested composition.', source: '2605.07078' },
      { label: 'Compose', title: 'Combine concepts through a shared score.', text: 'The selected prototypes form a product-of-experts teacher with an analytic score, allowing generation beyond the combinations the model has seen.', source: '2605.07078' },
    ],
    references: ['2605.07078', '2509.23602', '2505.24601', '2604.14489', '2603.29895', '2510.02539'],
  },
  {
    id: 'experience', number: '03', label: 'Experience', topic: 'Language · Perception · Interaction',
    question: 'How does experience become understanding?',
    introduction: 'I study what a learner gains from its own attempts, a teacher’s demonstrations, and perceptual grounding.',
    margin: 'An attempt is a starting point for learning.',
    marginDetail: 'Alongside interactive learning, I investigate what vision contributes to language and how concepts develop during training.',
    caption: 'The Trial-and-Demonstration learning cycle, from our NAACL 2025 work.',
    annotations: [
      { label: 'Try', title: 'Begin with the learner’s own attempt.', text: 'A language model trained from scratch produces trials. Its own attempts create opportunities to learn through interaction.', source: '2405.13828' },
      { label: 'Demonstrate', title: 'A teacher provides a demonstration.', text: 'A teacher model gives demonstrations in response to the student’s trials, bringing an interactive exchange into language learning.', source: '2405.13828' },
      { label: 'Update', title: 'Let feedback shape the next attempt.', text: 'An age-conditioned reward drives reinforcement learning updates. The student returns to the cycle with what it has learned.', source: '2405.13828' },
    ],
    references: ['2405.13828', '2601.18065', '2505.13281', '2511.15029', '2305.12544', '2205.02829'],
  },
]

function Sprig({ small = false }: { small?: boolean }) {
  return (
    <svg className={`fieldnotes-sprig${small ? ' fieldnotes-sprig-small' : ''}`} viewBox="0 0 46 58" fill="none" aria-hidden="true">
      <path d="M18 52C20 39 22 23 31 6M22 33 10 23M25 23l13-9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M21 36C7 37 4 28 5 18c11 1 17 6 16 18ZM26 25C25 12 32 5 41 3c1 11-4 20-15 22ZM20 44c9-12 18-11 23-9-4 10-12 13-23 9Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.25" />
      <path d="m8 23 11 11M30 20l7-11M25 42l12-5" stroke="currentColor" strokeWidth=".7" />
    </svg>
  )
}

function Marker({ x, y, number, active }: { x: number; y: number; number: number; active: boolean }) {
  return (
    <g className={`fieldnotes-diagram-marker${active ? ' fieldnotes-diagram-marker-active' : ''}`} transform={`translate(${x} ${y})`}>
      <circle r="17" />
      <text textAnchor="middle" dy=".35em">{number}</text>
    </g>
  )
}

function MemoryDiagram({ step }: { step: number }) {
  return (
    <svg className="fieldnotes-diagram" viewBox="0 0 640 350" role="img" aria-labelledby="fieldnotes-memory-figure-title fieldnotes-memory-figure-description">
      <title id="fieldnotes-memory-figure-title">Making room for new knowledge</title>
      <desc id="fieldnotes-memory-figure-description">New context enters from the left. Nested contours represent existing knowledge, with a yellow outer region for selected updates. A return path represents replay. The three annotations describe complementary approaches from separate papers.</desc>
      <defs>
        <marker id="fieldnotes-memory-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="m1 1 7 4-7 4" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </marker>
        <pattern id="fieldnotes-memory-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
          <path d="M0 0v7" stroke="#68775a" strokeWidth=".8" opacity=".3" />
        </pattern>
      </defs>
      <g className="fieldnotes-diagram-guide"><path d="M26 176H614M320 26v296M26 169v14m588-14v14M313 26h14m-14 296h14" /></g>
      <g className={`fieldnotes-diagram-part${step === 0 ? ' fieldnotes-diagram-part-active' : ''}`}>
        <rect className="fieldnotes-diagram-paper" x="46" y="98" width="97" height="113" rx="3" transform="rotate(-9 95 155)" />
        <rect className="fieldnotes-diagram-paper" x="53" y="103" width="97" height="113" rx="3" transform="rotate(-4 101 160)" />
        <rect className="fieldnotes-diagram-paper" x="62" y="109" width="97" height="113" rx="3" />
        <path d="M77 132h37m-37 14h64m-64 14h55m-55 14h64m-64 14h32" className="fieldnotes-diagram-fine" />
        <path d="M174 156c29-23 43-34 82-34" className="fieldnotes-diagram-flow" markerEnd="url(#fieldnotes-memory-arrow)" />
        <path d="m220 108 2-25h28" className="fieldnotes-diagram-leader" />
        <Marker x={218} y={70} number={1} active={step === 0} />
      </g>
      <g className={`fieldnotes-diagram-part${step === 1 ? ' fieldnotes-diagram-part-active' : ''}`}>
        <path d="M321 48C395 38 445 90 439 168c-4 69-49 116-109 113-65-3-104-53-106-119-2-60 38-106 97-114Z" className="fieldnotes-diagram-wash" />
        <path d="M326 59c70-7 105 40 103 105-2 62-42 105-97 106-49 2-95-41-97-104-2-54 30-100 91-107Z" fill="url(#fieldnotes-memory-hatch)" stroke="currentColor" strokeWidth="1" />
        <path d="M326 59c70-7 105 40 103 105-1 35-14 65-38 85l-15-22c18-20 26-39 24-67-3-46-30-72-72-73Z" className="fieldnotes-diagram-butter" />
        <path d="M323 83c52-5 80 31 78 82-3 46-30 80-73 80-45 0-78-33-80-81-2-42 29-76 75-81Z" className="fieldnotes-diagram-contour" />
        <path d="M325 105c34-3 58 20 57 61-2 31-23 57-54 57-32 0-56-26-57-58-2-31 20-57 54-60Z" className="fieldnotes-diagram-contour" />
        <path d="M325 127c23-2 36 16 35 37-1 22-15 37-33 36-20-1-36-16-35-37 1-22 14-34 33-36Z" className="fieldnotes-diagram-core" />
        <path d="m365 113 67-54h48" className="fieldnotes-diagram-leader" />
        <Marker x={497} y={59} number={2} active={step === 1} />
        <path d="M446 144c31 0 40-34 71-34M443 190c32 0 41 36 73 36" className="fieldnotes-diagram-fine" />
        <path d="M522 111c2-19 16-26 33-22-1 18-13 30-33 22Z" className="fieldnotes-diagram-leaf" />
        <path d="m526 108 23-13" className="fieldnotes-diagram-fine" />
        <path d="M521 226c9-17 24-17 39-6-7 16-23 22-39 6Z" className="fieldnotes-diagram-butter" />
        <path d="m527 226 25-3" className="fieldnotes-diagram-fine" />
      </g>
      <g className={`fieldnotes-diagram-part${step === 2 ? ' fieldnotes-diagram-part-active' : ''}`}>
        <path d="M546 246c-32 87-330 100-422 8" className="fieldnotes-diagram-replay" markerEnd="url(#fieldnotes-memory-arrow)" />
        <Marker x={374} y={310} number={3} active={step === 2} />
      </g>
      <g className="fieldnotes-diagram-label">
        <text x="111" y="252" textAnchor="middle">new context</text>
        <text x="329" y="33" textAnchor="middle">existing knowledge</text>
        <text x="549" y="149" textAnchor="middle">retained</text>
        <text x="550" y="266" textAnchor="middle">new</text>
      </g>
    </svg>
  )
}

function ConceptsDiagram({ step }: { step: number }) {
  return (
    <svg className="fieldnotes-diagram" viewBox="0 0 640 350" role="img" aria-labelledby="fieldnotes-concepts-figure-title fieldnotes-concepts-figure-description">
      <title id="fieldnotes-concepts-figure-title">From discovered concepts to a new composition</title>
      <desc id="fieldnotes-concepts-figure-description">Contours on the left represent density modes discovered at different noise levels. Paths lead to selected concept prototypes in the middle. Overlapping contours on the right represent their combination as a product of experts. Shapes are schematic.</desc>
      <defs>
        <marker id="fieldnotes-concepts-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="m1 1 7 4-7 4" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </marker>
        <pattern id="fieldnotes-concepts-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">
          <path d="M0 0v6" stroke="#557455" strokeWidth="1" opacity=".35" />
        </pattern>
      </defs>
      <g className="fieldnotes-diagram-guide"><path d="M26 180h588M214 40v257M398 40v257M26 173v14m588-14v14" /></g>
      <g className={`fieldnotes-diagram-part${step === 0 ? ' fieldnotes-diagram-part-active' : ''}`}>
        <path d="M41 157c-14-60 29-102 74-90 30-25 89 3 77 46 38 46 3 100-41 95-31 40-118 0-110-51Z" className="fieldnotes-diagram-wash" />
        <path d="M54 155c-9-44 25-82 61-69 30-20 67 2 61 35 27 35 5 72-28 71-34 26-100 6-94-37Z" className="fieldnotes-diagram-contour" />
        <path d="M75 131c-4-23 22-37 39-24 15-4 27 9 22 27-8 24-54 25-61-3ZM112 175c-10-17 13-39 32-29 14 7 12 33-6 37-10 3-19 0-26-8Z" className="fieldnotes-diagram-contour" />
        <circle cx="102" cy="129" r="5" className="fieldnotes-diagram-core" />
        <circle cx="136" cy="163" r="5" className="fieldnotes-diagram-core" />
        <circle cx="95" cy="174" r="3" className="fieldnotes-diagram-core" />
        <path d="M112 125c63 0 94-36 144-35M150 164c46 0 67 12 106 12M99 181c72 27 90 78 157 78" className="fieldnotes-diagram-flow" markerEnd="url(#fieldnotes-concepts-arrow)" />
        <Marker x={75} y={47} number={1} active={step === 0} />
        <path d="m77 65 5 17" className="fieldnotes-diagram-leader" />
      </g>
      <g className={`fieldnotes-diagram-part${step === 1 ? ' fieldnotes-diagram-part-active' : ''}`}>
        <ellipse cx="303" cy="89" rx="37" ry="24" transform="rotate(-14 303 89)" className="fieldnotes-diagram-leaf" />
        <path d="m276 95 52-14m-37 11 5-13m8 11 10 8" className="fieldnotes-diagram-fine" />
        <ellipse cx="303" cy="176" rx="37" ry="24" transform="rotate(12 303 176)" className="fieldnotes-diagram-butter" />
        <path d="m275 171 55 11m-38-8 11-11m8 18 4 10" className="fieldnotes-diagram-fine" />
        <ellipse cx="303" cy="260" rx="37" ry="24" transform="rotate(-12 303 260)" className="fieldnotes-diagram-paper" />
        <ellipse cx="303" cy="260" rx="37" ry="24" transform="rotate(-12 303 260)" fill="url(#fieldnotes-concepts-hatch)" />
        <path d="m275 266 54-13" className="fieldnotes-diagram-fine" />
        <path d="M351 89c43 0 42 74 81 75M351 176h80M351 260c43 0 42-70 81-70" className="fieldnotes-diagram-flow" markerEnd="url(#fieldnotes-concepts-arrow)" />
        <Marker x={305} y={34} number={2} active={step === 1} />
      </g>
      <g className={`fieldnotes-diagram-part${step === 2 ? ' fieldnotes-diagram-part-active' : ''}`}>
        <ellipse cx="514" cy="165" rx="50" ry="69" transform="rotate(-28 514 165)" className="fieldnotes-diagram-wash" />
        <ellipse cx="518" cy="184" rx="50" ry="69" transform="rotate(28 518 184)" className="fieldnotes-diagram-butter" />
        <path d="M512 128c29 14 44 47 34 74-6 18-17 29-30 33-26-15-42-49-31-77 7-17 16-27 27-30Z" fill="url(#fieldnotes-concepts-hatch)" stroke="currentColor" strokeWidth="1.2" />
        <path d="M514 147c18 12 24 29 17 48-4 10-9 17-16 22-14-13-21-32-16-48 3-11 8-18 15-22Z" className="fieldnotes-diagram-core" />
        <path d="m540 130 34-50h23" className="fieldnotes-diagram-leader" />
        <Marker x={580} y={62} number={3} active={step === 2} />
      </g>
      <g className="fieldnotes-diagram-label">
        <text x="115" y="303" textAnchor="middle">density modes</text>
        <text x="303" y="315" textAnchor="middle">prototypes</text>
        <text x="517" y="288" textAnchor="middle">composition</text>
      </g>
    </svg>
  )
}

function ExperienceDiagram({ step }: { step: number }) {
  return (
    <svg className="fieldnotes-diagram" viewBox="0 0 640 350" role="img" aria-labelledby="fieldnotes-experience-figure-title fieldnotes-experience-figure-description">
      <title id="fieldnotes-experience-figure-title">Learning through trials and demonstrations</title>
      <desc id="fieldnotes-experience-figure-description">A student language model makes a trial. A teacher responds with a demonstration. An age-conditioned reward guides reinforcement learning updates, returning the student to its next attempt.</desc>
      <defs>
        <marker id="fieldnotes-experience-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="m1 1 7 4-7 4" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </marker>
      </defs>
      <g className="fieldnotes-diagram-guide"><path d="M29 171h582M320 27v296M29 164v14m582-14v14" /><ellipse cx="320" cy="173" rx="228" ry="121" /></g>
      <g className={`fieldnotes-diagram-part${step === 0 ? ' fieldnotes-diagram-part-active' : ''}`}>
        <path d="M169 87c39-3 64 20 64 62s-29 68-65 64c-37-3-60-26-58-64 1-34 24-59 59-62Z" className="fieldnotes-diagram-wash" />
        <path d="M168 102c27-2 48 17 47 48-1 32-20 48-46 47-26-2-42-23-41-48 0-25 17-45 40-47Z" className="fieldnotes-diagram-contour" />
        <path d="M169 122c16-1 25 12 25 28s-12 28-27 26c-13-1-22-13-22-27 1-13 11-27 24-27Z" className="fieldnotes-diagram-core" />
        <path d="M225 112c45-47 111-58 168-22" className="fieldnotes-diagram-flow" markerEnd="url(#fieldnotes-experience-arrow)" />
        <path d="m272 79 5-31h20" className="fieldnotes-diagram-leader" />
        <Marker x={313} y={47} number={1} active={step === 0} />
      </g>
      <g className={`fieldnotes-diagram-part${step === 1 ? ' fieldnotes-diagram-part-active' : ''}`}>
        <path d="M430 86h99v109h-99l-20 16V104Z" className="fieldnotes-diagram-paper" />
        <path d="M440 109h65m-65 16h48m-48 16h65m-65 16h37" className="fieldnotes-diagram-fine" />
        <path d="M440 178h54" className="fieldnotes-diagram-flow" />
        <path d="M489 208c-9 35-49 54-83 58" className="fieldnotes-diagram-flow" markerEnd="url(#fieldnotes-experience-arrow)" />
        <path d="m529 105 37-34" className="fieldnotes-diagram-leader" />
        <Marker x={575} y={59} number={2} active={step === 1} />
      </g>
      <g className={`fieldnotes-diagram-part${step === 2 ? ' fieldnotes-diagram-part-active' : ''}`}>
        <path d="M272 263c6-37 47-57 97-39 4 42-26 64-72 59Z" className="fieldnotes-diagram-butter" />
        <path d="M283 274c26-22 44-32 72-36m-41 18-2-18m18 8 13 14" className="fieldnotes-diagram-fine" />
        <path d="M256 266c-69-4-111-25-113-49" className="fieldnotes-diagram-replay" markerEnd="url(#fieldnotes-experience-arrow)" />
        <path d="m305 286-11 20h-33" className="fieldnotes-diagram-leader" />
        <Marker x={243} y={306} number={3} active={step === 2} />
      </g>
      <g className="fieldnotes-diagram-label">
        <text x="171" y="241" textAnchor="middle">student</text>
        <text x="473" y="68" textAnchor="middle">teacher</text>
        <text x="323" y="183" textAnchor="middle">try, learn, return</text>
        <text x="378" y="321" textAnchor="middle">reward &amp; update</text>
      </g>
    </svg>
  )
}

function PaperReference({ paper, index, context, active = false }: { paper: Publication; index: number; context: 'pinned' | 'bibliography'; active?: boolean }) {
  return (
    <details className={`fieldnotes-reference fieldnotes-reference-${context}${active ? ' fieldnotes-reference-active' : ''}`} id={`fieldnotes-${context}-${paper.id}`}>
      <summary className="fieldnotes-reference-toggle">
        <span className="fieldnotes-reference-number">{String(index + 1).padStart(2, '0')}</span>
        <span className="fieldnotes-reference-heading">
          <span className="fieldnotes-reference-meta">{paper.venue}{active && <span className="fieldnotes-source-mark">Diagram source</span>}</span>
          <span className="fieldnotes-reference-title">{paper.title}</span>
        </span>
        <span className="fieldnotes-expand-icon" aria-hidden="true" />
      </summary>
      <div className="fieldnotes-reference-body">
        <p className="fieldnotes-reference-authors">{paper.authors.join(', ')}</p>
        <p>{paperSummary(paper)}</p>
        <details className="fieldnotes-research-details">
          <summary>Research details</summary>
          <p>{paper.summary}</p>
        </details>
        <div className="fieldnotes-paper-links">
          <a href={paperHref(paper)} target="_blank" rel="noreferrer">Read paper <Arrow /></a>
          {paper.pdfUrl && <a href={paper.pdfUrl} target="_blank" rel="noreferrer">PDF <Arrow /></a>}
        </div>
      </div>
    </details>
  )
}

function InvestigationContent({ investigation, onBibliography }: { investigation: Investigation; onBibliography: () => void }) {
  const [step, setStep] = useState(0)
  const [showAllReferences, setShowAllReferences] = useState(false)
  const annotation = investigation.annotations[step]
  const related = investigation.references.map((id) => papers.find((paper) => paper.arxivId === id)).filter((paper): paper is Publication => Boolean(paper))
  const source = related.find((paper) => paper.arxivId === annotation.source)
  const Diagram = investigation.id === 'memory' ? MemoryDiagram : investigation.id === 'concepts' ? ConceptsDiagram : ExperienceDiagram
  return (
    <div className="fieldnotes-notebook-layout">
      <div className="fieldnotes-investigation-body">
        <header className="fieldnotes-investigation-heading">
          <p className="fieldnotes-eyebrow">{investigation.topic}</p>
          <h2>{investigation.question}</h2>
          <p>{investigation.introduction}</p>
        </header>
        <figure className="fieldnotes-figure">
          <Diagram step={step} />
          <figcaption><span>Fig. {investigation.number}</span> {investigation.caption}</figcaption>
        </figure>
        <div className="fieldnotes-annotation-controls" role="group" aria-label="Explore the diagram annotations">
          {investigation.annotations.map((item, index) => (
            <button key={item.label} type="button" aria-pressed={step === index} aria-controls={`fieldnotes-annotation-${investigation.id}`} onClick={() => setStep(index)}>
              <span>{index + 1}</span>{item.label}
            </button>
          ))}
        </div>
        <div className="fieldnotes-annotation" id={`fieldnotes-annotation-${investigation.id}`} aria-live="polite" aria-atomic="true">
          <span className="fieldnotes-annotation-number" aria-hidden="true">{String(step + 1).padStart(2, '0')}</span>
          <div>
            <h3>{annotation.title}</h3>
            <p>{annotation.text}</p>
            {source && <a className="fieldnotes-source-link" href={paperHref(source)} target="_blank" rel="noreferrer" aria-label={`Read the source: ${source.title}`}>Read the source <Arrow /></a>}
          </div>
        </div>
      </div>
      <aside className="fieldnotes-margin" aria-label="Marginal notes">
        <p className="fieldnotes-eyebrow">Investigation</p>
        <span className="fieldnotes-investigation-number">{investigation.number}</span>
        <div className="fieldnotes-margin-note">
          <span className="fieldnotes-margin-label">In the margin</span>
          <p className="fieldnotes-margin-thought">{investigation.margin}</p>
          <p className="fieldnotes-margin-detail">{investigation.marginDetail}</p>
        </div>
        <Sprig />
        <span className="fieldnotes-schematic-note">Conceptual sketches.<br />Methods in the papers.</span>
      </aside>
      <aside className="fieldnotes-pinned" aria-labelledby={`fieldnotes-pinned-heading-${investigation.id}`}>
        <div className="fieldnotes-pinned-heading">
          <svg className="fieldnotes-clip" viewBox="0 0 20 32" fill="none" aria-hidden="true"><path d="M14 10v13a6 6 0 0 1-12 0V8a8 8 0 0 1 16 0v15a4 4 0 0 1-8 0V7" stroke="currentColor" strokeWidth="1.5" /></svg>
          <h3 id={`fieldnotes-pinned-heading-${investigation.id}`}>Pinned references</h3>
          <span>{String(related.length).padStart(2, '0')}</span>
        </div>
        <p className="fieldnotes-pinned-intro">Open a reference to read more.</p>
        {related.slice(0, showAllReferences ? related.length : 3).map((paper, index) => (
          <PaperReference key={paper.id} paper={paper} index={index} context="pinned" active={paper.arxivId === annotation.source} />
        ))}
        {related.length > 3 && (
          <button className="fieldnotes-more-references" type="button" aria-expanded={showAllReferences} onClick={() => setShowAllReferences((value) => !value)}>
            {showAllReferences ? 'Show fewer references' : `Show ${related.length - 3} more references`} <span aria-hidden="true">{showAllReferences ? '−' : '+'}</span>
          </button>
        )}
        <a className="fieldnotes-bibliography-link" href="#fieldnotes-bibliography" onClick={onBibliography}>Full bibliography <span>{papers.length} <Arrow direction="right" /></span></a>
      </aside>
    </div>
  )
}

export default function Fieldnotes() {
  const [selected, setSelected] = useState(0)
  const [bibliographyOpen, setBibliographyOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('all')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const searchTerms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  const filteredPapers = papers.filter((paper) => {
    const text = [paper.title, paper.authors.join(' '), paper.venue, paper.year, paper.tags.join(' '), paperSummary(paper)].join(' ').toLocaleLowerCase()
    return (topic === 'all' || paper.tags.includes(topic)) && searchTerms.every((term) => text.includes(term))
  })
  const openBibliography = () => setBibliographyOpen(true)
  const navigateTabs = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % investigations.length
    else if (event.key === 'ArrowLeft') next = (index + investigations.length - 1) % investigations.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = investigations.length - 1
    else return
    event.preventDefault()
    setSelected(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="design-surface fieldnotes">
      <a className="fieldnotes-skip-link" href="#fieldnotes-investigations">Skip to investigations</a>
      <div className="fieldnotes-shell">
        <header className="fieldnotes-header">
          <a className="fieldnotes-identity" href="#fieldnotes-about" aria-label="About Zekun Wang">
            <Sprig small />
            <span><strong>{profile.name}</strong><span>Computer science · Georgia Tech</span></span>
          </a>
          <nav className="fieldnotes-nav" aria-label="Profile and research">
            <a href="#fieldnotes-bibliography" onClick={openBibliography}>Bibliography <span className="fieldnotes-nav-count">{papers.length}</span></a>
            <a href={profile.scholar} target="_blank" rel="noreferrer">Google Scholar <Arrow /></a>
            <a className="fieldnotes-cv-link" href={profile.cv} target="_blank" rel="noreferrer">CV <Arrow /></a>
          </nav>
        </header>
        <main>
          <section className="fieldnotes-intro" id="fieldnotes-about" aria-labelledby="fieldnotes-title">
            <div className="fieldnotes-intro-title">
              <p className="fieldnotes-eyebrow"><span className="fieldnotes-label-line" />Fieldnotes on learning systems</p>
              <h1 id="fieldnotes-title">Learning, without<br /><em>starting over.</em></h1>
            </div>
            <div className="fieldnotes-profile">
              <p>I’m Zekun, a computer science PhD student at <strong>Georgia Tech</strong>, advised by <strong>{profile.advisor}</strong>. I study how AI can learn new things without losing what it already knows.</p>
              <a href={`mailto:${profile.email}`}>{profile.email} <Arrow /></a>
            </div>
          </section>
          <section className="fieldnotes-investigations" id="fieldnotes-investigations" aria-label="Research investigations" tabIndex={-1}>
            <div className="fieldnotes-investigations-label"><span>Follow an investigation</span><span>Three connected questions <span aria-hidden="true">↙</span></span></div>
            <div className="fieldnotes-tabs" role="tablist" aria-label="Choose a research investigation">
              {investigations.map((investigation, index) => (
                <button
                  className="fieldnotes-tab"
                  key={investigation.id}
                  id={`fieldnotes-tab-${investigation.id}`}
                  role="tab"
                  type="button"
                  aria-selected={selected === index}
                  aria-controls={`fieldnotes-panel-${investigation.id}`}
                  tabIndex={selected === index ? 0 : -1}
                  ref={(element) => { tabRefs.current[index] = element }}
                  onClick={() => setSelected(index)}
                  onKeyDown={(event) => navigateTabs(event, index)}
                >
                  <span className="fieldnotes-tab-number">{investigation.number}</span><span>{investigation.label}</span><span className="fieldnotes-tab-mark" aria-hidden="true">{selected === index ? '↘' : '+'}</span>
                </button>
              ))}
            </div>
            {investigations.map((investigation, index) => (
              <section className="fieldnotes-panel" key={investigation.id} id={`fieldnotes-panel-${investigation.id}`} role="tabpanel" aria-labelledby={`fieldnotes-tab-${investigation.id}`} hidden={selected !== index} tabIndex={0}>
                {selected === index && <InvestigationContent investigation={investigation} onBibliography={openBibliography} />}
              </section>
            ))}
          </section>
          <section className="fieldnotes-bibliography" id="fieldnotes-bibliography" aria-labelledby="fieldnotes-bibliography-title">
            <div className="fieldnotes-bibliography-heading">
              <div><p className="fieldnotes-eyebrow">Collected work · {papers.length} papers</p><h2 id="fieldnotes-bibliography-title">The bibliography.</h2></div>
              <button className="fieldnotes-bibliography-toggle" type="button" aria-expanded={bibliographyOpen} aria-controls="fieldnotes-bibliography-content" onClick={() => setBibliographyOpen((value) => !value)}>
                {bibliographyOpen ? 'Close bibliography' : `Browse all ${papers.length} papers`}<span aria-hidden="true">{bibliographyOpen ? '−' : '+'}</span>
              </button>
            </div>
            <div id="fieldnotes-bibliography-content" hidden={!bibliographyOpen}>
              <p className="fieldnotes-bibliography-description">{profile.research}</p>
              <div className="fieldnotes-bibliography-filters">
                <label className="fieldnotes-search-label" htmlFor="fieldnotes-search">Find a paper<input id="fieldnotes-search" type="search" placeholder="Title, author, venue, or idea…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
                <label className="fieldnotes-topic-label" htmlFor="fieldnotes-topic">Research area<select id="fieldnotes-topic" value={topic} onChange={(event) => setTopic(event.target.value)}><option value="all">All research areas</option>{topics.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              </div>
              <p className="fieldnotes-result-count" role="status">{filteredPapers.length} of {papers.length} papers</p>
              <div className="fieldnotes-bibliography-list">
                {filteredPapers.map((paper) => <PaperReference key={paper.id} paper={paper} index={papers.indexOf(paper)} context="bibliography" />)}
              </div>
              {!filteredPapers.length && <div className="fieldnotes-empty"><p>No papers match this selection.</p><button type="button" onClick={() => { setQuery(''); setTopic('all') }}>Clear search and filters <Arrow direction="right" /></button></div>}
            </div>
          </section>
        </main>
        <footer className="fieldnotes-footer">
          <div><span>{profile.name}</span><p>{profile.title} · {profile.affiliation}</p></div>
          <a href={`mailto:${profile.email}`}>Let’s exchange ideas <Arrow /></a>
        </footer>
      </div>
    </div>
  )
}
