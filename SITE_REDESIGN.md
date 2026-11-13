# Research website design

This is the November 2026 design. It replaces the October editorial design
(serif reading text, a homepage that restated every other page, a news list,
and clusters of small links). The owner asked for a site that is minimal,
conceptual, forward-looking, and clean, with logical interaction and one
visual language on every page.

## Concept

**One space, one path.** The research asks how a model can move toward a new
task without leaving the region where earlier tasks still work. The site uses
that picture everywhere. The page is a white parameter space. A blue point
marks where you are. Blue lines are paths. Everything else is black type and
hairlines.

The one bold element is the homepage drawing. Every other part is quiet.

## Tokens

`src/site/site.css` owns them. Every page inherits them.

| Token | White | Black | Role |
|---|---|---|---|
| `--site-paper` | `#ffffff` | `#000000` | The page |
| `--site-ink` | `#000000` | `#ffffff` | Display, titles, active states |
| `--site-body` | `#262626` | `#dcdcdc` | Long prose |
| `--site-muted` | `#666666` | `#9a9a9a` | Secondary text |
| `--site-rule` | `#e5e5e5` | `#262626` | Hairlines |
| `--site-surface` | `#f5f5f5` | `#121212` | Rare fills, such as a citation block |
| `--site-accent` | `#0071e3` | `#5eacff` | Position and path, nothing else |

Orange and the other scientific colors keep their meaning and appear only inside
figures. Do not introduce cream, warm grays, gradients, shadows, or glass.
The stored edition key remains `paper` for compatibility.

## Type

One family, self-hosted Geist (`--site-sans`). `--site-serif` is an alias of it
so earlier figure styles resolve to the same face. Four sizes:

- **Display** `--site-display`: one statement per page, weight 360, tight tracking.
- **Title** `--site-title`: names of things, such as papers, essays, and the lead paragraph.
- **Text** `--site-text`: explanation and controls.
- **Note** `--site-note`: 15px annotations in the muted color.

Nothing is set below 15px. No all-caps labels, no monospace labels, no
label above a heading, no middle-dot strings, no decorative arrows. BibTeX is
the only monospace text. Scientific arrows that describe a process stay.

## Interaction

The same rules hold on every page.

- **The point is position.** A blue point precedes the current navigation item,
  the active topic, and the chapter being read. An open record's control turns
  blue. In the homepage drawing the point is the model.
- **A title opens its target.** A paper title opens the paper. An essay row
  opens the essay.
- **A plus opens details in place** and turns to a cross: a paper's summary and
  links, a figure's notes, sources, and link. Share is one word that opens its
  options in place, in an essay's opening.
- **Hover only changes color.** Nothing appears only on hover.
- **No explaining text.** Do not add captions, hints, legends, update dates,
  reading times, or disclaimers. If something needs a sentence to be
  understood, redesign it. Essay figures have no captions either: names sit on
  the drawing and conditions go behind the plus.
- **Motion answers the visitor.** The only unprompted motion is the homepage
  drawing, which draws itself once and then drifts slowly, and an essay's
  opening figure, which plays once when it comes into view. Reduced motion
  shows both still.

## Layout

- `.site-container` is the 1280px measure with a fluid gutter. Essays use the
  same measure, a 720px reading column, and figures up to 1000px wide.
- Everything is left aligned to one edge. The right edge carries one piece of
  metadata, such as a venue or a date.
- Every list is `.site-list`: rows between hairlines. `.site-row` is a title
  and one piece of metadata.
- The header stays in view. It holds the name, which leads home, four words
  (Papers, Writing, About, CV), and the appearance switch, so the appearance can
  change without leaving the reading position. The footer holds the email and
  three profiles. The band under the footer is left free for the playground
  launcher.

## Pages

**Home** opens with the name, very large, and the research question under it
in gray, both over `Landscape.tsx`. A visitor must see at first glance whose
page this is, so the name is the largest thing on the site and is never
reduced to the header alone. While that name is in view the header does not
repeat it. The header's name appears once the large one has scrolled away
(`nameAnchor` on `SiteFrame`). Beside the name, level with its capitals, sits
a short introduction (`.home-bio`): a bio in the first person ("I'm a
third-year PhD student ... Prior to that, ...", the form the owner asked
for), one sentence on the research, and the research interests from
`config.researchInterests`. The
owner asked for it on 2026-11-13: an academic site should say who this is and
what the research is about as soon as it opens, without losing the clean
opening. The owner's correction to my first try is binding: the name must stay on
one line and the drawing must not get smaller. So the drawing's room is
computed from the name and question alone (`data-landscape-clear` is on
`.home-lead`), the name does not wrap, and the introduction is three short
paragraphs at 17px and no more. From 1240px it sits beside the name. Below
that it follows the drawing, and the drawing gives up 9.5rem of height so
that the introduction begins on the first screen. Below the drawing are News, six
selected papers, and the three essays. The
owner wants News on the homepage. It renders `src/data/news.json` as rows: a
sentence at text size and its month. Home does not restate About.

