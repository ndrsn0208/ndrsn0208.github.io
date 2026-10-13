import {
  ADAPT_ENABLED_KEY,
  ADAPT_LIMITS,
  ADAPT_STORAGE_KEY,
  ADAPT_VERSION,
  clamp,
  type AdaptDocument,
  type AdaptFont,
  type AdaptPage,
  type AdaptPoint,
  type AdaptSnapshot,
  type AdaptStroke,
  type DiffusionPatch,
  type ElementPatch,
  type LayoutSpec,
  type SaveStatus,
} from './model'

const SAVE_DELAY_MS = 250
const MAX_KEY_LENGTH = 2_048
const MAX_ID_LENGTH = 256
const MAX_Y = 100_000
const MAX_SEED = Number.MAX_SAFE_INTEGER
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const FONTS = new Set<AdaptFont>(['original', 'book', 'sans', 'mono', 'poster'])
const PATCH_BOUNDS = {
  dx: [-4, 4],
  dy: [-MAX_Y, MAX_Y],
  rotation: [-3_600, 3_600],
  scale: [0.1, 8],
  fontScale: [0.25, 8],
  weight: [100, 900],
  letterSpacing: [-20, 20],
  damage: [0, 1],
} as const

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

// Read only data properties. Neither inherited fields nor accessors are state.
function own(value: object, key: string): unknown {
  return Object.getOwnPropertyDescriptor(value, key)?.value
}

function validKey(value: unknown, maxLength = MAX_KEY_LENGTH): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength
    && !FORBIDDEN_KEYS.has(value) && !/[\u0000-\u001f\u007f<>]/.test(value)
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function color(value: unknown): string | undefined {
  return typeof value === 'string' && value.length <= 9
    && /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)
    ? value.toLowerCase()
    : undefined
}

function seed(value: unknown): number {
  return finite(value) ? Math.floor(clamp(value, 0, MAX_SEED)) : 0
}

function normalizeElement(value: unknown): ElementPatch {
  const patch: ElementPatch = {}
  if (!isRecord(value)) return patch
  for (const key of Object.keys(PATCH_BOUNDS) as (keyof typeof PATCH_BOUNDS)[]) {
    const number = own(value, key)
    if (finite(number)) {
      const [low, high] = PATCH_BOUNDS[key]
      patch[key] = clamp(number, low, high)
    }
  }
  const font = own(value, 'font')
  if (typeof font === 'string' && FONTS.has(font as AdaptFont)) patch.font = font as AdaptFont
  const hex = color(own(value, 'color'))
  if (hex !== undefined) patch.color = hex
  for (const key of ['italic', 'hidden'] as const) {
    const boolean = own(value, key)
    if (typeof boolean === 'boolean') patch[key] = boolean
  }
  return patch
}

function normalizePoints(value: unknown): AdaptPoint[] {
  if (!Array.isArray(value)) return []
  const count = Math.min(value.length, ADAPT_LIMITS.points)
  const points: AdaptPoint[] = []
  for (let i = 0; i < count; i++) {
    // Sampling retains both ends of a long gesture without walking an unbounded array.
    const index = count <= 1 ? 0 : Math.round(i * (value.length - 1) / (count - 1))
    const point = own(value, String(index))
    if (!isRecord(point)) continue
    const x = own(point, 'x')
    const y = own(point, 'y')
    if (!finite(x) || !finite(y)) continue
    const next: AdaptPoint = { x: clamp(x, 0, 1), y: clamp(y, 0, MAX_Y) }
    const pressure = own(point, 'pressure')
    if (finite(pressure)) next.pressure = clamp(pressure, 0, 1)
    points.push(next)
  }
  return points
}

function normalizeStroke(value: unknown): AdaptStroke | undefined {
  if (!isRecord(value)) return
  const id = own(value, 'id')
  const hex = color(own(value, 'color'))
  const width = own(value, 'width')
  if (!validKey(id, MAX_ID_LENGTH) || hex === undefined || !finite(width)) return
  const points = normalizePoints(own(value, 'points'))
  if (!points.length) return
  return { id, color: hex, width: clamp(width, 1, 100), points }
}

