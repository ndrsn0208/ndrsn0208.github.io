import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from 'react'
import { Link, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { directions, getDirection, type DesignDirection } from './registry'
import { getStillEdition, stillEditions, type StillEdition } from './still/editions'
import { getStillStudy, stillStudies, type StillStudy } from './still/studies'
import './designs.css'
import './studio.css'

const variantModules = import.meta.glob<{ default: ComponentType }>('./variants/*/index.tsx')
const favoriteKey = 'zekun-design-favorites-v1'

function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(favoriteKey) ?? '[]')
      return Array.isArray(stored) ? stored.filter((slug): slug is string => typeof slug === 'string' && Boolean(getDirection(slug))) : []
    } catch {
      return []
    }
  })
  const toggle = (slug: string) => setFavorites((previous) => {
    const next = previous.includes(slug) ? previous.filter((value) => value !== slug) : [...previous, slug]
    try { localStorage.setItem(favoriteKey, JSON.stringify(next)) } catch { /* Favorites still work within this session. */ }
    return next
  })
  return { favorites, toggle }
}

type Favorites = ReturnType<typeof useFavorites>

function FavoriteButton({ direction, favorites, toggle }: { direction: DesignDirection } & Favorites) {
  const selected = favorites.includes(direction.slug)
  return (
    <button
      type="button"
      className={`studio-favorite ${selected ? 'studio-favorite-selected' : ''}`}
      onClick={() => toggle(direction.slug)}
      aria-pressed={selected}
      aria-label={`${selected ? '取消收藏' : '收藏'} ${direction.name}`}
      title={selected ? '取消收藏' : '收藏方案'}
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill={selected ? 'currentColor' : 'none'} aria-hidden="true">
        <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1L3.2 9.4l6.1-.9L12 3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

function StudioHeader() {
  return (
    <header className="studio-header">
      <Link className="studio-brand" to="/designs" aria-label="设计总览">
        <span className="studio-brand-mark" aria-hidden="true">z<span>.</span></span>
        <span>Zekun Wang <span className="studio-brand-divider">/</span> <span className="studio-brand-sub">Design studies</span></span>
      </Link>
      <nav aria-label="预览导航">
        <Link to="/still">Still 系列 <span aria-hidden="true">↗</span></Link>
        <Link to="/designs/compare">并排比较 <span aria-hidden="true">↗</span></Link>
        <Link to="/" className="studio-original-link">现有网站 <span aria-hidden="true">↗</span></Link>
      </nav>
    </header>
  )
}

function PreviewImage({ direction }: { direction: DesignDirection }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={`studio-preview-image studio-art-${direction.slug}`} style={{ backgroundColor: direction.palette[0], color: direction.palette[1] }}>
      {failed ? (
        <div className="studio-preview-fallback">
          <span>{direction.id} / ZEKUN WANG</span>
          <strong>{direction.name}</strong>
          <span>{direction.chinese}</span>
          <svg viewBox="0 0 400 120" fill="none" aria-hidden="true">
            <path d="M0 70C75-80 135 190 215 55S350 20 410 95M0 85C75-65 135 205 215 70S350 35 410 110" stroke="currentColor" />
            <circle cx="214" cy="62" r="17" fill="currentColor" />
          </svg>
        </div>
      ) : (
        <img src={`/design-thumbnails/${direction.slug}.jpg`} alt={`${direction.name} ${direction.chinese} 桌面页面预览`} loading="lazy" width="1440" height="990" onError={() => setFailed(true)} />
      )}
      <span className="studio-open-overlay">进入方案 <span aria-hidden="true">↗</span></span>
    </div>
  )
}

function Overview(props: Favorites) {
  const [showFavorites, setShowFavorites] = useState(false)
  const displayed = showFavorites ? directions.filter((direction) => props.favorites.includes(direction.slug)) : directions
  const compareLeft = props.favorites[0] ?? 'folio'
  const compareRight = props.favorites[1] ?? (compareLeft === 'atlas' ? 'folio' : 'atlas')
  return (
    <div className="studio" lang="zh-CN">
      <StudioHeader />
      <main id="studio-main" className="studio-main">
        <section className="studio-intro">
          <div>
            <p className="studio-eyebrow">ACADEMIC, WITH A POINT OF VIEW.</p>
            <h1>一个研究者。<br /><span>十种表达方式。</span></h1>
            <p className="studio-intro-copy">从研究本身出发，重新设计认识你、理解你的工作、<br className="studio-desktop-break" />找到一篇论文的方式。</p>
          </div>
          <div className="studio-intro-note">
            <span className="studio-large-number">10<span>↗</span></span>
            <div className="studio-note-line"><span>同一份真实研究</span><span>十条独立的设计路径</span></div>
            <p>逐个进入，试试交互。<br />收藏喜欢的方向，再放在一起比较。</p>
          </div>
        </section>
        <div className="studio-collection-bar">
          <div className="studio-filter-tabs" aria-label="显示方案">
            <button type="button" aria-pressed={!showFavorites} onClick={() => setShowFavorites(false)}>全部方案 <span>10</span></button>
            <button type="button" aria-pressed={showFavorites} onClick={() => setShowFavorites(true)}>已收藏 <span>{props.favorites.length}</span></button>
          </div>
          <Link to={`/designs/compare?left=${compareLeft}&right=${compareRight}`} className="studio-compare-link">并排比较 <span aria-hidden="true">↗</span></Link>
        </div>
        {displayed.length ? (
          <div className="studio-design-grid">
            {displayed.map((direction) => (
              <article className="studio-design-card" key={direction.slug}>
                <Link to={`/designs/${direction.slug}`} className="studio-preview-link" aria-label={`进入 ${direction.name} · ${direction.chinese}`}>
                  <PreviewImage direction={direction} />
                </Link>
                <div className="studio-card-heading">
                  <div className="studio-card-title">
                    <span className="studio-card-number">{direction.id}</span>
                    <h2><Link to={`/designs/${direction.slug}`}>{direction.name}</Link><span>{direction.chinese}</span></h2>
                  </div>
                  <FavoriteButton direction={direction} {...props} />
                </div>
                <p className="studio-card-summary">{direction.summary}</p>
                <div className="studio-card-bottom">
                  <span>{direction.structure}</span>
                  <span className="studio-swatches" aria-hidden="true">{direction.palette.map((color) => <i key={color} style={{ background: color }} />)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="studio-empty"><p>还没有收藏的方向。</p><button type="button" onClick={() => setShowFavorites(false)}>去看看全部方案 <span aria-hidden="true">→</span></button></div>
        )}
        <footer className="studio-footer"><span>Zekun Wang / Ten design studies</span><span>为阅读、探索与交流而设计。</span></footer>
      </main>
    </div>
  )
}

function ReviewControls({ direction, ...favorites }: { direction: DesignDirection } & Favorites) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const position = directions.findIndex((item) => item.slug === direction.slug)
  const neighbor = (offset: number) => directions[(position + offset + directions.length) % directions.length]
  if (collapsed) {
    return <button type="button" className="studio-review-peek" onClick={() => setCollapsed(false)} aria-label="展开设计切换栏"><span aria-hidden="true">◈</span> {direction.id} / 10</button>
  }
  return (
    <aside className="studio-review-controls" aria-label="设计预览控制" lang="zh-CN">
      <Link to="/designs" className="studio-review-home" aria-label="返回全部 10 个方案"><span aria-hidden="true">▦</span><span>总览</span></Link>
      <div className="studio-review-separator" />
      <Link to={`/designs/${neighbor(-1).slug}`} className="studio-review-arrow" aria-label={`上一个方案：${neighbor(-1).name}`}>←</Link>
      <label className="studio-review-select">
        <span className="ds-visually-hidden">选择设计方案</span>
        <select aria-label="选择设计方案" value={direction.slug} onChange={(event) => navigate(`/designs/${event.target.value}`)}>
          {directions.map((item) => <option key={item.slug} value={item.slug}>{item.id} {item.name} · {item.chinese}</option>)}
        </select>
      </label>
      <Link to={`/designs/${neighbor(1).slug}`} className="studio-review-arrow" aria-label={`下一个方案：${neighbor(1).name}`}>→</Link>
      <FavoriteButton direction={direction} {...favorites} />
      <button type="button" className="studio-review-collapse" onClick={() => setCollapsed(true)} aria-label="收起设计切换栏">−</button>
    </aside>
  )
}

function VariantPage(props: Favorites) {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const direction = getDirection(slug)
  const path = direction ? `./variants/${direction.id}-${direction.slug}/index.tsx` : ''
  const Variant = useMemo(() => variantModules[path] ? lazy(variantModules[path]) : null, [path])
  const embedded = params.get('embed') === '1'
  const edition = direction?.slug === 'quiet' ? getStillEdition(params.get('edition')) : undefined
  useEffect(() => {
    document.title = direction ? `${direction.name} — Zekun Wang` : 'Design studies — Zekun Wang'
    document.documentElement.lang = 'en'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', edition?.background ?? direction?.palette[0] ?? '#f4f3ee')
    window.scrollTo(0, 0)
  }, [direction, edition])
  if (!direction) return <div className="studio studio-route-message"><h1>没有找到这个方案</h1><Link to="/designs">返回设计总览 →</Link></div>
  return (
    <>
      <Suspense fallback={<div className="studio studio-route-message" role="status">Opening {direction.name}…</div>}>
        {Variant ? <Variant /> : <div className="studio studio-route-message"><h1>{direction.name}</h1><p>这个方案正在准备中。</p><Link to="/designs">返回设计总览 →</Link></div>}
      </Suspense>
      {!embedded && <ReviewControls direction={direction} {...props} />}
    </>
  )
}

function ComparisonFrame({ direction, mobile, edition, study }: {
  direction: DesignDirection; mobile: boolean; edition?: StillEdition; study?: StillStudy
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const frameWidth = mobile ? 390 : 1440
  const frameHeight = mobile ? 844 : 1040
  const scale = Math.min(1, width / frameWidth)
  useEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} className={`studio-comparison-viewport ${mobile ? 'studio-comparison-mobile' : ''}`}>
      <div className="studio-comparison-canvas" style={{ width: frameWidth * scale, height: frameHeight * scale }}>
        <iframe
          key={`${direction.slug}-${mobile}`}
          title={`${direction.name}${study ? ` / ${study.name}` : ''}${edition ? ` / ${edition.name}` : ''} ${mobile ? '手机' : '桌面'}预览`}
          src={edition ? `/still?embed=1&edition=${edition.id}&study=${study?.id ?? 'lens'}` : `/designs/${direction.slug}?embed=1`}
          style={{ width: frameWidth, height: frameHeight, transform: `scale(${scale})` }}
        />
      </div>
    </div>
  )
}

function Comparison() {
  const [params, setParams] = useSearchParams()
  const [mobile, setMobile] = useState(false)
  const left = getDirection(params.get('left') ?? undefined) ?? directions[0]
  const right = getDirection(params.get('right') ?? undefined) ?? directions[1]
  const change = (side: 'left' | 'right', value: string) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set('left', side === 'left' ? value : left.slug)
      next.set('right', side === 'right' ? value : right.slug)
      if (value !== 'quiet') {
        next.delete(`${side}Edition`)
        next.delete(`${side}Study`)
      }
      return next
    })
  }
  const changeStill = (side: 'left' | 'right', kind: 'Edition' | 'Study', value: string) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set(`${side}${kind}`, value)
      return next
    })
  }
  return (
    <div className="studio studio-compare" lang="zh-CN">
      <StudioHeader />
      <main className="studio-compare-main">
        <div className="studio-compare-heading">
          <div><Link to="/designs" className="studio-back-link">← 全部方案</Link><h1>放在一起，看得更清楚。</h1><p>左右页面均可独立操作和滚动。</p></div>
          <div className="studio-device-switch" aria-label="预览设备">
            <button type="button" aria-pressed={!mobile} onClick={() => setMobile(false)}>桌面</button>
            <button type="button" aria-pressed={mobile} onClick={() => setMobile(true)}>手机</button>
          </div>
        </div>
        <div className="studio-comparison-grid">
          {(['left', 'right'] as const).map((side) => {
            const direction = side === 'left' ? left : right
            const edition = direction.slug === 'quiet' ? getStillEdition(params.get(`${side}Edition`)) ?? stillEditions[0] : undefined
            const study = direction.slug === 'quiet' ? getStillStudy(params.get(`${side}Study`)) ?? stillStudies[0] : undefined
            return (
              <section className="studio-comparison-panel" key={side}>
                <div className="studio-comparison-toolbar">
                  <label><span className="ds-visually-hidden">{side === 'left' ? '左侧' : '右侧'}方案</span><select aria-label={`${side === 'left' ? '左侧' : '右侧'}方案`} value={direction.slug} onChange={(event) => change(side, event.target.value)}>{directions.map((item) => <option key={item.slug} value={item.slug}>{item.id} {item.name} · {item.chinese}</option>)}</select></label>
                  {direction.slug === 'quiet' && (
                    <>
                      <select aria-label={`${side === 'left' ? '左侧' : '右侧'} Still 设计`} value={study?.id ?? 'lens'} onChange={(event) => changeStill(side, 'Study', event.target.value)}>
                        {stillStudies.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.chinese}</option>)}
                      </select>
                      <select aria-label={`${side === 'left' ? '左侧' : '右侧'} Still 风格`} value={edition?.id ?? 'black'} onChange={(event) => changeStill(side, 'Edition', event.target.value)}>
                        {stillEditions.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.chinese}</option>)}
                      </select>
                    </>
                  )}
                  <Link to={edition ? `/still?edition=${edition.id}&study=${study?.id ?? 'lens'}` : `/designs/${direction.slug}`}>单独打开 ↗</Link>
                </div>
                <ComparisonFrame direction={direction} mobile={mobile} edition={edition} study={study} />
                <div className="studio-comparison-caption"><p>{study?.description ?? direction.summary}</p><span>{edition?.description ?? direction.interaction}</span></div>
              </section>
            )
          })}
        </div>
      </main>
    </div>
  )
}

export default function DesignStudio() {
  const favorites = useFavorites()
  const { pathname } = useLocation()
  useEffect(() => () => {
    document.title = 'Zekun Wang'
    document.documentElement.lang = 'en'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#000000')
  }, [])
  useEffect(() => {
    if (pathname === '/designs' || pathname === '/designs/' || pathname === '/designs/compare') {
      document.title = 'Ten design studies — Zekun Wang'
      document.documentElement.lang = 'zh-CN'
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f4f3ee')
    }
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <Routes>
      <Route path="/" element={<Overview {...favorites} />} />
      <Route path="/compare" element={<Comparison />} />
      <Route path="/:slug" element={<VariantPage {...favorites} />} />
      <Route path="*" element={<Overview {...favorites} />} />
    </Routes>
  )
}
