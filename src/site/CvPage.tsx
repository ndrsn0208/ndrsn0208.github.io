import { useBlogMetadata } from '../blog/BlogLayout'
import config from '../data/config.json'
import SiteFrame from './SiteFrame'
import './about.css'

// Vite supplies the current PDF's content hash. Keep it on every PDF URL.
const PDF_URL = __CV_PDF_URL__
const PDF_VIEW_URL = `${PDF_URL}#view=FitH`

function PdfActions() {
  return (
    <div className="cv-actions">
      <a className="site-text-link" href={PDF_URL} target="_blank" rel="noopener noreferrer">Open PDF</a>
      <a className="site-text-link" href={PDF_URL} download="Zekun_Wang_CV.pdf">Download</a>
    </div>
  )
}

function CvContent() {
  return (
    <main id="site-main" className="site-container cv-page" tabIndex={-1}>
      <header className="site-page-intro cv-intro">
        <h1>Curriculum vitae</h1>
        <PdfActions />
      </header>

      <section id="cv-document" className="cv-document" aria-label="The CV as a PDF">
        <object
          key={PDF_URL}
          data={PDF_VIEW_URL}
          type="application/pdf"
          title={`${config.name}'s curriculum vitae`}
          aria-label={`${config.name}'s curriculum vitae, PDF`}
          className="cv-pdf"
        >
          <p className="cv-pdf-fallback">This browser cannot show the PDF here. Open or download it above.</p>
        </object>
      </section>
    </main>
  )
}

export default function CvPage() {
  useBlogMetadata({
    title: `Curriculum vitae · ${config.name}`,
    description: `The curriculum vitae of ${config.name}. Research, publications, patent applications, awards, and academic experience.`,
    path: '/cv/',
    image: '/site-card.png',
    imageAlt: config.name,
  })

  return <SiteFrame page="cv"><CvContent /></SiteFrame>
}
