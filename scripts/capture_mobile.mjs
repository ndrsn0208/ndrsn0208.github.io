import { chromium, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const base = process.env.DESIGN_BASE_URL ?? 'http://127.0.0.1:5173'
const thumbnails = new URL('../public/mobile-thumbnails/', import.meta.url)
const artifacts = new URL('../artifacts/mobile/', import.meta.url)
await mkdir(thumbnails, { recursive: true })
await mkdir(artifacts, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
const errors = []
const measurements = []
page.on('pageerror', (error) => errors.push(error.message))

try {
  for (const study of ['folio', 'index', 'chapters']) {
    for (const edition of ['paper', 'black']) {
      const url = `${base}/mobile/${study}?edition=${edition}&embed=1`
      await page.goto(url, { waitUntil: 'networkidle' })
      await expect(page.locator('.quiet-home')).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      const intro = await page.locator('.quiet-home').boundingBox()
      await page.screenshot({ path: new URL(`${study}-${edition}-home.jpg`, thumbnails).pathname, type: 'jpeg', quality: 90 })

      await page.getByRole('navigation', { name: 'Main navigation', exact: true }).locator('[data-nav-destination="publications"]').click()
      const topics = page.getByRole('group', { name: 'Research topics', exact: true })
      await expect(topics.getByRole('button')).toHaveCount(6)
      if (study === 'chapters') await expect(page.locator('#quiet-pane-publications')).toHaveCSS('opacity', '1')
      else await expect.poll(async () => (await page.locator('#publications').boundingBox()).y).toBeLessThan(120)
      await page.screenshot({ path: new URL(`${study}-${edition}-publications.jpg`, thumbnails).pathname, type: 'jpeg', quality: 90 })
      measurements.push({
        study, edition, introductionHeight: intro.height,
        topicCount: await topics.getByRole('button').count(),
        venueSize: await page.locator('.quiet-paper-meta').first().evaluate((element) => getComputedStyle(element).fontSize),
        horizontalOverflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      })

      await page.getByRole('navigation', { name: 'Main navigation', exact: true }).locator('[data-nav-destination="about"]').click()
      const about = study === 'chapters' ? page.locator('#quiet-pane-about') : page.getByRole('dialog')
      await expect(about).toBeVisible()
      await page.screenshot({ path: new URL(`${study}-${edition}-about.png`, artifacts).pathname })
    }
  }
  await page.setViewportSize({ width: 1440, height: 1050 })
  for (const edition of ['paper', 'black']) {
    await page.goto(`${base}/mobile?edition=${edition}`, { waitUntil: 'networkidle' })
    for (const title of ['Folio', 'Index', 'Chapters']) {
      await expect(page.frameLocator(`iframe[title="${title} 手机交互预览"]`).locator('.quiet-home')).toBeVisible()
    }
    await page.screenshot({ path: new URL(`overview-${edition}.png`, artifacts).pathname, fullPage: true })
    await page.getByRole('group', { name: '比较阅读位置' }).getByRole('button', { name: 'Publications', exact: true }).click()
    for (const title of ['Folio', 'Index', 'Chapters']) {
      await expect(page.frameLocator(`iframe[title="${title} 手机交互预览"]`).getByRole('group', { name: 'Research topics', exact: true })).toBeVisible()
    }
    await page.screenshot({ path: new URL(`overview-${edition}-publications.png`, artifacts).pathname, fullPage: true })
  }
  await writeFile(new URL('validation-samples.json', artifacts), JSON.stringify({ measurements, errors }, null, 2) + '\n')
  if (errors.length) throw new Error(errors.join('\n'))
  console.log('Captured 12 phone thumbnails, 6 About pages, and both comparison appearances and reading positions.')
} finally {
  await browser.close()
}
