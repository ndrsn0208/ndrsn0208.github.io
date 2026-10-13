import type { AdaptTarget, createAdaptDom } from './dom'
import type { AdaptPage } from './model'
import { ADAPT_LIMITS } from './model'
import { characterId, parseCharacterId, segmentGraphemes, textRunId } from './graphemes'

type CharacterDom = Pick<ReturnType<typeof createAdaptDom>,
  'find' | 'nearby' | 'get' | 'targetForElement' | 'subscribeTargets'>
type Segment = ReturnType<typeof segmentGraphemes>[number]

const MAX_GLYPHS = 4_000
const MAX_RUN_GLYPHS = 2_048
const MAX_RUN_UNITS = 16_384
const MAX_RUNS = 256
const MAX_WALK = 4_096
const MAX_DEPTH = 48
const BATCH_MS = 40
const RUN_ATTRIBUTE = 'data-adapt-character-run'
const WORD_ATTRIBUTE = 'data-adapt-character-word'
const SLOT_ATTRIBUTE = 'data-adapt-character-slot'
const GLYPH_ATTRIBUTE = 'data-adapt-character'
const DELETED_ATTRIBUTE = 'data-adapt-character-deleted'
const EMPTY_ACTION = 'data-adapt-empty-action'
const ACTIONS = 'a[href],button,[role="link"],[role="button"]'
const MEDIA = 'img,picture,svg,canvas,video,audio,iframe,object,embed,[role="img"]'
const EXCLUDED = [
  '[data-adapt-ui]', 'svg', 'math', 'canvas', '.katex', '.katex-display',
  'input', 'textarea', 'select', 'option', 'script', 'style', 'noscript', 'template',
  '[contenteditable]:not([contenteditable="false" i])',
].join(',')
const AUTHOR_HIDDEN = '[hidden],[inert]'
const BREAK_SPACE = /^[\t\n\f\r \u1680\u2000-\u2006\u2008-\u200b\u2028\u2029\u205f\u3000]+$/
const WHITE_SPACE = /^\s*$/u
const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u

interface Glyph {
  id: string
  element: HTMLElement
  slot: HTMLElement
  run: TextRun
}

interface TextRun {
  source: Text
  parent: HTMLElement
  owner: AdaptTarget
  text: string
  size: number
  id: string
  path: number[]
  signature: string
  wrapper: HTMLElement
  glyphs: Glyph[]
  /** Includes writes of "" to an already blank node, which comparison misses. */
  overwritten: boolean
  touched: number
}

interface Word {
  element: HTMLElement
  source: Text
  segments: Segment[]
  start: number
}

interface SavedRun {
  offsets: Set<number>
}

interface Hit {
  target: AdaptTarget
  distance: number
}

function distanceSquared(rect: DOMRect, x: number, y: number): number {
  return Math.max(rect.left - x, 0, x - rect.right) ** 2
    + Math.max(rect.top - y, 0, y - rect.bottom) ** 2
}

function containsPoint(rect: DOMRect, x: number, y: number): boolean {
  return rect.width > 0 && rect.height > 0 && distanceSquared(rect, x, y) === 0
}

/**
 * Only this layer's wrappers move. React's original Text nodes never leave
 * their parent and are restored only if React has not written a newer value.
 */
