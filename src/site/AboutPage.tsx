import { useBlogMetadata } from '../blog/BlogLayout'
import config from '../data/config.json'
import publicationData from '../data/publications.json'
import SiteFrame from './SiteFrame'
import './about.css'

export const PHOTOGRAPHY_ANCHOR = 'photography'

const recognizedPaper = publicationData.publications.find(
  paper => paper.id === 'diffusion-models-concept-formation-2026',
)

function ApprovedBio() {
  const advisorPosition = config.bio.indexOf(config.advisor)
  if (advisorPosition === -1) return <>{config.bio}</>

  return <>
    {config.bio.slice(0, advisorPosition)}
    <a href={config.advisorUrl} target="_blank" rel="noopener noreferrer">{config.advisor}</a>
    {config.bio.slice(advisorPosition + config.advisor.length)}
  </>
}

function AboutContent() {
  return (
    <main id="site-main" className="site-container about-page" tabIndex={-1}>
      <header className="about-lead">
        <h1 className="site-hidden">About {config.name}</h1>
        <p className="about-bio site-inline"><ApprovedBio /></p>
      </header>

      <section id="research-vision" className="site-prose about-vision" aria-label="Research vision">
        {config.researchVision.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      </section>

      <dl className="about-record">
        <div className="about-group" id="education">
          <dt>Education</dt>
          <dd>
            <div className="about-entry">
              <div>
                <p className="about-entry-title">{config.affiliation}</p>
                <p className="about-entry-detail site-inline">
                  {config.education.degree} in {config.education.field}, advised by{' '}
                  <a href={config.advisorUrl} target="_blank" rel="noopener noreferrer">{config.advisor}</a>
                </p>
              </div>
              <p className="site-row-meta">{config.education.startYear}–{config.education.endYear}{config.education.expected ? ', expected' : ''}</p>
            </div>
            {config.previousEducation.map(education => (
              <div className="about-entry" key={education.institution}>
                <div>
                  <p className="about-entry-title">{education.institution}</p>
                  <p className="about-entry-detail">
                    {education.degree} in {education.field}{education.detail ? `. ${education.detail}` : ''}
                  </p>
                </div>
                <p className="site-row-meta">{education.startYear}–{education.endYear}</p>
              </div>
            ))}
          </dd>
        </div>

        <div className="about-group" id="industry">
          <dt>Experience</dt>
          <dd>
            {config.industryExperience.map(experience => (
              <div className="about-entry" key={`${experience.organization}-${experience.role}`}>
                <div>
                  <p className="about-entry-title">{experience.organization}</p>
                  <p className="about-entry-detail">
                    {experience.role}, {experience.location}
                    {experience.organization === 'Amazon' && '. Methods for an agent to adapt to an unfamiliar task through a single update to its harness.'}
                  </p>
                </div>
                <p className="site-row-meta">{experience.dates}</p>
              </div>
            ))}
          </dd>
        </div>

        <div className="about-group" id="academic-service">
          <dt>Service</dt>
          <dd>
            {config.academicService.map(service => (
              <div className="about-entry" key={`${service.role}-${service.title}`}>
                <div>
                  <p className="about-entry-title site-inline">
                    {service.url
                      ? <a href={service.url} target="_blank" rel="noopener noreferrer">{service.title.replace(/\.$/, '')}</a>
                      : service.title.replace(/\.$/, '')}
                  </p>
                  <p className="about-entry-detail">{[service.role, ...(service.note?.split(' · ') ?? [])].join(', ')}</p>
                </div>
              </div>
            ))}
          </dd>
        </div>

        {recognizedPaper?.award && <div className="about-group" id="recognition">
          <dt>Recognition</dt>
          <dd>
            <div className="about-entry">
              <div>
                <p className="about-entry-title">{recognizedPaper.award.replace(/^🏆\s*/, '')}</p>
                <p className="about-entry-detail site-inline">
                  {recognizedPaper.venue}, for{' '}
                  <a href={recognizedPaper.arxivUrl} target="_blank" rel="noopener noreferrer">{recognizedPaper.title}</a>
                </p>
              </div>
            </div>
          </dd>
        </div>}

        <div className="about-group" id={PHOTOGRAPHY_ANCHOR}>
          <dt>Photography</dt>
          <dd>
            <div className="about-entry">
              <div>
                <p className="about-entry-title">{config.personalNote}</p>
                <p className="about-entry-detail site-inline">
                  <a href={config.contacts.instagram} target="_blank" rel="noopener noreferrer">Photographs on Instagram</a>
                </p>
              </div>
            </div>
          </dd>
        </div>
      </dl>
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
