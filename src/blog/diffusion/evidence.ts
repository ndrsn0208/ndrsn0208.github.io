// Transcribed from the cached arXiv versions below, not from plotted pixels.
// Keep this module free of imports and browser APIs for the static blog build.

export const diffusionPapers = {
  rankOne: {
    title: 'Avoid Catastrophic Forgetting with Rank-1 Fisher from Diffusion Models',
    venue: 'ICLR 2026',
    arxivId: '2509.23593',
    version: 2,
    htmlUrl: 'https://arxiv.org/html/2509.23593v2',
    cachePath: 'public/arxiv-cache/2509.23593.html',
  },
  trustRegion: {
    title: 'Trust Region Continual Learning as an Implicit Meta-Learner',
    venue: 'NeurIPS 2026',
    venueProvenance: 'User-confirmed venue, independent of the cached arXiv version',
    arxivId: '2602.02417',
    version: 1,
    htmlUrl: 'https://arxiv.org/html/2602.02417v1',
    cachePath: 'public/arxiv-cache/2602.02417.html',
  },
} as const

export type DiffusionPaperId = keyof typeof diffusionPapers
export type DiffusionBenchmarkId = 'iclr-imagenet1k' | 'trust-imagenet500' | 'trust-cw10'
export type DiffusionMetricId = 'performance' | 'forgetting'

export type DiffusionSource = {
  readonly paper: DiffusionPaperId
  readonly anchor: string
  readonly label: string
}

export type DiffusionCitedText = {
  readonly text: string
  readonly shortText?: string
  readonly sources: readonly DiffusionSource[]
}

export function diffusionSourceHref(source: DiffusionSource): string {
  return `${diffusionPapers[source.paper].htmlUrl}#${source.anchor}`
}

export const diffusionSources = {
  rankResults: { paper: 'rankOne', anchor: 'S5.T1', label: 'Rank-1 Fisher Table 1' },
  rankSetup: { paper: 'rankOne', anchor: 'S4.SS1', label: 'Rank-1 Fisher §4.1' },
  rankMetrics: { paper: 'rankOne', anchor: 'S4.SS2', label: 'Rank-1 Fisher §4.2' },
  rankTraining: { paper: 'rankOne', anchor: 'S4.SS3', label: 'Rank-1 Fisher §4.3' },
  rankTrainingTable: { paper: 'rankOne', anchor: 'A5.T2', label: 'Rank-1 Fisher Table 2' },
  rankCurves: { paper: 'rankOne', anchor: 'S5.F4', label: 'Rank-1 Fisher Figure 4' },
  rankQualitative: { paper: 'rankOne', anchor: 'S5.F5', label: 'Rank-1 Fisher Figure 5' },
  trustResults: { paper: 'trustRegion', anchor: 'S4.T1', label: 'Trust Region Table 1' },
  trustRecovery: { paper: 'trustRegion', anchor: 'S4.T2', label: 'Trust Region Table 2' },
  trustBaselines: {
    paper: 'trustRegion',
    anchor: 'S4.SS0.SSS0.Px1',
    label: 'Trust Region §4 baselines',
  },
  trustImageMetrics: { paper: 'trustRegion', anchor: 'S4.SS1', label: 'Trust Region §4.1' },
  trustImageSetup: {
    paper: 'trustRegion',
    anchor: 'A3.SS1.SSS2',
    label: 'Trust Region Appendix C.1.2',
  },
  trustImageTraining: { paper: 'trustRegion', anchor: 'A3.T3', label: 'Trust Region Table 3' },
  trustPolicySetup: { paper: 'trustRegion', anchor: 'S4.SS2', label: 'Trust Region §4.2' },
  trustPolicyTraining: { paper: 'trustRegion', anchor: 'A3.T4', label: 'Trust Region Table 4' },
  trustPolicyState: {
    paper: 'trustRegion',
    anchor: 'A3.SS2.SSS2',
    label: 'Trust Region Appendix C.2.2',
  },
  trustImageCurve: { paper: 'trustRegion', anchor: 'S4.F2.sf1', label: 'Trust Region Figure 2(a)' },
  trustPolicyCurve: { paper: 'trustRegion', anchor: 'S4.F2.sf2', label: 'Trust Region Figure 2(b)' },
  trustRecoveryDiscussion: {
    paper: 'trustRegion',
    anchor: 'S4.SS3.SSS0.Px2',
    label: 'Trust Region §4.3 recovery',
  },
} as const satisfies Record<string, DiffusionSource>