export function createCharacterLayer(dom: CharacterDom) {
  const doc = document
  const win = doc.defaultView ?? window
  const runs = new Set<TextRun>()
  const bySource = new WeakMap<Text, TextRun>()
  const glyphs = new Map<string, Glyph>()
  const wrappers = new WeakSet<Node>()
  const markedActions = new Map<HTMLElement, string | null>()
  const dirtyActions = new Set<HTMLElement>()
  let saved = new Map<string, Map<string, SavedRun>>()
  const pendingParents = new Set<string>()
  let timer: ReturnType<typeof setTimeout> | undefined
  let destroyed = false
  let writing = false
  let processing = false
  let stamp = 0
  let materializedCount = 0
  let needsPrune = false

  function html(element: Element): element is HTMLElement {
    return element.namespaceURI === 'http://www.w3.org/1999/xhtml'
  }

  function protectedElement(element: Element): boolean {
    return !html(element) || !!element.closest(EXCLUDED)
  }

  function eligible(source: Text): boolean {
    const parent = source.parentElement
    return !!parent && source.isConnected && !!parent.closest('.site-shell')
      && !protectedElement(parent) && !parent.closest(`[${RUN_ATTRIBUTE}],${AUTHOR_HIDDEN}`)
  }

  function valid(run: TextRun): boolean {
    return !run.overwritten && run.source.data === '' && run.source.parentNode === run.parent
      && run.wrapper.parentNode === run.parent && run.source.isConnected
      && !protectedElement(run.parent)
  }

  function actionFor(element: Element): HTMLElement | null {
    const action = element.closest(ACTIONS)
    return action && html(action) && !action.closest('[data-adapt-ui]') ? action : null
  }

  function restoreMarker(action: HTMLElement) {
    if (!markedActions.has(action)) return
    const original = markedActions.get(action)!
    if (action.getAttribute(EMPTY_ACTION) === '') {
      if (original === null) action.removeAttribute(EMPTY_ACTION)
      else action.setAttribute(EMPTY_ACTION, original)
    }
    markedActions.delete(action)
  }

  function markAction(action: HTMLElement, empty: boolean) {
    if (!empty) {
      restoreMarker(action)
      return
    }
    if (!markedActions.has(action)) markedActions.set(action, action.getAttribute(EMPTY_ACTION))
    if (action.getAttribute(EMPTY_ACTION) !== '') action.setAttribute(EMPTY_ACTION, '')
  }

  function ownerFor(source: Text): AdaptTarget | null {
    let parent = source.parentElement
    for (let depth = 0; parent && depth < MAX_DEPTH; depth++, parent = parent.parentElement) {
      if (parent.matches('.site-shell') || protectedElement(parent)) return null
      const target = dom.targetForElement(parent)
      if (target && target.kind !== 'character') return target
    }
    return null
  }

  function sourcePath(source: Text, owner: HTMLElement): number[] | null {
    const path: number[] = []
    let current: Node | null = source
    let visits = 0
    while (current && current !== owner && path.length < MAX_DEPTH) {
      let index = 0
      for (let sibling = current.previousSibling; sibling; sibling = sibling.previousSibling) {
        if (++visits > MAX_WALK) return null
        // Adding a wrapper must not change another original Text node's key.
        if (!wrappers.has(sibling) && sibling.nodeType !== 8) index++
      }
      path.push(index)
      current = current.parentNode
    }
    return current === owner ? path.reverse() : null
  }

  function fontSignature(parent: HTMLElement): string {
    const style = win.getComputedStyle(parent)
    return [
      style.fontFamily, style.fontSize, style.fontWeight, style.fontStyle,
      style.fontStretch, style.fontVariant, style.fontFeatureSettings,
      style.fontVariationSettings, style.fontKerning, style.letterSpacing,
      style.wordSpacing, style.lineHeight, style.textTransform, style.whiteSpace,
      style.direction, style.writingMode, style.display,
    ].join('|')
  }

  function observe() {
    if (destroyed) return
    observer.observe(doc.body ?? doc.documentElement, {
      subtree: true, childList: true, characterData: true,
      attributes: true,
      attributeFilter: [DELETED_ATTRIBUTE, 'hidden', 'inert', 'contenteditable'],
    })
  }

  function drain() {
    if (writing || processing || destroyed) return
    const records = observer.takeRecords()
    if (records.length) acceptMutations(records)
  }

  function ownWrite(work: () => void) {
    if (writing) {
      work()
      return
    }
    // Consume React writes *before* disconnecting, especially writes of "".
    drain()
    observer.disconnect()
    writing = true
    try { work() }
    finally {
      writing = false
      observe()
    }
  }

  function release(run: TextRun) {
    if (!runs.has(run)) return
    runs.delete(run)
    bySource.delete(run.source)
    const action = actionFor(run.parent)
    if (action) {
      restoreMarker(action)
      dirtyActions.add(action)
    }
    ownWrite(() => {
      // A removed/replaced Text node is never reinserted. A real React write,
      // including an empty value, always wins over our remembered string.
      if (!run.overwritten && run.source.data === '' && run.source.parentNode === run.parent) {
        run.source.data = run.text
      }
      run.wrapper.remove()
    })
    for (const glyph of run.glyphs) glyphs.delete(glyph.id)
    materializedCount -= run.size
  }

  function prune(checkFonts = false) {
    needsPrune = false
    for (const run of runs) {
      if (!valid(run) || (checkFonts && fontSignature(run.parent) !== run.signature)) {
        pendingParents.add(run.owner.id)
        release(run)
      }
    }
    for (const action of markedActions.keys()) {
      if (!action.isConnected) restoreMarker(action)
    }
  }

  function savedRun(run: TextRun): boolean {
    return !!saved.get(run.owner.id)?.has(run.id)
      || run.glyphs.some(glyph => glyph.element.hasAttribute(DELETED_ATTRIBUTE) || glyph.element.style.length > 0)
  }

  function makeRoom(count: number): boolean {
    if (count > MAX_RUN_GLYPHS || count > MAX_GLYPHS) return false
    if (materializedCount + count <= MAX_GLYPHS && runs.size < MAX_RUNS) return true
    const disposable = [...runs].filter(run => !savedRun(run)).sort((a, b) => a.touched - b.touched)
    for (const run of disposable) {
      release(run)
      if (materializedCount + count <= MAX_GLYPHS && runs.size < MAX_RUNS) return true
    }
    return false
  }

  /** Walk original nodes only; never walk thousands of our own glyph spans. */
  function textSources(root: HTMLElement, visit: (source: Text) => boolean | void): boolean {
    if (protectedElement(root)) return false
    const walker = doc.createTreeWalker(root, 1 | 4, {
      acceptNode(node) {
        if (node.nodeType === 3) return 1
        const element = node as Element
        return protectedElement(element) || wrappers.has(element)
          || element.matches(AUTHOR_HIDDEN) ? 2 : 1
      },
    })
    let node: Node | null
    let count = 0
    while ((node = walker.nextNode())) {
      if (count++ >= MAX_WALK) return false
      if (node.nodeType === 3 && visit(node as Text) === false) return false
    }
    return true
  }

  function sourceRect(source: Text): DOMRect | null {
    const existing = bySource.get(source)
    if (existing && valid(existing)) {
      // display:contents has no box; the first/last words give a useful broad
      // discovery bound. Final hit tests always use individual glyph/slot boxes.
      const range = doc.createRange()
      range.selectNodeContents(existing.wrapper)
      return range.getBoundingClientRect()
    }
    if (!source.data) return null
    const range = doc.createRange()
    range.selectNodeContents(source)
    return range.getBoundingClientRect()
  }

  function glyphTarget(glyph: Glyph): AdaptTarget | null {
    if (!valid(glyph.run) || !glyph.element.isConnected) return null
    const registered = dom.targetForElement(glyph.element)
    if (registered?.id !== glyph.id || registered.element !== glyph.element) return null
    // The controller immediately calls get(id); don't return a private shadow target.
    const target = dom.get(glyph.id)
    return target?.element === glyph.element ? target : null
  }

  function measuredAdvances(word: Word): { widths: number[], width: number } {
    const width = Number.parseFloat(win.getComputedStyle(word.element).width)
    const range = doc.createRange()
    const caret = (offset: number) => {
      range.setStart(word.source, offset)
      range.collapse(true)
      return range.getBoundingClientRect()
    }
    const first = caret(0)
    const last = caret(word.source.length)
    const vx = last.left - first.left, vy = last.top - first.top
    const lengthSquared = vx * vx + vy * vy
    const positions = [0]
    if (Number.isFinite(width) && width > 0 && lengthSquared > .0001) {
      for (const segment of word.segments) {
        const point = caret(segment.end - word.start)
        positions.push(((point.left - first.left) * vx + (point.top - first.top) * vy) / lengthSquared * width)
      }
      positions[positions.length - 1] = width
      if (positions.every((position, i) => Number.isFinite(position)
        && position >= -.05 && position <= width + .05 && (!i || position + .05 >= positions[i - 1]))) {
        return {
          width,
          widths: word.segments.map((_, i) => Math.max(0, positions[i + 1] - positions[i])),
        }
      }
    }
    // Bidi caret jumps and unusual fonts can defeat prefix projection. Preserve
    // the exact word width, distributing it by actual cluster range widths.
    const raw = word.segments.map(segment => {
      range.setStart(word.source, segment.start - word.start)
      range.setEnd(word.source, segment.end - word.start)
      return Math.max(0, range.getBoundingClientRect().width)
    })
    const total = raw.reduce((sum, advance) => sum + advance, 0)
    const measured = Number.isFinite(width) && width >= 0 ? width : total
    return {
      width: measured,
      widths: raw.map(advance => total > 0 ? advance / total * measured : measured / Math.max(1, raw.length)),
    }
  }

  function materialize(source: Text, knownOwner?: AdaptTarget): TextRun | null {
    const previous = bySource.get(source)
    if (previous && valid(previous)) {
      previous.touched = ++stamp
      return previous
    }
    if (previous) release(previous)
    if (!eligible(source) || !source.data || source.data.length > MAX_RUN_UNITS || WHITE_SPACE.test(source.data)) return null
    const owner = knownOwner ?? ownerFor(source)
    const parent = source.parentElement
    if (!owner || !parent) return null
    const style = win.getComputedStyle(parent)
    if (style.display === 'none' || style.visibility !== 'visible' || style.writingMode !== 'horizontal-tb') return null
    const path = sourcePath(source, owner.element)
    if (!path) return null
    const text = source.data
    const segments = segmentGraphemes(text)
    const count = segments.filter(segment => !WHITE_SPACE.test(segment.text) && !BREAK_SPACE.test(segment.text)).length
    // Count whitespace toward the materialization budget too; a run of NBSPs
    // must not create an unbounded number of otherwise uncounted slots.
    if (!count || !makeRoom(segments.length)) return null
    const id = textRunId(text, path)
    const wrapper = doc.createElement('span')
    wrapper.setAttribute(RUN_ATTRIBUTE, id)
    // A React Text node is one anonymous flex/grid item. Keep that grouping,
    // otherwise each word would become a separate item and inherit the gap.
    if (style.display.includes('flex') || style.display.includes('grid')) {
      wrapper.style.display = 'inline-block'
    }
    wrappers.add(wrapper)
    const run: TextRun = {
      source, parent, owner, text, size: segments.length, id, path, signature: fontSignature(parent),
      wrapper, glyphs: [], overwritten: false, touched: ++stamp,
    }
    const words: Word[] = []
    let pending: Segment[] = []
    let whitespace = ''
    const flushSpace = () => {
      if (whitespace) wrapper.append(doc.createTextNode(whitespace))
      whitespace = ''
    }
    const flushWord = () => {
      if (!pending.length) return
      const element = doc.createElement('span')
      element.setAttribute(WORD_ATTRIBUTE, '')
      element.style.display = 'inline-block'
      element.style.whiteSpace = 'pre'
      element.style.textIndent = '0'
      const wordSource = doc.createTextNode(pending.map(segment => segment.text).join(''))
      element.append(wordSource)
      wrapper.append(element)
      words.push({ element, source: wordSource, segments: pending, start: pending[0].start })
      pending = []
    }
    for (const segment of segments) {
      if (BREAK_SPACE.test(segment.text)) {
        flushWord()
        whitespace += segment.text
      } else {
        flushSpace()
        // CJK retains its ordinary inter-character wrapping opportunities.
        const cjk = CJK.test(segment.text) && style.wordBreak !== 'keep-all' && style.whiteSpace !== 'nowrap'
        if (cjk) flushWord()
        pending.push(segment)
        if (cjk || /[-\u2010]$/.test(segment.text)) flushWord()
      }
    }
    flushWord()
    flushSpace()
    ownWrite(() => {
      // React could have written between a prior discovery and this operation.
      if (source.parentNode !== parent || source.data !== text) return
      source.data = ''
      parent.insertBefore(wrapper, source.nextSibling)
      runs.add(run)
      bySource.set(source, run)
      materializedCount += run.size
      try {
        const metrics = words.map(measuredAdvances)
        words.forEach((word, wordIndex) => {
          const { widths, width } = metrics[wordIndex]
          const fragment = doc.createDocumentFragment()
          word.element.style.width = `${Math.max(0, width).toFixed(4)}px`
          word.segments.forEach((segment, i) => {
            // NBSP remains inside its word, but is not an invisible destruction target.
            if (WHITE_SPACE.test(segment.text)) {
              const space = doc.createElement('span')
              space.style.display = 'inline-block'
              space.style.width = `${widths[i].toFixed(4)}px`
              space.textContent = segment.text
              fragment.append(space)
              return
            }
            const glyphId = characterId(owner.id, id, segment.start)
            const slot = doc.createElement('span')
            const element = doc.createElement('span')
            slot.setAttribute(SLOT_ATTRIBUTE, glyphId)
            slot.style.width = `${widths[i].toFixed(4)}px`
            element.setAttribute(GLYPH_ATTRIBUTE, glyphId)
            element.textContent = segment.text
            slot.append(element)
            fragment.append(slot)
            const glyph: Glyph = { id: glyphId, element, slot, run }
            run.glyphs.push(glyph)
          })
          word.element.replaceChildren(fragment) // Only our own temporary word text.
        })
        for (const glyph of run.glyphs) {
          glyphs.set(glyph.id, glyph)
          dom.targetForElement(glyph.element)
        }
      } catch {
        // Unsupported/failed geometry must leave the live author text usable.
        release(run)
      }
    })
    if (!runs.has(run)) return null
    const action = actionFor(parent)
    if (action) dirtyActions.add(action)
    return run
  }

  function iconRemains(action: HTMLElement): boolean {
    const icons = action.querySelectorAll(MEDIA)
    for (let i = 0; i < Math.min(icons.length, 128); i++) {
      const icon = icons[i]
      if (icon.closest(AUTHOR_HIDDEN)) continue
      const style = win.getComputedStyle(icon)
      // Decorative SVGs often carry aria-hidden yet remain visibly meaningful.
      if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') return true
    }
    for (const pseudo of ['::before', '::after']) {
      const style = win.getComputedStyle(action, pseudo)
      if (style.display !== 'none' && style.content && !/^(none|normal|""|'')$/.test(style.content)) return true
    }
    return false
  }

  function updateAction(action: HTMLElement): boolean {
    if (!action.isConnected || protectedElement(action)) {
      restoreMarker(action)
      return false
    }
    // Our marker hides the action via CSS. Remove it during the synchronous
    // inspection so it cannot conceal a newly inserted icon from this check.
    const marked = markedActions.has(action)
    if (marked && action.getAttribute(EMPTY_ACTION) === '') action.removeAttribute(EMPTY_ACTION)
    let anyCharacters = false
    let live = false
    const complete = textSources(action, source => {
      const run = bySource.get(source)
      if (run && valid(run)) {
        for (const glyph of run.glyphs) {
          anyCharacters = true
          if (!glyph.element.hasAttribute(DELETED_ATTRIBUTE)) {
            live = true
            return false
          }
        }
      } else if (!WHITE_SPACE.test(source.data)) {
        live = true
        return false
      }
    })
    const empty = complete && anyCharacters && !live && !iconRemains(action)
    if (marked && !empty) {
      // Restore the tracked baseline, despite temporarily removing our value.
      if (action.getAttribute(EMPTY_ACTION) === null) action.setAttribute(EMPTY_ACTION, '')
    }
    markAction(action, empty)
    return empty
  }

  function updateActions() {
    let count = 0
    for (const action of dirtyActions) {
      dirtyActions.delete(action)
      updateAction(action)
      if (++count >= 32) break
    }
  }

  function replayParent(parentId: string) {
    const wanted = saved.get(parentId)
    if (!wanted) return
    const owner = dom.get(parentId)
    if (!owner || owner.kind === 'character') return
    textSources(owner.element, source => {
      const active = bySource.get(source)
      if (active && valid(active)) {
        if (active.owner.id === parentId && wanted.has(active.id)) {
          for (const glyph of active.glyphs) {
            const parsed = parseCharacterId(glyph.id)
            if (parsed && wanted.get(active.id)?.offsets.has(parsed.offset)) glyphTarget(glyph)
          }
        }
        return
      }
      if (!eligible(source) || !source.data || source.data.length > MAX_RUN_UNITS) return
      const path = sourcePath(source, owner.element)
      if (!path || !wanted.has(textRunId(source.data, path))) return
      const actualOwner = ownerFor(source)
      if (actualOwner?.id !== parentId) return
      materialize(source, owner)
    })
  }

  function flush() {
    if (destroyed) return
    drain()
    if (needsPrune) prune()
    const started = win.performance.now()
    let count = 0
    for (const parentId of pendingParents) {
      pendingParents.delete(parentId)
      replayParent(parentId)
      if (++count >= 12 || win.performance.now() - started >= 8) break
    }
    updateActions()
    if (pendingParents.size || dirtyActions.size || needsPrune) schedule()
  }

  function schedule() {
    if (destroyed || timer !== undefined) return
    timer = setTimeout(() => {
      timer = undefined
      flush()
    }, BATCH_MS)
  }

  function acceptMutations(records: MutationRecord[]) {
    if (destroyed || processing) return
    processing = true
    let structureChanged = false
    const overwritten = new Set<TextRun>()
    try {
      for (const record of records) {
        if (record.type === 'characterData') {
          const run = bySource.get(record.target as Text)
          if (run) {
            run.overwritten = true
            overwritten.add(run)
          }
        } else if (record.type === 'attributes') {
          const element = record.target as Element
          if (record.attributeName === DELETED_ATTRIBUTE) {
            const action = actionFor(element)
            if (action) dirtyActions.add(action)
          } else if (!element.closest(`[${RUN_ATTRIBUTE}],[data-adapt-ui]`)) structureChanged = true
        } else {
          const element = record.target.nodeType === 1 ? record.target as Element : record.target.parentElement
          if (element && !protectedElement(element) && !element.closest(`[${RUN_ATTRIBUTE}]`)) structureChanged = true
        }
      }
      for (const run of overwritten) {
        pendingParents.add(run.owner.id)
        release(run)
      }
      if (structureChanged) {
        needsPrune = true
        // Parent removals must discard wrappers before another painted frame.
        prune()
        for (const parentId of saved.keys()) pendingParents.add(parentId)
      }
    } finally { processing = false }
    if (pendingParents.size || dirtyActions.size || needsPrune) schedule()
  }

  const observer = new MutationObserver(acceptMutations)
  observe()
  const unsubscribe = dom.subscribeTargets(() => {
    if (destroyed) return
    needsPrune = true
    for (const parentId of saved.keys()) pendingParents.add(parentId)
    schedule()
  })

  function discover(x: number, y: number, radius: number, hit?: AdaptTarget | null): AdaptTarget[] {
    const candidates = new Map<string, AdaptTarget>()
    const direct = hit ?? dom.find(x, y)
    if (direct && direct.kind !== 'character') candidates.set(direct.id, direct)
    for (const target of dom.nearby(x, y, radius, 48)) {
      if (target.kind !== 'character') candidates.set(target.id, target)
    }
    const media: AdaptTarget[] = []
    let newRuns = 0
    for (const target of candidates.values()) {
      if (target.element.matches(`figure,${MEDIA}`)) {
        media.push(target)
        if (target.element.matches(MEDIA)) continue
      }
      textSources(target.element, source => {
        if (newRuns >= 8) return false
        if (bySource.has(source)) return
        if (!eligible(source) || !source.data || WHITE_SPACE.test(source.data)) return
        const rect = sourceRect(source)
        if (!rect || rect.width <= 0 || rect.height <= 0 || distanceSquared(rect, x, y) > radius * radius) return
        if (materialize(source)) newRuns++
      })
    }
    return media
  }

  function caretSource(x: number, y: number): Text | null {
    const caretDocument = doc as Document & {
      caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node } | null
      caretRangeFromPoint?: (x: number, y: number) => Range | null
    }
    const position = caretDocument.caretPositionFromPoint?.(x, y)
    const node = position?.offsetNode ?? caretDocument.caretRangeFromPoint?.(x, y)?.startContainer
    return node?.nodeType === 3 && eligible(node as Text) ? node as Text : null
  }

  function find(x: number, y: number): AdaptTarget | null {
    if (destroyed || !Number.isFinite(x) || !Number.isFinite(y)) return null
    drain()
    if (needsPrune) prune()
    const hit = doc.elementFromPoint(x, y)
    if (!hit || hit.closest('[data-adapt-ui]')) return null
    if (protectedElement(hit)) {
      // SVG internals stay untouched, but their containing figure is still media.
      const media = hit.closest('svg') ? dom.find(x, y) : null
      return media?.element.matches(`figure,${MEDIA}`) ? media : null
    }
    const element = hit.closest<HTMLElement>(`[${GLYPH_ATTRIBUTE}]`)
    if (element) {
      const glyph = glyphs.get(element.getAttribute(GLYPH_ATTRIBUTE) ?? '')
      if (glyph && !element.hasAttribute(DELETED_ATTRIBUTE)) {
        glyph.run.touched = ++stamp
        return glyphTarget(glyph)
      }
      return null
    }
    const slot = hit.closest<HTMLElement>(`[${SLOT_ATTRIBUTE}]`)
    if (slot && glyphs.get(slot.getAttribute(SLOT_ATTRIBUTE) ?? '')?.element.hasAttribute(DELETED_ATTRIBUTE)) return null
    const source = caretSource(x, y)
    if (source) materialize(source)
    const media = discover(x, y, 0)
    const liveRuns = new Set([...runs].filter(valid))
    for (const glyph of glyphs.values()) {
      if (glyph.element.hasAttribute(DELETED_ATTRIBUTE) || !liveRuns.has(glyph.run)) continue
      if (containsPoint(glyph.slot.getBoundingClientRect(), x, y) || containsPoint(glyph.element.getBoundingClientRect(), x, y)) {
        glyph.run.touched = ++stamp
        const target = glyphTarget(glyph)
        if (target) {
          updateActions()
          return target
        }
      }
    }
    updateActions()
    return media.find(target => containsPoint(target.rect(), x, y)) ?? null
  }

  function nearby(x: number, y: number, radius: number, limit = 64): AdaptTarget[] {
    if (destroyed || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius) || radius < 0) return []
    const count = Number.isFinite(limit) ? Math.max(0, Math.min(256, Math.floor(limit))) : 64
    if (!count) return []
    drain()
    if (needsPrune) prune()
    const reach = Math.min(radius, 2_000)
    const media = discover(x, y, reach)
    const matches: { glyph: Glyph, distance: number }[] = []
    const liveRuns = new Set([...runs].filter(valid))
    for (const glyph of glyphs.values()) {
      if (!liveRuns.has(glyph.run) || glyph.element.hasAttribute(DELETED_ATTRIBUTE)) continue
      const rect = glyph.element.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) continue
      const distance = distanceSquared(rect, x, y)
      if (distance <= reach * reach) matches.push({ glyph, distance })
    }
    matches.sort((a, b) => a.distance - b.distance || a.glyph.id.localeCompare(b.glyph.id))
    const hits: Hit[] = []
    for (const match of matches) {
      const target = glyphTarget(match.glyph)
      if (target) {
        match.glyph.run.touched = ++stamp
        hits.push({ target, distance: match.distance })
      }
      if (hits.length >= count) break
    }
    for (const target of media) {
      if (matches.some(match => target.element.contains(match.glyph.element))) continue
      const distance = distanceSquared(target.rect(), x, y)
      if (distance <= reach * reach) hits.push({ target, distance })
    }
    updateActions()
    return hits.sort((a, b) => a.distance - b.distance).slice(0, count).map(hit => hit.target)
  }

  function apply(page: AdaptPage) {
    if (destroyed) return
    drain()
    const next = new Map<string, Map<string, SavedRun>>()
    let count = 0
    for (const id in page.elements) {
      if (!Object.hasOwn(page.elements, id)) continue
      if (++count > ADAPT_LIMITS.elements) break
      const parsed = parseCharacterId(id)
      if (!parsed) continue
      let parent = next.get(parsed.parentId)
      if (!parent) {
        parent = new Map()
        next.set(parsed.parentId, parent)
      }
      let run = parent.get(parsed.runId)
      if (!run) {
        run = { offsets: new Set() }
        parent.set(parsed.runId, run)
      }
      run.offsets.add(parsed.offset)
    }
    saved = next
    // Re-measure when normal element Edit changes a heading/paragraph's font.
    // Individual glyph transforms do not affect this parent font signature.
    prune(true)
    for (const parentId of saved.keys()) pendingParents.add(parentId)
    for (const run of runs) {
      const action = actionFor(run.parent)
      if (action) dirtyActions.add(action)
    }
    flush()
  }

  function blockedAt(x: number, y: number): boolean {
    if (destroyed || !Number.isFinite(x) || !Number.isFinite(y)) return false
    drain()
    const hit = doc.elementFromPoint(x, y)
    if (hit?.closest('[data-adapt-ui]')) return false
    const direct = hit?.closest<HTMLElement>(`[${GLYPH_ATTRIBUTE}]`)
    if (direct?.hasAttribute(DELETED_ATTRIBUTE)) return true
    // A vortex may have moved the glyph far away. Inspect the *slot's child*
    // and its original box, never just elementFromPoint's nearest glyph.
    const liveRuns = new Set([...runs].filter(valid))
    for (const glyph of glyphs.values()) {
      if (!liveRuns.has(glyph.run) || !glyph.element.hasAttribute(DELETED_ATTRIBUTE)) continue
      if (containsPoint(glyph.slot.getBoundingClientRect(), x, y)) return true
    }
    return false
  }

  function actionDestroyed(element: Element | null): boolean {
    if (destroyed || !element) return false
    drain()
    const action = actionFor(element)
    return !!action && updateAction(action)
  }

  function clear() {
    if (destroyed) return
    drain()
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    saved.clear()
    pendingParents.clear()
    ownWrite(() => { for (const run of runs) release(run) })
    for (const action of markedActions.keys()) restoreMarker(action)
    dirtyActions.clear()
    glyphs.clear()
    materializedCount = 0
    needsPrune = false
  }

  function destroy() {
    if (destroyed) return
    clear()
    destroyed = true
    unsubscribe()
    observer.disconnect()
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }

  return { find, nearby, apply, clear, destroy, blockedAt, actionDestroyed }
}
