import assert from 'node:assert/strict'
import { test } from 'node:test'
import { adaptedTranslate, adaptLayoutOrder, adaptTargetKey, boundedDomPatch, canonicalAdaptReference, createAdaptMutationOwner, semanticAdaptId } from './dom'
import type { ElementPatch } from './model'

test('semantic identities reject React client, server, and stripped useId values', () => {
  for (const id of [
    ':r1:', ':R2H1:-title', 'r1', 'Ra', 'paper-r7-title',
    'gradient-story-r1a-caption', 'research-film-R3', 'figure-_R_2_-title',
    'spaces are unsafe', '<script>', '',
  ]) {
    assert.equal(semanticAdaptId(id), null, id)
  }
  for (const id of ['home-name', 'publication-paper-2026', 'diff-heading-problem', 'site-main']) {
    assert.equal(semanticAdaptId(id), id)
  }
})

test('stable keys preserve record identity across reordering and safely frame arbitrary keys', () => {
  const records = ['paper-b', 'paper-a', 'paper-c']
  const identify = (key: string) => adaptTargetKey('/publications', ['a', `record:${key}`, 'PDF'])
  const original = new Map(records.map(key => [key, identify(key)]))
  for (const key of [...records].reverse().filter(key => key !== 'paper-b')) {
    assert.equal(identify(key), original.get(key))
  }
  assert.notEqual(identify('paper-a'), identify('paper-b'))
  assert.notEqual(adaptTargetKey('/about', ['p', 'Hello']), adaptTargetKey('/', ['p', 'Hello']))
  assert.notEqual(adaptTargetKey('/', ['ab', 'c']), adaptTargetKey('/', ['a', 'bc']))
  assert.notEqual(adaptTargetKey('/', ['a|b', 'c']), adaptTargetKey('/', ['a', 'b|c']))
  const unsafe = adaptTargetKey('/<script>', ['a', 'record:💫 <>"\'#[]', 'PDF'])
  assert.match(unsafe, /^adapt-[a-z0-9-]+$/)
  assert.ok(unsafe.length < 100)
})

test('record fingerprints do not collide across a large publication collection', () => {
  const ids = new Set<string>()
  for (let index = 0; index < 10_000; index++) {
    ids.add(adaptTargetKey('/publications', ['button', `record:paper-${index}`, 'Abstract']))
  }
  assert.equal(ids.size, 10_000)
})

test('internal link identities survive appearance and PDF cache-version changes', () => {
  const base = 'https://ndrsn0208.github.io/blog/'
  assert.equal(canonicalAdaptReference('/publications?edition=paper', base), '/publications')
  assert.equal(canonicalAdaptReference('/publications?edition=black', base), '/publications')
  assert.equal(canonicalAdaptReference('/cv.pdf?v=first#view=FitH', base), '/cv.pdf#view=FitH')
  assert.equal(canonicalAdaptReference('/cv.pdf?v=second#view=FitH', base), '/cv.pdf#view=FitH')
  assert.equal(canonicalAdaptReference('?edition=paper#references', base), '/blog/#references')
  assert.equal(canonicalAdaptReference('', base), '')
})

test('identity normalization retains meaningful searches and external destinations', () => {
  const base = 'https://ndrsn0208.github.io/'
  assert.equal(canonicalAdaptReference('/publications?q=diffusion&edition=paper', base), '/publications?q=diffusion')
  const external = 'https://example.com/book?edition=second&v=3'
  assert.equal(canonicalAdaptReference(external, base), external)
  assert.equal(canonicalAdaptReference('mailto:zekun@gatech.edu', base), 'mailto:zekun@gatech.edu')
})

test('DOM previews clamp finite values and pixel letter spacing, preserving explicit resets', () => {
  assert.deepEqual(boundedDomPatch({
    dx: -100, dy: 1e20, rotation: 1e20, scale: -20, fontScale: 100,
    weight: 20, letterSpacing: 1e20, color: '#AbCdEf', font: 'mono', hidden: true, italic: false,
  }), {
    dx: -4, dy: 100_000, rotation: 3_600, scale: 0.1, fontScale: 8,
    weight: 100, letterSpacing: 8, color: '#abcdef', font: 'mono', hidden: true, italic: false,
  })
  const reset: ElementPatch = {
    dx: 0, dy: 0, rotation: 0, scale: 1, fontScale: 1,
    font: 'original', italic: false, hidden: false, letterSpacing: 0,
  }
  assert.deepEqual(boundedDomPatch(reset), reset)
  assert.equal(boundedDomPatch({ letterSpacing: -100 }).letterSpacing, -2)
  assert.equal(boundedDomPatch({ letterSpacing: 1.3 }).letterSpacing, 1.3)
})

