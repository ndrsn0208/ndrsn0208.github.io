import { expect, test, type Page } from '@playwright/test'

test.use({ reducedMotion: 'no-preference' })

function publicationsControl(page: Page) {
  return page.getByRole('navigation', { name: 'Main navigation', exact: true }).locator('.quiet-nav-publications')
}

test('Lens scrolls smoothly to publications and back while keeping the page in place', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/still?study=lens&edition=black')
  await expect(page.locator('.quiet-paper')).toHaveCount(15)
  await page.evaluate(() => document.fonts.ready)
  const paper = await page.locator('.quiet-paper').first().elementHandle()
  const scrollPositions = await page.evaluateHandle(() => {
    const positions: number[] = []
    window.addEventListener('scroll', () => positions.push(window.scrollY), { passive: true })
    return positions
  })

  await page.getByRole('link', { name: 'Publications', exact: true }).click()
  const heading = page.getByRole('heading', { name: 'Publications', exact: true })
  await expect(heading).toBeFocused()
  await expect.poll(() => heading.evaluate((element) => element.getBoundingClientRect().top)).toBeLessThan(40)
  const destination = await page.evaluate(() => window.scrollY)
  const positions = await scrollPositions.jsonValue()
  expect(new Set(positions.filter((y) => y > 4 && y < destination - 4)).size).toBeGreaterThan(2)
  expect(await paper!.evaluate((element) => element.isConnected)).toBe(true)
  await expect(page.locator('.quiet-home')).toBeVisible()

  await page.getByRole('link', { name: 'Back to introduction', exact: true }).click()
  await expect(page.locator('.quiet-home')).toBeFocused()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5)
  expect(await paper!.evaluate((element) => element.isConnected)).toBe(true)
  await expect(page.locator('.quiet-paper')).toHaveCount(15)
})

test('animated page changes keep reading state and restore keyboard focus', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/still?study=drift&edition=black&review=1')
  await publicationsControl(page).click()
  await expect(page.locator('.quiet')).toHaveAttribute('data-mode', 'work')
  await expect.poll(() => page.evaluate(() => document.getAnimations().some((animation) =>
    animation instanceof CSSAnimation && animation.animationName.startsWith('still-screen') && animation.playState === 'running',
  ))).toBe(true)
  await expect(page.locator('html')).not.toHaveAttribute('data-still-transition')
  await expect(page.locator('#quiet-reader-title')).toBeFocused()
  await page.getByRole('searchbox').fill('rank-1 fisher')
  await expect(page.locator('.quiet-paper')).toHaveCount(1)
  await page.getByRole('button', { name: 'Back to introduction', exact: true }).first().click()
  await expect(page.locator('.quiet')).toHaveAttribute('data-mode', 'home')
  await expect(page.locator('html')).not.toHaveAttribute('data-still-transition')
  await expect(publicationsControl(page)).toBeFocused()
  await publicationsControl(page).click()
  await expect(page.getByRole('searchbox')).toHaveValue('rank-1 fisher')
  await expect(page.locator('.quiet-paper')).toHaveCount(1)
  await expect(page.locator('html')).not.toHaveAttribute('data-still-transition')
  await page.getByRole('button', { name: 'Paper', exact: true }).click()
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'paper')
  await expect.poll(() => page.evaluate(() => document.getAnimations().some((animation) =>
    animation instanceof CSSAnimation && animation.animationName === 'still-fade-in' && animation.playState === 'running',
  ))).toBe(true)
  await page.getByRole('button', { name: 'Black', exact: true }).click()
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'black')
  await expect(page.locator('html')).not.toHaveAttribute('data-still-transition')
  await expect(page.getByRole('searchbox')).toHaveValue('rank-1 fisher')
  await page.goBack()
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'paper')
  await expect(page.locator('html')).not.toHaveAttribute('data-still-transition')
  await page.goForward()
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'black')
  await expect(page.locator('html')).not.toHaveAttribute('data-still-transition')
  await page.getByRole('button', { name: '收起 Still 风格切换栏' }).click()
  await page.getByRole('button', { name: '展开 Still 风格切换栏' }).click()
  await expect(page.getByRole('group', { name: 'Still styles' })).toBeVisible()
  await expect(page.locator('html')).not.toHaveAttribute('data-still-transition')
  expect(errors).toEqual([])
})

