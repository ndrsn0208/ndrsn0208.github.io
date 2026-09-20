import { useId, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { profile } from '../shared'

export default function BackgroundInfo() {
  const [expanded, setExpanded] = useState(false)
  const historyId = useId()
  const reduce = useReducedMotion()

  return (
    <dl className="quiet-background" aria-label="Education and industry experience">
      <div className="quiet-education">
        <dt className="quiet-education-heading">
          Education
          <button
            className="quiet-education-toggle"
            type="button"
            aria-expanded={expanded}
            aria-controls={historyId}
            aria-label={expanded ? 'Show less education' : 'Show previous education'}
            onClick={() => setExpanded((value) => !value)}
          >
            <span>{expanded ? 'Less' : 'More'}</span>
            <motion.svg
              viewBox="0 0 12 12" width="12" height="12" fill="none" aria-hidden="true"
              initial={false}
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: reduce ? 0 : 0.3 }}
            >
              <path d="m2.5 4.5 3.5 3 3.5-3" stroke="currentColor" strokeWidth="1.1" />
            </motion.svg>
          </button>
        </dt>
        <dd>
          <p className="quiet-experience-role">{profile.education.degree}, <span className="quiet-experience-field">{profile.education.field}</span></p>
          <p className="quiet-experience-meta">
            <span className="quiet-experience-organization">{profile.education.institution}</span>
            <span className="quiet-experience-divider" aria-hidden="true">·</span>
            <span className="quiet-experience-dates">{profile.education.startYear}–{profile.education.endYear}{profile.education.expected ? ' (expected)' : ''}</span>
          </p>
          <p className="quiet-advisor">
            Advisor: <a href={profile.advisorUrl} target="_blank" rel="noreferrer">{profile.advisor}</a>
          </p>
          <motion.div
            id={historyId}
            className="quiet-education-history"
            role="region"
            aria-label="Previous education"
            aria-hidden={!expanded}
            initial={false}
            animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
            transition={reduce ? { duration: 0 } : {
              height: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: expanded ? 0.3 : 0.18 },
            }}
          >
            <ul className="quiet-education-history-list">
              {profile.previousEducation.map((education) => (
                <li key={education.institution}>
                  <p className="quiet-history-degree">{education.degree}, {education.field}</p>
                  <p className="quiet-history-institution">{education.institution}</p>
                  <p className="quiet-history-dates">{education.startYear}–{education.endYear}</p>
                  {education.detail && <p className="quiet-history-detail">{education.detail}</p>}
                </li>
              ))}
            </ul>
          </motion.div>
        </dd>
      </div>
      <div className="quiet-industry">
        <dt>Industry experience</dt>
        {profile.industryExperience.map((experience) => (
          <dd key={`${experience.role}-${experience.organization}`}>
            <p className="quiet-experience-role">{experience.role}</p>
            <p className="quiet-experience-meta">
              <span className="quiet-experience-organization">{experience.organization}</span>
              <span className="quiet-experience-location">{experience.location}</span>
              <span className="quiet-experience-dates">{experience.dates}</span>
            </p>
          </dd>
        ))}
      </div>
    </dl>
  )
}
