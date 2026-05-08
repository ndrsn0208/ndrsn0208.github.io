import { motion, useReducedMotion } from 'motion/react'

export default function Blog() {
  return <ComingSoon section="Blog" hint="Notes on research, code, and the occasional tangent." />
}

interface Props {
  section: string
  hint: string
}

export function ComingSoon({ section, hint }: Props) {
  const reduce = useReducedMotion()
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 md:pt-24 pb-32">
      <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-ink-dim mb-6 flex items-center gap-3">
        <span className="h-px w-8" style={{ background: 'linear-gradient(90deg, transparent, #FFA94D)' }} />
        <span>[ {section.toLowerCase()} / pending ]</span>
        <span className="h-1 w-1 rounded-full bg-amber-400 animate-pulse" />
      </div>

      <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[0.95]">
        <span className="metal-text">{section}</span>
        <br />
        <span className="iri-text">coming soon.</span>
      </h1>

      <p className="mt-6 text-[16px] text-ink-dim max-w-md leading-relaxed">{hint}</p>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-10 chrome rounded-2xl p-8 relative overflow-hidden"
      >
        <div
          className="absolute -inset-1 opacity-30 blur-2xl"
          style={{
            background:
              'conic-gradient(from 110deg at 50% 50%, #FF6B6B, #FFA94D, #C4B5FD, #FF6B6B)',
          }}
        />
        <div className="relative flex items-center gap-4">
          <Spinner />
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-dim mb-1">
              status
            </div>
            <div className="font-display text-xl text-ink">Building it out.</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function Spinner() {
  return (
    <div className="relative h-10 w-10">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, #FF6B6B 90deg, #FFA94D 180deg, transparent 360deg)',
          mask: 'radial-gradient(circle 14px, transparent 13px, #000 14px)',
          WebkitMask: 'radial-gradient(circle 14px, transparent 13px, #000 14px)',
          animation: 'spin 2s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
