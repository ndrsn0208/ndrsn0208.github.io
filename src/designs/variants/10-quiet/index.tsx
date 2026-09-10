import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react'
import {
  Arrow,
  citationFor,
  featuredPapers,
  paperHref,
  papers,
  paperSummary,
  profile,
  topics,
  type Publication,
} from '../../shared'
import { getStillEdition, type StillEditionId } from '../../still/editions'
import StillNavigation, { type StillDestination } from '../../still/StillNavigation'
import AppearanceSwitch from '../../still/AppearanceSwitch'
import AdaptiveNavigation from '../../still/AdaptiveNavigation'
import SplitPane, { useSplitLayout } from '../../still/SplitPane'
import InfoCopy from '../../still/InfoCopy'
import { getStillStudy, type StillStudyId } from '../../still/studies'
import LensArtwork from '../../still/studies/lens/Artwork'
import DriftArtwork from '../../still/studies/drift/Artwork'
import FrameArtwork from '../../still/studies/frame/Artwork'
import { reducedMotion, stillEase, transitionStill } from '../../still/transitions'
import './style.css'
import '../../still/black.css'
import '../../still/paper.css'
import '../../still/centered.css'
import '../../still/motion.css'
import '../../still/glass.css'
import '../../still/studies/lens/style.css'
import '../../still/studies/drift/style.css'
import '../../still/studies/frame/style.css'
import '../../still/adaptive-navigation.css'
import '../../still/split-layout.css'

const artworks: Record<StillStudyId, ComponentType> = { lens: LensArtwork, drift: DriftArtwork, frame: FrameArtwork }

const recentPaper = featuredPapers[0] ?? papers[0]
const yearRange = `${Math.min(...papers.map((paper) => paper.year))}–${Math.max(...papers.map((paper) => paper.year))}`

function panelForHash(hash: string): StillDestination | null {
  const name = hash.slice(1)
  return name === 'publications' || name === 'about' || name === 'contact' || name === 'cv' ? name : null
}

function CurriculumVitae({ active }: { active: boolean }) {
  const [visited, setVisited] = useState(active)
  useEffect(() => { if (active) setVisited(true) }, [active])
  return (
    <section className="quiet-panel-copy quiet-cv-content" aria-labelledby="quiet-cv-title">
      <p className="quiet-eyebrow">CV</p>
      <h2 id="quiet-cv-title" tabIndex={-1}>Curriculum vitae.</h2>
      <div className="quiet-cv-actions">
        <a href={profile.cv} target="_blank" rel="noreferrer">Open PDF <Arrow className="quiet-arrow" /></a>
        <a href={profile.cv} download="Zekun-Wang-CV.pdf">Download <span aria-hidden="true">↓</span></a>
      </div>
      {(active || visited) && (
        <iframe className="quiet-cv-preview" title="Zekun Wang — Curriculum vitae PDF" src={`${profile.cv}#toolbar=0&navpanes=0&view=FitH`} />
      )}
    </section>
  )
}

function QuietMark() {
  return (
    <svg className="quiet-mark" viewBox="0 0 160 180" fill="none" aria-hidden="true">
      <path className="quiet-mark-guide" d="M80 12v136M12 80h136" />
      <circle className="quiet-mark-outline" cx="80" cy="80" r="55" />
      <path className="quiet-mark-arc" d="M80 25a55 55 0 0 1 55 55M80 43a37 37 0 0 1 37 37M80 61a19 19 0 0 1 19 19" />
      <path className="quiet-mark-arc" d="M80 135a55 55 0 0 1-55-55M80 117a37 37 0 0 1-37-37M80 99a19 19 0 0 1-19-19" />
      <circle cx="80" cy="80" r="3" fill="currentColor" />
      <path className="quiet-mark-guide" d="M69 167h22" />
    </svg>
  )
}

