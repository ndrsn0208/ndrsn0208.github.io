# Research website redesign

This is the October 2026 website design. It replaces the old centered
introduction and independently scrolling panels with normal pages and a
continuous research overview.

## Direction

A personal research journal with a clear editorial hierarchy. Identity,
research questions, evidence, writing, and background have distinct roles.
The homepage is a curated introduction, Publications is a searchable record,
and Blog is the place to understand the work in depth. Every destination uses
the same navigation, type, spacing, colors, and footer.

Reference research covers Karpathy, Olah, Barron, Finn, Isola, Wu, Sitzmann,
Crane, Weng, and Satyanarayan. The source reports and evidence are under
`artifacts/site-redesign/research/`. Study organization and readability, never
copy another researcher's markup, branding, or distinctive composition.

## Shared implementation contract

- `src/site/SiteFrame.tsx` owns the site header, footer, appearance, and scroll
  restoration. Default export accepts `children`, `page` (`home`,
  `publications`, `blog`, `about`, `cv`), optional `mainId` (default
  `site-main`), and optional `initialAnchor`.
- `useSiteTheme()` returns `{ edition, toggleEdition, href }`.
  `href('/publications?tag=continual+learning#example')` preserves the target's
  query and fragment and adds the current `edition`. Canonical share URLs
  must continue to omit appearance parameters.
- `src/site/site.css` owns tokens and the shared primitives. Use
  `--site-paper`, `--site-surface`, `--site-ink`, `--site-body`,
  `--site-muted`, `--site-rule`, `--site-accent`, `--site-serif`, and
  `--site-sans`. Tokens are inherited by every page.
- `.site-container` is the centered 1040px measure with responsive gutters.
  Articles retain a wider 1240px outer measure for their scientific figures.
  `.site-prose` is a 720px reading measure. `.site-text-link` is a flat text
  action, never a raised card.
- Fonts are self-hosted upright Newsreader for headings and reading, Source
  Sans 3 for navigation, metadata, and concise descriptions. Titles need
  actual hierarchy, not all-caps styling or oversized tracking.
- Paper is `#f5f1e8`, ink is `#242923`, and the small accent is dark green.
  Black remains `#000000`. Scientific colors preserve their meaning.
- Use normal document scrolling. No nested homepage scroll container,
  full-screen chapter replacement, hidden navigation, or centered dashboard.
- Keep the global header to navigation and appearance controls. Do not repeat
  the name and a tagline there, or add decorative labels above names,
  headings, sections, and paper titles. Dates, author credit, venues, and
  meaningful scientific annotations remain visible.
- Links use plain text without decorative arrows. Keep scientific arrows
  where they describe a process, relation, or measured direction. Research
  previews use compact thumbnails, and paper records group venues and
  resources together rather than placing each on a separate row.
- Keep keyboard navigation, real links, visible focus, safe mobile gutters,
  reduced motion, and static states for animated media.
- Public prose is continuous and plain. No semicolons, em dashes, inflated
  claims, fabricated facts, or claims of perfect retention.

## Page responsibilities

Home introduces Zekun and the broad research agenda, current affiliations,
recent news, two illustrated research stories, and five selected publications.
The selection retains its authored membership and follows publication chronology.
About gives the full research
vision, education, industry, service, and photography note. CV opens the
current versioned PDF in the same site shell.

Publications has one complete year-grouped record, six visible canonical
topic filters, search, direct artifacts, and inline abstract/citation details.
Titles, venues, and author credit must be readable without interacting.
Use the actual generated publication data, not a second copy of the record.
Published work, accepted papers, and preprints share one timeline. The curated
`publication_date` in `papers.toml` becomes `publicationDate` in the catalog:
formal venue timing for published/accepted work and first posting for preprints.
The catalog, browser filtering, homepage selection, and static fallbacks use
that order; `addedAt` is only the catalog creation timestamp.

All CV links carry the current PDF content hash. The local preview also reloads
that version when `public/cv.pdf` changes, so it cannot retain a startup-time link
after a CV rebuild.

Blog is rebuilt as an editorial index with real research previews and links
to the corresponding papers. Both article covers, metadata, contents,
reading columns, references, and related reading are redesigned as one
system. Their scientific figures, measured data, equations, citation
anchors, animation controls, and original source links remain functional.
The old `scol-blog[data-edition]` wrapper and theme hook may be retained as
compatibility adapters for scientific components.

## Routes and delivery

Keep `/`, `/publications`, `/blog`, `/about`, `/cv`, `/photography`, both
article slugs, and all eight diffusion figure-share routes. Preserve the
GitHub Pages deep-link handoff. Older homepage hashes must resolve to useful
sections or their new pages. The eight independent share pages must retain
their initial HTML metadata and unique PNG cards.

Do not publish private `writing/` sources, local research evidence, screenshots,
or test artifacts. The latest hosted PDFs and current CV must not be replaced
with earlier versions.

## Optional adaptation playground

The normal website remains the default. `Adapt this website` opens a local
playground for destruction, drawing, procedural diffusion, text editing, and
layout changes. Its enabled state and page edits belong to this browser.
No visitor changes are uploaded or applied to other visitors.

The gate is lightweight and the actual playground loads only on entry.
Browse preserves normal interactions. Exit restores the authored DOM and
disables automatic entry without deleting saved edits. The controls themselves
must never be destructible. See `ADAPTATION_PLAN.md` for the interaction and
resource limits, and run `npm run test:adaptation` for its regression checks.
