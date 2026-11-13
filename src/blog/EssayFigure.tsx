import TerrainStage from './diffusion/TerrainStage'
import Layers, { fill, written } from './scol/Layers'
import { heldOutPairs } from './composition/Pairs'
import './diffusion/exhibits.css'
import './scol/exhibits.css'
import './composition/exhibits.css'
import './essay-figure.css'

/** An essay's one drawing, small, wherever the essay is listed. */
export default function EssayFigure({ id }: { id: 'diffusion' | 'scol' | 'composition' }) {
  return (
    <figure className="essay-figure" data-kind={id}>
      {id === 'diffusion'
        ? <TerrainStage mode="emblem" step={0} still seen
          label="A loss surface with the low-loss regions of three tasks. The parameters move from the old-task optimum into the basin shared by all three tasks, inside the trust region." />
        : id === 'scol'
          ? <div className="essay-figure-layers" role="img" aria-label="Three contexts, each consolidated into a few of the model’s 28 layers.">
            {written.map((layers, index) => <Layers key={index} cells={fill(layers, index === 2 ? 'on' : 'kept')} />)}
          </div>
          : <div className="essay-figure-pairs" role="img" aria-label="Sixteen pairs of digit color and background color. Twelve are seen in training, four are held out, and one held-out pair is made at test time.">
            {heldOutPairs.flatMap((_, row) => heldOutPairs.map((__, column) => {
              const held = heldOutPairs.some(([heldRow, heldColumn]) => heldRow === row && heldColumn === column)
              return <span key={`${row}-${column}`} data-held={held || undefined} data-made={(row === 1 && column === 0) || undefined} />
            }))}
          </div>}
    </figure>
  )
}
