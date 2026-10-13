import { createAdaptDom, type AdaptTarget } from './dom'
import { createAdaptEffects } from './effects'
import { createCharacterLayer } from './characters'
import { parseCharacterId } from './graphemes'
import { createAdaptStore } from './store'
import {
  ADAPT_LIMITS, clamp, makeAdaptId,
  type AdaptPage, type AdaptPoint, type AdaptSelection, type AdaptStroke,
  type AdaptTool, type AdaptWeapon, type ElementPatch, type LayoutKind,
} from './model'

type Store = ReturnType<typeof createAdaptStore>
type Dom = ReturnType<typeof createAdaptDom>
type Effects = ReturnType<typeof createAdaptEffects>
type Characters = ReturnType<typeof createCharacterLayer>

export interface EngineSettings {
  tool: AdaptTool
  weapon: AdaptWeapon
  color: string
  size: number
}

interface TargetSession {
  target: AdaptTarget
  base: ElementPatch
  rect: DOMRect
  scrollY: number
  seed: number
}

interface Gesture {
  pointerId: number
  tool: AdaptTool
  startX: number
  startY: number
  startDocumentY: number
  lastX: number
  lastY: number
  started: number
  lastStep: number
  lastScan: number
  lastBurst: number
  changed: boolean
  moved: boolean
  working: AdaptPage
  targets: Map<string, TargetSession>
  drag?: { target: AdaptTarget; base: ElementPatch }
  stroke?: AdaptStroke
}

function clonePage(page: AdaptPage): AdaptPage {
  return {
    elements: Object.fromEntries(Object.entries(page.elements).map(([key, patch]) => [key, { ...patch }])),
    strokes: page.strokes.slice(),
    diffusions: page.diffusions.slice(),
    layout: { ...page.layout },
  }
}

function fingerprint(value: string): number {
  let seed = 2166136261
  for (let i = 0; i < value.length; i++) seed = Math.imul(seed ^ value.charCodeAt(i), 16777619)
  return seed >>> 0
}

function randomAt(seed: number, index: number): number {
  let value = Math.imul(seed ^ index, 0x45d9f3b)
  value = Math.imul(value ^ value >>> 16, 0x45d9f3b)
  return ((value ^ value >>> 16) >>> 0) / 4294967295
}

function noise(seed: number, time: number): number {
  const index = Math.floor(time)
  const t = time - index
  const smooth = t * t * (3 - 2 * t)
  return (randomAt(seed, index) * (1 - smooth) + randomAt(seed, index + 1) * smooth) * 2 - 1
}

