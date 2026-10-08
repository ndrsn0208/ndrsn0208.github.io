import type { ScenePanel } from './argument-scene-types'

export type FisherEstimate = 'full' | 'diagonal' | 'rank'
export type FisherMatrixData = readonly (readonly number[])[]
type PlaneMatrix = readonly [number, number, number]

// An illustrative gradient population, not gradients measured in the paper.
// Its small residual keeps rank-1 close to, but distinct from, full Fisher.
export const FISHER_DIMENSION = 24
export const FISHER_SECONDARY = 0.025
export const FISHER_TERTIARY = 0.009
export const FISHER_RESIDUAL = 0.0007
export const FISHER_EXTENT = 1.55
export const FISHER_VIEW = { turn: 0.62, tilt: 0.78 }
const dot = (a: readonly number[], b: readonly number[]) =>
  a.reduce((sum, value, index) => sum + value * b[index], 0)
const normalize = (values: readonly number[]) => {
  const length = Math.sqrt(dot(values, values))
  return values.map(value => value / length)
}
function orthogonalize(values: readonly number[], basis: readonly (readonly number[])[]) {
  let result = [...values]
  for (const direction of basis) {
    const projection = dot(result, direction)
    result = result.map((value, index) => value - projection * direction[index])
  }
  return normalize(result)
}

export const sharedDirection = normalize(Array.from({ length: FISHER_DIMENSION }, (_, i) =>
  (i >= 8 && i < 16 ? -1 : 1) * (0.62 + 0.22 * Math.sin(i * 0.71) + 0.13 * Math.cos(i * 1.9)),
))
export const secondaryDirection = orthogonalize(
  sharedDirection.map((_, i) => Math.sin(i * 1.37) + 0.35 * Math.cos(i * 0.46)),
  [sharedDirection],
)
export const tertiaryDirection = orthogonalize(
  sharedDirection.map((_, i) => Math.cos(i * 0.82)),
  [sharedDirection, secondaryDirection],
)

// Symmetric pairs have mean u and covariance
// αvvᵀ + βwwᵀ + ε(I − uuᵀ − vvᵀ − wwᵀ).
export const sampleGradients = Array.from({ length: FISHER_DIMENSION * 2 }, (_, sample) => {
  const column = sample % FISHER_DIMENSION
  const sign = sample < FISHER_DIMENSION ? -1 : 1
  return sharedDirection.map((value, coordinate) => {
    const uu = value * sharedDirection[column]
    const vv = secondaryDirection[coordinate] * secondaryDirection[column]
    const ww = tertiaryDirection[coordinate] * tertiaryDirection[column]
    const covarianceRoot = Math.sqrt(FISHER_SECONDARY) * vv
      + Math.sqrt(FISHER_TERTIARY) * ww
      + Math.sqrt(FISHER_RESIDUAL) * ((coordinate === column ? 1 : 0) - uu - vv - ww)
    return value + sign * Math.sqrt(FISHER_DIMENSION) * covarianceRoot
  })
})
export const meanGradient = sharedDirection.map((_, coordinate) =>
  sampleGradients.reduce((sum, gradient) => sum + gradient[coordinate], 0) / sampleGradients.length,
)
export const fullFisher: FisherMatrixData = sharedDirection.map((_, row) =>
  sharedDirection.map((__, col) =>
    sampleGradients.reduce((sum, gradient) => sum + gradient[row] * gradient[col], 0) / sampleGradients.length,
  ),
)
// The diagonal is taken before the matrices are projected into a shared plane.
export const diagonalFisher: FisherMatrixData = fullFisher.map((row, i) =>
  row.map((value, j) => i === j ? value : 0),
)
const meanNormSquared = dot(meanGradient, meanGradient)
export const rankCoefficient = sampleGradients.reduce(
  (sum, gradient) => sum + dot(meanGradient, gradient) ** 2, 0,
) / (sampleGradients.length * meanNormSquared ** 2)
export const rankFisher: FisherMatrixData = meanGradient.map(left =>
  meanGradient.map(right => rankCoefficient * left * right),
)
export const fisherMatrices: Record<FisherEstimate, FisherMatrixData> = {
  full: fullFisher,
  diagonal: diagonalFisher,
  rank: rankFisher,
}
export const matrixColorMaximum = Math.max(...fullFisher.flat().map(Math.abs), ...rankFisher.flat().map(Math.abs))

export function matrixError(estimate: FisherEstimate) {
  let difference = 0
  let reference = 0
  fullFisher.forEach((row, i) => row.forEach((value, j) => {
    reference += value * value
    difference += (value - fisherMatrices[estimate][i][j]) ** 2
  }))
  return Math.sqrt(difference / reference)
}
export const approximationErrors: Record<FisherEstimate, number> = {
  full: 0,
  diagonal: matrixError('diagonal'),
  rank: matrixError('rank'),
}
export const errorPercent = (estimate: FisherEstimate) => `${(100 * approximationErrors[estimate]).toFixed(1)}%`

