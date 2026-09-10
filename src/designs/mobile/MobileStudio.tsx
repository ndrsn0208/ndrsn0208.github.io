import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getStillEdition, stillEditions, type StillEdition } from '../still/editions'
import { appearanceStyle, LoadedPreview, useReviewDocument } from '../typography/TypographyStudio'
import { getTypography } from '../typography/registry'
import { getMobileStudy, mobileStudies, type MobileStudy } from './registry'
import './layout.css'
import './variants/folio.css'
import './variants/index.css'
import './variants/chapters.css'
import './studio.css'

const paper = stillEditions[1]
const book = getTypography('book')!
type ReadingPosition = 'home' | 'publications'
type PreviewCommand = { edition?: string; position?: ReadingPosition }
const commandType = 'still-mobile-preview'
const readyType = 'still-mobile-ready'

function useFramedPreview() {
  const [framed, setFramed] = useState(() => window.matchMedia('(min-width: 900px)').matches)
  useEffect(() => {
    const media = window.matchMedia('(min-width: 900px)')
    const update = () => setFramed(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return framed
}

function EditionOptions({ edition, onChange }: { edition: StillEdition; onChange: (edition: string) => void }) {
  return (
    <div className="mobile-editions" role="group" aria-label="预览主题">
      {stillEditions.map((item) => (
        <button key={item.id} type="button" aria-pressed={edition.id === item.id} onClick={() => onChange(item.id)}>
          <span className="mobile-edition-dot" style={{ background: item.background, borderColor: item.ink }} aria-hidden="true" />
          {item.name}
        </button>
      ))}
    </div>
  )
}

function ReadingOptions({ position, onChange }: { position: ReadingPosition; onChange: (position: ReadingPosition) => void }) {
  return (
    <div className="mobile-reading-options" role="group" aria-label="比较阅读位置">
      <button type="button" aria-pressed={position === 'home'} onClick={() => onChange('home')}>介绍</button>
      <button type="button" aria-pressed={position === 'publications'} onClick={() => onChange('publications')}>Publications</button>
    </div>
  )
}

function ReviewHeader({ edition }: { edition: StillEdition }) {
  return (
    <header className="mobile-studio-header">
      <Link className="mobile-studio-brand" to={`/mobile?edition=${edition.id}`}>
        <span>Zekun Wang</span><span className="mobile-studio-separator" aria-hidden="true">/</span><span>Book on mobile</span>
      </Link>
      <nav aria-label="手机版预览导航">
        <Link to={`/typography/book?edition=${edition.id}&review=1`}>Book 桌面版 <span aria-hidden="true">↗</span></Link>
        <Link to="/typography">字体方案 <span aria-hidden="true">↗</span></Link>
      </nav>
    </header>
  )
}

/** Change the live frame's appearance or reading position without reloading it. */
function PhoneFrame({ study, edition, position }: { study: MobileStudy; edition: StillEdition; position: ReadingPosition }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const current = useRef({ edition: edition.id, position })
  current.current = { edition: edition.id, position }
  const source = useRef(`/mobile/${study.id}?edition=${edition.id}&embed=1${position === 'publications' ? '#publications' : ''}`)
  const [width, setWidth] = useState(0)
  const scale = Math.min(1, width / 390)

  function send(command: PreviewCommand) {
    iframeRef.current?.contentWindow?.postMessage({ type: commandType, ...command }, window.location.origin)
  }

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    setWidth(container.clientWidth)
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(container)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    function onReady(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow || event.data?.type !== readyType) return
      send(current.current)
    }
    window.addEventListener('message', onReady)
    return () => window.removeEventListener('message', onReady)
  }, [])
  useEffect(() => { send({ edition: edition.id }) }, [edition.id])
  useEffect(() => { send({ position }) }, [position])

  return (
    <div className="mobile-frame" ref={containerRef}>
      {width > 0 && (
        <div className="mobile-frame-canvas" style={{ width: 390 * scale, height: 844 * scale }}>
          <iframe
            ref={iframeRef} src={source.current} title={`${study.name} 手机交互预览`}
            style={{ width: 390, height: 844, transform: `scale(${scale})` }}
            onLoad={() => send(current.current)}
          />
        </div>
      )}
    </div>
  )
}

