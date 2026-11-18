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
  drawing, which draws itself once and then plays the research directions in
  turn until the visitor chooses one, and an essay's opening figure, which
  plays once when it comes into view. Reduced motion shows both still.

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
in gray, both over `Landscape.tsx`. The question is `config.researchQuestion`:
"How can foundation models keep learning from a few samples and a few
interactions?". The owner's correction of 2026-11-16 is binding wherever the
research is described (home, About, the CV's Research Focus): it names
foundation models, not AI agents, and it says few samples and few
interactions. Under the question are the three research directions
(`.home-directions`), and each is a scene of the drawing (see below). A visitor must see at first glance whose
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
in rows: education, experience, service, recognition, photography. The internship is one
line in each place ("I'm also a Research Intern at Amazon", and role and
place in the record). The owner cut the description of the internship work on
2026-11-16: it made the page read as agent-harness research.

**CV** is the title, two actions, and the PDF. Phones get the two actions.
All CV links carry the current PDF content hash.

## The homepage drawing

`src/site/Landscape.tsx` draws a surface as evenly spaced ridges on a canvas.
Nearer ridges hide what is behind them. The owner asked on 2026-11-16 for
more animations that show the research directions, so the drawing has three
scenes, one per direction, in `src/site/scenes.ts`. The marks mean the same in
every scene: the blue point is the model and blue lines are its paths, a
hollow ring is a place the model already knows, a cross is what is new, and a
dashed line is what is not there or not taken. In every scene the pointer
moves what is new.

- **Continual learning.** The ring is where the model stood after the old
  tasks and the blue boundary is a trust region. Descent toward the new task
  follows a straight line until the boundary and then slides along it. The
  dashed line is the part of the way the model does not take.
- **Test-time adaptation.** A new task appears. Three samples arrive, the
  task's low-loss region forms on the surface, and the model reaches the task
  in three steps. The next task gives no samples: the model takes three
  steps of its own, and the name counts three interactions. This is the scene
  for "a few samples and a few interactions" in the question.
- **Compositional generalization.** The surface has a mode for every
  combination seen in training, on a three-by-three grid. A row shares one
  attribute value and a column the other. Three combinations are held out
  (dashed circles, nothing there). From the held-out query the model ascends
  to a prototype in its row and to one in its column and composes them: a
  mode forms at the query. The pointer chooses the held-out combination.

The directions are named under the question as three buttons
(`.home-directions`, `aria-pressed`). The point marks the one on the drawing,
as it marks the current page. The drawing moves to the next direction once a
scene has shown what it shows (about ten seconds each) and stops doing so
when the visitor chooses one. Pointing at the drawing holds the scene. When
the direction changes, the surface turns into the next scene's surface while
the marks of one scene leave and those of the other arrive.

The directions row lies over the far edge of the surface, where the ridges
are faintest, and takes no room from the drawing: `data-landscape-clear`
stays on the name and the question alone. Beside the introduction the
question's size follows its column so that it stays on two lines.

The marks are named on the drawing in the papers' terms ("old tasks", "new
task", "new task, 3 samples", "prototype", "held-out combination"), at 15px
in the muted color. A name takes the side its mark has free. These names
are the only words on the drawing. It has no caption: the owner removed one
on 2026-11-11 as small, defensive text. Do not add a caption, a legend, a
hint, or a disclaimer to it. Its accessible name describes the scene on it
as an illustration for people who cannot see it.

The drawing reads its colors from the tokens, pauses when it is off screen or
the tab is hidden, and plays its opening once per visit. With reduced motion
it shows the finished state of the chosen scene and does not move on.

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

## Traffic

The owner asked on 2026-11-17 for traffic counts, at no charge.
`src/lib/analytics.ts` counts with GoatCounter (hosted, free for a personal
site, no cookie, a script of about 3.5 KB). It counts every page once the page
has its title (`useBlogMetadata` calls `countPage`), under its path without
the query, and it counts the clicks that leave a page: a PDF (`pdf <file>`), a
link to another site (`out <host><path>`), the email address (`email`), and a
research direction chosen on the homepage (`direction <name>`, from
`data-count`). A link to another page of the site is not a click. It is the
next page.

The account's code is `analytics.goatcounter` in `src/data/config.json`. With
no code, nothing is loaded and nothing is sent. The script does not count
localhost. The site shows no counter and no consent notice. A browser is left
out of the counts by opening the site once with `#toggle-goatcounter`. Every
load of that address switches the state, so the site takes the fragment out of
the address once the script has switched (the owner asked for this on
2026-11-18, after a tab left on that address).

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
