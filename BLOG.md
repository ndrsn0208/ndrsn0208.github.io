# Essays

The essays are part of the Vite website and follow the site design in
`SITE_REDESIGN.md`: one typeface, hairlines, and the blue point.

- `/blog/` is the Blogs index. The navigation calls it Blogs.
- `/blog/tease/` is the project page of the TEASE benchmark.
- `/blog/continual-learning-diffusion-models/` joins the ICLR 2026 rank-1 Fisher
  paper and the NeurIPS 2026 trust region paper.
- `/blog/self-consolidating-language-models/` is the SCoL essay.
- `/blog/<essay>/figures/<figure>/` is a figure's own page.
- `?edition=paper` and `?edition=black` select the appearance.

Both essays were rebuilt on 2026-11-11 on one shared system, after a study of
thirty research blogs. Their text was rewritten on 2026-11-12 to the rules in
"Writing" below. Each essay is words in `article.ts` and drawings in
`exhibits.tsx`. Everything else is shared.

## One system

`src/blog/essay/` lays out every essay and frames every figure.

| File | What it does |
| --- | --- |
| `types.ts` | The shape of an essay. |
| `Essay.tsx` | The page: opening, summary, figures, sections, papers, references. |
| `Exhibit.tsx` | The frame every figure sits in, and its controls. |
| `Bars.tsx` | Measured values as bars. |
| `Frontier.tsx` | Two measurements of each method as one point, with the Pareto frontier, or one path per method. The same numbers sit in a table for assistive technology. |
| `Curves.tsx` | Measured values along an ordered axis, one line per series. One series is blue and carries its numbers. `Readout` sets a chart's main figures large above it. |
| `Columns.tsx` | Measured values as columns from zero, one column per series in every group. |
| `MathBlock.tsx` | A displayed equation. |
| `format.ts` | Inline marks, share-image addresses, and `essayType`. No imports, because the static build reads it. |
| `essay.css` | All essay and figure styles. |

### An essay's shape

1. **What the work is called, then what it does.** The name is small and grey.
   The headline is the page's largest line and names the method in the paper's
   terms. Both are in the one `h1`.
2. **The opening figure**: the phenomenon itself, before any explanation. It
   sits directly under the opening so that it is on the first screen.
3. **A summary** of three short paragraphs: the problem, the method, and the
   main numbers.
4. **Sections whose headings state what they show**, as the papers' paragraph
   headings do. No heading is a question. A test checks this.
5. **Limitations and future work**, taken from the paper, as the last section.
6. **The papers**, listed by the same component as the Papers page, then the
   references.

The outline stands to the right on wide screens and marks the section being
read with the point. Below 1240px it is a menu under the header.

### A section's rhythm

Say what was done in one or two short paragraphs. State the result as one
sentence in bold, with its number. Show the figure. Do not tell the same story
twice in different sections.

### Figures

Every figure is an `Exhibit` and is worked the same way.

- **Instances** are words above the drawing: benchmarks, passages. The blue
  point marks the one shown. Use them for parallel cases with no order.
- **The path** is a line of stations under the drawing. The blue point marks
  where the argument stands, and a sentence under it says what the drawing
  shows there. Play walks the path. A station jumps to it. Arrow keys move
  along it. Use it for an argument that has an order.
- **A recording** uses the same line as its timeline.
- **The plus** opens what lies behind the figure, in place: the experimental
  setup, what the marks mean, sources, the figure's link, and its image.

Rules that keep the figures one family:

- **One drawing per essay.** The trust region essay is drawn on the landscape
  from the overview. The SCoL essay is drawn with the model as a row of its 28
  layers. Each figure shows the same drawing and adds one thing to it. A
  comparison is the same drawing repeated, one strip per case, stacked so that
  the cases can be compared from top to bottom.
- **Blue is the model and what it changes**: its position, its path, its trust
  region, the layers it updates, and its row in a chart. Everything else is ink
  and grey. No other color carries meaning.
- **No captions.** The sentence before a figure says what to look for. Names
  sit on the drawing.
- **A figure that needs a disclaimer is the wrong figure.** Show measured data
  from the paper, or a drawing that is plainly a diagram of the method, as the
  paper's own Figure 1 is. Do not present invented examples as passages or
  runs.
- **Nothing smaller than 15px**, except mathematical scripts and superscript
  marks. A test checks this.
