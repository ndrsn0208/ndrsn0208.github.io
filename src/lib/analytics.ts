import config from '../data/config.json'
import { essays } from '../site/essays'

/* Traffic counting. Two services can be switched on under `analytics` in `src/data/config.json`,
   each by its account's code. With no code for a service, nothing of it is loaded and nothing is
   sent to it.

   Google Analytics (`google`, the ID in the snippet Google gives for the site). The owner asked for
   it on 2026-11-19: it places visitors down to the city and shows them on a map. Its tag counts the
   first page when it loads and every later page when the address changes, and it counts on its own
   the clicks that leave the site and the files that are downloaded. It sets its own cookie.
   Google gave this site a tag whose ID begins with GTM-: the script is `gtm.js` and it already knows
   which property it reports to. An ID that begins with G- is loaded as `gtag/js` and named in a
   `config` command.

   GoatCounter (`goatcounter`, goatcounter.com): which pages are opened, where visitors come from,
   and which links that leave a page are clicked. It sets no cookie.

   GoatCounter itself places a visitor by country and state. The owner asked for more, so each
   counted page is also counted as an event named after where the visit comes from: the owner of
   the visitor's network (a university, a company, an internet provider), then city, region and
   country, then the page: "from Georgia Institute of Technology · Atlanta, Georgia, US → /cv".
   A free lookup service derives these from the visitor's address. The address is not kept.

   GoatCounter's script does not count visits from localhost, and Google's tag is not loaded there.
   Google Analytics counts every other visit, the owner's own included: the owner expects counting to
   be on for everyone. A browser that has opened the site with #toggle-goatcounter is left out of
   GoatCounter only. */

type Count = { path: string, title?: string, event?: boolean, referrer?: () => string }
declare global {
  interface Window {
    goatcounter?: { no_onload?: boolean, count?: (vars: Count) => void, filter?: () => string | false }
    /** The list Google's tag reads its commands from. */
    dataLayer?: unknown[]
    /** Set by the tests, which run on a developer's machine and still want to be counted. */
    countHere?: boolean
  }
}
type Place = { organization?: string, city?: string, region?: string, country?: string }

const settings = (config as { name: string, analytics?: { goatcounter?: string, google?: string } })
const code = settings.analytics?.goatcounter ?? ''
const google = settings.analytics?.google ?? ''
const waiting: Count[] = []
let started = false
let googleStarted = false
let listening = false
let lastPage = ''
let announced = ''
let whenLoaded: Promise<void> = Promise.resolve()
let whereFrom: Promise<string | null> | null = null

/** The lookup services, and what each calls the four things. The second is asked if the first does not answer. */
const lookups: [string, (data: Record<string, string | undefined>) => Place][] = [
  ['https://get.geojs.io/v1/ip/geo.json', data => ({ organization: data.organization_name ?? data.organization, city: data.city, region: data.region, country: data.country_code })],
  ['https://ipinfo.io/json', data => ({ organization: data.org, city: data.city, region: data.region, country: data.country })],
]

/** A page's path as it is counted: no query, and no slash at the end, so that one page is one row. */
export const pagePath = (pathname: string) => pathname.replace(/\/+$/, '') || '/'

/** The title a page gives itself, known before the page is drawn. A figure's page is known by its essay. */
export function titleOf(pathname: string): string | null {
  const path = pagePath(pathname)
  const pages: Record<string, string> = {
    '/': 'Zekun Wang · Research & writing',
    '/publications': `Publications · ${settings.name}`,
    '/blog': 'Writing · Zekun Wang',
    '/about': `About · ${settings.name}`,
    '/cv': `Curriculum vitae · ${settings.name}`,
  }
  if (path in pages) return pages[path]
  const essay = essays.find(item => path === pagePath(item.path) || path.startsWith(item.path))
  return essay ? `${essay.title} · Zekun Wang` : null
}

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

/** A developer's machine is not a visitor. GoatCounter's script leaves it out itself. Google's tag has to be kept from it. */
const onOwnMachine = () => /^(localhost$|127\.|10\.|192\.168\.|\[::1\]$)/.test(window.location.hostname) && !window.countHere
/** A command for Google's tag. It reads them from `dataLayer`, and it reads `arguments` objects, not arrays. */
function gtag(..._command: unknown[]) {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer!.push(arguments)
}

/** Google's tag counts a page the moment the address changes, which is before the page is drawn and has set its
    title. So the title of the page that is about to open is given ahead of the change. */
function announce(pathname: string) {
  const path = pagePath(pathname)
  if (path === announced) return
  announced = path
  const title = titleOf(pathname)
  if (!title) return
  document.title = title
  gtag('set', { page_title: title })
}

function startGoogle() {
  googleStarted = true
  announced = pagePath(window.location.pathname)
  window.dataLayer = window.dataLayer ?? []
  // The tag counts the page that is open once it has loaded, under the title the page has just set.
  gtag('js', new Date())
  const container = google.startsWith('GTM-')
  if (!container) gtag('config', google)
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/${container ? 'gtm.js' : 'gtag/js'}?id=${encodeURIComponent(google)}`
  document.head.append(script)
  for (const method of ['pushState', 'replaceState'] as const) {
    const change = window.history[method].bind(window.history)
    window.history[method] = (state: unknown, unused: string, address?: string | URL | null) => {
      if (address != null) announce(new URL(address, window.location.href).pathname)
      change(state, unused, address)
    }
  }
  window.addEventListener('popstate', () => announce(window.location.pathname))
}

function send(vars: Count) {
  const count = window.goatcounter?.count
  if (count) count(vars)
  else waiting.push(vars)
}

function onClick(event: MouseEvent) {
  const element = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-count], a[href]') : null
  if (!element) return
  const name = element.dataset.count ?? (element instanceof HTMLAnchorElement ? clickName(element.href, window.location.href) : null)
  // Google's tag sees links and downloads itself. A choice made on the page, such as a research direction, it is told.
  if (googleStarted && element.dataset.count) {
    const [kind, ...rest] = element.dataset.count.split(' ')
    gtag('event', 'select_content', { content_type: kind, content_id: rest.join(' ') })
  }
  // The words as they are laid out, so that a row's title and its venue stay apart.
  if (name && code) send({ path: name, title: (element.innerText || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120) || name, event: true, referrer: noReferrer })
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
}

function listen() {
  if (listening) return
  listening = true
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
  if (!code && !google) return
  const path = pagePath(window.location.pathname)
  if (path === lastPage) return
  // Only the first page of a visit was opened from another site.
  const arrived = lastPage === '' && document.referrer !== '' && !document.referrer.startsWith(window.location.origin)
  lastPage = path
  const title = document.title
  listen()
  if (google && !onOwnMachine()) {
    if (!googleStarted) startGoogle()
    // The page has now set its own title, which is the one that holds for what happens on it.
    else gtag('set', { page_title: title })
  }
  if (!code) return
  start()
  send(arrived ? { path, title } : { path, title, referrer: noReferrer })
  void origin().then(name => { if (name) send({ path: `from ${name} → ${path}`, title, event: true, referrer: noReferrer }) })
}
