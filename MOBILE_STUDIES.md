# Book on mobile

Three interactive phone studies extend the upright Book typography and reuse
the real profile, publications, search, PDF, and Black/Paper appearances.
**Chapters is the selected mobile layout at `/`.** The desktop homepage retains
Book's centered introduction and independently scrolling right pane.

| Study | Route | Reading experience |
| --- | --- | --- |
| Folio / 书页 | `/mobile/folio?edition=paper` | Continuous book-like reading, spacious entries, adaptive bottom navigation |
| Index / 目录 | `/mobile/index?edition=paper` | Compact introduction, an open subject index, adaptive top navigation |
| Chapters / 分章 | `/mobile/chapters?edition=paper` | Separate full-height pages with persistent bottom navigation and independent scrolling |

Start at `/mobile` to compare the three. On a desktop, each preview is a real,
interactive 390×844 iframe. Appearance and reading-position controls send
validated same-origin messages to the existing frames, preserving their mounted
readers, search, and details. On a phone, preview images link to the full pages.
Individual study routes also show a phone frame on desktops; `embed=1` renders
the actual page directly for frames, screenshots, and browser checks.

All mobile variant CSS is scoped to its study wrapper below 1024px. The default
desktop split composition remains available in each underlying page at desktop
widths. Preview controls belong to the review pages, not the actual phone UI.

## Visible research directions

Lens and its Book/typography previews show all six canonical research topics
immediately below the Publications heading. Each topic filters the real paper
list alongside text search; selecting it again clears that topic. All papers
clears only the topic, while Clear search & filters resets both. Counts refer
to all papers tagged with that topic and stay stable during searching.

`src/designs/still/ResearchTopics.tsx` reads the existing topic list and
publication tags. It does not change generated publication data or add topics.
Legacy archived designs retain their existing topic selector.

## Interaction ownership

- `Quiet` owns search, details, hash navigation, and shared content.
- `SplitPane` retains each chapter's DOM and scroll position and makes inactive
  readers inert. Desktop and Chapters use the same reading components. While
  panes are active, browser scroll restoration is manual so Back does not reset
  a retained reader to its heading; the previous policy is restored on exit.
- `mobile/layout.css` owns the Chapters shell, safe areas, scroll containers,
  visibility, and persistent navigation.
- The three `mobile/variants/*.css` files own typography, spacing, and visual
  hierarchy. They import after Book and the shared mobile layout.
- Index passes a 78px top inset to `AdaptiveNavigation` so the hand-off happens
  before the original row collides with the top navigation. Other layouts retain
  the original activation point.

Transitions use the existing Motion package and respect reduced motion. The
mobile studies reuse Book's self-hosted fonts and add no runtime dependency.

## Review and verification

With the development server running:

```sh
npm run mobile:screenshots
npm run test:designs -- tests/research-topics.spec.ts tests/mobile-studies.spec.ts tests/still-split.spec.ts tests/typography.spec.ts
npm run build
```

Screenshots used by the phone overview live in `public/mobile-thumbnails/`.
About pages, comparison screenshots, and layout samples live in the ignored
`artifacts/mobile/` directory. Browser checks exercise the real topic filters,
combined search, 320px layouts, chapter history and focus, retained reading
positions, interrupted animations, and live comparison frames.
