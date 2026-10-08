# Research blog

The public blog is part of the existing Vite website. The local development server uses port 5173.
Keep this preview as a detached background process rather than tying its lifetime
to a tool terminal. Its log and PID are recorded in
`artifacts/diffusion-blog/preview-server.log` and `preview-server.pid`.
Check the listening port before starting another instance.

- `/blog/` is the research notes index.
- `/blog/self-consolidating-language-models/` is the SCoL article.
- `/blog/continual-learning-diffusion-models/` is the illustrated article joining
  the ICLR 2026 rank-1 Fisher and NeurIPS 2026 trust-region papers.
- `?edition=paper` and `?edition=black` select the reading appearance.
- The homepage includes Blog in its navigation and a news entry for the article.

The blog uses the approved Book typography, upright serif reading text, restrained diagrams, and the existing Motion library. The article title stays on one line above the phone breakpoint, and wraps naturally on phones. Appearance follows the homepage preference and preserves the current article anchor.

## Editing

`src/blog/scol/article.ts` is the article's narrative source. It exports nine sections, the title, subtitle, references, paragraph citation mappings, and a shared formatter for restrained bold emphasis. React and the static reading fallback use the same formatting. Superscript references link to Further reading, with links back to their first citing paragraphs. The subtitle is explicitly approved as:

> Writing context into model weights at test time

Keep the narrative continuous and readable for AI researchers. Do not introduce semicolons, em dashes, slogan fragments, or claims beyond the experiments.

The narrative motivation is to turn experience into knowledge in the model's weights, as inspired by human memory consolidation. Full context, recurrent or recursive processing, summaries, and retrieval manage access to a history during fixed-weight inference. Present their shared dependence on supplied context before recasting the problem as continual learning. SCoL is not introduced as another item in that list. The difficulty that follows is retaining what was learned through subsequent updates. Keep claims about persistent memory tied to answering after context removal, without implying perfect retention or unlimited storage.

`src/blog/scol/ScolPost.tsx` composes the text, equations, illustrations, results, and paper reader. `BlogLayout.tsx` owns the shared reading appearance and metadata. `blog.css` is scoped to the blog.

`story-example.ts` supplies one reasoning story: a key is in a blue box, the box moves to the study, and the study is upstairs. The opening `DeploymentHero` shows the notes changing selected weights, the original context being cleared, and a later question answered from those changes. Its compact overview also appears on the index.

The context illustration follows this story through five views. On desktop the figure follows the adjacent prose. On phones each view appears with its section. Diagram connectors use measured element positions, and question paths use visible dashes. Figure text has a 15px minimum apart from mathematical scripts.

The meta learning figure has seven stages, with Commit and Continue shown separately. The winning layer indices and highlights must stay identical between the proposal, committed update, and running model in the next step. Fresh candidates belong to the next chunk, and the stream finishes before outer learning starts. Example preference pairs remain labelled with their originating chunk. Manual playback works in reduced motion as a sequence of still frames. Clicking Play brings the scene into view once, and timed stages do not move the reader's scroll position.

`evidence.ts` contains the reported measurements used by the result figures. Preserve unreported retention entries as absent values. The longer-context toggle reads “Long (generalization)”. LongBench error bars follow the paper's sampling definition, not independent training runs.

Result figures match the centered 660px reading column and share the page's background in both appearances. `FisherAlignment.tsx` uses one continuous axis for all 28 layers, including on phones. Phone labels use sparser ticks without splitting the chart. It opens on the complete comparison, with shared layers highlighted at their actual column positions and an explicit overlap count. Playback explains selected layers, Fisher sensitivity, and overlap in three steps. The animated layer profiles are schematic, while `fisher-evidence.ts` separately records the reported 100-passage aggregate and its source locations. The source does not define the type of the reported Fisher uncertainty, so do not label it SE or SD.

## Scientific contracts

The same evolving model generates textual layer selections and receives the selected-layer LoRA updates. Candidates start from the same current state and differ in update locations. The highest reward candidate is committed.