test('a dialog can close during its entrance without changing content or trapping focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/still?edition=black')
  const trigger = page.getByRole('button', { name: 'About', exact: true })
  await trigger.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  expect(await dialog.evaluate((element) => element.getAnimations().some((animation) => animation.playState === 'running'))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveAttribute('data-closing', 'true')
  await expect(dialog.getByRole('heading', { name: 'A little about me.' })).toBeVisible()
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  expect(await page.locator('body').evaluate((element) => element.style.overflow)).not.toBe('hidden')
  await trigger.click()
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Close dialog' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

test('paper details animate in both directions and accept repeated toggles', async ({ page }) => {
  await page.goto('/still?edition=black')
  await publicationsControl(page).click()
  await page.getByRole('searchbox').fill('rank-1 fisher')
  await expect(page.locator('.quiet-paper')).toHaveCount(1)
  const details = page.locator('.quiet-paper-details')
  const toggle = details.locator('summary')
  await toggle.click()
  await expect(details).toHaveAttribute('data-animating', 'true')
  expect(await details.evaluate((element) => element.getAnimations().some((animation) => animation.playState === 'running'))).toBe(true)
  await toggle.click()
  await toggle.click()
  await expect(details).not.toHaveAttribute('data-animating')
  await expect(details).toHaveAttribute('open', '')
  await expect(details.getByRole('link', { name: 'Read paper', exact: true })).toBeVisible()
  await toggle.click()
  await expect(details).not.toHaveAttribute('open')
  await expect(details).not.toHaveAttribute('data-animating')
})

test('animated edition switches and a browser fallback retain the active paper', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'startViewTransition', { value: undefined, configurable: true })
  })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/still?edition=black&review=1')
  await publicationsControl(page).click()
  await page.getByRole('searchbox').fill('rank-1 fisher')
  await expect(page.locator('.quiet-paper')).toHaveCount(1)
  await page.locator('.quiet-paper-details summary').click()
  await page.getByRole('button', { name: 'Paper', exact: true }).click()
  await page.getByRole('button', { name: 'Black', exact: true }).click()
  await page.getByRole('button', { name: 'Paper', exact: true }).click()
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'paper')
  await expect(page.locator('.quiet')).toHaveCSS('opacity', '1')
  await expect(page.getByRole('searchbox')).toHaveValue('rank-1 fisher')
  await expect(page.locator('.quiet-paper-details')).toHaveAttribute('open', '')
  await page.getByRole('button', { name: 'Black', exact: true }).click()
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'black')
  await expect(page.locator('.quiet')).toHaveCSS('opacity', '1')
  await expect(page.locator('.quiet')).toHaveCSS('background-color', 'rgb(0, 0, 0)')
  expect(errors).toEqual([])
})

test('a composition change animates without remounting the open paper', async ({ page }) => {
  await page.goto('/still?study=lens&edition=black&review=1')
  await publicationsControl(page).click()
  await expect(page.locator('html')).not.toHaveAttribute('data-still-transition')
  await page.getByRole('searchbox').fill('rank-1 fisher')
  await expect(page.locator('.quiet-paper')).toHaveCount(1)
  await page.locator('.quiet-paper-details summary').click()
  await expect(page.locator('.quiet-paper-details')).not.toHaveAttribute('data-animating')
  const paper = await page.locator('.quiet-paper-details').elementHandle()

  const select = page.getByRole('combobox', { name: '选择 Still 设计', exact: true })
  if (page.viewportSize()!.width <= 620) await select.selectOption('frame')
  else await page.getByRole('group', { name: 'Still designs' }).getByRole('button', { name: 'Frame', exact: true }).click()
  await expect(page.locator('.quiet')).toHaveAttribute('data-study', 'frame')
  await expect.poll(() => page.evaluate(() => document.getAnimations().some((animation) =>
    animation instanceof CSSAnimation && animation.animationName === 'still-screen-in' && animation.playState === 'running',
  ))).toBe(true)
  await expect(page.locator('html')).not.toHaveAttribute('data-still-transition')
  expect(await paper!.evaluate((element) => element.isConnected && element.hasAttribute('open'))).toBe(true)
  await expect(page.getByRole('searchbox')).toHaveValue('rank-1 fisher')

  await page.getByRole('button', { name: 'Switch to Paper appearance' }).click()
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'paper')
  await expect(page.locator('html')).not.toHaveAttribute('data-still-transition')
  expect(await paper!.evaluate((element) => element.isConnected && element.hasAttribute('open'))).toBe(true)
  await page.getByRole('button', { name: 'Back to introduction', exact: true }).first().click()
  await expect(publicationsControl(page)).toBeFocused()
})

