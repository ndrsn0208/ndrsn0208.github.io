import { useId, useRef, useState, type InputHTMLAttributes } from 'react'
import type {
  AdaptFont,
  AdaptSelection,
  AdaptToolbarProps,
  AdaptTool,
  AdaptWeapon,
  ElementPatch,
  LayoutKind,
} from './model'
import './adapt-ui.css'

const TOOLS: { value: AdaptTool; label: string }[] = [
  { value: 'browse', label: 'Browse' },
  { value: 'break', label: 'Break' },
  { value: 'draw', label: 'Draw' },
  { value: 'diffuse', label: 'Diffuse' },
  { value: 'edit', label: 'Edit' },
  { value: 'layout', label: 'Layout' },
]

const WEAPONS: { value: AdaptWeapon; label: string }[] = [
  { value: 'hammer', label: 'Hammer' },
  { value: 'ray', label: 'Ray' },
  { value: 'vortex', label: 'Vortex' },
]

const LAYOUTS: { value: LayoutKind; label: string }[] = [
  { value: 'original', label: 'Original' },
  { value: 'columns', label: 'Columns' },
  { value: 'shuffle', label: 'Shuffle' },
]

const FONTS: { value: AdaptFont; label: string }[] = [
  { value: 'original', label: 'Original' },
  { value: 'book', label: 'Book' },
  { value: 'sans', label: 'Sans' },
  { value: 'mono', label: 'Mono' },
  { value: 'poster', label: 'Poster' },
]

const PALETTE = [
  { name: 'Ink', value: '#242923', mark: '#ffffff' },
  { name: 'Paper', value: '#f5f1e8', mark: '#242923' },
  { name: 'Clay', value: '#ad4938', mark: '#ffffff' },
  { name: 'Ochre', value: '#b68a32', mark: '#242923' },
  { name: 'Moss', value: '#52735a', mark: '#ffffff' },
  { name: 'Violet', value: '#8261c2', mark: '#ffffff' },
]

const ADJUSTMENT_KEYS = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'Home', 'End', 'PageUp', 'PageDown',
])

type EditField = 'fontScale' | 'weight' | 'rotation'

interface PendingEdit {
  selectionId: string
  field: EditField
  patch: ElementPatch | null
  pointerId: number | null
  keys: Set<string>
}

/**
 * Values remain controlled. This ref only remembers an unfinished input gesture.
 * The parent owns preview restoration when selection, route, or visibility changes.
 */
