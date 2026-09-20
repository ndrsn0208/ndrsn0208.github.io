# Claude Code — context for `ndrsn0208.github.io`

This site is a personal academic website for a CS PhD student. Read this before
making non-trivial changes; it captures decisions and constraints that aren't
obvious from the code alone.

## Stack

- **Build:** Vite 5 (React 18 + TS strict, `react-jsx`, alias `@/*` → `src/*`).
- **Routing:** `react-router-dom` v6 with `BrowserRouter`. SPA fallback in
  `public/404.html` rewrites deep links to `/?_redirect=…`; `src/main.tsx`
  rehydrates them via `history.replaceState` on boot.
- **Styling:** Tailwind v3 with a custom theme (see `tailwind.config.ts`) plus
  `src/styles/glass.css` for the chrome surfaces, foil overlays, scan grid,
  and ambient haze that Tailwind handles awkwardly.
- **Animation:** `motion/react` (Framer Motion v11). Spring defaults around
  `stiffness 200, damping 18`. Page transitions wrap `Routes` in
  `AnimatePresence mode="wait"` (see `src/App.tsx`).
- **Search:** Fuse.js for fuzzy + tag filter (see `src/lib/search.ts`).
  Semantic search is wired as Layer 3 but the toggle is currently `disabled`
  — backend (Voyage worker / transformers.js) ships in the next pass.
- **Markdown / math:** `react-markdown` + `remark-math` + `rehype-katex` +
  `katex` for paper detail rendering.

## Approved homepage

The approved homepage at `/` is **Book + Chapters**, built on Lens. Keep its
centered introduction and left-aligned text, parallel education/industry records,
and upright EB Garamond/Source Sans 3 typography. The photographer phrase uses
upright Newsreader with a subtle difference in weight. Black is exactly
`#000000`; Paper is `#f5f1e8`. The current direction is minimal and humanist:
flat surfaces, serif reading copy, an ink drawing, and text navigation with a
moving underline. Lens has no glass blur, highlights, gradients, or raised controls.

On desktop (1024px and above), selecting any of the four destinations moves
the introduction to the left with a Motion layout animation and reveals an
independently scrolling right pane. The introduction's width stays constant.
About and Contact are inline reading panes; CV previews the real PDF. Keep each
pane mounted to preserve reading position and paper state. Close/Escape returns
to the centered introduction and restores focus. Destination hashes support
browser history; appearance changes must preserve the hash.
`SplitPane.tsx` and `split-layout.css` define the desktop composition.
`BackgroundInfo.tsx` adds a reversible, animated **More / Less** disclosure below
the current education and industry records. It shows the earlier Michigan and
Penn State degrees while preserving the two-column layout. `InfoCopy.tsx`
renders the short biography, broad research focus, academic service, and personal
note from `config.json`; `profile-content.css` supplies their shared reading styles.

Phones use **Chapters**: a centered cover and four full-height reading panes,
with a persistent four-option navigation at the bottom. Publications, About,
Contact, and CV switch within the page using Motion; each retains its own reading
position. The name in the running header returns to the introduction. Preserve
safe areas, reduced-motion, focus, keyboard, and browser-history behavior.
`src/Homepage.tsx` loads only Book and Chapters styles for the public homepage.
The public homepage has no design-selection bar. `/still?review=1` exposes the
archived design controls; `/designs` retains the earlier explorations.
See `STILL_MINIMAL_BRIEF.md` for the current design and interaction contract.

`/typography` contains four additional typography studies: Book, Editorial,
Humanist, and Poem. They reuse Lens inside a scoped `.type-preview` wrapper;
Book is also the approved homepage typography. Preview fonts load before an animated
typography change so the existing reader and search state can remain mounted.
See `TYPOGRAPHY_STUDIES.md` for preview, comparison, and verification commands.

The Publications heading now includes all six canonical research topics as
visible filter buttons, with real paper counts and combined text search.
`ResearchTopics.tsx` uses the existing data; never hand-edit generated tags.

`/mobile` compares three Book phone studies: Folio (continuous reading), Index
(compact reading with a top dock), and Chapters (full-height panes with fixed
bottom navigation). Variant CSS applies only to its wrapper below 1024px.
Chapters reuses `SplitPane`, hash history, inert state, and retained readers;
the desktop introduction animation remains controlled by the desktop breakpoint.
See `MOBILE_STUDIES.md` for the layout and review contract.

The editable CV is under `cv/`. `npm run cv:build` compiles a review PDF, while
`npm run cv:publish` explicitly copies a successful build to `public/cv.pdf`.
The separate Build CV workflow produces a downloadable GitHub Actions artifact.
The LaTeX source reconstructs the May 2026 PDF and includes the user's September
2026 research-interest and Amazon internship updates. Industry Experience follows
Education; the confirmed Amazon start is August 2026, in Washington, USA.
Research Focus is one broad paragraph. Selected Publications links to Scholar;
the 18-entry Full Publication List is last. The website PDF is now synchronized
with the reviewed September CV. Update factual content only from confirmed
changes. See `cv/README.md`.

The styling notes below describe the legacy detail routes, not the approved Book homepage.

## Legacy site appearance

Direction: **Liquid Glass** (evolved from the original `02-liquid-metal.html`
Phase 0 mockup). Dark warm base (`#0B0910`) with **saturated colored haze
orbs** (rose / amber / lavender / cyan, ~80–90 px blur, multiple) bleeding
through translucent **frosted-glass surfaces**: every card / panel / button
uses `backdrop-filter: blur(20–28 px) saturate(180%)` over a 4–8 % white fill,
with a top-edge inner highlight + soft outer drop-shadow. Corners are pillowy
(`rounded-2xl` / 16 px on cards and panels). The conic-gradient foil panels
inside each publication card are unchanged — those *are* the liquid signature.
The CSS class names are still `.chrome` / `.chrome-r` / `.btn-chrome` for
backwards compatibility, but the underlying styles are real glass, not metal.
Mono-heavy typography (`JetBrains Mono` for labels), Geist for display,
Inter for body.

