import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type * as Three from 'three'
import type { ArgumentSceneProps, ScenePanel, ScenePoint, SceneTone } from './argument-scene-types'
import './argument-scene.css'

export type Pose = { turn: number; tilt: number }
type SceneRuntime = {
  update: (panel: ScenePanel) => void
  pose: (pose: Pose) => void
  visible: (visible: boolean) => void
  appearance: () => void
  dispose: () => void
}

export const homePose: Pose = { turn: 0.62, tilt: 1.03 }
const side = 2.4
const relief = 1.2
const focusHeight = relief / 3

type LabelBox = { x: number; y: number; w: number; h: number }

function placeLabel(px: number, py: number, w: number, h: number, width: number, height: number, placed: readonly LabelBox[]): LabelBox {
  const candidates = [10, 30, 52, 76].flatMap(gap => [
    { x: px - w / 2, y: py - h - gap },
    { x: px + gap, y: py - h / 2 },
    { x: px - w - gap, y: py - h / 2 },
    { x: px - w / 2, y: py + gap },
    { x: px + gap, y: py - h - gap },
    { x: px - w - gap, y: py + gap },
  ]).map(point => ({
    x: Math.max(4, Math.min(width - w - 4, point.x)),
    y: Math.max(4, Math.min(height - h - 4, point.y)),
    w, h,
  }))
  const score = (box: LabelBox) => {
    const overlap = placed.reduce((sum, other) =>
      sum + Math.max(0, Math.min(box.x + w + 4, other.x + other.w) - Math.max(box.x - 4, other.x))
        * Math.max(0, Math.min(box.y + h + 4, other.y + other.h) - Math.max(box.y - 4, other.y)), 0)
    return overlap * 100 + Math.hypot(box.x + w / 2 - px, box.y + h / 2 - py)
  }
  return candidates.reduce((best, candidate) => score(candidate) < score(best) ? candidate : best)
}

function cssTone(element: Element, tone: SceneTone) {
  return getComputedStyle(element).getPropertyValue(`--arg-${tone}`).trim() || '#38716a'
}

/**
 * Only draws the supplied model. There is no scenery added to its height field.
 * Camera, axes and elevation scale stay shared across compared estimates.
 */
