import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  ADAPT_ENABLED_KEY,
  ADAPT_LIMITS,
  ADAPT_STORAGE_KEY,
  ADAPT_VERSION,
  emptyPage,
  type AdaptPage,
  type AdaptStroke,
  type DiffusionPatch,
} from './model'
import { createAdaptStore, normalizeAdaptDocument, normalizeAdaptPage } from './store'

class FakeStorage implements Storage {
  readonly data = new Map<string, string>()
  readonly writes: { key: string; value: string }[] = []
  failReads = false
  failWrites = false
  failDocument = false

  get length(): number { return this.data.size }
  clear(): void { this.data.clear() }
  key(index: number): string | null { return [...this.data.keys()][index] ?? null }
  removeItem(key: string): void { this.data.delete(key) }
  getItem(key: string): string | null {
    if (this.failReads) throw new Error('Storage access denied')
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string): void {
    if (this.failWrites || (this.failDocument && key === ADAPT_STORAGE_KEY)) {
      throw new Error('QuotaExceededError')
    }
    this.writes.push({ key, value })
    this.data.set(key, value)
  }
}

function editedPage(dy = 10): AdaptPage {
  return { ...emptyPage(), elements: { heading: { dy, color: '#123abc', font: 'book' } } }
}

function stroke(id = 'stroke'): AdaptStroke {
  return { id, color: '#abcdef', width: 5, points: [{ x: 0.2, y: 40, pressure: 0.5 }] }
}

function diffusion(id = 'diffusion'): DiffusionPatch {
  return { id, x: 0.4, y: 300, radius: 180, seed: 42, phase: 0.3, color: '#abc', amount: 0.7 }
}

function persist(storage: FakeStorage, pages: Record<string, AdaptPage>, enabled = false): void {
  storage.data.set(ADAPT_STORAGE_KEY, JSON.stringify({ version: ADAPT_VERSION, enabled, pages }))
}

test('snapshots and empty pages retain their identity until an actual change', t => {
  const store = createAdaptStore(new FakeStorage())
  t.after(() => store.destroy())
  const snapshot = store.getSnapshot()
  const missing = store.getPage('/missing')
  assert.strictEqual(store.getSnapshot(), snapshot)
  assert.strictEqual(store.getPage('/other'), missing)
  assert.strictEqual(store.getPage('__proto__'), missing)
  assert.strictEqual(store.getPage('toString'), missing)
  assert.deepEqual(missing, emptyPage())
  store.commitPage('/missing', emptyPage())
  store.resetPage('/other')
  store.undo()
  store.redo()
  assert.strictEqual(store.getSnapshot(), snapshot)
  store.commitPage('/article', editedPage())
  assert.notStrictEqual(store.getSnapshot(), snapshot)
  const page = store.getPage('/article')
  assert.strictEqual(store.getPage('/article'), page)
  assert.strictEqual(store.getPage('/missing'), missing)
  store.commitPage('/article', editedPage())
  assert.strictEqual(store.getPage('/article'), page)
})

test('malformed JSON, non-documents and unsupported versions load as empty documents', t => {
  for (const raw of [
    '{', '', 'null', '[]', 'true', '"document"',
    JSON.stringify({ version: 2, enabled: true, pages: { '/': editedPage() } }),
    JSON.stringify({ version: '1', enabled: true, pages: { '/': editedPage() } }),
    JSON.stringify({ enabled: true, pages: { '/': editedPage() } }),
  ]) {
    const storage = new FakeStorage()
    storage.data.set(ADAPT_STORAGE_KEY, raw)
    const store = createAdaptStore(storage)
    t.after(() => store.destroy())
    assert.deepEqual(store.getSnapshot().document, { version: 1, enabled: false, pages: {} })
    assert.equal(store.getSnapshot().saveStatus, 'saved')
  }
})

