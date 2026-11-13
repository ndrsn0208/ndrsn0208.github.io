import Essay from '../essay/Essay'
import { diffusionEssay } from './article'
import { drawDiffusion } from './exhibits'

export default function DiffusionPost() {
  return <Essay essay={diffusionEssay} draw={drawDiffusion} />
}
