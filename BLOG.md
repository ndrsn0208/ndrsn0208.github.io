# Research blog

The public blog is part of the existing Vite website. The local development server uses port 5173.

- `/blog/` is the research notes index.
- `/blog/self-consolidating-language-models/` is the SCoL article.
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

The blog and copied paper are ready to participate in the normal website deployment. Local authoring does not itself publish the changes.
