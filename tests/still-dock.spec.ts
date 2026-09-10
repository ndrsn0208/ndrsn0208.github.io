import { expect, test, type Page } from '@playwright/test'

test.use({ reducedMotion: 'reduce' })

function mainNavigation(page: Page) {
  return page.getByRole('navigation', { name: 'Main navigation', exact: true })
}

async function revealDock(page: Page) {
  const anchor = page.locator('.quiet-home .quiet-navigation')
  await anchor.evaluate((element) => {
    window.scrollBy({ top: element.getBoundingClientRect().bottom + 48, behavior: 'instant' })
  })
  await expect.poll(() => anchor.evaluate((element) => element.getBoundingClientRect().bottom)).toBeLessThan(0)
  await expect(page.locator('.quiet-dock')).toBeVisible()
  await expect(mainNavigation(page)).toHaveCount(1)
  return page.locator('.quiet-dock')
}

test('public entry points omit review controls and the homepage stays Lens after visiting another study', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.quiet')).toHaveAttribute('data-study', 'lens')
  await expect(page.locator('.still-controls')).toHaveCount(0)

  await page.goto('/still?study=frame&edition=paper')
  await expect(page.locator('.quiet')).toHaveAttribute('data-study', 'frame')
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'paper')
  await expect(page.locator('.still-controls')).toHaveCount(0)
  await page.goto('/still')
  await expect(page.locator('.quiet')).toHaveAttribute('data-study', 'frame')
  await expect(page.locator('.still-controls')).toHaveCount(0)

  await page.goto('/')
  await expect(page.locator('.quiet')).toHaveAttribute('data-study', 'lens')
  await expect(page.locator('.still-controls')).toHaveCount(0)
  await expect(page.locator('.quiet-dock')).not.toBeVisible()
  await expect(mainNavigation(page)).toHaveCount(1)
})

test('explicit review links retain the archive controls and embeds stay clean', async ({ page }) => {
  await page.goto('/still?study=drift&edition=paper&review=1')
  await expect(page.locator('.quiet')).toHaveAttribute('data-study', 'drift')
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'paper')
  await expect(page.locator('.still-controls')).toBeVisible()

  await page.goto('/still?study=drift&edition=paper&review=1&embed=1')
  await expect(page.locator('.quiet')).toHaveAttribute('data-study', 'drift')
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'paper')
  await expect(page.locator('.still-controls')).toHaveCount(0)
})

test('reduced motion hands navigation to the dock without moving or replacing the publication list', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('.quiet-paper')).toHaveCount(15)
  await page.evaluate(() => document.fonts.ready)
  const inline = page.locator('.quiet-home .quiet-navigation .quiet-nav')
  const firstPaper = await page.locator('.quiet-paper').first().elementHandle()
  const originalPaperTop = await firstPaper!.evaluate((element) => element.getBoundingClientRect().top + window.scrollY)
  const originalNavigationHeight = await inline.evaluate((element) => element.getBoundingClientRect().height)
  await expect(inline).toBeVisible()
  await expect(page.locator('.quiet-dock')).not.toBeVisible()
  await expect(mainNavigation(page)).toHaveCount(1)

  const dock = await revealDock(page)
  await expect(page.locator('.quiet-dock-positioner')).toHaveCSS('position', 'fixed')
  await expect(inline).toHaveCount(1)
  await expect(inline).not.toBeVisible()
  await expect(inline).toHaveAttribute('aria-hidden', 'true')
  await expect(inline).toHaveJSProperty('inert', true)
  expect(await inline.evaluate((element) => element.getBoundingClientRect().height)).toBeCloseTo(originalNavigationHeight, 0)
  expect(await firstPaper!.evaluate((element) => element.getBoundingClientRect().top + window.scrollY)).toBeCloseTo(originalPaperTop, 0)

  const publications = dock.getByRole('link', { name: 'Publications', exact: true })
  const about = dock.getByRole('button', { name: 'About', exact: true })
  const contact = dock.getByRole('button', { name: 'Contact', exact: true })
  const cv = dock.getByRole('link', { name: 'CV (PDF)', exact: true })
  await expect(dock.locator('[data-nav-destination]')).toHaveCount(4)
  for (const [destination, control] of [
    ['publications', publications],
    ['about', about],
    ['contact', contact],
    ['cv', cv],
  ] as const) {
    await expect(control).toBeVisible()
    await expect(control).toHaveAttribute('data-nav-destination', destination)
  }
  await expect(publications).toHaveAttribute('href', '#publications')
  await expect(cv).toHaveAttribute('href', '/cv.pdf')
  await publications.click()
  const heading = page.getByRole('heading', { name: 'Publications', exact: true })
  await expect(heading).toBeFocused()
  await expect.poll(() => heading.evaluate((element) => element.getBoundingClientRect().top)).toBeLessThan(40)
  await expect(page).toHaveURL(/#publications$/)
  await expect(page.locator('.quiet-paper')).toHaveCount(15)
  expect(await firstPaper!.evaluate((element) => element.isConnected)).toBe(true)
  await expect(mainNavigation(page)).toHaveCount(1)

  await page.getByRole('link', { name: 'Back to introduction', exact: true }).click()
  await expect(page.locator('.quiet-home')).toBeFocused()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5)
  await expect(dock).not.toBeVisible()
  await expect(inline).toBeVisible()
  await expect(inline).toHaveJSProperty('inert', false)
  await expect(mainNavigation(page)).toHaveCount(1)
  await expect(page.locator('.quiet-paper')).toHaveCount(15)
  expect(await firstPaper!.evaluate((element) => element.isConnected)).toBe(true)
  expect(await firstPaper!.evaluate((element) => element.getBoundingClientRect().top + window.scrollY)).toBeCloseTo(originalPaperTop, 0)
  expect(await inline.evaluate((element) => element.getBoundingClientRect().height)).toBeCloseTo(originalNavigationHeight, 0)
})

