import { useEffect, useId, useRef, useState } from 'react'
import { useBlogTheme } from '../BlogLayout'
import { diffusionRobot } from './media'
import { useDiffusionReducedMotion } from './useMotionPreference'
import './diffusion-lead.css'

export default function RobotFilm({ compact = false }: { compact?: boolean }) {
  const video = useRef<HTMLVideoElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const videoId = useId()
  const theme = useBlogTheme()
  const film = theme === 'paper' ? diffusionRobot.paper : diffusionRobot
  const reduce = useDiffusionReducedMotion()
  const [intent, setIntent] = useState<'auto' | 'play' | 'pause'>('auto')
  const [visible, setVisible] = useState(false)
  const [documentVisible, setDocumentVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  const [playing, setPlaying] = useState(false)
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const failed = failedSource === film.src

  useEffect(() => {
    const element = stage.current
    if (!element) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const update = () => setDocumentVisible(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  useEffect(() => { setIntent('auto') }, [reduce])

  useEffect(() => {
    const element = video.current
    if (!element) return
    if (visible && documentVisible && (intent === 'play' || (intent === 'auto' && !reduce))) {
      void element.play().catch(() => { /* The Play button remains available if autoplay is blocked. */ })
    } else {
      element.pause()
    }
  }, [visible, documentVisible, intent, reduce, film.src, failed])

  function play(restart = false) {
    const element = video.current
    if (!element) return
    if (restart) element.currentTime = 0
    setIntent('play')
    void element.play().catch(() => { /* A media failure is handled by onError. */ })
  }

  function toggle() {
    if (!video.current?.paused) {
      setIntent('pause')
      video.current?.pause()
    } else {
      play()
    }
  }

  return (
    <div className="diff-robot-film" data-compact={compact} ref={stage}>
      <div className="diff-film-controls" role="group" aria-label="Robot comparison playback">
        {!failed && <>
          <button type="button" className="diff-film-toggle" onClick={toggle} aria-controls={videoId}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              {playing ? <path d="M6 4v12M14 4v12" fill="none" stroke="currentColor" strokeWidth="2" /> : <path d="m6 3 10 7-10 7Z" fill="currentColor" />}
            </svg>
            {playing ? 'Pause animation' : 'Play animation'}
          </button>
          {!compact && <button type="button" className="diff-film-restart" onClick={() => play(true)} aria-label="Restart animation" aria-controls={videoId}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 7a6.5 6.5 0 1 1-.5 5M4 3v4h4" />
            </svg>
            <span>Restart</span>
          </button>}
        </>}
        {(!compact || failed) && <a href={failed ? film.gif : film.src} target="_blank" rel="noreferrer">Full size <span aria-hidden="true">↗</span></a>}
        {failed && <span className="diff-film-status">The still frame is shown. Open the full-size animation to play it.</span>}
      </div>
      {failed
        ? <img className="diff-lead-film" src={film.poster} alt={diffusionRobot.alt} width={1200} loading={compact ? 'lazy' : 'eager'} height={756} />
        : <video
            id={videoId}
            ref={video}
            className="diff-lead-film"
            src={film.src}
            poster={film.poster}
            width={1200}
            height={756}
            muted
            loop
            playsInline
            preload={compact ? 'metadata' : 'auto'}
            aria-label={diffusionRobot.alt}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEmptied={() => setPlaying(false)}
            onError={() => { setPlaying(false); setFailedSource(film.src) }}
          />}
    </div>
  )
}
