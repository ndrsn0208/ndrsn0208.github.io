// Reported accuracy percentages, with standard errors in percentage points.
// Every ± is one standard error over 3 seed runs.
// Values come from the November 2026 preprint (public/papers/self-consolidating-language-models.pdf).
// Source: the paper's LaTeX.
// SQuAD: inputs/tables/itc-performance.tex
// LongBench v2: inputs/tables/lcs-performance.tex
// Other models, update budget, out-of-distribution stream, general ability: inputs/appendix/app-cki-exp.tex

export type StreamResult = {
  id: string
  method: string
  immediate: number
  immediateError?: number
  /** null when the method makes no sequential updates. */
  retention: number | null
  retentionError?: number
  ours?: boolean
}

/** A stream of 100 SQuAD passages, Qwen2.5-7B-Instruct. SCoL uses λ = 2. */
export const squadResults: readonly StreamResult[] = [
  { id: 'prompting', method: 'Prompting-only', immediate: 28.17, retention: null },
  { id: 'batch-ttt', method: 'Batch TTT', immediate: 26.76, immediateError: 0.58, retention: null },
  { id: 'seal-continual', method: 'SEAL (continual)', immediate: 28.41, immediateError: 1.64, retention: 21.36, retentionError: 1.66 },
  { id: 'last-10', method: 'Last-10', immediate: 35.07, immediateError: 1.01, retention: 26.98, retentionError: 1.01 },
  { id: 'middle-10', method: 'Middle-10', immediate: 28.50, immediateError: 1.66, retention: 20.52, retentionError: 0.54 },
  { id: 'random-10', method: 'Random-10', immediate: 37.83, immediateError: 1.07, retention: 23.81, retentionError: 0.79 },
  { id: 'scol-lambda-zero', method: 'SCoL (λ = 0)', immediate: 39.53, immediateError: 1.39, retention: 25.14, retentionError: 1.46 },
  { id: 'scol', method: 'SCoL', immediate: 40.66, immediateError: 1.42, retention: 31.00, retentionError: 1.64, ours: true },
]

/** The same stream on Llama-3.1-8B-Instruct: 32 layers, 4 rounds of meta-training. */
export const llamaResults: readonly StreamResult[] = [
  { id: 'prompting', method: 'Prompting-only', immediate: 28.41, retention: null },
  { id: 'batch-ttt', method: 'Batch TTT', immediate: 37.23, immediateError: 0.46, retention: null },
  { id: 'seal-continual', method: 'SEAL (continual)', immediate: 41.43, immediateError: 0.31, retention: 22.07, retentionError: 1.71 },
  { id: 'last-10', method: 'Last-10', immediate: 45.35, immediateError: 0.51, retention: 29.41, retentionError: 0.36 },
  { id: 'middle-10', method: 'Middle-10', immediate: 47.90, immediateError: 1.10, retention: 26.30, retentionError: 0.40 },
  { id: 'random-10', method: 'Random-10', immediate: 51.31, immediateError: 1.99, retention: 23.65, retentionError: 5.08 },
  { id: 'scol-lambda-zero', method: 'SCoL (λ = 0)', immediate: 50.97, immediateError: 0.48, retention: 21.21, retentionError: 1.46 },
  { id: 'scol', method: 'SCoL', immediate: 54.47, immediateError: 0.78, retention: 34.57, retentionError: 0.85, ours: true },
]

/** The same stream on Qwen3.8-27B: 64 layers, 2 rounds of meta-training, 8 candidates per passage. */
export const qwen27Results: readonly StreamResult[] = [
  { id: 'seal-continual', method: 'SEAL (continual)', immediate: 46.08, immediateError: 0.53, retention: 38.93, retentionError: 1.13 },
  { id: 'last-10', method: 'Last-10', immediate: 48.51, immediateError: 0.87, retention: 40.35, retentionError: 0.75 },
  { id: 'middle-10', method: 'Middle-10', immediate: 44.36, immediateError: 0.38, retention: 33.66, retentionError: 0.73 },
  { id: 'random-10', method: 'Random-10', immediate: 47.38, immediateError: 1.66, retention: 40.28, retentionError: 1.03 },
  { id: 'scol', method: 'SCoL', immediate: 50.16, immediateError: 0.26, retention: 43.94, retentionError: 0.45, ours: true },
]

