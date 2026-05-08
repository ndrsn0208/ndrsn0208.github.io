import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import SearchBar from '@/components/SearchBar'
import TagFilter from '@/components/TagFilter'
import PublicationCard from '@/components/PublicationCard'
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
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          <span className="metal-text">Publications</span>
        </h1>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-dim">
            [ {results.length} / {publications.length} ]
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="btn-chrome rounded-xl px-2 py-1.5 font-mono text-[11px] uppercase tracking-wide text-ink"
          >
            <option value="newest">newest</option>
            <option value="oldest">oldest</option>
            <option value="title">title</option>
          </select>
        </div>
      </div>

      <div className="chrome-solid rounded-2xl p-3 sm:p-5">
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
              className="btn-chrome mt-6 rounded-xl px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-ink"
            >
              clear filters
            </button>
          )}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-12 gap-4 sm:gap-5 mt-6">
          <AnimatePresence mode="popLayout">
            {results.map((pub, i) => (
              <motion.div
                key={pub.id}
                layout
                className="col-span-12 sm:col-span-6 lg:col-span-3"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <PublicationCard pub={pub} index={i} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
