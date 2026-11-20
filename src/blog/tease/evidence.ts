/* The measurements of the TEASE page. Written by tools/tease_evidence.py (in the author's papers-2026-11 folder)
   from the paper's analysis files. Do not edit by hand: change the analysis and run the tool again.
   A count is [right, of]. Percentages are computed where they are shown. */

export type Count = readonly [right: number, of: number]
export const share = ([right, of]: Count) => 100 * right / of

/** The four models, in the paper's order. */
export const models = [
  { id: 'astra', name: 'GPT-6.2 Astra', setting: 'reasoning effort max' },
  { id: 'fable', name: 'Claude Fable 5.2', setting: 'reasoning effort xhigh' },
  { id: 'sol', name: 'GPT-6.2 Sol', setting: 'reasoning effort max' },
  { id: 'opus', name: 'Claude Opus 5.5', setting: 'reasoning effort xhigh' },
] as const
export type ModelId = typeof models[number]['id']

export const functions = ["cut", "hook", "poke", "heat", "pound", "contain", "tie", "pry"] as const
export type FunctionName = typeof functions[number]

/** The numbers of steps of the composite tables, and the stages of test-time continual learning that hold composite tables. */
export const stepCounts = [2, 3, 4, 5, 6, 7, 8] as const
export const budgets = ['k', 'ten', 'twiceK'] as const
export type BudgetId = typeof budgets[number]

/* Atom level. Positive tables whose first move reaches the goal, negative tables whose first move is none(),
   pairs with both tables right. `within` counts the negative tables answered with none() after at most 0, 1, 2
   and 3 moves. The negative tables of poke are not scored. */
export const atomLevel: Record<ModelId, {
  positive: Count, negative: Count, pairs: Count, within: readonly number[],
  byFunction: Record<FunctionName, { positive: Count, negative: Count | null }>,
}> = {
  astra: { positive: [175, 192], negative: [137, 182], pairs: [129, 182], within: [137, 146, 158, 172],
    byFunction: { cut: { positive: [30, 30], negative: [29, 30] }, hook: { positive: [16, 18], negative: [6, 18] }, poke: { positive: [10, 10], negative: null }, heat: { positive: [27, 30], negative: [28, 30] }, pound: { positive: [22, 30], negative: [8, 30] }, contain: { positive: [28, 28], negative: [27, 28] }, tie: { positive: [26, 28], negative: [27, 28] }, pry: { positive: [16, 18], negative: [12, 18] } } },
  fable: { positive: [185, 192], negative: [103, 182], pairs: [103, 182], within: [103, 122, 134, 152],
    byFunction: { cut: { positive: [30, 30], negative: [5, 30] }, hook: { positive: [15, 18], negative: [5, 18] }, poke: { positive: [10, 10], negative: null }, heat: { positive: [29, 30], negative: [25, 30] }, pound: { positive: [27, 30], negative: [15, 30] }, contain: { positive: [28, 28], negative: [28, 28] }, tie: { positive: [28, 28], negative: [18, 28] }, pry: { positive: [18, 18], negative: [7, 18] } } },
  sol: { positive: [168, 192], negative: [77, 182], pairs: [70, 182], within: [77, 89, 100, 114],
    byFunction: { cut: { positive: [30, 30], negative: [10, 30] }, hook: { positive: [16, 18], negative: [0, 18] }, poke: { positive: [10, 10], negative: null }, heat: { positive: [24, 30], negative: [16, 30] }, pound: { positive: [20, 30], negative: [2, 30] }, contain: { positive: [27, 28], negative: [26, 28] }, tie: { positive: [26, 28], negative: [18, 28] }, pry: { positive: [15, 18], negative: [5, 18] } } },
  opus: { positive: [170, 192], negative: [106, 182], pairs: [100, 182], within: [106, 134, 159, 166],
    byFunction: { cut: { positive: [26, 30], negative: [12, 30] }, hook: { positive: [14, 18], negative: [4, 18] }, poke: { positive: [10, 10], negative: null }, heat: { positive: [25, 30], negative: [20, 30] }, pound: { positive: [22, 30], negative: [11, 30] }, contain: { positive: [28, 28], negative: [25, 28] }, tie: { positive: [27, 28], negative: [25, 28] }, pry: { positive: [18, 18], negative: [9, 18] } } },
}

