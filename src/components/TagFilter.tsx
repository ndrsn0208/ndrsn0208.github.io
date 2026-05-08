interface Props {
  tags: readonly string[]
  selected: string[]
  onToggle: (tag: string) => void
  /** Optional sort indicator on the right edge. */
  sortLabel?: string
}

export default function TagFilter({ tags, selected, onToggle, sortLabel }: Props) {
  const set = new Set(selected)
  return (
    <div className="scroll-x">
      <div className="flex items-center gap-2 min-w-max">
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink-dim mr-1">
          // filter
        </span>
        {tags.map((t) => (
          <button
            key={t}
            onClick={() => onToggle(t)}
            className={`chip rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-wide ${
              set.has(t) ? 'chip-on' : ''
            }`}
            aria-pressed={set.has(t)}
          >
            {t}
          </button>
        ))}
        {sortLabel && (
          <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim flex items-center gap-1.5">
            sort = <span className="text-ink">{sortLabel}</span>
          </span>
        )}
      </div>
    </div>
  )
}
