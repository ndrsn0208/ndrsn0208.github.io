import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SearchBar from '@/components/SearchBar'
import TagFilter from '@/components/TagFilter'
import PublicationItem from '@/components/PublicationItem'
import { config, publications } from '@/lib/publications'
import {
  buildFuse,
  searchPublications,
  sortPublications,
  type SortKey,
} from '@/lib/search'

export default function Publications() {
  const [params, setParams] = useSearchParams()

  // local state mirrors URL; URL is the source of truth so deep links work.
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [debounced, setDebounced] = useState(query)
  const initialTags = params.getAll('tag').filter((t) => t.length > 0)
  const [tags, setTags] = useState<string[]>(initialTags)
  const [sortBy, setSortBy] = useState<SortKey>((params.get('sort') as SortKey) ?? 'newest')
  const [semantic, setSemantic] = useState(false)

  // 80ms debounce on text input → URL + search.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 80)
    return () => clearTimeout(t)
  }, [query])

  // Sync state → URL (replace, not push).
  useEffect(() => {
    const next = new URLSearchParams()
    if (debounced.trim()) next.set('q', debounced.trim())
    for (const t of tags) next.append('tag', t)
    if (sortBy !== 'newest') next.set('sort', sortBy)
    setParams(next, { replace: true })
  }, [debounced, tags, sortBy, setParams])

  const fuse = useMemo(() => buildFuse(publications), [])

  const results = useMemo(() => {
    const filtered = searchPublications(publications, fuse, {
      query: debounced,
      tags,
      semantic,
    })
    return sortPublications(filtered, sortBy)
  }, [debounced, tags, sortBy, semantic, fuse])

  const toggleTag = (t: string) =>
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))

  const sortLabel = sortBy === 'newest' ? 'newest' : sortBy === 'oldest' ? 'oldest' : 'title'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 md:pt-12 pb-24 md:pb-32">
      <div className="flex items-baseline justify-between mb-5 md:mb-6">
        <h1 className="font-mono text-2xl md:text-3xl font-extrabold tracking-tightest text-ink">
          publications
        </h1>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-dim">
            [ {results.length} / {publications.length} ]
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="btn-chrome px-2 py-1.5 font-mono text-[11px] uppercase tracking-wide text-ink"
          >
            <option value="newest">newest</option>
            <option value="oldest">oldest</option>
            <option value="title">title</option>
          </select>
        </div>
      </div>

      <div className="chrome-solid p-3 sm:p-5">
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          semantic={semantic}
          onSemanticChange={setSemantic}
          semanticAvailable={false}
        />
        <div className="mt-3 md:mt-4">
          <TagFilter
            tags={config.researchInterests}
            selected={tags}
            onToggle={toggleTag}
            sortLabel={sortLabel}
          />
        </div>
      </div>

      {results.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="font-display text-2xl text-ink-dim mb-3">
            <span className="metal-text">No matches.</span>
          </div>
          <p className="text-sm text-ink-dim max-w-md mx-auto">
            Nothing matched <span className="font-mono text-ink">"{debounced}"</span>
            {tags.length > 0 && (
              <>
                {' '}with tags{' '}
                <span className="font-mono text-ink">{tags.join(', ')}</span>
              </>
            )}
            . Try clearing a filter.
          </p>
          {(debounced || tags.length > 0) && (
            <button
              onClick={() => {
                setQuery('')
                setTags([])
              }}
              className="btn-chrome mt-6 px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-ink"
            >
              clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="border-t mt-6" style={{ borderColor: 'var(--border-soft)' }}>
          {results.map((pub, i) => (
            <PublicationItem key={pub.id} pub={pub} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
