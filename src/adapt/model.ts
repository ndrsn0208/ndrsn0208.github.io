export const ADAPT_VERSION = 1
export const ADAPT_STORAGE_KEY = 'ndrsn:adapt:v1'
export const ADAPT_ENABLED_KEY = 'ndrsn:adapt:enabled'

export const ADAPT_LIMITS = {
  pages: 12,
  elements: 2400,
  strokes: 120,
  points: 480,
  diffusions: 64,
  history: 30,
  serializedChars: 1_500_000,
} as const

export type AdaptTool = 'browse' | 'break' | 'draw' | 'diffuse' | 'edit' | 'layout'
export type AdaptWeapon = 'hammer' | 'ray' | 'vortex'
export type AdaptFont = 'original' | 'book' | 'sans' | 'mono' | 'poster'
export type SaveStatus = 'saved' | 'saving' | 'memory'
export type LayoutKind = 'original' | 'columns' | 'shuffle'

export const ADAPT_FONTS: Record<Exclude<AdaptFont, 'original'>, string> = {
  book: '"Newsreader", Georgia, serif',
  sans: '"Source Sans 3", system-ui, sans-serif',
  mono: '"SFMono-Regular", Consolas, monospace',
  poster: 'Impact, "Arial Black", sans-serif',
}

export interface ElementPatch {
  /** Horizontal offset as a fraction of the viewport width. */
  dx?: number
  /** Vertical offset in CSS pixels. */
  dy?: number
  rotation?: number
  scale?: number
  font?: AdaptFont
  fontScale?: number
  weight?: number
  italic?: boolean
  color?: string
  /** Additional letter spacing in CSS pixels. */
  letterSpacing?: number
  hidden?: boolean
  /** Accumulated weapon damage. Partial presses can finish an earlier hit. */
  damage?: number
}

export interface AdaptPoint {
  /** x is normalized to document width; y is a document-space CSS pixel. */
  x: number
  y: number
  pressure?: number
}

export interface AdaptStroke {
  id: string
  color: string
  width: number
  points: AdaptPoint[]
}

/** Legacy decorative marks, retained for saved-state compatibility but never rendered. */
export interface DiffusionPatch {
  id: string
  x: number
  y: number
  radius: number
  seed: number
  phase: number
  color: string
  amount: number
}

export interface LayoutSpec {
  kind: LayoutKind
  seed: number
}

export interface AdaptPage {
  elements: Record<string, ElementPatch>
  strokes: AdaptStroke[]
  diffusions: DiffusionPatch[]
  layout: LayoutSpec
}

export interface AdaptDocument {
  version: 1
  enabled: boolean
  pages: Record<string, AdaptPage>
}

export interface AdaptSnapshot {
  document: AdaptDocument
  canUndo: boolean
  canRedo: boolean
  saveStatus: SaveStatus
}

export interface AdaptSelection {
  id: string
  label: string
  patch: ElementPatch
}

export interface AdaptToolbarProps {
  tool: AdaptTool
  onTool: (tool: AdaptTool) => void
  weapon: AdaptWeapon
  onWeapon: (weapon: AdaptWeapon) => void
  color: string
  onColor: (color: string) => void
  size: number
  onSize: (size: number) => void
  selection: AdaptSelection | null
  /** Sliders preview while dragging and commit once on release or blur. */
  onEdit: (patch: ElementPatch, final?: boolean) => void
  onDeleteSelection: () => void
  onRestoreSelection: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  layout: LayoutSpec
  onLayout: (kind: LayoutKind) => void
  onResetPage: () => void
  onExit: () => void
  saveStatus: SaveStatus
  changeCount: number
}

export function emptyPage(): AdaptPage {
  return { elements: {}, strokes: [], diffusions: [], layout: { kind: 'original', seed: 0 } }
}

export function emptyDocument(enabled = false): AdaptDocument {
  return { version: ADAPT_VERSION, enabled, pages: {} }
}

export function adaptationPageKey(pathname: string): string {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path.startsWith('/blog/continual-learning-diffusion-models/figures/')) {
    return '/blog/continual-learning-diffusion-models'
  }
  return path
}

export function pageChangeCount(page: AdaptPage): number {
  return Object.keys(page.elements).length + page.strokes.length
    + Number(page.layout.kind !== 'original')
}

export function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value))
}

export function makeAdaptId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}
