import { ADAPT_FONTS, ADAPT_LIMITS, clamp } from './model'
import type { ElementPatch, AdaptPage, LayoutSpec } from './model'

export interface AdaptTarget {
  id: string
  element: HTMLElement
  label: string
  kind?: 'character'
  /** Viewport coordinates, including the current adaptation. */
  rect(): DOMRect
}

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml'
const MAX_TARGETS = 6000
const MAX_SCAN_NODES = 24_000
const SLICE_NODES = 300
const BATCH_DELAY = 48
const MAX_DIRTY_ROOTS = 24
const MAX_LAYOUT_GROUPS = 64
const MAX_ANCESTORS = 64
const TEXT_TAGS = new Set([
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'A', 'BUTTON', 'FIGCAPTION',
  'DT', 'DD', 'SUMMARY', 'BLOCKQUOTE', 'PRE', 'TIME', 'ADDRESS', 'TH', 'TD',
])
const MEDIA_TAGS = new Set(['FIGURE', 'IMG', 'PICTURE', 'VIDEO', 'AUDIO', 'CANVAS', 'IFRAME', 'OBJECT', 'EMBED'])
const BLOCK_TAGS = new Set(['ARTICLE', 'SECTION', 'LI', 'DIV'])
const SKIP_SUBTREE = [
  '[data-adapt-ui]', 'form', 'input', 'textarea', 'select', 'option', 'optgroup',
  '[contenteditable]:not([contenteditable="false" i])',
  'script', 'style', 'noscript', 'template',
].join(',')
const PROTECTED_DESCENDANT = [
  '[data-adapt-ui]', 'form', 'input', 'textarea', 'select',
  '[contenteditable]:not([contenteditable="false" i])',
].join(',')
const CONTEXT_TAGS = new Set(['ARTICLE', 'SECTION', 'LI', 'FIGURE', 'NAV', 'HEADER', 'FOOTER', 'ASIDE'])
const INVISIBLE_ANCESTOR = '[hidden],[inert],[aria-hidden="true"]'
const FOCUSABLE = 'a[href],button,summary,[tabindex],audio[controls],video[controls],iframe,object,embed'
const ORIGINAL_LAYOUT: LayoutSpec = { kind: 'original', seed: 0 }

function cleanText(value: string | null, limit = 1_600): string {
  return (value ?? '').slice(0, limit * 2).replace(/\s+/g, ' ').trim().slice(0, limit)
}

function fingerprint(value: string): string {
  // Two independent 32-bit lanes, with no identifiers interpolated into selectors.
  let a = 0x811c9dc5
  let b = 0x9e3779b9
  const bounded = value.length > 8_192 ? `${value.slice(0, 4_096)}|${value.length}|${value.slice(-4_096)}` : value
  for (let i = 0; i < bounded.length; i++) {
    const code = bounded.charCodeAt(i)
    a = Math.imul(a ^ code, 0x01000193)
    b = Math.imul(b ^ code, 0x85ebca6b)
  }
  return `${(a >>> 0).toString(36)}-${(b >>> 0).toString(36)}`
}

/** Conservative: also reject useId tokens after callers strip colons/underscores. */
export function semanticAdaptId(value: string | null): string | null {
  if (!value || value.length > 200 || !/^[a-z][a-z0-9_.-]*$/i.test(value)) return null
  if (/(?:^|[-_])r_?[0-9a-v]+(?:h[0-9a-v]+)?(?:$|[-_])/i.test(value)) return null
  return value
}

/** Pure identity helper; framing prevents separator-containing record keys colliding. */
export function adaptTargetKey(pageKey: string, parts: readonly string[]): string {
  const framed = parts.map(part => `${part.length}:${part}`).join('|')
  return `adapt-${fingerprint(pageKey)}-${fingerprint(framed)}`
}

export function canonicalAdaptReference(value: string, baseUrl: string): string {
  if (!value) return ''
  try {
    const base = new URL(baseUrl)
    const target = new URL(value, base)
    if (target.origin !== base.origin) return value
    target.searchParams.delete('edition')
    target.searchParams.delete('v')
    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return value
  }
}

/** Defend the DOM boundary even when previews have not passed through the store. */
export function boundedDomPatch(patch: ElementPatch): ElementPatch {
  const result: ElementPatch = {}
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return result
  const own = (key: keyof ElementPatch): unknown => Object.getOwnPropertyDescriptor(patch, key)?.value
  const numeric = (key: 'dx' | 'dy' | 'rotation' | 'scale' | 'fontScale' | 'weight' | 'letterSpacing', low: number, high: number) => {
    const value = own(key)
    if (typeof value === 'number' && Number.isFinite(value)) result[key] = clamp(value, low, high)
  }
  // Match persistence bounds; the controller's letter-spacing range is narrower.
  numeric('dx', -4, 4)
  numeric('dy', -100_000, 100_000)
  numeric('rotation', -3_600, 3_600)
  numeric('scale', 0.1, 8)
  numeric('fontScale', 0.25, 8)
  numeric('weight', 100, 900)
  numeric('letterSpacing', -2, 8) // CSS pixels, not em.
  const font = own('font')
  if (font === 'original' || (typeof font === 'string' && Object.hasOwn(ADAPT_FONTS, font))) {
    result.font = font as ElementPatch['font']
  }
  const color = own('color')
  if (typeof color === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)) {
    result.color = color.toLowerCase()
  }
  const italic = own('italic'), hidden = own('hidden')
  if (typeof italic === 'boolean') result.italic = italic
  if (typeof hidden === 'boolean') result.hidden = hidden
  return result
}

