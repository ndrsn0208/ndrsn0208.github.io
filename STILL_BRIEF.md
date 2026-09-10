# Still refinements

Historical brief for the earlier four-edition exploration. The current
Black/Paper design system and three Liquid Glass compositions are specified in
[STILL_GLASS_BRIEF.md](STILL_GLASS_BRIEF.md).

Latest user direction: center the introduction's container while keeping all
text left-aligned. Work / About / Contact / CV sit directly below it and share
the text's left edge. Do not center individual lines. This supersedes the asymmetric home
compositions in the original edition briefs below. The shared layout is
implemented in `src/designs/still/centered.css`.

The user chose Still, wants variations within its quiet academic identity,
including a genuinely pure-black theme. They supplied updated content:

> Education: PhD, Computer Science, Georgia Tech, 2024–2029 (expected).
>
> Industry experience: Research Intern, Amazon.
>
> I study continual learning for deployment-time adaptation and generalization.

The user explicitly supplied the Research Intern role. Do not invent an Amazon
team, location, or internship dates. The homepage now displays structured
education and industry records in place of the earlier short bio.

The latest interaction direction asks for restrained, Apple-like motion.
Animate page and edition changes, entrances, dialogs in both directions,
publication expansion, filtering, and navigation feedback. Retain the centered
column and left-aligned content. Keep interactions responsive during animation
and honor reduced-motion preferences.

## Parallel design contract

Each designer owns ONE edition CSS file under `src/designs/still/`.
Do not edit the base Quiet component, base CSS, shared data, entry points,
dependencies, or another designer's file. Do not commit.

The component is `src/designs/variants/10-quiet/index.tsx`.
The existing base CSS is `src/designs/variants/10-quiet/style.css`.
The parent is updating its content and implementing the review interface.

The root will be `.design-surface.quiet[data-edition="EDITION"]`.
Scope **all** your rules using `.quiet[data-edition="EDITION"]`.
Your file is imported after the base stylesheet.
You may rearrange the existing semantic sections with CSS grid, change
typography, proportions, spacing, and the existing SVG mark's presentation.
Preserve natural reading order on mobile and all existing controls.
This is a considered variation of Still, not a new large homepage.

Updated home markup:

```
.quiet-home.quiet-shell
  .quiet-emblem > .quiet-mark (existing SVG)
  .quiet-introduction
    .quiet-eyebrow                Research · Computer science
    h1#quiet-name                 Zekun Wang
    p.quiet-bio                   short education + Amazon bio
    p.quiet-intro                 research statement above
    p.quiet-advisor               advisor
    .quiet-work-invitation        read button + count
  .quiet-recent                   one recent paper
```

The existing Work reader and About/Contact dialogs remain. Style all their
states, including inputs, selects, citation fallback, focus, hover, and details.
The parent is replacing hardcoded base colors with these variables:

- `--quiet-stone`: page background
- `--quiet-paper`: expanded paper/dialog background
- `--quiet-ink`: main text
- `--quiet-muted`: secondary text
- `--quiet-body`: research/reading prose
- `--quiet-rule`: fine dividers
- `--quiet-accent`: links/focus
- `--quiet-control-rule`: input/select borders
- `--quiet-guide`: decorative SVG guide strokes
- `--quiet-outline`: decorative SVG outline
- `--quiet-detail-edge`: expanded paper accent border
- `--quiet-selection`: text selection background
- `--quiet-selection-ink`: selected text foreground
- `--quiet-backdrop`: dialog backdrop
- `--quiet-display`: display font stack

Use self-hosted Fraunces, Geist, Bricolage Grotesque, JetBrains Mono, or native
Georgia/Baskerville. At most two fonts per edition. Do not add images/deps.

All normal text must meet WCAG AA 4.5:1 contrast (including small captions).
Large text >=3:1. Comfortable paragraph sizes and ~44px primary touch targets.
Check 1440px desktop, 390px mobile, 320px narrow mobile, reduced motion.
Do not hide the bio, research, CV, or email. No scroll traps or auto-play.
Do not use `body`, `html`, or `:root`; parent handles the screen background
and browser theme color. Avoid decorative fixed elements.
Leave 76px at the bottom for a small collapsible review bar.

## Editions

1. Stone: parent refines original cool stone/navy Still.
2. Black: `black.css`, `data-edition="black"`.
   Background AND reading/dialog surfaces are exactly `#000000`.
   Soft white typography, quiet contrast, no gradients, glow, gray panels,
   textures, huge filled buttons, or colored wash. Let black reach every edge.
   Preserve elegance; gently vary composition/scale from original Still.
   Background `#000000`, primary ink `#e9e8e2`.
3. Paper: `paper.css`, `data-edition="paper"`.
   Warm personal stationery / short scholarly letter. Restrained narrower
   composition, thoughtful serif hierarchy, ink-on-paper quality; not a
   faux book, notebook, cards, or textured scrapbook. Distinct from Stone.
   Background `#f5f1e8`, primary ink `#39382f`.
4. Line: `line.css`, `data-edition="line"`.
   A modern sans-serif interpretation. Crisp but generous whitespace,
   an asymmetric typographic structure, a quiet precise mark or rules.
   Personal, warm enough for a researcher; no dashboard, terminal, giant
   slogan, or anonymous portfolio template. Distinct from other editions.
   Background `#f7f8f6`, primary ink `#263431`.

Preview route will be `/still?edition=EDITION`, clean preview with `&embed=1`.
The parent handles browser integration, screenshots, and automated QA.
Return the changed path and a short description when the CSS is complete.
