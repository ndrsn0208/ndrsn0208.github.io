import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { essayCard, essayParts, essayType } from './format'
import type { Essay, EssayExhibit } from './types'

/* Every figure in an essay sits in this frame and is worked the same way.

     instances      Words above the drawing. The blue point marks the one shown.
     the path       Stations under the drawing. The blue point marks where the
                    argument stands. Play walks it. A station jumps to it.
     the plus       Opens what lies behind the figure, in place.

   The drawing is given the current instance and station and draws itself. */

export type ExhibitView = {
  /** The station the argument stands at. */
  step: number
  /** The instance shown. */
  tab: number
  playing: boolean
  /** The reader prefers no motion. */
  still: boolean
  /** The figure is on screen. */
  seen: boolean
}

const origin = 'https://ndrsn0208.github.io'

export default function Exhibit({ id, spec, essay, lead = false, rest = 0, dwell = 3400, progress, onSeen, children }: {
  id: string
  spec: EssayExhibit
  /** The essay the figure belongs to. */
  essay: Pick<Essay, 'id' | 'path'>
  /** The essay's opening figure plays once when it comes into view. */
  lead?: boolean
  /** The station shown before anything is played. */
  rest?: number
  /** How long each station holds while playing, in milliseconds. */
  dwell?: number | readonly number[]
  /** A recording's position from 0 to 1, when the path follows a recording instead of stations. */
  progress?: { value: number, playing: boolean, toggle: () => void, seek: (value: number) => void }
  /** Told when the figure comes on or off screen. */
  onSeen?: (seen: boolean, still: boolean) => void
  children: (view: ExhibitView) => ReactNode
}) {
  const uid = useId()
  const frame = useRef<HTMLElement>(null)
  const still = useReducedMotion() ?? false
  const steps = spec.steps
  const last = steps ? steps.length - 1 : 0
  // The opening figure starts at its first station, ready to play. With motion reduced it rests like the others.
  const [step, setStep] = useState(lead && !still ? 0 : Math.min(rest, last))
  const [tab, setTab] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [seen, setSeen] = useState(false)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<'idle' | 'copied' | 'manual'>('idle')
  const opened = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  // Read when a station is entered, so a caller's new array does not restart the wait.
  const holds = useRef(dwell)
  holds.current = dwell
  const link = `${origin}${essay.path}figures/${id}/`

  useEffect(() => {
    const element = frame.current
    if (!element) return
    const watcher = new IntersectionObserver(([entry]) => setSeen(entry.isIntersecting && entry.intersectionRatio >= .35), { threshold: [0, .35, .7] })
    watcher.observe(element)
    return () => watcher.disconnect()
  }, [])

  // The opening figure plays through once. Every other figure waits to be asked.
  useEffect(() => {
    if (!lead || !steps || !seen || opened.current || still) return
    opened.current = true
    setStep(0)
    setPlaying(true)
  }, [lead, steps, seen, still])

  useEffect(() => { if (!seen) setPlaying(false) }, [seen])
  useEffect(() => { onSeen?.(seen, still) }, [onSeen, seen, still])

  useEffect(() => {
    if (!playing || !steps) return
    const wait = typeof holds.current === 'number' ? holds.current : holds.current[step] ?? 3400
    const next = setTimeout(() => {
      if (step >= last) setPlaying(false)
      else setStep(step + 1)
    }, wait)
    return () => clearTimeout(next)
  }, [playing, step, steps, last])

  useEffect(() => () => clearTimeout(timer.current), [])

  function play() {
    if (playing) { setPlaying(false); return }
    if (step >= last) setStep(0)
    setPlaying(true)
  }

  function go(index: number) {
    setPlaying(false)
    setStep(Math.max(0, Math.min(last, index)))
  }

  function onStationKey(event: KeyboardEvent<HTMLOListElement>) {
    const move = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!move || !steps) return
    event.preventDefault()
    const next = Math.max(0, Math.min(last, step + move))
    go(next)
    event.currentTarget.querySelectorAll<HTMLButtonElement>('button')[next]?.focus()
  }

  async function copyLink() {
    clearTimeout(timer.current)
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(link)
      setCopied('copied')
      timer.current = setTimeout(() => setCopied('idle'), 2600)
    } catch {
      setCopied('manual')
    }
  }

  return (
    <figure ref={frame} className="exhibit" id={`figure-${id}`} data-wide={spec.wide || undefined} data-lead={lead || undefined}
      data-open={open || undefined} aria-labelledby={`${uid}-title`} aria-describedby={`${uid}-about`}>
      <figcaption className="site-hidden">
        <span id={`${uid}-title`}>{spec.title}</span>
        <span id={`${uid}-about`}>{spec.description}</span>
      </figcaption>

      {spec.tabs && <div className="exhibit-tabs" role="group" aria-label={spec.tabsLabel ?? spec.title}>
        {spec.tabs.map((label, index) => (
          <button type="button" key={label} aria-pressed={tab === index} onClick={() => setTab(index)}>{label}</button>
        ))}
      </div>}

      <div className="exhibit-stage">{children({ step, tab, playing, still, seen })}</div>

      <div className="exhibit-controls">
        {steps && <>
          <button className="exhibit-play" type="button" onClick={play} aria-label={playing ? `Pause ${spec.title}` : `Play ${spec.title}`}>{playing ? 'Pause' : 'Play'}</button>
          <ol className="exhibit-path" aria-label={`Steps of ${spec.title}`} onKeyDown={onStationKey}>
            {steps.map((item, index) => (
              <li key={item.label} data-passed={index < step || undefined}>
                <button type="button" aria-label={item.label} aria-current={index === step ? 'step' : undefined} tabIndex={index === step ? 0 : -1} onClick={() => go(index)}>
                  <span className="exhibit-station" aria-hidden="true">
                    {index === step && <motion.span className="exhibit-point" layoutId={`${uid}-point`} transition={{ duration: still ? 0 : .5, ease: [.2, .7, .2, 1] }} />}
                  </span>
                  <span className="exhibit-station-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </>}
        {progress && <>
          <button className="exhibit-play" type="button" onClick={progress.toggle} aria-label={progress.playing ? `Pause ${spec.title}` : `Play ${spec.title}`}>{progress.playing ? 'Pause' : 'Play'}</button>
          <input className="exhibit-scrub" type="range" min={0} max={1000} step={1} value={Math.round(progress.value * 1000)}
            style={{ '--at': progress.value } as CSSProperties}
            aria-label={`Position in ${spec.title}`} aria-valuetext={`${Math.round(progress.value * 100)} percent`}
            onChange={event => progress.seek(Number(event.target.value) / 1000)} />
        </>}
        {!steps && !progress && <span />}
        <button className="exhibit-more" type="button" aria-expanded={open} aria-controls={`${uid}-details`}
          aria-label={`${open ? 'Hide' : 'Show'} notes and links for ${spec.title}`} onClick={() => setOpen(value => !value)}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M9 2.5v13M2.5 9h13" fill="none" stroke="currentColor" strokeWidth="1.25" /></svg>
        </button>
      </div>

      {steps && <p className="exhibit-say" aria-live="polite">{essayType(steps[step].say)}</p>}

      <AnimatePresence initial={false}>
        {open && <motion.div className="exhibit-details" id={`${uid}-details`} key="details"
          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          transition={{ duration: still ? 0 : .3, ease: [.2, .7, .2, 1] }}>
          <div className="exhibit-details-inner">
            {spec.notes?.map((note, index) => <p key={index}>{essayParts(note).map((part, at) => part.kind === 'strong' ? <strong key={at}>{part.text}</strong> : part.text)}</p>)}
            <div className="exhibit-links" role="group" aria-label={`Links for ${spec.title}`}>
              {spec.sources?.map(source => <a className="site-link" key={source.href} href={source.href} target="_blank" rel="noopener noreferrer">{source.label}</a>)}
              <button className="site-link" type="button" onClick={copyLink}>{copied === 'copied' ? 'Link copied' : 'Copy link'}</button>
              <a className="site-link" href={essayCard(essay.id, id)} download={`${id}.png`}>Image</a>
            </div>
            {copied === 'manual' && <label className="exhibit-link-field">
              <span className="site-hidden">Link to this figure</span>
              <input type="url" readOnly value={link} onFocus={event => event.currentTarget.select()} />
            </label>}
            <span className="site-hidden" role="status">{copied === 'copied' ? 'Figure link copied.' : ''}</span>
          </div>
        </motion.div>}
      </AnimatePresence>
    </figure>
  )
}
