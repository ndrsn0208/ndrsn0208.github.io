# Character-level Break and Diffuse

The user wants Break and Diffuse to affect individual characters, not whole
headings, words, or paragraphs. Normal Edit remains element-based. Saved
block edits continue to work. Do not reset a visitor's existing state.

## Contract

`graphemes.ts` exports:

- `segmentGraphemes(text): { text: string; start: number; end: number }[]`
  with UTF-16 offsets, proper emoji/combining clusters, and whitespace retained.
- `textRunId(text, path): string`, a deterministic compact fingerprint.
- `characterId(parentId, runId, offset): string`
- `parseCharacterId(id): { parentId: string; runId: string; offset: number } | null`

Character IDs use `glyph:${parentId}:${runId}:${offset}`. Parent IDs are the
existing `adapt-...` keys, run IDs use only lowercase ASCII letters, digits,
and hyphens, and offsets are bounded nonnegative integers.

`characters.ts` exports `createCharacterLayer(dom)`:

- `find(x, y): AdaptTarget | null`
- `nearby(x, y, radius, limit = 64): AdaptTarget[]`
- `apply(page): void` to replay saved character edits and update empty links
- `clear(): void` to unwrap characters and restore live text before rebasing
- `destroy(): void`
- `blockedAt(x, y): boolean` for clicking a destroyed character's original slot
- `actionDestroyed(element): boolean` for keyboard activation of empty links

It uses the existing DOM adapter and shared AdaptPage / ElementPatch types.
It must expose each affected glyph as an AdaptTarget by calling
`dom.targetForElement(glyph)`. The glyph HTMLElement carries
`data-adapt-character="<characterId>"`. It sits in a reserved inline slot
carrying `data-adapt-character-slot="<characterId>"`. A glyph target's
`kind` is `"character"`.

The parent will update the DOM adapter to register glyphs, use their exact
IDs, omit them from ordinary element find/nearby, and allow subscribing to
batched registry changes:

- `dom.subscribeTargets(listener): () => void`

The parent will also give deleted glyphs opacity 0 but preserve their hit
slots, setting `data-adapt-character-deleted` on them. Individual glyphs
must not be promoted to their whole enclosing link by the engine.

## Safe text handling

Lazily materialize only nearby or saved text runs, not the whole document.
Use grapheme clusters. Never put HTML spans into SVG/MathML/KaTeX, inputs,
contenteditable, script/style, or the protected adaptation controls.

Keep the original React-owned Text node in its original parent. Do not
reparent or replace it. It may be temporarily blanked while an adjacent,
owned wrapper paints its text. Observe real text updates and parent removals,
remove obsolete wrappers, and never restore an old string over a new React
value. Preserve exact live text on clear/destroy, including whitespace.
Generated wrappers must not cause observer loops.

Preserve normal word boundaries and the original glyph advances. Individual
glyphs may be inline blocks inside word/slot wrappers, but untouched text
must not start wrapping between every English letter. Reserve advances so
hidden characters leave holes and transforms do not shift neighboring text.
Resize clears/materializes runs again against current responsive font sizes.

An action with all of its text characters deleted and no remaining icon/image
can carry `data-adapt-empty-action`. Use this unique marker, not unrelated
authored attributes. CSS and the engine prevent activating such actions.
Partial links remain usable except at their destroyed character slots.

Target keys include both the parent and the exact text-run fingerprint.
Changed text must not receive old character positions. Filtered/recreated
publication records must reapply matching edits. `apply` should subscribe to
the DOM registry to catch late-mounted targets. Work is bounded and debounced,
with no idle RAF. Handle removal and restoration of owned wrappers.

## Parent integration

The parent owns `dom.ts`, `engine.ts`, shared limits, controller integration,
and browser QA. Hammer hits one character per click. Ray/Vortex and Diffuse
operate on nearby glyphs, with a bounded number of live updates. Diffuse uses
glyph transforms instead of changing line layout. It does not generate
decorative patterns, including from legacy saved marks. Media remain whole objects.
The toolbar's Hammer radius option will be removed because it no longer
describes an area effect.