/** Qwen3.8-27B at update budgets of 5, 10, and 20 layers. The rows at 10 repeat qwen27Results. */
export const budgetResults: readonly StreamResult[] = [
  { id: 'random-5', method: 'Random-5', immediate: 43.64, immediateError: 0.86, retention: 37.75, retentionError: 1.10 },
  { id: 'last-5', method: 'Last-5', immediate: 45.49, immediateError: 0.80, retention: 40.55, retentionError: 0.12 },
  { id: 'scol-5', method: 'SCoL, 5 layers', immediate: 46.50, immediateError: 0.66, retention: 42.42, retentionError: 0.18, ours: true },
  { id: 'random-10', method: 'Random-10', immediate: 47.38, immediateError: 1.66, retention: 40.28, retentionError: 1.03 },
  { id: 'last-10', method: 'Last-10', immediate: 48.51, immediateError: 0.87, retention: 40.35, retentionError: 0.75 },
  { id: 'scol-10', method: 'SCoL, 10 layers', immediate: 50.16, immediateError: 0.26, retention: 43.94, retentionError: 0.45, ours: true },
  { id: 'random-20', method: 'Random-20', immediate: 50.65, immediateError: 0.93, retention: 40.73, retentionError: 0.47 },
  { id: 'last-20', method: 'Last-20', immediate: 50.83, immediateError: 0.51, retention: 42.67, retentionError: 0.53 },
  { id: 'scol-20', method: 'SCoL, 20 layers', immediate: 55.19, immediateError: 0.54, retention: 44.64, retentionError: 0.50, ours: true },
]

/** 100 New York Times paragraphs from SQuADShifts, consolidated by the Qwen2.5-7B-Instruct
    meta-trained on SQuAD, without retraining. */
export const shiftResults: readonly StreamResult[] = [
  { id: 'prompting', method: 'Prompting-only', immediate: 17.90, retention: null },
  { id: 'batch-ttt', method: 'Batch TTT', immediate: 18.77, immediateError: 0.41, retention: null },
  { id: 'seal-continual', method: 'SEAL (continual)', immediate: 19.48, immediateError: 0.37, retention: 17.68, retentionError: 1.62 },
  { id: 'last-10', method: 'Last-10', immediate: 22.25, immediateError: 0.55, retention: 12.95, retentionError: 0.25 },
  { id: 'middle-10', method: 'Middle-10', immediate: 18.88, immediateError: 0.59, retention: 12.48, retentionError: 0.64 },
  { id: 'random-10', method: 'Random-10', immediate: 25.75, immediateError: 1.59, retention: 17.35, retentionError: 1.16 },
  { id: 'scol-lambda-zero', method: 'SCoL (λ = 0)', immediate: 25.17, immediateError: 1.40, retention: 17.83, retentionError: 1.15 },
  { id: 'scol', method: 'SCoL', immediate: 29.65, immediateError: 0.45, retention: 20.47, retentionError: 0.50, ours: true },
]

export type AbilityResult = {
  id: string
  model: string
  accuracy: number
  error?: number
  ours?: boolean
}

/** 5-shot MMLU on all 14,042 questions, Qwen2.5-7B-Instruct, before any update and after the SQuAD stream. */
export const mmluResults: readonly AbilityResult[] = [
  { id: 'before', model: 'Before any update', accuracy: 74.19 },
  { id: 'seal-continual', model: 'SEAL (continual)', accuracy: 70.89, error: 0.15 },
  { id: 'last-10', model: 'Last-10', accuracy: 71.75, error: 0.08 },
  { id: 'middle-10', model: 'Middle-10', accuracy: 71.17, error: 0.40 },
  { id: 'random-10', model: 'Random-10', accuracy: 70.61, error: 0.31 },
  { id: 'scol-lambda-zero', model: 'SCoL (λ = 0)', accuracy: 70.67, error: 0.10 },
  { id: 'scol', model: 'SCoL', accuracy: 73.56, error: 0.11, ours: true },
]

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

/** LongBench v2: 40 short contexts (16k to 32k tokens) and 20 long contexts (32k to 64k tokens). */
export const lengthResults: readonly LengthResult[] = [
  { id: 'base', method: 'Base', short: { mean: 33.1, standardError: 0.7 }, long: { mean: 29.5, standardError: 1.5 } },
  { id: 'full-context', method: 'Full Context', short: { mean: 37.8, standardError: 0.8 }, long: { mean: 35.5, standardError: 0.5 } },
  { id: 'summarization', method: 'Summarization', short: { mean: 39.3, standardError: 0.1 }, long: { mean: 36.3, standardError: 0.4 } },
  { id: 'batch-ttt', method: 'Batch TTT', short: { mean: 37.7, standardError: 2.0 }, long: { mean: 39.5, standardError: 3.5 } },
  { id: 'sequential-ft', method: 'Sequential FT', short: { mean: 34.2, standardError: 2.8 }, long: { mean: 27.2, standardError: 5.7 } },
  { id: 'last-10', method: 'Last-10', short: { mean: 31.5, standardError: 1.3 }, long: { mean: 31.8, standardError: 3.6 } },
  { id: 'scol', method: 'SCoL', short: { mean: 41.9, standardError: 1.5 }, long: { mean: 38.0, standardError: 2.4 } },
]