function normalizeDiffusion(value: unknown): DiffusionPatch | undefined {
  if (!isRecord(value)) return
  const id = own(value, 'id')
  const hex = color(own(value, 'color'))
  const x = own(value, 'x')
  const y = own(value, 'y')
  const radius = own(value, 'radius')
  const rawSeed = own(value, 'seed')
  const phase = own(value, 'phase')
  const amount = own(value, 'amount')
  if (!validKey(id, MAX_ID_LENGTH) || hex === undefined || !finite(x) || !finite(y)
    || !finite(radius) || !finite(rawSeed) || !finite(phase) || !finite(amount)) return
  return {
    id,
    color: hex,
    x: clamp(x, 0, 1),
    y: clamp(y, 0, MAX_Y),
    radius: clamp(radius, 8, 1_200),
    seed: seed(rawSeed),
    phase: clamp(phase, 0, 1_000_000),
    amount: clamp(amount, 0, 1),
  }
}

function normalizeLayout(value: unknown): LayoutSpec {
  if (isRecord(value)) {
    const kind = own(value, 'kind')
    if (kind === 'columns' || kind === 'shuffle') return { kind, seed: seed(own(value, 'seed')) }
  }
  return { kind: 'original', seed: 0 }
}

function recentItems<T extends { id: string }>(
  value: unknown,
  limit: number,
  normalize: (item: unknown) => T | undefined,
): T[] {
  if (!Array.isArray(value)) return []
  const result: T[] = []
  const seen = new Set<string>()
  for (let i = value.length - 1; i >= Math.max(0, value.length - limit); i--) {
    const item = normalize(own(value, String(i)))
    if (item && !seen.has(item.id)) {
      result.push(item)
      seen.add(item.id)
    }
  }
  return result.reverse()
}

function freezePage(page: AdaptPage): AdaptPage {
  for (const patch of Object.values(page.elements)) Object.freeze(patch)
  for (const stroke of page.strokes) {
    for (const point of stroke.points) Object.freeze(point)
    Object.freeze(stroke.points)
    Object.freeze(stroke)
  }
  for (const diffusion of page.diffusions) Object.freeze(diffusion)
  Object.freeze(page.elements)
  Object.freeze(page.strokes)
  Object.freeze(page.diffusions)
  Object.freeze(page.layout)
  return Object.freeze(page)
}

const EMPTY_PAGE = freezePage({
  elements: {},
  strokes: [],
  diffusions: [],
  layout: { kind: 'original', seed: 0 },
})

function isEmpty(page: AdaptPage): boolean {
  return Object.keys(page.elements).length === 0 && page.strokes.length === 0
    && page.diffusions.length === 0 && page.layout.kind === 'original'
}

/** Copy and validate model fields only; callers cannot mutate stored snapshots. */
export function normalizeAdaptPage(value: unknown): AdaptPage {
  if (!isRecord(value)) return EMPTY_PAGE
  const elements: Record<string, ElementPatch> = {}
  const rawElements = own(value, 'elements')
  if (isRecord(rawElements)) {
    for (const key of Object.keys(rawElements).slice(-ADAPT_LIMITS.elements)) {
      if (!validKey(key, MAX_ID_LENGTH)) continue
      const patch = normalizeElement(own(rawElements, key))
      if (Object.keys(patch).length) elements[key] = patch
    }
  }
  const page: AdaptPage = {
    elements,
    strokes: recentItems(own(value, 'strokes'), ADAPT_LIMITS.strokes, normalizeStroke),
    diffusions: recentItems(own(value, 'diffusions'), ADAPT_LIMITS.diffusions, normalizeDiffusion),
    layout: normalizeLayout(own(value, 'layout')),
  }
  return isEmpty(page) ? EMPTY_PAGE : freezePage(page)
}

const EMPTY_DOCUMENT_CHARS = JSON.stringify({
  version: ADAPT_VERSION, enabled: false, pages: {},
}).length

