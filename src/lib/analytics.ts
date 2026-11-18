import config from '../data/config.json'

/* Traffic counting with GoatCounter (goatcounter.com): which pages are opened, where visitors
   come from, and which links that leave a page are clicked. It sets no cookie and stores nothing
   personal, so the site shows no consent notice.

   The account's code is `analytics.goatcounter` in `src/data/config.json`. With no code, nothing
   is loaded and nothing is sent. The script itself does not count visits from localhost. */

type Count = { path: string, title?: string, event?: boolean }
declare global {
  interface Window { goatcounter?: { no_onload?: boolean, count?: (vars: Count) => void } }
}

const code = (config as { analytics?: { goatcounter?: string } }).analytics?.goatcounter ?? ''
const waiting: Count[] = []
let started = false
let lastPage = ''

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
  if (name) send({ path: name, title: (element.innerText || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120) || name, event: true })
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
  script.addEventListener('load', () => { for (const vars of waiting.splice(0)) window.goatcounter?.count?.(vars) })
  document.head.append(script)
  document.addEventListener('click', onClick, true)
  // A link opened in a new tab with the middle button.
  document.addEventListener('auxclick', onClick, true)
}

/** Count the page that is open. Call it once the page has set its title. */
export function countPage() {
  if (!code) return
  const path = pagePath(window.location.pathname)
  if (path === lastPage) return
  lastPage = path
  start()
  send({ path, title: document.title })
}
