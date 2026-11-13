import Essay from '../essay/Essay'
import { compositionEssay } from './article'
import { drawComposition } from './exhibits'

export default function CompositionPost() {
  return <Essay essay={compositionEssay} draw={drawComposition} />
}
