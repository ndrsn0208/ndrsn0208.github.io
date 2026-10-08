import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './figure-share.css'

export default function FigureShare({ title, url, image, article = false }: {
  title: string
  url: string
  image: string
  article?: boolean
}) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'manual'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const input = useRef<HTMLInputElement>(null)
  const location = useLocation()
  const subject = article ? 'article' : 'figure'
  const path = new URL(url).pathname
  const tweet = `https://x.com/intent/tweet?${new URLSearchParams({ text: title, url })}`

  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (copyState === 'manual') {
      input.current?.focus()
      input.current?.select()
    }
  }, [copyState])

  async function copyLink() {
    clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(url)
      setCopyState('copied')
      timer.current = setTimeout(() => setCopyState('idle'), 2600)
    } catch {
      setCopyState('manual')
    }
  }

  return (
    <div className="blog-figure-share" role="group" aria-label={`Share ${title}`}>
      <Link
        className="blog-figure-permalink"
        to={{ pathname: path, search: location.search }}
        aria-label={`Link to ${title}`}
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
          <path d="m8 6 2-2a4 4 0 0 1 6 6l-2 2M6 8l-2 2a4 4 0 0 0 6 6l2-2M7 13l6-6" />
        </svg>
        {article ? 'Article link' : 'Figure link'}
      </Link>
      <div className="blog-figure-share-actions">
        <a href={tweet} target="_blank" rel="noopener noreferrer" aria-label={`Share ${title} on X`}>Share on X</a>
        <button type="button" onClick={copyLink} aria-label={`Copy ${subject} link for ${title}`}>
          {copyState === 'copied' ? 'Link copied' : 'Copy link'}
        </button>
        <a href={image} download={`${path.split('/').filter(Boolean).at(-1)}.png`} aria-label={`Save the share image for ${title}`}>Save image</a>
      </div>
      <span className="sr-only" role="status">{copyState === 'copied' ? `${article ? 'Article' : 'Figure'} link copied.` : ''}</span>
      {copyState === 'manual' && (
        <label className="blog-figure-share-fallback">
          Select and copy this link
          <input ref={input} type="url" value={url} readOnly onFocus={event => event.currentTarget.select()} />
        </label>
      )}
    </div>
  )
}
