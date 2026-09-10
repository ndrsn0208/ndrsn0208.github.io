import { useId } from 'react'

// Nested, offset apertures make a small architectural object out of empty space.
// This is an optical drawing, with no measurements or implied research data.
const apertures = Array.from({ length: 17 }, (_, index) => {
  const depth = index / 16
  const inset = 1 - Math.pow(1 - depth, 1.6)
  return {
    x: 24 + 83 * inset,
    y: 25 + 56 * inset,
    width: 230 - 135 * inset,
    height: 246 - 140 * inset,
  }
})

export default function FrameArtwork() {
  const id = useId().replace(/:/g, '')
  const edge = `frame-edge-${id}`
  const face = `frame-face-${id}`
  const light = `frame-light-${id}`

  return (
    <svg
      className="frame-artwork"
      viewBox="0 0 280 300"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={edge} x1="24" y1="25" x2="254" y2="271" gradientUnits="userSpaceOnUse">
          <stop className="frame-art-stop-dim" />
          <stop offset=".27" className="frame-art-stop-light" />
          <stop offset=".53" className="frame-art-stop-mid" />
          <stop offset=".78" className="frame-art-stop-light" />
          <stop offset="1" className="frame-art-stop-dim" />
        </linearGradient>
        <linearGradient id={face} x1="30" y1="246" x2="176" y2="107" gradientUnits="userSpaceOnUse">
          <stop className="frame-art-stop-mid" stopOpacity=".12" />
          <stop offset="1" className="frame-art-stop-mid" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={light} x1="28" y1="26" x2="246" y2="263" gradientUnits="userSpaceOnUse">
          <stop className="frame-art-stop-light" stopOpacity=".9" />
          <stop offset=".42" className="frame-art-stop-light" stopOpacity=".12" />
          <stop offset="1" className="frame-art-stop-light" stopOpacity=".7" />
        </linearGradient>
      </defs>

      <g className="frame-art-registration" strokeWidth=".75">
        <path d="M7 25h7M24 8v7M264 25h8M254 8v7M7 271h7M24 281v8M264 271h8M254 281v8" />
        <path d="M107 291h95" />
      </g>

      <path d="M24 25 107 81v106L24 271Z" fill={`url(#${face})`} />
      <path d="m24 271 83-84h95l52 84Z" fill={`url(#${face})`} />

      <g className="frame-art-depth" stroke={`url(#${edge})`} strokeWidth=".85">
        {apertures.map((aperture, index) => (
          <rect
            key={index}
            {...aperture}
            rx=".35"
            opacity={index === 0 || index === apertures.length - 1 ? 1 : .76}
          />
        ))}
      </g>

      <g className="frame-art-seams" strokeWidth=".65">
        <path d="m24 25 83 56M254 25l-52 56M24 271l83-84M254 271l-52-84" />
      </g>

      <path
        d="M24 75V25h50M204 25h50v50M254 221v50h-50M74 271H24v-50"
        stroke={`url(#${light})`}
        strokeWidth="1.5"
      />
      <path className="frame-art-aperture" d="M107 109V81h28m39 106h28v-28" strokeWidth="1.3" />
      <path className="frame-art-axis" d="M140 134h12m-6-6v12" strokeWidth=".85" />
      <path className="frame-art-registration" d="M140 291h12" strokeWidth="1.5" />
    </svg>
  )
}