- **Only the opening figure moves on its own**, once, when it comes into view.
  Every other figure rests on the state that shows its whole argument and waits
  to be asked. With reduced motion nothing plays on its own and every station
  is a still.
- **A measured figure shows every reported value** from zero, with its number
  on it. A value the source does not report is shown as a dash, as in the
  paper's table, and is never drawn as zero.
- **Two measurements of the same methods are drawn against each other**
  (`Frontier.tsx`): one point per method, named on the drawing, ours in blue,
  the Pareto frontier dashed. Its axes carry their ticks and need not start at
  zero. The author asked for this form for immediate accuracy and retention
  (2026-11-13), because it reads faster than paired bars.

## Writing

The author's instruction, 2026-11-12: write the way the papers are written.
Three rules follow from it. They apply to every sentence on the page, in a
figure, and behind the plus.

1. **One term per concept.** Each essay has a term table below, taken from its
   paper. Use the term in the table every time. Do not vary it for style.
   Method names in text, tables, and figures are spelled the same way.
2. **No slogans.** State what was done and what was found, in full sentences,
   as the paper does: "We show that", "Trust Region reaches". No fragments
   written for effect, no question followed by its answer, no aphorisms, no
   paired punchlines, no metaphors for the mathematics.
3. **No defensive writing.** State the claim the paper makes, at the strength
   the paper makes it. Do not add what the work is not, pre-empt objections,
   or attach caveats to figures. Limitations are the paper's own and stand
   once, in the last section.

Also: continuous plain prose for AI researchers, no semicolons, no em dashes.

`src/blog/<essay>/article.ts` holds the words: name, headline, summary,
sections, each figure's title, description, stations, notes and sources, the
paper ids, and the references. It may not import anything except types.

Inline marks: `**words**` for the sentence that carries a result, and `[^id]`
for a numbered reference. References are listed in the order they are first
cited. Use Unicode for inline symbols such as δᵢ. Keep symbols with subscripts
that Unicode lacks in the equations. On the page, `essayType` sets terms such
as rank-1 and ImageNet-500 with a hyphen that does not break.

`src/site/essays.ts` repeats each essay's name and headline for the index
pages. Change both together.

To add a figure: describe it under `exhibits` in `article.ts`, draw it in
`exhibits.tsx`, place `{ exhibit: 'id' }` in a section, then run
`npm run blog:figure-cards` and build.

## Continual Learning Diffusion Models

`src/blog/diffusion/`. The headline is "Generative replay with a rank-1 Fisher
trust region".

Terms, from the two papers. The NeurIPS poster uses the same table.

| Concept | Term | Not |
| --- | --- | --- |
| Tasks learned before | old task, old tasks | earlier, previous, past, prior |
| Task being learned | new task | current, next, later |
| θᵢ* | old-task optimum | checkpoint, anchor, earlier optimum |
| θ | parameters | weights |
| Loss of old-task performance | catastrophic forgetting, then forgetting | erase, overwrite |
| The quadratic term of EWC | Fisher penalty | anchor, regularizer, EWC penalty |
| The set it bounds | trust region | safe region, protected region |
| F | Fisher information, then Fisher. Rank-1 Fisher, diagonal Fisher | importance |
| Replay | generative replay, then replay. Its samples are replay data | rehearsal, generated examples |
| The method | trust region continual learning in prose, Trust Region as a method name | hybrid, our method |
| Region good for all tasks | shared basin | shared weights |
| What replay alone does | drift | wander |
| What EWC alone does | overconstrain | hold still |
| Regaining old-task performance | re-converge, re-convergence | recover, come back, return |
| What is counted | gradient updates | steps, updates |
| The level to regain | threshold | target |
| Change of task | task transition | switch |
| First task | Task 1 | the first task, the first skill |
| Benchmarks | ImageNet-1k, ImageNet-500, Continual World (CW10), then CW10 | the robot benchmark |
| Metrics | average FID, average success rate, forgetting | score, success |
| Baselines | Finetuning, EWC, Replay, FTML, VR-MCL. EWC (rank-1) and EWC (diagonal) where both appear | Fine-tuning, bilevel baselines |
| Meta-learning | one-step MAML, query gradient, support curvature correction, meta-gradient, initialization | |

