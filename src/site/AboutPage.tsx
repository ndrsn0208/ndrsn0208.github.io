import { Link } from 'react-router-dom'
import { useBlogMetadata } from '../blog/BlogLayout'
import config from '../data/config.json'
import publicationData from '../data/publications.json'
import SiteFrame, { useSiteTheme } from './SiteFrame'
import './about.css'

export const PHOTOGRAPHY_ANCHOR = 'photography'

const sections = [
  { id: 'research-vision', label: 'Research vision' },
  { id: 'education', label: 'Education' },
  { id: 'industry', label: 'Industry experience' },
  { id: 'academic-service', label: 'Academic service' },
  { id: PHOTOGRAPHY_ANCHOR, label: 'Photography' },
]

const recognizedPaper = publicationData.publications.find(
  paper => paper.id === 'diffusion-models-concept-formation-2026',
)

function ApprovedBio() {
  const advisorPosition = config.bio.indexOf(config.advisor)
  if (advisorPosition === -1) return <>{config.bio}</>

  return <>
    {config.bio.slice(0, advisorPosition)}
    <a className="about-advisor-link" href={config.advisorUrl} target="_blank" rel="noopener noreferrer">
      {config.advisor}
    </a>
    {config.bio.slice(advisorPosition + config.advisor.length)}
  </>
}

function AboutContent() {
  const { href } = useSiteTheme()

  return (
    <main id="site-main" className="site-container site-page-enter about-page" tabIndex={-1}>
      <header className="site-page-intro about-intro">
        <div className="about-intro-copy">
          <h1>{config.name}</h1>
          <p className="about-intro-bio"><ApprovedBio /></p>
        </div>
        <nav className="about-index" aria-label="On this page">
          <ul>
            {sections.map(section => (
              <li key={section.id}><a href={`#${section.id}`}>{section.label}</a></li>
            ))}
          </ul>
          <Link className="site-text-link" to={href('/cv')}>View CV</Link>
        </nav>
      </header>

      <section id="research-vision" className="about-section about-research" aria-labelledby="about-research-heading">
        <div className="about-section-content">
          <h2 id="about-research-heading" className="about-research-question">{config.researchQuestion}</h2>
          <div className="site-prose">
            {config.researchVision.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <div className="about-research-links">
            <Link className="site-text-link" to={href('/publications')}>Explore the research</Link>
            <Link className="site-text-link" to={href('/blog/')}>Read the blog</Link>
          </div>
          {recognizedPaper?.award && (
            <p className="about-research-note">
              Our paper{' '}
              <a href={recognizedPaper.arxivUrl} target="_blank" rel="noopener noreferrer">{recognizedPaper.title}</a>
              {' '}received the {recognizedPaper.award.replace(/^🏆\s*/, '')} at {recognizedPaper.venue}.
            </p>
          )}
        </div>
      </section>

      <section id="education" className="about-section" aria-labelledby="about-education-heading">
        <div className="about-section-content">
          <h2 id="about-education-heading">Education</h2>
          <ol className="about-education-list">
            <li className="about-education-entry">
              <p className="about-entry-date">
                {config.education.startYear}–{config.education.endYear}
                {config.education.expected && <span>Expected completion</span>}
              </p>
              <div>
                <h3>{config.affiliation}</h3>
                <p>{config.education.degree} in {config.education.field}</p>
                <p className="about-advisor">
                  Advised by{' '}
                  <a href={config.advisorUrl} target="_blank" rel="noopener noreferrer">{config.advisor}</a>
                </p>
              </div>
            </li>
            {config.previousEducation.map(education => (
              <li className="about-education-entry" key={education.institution}>
                <p className="about-entry-date">{education.startYear}–{education.endYear}</p>
                <div>
                  <h3>{education.institution}</h3>
                  <p>{education.degree} in {education.field}</p>
                  {education.detail && <p className="about-entry-detail">{education.detail}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="industry" className="about-section" aria-labelledby="about-industry-heading">
        <div className="about-section-content">
          <h2 id="about-industry-heading">Industry experience</h2>
          {config.industryExperience.map(experience => (
            <div className="about-industry-entry" key={`${experience.organization}-${experience.role}`}>
              <div className="about-industry-heading">
                <div>
                  <h3>{experience.organization}</h3>
                  <p>{experience.role} <span aria-hidden="true">·</span> {experience.location}</p>
                </div>
                <p className="about-entry-date">{experience.dates}</p>
              </div>
              {experience.organization === 'Amazon' && (
                <p className="about-industry-description">
                  I work on deployment-time agent adaptation and self-improving harnesses.
                  This includes developing methods for an agent to adapt to an unfamiliar
                  task through a single update to its harness.
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section id="academic-service" className="about-section" aria-labelledby="about-service-heading">
        <div className="about-section-content">
          <h2 id="about-service-heading">Academic service</h2>
          <ul className="about-service-list">
            {config.academicService.map(service => (
              <li key={`${service.role}-${service.title}`}>
                <p className="about-service-role">{service.role}</p>
                <div>
                  <p className="about-service-title">
                    {service.url
                      ? <a href={service.url} target="_blank" rel="noopener noreferrer">{service.title}</a>
                      : service.title}
                  </p>
                  {service.note && <p className="about-service-note">{service.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id={PHOTOGRAPHY_ANCHOR} className="about-section about-photography" aria-labelledby="about-photography-heading">
        <div className="about-section-content">
          <h2 id="about-photography-heading">Photography</h2>
          <p className="site-prose">{config.personalNote}</p>
          <a className="site-text-link" href={config.contacts.instagram} target="_blank" rel="noopener noreferrer">
            Photography on Instagram
          </a>
        </div>
      </section>
    </main>
  )
}

export default function AboutPage({ initialAnchor }: { initialAnchor?: string }) {
  useBlogMetadata({
    title: `About · ${config.name}`,
    description: `${config.researchStatement} Research vision, education, industry experience, and academic service.`,
    path: '/about/',
    image: '/site-card.png',
    imageAlt: config.name,
  })

  return <SiteFrame page="about" initialAnchor={initialAnchor}><AboutContent /></SiteFrame>
}