test('oversized serialized input is rejected before it can become state', t => {
  const storage = new FakeStorage()
  const raw = JSON.stringify({
    version: 1, enabled: false, pages: { '/article': editedPage() },
    padding: 'x'.repeat(ADAPT_LIMITS.serializedChars),
  })
  storage.data.set(ADAPT_STORAGE_KEY, raw)
  storage.data.set(ADAPT_ENABLED_KEY, '1')
  const store = createAdaptStore(storage)
  t.after(() => store.destroy())
  assert.deepEqual(store.getSnapshot().document.pages, {})
  assert.equal(store.getSnapshot().document.enabled, true)
})

test('normalization clamps finite numbers and accepts only model style fields', () => {
  const page = normalizeAdaptPage({
    elements: {
      heading: {
        dx: -100, dy: 1e20, rotation: 1e20, scale: -2, fontScale: 100,
        weight: 20, letterSpacing: 1e20, font: 'sans', color: '#ABCDEF',
        hidden: true, italic: false, cssText: 'position:fixed', innerHTML: '<script>bad()</script>',
      },
      invalid: {
        dx: '3', dy: Infinity, rotation: NaN, scale: null, font: 'url(evil)',
        color: 'red; background: url(evil)', hidden: 'true', italic: 1,
      },
    },
    strokes: [{
      ...stroke(), width: 1e20,
      points: [{ x: -3, y: 1e20, pressure: 2 }, { x: 0.5, y: -1, pressure: -2 },
        { x: Infinity, y: 1 }, { x: 1, y: '2' }, null],
    }],
    diffusions: [{
      ...diffusion(), x: 2, y: -1, radius: 1e20, seed: -9.5, phase: 1e20, amount: -1,
    }],
    layout: { kind: 'shuffle', seed: 42.9 },
  })
  assert.deepEqual(page.elements, {
    heading: {
      dx: -4, dy: 100_000, rotation: 3_600, scale: 0.1, fontScale: 8,
      weight: 100, letterSpacing: 20, font: 'sans', color: '#abcdef', italic: false, hidden: true,
    },
  })
  assert.deepEqual(page.strokes[0].points, [
    { x: 0, y: 100_000, pressure: 1 }, { x: 0.5, y: 0, pressure: 0 },
  ])
  assert.equal(page.strokes[0].width, 100)
  assert.deepEqual(page.diffusions[0], {
    id: 'diffusion', color: '#abc', x: 1, y: 0, radius: 1_200, seed: 0, phase: 1_000_000, amount: 0,
  })
  assert.deepEqual(page.layout, { kind: 'shuffle', seed: 42 })
  assert.deepEqual(normalizeAdaptPage({ layout: { kind: 'html', seed: 10 } }), emptyPage())
})

test('damage clamps to zero through one and rejects non-finite or non-numeric values', () => {
  for (const [damage, expected] of [[-2, 0], [0, 0], [0.35, 0.35], [1, 1], [4, 1]]) {
    const page = normalizeAdaptPage({ elements: { target: { damage } } })
    assert.deepEqual(page.elements.target, { damage: expected })
  }
  for (const damage of [undefined, null, '0.35', true, NaN, Infinity, -Infinity, {}]) {
    const page = normalizeAdaptPage({ elements: { target: { damage, hidden: false } } })
    assert.deepEqual(page.elements.target, { hidden: false })
  }
  assert.equal(Object.hasOwn(normalizeAdaptPage(editedPage()).elements.heading, 'damage'), false)
})

test('partial damage persists across short commits and reloads without hiding the target', t => {
  const storage = new FakeStorage()
  const store = createAdaptStore(storage)
  t.after(() => store.destroy())
  store.commitPage('/article', { ...emptyPage(), elements: { target: { damage: 0.2 } } })
  store.commitPage('/article', { ...emptyPage(), elements: { target: { damage: 0.55 } } })
  store.flush()
  store.destroy()
  const reloaded = createAdaptStore(storage)
  t.after(() => reloaded.destroy())
  assert.deepEqual(reloaded.getPage('/article').elements.target, { damage: 0.55 })
  const page = reloaded.getPage('/article')
  reloaded.commitPage('/article', {
    ...page,
    elements: { target: { ...page.elements.target, damage: page.elements.target.damage! + 0.25 } },
  })
  reloaded.flush()
  const persisted = JSON.parse(storage.getItem(ADAPT_STORAGE_KEY)!)
  assert.deepEqual(persisted.pages['/article'].elements.target, { damage: 0.8 })
})