The drawing is one scene (`scene.ts`), on the surface from
`src/site/terrain.ts`, drawn by `TerrainStage.tsx`. It follows Figure 1 of the
Trust Region paper and has three tasks, each with a low-loss region that is
named on the drawing.

- Task 1 and Task 2 are the old tasks. Their low-loss regions cross, and the
  parameters start in the crossing, at the old-task optimum. A dotted line is
  the update for Task 2, from the Task 1 optimum.
- Task 3 is the new task.
- The trust region is the ellipse that the two old tasks' rank-1 Fishers give
  around the crossing.
- Task 1 and Task 2 have a second pair of low-loss regions far from the
  old-task optimum, because an overparameterized model has many equivalent
  solutions.
- A shared basin is where all three low-loss regions overlap. It is drawn
  darker. There is one inside the trust region and one far away.

The author asked for this on 2026-11-12: the figure must show the three tasks
of the paper's figure, and the Trust Region drawing must show what replay does
(it moves the parameters into a shared basin) and what the Fisher penalty does
(it keeps them inside the trust region). A drawing with one "old tasks" region,
or one in which Trust Region looks like EWC, is wrong.

As in the paper's figure, EWC is drawn for a new task whose low-loss region
does not reach the trust region (`reach` is false in `scene.ts`). Replay and
Trust Region are drawn for a new task that reaches it.

The NeurIPS poster's Figure 2 is rendered from the same `scene.ts` by the
poster's `build/landscape/render_tasks.mjs`. After changing the scene, render
the poster's strips again.

| Figure | What it shows |
| --- | --- |
| `return` | The author's recording of four diffusion policies on CW10 Task 1, after training on Task 1 and after training on all 10 tasks. |
| `forgetting` | Finetuning moves the parameters away from the old-task optimum. |
| `region` | Around the old-task optimum: the per-sample gradients of each old task, the trust region of the rank-1 Fisher, the trust region of the diagonal Fisher. |
| `methods` | Three strips of the scene, one per method. EWC stops at the boundary of the trust region. Replay passes through the shared basin and drifts to the far one. Trust Region converges in the shared basin inside the trust region, and a grey line shows the path of replay alone. |
| `recovery` | Gradient updates for Task 1 to re-converge, after every task transition and at every threshold. |
| `results` | Final performance and forgetting on three benchmarks. |

Scientific contracts:

- `evidence.ts` holds the measurements and their sources. Do not change a
  number without the paper. Text quotes the papers' numbers exactly.
- The landscape figures illustrate parameter updates, as Figure 1 of the Trust
  Region paper does. They carry no numbers.
- The 0.83 is the mean cosine similarity between the old-task part of the
  update and an exact second-order one-step MAML meta-gradient, on CW10.
- Re-convergence counts come from Table 2. The 2 to 45 gradient updates are
  CW10 at the 90% threshold. The figure shows every threshold.
- `return` shows eight views of one recording (`media.ts`). Each view is
  cropped inside its frame and above its badge, and the outcome is written in
  the site's type. The frames and timing are untouched.

## Self-Consolidating Language Models

`src/blog/scol/`. The headline is the approved subtitle: "Writing context into
model weights at test time".

Terms, from the paper.

| Concept | Term | Not |
| --- | --- | --- |
| A unit of incoming text | context. Passage on SQuAD, segment on LongBench v2 | chunk, note, document |
| The sequence | stream of contexts, stream | history |
| The setting | continual context consolidation | |
| The operation | consolidate. Glossed once as writing the context into the weights | learn into, absorb, store |
| θ | weights | parameters |
| The gradient step | LoRA update | adapter training |
| Keeping the chosen candidate | commit | merge, keep |
| Which layers are updated | layer selection, selected layers, select | choice, list, pick, where to write |
| The K samples | candidate | proposal, option |
| Reward terms | acquisition, forgetting | learned, lost |
| Metrics | immediate accuracy, retention | acquisition (that is the reward term), right after reading, after more reading |
| How many layers a layer selection may name | update budget | |
| The LLM | the model. The round-start model in training | policy, chooser |
| Training | meta-reinforcement learning, meta-train, IPO, preference pairs | |
| Baselines | Prompting-only, Batch TTT, SEAL (continual), Last-10, Middle-10, Random-10, SCoL (λ = 0), SCoL. On LongBench v2: Base, Full Context, Summarization, Batch TTT, Sequential FT, Last-10, SCoL | Fixed last 10 layers |
| Fisher analysis | Fisher information, recall@k, random selection | Fisher score, overlap |
| Why updates conflict | interference | |

