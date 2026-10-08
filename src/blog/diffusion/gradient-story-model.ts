export type GradientVector = readonly number[]
export type GradientMatrix = readonly GradientVector[]
export type GradientStage = 0 | 1 | 2

export const GRADIENT_PARAMETERS = ['θ₁', 'θ₂', 'θ₃', 'θ₄'] as const
export const GRADIENT_SAMPLE_DURATION = 2200
export const GRADIENT_STAGE_STARTS = [0, 8800, 12200] as const
export const GRADIENT_STAGE_ENDS = [8800, 12200, 17000] as const
export const GRADIENT_DURATION = GRADIENT_STAGE_ENDS[2]

const clamp = (value: number) => Math.max(0, Math.min(1, value))
const smooth = (value: number) => {
  const p = clamp(value)
  return p * p * (3 - 2 * p)
}

export function gradientDot(a: GradientVector, b: GradientVector) {
  return a.reduce((sum, value, index) => sum + value * b[index], 0)
}

export function gradientOuter(vector: GradientVector): GradientMatrix {
  return vector.map(a => vector.map(b => a * b))
}

function averageMatrices(matrices: readonly GradientMatrix[]): GradientMatrix {
  return matrices[0].map((row, i) => row.map((_, j) =>
    matrices.reduce((sum, matrix) => sum + matrix[i][j], 0) / matrices.length))
}

function interpolateMatrices(a: GradientMatrix, b: GradientMatrix, progress: number): GradientMatrix {
  return a.map((row, i) => row.map((value, j) => value + (b[i][j] - value) * progress))
}

/**
 * A constructed gradient population with a dominant shared direction and a
 * small orthogonal residual. F is the uncentered second moment E[ggᵀ].
 * These values are illustrative, not measured diffusion-model gradients.
 */
function buildGradientStoryModel() {
  const direction = [2, 1, -1, -2]
  const residual = [1, -2, 2, -1]
  const samples = [[1, 1], [1, -1], [2, 1], [2, -1]].map(([strength, sign]) =>
    direction.map((value, index) => strength * value + sign * 0.4 * residual[index]))
  const mean = direction.map((_, index) =>
    samples.reduce((sum, sample) => sum + sample[index], 0) / samples.length)
  const outerProducts = samples.map(gradientOuter)
  const cumulative = samples.map((_, index) => averageMatrices(outerProducts.slice(0, index + 1)))
  const fisher = cumulative[cumulative.length - 1]
  const meanProduct = gradientOuter(mean)
  // Equation 6: the coefficient for an unnormalized mean, not an eigenvalue.
  const scale = samples.reduce((sum, sample) => sum + gradientDot(mean, sample) ** 2, 0)
    / samples.length / gradientDot(mean, mean) ** 2
  const rankOne = meanProduct.map(row => row.map(value => scale * value))
  const diagonal = fisher.map((row, i) => row.map((value, j) => i === j ? value : 0))
  const zero = fisher.map(row => row.map(() => 0))
  const colorMaximum = Math.max(...outerProducts.flat(2).map(Math.abs))
  const vectorMaximum = Math.max(...samples.flat().map(Math.abs), ...mean.map(Math.abs))

  return { samples, mean, outerProducts, cumulative, fisher, meanProduct, scale, rankOne, diagonal, zero, colorMaximum, vectorMaximum }
}

export const gradientStoryModel = buildGradientStoryModel()

export type GradientFrame = {
  stage: GradientStage
  sample: number
  left: GradientMatrix
  right: GradientMatrix
  operand?: GradientVector
  reveal: number
  rightReveal: number
  transfer: number
  activeCell: number | null
  completedSamples: number
  scaleProgress: number
  diagonalProgress: number
}

export function gradientCellReveal(progress: number, index: number) {
  return smooth(progress * 19 - index)
}

export function gradientFrameAt(milliseconds: number): GradientFrame {
  const time = Math.max(0, Math.min(GRADIENT_DURATION, milliseconds))
  const model = gradientStoryModel
  if (time < GRADIENT_STAGE_ENDS[0]) {
    const sample = Math.min(3, Math.floor(time / GRADIENT_SAMPLE_DURATION))
    const local = time - sample * GRADIENT_SAMPLE_DURATION
    const reveal = clamp((local - 200) / 1100)
    const transfer = smooth((local - 1450) / 550)
    const active = Math.floor(reveal * 19)
    return {
      stage: 0, sample, left: model.outerProducts[sample],
      right: interpolateMatrices(sample === 0 ? model.zero : model.cumulative[sample - 1], model.cumulative[sample], transfer),
      operand: model.samples[sample], reveal,
      rightReveal: sample === 0 ? transfer : 1, transfer,
      activeCell: reveal > 0 && active < 16 ? active : null,
      completedSamples: sample + (transfer === 1 ? 1 : 0),
      scaleProgress: 0, diagonalProgress: 0,
    }
  }
  if (time < GRADIENT_STAGE_ENDS[1]) {
    const diagonalProgress = smooth((time - GRADIENT_STAGE_STARTS[1] - 450) / 1500)
    return {
      stage: 1, sample: 3,
      left: interpolateMatrices(model.fisher, model.diagonal, diagonalProgress),
      right: model.fisher, reveal: 1, rightReveal: 1, transfer: 0,
      activeCell: null, completedSamples: 4, scaleProgress: 0, diagonalProgress,
    }
  }
  const local = time - GRADIENT_STAGE_STARTS[2]
  const reveal = clamp((local - 450) / 1900)
  const scaleProgress = smooth((local - 2700) / 900)
  const active = Math.floor(reveal * 19)
  return {
    stage: 2, sample: 3,
    left: interpolateMatrices(model.meanProduct, model.rankOne, scaleProgress),
    right: model.fisher, operand: model.mean, reveal, rightReveal: 1, transfer: 0,
    activeCell: reveal > 0 && active < 16 ? active : null,
    completedSamples: 4, scaleProgress, diagonalProgress: 0,
  }
}

export function gradientStageStill(stage: GradientStage) {
  return gradientFrameAt(GRADIENT_STAGE_ENDS[stage] - 0.01)
}
