/* The site's one drawing, as a tool: a loss surface in parameter space, seen
   from above and drawn in hairlines. The overview and the essays draw on it. */

export type Point = { x: number, y: number }
export type View = ReturnType<typeof makeView>

export const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))
export const mix = (a: number, b: number, t: number) => a + (b - a) * t
export const smooth = (t: number) => { const u = clamp(t, 0, 1); return u * u * (3 - 2 * u) }

/** A camera over level ground. `clear` is how far down the surface starts, in pixels.
    `pitch` fixes the camera's tilt in degrees. Without it, wide views look from lower down. */
export function makeView(width: number, height: number, clear = 0, pitchDegrees?: number) {
  const wide = clamp((width / height - .7) / 1.5, 0, 1)
  const pitch = (pitchDegrees ?? mix(50, 31, wide)) * Math.PI / 180
  const sin = Math.sin(pitch)
  const cos = Math.cos(pitch)
  const back = 2.6
  const lift = mix(2.3, 1.55, wide)
  const far = mix(2.3, 3.1, wide)
  const near = mix(-1.5, -1.25, wide)
  // The surface begins under the words that share the space with it.
  const top = pitchDegrees === undefined ? clamp(clear + 10, height * .24, height * .62) : clear
  const depth = (y: number, z = 0) => (y + back) * cos + (lift - z) * sin
  const rise = (y: number, z = 0) => (y + back) * sin - (lift - z) * cos
  const farRise = -rise(far) / depth(far)
  const scale = (height * 1.08 - top) / (-rise(near) / depth(near) - farRise)
  return {
    width, height, top, far, near, scale,
    project(x: number, y: number, z: number): [number, number] {
      const d = depth(y, z)
      return [width / 2 + x / d * scale, top + (-rise(y, z) / d - farRise) * scale]
    },
    /** The point under a pixel on a level plane at height z. */
    ground(px: number, py: number, z = 0): Point {
      const nx = (px - width / 2) / scale
      const ny = (py - top) / scale + farRise
      const ry = (lift - z) * (cos - ny * sin) / Math.max(.08, sin + ny * cos)
      const y = clamp(ry - back, near + .25, far - .9)
      return { x: nx * depth(y, z), y }
    },
    /** The depth whose level ground meets the middle of the view at a pixel row. */
    depthAt(py: number) {
      const ny = (py - top) / scale + farRise
      return lift * (cos - ny * sin) / Math.max(.02, sin + ny * cos) - back
    },
    /** Half the visible width of the ground at a depth. */
    reach(y: number) { return width / 2 * depth(y) / scale },
  }
}

/** The surface itself: ridges from the horizon to the viewer, each hiding what lies behind it.
    `arrival` runs from 0 to 1 as the surface draws in from the horizon. */
export function drawRidges(
  context: CanvasRenderingContext2D,
  view: View,
  heightAt: (x: number, y: number) => number,
  paper: string,
  line: string,
  arrival = 1,
  /** How many ridges to draw. A short strip of the surface takes fewer. */
  count?: number,
) {
  const { width, height: tall } = view
  const rows = count ?? (width < 700 ? 46 : 62)
  const samples = Math.round(clamp(width / 7, 90, 210))
  const xs = new Float32Array(samples + 1)
  const ys = new Float32Array(samples + 1)
  for (let row = 0; row < rows; row += 1) {
    const t = row / (rows - 1)
    // Ridges are spaced evenly on the page, a little closer toward the horizon.
    const y = view.depthAt(mix(view.top, tall * 1.08, t ** 1.12))
    const reach = view.reach(y) * 1.06
    let lowest = -Infinity
    for (let index = 0; index <= samples; index += 1) {
      const x = mix(-reach, reach, index / samples)
      const [px, py] = view.project(x, y, heightAt(x, y))
      xs[index] = px
      ys[index] = py
      if (py > lowest) lowest = py
    }
    if (lowest < -40) continue
    // Nearer ridges hide what lies behind them.
    context.beginPath()
    context.moveTo(xs[0], ys[0])
    for (let index = 1; index <= samples; index += 1) context.lineTo(xs[index], ys[index])
    context.lineTo(width + 40, tall + 40)
    context.lineTo(-40, tall + 40)
    context.closePath()
    context.fillStyle = paper
    context.fill()
    const arrive = smooth(arrival * (rows + 14) / 14 - row / 14)
    const alpha = mix(.07, .36, t ** 1.25) * smooth(row / 7) * arrive
    if (alpha < .004) continue
    context.beginPath()
    context.moveTo(xs[0], ys[0])
    for (let index = 1; index <= samples; index += 1) context.lineTo(xs[index], ys[index])
    context.strokeStyle = `rgba(${line}, ${alpha})`
    context.lineWidth = 1
    context.stroke()
  }
}
