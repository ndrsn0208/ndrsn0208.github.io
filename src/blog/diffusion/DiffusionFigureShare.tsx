import FigureShare from '../FigureShare'
import { diffusionFigureUrl, getDiffusionFigure, type DiffusionFigureShareId } from './figure-shares'

export default function DiffusionFigureShare({ id }: { id: DiffusionFigureShareId }) {
  const figure = getDiffusionFigure(id)!
  return <FigureShare title={figure.title} url={diffusionFigureUrl(id)} image={figure.image} />
}
