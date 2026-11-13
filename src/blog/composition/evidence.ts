/* Measurements quoted in the essay. Every value is transcribed from the LaTeX of the
   November 2026 preprint (public/papers/test-time-compositional-generalization.pdf):

     mainResults            inputs/tables/main_composition.tex (Table 1)
     distinctPrototypes     sections/appi-ood-exp.tex, "Number of distinct prototypes that the images of each model reach"
     colorPairs             sections/appi-ood-exp.tex, "Share of ascents whose prototype keeps the color pair"
     prototypeCount         sections/appi-ood-exp.tex, "Attribute correctness against the number of selected prototypes K"

   `tradeoff` is the paper's figure of attribute correctness against KID (figs/frontier.pdf). The
   SDEdit points are the rows of its SDEdit table. The points of our method over the scale S are
   drawn in that figure and printed in no table: they are the means over the held-out classes of the
   result tables the figure was drawn from, as are the unrounded values that place every point. */

export type MethodResult = {
  id: string
  method: string
  /** Attribute correctness in percent, KID per query batch, and diversity, each with one standard error. */
  correctness: number
  correctnessError: number
  kid: number
  kidError: number
  diversity: number
  diversityError: number
  ours?: boolean
}

export const mainResults: Readonly<Record<'colormnist' | 'celeba', readonly MethodResult[]>> = {
  colormnist: [
    { id: 'comp-1', method: 'Comp. 1', correctness: 37.7, correctnessError: 1.2, kid: 0.166, kidError: 0.008, diversity: -26.1, diversityError: 4.6 },
    { id: 'comp-3', method: 'Comp. 3', correctness: 39.3, correctnessError: 1.1, kid: 0.130, kidError: 0.004, diversity: -25.2, diversityError: 4.3 },
    { id: 'sdedit-50', method: 'SDEdit (t0 = 50)', correctness: 92.9, correctnessError: 0.9, kid: 0.107, kidError: 0.005, diversity: -3.40, diversityError: 0.06 },
    { id: 'sdedit-200', method: 'SDEdit (t0 = 200)', correctness: 92.3, correctnessError: 0.9, kid: 0.082, kidError: 0.004, diversity: -2.17, diversityError: 0.05 },
    { id: 'ours', method: 'Ours', correctness: 92.5, correctnessError: 0.9, kid: 0.079, kidError: 0.004, diversity: -2.12, diversityError: 0.04, ours: true },
  ],
  celeba: [
    { id: 'comp-1', method: 'Comp. 1', correctness: 63.4, correctnessError: 1.2, kid: 0.082, kidError: 0.003, diversity: -5.24, diversityError: 0.10 },
    { id: 'comp-3', method: 'Comp. 3', correctness: 62.2, correctnessError: 1.0, kid: 0.092, kidError: 0.003, diversity: -5.05, diversityError: 0.09 },
    { id: 'sdedit-50', method: 'SDEdit (t0 = 50)', correctness: 78.3, correctnessError: 2.1, kid: 0.218, kidError: 0.006, diversity: -4.21, diversityError: 0.04 },
    { id: 'sdedit-200', method: 'SDEdit (t0 = 200)', correctness: 77.1, correctnessError: 2.1, kid: 0.179, kidError: 0.005, diversity: -3.21, diversityError: 0.03 },
    { id: 'ours', method: 'Ours', correctness: 77.0, correctnessError: 2.0, kid: 0.166, kidError: 0.004, diversity: -3.13, diversityError: 0.02, ours: true },
  ],
}

export type TradeoffPoint = {
  /** The noise level t0 of SDEdit, or the scale S of the variance of the product of experts. */
  setting: number
  correctness: number
  kid: number
}

export type Tradeoff = {
  sdedit: readonly TradeoffPoint[]
  /** Our method with K = 5 and τ = 0.2, over the scale S. */
  oursOverScale: readonly TradeoffPoint[]
  /** Our method as in Table 1: K = 8 and τ = 0.05. */
  ours: TradeoffPoint
}

