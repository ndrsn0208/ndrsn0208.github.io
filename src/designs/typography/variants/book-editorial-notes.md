# Book and Editorial

Both styles are scoped to their `.type-preview[data-typography]` wrapper and
the existing Lens surface. They inherit the approved black/Paper colors,
ink drawing, controls, and interaction behavior.

- **Book:** Upright EB Garamond for display, research statement, roles, titles,
  authors, and reading prose; Source Sans 3 for navigation and reference
  information. Upright Newsreader at a moderate weight distinguishes the
  photographer phrase without a handwritten accent. The restrained 60px name, balanced statement,
  29px paper titles, and 21–22px prose suggest a scholarly title page and essay.
  Desktop has a 1240px outer measure, 44/56 column proportions, a maximum
  488px introduction, and a 584px publication reading measure.
- **Editorial:** Newsreader for a stronger 74px masthead, calm upright deck,
  organization names, publication titles, and reading prose; Geist for precise
  roles and records. Italic section headings create a second editorial level.
  A maximum 540px introduction, even column proportions, and tighter paper
  spacing distinguish it from Book. Body prose is 19–21px.

Both intro-width formulas apply identically before and after a pane opens.
Neither stylesheet changes transforms, pane scrolling, dialogs, or dock layout.
Venue text stays at 16px in every viewport. Mobile padding overrides only the
bottom, allowing the review toolbar to retain ownership of the top inset.

Checked using the integrated routes and self-hosted fonts in local Chrome:
1440×1000 in both themes; 1024×600; and 390px/320px mobile layouts, docks, and
About dialogs. No horizontal overflow; intro width/vertical position stays
constant after opening Publications; right-pane scrolling leaves window scroll
at zero. Intro/dock controls are at least 44px in both dimensions. Book was also
checked at 1280×720. Font preloading and CSS import order remain the review
surface's responsibility. CV typography styles the surrounding heading and
actions; the embedded PDF retains its own typography.