test('damage and destruction undo together per commit and page reset restores partial damage', t => {
  const store = createAdaptStore(new FakeStorage())
  t.after(() => store.destroy())
  store.commitPage('/article', { ...emptyPage(), elements: { target: { damage: 0.3 } } })
  store.commitPage('/article', { ...emptyPage(), elements: { target: { damage: 0.65 } } })
  store.commitPage('/article', { ...emptyPage(), elements: { target: { damage: 1, hidden: true } } })
  store.undo()
  assert.deepEqual(store.getPage('/article').elements.target, { damage: 0.65 })
  store.undo()
  assert.deepEqual(store.getPage('/article').elements.target, { damage: 0.3 })
  store.redo()
  assert.deepEqual(store.getPage('/article').elements.target, { damage: 0.65 })
  store.redo()
  assert.deepEqual(store.getPage('/article').elements.target, { damage: 1, hidden: true })
  store.undo()
  store.resetPage('/article')
  assert.deepEqual(store.getPage('/article'), emptyPage())
  store.undo()
  assert.deepEqual(store.getPage('/article').elements.target, { damage: 0.65 })
})

test('invalid strokes, diffusion fields and CSS colors are discarded without coercion', () => {
  const page = normalizeAdaptPage({
    elements: {
      a: { color: '#ABCD' }, b: { color: '#01234567' }, c: { color: '#12345' },
      d: { color: 'var(--color)' }, e: { font: 'constructor', color: 'rgb(0,0,0)' },
    },
    strokes: [
      { ...stroke('a'), width: '5' }, { ...stroke('b'), color: 'red' },
      { ...stroke('c'), points: [{ x: NaN, y: 0 }] }, { ...stroke('d'), points: [] },
      stroke('valid'), { ...stroke('valid'), width: 9 },
    ],
    diffusions: [
      { ...diffusion('a'), phase: NaN }, { ...diffusion('b'), seed: '1' },
      { ...diffusion('c'), color: 'url(evil)' }, diffusion('valid'),
    ],
  })
  assert.deepEqual(page.elements, { a: { color: '#abcd' }, b: { color: '#01234567' } })
  assert.equal(page.strokes.length, 1)
  assert.equal(page.strokes[0].width, 9)
  assert.equal(page.diffusions.length, 1)
})

test('all collection limits are enforced and sampled strokes keep both endpoints', () => {
  const points = Array.from({ length: ADAPT_LIMITS.points + 50 }, (_, i) => ({ x: 0.5, y: i }))
  const page = normalizeAdaptPage({
    elements: Object.fromEntries(Array.from({ length: ADAPT_LIMITS.elements + 2 },
      (_, i) => [`element-${i}`, { dx: 0.2 }])),
    strokes: Array.from({ length: ADAPT_LIMITS.strokes + 2 },
      (_, i) => ({ ...stroke(`stroke-${i}`), points })),
    diffusions: Array.from({ length: ADAPT_LIMITS.diffusions + 2 }, (_, i) => diffusion(`diffusion-${i}`)),
  })
  assert.equal(Object.keys(page.elements).length, ADAPT_LIMITS.elements)
  assert.equal(page.elements['element-0'], undefined)
  assert.equal(page.strokes.length, ADAPT_LIMITS.strokes)
  assert.equal(page.strokes[0].id, 'stroke-2')
  assert.equal(page.strokes[0].points.length, ADAPT_LIMITS.points)
  assert.equal(page.strokes[0].points[0].y, 0)
  assert.equal(page.strokes[0].points.at(-1)?.y, points.length - 1)
  assert.equal(page.diffusions.length, ADAPT_LIMITS.diffusions)
  const document = normalizeAdaptDocument({
    version: 1, enabled: 'true',
    pages: Object.fromEntries(Array.from({ length: ADAPT_LIMITS.pages + 2 },
      (_, i) => [`/page-${i}`, editedPage()])),
  })
  assert.equal(document.enabled, false)
  assert.equal(Object.keys(document.pages).length, ADAPT_LIMITS.pages)
  assert.equal(document.pages['/page-0'], undefined)
})