test('dock destinations work with the keyboard and dialogs return focus to their dock trigger', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('.quiet-paper')).toHaveCount(15)
  await page.evaluate(() => document.fonts.ready)
  const dock = await revealDock(page)
  await dock.getByRole('link', { name: 'Publications', exact: true }).focus()
  for (const control of [
    dock.getByRole('button', { name: 'About', exact: true }),
    dock.getByRole('button', { name: 'Contact', exact: true }),
    dock.getByRole('link', { name: 'CV (PDF)', exact: true }),
  ]) {
    await page.keyboard.press('Tab')
    await expect(control).toBeFocused()
  }

  const about = dock.getByRole('button', { name: 'About', exact: true })
  await about.click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'A little about me.', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(about).toBeFocused()
  await expect(mainNavigation(page)).toHaveCount(1)

  const contact = dock.getByRole('button', { name: 'Contact', exact: true })
  await contact.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('a[href="mailto:zekun@gatech.edu"]')).toBeVisible()
  await dialog.getByRole('button', { name: 'Close dialog', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  await expect(contact).toBeFocused()
  await expect(dock).toBeVisible()
  await expect(mainNavigation(page)).toHaveCount(1)
})

test('a large scroll on a short screen still reaches the dock', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 320 })
  await page.goto('/?edition=paper')
  await expect(page.locator('.quiet-paper')).toHaveCount(15)
  await page.evaluate(() => document.fonts.ready)
  const anchor = page.locator('.quiet-home .quiet-navigation')
  expect(await anchor.evaluate((element) => element.getBoundingClientRect().top)).toBeGreaterThan(320)
  await expect(anchor).not.toBeInViewport()
  await expect(page.locator('.quiet-dock')).not.toBeVisible()

  await page.mouse.wheel(0, 2000)
  await expect.poll(() => anchor.evaluate((element) => element.getBoundingClientRect().bottom)).toBeLessThan(0)
  await expect(page.locator('.quiet-dock')).toBeVisible()
  await expect(mainNavigation(page)).toHaveCount(1)
})

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`search keeps focus and recovers its dock after keyboard-sized viewport changes / ${reducedMotion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/#publications')
    await expect(page.getByRole('heading', { name: 'Publications', exact: true })).toBeFocused()
    const dock = page.locator('.quiet-dock')
    await expect(dock).toBeVisible()
    const search = page.getByRole('searchbox', { name: 'Search publications', exact: true })
    await search.fill('continual')

    for (const height of [430, 844, 430, 844]) {
      await page.setViewportSize({ width: 390, height })
      if (height === 430) await expect(dock).not.toBeVisible()
      else {
        await expect(dock).toBeVisible()
        await expect(dock.locator('[data-nav-destination]')).toHaveCount(4)
      }
      await expect(search).toBeFocused()
      await expect(search).toHaveValue('continual')
      await expect(mainNavigation(page)).toHaveCount(1)
    }
  })
}

for (const edition of ['black', 'paper']) {
  test(`${edition} dock waits until the inline navigation passes above the viewport and fits a 320px phone`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 320 })
    await page.goto(`/?edition=${edition}`)
    await expect(page.locator('.quiet')).toHaveAttribute('data-study', 'lens')
    await expect(page.locator('.quiet')).toHaveAttribute('data-edition', edition)
    await page.evaluate(() => document.fonts.ready)
    const inline = page.locator('.quiet-home .quiet-navigation')
    expect(await inline.evaluate((element) => element.getBoundingClientRect().top)).toBeGreaterThan(320)
    await expect(page.locator('.quiet-dock')).not.toBeVisible()
    await expect(mainNavigation(page)).toHaveCount(1)

    await page.setViewportSize({ width: 320, height: 740 })
    await expect(inline).toBeInViewport({ ratio: 1 })
    const dock = await revealDock(page)
    const bounds = await dock.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320)
    expect(bounds!.y).toBeGreaterThanOrEqual(0)
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(740)
    const controls = dock.locator('[data-nav-destination]')
    await expect(controls).toHaveCount(4)
    for (const control of await controls.all()) {
      const rect = await control.boundingBox()
      expect(rect).not.toBeNull()
      expect(rect!.x).toBeGreaterThanOrEqual(0)
      expect(rect!.x + rect!.width).toBeLessThanOrEqual(320)
      expect(rect!.y).toBeGreaterThanOrEqual(0)
      expect(rect!.y + rect!.height).toBeLessThanOrEqual(740)
      expect(rect!.width).toBeGreaterThanOrEqual(44)
      expect(rect!.height).toBeGreaterThanOrEqual(44)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
    await expect(page.locator('.still-controls')).toHaveCount(0)
  })
}
