// Open contours gather into a fold, then separate at the loose ends.
const contours = Array.from({ length: 17 }, (_, index) => {
  const t = index / 16
  return [
    `M ${30 + 26 * t} ${150 + 43 * t}`,
    `C ${41 + 26 * t} ${124 + 20 * t}, ${79 + 12 * t} ${106 - 29 * t}, ${112 + 27 * t} ${66 - 10 * t}`,
    `C ${148 + 24 * t} ${23 + 17 * t}, ${213 + 24 * t} ${22 + 29 * t}, ${247 - 5 * t} ${53 + 24 * t}`,
    `C ${280 - 7 * t} ${85 + 19 * t}, ${261 - 24 * t} ${129 + 17 * t}, ${217 - 18 * t} ${145 + 18 * t}`,
    `C ${172 - 13 * t} ${161 + 18 * t}, ${123 - 14 * t} ${150 + 39 * t}, ${92 - 26 * t} ${168 + 40 * t}`,
    `C ${59 - 27 * t} ${188 + 20 * t}, ${42 - 16 * t} ${193 - 9 * t}, ${39 - 4 * t} ${179 - 18 * t}`,
  ].join(' ')
})

export default function DriftArtwork() {
  return (
    <svg
      className="drift-artwork"
      viewBox="0 0 304 238"
      width="304"
      height="238"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <g className="drift-artwork-flow">
        <g className="drift-artwork-contours">
          {contours.map((d, index) => (
            <path key={index} d={d} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
        <path
          className="drift-artwork-spine"
          d="M43 172C62 141 80 91 127 61C173 31 219 37 245 66C271 96 244 136 207 152C169 169 119 168 80 190C59 202 40 195 36 172"
          vectorEffect="non-scaling-stroke"
        />
        <g className="drift-artwork-wisps">
          <path
            d="M22 139C48 115 62 75 105 47C138 25 174 19 198 23"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M113 209C149 186 190 185 229 169C258 157 278 132 281 111"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </g>
    </svg>
  )
}