export type DiffusionEstimate = {
  readonly mean: number
  readonly standardError: number
}

export type DiffusionMetric = {
  readonly label: string
  readonly shortLabel: string
  readonly unit: 'FID' | 'FID points' | 'percent' | 'percentage points'
  readonly direction: 'lower' | 'higher'
  readonly definition: DiffusionCitedText
}

export type DiffusionResult = {
  readonly id: string
  readonly method: string
  readonly sourceLabel: string
  readonly detail: string
  readonly role: 'baseline' | 'reference' | 'proposed'
  readonly performance: DiffusionEstimate
  // A missing non-continual forgetting value is not zero.
  readonly forgetting: DiffusionEstimate | null
}

export type DiffusionBenchmark = {
  readonly id: DiffusionBenchmarkId
  readonly paper: DiffusionPaperId
  readonly label: string
  readonly tabContext: string
  readonly title: string
  readonly taskCount: number
  readonly classCount?: number
  readonly classesPerTask?: number
  readonly imageSize?: readonly [number, number]
  readonly setup: DiffusionCitedText
  readonly protocol: DiffusionCitedText
  readonly uncertainty: {
    readonly kind: 'standard error'
    readonly seeds: number | null
    readonly note: DiffusionCitedText
  }
  readonly source: DiffusionSource
  readonly metrics: Readonly<Record<DiffusionMetricId, DiffusionMetric>>
  readonly results: readonly DiffusionResult[]
  readonly interpretation: Readonly<Record<DiffusionMetricId, DiffusionCitedText>>
  readonly caveat: DiffusionCitedText
}