function cssNumber(value: number): string {
  return String(Math.round(value * 10_000) / 10_000)
}

function cssComponents(value: string): string[] {
  // Computed translate values may contain calc() with spaces.
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i <= value.length; i++) {
    if (value[i] === '(') depth++
    if (value[i] === ')') depth--
    if (i === value.length || (depth === 0 && /\s/.test(value[i]))) {
      if (i > start) parts.push(value.slice(start, i))
      start = i + 1
    }
  }
  return parts
}

/** Independent translate composes with, rather than replaces, React's transform. */
export function adaptedTranslate(original: string, dx: number, dy: number): string {
  const parts = original && original !== 'none' ? cssComponents(original) : []
  const x = parts[0] ?? '0px'
  const y = parts[1] ?? '0px'
  return `calc(${x} + ${cssNumber(dx * 100)}vw) calc(${y} + ${cssNumber(dy)}px)${parts[2] ? ` ${parts[2]}` : ''}`
}

/** The same record keys and seed reproduce a permutation without moving nodes. */
export function adaptLayoutOrder(keys: readonly string[], seed: number): number[] {
  const scores = keys.map((key, index) => ({ key, index, score: fingerprint(`${seed}|${key}`) }))
  scores.sort((a, b) => a.score.localeCompare(b.score) || a.key.localeCompare(b.key))
  if (scores.length > 1 && scores.every((item, index) => item.index === index)) {
    scores.push(scores.shift()!)
  }
  const order: number[] = []
  scores.forEach((item, rank) => { order[item.index] = rank })
  return order
}

interface OwnedStyle {
  value: string
  priority: string
  requested?: string
  written?: string
  writtenPriority?: string
  computed?: string
}

interface OwnedAttribute {
  value: string | null
  written: string
}

interface Ownership {
  hadStyleAttribute: boolean
  styles: Map<string, OwnedStyle>
  attributes: Map<string, OwnedAttribute>
}

type Styles = Map<string, string>

/**
 * A property ledger, independent of document traversal. The reader is injected
 * so restoration and React interleaving can be verified without a browser.
 */
export function createAdaptMutationOwner(readComputed: (element: HTMLElement, name: string) => string) {
  const owned = new Map<HTMLElement, Ownership>()

  function ownership(element: HTMLElement): Ownership {
    let state = owned.get(element)
    if (!state) {
      state = { hadStyleAttribute: element.hasAttribute('style'), styles: new Map(), attributes: new Map() }
      owned.set(element, state)
    }
    return state
  }

  function stillWritten(element: HTMLElement, name: string, entry: OwnedStyle): boolean {
    return entry.written !== undefined
      && element.style.getPropertyValue(name) === entry.written
      && element.style.getPropertyPriority(name) === entry.writtenPriority
  }

  function ownStyle(element: HTMLElement, name: string): OwnedStyle {
    const state = ownership(element)
    let entry = state.styles.get(name)
    if (!entry || (entry.written !== undefined && !stillWritten(element, name, entry))) {
      // React may have updated a property since our last write. That is the new
      // restoration baseline; never resurrect an older React value.
      entry = { value: element.style.getPropertyValue(name), priority: element.style.getPropertyPriority(name) }
      state.styles.set(name, entry)
    }
    return entry
  }

  function baseStyle(element: HTMLElement, name: string): string {
    const entry = ownStyle(element, name)
    if (entry.computed === undefined) entry.computed = readComputed(element, name)
    return entry.computed
  }

  function restoreStyle(element: HTMLElement, name: string, entry: OwnedStyle) {
    if (!stillWritten(element, name, entry)) return
    if (entry.value) element.style.setProperty(name, entry.value, entry.priority)
    else element.style.removeProperty(name)
  }

  function sync(element: HTMLElement, styles: Styles, attributes = new Map<string, string>()) {
    const state = owned.get(element)
    if (state) {
      for (const [name, entry] of state.styles) {
        if (!styles.has(name)) {
          restoreStyle(element, name, entry)
          state.styles.delete(name)
        }
      }
      for (const [name, entry] of state.attributes) {
        if (!attributes.has(name)) {
          if (element.getAttribute(name) === entry.written) {
            if (entry.value === null) element.removeAttribute(name)
            else element.setAttribute(name, entry.value)
          }
          state.attributes.delete(name)
        }
      }
    }
    for (const [name, value] of styles) {
      const entry = ownStyle(element, name)
      if (entry.requested === value && stillWritten(element, name, entry)) continue
      element.style.setProperty(name, value, 'important')
      // CSSOM normalizes values, so compare against what it actually retained.
      entry.requested = value
      entry.written = element.style.getPropertyValue(name)
      entry.writtenPriority = element.style.getPropertyPriority(name)
    }
    for (const [name, value] of attributes) {
      const state = ownership(element)
      let entry = state.attributes.get(name)
      const current = element.getAttribute(name)
      if (!entry || current !== entry.written) {
        entry = { value: current, written: value }
        state.attributes.set(name, entry)
      }
      if (current !== value) element.setAttribute(name, value)
      entry.written = value
    }
    const final = owned.get(element)
    if (final && !final.styles.size && !final.attributes.size) {
      if (!final.hadStyleAttribute && !element.style.length) element.removeAttribute('style')
      owned.delete(element)
    }
  }

  function restore(element: HTMLElement) {
    sync(element, new Map())
  }

  return { baseStyle, sync, restore, elements: () => owned.keys() }
}

