/**
 * Scientific evidence: active, uncommented text in the copied Folio paper.
 * No source from the original manuscript is edited or imported at runtime.
 *
 * The three animated examples below are deliberately SCHEMATIC. Neither their
 * values nor their selections are experimental observations. They illustrate
 * the overlap calculation and do not contribute to the reported aggregate.
 *
 * The local aligned_passages_forget_compact.pdf contains three indexed-color
 * image strips and selection-marker paths, but no numeric Fisher vectors.
 * We do not infer experimental scores from its colors.
 */
export const fisherProvenance = {
  sourceRoot: 'writing/self-consolidating-language-models/frontier-studies/folio/',
  sources: [
    {
      path: 'inputs/04-exp-itc.tex',
      lines: '104–118',
      supports: 'Recall definition, random expectation, reported alignment, and interpretation.',
    },
    {
      path: 'inputs/appendix/app-cki-exp.tex',
      lines: '561–578',
      supports: 'Squared-gradient diagnostic on base projections before a new adapter; never a selector input.',
    },
    {
      path: 'inputs/figures/fisher.tex',
      lines: '20–42',
      supports: 'Alignment results over 100 SQuAD passages.',
    },
  ],
  inspectedPlot: 'inputs/figures/aligned_passages_forget_compact.pdf',
  exampleKind: 'schematic',
  uncertaintyDefinition: 'Reported uncertainty; its type is not defined in the cited active source.',
} as const

export const fisherLayerCount = 28
export const fisherPassageCount = 100

export type FisherResult = {
  id: string
  label: string
  note: string
  recallPercent: number
  reportedUncertainty?: number
}

// Recall is a percentage; ± quantities are in percentage points. Do not call
// these SEs, SDs, confidence intervals, or significance tests without a source.
export const fisherResults: readonly FisherResult[] = [
  {
    id: 'scol',
    label: 'SCoL',
    note: 'Forgetting term on',
    recallPercent: 45.1,
    reportedUncertainty: 1.6,
  },
  {
    id: 'scol-lambda-zero',
    label: 'SCoL, λ = 0',
    note: 'Forgetting term off',
    recallPercent: 41.0,
    reportedUncertainty: 1.3,
  },
  {
    id: 'random',
    label: 'Random',
    note: '10 of 28 layers',
    recallPercent: 35.7,
  },
]

export type FisherExample = {
  id: string
  label: string
  selectedLayers: readonly number[]
  // Arbitrary illustration units on a 0–100 scale, NOT measured Fisher scores.
  sensitivity: readonly number[]
}

export const fisherExamples: readonly FisherExample[] = [
  {
    id: 'passage-a',
    label: 'Passage A',
    selectedLayers: [0, 1, 3, 6, 9, 13, 17, 22, 24, 27],
    sensitivity: [
      82, 67, 22, 48, 18, 14, 8, 20, 33, 28, 10, 23, 19, 27,
      37, 52, 44, 61, 73, 88, 95, 70, 55, 42, 31, 38, 58, 79,
    ],
  },
  {
    id: 'passage-b',
    label: 'Passage B',
    selectedLayers: [2, 4, 6, 8, 11, 14, 18, 19, 23, 27],
    sensitivity: [
      13, 18, 24, 33, 46, 63, 76, 88, 92, 80, 68, 57, 42, 26,
      21, 29, 38, 48, 60, 72, 85, 65, 50, 40, 32, 54, 70, 95,
    ],
  },
  {
    id: 'passage-c',
    label: 'Passage C',
    selectedLayers: [0, 2, 5, 9, 10, 14, 19, 22, 26, 27],
    sensitivity: [
      29, 42, 75, 56, 31, 18, 24, 36, 48, 82, 90, 67, 53, 40,
      23, 16, 12, 34, 61, 78, 96, 71, 58, 44, 39, 64, 85, 93,
    ],
  },
]

export function compareFisherLayers(example: FisherExample) {
  const selected = new Set(example.selectedLayers)
  const highest = new Set(
    example.sensitivity
      .map((value, layer) => ({ value, layer }))
      .sort((a, b) => b.value - a.value || a.layer - b.layer)
      .slice(0, selected.size)
      .map(({ layer }) => layer),
  )
  const overlap = example.selectedLayers.filter(layer => highest.has(layer))
  return { selected, highest, overlap }
}