## Things to avoid (from the build spec — do not drift)

1. Pure gray-on-white minimalism with no personality.
2. Default Tailwind blue anywhere.
3. Squared-off Inter everywhere with no display contrast.
4. Hero = giant centered headline + subtitle + two buttons.
5. Card grid where every card has identical opacity and identical glass.
6. Lucide icons everywhere, unmodified.
7. "AI shimmer" gradients (purple→teal). **Stay in the warm family.**

The lavender accent (`#A78BFA`) is fine alongside warm tones; it is the only
cool color allowed and only as an accent.

## Canonical research-interest tag list

The single source of truth is `config.researchInterests` in
[`src/data/config.json`](src/data/config.json):

```
continual learning
compositionality
language models
reinforcement learning
concept learning
diffusion models
```

The Python summarizer is constrained to this list — `summarize.py` will not
invent new tags. **Do not extend the list without explicit user OK.** When the
user adds one, bump `config.json` and re-run with `--force`.

## `publications.json` schema

Auto-generated by `scripts/update_publications.py` — never hand-edit.

```json
{
  "lastUpdated": "ISO-8601",
  "publications": [
    {
      "id": "kebab-case slug",
      "title": "...",
      "authors": ["..."],
      "venue": "ICML 2026",
      "year": 2026,
      "url": "https://doi.org/...",  // optional canonical paper page
      "arxivId": "2401.12345",
      "arxivUrl": "https://arxiv.org/abs/...",
      "arxivHtmlUrl": "https://arxiv.org/html/...",
      "arxivHtmlAvailable": true,
      "pdfUrl": "...",
      "scholarUrl": "...",
      "summary": "AI 2-3 sentences",
      "tldr": "AI single sentence ≤ 25 words",
      "tags": ["..."],
      "equalContribution": ["..."], // optional names from the author list
      "award": "spotlight",        // optional — from papers.toml
      "gradient": { "stops": [...], "fromAngle": 110, "cx": 32, "cy": 28, "hx": 25, "hy": 15, "hIntensity": 0.55, "noiseFreq": 0.95, "noiseOpacity": 0.55 },
      "embedding": [0.012, -0.043, "..."],
      "addedAt": "ISO-8601"
    }
  ]
}
```

The `gradient` object is computed by the same algorithm in `src/lib/gradient.ts`.
**Both implementations must stay in sync** — same FNV-1a + mulberry32 seed,
same TAG_PALETTE, same stop/jitter logic. The frontend will fall back to
generating the gradient at runtime if it's missing, so the script can also
omit it; but the canonical state is "computed by the script."

## Update pipeline overview (LOCAL ONLY — never CI)

```
papers.toml (hand-edited at repo root)
        │  arxiv id + venue + optional award
        ▼
arxiv lib (fetch title / authors / abstract by id)
        │
        ▼
public/arxiv-cache/{id}.html  ← fetch_arxiv_html.py (rate-limited, polite)
        │
        ▼
scripts/summarize.py — local `claude -p` CLI (Claude Code subscription)
   • returns {tldr, summary, tags} as STRICT JSON
   • tags constrained to config.researchInterests
   • NO Anthropic API key, NO anthropic SDK import
        │
        ▼
src/data/publications.json (merged, sorted newest-first)
```

Why no Google Scholar? Scholar's index lags arxiv and sometimes misses
papers entirely. The user supplies the canonical list in `papers.toml`.

The list also supports curated DOI/proceedings records with `id` and `url`
instead of `arxiv`. Verified `title`, `authors`, `year`, `summary`, `tldr`,
`tags`, `url`, `pdf_url`, and `equal_contribution` fields override cached/fetched
values. Complete curated metadata can create a paper without a network fetch.
`--offline` regenerates using only those entries and cached records, and fails
before writing if a fetch would be necessary. Keep existing paper ids stable
when correcting titles or venue years so links and reading state survive.
Canonical tags are validated for curated entries too.

Why no Anthropic API? The user has a Claude Code terminal subscription,
not an API plan. We invoke `claude -p "<prompt>"` as a subprocess; it
authenticates locally. **All AI calls happen at update time on the
user's machine** — once `publications.json` is committed and pushed,
the deployed site has zero AI dependencies.

Cache the arxiv HTML under `public/arxiv-cache/` so Vite copies it into
`dist/` and the frontend can fetch it via a normal HTTP path. Don't
re-fetch unless `--force`.

## Deployment

`vite.config.ts` uses `base: '/'` because the repo is `ndrsn0208.github.io`
(apex, not subpath). The GitHub Actions workflow at
`.github/workflows/deploy.yml` builds on push to the default branch, `master`
(and also supports `main`), and publishes via
`actions/deploy-pages@v4`.

## Conventions

- Card foil = `<PublicationGradient>`. Always pass `id`, `tags`, and the
  precomputed `gradient` if available — the component memos via `useMemo` so
  re-renders are cheap.
- All animations must respect `useReducedMotion()`. Set `initial={false}` and
  drop transitions to ~0 when reduced.
- Mono labels use 13 px on foil panels (`.foil-meta`); 10–11 px on body chrome
  surfaces. Keep that contrast — it's the rhythm of the site.
- Tag filter chips use the canonical list verbatim. Do not lowercase or
  hyphenate at render time.
