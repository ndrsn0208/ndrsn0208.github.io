import { expect, test, type Page } from '@playwright/test'

test.skip(({ isMobile }) => isMobile, 'The desktop composition is checked here; Chapters has separate phone coverage.')

function navigation(page: Page) {
  return page.getByRole('navigation', { name: 'Main navigation', exact: true })
}

function destination(page: Page, name: string) {
  return navigation(page).locator(`[data-nav-destination="${name}"]`)
}

for (const edition of ['black', 'paper']) {
  test(`${edition}: the centered introduction opens three inline panels and returns home`, async ({ page }) => {
    await page.goto(`/?edition=${edition}`)
    const home = page.locator('.quiet-home')
    await expect(home).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    const centered = (await home.boundingBox())!
    expect(centered.x + centered.width / 2).toBeCloseTo(page.viewportSize()!.width / 2, 0)
    await expect(page.locator('.quiet-pane[data-active]')).toHaveCount(0)
    await expect(page.getByRole('searchbox')).toHaveCount(0)
    await expect(page.locator('.quiet-dock')).not.toBeVisible()

    for (const name of ['publications', 'about', 'cv']) {
      await destination(page, name).click()
      const pane = page.locator(`#quiet-pane-${name}`)
      await expect(page.locator('.quiet')).toHaveAttribute('data-panel', name)
      await expect(page.locator('.quiet-pane[data-active]')).toHaveCount(1)
      await expect(pane).toHaveCSS('opacity', '1')
      await expect(pane.locator('h2').first()).toBeFocused()
      await expect(destination(page, name)).toHaveAttribute('aria-expanded', 'true')
      await expect(page.getByRole('dialog')).toHaveCount(0)
      const left = (await home.boundingBox())!
      expect(left.x).toBeLessThan(centered.x - 200)
      expect(left.y).toBeCloseTo(centered.y, 0)
      expect(left.width).toBeCloseTo(centered.width, 0)
      expect((await pane.boundingBox())!.x).toBeGreaterThan(left.x + left.width)
      expect(await page.evaluate(() => scrollY)).toBe(0)
    }

    await expect(page.locator('.quiet-cv-preview')).toHaveAttribute('src', /^\/cv\.pdf#/)
    await expect(page.getByRole('link', { name: 'Open PDF', exact: true })).toHaveAttribute('href', '/cv.pdf')
    await expect(page.getByRole('link', { name: 'Download', exact: true })).toHaveAttribute('download', 'Zekun-Wang-CV.pdf')
    await page.getByRole('button', { name: 'Close panel', exact: true }).click()
    await expect(page.locator('.quiet')).toHaveAttribute('data-panel', 'home')
    await expect(destination(page, 'cv')).toBeFocused()
    expect((await home.boundingBox())!.x).toBeCloseTo(centered.x, 0)
    await expect(page.locator('.quiet-pane[data-active]')).toHaveCount(0)
  })
}

test('only the right reader scrolls, and switching panels or appearances preserves its position', async ({ page }) => {
  await page.goto('/?edition=paper#publications')
  await page.evaluate(() => document.fonts.ready)
  const pane = page.locator('#quiet-pane-publications')
  const home = page.locator('.quiet-home')
  const original = (await home.boundingBox())!
  const details = page.locator('.quiet-paper-details').first()
  await details.locator('summary').click()
  await expect(details).toHaveAttribute('open', '')
  const paper = await details.elementHandle()

  await pane.hover({ position: { x: 180, y: 360 } })
  await page.mouse.wheel(0, 920)
  await expect.poll(() => pane.evaluate((element) => element.scrollTop)).toBeGreaterThan(500)
  const scrolled = await pane.evaluate((element) => element.scrollTop)
  expect(await page.evaluate(() => scrollY)).toBe(0)
  expect((await home.boundingBox())!.y).toBeCloseTo(original.y, 0)
  expect((await home.boundingBox())!.x).toBeCloseTo(original.x, 0)
  await home.hover({ position: { x: 120, y: 120 } })
  await page.mouse.wheel(0, 500)
  expect(await pane.evaluate((element) => element.scrollTop)).toBe(scrolled)
  expect(await page.evaluate(() => scrollY)).toBe(0)

  await destination(page, 'about').click()
  await expect(page.locator('#quiet-pane-publications')).toHaveJSProperty('inert', true)
  await expect(page.getByRole('searchbox')).toHaveCount(0)
  await destination(page, 'publications').click()
  await expect(pane).toBeFocused()
  expect(await pane.evaluate((element) => element.scrollTop)).toBe(scrolled)
  expect(await paper!.evaluate((element) => element.isConnected && element.hasAttribute('open'))).toBe(true)

  await page.getByRole('button', { name: 'Switch to Black appearance' }).click()
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'black')
  await expect(page).toHaveURL(/#publications$/)
  expect(await pane.evaluate((element) => element.scrollTop)).toBe(scrolled)
  await expect(page.locator('.quiet-dock')).not.toBeVisible()
})

test('search and expanded details survive closing the desktop reader and browser history works', async ({ page }) => {
  await page.goto('/?edition=black#about')
  await expect(page.locator('#quiet-about-title')).toBeFocused()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await destination(page, 'publications').click()
  await page.getByRole('searchbox').fill('rank-1 fisher')
  await expect(page.locator('.quiet-paper')).toHaveCount(1)
  await page.locator('.quiet-paper-details summary').click()
  await destination(page, 'cv').click()
  await expect(page.locator('#quiet-cv-title')).toBeFocused()
  await page.goBack()
  await expect(page.locator('.quiet')).toHaveAttribute('data-panel', 'publications')
  await expect(page.getByRole('searchbox')).toHaveValue('rank-1 fisher')
  await expect(page.locator('.quiet-paper-details')).toHaveAttribute('open', '')
  await page.goForward()
  await expect(page.locator('.quiet')).toHaveAttribute('data-panel', 'cv')
  await page.keyboard.press('Escape')
  await expect(destination(page, 'cv')).toBeFocused()
  await expect(page.locator('.quiet')).toHaveAttribute('data-panel', 'home')
  await destination(page, 'publications').click()
  await expect(page.getByRole('searchbox')).toHaveValue('rank-1 fisher')
  await expect(page.locator('.quiet-paper-details')).toHaveAttribute('open', '')
})

test('the introduction moves continuously without changing its text measure, including interrupted switches', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/?edition=paper')
  await expect(page.locator('.quiet-home')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  const before = (await page.locator('.quiet-home').boundingBox())!
  const leftEdge = (await page.locator('.quiet-main').boundingBox())!.x
  const samples = await page.evaluateHandle(() => {
    const frames: { x: number; width: number; opacity: number }[] = []
    // Start with the action, after the lazily loaded introduction exists.
    document.querySelector('.quiet-home [data-nav-destination="publications"]')!.addEventListener('click', () => {
      const start = performance.now()
      const sample = () => {
        const home = document.querySelector('.quiet-home')!.getBoundingClientRect()
        frames.push({ x: home.x, width: home.width, opacity: Number(getComputedStyle(document.querySelector('#quiet-pane-publications')!).opacity) })
        if (performance.now() - start < 1600) requestAnimationFrame(sample)
      }
      sample()
    }, { once: true })
    return frames
  })
  await destination(page, 'publications').click()
  await expect.poll(async () => (await page.locator('.quiet-home').boundingBox())!.x).toBeCloseTo(leftEdge, 0)
  await expect(page.locator('#quiet-pane-publications')).toHaveCSS('opacity', '1')
  const frames = await samples.jsonValue()
  expect(frames.filter((frame) => frame.x < before.x - 2 && frame.x > leftEdge + 2).length).toBeGreaterThan(3)
  expect(frames.every((frame) => Math.abs(frame.width - before.width) < 1)).toBe(true)
  expect(frames.some((frame) => frame.opacity > 0 && frame.opacity < 1)).toBe(true)

  for (const name of ['cv', 'about', 'publications', 'cv']) {
    await destination(page, name).evaluate((element) => (element as HTMLElement).click())
  }
  await expect(page.locator('#quiet-pane-cv')).toHaveCSS('opacity', '1')
  await expect(page.locator('#quiet-cv-title')).toBeFocused()
  await expect(page.locator('.quiet-pane[data-active]')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await destination(page, 'about').evaluate((element) => (element as HTMLElement).click())
  await expect(page.locator('#quiet-pane-about')).toHaveCSS('opacity', '1')
  await expect(page.locator('#quiet-about-title')).toBeFocused()
  await page.getByRole('button', { name: 'Close panel' }).click()
  await expect.poll(async () => (await page.locator('.quiet-home').boundingBox())!.x).toBeCloseTo(before.x, 0)
  await expect(destination(page, 'about')).toBeFocused()
})

test('resizing between Book desktop and Chapters keeps the same readers and active destination', async ({ page }) => {
  await page.goto('/?edition=paper#publications')
  await page.getByRole('searchbox').fill('rank-1 fisher')
  await page.locator('.quiet-paper-details summary').click()
  const paper = await page.locator('.quiet-paper-details').elementHandle()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('.quiet')).toHaveAttribute('data-layout', 'chapters')
  await expect(page.locator('#quiet-pane-publications')).toBeVisible()
  await expect(page.locator('.quiet-chapter-navigation')).toBeVisible()
  await expect(page.getByRole('searchbox')).toHaveValue('rank-1 fisher')
  expect(await paper!.evaluate((element) => element.isConnected && element.hasAttribute('open'))).toBe(true)
  await destination(page, 'about').click()
  await expect(page.locator('#quiet-about-title')).toBeFocused()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await expect(page.locator('.quiet')).toHaveAttribute('data-layout', 'split')
  await expect(page.locator('.quiet')).toHaveAttribute('data-panel', 'about')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('#quiet-about-title')).toBeFocused()
  await expect(page.locator('.quiet-dock')).not.toBeVisible()
  await expect(navigation(page)).toHaveCount(1)
  await destination(page, 'publications').click()
  await expect(page.getByRole('searchbox')).toHaveValue('rank-1 fisher')
  expect(await paper!.evaluate((element) => element.isConnected && element.hasAttribute('open'))).toBe(true)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('.quiet')).toHaveAttribute('data-layout', 'chapters')
  await expect(page.locator('.quiet-chapter-navigation')).toBeVisible()
  await expect(page.locator('html')).toHaveCSS('overflow', 'hidden')
  await expect(page.getByRole('searchbox')).toHaveValue('rank-1 fisher')
  expect(await paper!.evaluate((element) => element.isConnected && element.hasAttribute('open'))).toBe(true)
})

test('both columns and their controls fit a small laptop and a large display', async ({ page }) => {
  for (const viewport of [{ width: 1024, height: 600 }, { width: 1280, height: 720 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport)
    await page.goto('/?edition=black')
    await page.evaluate(() => document.fonts.ready)
    await destination(page, 'publications').click()
    for (const control of await page.locator('.quiet-home [data-nav-destination], .quiet-panel-toolbar button').all()) {
      const rect = (await control.boundingBox())!
      expect(rect.x).toBeGreaterThanOrEqual(0)
      expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width)
      expect(rect.y).toBeGreaterThanOrEqual(0)
      expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height)
      expect(rect.height).toBeGreaterThanOrEqual(44)
    }
    const pane = (await page.locator('#quiet-pane-publications').boundingBox())!
    const home = (await page.locator('.quiet-home').boundingBox())!
    expect(pane.x).toBeGreaterThan(home.x + home.width)
    expect(pane.width).toBeGreaterThan(400)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
    expect(await page.evaluate(() => scrollY)).toBe(0)
  }
})
