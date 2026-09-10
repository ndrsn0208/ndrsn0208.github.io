import { expect, test, type Page } from '@playwright/test'

const studies = ['book', 'editorial', 'humanist', 'poem']
const navigation = (page: Page) => page.getByRole('navigation', { name: 'Main navigation', exact: true })

for (const study of studies) {
  test(`${study}: complete reading experience fits both appearances`, async ({ page, isMobile }) => {
    await page.goto(`/typography/${study}?edition=paper`)
    await expect(page.locator('.quiet-home')).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    const home = page.locator('.quiet-home')
    const before = (await home.boundingBox())!
    expect(Math.abs(before.x + before.width / 2 - page.viewportSize()!.width / 2)).toBeLessThan(2)
    const education = (await page.locator('.quiet-education').boundingBox())!
    const industry = (await page.locator('.quiet-industry').boundingBox())!
    expect(industry.x).toBeGreaterThan(education.x)
    expect(industry.y).toBeCloseTo(education.y, 0)
    await expect(home.getByRole('link', { name: 'Christopher MacLellan' })).toBeVisible()

    await navigation(page).locator('[data-nav-destination="publications"]').click()
    await expect(page.locator('.quiet-paper')).toHaveCount(15)
    expect(Number.parseFloat(await page.locator('.quiet-paper-meta').first().evaluate((element) => getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16)
    if (!isMobile) {
      const pane = page.locator('#quiet-pane-publications')
      await expect(pane).toHaveCSS('opacity', '1')
      const left = (await home.boundingBox())!
      expect(left.width).toBeCloseTo(before.width, 0)
      expect(left.x).toBeLessThan(before.x - 150)
      await pane.hover({ position: { x: 180, y: 360 } })
      await page.mouse.wheel(0, 850)
      await expect.poll(() => pane.evaluate((element) => element.scrollTop)).toBeGreaterThan(500)
      expect(await page.evaluate(() => scrollY)).toBe(0)
    }
    await navigation(page).locator('[data-nav-destination="about"]').click()
    const reading = isMobile ? page.getByRole('dialog') : page.locator('#quiet-pane-about')
    await expect(reading).toBeVisible()
    await expect(reading.locator('.quiet-photographer')).toBeVisible()
    expect(await reading.locator('.quiet-photographer').evaluate((element) => getComputedStyle(element).fontFamily)).toContain(study === 'book' ? 'Newsreader' : 'Caveat')
    if (isMobile) await page.getByRole('button', { name: 'Close dialog' }).click()
    await page.getByRole('button', { name: 'Switch to Black appearance' }).click()
    await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'black')
    await expect(page.locator('.quiet')).toHaveCSS('background-color', 'rgb(0, 0, 0)')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width)
  })
}

test('switching type keeps the open reader, search, details, and browser history', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The mobile dialog and dock are checked in the complete reading tests.')
  await page.goto('/typography/book?edition=paper&review=1#publications')
  await page.getByRole('searchbox').fill('rank-1 fisher')
  await expect(page.locator('.quiet-paper')).toHaveCount(1)
  const details = page.locator('.quiet-paper-details')
  await details.locator('summary').click()
  await expect(details).toHaveAttribute('open', '')
  const originalDetails = await details.elementHandle()
  for (const study of ['editorial', 'humanist', 'poem']) {
    await page.getByRole('combobox', { name: '选择排版', exact: true }).selectOption(study)
    await expect(page.locator('.type-preview')).toHaveAttribute('data-typography', study)
    await expect(page.locator('.quiet')).toHaveAttribute('data-panel', 'publications')
    await expect(page).toHaveURL(/#publications$/)
    await expect(page.getByRole('searchbox')).toHaveValue('rank-1 fisher')
    expect(await originalDetails!.evaluate((element) => element.isConnected && element.hasAttribute('open'))).toBe(true)
  }
  await page.goBack()
  await expect(page.locator('.type-preview')).toHaveAttribute('data-typography', 'humanist')
  await expect(page.getByRole('searchbox')).toHaveValue('rank-1 fisher')
  await page.getByRole('link', { name: '隐藏预览工具，查看纯净页面' }).click()
  await expect(page.getByRole('complementary', { name: '排版预览控制' })).toHaveCount(0)
  await expect(page.getByRole('searchbox')).toHaveValue('rank-1 fisher')
})

test('comparison uses real independent desktop and mobile pages', async ({ page }) => {
  await page.goto('/typography/compare?left=original&right=book&edition=paper')
  const left = page.frameLocator('iframe[title^="左侧"]')
  const right = page.frameLocator('iframe[title^="右侧"]')
  await expect(left.locator('.quiet')).toHaveAttribute('data-layout', 'split')
  await expect(right.locator('.type-preview')).toHaveAttribute('data-typography', 'book')
  await page.getByRole('combobox', { name: '右侧排版' }).selectOption('poem')
  await expect(right.locator('.type-preview')).toHaveAttribute('data-typography', 'poem')
  await page.getByRole('combobox', { name: '比较阅读位置' }).selectOption('about')
  await expect(left.locator('#quiet-pane-about')).toBeVisible()
  await expect(right.locator('#quiet-pane-about')).toBeVisible()
  await page.getByRole('button', { name: '手机', exact: true }).click()
  await expect(right.locator('.quiet')).not.toHaveAttribute('data-layout')
  await expect(right.locator('.quiet-paper')).toHaveCount(15)
  await right.getByRole('navigation', { name: 'Main navigation', exact: true }).locator('[data-nav-destination="contact"]').click()
  await expect(right.getByRole('dialog')).toBeVisible()
  await expect(left.getByRole('dialog')).toHaveCount(0)
})

test('small screens keep the adjacent records and all four destinations reachable', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Small phone geometry only.')
  await page.setViewportSize({ width: 320, height: 700 })
  for (const study of studies) {
    await page.goto(`/typography/${study}?edition=paper&review=1`)
    await expect(page.locator('.quiet-home')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
    for (const control of await navigation(page).locator('[data-nav-destination]').all()) {
      const box = (await control.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(320)
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
    await navigation(page).locator('[data-nav-destination="about"]').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    expect(await page.getByRole('dialog').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  }
})

test('returning from typography studies restores the selected Book and Chapters homepage', async ({ page, isMobile }) => {
  await page.goto('/typography/poem?edition=paper&review=1')
  await expect(page.locator('.quiet-home')).toBeVisible()
  await page.getByRole('link', { name: '返回全部排版方案' }).click()
  await page.getByRole('link', { name: '当前主页' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('.quiet')).toHaveAttribute('data-study', 'lens')
  await expect(page.locator('.type-preview')).toHaveAttribute('data-typography', 'book')
  await expect(page.locator('.quiet')).toHaveAttribute('data-layout', isMobile ? 'chapters' : 'split')
  await expect(page.getByRole('complementary', { name: '排版预览控制' })).toHaveCount(0)
  expect(await page.locator('#quiet-name').evaluate((element) => getComputedStyle(element).fontFamily)).toContain('EB Garamond')
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'paper')
  await page.getByRole('button', { name: 'Switch to Black appearance' }).click()
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'black')
  await page.goto('/?review=1&study=frame')
  await expect(page.locator('.quiet')).toHaveAttribute('data-study', 'lens')
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'black')
  await expect(page.locator('.still-controls, .type-review, .mobile-review')).toHaveCount(0)
  await expect(page).toHaveTitle('Zekun Wang')
})