const viewAngle = 0.62
export const horizontalDirection = sharedDirection.map((value, i) =>
  Math.cos(viewAngle) * value + Math.sin(viewAngle) * secondaryDirection[i],
)
export const verticalDirection = sharedDirection.map((value, i) =>
  -Math.sin(viewAngle) * value + Math.cos(viewAngle) * secondaryDirection[i],
)
function bilinear(matrix: FisherMatrixData, left: readonly number[], right: readonly number[]) {
  return left.reduce((sum, value, row) => sum + value * dot(matrix[row], right), 0)
}
function project(matrix: FisherMatrixData): PlaneMatrix {
  return [
    bilinear(matrix, horizontalDirection, horizontalDirection),
    bilinear(matrix, horizontalDirection, verticalDirection),
    bilinear(matrix, verticalDirection, verticalDirection),
  ]
}
export const projectedFishers: Record<FisherEstimate, PlaneMatrix> = {
  full: project(fullFisher),
  diagonal: project(diagonalFisher),
  rank: project(rankFisher),
}
export function localPenalty(estimate: FisherEstimate, x: number, y: number) {
  const [xx, xy, yy] = projectedFishers[estimate]
  return Math.max(0, (xx * x * x + 2 * xy * x * y + yy * y * y) / 2)
}

// Identical nonlinear detail gives the illustration asymmetric hills and valleys.
// The r⁴ envelope makes this term and its first two derivatives zero at the
// checkpoint. The local Hessian there is exactly the projected Fisher surrogate.
// These are NOT three measured diffusion losses or a nonquadratic Fisher.
const hills = [
  { x: -1.02, y: 0.52, sx: 0.41, sy: 0.23, angle: 0.62, amplitude: 1.12 },
  { x: 0.8, y: -0.12, sx: 0.29, sy: 0.43, angle: -0.8, amplitude: 0.92 },
  { x: -0.1, y: -1.08, sx: 0.38, sy: 0.22, angle: 0.2, amplitude: 1.02 },
  { x: 1.07, y: 1.02, sx: 0.36, sy: 0.32, angle: -0.38, amplitude: 0.86 },
  { x: -1.23, y: -0.89, sx: 0.33, sy: 0.48, angle: 0.85, amplitude: 0.71 },
] as const
export function sharedNonlinearLoss(x: number, y: number) {
  const r4 = (x * x + y * y) ** 2
  const mixture = hills.reduce((sum, hill) => {
    const dx = x - hill.x
    const dy = y - hill.y
    const a = (Math.cos(hill.angle) * dx + Math.sin(hill.angle) * dy) / hill.sx
    const b = (-Math.sin(hill.angle) * dx + Math.cos(hill.angle) * dy) / hill.sy
    return sum + hill.amplitude * Math.exp(-(a * a + b * b) / 2)
  }, 0)
  return 0.016 * r4 + r4 / (0.32 + r4) * mixture
}
export const fisherFields: Record<FisherEstimate, (x: number, y: number) => number> = {
  full: (x, y) => sharedNonlinearLoss(x, y) + localPenalty('full', x, y),
  diagonal: (x, y) => sharedNonlinearLoss(x, y) + localPenalty('diagonal', x, y),
  rank: (x, y) => sharedNonlinearLoss(x, y) + localPenalty('rank', x, y),
}
let maximumLoss = 0
for (let i = 0; i <= 128; i += 1) for (let j = 0; j <= 128; j += 1) {
  const x = (i / 64 - 1) * FISHER_EXTENT
  const y = (j / 64 - 1) * FISHER_EXTENT
  for (const field of Object.values(fisherFields)) maximumLoss = Math.max(maximumLoss, field(x, y))
}
export const FISHER_HEIGHT_RANGE = [0, Math.ceil(maximumLoss * 10) / 10] as const
export const fisherEstimates: readonly { id: FisherEstimate; title: string; description: string }[] = [
  { id: 'full', title: 'Full Fisher', description: 'All parameter interactions' },
  { id: 'diagonal', title: 'Diagonal', description: 'Off-diagonal entries removed' },
  { id: 'rank', title: 'Rank-1', description: 'The shared pattern preserved' },
]
export const fisherPanels: readonly ScenePanel[] = fisherEstimates.map(({ id, title }) => ({
  id: `fisher-${id}`,
  title,
  field: fisherFields[id],
  extent: FISHER_EXTENT,
  valueRange: FISHER_HEIGHT_RANGE,
  surfaceStyle: 'contours',
  markers: [{ id: 'checkpoint', point: { x: 0, y: 0 }, tone: 'reference', hollow: true }],
}))