function trimPage(page: AdaptPage, initialChars: number, budget: number): AdaptPage {
  let chars = initialChars
  let strokeStart = 0
  let diffusionStart = 0
  const elements = { ...page.elements }
  while (chars > budget && strokeStart < page.strokes.length) {
    chars -= JSON.stringify(page.strokes[strokeStart]).length
      + Number(strokeStart < page.strokes.length - 1)
    strokeStart++
  }
  while (chars > budget && diffusionStart < page.diffusions.length) {
    chars -= JSON.stringify(page.diffusions[diffusionStart]).length
      + Number(diffusionStart < page.diffusions.length - 1)
    diffusionStart++
  }
  const keys = Object.keys(elements)
  for (let i = 0; chars > budget && i < keys.length; i++) {
    const key = keys[i]
    chars -= JSON.stringify(key).length + 1 + JSON.stringify(elements[key]).length
      + Number(i < keys.length - 1)
    delete elements[key]
  }
  if (chars > budget) return EMPTY_PAGE
  return freezePage({
    elements,
    strokes: page.strokes.slice(strokeStart),
    diffusions: page.diffusions.slice(diffusionStart),
    layout: page.layout,
  })
}

/** Count limits alone can still exceed the byte budget with many long strokes. */
function boundPages(value: Record<string, AdaptPage>): Record<string, AdaptPage> {
  const entries = Object.keys(value).slice(-ADAPT_LIMITS.pages).map(key => ({
    key,
    page: value[key],
    chars: JSON.stringify(value[key]).length,
    keyChars: JSON.stringify(key).length + 1,
  }))
  let chars = EMPTY_DOCUMENT_CHARS + Math.max(0, entries.length - 1)
    + entries.reduce((sum, entry) => sum + entry.keyChars + entry.chars, 0)
  let start = 0
  // The most recently committed page survives both the page and total-size limits.
  while (chars > ADAPT_LIMITS.serializedChars && start < entries.length - 1) {
    chars -= entries[start].keyChars + entries[start].chars + 1
    start++
  }
  const pages: Record<string, AdaptPage> = {}
  for (let i = start; i < entries.length; i++) {
    const entry = entries[i]
    const page = chars > ADAPT_LIMITS.serializedChars
      ? trimPage(entry.page, entry.chars,
        ADAPT_LIMITS.serializedChars - EMPTY_DOCUMENT_CHARS - entry.keyChars)
      : entry.page
    if (!isEmpty(page)) pages[entry.key] = page
  }
  return Object.freeze(pages)
}

/** Unknown versions are discarded rather than interpreted as the current schema. */
export function normalizeAdaptDocument(value: unknown): AdaptDocument {
  let enabled = false
  const pages: Record<string, AdaptPage> = {}
  if (isRecord(value) && own(value, 'version') === ADAPT_VERSION) {
    enabled = own(value, 'enabled') === true
    const rawPages = own(value, 'pages')
    if (isRecord(rawPages)) {
      for (const key of Object.keys(rawPages).slice(-ADAPT_LIMITS.pages)) {
        if (!validKey(key)) continue
        const page = normalizeAdaptPage(own(rawPages, key))
        if (!isEmpty(page)) pages[key] = page
      }
    }
  }
  return Object.freeze({ version: ADAPT_VERSION, enabled, pages: boundPages(pages) })
}

function browserStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

function readDocument(storage: Storage | undefined): { document: AdaptDocument; status: SaveStatus } {
  let document = normalizeAdaptDocument(undefined)
  if (!storage) return { document, status: 'memory' }
  let status: SaveStatus = 'saved'
  try {
    const raw = storage.getItem(ADAPT_STORAGE_KEY)
    if (raw !== null && raw.length <= ADAPT_LIMITS.serializedChars) {
      try {
        document = normalizeAdaptDocument(JSON.parse(raw))
      } catch {
        // Corrupt JSON is an empty document, not a broken playground.
      }
    }
  } catch {
    status = 'memory'
  }
  try {
    const flag = storage.getItem(ADAPT_ENABLED_KEY)
    // The separate flag wins over a stale debounced document, especially on exit.
    const enabled = flag === '1' || flag === 'true' ? true
      : flag === '0' || flag === 'false' ? false : document.enabled
    if (enabled !== document.enabled) document = Object.freeze({ ...document, enabled })
  } catch {
    status = 'memory'
  }
  return { document, status }
}

