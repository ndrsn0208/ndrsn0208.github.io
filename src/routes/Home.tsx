import { Link } from 'react-router-dom'
import { config } from '@/lib/publications'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export default function Home() {
  const c = config.contacts

  return (
    <section id="about" aria-labelledby="about-h">
      <div className="hero">
        <div className="hero-big reveal" data-d="1">
          <div className="idx" style={{ marginBottom: 14 }}>01 — ABOUT</div>
          <h1 id="about-h">
            ZEKUN
            <br />
            <span className="a">WANG</span>
          </h1>
        </div>

        <div className="hero-oneliner reveal" data-d="2">
          <p>
            PhD student in Computer Science at Georgia Tech, advised by{' '}
            <em>{config.advisor}</em>. I work on continual learning that keeps a
            model adapting <em>at test time</em> without forgetting.
          </p>
        </div>

        <div className="hero-side reveal" data-d="2">
          <div className="kv">
            <span className="k">Position</span>
            <span className="v">
              PhD student, Computer Science
              <br />
              {config.affiliation}
            </span>
          </div>
          {c.email && (
            <div className="kv">
              <span className="k">Email</span>
              <span className="v">
                <a className="mail" href={`mailto:${c.email}`}>
                  {c.email}
                </a>
              </span>
            </div>
          )}
          <div className="kv">
            <span className="k">Elsewhere</span>
            <span className="links">
              {c.googleScholar && (
                <a href={c.googleScholar} target="_blank" rel="noopener noreferrer">
                  Scholar ↗
                </a>
              )}
              {c.linkedin && (
                <a href={c.linkedin} target="_blank" rel="noopener noreferrer">
                  LinkedIn ↗
                </a>
              )}
            </span>
          </div>
        </div>

        {/* BIG research areas — A1..A6 from the canonical interest list.
            Each links to the publications filtered to that tag. */}
        <div className="research reveal" data-d="3" aria-label="Research areas">
          {config.researchInterests.map((area, i) => (
            <Link
              className="t"
              key={area}
              to={`/publications?tag=${encodeURIComponent(area)}`}
              aria-label={`See publications tagged ${area}`}
            >
              <span className="n">A{i + 1}</span>
              <span className="label">{cap(area)}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* contact row */}
      <div className="contact-links reveal" data-d="4">
        {c.email && (
          <a href={`mailto:${c.email}`}>
            <span className="n">C1</span>
            <span className="lab">Email</span>
            <span className="ext">{c.email}</span>
          </a>
        )}
        {c.googleScholar && (
          <a href={c.googleScholar} target="_blank" rel="noopener noreferrer">
            <span className="n">C2</span>
            <span className="lab">Scholar</span>
            <span className="ext">Google Scholar ↗</span>
          </a>
        )}
        {c.linkedin && (
          <a href={c.linkedin} target="_blank" rel="noopener noreferrer">
            <span className="n">C3</span>
            <span className="lab">LinkedIn</span>
            <span className="ext">linkedin ↗</span>
          </a>
        )}
        <Link to="/cv">
          <span className="n">C4</span>
          <span className="lab">CV</span>
          <span className="ext">download / view</span>
        </Link>
      </div>
    </section>
  )
}
