/* Fisher alignment, from the paper.

   Aggregate: inputs/figures/fisher.tex, recall@k over 100 SQuAD passages.
   Passages: inputs/figures/aligned_passages_forget_compact.pdf, the lower right
   panel of the paper's layer-selection figure. `selectedLayers` are its star
   markers. `fisher` is read from its heatmap colours, which run from 0 to 1. */

export const fisherLayerCount = 28
export const fisherPassageCount = 100

export type FisherResult = {
  id: string
  label: string
  recallPercent: number
  /** The ± the paper reports, in percentage points. */
  reportedUncertainty?: number
}

export const fisherResults: readonly FisherResult[] = [
  { id: 'scol', label: 'SCoL', recallPercent: 45.1, reportedUncertainty: 1.6 },
  { id: 'scol-lambda-zero', label: 'SCoL (λ = 0)', recallPercent: 41.0, reportedUncertainty: 1.3 },
  { id: 'random', label: 'Random selection', recallPercent: 35.7 },
]

export type FisherPassage = {
  id: string
  /** The SQuAD article the passage comes from. */
  title: string
  /** Layers are counted from 0, as in the paper's figure. */
  selectedLayers: readonly number[]
  fisher: readonly number[]
}

export const fisherPassages: readonly FisherPassage[] = [
  {
    id: 'american-broadcasting-company',
    title: 'American Broadcasting Company',
    selectedLayers: [0, 1, 2, 3, 27],
    fisher: [
      .89, .89, 1, .35, .35, .17, .32, .25, .14, .34, .27, .29, .26, .41,
      .42, .51, .56, .57, .76, .90, .65, .63, .58, .53, .55, .51, .54, .87,
    ],
  },
  {
    id: 'nikola-tesla',
    title: 'Nikola Tesla',
    selectedLayers: [7, 10, 18, 20, 22, 24, 26, 27],
    fisher: [
      .04, 0, 0, .04, 0, 0, .21, .22, .15, .28, .27, .29, .32, .47,
      .46, .57, .60, .62, .75, .83, .80, .82, .76, .70, .70, .69, .73, 1,
    ],
  },
  {
    id: 'normans',
    title: 'Normans',
    selectedLayers: [0, 2, 5, 11, 18, 21, 24, 25, 26, 27],
    fisher: [
      .69, .50, .39, .23, .12, .03, .25, .10, 0, .18, .10, .08, .06, .12,
      .13, .22, .18, .20, .34, .37, .32, .27, .32, .27, .43, .43, 1, .91,
    ],
  },
]