export function createAdaptStore(storage?: Storage) {
  const backend = storage ?? browserStorage()
  const initial = readDocument(backend)
  let document = initial.document
  let snapshot: AdaptSnapshot = Object.freeze({
    document, canUndo: false, canRedo: false, saveStatus: initial.status,
  })
  const listeners = new Set<() => void>()
  const past: Record<string, AdaptPage>[] = []
  const future: Record<string, AdaptPage>[] = []
  let timer: ReturnType<typeof setTimeout> | undefined
  let documentDirty = false
  let enabledDirty = false
  let destroyed = false

  function publish(saveStatus = snapshot.saveStatus): void {
    const canUndo = past.length > 0
    const canRedo = future.length > 0
    if (snapshot.document === document && snapshot.canUndo === canUndo
      && snapshot.canRedo === canRedo && snapshot.saveStatus === saveStatus) return
    snapshot = Object.freeze({ document, canUndo, canRedo, saveStatus })
    for (const listener of [...listeners]) listener()
  }

  function cancelSave(): void {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }

  function writeEnabled(): boolean {
    if (!backend) return false
    try {
      backend.setItem(ADAPT_ENABLED_KEY, document.enabled ? '1' : '0')
      enabledDirty = false
      return true
    } catch {
      return false
    }
  }

  function flush(): void {
    if (destroyed) return
    cancelSave()
    if (!documentDirty && !enabledDirty) return
    if (!backend) {
      publish('memory')
      return
    }
    let saved = !enabledDirty || writeEnabled()
    if (documentDirty) {
      try {
        const serialized = JSON.stringify(document)
        if (serialized.length > ADAPT_LIMITS.serializedChars) {
          saved = false
        } else {
          backend.setItem(ADAPT_STORAGE_KEY, serialized)
          documentDirty = false
        }
      } catch {
        saved = false
      }
    }
    publish(saved ? 'saved' : 'memory')
  }

  function scheduleSave(failed = false): void {
    cancelSave()
    if (backend && (documentDirty || enabledDirty)) timer = setTimeout(flush, SAVE_DELAY_MS)
    const status = failed || !backend || snapshot.saveStatus === 'memory' ? 'memory'
      : documentDirty || enabledDirty ? 'saving' : 'saved'
    publish(status)
  }

  function replacePages(pages: Record<string, AdaptPage>): void {
    document = Object.freeze({ version: ADAPT_VERSION, enabled: document.enabled, pages })
    documentDirty = true
    scheduleSave()
  }

  function getPage(key: string): AdaptPage {
    return validKey(key) ? (own(document.pages, key) as AdaptPage | undefined) ?? EMPTY_PAGE : EMPTY_PAGE
  }

  function commitPage(key: string, value: AdaptPage): void {
    if (destroyed || !validKey(key)) return
    const page = normalizeAdaptPage(value)
    if (JSON.stringify(page) === JSON.stringify(getPage(key))) return
    const pages = { ...document.pages }
    delete pages[key]
    if (!isEmpty(page)) pages[key] = page
    const bounded = boundPages(pages)
    past.push(document.pages)
    if (past.length > ADAPT_LIMITS.history) past.shift()
    future.length = 0
    replacePages(bounded)
  }

  function setEnabled(enabled: boolean): void {
    if (destroyed || typeof enabled !== 'boolean') return
    if (document.enabled !== enabled) {
      document = Object.freeze({ ...document, enabled })
    }
    enabledDirty = true
    // Try this even after a document quota error: the tiny exit flag can still fit.
    const written = writeEnabled()
    scheduleSave(!written)
  }

  function undo(): void {
    if (destroyed || past.length === 0) return
    future.push(document.pages)
    replacePages(past.pop()!)
  }

  function redo(): void {
    if (destroyed || future.length === 0) return
    past.push(document.pages)
    replacePages(future.pop()!)
  }

  function clearHistory(): void {
    if (destroyed || (past.length === 0 && future.length === 0)) return
    past.length = 0
    future.length = 0
    publish()
  }

  function resetPage(key: string): void {
    commitPage(key, EMPTY_PAGE)
  }

  const lifecycle = typeof window === 'undefined' ? undefined : window
  lifecycle?.addEventListener('pagehide', flush)

  function destroy(): void {
    if (destroyed) return
    listeners.clear()
    lifecycle?.removeEventListener('pagehide', flush)
    flush()
    destroyed = true
  }

  return {
    subscribe(listener: () => void): () => void {
      if (destroyed) return () => {}
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    getSnapshot: (): AdaptSnapshot => snapshot,
    getPage,
    commitPage,
    setEnabled,
    undo,
    redo,
    clearHistory,
    resetPage,
    flush,
    destroy,
  }
}
