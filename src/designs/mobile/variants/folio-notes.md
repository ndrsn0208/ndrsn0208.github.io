# Folio / 书页

A continuous scholarly reading page: a quiet title page flows into an open
subject directory and generous, paragraph-like publication entries. The shared
544px maximum measure centers the reading column while all copy remains left
aligned. There are no cards, concealed topic controls, or horizontal topic lists.

Upright EB Garamond carries identity, research copy, and paper titles. Source
Sans 3 carries navigation, affiliation metadata, topics, and search. The personal
photography note retains normal Newsreader. All colors come from Lens variables,
including exact black and warm Paper.

Education and industry stay adjacent at 320px. Their role lines reserve the
same two-line height so Georgia Tech and Amazon begin at a shared baseline.
The opening navigation has four text destinations and a separate 44px appearance
target; its existing observation and animated dock hand-off remain in charge.

Research topics form a two-column subject directory with natural line wrapping,
small right-aligned counts, and at least 56px targets. Selection uses an underline
and stronger rule. All papers remains a separate, 44px action. Search occupies
the full reading width, followed by result/reset text. Paper titles are 29px
(27px below 360px), summaries 21–21.5px, and venues remain 16px.

About and Contact retain their native dialogs, styled as inset reading pages.
The close row remains visible while the dialog scrolls. No transforms or
visibility rules override the existing motion or inactive-navigation state.

## Integration contract

- Import `folio.css` after `book.css` and the common mobile stylesheet.
- Wrap the finalized Still studio in
  `.mobile-preview.type-preview[data-typography="book"][data-mobile-study="folio"]`.
- Keep Book's existing font loading; this variant introduces no font assets.
- Use the shared `.quiet-research-topics`, `.quiet-topics-heading`,
  `.quiet-topic-all`, `.quiet-topic-options`, `.quiet-topic-option`, and
  `.quiet-topic-count` markup from the mobile brief. Preserve `aria-pressed`.
- The integrated Lens reader uses the visible topic controls and a full-width
  search field. Routing, counts, filtering, comparison controls, and animation
  remain shared work.

## Integrated route review — September 10, 2026

Reviewed the actual `/mobile/folio?edition=paper&embed=1` route in Chrome at
320×700 and 390×844, plus 390×844 Black. These captures use the real Book font
loading, shared topic controls, search, reset, and native dialogs. Reduced motion
was enabled for stable visual evidence.

- Selecting continual learning and searching “Self-Consolidating Language
  Models:” produced `1 of 15 papers`. An unmatched query displayed the empty
  state. Clear search & filters emptied the input, selected All papers, and
  restored `15 papers · newest first`.
- Search, result count, and reset share the same left edge: 20px at 320px and
  approximately 24px at 390px. Result and reset stay on separate reading lines,
  without overlap. Reset retains its 44px target.
- The final CSS groups the focus outline around the entire search field,
  including its icon. The individual input outline yields to this visible group
  indicator. The reset × now shares the label's 14px size and 21px line height.
- All six topics remain visible and wrap naturally in two columns, with
  56–72px targets. Selection keeps Folio's transparent background and underlined
  text in both appearances. Venues remain 16px.
- The complete identity and affiliations fit above the opening navigation,
  which ends at approximately 561px on 320×700 and 596px on 390×844.
- About and Contact have a 24px opening gap between the header and title.
  At 320px, About was inspected at scroll offsets 0, 147, and 294px; its opaque
  sticky header and Close remained visible and above the reading copy. At 390px,
  the complete About dialog fits without an internal scroll. Newsreader remains
  upright in the photography note.
- Introduction, reader, empty state, About, and Contact have no horizontal
  overflow. PostCSS parses all 88 rules under the Folio scope and the outer
  `max-width: 1023px` query.

Final screenshots and measured bounds are under
`artifacts/mobile/folio-integrated/refined/`, including
`integration-review.json`, `320-paper-selected-search.png`,
`390-paper-selected-search.png`, and the `about-top`, `about-middle`,
`about-end`, and `contact` captures for each reviewed size/appearance.

An earlier isolated check also confirmed identical Book dimensions and type at
a stable 1440px viewport with and without Folio CSS. No full suites or build
were run for this visual refinement. Parent behavioral tests and production
thumbnail capture remain separate.