Preference data are collected across the stream. IPO improves the saved round-start policy. The outer update is not applied to the final drifted stream state.

Training evaluates forgetting on past material. LongBench intrinsic rewards do not use downstream QA labels. Fisher scores are posthoc diagnostics and do not enter the selection policy.

Context and reward demonstrations are labeled as illustrations. Experimental figures use the reported measurements. Longer-context Batch TTT performance and the limits of retention remain visible.

## Paper assets

The current Folio PDF is served at `/papers/self-consolidating-language-models.pdf`. Its BibTeX and version metadata live next to it. The article includes direct reading and download links plus an optional inline preview.

The local editable paper remains under the Git-ignored directory:

`writing/self-consolidating-language-models/frontier-studies/folio/`

After compiling and checking an updated Folio paper, run `npm run blog:paper` to copy its PDF and cover into the website. This is a local authoring step. CI uses the committed public assets and does not need the local manuscript or a LaTeX compiler.

Do not edit the original ICLR workspace while working on this blog. The imported manuscript and original preview remain independent.

## Build and sharing

`npm run build` builds the site and creates static entry pages for the blog index and article. These contain article-specific Open Graph and Twitter metadata, canonical URLs, structured metadata, and a complete text fallback for readers without JavaScript.

`public/blog-assets/scol/social-card.png` is the 1200 by 630 share image. The independently drawn SVG source is stored next to it. The card repeats the approved subtitle.

`ArticleShare.tsx` adds quiet text links beneath the article byline and beside the closing paper section. X, LinkedIn, and Bluesky open their compose or share pages. Copy link uses the canonical public article URL, excluding local hosts, appearance parameters, and section anchors. If clipboard access fails, a selected, read-only URL field remains available for manual copying. Sharing requires no embedded social scripts.

On phones, the author details span the reading width and Paper joins the sharing links in a wrapping row below. Keep each name, contribution marker, and trailing comma together. Contribution superscripts use one vertical offset, and the affiliation's inline separator is omitted when the contribution note moves onto its own line.

The blog and copied paper are ready to participate in the normal website deployment. Local authoring does not itself publish the changes.

## Continual learning in diffusion models

`src/blog/diffusion/article.ts` is the second article's narrative source.
`DiffusionPost.tsx` composes the reading experience. It uses the same Book
typography and Paper/Black appearances, with a 700px reading column.
The title is “Continual Learning Diffusion Models” and wraps deliberately on phones. `format.ts` supplies canonical
links, the two papers' individual authors, BibTeX, and the emphasis formatter
shared by the rendered article and static fallback.

The argument follows the papers: diagonal Fisher loses parameter correlations,
gradient alignment makes a rank-1 estimate practical, replay promotes parameter
sharing, and a useful Fisher constraint limits replay drift. The recovery
experiment then motivates the local meta-learning interpretation. The image
generators and robot policies are separate models. The ICLR study evaluates
image generation. The NeurIPS study covers ImageNet-500 and simulated
Continual World 10 diffusion policies trained on offline demonstrations.

`DiffusionLead.tsx` opens with the author's CW10 hammer recording. Four methods
perform task 1 immediately after learning it and again after nine more tasks.
`DiffusionTeaser.tsx` uses the same recording on the blog index. `RobotFilm.tsx`
provides muted inline autoplay while visible and a prominent Play/Pause animation
button above the recording, with Restart and a full-size link.
Reduced motion and hidden tabs stop automatic playback. The original GIF and a
smaller H.264 MP4 are both available. Paper appearance uses derived media whose
white canvas matches the page's `#f5f1e8`. The robot views, task thumbnails, frame
timing, and original files are preserved. Keep the hero caption about skill retention.
The seed and recording provenance belong in the asset documentation. See
`public/blog-assets/diffusion/README.md` for the media contract.