The drawing is `Layers.tsx`: the model as a row of its 28 layers. A filled cell
is a layer that received an update.

| Figure | What it shows |
| --- | --- |
| `writing` | Three contexts consolidated into the weights, the prompt cleared, a question answered. |
| `interference` | A second update in the same layers overwrites the first. In different layers it does not. |
| `loop` | One training step: ten candidates, the reward, the committed candidate, the ranking used by IPO. |
| `results` | Immediate accuracy against retention on SQuAD with the Pareto frontier, after the left panel of the paper's Figure 3, and accuracy by context length on LongBench v2. |
| `additional` | The SQuAD experiment on Llama-3.1-8B-Instruct and on Qwen3.8-27B, Qwen3.8-27B at update budgets of 5, 10 and 20 layers (one path per method), and a stream of New York Times paragraphs, each as immediate accuracy against retention. Then 5-shot MMLU after the stream, as bars. |
| `fisher` | Layerwise Fisher information and the selected layers of three SQuAD passages, and recall@k over 100 passages. |

Scientific contracts:

- The same evolving model generates the layer selections and receives the
  updates. Candidates start from the same weights and differ only in their
  selected layers. The candidate with the highest reward is committed.
- Preference pairs are collected across the stream. IPO trains the round-start
  model, not the model at the end of the stream.
- `results`, `additional` and the bars in `fisher` use `evidence.ts` and
  `fisher-evidence.ts`. Every number there is transcribed from the LaTeX of the
  November 2026 preprint, and every ± is one standard error over 3 seed runs.
  Files that the paper's main file no longer inputs still sit in its source
  folder with the earlier numbers (`app-fixed-layer-controls.tex`,
  `tab_accuracy_variance_lcs.tex`, `aligned_passages_forget_compact.pdf`). Do
  not read numbers from them.
- The three passages in `fisher` are the ones in the lower right panel of the
  paper's Figure 3 (`figure3_pareto_selection_fisher.pdf`). Their selected
  layers are the figure's star markers. Their Fisher values are read from its
  heatmap colours: each cell is one entry of the 256-step magma colour map, and
  the value is that entry's index over 255. Do not replace them with invented
  examples.
- In `results`, Prompting-only and Batch TTT sit where their retention equals
  their immediate accuracy, as the paper's Figure 3 draws them. In `additional`
  the paper's tables give them no retention value, so they are listed in the
  note and not drawn. On Llama-3.1-8B-Instruct the immediate accuracy of Batch
  TTT (37.23%) is above the retention of SCoL (34.57%), so drawing it on the
  diagonal there would contradict the paper's statement. Ask the author before
  changing this.
- `writing`, `interference`, and `loop` are diagrams of the method. They carry
  no measurements. The candidates in `loop` are an example, scored with λ = 2
  as in the SQuAD experiments.

## Test-Time Compositional Generalization

`src/blog/composition/`, added on 2026-11-13. The headline, "Composing a
held-out combination from prototypes discovered at test time", is built from
the paper's terms. The author has not approved it yet.

**The story.** The author rejected the first version on 2026-11-13: its figures
were grids of images, unlike the other essays, and it never showed that
training has not seen the combination and that prototypes found at test time
compose it. The essay therefore does not follow the paper's section order. It
states the setting first (every attribute value is seen, not every
combination), then what a prototype is, then that mode ascent from a held-out
query ends on seen combinations that each keep part of the query, then that
the product of experts composes the held-out combination from them, then the
results. Keep that order and keep those three statements explicit.

**The drawing** is `Pairs.tsx`: the 16 pairs of digit color and background
color in ColorMNIST. A filled cell is a pair seen in training, a dashed cell a
held-out pair (the four pairs are listed in the paper's appendix on the
benchmarks), blue is the pair in question. What the model produces is placed in
the cell of the pair it shows. Every figure about composition is drawn on this
grid, and `EssayFigure.tsx` shows it small wherever the essay is listed.

Terms, from the paper.

