# Lens typography studies

Four alternatives refine the approved Lens composition. They share the real
profile, publications, Black/Paper palette, drawing, and interactions.
**Book is selected for `/`, paired with Chapters on phones.** The review routes
retain all four studies and the original Lens for comparison.

| Study | Lead typeface | Supporting type | Direction |
| --- | --- | --- | --- |
| Lens / original | Fraunces | Geist | Original reference |
| Book | EB Garamond | Source Sans 3, Newsreader | Scholarly book, measured serif reading |
| Editorial | Newsreader | Geist | Literary periodical, distinct headline hierarchy |
| Humanist | Source Sans 3 | Newsreader | Open humanist sans, reflective serif reading |
| Poem | Cormorant Garamond | Newsreader, Source Sans 3 | Airier literary display and whitespace |

Book uses upright type throughout its introduction and reading copy. The
photographer phrase uses upright Newsreader at a moderate weight, giving the
personal note a subtle distinction from the EB Garamond prose.

Start at `/typography`. Each card opens an interactive preview; the comparison
page shows two independently usable versions with a desktop or phone viewport.
The comparison's reading-position selector opens desktop panes or scrolls the
phone publication list. Phone About/Contact dialogs open through their normal
navigation controls inside either preview.

Examples:

- `/typography/book?edition=paper&review=1`
- `/typography/editorial?edition=black&review=1#publications`
- `/typography/humanist?edition=paper&review=1#about`
- `/typography/poem?edition=black&review=1`
- `/typography/compare?left=original&right=book&edition=paper`

The small review toolbar only appears with `review=1`. Removing it gives the
normal uninterrupted page. Switching typography retains the existing reader,
search, and expanded publication details. The selected fonts load before the
visual transition, and the browser's reduced-motion preference is respected.

The route reuses `StillStudio` inside a `.type-preview` wrapper. All variant CSS
is scoped to that wrapper. `src/Homepage.tsx` imports only Book and Chapters
styles for the public page, with no review controls. Returning from another
typography preview restores the selected Book homepage.
Fonts and original OFL licenses are in `public/fonts/typography/`.

## Refresh previews

With the development server running:

```bash
npm run type:screenshots
```

This captures real homepage thumbnails for both appearances and saves full About
panes plus typography measurements under the ignored `artifacts/typography/`.

```bash
npm run typecheck
npm run build
npm run test:designs -- tests/typography.spec.ts tests/still-split.spec.ts
```

The checks cover split reading, typography changes without lost state, mobile
dialogs, small-screen overflow, real comparison frames, and isolation from the
approved homepage.
