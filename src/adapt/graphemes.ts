type Grapheme = { text: string; start: number; end: number }
type CharacterKey = { parentId: string; runId: string; offset: number }

const MAX_CHARACTER_ID_LENGTH = 256
const MAX_PARENT_ID_LENGTH = 200
const MAX_RUN_ID_LENGTH = 64
const MAX_OFFSET = 1_000_000
const MARK = /\p{Mark}/u
const PICTOGRAPH = /\p{Extended_Pictographic}/u
const CONTROL = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u

let segmenterConstructor: typeof Intl.Segmenter | undefined
let segmenter: Intl.Segmenter | undefined

function isExtend(text: string, code: number): boolean {
  return MARK.test(text) || code === 0x200c
    || (code >= 0x1f3fb && code <= 0x1f3ff)
    || (code >= 0xe0020 && code <= 0xe007f)
}

function isRegionalIndicator(code: number): boolean {
  return code >= 0x1f1e6 && code <= 0x1f1ff
}

function hangulKind(code: number): 'L' | 'V' | 'T' | 'LV' | 'LVT' | undefined {
  if ((code >= 0x1100 && code <= 0x115f) || (code >= 0xa960 && code <= 0xa97c)) return 'L'
  if ((code >= 0x1160 && code <= 0x11a7) || (code >= 0xd7b0 && code <= 0xd7c6)) return 'V'
  if ((code >= 0x11a8 && code <= 0x11ff) || (code >= 0xd7cb && code <= 0xd7fb)) return 'T'
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 === 0 ? 'LV' : 'LVT'
}

function joinsHangul(previous: number, current: number): boolean {
  const before = hangulKind(previous)
  const after = hangulKind(current)
  return (before === 'L' && (after === 'L' || after === 'V' || after === 'LV' || after === 'LVT'))
    || ((before === 'LV' || before === 'V') && (after === 'V' || after === 'T'))
    || ((before === 'LVT' || before === 'T') && after === 'T')
}

// Covers common clusters without a dependency; Intl supplies the complete Unicode break rules.
function fallbackSegments(text: string): Grapheme[] {
  const result: Grapheme[] = []
  let start = 0
  let end = 0
  let previous = -1
  let previousControl = false
  let regionalCount = 0
  let pictographTail = false
  let pictographicJoiner = false

  for (const point of text) {
    const code = point.codePointAt(0)!
    const extend = isExtend(point, code)
    const joiner = code === 0x200d
    const pictograph = PICTOGRAPH.test(point)
    const control = !extend && !joiner && CONTROL.test(point)
    const regional = isRegionalIndicator(code)
    const joined = previous === 0x0d && code === 0x0a
      || (previous >= 0 && !previousControl && !control
        && (extend || joiner || joinsHangul(previous, code)
          || (pictographicJoiner && pictograph)
          || (regional && isRegionalIndicator(previous) && regionalCount % 2 === 1)))

    if (!joined) {
      if (end > start) result.push({ text: text.slice(start, end), start, end })
      start = end
      regionalCount = 0
      pictographTail = false
    }
    end += point.length
    regionalCount = regional ? regionalCount + 1 : 0
    pictographicJoiner = joiner && pictographTail
    if (!extend) pictographTail = pictograph
    previous = code
    previousControl = control
  }
  if (end > start) result.push({ text: text.slice(start, end), start, end })
  return result
}

/** Segments exact live text; offsets use Text/Range's UTF-16 indexing, including whitespace. */
export function segmentGraphemes(text: string): Grapheme[] {
  if (typeof text !== 'string') throw new TypeError('Grapheme text must be a string')
  if (!text.length) return []
  const Constructor = typeof Intl === 'undefined' ? undefined : Intl.Segmenter
  if (typeof Constructor === 'function') {
    try {
      if (!segmenter || segmenterConstructor !== Constructor) {
        segmenter = new Constructor(undefined, { granularity: 'grapheme' })
        segmenterConstructor = Constructor
      }
      return Array.from(segmenter.segment(text), item => ({
        text: item.segment, start: item.index, end: item.index + item.segment.length,
      }))
    } catch {
      // Partial Intl implementations can expose Segmenter but fail during construction/use.
    }
  }
  return fallbackSegments(text)
}

/** Full-text fingerprint: never normalize or sample text, since either changes offset identity. */
export function textRunId(text: string, path: string | readonly number[]): string {
  if (typeof text !== 'string') throw new TypeError('Text run content must be a string')
  let location: string
  if (typeof path === 'string') {
    location = `s${path}`
  } else if (Array.isArray(path)
    && path.every(index => typeof index === 'number' && Number.isSafeInteger(index) && index >= 0)) {
    location = `a${path.join('.')}`
  } else {
    throw new TypeError('Text run path must be a string or nonnegative child indices')
  }

  let a = 0xdeadbeef
  let b = 0x41c6ce57
  // Length framing distinguishes repeated text at different paths and ambiguous concatenations.
  for (const part of [String(location.length), ':', location, String(text.length), ':', text]) {
    for (let i = 0; i < part.length; i++) {
      const code = part.charCodeAt(i)
      a = Math.imul(a ^ code, 2654435761)
      b = Math.imul(b ^ code, 1597334677)
    }
  }
  a = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(b ^ (b >>> 13), 3266489909)
  b = Math.imul(b ^ (b >>> 16), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909)
  return `r-${(a >>> 0).toString(36)}-${(b >>> 0).toString(36)}`
}

function validParent(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('adapt-') && value.length > 6
    && value.length <= MAX_PARENT_ID_LENGTH && !/[^a-z0-9-]/.test(value)
}

function validRun(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_RUN_ID_LENGTH
    && !/[^a-z0-9-]/.test(value)
}

function validOffset(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_OFFSET
}

/** Invalid components throw; valid output always round-trips through parseCharacterId. */
export function characterId(parentId: string, runId: string, offset: number): string {
  if (!validParent(parentId) || !validRun(runId)) throw new TypeError('Invalid character ID component')
  if (!validOffset(offset)) throw new RangeError('Character offset must be an integer from 0 to 1000000')
  const id = `glyph:${parentId}:${runId}:${offset}`
  if (id.length > MAX_CHARACTER_ID_LENGTH) throw new RangeError('Character ID exceeds 256 characters')
  return id
}

/** Reject noncanonical offsets and delimiters rather than accepting aliases for a saved glyph. */
export function parseCharacterId(id: string): CharacterKey | null {
  if (typeof id !== 'string' || id.length > MAX_CHARACTER_ID_LENGTH) return null
  const parts = id.split(':')
  if (parts.length !== 4 || parts[0] !== 'glyph') return null
  const [, parentId, runId, rawOffset] = parts
  const offset = Number(rawOffset)
  if (!validParent(parentId) || !validRun(runId)
    || !validOffset(offset) || String(offset) !== rawOffset) return null
  return { parentId, runId, offset }
}
