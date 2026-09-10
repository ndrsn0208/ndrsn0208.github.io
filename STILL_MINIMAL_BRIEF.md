# Book + Chapters — minimal, humanist

The homepage at `/` starts with a centered introduction and left-aligned text.
Education, including the linked PhD advisor, and Amazon experience remain side by side. On desktop, opening a
destination moves this introduction left and reveals the content on the right.
Black is `#000000`; Paper is `#f5f1e8`.

About contains two short research-vision paragraphs and a personal photography
note. The vision condenses `_pages/about.md` from `origin/archive-old-site`,
connecting learning from limited experience and recombining knowledge to the
current focus on adaptation after deployment. The copy and advisor/photography
links live in `src/data/config.json`.

## Visual direction

- Upright EB Garamond gives the name, introduction, paper titles, and reading
  copy a scholarly voice. Source Sans 3 keeps roles, dates, and navigation clear.
- Publication venues and years use 16px medium-weight Source Sans 3 on desktop and
  phones, with the reading-copy color for clear contrast.
- Upright Newsreader gives “semi-professional photographer” a subtle distinction
  from the reading copy. The font is self-hosted; there is no handwriting accent.
- A small drawing of two open contours replaces the glass sculpture.
- Navigation uses plain text and one moving underline. The appearance control
  is a simple sun/moon icon.
- The mobile chapter navigation has an opaque surface, a fine border, and four text
  destinations. It has no glass blur, reflection, gradient, raised selection,
  or shadow.
- Mobile destinations are full-height reading chapters. Reading and form
  controls use fine rules and restrained corners.

## Desktop interaction

At widths of 1024px and above, the introduction begins in the center of the
viewport. Publications, About, Contact, and CV each open a right-hand pane.
Motion moves the original introduction without changing its width, font size,
or line breaks; the content fades in shortly after the movement begins. A fine
vertical rule separates the two columns. There are no desktop modals or dock.

The right pane is the scroll container. The page and introduction stay still;
on exceptionally short windows the introduction can scroll within its own
bounds so every control remains reachable. About and Contact appear as reading
pages. CV embeds the real PDF and provides separate open/download links.
The close control stays above the scrolling content.

Panes remain mounted, preserving scroll position, search, filters, and expanded
paper details. Switching back to a scrolled reader focuses its region without
scrolling it to the top. Close or Escape returns the introduction to the center
and restores focus to the selected navigation control. The four destination
hashes support direct links and browser history. Appearance changes preserve
the active destination. Reduced motion makes these changes immediate.

`SplitPane.tsx` and `split-layout.css` implement this composition; the shared
Quiet component owns the reader and navigation state.

## Mobile interaction

Below 1024px, Chapters presents a centered introduction followed by four
full-height reading panes. A running header and persistent bottom navigation
frame the active page. Selecting a destination fades it into place with a small
vertical movement; active text is marked with a moving rule. Selecting the name
in the header or pressing Escape returns to the introduction.

Keep each pane mounted, preserving its scroll position, filters, and paper
details. Inactive panes are inert. Browser Back/Forward changes chapters without
resetting their readers; switching appearance preserves the active chapter.
CV previews the real PDF with separate open/download links. Preserve keyboard
focus, safe areas, and reduced-motion support.
Public pages have no design-selection bar.

The original Lens, continuous phone layout, and native dialogs remain in archived
Still and typography previews. The three phone alternatives are at `/mobile`.

The earlier material experiments and their reference research are recorded in
[STILL_GLASS_BRIEF.md](STILL_GLASS_BRIEF.md).