function Overview() {
  const [params, setParams] = useSearchParams()
  const framed = useFramedPreview()
  const edition = getStillEdition(params.get('edition')) ?? paper
  const position: ReadingPosition = params.get('position') === 'publications' ? 'publications' : 'home'
  useReviewDocument('Book on mobile', edition)

  function change(name: string, value: string) {
    const next = new URLSearchParams(params)
    next.set(name, value)
    setParams(next, { preventScrollReset: true })
  }

  return (
    <div className="mobile-studio" style={appearanceStyle(edition)} lang="zh-CN">
      <ReviewHeader edition={edition} />
      <main className="mobile-overview">
        <section className="mobile-studio-intro">
          <div><p className="mobile-kicker">Still / Book / Mobile</p><h1>三种手机上的阅读方式。</h1></div>
          <p>同一套字体与内容，<br />试试不同的信息密度和导航方式。</p>
        </section>
        <div className="mobile-studio-controls">
          <EditionOptions edition={edition} onChange={(value) => change('edition', value)} />
          <ReadingOptions position={position} onChange={(value) => change('position', value)} />
          <p>{framed ? '三个页面都可以直接点击和滚动。' : '点开任意一版，在手机上完整体验。'}</p>
        </div>
        <div className="mobile-study-grid">
          {mobileStudies.map((study) => {
            const href = `/mobile/${study.id}?edition=${edition.id}${position === 'publications' ? '#publications' : ''}`
            return (
              <article className="mobile-study-card" key={study.id}>
                <div className="mobile-card-heading">
                  <h2><span className="mobile-card-number">{study.number}</span>{study.name}<span className="mobile-card-chinese">{study.chinese}</span></h2>
                  <Link to={href} aria-label={`打开 ${study.name} 手机版`}>打开 <span aria-hidden="true">↗</span></Link>
                </div>
                {framed
                  ? <PhoneFrame study={study} edition={edition} position={position} />
                  : <Link className="mobile-thumbnail" to={href} aria-label={`体验 ${study.name} 手机版`}>
                    <img
                      src={`/mobile-thumbnails/${study.id}-${edition.id}-${position}.jpg`}
                      alt={`${study.name} ${position === 'home' ? '介绍' : 'Publications'}页面`}
                      width="390" height="844" loading="lazy"
                    />
                  </Link>}
                <p className="mobile-card-description">{study.description}</p>
                <p className="mobile-card-caption">{study.interaction}</p>
              </article>
            )
          })}
        </div>
        <footer className="mobile-studio-footer"><span>Book · EB Garamond / Source Sans 3 / Newsreader</span><span>Black & Paper</span></footer>
      </main>
    </div>
  )
}

function PreviewReview({ study, edition }: { study: MobileStudy; edition: StillEdition }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const position: ReadingPosition = location.hash === '#publications' ? 'publications' : 'home'
  useReviewDocument(`${study.name} / Mobile`, edition)
  function changeEdition(value: string) {
    const next = new URLSearchParams(params)
    next.set('edition', value)
    navigate({ search: `?${next}`, hash: location.hash }, { preventScrollReset: true })
  }
  return (
    <div className="mobile-studio" style={appearanceStyle(edition)} lang="zh-CN">
      <ReviewHeader edition={edition} />
      <main className="mobile-single">
        <section className="mobile-single-note">
          <Link className="mobile-back" to={`/mobile?edition=${edition.id}`}>← 三版一起比较</Link>
          <p className="mobile-kicker">{study.number} / {study.chinese}</p>
          <h1>{study.name}</h1>
          <p>{study.description}</p>
          <p className="mobile-card-caption">{study.interaction}</p>
          <EditionOptions edition={edition} onChange={changeEdition} />
          <ReadingOptions position={position} onChange={(value) => navigate({ search: location.search, hash: value === 'home' ? '#introduction' : '#publications' }, { preventScrollReset: true })} />
          <nav className="mobile-other-studies" aria-label="其他手机版方案">
            {mobileStudies.map((item) => (
              <Link key={item.id} aria-current={item.id === study.id ? 'page' : undefined} to={`/mobile/${item.id}?edition=${edition.id}${location.hash}`}>
                {item.number} {item.name} <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </nav>
        </section>
        <PhoneFrame key={study.id} study={study} edition={edition} position={position} />
      </main>
    </div>
  )
}

function MobilePage({ study, edition }: { study: MobileStudy; edition: StillEdition }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const embedded = params.get('embed') === '1'

  useEffect(() => {
    if (!embedded || window.parent === window) return
    function receive(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== commandType) return
      const next = new URLSearchParams(window.location.search)
      const nextEdition = getStillEdition(event.data.edition)
      if (nextEdition) next.set('edition', nextEdition.id)
      const position = event.data.position
      const hash = position === 'home' ? '#introduction' : position === 'publications' ? '#publications' : window.location.hash
      navigate({ search: `?${next}`, hash }, { replace: true, preventScrollReset: true })
    }
    window.addEventListener('message', receive)
    window.parent.postMessage({ type: readyType }, window.location.origin)
    return () => window.removeEventListener('message', receive)
  }, [embedded, navigate])

  return <LoadedPreview requested={book} edition={edition} mobileStudy={study.id} />
}

function Preview() {
  const { id } = useParams()
  const framed = useFramedPreview()
  const [params] = useSearchParams()
  const location = useLocation()
  const study = getMobileStudy(id)
  const edition = getStillEdition(params.get('edition'))
  if (!study) return <Navigate to="/mobile" replace />
  if (!edition) {
    const next = new URLSearchParams(params)
    next.set('edition', 'paper')
    return <Navigate replace to={{ pathname: location.pathname, search: `?${next}`, hash: location.hash }} />
  }
  return framed && params.get('embed') !== '1'
    ? <PreviewReview study={study} edition={edition} />
    : <MobilePage study={study} edition={edition} />
}

export default function MobileStudio() {
  return (
    <Routes>
      <Route index element={<Overview />} />
      <Route path=":id" element={<Preview />} />
      <Route path="*" element={<Navigate to="/mobile" replace />} />
    </Routes>
  )
}