function useEditGesture(selection: AdaptSelection | null, onEdit: AdaptToolbarProps['onEdit']) {
  const pending = useRef<PendingEdit | null>(null)

  const finish = (field?: EditField) => {
    const gesture = pending.current
    if (!gesture || (field && gesture.field !== field)) return
    // Consume before calling out: pointerup, capture loss, and blur can all follow.
    pending.current = null
    if (gesture.patch && gesture.selectionId === selection?.id) {
      onEdit(gesture.patch, true)
    }
  }

  const begin = (field: EditField) => {
    if (!selection) return null
    if (pending.current?.selectionId !== selection.id) pending.current = null
    if (pending.current && pending.current.field !== field) finish()
    pending.current ??= {
      selectionId: selection.id,
      field,
      patch: null,
      pointerId: null,
      keys: new Set(),
    }
    return pending.current
  }

  const bind = (field: EditField): InputHTMLAttributes<HTMLInputElement> => ({
    onChange(event) {
      const input = event.currentTarget
      const value = input.valueAsNumber
      if (!Number.isFinite(value)) return
      const gesture = begin(field)
      if (!gesture) return
      const bounded = Math.min(Number(input.max), Math.max(Number(input.min), value))
      const patch: ElementPatch = { [field]: bounded }
      gesture.patch = patch
      onEdit(patch, false)
    },
    onPointerDown(event) {
      if (!event.isPrimary || event.button !== 0) return
      const gesture = begin(field)
      if (!gesture || gesture.pointerId !== null) return
      gesture.pointerId = event.pointerId
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    onPointerUp(event) {
      if (pending.current?.pointerId === event.pointerId) finish(field)
    },
    onPointerCancel(event) {
      if (pending.current?.pointerId === event.pointerId) finish(field)
    },
    onLostPointerCapture(event) {
      if (pending.current?.pointerId === event.pointerId) finish(field)
    },
    onKeyDown(event) {
      if (ADJUSTMENT_KEYS.has(event.key)) begin(field)?.keys.add(event.key)
    },
    onKeyUp(event) {
      const gesture = pending.current
      if (!gesture || gesture.field !== field || !ADJUSTMENT_KEYS.has(event.key)) return
      gesture.keys.delete(event.key)
      if (gesture.keys.size === 0 && gesture.pointerId === null) finish(field)
    },
    onBlur() {
      finish(field)
    },
  })

  return { bind, finish }
}

function Choices<T extends string>({ label, value, options, onChange }: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return <div className="adapt-choices" role="group" aria-label={label}>
    {options.map(option => <button
      key={option.value}
      type="button"
      className="adapt-button"
      aria-pressed={value === option.value}
      onClick={() => onChange(option.value)}
    >{option.label}</button>)}
  </div>
}

function Palette({ label, value, onChange }: {
  label: string
  value?: string
  onChange: (value: string) => void
}) {
  return <div className="adapt-palette" role="group" aria-label={label}>
    {PALETTE.map(color => {
      const selected = value?.toLowerCase() === color.value
      return <button
        key={color.value}
        type="button"
        className="adapt-swatch"
        aria-label={`${label}: ${color.name}`}
        aria-pressed={selected}
        title={color.name}
        onClick={() => { if (!selected) onChange(color.value) }}
      >
        <span className="adapt-swatch-color" style={{ backgroundColor: color.value, color: color.mark }}>
          {selected && <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path d="m3.5 8 3 3 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>}
        </span>
      </button>
    })}
  </div>
}

function Range({ label, display, ...input }: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  display: string
}) {
  const id = useId()
  return <div className="adapt-range">
    <div className="adapt-range-heading">
      <label htmlFor={id}>{label}</label>
      <span aria-hidden="true">{display}</span>
    </div>
    <input {...input} id={id} type="range" aria-valuetext={display} />
  </div>
}

export default function AdaptToolbar({
  tool, onTool, weapon, onWeapon, color, onColor, size, onSize,
  selection, onEdit, onDeleteSelection, onRestoreSelection,
  canUndo, canRedo, onUndo, onRedo, layout, onLayout,
  onResetPage, onExit, saveStatus, changeCount,
}: AdaptToolbarProps) {
  const id = useId()
  const disclosure = useRef<HTMLButtonElement>(null)
  const [browseToolsOpen, setBrowseToolsOpen] = useState(true)
  const expanded = tool !== 'browse' || browseToolsOpen
  const editing = useEditGesture(tool === 'edit' ? selection : null, onEdit)
  const patch = selection?.patch ?? {}
  const status = saveStatus === 'memory' ? 'Not saved' : saveStatus === 'saving' ? 'Saving' : 'Saved'

  const chooseTool = (next: AdaptTool) => {
    editing.finish()
    setBrowseToolsOpen(false)
    if (next === 'browse') disclosure.current?.focus({ preventScroll: true })
    onTool(next)
  }

  const edit = (next: ElementPatch) => {
    editing.finish()
    onEdit(next, true)
  }

  const act = (action: () => void) => {
    editing.finish()
    action()
  }

  return <aside
    className="adapt-ui"
    data-adapt-ui="true"
    data-expanded={expanded}
    aria-label="Adapt this page"
  >
    <section
      id={`${id}-options`}
      className="adapt-tray"
      aria-label={`${TOOLS.find(item => item.value === tool)?.label} options`}
      hidden={!expanded || tool === 'browse'}
    >
      {tool === 'break' && <>
        <div className="adapt-settings">
          <Choices label="Break effect" value={weapon} options={WEAPONS} onChange={onWeapon} />
          {weapon !== 'hammer' && <Range
            label="Radius" display={`${size} px`}
            min={8} max={240} step={1} value={size}
            onChange={event => onSize(event.currentTarget.valueAsNumber)}
          />}
        </div>
        <p className="adapt-instruction">
          {weapon === 'hammer' ? 'Click a character to break it.' : 'Hold to break the letters under the brush.'}
        </p>
      </>}

      {(tool === 'draw' || tool === 'diffuse') && <>
        <div className="adapt-settings">
          <Palette label={tool === 'draw' ? 'Drawing color' : 'Diffusion color'} value={color} onChange={onColor} />
          <Range
            label={tool === 'draw' ? 'Width' : 'Radius'} display={`${size} px`}
            min={tool === 'draw' ? 1 : 8} max={tool === 'draw' ? 24 : 240}
            step={1} value={size}
            onChange={event => onSize(event.currentTarget.valueAsNumber)}
          />
        </div>
        <p className="adapt-instruction">
          {tool === 'draw' ? 'Drag on the page to draw.' : 'Hold to morph the letters under the brush.'}
        </p>
      </>}

      {tool === 'edit' && (selection ? <div key={selection.id}>
        <div className="adapt-selection-summary">
          <p className="adapt-selection-label" role="status" aria-atomic="true" title={selection.label}>
            <span className="adapt-sr-only">Selected: </span>
            {selection.label || 'Selected element'}
          </p>
          <div className="adapt-selection-actions" role="group" aria-label="Selection actions">
            <button
              type="button" className="adapt-button"
              aria-disabled={patch.hidden === true}
              onClick={() => { if (!patch.hidden) act(onDeleteSelection) }}
            >Remove</button>
            <button type="button" className="adapt-button" onClick={() => act(onRestoreSelection)}>Restore</button>
          </div>
        </div>

        <div className="adapt-edit-settings">
          <div className="adapt-font">
            <label htmlFor={`${id}-font`}>Font</label>
            <select
              id={`${id}-font`}
              value={patch.font ?? 'original'}
              onChange={event => edit({ font: event.currentTarget.value as AdaptFont })}
            >
              {FONTS.map(font => <option key={font.value} value={font.value}>{font.label}</option>)}
            </select>
            <button
              type="button" className="adapt-button adapt-italic"
              aria-pressed={patch.italic ?? false}
              onClick={() => edit({ italic: !patch.italic })}
            >Italic</button>
          </div>
          <Palette label="Text color" value={patch.color} onChange={value => edit({ color: value })} />
        </div>

        <div className="adapt-edit-ranges">
          <Range
            label="Text size" display={`${Math.round((patch.fontScale ?? 1) * 100)}%`}
            min={0.5} max={2.5} step={0.05} value={patch.fontScale ?? 1}
            {...editing.bind('fontScale')}
          />
          <Range
            label="Weight" display={`${patch.weight ?? 400}`}
            min={100} max={900} step={1} value={patch.weight ?? 400}
            {...editing.bind('weight')}
          />
          <Range
            label="Rotation" display={`${patch.rotation ?? 0}°`}
            min={-180} max={180} step={1} value={patch.rotation ?? 0}
            {...editing.bind('rotation')}
          />
        </div>
        <p className="adapt-instruction">
          {patch.hidden ? 'Restore to bring this selection back.' : 'Drag the selection on the page to move it.'}
        </p>
      </div> : <p className="adapt-instruction adapt-empty">Select text or an image on the page, then drag to move it.</p>)}

      {tool === 'layout' && <Choices label="Page layout" value={layout.kind} options={LAYOUTS} onChange={onLayout} />}
    </section>

    <div className="adapt-dock">
      <div id={`${id}-tools`} className="adapt-tools" role="group" aria-label="Adaptation tools" hidden={!expanded}>
        {TOOLS.map(item => <button
          key={item.value}
          type="button"
          className="adapt-button"
          aria-pressed={tool === item.value}
          onClick={() => chooseTool(item.value)}
        >{item.label}</button>)}
      </div>

      <div className="adapt-utilities">
        <button
          ref={disclosure}
          type="button"
          className="adapt-button adapt-disclosure"
          aria-expanded={expanded}
          aria-controls={`${id}-tools ${id}-options`}
          aria-label={expanded ? 'Collapse tools and browse the page' : 'Tools: open adaptation controls'}
          onClick={() => {
            if (expanded) chooseTool('browse')
            else setBrowseToolsOpen(true)
          }}
        >{expanded ? 'Collapse' : 'Tools'}</button>

        <div className="adapt-history" role="group" aria-label="Page actions">
          <button
            type="button" className="adapt-button" aria-disabled={!canUndo}
            onClick={() => { if (canUndo) act(onUndo) }}
          >Undo</button>
          <button
            type="button" className="adapt-button" aria-disabled={!canRedo}
            onClick={() => { if (canRedo) act(onRedo) }}
          >Redo</button>
          <button
            type="button" className="adapt-button" aria-disabled={changeCount === 0}
            title="Reset this page; you can undo this"
            onClick={() => { if (changeCount > 0) act(onResetPage) }}
          >Reset page</button>
          <button type="button" className="adapt-button adapt-exit" onClick={() => act(onExit)}>Exit</button>
        </div>

        <span
          className="adapt-save-status"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-save-status={saveStatus}
          title={saveStatus === 'memory' ? 'This browser could not save your changes.' : undefined}
        >{status}</span>
      </div>
    </div>
  </aside>
}
