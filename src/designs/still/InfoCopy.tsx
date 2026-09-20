import { Arrow, profile } from '../shared'

export default function InfoCopy({ panel, emailStatus, onCopyEmail, onCV }: {
  panel: 'about' | 'contact'
  emailStatus: string
  onCopyEmail: () => void
  onCV?: () => void
}) {
  return panel === 'about' ? (
    <div className="quiet-dialog-copy quiet-about-copy">
      <p className="quiet-bio">{profile.bio}</p>
      <section className="quiet-about-section" aria-label="Research focus">
        <h3>Research focus</h3>
        {profile.researchVision.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>
      <section className="quiet-about-section" aria-label="Academic service">
        <h3>Academic service</h3>
        <dl className="quiet-service-list">
          {profile.academicService.map((service) => (
            <div key={service.role}>
              <dt>{service.role}</dt>
              <dd>
                {service.url ? (
                  <a className="quiet-service-link" href={service.url} target="_blank" rel="noreferrer">
                    {service.title} <Arrow className="quiet-arrow" />
                  </a>
                ) : service.title}
                {service.note && <span className="quiet-service-note">{service.note}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <p className="quiet-about-personal">
        {profile.personalNote.split(/(semi-professional photographer\.?)/).map((part, index) => (
          part.startsWith('semi-professional photographer')
            ? <span className="quiet-photographer" key={index}>{part}</span>
            : part
        ))}
      </p>
      <div className="quiet-dialog-links">
        {onCV ? (
          <button type="button" onClick={onCV}>Curriculum vitae <Arrow className="quiet-arrow" /></button>
        ) : (
          <a href={profile.cv} target="_blank" rel="noreferrer">Curriculum vitae <Arrow className="quiet-arrow" /></a>
        )}
        <a href={profile.scholar} target="_blank" rel="noreferrer">Google Scholar <Arrow className="quiet-arrow" /></a>
        <a href={profile.contacts.instagram} target="_blank" rel="noreferrer">Photography <Arrow className="quiet-arrow" /></a>
      </div>
    </div>
  ) : (
    <div className="quiet-dialog-copy">
      <p>For questions about my work, you can reach me by email.</p>
      <a className="quiet-contact-email" href={`mailto:${profile.email}`}>{profile.email} <Arrow className="quiet-arrow" /></a>
      <button className="quiet-copy-email" type="button" onClick={onCopyEmail}>Copy email address</button>
      <p className="quiet-copy-status" role="status">{emailStatus}</p>
      <div className="quiet-dialog-links">
        <a href={profile.scholar} target="_blank" rel="noreferrer">Scholar <Arrow className="quiet-arrow" /></a>
        <a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn <Arrow className="quiet-arrow" /></a>
        <a href={profile.github} target="_blank" rel="noreferrer">GitHub <Arrow className="quiet-arrow" /></a>
      </div>
    </div>
  )
}