| Concept | Term | Not |
| --- | --- | --- |
| Attribute values together | combination. A class on a benchmark. A color pair for digit color and background color | composition, slot |
| In training or not | seen, held-out | unseen, OOD, novel |
| What is discovered | prototype: a mode of a noisy marginal, with its local Gaussian | concept, cluster, centroid |
| The distribution at one noise level | noisy marginal | smoothed density |
| t | noise level. Fine levels, coarse levels | timestep, scale |
| Finding a mode | mode ascent, ascent step | score ascent, gradient ascent |
| The test image | query. Out-of-distribution query when the setting is named | prompt, example |
| The pool | candidate prototypes, selected prototypes (K = 8) | experts |
| Combining | compose, product of experts, per-dimension weights | PoE, mix, blend |
| Sampling | composable diffusion sampler, samples | generations |
| Baselines | Comp. 1, Comp. 3, SDEdit, Ours | Composable (1 class) |
| Metrics | attribute correctness, KID, diversity | accuracy, FID |
| Models | CIFAR-10 DDPM, CelebA-HQ DDPM, DiT-XL/2, text-to-image LDM | |

| Figure | What it shows |
| --- | --- |
| `compose` | On the grid: training, the query's held-out pair, prototypes in the cells of seen pairs, the query's digit color and background meeting at its cell, the samples. |
| `modes` | A one-dimensional noisy marginal at three noise levels, with the modes that two images reach. |
| `levels` | The prototypes of two images per model at seven noise levels, on four models. |
| `sharing` | The number of distinct prototypes by noise level, as shaded cells. |
| `ascent` | On the grid: where mode ascent from the held-out pair ends at t = 300 and at t = 400. Beside it the model's images step by step, and under it the share of ascents that keep their pair. |
| `weights` | The eight selected prototypes, their per-dimension weights, and the mean of their product of experts. |
| `samples` | The query, three prototypes, and five samples of each method. On ColorMNIST the grid places each method by the pair its samples show. |
| `results` | Attribute correctness against KID: SDEdit over t0, our method over the scale S. |
| `number` | Attribute correctness against the number of selected prototypes. |

Scientific contracts:

- Every picture is an output of a model, cut from a figure of the paper and
  never redrawn. `composition_assets.py` (in the author's `papers-2026-11/tools`
  folder, outside this repository) cuts the tiles from `overview.pdf`,
  `evolution.pdf`, `main_dual_dataset.pdf` and `val_modes.pdf` into the sheets
  under `public/blog-assets/composition/`. `tiles.tsx` says what each sheet
  holds.
- A tile sits in the cell of the pair it shows. The cells were read from the
  images: in `compose`, prototypes 1, 2, 6, 7 and 5 of the overview figure are
  cyan on deep red, green on dark brown, yellow on dark brown, cyan on dark
  purple, and pink on dark purple. In `ascent`, the held-out query ends on
  yellow on deep red at t = 300 and on green on dark brown at t = 400. In
  `samples`, Comp. 1 shows cyan on deep red and Comp. 3 green on dark purple.
- `evidence.ts` holds every number, transcribed from the paper's LaTeX. The
  points of our method over S in `results` are printed in no table: they are
  the class means of the result tables behind the paper's figure, on the
  author's H200 machine under `research/ttcg-rebuttal/results/`. Recomputing
  Table 1 from those tables reproduces it exactly.
- `modes` is a diagram of a one-dimensional mixture. It carries no measurement.
- Do not write that the model has no mode at a held-out pair. At t = 300, 9.7%
  of the ascents from a held-out pair keep it.

## TEASE

`src/blog/tease/`, at `/blog/tease/`, added on 2026-11-20. It is a project page
for a benchmark, built on the essay system. The headline is the paper's title
after the colon: "A benchmark for test-time systematic generalization in
embodied agents". The author asked for it under Blogs and not in the homepage's
News. Their brief: introduce the project and the results of the four frontier
models, interactive, with charts in the look of a frontier lab's model post, no
comparison with prior work, no slogans, no small text, no defensive writing, one
term per concept, and no abbreviation at its first use except common ones.

Corrections by the author on the same day, after the first and the second version:

- **The third level is test-time continual learning. Do not call it a stream.**
  The paper's Figure 1 titles its three drawings Atom, Composite and Test-time
  continual learning. The paper's text, its analysis files and the benchmark's
  repository still say "stream level" and "stream". The page does not: the
  level is "test-time continual learning", its tables are played in a
  "sequence" of eight stages, and the two conditions are "with notes" and
  "alone". `tools/tease_evidence.py` reads the keys named `stream` and writes
  `continualLearning` with `notes` and `alone`. A test fails if the word
  appears on the page.
- **The paper's main results come first.** The opening figure is the paper's
  Figure 1 drawn again (`results`): the four frontier models on the three
  levels. The table played along its plan, which opened the first version, is
  the figure of the first section.
- **The models have the colours of the paper's figures.** The palette is "dusk"
  in the paper's `labstyle.py`: GPT-6.2 Astra `#2B5480`, Claude Fable 5.2
  `#7A68A6`, GPT-6.2 Sol `#CF6F87`, Claude Opus 5.5 `#F0A860`. They are set in
  `exhibits.css` (`--tease-astra` and so on), with a lighter value of the same
  hue for the black appearance. This page is the one place on the site where a
  chart has more colours than the blue. Blue stays what it is in the frame and
  in the pictures: the point of the path, the rule of the level in the opening
  figure, the rings and the working object.
- **The results of the third level read plainly.** The author read the first
  version of that section and asked why GPT-6.2 Astra has 83 at stage 8 when it
  had 63 before. The 83 is with notes and the 63 the same tables alone, and the
  section had not said so in plain words. It now opens with what the two
  results are and with that very case in numbers, its heading names the two
  conditions, and the figure writes the gain under every stage.

**No paper, no code, no references yet.** The paper is not public yet and
both repositories are private (2026-11-20), so the page links to neither and
has no papers section and no references. `papers` and `references` are empty,
and `Essay.tsx` leaves both sections out. When the paper is public, add its
publication id to `papers`, a link to `links`, and the usage section from the
repository's README. The author line is the one on the author's slides (Zekun
Wang, Georgia Institute of Technology). Ask the author before adding names.

**The story** is the paper's without its related work, in an order that brings
results forward. The opening figure gives the main results. Then a table
played along its plan, the atoms, and what the agent receives and one turn,
with the four models. Each level is followed by its results: the atom level and
systematicity, the composite level and composition with the reference agents,
test-time continual learning and what notes add. The three findings of the
analysis close the page. Section headings are the paper's own, except the first
("A task is a table of everyday objects with a goal"), the one of the third
level, and the one of its results ("With notes from shorter tables, the models
solve more of the same tables"), which names the two conditions the figure
compares.

**The drawing** is the table: the renders the agent receives, with every object
under a letter. The figures of the benchmark are built from them. The share
image of the page is still the table (`face.tease` in
`scripts/render-essay-cards.mjs`). On the index pages the page's emblem is one
play as a row of moves (`Emblem.tsx`).

**The opening figure** (`Results` in `exhibits.tsx`) has one drawing per level,
side by side: pairs right as columns, composite tables solved within a budget
from k to twice k moves, and composite tables solved with notes by stage within
k moves, the budget the paper's figure draws in colour. Above each drawing
stand the figures of the model chosen above the figure. The path walks the
three levels and the blue rule marks the one it stands at. From 940px down the
three have no room side by side, and only that level is shown. The lines of
these small drawings cross, so the numbers of the model in blue stand above
the drawing and not on its line, and names are the short ones (Astra, Fable,
Sol, Opus), since the full names are the words that choose the model directly
above.

**Charts.** `Curves.tsx` and `Columns.tsx` (shared, in `src/blog/essay/`) were
written for this page. Every model has its colour in every chart, as a line, a
point or a column. The reader chooses a model above a chart, where each name
carries its colour as a ring and the chosen one is filled (`tabColors` on
`Exhibit`). The chosen model is the heavy line and carries its numbers, and
`Readout` sets its main figures large above the drawing. Text is never set in a
model's colour: the orange and the rose are too light for type. Lines are named
at their ends. Grey is what is not a model: the same tables played alone, and
the reference agents, which are dashed. A path under a chart moves through
budgets or through the parts of an argument. In `gain` the line in the model's
colour is the share solved with notes and the grey line the same tables alone.
A row under the axis (`rows` of `Curves`) gives the gain at every stage. On a
phone that figure writes whole numbers, since the stages stand closer.

Terms, from the paper's own term sheet (`notes/TERMS.md` in the paper's
repository). Use them in every sentence, figure and note.