test('prototype keys, accessors, inherited fields and HTML cannot enter the document', () => {
  const malicious = JSON.parse(`{
    "version":1,"enabled":true,"pages":{
      "__proto__":{"polluted":true},
      "constructor":{"elements":{"heading":{"hidden":true}}},
      "/safe":{"elements":{
        "__proto__":{"polluted":true},"constructor":{"color":"#fff"},
        "prototype":{"dx":1},"<img src=x onerror=bad()>":{"hidden":true},
        "heading":{"font":"book","innerHTML":"<b>changed</b>","style":"display:none"}
      }}
    }
  }`)
  const document = normalizeAdaptDocument(malicious)
  assert.deepEqual(Object.keys(document.pages), ['/safe'])
  assert.deepEqual(document.pages['/safe'].elements, { heading: { font: 'book' } })
  assert.equal(({} as Record<string, unknown>).polluted, undefined)
  assert.equal(JSON.stringify(document).includes('<'), false)
  const inherited = Object.create({ elements: { inherited: { hidden: true } } }) as unknown
  assert.deepEqual(normalizeAdaptPage(inherited), emptyPage())
  assert.deepEqual(normalizeAdaptPage({
    get elements(): never { throw new Error('An accessor must not execute') },
  }), emptyPage())
})

test('styles, strokes, diffusion, layouts and separate pages survive a reload', t => {
  const storage = new FakeStorage()
  const store = createAdaptStore(storage)
  t.after(() => store.destroy())
  store.setEnabled(true)
  store.commitPage('/article', {
    ...editedPage(), strokes: [stroke()], diffusions: [diffusion()], layout: { kind: 'columns', seed: 17 },
  })
  store.commitPage('/projects', editedPage(80))
  store.flush()
  const reloaded = createAdaptStore(storage)
  t.after(() => reloaded.destroy())
  assert.deepEqual(reloaded.getSnapshot().document, store.getSnapshot().document)
  assert.equal(reloaded.getSnapshot().document.enabled, true)
  assert.equal(reloaded.getPage('/projects').elements.heading.dy, 80)
  assert.equal(reloaded.getSnapshot().canUndo, false)
  assert.equal(reloaded.getSnapshot().canRedo, false)
  assert.equal(reloaded.getSnapshot().saveStatus, 'saved')
})

test('exit persists immediately and preserves saved edits even before the document debounce', t => {
  const storage = new FakeStorage()
  const store = createAdaptStore(storage)
  t.after(() => store.destroy())
  store.setEnabled(true)
  assert.equal(storage.getItem(ADAPT_ENABLED_KEY), '1')
  assert.equal(storage.getItem(ADAPT_STORAGE_KEY), null)
  store.commitPage('/article', editedPage())
  store.flush()
  store.setEnabled(false)
  assert.equal(storage.getItem(ADAPT_ENABLED_KEY), '0')
  assert.equal(JSON.parse(storage.getItem(ADAPT_STORAGE_KEY)!).enabled, true)
  const reloaded = createAdaptStore(storage)
  t.after(() => reloaded.destroy())
  assert.equal(reloaded.getSnapshot().document.enabled, false)
  assert.deepEqual(reloaded.getPage('/article'), editedPage())
  reloaded.setEnabled(true)
  assert.deepEqual(reloaded.getPage('/article'), editedPage())
})

