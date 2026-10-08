import { useId } from 'react'
import './fisher-matrix.css'

type FisherMatrixProps = {
  matrix: readonly (readonly number[])[]
  maximum: number
  label: string
  highlightOffDiagonal?: boolean
}

export default function FisherMatrix({
  matrix,
  maximum,
  label,
  highlightOffDiagonal = false,
}: FisherMatrixProps) {
  const id = useId()
  const size = matrix.length
  const scale = Number.isFinite(maximum) && maximum > 0 ? maximum : 0

  if (size === 0) return null

  // Inset guide segments stay inside diagonal cells, leaving off-diagonal zeros untouched.
  const diagonalGuide = matrix.map((_, i) => `M${i + 0.25} ${i + 0.25}l0.5 0.5`).join(' ')

  return (
    <svg
      className="fisher-matrix"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      data-highlight-off-diagonal={highlightOffDiagonal}
      focusable="false"
    >
      <title id={`${id}-title`}>{label}</title>
      <desc id={`${id}-description`}>
        Rows and columns represent the same {size} parameters in the same order.
        Blue indicates positive interactions, copper indicates negative interactions,
        and the page background indicates zero. Equal magnitudes have equal color
        strength relative to the supplied common maximum. The subtle diagonal guide
        marks each parameter’s interaction with itself.
        {highlightOffDiagonal && ' Diagonal entries are dimmed to emphasize interactions between different parameters.'}
      </desc>
      <g aria-hidden="true" shapeRendering="crispEdges">
        {matrix.flatMap((row, i) => row.map((value, j) => (
          <rect
            key={`${i}-${j}`}
            className="fisher-matrix-cell"
            data-diagonal={i === j}
            x={j}
            y={i}
            width="1"
            height="1"
            fill={`var(--fisher-matrix-${value < 0 ? 'negative' : 'positive'})`}
            fillOpacity={scale > 0 && Number.isFinite(value) ? Math.min(1, Math.abs(value) / scale) : 0}
          />
        )))}
      </g>
      <path
        className="fisher-matrix-guide"
        d={diagonalGuide}
        vectorEffect="non-scaling-stroke"
        aria-hidden="true"
      />
    </svg>
  )
}
