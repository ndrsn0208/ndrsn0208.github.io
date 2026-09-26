import { useId, useLayoutEffect, useRef, useState } from 'react'
import { LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Arrow, papers, profile } from '../shared'
import { stillSpring, transitionStill } from './transitions'
import { useGlassLight } from './useGlassLight'

export type StillDestination = 'publications' | 'about' | 'contact' | 'cv'
type Destination = StillDestination

function NavigationIcon({ destination }: { destination: Destination }) {
  return (
    <svg className="quiet-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {destination === 'publications' && <>
        <path d="M12 5.5C9.6 3.9 6.3 3.9 3.5 5v14c2.8-1.1 6.1-1.1 8.5.5 2.4-1.6 5.7-1.6 8.5-.5V5C17.7 3.9 14.4 3.9 12 5.5Z" />
        <path d="M12 5.5v14M6.5 8.5c.9-.1 1.7 0 2.5.3M15 8.8c.8-.3 1.6-.4 2.5-.3" />
      </>}
      {destination === 'about' && <>
        <circle cx="12" cy="7.5" r="3.5" />
        <path d="M4.5 20v-1c0-3.6 3.2-5.5 7.5-5.5s7.5 1.9 7.5 5.5v1" />
      </>}
      {destination === 'contact' && <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m4 6 6.6 5.3a2.2 2.2 0 0 0 2.8 0L20 6" />
      </>}
      {destination === 'cv' && <>
        <path d="M13.5 3.5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10M13.5 3.5V8a2 2 0 0 0 2 2H20M13.5 3.5 20 10" />
        <path d="M8 13.5h8M8 16.5h5" />
      </>}
    </svg>
  )
}

