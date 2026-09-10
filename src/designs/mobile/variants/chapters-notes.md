# Chapters / 分章

An upright book cover and separate reading chapters, framed by a running name
and a persistent four-item contents line. This study gives Publications, About,
Contact, and CV their own reading space. It should feel like opening a chapter,
with the active page's position retained when returning to it.

## Visual decisions

- EB Garamond stays upright for the name, chapter titles, and reading copy.
  Source Sans 3 carries the navigation, affiliations, search, and venue lines.
  The photographer phrase uses upright Newsreader at almost the surrounding
  text size, as in the refined Book study.
- The cover keeps a centered block with left-aligned text. A thin horizontal
  rule separates the research introduction from parallel education and
  industry records. Short viewports reduce ornamental space first.
- Publications opens with a large title, the existing year range, and all six
  research topics in a two-column contents list. Topic names wrap naturally,
  counts use tabular numerals, and every option is at least 48px tall. Selection
  changes ink and underlines without changing font weight or element size.
- Venue lines stay 16px, including at 320px. Paper titles are 28px on typical
  phones and 26px on narrow phones; reading copy stays 20–22px.
- Search focus outlines the complete control, including its leading icon,
  without shifting the layout or drawing a second focus ring around the input.
  The native WebKit search-clear control retains its behavior and uses neutral
  ink. The normal search field returns to its single underline after blur.
- Paper and black reuse the Lens colors unchanged. Header and navigation use
  opaque page-colored surfaces, thin rules, and the existing Motion underline.
  There are no decorative page numbers, fake controls, fills on topic buttons,
  gradients, glass, or italic accents.

## Integration contract

Import `chapters.css` **after Book and mobile common CSS**. Every rule is scoped
to `.mobile-preview[data-mobile-study="chapters"] .quiet[data-study="lens"][data-edition]`
and at most 1023px wide. The stylesheet does not assign transforms, opacity,
visibility, positioning, overflow, or active-pane display rules.

The parent owns shell height, header/nav positioning and safe-area padding,
pane mounting and independent scrolling, focus, inert state, history, reduced
motion, and the moving navigation underline. Pane gutters and top spacing
belong to common CSS: the chapter reader removes the continuous page's leading
border, margin, and padding rather than adding a second layer of inset.

The navigation uses existing direct child links/buttons, also compatible with
a future `.quiet-nav-item` class. It has four tracks in a 1.45 / .85 / 1.05 / .65
ratio so “Publications” fits comfortably at 320px and CV retains a 44px target.
Common CSS should provide at least 272px of navigation width at a 320px
viewport and continue hiding the existing icon/caption DOM for text navigation.
Its common 560px maximum and automatic inline margins are preserved, keeping
the contents line centered on wider mobile viewports.

The shared search layout should span the single search field across the pane;
this variant only sets its type and spacing. Keep all six topic buttons in the
normal content flow. CV iframe sizing and interaction stay with the parent.
The existing theme button selector is `.still-appearance`.

## Local verification

The CSS parses successfully and all 90 rules stay inside the Chapters mobile
scope. The actual `/mobile/chapters?edition=paper&embed=1` route was reviewed in
local Chrome at 390×844 and 320×700, in Paper and Black. The final review used
the integrated shell with no browser-injected styles.

- The cover, Publications, a selected topic plus typed search, About, Contact,
  and CV were captured in both sizes and appearances: 24 visual states.
  All active panes are visible and stay between the header and bottom nav.
- Both covers fit completely in their available 715px / 571px reading regions.
  No horizontal page overflow, clipped topic names, overflowing affiliation
  copy, or overlapping navigation controls were found.
- All six topics fit their columns; topic targets measure at least 48px high,
  bottom-nav targets at least 44px wide and 52px high, and venues remain 16px.
  Selection stays underlined with no filled topic surface. Small counts retain
  5.27:1 contrast on Paper and 9.39:1 on Black after shared opacity is applied.
- About keeps EB Garamond reading copy and the upright Newsreader personal
  note. Its links remain reachable through the active pane's normal scroll.
  Contact's email and links fit at both widths. CV renders the actual PDF and
  exposes its Open PDF / Download actions.
- Search focus is visible around the entire control in both appearances,
  with no duplicate input outline. At 768px the 560px navigation measure is
  centered at x=104px.

Temporary review captures and metrics are under
`/private/tmp/chapters-visual-v2/`; these are not production thumbnails.
No whole test suites, build, shared source edits, or commits were run.

## Integrated CV sizing

The parent replaced the fixed viewport formula with a flex layout that gives
the PDF the space remaining below the chapter heading and actions. At 390×844
and 320×700, the outer pane's scroll height now equals its client height; only
the PDF needs to scroll. Short landscape viewports retain an outer scroll area
and a usable PDF minimum height. This geometry lives in `layout.css`.