export const diffusionBenchmarks: readonly DiffusionBenchmark[] = [
  {
    id: 'iclr-imagenet1k',
    paper: 'rankOne',
    label: 'ImageNet-1k',
    tabContext: 'Rank-1 Fisher study · 20 tasks',
    title: 'Image generation over 20 tasks',
    taskCount: 20,
    classCount: 1000,
    classesPerTask: 50,
    imageSize: [32, 32],
    setup: {
      text: 'All 1,000 ImageNet classes at 32 × 32 pixels, partitioned into 20 tasks of 50 classes in the original label order.',
      sources: [diffusionSources.rankSetup],
    },
    protocol: {
      text: 'Class-conditioned diffusion image generation. GD means generative distillation. The Diag and Rank-1 rows in the paper include GD unless explicitly marked without it. The non-continual row is a separate reference setting.',
      sources: [diffusionSources.rankMetrics],
    },
    uncertainty: {
      kind: 'standard error',
      seeds: 3,
      note: {
        text: 'Means and standard errors over 3 random seeds. Whiskers show the reported mean ± one standard error.',
        sources: [diffusionSources.rankResults],
      },
    },
    source: diffusionSources.rankResults,
    metrics: {
      performance: {
        label: 'Final average FID',
        shortLabel: 'Final FID',
        unit: 'FID',
        direction: 'lower',
        definition: {
          text: 'Fréchet Inception Distance on each task’s held-out test set, averaged across all 20 tasks after the final task. Lower is better.',
          sources: [diffusionSources.rankMetrics],
        },
      },
      forgetting: {
        label: 'Average forgetting',
        shortLabel: 'Forgetting',
        unit: 'FID points',
        direction: 'lower',
        definition: {
          text: 'Final FID minus FID just after a task was learned, averaged across all 20 tasks. Lower is better. The non-continual reference has no reported forgetting value.',
          sources: [diffusionSources.rankMetrics, diffusionSources.rankResults],
        },
      },
    },
    results: [
      {
        id: 'non-continual',
        method: 'Non-continual',
        sourceLabel: 'Non-continual',
        detail: 'Reference setting',
        role: 'reference',
        performance: { mean: 11.7, standardError: 0.1 },
        forgetting: null,
      },
      {
        id: 'diagonal-only',
        method: 'Diagonal EWC only',
        sourceLabel: 'Diag w/o GD',
        detail: 'Without generative distillation',
        role: 'baseline',
        performance: { mean: 86.1, standardError: 4.2 },
        forgetting: { mean: 34.2, standardError: 3.6 },
      },
      {
        id: 'rank-one-only',
        method: 'Rank-1 EWC only',
        sourceLabel: 'Rank-1 w/o GD',
        detail: 'Without generative distillation',
        role: 'baseline',
        performance: { mean: 74.3, standardError: 1.9 },
        forgetting: { mean: 41.3, standardError: 1.8 },
      },
      {
        id: 'gd',
        method: 'Replay (GD)',
        sourceLabel: 'GD',
        detail: 'GD alone',
        role: 'baseline',
        performance: { mean: 69.0, standardError: 2.2 },
        forgetting: { mean: 46.2, standardError: 12.9 },
      },
      {
        id: 'diagonal-gd',
        method: 'Diagonal EWC + replay',
        sourceLabel: 'Diag',
        detail: 'Diagonal Fisher with distillation',
        role: 'baseline',
        performance: { mean: 73.8, standardError: 2.8 },
        forgetting: { mean: 25.8, standardError: 9.4 },
      },
      {
        id: 'rank-one-gd',
        method: 'Trust Region',
        sourceLabel: 'Rank-1 (ours)',
        detail: 'Rank-1 Fisher + replay',
        role: 'proposed',
        performance: { mean: 48.5, standardError: 1.9 },
        forgetting: { mean: 15.2, standardError: 4.8 },
      },
    ],
    interpretation: {
      performance: {
        text: 'Trust Region reports a final average FID of 48.5, compared with 69.0 for GD alone. The non-continual reference remains lower at 11.7.',
        sources: [diffusionSources.rankResults],
      },
      forgetting: {
        text: 'Trust Region reports 15.2 FID points of forgetting, compared with 46.2 for GD alone. Without GD, rank-1 EWC still forgets 41.3 points.',
        sources: [diffusionSources.rankResults],
      },
    },
    caveat: {
      text: 'The combination with distillation matters. Without it, rank-1 EWC has more forgetting than diagonal EWC, 41.3 versus 34.2 FID points.',
      sources: [diffusionSources.rankResults],
    },
  },
  {
    id: 'trust-imagenet500',
    paper: 'trustRegion',
    label: 'ImageNet-500',
    tabContext: 'Trust Region study · 10 tasks',
    title: 'Image generation over 10 tasks',
    taskCount: 10,
    classCount: 500,
    classesPerTask: 50,
    imageSize: [32, 32],
    setup: {
      text: 'The first 500 ImageNet classes at 32 × 32 pixels, partitioned into 10 tasks of 50 classes. This is a different task sequence from the Rank-1 Fisher ImageNet-1k experiment.',
      sources: [diffusionSources.trustImageSetup],
    },
    protocol: {
      text: 'Class-conditioned diffusion image generation. EWC uses a rank-1 Fisher. Replay uses generative distillation. FTML and VR-MCL use first-order approximations, generative replay, and one inner adaptation step with an equal support/query split.',
      sources: [diffusionSources.trustBaselines, diffusionSources.trustImageMetrics],
    },
    uncertainty: {
      kind: 'standard error',
      seeds: 3,
      note: {
        text: 'Table 1 reports standard errors. Table 3 specifies 3 seeds. Whiskers show the reported mean ± one standard error.',
        sources: [diffusionSources.trustResults, diffusionSources.trustImageTraining],
      },
    },
    source: diffusionSources.trustResults,
    metrics: {
      performance: {
        label: 'Final average FID',
        shortLabel: 'Final FID',
        unit: 'FID',
        direction: 'lower',
        definition: {
          text: 'Fréchet Inception Distance on held-out data, averaged across the 10 tasks at the end of continual training. Lower is better.',
          sources: [diffusionSources.trustImageMetrics, diffusionSources.trustResults],
        },
      },
      forgetting: {
        label: 'Average forgetting',
        shortLabel: 'Forgetting',
        unit: 'FID points',
        direction: 'lower',
        definition: {
          text: 'The increase in each task’s FID from when it was first learned to the end of training, averaged across tasks. Lower is better.',
          sources: [diffusionSources.trustImageMetrics],
        },
      },
    },
    results: [
      {
        id: 'finetuning',
        method: 'Fine-tuning',
        sourceLabel: 'Finetuning',
        detail: 'Sequential updates',
        role: 'baseline',
        performance: { mean: 86.2, standardError: 7.3 },
        forgetting: { mean: 50.4, standardError: 7.2 },
      },
      {
        id: 'ewc',
        method: 'Rank-1 EWC only',
        sourceLabel: 'EWC',
        detail: 'Rank-1 Fisher, without replay',
        role: 'baseline',
        performance: { mean: 77.2, standardError: 1.2 },
        forgetting: { mean: 41.2, standardError: 2.3 },
      },
      {
        id: 'replay',
        method: 'Replay',
        sourceLabel: 'Replay',
        detail: 'Generative distillation',
        role: 'baseline',
        performance: { mean: 53.4, standardError: 6.0 },
        forgetting: { mean: 18.2, standardError: 4.6 },
      },
      {
        id: 'ftml',
        method: 'FTML',
        sourceLabel: 'FTML',
        detail: 'First-order implementation',
        role: 'baseline',
        performance: { mean: 172.5, standardError: 9.1 },
        forgetting: { mean: 128.5, standardError: 9.0 },
      },
      {
        id: 'vrmcl',
        method: 'VR-MCL',
        sourceLabel: 'VRMCL',
        detail: 'First-order implementation',
        role: 'baseline',
        performance: { mean: 142.2, standardError: 8.5 },
        forgetting: { mean: 96.6, standardError: 8.4 },
      },
      {
        id: 'trust-region',
        method: 'Trust Region',
        sourceLabel: 'Trust Region',
        detail: 'Rank-1 Fisher + replay',
        role: 'proposed',
        performance: { mean: 44.5, standardError: 2.3 },
        forgetting: { mean: 10.6, standardError: 3.0 },
      },
    ],
    interpretation: {
      performance: {
        text: 'Trust Region reports 44.5 final average FID, compared with 53.4 for Replay. FTML and VR-MCL report 172.5 and 142.2 under this paper’s first-order implementations.',
        shortText: 'Trust Region reports 44.5 final average FID, compared with 53.4 for Replay.',
        sources: [diffusionSources.trustResults, diffusionSources.trustBaselines],
      },
      forgetting: {
        text: 'Trust Region reports 10.6 FID points of forgetting, compared with 18.2 for Replay and 41.2 for EWC alone.',
        sources: [diffusionSources.trustResults],
      },
    },
    caveat: {
      text: 'Final performance and recovery speed are different measurements. The recovery table below includes targets that neither Replay nor Trust Region reaches at later transitions.',
      sources: [diffusionSources.trustRecovery, diffusionSources.trustRecoveryDiscussion],
    },
  },
  {
    id: 'trust-cw10',
    paper: 'trustRegion',
    label: 'CW10',
    tabContext: 'Trust Region study · diffusion policy',
    title: 'A diffusion policy over 10 skills',
    taskCount: 10,
    setup: {
      text: 'CW10 is a sequence of 10 Meta-World manipulation tasks. The diffusion policy learns from 2,500 scripted expert trajectories per task and is evaluated with 100 rollouts per task after each task.',
      sources: [diffusionSources.trustPolicySetup],
    },
    protocol: {
      text: 'The policy uses 39-dimensional state observations and 4-dimensional actions, with 6 observation steps and a 2-step action chunk. Episodes have a maximum of 200 environment steps. FTML and VR-MCL use first-order approximations with generative replay.',
      sources: [
        diffusionSources.trustPolicySetup,
        diffusionSources.trustPolicyState,
        diffusionSources.trustBaselines,
      ],
    },
    uncertainty: {
      kind: 'standard error',
      // Do not resolve the source's seed reporting by guessing.
      seeds: null,
      note: {
        text: 'Table 1 reports standard errors, shown by the whiskers. The CW10 configuration table lists 4 seeds, while Figure 2(b) lists 3. The seed count for these tabulated results is left unresolved here.',
        sources: [
          diffusionSources.trustResults,
          diffusionSources.trustPolicyTraining,
          diffusionSources.trustPolicyCurve,
        ],
      },
    },
    source: diffusionSources.trustResults,
    metrics: {
      performance: {
        label: 'Final average success rate',
        shortLabel: 'Success rate',
        unit: 'percent',
        direction: 'higher',
        definition: {
          text: 'The fraction of evaluation rollouts satisfying the environment’s success condition, averaged across the 10 tasks after continual training. Higher is better. Success is shown in percent and its standard error in percentage points.',
          sources: [diffusionSources.trustPolicySetup, diffusionSources.trustResults],
        },
      },
      forgetting: {
        label: 'Average forgetting',
        shortLabel: 'Forgetting',
        unit: 'percentage points',
        direction: 'lower',
        definition: {
          text: 'The drop in each task’s success rate from when it was first learned to the end of training, averaged across tasks. Values and standard errors are in percentage points. Lower is better.',
          sources: [diffusionSources.trustPolicySetup, diffusionSources.trustResults],
        },
      },
    },
    results: [
      {
        id: 'finetuning',
        method: 'Fine-tuning',
        sourceLabel: 'Finetuning',
        detail: 'Sequential updates',
        role: 'baseline',
        performance: { mean: 17.9, standardError: 2.4 },
        forgetting: { mean: 73.0, standardError: 2.0 },
      },
      {
        id: 'ewc',
        method: 'Rank-1 EWC only',
        sourceLabel: 'EWC',
        detail: 'Rank-1 Fisher, without replay',
        role: 'baseline',
        performance: { mean: 17.6, standardError: 1.8 },
        forgetting: { mean: 73.7, standardError: 1.3 },
      },
      {
        id: 'replay',
        method: 'Replay',
        sourceLabel: 'Replay',
        detail: 'Generative distillation',
        role: 'baseline',
        performance: { mean: 85.3, standardError: 2.0 },
        forgetting: { mean: 8.2, standardError: 2.0 },
      },
      {
        id: 'ftml',
        method: 'FTML',
        sourceLabel: 'FTML',
        detail: 'First-order implementation',
        role: 'baseline',
        performance: { mean: 78.5, standardError: 3.8 },
        forgetting: { mean: 13.3, standardError: 3.3 },
      },
      {
        id: 'vrmcl',
        method: 'VR-MCL',
        sourceLabel: 'VRMCL',
        detail: 'First-order implementation',
        role: 'baseline',
        performance: { mean: 77.9, standardError: 1.5 },
        forgetting: { mean: 11.7, standardError: 2.0 },
      },
      {
        id: 'trust-region',
        method: 'Trust Region',
        sourceLabel: 'Trust Region',
        detail: 'Rank-1 Fisher + replay',
        role: 'proposed',
        performance: { mean: 88.3, standardError: 0.4 },
        forgetting: { mean: 4.4, standardError: 0.9 },
      },
    ],
    interpretation: {
      performance: {
        text: 'Trust Region reports 88.3% average success, compared with 85.3% for Replay. EWC alone reports 17.6%, close to fine-tuning at 17.9%.',
        sources: [diffusionSources.trustResults],
      },
      forgetting: {
        text: 'Trust Region reports 4.4 percentage points of forgetting, compared with 8.2 for Replay. Its forgetting remains above zero.',
        sources: [diffusionSources.trustResults],
      },
    },
    caveat: {
      text: 'Replay is a strong baseline here, and Trust Region is not faster at every recovery transition. These experiments evaluate a diffusion policy trained on offline demonstrations in simulated manipulation tasks.',
      sources: [diffusionSources.trustResults, diffusionSources.trustRecovery, diffusionSources.trustPolicySetup],
    },
  },
]