test('DOM previews do not admit nonfinite numbers, arbitrary CSS, inherited values, or accessors', () => {
  const unsafe = {
    dx: NaN, dy: Infinity, rotation: -Infinity, scale: '2', fontScale: null,
    color: 'red; background:url(evil)', font: 'url(evil)', italic: 'false', hidden: 1,
    transform: 'rotate(5deg)', innerHTML: '<script>',
  } as unknown as ElementPatch
  assert.deepEqual(boundedDomPatch(unsafe), {})
  for (const color of ['#12', '#12345', '#1234567', '#123456789', 'var(--color)', '#000;background:red']) {
    assert.deepEqual(boundedDomPatch({ color }), {})
  }
  assert.deepEqual(boundedDomPatch({ color: '#abcd' }), { color: '#abcd' })
  assert.deepEqual(boundedDomPatch({ color: '#11223344' }), { color: '#11223344' })
  const inherited = Object.create({ hidden: true, dx: 1, font: 'poster' }) as ElementPatch
  Object.defineProperty(inherited, 'color', { get() { throw new Error('Do not execute patch accessors') } })
  assert.deepEqual(boundedDomPatch(inherited), {})
})

test('translation uses viewport width and preserves authored percent, calc, and depth offsets', () => {
  assert.equal(adaptedTranslate('none', 0.25, 120), 'calc(0px + 25vw) calc(0px + 120px)')
  assert.equal(adaptedTranslate('10% 2px', -0.125, -15), 'calc(10% + -12.5vw) calc(2px + -15px)')
  assert.equal(adaptedTranslate('calc(10% - 3px) 4px 5px', 0.2, 12),
    'calc(calc(10% - 3px) + 20vw) calc(4px + 12px) 5px')
  assert.equal(adaptedTranslate('7px', 0, 1), 'calc(7px + 0vw) calc(0px + 1px)')
})

test('shuffle yields a reproducible permutation, changes a two-record layout, and varies with seed', () => {
  const keys = Array.from({ length: 12 }, (_, index) => adaptTargetKey('/', ['record', `paper-${index}`]))
  const permutations = new Set<string>()
  for (let seed = 0; seed < 25; seed++) {
    const ranks = adaptLayoutOrder(keys, seed)
    assert.deepEqual(ranks, adaptLayoutOrder([...keys], seed))
    assert.deepEqual([...ranks].sort((a, b) => a - b), keys.map((_, index) => index))
    permutations.add(ranks.join(','))
    assert.deepEqual(adaptLayoutOrder(['a', 'b'], seed), [1, 0])
  }
  assert.ok(permutations.size > 10)
  assert.deepEqual(adaptLayoutOrder([], 1), [])
  assert.deepEqual(adaptLayoutOrder(['a'], 1), [0])
})

// A record-backed style/attribute port, not a DOM implementation. This tests
// ownership and interleaving with React without pretending to test layout.
function memoryElement(initialAttributes: Record<string, string> = {}) {
  const attributes = new Map(Object.entries(initialAttributes))
  const values = new Map<string, { value: string, priority: string }>()
  let writes = 0
  const style = {
    get length() { return values.size },
    getPropertyValue(name: string) { return values.get(name)?.value ?? '' },
    getPropertyPriority(name: string) { return values.get(name)?.priority ?? '' },
    setProperty(name: string, value: string, priority = '') {
      attributes.set('style', '')
      values.set(name, { value: value.trim(), priority })
      writes++
    },
    removeProperty(name: string) {
      const value = values.get(name)?.value ?? ''
      values.delete(name)
      return value
    },
  }
  const element = {
    style,
    hasAttribute(name: string) { return attributes.has(name) },
    getAttribute(name: string) { return attributes.get(name) ?? null },
    setAttribute(name: string, value: string) { attributes.set(name, value) },
    removeAttribute(name: string) {
      attributes.delete(name)
      if (name === 'style') values.clear()
    },
  } as unknown as HTMLElement
  return { element, style, writes: () => writes }
}

const hiddenStyles = new Map([['opacity', '0'], ['visibility', 'hidden'], ['pointer-events', 'none']])
const hiddenAttributes = new Map([['inert', ''], ['aria-hidden', 'true'], ['tabindex', '-1']])

