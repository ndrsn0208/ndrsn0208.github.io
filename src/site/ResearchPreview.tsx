import { useEffect, useId, useRef, useState } from 'react'
import { diffusionRobot } from '../blog/diffusion/media'
import { useSiteTheme } from './SiteFrame'
import './research-preview.css'

export interface ResearchPreviewProps {
  kind: 'diffusion' | 'scol'
  layout?: 'feature' | 'compact'
  className?: string
}

type RobotMedia = { src: string, poster: string }

function RobotComparison({ film }: { film: RobotMedia }) {
  const id = `research-film-${useId().replace(/:/g, '')}`
  const stage = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const inView = useRef(true)
  const [playing, setPlaying] = useState(false)
  const [ended, setEnded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const element = video.current
    const container = stage.current
    if (!element || !container) return

    const pause = () => element.pause()
    const onVisibility = () => { if (document.hidden) pause() }
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onPreference = () => { if (preference.matches) pause() }
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      inView.current = entry.isIntersecting && entry.intersectionRatio >= 0.1
      if (!inView.current) pause()
    }, { threshold: [0, 0.1] })

    observer?.observe(container)
    document.addEventListener('visibilitychange', onVisibility)
    preference.addEventListener('change', onPreference)

    return () => {
      pause()
      observer?.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      preference.removeEventListener('change', onPreference)
    }
  }, [])

  function togglePlayback() {
    const element = video.current
    if (!element || document.hidden || !inView.current) return
    if (!element.paused) {
      element.pause()
      return
    }
    if (element.ended) element.currentTime = 0
    setNotice('')
    // Playback starts only from this button. Leaving the viewport never resumes it.
    void element.play().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setNotice('Open the full film if playback is unavailable here.')
    })
  }

  return (
    <>
      <div ref={stage} className="research-preview-robot-stage">
        {failed
          ? <img
              src={film.poster}
              width={diffusionRobot.width}
              height={diffusionRobot.height}
              alt={diffusionRobot.alt}
              className="research-preview-robot"
            />
          : <video
              ref={video}
              id={id}
              src={film.src}
              poster={film.poster}
              width={diffusionRobot.width}
              height={diffusionRobot.height}
              muted
              playsInline
              preload="none"
              aria-label={diffusionRobot.alt}
              className="research-preview-robot"
              onPlay={() => {
                if (document.hidden || !inView.current) {
                  video.current?.pause()
                  return
                }
                setPlaying(true)
                setEnded(false)
              }}
              onPause={() => setPlaying(false)}
              onEnded={() => { setPlaying(false); setEnded(true) }}
              onError={() => { setPlaying(false); setFailed(true) }}
            />}
      </div>
      <figcaption className="research-preview-caption">
        <p>{diffusionRobot.caption}</p>
        <div className="research-preview-controls">
          {!failed && (
            <button type="button" onClick={togglePlayback} aria-controls={id} aria-label={`${playing ? 'Pause' : ended ? 'Replay' : 'Play'} the recorded CW10 robot comparison`}>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                {playing
                  ? <path d="M7 4v12M13 4v12" fill="none" stroke="currentColor" strokeWidth="2" />
                  : <path d="m6 4 9 6-9 6Z" fill="currentColor" />}
              </svg>
              {playing ? 'Pause film' : ended ? 'Replay film' : 'Play film'}
            </button>
          )}
          <a href={film.src} target="_blank" rel="noreferrer" aria-label="Open the full CW10 robot comparison film">
            Full film
          </a>
        </div>
        {(failed || notice) && <p role="status" className="research-preview-status">{failed ? 'The still comparison is shown. Open the full film to watch the recording.' : notice}</p>}
      </figcaption>
    </>
  )
}

function ContextToWeights() {
  const id = `research-context-${useId().replace(/:/g, '')}`

  return (
    <>
      <div className="research-preview-context-stage">
        <svg className="research-preview-context" viewBox="0 0 620 330" role="img" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}>
          <title id={`${id}-title`}>From context to model weights</title>
          <desc id={`${id}-description`}>A conceptual overview of SCoL. Incoming context updates selected layers of a language model. A later question uses the updated model after the original context has left the prompt. The diagram does not represent measured layer selections.</desc>
          <defs>
            <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="m2 1 6 4-6 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          </defs>

          <text x="87" y="57" textAnchor="middle" className="research-preview-diagram-label">Context</text>
          <path d="M32 83h102v84H32Z" className="research-preview-document" />
          <path d="M41 74h102v84" className="research-preview-document-back" />
          <path d="M50 106h65M50 124h65M50 142h43" className="research-preview-document-lines" />
          <path d="M151 124h23q10 0 10 10v13q0 10 10 10h21" markerEnd={`url(#${id}-arrow)`} className="research-preview-update-path" />

          <rect x="222" y="55" width="204" height="230" rx="5" className="research-preview-model" />
          <text x="324" y="91" textAnchor="middle" className="research-preview-diagram-label">Model weights</text>
          <rect x="241" y="119" width="166" height="77" rx="3" className="research-preview-selected" />
          <text x="324" y="150" textAnchor="middle" className="research-preview-selected-label">Selected</text>
          <text x="324" y="179" textAnchor="middle" className="research-preview-selected-label">layers</text>
          <text x="324" y="254" textAnchor="middle" className="research-preview-weights">θ → θ′</text>

          <rect x="19" y="229" width="133" height="52" rx="3" className="research-preview-query" />
          <text x="85" y="263" textAnchor="middle" className="research-preview-diagram-label">Question</text>
          <path d="M159 255h53" markerEnd={`url(#${id}-arrow)`} className="research-preview-answer-path" />
          <path d="M434 255h33" markerEnd={`url(#${id}-arrow)`} className="research-preview-answer-path" />
          <text x="536" y="263" textAnchor="middle" className="research-preview-diagram-label">Answer</text>
        </svg>
      </div>
      <figcaption className="research-preview-caption research-preview-context-caption">
        <p>Context updates selected layers. Later questions use the updated model.</p>
      </figcaption>
    </>
  )
}

/** A standalone figure. The parent owns the story heading and reading links. */
export default function ResearchPreview({ kind, layout = 'feature', className = '' }: ResearchPreviewProps) {
  const { edition } = useSiteTheme()
  const film = edition === 'paper' ? diffusionRobot.paper : diffusionRobot.black

  return (
    <figure className={`research-preview ${className}`.trim()} data-kind={kind} data-layout={layout}>
      {kind === 'diffusion' ? <RobotComparison key={film.src} film={film} /> : <ContextToWeights />}
    </figure>
  )
}