test('pending page edits cannot overwrite another tab exiting during flush or destroy', t => {
  for (const finish of ['flush', 'destroy'] as const) {
    const storage = new FakeStorage()
    const store = createAdaptStore(storage)
    t.after(() => store.destroy())
    store.setEnabled(true)
    store.commitPage('/article', editedPage())
    storage.setItem(ADAPT_ENABLED_KEY, '0')
    const flagWrites = storage.writes.filter(write => write.key === ADAPT_ENABLED_KEY).length
    store[finish]()
    assert.equal(storage.getItem(ADAPT_ENABLED_KEY), '0')
    assert.equal(storage.writes.filter(write => write.key === ADAPT_ENABLED_KEY).length, flagWrites)
    const reloaded = createAdaptStore(storage)
    t.after(() => reloaded.destroy())
    assert.equal(reloaded.getSnapshot().document.enabled, false)
    assert.deepEqual(reloaded.getPage('/article'), editedPage())
  }
})

test('exiting from an older tab cannot overwrite newer page edits from another tab', t => {
  const storage = new FakeStorage()
  const first = createAdaptStore(storage)
  first.setEnabled(true)
  first.commitPage('/article', editedPage(10))
  first.flush()
  const olderTab = createAdaptStore(storage)
  t.after(() => first.destroy())
  t.after(() => olderTab.destroy())
  first.commitPage('/article', editedPage(90))
  first.flush()
  olderTab.setEnabled(false)
  olderTab.flush()
  olderTab.destroy()
  assert.equal(storage.getItem(ADAPT_ENABLED_KEY), '0')
  assert.equal(JSON.parse(storage.getItem(ADAPT_STORAGE_KEY)!).pages['/article'].elements.heading.dy, 90)
})

test('both enabled encodings override a stale document; invalid flags do not coerce to true', t => {
  for (const [flag, enabled] of [['1', true], ['true', true], ['0', false], ['false', false]] as const) {
    const storage = new FakeStorage()
    persist(storage, {}, !enabled)
    storage.data.set(ADAPT_ENABLED_KEY, flag)
    const store = createAdaptStore(storage)
    t.after(() => store.destroy())
    assert.equal(store.getSnapshot().document.enabled, enabled)
  }
  const storage = new FakeStorage()
  storage.data.set(ADAPT_ENABLED_KEY, 'not-a-boolean')
  const store = createAdaptStore(storage)
  t.after(() => store.destroy())
  assert.equal(store.getSnapshot().document.enabled, false)
})

test('document writes debounce across completed gestures', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const storage = new FakeStorage()
  const store = createAdaptStore(storage)
  t.after(() => store.destroy())
  store.commitPage('/article', editedPage(10))
  assert.equal(store.getSnapshot().saveStatus, 'saving')
  t.mock.timers.tick(200)
  assert.equal(storage.getItem(ADAPT_STORAGE_KEY), null)
  store.commitPage('/article', editedPage(20))
  t.mock.timers.tick(200)
  assert.equal(storage.getItem(ADAPT_STORAGE_KEY), null)
  t.mock.timers.tick(50)
  assert.equal(storage.writes.filter(write => write.key === ADAPT_STORAGE_KEY).length, 1)
  assert.equal(JSON.parse(storage.getItem(ADAPT_STORAGE_KEY)!).pages['/article'].elements.heading.dy, 20)
  assert.equal(store.getSnapshot().saveStatus, 'saved')
})

test('subscribers see complete stable snapshots and can unsubscribe', t => {
  const store = createAdaptStore(new FakeStorage())
  t.after(() => store.destroy())
  let calls = 0
  const unsubscribe = store.subscribe(() => {
    calls++
    assert.strictEqual(store.getSnapshot(), store.getSnapshot())
  })
  store.commitPage('/article', editedPage())
  assert.equal(calls, 1)
  store.commitPage('/article', editedPage())
  assert.equal(calls, 1)
  store.flush()
  assert.equal(calls, 2)
  const saved = store.getSnapshot()
  store.flush()
  assert.strictEqual(store.getSnapshot(), saved)
  assert.equal(calls, 2)
  unsubscribe()
  unsubscribe()
  store.undo()
  assert.equal(calls, 2)
})

