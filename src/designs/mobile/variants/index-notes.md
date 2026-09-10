# Index / 目录

An academic directory within Book: a compact identity, visible subject index,
and closely spaced publication entries. The drawing sits beside the name;
education, advisor, and industry remain visible in adjacent records.
EB Garamond stays upright, Source Sans 3 carries the labels, and the personal
photography note retains normal Newsreader.

- Research topics use two equal columns in the original DOM order, with real
  counts, wrapping labels, and at least 48px high targets. Selection has a solid
  leading rule and weight change as well as color. No horizontal topic scroller.
- Venue is 16px; paper titles scale from 24 to 27px; full summaries are 20px.
  Natural paragraphs and the existing detail expansion remain intact.
- The shared navigation now receives `dockOffset={78}` for Index. The CSS dock
  starts at 8px and is 54px tall; Publications lands at 78px, leaving 16px below
  the dock. The actual route hands off immediately on the Publications jump.
  Motion transforms, activation, inert state, and focus hand-off remain in the
  shared component; this stylesheet only positions the existing dock.
- Optional integration variable: set `--index-top-inset` on the preview wrapper
  if a fixed comparison/review toolbar occupies the top. It offsets the opening
  identity, dock, and reading anchors together. If toolbar or safe-area insets
  add to the 78px clearance, the parent's observer offset should include those
  same insets. The resolved `#publications` scroll-margin-top provides that
  clearance. The current embedded route needs no extra height or spacing.
- The introductory appearance button also gets the reading scroll margin.
  Keyboard focus brings it below the dock and lets the shared observer return
  to the original navigation, keeping the focused control visible.
- About and Contact retain native dialogs. A flat, sticky toolbar keeps Close
  reachable while the 320px About copy scrolls. Its negative top inset accounts
  for the dialog's 18px padding; dialog scroll padding clears the 69px toolbar.
- Import after Book and common mobile CSS. All rules are scoped to the Index
  wrapper at widths below 1024px; Black and Paper use the existing color tokens.

Shared topic markup, routes, filtering, counts, and comparison behavior belong to
the parent integration. This variant introduces no content or dependencies.

Visually checked the actual `/mobile/index?edition=paper&embed=1` route and its
Black appearance at 320×700 and 390×844. All six topic selections, combined
search, zero results, reset, the top dock, About, and Contact were exercised.
Topic grid height stayed stable across selections; the query and topic reset
correctly, with focus returned to the 16px search field. No horizontal overflow
was found. Close remains visible at the end of About, and the photographer note
retains normal Newsreader. CSS parsing and mobile scope checks passed.

The earlier 767×900 Book preview was also checked with these Index styles.
Gallery integration, behavior tests, and final thumbnails remain with the parent.