export const tradeoff: Readonly<Record<'colormnist' | 'celeba', Tradeoff>> = {
  colormnist: {
    sdedit: [
      { setting: 50, correctness: 92.93, kid: 0.1072 },
      { setting: 100, correctness: 92.79, kid: 0.0944 },
      { setting: 150, correctness: 92.74, kid: 0.0889 },
      { setting: 200, correctness: 92.34, kid: 0.0823 },
      { setting: 250, correctness: 91.80, kid: 0.0782 },
      { setting: 300, correctness: 89.95, kid: 0.0704 },
    ],
    oursOverScale: [
      { setting: 1, correctness: 92.56, kid: 0.0833 },
      { setting: 2, correctness: 92.31, kid: 0.0786 },
      { setting: 3, correctness: 92.05, kid: 0.0756 },
      { setting: 4, correctness: 91.87, kid: 0.0734 },
      { setting: 6, correctness: 91.43, kid: 0.0703 },
    ],
    ours: { setting: 2, correctness: 92.48, kid: 0.0788 },
  },
  celeba: {
    sdedit: [
      { setting: 50, correctness: 78.26, kid: 0.2176 },
      { setting: 100, correctness: 78.13, kid: 0.1972 },
      { setting: 150, correctness: 77.73, kid: 0.1890 },
      { setting: 200, correctness: 77.10, kid: 0.1792 },
      { setting: 250, correctness: 76.67, kid: 0.1736 },
      { setting: 300, correctness: 75.97, kid: 0.1651 },
      { setting: 400, correctness: 74.82, kid: 0.1499 },
      { setting: 500, correctness: 73.68, kid: 0.1307 },
    ],
    oursOverScale: [
      { setting: 1, correctness: 76.42, kid: 0.1588 },
      { setting: 16, correctness: 75.63, kid: 0.1508 },
      { setting: 64, correctness: 74.67, kid: 0.1434 },
    ],
    ours: { setting: 1, correctness: 77.01, kid: 0.1659 },
  },
}

/** The numbers of selected prototypes K that the paper reports. */
export const prototypeCounts = [1, 2, 3, 5, 8, 12] as const

export type PrototypeCount = {
  /** Attribute correctness in percent with the pool of the main experiments, which holds ascents from the query. */
  withQuery: readonly number[]
  /** With every candidate reached from one of the model's own unconditional samples. */
  withoutQuery: readonly number[]
  /** Share of queries, in percent, whose K prototypes jointly carry every factor of the query's class, in the second pool. */
  carried: readonly number[]
}

export const prototypeCount: Readonly<Record<'colormnist' | 'celeba', PrototypeCount>> = {
  colormnist: {
    withQuery: [65.7, 90.2, 91.9, 92.4, 92.5, 92.5],
    withoutQuery: [51.2, 88.7, 91.4, 92.3, 92.5, 92.5],
    carried: [2.7, 48.2, 69.2, 84.2, 90.5, 95.0],
  },
  celeba: {
    withQuery: [72.8, 74.3, 75.5, 76.5, 77.0, 77.2],
    withoutQuery: [59.6, 69.5, 74.2, 76.3, 77.1, 77.3],
    carried: [2.5, 22.7, 45.0, 73.3, 91.7, 97.7],
  },
}

/** Noise levels of the table of distinct prototypes. */
export const distinctLevels = [100, 220, 300, 380, 460, 580, 660, 740, 860] as const

export type DistinctPrototypes = { id: string, model: string, images: number, counts: readonly number[] }

export const distinctPrototypes: readonly DistinctPrototypes[] = [
  { id: 'cifar10', model: 'CIFAR-10 DDPM', images: 512, counts: [508, 321, 139, 14, 1, 1, 1, 1, 1] },
  { id: 'celebahq', model: 'CelebA-HQ DDPM', images: 48, counts: [48, 47, 9, 4, 2, 2, 2, 2, 1] },
  { id: 'dit', model: 'DiT-XL/2', images: 256, counts: [255, 237, 222, 166, 37, 1, 1, 1, 1] },
  { id: 'ldm', model: 'Text-to-image LDM', images: 256, counts: [256, 256, 256, 248, 140, 112, 21, 6, 1] },
]

/** Noise levels of the table of color pairs. */
export const colorPairLevels = [100, 200, 300, 400] as const

export type ColorPairStart = { id: string, start: string, kept: readonly number[] }

/** Share of ascents, in percent, whose prototype keeps the color pair of the image they start from.
    ColorMNIST model, 40 queries, 32 ascents of 40 steps each. */
export const colorPairs: readonly ColorPairStart[] = [
  { id: 'held-out', start: 'Held-out color pair', kept: [60.0, 22.3, 9.7, 9.8] },
  { id: 'seen-background', start: 'Seen color pair, same background', kept: [100.0, 92.5, 89.8, 85.7] },
  { id: 'seen-digit', start: 'Seen color pair, same digit color', kept: [94.8, 90.0, 92.5, 96.8] },
]
