import type { PaperGradient } from '@/types'

/* ------------------------------------------------------------------
   Deterministic per-paper foil generator.

   Inputs: paper id (for the seed) + tags (for the color contributors).
   Output: a PaperGradient that the React renderer turns into a CSS
   conic-gradient + specular highlight + SVG noise overlay.

   This algorithm is duplicated in scripts/update_publications.py.
   Keep them in sync — the Python script writes the gradient into
   publications.json so the client renders the exact same thing.
   ------------------------------------------------------------------ */

const TAG_PALETTE: Record<string, string[]> = {
  'continual learning':     ['#F43F5E', '#FB7185'],
  'compositionality':       ['#C026D3', '#DB2777'],
  'language models':        ['#FFA94D', '#F97316'],
  'reinforcement learning': ['#F59E0B', '#FCA5A5'],
  'concept learning':       ['#FF6B6B', '#FFE3D8'],
  'diffusion models':       ['#A78BFA', '#FFD7B5'],
}

const WARM_FILLERS = ['#FFE3D8', '#FFD7B5', '#FCA5A5', '#FBCFE8', '#FFA94D']

/* FNV-1a 32-bit string hash. Deterministic across JS and Python. */
function hashId(id: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/* mulberry32 PRNG — small, deterministic, [0, 1). */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function generateGradient(id: string, tags: string[]): PaperGradient {
  const r = rng(hashId(id))

  // Collect color contributors from tags.
  const contributors: string[] = []
  for (const t of tags) {
    const palette = TAG_PALETTE[t]
    if (palette) contributors.push(...palette)
  }
  // Always seed with at least one warm tone so empty-tag papers still render.
  if (contributors.length === 0) {
    contributors.push('#FF6B6B', '#FFA94D', '#FFD7B5')
  }
  // Mix in 1–2 warm fillers for richness.
  const fillerCount = 1 + Math.floor(r() * 2)
  for (let i = 0; i < fillerCount; i++) {
    contributors.push(WARM_FILLERS[Math.floor(r() * WARM_FILLERS.length)])
  }

  // Deduplicate while preserving order.
  const seen = new Set<string>()
  const unique = contributors.filter((c) => {
    if (seen.has(c)) return false
    seen.add(c)
    return true
  })

  // Fisher–Yates shuffle (seeded).
  const shuffled = [...unique]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // 4–6 stops for the conic.
  const stopCount = Math.min(shuffled.length, 4 + Math.floor(r() * 3))
  const chosen = shuffled.slice(0, stopCount)

  // Even-spaced stops with up-to-±25% jitter so it doesn't feel ruler-drawn.
  const stops = chosen.map((color, i) => {
    const base = (i / stopCount) * 360
    const jitter = (r() - 0.5) * (360 / stopCount) * 0.5
    return { color, pos: clamp(base + jitter, 0, 360) }
  })
  stops.sort((a, b) => a.pos - b.pos)

  return {
    stops,
    fromAngle: Math.floor(r() * 360),
    cx: 20 + Math.floor(r() * 60),
    cy: 20 + Math.floor(r() * 60),
    hx: Math.floor(r() * 100),
    hy: Math.floor(r() * 100),
    hIntensity: 0.45 + r() * 0.25,
    noiseFreq: 0.65 + r() * 0.7,
    noiseOpacity: 0.4 + r() * 0.25,
  }
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

/* Render helpers --------------------------------------------------- */

export function gradientBackground(g: PaperGradient): string {
  const stopStr = g.stops.map((s) => `${s.color} ${s.pos.toFixed(1)}deg`).join(', ')
  // Loop back to the first color at 360 so the conic seams cleanly.
  return `conic-gradient(from ${g.fromAngle}deg at ${g.cx}% ${g.cy}%, ${stopStr}, ${g.stops[0].color} 360deg)`
}

export function highlightBackground(g: PaperGradient): string {
  return `radial-gradient(140% 80% at ${g.hx}% ${g.hy}%, rgba(255,255,255,${g.hIntensity.toFixed(3)}) 0%, transparent 45%)`
}

export function noiseBackground(g: PaperGradient): string {
  // SVG turbulence noise as a data URL — frequency varies per paper.
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>` +
    `<filter id='n'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='${g.noiseFreq.toFixed(3)}' numOctaves='2'/>` +
    `<feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .55 0'/>` +
    `</filter>` +
    `<rect width='220' height='220' filter='url(%23n)'/>` +
    `</svg>`
  return `url("data:image/svg+xml;utf8,${svg}")`
}
