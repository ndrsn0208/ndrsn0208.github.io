// Reported accuracy percentages and standard errors in percentage points.
// Values come from the current Folio paper.
// Source root: writing/self-consolidating-language-models/frontier-studies/folio/
// Retention: inputs/tables/itc-performance.tex
// Length means: inputs/tables/lcs-performance.tex
// Length SEs: inputs/appendix/plots_tables/tab_accuracy_variance_lcs.tex
// SE definition and sample counts: inputs/appendix/app-lcs-exp.tex

export const resultsModel = 'Qwen2.5-7B-Instruct'
export const retentionPassages = 100
export const sampledAnswersPerExample = 10

export type RetentionResult = {
  id: string
  method: string
  acquisition: number
  retention: number | null
  note: string
}

export const retentionResults: readonly RetentionResult[] = [
  {
    id: 'prompting',
    method: 'Prompting only',
    acquisition: 28.17,
    retention: null,
    note: 'Question only',
  },
  {
    id: 'batch-ttt',
    method: 'Batch TTT',
    acquisition: 26.52,
    retention: null,
    note: 'Joint access to all evaluation passages',
  },
  {
    id: 'seal-continual',
    method: 'SEAL continual',
    acquisition: 13.70,
    retention: 1.30,
    note: 'Continual updates',
  },
  {
    id: 'scol-no-forgetting',
    method: 'SCoL λ = 0',
    acquisition: 34.30,
    retention: 14.64,
    note: 'Forgetting term off',
  },
  {
    id: 'scol',
    method: 'SCoL',
    acquisition: 35.40,
    retention: 20.46,
    note: 'Forgetting term on, λ = 1',
  },
]

export type LengthRegime = 'short' | 'long'

export const lengthRegimes = {
  short: { label: 'Short', tokens: '16k to 32k', passages: 40 },
  long: { label: 'Long', tokens: '32k to 64k', passages: 20 },
} as const

export type AccuracyEstimate = {
  mean: number
  standardError: number
}

export type LengthResult = {
  id: string
  method: string
  short: AccuracyEstimate
  long: AccuracyEstimate
}

export const lengthResults: readonly LengthResult[] = [
  {
    id: 'base',
    method: 'Base',
    short: { mean: 32.5, standardError: 0.4 },
    long: { mean: 29.5, standardError: 0.5 },
  },
  {
    id: 'full-context',
    method: 'Full Context',
    short: { mean: 38.0, standardError: 0.5 },
    long: { mean: 35.5, standardError: 0.8 },
  },
  {
    id: 'summarization',
    method: 'Summarization',
    short: { mean: 39.3, standardError: 0.5 },
    long: { mean: 36.0, standardError: 0.7 },
  },
  {
    id: 'batch-ttt',
    method: 'Batch TTT',
    short: { mean: 39.5, standardError: 0.5 },
    long: { mean: 41.5, standardError: 0.5 },
  },
  {
    id: 'sequential-ft',
    method: 'Sequential FT',
    short: { mean: 36.5, standardError: 0.8 },
    long: { mean: 23.0, standardError: 1.0 },
  },
  {
    id: 'scol',
    method: 'SCoL',
    short: { mean: 42.3, standardError: 0.8 },
    long: { mean: 37.0, standardError: 1.0 },
  },
]