export type DiffusionRecoveryTarget = {
  readonly id: string
  readonly label: string
  readonly definition: string
  // Entries are in learningTasks order. Null preserves a source dash.
  readonly replay: readonly (number | null)[]
  readonly trustRegion: readonly (number | null)[]
}

export type DiffusionRecovery = {
  readonly benchmark: 'trust-imagenet500' | 'trust-cw10'
  readonly source: DiffusionSource
  readonly learningTasks: readonly number[]
  readonly targets: readonly DiffusionRecoveryTarget[]
  readonly qualification: DiffusionCitedText
}

// Table 2 reports counts, not uncertainty estimates or a sampled learning curve.
// All nine transitions and all three targets are retained for these two methods.
export const diffusionRecovery: readonly DiffusionRecovery[] = [
  {
    benchmark: 'trust-imagenet500',
    source: diffusionSources.trustRecovery,
    learningTasks: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    targets: [
      {
        id: 'fid-10',
        label: 'Within 10% of initial FID',
        definition: 'Task 1 FID ≤ 1.10 × its initial optimal FID. Lower FID is better.',
        replay: [30, 90, null, null, null, null, null, null, null],
        trustRegion: [35, 15, null, null, null, null, null, null, null],
      },
      {
        id: 'fid-20',
        label: 'Within 20% of initial FID',
        definition: 'Task 1 FID ≤ 1.20 × its initial optimal FID. Lower FID is better.',
        replay: [30, 75, null, null, null, null, null, null, null],
        trustRegion: [20, 15, null, null, null, 50, null, 350, 2],
      },
      {
        id: 'fid-30',
        label: 'Within 30% of initial FID',
        definition: 'Task 1 FID ≤ 1.30 × its initial optimal FID. Lower FID is better.',
        replay: [2, 2, 5, null, null, null, null, null, null],
        trustRegion: [20, 15, 2, 35, 35, 25, 55, 40, 2],
      },
    ],
    qualification: {
      text: 'The target changes the result. At +10%, neither method has a reported recovery count after Task 3. At +30%, Replay is faster while learning Task 2, with 2 updates versus 20 for Trust Region.',
      sources: [diffusionSources.trustRecovery],
    },
  },
  {
    benchmark: 'trust-cw10',
    source: diffusionSources.trustRecovery,
    learningTasks: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    targets: [
      {
        id: 'sr-99',
        label: '99% of initial success',
        definition: 'Task 1 success rate ≥ 0.99 × its initial optimal success rate. This is relative to its initial success, not an absolute 99% success rate.',
        replay: [60, 95, 30, 80, 60, 30, 10000, null, null],
        trustRegion: [60, 80, 45, 70, 55, 50, 2000, null, 100],
      },
      {
        id: 'sr-90',
        label: '90% of initial success',
        definition: 'Task 1 success rate ≥ 0.90 × its initial optimal success rate. This is relative to its initial success, not an absolute 90% success rate.',
        replay: [10, 50, 2, 20, 30, 2, 35, 2, 8000],
        trustRegion: [10, 45, 2, 30, 30, 2, 25, 2, 2],
      },
      {
        id: 'sr-80',
        label: '80% of initial success',
        definition: 'Task 1 success rate ≥ 0.80 × its initial optimal success rate. This is relative to its initial success, not an absolute 80% success rate.',
        replay: [10, 35, 2, 20, 15, 2, 4, 2, 45],
        trustRegion: [10, 35, 2, 15, 4, 2, 4, 2, 2],
      },
    ],
    qualification: {
      text: 'At the 90% target while learning Task 10, Trust Region reports 2 updates and Replay 8,000. At Task 5, Replay is faster, with 20 versus 30. At the stricter 99% target, neither method has a reported count for Task 9.',
      sources: [diffusionSources.trustRecovery],
    },
  },
]