/* Composite level, every table played alone. `k` and `twiceK` count the tables solved within k and within
   twice k moves. `curve` is the share solved (%) within a budget of `budgetRatios` times k moves. */
export const budgetRatios = [1.0, 1.02, 1.04, 1.06, 1.08, 1.1, 1.12, 1.14, 1.16, 1.18, 1.2, 1.22, 1.24, 1.26, 1.28, 1.3, 1.32, 1.34, 1.36, 1.38, 1.4, 1.42, 1.44, 1.46, 1.48, 1.5, 1.52, 1.54, 1.56, 1.58, 1.6, 1.62, 1.64, 1.66, 1.68, 1.7, 1.72, 1.74, 1.76, 1.78, 1.8, 1.82, 1.84, 1.86, 1.88, 1.9, 1.92, 1.94, 1.96, 1.98, 2.0] as const
export const compositeLevel: Record<ModelId, {
  tables: number, k: number, twiceK: number, curve: readonly number[],
  byK: Record<typeof stepCounts[number], { tables: number, k: number, twiceK: number }>,
}> = {
  astra: { tables: 210, k: 72, twiceK: 158,
    curve: [34.29, 34.29, 34.29, 34.29, 34.29, 34.29, 34.29, 36.67, 39.05, 40.95, 44.29, 44.29, 44.29, 49.52, 49.52, 50.48, 50.48, 53.33, 53.33, 54.29, 54.76, 54.76, 55.24, 55.24, 55.24, 61.9, 61.9, 61.9, 61.9, 65.71, 66.67, 66.67, 67.14, 67.14, 68.57, 68.57, 68.57, 68.57, 69.52, 69.52, 70.0, 70.0, 70.0, 71.43, 71.9, 71.9, 71.9, 71.9, 71.9, 71.9, 75.24],
    byK: { 2: { tables: 30, k: 20, twiceK: 26 }, 3: { tables: 30, k: 19, twiceK: 24 }, 4: { tables: 30, k: 11, twiceK: 26 }, 5: { tables: 30, k: 12, twiceK: 24 }, 6: { tables: 30, k: 7, twiceK: 18 }, 7: { tables: 30, k: 2, twiceK: 21 }, 8: { tables: 30, k: 1, twiceK: 19 } } },
  fable: { tables: 210, k: 39, twiceK: 130,
    curve: [18.57, 18.57, 18.57, 18.57, 18.57, 18.57, 18.57, 19.52, 20.0, 22.38, 26.67, 26.67, 26.67, 28.57, 28.57, 29.05, 29.05, 33.33, 33.33, 33.81, 34.76, 34.76, 36.19, 36.19, 36.19, 42.86, 42.86, 42.86, 42.86, 43.81, 45.24, 45.24, 46.19, 46.19, 49.52, 49.52, 50.95, 50.95, 52.38, 52.38, 53.33, 53.33, 54.29, 54.29, 54.76, 54.76, 54.76, 54.76, 54.76, 54.76, 61.9],
    byK: { 2: { tables: 30, k: 17, twiceK: 24 }, 3: { tables: 30, k: 10, twiceK: 24 }, 4: { tables: 30, k: 7, twiceK: 21 }, 5: { tables: 30, k: 2, twiceK: 18 }, 6: { tables: 30, k: 2, twiceK: 17 }, 7: { tables: 30, k: 1, twiceK: 15 }, 8: { tables: 30, k: 0, twiceK: 11 } } },
  sol: { tables: 210, k: 50, twiceK: 129,
    curve: [23.81, 23.81, 23.81, 23.81, 23.81, 23.81, 23.81, 23.81, 24.76, 25.71, 28.57, 28.57, 28.57, 31.9, 31.9, 33.33, 33.33, 37.62, 37.62, 38.57, 39.52, 39.52, 40.48, 40.48, 40.48, 45.24, 45.24, 45.24, 45.24, 45.24, 47.14, 47.14, 48.1, 48.1, 49.05, 49.05, 50.48, 50.48, 51.9, 51.9, 53.33, 53.33, 55.24, 56.67, 57.14, 57.14, 57.14, 57.14, 57.14, 57.14, 61.43],
    byK: { 2: { tables: 30, k: 19, twiceK: 27 }, 3: { tables: 30, k: 12, twiceK: 17 }, 4: { tables: 30, k: 9, twiceK: 22 }, 5: { tables: 30, k: 5, twiceK: 21 }, 6: { tables: 30, k: 2, twiceK: 16 }, 7: { tables: 30, k: 3, twiceK: 17 }, 8: { tables: 30, k: 0, twiceK: 9 } } },
  opus: { tables: 209, k: 19, twiceK: 54,
    curve: [9.09, 9.09, 9.09, 9.09, 9.09, 9.09, 9.09, 9.09, 9.57, 9.57, 11.0, 11.0, 11.0, 11.48, 11.48, 11.48, 11.48, 12.92, 12.92, 13.4, 13.4, 13.4, 13.4, 13.4, 13.4, 17.22, 17.22, 17.22, 17.22, 17.7, 18.18, 18.18, 18.18, 18.18, 20.57, 20.57, 20.57, 20.57, 21.05, 21.05, 21.05, 21.05, 21.53, 22.01, 22.01, 22.01, 22.01, 22.01, 22.01, 22.01, 25.84],
    byK: { 2: { tables: 30, k: 13, twiceK: 17 }, 3: { tables: 30, k: 3, twiceK: 13 }, 4: { tables: 30, k: 3, twiceK: 10 }, 5: { tables: 30, k: 0, twiceK: 4 }, 6: { tables: 30, k: 0, twiceK: 5 }, 7: { tables: 29, k: 0, twiceK: 4 }, 8: { tables: 30, k: 0, twiceK: 1 } } },
}

