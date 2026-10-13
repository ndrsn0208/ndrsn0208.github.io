import assert from 'node:assert/strict'
import { test } from 'node:test'
import { characterId, parseCharacterId, segmentGraphemes, textRunId } from './graphemes.ts'

const cases: { name: string; text: string; parts: string[] }[] = [
  { name: 'Latin text and spaces', text: 'Hi, world!', parts: [...'Hi, world!'] },
  { name: 'Chinese characters', text: '你好，世界', parts: ['你', '好', '，', '世', '界'] },
  { name: 'combining accents', text: 'e\u0301 cafe\u0301', parts: ['e\u0301', ' ', 'c', 'a', 'f', 'e\u0301'] },
  { name: 'family emoji', text: 'A👨‍👩‍👧‍👦B', parts: ['A', '👨‍👩‍👧‍👦', 'B'] },
  { name: 'skin tones and ZWJ emoji', text: '👍🏽 👩🏾‍💻', parts: ['👍🏽', ' ', '👩🏾‍💻'] },
  { name: 'flag pairs and an unpaired indicator', text: '🇺🇸🇨🇳🇦', parts: ['🇺🇸', '🇨🇳', '🇦'] },
  { name: 'variation selectors and keycaps', text: '❤️1️⃣', parts: ['❤️', '1️⃣'] },
  { name: 'whitespace and CRLF', text: ' \t\r\n\n\u00a0\u2003', parts: [' ', '\t', '\r\n', '\n', '\u00a0', '\u2003'] },
  { name: 'Hangul jamo', text: '\u1100\u1161\u11a8가', parts: ['\u1100\u1161\u11a8', '가'] },
  { name: 'emoji tag sequence', text: '🏴\u{e0067}\u{e0062}\u{e007f}', parts: ['🏴\u{e0067}\u{e0062}\u{e007f}'] },
  { name: 'ZWJ outside emoji', text: 'a\u200db', parts: ['a\u200d', 'b'] },
  { name: 'combining marks after a line break', text: 'a\n\u0301b', parts: ['a', '\n', '\u0301', 'b'] },
]

function assertSegments(text: string, parts: string[]): void {
  let offset = 0
  const expected = parts.map(part => {
    const start = offset
    offset += part.length
    return { text: part, start, end: offset }
  })
  const segments = segmentGraphemes(text)
  assert.deepEqual(segments, expected)
  assert.equal(segments.map(segment => segment.text).join(''), text)
  for (const segment of segments) assert.equal(text.slice(segment.start, segment.end), segment.text)
  assert.equal(offset, text.length)
}

for (const entry of cases) {
  test(`segments ${entry.name} with UTF-16 offsets`, () => {
    assertSegments(entry.text, entry.parts)
  })
}

test('empty text and lone surrogates preserve the exact input', () => {
  assert.deepEqual(segmentGraphemes(''), [])
  assertSegments('\ud800x\udc00', ['\ud800', 'x', '\udc00'])
  assert.deepEqual(segmentGraphemes('A👨‍👩‍👧‍👦B'), [
    { text: 'A', start: 0, end: 1 },
    { text: '👨‍👩‍👧‍👦', start: 1, end: 12 },
    { text: 'B', start: 12, end: 13 },
  ])
})

test('fallback retains combining clusters, emoji, flags and whitespace without Intl.Segmenter', t => {
  const descriptor = Object.getOwnPropertyDescriptor(Intl, 'Segmenter')!
  t.after(() => Object.defineProperty(Intl, 'Segmenter', descriptor))
  Object.defineProperty(Intl, 'Segmenter', { configurable: true, writable: true, value: undefined })
  for (const entry of cases) assertSegments(entry.text, entry.parts)
  assert.deepEqual(segmentGraphemes(''), [])
  assertSegments('\ud800x\udc00', ['\ud800', 'x', '\udc00'])
})

test('fallback also handles a present but unavailable Segmenter implementation', t => {
  const descriptor = Object.getOwnPropertyDescriptor(Intl, 'Segmenter')!
  t.after(() => Object.defineProperty(Intl, 'Segmenter', descriptor))
  Object.defineProperty(Intl, 'Segmenter', {
    configurable: true,
    writable: true,
    value: class { constructor() { throw new Error('Intl data unavailable') } },
  })
  assertSegments('e\u0301 👩🏾‍💻', ['e\u0301', ' ', '👩🏾‍💻'])
})

