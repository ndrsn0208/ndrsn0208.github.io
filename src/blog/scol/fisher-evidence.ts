/* Fisher alignment, from the paper (November 2026 preprint).

   Aggregate: inputs/figures/fisher.tex, recall@k over 100 SQuAD passages.
   Passages: inputs/figures/figure3_pareto_selection_fisher.pdf, the lower right
   panel of the paper's Figure 3. `selectedLayers` are its star markers.
   `fisher` is read from its heatmap colours: every cell matches one entry of
   the 256-step magma colour map, and the value is that entry's index over 255. */

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
  { id: 'scol', label: 'SCoL', recallPercent: 42.9, reportedUncertainty: 1.5 },
  { id: 'scol-lambda-zero', label: 'SCoL (λ = 0)', recallPercent: 37.6, reportedUncertainty: 1.1 },
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
    selectedLayers: [0, 27],
    fisher: [
      .65, .59, .55, .11, .08, .11, .35, .28, .21, .38, .33, .34, .36, .47,
      .45, .54, .53, .54, .67, .76, .61, .55, .49, .47, .51, .42, .69, 1,
    ],
  },
  {
    id: 'harvard-university',
    title: 'Harvard University',
    selectedLayers: [1, 6, 13, 21, 22, 25, 26, 27],
    fisher: [
      .56, 0, .12, .05, 0, 0, .21, .17, .03, .25, .20, .16, .18, .33,
      .30, .35, .34, .38, .53, .62, .60, .61, .57, .51, .51, .54, .90, 1,
    ],
  },
  {
    id: 'computational-complexity-theory',
    title: 'Computational complexity theory',
    selectedLayers: [1, 6, 7, 15, 20, 21, 22, 25, 26, 27],
    fisher: [
      0, 0, 0, .03, 0, 0, .17, .14, .02, .29, .24, .23, .20, .28,
      .29, .36, .35, .36, .51, .53, .45, .42, .40, .32, .32, .41, .61, 1,
    ],
  },
]
