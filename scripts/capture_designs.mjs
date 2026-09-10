import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const allSlugs = ['folio', 'atlas', 'monograph', 'workbench', 'index', 'gallery', 'timeline', 'dialogue', 'fieldnotes', 'quiet']
const selected = process.argv.find((argument) => argument.startsWith('--only='))?.slice(7).split(',')
const slugs = process.argv.includes('--overview-only') ? [] : selected ? allSlugs.filter((slug) => selected.includes(slug)) : allSlugs
const base = process.env.DESIGN_BASE_URL ?? 'http://127.0.0.1:5173'
const artifactDir = path.resolve('artifacts/designs')
const thumbnailDir = path.resolve('public/design-thumbnails')
await mkdir(artifactDir, { recursive: true })
await mkdir(thumbnailDir, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
try {
  for (const slug of slugs) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 990 }, reducedMotion: 'reduce' })
    await page.goto(`${base}/designs/${slug}?embed=1`)
    await page.locator(`.design-surface.${slug}`).waitFor()
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: path.join(thumbnailDir, `${slug}.jpg`), type: 'jpeg', quality: 85, animations: 'disabled' })
    await page.screenshot({ path: path.join(artifactDir, `${slug}-desktop.png`), fullPage: true, animations: 'disabled' })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: path.join(artifactDir, `${slug}-mobile-fold.png`), animations: 'disabled' })
    await page.screenshot({ path: path.join(artifactDir, `${slug}-mobile.png`), fullPage: true, animations: 'disabled' })
    console.log(`Captured ${slug}: desktop, mobile, thumbnail`)
    await page.close()
  }
  const overview = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  await overview.goto(`${base}/designs`)
  await overview.locator('.studio-preview-image img').nth(9).waitFor({ state: 'attached' })
  await overview.evaluate(() => document.fonts.ready)
  // Load the chooser's lazily loaded thumbnails before its full-page capture.
  await overview.locator('.studio-preview-image img').evaluateAll(async (images) => {
    await Promise.all(images.map((image) => {
      image.loading = 'eager'
      return image.decode()
    }))
  })
  await overview.screenshot({ path: path.join(artifactDir, 'overview.png'), fullPage: true, animations: 'disabled' })
  await overview.close()
} finally {
  await browser.close()
}
