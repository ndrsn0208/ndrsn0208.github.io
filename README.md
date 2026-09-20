# ndrsn0208.github.io

Personal academic website — Vite + React + TypeScript + Tailwind, deployed to GitHub Pages at the apex of `https://ndrsn0208.github.io`. Publication metadata is hand-curated in [`papers.toml`](papers.toml). A local script merges verified metadata and cached records, fetching arxiv and summarizing via the **local Claude Code CLI** when needed, then writes [`src/data/publications.json`](src/data/publications.json). The deployed site runs zero AI calls in production.

The homepage at `/` uses **Book** typography and the **Chapters** mobile layout,
with a minimal, humanist design and pure **Black** and warm **Paper** appearances.
Upright EB Garamond and Source Sans 3 give the text a book-like rhythm.
Education and industry sit side by side.
Education's **More** control smoothly expands the earlier Michigan and Penn State
degrees within the Education column, one below the other. About includes a short biography, broad research focus, academic service,
and the photography note. Profile content lives in `src/data/config.json`.
On desktop, the introduction starts centered; opening Publications, About,
Contact, or CV moves it smoothly left and reveals the right pane. Only that
pane scrolls, and switching destinations preserves the reading position.
Close or Escape returns to the centered introduction.

Phones open each destination as a full-height chapter, with persistent navigation
at the bottom and independent reading positions. The name in the header returns
to the introduction. The appearance button switches Black and Paper without
losing the active chapter.

The ten earlier redesign studies remain at `/designs`. The Still explorations
are at `/still`: **Lens, Drift, and Frame**. Public pages have no design-selection
bar; append `&review=1` to an explicit Still preview to open the archived review
controls. Independent comparisons and saved reading state remain available.
See [STILL_MINIMAL_BRIEF.md](STILL_MINIMAL_BRIEF.md) for the current visual direction.
The earlier Still base is retained at `/designs/quiet`.
See [DESIGN_STUDIES.md](DESIGN_STUDIES.md) for the directions, comparison view,
and verification commands.

Four typography studies remain available at `/typography`: **Book,
Editorial, Humanist, and Poem**. Each includes Black/Paper and the existing
desktop/mobile preview interactions. Compare them against the original Lens at
`/typography/compare`. See [TYPOGRAPHY_STUDIES.md](TYPOGRAPHY_STUDIES.md).

Three Book mobile studies are available at `/mobile`: **Folio, Index, and
Chapters**, with interactive phone comparisons and Black/Paper appearances.
Chapters is selected for the public homepage.
Research topics are visible above Publications and filter alongside search.
See [MOBILE_STUDIES.md](MOBILE_STUDIES.md).

The editable LaTeX reproduction of the CV lives in [`cv/`](cv/README.md).
`npm run cv:build` creates a PDF for review; `npm run cv:publish` explicitly builds
and copies that PDF to the website's `public/cv.pdf`. See the CV README for the
required TeX engine and editing instructions. The [Build CV workflow](.github/workflows/build-cv.yml)
compiles changes to the LaTeX source and saves a downloadable PDF in GitHub
Actions; publishing the website PDF remains an explicit `cv:publish` step.

---

## Update publications

1. Edit [`papers.toml`](papers.toml) — add an entry per paper:
   ```toml
   [[paper]]
   arxiv = "2401.12345"      # or a full URL
   venue = "ICML 2026"        # optional, defaults to "arXiv {YYYY}"
   award = "spotlight"        # optional: spotlight / oral / best paper / …
   ```
   Audited fields such as `title`, `authors`, `url`, `pdf_url`, `year`, `summary`,
   `tldr`, `tags`, and `equal_contribution` override fetched or cached values.
   Use `url` for the canonical proceedings/DOI page and `pdf_url` only for a PDF.
   For a paper without arxiv, supply a stable `id`, `url`, `venue`, `year`,
   `title`, `authors`, `summary`, `tldr`, and `tags`.
   Complete curated entries can be added without a network fetch; tags must
   come from `config.researchInterests`.
2. Make sure the `claude` CLI (Claude Code) is on your PATH — the script uses it for summarization. No API key is needed; it uses your existing Claude Code subscription.
3. Run:
   ```bash
   python3 -m pip install -r scripts/requirements.txt
   python3 scripts/update_publications.py
   ```
   (Use `python3 -m pip`, not bare `pip`, so the install goes into the same interpreter that runs the script — useful if you have conda + system Python side by side.)
   Flags: `--force` refresh uncurated arxiv records (curated fields still win),
   `--dry-run` skip the write, `--paper <arxiv-id-or-curated-id>` update one paper.
   `--offline` applies cached and curated metadata with Python 3.11+ alone,
   without network or AI calls. If any selected entry needs an unavailable
   fetch, the script leaves the existing JSON intact.
4. Commit the regenerated [`src/data/publications.json`](src/data/publications.json) and any new files under `public/arxiv-cache/`.

The script never runs in CI. The committed JSON is what ships.

## Edit bio / links

Hand-edit [`src/data/config.json`](src/data/config.json) for the biography,
research vision, academic service, education, industry experience, and contact
links. Edit [`papers.toml`](papers.toml) for publication content; everything in
`publications.json` is regenerated by the script.

## Develop locally

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # TS strict
npm run build        # → dist/
```

Requires Node 20+ and Python 3.11+ (the script uses the built-in `tomllib`).

## Deploy

Push to the default branch, `master`. The GitHub Actions workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and publishes to GitHub Pages. Pages is configured to use GitHub Actions.

## What needs to be on your machine

| Tool                       | Where it's used                                     |
| -------------------------- | --------------------------------------------------- |
| Node 20+                   | `npm run dev`, `npm run build`                      |
| Python 3.11+               | `scripts/update_publications.py`                    |
| `claude` CLI (Claude Code) | Summarization; called via subprocess by the script. |

No `ANTHROPIC_API_KEY`, no `VOYAGE_API_KEY`, no other secrets — the build is fully static. AI work is local-only and one-shot at update time.

## For future Claude Code sessions

See [`CLAUDE.md`](CLAUDE.md) — stack summary, the canonical research-interest tag list (do not extend without explicit user OK), the publications.json schema, and the things-to-avoid design list.