test('undo and redo operate on whole page commits across routes; reset is undoable', t => {
  const store = createAdaptStore(new FakeStorage())
  t.after(() => store.destroy())
  store.setEnabled(true)
  store.commitPage('/a', editedPage(10))
  store.commitPage('/a', editedPage(20))
  store.commitPage('/b', editedPage(30))
  store.undo()
  assert.deepEqual(store.getPage('/b'), emptyPage())
  assert.equal(store.getPage('/a').elements.heading.dy, 20)
  store.undo()
  assert.equal(store.getPage('/a').elements.heading.dy, 10)
  store.redo()
  assert.equal(store.getPage('/a').elements.heading.dy, 20)
  store.resetPage('/a')
  assert.deepEqual(store.getPage('/a'), emptyPage())
  assert.equal(Object.hasOwn(store.getSnapshot().document.pages, '/a'), false)
  store.undo()
  assert.equal(store.getPage('/a').elements.heading.dy, 20)
  store.setEnabled(false)
  assert.equal(store.getSnapshot().canRedo, true)
  store.redo()
  assert.deepEqual(store.getPage('/a'), emptyPage())
  assert.equal(store.getSnapshot().document.enabled, false)
  store.undo()
  store.commitPage('/b', editedPage(40))
  assert.equal(store.getSnapshot().canRedo, false)
  assert.equal(store.getPage('/a').elements.heading.dy, 20)
})

test('no-op resets and commits preserve the redo branch', t => {
  const store = createAdaptStore(new FakeStorage())
  t.after(() => store.destroy())
  store.commitPage('/a', editedPage(10))
  store.commitPage('/a', editedPage(20))
  store.undo()
  const snapshot = store.getSnapshot()
  store.resetPage('/missing')
  store.commitPage('/a', editedPage(10))
  assert.strictEqual(store.getSnapshot(), snapshot)
  assert.equal(store.getSnapshot().canRedo, true)
  store.redo()
  assert.equal(store.getPage('/a').elements.heading.dy, 20)
})

test('clearHistory clears both stacks without changing pages, pending saves or no-op snapshots', t => {
  const storage = new FakeStorage()
  const store = createAdaptStore(storage)
  t.after(() => store.destroy())
  const initial = store.getSnapshot()
  store.clearHistory()
  assert.strictEqual(store.getSnapshot(), initial)
  store.commitPage('/a', editedPage(10))
  store.commitPage('/b', editedPage(20))
  store.undo()
  const before = store.getSnapshot()
  assert.equal(before.canUndo, true)
  assert.equal(before.canRedo, true)
  const writes = storage.writes.length
  let notifications = 0
  store.subscribe(() => { notifications++ })
  store.clearHistory()
  const cleared = store.getSnapshot()
  assert.equal(cleared.canUndo, false)
  assert.equal(cleared.canRedo, false)
  assert.strictEqual(cleared.document, before.document)
  assert.equal(cleared.saveStatus, before.saveStatus)
  assert.equal(storage.writes.length, writes)
  assert.equal(notifications, 1)
  store.clearHistory()
  store.undo()
  store.redo()
  assert.strictEqual(store.getSnapshot(), cleared)
  assert.equal(notifications, 1)
  store.flush()
  assert.deepEqual(JSON.parse(storage.getItem(ADAPT_STORAGE_KEY)!).pages, cleared.document.pages)
})

test('history is bounded independently of how many gestures occur', t => {
  const store = createAdaptStore(new FakeStorage())
  t.after(() => store.destroy())
  for (let i = 1; i <= ADAPT_LIMITS.history + 5; i++) store.commitPage('/a', editedPage(i))
  for (let i = 0; i < ADAPT_LIMITS.history; i++) store.undo()
  assert.equal(store.getSnapshot().canUndo, false)
  assert.equal(store.getPage('/a').elements.heading.dy, 5)
  const oldest = store.getSnapshot()
  store.undo()
  assert.strictEqual(store.getSnapshot(), oldest)
  for (let i = 0; i < ADAPT_LIMITS.history; i++) store.redo()
  assert.equal(store.getSnapshot().canRedo, false)
  assert.equal(store.getPage('/a').elements.heading.dy, ADAPT_LIMITS.history + 5)
})

