import config from '../data/config.json'
import { essays } from '../site/essays'

/* Traffic counting with Google Analytics. The owner asked for it on 2026-11-19: it places visitors
   down to the city and shows them on a map, at no charge. GoatCounter was tried for two days before
   it and taken out. It placed visitors by country and state only.

   `analytics.google` in `src/data/config.json` is the ID in the snippet Google gives for the site.
   With no ID, nothing is loaded. Google gave this site a tag whose ID begins with GTM-: the script
   is `gtm.js` and it already knows which property it reports to. An ID that begins with G- is
   loaded as `gtag/js` and named in a `config` command.

   The tag counts the first page when it loads and every later page when the address changes. It
   counts on its own the clicks that leave the site and the files that are downloaded. It sets
   Google's cookies. It is not loaded on a developer's machine. It counts every other visit, the
   owner's own included: the owner expects counting to be on for everyone. */

declare global {
  interface Window {
    /** The list Google's tag reads its commands from. */
    dataLayer?: unknown[]
    /** Set by the tests, which run on a developer's machine and still want to be counted. */
    countHere?: boolean
  }
}

const settings = config as { name: string, analytics?: { google?: string } }
const google = settings.analytics?.google ?? ''
let started = false
let lastPage = ''
let announced = ''

/** A page's path with no slash at the end, so that one page has one name. */
export const pagePath = (pathname: string) => pathname.replace(/\/+$/, '') || '/'

/** The title a page gives itself, known before the page is drawn. A figure's page is known by its essay. */
export function titleOf(pathname: string): string | null {
  const path = pagePath(pathname)
  const pages: Record<string, string> = {
    '/': settings.name,
    '/publications': `Publications · ${settings.name}`,
    '/blog': 'Blogs · Zekun Wang',
    '/about': `About · ${settings.name}`,
    '/cv': `Curriculum vitae · ${settings.name}`,
  }
  if (path in pages) return pages[path]
  const essay = essays.find(item => path === pagePath(item.path) || path.startsWith(item.path))
  return essay ? `${essay.title} · Zekun Wang` : null
}

/** A developer's machine is not a visitor, and the tag does not know that itself. */
const onOwnMachine = () => /^(localhost$|127\.|10\.|192\.168\.|\[::1\]$)/.test(window.location.hostname) && !window.countHere

/** A command for Google's tag. It reads them from `dataLayer`, and it reads `arguments` objects, not arrays. */
function gtag(..._command: unknown[]) {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer!.push(arguments)
}

/** The tag counts a page when the address changes, which is before the page is drawn and has set its title.
    So the title of the page that is about to open is given ahead of the change. */
function announce(pathname: string) {
  const path = pagePath(pathname)
  if (path === announced) return
  announced = path
  const title = titleOf(pathname)
  if (!title) return
  document.title = title
  gtag('set', { page_title: title })
}

/** The tag sees links and downloads itself. A choice made on the page, such as a research direction, it is told. */
function onClick(event: MouseEvent) {
  const choice = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-count]')?.dataset.count : undefined
  if (!choice) return
  const [kind, ...rest] = choice.split(' ')
  gtag('event', 'select_content', { content_type: kind, content_id: rest.join(' ') })
}

function start() {
  started = true
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
  document.addEventListener('click', onClick, true)
}

/** Count the page that is open. Call it once the page has set its title. */
export function countPage() {
  if (!google || onOwnMachine()) return
  const path = pagePath(window.location.pathname)
  if (path === lastPage) return
  lastPage = path
  if (!started) start()
  // The page has now set its own title, which is the one that holds for what happens on it.
  else gtag('set', { page_title: document.title })
}
