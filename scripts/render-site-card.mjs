// Renders the share image of the overview, Papers, About, and CV: public/site-card.png.
//
//   npm run site:card
//
// The card is the opening of the homepage, photographed at 1200 × 630: the name,
// the research question, and the drawing. Nothing is written on it that the page
// does not say. Run it after the name, the question, or the drawing changes, and
// look at the image.

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from '@playwright/test'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const server = await createServer({ root, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } })
await server.listen()
const base = `http://127.0.0.1:${server.httpServer.address().port}`
const browser = await chromium.launch({ channel: 'chrome' })

try {
  // With reduced motion the drawing shows its finished state: the model at the boundary of the trust region.
  const context = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto(`${base}/?edition=paper`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  // A card is seen small, so the two lines are set larger than on the page and everything else is left out.
  await page.addStyleTag({ content: `
    .site-header, .site-skip, .home-bio, .home-directions, .adapt-launcher { display: none !important; }
    .home-hero { height: 630px !important; }
    .home-hero-copy { grid-template-columns: minmax(0, 1fr) !important; width: auto !important; margin: 0 !important; padding: 52px 64px 0 !important; }
    .home-name { font-size: 84px !important; }
    .home-question { margin-top: 18px !important; font-size: 40px !important; }
    .site-landscape { -webkit-mask-image: none !important; mask-image: none !important; }
  ` })
  // The drawing fits itself again to the room under the two lines.
  await page.waitForTimeout(900)
  await page.screenshot({ path: path.join(root, 'public/site-card.png'), clip: { x: 0, y: 0, width: 1200, height: 630 } })
  await context.close()
} finally {
  await browser.close()
  await server.close()
}
console.log('Rendered public/site-card.png.')