function hex(value: string): string {
  if (/^#[\da-f]{6}$/i.test(value)) return value
  if (/^#[\da-f]{3}$/i.test(value)) return `#${value.slice(1).split('').map(c => c + c).join('')}`
  const rgb = value.match(/[\d.]+/g)
  return rgb && rgb.length >= 3
    ? `#${rgb.slice(0, 3).map(n => clamp(Math.round(Number(n)), 0, 255).toString(16).padStart(2, '0')).join('')}`
    : '#484d46'
}

function mixColor(a: string, b: string, amount: number): string {
  const from = hex(a), to = hex(b)
  return `#${[1, 3, 5].map(index => {
    const x = parseInt(from.slice(index, index + 2), 16)
    const y = parseInt(to.slice(index, index + 2), 16)
    return Math.round(x + (y - x) * clamp(amount, 0, 1)).toString(16).padStart(2, '0')
  }).join('')}`
}

function documentPoint(event: PointerEvent): AdaptPoint {
  return { x: event.clientX / Math.max(1, window.innerWidth), y: event.clientY + window.scrollY, pressure: event.pressure || .5 }
}

function editableField(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest('input,textarea,select,[contenteditable="true"]')
}

function protectedUi(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest('[data-adapt-ui]')
}

export class PlaygroundEngine {
  private readonly dom: Dom
  private readonly effects: Effects
  private readonly characters: Characters
  private readonly store: Store
  private readonly pageKey: string
  private readonly outline: HTMLElement
  private readonly onSelection: (selection: AdaptSelection | null) => void
  private readonly onBrowse: () => void
  private readonly motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  private readonly cleanups: (() => void)[] = []
  private page: AdaptPage
  private gesture: Gesture | null = null
  private selectedId: string | null = null
  private editPreview: ElementPatch | null = null
  private settings: EngineSettings
  private frame = 0
  private resizeTimer: ReturnType<typeof setTimeout> | undefined
  private spaceHeld = false
  private suppressGestureClick = false
  private cursor: { x: number; y: number } | null = null
  private destroyed = false

  constructor(options: {
    canvas: HTMLCanvasElement
    outline: HTMLElement
    store: Store
    pageKey: string
    settings: EngineSettings
    onSelection: (selection: AdaptSelection | null) => void
    onBrowse: () => void
  }) {
    this.store = options.store
    this.pageKey = options.pageKey
    this.settings = options.settings
    this.outline = options.outline
    this.onSelection = options.onSelection
    this.onBrowse = options.onBrowse
    this.page = this.store.getPage(this.pageKey)
    this.dom = createAdaptDom()
    this.dom.setPageKey(this.pageKey)
    this.dom.apply(this.page)
    this.effects = createAdaptEffects(options.canvas)
    document.documentElement.dataset.adaptActive = 'true'
    document.documentElement.dataset.adaptLayout = this.page.layout.kind
    this.characters = createCharacterLayer(this.dom)
    this.characters.apply(this.page)
    this.syncTool()

    const pointerDown = (event: PointerEvent) => this.pointerDown(event)
    const pointerMove = (event: PointerEvent) => this.pointerMove(event)
    const pointerUp = (event: PointerEvent) => {
      if (this.gesture?.pointerId !== event.pointerId) return
      event.preventDefault()
      event.stopPropagation()
      this.finishGesture()
    }
    const click = (event: MouseEvent) => {
      if (protectedUi(event.target) || editableField(event.target)) return
      const action = event.target instanceof Element && this.characters.actionDestroyed(event.target)
      if (action || (event.detail !== 0 && this.characters.blockedAt(event.clientX, event.clientY))) {
        event.preventDefault()
        event.stopImmediatePropagation()
        return
      }
      if (event.detail !== 0 && this.suppressGestureClick) {
        this.suppressGestureClick = false
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }
    const keyDown = (event: KeyboardEvent) => this.keyDown(event)
    const keyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space' && this.spaceHeld) {
        this.spaceHeld = false
        this.syncTool()
        this.requestPaint()
      }
    }
    const blur = () => {
      this.finishGesture()
      this.commitEditPreview()
      this.spaceHeld = false
      this.cursor = null
      this.syncTool()
      this.store.flush()
      this.requestPaint()
    }
    const visibility = () => {
      if (document.hidden) {
        blur()
        cancelAnimationFrame(this.frame)
        this.frame = 0
      } else this.requestPaint()
    }
    const scroll = () => this.requestPaint()
    const resize = () => {
      this.finishGesture()
      this.commitEditPreview()
      this.cursor = null
      clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => {
        if (this.destroyed) return
        this.characters.clear()
        this.dom.rebase()
        this.dom.refresh()
        this.dom.apply(this.page)
        this.characters.apply(this.page)
        this.requestPaint()
      }, 120)
      this.requestPaint()
    }
    document.addEventListener('pointerdown', pointerDown, { capture: true, passive: false })
    document.addEventListener('pointermove', pointerMove, { capture: true, passive: false })
    document.addEventListener('pointerup', pointerUp, { capture: true, passive: false })
    document.addEventListener('pointercancel', pointerUp, { capture: true, passive: false })
    document.addEventListener('click', click, true)
    document.addEventListener('keydown', keyDown, true)
    document.addEventListener('keyup', keyUp, true)
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('blur', blur)
    window.addEventListener('pagehide', blur)
    window.addEventListener('scroll', scroll, { passive: true })
    window.addEventListener('resize', resize, { passive: true })
    this.cleanups.push(
      () => document.removeEventListener('pointerdown', pointerDown, true),
      () => document.removeEventListener('pointermove', pointerMove, true),
      () => document.removeEventListener('pointerup', pointerUp, true),
      () => document.removeEventListener('pointercancel', pointerUp, true),
      () => document.removeEventListener('click', click, true),
      () => document.removeEventListener('keydown', keyDown, true),
      () => document.removeEventListener('keyup', keyUp, true),
      () => document.removeEventListener('visibilitychange', visibility),
      () => window.removeEventListener('blur', blur),
      () => window.removeEventListener('pagehide', blur),
      () => window.removeEventListener('scroll', scroll),
      () => window.removeEventListener('resize', resize),
      this.store.subscribe(() => this.updateFromStore()),
    )
    this.requestPaint()
  }

  setSettings(next: EngineSettings) {
    if (next.tool !== this.settings.tool || next.weapon !== this.settings.weapon) {
      this.finishGesture()
      this.commitEditPreview()
    }
    this.settings = next
    if (next.tool !== 'edit') this.editPreview = null
    this.syncTool()
    this.requestPaint()
  }

  private syncTool() {
    document.documentElement.dataset.adaptTool = this.spaceHeld ? 'browse' : this.settings.tool
  }

  private updateFromStore() {
    if (this.destroyed || this.gesture || this.editPreview) return
    const page = this.store.getPage(this.pageKey)
    if (page === this.page) return
    this.page = page
    document.documentElement.dataset.adaptLayout = this.page.layout.kind
    this.dom.apply(this.page)
    this.characters.apply(this.page)
    this.notifySelection()
    this.requestPaint()
  }

  private notifySelection() {
    const target = this.selectedId ? this.dom.get(this.selectedId) : null
    this.onSelection(target ? {
      id: target.id, label: target.label,
      patch: { ...(this.page.elements[target.id] ?? {}), ...(this.editPreview ?? {}) },
    } : null)
  }

  private select(target: AdaptTarget | null) {
    if (this.editPreview) this.dom.resetPreview()
    this.selectedId = target?.id ?? null
    this.editPreview = null
    this.notifySelection()
    this.requestPaint()
  }

  private destructiveTarget(target: AdaptTarget | null): AdaptTarget | null {
    if (!target) return null
    if (target.kind === 'character') return target
    const action = target.element.closest('a[href],button')
    return action && action !== target.element ? this.dom.targetForElement(action) ?? target : target
  }

  private isMedia(target: AdaptTarget): boolean {
    const element = target.element
    if (element.matches('img,picture,video,audio,canvas,iframe,object,embed')) return true
    if (element.tagName === 'DIV' && element.children.length === 1 && element.firstElementChild?.namespaceURI === 'http://www.w3.org/2000/svg') return true
    return element.tagName === 'BUTTON' && !element.textContent?.trim() && !!element.querySelector('svg')
  }

  private breakTarget(x: number, y: number): AdaptTarget | null {
    const character = this.characters.find(x, y)
    if (character) return this.destructiveTarget(character)
    if (this.characters.blockedAt(x, y)) return null
    const target = this.dom.find(x, y)
    return target && this.isMedia(target) ? this.destructiveTarget(target) : null
  }

  private pointerDown(event: PointerEvent) {
    // A fresh press is a new intention. Suppress only the click completing an
    // editing gesture, never the next ordinary click after choosing Browse.
    if (!this.gesture && event.button === 0 && event.isPrimary) this.suppressGestureClick = false
    if (this.destroyed || this.gesture || event.button !== 0 || !event.isPrimary || this.spaceHeld
      || event.metaKey || event.ctrlKey || protectedUi(event.target) || editableField(event.target)) return
    const tool = this.settings.tool
    if (tool === 'browse' || tool === 'layout') {
      if (this.characters.blockedAt(event.clientX, event.clientY)) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
      return
    }
    const target = tool === 'break' ? this.breakTarget(event.clientX, event.clientY)
      : tool === 'edit' ? this.dom.find(event.clientX, event.clientY) : null
    if (tool === 'edit' && !target) {
      this.select(null)
      return
    }
    if (!(event.target instanceof Element) || !event.target.closest('.site-shell')) return
    event.preventDefault()
    event.stopImmediatePropagation()
    window.getSelection()?.removeAllRanges()
    this.commitEditPreview()
    this.page = this.store.getPage(this.pageKey)
    const now = performance.now()
    const gesture: Gesture = {
      pointerId: event.pointerId, tool,
      startX: event.clientX, startY: event.clientY, startDocumentY: event.clientY + window.scrollY,
      lastX: event.clientX, lastY: event.clientY,
      started: now, lastStep: 0, lastScan: 0, lastBurst: 0,
      changed: false, moved: false, working: clonePage(this.page), targets: new Map(),
    }
    this.gesture = gesture
    this.cursor = { x: event.clientX, y: event.clientY }
    try { document.documentElement.setPointerCapture(event.pointerId) } catch { /* Document listeners also handle uncaptured pointers. */ }

    if (tool === 'edit' && target) {
      this.select(target)
      gesture.drag = { target, base: { ...(this.page.elements[target.id] ?? {}) } }
    } else if (tool === 'draw') {
      gesture.stroke = {
        id: makeAdaptId('ink'), color: this.settings.color,
        width: clamp(this.settings.size, 1, 24), points: [documentPoint(event)],
      }
      gesture.changed = true
    } else if (tool === 'break' && this.settings.weapon === 'hammer' && target) {
      this.patchTarget(gesture, target, { hidden: true, damage: 1 })
      this.effects.burst('hammer', event.clientX, event.clientY, this.settings.color, target.label)
      this.selectedId = null
      this.notifySelection()
    }
    this.requestPaint()
  }

  private pointerMove(event: PointerEvent) {
    if (this.destroyed) return
    if (!this.gesture) {
      if (this.settings.tool === 'browse' || this.settings.tool === 'layout' || this.spaceHeld) {
        if (this.cursor) { this.cursor = null; this.requestPaint() }
        return
      }
      this.cursor = protectedUi(event.target) || editableField(event.target) ? null : { x: event.clientX, y: event.clientY }
      this.requestPaint()
      return
    }
    const gesture = this.gesture
    if (event.pointerId !== gesture.pointerId) return
    event.preventDefault()
    event.stopImmediatePropagation()
    gesture.lastX = event.clientX
    gesture.lastY = event.clientY
    this.cursor = { x: event.clientX, y: event.clientY }
    const distance = Math.hypot(event.clientX - gesture.startX, event.clientY + window.scrollY - gesture.startDocumentY)
    if (distance > 4) gesture.moved = true

    if (gesture.drag && gesture.moved) {
      document.documentElement.dataset.adaptDragging = 'true'
      const base = gesture.drag.base
      this.patchTarget(gesture, gesture.drag.target, {
        dx: clamp((base.dx ?? 0) + (event.clientX - gesture.startX) / window.innerWidth, -2, 2),
        dy: clamp((base.dy ?? 0) + event.clientY + window.scrollY - gesture.startDocumentY, -6000, 6000),
      })
    }
    if (gesture.stroke) {
      const next = documentPoint(event)
      const points = gesture.stroke.points
      const last = points[points.length - 1]
      if (Math.hypot((next.x - last.x) * window.innerWidth, next.y - last.y) >= 1.5) {
        if (points.length >= ADAPT_LIMITS.points) gesture.stroke.points = points.filter((_, index) => index % 2 === 0)
        gesture.stroke.points.push(next)
      }
    }
    this.requestPaint()
  }

  private patchTarget(gesture: Gesture, target: AdaptTarget, patch: ElementPatch) {
    if (!gesture.working.elements[target.id] && Object.keys(gesture.working.elements).length >= ADAPT_LIMITS.elements) return
    const next = { ...(gesture.working.elements[target.id] ?? {}), ...patch }
    gesture.working.elements[target.id] = next
    this.dom.preview(target.id, next)
    gesture.changed = true
  }

  private collectTargets(gesture: Gesture, now: number) {
    if (now - gesture.lastScan < 130) return
    gesture.lastScan = now
    const radius = this.settings.weapon === 'ray' && gesture.tool === 'break' ? this.settings.size * .38 : this.settings.size
    const characters = this.characters.nearby(gesture.lastX, gesture.lastY, radius, 64)
    const media = this.dom.nearby(gesture.lastX, gesture.lastY, radius, 6).filter(target => this.isMedia(target))
    const targets = [...characters, ...media]
    for (const hit of targets) {
      const target = gesture.tool === 'break' ? this.destructiveTarget(hit) : hit
      if (!target) continue
      if (gesture.working.elements[target.id]?.hidden || gesture.targets.has(target.id)) continue
      if ([...gesture.targets.values()].some(previous => previous.target.element.contains(target.element)
        || target.element.contains(previous.target.element))) continue
      const rect = target.rect()
      const base = { ...(this.page.elements[target.id] ?? {}) }
      if (!base.color) base.color = hex(getComputedStyle(target.element).color)
      gesture.targets.set(target.id, { target, base, rect, scrollY: window.scrollY, seed: fingerprint(target.id) })
    }
  }

  private stepHeld(gesture: Gesture, now: number) {
    if (now - gesture.lastStep < 32) return
    const deltaMs = gesture.lastStep ? clamp(now - gesture.lastStep, 0, 80) : 16
    gesture.lastStep = now
    this.collectTargets(gesture, now)
    // A large brush can meet many letters. Bound live style work to the closest
    // 64 targets instead of updating every character previously visited.
    const sessions = [...gesture.targets.values()]
      .filter(session => session.target.element.isConnected && !gesture.working.elements[session.target.id]?.hidden)
      .map(session => {
        const top = session.rect.top + session.scrollY - window.scrollY
        return {
          session,
          distance: Math.hypot(
            clamp(gesture.lastX, session.rect.left, session.rect.right) - gesture.lastX,
            clamp(gesture.lastY, top, top + session.rect.height) - gesture.lastY,
          ),
        }
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 64)
      .map(item => item.session)
    if (gesture.tool === 'diffuse') {
      const elapsed = (now - gesture.started) / 1000
      for (const session of sessions) {
        if (!session.target.element.isConnected || gesture.working.elements[session.target.id]?.hidden) continue
        const { base, rect, seed } = session
        const cx = clamp(gesture.lastX, rect.left, rect.right)
        const scrollDelta = window.scrollY - session.scrollY
        const cy = clamp(gesture.lastY, rect.top - scrollDelta, rect.bottom - scrollDelta)
        const influence = Math.exp(-(Math.hypot(cx - gesture.lastX, cy - gesture.lastY) ** 2) / (this.settings.size ** 2 * .8))
        if (influence < .08) continue
        const t = this.motion.matches ? 2 : elapsed * .75 + 2
        const strength = influence * (this.motion.matches ? 1 : clamp(elapsed * 2, 0, 1))
        const character = session.target.kind === 'character'
        const horizontal = character ? Math.min(18, rect.height * .35) / window.innerWidth : .028
        const vertical = character ? Math.min(18, rect.height * .35) : 22
        const patch: ElementPatch = {
          dx: clamp((base.dx ?? 0) + (this.motion.matches ? 0 : noise(seed + 11, t) * strength * horizontal), -2, 2),
          dy: clamp((base.dy ?? 0) + (this.motion.matches ? 0 : noise(seed + 23, t) * strength * vertical), -6000, 6000),
          rotation: clamp((base.rotation ?? 0) + (this.motion.matches ? 0 : noise(seed + 37, t) * strength * (character ? 28 : 16)), -180, 180),
          weight: Math.round(clamp((base.weight ?? 500) + noise(seed + 73, t) * strength * 280, 200, 900)),
          color: mixColor(base.color ?? '#484d46', this.settings.color, strength * (.55 + noise(seed + 111, t) * .35)),
        }
        if (character) {
          patch.scale = clamp((base.scale ?? 1) * (1 + (this.motion.matches ? 0 : noise(seed + 53, t) * strength * .28)), .55, 2.4)
        } else {
          patch.fontScale = clamp((base.fontScale ?? 1) * (1 + (this.motion.matches ? 0 : noise(seed + 53, t) * strength * .22)), .55, 2.4)
          patch.letterSpacing = clamp((base.letterSpacing ?? 0) + noise(seed + 91, t) * strength * 1.3, -2, 8)
        }
        this.patchTarget(gesture, session.target, patch)
      }
      return
    }

    if (gesture.tool !== 'break' || this.settings.weapon === 'hammer') return
    let burstText = ''
    for (const session of sessions) {
      const { target, base, rect } = session
      if (!target.element.isConnected || gesture.working.elements[target.id]?.hidden) continue
      const scrollDelta = window.scrollY - session.scrollY
      const top = rect.top - scrollDelta
      const distance = Math.hypot(
        clamp(gesture.lastX, rect.left, rect.right) - gesture.lastX,
        clamp(gesture.lastY, top, top + rect.height) - gesture.lastY,
      )
      const radius = this.settings.size * (this.settings.weapon === 'ray' ? .45 : 1.25)
      if (distance > radius) continue
      const damage = clamp((gesture.working.elements[target.id]?.damage ?? base.damage ?? 0)
        + deltaMs / (this.settings.weapon === 'ray' ? 430 : 760), 0, 1)
      const progress = clamp((damage - (base.damage ?? 0)) / Math.max(.01, 1 - (base.damage ?? 0)), 0, 1)
      if (this.settings.weapon === 'vortex') {
        this.patchTarget(gesture, target, {
          dx: clamp((base.dx ?? 0) + (this.motion.matches ? 0 : (gesture.lastX - rect.left - rect.width / 2) / window.innerWidth * progress), -2, 2),
          dy: clamp((base.dy ?? 0) + (this.motion.matches ? 0 : (gesture.lastY - top - rect.height / 2) * progress), -6000, 6000),
          rotation: clamp((base.rotation ?? 0) + (this.motion.matches ? 0 : progress * 130), -180, 180),
          scale: this.motion.matches ? base.scale ?? 1 : Math.max(.4, (base.scale ?? 1) * (1 - progress * .7)),
          damage, hidden: damage >= 1,
        })
      } else {
        this.patchTarget(gesture, target, {
          color: mixColor(base.color ?? '#484d46', '#d4793c', progress),
          damage, hidden: damage >= 1,
        })
      }
      if (damage >= 1) burstText = target.label
    }
    if (now - gesture.lastBurst > 180) {
      gesture.lastBurst = now
      this.effects.burst(this.settings.weapon, gesture.lastX, gesture.lastY, this.settings.color, burstText.slice(0, 28))
    }
  }

  finishGesture(commit = true) {
    const gesture = this.gesture
    if (!gesture) return
    this.gesture = null
    delete document.documentElement.dataset.adaptDragging
    try {
      if (document.documentElement.hasPointerCapture(gesture.pointerId)) document.documentElement.releasePointerCapture(gesture.pointerId)
    } catch { /* A cancelled pointer may have released its capture already. */ }
    this.suppressGestureClick = true
    if (commit && gesture.changed) {
      if (gesture.stroke) {
        gesture.working.strokes.push(gesture.stroke)
        gesture.working.strokes = gesture.working.strokes.slice(-ADAPT_LIMITS.strokes)
      }
      this.store.commitPage(this.pageKey, gesture.working)
    }
    this.dom.resetPreview()
    this.page = this.store.getPage(this.pageKey)
    this.dom.apply(this.page)
    this.characters.apply(this.page)
    this.notifySelection()
    this.requestPaint()
  }

  editSelection(patch: ElementPatch, final = true) {
    if (!this.selectedId) return
    this.editPreview = { ...(this.editPreview ?? {}), ...patch }
    const next = { ...(this.page.elements[this.selectedId] ?? {}), ...this.editPreview }
    this.dom.preview(this.selectedId, next)
    this.notifySelection()
    if (final) this.commitEditPreview()
    this.requestPaint()
  }

  private commitEditPreview() {
    if (!this.selectedId || !this.editPreview) return
    const next = clonePage(this.page)
    next.elements[this.selectedId] = { ...(next.elements[this.selectedId] ?? {}), ...this.editPreview }
    this.editPreview = null
    this.store.commitPage(this.pageKey, next)
  }

  removeSelection() {
    if (this.selectedId) {
      const target = this.destructiveTarget(this.dom.get(this.selectedId))
      if (target) this.selectedId = target.id
    }
    this.editSelection({ hidden: true, damage: 1 })
  }

  restoreSelection() {
    if (!this.selectedId) return
    this.editPreview = null
    this.dom.resetPreview()
    const next = clonePage(this.page)
    const selection = this.dom.get(this.selectedId)
    for (const id of Object.keys(next.elements)) {
      const character = parseCharacterId(id)
      if (!character) continue
      const parent = this.dom.get(character.parentId)
      if (character.parentId === this.selectedId || (parent && selection?.element.contains(parent.element))) {
        delete next.elements[id]
      }
    }
    delete next.elements[this.selectedId]
    this.store.commitPage(this.pageKey, next)
    this.notifySelection()
    this.requestPaint()
  }

  setLayout(kind: LayoutKind) {
    this.finishGesture()
    this.commitEditPreview()
    const next = clonePage(this.page)
    next.layout = { kind, seed: kind === 'original' ? 0 : Math.floor(Math.random() * 2147483647) }
    this.store.commitPage(this.pageKey, next)
  }

  undo() {
    this.finishGesture()
    this.commitEditPreview()
    this.store.undo()
  }

  redo() {
    this.finishGesture()
    this.commitEditPreview()
    this.store.redo()
  }

  reset() {
    this.finishGesture(false)
    this.editPreview = null
    this.dom.resetPreview()
    this.selectedId = null
    this.store.resetPage(this.pageKey)
    this.notifySelection()
    this.requestPaint()
  }

  private keyDown(event: KeyboardEvent) {
    if (editableField(event.target)) return
    if ((event.key === 'Enter' || event.code === 'Space') && event.target instanceof Element
      && this.characters.actionDestroyed(event.target)) {
      event.preventDefault()
      event.stopImmediatePropagation()
      return
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault()
      if (event.shiftKey) this.redo()
      else this.undo()
      return
    }
    if (event.key === 'Escape') {
      this.finishGesture()
      this.commitEditPreview()
      this.select(null)
      this.onBrowse()
      return
    }
    const nativeSpaceTarget = event.target instanceof Element && event.target.closest('button,summary,[role="button"]')
    if (event.code === 'Space' && this.settings.tool !== 'browse' && this.settings.tool !== 'layout'
      && !protectedUi(event.target) && !nativeSpaceTarget) {
      this.finishGesture()
      this.spaceHeld = true
      this.syncTool()
      this.cursor = null
      this.requestPaint()
      event.preventDefault()
      return
    }
    if (this.settings.tool !== 'edit' || !this.selectedId || protectedUi(event.target)
      || event.metaKey || event.ctrlKey || event.altKey) return
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      this.removeSelection()
      return
    }
    const delta = event.shiftKey ? 20 : 5
    const base = this.page.elements[this.selectedId] ?? {}
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      this.editSelection({ dx: clamp((base.dx ?? 0) + (event.key === 'ArrowLeft' ? -delta : delta) / window.innerWidth, -2, 2) })
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      this.editSelection({ dy: clamp((base.dy ?? 0) + (event.key === 'ArrowUp' ? -delta : delta), -6000, 6000) })
    }
  }

  private requestPaint() {
    if (this.destroyed || document.hidden || this.frame) return
    this.frame = requestAnimationFrame(now => {
      this.frame = 0
      const gesture = this.gesture
      const heldEffect = gesture?.tool === 'diffuse' || (gesture?.tool === 'break' && this.settings.weapon !== 'hammer')
      const continuous = heldEffect && !(gesture?.tool === 'diffuse' && this.motion.matches)
      if (gesture && heldEffect) this.stepHeld(gesture, now)
      if (this.selectedId && !this.dom.get(this.selectedId)) {
        this.selectedId = null
        this.notifySelection()
      }
      const target = this.selectedId && this.settings.tool === 'edit' ? this.dom.get(this.selectedId) : null
      if (target && target.element.isConnected && !(gesture?.working ?? this.page).elements[target.id]?.hidden) {
        const rect = target.rect()
        this.outline.style.display = 'block'
        this.outline.style.transform = `translate(${rect.left - 4}px,${rect.top - 4}px)`
        this.outline.style.width = `${rect.width + 8}px`
        this.outline.style.height = `${rect.height + 8}px`
      } else this.outline.style.display = 'none'
      const brush = this.cursor && !this.spaceHeld && ['draw', 'diffuse', 'break'].includes(this.settings.tool)
        ? {
          ...this.cursor,
          radius: this.settings.tool === 'draw' ? Math.max(8, this.settings.size / 2)
            : this.settings.tool === 'break' && this.settings.weapon === 'hammer' ? 8 : this.settings.size,
          tool: this.settings.tool, pressed: !!gesture,
        }
        : undefined
      this.effects.render({
        page: gesture?.working ?? this.page,
        scrollY: window.scrollY, width: window.innerWidth, height: window.innerHeight,
        cursor: brush,
        stroke: gesture?.stroke,
        reducedMotion: this.motion.matches,
      })
      if (continuous) this.requestPaint()
    })
  }

  destroy() {
    if (this.destroyed) return
    this.finishGesture()
    this.commitEditPreview()
    this.destroyed = true
    cancelAnimationFrame(this.frame)
    clearTimeout(this.resizeTimer)
    this.cleanups.forEach(cleanup => cleanup())
    this.effects.destroy()
    this.dom.destroy()
    this.characters.destroy()
    this.outline.style.display = 'none'
    delete document.documentElement.dataset.adaptActive
    delete document.documentElement.dataset.adaptTool
    delete document.documentElement.dataset.adaptDragging
    delete document.documentElement.dataset.adaptLayout
  }
}