test('adding a page at capacity keeps the new page and eviction can be undone', t => {
  const store = createAdaptStore(new FakeStorage())
  t.after(() => store.destroy())
  for (let i = 0; i < ADAPT_LIMITS.pages; i++) store.commitPage(`/page-${i}`, editedPage(i))
  store.commitPage('/new', editedPage(90))
  assert.equal(Object.keys(store.getSnapshot().document.pages).length, ADAPT_LIMITS.pages)
  assert.deepEqual(store.getPage('/page-0'), emptyPage())
  assert.equal(store.getPage('/new').elements.heading.dy, 90)
  store.undo()
  assert.equal(store.getPage('/page-0').elements.heading.dy, 0)
  assert.deepEqual(store.getPage('/new'), emptyPage())
  store.redo()
  assert.equal(store.getPage('/new').elements.heading.dy, 90)
})

test('quota failures preserve live state and history while the small enabled flag still works', t => {
  const storage = new FakeStorage()
  const store = createAdaptStore(storage)
  t.after(() => store.destroy())
  store.setEnabled(true)
  store.commitPage('/a', editedPage(10))
  store.flush()
  const saved = storage.getItem(ADAPT_STORAGE_KEY)
  storage.failDocument = true
  store.commitPage('/a', editedPage(20))
  assert.doesNotThrow(() => store.flush())
  assert.equal(store.getSnapshot().saveStatus, 'memory')
  assert.equal(store.getPage('/a').elements.heading.dy, 20)
  assert.equal(storage.getItem(ADAPT_STORAGE_KEY), saved)
  store.undo()
  assert.equal(store.getPage('/a').elements.heading.dy, 10)
  store.redo()
  assert.equal(store.getPage('/a').elements.heading.dy, 20)
  store.setEnabled(false)
  assert.equal(storage.getItem(ADAPT_ENABLED_KEY), '0')
  assert.equal(store.getSnapshot().saveStatus, 'memory')
  storage.failDocument = false
  store.flush()
  assert.equal(store.getSnapshot().saveStatus, 'saved')
  const reloaded = createAdaptStore(storage)
  t.after(() => reloaded.destroy())
  assert.deepEqual(reloaded.getSnapshot().document, store.getSnapshot().document)
})

test('unavailable storage never prevents editing, toggling, resetting or history', t => {
  const storage = new FakeStorage()
  storage.failReads = true
  storage.failWrites = true
  const store = createAdaptStore(storage)
  t.after(() => store.destroy())
  assert.equal(store.getSnapshot().saveStatus, 'memory')
  store.setEnabled(true)
  store.commitPage('/a', editedPage())
  store.flush()
  assert.equal(store.getSnapshot().document.enabled, true)
  assert.equal(store.getPage('/a').elements.heading.dy, 10)
  store.resetPage('/a')
  store.undo()
  assert.equal(store.getPage('/a').elements.heading.dy, 10)
  store.setEnabled(false)
  assert.equal(store.getSnapshot().document.enabled, false)
  assert.equal(store.getSnapshot().saveStatus, 'memory')
  assert.doesNotThrow(() => store.destroy())
})

test('a failed enabled write is retried by flush without losing document changes', t => {
  const storage = new FakeStorage()
  const store = createAdaptStore(storage)
  t.after(() => store.destroy())
  storage.failWrites = true
  store.setEnabled(true)
  store.commitPage('/a', editedPage())
  store.flush()
  assert.equal(store.getSnapshot().saveStatus, 'memory')
  storage.failWrites = false
  store.flush()
  assert.equal(storage.getItem(ADAPT_ENABLED_KEY), '1')
  assert.equal(store.getSnapshot().saveStatus, 'saved')
  const reloaded = createAdaptStore(storage)
  t.after(() => reloaded.destroy())
  assert.deepEqual(reloaded.getSnapshot().document, store.getSnapshot().document)
})