| Concept | Term | Not |
| --- | --- | --- |
| The benchmark | TEASE (Test-Time Embodied Agent Systematicity Evaluation), expanded once | |
| One task instance | table | scene, episode, puzzle, problem |
| The record that decides what a move does | the object table | catalog, database |
| Anything on a table | object | thing, item |
| A visible physical property | attribute | property, feature, affordance |
| What an attribute enables | function: cut, hook, poke, heat, pound, contain, tie, pry | action, skill |
| An attribute with its function | atom | primitive, rule |
| An object made for a function | typical tool | usual, canonical, standard tool |
| An object that has the attribute and is no typical tool | non-typical object | unusual, atypical, substitute |
| The object on a table that can do the step | working object | carrier, answer |
| An object that comes close to the attribute and lacks it | near-miss object | lure, distractor, decoy |
| The working object's twin without the attribute | counterpart | lookalike, twin |
| The two tables of a pair | positive table, negative table, pair | solvable, unsolvable |
| One call by the agent | move: `use`, `tie`, `none()` | action, call |
| The agent's run through a table | play | episode |
| One step of the shortest way to the goal | step. A table has k steps | hop |
| The moves of a shortest way to the goal | plan | solution, sequence |
| A move that does a step of the plan | plan step | correct move |
| The table at its start or after a plan step | state | |
| The first move at a state does the step | the step is done at the first try | first-try rate |
| The table ends with a step not done | the step is left open | open step |
| The levels | atom level, composite level, test-time continual learning (the third level) | stream level, puzzle level, curriculum |
| The eight stages that one run of the third level plays in order | sequence. There are eight sequences | stream, order, curriculum |
| A table played after the earlier stages, with the agent's notes | with notes | in the stream |
| A table played with no earlier table | played alone | cold, isolated, from scratch |
| The share solved with notes minus the share of the same tables solved alone, in points | gain. Over the tables of stages 2 to 8, with its standard error, it is the paired difference | improvement, lift, boost |
| What the agent writes after a stage | notes | memory, reflection |
| The number of moves a run is read at | budget: k, 10 or twice k moves | cap, horizon |
| Goal reached within the budget | solved | success, completed |
| The agent says the goal cannot be reached | answers `none()` | declines, refuses |
| A move that changes nothing | nothing happens | no-op, wasted |
| Reference agents | oracle, the agent that knows the plan, random moves | optimal, informed |
| The systems under test | model. Vision-language model, written out | LLM, VLM |
| A container, tube, shelf or cabinet the hand cannot open | closed place | fixture |

| Figure | What it shows |
| --- | --- |
| `results` | The opening figure: the main results of the four models, one drawing per level. |
| `table` | A composite table of five steps from above, before each move of its plan, with the tool and the target of the move ringed and shown close up. |
| `atoms` | The eight atoms: for each function a non-typical object that has the attribute and a similar-looking object that lacks it. |
| `turn` | What the agent receives: four views, every object close up, the text. Then a move carried out by the robot hand, and its result. |
| `pair` | A pair of tables of the atom level that differ in one object. |
| `pairs` | Positive tables, negative tables and pairs right, as columns. |
| `moves` | The recorded moves of the four models on the pair shown in `pair`. |
| `functions` | Negative tables right by function, one point per model. |
| `play` | One play of the table of five steps, read at the budgets k and twice k. |
| `budget` | Composite tables solved within a budget from k to twice k moves, with the scripted agents and the oracle. |
| `steps` | Composite tables solved by the number of steps, with the level of k separate one-move tables. |
| `stages` | Test-time continual learning: a sequence of eight stages, the notes between them, the same tables alone. |
| `gain` | Test-time continual learning by stage, with notes and alone, at three budgets, with the gain under every stage. It rests on twice k moves, where the text's example reads off it. |
| `first` | States at which the first move is a plan step by the steps still to do, and steps done at the first try by where the tool comes from. |
| `open` | Reached steps left open, for steps that free an object and steps that make a tool. |
| `shown` | With notes minus the same tables alone, by what the earlier stages have shown. |

Scientific contracts:

- `evidence.ts` is written by `tools/tease_evidence.py` in the author's
  `papers-2026-11` folder, outside this repository, from the paper's analysis
  files (`numbers.json`, `attempts.json`, `moves_summary.json`,
  `controls.json`, `ref_agents.json`). It holds counts with their totals. Do
  not edit it by hand. The tool prints the numbers the paper's text quotes.
