import { useEffect, useRef, useState } from 'react'
import AdaptToolbar from './AdaptToolbar'
import { PlaygroundEngine, type EngineSettings } from './engine'
import { createAdaptStore } from './store'
import {
  emptyDocument, emptyPage, pageChangeCount,
  type AdaptSelection, type AdaptSnapshot, type AdaptTool, type ElementPatch, type LayoutKind,
} from './model'
import './adapt-stage.css'

const initialSettings: EngineSettings = { tool: 'browse', weapon: 'hammer', color: '#8261c2', size: 96 }

export default function AdaptPlayground({ pageKey, routeKey, onExit }: { pageKey: string; routeKey: string; onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const outlineRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<PlaygroundEngine | null>(null)
  const storeRef = useRef<ReturnType<typeof createAdaptStore> | null>(null)
  const mounted = useRef(false)
  const [runtimeStore, setRuntimeStore] = useState<ReturnType<typeof createAdaptStore> | null>(null)
  const settingsRef = useRef<EngineSettings>({ ...initialSettings })
  const sizes = useRef({ draw: 5, break: 96, diffuse: 96 })
  const [settings, setSettings] = useState<EngineSettings>({ ...initialSettings })
  const [selection, setSelection] = useState<AdaptSelection | null>(null)
  const [snapshot, setSnapshot] = useState<AdaptSnapshot>({
    document: emptyDocument(true), canUndo: false, canRedo: false, saveStatus: 'saved',
  })

  function updateSettings(next: EngineSettings) {
    settingsRef.current = next
    setSettings(next)
    engineRef.current?.setSettings(next)
  }

  function setTool(tool: AdaptTool) {
    const size = tool === 'draw' || tool === 'break' || tool === 'diffuse' ? sizes.current[tool] : settingsRef.current.size
    updateSettings({ ...settingsRef.current, tool, size })
  }

  useEffect(() => {
    const store = createAdaptStore()
    const initial = store.getSnapshot()
    if (!initial.document.enabled && initial.saveStatus !== 'memory') {
      store.destroy()
      onExit()
      return
    }
    if (!initial.document.enabled) store.setEnabled(true)
    mounted.current = true
    storeRef.current = store
    const update = () => setSnapshot(store.getSnapshot())
    const unsubscribe = store.subscribe(update)
    update()
    setRuntimeStore(store)
    return () => {
      mounted.current = false
      unsubscribe()
      engineRef.current?.destroy()
      engineRef.current = null
      store.destroy()
      storeRef.current = null
    }
    // One store belongs to the enabled session, including storage-unavailable sessions.
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current, outline = outlineRef.current
    if (!runtimeStore || !canvas || !outline) return
    runtimeStore.clearHistory()
    const nextSettings = { ...settingsRef.current, tool: 'browse' as const }
    settingsRef.current = nextSettings
    setSettings(nextSettings)
    setSelection(null)
    const engine = new PlaygroundEngine({
      canvas, outline, store: runtimeStore, pageKey, settings: nextSettings,
      onSelection: selection => { if (mounted.current) setSelection(selection) },
      onBrowse: () => {
        if (!mounted.current) return
        const next = { ...settingsRef.current, tool: 'browse' as const }
        settingsRef.current = next
        setSettings(next)
        engineRef.current?.setSettings(next)
      },
    })
    engineRef.current = engine
    return () => {
      engine.destroy()
      if (engineRef.current === engine) engineRef.current = null
    }
  }, [pageKey, routeKey, runtimeStore])

  function exit() {
    engineRef.current?.finishGesture()
    storeRef.current?.setEnabled(false)
    storeRef.current?.flush()
    onExit()
  }

  const page = snapshot.document.pages[pageKey] ?? emptyPage()
  return <div className="adapt-stage" data-adapt-ui>
    <canvas ref={canvasRef} className="adapt-canvas" aria-hidden="true" />
    <div ref={outlineRef} className="adapt-selection" aria-hidden="true" />
    <AdaptToolbar
      tool={settings.tool}
      onTool={setTool}
      weapon={settings.weapon}
      onWeapon={weapon => updateSettings({ ...settingsRef.current, weapon })}
      color={settings.color}
      onColor={color => updateSettings({ ...settingsRef.current, color })}
      size={settings.size}
      onSize={size => {
        const tool = settingsRef.current.tool
        if (tool === 'draw' || tool === 'break' || tool === 'diffuse') sizes.current[tool] = size
        updateSettings({ ...settingsRef.current, size })
      }}
      selection={selection}
      onEdit={(patch: ElementPatch, final = true) => engineRef.current?.editSelection(patch, final)}
      onDeleteSelection={() => engineRef.current?.removeSelection()}
      onRestoreSelection={() => engineRef.current?.restoreSelection()}
      canUndo={snapshot.canUndo}
      canRedo={snapshot.canRedo}
      onUndo={() => engineRef.current?.undo()}
      onRedo={() => engineRef.current?.redo()}
      layout={page.layout}
      onLayout={(kind: LayoutKind) => engineRef.current?.setLayout(kind)}
      onResetPage={() => engineRef.current?.reset()}
      onExit={exit}
      saveStatus={snapshot.saveStatus}
      changeCount={pageChangeCount(page)}
    />
  </div>
}