test('large valid gestures and multiple pages stay within the total serialized budget', t => {
  const storage = new FakeStorage()
  const store = createAdaptStore(storage)
  t.after(() => store.destroy())
  const points = Array.from({ length: ADAPT_LIMITS.points }, () => ({
    x: 0.12345678901234567, y: 12345.456789012345, pressure: 0.9876543210987654,
  }))
  const page: AdaptPage = {
    ...editedPage(),
    strokes: Array.from({ length: ADAPT_LIMITS.strokes },
      (_, i) => ({ ...stroke(`stroke-${i}`), points })),
  }
  store.commitPage('/first', page)
  assert.ok(JSON.stringify(store.getSnapshot().document).length <= ADAPT_LIMITS.serializedChars)
  store.commitPage('/latest', page)
  assert.ok(JSON.stringify(store.getSnapshot().document).length <= ADAPT_LIMITS.serializedChars)
  assert.ok(store.getPage('/latest').strokes.length > 0)
  assert.equal(store.getPage('/latest').strokes.at(-1)?.id, `stroke-${ADAPT_LIMITS.strokes - 1}`)
  store.flush()
  assert.ok(storage.getItem(ADAPT_STORAGE_KEY)!.length <= ADAPT_LIMITS.serializedChars)
  const reloaded = createAdaptStore(storage)
  t.after(() => reloaded.destroy())
  assert.deepEqual(reloaded.getSnapshot().document, store.getSnapshot().document)
  store.undo()
  assert.ok(store.getPage('/first').strokes.length > 0)
  assert.deepEqual(store.getPage('/latest'), emptyPage())
})

test('caller mutation cannot change snapshots, empty pages or recorded history', t => {
  const store = createAdaptStore(new FakeStorage())
  t.after(() => store.destroy())
  const input = { ...editedPage(), strokes: [stroke()] }
  store.commitPage('/a', input)
  input.elements.heading.dy = 99
  input.strokes[0].points[0].x = 0.9
  assert.equal(store.getPage('/a').elements.heading.dy, 10)
  assert.equal(store.getPage('/a').strokes[0].points[0].x, 0.2)
  assert.throws(() => { store.getPage('/a').elements.heading.dy = 999 }, TypeError)
  assert.throws(() => { store.getPage('/missing').strokes.push(stroke()) }, TypeError)
  assert.throws(() => { store.getSnapshot().document.enabled = true }, TypeError)
  store.commitPage('/a', editedPage(20))
  store.undo()
  assert.equal(store.getPage('/a').elements.heading.dy, 10)
  assert.equal(store.getPage('/a').strokes[0].points[0].x, 0.2)
})

test('invalid and oversized keys cannot be committed', t => {
  const store = createAdaptStore(new FakeStorage())
  t.after(() => store.destroy())
  const initial = store.getSnapshot()
  for (const key of ['', '__proto__', 'constructor', 'prototype', '<html>', '\u0000', 'a'.repeat(2_049)]) {
    store.commitPage(key, editedPage())
  }
  assert.strictEqual(store.getSnapshot(), initial)
  assert.deepEqual(normalizeAdaptPage({
    elements: { ['a'.repeat(257)]: { hidden: true } },
    strokes: [{ ...stroke(), id: 'a'.repeat(257) }],
    diffusions: [{ ...diffusion(), id: '<html>' }],
  }), emptyPage())
})

test('destroy flushes pending work once, cancels the timer and makes further mutations inert', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const storage = new FakeStorage()
  const store = createAdaptStore(storage)
  let notifications = 0
  store.subscribe(() => { notifications++ })
  store.commitPage('/a', editedPage())
  assert.equal(notifications, 1)
  store.destroy()
  const snapshot = store.getSnapshot()
  assert.equal(snapshot.saveStatus, 'saved')
  assert.equal(notifications, 1)
  assert.equal(JSON.parse(storage.getItem(ADAPT_STORAGE_KEY)!).pages['/a'].elements.heading.dy, 10)
  const writes = storage.writes.length
  store.commitPage('/a', editedPage(20))
  store.setEnabled(true)
  store.resetPage('/a')
  store.undo()
  store.redo()
  store.clearHistory()
  store.flush()
  store.destroy()
  t.mock.timers.tick(1_000)
  assert.equal(storage.writes.length, writes)
  assert.strictEqual(store.getSnapshot(), snapshot)
})
