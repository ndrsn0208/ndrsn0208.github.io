# Essays

The essays are part of the Vite website and follow the site design in
`SITE_REDESIGN.md`: one typeface, hairlines, and the blue point.

- `/blog/` is the Writing index. The navigation calls it Writing.
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
| `results` | Immediate accuracy and retention on SQuAD, and accuracy by context length on LongBench v2. |
| `additional` | The SQuAD experiment on Llama-3.1-8B-Instruct and on Qwen3.8-27B, Qwen3.8-27B at update budgets of 5, 10 and 20 layers, a stream of New York Times paragraphs, and 5-shot MMLU after the stream. |
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
- `writing`, `interference`, and `loop` are diagrams of the method. They carry
  no measurements. The candidates in `loop` are an example, scored with λ = 2
  as in the SQuAD experiments.

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
  hold both essays to the shared shape, check every figure's frame, the
  smallest type size, accessibility in both appearances, and the numbers the
  measured figures show.
