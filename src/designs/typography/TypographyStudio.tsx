import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import StillStudio from '../still/StillStudio'
import { getStillEdition, stillEditions, type StillEdition } from '../still/editions'
import { reducedMotion, transitionStill } from '../still/transitions'
import { getTypography, loadTypography, typographyStudies, type TypographyStudy } from './registry'
import type { MobileStudyId } from '../mobile/registry'
import './fonts.css'
import './variants/book.css'
import './variants/editorial.css'
import './variants/humanist.css'
import './variants/poem.css'
import './studio.css'

const paper = stillEditions[1]

export function appearanceStyle(edition: StillEdition) {
  return {
    '--type-paper': edition.background,
    '--type-ink': edition.ink,
    '--type-muted': edition.id === 'black' ? '#aaa59b' : '#726d62',
    '--type-rule': edition.id === 'black' ? '#302e28' : '#d8d1c3',
    colorScheme: edition.scheme,
  } as CSSProperties
}

export function useReviewDocument(title: string, edition: StillEdition) {
  useLayoutEffect(() => {
    document.documentElement.style.backgroundColor = edition.background
    document.body.style.backgroundColor = edition.background
    document.documentElement.style.colorScheme = edition.scheme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', edition.background)
    return () => {
      document.documentElement.style.removeProperty('background-color')
      document.documentElement.style.removeProperty('color-scheme')
      document.body.style.removeProperty('background-color')
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#000000')
    }
  }, [edition])
  useEffect(() => {
    document.title = `${title} — Zekun Wang`
    document.documentElement.lang = 'zh-CN'
    return () => { document.title = 'Zekun Wang'; document.documentElement.lang = 'en' }
  }, [title])
}

function EditionButtons({ edition, onChange }: { edition: StillEdition; onChange: (value: string) => void }) {
  return (
    <div className="type-editions" role="group" aria-label="预览主题">
      {stillEditions.map((item) => (
        <button key={item.id} type="button" aria-pressed={edition.id === item.id} onClick={() => onChange(item.id)}>
          <span className={`type-swatch type-swatch-${item.id}`} aria-hidden="true" />{item.name}
        </button>
      ))}
    </div>
  )
}

function ReviewHeader({ edition, compare = false }: { edition: StillEdition; compare?: boolean }) {
  return (
    <header className="type-header">
      <Link className="type-brand" to={`/typography?edition=${edition.id}`}>
        <span>Zekun Wang</span><span className="type-header-divider" aria-hidden="true">/</span><span>Typography studies</span>
      </Link>
      <nav aria-label="排版预览导航">
        {compare
          ? <Link to={`/typography?edition=${edition.id}`}>全部方案 <span aria-hidden="true">↗</span></Link>
          : <Link to={`/typography/compare?left=original&right=book&edition=${edition.id}`}>并排比较 <span aria-hidden="true">↗</span></Link>}
        <Link to="/">当前主页 <span aria-hidden="true">↗</span></Link>
        <Link to="/mobile">手机版 <span aria-hidden="true">↗</span></Link>
      </nav>
    </header>
  )
}

function Overview() {
  const [params, setParams] = useSearchParams()
  const edition = getStillEdition(params.get('edition')) ?? paper
  useReviewDocument('Typography studies', edition)
  function changeEdition(value: string) {
    transitionStill(() => setParams({ edition: value }, { preventScrollReset: true }), 'edition')
  }
  return (
    <div className="type-studio" style={appearanceStyle(edition)} lang="zh-CN">
      <ReviewHeader edition={edition} />
      <main className="type-overview">
        <section className="type-intro">
          <div>
            <p className="type-kicker">Still / A study in type</p>
            <h1>让文字，<br /><em>更有人文气质。</em></h1>
          </div>
          <div className="type-intro-note">
            <p>从 Lens 出发，调整字体、字级、行长与留白。</p>
            <p>四种排版，都可以试用原来的分栏交互，<br className="type-desktop-break" />也都有 Black 和 Paper 两个主题。</p>
          </div>
        </section>
        <div className="type-collection-heading">
          <span>四个新方向 <span className="type-muted">/ 01—04</span></span>
          <EditionButtons edition={edition} onChange={changeEdition} />
        </div>
        <div className="type-grid">
          {typographyStudies.slice(1).map((study) => (
            <article className="type-card" key={study.id}>
              <Link className="type-card-preview" to={`/typography/${study.id}?edition=${edition.id}&review=1`} aria-label={`体验 ${study.name} · ${study.chinese}`}>
                <img src={`/typography-thumbnails/${study.id}-${edition.id}.jpg`} alt={`${study.name} 的真实主页排版预览`} loading="lazy" width="1200" height="820" />
                <span className="type-preview-label">体验完整页面 <span aria-hidden="true">↗</span></span>
              </Link>
              <div className="type-card-heading">
                <h2><span className="type-card-number">{study.number}</span><Link to={`/typography/${study.id}?edition=${edition.id}&review=1`}>{study.name}</Link><span className="type-card-chinese">{study.chinese}</span></h2>
                <Link className="type-compare-link" to={`/typography/compare?left=original&right=${study.id}&edition=${edition.id}`} aria-label={`比较原始 Lens 与 ${study.name}`}>对比 <span aria-hidden="true">↗</span></Link>
              </div>
              <p className="type-card-description">{study.description}</p>
              <div className="type-card-caption"><span>{study.pairing}</span><span>{study.rhythm}</span></div>
            </article>
          ))}
        </div>
        <aside className="type-original">
          <div><span className="type-kicker">00 / The reference</span><h2>原始 Lens</h2></div>
          <p>Fraunces 与 Geist。把熟悉的版本放在旁边，<br className="type-desktop-break" />再看看哪一种字形与节奏更像你。</p>
          <Link to={`/typography/original?edition=${edition.id}&review=1`}>打开原始排版 <span aria-hidden="true">↗</span></Link>
        </aside>
        <footer className="type-footer"><span>Zekun Wang / Typography studies</span><span>为阅读留一点空间。</span></footer>
      </main>
    </div>
  )
}