export const diffusionRecoveryNotes: readonly DiffusionCitedText[] = [
  {
    text: 'These are reported gradient update counts to recover Task 1 after each task transition. Lower is better. The comparison shows Replay and Trust Region at every reported target. Table 2 also includes four other baselines.',
    sources: [diffusionSources.trustRecovery],
  },
  {
    text: 'Not reported preserves a dash in the source table. The discussion describes these cases as failure to re-converge. No numerical count or uncertainty is supplied, so a missing entry is never plotted as zero.',
    sources: [diffusionSources.trustRecovery, diffusionSources.trustRecoveryDiscussion],
  },
]

export function formatDiffusionEstimate(
  estimate: DiffusionEstimate | null,
  metric: DiffusionMetric,
): string {
  if (estimate === null) return 'Not reported'
  const suffix = metric.unit === 'percent' ? '%' : ''
  return `${estimate.mean.toFixed(1)}${suffix} ± ${estimate.standardError.toFixed(1)}`
}

// Concise text for the no-JavaScript reading fallback. Venue metadata and
// publication dates remain the article's responsibility.
export const evidenceSummaries: string[] = [
  'Measured ImageNet-1k results, Rank-1 Fisher Table 1: 1,000 classes at 32 × 32 pixels over 20 tasks. Trust Region reports final average FID 48.5 ± 1.9 and forgetting 15.2 ± 4.8 FID points, compared with 69.0 ± 2.2 and 46.2 ± 12.9 for distillation alone. Lower is better. Errors are standard errors over 3 seeds. Source: https://arxiv.org/html/2509.23593v2#S5.T1',
  'Measured ImageNet-500 results, Trust Region Table 1: the first 500 ImageNet classes at 32 × 32 pixels over 10 tasks. Trust Region reports final average FID 44.5 ± 2.3 and forgetting 10.6 ± 3.0 FID points, compared with Replay at 53.4 ± 6.0 and 18.2 ± 4.6. Lower is better. Errors are standard errors. This task sequence is separate from the Rank-1 Fisher experiment. Source: https://arxiv.org/html/2602.02417v1#S4.T1',
  'Measured diffusion-policy results on Continual World 10, Trust Region Table 1: Trust Region reports average success 88.3% ± 0.4 and forgetting 4.4 ± 0.9 percentage points. Replay reports 85.3% ± 2.0 and 8.2 ± 2.0. Higher success and lower forgetting are better. Errors are standard errors in percentage points. The policy trains on offline demonstrations and is evaluated in simulation. Source: https://arxiv.org/html/2602.02417v1#S4.T1',
  'Reported Task 1 recovery on CW10, Trust Region Table 2: at 90% of initial success while learning Task 10, Trust Region takes 2 gradient updates and Replay 8,000. While learning Task 5, Replay is faster at 20 versus 30 updates. Lower is better. These are particular transitions at a relative target, with no reported errors. Source: https://arxiv.org/html/2602.02417v1#S4.T2',
  'Important limits: Rank-1 Fisher Table 1 keeps a stronger non-continual reference visible at 11.7 ± 0.1 FID. Rank-1 EWC without distillation forgets more than diagonal EWC, 41.3 ± 1.8 versus 34.2 ± 3.6 FID points. In the trust-region paper, the CW10 configuration table lists 4 seeds while Figure 2(b) lists 3, so the seed count is unresolved here. Missing values stay unreported. Sources: https://arxiv.org/html/2509.23593v2#S5.T1 and https://arxiv.org/html/2602.02417v1#A3.T4 and https://arxiv.org/html/2602.02417v1#S4.F2.sf2',
]

export const diffusionEvidence = {
  title: 'Measured results',
  introduction: 'Compare final performance and forgetting within each benchmark.',
  scope: 'These are separate experiments. The ImageNet-1k and ImageNet-500 scores are not a comparison between papers, and CW10 measures control success rather than image quality. Chart scales change with the selected benchmark and metric.',
  papers: diffusionPapers,
  benchmarks: diffusionBenchmarks,
  recovery: diffusionRecovery,
  recoveryNotes: diffusionRecoveryNotes,
  summaries: evidenceSummaries,
} as const
