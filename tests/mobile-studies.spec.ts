import { expect, test, type Page } from '@playwright/test'

const navigation = (page: Page) => page.getByRole('navigation', { name: 'Main navigation', exact: true })
const destination = (page: Page, name: string) => navigation(page).locator(`[data-nav-destination="${name}"]`)

for (const study of ['folio', 'index', 'chapters']) {
  test(`${study}: phone research topics, reading, and personal information are usable`, async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The full phone page is tested on the phone viewport.')
    await page.goto(`/mobile/${study}?edition=paper`)
    await expect(page.locator('.quiet-home')).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('.quiet-intro')).toHaveCSS('font-style', 'normal')
    await expect(page.locator('.quiet-home').getByRole('link', { name: 'Christopher MacLellan' })).toBeVisible()

    await destination(page, 'publications').click()
    const topics = page.getByRole('group', { name: 'Research topics', exact: true })
    await expect(topics.getByRole('button')).toHaveCount(6)
    for (const button of await topics.getByRole('button').all()) {
      const bounds = (await button.boundingBox())!
      expect(bounds.x).toBeGreaterThanOrEqual(0)
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(390)
      expect(bounds.height).toBeGreaterThanOrEqual(44)
    }
    if (study === 'index') {
      await expect(page.locator('.quiet-dock')).toBeVisible()
      expect((await page.locator('.quiet-dock').boundingBox())!.y).toBeLessThan(40)
    }
    await topics.getByRole('button', { name: 'continual learning', exact: true }).click()
    await page.getByRole('searchbox').fill('rank-1 fisher')
    await expect(page.locator('.quiet-paper')).toHaveCount(1)
    await page.locator('.quiet-paper-details summary').click()
    await expect(page.locator('.quiet-paper-details')).toHaveAttribute('open', '')
    expect(Number.parseFloat(await page.locator('.quiet-paper-meta').evaluate((element) => getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16)

    await destination(page, 'about').click()
    const reading = study === 'chapters' ? page.locator('#quiet-pane-about') : page.getByRole('dialog')
    await expect(reading).toBeVisible()
    await expect(reading.locator('.quiet-photographer')).toHaveCSS('font-style', 'normal')
    expect(await reading.locator('.quiet-photographer').evaluate((element) => getComputedStyle(element).fontFamily)).toContain('Newsreader')
    if (study === 'chapters') {
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await destination(page, 'publications').click()
    } else await page.getByRole('button', { name: 'Close dialog' }).click()
    await expect(page.getByRole('searchbox')).toHaveValue('rank-1 fisher')
    await expect(topics.getByRole('button', { name: 'continual learning', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.quiet-paper-details')).toHaveAttribute('open', '')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  })
}

test('Chapters keeps independent reading positions, history, and focus through page changes', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Chapter navigation belongs to the phone layout.')
  await page.goto('/?edition=paper#publications')
  const publications = page.locator('#quiet-pane-publications')
  await expect(publications).toHaveCSS('opacity', '1')
  const firstDetails = page.locator('.quiet-paper-details').first()
  await firstDetails.locator('summary').click()
  const detailsNode = await firstDetails.elementHandle()
  await publications.hover({ position: { x: 180, y: 360 } })
  await page.mouse.wheel(0, 850)
  await expect.poll(() => publications.evaluate((element) => element.scrollTop)).toBeGreaterThan(500)
  const position = await publications.evaluate((element) => element.scrollTop)
  const navTop = (await navigation(page).boundingBox())!.y
  expect(await page.evaluate(() => scrollY)).toBe(0)

  await destination(page, 'about').click()
  await expect(page.locator('#quiet-about-title')).toBeFocused()
  await expect(publications).toHaveJSProperty('inert', true)
  await page.goBack()
  await expect(page.locator('.quiet')).toHaveAttribute('data-panel', 'publications')
  expect(await publications.evaluate((element) => element.scrollTop)).toBe(position)
  expect(await detailsNode!.evaluate((element) => element.isConnected && element.hasAttribute('open'))).toBe(true)

  await destination(page, 'about').click()
  await expect(page.locator('#quiet-about-title')).toBeFocused()
  await page.getByRole('button', { name: 'Switch to Black appearance' }).click()
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'black')
  await expect(page).toHaveURL(/#about$/)
  await destination(page, 'cv').click()
  await expect(page.locator('.quiet-cv-preview')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open PDF', exact: true })).toHaveAttribute('href', '/cv.pdf')
  expect((await navigation(page).boundingBox())!.y).toBeCloseTo(navTop, 0)
  await page.keyboard.press('Escape')
  await expect(page.locator('.quiet')).toHaveAttribute('data-panel', 'home')
  await expect(destination(page, 'cv')).toBeFocused()
  await expect(page.locator('.quiet-home')).toHaveJSProperty('inert', false)
})

test('all three phone studies fit 320px in both appearances', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Small phone geometry.')
  await page.setViewportSize({ width: 320, height: 700 })
  for (const study of ['folio', 'index', 'chapters']) {
    for (const edition of ['paper', 'black']) {
      await page.goto(`/mobile/${study}?edition=${edition}`)
      await expect(page.locator('.quiet-home')).toBeVisible()
      await destination(page, 'publications').click()
      await expect(page.getByRole('group', { name: 'Research topics', exact: true })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
      for (const control of await navigation(page).locator('[data-nav-destination]').all()) {
        const bounds = (await control.boundingBox())!
        expect(bounds.x).toBeGreaterThanOrEqual(0)
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(320)
        expect(bounds.height).toBeGreaterThanOrEqual(44)
      }
      await destination(page, 'about').click()
      const reading = study === 'chapters' ? page.locator('#quiet-pane-about') : page.getByRole('dialog')
      await expect(reading).toBeVisible()
      expect(await reading.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    }
  }
})

test('Chapters animates page changes and settles correctly after rapid navigation', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Phone chapter transitions.')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/?edition=paper')
  await expect(page.locator('.quiet-home')).toBeVisible()
  const samples = await page.evaluateHandle(() => {
    const frames: number[] = []
    document.querySelector('.quiet-chapter-navigation [data-nav-destination="publications"]')!.addEventListener('click', () => {
      const start = performance.now()
      const sample = () => {
        frames.push(Number(getComputedStyle(document.querySelector('#quiet-pane-publications')!).opacity))
        if (performance.now() - start < 1100) requestAnimationFrame(sample)
      }
      sample()
    }, { once: true })
    return frames
  })
  await destination(page, 'publications').click()
  await expect(page.locator('#quiet-pane-publications')).toHaveCSS('opacity', '1')
  expect((await samples.jsonValue()).filter((value) => value > 0 && value < 1).length).toBeGreaterThan(3)
  for (const name of ['about', 'cv', 'publications', 'about']) {
    await destination(page, name).evaluate((element) => (element as HTMLElement).click())
  }
  await expect(page.locator('#quiet-pane-about')).toHaveCSS('opacity', '1')
  await expect(page.locator('#quiet-pane-about')).toHaveCSS('visibility', 'visible')
  await expect(page.locator('.quiet-pane[data-active]')).toHaveCount(1)
  await expect(page.locator('#quiet-about-title')).toBeFocused()
  await page.getByRole('button', { name: 'Zekun Wang, return to introduction' }).click()
  await expect(page.locator('.quiet-home')).toHaveCSS('opacity', '1')
  await expect(page.locator('.quiet-home')).toBeVisible()
})

test('the comparison runs three live phone pages and preserves their state on theme changes', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop comparison uses frames; phones open each study directly.')
  await page.goto('/mobile?edition=paper')
  await expect(page.locator('iframe')).toHaveCount(3)
  const folio = page.frameLocator('iframe[title="Folio 手机交互预览"]')
  const index = page.frameLocator('iframe[title="Index 手机交互预览"]')
  const chapters = page.frameLocator('iframe[title="Chapters 手机交互预览"]')
  await expect(chapters.locator('.quiet')).toHaveAttribute('data-layout', 'chapters')
  await page.getByRole('group', { name: '比较阅读位置' }).getByRole('button', { name: 'Publications', exact: true }).click()
  for (const frame of [folio, index, chapters]) {
    await expect(frame.getByRole('group', { name: 'Research topics', exact: true })).toBeVisible()
  }
  await index.getByRole('group', { name: 'Research topics', exact: true }).getByRole('button', { name: 'continual learning', exact: true }).click()
  await index.getByRole('searchbox').fill('rank-1 fisher')
  await index.locator('.quiet-paper-details summary').click()
  await page.getByRole('group', { name: '预览主题' }).getByRole('button', { name: 'Black', exact: true }).click()
  for (const frame of [folio, index, chapters]) await expect(frame.locator('.quiet')).toHaveAttribute('data-edition', 'black')
  await expect(index.getByRole('searchbox')).toHaveValue('rank-1 fisher')
  await expect(index.locator('.quiet-paper-details')).toHaveAttribute('open', '')
  await expect(index.getByRole('group', { name: 'Research topics', exact: true }).getByRole('button', { name: 'continual learning', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await chapters.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('button', { name: 'About', exact: true }).click()
  await expect(chapters.locator('#quiet-about-title')).toBeVisible()
  await expect(folio.getByRole('dialog')).toHaveCount(0)
})
