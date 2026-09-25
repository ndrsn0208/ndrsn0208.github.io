import { profile } from '../shared'

export default function HomeContacts() {
  return (
    <address id="contact" className="quiet-home-contacts" aria-label="Contact information" tabIndex={-1}>
      <a className="quiet-home-email" href={`mailto:${profile.email}`}>{profile.email}</a>
      <span className="quiet-home-profiles">
        <a href={profile.scholar} target="_blank" rel="noreferrer">Scholar</a>
        <a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
        <a href={profile.github} target="_blank" rel="noreferrer">GitHub</a>
      </span>
    </address>
  )
}