test('owned hidden state restores original tabindex, inert, accessibility, and style priorities', () => {
  const originals: Record<string, string>[] = [{ tabindex: '2', 'aria-hidden': 'false' }, { inert: '', tabindex: '-1' }, {}]
  for (const original of originals) {
    const { element, style } = memoryElement(original)
    style.setProperty('visibility', 'visible', 'important')
    style.setProperty('transform', 'translateY(5px)')
    const owner = createAdaptMutationOwner((element, name) => element.style.getPropertyValue(name))
    owner.sync(element, hiddenStyles, hiddenAttributes)
    assert.equal(element.getAttribute('inert'), '')
    assert.equal(element.getAttribute('tabindex'), '-1')
    assert.equal(element.getAttribute('aria-hidden'), 'true')
    owner.restore(element)
    for (const name of hiddenAttributes.keys()) {
      assert.equal(element.getAttribute(name), original[name] ?? null)
    }
    assert.equal(style.getPropertyValue('visibility'), 'visible')
    assert.equal(style.getPropertyPriority('visibility'), 'important')
    assert.equal(style.getPropertyValue('transform'), 'translateY(5px)')
    assert.equal(style.getPropertyValue('opacity'), '')
    assert.equal(style.getPropertyValue('pointer-events'), '')
    assert.equal([...owner.elements()].length, 0)
    owner.restore(element) // Repeated teardown is harmless.
  }
})

test('restoration preserves React updates to unrelated and currently owned properties', () => {
  const { element, style } = memoryElement({ tabindex: '3' })
  style.setProperty('color', 'red')
  const owner = createAdaptMutationOwner((element, name) => element.style.getPropertyValue(name))
  owner.sync(element, new Map([['color', 'green']]), hiddenAttributes)
  style.setProperty('color', 'blue')
  style.setProperty('transform', 'rotate(12deg)')
  element.setAttribute('tabindex', '0')
  owner.sync(element, new Map([['color', 'green']]), hiddenAttributes)
  owner.restore(element)
  assert.equal(style.getPropertyValue('color'), 'blue')
  assert.equal(style.getPropertyValue('transform'), 'rotate(12deg)')
  assert.equal(element.getAttribute('tabindex'), '0')
  assert.equal(element.getAttribute('inert'), null)
  assert.equal(element.getAttribute('aria-hidden'), null)

  owner.sync(element, new Map([['color', 'green']]), hiddenAttributes)
  style.setProperty('color', 'purple', 'important')
  element.removeAttribute('inert')
  element.setAttribute('aria-hidden', 'false')
  owner.restore(element) // No intervening engine render to capture React's edit.
  assert.equal(style.getPropertyValue('color'), 'purple')
  assert.equal(style.getPropertyPriority('color'), 'important')
  assert.equal(element.getAttribute('inert'), null)
  assert.equal(element.getAttribute('aria-hidden'), 'false')
})

test('repeated previews compose from the original value and do not rewrite unchanged CSS', () => {
  const { element, style, writes } = memoryElement()
  style.setProperty('translate', '5px 3px')
  style.setProperty('transform', 'scale(2)')
  const owner = createAdaptMutationOwner((element, name) => element.style.getPropertyValue(name))
  const preview = (dx: number) => owner.sync(element,
    new Map([['translate', adaptedTranslate(owner.baseStyle(element, 'translate'), dx, 10)]]))
  preview(0.1)
  const before = writes()
  preview(0.1)
  assert.equal(writes(), before)
  preview(0.2)
  assert.equal(style.getPropertyValue('translate'), 'calc(5px + 20vw) calc(3px + 10px)')
  assert.equal(style.getPropertyValue('transform'), 'scale(2)')
  style.setProperty('translate', '8px 7px') // React takes ownership in between frames.
  preview(0.2)
  assert.equal(style.getPropertyValue('translate'), 'calc(8px + 20vw) calc(7px + 10px)')
  owner.restore(element)
  assert.equal(style.getPropertyValue('translate'), '8px 7px')
})

test('teardown removes a newly introduced style attribute and preserves an authored empty one', () => {
  const originals: Record<string, string>[] = [{}, { style: '' }]
  for (const original of originals) {
    const { element } = memoryElement(original)
    const owner = createAdaptMutationOwner(() => '')
    owner.sync(element, hiddenStyles, hiddenAttributes)
    owner.restore(element)
    assert.equal(element.hasAttribute('style'), Object.hasOwn(original, 'style'))
    assert.equal(element.getAttribute('inert'), null)
    assert.equal(element.getAttribute('tabindex'), null)
  }
})

test('rebasing a font preview reads the new responsive size instead of its cached desktop size', () => {
  const { element, style } = memoryElement()
  let baseSize = '80px'
  const owner = createAdaptMutationOwner(() => baseSize)
  assert.equal(owner.baseStyle(element, 'font-size'), '80px')
  owner.sync(element, new Map([['font-size', '84px']]))
  baseSize = '50px'
  owner.restore(element)
  assert.equal(owner.baseStyle(element, 'font-size'), '50px')
  owner.sync(element, new Map([['font-size', '52.5px']]))
  assert.equal(style.getPropertyValue('font-size'), '52.5px')
})
