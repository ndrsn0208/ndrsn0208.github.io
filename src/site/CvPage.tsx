import { Link } from 'react-router-dom'
import { useBlogMetadata } from '../blog/BlogLayout'
import config from '../data/config.json'
import SiteFrame, { useSiteTheme } from './SiteFrame'
import './about.css'

// Vite supplies the current PDF's content hash. Keep it on every PDF URL.
const PDF_URL = __CV_PDF_URL__
const PDF_VIEW_URL = `${PDF_URL}#view=FitH`

function PdfActions() {
  return (
    <div className="cv-actions">
      <a className="site-text-link" href={PDF_URL} target="_blank" rel="noopener noreferrer">
        Open PDF
      </a>
      <a className="site-text-link" href={PDF_URL} download="Zekun_Wang_CV.pdf">
        Download PDF
      </a>
    </div>
  )
}

function CvContent() {
  const { href } = useSiteTheme()
  const currentIndustry = config.industryExperience[0]

  return (
    <main id="site-main" className="site-container site-page-enter cv-page" tabIndex={-1}>
      <header className="site-page-intro cv-intro">
        <div>
          <h1>Curriculum vitae</h1>
          <p className="cv-intro-description">
            Education, research, publications, teaching, and academic service.
          </p>
        </div>
        <PdfActions />
      </header>

      <dl className="cv-summary" aria-label="Career overview">
        <div>
          <dt>Current position</dt>
          <dd>{config.title}<span>{config.affiliation}</span></dd>
        </div>
        <div>
          <dt>Advisor</dt>
          <dd><a href={config.advisorUrl} target="_blank" rel="noopener noreferrer">{config.advisor}</a></dd>
        </div>
        {currentIndustry && (
          <div>
            <dt>Industry</dt>
            <dd>
              {currentIndustry.role}, {currentIndustry.organization}
              <span>{currentIndustry.location}</span>
              <span>{currentIndustry.dates}</span>
            </dd>
          </div>
        )}
        <div>
          <dt>Research</dt>
          <dd>{config.researchStatement}</dd>
        </div>
      </dl>

      <section id="cv-document" className="cv-document" aria-labelledby="cv-document-heading">
        <div className="cv-document-heading">
          <h2 id="cv-document-heading">Full CV</h2>
        </div>
        <div className="cv-desktop-preview">
          <object
            key={PDF_URL}
            data={PDF_VIEW_URL}
            type="application/pdf"
            title={`${config.name}'s curriculum vitae`}
            aria-label={`${config.name}'s curriculum vitae, PDF`}
            className="cv-pdf"
          >
            <div className="cv-pdf-fallback">
              <p>Your browser cannot display the PDF here. You can open or download the full document.</p>
              <PdfActions />
            </div>
          </object>
        </div>
        <div className="cv-mobile-preview">
          <p className="cv-mobile-title">Take the full CV with you.</p>
          <p>Open the PDF in your viewer for comfortable reading, or download a copy.</p>
          <PdfActions />
        </div>
      </section>

      <div className="cv-further-reading">
        <p>More about the questions behind the work.</p>
        <div>
          <Link className="site-text-link" to={href('/about')}>Research and background</Link>
          <Link className="site-text-link" to={href('/publications')}>Publication record</Link>
        </div>
      </div>
    </main>
  )
}

export default function CvPage() {
  useBlogMetadata({
    title: `Curriculum vitae · ${config.name}`,
    description: `The curriculum vitae of ${config.name}. Education, research, publications, teaching, and academic service.`,
    path: '/cv/',
    image: '/site-card.png',
    imageAlt: config.name,
  })

  return <SiteFrame page="cv"><CvContent /></SiteFrame>
}