`FisherComparison.tsx` compares the three matrices directly above their loss
surfaces. Signed heatmaps make the missing off-diagonal entries explicit.
The only matrix control highlights those entries. There are no movement-direction
buttons or per-direction zero-penalty readouts. Full Fisher and the scaled
mean-gradient outer product retain nearly the same pattern. Relative Frobenius
errors are calculated from the illustrated matrices, not quoted as paper results.
`fisher-comparison-model.ts` uses 48 paired synthetic gradients in 24 coordinates,
with eigenvalues 1, 0.025, 0.009 and a 0.0007 residual. Take the diagonal in
the original coordinates **before projection**.

The richer surfaces are explicitly **illustrative loss surrogates**:
`L_a(z) = ½ zᵀ Bᵀ F_a B z + R(z)`. An identical smooth nonlinear term supplies
asymmetric hills in every panel. Its value, gradient, and Hessian vanish at the
central checkpoint, so the local curvature there is exactly `Bᵀ F_a B`.
Do not describe these as measured image losses or as a nonquadratic Fisher.
The nonlinear term is not part of the rank-1 penalty and does not make its
trust region bounded. Keep the common plane, color scale, height range, camera,
and nonlinear term. `SurfacePanel`'s `contours` style reduces the wire mesh
while retaining elevation contours. The three cameras rotate together. On
phones all three heatmaps remain visible above a switchable larger surface.
The paper's measured MNIST error and low-SNR assumptions are linked separately.

The recovery section follows **derivation → measured gradient alignment → recovery
curves**. `meta-learning-connection.ts` is the shared content and equation source
for the React derivation and static article. `MetaLearningConnection.tsx` shows
all three stages without hiding the conclusion behind tabs: compare the combined
replay + EWC gradient with the entire one-step MAML gradient, apply the paper's
local query/curvature approximations, then reduce `F_i² ≈ ρ_i F_i`.
The resulting coefficients are `β + λ` and `1 − αρ_i`. Keep the latter's
positive-sign condition visible. This is a local, **per-task directional**
relation with task-dependent scales, not equality of the full algorithms.
Do not match the positive EWC term to MAML's negative curvature correction alone.
The practical training loop does not execute an extra MAML support/query loop.

This derivation uses Section 3.3, Equations 5–13, of the hosted author-supplied
PDF (sha256 prefix `f24a30d7db6c`), not the superseded arXiv v1 equations.
Appendix D.1 / Table 9 reports **0.83 mean cosine** between the old-task update
and an exact second-order, one-step MAML meta-gradient on CW10, with both
evaluated at the same parameters and support/query samples from the same stream.
This is directional agreement, not a recovery rate or an approximation-error
bound. Keep it before Figure 2 as a direct check of the connection.
`recovery-data.ts` shares the original curve assets with the React and no-JS
article. The curves measure Task 1 during ongoing later-task training, not a
separate adaptation run on unseen tasks. The 2–45-update claim is specifically
the CW10 **90%** target. Preserve the original Figure 2 plots.

`GradientStory.tsx` animates the construction of a four-by-four Fisher matrix.
`gradient-story-model.ts` computes four slightly misaligned synthetic gradients,
their outer products, a running average, and the scaled mean outer product.
The three stages build full Fisher, remove cross terms for the diagonal
approximation, then rebuild the dominant pattern from the mean. Keep the full
reference fixed after its construction, use one matrix color scale, and calculate
every rank-1 entry from the mean and scale, including its diagonal.
The constructed full Fisher has a small residual, so rank-1 is visibly an
approximation. Its numbers are separate from the paper's measured eigenvalue
ratio of 0.022 at timestep 700. Playback starts once when visible, can pause or
replay, and stops when offscreen or hidden. Each step is available as a still
with reduced motion. Rank-1 Fisher is a conditional approximation involving
low SNR, near convergence, and the paper's modeling assumptions. It does not
restrict weight updates to rank one. On wide screens its explanation sits beside
the two matrices. Below 640px the reader can switch between the construction and
full Fisher without restarting the construction step.

