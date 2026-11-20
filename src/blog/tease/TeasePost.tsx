import Essay from '../essay/Essay'
import { teaseEssay } from './article'
import { drawTease } from './exhibits'

export default function TeasePost() {
  return <Essay essay={teaseEssay} draw={drawTease} />
}