function PreviewControls({ requested, edition, loading }: { requested: TypographyStudy; edition: StillEdition; loading: boolean }) {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const clean = new URLSearchParams(params)
  clean.delete('review')
  return (
    <aside className="type-review" style={appearanceStyle(edition)} aria-label="排版预览控制" lang="zh-CN">
      <Link to={`/typography?edition=${edition.id}`} aria-label="返回全部排版方案">← <span>总览</span></Link>
      <label className="type-review-select">
        <span className="type-sr-only">选择排版</span>
        <select aria-label="选择排版" aria-busy={loading} value={requested.id} onChange={(event) => {
          navigate({ pathname: `/typography/${event.target.value}`, search: location.search, hash: location.hash }, { preventScrollReset: true })
        }}>
          {typographyStudies.map((item) => <option key={item.id} value={item.id}>{item.number} {item.name} · {item.chinese}</option>)}
        </select>
      </label>
      <Link to={`/typography/compare?left=original&right=${requested.id}&edition=${edition.id}`} className="type-review-compare">对比 <span aria-hidden="true">↗</span></Link>
      <Link to={{ pathname: location.pathname, search: `?${clean}`, hash: location.hash }} aria-label="隐藏预览工具，查看纯净页面" title="隐藏预览工具">×</Link>
    </aside>
  )
}

export function LoadedPreview({ requested, edition, mobileStudy }: {
  requested: TypographyStudy
  edition: StillEdition
  mobileStudy?: MobileStudyId
}) {
  const [params] = useSearchParams()
  const location = useLocation()
  const [displayed, setDisplayed] = useState<TypographyStudy | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const displayedRef = useRef<TypographyStudy | null>(null)
  const embedded = params.get('embed') === '1'
  const reviewing = !embedded && params.get('review') === '1'
  useEffect(() => {
    let current = true
    setError(false)
    void loadTypography(requested).then(() => {
      if (!current) return
      const apply = () => { displayedRef.current = requested; setDisplayed(requested) }
      if (displayedRef.current) transitionStill(apply, 'study')
      else apply()
    }).catch(() => { if (current) setError(true) })
    return () => { current = false }
  }, [requested, attempt])
  useEffect(() => {
    if (displayed) document.title = `${displayed.name} — Typography / Zekun Wang`
  }, [displayed, edition])

  useEffect(() => {
    if (!mobileStudy || mobileStudy === 'chapters' || !displayed) return
    if (document.documentElement.dataset.stillLayout === 'split') return
    const id = location.hash === '#publications' ? 'publications' : location.hash === '#introduction' ? 'introduction' : null
    if (!id) return
    const target = document.getElementById(id)
    target?.focus({ preventScroll: true })
    target?.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'instant' : 'smooth' })
  }, [mobileStudy, displayed, location.hash])

  return (
    <div className={`type-preview${mobileStudy ? ' mobile-preview' : ''}`} data-typography={displayed?.id ?? requested.id} data-edition={edition.id} data-mobile-study={mobileStudy} data-review={reviewing || undefined} style={appearanceStyle(edition)}>
      {displayed
        ? <StillStudio finalized mobileStudy={mobileStudy} />
        : <div className="type-loading" role="status"><span>{error ? '字体未能载入。' : '正在载入排版…'}</span>{error && <button type="button" onClick={() => setAttempt((value) => value + 1)}>重试</button>}</div>}
      {reviewing && <PreviewControls requested={requested} edition={edition} loading={requested.id !== displayed?.id} />}
      {error && displayed && <p className="type-font-error" role="alert">字体未能载入。<button type="button" onClick={() => setAttempt((value) => value + 1)}>重试</button></p>}
    </div>
  )
}