/* The scripted agents on the composite level, 40 runs of each table, in % of runs. The first knows the targets
   and the functions of the plan and tries the objects that have the step's attribute in a random order. The
   second picks at random among the moves that change something. */
export const scriptedAgents = {
  knowsThePlan: { k: 45.2, twiceK: 94.3, curve: [45.2, 45.2, 45.2, 45.2, 45.2, 45.2, 45.2, 49.42, 53.48, 56.81, 60.68, 60.68, 60.68, 67.07, 67.07, 69.04, 69.04, 74.06, 74.06, 75.1, 76.92, 76.92, 77.93, 77.93, 77.93, 83.37, 83.37, 83.37, 83.37, 84.1, 85.1, 85.1, 85.45, 85.45, 87.95, 87.95, 88.24, 88.24, 89.4, 89.4, 89.82, 89.82, 90.3, 90.37, 90.55, 90.55, 90.55, 90.55, 90.55, 90.55, 94.29],
    byK: { k: {2: 51.2, 3: 57.2, 4: 49.0, 5: 49.0, 6: 39.3, 7: 40.2, 8: 30.4}, twiceK: {2: 80.0, 3: 96.2, 4: 96.9, 5: 99.4, 6: 96.1, 7: 97.3, 8: 94.1} } },
  randomMoves: { k: 0.0, twiceK: 1.5, curve: [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.17, 0.17, 0.17, 0.18, 0.18, 0.18, 0.18, 0.18, 0.31, 0.31, 0.31, 0.31, 0.31, 0.31, 0.31, 0.36, 0.36, 0.8, 0.8, 0.81, 0.81, 0.94, 0.94, 0.96, 0.96, 0.99, 1.04, 1.08, 1.08, 1.08, 1.08, 1.08, 1.08, 1.55],
    byK: { k: {2: 0.2, 3: 0.0, 4: 0.0, 5: 0.1, 6: 0.0, 7: 0.0, 8: 0.0}, twiceK: {2: 1.5, 3: 3.7, 4: 1.2, 5: 1.1, 6: 0.8, 7: 1.2, 8: 1.4} } },
} as const

/* Test-time continual learning, the composite tables of the sequences (stages 2 to 8). A stage is [solved
   with notes, the same tables solved alone within the same budget, tables]. `difference` is the paired
   difference in points and `error` its standard error. The analysis files call a sequence a stream. */
