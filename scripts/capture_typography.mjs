import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const base = process.env.DESIGN_BASE_URL ?? 'http://127.0.0.1:5173'
const studies = ['original', 'book', 'editorial', 'humanist', 'poem']
const thumbnailDirectory = new URL('../public/typography-thumbnails/', import.meta.url)
const artifactDirectory = new URL('../artifacts/typography/', import.meta.url)
await mkdir(thumbnailDirectory, { recursive: true })
await mkdir(artifactDirectory, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1200, height: 820 }, reducedMotion: 'reduce' })
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
const samples = []
try {
  for (const study of studies) {
    for (const edition of ['paper', 'black']) {
      await page.goto(`${base}/typography/${study}?edition=${edition}&embed=1`, { waitUntil: 'networkidle' })
      await page.locator('.type-preview .quiet-home').waitFor({ state: 'visible' })
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({ path: new URL(`${study}-${edition}.jpg`, thumbnailDirectory).pathname, type: 'jpeg', quality: 88 })
      samples.push(await page.evaluate(({ study, edition }) => {
        const name = document.querySelector('#quiet-name')
        const intro = document.querySelector('.quiet-intro')
        const home = document.querySelector('.quiet-home')
        return {
          study, edition,
          nameFont: getComputedStyle(name).font,
          introFont: getComputedStyle(intro).font,
          measure: home.getBoundingClientRect().width,
          height: home.getBoundingClientRect().height,
        }
      }, { study, edition }))
    }
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(`${base}/typography/${study}?edition=paper&embed=1#about`, { waitUntil: 'networkidle' })
    await page.locator('#quiet-pane-about[data-active]').waitFor({ state: 'visible' })
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: new URL(`${study}-about.png`, artifactDirectory).pathname })
    await page.setViewportSize({ width: 1200, height: 820 })
  }
  await writeFile(new URL('typography-samples.json', artifactDirectory), JSON.stringify({ samples, errors }, null, 2) + '\n')
  if (errors.length) throw new Error(errors.join('\n'))
  console.log(`Captured ${samples.length} homepage previews and ${studies.length} reading panes.`)
} finally {
  await browser.close()
}
