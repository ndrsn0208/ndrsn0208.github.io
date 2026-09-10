# Ten independent academic website directions

The user explicitly requested ten radically different designs, implemented by
parallel subagents. This supersedes the former palette and layout restrictions
in CLAUDE.md. Preserve canonical content and publication data.

## Implementation contract

- Each worker owns only `src/designs/variants/NN-name/index.tsx` and
  `src/designs/variants/NN-name/style.css`. Do not edit shared files, dependencies,
  app entry points, or other variants. Do not commit or push.
- Default-export a React component from `index.tsx`. Import `./style.css`.
- Root class must be `design-surface NAME` (e.g. `design-surface folio`).
  Prefix **every** CSS class, SVG definition ID, and DOM ID with your variant
  name. Scope every CSS rule to your own root or class. No global resets.
- Shared data and optional primitives live at `../../shared`.
  Exports: `profile`, `papers`, `featuredPapers`, `topics`, `researchThreads`,
  `paperSummary(paper)`, `paperHref(paper)`, `formatAuthors(paper, limit?)`,
  `papersForTopic(topic)`, `PaperDialog`, `PaperLinks`, `CitationButton`, `Arrow`,
  and the `Publication` type. Read the source for exact fields.
- Shared CSS provides a gentle baseline under `.design-surface`, local fonts,
  visible focus rings, reduced-motion support, and an optional paper dialog.
  Build your own layout and interactions; this is not a common page template.
- Font choices: `"Fraunces", Georgia, serif`, `"Bricolage Grotesque", sans-serif`,
  `"Geist", system-ui, sans-serif`, `"JetBrains Mono", monospace`, or native
  Georgia/Baskerville/Times for book typography. Use at most 2–3 per direction.
- React 18, strict TypeScript, unused locals/parameters are errors. Existing
  motion/react is available, but animation is optional. No new dependencies.

## Content and experience

- Site copy is natural English in Zekun's first person. The design chooser is
  separate and bilingual; don't put design-process commentary on the website.
- Show his name, actual position, Georgia Tech affiliation, research focus,
  real papers, actual email, CV and Scholar links. No fabricated news,
  affiliations, awards, dates, testimonials, images, statistics, or availability.
- Use `paperSummary` for accessible prose. Keep exact publication titles,
  venues, author identities, and outbound links.
- Actual interactions are required and must be useful: reading, filtering,
  chapter navigation, exploring relationships, or searching. No dead controls.
  Avoid navigation into the old website. CV `/cv.pdf` and real external
  resources are fine. On-page section anchors should be variant-prefixed.
- Paper browsing must retain access to the full 15-paper collection, even if
  the initial screen features only a selection.
- No stock headshot, fake personal photography, generic SaaS hero, card-grid
  filler, glass gradients, custom cursor, forced scrolling, loading animation,
  hover-only access, or automatically cycling content.
- Design intentionally for desktop (1440×1000) and mobile (390×844).
  Comfortable body text, 44px primary touch targets, clear focus states,
  semantic buttons/links, sensible heading hierarchy, no horizontal page overflow.
- Avoid artificial vertical gaps to fill the screen. Prefer distinctive
  composition, type hierarchy, custom SVG research graphics, and real content.
- All content is readable with prefers-reduced-motion. Use native scrolling.
- A small review switcher will sit at the viewport bottom-left, above the site.
  Leave ~64px bottom breathing room. No own design-switching controls.

## Independent directions

1. `01-folio` / `folio`: an editorial research periodical; asymmetric lead story,
   serif typography, masthead, reading columns, editorial feature + expandable
   full research archive. Warm paper, dark ink, restrained oxblood.
2. `02-atlas` / `atlas`: a navigable research map; a large node/relationship
   visualization is the organizing structure, with a topic inspector and an
   equally usable list view. Midnight ink, bone, sharp citron.
3. `03-monograph` / `monograph`: a small scholarly book; persistent contents,
   chapter-based reading, page navigation, margin notes and a bibliography.
   Quiet olive-gray book cloth and ivory pages; elegant book typography.
4. `04-workbench` / `workbench`: an interactive research laboratory; a simple
   concept-formation/learning illustration the visitor can manipulate, followed
   by real related work. Technical but welcoming, not a fake desktop or dashboard.
   Pale blue graph paper, ultramarine, coral, geometric sans.
5. `05-index` / `index`: a beautiful library catalogue; search and faceted
   publication discovery are the first-class layout, with a persistent compact
   identity sidebar and a paper reading pane. White, charcoal, cobalt, exact type.
6. `06-gallery` / `gallery`: a contemporary research exhibition; papers treated
   as curated visual exhibits with custom abstract SVG artworks, generous scale,
   useful previous/next controls, and an accessible full collection view.
   Chalk white, near-black, one expressive artwork color per research thread.
7. `07-timeline` / `timeline`: a research journey; branching chronological
   structure with year navigation and topic lenses shows how ideas evolve
   from 2022 to 2026. Terracotta, parchment, deep aubergine, strong flowing curves.
8. `08-dialogue` / `dialogue`: a question-led personal introduction; visitors
   choose meaningful questions and follow curated answers and paper trails.
   Clearly authored navigation, never a simulated AI chat. Expressive rounded
   typography, airy lilac and plum, conversational but academic.
9. `09-fieldnotes` / `fieldnotes`: a naturalist's research notebook; tabbed
   investigations with custom annotated diagrams, marginalia and pinned
   references. Botanical green, butter yellow, ink, tactile yet highly legible.
10. `10-quiet` / `quiet`: a radically reduced personal calling card; one composed
   initial screen with elegant micro typography, refined avatar-free identity,
   and deliberate expandable work/reading mode. Cool stone, dark navy,
   deliberate whitespace. It should feel personal and effortless, not empty.

These must differ in information architecture, navigation, density, composition,
and signature interaction—not simply palette or typeface.