function Preview() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const location = useLocation()
  const requested = getTypography(id)
  const edition = getStillEdition(params.get('edition'))
  if (!requested) return <Missing />
  if (!edition) {
    const next = new URLSearchParams(params)
    next.set('edition', 'paper')
    return <Navigate replace to={{ pathname: location.pathname, search: `?${next}`, hash: location.hash }} />
  }
  return <LoadedPreview requested={requested} edition={edition} />
}

function ComparisonFrame({ study, edition, mobile, panel, side }: {
  study: TypographyStudy; edition: StillEdition; mobile: boolean; panel: string; side: string
}) {
  const container = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const frameWidth = mobile ? 390 : 1440
  const frameHeight = mobile ? 844 : 1000
  const scale = Math.min(1, width / frameWidth)
  const src = `/typography/${study.id}?edition=${edition.id}&embed=1${panel === 'home' ? '' : `#${panel}`}`
  useLayoutEffect(() => {
    const element = container.current
    if (!element) return
    setWidth(element.getBoundingClientRect().width)
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return (
    <div className="type-frame-wrap" ref={container}>
      {width > 0 && (
        <div className="type-frame-canvas" style={{ width: frameWidth * scale, height: frameHeight * scale }}>
          <iframe
            title={`${side}：${study.name} ${mobile ? '手机' : '桌面'}预览`}
            src={src}
            style={{ width: frameWidth, height: frameHeight, transform: `scale(${scale})` }}
          />
        </div>
      )}
    </div>
  )
}

function Comparison() {
  const [params, setParams] = useSearchParams()
  const edition = getStillEdition(params.get('edition')) ?? paper
  const left = getTypography(params.get('left')) ?? typographyStudies[0]
  const right = getTypography(params.get('right')) ?? typographyStudies[1]
  const mobile = params.get('viewport') === 'mobile'
  const availablePanels = mobile ? ['publications'] : ['publications', 'about', 'contact', 'cv']
  const panel = availablePanels.includes(params.get('panel') ?? '') ? params.get('panel')! : 'home'
  useReviewDocument('比较排版', edition)
  function change(key: string, value: string) {
    const next = new URLSearchParams(params)
    next.set(key, value)
    setParams(next, { preventScrollReset: true })
  }
  return (
    <div className="type-studio type-comparison" style={appearanceStyle(edition)} lang="zh-CN">
      <ReviewHeader edition={edition} compare />
      <main className="type-compare-main">
        <div className="type-compare-intro"><h1>放在一起，慢慢看。</h1><p>两边都可以直接点击、阅读和滚动。</p></div>
        <div className="type-compare-controls">
          <EditionButtons edition={edition} onChange={(value) => change('edition', value)} />
          <div role="group" aria-label="预览尺寸" className="type-viewport-options">
            <button type="button" aria-pressed={!mobile} onClick={() => change('viewport', 'desktop')}>桌面</button>
            <button type="button" aria-pressed={mobile} onClick={() => change('viewport', 'mobile')}>手机</button>
          </div>
          <label className="type-panel-select"><span>阅读位置</span><select aria-label="比较阅读位置" value={panel} onChange={(event) => change('panel', event.target.value)}>
            <option value="home">介绍</option><option value="publications">Publications</option>
            {!mobile && <><option value="about">About</option><option value="contact">Contact</option><option value="cv">CV</option></>}
          </select></label>
        </div>
        <div className={`type-comparison-grid${mobile ? ' type-comparison-mobile' : ''}`}>
          {([{ side: 'left', study: left, label: '左侧' }, { side: 'right', study: right, label: '右侧' }] as const).map(({ side, study, label }) => (
            <section className="type-comparison-side" key={side} aria-label={`${label}方案`}>
              <div className="type-frame-heading">
                <label><span className="type-sr-only">{label}排版</span><select aria-label={`${label}排版`} value={study.id} onChange={(event) => change(side, event.target.value)}>
                  {typographyStudies.map((item) => <option key={item.id} value={item.id}>{item.number} {item.name} · {item.chinese}</option>)}
                </select></label>
                <Link to={`/typography/${study.id}?edition=${edition.id}&review=1${panel === 'home' ? '' : `#${panel}`}`} aria-label={`全屏体验 ${study.name}`}>全屏体验 <span aria-hidden="true">↗</span></Link>
              </div>
              <ComparisonFrame study={study} edition={edition} mobile={mobile} panel={panel} side={label} />
              <p className="type-frame-caption">{study.pairing}<span>{study.rhythm}</span></p>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}

function Missing() {
  useReviewDocument('Typography studies', paper)
  return <main className="type-studio type-missing" style={appearanceStyle(paper)} lang="zh-CN"><h1>没有找到这个排版方案。</h1><Link to="/typography">返回全部方案 →</Link></main>
}

export default function TypographyStudio() {
  return (
    <Routes>
      <Route index element={<Overview />} />
      <Route path="compare" element={<Comparison />} />
      <Route path=":id" element={<Preview />} />
      <Route path="*" element={<Missing />} />
    </Routes>
  )
}
