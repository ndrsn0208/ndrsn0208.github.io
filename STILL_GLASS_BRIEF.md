# Still — Liquid Glass studies

This records the earlier material exploration. The current Lens homepage follows
[STILL_MINIMAL_BRIEF.md](STILL_MINIMAL_BRIEF.md): minimal, humanist, and without
glass treatments.

The accepted base is a centered content area with **left-aligned text**. Publications,
About, Contact, and CV belong with the introduction. Education and industry
experience remain explicit. In the selected Lens design, these records sit side
by side with consistent levels for role, institution, and dates. Black is `#000000`;
Paper is `#f5f1e8`. Both are appearances of every design.

## References actually inspected

- [Apple Materials HIG](https://developer.apple.com/design/human-interface-guidelines/materials):
  glass is a functional layer for navigation and controls, used sparingly.
  The regular material protects text contrast; clear glass belongs over rich
  backgrounds. Prefer standard surfaces for reading content.
- [Apple Liquid Glass overview](https://developer.apple.com/documentation/technologyoverviews/liquid-glass):
  establish hierarchy, consistent navigation, and predictable action placement.
- [Apple design announcement](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/):
  specular highlights, optical depth, concentric geometry, and fluid transitions.
- [Microsoft AI](https://microsoft.ai/), provisionally interpreted as the user's
  MAI reference: large humanist serif typography, generous editorial pacing,
  soft organic moving imagery, and a quiet practical navigation layer. Adapt
  these principles to a personal academic site; do not copy branding or assets.

Reference captures are in `artifacts/references/`.

## Three independent compositions

1. **Lens / 透镜** — an intimate reading column, restrained serif typography,
   a small optical orbital emblem, and one sculpted glass navigation capsule.
   The introduction flows directly into the complete Publications list. The
   navigation scrolls to this existing section; there is no separate recent-paper
   teaser or hidden reader. Paper titles link directly to the original paper.
   Lens is now the approved homepage at `/`. When its introductory navigation
   leaves the viewport above, the four destinations appear in a compact glass
   dock with measured spring motion. It returns to the introduction when that
   navigation reappears. Public pages omit the design-selection bar.
2. **Drift / 流动** — a broader humanist editorial composition, flowing ink-line
   artwork, asymmetrical elements balanced inside a centered page, and a glass
   ribbon for navigation. This is the strongest MAI influence.
3. **Frame / 取景** — an architectural academic index, confident sans typography,
   a precise graphic frame, aligned label/value records, and four tactile glass
   navigation cells. It should feel substantially different from Lens and Drift.

## Shared implementation contract

The parent owns routing, mode consolidation, working interactions, common
glass material, appearance switch, comparison controls, tests, and integration.
Each delegated designer owns only its named CSS and artwork component.

- Root: `.quiet[data-study="lens|drift|frame"][data-edition="black|paper"]`.
- Existing markup lives in `src/designs/variants/10-quiet/index.tsx`.
- Existing styles load first, then common `glass.css`, then study styles.
- `.quiet-home.quiet-shell` contains `.quiet-emblem`, `.quiet-introduction`,
  and, outside Lens, `.quiet-recent`. The emblem contains the study's exported artwork.
- `.quiet-introduction` contains `.quiet-eyebrow`, `h1#quiet-name`,
  `.quiet-intro`, `dl.quiet-background`, and `.quiet-navigation`.
- `.quiet-background` retains Education followed by Industry experience.
  Each record has `dt`, `dd`, `.quiet-experience-role`,
  `.quiet-experience-meta`, and optional `.quiet-advisor`. Lens uses parallel
  columns on desktop and phones, with the advisor retained in About.
- `.quiet-navigation` wraps `.quiet-nav.quiet-primary-nav.still-glass` and
  `.still-appearance.still-glass` (a 44px theme button). The reader has
  `.quiet-navigation.quiet-navigation-reading` with `.quiet-reading-nav` outside
  Lens. Lens uses one visible navigation and native, smooth section links with
  keyboard focus and reduced-motion support. The active navigation surface can
  be inline or in the bottom dock; the inactive one is hidden and inert.
- Each nav action has `.quiet-nav-label`, optional `.quiet-nav-caption`
  (hidden by default), and spring-animated `.quiet-nav-indicator`.
- Parent provides all glass optics: backdrop filtering, specular edge,
  pointer-reactive highlight, readable tint, keyboard/touch feedback, and
  reduced motion/transparency fallbacks. Designers tune `--glass-radius`,
  geometry, and spacing, rather than reimplementing these behaviors.
- The artwork is a default React export in
  `src/designs/still/studies/{lens,drift,frame}/Artwork.tsx`, no required props.
  It is decorative, native SVG/CSS, and may use `useId` for SVG definitions.
  No external libraries, images, fake charts, fake research facts, or timers.
- Scope study CSS under its root selector; animations must be scoped and
  respect reduced motion. Never style the other studies or shared controls.
- Protect actual reading, native dialogs, focus, search, details, CV links,
  and citations. Avoid overriding hidden sections.
- At 390px the introduction, actual education/industry records, and main
  navigation should fit comfortably around the first screen. Support 320px.
- At 1440px, centered content should feel deliberately composed. Whitespace
  is welcome; huge empty decoration above the identity is not.
- All text is left aligned. Do not put navigation in the top-right corner.
- Avoid a card around every paragraph, giant color glows, gradients across
  the page, blurred body copy, or glass effects applied to entire reading areas.
- Parent keeps the original nine studies and earlier Still base accessible.
  This iteration's visible Still choices are Lens/Drift/Frame × Black/Paper.
  The archived selection bar requires an explicit `review=1` preview.

## Dock motion

Use the installed `motion/react` package: a persistent surface with controlled,
reversible spring entrances and exits, plus the existing shared-layout selection.
Keeping the surface mounted lets rapid scroll and keyboard changes interrupt an
exit without a delayed unmount removing the navigation. The viewport
observer checks whether the original navigation is above the screen, so an
introduction below the fold does not accidentally activate the dock. A small
return threshold avoids flickering near the edge.

The dock respects reduced motion, increased contrast, reduced transparency,
safe-area insets, and the mobile search keyboard. A dialog retains its original
trigger until closing. Focus transfers to the inline counterpart if a focused
dock returns to the introduction. Footer padding keeps the final links reachable.

Implementation references:
[scroll animations](https://motion.dev/docs/react-scroll-animations),
[spring transitions](https://motion.dev/docs/react-transitions).
