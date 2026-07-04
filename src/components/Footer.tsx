export default function Footer() {
  return (
    <footer className="colophon">
      <div className="col-a">
        Zekun Wang — personal site. Set on a 12-column modular grid, warm
        off-white on pure black, one international red. Swiss International
        Typographic Style.
      </div>
      <div className="col-b">
        Continual learning
        <br />
        Compositionality · Concept
        <br />
        Language · Diffusion · RL
      </div>
      <div className="col-c">
        <span>
          © {new Date().getFullYear()} · Grid System · <span className="rev">REV 05</span>
        </span>
      </div>
    </footer>
  )
}