test('text run IDs are deterministic, compact and distinguish repeated text at different paths', () => {
  const id = textRunId('Repeated text', '0/2')
  assert.match(id, /^[a-z0-9-]+$/)
  assert.ok(id.length <= 20)
  assert.equal(textRunId('Repeated text', '0/2'), id)
  assert.notEqual(textRunId('Repeated text', '0/3'), id)
  assert.equal(textRunId('Repeated text', [0, 2]), textRunId('Repeated text', [0, 2]))
  assert.notEqual(textRunId('Repeated text', [0, 3]), textRunId('Repeated text', [0, 2]))
  assert.notEqual(textRunId('bc', 'a'), textRunId('c', 'ab'))
  assert.notEqual(textRunId('same', [1, 23]), textRunId('same', [12, 3]))
})

test('changed text, whitespace and Unicode representations invalidate saved character keys', () => {
  const parent = 'adapt-page-heading'
  const key = (text: string) => characterId(parent, textRunId(text, '0'), 0)
  assert.notEqual(key('old text'), key('new text'))
  assert.notEqual(key('a b'), key('a  b'))
  assert.notEqual(key('e\u0301'), key('é'))
  const prefix = 'a'.repeat(5_000)
  const suffix = 'b'.repeat(5_000)
  assert.notEqual(key(`${prefix}X${suffix}`), key(`${prefix}Y${suffix}`))
})

test('character IDs use the exact format and round-trip grapheme start offsets', () => {
  const parentId = 'adapt-abc123-def456'
  const text = 'A👩🏾‍💻e\u0301 中'
  const runId = textRunId(text, [0, 2])
  for (const segment of segmentGraphemes(text)) {
    const id = characterId(parentId, runId, segment.start)
    assert.equal(id, `glyph:${parentId}:${runId}:${segment.start}`)
    assert.deepEqual(parseCharacterId(id), { parentId, runId, offset: segment.start })
  }
  assert.notEqual(characterId(parentId, runId, 0), characterId('adapt-other', runId, 0))
  assert.deepEqual(parseCharacterId(characterId(parentId, runId, 1_000_000)), {
    parentId, runId, offset: 1_000_000,
  })
})

test('ID parsing rejects malformed components, oversized IDs and noncanonical offsets', () => {
  for (const id of [
    '', 'adapt-parent', 'glyph:adapt-parent:run', 'glyph:adapt-parent:run:0:extra',
    'other:adapt-parent:run:0', 'glyph:parent:run:0', 'glyph:adapt-:run:0',
    'glyph:adapt-parent::0', 'glyph:adapt-parent:RUN:0', 'glyph:adapt-parent:run_1:0',
    'glyph:adapt-<html>:run:0', 'glyph:adapt-parent:run\n:0',
    'glyph:adapt-parent:run:-1', 'glyph:adapt-parent:run:1.5', 'glyph:adapt-parent:run:NaN',
    'glyph:adapt-parent:run:Infinity', 'glyph:adapt-parent:run:1000001',
    'glyph:adapt-parent:run:01', 'glyph:adapt-parent:run:+1', 'glyph:adapt-parent:run:-0',
    'glyph:adapt-parent:run:1e3', 'glyph:adapt-parent:run: 1', 'glyph:adapt-parent:run:1\n',
    'glyph:adapt-parent:run:', `glyph:adapt-${'a'.repeat(195)}:run:0`,
    `glyph:adapt-parent:${'a'.repeat(65)}:0`, 'x'.repeat(257),
  ]) assert.equal(parseCharacterId(id), null, id)
})

test('ID construction enforces the same component, length and offset bounds as parsing', () => {
  for (const offset of [-1, 0.5, NaN, Infinity, 1_000_001, Number.MAX_SAFE_INTEGER]) {
    assert.throws(() => characterId('adapt-parent', 'run', offset), RangeError)
  }
  assert.throws(() => characterId('other-parent', 'run', 0), TypeError)
  assert.throws(() => characterId('adapt-parent', 'run:other', 0), TypeError)
  const parentId = `adapt-${'a'.repeat(194)}`
  const runId = 'r'.repeat(41)
  const id = characterId(parentId, runId, 1_000_000)
  assert.equal(id.length, 256)
  assert.deepEqual(parseCharacterId(id), { parentId, runId, offset: 1_000_000 })
  assert.throws(() => characterId(parentId, `${runId}r`, 1_000_000), RangeError)
  assert.equal(parseCharacterId(`glyph:${parentId}:${runId}r:1000000`), null)
})