`TaskSharing.tsx` covers all three strategies in rank-1 §3.4 and Trust Region
Figure 1: (a) EWC alone, (b) replay alone, and (c) replay plus Fisher, called
Trust Region. Fisher defines EWC's penalty, so it is not a separate third
baseline. Do not collapse this back into only replay versus the combined method.
All three paths reach the same shared Task 1 and Task 2 checkpoint.
Figure 1(a) is a distinct case: its Task 3 region has no overlap with the
shared Task 1 and Task 2 region. EWC departs the shared checkpoint to learn
Task 3 and sacrifices its Task 1 fit. Do not put EWC in a separate Task 2
basin or show it remaining at that checkpoint throughout Task 3.
Figure 1(b,c) use the same separate landscape where a shared solution exists.
The two replay methods share their generated examples and Task 2 checkpoint.
At Task 3, replay can fit a distant surrogate basin while missing the original
earlier tasks. Trust Region retains the nearby shared solution.
Dashed colored loops explicitly represent generated replay examples.
Original task regions remain solid. Do not claim that all three panels have
identical Task 3 geometry or mark an all-three shared solution in the EWC case.
Task fits are computed from `task-sharing-model.ts`.
The controls advance Tasks 1–3. These routes are schematic, not measured
optimization trajectories. The figure now shows **one large surface at every
screen width**, with EWC, Replay, and Trust Region as text tabs. Do not restore
three crowded canvases or floating plot labels. `sharingFocusScene` keeps only
task boundaries, the learning path, and the current model point. The four-item
legend sits above the plot, with task and playback controls immediately below.
A short explanation and the task fit sit beside it, or below on narrow screens.
EWC explicitly shades the computed intersection C1∩C2. When Task 3 arrives,
that earlier overlap remains shaded and is visibly disjoint from C3. The nearby
formula changes from a nonempty two-task set to C1∩C2∩C3 = ∅. Playback holds
for 550ms before the Task 3 departure so the missing feasible overlap can be seen.
This shading is a common task-loss set, not a Fisher penalty contour.
The distinct EWC scenario is stated in that explanation. Objectives and longer
interpretation live in a closed disclosure. Switching methods preserves the
selected task and camera, showing that task's endpoint. Playback and manual task
transitions can both pause and resume from the same position.

Colored loops are original task low-loss regions. Do not label them Fisher
boundaries or draw an undamped rank-1 penalty as a closed ellipse. One rank-1
memory constrains one direction. Training uses a soft additive penalty anchored
to earlier task solutions, and cannot create task overlap when none exists.

`ArgumentScene.tsx` renders only the supplied scalar field, with relief and
elevation contours. It adds no decorative mountains. Compared panels share
camera pose and fixed height ranges. The legend, named task controls, and
outcome belong next to the surfaces. Every figure uses the same 1000px maximum
frame and shared page gutters, while prose keeps the 700px reading width.
The Fisher comparison uses 240–290px surfaces on desktop and a larger switchable
surface on phones. The single task-sharing surface uses 300–400px, with closer framing and a
quieter mesh. Its camera preserves room for all task regions on small screens.
Keep reset controls near the figure. Horizontal
touch gestures rotate all compared views together. Vertical gestures scroll.

`RecoveryStory.tsx` displays the original Figure 2(a,b) assets extracted
from page 7 of arXiv v1. These are preserved, and the source link now points to
Figure 2 on page 8 of the hosted NeurIPS PDF. These are actual Task 1 learning
curves throughout training on ten tasks, with the original axes and task
transitions. Both domains remain visible. The wide plots scroll horizontally
on phones and link to full-size originals. Table 2 is linked for exact recovery
threshold counts. Do not redraw within-task learning curves from those counts.
The MAML comparison describes local gradient and curvature roles, not equality
of complete update rules or an extra training loop on Task 1.

