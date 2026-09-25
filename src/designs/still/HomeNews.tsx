import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import newsData from '../../data/news.json'
import type { NewsItem } from '../../types'

const news: NewsItem[] = [...newsData].sort((a, b) => b.date.localeCompare(a.date))
const month = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' })

export default function HomeNews() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const reduce = useReducedMotion()
  const [scroll, setScroll] = useState({ before: false, after: false })

  useEffect(() => {
    const viewport = viewportRef.current
    const list = listRef.current
    if (!viewport || !list) return
    const update = () => {
      const before = viewport.scrollTop > 2
      const after = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop > 2
      setScroll((previous) => previous.before === before && previous.after === after ? previous : { before, after })
    }
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    observer.observe(list)
    viewport.addEventListener('scroll', update, { passive: true })
    update()
    return () => {
      observer.disconnect()
      viewport.removeEventListener('scroll', update)
    }
  }, [])

  function scrollNews(direction: number) {
    const viewport = viewportRef.current
    if (!viewport) return
    viewport.scrollBy({
      top: direction * viewport.clientHeight * 0.85,
      behavior: reduce ? 'instant' : 'smooth',
    })
  }

  const scrollable = scroll.before || scroll.after

  return (
    <section id="news" className="quiet-news">
      <div className="quiet-news-heading">
        <h2 id="quiet-news-title">News</h2>
        <div className="quiet-news-controls" hidden={!scrollable}>
          <button type="button" aria-label="Scroll to newer news" aria-controls="quiet-news-feed" disabled={!scroll.before} onClick={() => scrollNews(-1)}>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 12 5-5 5 5" /></svg>
          </button>
          <button type="button" aria-label="Scroll to older news" aria-controls="quiet-news-feed" disabled={!scroll.after} onClick={() => scrollNews(1)}>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 8 5 5 5-5" /></svg>
          </button>
        </div>
      </div>
      <div ref={viewportRef} id="quiet-news-feed" className="quiet-news-feed" role="region" aria-labelledby="quiet-news-title" tabIndex={scrollable ? 0 : undefined}>
        <ol ref={listRef} className="quiet-news-list">
          {news.map((item) => (
            <li key={item.id}>
              <time dateTime={item.date}>{month.format(new Date(`${item.date}-01T00:00:00Z`))}</time>
              <p>
                {item.content.map((part, index) => part.href ? (
                  <a key={index} href={part.href} target={part.href.startsWith('https://') ? '_blank' : undefined} rel={part.href.startsWith('https://') ? 'noreferrer' : undefined}>{part.text}</a>
                ) : part.text)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
