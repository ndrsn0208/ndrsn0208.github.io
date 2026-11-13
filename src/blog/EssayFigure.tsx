import TerrainStage from './diffusion/TerrainStage'
import Layers, { fill, written } from './scol/Layers'
import './diffusion/exhibits.css'
import './scol/exhibits.css'
import './essay-figure.css'

/** An essay's one drawing, small, wherever the essay is listed. */
export default function EssayFigure({ id }: { id: 'diffusion' | 'scol' }) {
  return (
    <figure className="essay-figure" data-kind={id}>
      {id === 'diffusion'
        ? <TerrainStage mode="emblem" step={0} still seen
          label="A loss surface with the low-loss regions of three tasks. The parameters move from the old-task optimum into the basin shared by all three tasks, inside the trust region." />
        : <div className="essay-figure-layers" role="img" aria-label="Three contexts, each consolidated into a few of the model’s 28 layers.">
          {written.map((layers, index) => <Layers key={index} cells={fill(layers, index === 2 ? 'on' : 'kept')} />)}
        </div>}
    </figure>
  )
}
