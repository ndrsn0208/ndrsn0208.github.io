import { useEffect, useRef } from 'react'

const IG_USER = 'ndrsnphotography'
const IG_URL = `https://www.instagram.com/${IG_USER}/`

/* ------------------------------------------------------------------
   Live Instagram feed.

   Instagram only lets a PROFILE feed be embedded two ways, and both
   need one small input from the account owner:

   1. A provider widget (SnapWidget / Behold / LightWidget). You connect
      @ndrsnphotography once, they give you an <iframe> URL. Paste it into
      IG_WIDGET_SRC and the live auto-updating grid renders here.

   2. Official post embeds — public post permalinks (no account needed).
      Drop 6–9 URLs into IG_POSTS and each renders live via embed.js.

   With neither set, a Grid System placeholder + follow card shows.
   ------------------------------------------------------------------ */

// Instagram's own profile embed — live, no account or API key needed. Shows the
// profile card + the 6 latest posts, and auto-updates. Swap for a SnapWidget /
// Behold / LightWidget src if you ever want a larger custom grid.
const IG_WIDGET_SRC = `https://www.instagram.com/${IG_USER}/embed`

// Optional: official post embeds by permalink (full-size images) via embed.js.
const IG_POSTS: string[] = []

const PLACEHOLDERS = [
  { g: 'linear-gradient(135deg,#c96a3a,#e0b15f 55%,#7a4a2b)', t: 'Field / 01' },
  { g: 'linear-gradient(200deg,#3a5a6b,#8fb0b8 60%,#22343d)', t: 'Coast / 02' },
  { g: 'linear-gradient(160deg,#6b3a52,#c48fa6 55%,#33202b)', t: 'Neon / 03' },
  { g: 'linear-gradient(120deg,#5a6b3a,#b0b88f 60%,#2f3d22)', t: 'Field / 04' },
  { g: 'linear-gradient(140deg,#b8341f,#e0a15f 60%,#4a1a12)', t: 'Signal / 05' },
  { g: 'linear-gradient(220deg,#3a3a6b,#8f8fc4 55%,#20203b)', t: 'Night / 06' },
  { g: 'linear-gradient(135deg,#0a0a0a 0%,#3a3a3a 100%)', t: 'Dusk / 07' },
  { g: 'linear-gradient(320deg,#0a0a0a 0%,#e2231a 100%)', t: 'Gold / 08' },
]

/* Instagram's profile embed iframe. It posts its content height via a MEASURE
   message; we listen and size the frame to fit so there is no dead space or
   internal scrollbar. */
function WidgetEmbed({ src }: { src: string }) {
  const ref = useRef<HTMLIFrameElement>(null)
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (typeof e.data !== 'string' || !/instagram\.com/.test(e.origin)) return
      try {
        const d = JSON.parse(e.data)
        const h = d?.type === 'MEASURE' ? d?.details?.height : undefined
        if (h && ref.current) ref.current.style.height = `${Math.ceil(h)}px`
      } catch {
        /* not a JSON message we care about */
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])
  return (
    <div className="ig-embed reveal" data-d="3">
      <iframe
        ref={ref}
        src={src}
        title={`@${IG_USER} on Instagram`}
        scrolling="no"
        style={{ height: 760, minHeight: 460 }}
      />
      <div className="ig-note" style={{ borderBottom: 'none' }}>
        <span>Live from Instagram · @{IG_USER} · latest posts</span>
        <a href={IG_URL} target="_blank" rel="noopener noreferrer" style={{ borderBottom: '2px solid var(--red)' }}>
          View all ↗
        </a>
      </div>
    </div>
  )
}

function OfficialPosts() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const w = window as unknown as { instgrm?: { Embeds: { process: () => void } } }
    if (w.instgrm) {
      w.instgrm.Embeds.process()
      return
    }
    const s = document.createElement('script')
    s.src = 'https://www.instagram.com/embed.js'
    s.async = true
    document.body.appendChild(s)
  }, [])
  return (
    <div className="ig-embed" ref={ref} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
      {IG_POSTS.map((href) => (
        <blockquote
          key={href}
          className="instagram-media"
          data-instgrm-permalink={href}
          data-instgrm-version="14"
          style={{ margin: 0, width: '100%' }}
        />
      ))}
    </div>
  )
}

export default function Photography() {
  return (
    <section id="photo" aria-labelledby="photo-h">
      <div className="page-band reveal" data-d="1">
        <div className="cell band-idx">
          <div className="idx">04</div>
        </div>
        <div className="cell band-title">
          <h2 id="photo-h">Photography</h2>
        </div>
      </div>

      <div className="photo-head reveal" data-d="2">
        <div className="a">
          <div className="idx" style={{ marginBottom: 14 }}>04 — OFF THE CLOCK</div>
          <h3>
            OFF THE
            <br />
            CLOCK
          </h3>
        </div>
        <div className="b">
          <div className="ig">
            Instagram
            <br />
            <a href={IG_URL} target="_blank" rel="noopener noreferrer">
              @{IG_USER} ↗
            </a>
          </div>
          <div className="cap">
            Landscapes, slow walks, light through windows. The live feed streams
            in below.
          </div>
        </div>
      </div>

      {IG_WIDGET_SRC ? (
        <WidgetEmbed src={IG_WIDGET_SRC} />
      ) : IG_POSTS.length > 0 ? (
        <div className="reveal" data-d="3">
          <OfficialPosts />
        </div>
      ) : (
        <>
          <div className="ig-fallback reveal" data-d="3" role="list" aria-label="Photography placeholders">
            {PLACEHOLDERS.map((p, i) => (
              <div className="tile" role="listitem" key={i}>
                <div className="fill" style={{ background: p.g }} />
                <span className="num">{('0' + (i + 1)).slice(-2)}</span>
              </div>
            ))}
          </div>
          <div className="ig-note reveal" data-d="4">
            <span>
              Live feed connects once the Instagram widget is wired — placeholder
              frames until then.
            </span>
            <a href={IG_URL} target="_blank" rel="noopener noreferrer" style={{ borderBottom: '2px solid var(--red)' }}>
              Follow @{IG_USER} ↗
            </a>
          </div>
        </>
      )}
    </section>
  )
}