export type Stage = readonly [notes: number, alone: number, tables: number]
export const continualLearning: Record<ModelId, Record<BudgetId, {
  notes: number, alone: number, tables: number, difference: number, error: number,
  stages: Record<typeof stepCounts[number], Stage>,
}>> = {
  astra: {
    k: { notes: 148, alone: 129, tables: 275, difference: 6.9, error: 2.7,
      stages: { 2: [27, 26, 36], 3: [32, 29, 40], 4: [27, 25, 39], 5: [22, 18, 40], 6: [16, 17, 40], 7: [17, 9, 40], 8: [7, 5, 40] } },
    ten: { notes: 222, alone: 197, tables: 275, difference: 9.1, error: 2.4,
      stages: { 2: [31, 32, 36], 3: [40, 39, 40], 4: [36, 35, 39], 5: [34, 27, 40], 6: [37, 31, 40], 7: [29, 21, 40], 8: [15, 12, 40] } },
    twiceK: { notes: 239, alone: 213, tables: 275, difference: 9.5, error: 2.2,
      stages: { 2: [30, 32, 36], 3: [38, 37, 40], 4: [36, 35, 39], 5: [32, 27, 40], 6: [39, 31, 40], 7: [31, 26, 40], 8: [33, 25, 40] } },
  },
  fable: {
    k: { notes: 102, alone: 59, tables: 275, difference: 15.6, error: 2.9,
      stages: { 2: [14, 19, 36], 3: [28, 17, 40], 4: [20, 13, 39], 5: [12, 9, 40], 6: [13, 1, 40], 7: [13, 0, 40], 8: [2, 0, 40] } },
    ten: { notes: 202, alone: 157, tables: 275, difference: 16.4, error: 2.7,
      stages: { 2: [32, 29, 36], 3: [38, 35, 40], 4: [34, 25, 39], 5: [34, 25, 40], 6: [33, 26, 40], 7: [23, 13, 40], 8: [8, 4, 40] } },
    twiceK: { notes: 208, alone: 169, tables: 275, difference: 14.2, error: 3.1,
      stages: { 2: [27, 27, 36], 3: [32, 31, 40], 4: [31, 23, 39], 5: [30, 25, 40], 6: [34, 28, 40], 7: [27, 25, 40], 8: [27, 10, 40] } },
  },
  sol: {
    k: { notes: 91, alone: 75, tables: 275, difference: 5.8, error: 2.9,
      stages: { 2: [18, 21, 36], 3: [22, 21, 40], 4: [17, 18, 39], 5: [17, 9, 40], 6: [9, 3, 40], 7: [6, 3, 40], 8: [2, 0, 40] } },
    ten: { notes: 194, alone: 181, tables: 275, difference: 4.7, error: 2.5,
      stages: { 2: [30, 33, 36], 3: [38, 38, 40], 4: [35, 34, 39], 5: [28, 30, 40], 6: [28, 27, 40], 7: [24, 18, 40], 8: [11, 1, 40] } },
    twiceK: { notes: 201, alone: 194, tables: 275, difference: 2.5, error: 2.9,
      stages: { 2: [25, 29, 36], 3: [35, 33, 40], 4: [31, 32, 39], 5: [30, 30, 40], 6: [31, 31, 40], 7: [28, 24, 40], 8: [21, 15, 40] } },
  },
  opus: {
    k: { notes: 41, alone: 31, tables: 274, difference: 3.6, error: 2.2,
      stages: { 2: [11, 14, 36], 3: [13, 8, 39], 4: [8, 5, 39], 5: [3, 0, 40], 6: [6, 4, 40], 7: [0, 0, 40], 8: [0, 0, 40] } },
    ten: { notes: 113, alone: 74, tables: 274, difference: 14.2, error: 2.7,
      stages: { 2: [24, 24, 36], 3: [29, 26, 39], 4: [21, 16, 39], 5: [16, 3, 40], 6: [15, 5, 40], 7: [6, 0, 40], 8: [2, 0, 40] } },
    twiceK: { notes: 126, alone: 72, tables: 269, difference: 20.1, error: 3.3,
      stages: { 2: [19, 20, 36], 3: [22, 21, 38], 4: [22, 16, 39], 5: [20, 3, 39], 6: [23, 7, 40], 7: [15, 3, 39], 8: [5, 2, 38] } },
  },
}

/* Every recorded play of a composite table, replayed on the object table.
   `bySteps`: states at which the first move is a plan step, by the number of steps still to do.
   `byTool`: steps done at the first try, by where the tool of the step comes from.
   `leftOpen`: steps left open when an unsolved table ends, of the steps the model reaches. */
