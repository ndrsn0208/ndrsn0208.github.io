import { chromium, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const base = process.env.DESIGN_BASE_URL ?? 'http://127.0.0.1:5173'
const output = path.resolve('artifacts/still-glass')
const editions = ['black', 'paper']
const requestedStudy = process.argv.find((value) => value.startsWith('--study='))?.split('=')[1]
const studies = ['lens', 'drift', 'frame'].filter((study) => !requestedStudy || study === requestedStudy)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
const desktopImages = []
try {
  for (const study of studies) for (const edition of editions) {
    const label = `${study}-${edition}`
    const page = await browser.newPage({ viewport: { width: 1440, height: 990 }, reducedMotion: 'reduce' })
    await page.goto(`${base}/still?edition=${edition}&study=${study}&embed=1`)
    await page.locator(`.quiet[data-edition="${edition}"]`).waitFor()
    await page.evaluate(() => document.fonts.ready)
    const desktop = await page.screenshot({ path: path.join(output, `${label}-desktop.png`), animations: 'disabled' })
    desktopImages.push({ label, src: `data:image/png;base64,${desktop.toString('base64')}` })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: path.join(output, `${label}-mobile.png`), fullPage: true, animations: 'disabled' })
    await page.goto(`${base}/still?edition=${edition}&study=${study}`)
    await page.locator('.quiet-background').waitFor()
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: path.join(output, `${label}-mobile-home.png`), animations: 'disabled' })
    await page.locator('.quiet-nav-publications:visible').click()
    if (study === 'lens') {
      await expect(page.locator('.quiet-dock')).toBeVisible()
      await page.screenshot({ path: path.join(output, `${label}-mobile-dock.png`), animations: 'disabled' })
    }
    await page.getByRole('searchbox', { name: 'Search publications', exact: true }).fill('rank-1 fisher')
    await expect(page.locator('.quiet-paper')).toHaveCount(1)
    await page.locator('.quiet-paper-details summary').click()
    await page.screenshot({ path: path.join(output, `${label}-reading-mobile.png`), fullPage: true, animations: 'disabled' })
    if (edition === 'black') {
      await page.setViewportSize({ width: 1440, height: 990 })
      await page.screenshot({ path: path.join(output, `${study}-black-reading-desktop.png`), fullPage: true, animations: 'disabled' })
      await page.getByRole('button', { name: 'About', exact: true }).click()
      await page.screenshot({ path: path.join(output, `${study}-black-about.png`), animations: 'disabled' })
    }
    await page.close()
    console.log(`Captured Still / ${study} / ${edition}: desktop, mobile, navigation, reading`)
  }
  const height = studies.length * 592
  const contactSheet = await browser.newPage({ viewport: { width: 1600, height } })
  await contactSheet.setContent(`<html><body style="margin:0;background:#d6d8d4"><canvas width="1600" height="${height}"></canvas></body></html>`)
  await contactSheet.evaluate(async ({ images, height }) => {
    const canvas = document.querySelector('canvas')
    const context = canvas.getContext('2d')
    context.fillStyle = '#d6d8d4'
    context.fillRect(0, 0, 1600, height)
    for (const [index, item] of images.entries()) {
      const image = new Image()
      image.src = item.src
      await image.decode()
      const x = (index % 2) * 800
      const y = Math.floor(index / 2) * 592
      context.fillStyle = '#28362e'
      context.font = '16px system-ui'
      context.fillText(`STILL / ${item.label.replace('-', ' / ').toUpperCase()}`, x + 16, y + 26)
      context.drawImage(image, x, y + 42, 800, 550)
    }
  }, { images: desktopImages, height })
  await contactSheet.screenshot({ path: path.join(output, requestedStudy ? `${requestedStudy}-appearances.png` : 'six-appearances.png') })
  await contactSheet.close()
} finally {
  await browser.close()
}
