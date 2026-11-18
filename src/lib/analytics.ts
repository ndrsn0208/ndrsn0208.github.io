import config from '../data/config.json'

/* Traffic counting with GoatCounter (goatcounter.com): which pages are opened, where visitors
   come from, and which links that leave a page are clicked. It sets no cookie, so the site shows
   no consent notice.

   GoatCounter itself places a visitor by country and state. The owner asked for more, so each
   counted page is also counted as an event named after where the visit comes from: the owner of
   the visitor's network (a university, a company, an internet provider), then city, region and
   country, then the page: "from Georgia Institute of Technology · Atlanta, Georgia, US → /cv".
   A free lookup service derives these from the visitor's address. The address is not kept.

   The account's code is `analytics.goatcounter` in `src/data/config.json`. With no code, nothing
   is loaded and nothing is sent. The script itself does not count visits from localhost. */

type Count = { path: string, title?: string, event?: boolean, referrer?: () => string }
declare global {
  interface Window { goatcounter?: { no_onload?: boolean, count?: (vars: Count) => void, filter?: () => string | false } }
}
type Place = { organization?: string, city?: string, region?: string, country?: string }

const code = (config as { analytics?: { goatcounter?: string } }).analytics?.goatcounter ?? ''
const waiting: Count[] = []
let started = false
let lastPage = ''
let whenLoaded: Promise<void> = Promise.resolve()
let whereFrom: Promise<string | null> | null = null

/** The lookup services, and what each calls the four things. The second is asked if the first does not answer. */
const lookups: [string, (data: Record<string, string | undefined>) => Place][] = [
  ['https://get.geojs.io/v1/ip/geo.json', data => ({ organization: data.organization_name ?? data.organization, city: data.city, region: data.region, country: data.country_code })],
  ['https://ipinfo.io/json', data => ({ organization: data.org, city: data.city, region: data.region, country: data.country })],
]

/** A page's path as it is counted: no query, and no slash at the end, so that one page is one row. */
export const pagePath = (pathname: string) => pathname.replace(/\/+$/, '') || '/'

/** The name a click is counted under, or null for a link to another page of the site, which is counted as a page. */
export function clickName(href: string, here: string): string | null {
  let target: URL
  try { target = new URL(href, here) } catch { return null }
  if (target.protocol === 'mailto:') return 'email'
  if (target.protocol !== 'http:' && target.protocol !== 'https:') return null
  if (target.origin === new URL(here).origin) {
    const file = target.pathname.split('/').pop() ?? ''
    return /\.pdf$/i.test(file) ? `pdf ${file}` : null
  }
  return `out ${target.hostname.replace(/^www\./, '')}${target.pathname.replace(/\/+$/, '')}`.slice(0, 120)
}

/** Where a visit comes from, as it is counted: the owner of the network, then city, region and country. */
export function originName(place: Place): string | null {
  // Some services put the network's number before its owner's name.
  const owner = (place.organization ?? '').replace(/^AS\d+\s+/, '').trim()
  // A city that is its own region is said once.
  const where = [place.city, place.region, place.country].map(part => (part ?? '').trim()).filter((part, index, parts) => part && parts.indexOf(part) === index)
  return [owner, where.join(', ')].filter(Boolean).join(' · ').slice(0, 140) || null
}

/** In a count after the first page, the site that led to the first page is not where this one was opened from. */
const noReferrer = () => ''

function send(vars: Count) {
  const count = window.goatcounter?.count
  if (count) count(vars)
  else waiting.push(vars)
}

function onClick(event: MouseEvent) {
  const element = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-count], a[href]') : null
  if (!element) return
  const name = element.dataset.count ?? (element instanceof HTMLAnchorElement ? clickName(element.href, window.location.href) : null)
  // The words as they are laid out, so that a row's title and its venue stay apart.
  if (name) send({ path: name, title: (element.innerText || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120) || name, event: true, referrer: noReferrer })
}

function start() {
  if (started) return
  started = true
  // The pages are counted here, on every change of route, so the script counts nothing on its own.
  window.goatcounter = { no_onload: true }
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://gc.zgo.at/count.js'
  script.dataset.goatcounter = `https://${code}.goatcounter.com/count`
  whenLoaded = new Promise(resolve => {
    script.addEventListener('load', () => {
      // Opening the site with #toggle-goatcounter switches counting off or on in that browser, and the script has
      // just done so. The fragment leaves the address, so that a reload or a restored tab does not switch it back.
      if (window.location.hash === '#toggle-goatcounter') {
        window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
      }
      for (const vars of waiting.splice(0)) window.goatcounter?.count?.(vars)
      resolve()
    })
  })
  document.head.append(script)
  document.addEventListener('click', onClick, true)
  // A link opened in a new tab with the middle button.
  document.addEventListener('auxclick', onClick, true)
}

/** Where this visit comes from, asked once per load, and only for a visit that is counted. */
function origin() {
  whereFrom ??= whenLoaded.then(async () => {
    // The script says why it would not count: localhost, or a browser that has switched counting off.
    if (!window.goatcounter?.filter || window.goatcounter.filter()) return null
    for (const [address, read] of lookups) {
      try {
        const response = await fetch(address, { credentials: 'omit', referrerPolicy: 'no-referrer' })
        const name = response.ok ? originName(read(await response.json())) : null
        if (name) return name
      } catch { /* The next service is asked. */ }
    }
    return null
  })
  return whereFrom
}

/** Count the page that is open. Call it once the page has set its title. */
export function countPage() {
  if (!code) return
  const path = pagePath(window.location.pathname)
  if (path === lastPage) return
  // Only the first page of a visit was opened from another site.
  const arrived = lastPage === '' && document.referrer !== '' && !document.referrer.startsWith(window.location.origin)
  lastPage = path
  const title = document.title
  start()
  send(arrived ? { path, title } : { path, title, referrer: noReferrer })
  void origin().then(name => { if (name) send({ path: `from ${name} → ${path}`, title, event: true, referrer: noReferrer }) })
}
