# Continually adapt this website

A local, optional playground inspired by deployment-time adaptation.
This is a browser interaction system, not a claim that a learned model is
running in the visitor's browser. No server, account, uploaded visitor data,
or external generation service is needed.

## Behavior

- A small, protected launcher enables the playground.
- Enabled state and edits persist in this browser across visits.
- Exit restores the original site immediately and disables automatic entry.
  Edits are retained for a later explicit entry. Reset page clears the
  current page's edits and is undoable.
- Browse leaves every ordinary link, input, and scientific interaction
  available. Drawing and editing tools capture only their own gestures.
- Break offers Hammer, Ray, and Vortex. Broken content becomes invisible and
  noninteractive, including keyboard access. The playground controls are
  always protected and remain available.
- Break and Diffuse address individual Unicode graphemes. Hammer removes one
  character per click. Missing characters keep their advance, and a missing
  link character cannot activate its surrounding link. The remaining letters
  stay usable. See `CHARACTER_ADAPTATION.md` for the reversible text layer.
- Draw stores vector strokes. Diffuse continuously interpolates a procedural
  field and nearby element styles while held, then stores the final state.
- Edit selects text or media, moves it by dragging, and offers font, size,
  weight, color, and rotation controls.
- Layout changes the actual arrangement of sections or records.
- Undo and redo operate on completed gestures, not individual pointer moves.

## Implementation contract

Shared types and limits are in `src/adapt/model.ts`. Do not change these
without coordinating with the parent agent.

The lightweight gate is mounted once inside BrowserRouter, after Routes.
It lazy-loads the actual playground only after entry or a persisted enabled
flag. The mode UI is outside `.site-shell` and carries `data-adapt-ui`.

`store.ts` exports `createAdaptStore(storage?: Storage)` with:

- `subscribe(listener): () => void`
- `getSnapshot(): AdaptSnapshot`, a referentially stable snapshot
- `getPage(key): AdaptPage`
- `commitPage(key, page): void`
- `setEnabled(enabled): void`
- `undo(): void`, `redo(): void`, `resetPage(key): void`
- `clearHistory(): void`, leaving all saved pages intact
- `flush(): void`, `destroy(): void`

The store validates all persisted values against the model's bounds,
debounces writes, flushes on pagehide, handles unavailable storage, and
keeps only bounded in-memory undo history. It writes the enabled flag
immediately. Style strings are limited to named fonts and valid hex colors.
No HTML or arbitrary CSS is stored or injected.

`dom.ts` exports `createAdaptDom()` with:

- `setPageKey(key): void`
- `refresh(): void`
- `find(x, y): AdaptTarget | null`
- `nearby(x, y, radius, limit?): AdaptTarget[]`
- `get(id): AdaptTarget | null`
- `targetForElement(element): AdaptTarget | null`, for destroying a whole link
- `subscribeTargets(listener): () => void`, for restoring lazy character edits
- `apply(page): void`
- `preview(id, patch): void`
- `resetPreview(): void`
- `rebase(): void`, recalculating authored sizes after a responsive resize
- `destroy(): void`

`AdaptTarget` includes `id`, `element: HTMLElement`, `label`, and
`rect(): DOMRect`. Only `.site-shell` content is adapted. UI, forms being
edited, and SVG/canvas internals are excluded. Stable keys use existing
semantic IDs, explicit `data-adapt-key` on records, and text fingerprints.
Do not depend on React useId values or global list positions.
Registry refreshes are bounded and batched. Apply/restore only owned inline
properties and attributes without overwriting unrelated React styles.
Move uses normalized horizontal offsets and document-pixel vertical offsets.
Layout must not reparent React's DOM nodes. All changes are reversible.

`effects.ts` exports `createAdaptEffects(canvas)` with:

- `render(frame: EffectsFrame): void`
- `burst(kind, x, y, color, text?): void`
- `destroy(): void`

`EffectsFrame` is `{ page, scrollY, width, height, cursor?, stroke?,
reducedMotion? }`. Cursor is `{ x, y, radius, tool, pressed }` in viewport
pixels. Stroke is the current uncommitted drawing preview.
Saved points have normalized document x and document-pixel y.
The renderer handles DPR (capped at 2), visible-region culling, and bounded
particles. It may animate transient bursts but must stop when settled.
Diffuse changes nearby characters and media through smooth interpolated
transforms. It never paints decorative marks. Legacy saved diffusion marks
are ignored by the renderer and visible change count.
No canvas input listeners, persistent RAF, network assets, or DOM screenshots.

The character layer retains React-owned Text nodes in their original parents
and uses removable adjacent wrappers. It never reparents those nodes. It
handles current React text updates and filters; stored character IDs include
the exact text-run fingerprint. Normal element Edit remains available.

`AdaptToolbar.tsx` is a controlled default export using AdaptToolbarProps.
It and its styles own only the protected UI. It exposes Browse, Break, Draw,
Diffuse, Edit, Layout, Undo, Redo, Reset page, Exit. Options are contextual.
There must be a compact browsing state, keyboard focus, touch-sized actions,
reduced-motion support, and a way to collapse controls. Existing website
content must remain usable. Do not add ornamental tiny labels or arrows.

One store stays alive for the entire enabled session. Route changes rebuild
the DOM/effects engine and clear page-local undo history, preserving edits
even if browser storage is unavailable.

The parent owns the gate, controller, gesture lifecycle, DOM integration,
keyboard shortcuts, local preview, and browser QA.

## Performance and persistence

One viewport-sized canvas, bounded storage, one gesture transaction, and no
React state updates per animation frame. Rendering occurs only on input,
scroll, resize, or an active effect. Off mode unloads observers, listeners,
canvas resources, and restores the DOM. Clear all held state on blur,
pointer cancel, visibility change, and route change.

Required checks include storage corruption/quota handling, undo/redo and
reset, refresh while enabled, exit and return, route transitions, ordinary
navigation in Browse, destroyed links, drawing/diffusion persistence, text
movement and fonts, and desktop/mobile controls.
