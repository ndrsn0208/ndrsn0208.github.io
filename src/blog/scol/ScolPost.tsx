import Essay from '../essay/Essay'
import { scolEssay } from './article'
import { drawScol } from './exhibits'

export default function ScolPost() {
  return <Essay essay={scolEssay} draw={drawScol} />
}
