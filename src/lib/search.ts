import Fuse from 'fuse.js'
import type { Publication } from '@/types'

/* ------------------------------------------------------------------
   Three layers, applied in order:
     1. Tag filter — strict OR over selected tags.
     2. Fuse.js fuzzy search — title/authors/tldr/summary/venue.
     3. Semantic search — placeholder; wired in Phase 2 once a
        Voyage worker or transformers.js bundle is in place.

   Layers 2 + 3 are combined with weighted reciprocal-rank fusion
   when both are active; for now Layer 3 returns Layer 2 untouched.
   ------------------------------------------------------------------ */

export function buildFuse(pubs: Publication[]) {
  return new Fuse(pubs, {
    keys: [
      { name: 'title',   weight: 0.50 },
      { name: 'authors', weight: 0.20 },
      { name: 'tldr',    weight: 0.15 },
      { name: 'summary', weight: 0.10 },
      { name: 'venue',   weight: 0.05 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: 2,
  })
}

export function applyTagFilter(pubs: Publication[], selected: string[]): Publication[] {
  if (selected.length === 0) return pubs
  const set = new Set(selected)
  return pubs.filter((p) => p.tags.some((t) => set.has(t)))
}

export interface SearchOptions {
  query: string
  tags: string[]
  semantic?: boolean
}

export function searchPublications(
  pubs: Publication[],
  fuse: Fuse<Publication>,
  opts: SearchOptions,
): Publication[] {
  const filtered = applyTagFilter(pubs, opts.tags)
  const q = opts.query.trim()
  if (q.length === 0) return filtered

  // re-build a Fuse over the filtered subset so tag filter is a hard cut, not a re-rank.
  const scoped = opts.tags.length === 0 ? fuse : buildFuse(filtered)
  const hits = scoped.search(q)
  return hits.map((h) => h.item)
}

/* sort helpers ------------------------------------------------------ */

export type SortKey = 'newest' | 'oldest' | 'title'

export function sortPublications(pubs: Publication[], by: SortKey): Publication[] {
  const out = [...pubs]
  switch (by) {
    case 'newest':
      return out.sort((a, b) => b.year - a.year || b.addedAt.localeCompare(a.addedAt))
    case 'oldest':
      return out.sort((a, b) => a.year - b.year || a.addedAt.localeCompare(b.addedAt))
    case 'title':
      return out.sort((a, b) => a.title.localeCompare(b.title))
  }
}