test('rapidly reversing the dock animation keeps the open paper and keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('.quiet-paper')).toHaveCount(15)
  await page.evaluate(() => document.fonts.ready)
  await publicationsControl(page).click()
  await expect(page.getByRole('heading', { name: 'Publications', exact: true })).toBeFocused()
  await expect(page.locator('.quiet-dock')).toBeVisible()

  const details = page.locator('.quiet-paper-details').first()
  const summary = details.locator('summary')
  await summary.click()
  await expect(details).toHaveAttribute('open', '')
  await expect(details).not.toHaveAttribute('data-animating')
  await expect(summary).toBeFocused()
  const originalPaper = await details.elementHandle()
  const anchor = page.locator('.quiet-home .quiet-navigation')
  const inline = anchor.locator('.quiet-nav')
  const threshold = await anchor.evaluate((element) => element.getBoundingClientRect().bottom + window.scrollY)

  for (const floating of [false, true, false, true]) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), threshold + (floating ? 64 : -96))
    await expect(inline).toHaveJSProperty('inert', floating)
    await expect(page.getByRole('navigation', { name: 'Main navigation', exact: true })).toHaveCount(1)
    await expect(summary).toBeFocused()
    if (!floating) {
      // An exiting dock may remain on screen while its animation finishes.
      expect(await page.locator('.quiet-dock').evaluateAll((elements) => elements.every((element) =>
        element.getAttribute('aria-hidden') === 'true' && element.hasAttribute('inert'),
      ))).toBe(true)
    }
  }

  await expect(page.locator('.quiet-dock')).toBeVisible()
  await expect(page.locator('.quiet-paper')).toHaveCount(15)
  expect(await originalPaper!.evaluate((element) => element.isConnected && element.hasAttribute('open'))).toBe(true)
  await expect(summary).toBeFocused()
})

test('returning to the introduction transfers a focused dock destination to the inline navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('.quiet-paper')).toHaveCount(15)
  await page.evaluate(() => document.fonts.ready)
  await publicationsControl(page).click()
  const heading = page.getByRole('heading', { name: 'Publications', exact: true })
  await expect(heading).toBeFocused()
  await expect.poll(() => heading.evaluate((element) => element.getBoundingClientRect().top)).toBeLessThan(40)
  const dock = page.locator('.quiet-dock')
  await expect(dock).toBeVisible()
  const dockAbout = dock.getByRole('button', { name: 'About', exact: true })
  await dockAbout.evaluate((element) => (element as HTMLElement).focus({ preventScroll: true }))
  await expect(dockAbout).toBeFocused()
  const exitFrames = await page.evaluateHandle(() => {
    const frames: { opacity: number; visibility: string; inert: boolean }[] = []
    const sample = () => {
      const dock = document.querySelector<HTMLElement>('.quiet-dock')
      if (!dock) return
      const navigation = dock.querySelector('nav')
      if (navigation && dock.getAttribute('aria-hidden') === 'true') {
        frames.push({
          opacity: Number(getComputedStyle(dock).opacity),
          visibility: getComputedStyle(navigation).visibility,
          inert: dock.inert,
        })
      }
      requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
    return frames
  })

  await page.mouse.wheel(0, -2000)
  const anchor = page.locator('.quiet-home .quiet-navigation')
  await expect(anchor).toBeInViewport({ ratio: 1 })
  await expect(anchor.getByRole('button', { name: 'About', exact: true })).toBeFocused()
  await expect(page.getByRole('navigation', { name: 'Main navigation', exact: true })).toHaveCount(1)
  await expect(dock).not.toBeVisible()
  const frames = await exitFrames.jsonValue()
  expect(frames.some((frame) => frame.opacity > 0 && frame.opacity < 1)).toBe(true)
  expect(frames.every((frame) => frame.inert)).toBe(true)
  expect(frames.filter((frame) => frame.opacity > 0).every((frame) => frame.visibility === 'visible')).toBe(true)
})
