/** Two open, slightly irregular contours: the lens as an ink drawing. */
export default function LensArtwork() {
  return (
    <svg
      className="lens-artwork"
      viewBox="0 0 80 54"
      width="80"
      height="54"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M59 10C47 3 28 12 23 26c-5 14 4 23 17 19 13-4 24-18 23-28-.3-3-1.5-5-3-6"
        strokeWidth="1.05"
      />
      <path
        d="M15 36C9 34 17 23 33 17 47 11 65 10 69 16c4 7-10 18-28 23-10 3-19 3-24 1"
        strokeWidth=".8"
        opacity=".65"
      />
    </svg>
  )
}