async function makeScene(
  canvas: HTMLCanvasElement,
  labels: HTMLDivElement,
  initial: ScenePanel,
  initialPose: Pose,
  zoom = 1,
  offsetY = 0,
  minWidth = 0,
): Promise<SceneRuntime> {
  const T = await import('three')
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = T.SRGBColorSpace
  renderer.toneMapping = T.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  const scene = new T.Scene()
  const camera = new T.OrthographicCamera(-3.5, 3.5, 3, -3, 0.1, 50)
  camera.zoom = zoom
  const lamp = new T.DirectionalLight('#ffffff', 2)
  lamp.position.set(-4, 7, 5)
  scene.add(lamp, new T.HemisphereLight('#eef6ff', '#5d7891', 1.65))
  let panel = initial
  let pose = initialPose
  let active = true
  let disposed = false
  let width = 0
  let height = 0
  let dark = false
  let annotations: Three.Object3D[] = []
  let projectedLabels: { element: HTMLSpanElement; line: SVGLineElement; point: Three.Vector3 }[] = []
  const colors = ['#6588b0', '#97b5d1', '#c4d7e7', '#e5eef4'].map(value => ({ value: new T.Color(value) }))
  const ink = { value: new T.Color('#34577d') }
  const landscape = { value: initial.regions?.length ? 1 : 0 }
  const quietSurface = { value: initial.surfaceStyle === 'subtle' ? 1 : 0 }
  const contourSurface = { value: initial.surfaceStyle === 'contours' ? 1 : 0 }
  const material = new T.MeshStandardMaterial({
    roughness: 0.66, metalness: 0.02, side: T.DoubleSide, transparent: true,
  })
  material.onBeforeCompile = shader => {
    colors.forEach((value, index) => { shader.uniforms[`land${index}`] = value })
    shader.uniforms.contourInk = ink
    shader.uniforms.localLandscape = landscape
    shader.uniforms.quietSurface = quietSurface
    shader.uniforms.contourSurface = contourSurface
    shader.vertexShader = `varying float fieldHeight;\nvarying vec2 surfaceUV;\n${shader.vertexShader}`
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        fieldHeight = position.y / ${relief};
        surfaceUV = position.xz / ${side * 2} + 0.5;`)
    shader.fragmentShader = `
      varying float fieldHeight;
      varying vec2 surfaceUV;
      uniform vec3 land0, land1, land2, land3, contourInk;
      uniform float localLandscape;
      uniform float quietSurface;
      uniform float contourSurface;
      ${shader.fragmentShader}
    `.replace('#include <color_fragment>', `
      #include <color_fragment>
      float h = clamp(fieldHeight, 0.0, 1.0);
      vec3 c = mix(land0, land1, smoothstep(0.0, 0.42, h));
      c = mix(c, land2, smoothstep(0.25, 0.72, h));
      c = mix(c, land3, smoothstep(0.6, 1.0, h));
      vec2 meshCoordinates = surfaceUV * 16.0;
      vec2 meshDistance = abs(fract(meshCoordinates + 0.5) - 0.5);
      vec2 meshLines = 1.0 - smoothstep(vec2(0.0), max(fwidth(meshCoordinates) * 0.85, vec2(0.001)), meshDistance);
      float mesh = max(meshLines.x, meshLines.y);
      float bands = fieldHeight * mix(10.0, 18.0, contourSurface);
      float distanceToLine = abs(fract(bands + 0.5) - 0.5);
      float contour = 1.0 - smoothstep(0.0, max(fwidth(bands) * 0.7, 0.001), distanceToLine);
      float meshStrength = mix(mix(0.72, 0.18, quietSurface), 0.075, contourSurface);
      float contourStrength = mix(mix(0.26, 0.14, quietSurface), 0.44, contourSurface);
      diffuseColor.rgb = mix(c, contourInk, max(meshStrength * mesh, contourStrength * contour));
      float edge = min(min(surfaceUV.x, 1.0 - surfaceUV.x), min(surfaceUV.y, 1.0 - surfaceUV.y));
      float fadePlateau = 1.0 - localLandscape * smoothstep(0.78, 0.97, h);
      diffuseColor.a *= smoothstep(0.0, 0.012, edge) * fadePlateau * mix(0.82 + 0.18 * mesh, 1.0, contourSurface);
    `)
  }
  const geometry = new T.PlaneGeometry(side * 2, side * 2, 112, 112)
  geometry.rotateX(-Math.PI / 2)
  const surface = new T.Mesh(geometry, material)
  scene.add(surface)

  function elevation(x: number, y: number) {
    const [low, high] = panel.valueRange
    return (panel.field(x, y) - low) / (high - low || 1) * relief
  }
  function world(point: ScenePoint, lift = 0.025) {
    const y = point.z === undefined
      ? elevation(point.x, point.y)
      : (point.z - panel.valueRange[0]) / (panel.valueRange[1] - panel.valueRange[0] || 1) * relief
    return new T.Vector3(point.x / panel.extent * side, y + lift, -point.y / panel.extent * side)
  }
  function discard(object: Three.Object3D) {
    object.traverse(child => {
      const mesh = child as Three.Mesh
      mesh.geometry?.dispose()
      if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(value => value.dispose())
    })
    scene.remove(object)
  }
  function tube(points: Three.Vector3[], tone: SceneTone, lineWidth = 2.5, opacity = 1, dashed = false) {
    if (points.length < 2) return
    const color = cssTone(canvas, tone)
    const chunks = dashed
      ? Array.from({ length: Math.ceil((points.length - 1) / 7) }, (_, index) => points.slice(index * 7, index * 7 + 5))
      : [points]
    for (const chunk of chunks) {
      if (chunk.length < 2 || chunk.every(point => point.distanceTo(chunk[0]) < 1e-8)) continue
      const curve = new T.CatmullRomCurve3(chunk, false, 'centripetal')
      const radius = lineWidth * 0.011
      for (const casing of [true, false]) {
        const mesh = new T.Mesh(
          new T.TubeGeometry(curve, Math.max(12, chunk.length), radius + (casing ? 0.012 : 0), 6, false),
          new T.MeshBasicMaterial({
            color: casing ? (dark ? '#e5dcc6' : '#f3eddd') : color,
            transparent: true, opacity: opacity * (casing ? 0.78 : 1), depthWrite: false,
          }),
        )
        mesh.renderOrder = casing ? 3 : 4
        annotations.push(mesh)
        scene.add(mesh)
      }
    }
  }
  function drawAnnotations() {
    annotations.forEach(discard)
    annotations = []
    projectedLabels = []
    labels.replaceChildren()
    const leaders = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    leaders.classList.add('arg-scene-leaders')
    leaders.setAttribute('aria-hidden', 'true')
    labels.append(leaders)
    for (const region of panel.regions ?? []) {
      if (region.boundary.length < 3) continue
      if (region.fill !== false) {
        const center = region.boundary.reduce((p, q) => ({ x: p.x + q.x / region.boundary.length, y: p.y + q.y / region.boundary.length }), { x: 0, y: 0 })
        const vertices: number[] = []
        for (let index = 0; index < region.boundary.length; index += 1) {
          const a = region.boundary[index], b = region.boundary[(index + 1) % region.boundary.length]
          const at = (point: ScenePoint, t: number) => world({ x: center.x + (point.x - center.x) * t, y: center.y + (point.y - center.y) * t }, 0.018)
          for (let step = 0; step < 14; step += 1) {
            const p0 = at(a, step / 14), p1 = at(b, step / 14), p2 = at(b, (step + 1) / 14), p3 = at(a, (step + 1) / 14)
            for (const point of [p0, p1, p2, p0, p2, p3]) vertices.push(point.x, point.y, point.z)
          }
        }
        const fill = new T.BufferGeometry()
        fill.setAttribute('position', new T.Float32BufferAttribute(vertices, 3))
        const mesh = new T.Mesh(fill, new T.MeshBasicMaterial({
          color: cssTone(canvas, region.tone), opacity: region.opacity ?? 0.22, transparent: true,
          side: T.DoubleSide, depthWrite: false,
        }))
        mesh.renderOrder = 1
        scene.add(mesh)
        annotations.push(mesh)
      }
      if (region.outline !== false) {
        tube([...region.boundary, region.boundary[0]].map(point => world(point, 0.035)), region.tone, 1.25, region.opacity === 0 ? 0.65 : 0.95, region.dashed)
      }
    }
    for (const path of panel.paths ?? []) {
      tube(path.points.map(point => world(point, 0.055)), path.tone, path.width ?? 2.5, path.opacity ?? 1, path.dashed)
    }
    // Place the actual model's label before annotations naming task boundaries.
    const markers = [...(panel.markers ?? [])].sort((a, b) =>
      (a.labelOnly ? 2 : a.hollow ? 1 : 0) - (b.labelOnly ? 2 : b.hollow ? 1 : 0))
    for (const marker of markers) {
      const point = world(marker.point, 0.075)
      if (!marker.labelOnly) {
        const border = new T.Mesh(new T.SphereGeometry(0.078, 12, 8), new T.MeshBasicMaterial({ color: dark ? '#ece5d0' : '#fcf8ed' }))
        border.position.copy(point)
        const core = new T.Mesh(new T.SphereGeometry(marker.hollow ? 0.045 : 0.052, 12, 8), new T.MeshBasicMaterial({ color: marker.hollow ? cssTone(canvas, 'muted') : cssTone(canvas, marker.tone) }))
        core.position.copy(point).add(new T.Vector3(0, 0.038, 0))
        annotations.push(border, core)
        scene.add(border, core)
      }
      if (marker.label) {
        const element = document.createElement('span')
        element.className = 'arg-scene-pin'
        element.textContent = marker.label
        element.style.borderColor = cssTone(canvas, marker.tone)
        element.setAttribute('aria-hidden', 'true')
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('stroke', cssTone(canvas, marker.tone))
        leaders.append(line)
        labels.append(element)
        projectedLabels.push({ element, line, point })
      }
    }
  }
  function drawSurface() {
    const vertices = geometry.attributes.position as Three.BufferAttribute
    for (let index = 0; index < vertices.count; index += 1) {
      vertices.setY(index, elevation(vertices.getX(index) / side * panel.extent, -vertices.getZ(index) / side * panel.extent))
    }
    vertices.needsUpdate = true
    geometry.computeVertexNormals()
    geometry.computeBoundingSphere()
  }
  function render() {
    if (!active || disposed || !width || !height) return
    camera.position.set(12 * Math.sin(pose.turn) * Math.cos(pose.tilt), focusHeight + 12 * Math.sin(pose.tilt), 12 * Math.cos(pose.turn) * Math.cos(pose.tilt))
    camera.lookAt(0, focusHeight, 0)
    camera.updateMatrixWorld()
    renderer.render(scene, camera)
    const placed: LabelBox[] = []
    for (const marker of projectedLabels) {
      const p = marker.point.clone().project(camera)
      const box = marker.element.getBoundingClientRect()
      const px = (p.x + 1) * width / 2
      const py = (1 - p.y) * height / 2
      const { x, y } = placeLabel(px, py, box.width, box.height, width, height, placed)
      marker.element.style.transform = `translate(${x}px, ${y}px)`
      marker.line.setAttribute('x1', String(px))
      marker.line.setAttribute('y1', String(py))
      marker.line.setAttribute('x2', String(Math.max(x + 2, Math.min(x + box.width - 2, px))))
      marker.line.setAttribute('y2', String(Math.max(y + 2, Math.min(y + box.height - 2, py))))
      placed.push({ x, y, w: box.width, h: box.height })
    }
  }
  function resize() {
    const box = canvas.getBoundingClientRect()
    width = box.width
    height = box.height
    if (!width || !height) return
    renderer.setSize(width, height, false)
    const ratio = width / height
    const vertical = Math.max(6.45, 6.85 / ratio)
    camera.zoom = minWidth ? Math.min(zoom, vertical * ratio / minWidth) : zoom
    camera.left = -vertical * ratio / 2
    camera.right = vertical * ratio / 2
    camera.top = vertical / 2 + offsetY
    camera.bottom = -vertical / 2 + offsetY
    camera.updateProjectionMatrix()
    render()
  }
  function appearance() {
    dark = !!canvas.closest('[data-edition="black"]')
    const palette = panel.surfaceStyle === 'contours'
      ? dark ? ['#88b8bc', '#9ab5b8', '#b6c4bc', '#d0cbb5'] : ['#547e89', '#8eaaa9', '#c8d0bd', '#eee7d3']
      : panel.surfaceStyle === 'subtle'
        ? dark ? ['#93a6aa', '#667e85', '#394e58', '#142329'] : ['#9caeb4', '#bfccd0', '#dce1dc', '#eeece2']
        : dark ? ['#7ea7ce', '#6489ad', '#3d5c7c', '#23374d'] : ['#6588b0', '#97b5d1', '#c4d7e7', '#e5eef4']
    palette.forEach((value, index) => colors[index].value.set(value))
    ink.value.set(dark ? '#c5dcef' : '#34577d')
    drawAnnotations()
    render()
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  drawSurface()
  appearance()
  resize()
  return {
    update(next) {
      const changed = panel.field !== next.field || panel.extent !== next.extent
        || panel.valueRange[0] !== next.valueRange[0] || panel.valueRange[1] !== next.valueRange[1]
      panel = next
      landscape.value = panel.regions?.length ? 1 : 0
      contourSurface.value = panel.surfaceStyle === 'contours' ? 1 : 0
      if (changed) drawSurface()
      drawAnnotations()
      render()
    },
    pose(next) { pose = next; render() },
    visible(next) { active = next; render() },
    appearance,
    dispose() {
      disposed = true
      resizeObserver.disconnect()
      annotations.forEach(discard)
      geometry.dispose()
      material.dispose()
      labels.replaceChildren()
      renderer.dispose()
    },
  }
}

function StaticSurface({ panel, zoom = 1, offsetY = 0, pose = homePose }: { panel: ScenePanel; zoom?: number; offsetY?: number; pose?: Pose }) {
  const cells: { points: string; height: number; depth: number; contours: string[] }[] = []
  const placedLabels: LabelBox[] = []
  const contourStyle = panel.surfaceStyle === 'contours'
  const count = contourStyle ? 58 : 26
  const fade = (from: number, to: number, value: number) => {
    const t = Math.max(0, Math.min(1, (value - from) / (to - from)))
    return t * t * (3 - 2 * t)
  }
  const project = ({ x, y, z }: ScenePoint) => {
    const h = ((z ?? panel.field(x, y)) - panel.valueRange[0]) / (panel.valueRange[1] - panel.valueRange[0] || 1)
    const wx = x / panel.extent * side
    const wz = -y / panel.extent * side
    return {
      x: 160 + (wx * Math.cos(pose.turn) - wz * Math.sin(pose.turn)) * 39 * zoom,
      y: 140 - (
        -wx * Math.sin(pose.turn) * Math.sin(pose.tilt)
        + (h * relief - focusHeight) * Math.cos(pose.tilt)
        - wz * Math.cos(pose.turn) * Math.sin(pose.tilt)
      ) * 39 * zoom + offsetY * 39 * zoom,
      depth: wx * Math.sin(pose.turn) * Math.cos(pose.tilt)
        + (h * relief - focusHeight) * Math.sin(pose.tilt)
        + wz * Math.cos(pose.turn) * Math.cos(pose.tilt),
      h,
    }
  }
  const at = (i: number, j: number): ScenePoint => {
    const x = (i / count * 2 - 1) * panel.extent
    const y = (j / count * 2 - 1) * panel.extent
    return { x, y, z: panel.field(x, y) }
  }
  const points = (values: readonly ScenePoint[]) => values.map(value => {
    const point = project(value)
    return `${point.x},${point.y}`
  }).join(' ')
  for (let j = 0; j < count; j += 1) for (let i = 0; i < count; i += 1) {
    const samples = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)]
    const corners = samples.map(project)
    const contours: string[] = []
    if (contourStyle) {
      for (let level = 1; level < 18; level += 1) {
        const height = panel.valueRange[0] + level / 18 * (panel.valueRange[1] - panel.valueRange[0])
        const crossings: ScenePoint[] = []
        for (let edge = 0; edge < 4; edge += 1) {
          const a = samples[edge], b = samples[(edge + 1) % 4]
          const az = a.z!, bz = b.z!
          if ((az < height) === (bz < height)) continue
          const t = (height - az) / (bz - az)
          crossings.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y), z: height })
        }
        for (let pair = 0; pair + 1 < crossings.length; pair += 2) contours.push(points(crossings.slice(pair, pair + 2)))
      }
    }
    cells.push({
      points: corners.map(p => `${p.x},${p.y}`).join(' '),
      height: corners.reduce((sum, p) => sum + p.h, 0) / 4,
      depth: corners.reduce((sum, p) => sum + p.depth, 0) / 4,
      contours,
    })
  }
  function cellColor(height: number) {
    const fraction = Math.max(0, Math.min(1, height))
    if (!contourStyle) return `color-mix(in srgb, var(--arg-surface-low) ${(1 - fraction) * 100}%, var(--arg-surface-high))`
    const stop = Math.min(2, Math.floor(fraction * 3))
    const low = stop === 0 ? '--fisher-land-low' : stop === 1 ? '--fisher-land-mid' : '--fisher-land-upper'
    const high = stop === 0 ? '--fisher-land-mid' : stop === 1 ? '--fisher-land-upper' : '--fisher-land-high'
    return `color-mix(in srgb, var(${low}) ${(1 - (fraction * 3 - stop)) * 100}%, var(${high}))`
  }
  return (
    <svg className="arg-scene-static" viewBox="0 0 320 280" role="img" aria-label={`${panel.title}. ${panel.metric?.label ?? ''} ${panel.metric?.value ?? ''}`}>
      {cells.sort((a, b) => a.depth - b.depth).map((cell, index) => <g key={index}>
        <polygon points={cell.points} fill={cellColor(cell.height)}
          opacity={panel.regions?.length ? 1 - fade(0.78, 0.97, cell.height) : contourStyle ? 1 : 0.85}
          stroke={contourStyle ? cellColor(cell.height) : 'var(--arg-mesh-ink)'}
          strokeOpacity={contourStyle ? 1 : panel.surfaceStyle === 'subtle' ? '0.12' : '0.5'} strokeWidth="0.6"
        />
        {cell.contours.map((line, lineIndex) => <polyline key={lineIndex} points={line}
          fill="none" stroke="var(--arg-mesh-ink)" strokeOpacity=".55" strokeWidth=".65" />)}
      </g>)}
      {(panel.regions ?? []).map(region => (
        <polygon key={region.id} points={points(region.boundary)} data-tone={region.tone}
          fill={region.fill === false ? 'none' : 'var(--arg-tone)'} fillOpacity={region.opacity ?? 0.18}
          stroke={region.outline === false ? 'none' : 'var(--arg-tone)'} strokeWidth="1.5" strokeDasharray={region.dashed ? '4 3' : undefined} />
      ))}
      {(panel.paths ?? []).map(path => (
        <polyline key={path.id} points={points(path.points)} data-tone={path.tone}
          fill="none" stroke="var(--arg-tone, var(--arg-reference))" opacity={path.opacity ?? 1}
          strokeWidth={path.width ?? 2} strokeDasharray={path.dashed ? '4 3' : undefined} />
      ))}
      {[...(panel.markers ?? [])].sort((a, b) =>
        (a.labelOnly ? 2 : a.hollow ? 1 : 0) - (b.labelOnly ? 2 : b.hollow ? 1 : 0)).map(marker => {
        const point = project(marker.point)
        const labelBox = marker.label
          ? placeLabel(point.x, point.y, marker.label.length * 6.6 + 8, 20, 320, 280, placedLabels)
          : null
        if (labelBox) placedLabels.push(labelBox)
        return (
          <g key={marker.id} data-tone={marker.tone}>
            {!marker.labelOnly && <circle cx={point.x} cy={point.y} r="3.5"
              fill={marker.hollow ? 'var(--scol-bg)' : 'var(--arg-tone, var(--arg-reference))'}
              stroke="var(--scol-bg)" strokeWidth="1.5" />}
            {marker.label && labelBox && <>
              <line x1={point.x} y1={point.y}
                x2={Math.max(labelBox.x + 2, Math.min(labelBox.x + labelBox.w - 2, point.x))}
                y2={Math.max(labelBox.y + 2, Math.min(labelBox.y + labelBox.h - 2, point.y))}
                stroke="var(--arg-tone, var(--arg-reference))" strokeWidth=".7" />
              <rect className="arg-scene-static-label" x={labelBox.x} y={labelBox.y} width={labelBox.w} height={labelBox.h}
                fill="var(--scol-bg)" fillOpacity=".95" />
              <text x={labelBox.x + labelBox.w / 2} y={labelBox.y + 14}
                textAnchor="middle" fontSize="13" fill="var(--scol-ink)"
                textLength={labelBox.w - 8} lengthAdjust="spacingAndGlyphs">{marker.label}</text>
            </>}
          </g>
        )
      })}
    </svg>
  )
}

export function SurfacePanel({ panel, pose, onPose, legend, detail, selected, id, bare = false, zoom = 1, offsetY = 0, minWidth = 0, resetPose = homePose }: {
  panel: ScenePanel
  pose: Pose
  onPose: (pose: Pose) => void
  legend?: ArgumentSceneProps['legend']
  detail?: ReactNode
  selected: boolean
  id: string
  bare?: boolean
  zoom?: number
  offsetY?: number
  minWidth?: number
  resetPose?: Pose
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const labels = useRef<HTMLDivElement>(null)
  const host = useRef<HTMLElement>(null)
  const instance = useRef<SceneRuntime>()
  const latest = useRef({ panel, pose })
  latest.current = { panel, pose }
  const [status, setStatus] = useState<'waiting' | 'ready' | 'static'>('waiting')
  const gesture = useRef<{ id: number; x: number; y: number; pose: Pose }>()

  useEffect(() => {
    let cancelled = false
    let started = false
    let near = false
    const visible = () => instance.current?.visible(near && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => {
      near = entry.isIntersecting
      if (near && !started && canvas.current && labels.current) {
        started = true
        makeScene(canvas.current, labels.current, latest.current.panel, latest.current.pose, zoom, offsetY, minWidth).then(runtime => {
          if (cancelled) return runtime.dispose()
          instance.current = runtime
          runtime.update(latest.current.panel)
          runtime.pose(latest.current.pose)
          visible()
          setStatus('ready')
        }).catch(() => { if (!cancelled) setStatus('static') })
      }
      visible()
    }, { rootMargin: '180px' })
    if (host.current) observer.observe(host.current)
    const root = host.current?.closest('.scol-blog')
    const theme = new MutationObserver(() => instance.current?.appearance())
    if (root) theme.observe(root, { attributes: true, attributeFilter: ['data-edition'] })
    document.addEventListener('visibilitychange', visible)
    return () => {
      cancelled = true
      observer.disconnect()
      theme.disconnect()
      document.removeEventListener('visibilitychange', visible)
      instance.current?.dispose()
      instance.current = undefined
    }
  }, [])
  useLayoutEffect(() => { instance.current?.update(panel) }, [panel])
  useLayoutEffect(() => { instance.current?.pose(pose) }, [pose])

  return (
    <section ref={host} id={id} className="arg-scene-panel" aria-label={panel.title} data-panel={panel.id} data-selected={selected} data-scene-status={status}>
      {!bare && <header>
        <h4>{panel.title}</h4>
        {detail ?? (panel.subtitle && <p>{panel.subtitle}</p>)}
      </header>}
      {legend && <div className="arg-scene-legend arg-scene-panel-key" aria-label={`${panel.title} legend`}>
        {legend.filter(item => !item.dashed || panel.regions?.some(region => region.dashed)).map(item =>
          <span key={item.label}><i data-tone={item.tone} data-dashed={item.dashed || undefined} aria-hidden="true" />{item.label}</span>)}
      </div>}
      <div className="arg-scene-stage">
        {status === 'static' ? <StaticSurface panel={panel} zoom={zoom} offsetY={offsetY} pose={pose} /> : (
          <canvas
            ref={canvas}
            tabIndex={0}
            role="group"
            aria-label={`${panel.title}, 3D surface. Drag or use arrow keys to rotate. Press Home to reset the view.`}
            onPointerDown={event => {
              if (event.button !== 0) return
              gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, pose }
              if (event.pointerType !== 'touch') event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={event => {
              const start = gesture.current
              if (!start || start.id !== event.pointerId) return
              onPose({
                turn: start.pose.turn - (event.clientX - start.x) * 0.008,
                tilt: event.pointerType === 'touch' ? start.pose.tilt : Math.max(0.3, Math.min(1.45, start.pose.tilt + (event.clientY - start.y) * 0.006)),
              })
            }}
            onPointerUp={() => { gesture.current = undefined }}
            onPointerCancel={() => { gesture.current = undefined }}
            onKeyDown={event => {
              if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return
              event.preventDefault()
              if (event.key === 'Home') onPose(resetPose)
              else onPose({
                turn: pose.turn + (event.key === 'ArrowLeft' ? -0.12 : event.key === 'ArrowRight' ? 0.12 : 0),
                tilt: Math.max(0.3, Math.min(1.45, pose.tilt + (event.key === 'ArrowUp' ? 0.1 : event.key === 'ArrowDown' ? -0.1 : 0))),
              })
            }}
          />
        )}
        <div ref={labels} className="arg-scene-labels" />
        {status === 'waiting' && <span className="arg-scene-loading">Drawing…</span>}
      </div>
      {panel.metric && (
        <div className="arg-scene-metric" data-tone={panel.metric.tone ?? 'reference'}>
          <span>{panel.metric.label}</span>
          <strong>{panel.metric.value}</strong>
          {panel.metric.note && <small>{panel.metric.note}</small>}
        </div>
      )}
    </section>
  )
}

export default function ArgumentScene({ panels, description, heightLabel, legend = [], repeatLegend = false, panelDetails, className = '' }: ArgumentSceneProps) {
  const [pose, setPose] = useState<Pose>(homePose)
  const [selected, setSelected] = useState(panels[0]?.id)
  const selectedId = panels.some(panel => panel.id === selected) ? selected : panels[0]?.id
  const id = useId().replace(/:/g, '')
  return (
    <div className={`arg-scene ${className}`} aria-describedby={`${id}-description`} data-panel-count={panels.length}>
      <div className="arg-scene-compact-toolbar">
        <div className="arg-scene-switcher" role="group" aria-label="Choose a comparison view">
          {panels.map(panel => <button type="button" key={panel.id}
            aria-pressed={selectedId === panel.id} aria-controls={`${id}-${panel.id}`}
            onClick={() => setSelected(panel.id)}>{panel.title.replace(/^\([a-z]\)\s*/, '').replace(/ alone$/, '')}</button>)}
        </div>
        <button type="button" className="arg-scene-compact-reset" aria-label="Reset all views" onClick={() => setPose(homePose)}>↺</button>
      </div>
      <div className="arg-scene-key">
        <div className="arg-scene-legend" aria-label="Figure legend">
          {legend.map(item => <span key={item.label} data-legend={item.label}><i data-tone={item.tone} data-dashed={item.dashed || undefined} aria-hidden="true" />{item.label}</span>)}
        </div>
        <span className="arg-scene-height">{heightLabel}</span>
        <div className="arg-scene-view">
          <span>Drag to rotate</span>
          <button type="button" onClick={() => setPose(homePose)}>Reset view</button>
        </div>
      </div>
      <div className="arg-scene-panels" style={{ '--arg-panel-count': panels.length } as CSSProperties}>
        {panels.map(panel => <SurfacePanel key={panel.id} panel={panel} pose={pose} onPose={setPose}
          legend={repeatLegend ? legend : undefined} detail={panelDetails?.[panel.id]}
          selected={selectedId === panel.id} id={`${id}-${panel.id}`} />)}
      </div>
      <p id={`${id}-description`} className="arg-scene-description">{description}</p>
    </div>
  )
}