`evidence.ts` holds the measured results and their exact source anchors.
`DiffusionResults.tsx` displays standard bar plots for ImageNet-1k, ImageNet-500,
and CW10, with means and standard-error whiskers. The protocols stay separate.
Do not compare raw FID values between image benchmarks.
On desktop the plots form two rows and three benchmark columns in a wide
figure. The top row shows FID, FID, and success rate. The bottom row shows each
benchmark's forgetting. Keep methods in the same order within each column.
Use upright, readable labels and compact plots rather than shrinking a full
page plot into a grid cell. Cells use horizontal bars with method names beside
them, rendered at 320×200 with 16.5pt or larger chart text. Below 900px, a
benchmark selector keeps one performance/forgetting
pair visible at a readable size, instead of vertically stacking all six plots.
Retain the measured baselines, error definitions, and unachieved recovery
thresholds. Source ambiguities belong in the experimental details, not in
invented metadata.

Use **Trust Region** for the combined replay and rank-1 Fisher method in both
papers. Rank-1 EWC alone remains a separate ablation. Conference names belong
in bibliographic references, not method labels. “Read the full work” includes
clickable first-page thumbnails rendered from the source PDFs under
`public/blog-assets/diffusion/papers/`. The cards show ICLR 2026 and NeurIPS 2026
above the titles. Rank-1 Fisher links to arXiv v2. Trust Region links to the
author-supplied 32-page NeurIPS camera-ready PDF, hosted at
`/papers/trust-region-continual-learning.pdf`. The cover is rendered from that
exact file. Both URLs include its checksum prefix, and its version manifest
records the full checksum. The homepage's Publications entry uses the same PDF.
Keep the result-source anchors pinned to the versions actually transcribed.

The low-resolution generated-image gallery has been removed from the article,
index, and static fallback at the author's request. Its source crops, original
panels, provenance manifest, and retired component are preserved under
`artifacts/diffusion-blog/retired-image-samples/`. The quantitative image-generation
experiments remain in `DiffusionResults.tsx`.

`useMotionPreference.ts` follows live reduced-motion changes. Explicit playback
must remain usable as still frames. The hero and other illustrations should
stop when hidden and never move the reader's scroll position during playback.

The second article's 1200 × 630 share image is the complete final robot frame,
proportionally resized and padded. X link previews use this static image. To
show the animation in an X post, attach the provided GIF or MP4 natively.

### Sharing individual figures

`src/blog/diffusion/figure-shares.ts` defines eight independent share pages under
`/blog/continual-learning-diffusion-models/figures/`. Each has its own HTML,
canonical URL, Open Graph image and X large-image card. Do not replace these
routes with fragment-only links or JavaScript-only metadata: crawlers need the
figure's card in the initial HTML. The hero keeps the whole article's existing
URL and robot card.

`FigureShare.tsx` provides the figure permalink, X compose link, copy action and
PNG download. Copies always use the public HTTPS URL, without local preview
hosts or appearance settings. Clipboard failure leaves a readable URL field.
Internal navigation preserves appearance. Opening a figure URL renders the
complete article and positions it at that figure. Explicit chapter fragments
take precedence. The no-JavaScript page shows the same PNG with a link back to
its context in the article.

The eight cards include the Fisher comparison, Fisher construction, parameter
sharing, meta-learning derivation, complete recovery comparison, both individual
recovery panels, and the measured-results grid. They live in
`public/blog-assets/diffusion/share/`. Regenerate them with
`npm run blog:figure-cards` whenever their source figures change, inspect the
PNGs, then build. The renderers reuse the actual matrices, illustrative
landscapes and original plots. Measured results retain the two-row, three-column
layout and original uncertainty bars. Cards are static representative figures,
not snapshots of a reader's current animation state.

`scripts/build-blog-pages.mjs` emits all figure routes and checks that each
image is a PNG under 5 MB. The public files must be deployed before external
social services can fetch their previews. Local checks establish the HTML and
image mapping, not whether X has refreshed its own cache.
Do not promise animated link cards or override a viewer's autoplay preferences.
`scripts/build-blog-pages.mjs` generates both articles' metadata and complete
static reading fallbacks.
