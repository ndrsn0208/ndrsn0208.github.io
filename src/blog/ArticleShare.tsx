import { useEffect, useRef, useState } from 'react'

export default function ArticleShare({ title, subtitle, url }: {
  title: string
  subtitle: string
  url: string
}) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'manual'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const input = useRef<HTMLInputElement>(null)
  const text = `${title}\n${subtitle}.`
  const links = [
    { name: 'X', href: `https://x.com/intent/tweet?${new URLSearchParams({ text, url })}` },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url })}` },
    { name: 'Bluesky', href: `https://bsky.app/intent/compose?${new URLSearchParams({ text: `${text}\n\n${url}` })}` },
  ]

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
      if (!navigator.clipboard) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(url)
      setCopyState('copied')
      timer.current = setTimeout(() => setCopyState('idle'), 2600)
    } catch {
      setCopyState('manual')
    }
  }

  return (
    <div className="scol-share" role="group" aria-label="Share this article">
      <span className="scol-share-label">Share</span>
      {links.map(link => (
        <a key={link.name} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${link.name}`}>
          {link.name}
        </a>
      ))}
      <button className="scol-share-copy" type="button" onClick={copyLink}>
        {copyState === 'copied' ? 'Link copied' : 'Copy link'}
      </button>
      <span className="sr-only" role="status">{copyState === 'copied' ? 'Article link copied to clipboard.' : ''}</span>
      {copyState === 'manual' && (
        <label className="scol-share-fallback">
          Select and copy this link
          <input ref={input} type="url" value={url} readOnly onFocus={event => event.currentTarget.select()} />
        </label>
      )}
    </div>
  )
}
