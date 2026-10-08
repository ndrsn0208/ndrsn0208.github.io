import type { ReactNode } from 'react'

export type SceneTone = 'reference' | 'diagonal' | 'rank' | 'task1' | 'task2' | 'task3' | 'muted'

/** x,y are parameter coordinates. Optional z is a literal scalar-field height. */
export type ScenePoint = { x: number; y: number; z?: number }

export type ScenePath = {
  id: string
  points: ScenePoint[]
  tone: SceneTone
  dashed?: boolean
  opacity?: number
  width?: number
}

export type SceneRegion = {
  id: string
  boundary: ScenePoint[]
  tone: SceneTone
  dashed?: boolean
  opacity?: number
  fill?: boolean
  /** Hide clipping edges when a filled region is unbounded in parameter space. */
  outline?: boolean
}

export type SceneMarker = {
  id: string
  point: ScenePoint
  tone: SceneTone
  label?: string
  hollow?: boolean
  /** Region annotations name a boundary without adding another model point. */
  labelOnly?: boolean
}

export type ScenePanel = {
  id: string
  title: string
  subtitle?: string
  field: (x: number, y: number) => number
  extent: number
  /** All panels compared at once must use the same fixed height range. */
  valueRange: readonly [number, number]
  /** Keep the terrain quiet when colored task boundaries carry the argument. */
  surfaceStyle?: 'subtle' | 'contours'
  paths?: readonly ScenePath[]
  regions?: readonly SceneRegion[]
  markers?: readonly SceneMarker[]
  metric?: {
    label: string
    value: string
    note?: string
    tone?: SceneTone
  }
}

export type ArgumentSceneProps = {
  panels: readonly ScenePanel[]
  description: string
  heightLabel: string
  /** The legend is part of the scene, directly above the canvases. */
  legend?: readonly { label: string; tone: SceneTone; dashed?: boolean }[]
  /** Repeat the key beside each surface when a comparison stacks on narrow screens. */
  repeatLegend?: boolean
  /** Put an objective beside its own surface instead of in a separate lower panel. */
  panelDetails?: Readonly<Record<string, ReactNode>>
  className?: string
}