export default function StillNavigation({
  primary = false, glass = false, inline = false, docked = false, inactive = false, contactInline = false, mode, info, onPublications, onInfo, panels,
}: {
  primary?: boolean
  glass?: boolean
  inline?: boolean
  docked?: boolean
  inactive?: boolean
  contactInline?: boolean
  mode: 'home' | 'work'
  info: 'about' | 'contact' | null
  onPublications: () => void
  onInfo: (panel: 'about' | 'contact') => void
  panels?: { active: Destination | null; onChange: (destination: Destination) => void }
}) {
  const id = useId()
  const reduce = useReducedMotion()
  const light = useGlassLight()
  const navigate = useNavigate()
  const navRef = useRef<HTMLElement>(null)
  const [hovered, setHovered] = useState<Destination | 'blog' | null>(null)
  const active = hovered ?? (panels ? panels.active : info ?? 'publications')
  const transition = reduce ? { duration: 0 } : glass ? stillSpring : { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const }
  const feedback = {
    whileHover: reduce || !glass ? undefined : { y: -1 },
    whileTap: reduce ? undefined : glass ? { scale: 0.96, y: 0 } : { opacity: 0.65 },
    transition,
  }
  const indicator = (destination: Destination | 'blog') => active === destination && (
    <motion.span className="quiet-nav-indicator" layoutId="underline" transition={transition} aria-hidden="true" />
  )
  const publicationsLabel = (
    <>
      <NavigationIcon destination="publications" />
      <span className="quiet-nav-label">Publications</span>
      <span className="quiet-nav-caption" aria-hidden="true">{papers.length} papers</span>
      {indicator('publications')}
    </>
  )

  useLayoutEffect(() => {
    if (navRef.current) navRef.current.inert = inactive
    if (inactive) setHovered(null)
  }, [inactive])

  return (
    <LayoutGroup id={id}>
      <motion.nav
        ref={navRef}
        {...(glass ? light : {})}
        className={`quiet-nav ${primary ? 'quiet-primary-nav' : 'quiet-reading-nav'}${glass ? ' still-glass' : ''}${docked ? ' quiet-dock-nav' : ''}`}
        aria-label="Main navigation"
        aria-hidden={inactive || undefined}
        data-inactive={inactive || undefined}
        data-destination-count={4}
        onMouseLeave={() => setHovered(null)}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHovered(null) }}
      >
        {inline ? (
          <motion.a
            {...feedback} className="quiet-nav-work quiet-nav-publications"
            data-nav-destination="publications"
            href="#publications" aria-label="Publications"
            aria-expanded={panels ? panels.active === 'publications' : undefined}
            aria-controls={panels ? 'quiet-pane-publications' : undefined}
            onHoverStart={() => setHovered('publications')} onFocus={() => setHovered('publications')}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
              if (panels) {
                event.preventDefault()
                panels.onChange('publications')
              } else onPublications()
            }}
          >{publicationsLabel}</motion.a>
        ) : (
          <motion.button
            {...feedback} className="quiet-nav-work quiet-nav-publications" type="button"
            data-nav-destination="publications"
            aria-label="Publications"
            aria-expanded={mode === 'work'} aria-controls="quiet-work"
            onHoverStart={() => setHovered('publications')} onFocus={() => setHovered('publications')} onClick={onPublications}
          >{publicationsLabel}</motion.button>
        )}
        {contactInline && <motion.a
          {...feedback}
          href="/blog"
          aria-label="Blog"
          data-nav-destination="blog"
          onHoverStart={() => { setHovered('blog'); void import('../../blog/BlogIndex') }}
          onFocus={() => setHovered('blog')}
          onClick={async (event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
            event.preventDefault()
            await import('../../blog/BlogIndex')
            transitionStill(() => navigate('/blog'), 'forward')
          }}
        ><span className="quiet-nav-label">Blog</span><span className="quiet-nav-caption" aria-hidden="true">Research notes</span>{indicator('blog')}</motion.a>}
        <motion.button
          {...feedback} type="button" aria-label="About" aria-haspopup={panels ? undefined : 'dialog'}
          aria-expanded={panels ? panels.active === 'about' : info === 'about'}
          aria-controls={panels ? 'quiet-pane-about' : undefined}
          data-nav-destination="about"
          onHoverStart={() => setHovered('about')} onFocus={() => setHovered('about')}
          onClick={() => panels ? panels.onChange('about') : onInfo('about')}
        ><NavigationIcon destination="about" /><span className="quiet-nav-label">About</span><span className="quiet-nav-caption" aria-hidden="true">Background</span>{indicator('about')}</motion.button>
        {!contactInline && <motion.button
          {...feedback} type="button" aria-label="Contact" aria-haspopup={panels ? undefined : 'dialog'}
          aria-expanded={panels ? panels.active === 'contact' : info === 'contact'}
          aria-controls={panels ? 'quiet-pane-contact' : undefined}
          data-nav-destination="contact"
          onHoverStart={() => setHovered('contact')} onFocus={() => setHovered('contact')}
          onClick={() => panels ? panels.onChange('contact') : onInfo('contact')}
        ><NavigationIcon destination="contact" /><span className="quiet-nav-label">Contact</span><span className="quiet-nav-caption" aria-hidden="true">Get in touch</span>{indicator('contact')}</motion.button>}
        {panels ? (
          <motion.button
            {...feedback} type="button" aria-label="CV (PDF)"
            aria-expanded={panels.active === 'cv'} aria-controls="quiet-pane-cv"
            data-nav-destination="cv"
            onHoverStart={() => setHovered('cv')} onFocus={() => setHovered('cv')}
            onClick={() => panels.onChange('cv')}
          ><span className="quiet-nav-label">CV</span>{indicator('cv')}</motion.button>
        ) : <motion.a
          {...feedback} href={profile.cv} target="_blank" rel="noreferrer" aria-label="CV (PDF)"
          data-nav-destination="cv"
          onHoverStart={() => setHovered('cv')} onFocus={() => setHovered('cv')}
        ><NavigationIcon destination="cv" /><span className="quiet-nav-label">CV <Arrow className="quiet-arrow" /></span><span className="quiet-nav-caption" aria-hidden="true">PDF document</span>{indicator('cv')}</motion.a>}
      </motion.nav>
    </LayoutGroup>
  )
}
