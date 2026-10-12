import { useEffect, useId, useState, type MouseEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useReducedMotion } from 'motion/react'

export type ArticleChapter = { id: string; label: string }

export default function ArticleOutline({ items }: { items: readonly ArticleChapter[] }) {
  const [active, setActive] = useState(items[0].id)
  const [progress, setProgress] = useState(0)
  const selectId = useId()
  const navigate = useNavigate()
  const location = useLocation()
  const reduced = useReducedMotion()

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height ?? 94
      const threshold = headerHeight + (window.matchMedia('(min-width: 1240px)').matches ? 48 : 100)
      let next = items[0].id
      for (const item of items) {
        if ((document.getElementById(item.id)?.getBoundingClientRect().top ?? Infinity) <= threshold) next = item.id
      }
      setActive(previous => previous === next ? previous : next)
      const reading = document.querySelector('.article-reading-content')?.getBoundingClientRect()
      if (reading) {
        const distance = Math.max(1, reading.height - window.innerHeight + threshold)
        setProgress(Math.round(Math.max(0, Math.min(1, (threshold - reading.top) / distance)) * 100))
      }
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const observer = new ResizeObserver(schedule)
    const reading = document.querySelector('.article-reading-content')
    if (reading) observer.observe(reading)
    update()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [items])

  function goTo(id: string) {
    const target = document.getElementById(id)
    if (!target) return
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
    const hash = `#${id}`
    if (location.hash === hash) {
      target.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' })
    } else {
      navigate({ pathname: location.pathname, search: location.search, hash }, { preventScrollReset: true })
    }
    setActive(id)
  }

  function follow(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    goTo(id)
  }

  return (
    <aside className="article-outline">
      <nav aria-label="On this page">
        <ol className="article-outline-list">
          {items.map(item => <li key={item.id}>
            <a href={`#${item.id}`} onClick={event => follow(event, item.id)} aria-current={active === item.id ? 'location' : undefined}>{item.label}</a>
          </li>)}
        </ol>
        <select id={`${selectId}-select`} className="article-outline-select" aria-label="On this page" value={active} onChange={event => goTo(event.target.value)}>
          {items.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}
        </select>
        <div className="article-outline-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
      </nav>
    </aside>
  )
}