**Papers** (`/publications`) is one list by year. A row shows title, authors,
and venue. The plus opens the summary, links, and BibTeX. Six topics and a
search field filter the list, and the address keeps both. Use the generated
catalog. Published work, accepted papers, and preprints share one timeline
ordered by `publicationDate`.

**Writing** (`/blog`) lists the essays as rows defined in
`src/blog/essay-figure.css`: the essay's own drawing, its name, its headline,
the date. "Keep reading" at the end of an essay uses the same row. Names and
headlines in `src/site/essays.ts` repeat `article.ts`. Change both together.

**Essays** share one layout and one figure frame. An essay opens with what the
work is called and what it does, the authors, the paper link, and Share. Then
come the opening figure, a three-paragraph summary, and sections whose
headings state what they show. The outline stands to the right and marks the
section with the point. The trust region essay is drawn on the homepage's
landscape, through `src/site/terrain.ts`. Essay text follows the writing rules
in `BLOG.md`: the papers' terms, one term per concept, no slogans, no
defensive writing.

**About** is the biography in large type, the research vision, and the record
in rows: education, experience, service, recognition, photography.

**CV** is the title, two actions, and the PDF. Phones get the two actions.
All CV links carry the current PDF content hash.

## The homepage drawing

`src/site/Landscape.tsx` draws a loss surface as evenly spaced ridges on a
canvas. Nearer ridges hide what is behind them. A hollow ring is the earlier
solution, the blue boundary is a trust region, the cross is a new task under
the pointer, and the blue point is the model. Descent toward the task follows
a straight line until the boundary and then slides along it. The dashed line
is the part of the way the model does not take. With no pointer the task
drifts on its own.

The drawing has no caption. The owner removed it on 2026-11-11 as small,
defensive text: the hero is the question and the drawing, and the drawing
explains itself when the pointer moves. Do not add a caption, a legend, a hint,
or a disclaimer to it. Its accessible name still describes it as an
illustration for people who cannot see it.

The drawing reads its colors from the tokens, pauses when it is off screen or
the tab is hidden, and plays its opening once per visit.

## Shared implementation contract

- `src/site/SiteFrame.tsx` owns the header, footer, appearance, and scroll
  restoration. It accepts `children`, `page` (`home`, `publications`, `blog`,
  `about`, `cv`), optional `mainId`, and optional `initialAnchor`.
- `SiteLoading` is the frame shown while a page's code loads. A page hands the
  root appearance to the next page or to this frame in the same commit. The
  root must never fall back to the archived studies' black default between two
  site pages. `tests/site.spec.ts` checks this.
- `useSiteTheme()` returns `{ edition, toggleEdition, href }`. `href` keeps the
  target's query and fragment and adds the current `edition`. Canonical share
  URLs omit appearance parameters.
- Base rules in `site.css` use `:where()` and carry no specificity, so a
  component class can restate margin, color, or weight without a fight.
- Keep keyboard navigation, real links, visible focus, safe mobile gutters,
  reduced motion, and static states for animated media.
- Public prose is continuous and plain. No semicolons, em dashes, inflated
  claims, fabricated facts, or claims of perfect retention.

## Routes and delivery

Keep `/`, `/publications`, `/blog`, `/about`, `/cv`, `/photography`, both
essay slugs, every figure page under `/blog/<essay>/figures/`, and the earlier
figure addresses listed as `aliases` in the essays. Preserve the GitHub
Pages deep-link handoff. Older homepage hashes resolve to useful sections or
pages: `#cv`, `#about`, `#education`, `#contact`, `#writing`,
`#selected-publications`. Figure pages keep their own HTML metadata and PNG
cards. `scripts/build-site-pages.mjs` and
`scripts/build-blog-pages.mjs` write the no-JavaScript fallbacks, which follow
the same palette and labels.

Do not publish private `writing/` sources, local research evidence, screenshots,
or test artifacts. The latest hosted PDFs and current CV must not be replaced
with earlier versions.

## Optional adaptation playground

The normal website remains the default. `Adapt this website` opens a local
playground for destruction, drawing, procedural diffusion, text editing, and
layout changes. Its enabled state and page edits belong to this browser.
No visitor changes are uploaded or applied to other visitors.

The launcher is a quiet pill in the bottom corner, outside `.site-shell`. On
phones it shows its mark only. The playground loads only on entry. Browse
preserves normal interactions. Exit restores the authored DOM and disables
automatic entry without deleting saved edits. The controls themselves must
never be destructible. See `ADAPTATION_PLAN.md` for the interaction and
resource limits, and run `npm run test:adaptation` for its regression checks.

## Checks

- `npm run typecheck`, `npm run build`, `npm run test:adaptation`.
- `npx playwright test tests/site.spec.ts tests/blog.spec.ts`.
- The specs under `tests/` for `still`, `typography`, `mobile`, and `designs`
  cover the archived studies, not the live site.
