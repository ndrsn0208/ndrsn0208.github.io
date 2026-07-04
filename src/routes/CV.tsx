const PDF = '/cv.pdf'

export default function CV() {
  return (
    <section id="cv" aria-labelledby="cv-h">
      <div className="page-band reveal" data-d="1">
        <div className="cell band-idx">
          <div className="idx">03</div>
        </div>
        <div className="cell band-title">
          <h2 id="cv-h">Curriculum Vitae</h2>
        </div>
      </div>

      <div className="cv-grid reveal" data-d="2">
        <div className="cv-lead">
          <div className="idx" style={{ marginBottom: 16 }}>03 — CURRICULUM VITAE</div>
          <div className="huge">
            FULL
            <br />
            <span className="red">RECORD</span>
            <br />
            ON PAPER
          </div>
          <p>
            Education, publications, talks, teaching, and service in one
            document. The complete CV is embedded below and available as a PDF
            for the details that do not fit on a grid.
          </p>
        </div>
        <div className="cv-action">
          <div className="cv-list">
            <div className="li"><span>PhD, Computer Science · Georgia Tech</span><span className="yr">Now</span></div>
            <div className="li"><span>Continual learning of generative models</span><span className="yr">Focus</span></div>
            <div className="li"><span>13 papers · ICLR · NeurIPS · ACL · NAACL · AAAI</span><span className="yr">'22–'26</span></div>
            <div className="li"><span>Advised by Christopher MacLellan</span><span className="yr">Lab</span></div>
          </div>
          <a className="dl-btn" href={PDF} download="Zekun_Wang_CV.pdf" aria-label="Download CV as PDF">
            <span>Download CV (PDF)</span>
            <span aria-hidden>↓</span>
          </a>
        </div>
      </div>

      <div className="cv-viewer reveal" data-d="3">
        <div className="cv-viewer-bar">
          <span className="lbl">zekun_wang_cv.pdf</span>
          <a className="open" href={PDF} target="_blank" rel="noopener noreferrer">
            open ↗
          </a>
        </div>
        <object data={`${PDF}#view=FitH`} type="application/pdf" className="cv-object">
          <div className="cv-fallback">
            <p className="mono" style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>
              Your browser can&apos;t show the PDF inline here.
            </p>
            <a
              className="dl-btn"
              href={PDF}
              download="Zekun_Wang_CV.pdf"
              style={{ width: 'auto', marginTop: 20, display: 'inline-flex' }}
            >
              <span>Download the CV</span>
              <span aria-hidden>↓</span>
            </a>
          </div>
        </object>
      </div>
    </section>
  )
}