interface Scan {
  root: HTMLElement
  walker: TreeWalker
  first: boolean
}

interface Geometry {
  target: AdaptTarget
  rect: DOMRect
}

export function createAdaptDom() {
  const doc = document
  const win = doc.defaultView ?? window
  let pageKey = ''
  let shell: HTMLElement | null = null
  let destroyed = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let scan: Scan | null = null
  let scannedNodes = 0
  let identities = new WeakMap<HTMLElement, string>()
  let byElement = new WeakMap<HTMLElement, AdaptTarget>()
  const targets = new Map<string, AdaptTarget>()
  const ambiguous = new Map<string, Set<HTMLElement>>()
  const mutations = createAdaptMutationOwner((element, name) => win.getComputedStyle(element).getPropertyValue(name))
  const { baseStyle, sync, restore } = mutations
  const pendingRoots = new Set<HTMLElement>()
  const dirtySafety = new Set<AdaptTarget>()
  const layoutParents = new Set<HTMLElement>()
  let layoutStyles = new Map<HTMLElement, Styles>()
  let patches = new Map<string, ElementPatch>()
  const previews = new Map<string, ElementPatch>()
  let layout = ORIGINAL_LAYOUT
  let layoutDirty = true
  let geometry: Geometry[] = []
  let geometryTime = -Infinity
  const targetListeners = new Set<() => void>()
  let notifyTimer: ReturnType<typeof setTimeout> | undefined

  function notifyTargets() {
    if (destroyed || notifyTimer !== undefined || !targetListeners.size) return
    notifyTimer = setTimeout(() => {
      notifyTimer = undefined
      if (!destroyed) for (const listener of [...targetListeners]) listener()
    }, 0)
  }

  function invalidateGeometry() {
    geometryTime = -Infinity
  }

  function isHtml(element: Element): element is HTMLElement {
    return element.namespaceURI === HTML_NAMESPACE
  }

  function inShell(element: HTMLElement): boolean {
    return !!shell && element !== shell && element.isConnected && shell.contains(element)
  }

  function excluded(element: Element): boolean {
    return !!element.closest(SKIP_SUBTREE) || !!element.parentElement?.closest('svg,math,canvas')
  }

  function safeTarget(element: HTMLElement): boolean {
    return inShell(element) && !excluded(element) && !element.querySelector(PROTECTED_DESCENDANT)
  }

  function candidate(element: HTMLElement): boolean {
    if (element.hasAttribute('data-adapt-character')) return true
    if (TEXT_TAGS.has(element.tagName)) return !!cleanText(element.textContent, 100) || !!element.getAttribute('aria-label')
    if (MEDIA_TAGS.has(element.tagName)) return true
    if (!BLOCK_TAGS.has(element.tagName)) return false
    if (element.tagName !== 'DIV' || element.hasAttribute('data-adapt-key')) {
      return !!element.firstElementChild || !!cleanText(element.textContent, 100)
    }
    // Generic wrappers are only fallbacks for otherwise unaddressable text/media.
    let node = element.firstChild
    for (let count = 0; node && count < 32; count++, node = node.nextSibling) {
      if (node.nodeType === 3 && cleanText(node.textContent, 80)) return true
    }
    return !!element.querySelector(':scope > svg,:scope > canvas,:scope > img,:scope > video')
  }

  function description(element: HTMLElement): string {
    const own = element.getAttribute('aria-label') || element.getAttribute('alt')
    if (own) return cleanText(own)
    if (TEXT_TAGS.has(element.tagName)) return cleanText(element.textContent)
    const heading = element.querySelector('h1,h2,h3,h4,figcaption')
    return cleanText(heading?.textContent || element.textContent) || element.tagName.toLowerCase()
  }

  function identity(element: HTMLElement): string {
    const character = element.getAttribute('data-adapt-character')
    if (character && /^glyph:adapt-[a-z0-9-]+:[a-z0-9-]+:\d{1,7}$/.test(character)) return character
    const cached = identities.get(element)
    if (cached) return cached
    const explicit = element.closest<HTMLElement>('[data-adapt-key]')
    const keyRoot = explicit && shell?.contains(explicit) ? explicit : null
    const key = cleanText(keyRoot?.getAttribute('data-adapt-key') ?? null, 512)
    const ownId = semanticAdaptId(element.id)
    const parts = [element.tagName.toLowerCase()]
    if (keyRoot === element && key) {
      parts.push('record', key)
    } else if (ownId) {
      parts.push('id', ownId)
    } else {
      const context: string[] = []
      let parent = element.parentElement
      for (let depth = 0; parent && parent !== shell && depth < MAX_ANCESTORS; depth++, parent = parent.parentElement) {
        if (parent === keyRoot && key) break
        const parentId = semanticAdaptId(parent.id)
        if (parentId) {
          context.push(`id:${parentId}`)
          break
        }
        if (CONTEXT_TAGS.has(parent.tagName)) context.push(`${parent.tagName}:${description(parent)}`)
      }
      parts.push(key ? `record:${key}` : 'content', ...context, description(element))
      // Identical link labels can still refer to different papers or destinations.
      parts.push(canonicalAdaptReference(
        element.getAttribute('href') ?? element.getAttribute('src') ?? element.getAttribute('data') ?? '',
        win.location.href,
      ))
    }
    const result = adaptTargetKey(pageKey, parts)
    identities.set(element, result)
    return result
  }

  function render(element: HTMLElement) {
    const target = byElement.get(element)
    const patch = target && targets.get(target.id) === target
      ? { ...patches.get(target.id), ...previews.get(target.id) }
      : {}
    const styles = new Map(layoutStyles.get(element))
    const attributes = new Map<string, string>()
    const dx = patch.dx ?? 0
    const dy = patch.dy ?? 0
    const rotation = patch.rotation ?? 0
    const scale = patch.scale ?? 1
    const positioned = dx !== 0 || dy !== 0 || rotation !== 0 || scale !== 1
    if (positioned) {
      // Non-replaced inline elements do not participate in CSS transforms.
      if (baseStyle(element, 'display') === 'inline') {
        styles.set('display', 'inline-block')
        styles.set('max-width', '100%')
      }
      if (dx || dy) styles.set('translate', adaptedTranslate(baseStyle(element, 'translate'), dx, dy))
      if (rotation) {
        const base = baseStyle(element, 'rotate')
        const parts = base && base !== 'none' ? cssComponents(base) : ['0deg']
        const angle = parts.pop() ?? '0deg'
        styles.set('rotate', `${parts.length ? `${parts.join(' ')} ` : ''}calc(${angle} + ${cssNumber(rotation)}deg)`)
      }
      if (scale !== 1) {
        const base = baseStyle(element, 'scale')
        const parts = base && base !== 'none' ? cssComponents(base) : ['1']
        styles.set('scale', parts.map(part => `calc(${part} * ${cssNumber(scale)})`).join(' '))
      }
    }
    if (patch.font && patch.font !== 'original') styles.set('font-family', ADAPT_FONTS[patch.font])
    if (patch.fontScale !== undefined && patch.fontScale !== 1) {
      const size = Number.parseFloat(baseStyle(element, 'font-size')) || 16
      styles.set('font-size', `${cssNumber(clamp(size * patch.fontScale, 6, 240))}px`)
    }
    if (patch.weight !== undefined) styles.set('font-weight', cssNumber(patch.weight))
    if (patch.italic !== undefined) styles.set('font-style', patch.italic ? 'italic' : 'normal')
    if (patch.color) styles.set('color', patch.color)
    if (patch.letterSpacing !== undefined) styles.set('letter-spacing', `${cssNumber(patch.letterSpacing)}px`)
    if (patch.hidden) {
      styles.set('opacity', '0')
      if (target?.kind === 'character') {
        // Keep a transparent hit surface so clicking a missing letter cannot
        // activate the surviving link surrounding it.
        styles.set('visibility', 'visible')
        styles.set('pointer-events', 'auto')
        styles.set('cursor', 'default')
        attributes.set('data-adapt-character-deleted', '')
      } else {
        styles.set('visibility', 'hidden')
        styles.set('pointer-events', 'none')
        attributes.set('inert', '')
      }
      attributes.set('aria-hidden', 'true')
      if (element.matches(FOCUSABLE)) attributes.set('tabindex', '-1')
      const active = doc.activeElement
      if (active && element.contains(active) && isHtml(active)) active.blur()
    }
    sync(element, styles, attributes)
  }

  function forget(target: AdaptTarget) {
    targets.delete(target.id)
    byElement.delete(target.element)
    dirtySafety.delete(target)
    restore(target.element)
    invalidateGeometry()
    if (target.kind !== 'character') notifyTargets()
  }

  function register(element: HTMLElement, urgent = false): AdaptTarget | null {
    const existing = byElement.get(element)
    if (!candidate(element) || !safeTarget(element)) {
      if (existing) forget(existing)
      return null
    }
    if (existing && targets.get(existing.id) === existing) {
      existing.label = description(element).slice(0, 96)
      if (patches.has(existing.id) || previews.has(existing.id)) render(element)
      return existing
    }
    const id = identity(element)
    if (ambiguous.has(id)) {
      // Truly indistinguishable copies are deliberately not assigned list indexes.
      const copies = ambiguous.get(id)!
      if (copies.size < 4) copies.add(element)
      return null
    }
    const collision = targets.get(id)
    if (collision && collision.element !== element) {
      if (inShell(collision.element)) {
        ambiguous.set(id, new Set([collision.element, element]))
        forget(collision)
        return null
      }
      forget(collision)
    }
    if (targets.size + ambiguous.size >= MAX_TARGETS) {
      if (!urgent && !patches.has(id) && !previews.has(id)) return null
      let spare: AdaptTarget | undefined
      for (const target of targets.values()) {
        if (!patches.has(target.id) && !previews.has(target.id)) {
          spare = target
          break
        }
      }
      if (!spare) return null
      forget(spare)
    }
    const target: AdaptTarget = {
      id, element, label: description(element).slice(0, 96),
      kind: element.hasAttribute('data-adapt-character') ? 'character' : undefined,
      rect: () => element.getBoundingClientRect(),
    }
    targets.set(id, target)
    byElement.set(element, target)
    if (patches.has(id) || previews.has(id)) render(element)
    invalidateGeometry()
    if (target.kind !== 'character') notifyTargets()
    return target
  }

  function prune() {
    for (const target of targets.values()) {
      if (!inShell(target.element) || excluded(target.element)) forget(target)
    }
    for (const [id, copies] of ambiguous) {
      for (const element of copies) if (!inShell(element)) copies.delete(element)
      if (copies.size < 2) {
        ambiguous.delete(id)
        for (const element of copies) queueRoot(element)
      }
    }
    for (const target of dirtySafety) {
      if (targets.get(target.id) === target && !safeTarget(target.element)) forget(target)
    }
    dirtySafety.clear()
    for (const element of mutations.elements()) {
      if (!element.isConnected || !shell?.contains(element)) restore(element)
    }
    for (const parent of layoutParents) if (!inShell(parent)) layoutParents.delete(parent)
  }

  function noteLayoutParent(element: HTMLElement) {
    if (layoutParents.size >= MAX_LAYOUT_GROUPS * 4) return
    if (!element.matches('section,article,li,[data-adapt-key]')) return
    const parent = element.parentElement
    if (parent && inShell(parent) && parent.closest('main')
      && !parent.closest('figure,nav,aside,form,[data-adapt-ui]')
      && !excluded(parent) && !layoutParents.has(parent)) {
      layoutParents.add(parent)
      layoutDirty = true
    }
  }

  function rebuildLayout() {
    layoutDirty = false
    const previous = layoutStyles
    layoutStyles = new Map()
    if (layout.kind !== 'original') {
      const groups: { parent: HTMLElement, children: HTMLElement[], items: HTMLElement[], records: boolean }[] = []
      for (const parent of layoutParents) {
        // CSS layout keeps form controls intact. Hidden citation textareas must
        // not prevent their surrounding publication records from being arranged.
        if (!inShell(parent) || excluded(parent) || parent.querySelector('[data-adapt-ui]')) continue
        const children = Array.from(parent.children).filter(isHtml).slice(0, ADAPT_LIMITS.elements)
        const items = children.filter(child => child.matches('section,article,li,[data-adapt-key]')
          && !child.matches('[hidden],[inert],[aria-hidden="true"]')
          && !excluded(child) && !child.querySelector('[data-adapt-ui]'))
        if (items.length < 2) continue
        const records = items.every(child => child.hasAttribute('data-adapt-key')
          || (child.tagName === 'LI' && !!child.querySelector('[data-adapt-key]')))
        groups.push({ parent, children, items, records })
      }
      // Prefer publication records to nested columns of year groups. Otherwise
      // use the outer section group, keeping figure internals intact.
      groups.sort((a, b) => {
        if (layout.kind === 'columns') return Number(b.records) - Number(a.records)
        if (a.parent.contains(b.parent)) return -1
        if (b.parent.contains(a.parent)) return 1
        return 0
      })
      const selected: typeof groups = []
      for (const group of groups) {
        if (selected.length >= MAX_LAYOUT_GROUPS) break
        if (!selected.some(other => other.parent.contains(group.parent) || group.parent.contains(other.parent))) {
          selected.push(group)
        }
      }
      let childrenRemaining = ADAPT_LIMITS.elements
      for (const group of selected) {
        if (group.children.length > childrenRemaining) continue
        childrenRemaining -= group.children.length
        const container: Styles = new Map([
          ['display', layout.kind === 'columns' ? 'grid' : 'flex'],
          ['row-gap', '24px'], ['column-gap', '24px'],
        ])
        if (layout.kind === 'columns') {
          container.set('grid-template-columns', 'repeat(auto-fit, minmax(min(100%, 24rem), 1fr))')
          container.set('grid-template-rows', 'none')
          container.set('grid-template-areas', 'none')
          container.set('grid-auto-flow', 'row')
          container.set('align-items', 'start')
        } else {
          container.set('flex-direction', 'column')
          container.set('flex-wrap', 'nowrap')
        }
        layoutStyles.set(group.parent, container)
        const itemKeys = group.items.map(identity)
        const ranks = layout.kind === 'shuffle' ? adaptLayoutOrder(itemKeys, layout.seed) : group.items.map((_, index) => index)
        const slots = group.items.map(item => group.children.indexOf(item))
        group.children.forEach((child, index) => {
          const itemIndex = group.items.indexOf(child)
          const childStyles: Styles = new Map([
            ['order', String(itemIndex < 0 ? index : slots[ranks[itemIndex]])],
            ['min-width', '0'], ['max-width', '100%'],
          ])
          if (layout.kind === 'columns') {
            childStyles.set('grid-column-start', itemIndex < 0 ? '1' : 'auto')
            childStyles.set('grid-column-end', itemIndex < 0 ? '-1' : 'auto')
            childStyles.set('grid-row-start', 'auto')
            childStyles.set('grid-row-end', 'auto')
          }
          layoutStyles.set(child, childStyles)
        })
      }
    }
    for (const element of new Set([...previous.keys(), ...layoutStyles.keys()])) render(element)
    invalidateGeometry()
  }

  function queueRoot(root: HTMLElement) {
    if (!shell || !shell.contains(root) || excluded(root)) return
    // An inserted input or protected UI also disqualifies an already-modified
    // ancestor, even when that ancestor is outside this incremental scan.
    let parent: HTMLElement | null = root
    for (let depth = 0; parent && parent !== shell && depth < MAX_ANCESTORS; depth++, parent = parent.parentElement) {
      const target = byElement.get(parent)
      if (target) dirtySafety.add(target)
    }
    for (const other of pendingRoots) {
      if (other.contains(root)) return
      if (root.contains(other)) pendingRoots.delete(other)
    }
    if (pendingRoots.size >= MAX_DIRTY_ROOTS) {
      pendingRoots.clear()
      pendingRoots.add(shell)
    } else pendingRoots.add(root)
  }

  function schedule() {
    if (!destroyed && timer === undefined) {
      timer = setTimeout(() => {
        timer = undefined
        flushScan()
      }, BATCH_DELAY)
    }
  }

  function newScan(root: HTMLElement): Scan {
    return {
      root, first: true,
      walker: doc.createTreeWalker(root, 1, {
        acceptNode(node) {
          const element = node as Element
          return !isHtml(element) || element.matches(SKIP_SUBTREE)
            || !!element.closest('[data-adapt-character-run]')
            || !!element.parentElement?.closest('canvas')
            ? 2 /* FILTER_REJECT */ : 1 /* FILTER_ACCEPT */
        },
      }),
    }
  }

  function clearShell() {
    for (const element of mutations.elements()) restore(element)
    targets.clear()
    ambiguous.clear()
    identities = new WeakMap()
    byElement = new WeakMap()
    pendingRoots.clear()
    dirtySafety.clear()
    layoutParents.clear()
    layoutStyles.clear()
    scan = null
    scannedNodes = 0
    layoutDirty = true
    geometry = []
    invalidateGeometry()
    notifyTargets()
  }

  function reconcileShell(): boolean {
    const next = doc.querySelector<HTMLElement>('.site-shell')
    const available = next && !next.closest('[data-adapt-ui]') ? next : null
    if (available === shell) return false
    clearShell()
    shell = available
    if (shell) queueRoot(shell)
    return true
  }

  function flushScan() {
    if (destroyed) return
    reconcileShell()
    prune()
    const started = win.performance.now()
    let visits = 0
    while (visits < SLICE_NODES && scannedNodes < MAX_SCAN_NODES && win.performance.now() - started < 8) {
      if (!scan) {
        const root = pendingRoots.values().next().value as HTMLElement | undefined
        if (!root) break
        pendingRoots.delete(root)
        if (!shell?.contains(root) || excluded(root)) continue
        scan = newScan(root)
      }
      if (!scan.root.isConnected || !shell?.contains(scan.root)) {
        scan = null
        continue
      }
      const element = scan.first ? scan.root : scan.walker.nextNode() as HTMLElement | null
      scan.first = false
      if (!element) {
        scan = null
        continue
      }
      visits++
      scannedNodes++
      if (element !== shell) {
        register(element)
        noteLayoutParent(element)
      }
    }
    if (scannedNodes >= MAX_SCAN_NODES) {
      scan = null
      pendingRoots.clear()
    }
    if (scan || pendingRoots.size) schedule()
    else {
      scannedNodes = 0
      if (layoutDirty) rebuildLayout()
    }
  }

  function refresh() {
    if (destroyed) return
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    scan = null
    scannedNodes = 0
    pendingRoots.clear()
    reconcileShell()
    layoutDirty = true
    if (shell) queueRoot(shell)
    flushScan()
  }

  const observer = new MutationObserver(records => {
    if (destroyed) return
    if (!shell?.isConnected) {
      schedule()
      return
    }
    let relevant = false
    // Overflow becomes one bounded rescan rather than an unbounded mutation queue.
    if (records.length > 128) {
      queueRoot(shell)
      relevant = true
    } else for (const mutation of records) {
      const element = mutation.target.nodeType === 1 ? mutation.target as Element : mutation.target.parentElement
      if (!element || !isHtml(element) || excluded(element)) continue
      if (shell.contains(element)) {
        // Attribute and characterData observation are intentionally absent. React
        // text updates do not need identity changes; inserted records do.
        queueRoot(element)
        relevant = true
      } else {
        let changedShell = false
        let checked = 0
        for (const nodes of [mutation.addedNodes, mutation.removedNodes]) {
          for (const node of nodes) {
            if (++checked > 64) {
              changedShell = true
              break
            }
            if (node.nodeType === 1 && ((node as Element).matches('.site-shell') || !!(node as Element).querySelector('.site-shell'))) {
              changedShell = true
              break
            }
          }
          if (changedShell) break
        }
        if (changedShell) relevant = true
      }
    }
    if (relevant) {
      layoutDirty = true
      invalidateGeometry()
      schedule()
    }
  })
  observer.observe(doc.body ?? doc.documentElement, { childList: true, subtree: true })
  win.addEventListener('scroll', invalidateGeometry, { passive: true, capture: true })
  win.addEventListener('resize', invalidateGeometry, { passive: true })

  function visible(target: AdaptTarget): boolean {
    const element = target.element
    return inShell(element) && !excluded(element) && !element.closest(INVISIBLE_ANCESTOR)
  }

  function get(id: string): AdaptTarget | null {
    if (destroyed) return null
    const target = targets.get(id)
    if (!target) return null
    if (!safeTarget(target.element)) {
      forget(target)
      return null
    }
    return target
  }

  function find(clientX: number, clientY: number): AdaptTarget | null {
    if (destroyed || !Number.isFinite(clientX) || !Number.isFinite(clientY)) return null
    if (!shell?.isConnected) reconcileShell()
    let element = doc.elementFromPoint(clientX, clientY)
    if (!element || !shell?.contains(element) || element.closest(SKIP_SUBTREE)) return null
    // Hit testing often returns an SVG path. Its HTML figure/wrapper is eligible;
    // the SVG nodes (including foreignObject descendants) never are.
    const drawing = element.closest('svg,math')
    if (drawing) element = drawing.parentElement
    let fallback: AdaptTarget | null = null
    for (let depth = 0; element && element !== shell && depth < MAX_ANCESTORS; depth++, element = element.parentElement) {
      if (!isHtml(element)) continue
      const target = register(element, true)
      if (!target || !visible(target)) continue
      if (target.kind === 'character') continue
      if (TEXT_TAGS.has(element.tagName)) return target
      fallback ??= target
      if (element.tagName === 'FIGURE') return target
    }
    return fallback
  }

  function nearby(clientX: number, clientY: number, radius: number, limit = 32): AdaptTarget[] {
    if (destroyed || !Number.isFinite(clientX) || !Number.isFinite(clientY) || !Number.isFinite(radius) || radius < 0) return []
    const count = Number.isFinite(limit) ? Math.floor(clamp(limit, 0, ADAPT_LIMITS.elements)) : 32
    if (!count) return []
    const now = win.performance.now()
    if (now - geometryTime > BATCH_DELAY) {
      geometry = []
      for (const target of targets.values()) {
        if (target.kind === 'character' || !visible(target)) continue
        const rect = target.rect()
        if (rect.width > 0 && rect.height > 0) geometry.push({ target, rect })
      }
      geometryTime = now
    }
    const radiusSquared = Math.min(radius, 4_000) ** 2
    const hits: { target: AdaptTarget, distance: number, area: number }[] = []
    const ancestors = new Set<HTMLElement>()
    for (const item of geometry) {
      if (!visible(item.target)) continue
      const { left, top, right, bottom, width, height } = item.rect
      const distance = Math.max(left - clientX, 0, clientX - right) ** 2 + Math.max(top - clientY, 0, clientY - bottom) ** 2
      if (distance > radiusSquared) continue
      const computed = win.getComputedStyle(item.target.element)
      if (computed.visibility === 'hidden' || computed.visibility === 'collapse' || computed.opacity === '0') continue
      hits.push({ target: item.target, distance, area: width * height })
      let parent = item.target.element.parentElement
      for (let depth = 0; parent && parent !== shell && depth < MAX_ANCESTORS; depth++, parent = parent.parentElement) {
        ancestors.add(parent)
      }
    }
    // Prefer leaves, so a single gesture cannot transform both a link and its
    // paragraph/record/figure ancestor.
    return hits.filter(hit => !ancestors.has(hit.target.element))
      .sort((a, b) => a.distance - b.distance || a.area - b.area || a.target.id.localeCompare(b.target.id))
      .slice(0, count).map(hit => hit.target)
  }

  function apply(page: AdaptPage) {
    if (destroyed) return
    const previous = new Set([...patches.keys(), ...previews.keys()])
    patches = new Map()
    previews.clear()
    let inspected = 0
    for (const id in page.elements) {
      if (++inspected > ADAPT_LIMITS.elements * 2 || patches.size >= ADAPT_LIMITS.elements) break
      if (!Object.hasOwn(page.elements, id) || id.length > 200) continue
      const patch = page.elements[id]
      if (patch && typeof patch === 'object') patches.set(id, boundedDomPatch(patch))
    }
    const nextLayout: LayoutSpec = {
      kind: page.layout?.kind === 'columns' || page.layout?.kind === 'shuffle' ? page.layout.kind : 'original',
      seed: Number.isFinite(page.layout?.seed) ? Math.trunc(clamp(page.layout.seed, 0, Number.MAX_SAFE_INTEGER)) : 0,
    }
    if (layout.kind !== nextLayout.kind || layout.seed !== nextLayout.seed) layoutDirty = true
    layout = nextLayout
    reconcileShell()
    prune()
    if (layoutDirty) rebuildLayout()
    for (const id of new Set([...previous, ...patches.keys()])) {
      const target = get(id)
      if (target) render(target.element)
    }
    // A saved edit may refer to a target that was evicted at the registry cap.
    // A newly requested ID gets a scan with edited targets taking priority.
    if (shell && [...patches.keys()].some(id => !id.startsWith('glyph:') && !targets.has(id) && !previous.has(id))) queueRoot(shell)
    if (pendingRoots.size) schedule()
    invalidateGeometry()
  }

  function preview(id: string, patch: ElementPatch) {
    const target = get(id)
    if (!target || (!previews.has(id) && previews.size >= ADAPT_LIMITS.elements)) return
    previews.set(id, { ...previews.get(id), ...boundedDomPatch(patch) })
    render(target.element)
    invalidateGeometry()
  }

  function resetPreview() {
    if (destroyed || !previews.size) return
    const ids = [...previews.keys()]
    previews.clear()
    for (const id of ids) {
      const target = get(id)
      if (target) render(target.element)
    }
    invalidateGeometry()
  }

  function setPageKey(key: string) {
    if (destroyed) return
    if (key === pageKey) {
      refresh()
      return
    }
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    if (notifyTimer !== undefined) clearTimeout(notifyTimer)
    notifyTimer = undefined
    clearShell()
    shell = null
    pageKey = key
    patches.clear()
    previews.clear()
    layout = ORIGINAL_LAYOUT
    refresh()
  }

  function destroy() {
    if (destroyed) return
    destroyed = true
    observer.disconnect()
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    if (notifyTimer !== undefined) clearTimeout(notifyTimer)
    notifyTimer = undefined
    targetListeners.clear()
    win.removeEventListener('scroll', invalidateGeometry, true)
    win.removeEventListener('resize', invalidateGeometry)
    clearShell()
    shell = null
    patches.clear()
    previews.clear()
  }

  function targetForElement(element: Element): AdaptTarget | null {
    return !destroyed && isHtml(element) ? register(element, true) : null
  }

  function rebase() {
    if (destroyed) return
    const elements = [...mutations.elements()]
    for (const element of elements) restore(element)
    elements.sort((a, b) => a.contains(b) ? -1 : b.contains(a) ? 1 : 0)
    for (const element of elements) if (inShell(element)) render(element)
    invalidateGeometry()
  }

  function subscribeTargets(listener: () => void): () => void {
    if (destroyed) return () => {}
    targetListeners.add(listener)
    return () => { targetListeners.delete(listener) }
  }

  refresh()
  return { setPageKey, refresh, find, nearby, get, targetForElement, apply, preview, resetPreview, rebase, subscribeTargets, destroy }
}
