import { lazy, Suspense, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import ReactMarkdown from 'react-markdown'
import { getPublication } from '@/lib/publications'
import PublicationGradient from '@/components/PublicationGradient'

// Lazy: ArxivRenderer pulls in KaTeX (~400 KB) which is only needed when
// a paper's arxiv HTML is actually viewed.
const ArxivRenderer = lazy(() => import('@/components/ArxivRenderer'))

export default function PublicationDetail() {
  const { id } = useParams<{ id: string }>()
  const pub = id ? getPublication(id) : undefined
  // Track whether the arxiv HTML actually loaded — show the fallback panel if not.
  const [htmlFailed, setHtmlFailed] = useState(false)

  if (!pub) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-32">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-dim mb-4">
          [ 404 ]
        </div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          <span className="metal-text">Paper not found.</span>
        </h1>
        <p className="mt-4 text-ink-dim">
          The id <span className="font-mono text-ink">{id}</span> isn't in the publications list.
        </p>
        <Link
          to="/publications"
          className="btn-chrome inline-block mt-8 rounded-xl px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-ink"
        >
          ← back to publications
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 md:pt-12 pb-24 md:pb-32">
      <Link
        to="/publications"
        className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-dim hover:text-ink transition inline-flex items-center gap-1.5"
      >
        ← all publications
      </Link>

      <div className="mt-6 grid grid-cols-12 gap-6 md:gap-8 items-start">
        <motion.div
          layoutId={`gradient-${pub.id}`}
          className="col-span-12 md:col-span-5 chrome rounded-2xl overflow-hidden p-3"
        >
          <PublicationGradient
            id={pub.id}
            tags={pub.tags}
            gradient={pub.gradient}
            className="aspect-[4/5] rounded-xl"
          >
            <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between foil-meta foil-text">
                <span className="flex items-center gap-2 flex-wrap">
                  <span>{pub.venue.split(' ').slice(0, -1).join(' ') || pub.venue} · {pub.year}</span>
                  {pub.award && (
                    <span className="px-1.5 py-0.5 rounded-sm text-[10px] tracking-[0.14em] bg-white/15">
                      {pub.award}
                    </span>
                  )}
                </span>
                <span>{pub.arxivId ? `arxiv:${pub.arxivId}` : ''}</span>
              </div>
              <h3 className="font-display foil-text font-semibold text-[28px] sm:text-[34px] leading-[1.05] tracking-tightest">
                {pub.title}
              </h3>
            </div>
          </PublicationGradient>
        </motion.div>

        <div className="col-span-12 md:col-span-7">
          <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight tracking-tight">
            {pub.title}
          </h1>
          <div className="mt-4 text-[14px] font-mono text-ink-dim">
            {pub.authors.join(' · ')}
          </div>
          <div className="mt-1 font-mono text-[12px] uppercase tracking-[0.22em] text-ink-dim flex items-center gap-2 flex-wrap">
            <span>{pub.venue}</span>
            {pub.award && (
              <span
                className="px-2 py-0.5 rounded-sm text-[10px] tracking-[0.16em]"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,169,77,.18), rgba(196,181,253,.10))',
                  border: '1px solid rgba(255,169,77,.45)',
                  color: '#FFD7B5',
                }}
              >
                {pub.award}
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {pub.arxivUrl && (
              <a
                href={pub.arxivUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-chrome rounded-xl px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-ink"
              >
                arxiv ↗
              </a>
            )}
            {pub.pdfUrl && (
              <a
                href={pub.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-chrome rounded-xl px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-ink"
              >
                pdf ↗
              </a>
            )}
            {pub.scholarUrl && (
              <a
                href={pub.scholarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-chrome rounded-xl px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-ink"
              >
                scholar ↗
              </a>
            )}
          </div>

          <div className="mt-7 chrome-r rounded-2xl p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-dim mb-2">
              tldr
            </div>
            <p className="text-[16px] text-ink leading-relaxed">{pub.tldr}</p>
          </div>

          <div className="mt-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-dim mb-2">
              summary
            </div>
            <div className="text-[15px] text-ink/85 leading-relaxed">
              <ReactMarkdown>{pub.summary}</ReactMarkdown>
            </div>
          </div>

          <div className="mt-6 flex gap-1.5 flex-wrap">
            {pub.tags.map((t) => (
              <Link
                key={t}
                to={`/publications?tag=${encodeURIComponent(t)}`}
                className="font-mono text-[10px] uppercase tracking-wider text-ink-dim px-2 py-0.5 rounded-sm border border-white/10 hover:text-ink hover:border-white/20 transition"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {pub.arxivHtmlAvailable && pub.arxivId && !htmlFailed ? (
        <Suspense
          fallback={
            <div className="chrome-r rounded-2xl p-6 my-8 font-mono text-[12px] uppercase tracking-[0.2em] text-ink-dim">
              loading paper…
            </div>
          }
        >
          <ArxivRenderer arxivId={pub.arxivId} onUnavailable={() => setHtmlFailed(true)} />
        </Suspense>
      ) : (
        <div className="mt-12 chrome rounded-2xl p-6 md:p-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-dim mb-3">
            full paper
          </div>
          <p className="text-[14px] text-ink-dim leading-relaxed">
            An arxiv HTML render isn't cached for this paper yet. The summary above is the AI-generated
            digest. Open the{' '}
            {pub.pdfUrl ? (
              <a className="text-ink underline underline-offset-4" href={pub.pdfUrl} target="_blank" rel="noopener noreferrer">
                PDF
              </a>
            ) : (
              'PDF'
            )}
            {' '}or{' '}
            {pub.arxivUrl ? (
              <a className="text-ink underline underline-offset-4" href={pub.arxivUrl} target="_blank" rel="noopener noreferrer">
                arxiv abstract
              </a>
            ) : (
              'arxiv abstract'
            )}{' '}
            for the full text.
          </p>
        </div>
      )}
    </div>
  )
}
