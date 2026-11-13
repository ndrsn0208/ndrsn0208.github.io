import type { CSSProperties } from 'react'
import { fisherLayerCount } from './fisher-evidence'

/* The essay's one drawing: the model as a row of its 28 layers. A filled cell
   is a layer that received an update. Every figure is made of these rows. */

export type Cell = 'on' | 'kept' | 'lost' | 'pick'

export const fill = (layers: readonly number[], state: Cell): Record<number, Cell> => Object.fromEntries(layers.map(layer => [layer, state]))

/** Layers as people count them, from 1. */
export const say = (layers: readonly number[]) => layers.map(layer => layer + 1).join(', ')

/** The layer selection of each context in the opening example. */
export const written = [
  [2, 5, 9, 14, 20, 25],
  [4, 7, 12, 17, 22, 27],
  [1, 6, 11, 16, 19, 24],
] as const

/** One row. Without a label it is part of a larger picture that is described as a whole. */
export default function Layers({ cells, label }: { cells: Readonly<Record<number, Cell>>, label?: string }) {
  return (
    <div className="layers" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {Array.from({ length: fisherLayerCount }, (_, layer) => <span key={layer} data-state={cells[layer]} />)}
    </div>
  )
}

/** One row of measured values between 0 and 1. A darker cell is a higher value. */
export function LayerValues({ values, label }: { values: readonly number[], label: string }) {
  return (
    <div className="layers layers-values" role="img" aria-label={label}>
      {values.map((value, layer) => <span key={layer} style={{ '--value': value } as CSSProperties} />)}
    </div>
  )
}