export const firstMove: Record<ModelId, {
  bySteps: Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, Count>,
  byTool: { table: Count, freed: Count, made: Count },
  leftOpen: { frees: Count, makes: Count },
}> = {
  astra: { bySteps: { 1: [148, 156], 2: [158, 182], 3: [122, 156], 4: [93, 131], 5: [70, 107], 6: [50, 84], 7: [25, 57], 8: [15, 30] },
    byTool: { table: [229, 376], freed: [335, 387], made: [120, 154] },
    leftOpen: { frees: [29, 723], makes: [12, 102] } },
  fable: { bySteps: { 1: [125, 133], 2: [125, 160], 3: [81, 134], 4: [62, 114], 5: [38, 94], 6: [27, 76], 7: [11, 53], 8: [9, 30] },
    byTool: { table: [153, 355], freed: [245, 335], made: [80, 120] },
    leftOpen: { frees: [50, 645], makes: [21, 87] } },
  sol: { bySteps: { 1: [129, 149], 2: [144, 173], 3: [105, 151], 4: [79, 127], 5: [52, 104], 6: [43, 81], 7: [21, 55], 8: [12, 30] },
    byTool: { table: [190, 363], freed: [298, 386], made: [101, 139] },
    leftOpen: { frees: [31, 700], makes: [21, 101] } },
  opus: { bySteps: { 1: [76, 85], 2: [66, 104], 3: [30, 92], 4: [26, 78], 5: [14, 69], 6: [15, 56], 7: [4, 45], 8: [3, 30] },
    byTool: { table: [80, 330], freed: [127, 212], made: [29, 49] },
    leftOpen: { frees: [110, 470], makes: [40, 74] } },
}

/* Steps of the tables played with notes that are done at the first try, by what the earlier stages of the
   same sequence have shown: [with notes, in the same tables alone read at the same budget, steps]. */
export const shownBefore = ['sameStep', 'sameTool', 'newTool', 'newFunction'] as const
export type ShownId = typeof shownBefore[number]
export const carriedOver: Record<ModelId, Record<BudgetId, Record<ShownId, readonly [notes: number, alone: number, steps: number]>>> = {
  astra: {
    k: { sameStep: [128, 95, 185], sameTool: [259, 218, 436], newTool: [288, 249, 492], newFunction: [161, 146, 275] },
    ten: { sameStep: [140, 107, 185], sameTool: [309, 258, 436], newTool: [336, 286, 492], newFunction: [186, 171, 275] },
    twiceK: { sameStep: [149, 115, 185], sameTool: [322, 287, 436], newTool: [344, 299, 492], newFunction: [195, 182, 275] },
  },
  fable: {
    k: { sameStep: [104, 61, 185], sameTool: [207, 108, 436], newTool: [199, 149, 492], newFunction: [118, 80, 275] },
    ten: { sameStep: [133, 83, 185], sameTool: [249, 156, 436], newTool: [285, 202, 492], newFunction: [152, 129, 275] },
    twiceK: { sameStep: [133, 88, 185], sameTool: [268, 177, 436], newTool: [271, 220, 492], newFunction: [165, 138, 275] },
  },
  sol: {
    k: { sameStep: [103, 69, 185], sameTool: [182, 138, 436], newTool: [196, 181, 492], newFunction: [115, 109, 275] },
    ten: { sameStep: [128, 92, 185], sameTool: [228, 184, 436], newTool: [273, 243, 492], newFunction: [156, 159, 275] },
    twiceK: { sameStep: [137, 95, 185], sameTool: [259, 213, 436], newTool: [275, 250, 492], newFunction: [159, 161, 275] },
  },
  opus: {
    k: { sameStep: [46, 17, 185], sameTool: [111, 38, 436], newTool: [102, 62, 490], newFunction: [57, 48, 274] },
    ten: { sameStep: [60, 27, 185], sameTool: [140, 55, 436], newTool: [150, 90, 490], newFunction: [94, 65, 274] },
    twiceK: { sameStep: [84, 27, 179], sameTool: [160, 59, 422], newTool: [158, 89, 484], newFunction: [94, 66, 269] },
  },
}
