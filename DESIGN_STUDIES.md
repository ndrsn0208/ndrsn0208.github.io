# Ten academic website design studies

Run `npm ci`, then `npm run dev`. Open
**http://localhost:5173/designs** for the chooser.

Each study is a complete interactive exploration using the same real profile and
15 publications. The chooser includes favorites, direct links, and an interactive
side-by-side comparison at desktop or mobile sizes. Favorites remain in your
browser's local storage.

| Route | Direction | Main way of exploring |
| --- | --- | --- |
| `/designs/folio` | Folio — academic periodical | Read an editorial selection, then explore the archive |
| `/designs/atlas` | Atlas — research map | Select a concept to find connected papers |
| `/designs/monograph` | Monograph — a small book | Jump between chapters and the bibliography |
| `/designs/workbench` | Workbench — research laboratory | Manipulate a conceptual illustration, then read related work |
| `/designs/index` | Index — library catalogue | Search, filter, and read papers in a dedicated pane |
| `/designs/gallery` | Gallery — research exhibition | Browse curated visual exhibits and the full collection |
| `/designs/timeline` | Continuum — research journey | Follow years and focus through a topic lens |
| `/designs/dialogue` | Dialogue — question-led introduction | Choose a question and follow an authored reading path |
| `/designs/fieldnotes` | Fieldnotes — research notebook | Explore annotated investigations and their references |
| `/designs/quiet` | Still — personal calling card | Move from a concise introduction to a focused publication reader |

## Still: the selected Lens design and retained explorations

The approved homepage is now **http://localhost:5173/**, using Lens with Black
and Paper appearances in a minimal, humanist style. It has no design-selection bar.
On desktop, opening any of the four destinations moves the introduction from
the center to the left and reveals the right pane. The reader scrolls independently;
switching destinations retains its position, search, and expanded details.
About and Contact are inline panes, and CV previews the actual PDF.
On phones, the four destinations move into an opaque text dock once the
introductory navigation has scrolled above the viewport. Native dialogs remain.

Open **http://localhost:5173/still** for the retained explorations. The initial design is Lens / Black;
subsequent visits remember the design and appearance. Explicit `?study=` and
`?edition=` links take precedence. Black and Paper are the two retained
appearances; old Stone and Line links resolve to Paper.

| Route | Design | Composition |
| --- | --- | --- |
| `/still?study=lens&edition=black` | Lens | Humanist serif reading, parallel profile records, an ink drawing, and plain text navigation |
| `/still?study=drift&edition=paper` | Drift | Humanist editorial composition, a flowing contour, and glass ribbon navigation |
| `/still?study=frame&edition=black` | Frame | A precise academic index, structured records, and four tactile glass cells |

Every design centers its composition and keeps text left aligned. Publications / About /
Contact / CV sit with the introduction. The adjacent sun/moon control switches
appearance in clean previews as well as the review studio. Black has exact
`#000000` page and reading surfaces; Paper has a warm `#f5f1e8` background.
The current direction is in [STILL_MINIMAL_BRIEF.md](STILL_MINIMAL_BRIEF.md).
Earlier material references are in [STILL_GLASS_BRIEF.md](STILL_GLASS_BRIEF.md).
The previous Still base remains available at `/designs/quiet`.

The homepage directly lists PhD, Computer Science, Georgia Tech,
2024–2029 (expected), followed by Industry experience: Research Intern, Amazon.
Lens arranges education and industry side by side on desktop and phones, with
distinct role, institution, and date typography. All 15 publications appear in
the desktop right pane or beneath the introduction on phones. Paper titles
open their sources, and details expand in place. `#publications` works as a
direct link in both layouts. There is no recent-paper teaser.
Research is described as “I study continual learning for deployment-time
adaptation and generalization.” These records live in `src/data/config.json`.

Lens uses flat surfaces, a fine underline for selection, and an opaque bottom
navigation. Its diagram, controls, and dialogs have no glass blur or highlights.
The archived Drift and Frame studies retain their earlier glass treatments.

Initial content appears in a short stagger. Navigation has subtle selection and
press feedback. Lens uses a Motion position animation and persistent right
panes on desktop; phones use native section scrolling and a restrained,
scroll-triggered text dock. The other
designs' introduction/reader changes, design and appearance changes, browser
history, and review-bar changes use View Transitions with a Web Animations fallback.
Dialog entrances and exits retain the native focus trap and restore focus after
closing. Publication details animate their measured height and can reverse
mid-animation; filtering animates departing results and removes them from keyboard
navigation. System reduced-motion preferences are respected throughout.
Motion is implemented in `StillNavigation.tsx`, `transitions.ts`, `motion.css`,
and the Quiet component.

The archived review bar is available only with `?review=1` on `/still`. It
switches designs and appearances while keeping the current reader, search,
filters, and expanded papers. It can be collapsed. The comparison
button opens independently interactive desktop or phone previews; for example:
`/designs/compare?left=quiet&right=quiet&leftStudy=lens&rightStudy=drift&leftEdition=black&rightEdition=paper`.
Regular Still links already omit review controls; `&embed=1` additionally
keeps embedded comparisons from changing saved preferences.

All editions use the same accessible Quiet component and real publication data.
The edition styles and preview integration live in `src/designs/still/`.
The HTML bootstrap matches the selected background before React loads, including
the GitHub Pages deep-link hand-off.

```bash
npm run test:designs -- tests/still.spec.ts tests/still-motion.spec.ts tests/still-dock.spec.ts tests/still-split.spec.ts
npm run still:screenshots
```

Still screenshots and a six-appearance contact sheet are written to
`artifacts/still-glass/`. The browser checks cover all six combinations on desktop and
mobile, 320px widths, WCAG AA checks, pure-black surfaces, reader continuity,
saved preferences, direct section links, back navigation, and independent comparisons. Motion checks
also run with animations enabled on desktop and mobile, including interrupted
dialogs, repeated expansion, smooth section scrolling, rapid appearance changes,
the browser fallback, and interrupted dock entrances and exits. Dock checks also
cover the finalized homepage, viewport hand-off without layout shifts, all four
destinations, focus restoration, and narrow screens in both appearances.

## Content and implementation

Lens is the selected homepage at `/`; legacy detail routes remain available.
Studies are isolated under `src/designs/`.
Variant modules and their styles load on demand. Each variant has its own
composition, navigation, interaction, and CSS namespace.

`src/data/config.json` and `src/data/publications.json` remain the source of truth.
`src/designs/shared.tsx` adapts this content, adds readable editorial summaries,
and provides optional accessible publication dialogs. Conceptual illustrations
are explanatory graphics, not reported experimental results.

Local variable fonts and their licenses are in `public/fonts/`. There are no
remote font or image dependencies for the studies.

The finalized site and retained studies deploy from `master` through GitHub
Actions. Opening a local preview does not publish a deployment.

## Verification and screenshots

```bash
npm run typecheck
npm run build
npm run test:designs
npm run design:screenshots
```

Browser verification uses a locally installed Google Chrome and Playwright.
It checks desktop and mobile layouts, real resource links, runtime errors,
accessibility, and the chooser/comparison flow. `DESIGN_BASE_URL` can point the
tests or screenshot script to a different running local server.

Screenshots are saved to the ignored `artifacts/designs/` directory. Compressed
chooser thumbnails are saved to `public/design-thumbnails/`.
To refresh only selected directions:

```bash
npm run design:screenshots -- --only=folio,atlas
```