function QuietPaper({ paper, inline = false }: { paper: Publication; inline?: boolean }) {
  const [copyStatus, setCopyStatus] = useState('')
  const [showCitation, setShowCitation] = useState(false)
  const reduce = useReducedMotion()
  const present = useIsPresent()
  const articleRef = useRef<HTMLElement>(null)
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const expansionRef = useRef<Animation | null>(null)
  const contentAnimationRef = useRef<Animation | null>(null)
  const desiredOpen = useRef(false)
  const PaperHeading = inline ? 'h3' : 'h2'
  const DetailHeading = inline ? 'h4' : 'h3'

  useEffect(() => {
    if (articleRef.current) articleRef.current.inert = !present
  }, [present])

  useEffect(() => () => {
    expansionRef.current?.cancel()
    contentAnimationRef.current?.cancel()
  }, [])

  function toggleDetails() {
    const details = detailsRef.current
    const content = contentRef.current
    if (!details || !content) return
    const open = !desiredOpen.current
    desiredOpen.current = open
    const from = details.getBoundingClientRect().height
    const opacity = details.open ? getComputedStyle(content).opacity : '0'
    expansionRef.current?.cancel()
    contentAnimationRef.current?.cancel()
    content.inert = !open
    if (reducedMotion()) {
      details.open = open
      delete details.dataset.animating
      return
    }
    details.open = true
    const to = open ? details.getBoundingClientRect().height : details.querySelector('summary')!.getBoundingClientRect().height
    details.dataset.animating = 'true'
    const animation = details.animate(
      [{ height: `${from}px` }, { height: `${to}px` }],
      { duration: open ? 420 : 280, easing: stillEase, fill: 'both' },
    )
    expansionRef.current = animation
    contentAnimationRef.current = content.animate(
      [{ opacity }, { opacity: open ? 1 : 0 }],
      { duration: open ? 300 : 180, easing: 'ease-out', fill: 'both' },
    )
    void animation.finished.then(() => {
      if (expansionRef.current !== animation) return
      details.open = open
      delete details.dataset.animating
      animation.cancel()
      contentAnimationRef.current?.cancel()
      expansionRef.current = null
    }).catch(() => {})
  }

  async function copyCitation() {
    try {
      await navigator.clipboard.writeText(citationFor(paper))
      setCopyStatus('Citation copied.')
    } catch {
      setShowCitation(true)
      setCopyStatus('Select the citation below to copy it.')
    }
  }

  return (
    <motion.article
      ref={articleRef}
      className="quiet-paper" aria-labelledby={`quiet-title-${paper.id}`}
      aria-hidden={!present || undefined}
      initial={reduce ? false : { opacity: 0, y: 7 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={!present ? { overflow: 'hidden', pointerEvents: 'none' } : undefined}
    >
      <p className="quiet-paper-meta">{paper.venue}</p>
      <PaperHeading id={`quiet-title-${paper.id}`} className="quiet-paper-title" tabIndex={-1}>
        {inline ? (
          <a href={paperHref(paper)} target="_blank" rel="noreferrer" className="quiet-paper-title-link">
            <span>{paper.title}</span><Arrow className="quiet-arrow" />
          </a>
        ) : paper.title}
      </PaperHeading>
      <p className="quiet-paper-summary">{paperSummary(paper)}</p>
      <details
        ref={detailsRef} className="quiet-paper-details" id={`quiet-details-${paper.id}`}
        onToggle={() => { if (!expansionRef.current) desiredOpen.current = Boolean(detailsRef.current?.open) }}
      >
        <summary onClick={(event) => { event.preventDefault(); toggleDetails() }}>
          <span className="quiet-details-closed">Details & authors</span>
          <span className="quiet-details-open">Close details</span>
          <span className="quiet-details-symbol" aria-hidden="true">+</span>
        </summary>
        <div ref={contentRef} className="quiet-paper-content">
          <DetailHeading>Authors</DetailHeading>
          <p className="quiet-authors">
            {paper.authors.map((author, index) => (
              <span key={`${author}-${index}`}>
                {index > 0 && ', '}
                {author === profile.name ? <strong>{author}</strong> : author}
              </span>
            ))}
          </p>
          <DetailHeading>Research summary</DetailHeading>
          <p className="quiet-research-summary">{paper.summary}</p>
          <ul className="quiet-paper-topics" aria-label="Research topics">
            {paper.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
          <div className="quiet-paper-links">
            <a href={paperHref(paper)} target="_blank" rel="noreferrer">
              Read paper <Arrow className="quiet-arrow" />
            </a>
            {paper.pdfUrl && (
              <a href={paper.pdfUrl} target="_blank" rel="noreferrer">
                PDF <Arrow className="quiet-arrow" />
              </a>
            )}
            {paper.arxivHtmlAvailable && paper.arxivHtmlUrl && (
              <a href={paper.arxivHtmlUrl} target="_blank" rel="noreferrer">
                HTML <Arrow className="quiet-arrow" />
              </a>
            )}
            <button type="button" onClick={copyCitation}>Copy citation</button>
          </div>
          <p className="quiet-copy-status" role="status">{copyStatus}</p>
          {showCitation && <p className="quiet-citation">{citationFor(paper)}</p>}
        </div>
      </details>
    </motion.article>
  )
}

export default function Quiet({ edition: preferredEdition, study: preferredStudy, onEditionChange }: {
  edition?: StillEditionId
  study?: StillStudyId
  onEditionChange?: (edition: StillEditionId) => void
} = {}) {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const wide = useSplitLayout()
  const reduce = useReducedMotion()
  const edition = preferredEdition ?? getStillEdition(params.get('edition'))?.id ?? 'black'
  const study = preferredStudy ?? getStillStudy(params.get('study'))?.id
  const inlinePublications = study === 'lens'
  const desktop = inlinePublications && wide
  const panel = panelForHash(location.hash)
  const previousPanel = useRef(panel)
  const previousDesktop = useRef(desktop)
  const Artwork = study ? artworks[study] : undefined
  const [mode, setMode] = useState<'home' | 'work'>('home')
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('all')
  const [readerRequest, setReaderRequest] = useState<string | null>(null)
  const [info, setInfo] = useState<'about' | 'contact' | null>(null)
  const [dialogContent, setDialogContent] = useState<'about' | 'contact'>('about')
  const [emailStatus, setEmailStatus] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const readerTitleRef = useRef<HTMLHeadingElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const workTriggerRef = useRef<HTMLElement | null>(null)
  const dialogTriggerRef = useRef<HTMLElement | null>(null)
  const returnFocusRef = useRef(false)
  const dialogAnimationRef = useRef<Animation | null>(null)
  const unlockScrollRef = useRef<(() => void) | null>(null)

  useLayoutEffect(() => {
    if (!inlinePublications) return
    document.documentElement.dataset.stillLayout = desktop ? 'split' : 'inline'
    return () => { delete document.documentElement.dataset.stillLayout }
  }, [inlinePublications, desktop])

  useEffect(() => {
    if (!inlinePublications || desktop || window.location.hash !== '#publications') return
    let active = true
    void document.fonts.ready.then(() => {
      if (!active) return
      rootRef.current?.querySelector('#publications')?.scrollIntoView({ behavior: 'instant', block: 'start' })
      readerTitleRef.current?.focus({ preventScroll: true })
    })
    return () => { active = false }
  }, [inlinePublications, desktop])

  function focusPanel(destination: StillDestination) {
    const pane = rootRef.current?.querySelector<HTMLElement>(`#quiet-pane-${destination}`)
    // Returning to a scrolled reader must not pull it back to its heading.
    const target = pane && pane.scrollTop > 32 ? pane : pane?.querySelector<HTMLElement>('h2')
    target?.focus({ preventScroll: true })
  }

  function openPanel(destination: StillDestination) {
    if (destination === 'publications') setMode('work')
    if (destination === 'contact') setEmailStatus('')
    if (panel === destination) { focusPanel(destination); return }
    navigate({ pathname: location.pathname, search: location.search, hash: `#${destination}` }, { preventScrollReset: true })
  }

  function closePanel() {
    setMode('home')
    navigate({ pathname: location.pathname, search: location.search, hash: '#introduction' }, { preventScrollReset: true })
  }

  useLayoutEffect(() => {
    if (desktop) {
      if (panel) focusPanel(panel)
      else if (previousPanel.current) {
        rootRef.current?.querySelector<HTMLElement>(`.quiet-home [data-nav-destination="${previousPanel.current}"]`)?.focus({ preventScroll: true })
      }
    }
    previousPanel.current = panel
  }, [desktop, panel])

  useLayoutEffect(() => {
    if (previousDesktop.current === desktop) return
    previousDesktop.current = desktop
    if (!inlinePublications) return
    if (desktop) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      if (info) {
        openPanel(info)
        setInfo(null)
      }
    } else if (panel === 'about' || panel === 'contact') {
      dialogTriggerRef.current = rootRef.current?.querySelector<HTMLElement>(`.quiet-home [data-nav-destination="${panel}"]`) ?? null
      setDialogContent(panel)
      setInfo(panel)
    }
  }, [desktop, inlinePublications, info, panel])

  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  const filteredPapers = papers.filter((paper) => {
    const searchable = [
      paper.title, paper.venue, paper.year, paper.arxivId,
      ...paper.authors, ...paper.tags, paperSummary(paper), paper.summary,
    ].join(' ').toLocaleLowerCase()
    return (topic === 'all' || paper.tags.includes(topic))
      && words.every((word) => searchable.includes(word))
  })
  const hasFilters = query.trim() !== '' || topic !== 'all'

  function openPublications(paperId?: string) {
    if (desktop) { openPanel('publications'); return }
    if (mode === 'home') workTriggerRef.current = document.activeElement as HTMLElement
    if (inlinePublications && !paperId) {
      setMode('work')
      return
    }
    const update = () => {
      if (paperId) {
        setQuery('')
        setTopic('all')
      }
      setMode('work')
      setReaderRequest(paperId ?? 'start')
    }
    if (mode === 'home') transitionStill(update, 'forward')
    else update()
  }

  function returnHome() {
    if (desktop) { closePanel(); return }
    if (inlinePublications) {
      setMode('home')
      return
    }
    if (mode === 'work') {
      returnFocusRef.current = true
      transitionStill(() => setMode('home'), 'back')
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }

  useEffect(() => {
    if (mode === 'work' && readerRequest) {
      const paperTitle = readerRequest === 'start'
        ? null
        : rootRef.current?.querySelector<HTMLElement>(`#quiet-title-${readerRequest}`)
      const details = readerRequest === 'start'
        ? null
        : rootRef.current?.querySelector<HTMLDetailsElement>(`#quiet-details-${readerRequest}`)
      if (details && !details.open) details.querySelector('summary')?.click()
      const destination = paperTitle ?? readerTitleRef.current
      destination?.focus({ preventScroll: true })
      if (paperTitle) paperTitle.scrollIntoView({ block: 'start', behavior: 'auto' })
      else window.scrollTo({ top: 0, behavior: 'auto' })
      setReaderRequest(null)
    }
    if (mode === 'home' && returnFocusRef.current) {
      returnFocusRef.current = false
      const trigger = workTriggerRef.current?.isConnected
        ? workTriggerRef.current
        : rootRef.current?.querySelector<HTMLElement>('.quiet-primary-nav .quiet-nav-publications')
      trigger?.focus({ preventScroll: true })
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [mode, readerRequest])

  function openInfo(panel: 'about' | 'contact') {
    if (desktop) { openPanel(panel); return }
    dialogTriggerRef.current = document.activeElement as HTMLElement
    setEmailStatus('')
    setDialogContent(panel)
    setInfo(panel)
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (desktop) {
      dialogAnimationRef.current?.cancel()
      if (dialog.open) dialog.close()
      unlockScrollRef.current?.()
      unlockScrollRef.current = null
      return
    }
    const wasOpen = dialog.open
    const currentStyle = getComputedStyle(dialog)
    const currentOpacity = currentStyle.opacity
    const currentTransform = currentStyle.transform
    const backdropOpacity = getComputedStyle(dialog, '::backdrop').opacity
    dialogAnimationRef.current?.cancel()
    if (info) {
      if (!unlockScrollRef.current) {
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        unlockScrollRef.current = () => { document.body.style.overflow = previousOverflow }
      }
      dialog.style.setProperty('--quiet-backdrop-enter', wasOpen ? backdropOpacity : '0')
      delete dialog.dataset.closing
      if (!dialog.open) dialog.showModal()
      if (!reducedMotion()) {
        dialogAnimationRef.current = dialog.animate(
          [{ opacity: wasOpen ? currentOpacity : 0, transform: wasOpen ? currentTransform : 'translateY(18px) scale(.975)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }],
          { duration: 380, easing: stillEase },
        )
      }
    } else if (dialog.open) {
      const finish = () => {
        dialog.close()
        delete dialog.dataset.closing
        unlockScrollRef.current?.()
        unlockScrollRef.current = null
      }
      if (reducedMotion()) { finish(); return }
      dialog.style.setProperty('--quiet-backdrop-exit', backdropOpacity)
      dialog.dataset.closing = 'true'
      const animation = dialog.animate(
        [{ opacity: currentOpacity, transform: currentTransform }, { opacity: 0, transform: 'translateY(10px) scale(.985)' }],
        { duration: 200, easing: 'ease-in', fill: 'forwards' },
      )
      dialogAnimationRef.current = animation
      void animation.finished.then(() => {
        if (dialogAnimationRef.current !== animation) return
        finish()
        animation.cancel()
      }).catch(() => {})
    }
  }, [info, desktop])

  useEffect(() => {
    if (reducedMotion()) return
    const elements = rootRef.current?.querySelectorAll<HTMLElement>(
      '.quiet-emblem, .quiet-introduction > .quiet-eyebrow, #quiet-name, .quiet-intro, .quiet-background, .quiet-navigation, .quiet-recent',
    )
    const animations = Array.from(elements ?? []).map((element, index) => element.animate(
      [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 480, delay: index * 35, easing: stillEase, fill: 'backwards' },
    ))
    return () => animations.forEach((animation) => animation.cancel())
  }, [])

  useEffect(() => () => {
    dialogAnimationRef.current?.cancel()
    unlockScrollRef.current?.()
  }, [])

  function resetSearch() {
    setQuery('')
    setTopic('all')
    searchRef.current?.focus()
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email)
      setEmailStatus('Email address copied.')
    } catch {
      setEmailStatus('You can select and copy the address above.')
    }
  }

  function changeAppearance(value: StillEditionId) {
    if (onEditionChange) { onEditionChange(value); return }
    transitionStill(() => {
      const next = new URLSearchParams(params)
      next.set('edition', value)
      navigate({ search: `?${next}`, hash: location.hash }, { preventScrollReset: true })
    }, 'edition')
  }

  function navigation(primary = false) {
    if (inlinePublications && primary) {
      return (
        <AdaptiveNavigation
          edition={edition}
          onEditionChange={changeAppearance}
          mode={mode}
          info={info}
          onPublications={() => openPublications()}
          onInfo={openInfo}
          panels={desktop ? { active: panel, onChange: openPanel } : undefined}
        />
      )
    }
    return (
      <div className={`quiet-navigation${primary ? '' : ' quiet-navigation-reading'}`}>
        <StillNavigation primary={primary} glass={Boolean(study) && !inlinePublications} inline={inlinePublications} mode={mode} info={info} onPublications={() => openPublications()} onInfo={openInfo} />
        {study && <AppearanceSwitch edition={edition} onChange={changeAppearance} glass={!inlinePublications} />}
      </div>
    )
  }

  return (
    <div
      ref={rootRef} className="design-surface quiet" data-mode={mode} data-edition={edition} data-study={study}
      data-layout={desktop ? 'split' : undefined} data-panel={desktop ? panel ?? 'home' : undefined} lang="en"
      onKeyDown={(event) => {
        if (desktop && panel && event.key === 'Escape' && !event.defaultPrevented && !(event.target as HTMLElement).matches('input, textarea, select')) {
          event.preventDefault()
          closePanel()
        }
      }}
    >
      <a className="quiet-skip" href="#quiet-main" onClick={(event) => {
        if (!desktop) return
        event.preventDefault()
        if (panel) focusPanel(panel)
        else rootRef.current?.querySelector<HTMLElement>('#quiet-main')?.focus({ preventScroll: true })
      }}>Skip to content</a>

      <header className="quiet-header quiet-shell" hidden={inlinePublications || mode !== 'work'}>
        <button className="quiet-signature" type="button" onClick={returnHome} aria-label="Zekun Wang, return to introduction">
          <span className="quiet-initials" aria-hidden="true">zw.</span>
          <span className="quiet-signature-note">Zekun Wang</span>
        </button>
        {navigation()}
      </header>

      <main id="quiet-main" className="quiet-main" tabIndex={-1}>
        <motion.section
          id="introduction" className="quiet-home quiet-shell"
          layout={desktop && !reduce ? 'position' : false}
          transition={{ layout: { duration: 0.76, ease: [0.22, 1, 0.36, 1] } }}
          hidden={!inlinePublications && mode !== 'home'} aria-labelledby="quiet-name" tabIndex={inlinePublications ? -1 : undefined}
        >
          <div className="quiet-emblem" aria-hidden="true">{Artwork ? <Artwork /> : <QuietMark />}</div>
          <div className="quiet-introduction">
            <p className="quiet-eyebrow">Research · Computer science</p>
            <h1 id="quiet-name">{profile.name}</h1>
            <p className="quiet-intro">
              {profile.researchStatement.split(/(deployment-time)/).map((part, index) => (
                part === 'deployment-time' ? <span className="quiet-keep" key={index}>{part}</span> : part
              ))}
            </p>
            <dl className="quiet-background" aria-label="Education and industry experience">
              <div className="quiet-education">
                <dt>Education</dt>
                <dd>
                  <p className="quiet-experience-role">{profile.education.degree}, <span className="quiet-experience-field">{profile.education.field}</span></p>
                  <p className="quiet-experience-meta">
                    <span className="quiet-experience-organization">{profile.education.institution}</span>
                    <span className="quiet-experience-divider" aria-hidden="true">·</span>
                    <span className="quiet-experience-dates">{profile.education.startYear}–{profile.education.endYear}{profile.education.expected ? ' (expected)' : ''}</span>
                  </p>
                  <p className="quiet-advisor">
                    Advisor: <a href={profile.advisorUrl} target="_blank" rel="noreferrer">{profile.advisor}</a>
                  </p>
                </dd>
              </div>
              <div className="quiet-industry">
                <dt>Industry experience</dt>
                {profile.industryExperience.map((experience) => (
                  <dd key={`${experience.role}-${experience.organization}`}>
                    <p className="quiet-experience-role">{experience.role}</p>
                    <p className="quiet-experience-meta"><span className="quiet-experience-organization">{experience.organization}</span></p>
                  </dd>
                ))}
              </div>
            </dl>
            {navigation(true)}
          </div>
          {!inlinePublications && <aside className="quiet-recent" aria-labelledby="quiet-recent-label">
            <div className="quiet-recent-caption">
              <h2 id="quiet-recent-label">Latest publication</h2>
              <span>{recentPaper.venue}</span>
            </div>
            <button type="button" className="quiet-recent-paper" onClick={() => openPublications(recentPaper.id)}>
              <span>{recentPaper.title}</span>
              <Arrow direction="right" className="quiet-arrow" />
            </button>
          </aside>}
        </motion.section>

        <div className="quiet-panels" data-open={desktop && Boolean(panel) || undefined}>
          <div className="quiet-panel-toolbar" aria-hidden={!desktop || !panel || undefined}>
            <button type="button" onClick={closePanel} aria-label="Close panel" tabIndex={desktop && panel ? 0 : -1}>Close <span aria-hidden="true">×</span></button>
          </div>
          <SplitPane
            name="publications" enabled={desktop} active={!desktop || panel === 'publications'}
            titleId="publications" enterDelay={previousPanel.current ? 0.04 : 0.16}
          >
            <section
              id="quiet-work"
              className={`quiet-reader quiet-shell${inlinePublications ? ' quiet-publications' : ''}`}
              hidden={!inlinePublications && mode !== 'work'} aria-labelledby={inlinePublications ? 'publications' : 'quiet-reader-title'}
              onFocusCapture={() => { if (inlinePublications) setMode('work') }}
            >
              <div className="quiet-reader-heading">
                {inlinePublications ? (
                  <div className="quiet-publications-heading">
                    <h2 id="publications" ref={readerTitleRef} tabIndex={-1}>Publications</h2>
                    <span>{yearRange}</span>
                  </div>
                ) : (
                  <>
                    <button type="button" className="quiet-back" onClick={returnHome}>
                      <span aria-hidden="true">←</span> Back to introduction
                    </button>
                    <p className="quiet-eyebrow">{yearRange}</p>
                    <h1 id="quiet-reader-title" ref={readerTitleRef} tabIndex={-1}>Publications</h1>
                    <p className="quiet-reader-intro">{profile.researchStatement}</p>
                  </>
                )}
              </div>

              <div className="quiet-reading-layout">
                <aside className="quiet-reader-aside" aria-label="Find a paper">
                  <form className="quiet-search" role="search" onSubmit={(event) => event.preventDefault()}>
                    <label htmlFor="quiet-search-input">Search publications</label>
                    <div className="quiet-search-field">
                      <svg className="quiet-search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
                        <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                      <input ref={searchRef} id="quiet-search-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={inlinePublications ? 'Search papers…' : 'Title, author, idea…'} autoComplete="off" />
                    </div>
                    <label htmlFor="quiet-topic">Research topic</label>
                    <select id="quiet-topic" value={topic} onChange={(event) => setTopic(event.target.value)}>
                      <option value="all">All topics</option>
                      {topics.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                    <p className="quiet-result-count" role="status">
                      {hasFilters ? `${filteredPapers.length} of ${papers.length} papers` : `${papers.length} papers · newest first`}
                    </p>
                    {hasFilters && <button className="quiet-reset" type="button" onClick={resetSearch}>Clear search & filters <span aria-hidden="true">×</span></button>}
                  </form>
                  {!inlinePublications && <div className="quiet-question">
                    <span className="quiet-eyebrow">A continuing question</span>
                    <p>{profile.researchQuestion}</p>
                  </div>}
                  {!inlinePublications && <a className="quiet-scholar-link" href={profile.scholar} target="_blank" rel="noreferrer">
                    Google Scholar <Arrow className="quiet-arrow" />
                  </a>}
                </aside>

                <div className="quiet-paper-list" role="region" aria-label="Publications">
                  <AnimatePresence initial={false}>
                    {filteredPapers.map((paper) => <QuietPaper key={paper.id} paper={paper} inline={inlinePublications} />)}
                  </AnimatePresence>
                  {filteredPapers.length === 0 && (
                    <div className="quiet-empty">
                      <h2>No papers found.</h2>
                      <p>Try a different word, an author’s name, or another research topic.</p>
                      <button type="button" className="quiet-read-button" onClick={resetSearch}>Show all {papers.length} papers <Arrow direction="right" className="quiet-arrow" /></button>
                    </div>
                  )}
                  {filteredPapers.length > 0 && (
                    <div className="quiet-reader-end">
                      <p>{hasFilters ? 'That’s everything for this search.' : 'Thank you for reading.'}</p>
                      {inlinePublications ? (
                        <a className="quiet-back" href="#introduction" onClick={(event) => { if (desktop) event.preventDefault(); returnHome() }}>Back to introduction <span aria-hidden="true">↑</span></a>
                      ) : (
                        <button type="button" className="quiet-back" onClick={returnHome}>Back to introduction <span aria-hidden="true">↗</span></button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </SplitPane>
          {(['about', 'contact'] as const).map((name) => (
            <SplitPane
              key={name} name={name} enabled={desktop} active={desktop && panel === name}
              titleId={`quiet-${name}-title`} enterDelay={previousPanel.current ? 0.04 : 0.16}
            >
              <section className="quiet-panel-copy" aria-labelledby={`quiet-${name}-title`}>
                <p className="quiet-eyebrow">{name === 'about' ? 'About' : 'Contact'}</p>
                <h2 id={`quiet-${name}-title`} tabIndex={-1}>{name === 'about' ? 'A little about me.' : 'Let’s talk.'}</h2>
                {desktop && <InfoCopy panel={name} emailStatus={emailStatus} onCopyEmail={copyEmail} onCV={() => openPanel('cv')} />}
              </section>
            </SplitPane>
          ))}
          <SplitPane
            name="cv" enabled={desktop} active={desktop && panel === 'cv'}
            titleId="quiet-cv-title" enterDelay={previousPanel.current ? 0.04 : 0.16}
          >
            <CurriculumVitae active={desktop && panel === 'cv'} />
          </SplitPane>
        </div>
      </main>

      <footer className="quiet-footer quiet-shell" hidden={desktop}>
        <a href={`mailto:${profile.email}`}>{profile.email} <Arrow className="quiet-arrow" /></a>
        <span className="quiet-footer-note">Continual learning. Adaptation. Generalization.</span>
        <a href={profile.scholar} target="_blank" rel="noreferrer">Scholar <Arrow className="quiet-arrow" /></a>
      </footer>

      <dialog
        ref={dialogRef}
        className="quiet-info-dialog"
        aria-labelledby="quiet-info-title"
        onCancel={(event) => { event.preventDefault(); setInfo(null) }}
        onClose={() => {
          if (dialogRef.current?.open) return
          setInfo(null)
          if (desktop) return
          const trigger = dialogTriggerRef.current
          const destination = trigger?.dataset.navDestination
          const available = (element: HTMLElement) => element.getClientRects().length > 0
            && !element.closest('[hidden], [inert], [aria-hidden="true"]')
          const replacement = destination ? Array.from(rootRef.current?.querySelectorAll<HTMLElement>(`[data-nav-destination="${destination}"]`) ?? []).find(available) : null
          const target = trigger?.isConnected && available(trigger) ? trigger : replacement
          target?.focus({ preventScroll: true })
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return
          const bounds = event.currentTarget.getBoundingClientRect()
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setInfo(null)
        }}
      >
        <div className="quiet-dialog-top">
          <span className="quiet-eyebrow">{dialogContent === 'about' ? 'About' : 'Contact'}</span>
          <button type="button" onClick={() => setInfo(null)} aria-label="Close dialog">Close <span aria-hidden="true">×</span></button>
        </div>
        <h2 id="quiet-info-title">{dialogContent === 'about' ? 'A little about me.' : 'Let’s talk.'}</h2>
        <InfoCopy panel={dialogContent} emailStatus={emailStatus} onCopyEmail={copyEmail} />
      </dialog>
    </div>
  )
}