- Every number in `article.ts` is in the paper's text or tables, or is a range
  over the four models computed from those counts.
- The pictures are the renders the agent receives, copied from the author's
  H200 machine and cut by `tools/tease_assets.py` in the same folder. Nothing
  is redrawn. The names of objects under pictures are for the reader. The agent
  gets only letters.
- In `budget` and in the composite drawing of `results` each curve is the cubic
  through the values at k and at twice k that is closest to the values between,
  as in the paper's figure. Its points are the measured values. Every other
  chart joins measured values.
- The third drawing of `results` and its two figures are at the budget of k
  moves, as in the paper's Figure 1 and in the table of the repository's
  README. The shares with notes and alone (53.8% and 46.9% for GPT-6.2 Astra)
  are in the paper's main table.
- The dashed line in `steps` is the model's share of positive atom tables
  raised to the power k. The paper states it for GPT-6.2 Astra (83.1% and
  47.6%).
- `moves` shows recorded plays of the pair `cut/G00`, read from the run
  records of the four models on the H200 machine. `play` shows the play of
  GPT-6.2 Astra that the paper's figure of the composite level shows.
- The notes quoted in `stages` and in the last section are the ones the paper
  quotes.
- The example that opens the results of the third level (GPT-6.2 Astra, stage
  8, within twice k moves: 82.5% with notes, 62.5% alone) is 33 of 40 and 25 of
  40 in the paper's table of the third level by stage. The composite level's
  own tables of eight steps give 63.3% (19 of 30) at that budget. They are
  other tables: the composite tables of the sequences are 211 different tables,
  of which 45 are also tables of the composite level (the paper's appendix).

## Paper assets

Three preprints are served from `/papers/`, each with its BibTeX and version
metadata next to it:

- `self-consolidating-language-models.pdf`: the ICLR 2027 version of the paper,
  signed and set in the template of the LeAH paper (2026-11-13). It replaced the
  earlier Folio edition.
- `test-time-compositional-generalization.pdf`: the ICLR 2027 version of the
  compositional diffusion paper, signed, in the same template.
- `learning-to-adapt-harnesses.pdf`: the LeAH manuscript. The same file stays at
  its earlier address under `/unlisted/`, which has been shared and must keep
  working.

The author supplies the LaTeX sources. The signed PDFs are built outside this
repository, in the author's workspace (`papers-2026-11/tools/retemplate.py`
applies the LeAH style file, Palatino, the running title, and the author block
from arXiv, and leaves the text of the paper alone). Copy a new PDF in with
`npm run paper:sync -- <slug> <pdf> <pages> "<edition>" "<title>"` and put the
printed address, with its checksum prefix, in `src/data/publications.json`.
arXiv does not carry these versions yet, so the site and the CV link to these
PDFs.

The trust region paper is the author-supplied NeurIPS camera-ready PDF at
`/papers/trust-region-continual-learning.pdf`. Links carry its checksum prefix.

## Sharing and the static build

Every figure has a share image at `public/blog-assets/<essay>/share/<figure>.png`,
and each essay has `essay.png` there. `npm run blog:figure-cards` photographs
the live figures at 1200 × 630. Run it whenever a figure or a title changes,
look at the images, then build. The trust region essay's own image shows the
Trust Region strip of `methods`.

`npm run build` runs `scripts/build-blog-pages.mjs`, which writes a real page
for the index, each essay, and each figure, with its own title, description,
share image, canonical address, structured data, and the complete text for
readers without JavaScript. It fails if a share image is missing.

The seven addresses the trust region figures had before the rebuild are listed
as `aliases` in `article.ts`. They still open the figure that replaced them.
Do not remove them.

`ArticleShare.tsx` shows one word, Share, in the essay's opening. It opens X,
LinkedIn, Bluesky, and Copy link in place. Sharing uses no embedded scripts.

## Checks

- `npm run typecheck` and `npm run build`.
- `npx playwright test tests/blog.spec.ts tests/site.spec.ts`. The essay tests
  hold every essay to the shared shape, check every figure's frame, the
  smallest type size, accessibility in both appearances, and the numbers the
  measured figures show.
