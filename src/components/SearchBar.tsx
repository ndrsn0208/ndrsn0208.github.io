import { useEffect, useRef } from 'react'

interface Props {
  query: string
  onQueryChange: (q: string) => void
  semantic: boolean
  onSemanticChange: (on: boolean) => void
  /** When `false`, the semantic toggle is rendered disabled (Layer 3 not ready). */
  semanticAvailable?: boolean
  placeholder?: string
}

export default function SearchBar({
  query,
  onQueryChange,
  semantic,
  onSemanticChange,
  semanticAvailable = false,
  placeholder = "$ query — 'continual learning', 'KL bounds'…",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced setter: parent owns query state, we just call through.
  // (Debouncing is handled at the route level so URL stays in sync.)
  useEffect(() => {
    // Re-focus the input if external code triggers a focus via the id.
  }, [])

  return (
    <div
      className="chrome-r flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl"
    >
      <svg
        className="h-4 w-4 text-ink-dim shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        id="search-input"
        ref={inputRef}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="flex-1 min-w-0 bg-transparent outline-none text-[13px] sm:text-[14px] font-mono placeholder:text-ink-dim/70 text-ink"
        placeholder={placeholder}
        type="search"
        autoComplete="off"
        spellCheck={false}
      />
      <span className="font-mono text-[10px] text-ink-dim px-1.5 py-0.5 rounded border border-white/10 hidden sm:inline">
        ⌘ K
      </span>
      <div className="hidden md:flex items-center gap-2 ml-2 pl-3 border-l border-white/10">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">
          semantic
        </span>
        <button
          onClick={() => semanticAvailable && onSemanticChange(!semantic)}
          className={`toggle ${semantic && semanticAvailable ? 'toggle-on' : ''}`}
          aria-label="Toggle semantic search"
          aria-pressed={semantic}
          disabled={!semanticAvailable}
          title={
            semanticAvailable
              ? 'Toggle semantic search'
              : 'Semantic search is queued for the next pass — fuzzy + tag filter active.'
          }
          style={!semanticAvailable ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          <span className="toggle-knob" />
        </button>
      </div>
    </div>
  )
}
