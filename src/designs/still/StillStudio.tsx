import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import '../designs.css'
import Quiet from '../variants/10-quiet'
import {
  getStillEdition,
  initialStillEdition,
  stillEditions,
  stillEditionStorageKey,
  type StillEdition,
} from './editions'
import { getStillStudy, initialStillStudy, stillStudies, stillStudyStorageKey, type StillStudy } from './studies'
import './studio.css'
import { transitionStill } from './transitions'
import type { MobileStudyId } from '../mobile/registry'

function EditionControls({ edition, study, onChange, onStudyChange }: {
  edition: StillEdition
  study: StillStudy
  onChange: (value: string) => void
  onStudyChange: (value: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const nextStudy = stillStudies[(stillStudies.findIndex((item) => item.id === study.id) + 1) % stillStudies.length]
  const style = {
    '--still-background': edition.background,
    '--still-ink': edition.ink,
    colorScheme: edition.scheme,
  } as CSSProperties

  if (collapsed) {
    return (
      <aside className="still-controls still-controls-collapsed" style={style} aria-label="Still design preview" lang="zh-CN">
        <button type="button" onClick={() => transitionStill(() => setCollapsed(false), 'controls')} aria-label="展开 Still 风格切换栏">
          Still <span aria-hidden="true">/</span> {study.name} <span aria-hidden="true">＋</span>
        </button>
      </aside>
    )
  }

  return (
    <aside className="still-controls" style={style} aria-label="Still design preview" lang="zh-CN">
      <Link to="/designs" className="still-controls-home" aria-label="返回设计总览">Still<span aria-hidden="true"> /</span></Link>
      <div className="still-study-options" role="group" aria-label="Still designs">
        {stillStudies.map((item) => (
          <button key={item.id} type="button" aria-pressed={item.id === study.id} onClick={() => onStudyChange(item.id)} title={`${item.chinese} · ${item.description}`}>
            <span className="still-study-number" aria-hidden="true">{item.number}</span>{item.name}
          </button>
        ))}
      </div>
      <label className="still-study-select">
        <span className="ds-visually-hidden">选择 Still 设计</span>
        <select aria-label="选择 Still 设计" value={study.id} onChange={(event) => onStudyChange(event.target.value)}>
          {stillStudies.map((item) => <option key={item.id} value={item.id}>{item.number} {item.name}</option>)}
        </select>
        <span aria-hidden="true">⌄</span>
      </label>
      <div className="still-edition-options" role="group" aria-label="Still styles">
        {stillEditions.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={item.id === edition.id}
            onClick={() => onChange(item.id)}
            title={`${item.chinese} · ${item.description}`}
            aria-label={item.name}
          >
            <span className="still-swatch" style={{ backgroundColor: item.background, borderColor: item.ink }} aria-hidden="true" />
            <span className="still-edition-name">{item.name}</span>
          </button>
        ))}
      </div>
      <Link
        className="still-controls-compare"
        to={`/designs/compare?left=quiet&right=quiet&leftEdition=${edition.id}&rightEdition=${edition.id}&leftStudy=${study.id}&rightStudy=${nextStudy.id}`}
        aria-label="并排比较 Still 风格"
        title="并排比较"
      >
        <svg viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true">
          <rect x="2.5" y="3.5" width="6" height="13" rx=".5" stroke="currentColor" />
          <rect x="11.5" y="3.5" width="6" height="13" rx=".5" stroke="currentColor" />
        </svg>
      </Link>
      <button className="still-controls-collapse" type="button" onClick={() => transitionStill(() => setCollapsed(true), 'controls')} aria-label="收起 Still 风格切换栏">−</button>
    </aside>
  )
}

export default function StillStudio({ finalized = false, mobileStudy }: { finalized?: boolean; mobileStudy?: MobileStudyId }) {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [fallback] = useState(() => ({ edition: initialStillEdition(), study: initialStillStudy() }))
  const requestedEdition = getStillEdition(params.get('edition')) ?? fallback.edition
  const requestedStudy = finalized ? stillStudies[0] : getStillStudy(params.get('study')) ?? fallback.study
  const [{ edition, study }, setDesign] = useState(() => ({ edition: requestedEdition, study: requestedStudy }))
  const lastRequested = useRef({ edition: requestedEdition, study: requestedStudy })
  const embedded = params.get('embed') === '1'
  const reviewing = !finalized && !embedded && params.get('review') === '1'

  useEffect(() => {
    if (lastRequested.current.edition.id === requestedEdition.id && lastRequested.current.study.id === requestedStudy.id) return
    const kind = lastRequested.current.study.id === requestedStudy.id ? 'edition' : 'study'
    lastRequested.current = { edition: requestedEdition, study: requestedStudy }
    transitionStill(() => setDesign({ edition: requestedEdition, study: requestedStudy }), kind)
  }, [requestedEdition, requestedStudy])

  useLayoutEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--paper', edition.background)
    root.style.setProperty('--still-screen', edition.background)
    root.style.backgroundColor = edition.background
    root.style.colorScheme = edition.scheme
    document.body.style.backgroundColor = edition.background
    return () => {
      root.style.removeProperty('--paper')
      root.style.removeProperty('--still-screen')
      root.style.removeProperty('background-color')
      root.style.removeProperty('color-scheme')
      document.body.style.removeProperty('background-color')
    }
  }, [edition])

  useEffect(() => {
    document.title = finalized ? 'Zekun Wang' : `Zekun Wang — Still / ${study.name} / ${edition.name}`
    document.documentElement.lang = 'en'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', edition.background)
    if (!embedded) {
      try {
        localStorage.setItem(stillEditionStorageKey, edition.id)
        localStorage.setItem(stillStudyStorageKey, study.id)
      } catch { /* Style switching also works without storage. */ }
    }
    return () => {
      document.title = 'Zekun Wang'
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#000000')
    }
  }, [edition, study, embedded, finalized])

  function changeEdition(value: string) {
    const next = new URLSearchParams(params)
    next.set('edition', value)
    navigate({ search: `?${next}`, hash: location.hash }, { preventScrollReset: true, replace: value === requestedEdition.id })
  }

  function changeStudy(value: string) {
    const next = new URLSearchParams(params)
    next.set('study', value)
    navigate({ search: `?${next}`, hash: location.hash }, { preventScrollReset: true, replace: value === requestedStudy.id })
  }

  return (
    <div className="still-studio" data-preview={reviewing ? 'review' : 'clean'}>
      <Quiet edition={edition.id} study={study.id} onEditionChange={changeEdition} mobileStudy={mobileStudy} />
      {reviewing && <EditionControls edition={edition} study={study} onChange={changeEdition} onStudyChange={changeStudy} />}
    </div>
  )
}
