import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const editions = ['black', 'paper'] as const
const studies = ['lens', 'drift', 'frame'] as const
const research = 'I study continual learning for deployment-time adaptation and generalization.'

function publicationsControl(page: Page) {
  return page.getByRole('navigation', { name: 'Main navigation', exact: true }).locator('.quiet-nav-publications')
}

async function changeStudy(page: Page, study: typeof studies[number]) {
  const select = page.getByRole('combobox', { name: '选择 Still 设计', exact: true })
  if (page.viewportSize()!.width <= 620) await select.selectOption(study)
  else await page.getByRole('group', { name: 'Still designs' }).getByRole('button', { name: new RegExp(study, 'i') }).click()
  await expect(page.locator('.quiet')).toHaveAttribute('data-study', study)
}

async function accessible(page: Page, selector = '.still-studio') {
  const result = await new AxeBuilder({ page }).include(selector).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(result.violations.map(({ id, nodes }) => ({
    id,
    nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
  }))).toEqual([])
}

async function fitsScreen(page: Page) {
  const widths = await page.locator('.quiet').evaluate((element) => ({
    surface: element.scrollWidth,
    page: document.documentElement.scrollWidth,
    available: document.documentElement.clientWidth,
  }))
  expect(widths.surface).toBeLessThanOrEqual(widths.available + 1)
  expect(widths.page).toBeLessThanOrEqual(widths.available + 1)
}

for (const study of studies) for (const edition of editions) {
  test(`Still ${study} / ${edition}: clear profile, accessible reading, and contact`, async ({ page }) => {
    const split = study === 'lens' && page.viewportSize()!.width >= 1024
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`/still?edition=${edition}&study=${study}`)
    await expect(page.locator('.quiet')).toHaveAttribute('data-edition', edition)
    await expect(page.locator('.quiet')).toHaveAttribute('data-study', study)
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('.quiet-education')).toContainText('PhD, Computer Science')
    await expect(page.locator('.quiet-education')).toContainText('Georgia Tech')
    await expect(page.locator('.quiet-education')).toContainText('2024–2029 (expected)')
    await expect(page.locator('.quiet-industry')).toContainText('Industry experience')
    await expect(page.locator('.quiet-industry')).toContainText('Research Intern')
    await expect(page.locator('.quiet-industry')).toContainText('Amazon')
    await expect(page.locator('.quiet-intro')).toHaveText(research)
    await expect(publicationsControl(page)).toHaveAccessibleName('Publications')
    if (study === 'lens') {
      await expect(page.locator('.quiet-paper')).toHaveCount(15)
      await expect(page.locator('.quiet-recent')).toHaveCount(0)
      await expect(publicationsControl(page)).toHaveAttribute('href', '#publications')
      const education = await page.locator('.quiet-education').boundingBox()
      const industry = await page.locator('.quiet-industry').boundingBox()
      expect(Math.abs(education!.y - industry!.y)).toBeLessThan(1)
      expect(industry!.x).toBeGreaterThan(education!.x)
    }
    if (split) await expect(page.getByRole('button', { name: 'CV (PDF)', exact: true })).toHaveAttribute('aria-controls', 'quiet-pane-cv')
    else await expect(page.getByRole('link', { name: 'CV (PDF)', exact: true })).toHaveAttribute('href', '/cv.pdf')
    await expect(page.locator('.quiet-footer a').first()).toHaveAttribute('href', 'mailto:zekun@gatech.edu')
    const home = await page.locator('.quiet-home').boundingBox()
    expect(Math.abs(home!.x + home!.width / 2 - page.viewportSize()!.width / 2)).toBeLessThan(2)
    await expect(page.locator('.quiet-intro')).toHaveCSS('text-align', 'left')
    await fitsScreen(page)
    await accessible(page)

    await publicationsControl(page).click()
    await expect(page.getByRole('heading', { name: 'Publications', exact: true })).toBeFocused()
    if (study === 'lens') await expect(page.locator('.quiet-home')).toBeVisible()
    await expect(page.locator('.quiet-paper')).toHaveCount(15)
    await page.getByRole('searchbox', { name: 'Search publications', exact: true }).fill('rank-1 fisher')
    await expect(page.locator('.quiet-paper')).toHaveCount(1)
    await page.locator('.quiet-paper-details summary').click()
    await expect(page.locator('.quiet-paper-details a[href="https://arxiv.org/abs/2509.23593"]')).toBeVisible()
    await fitsScreen(page)
    await accessible(page)

    if (edition === 'black') {
      for (const selector of ['html', 'body', '.quiet', '.quiet-main', '.quiet-reader', '.quiet-paper-content']) {
        await expect(page.locator(selector)).toHaveCSS('background-color', 'rgb(0, 0, 0)')
        await expect(page.locator(selector)).toHaveCSS('background-image', 'none')
      }
    }

    const about = page.getByRole('button', { name: 'About', exact: true })
    await about.click()
    const aboutContent = split ? page.locator('#quiet-pane-about') : page.getByRole('dialog')
    await expect(aboutContent.getByRole('heading', { name: 'A little about me.', exact: true })).toBeVisible()
    await accessible(page, split ? '#quiet-pane-about' : '.quiet-info-dialog')
    await page.keyboard.press('Escape')
    await expect(about).toBeFocused()

    const contact = page.getByRole('button', { name: 'Contact', exact: true })
    await contact.click()
    const contactContent = split ? page.locator('#quiet-pane-contact') : page.getByRole('dialog')
    await expect(contactContent.locator('.quiet-contact-email')).toHaveAttribute('href', 'mailto:zekun@gatech.edu')
    if (edition === 'black' && !split) await expect(contactContent).toHaveCSS('background-color', 'rgb(0, 0, 0)')
    await accessible(page, split ? '#quiet-pane-contact' : '.quiet-info-dialog')
    await page.keyboard.press('Escape')
    await expect(contact).toBeFocused()
    expect(errors).toEqual([])
  })
}

test('changing designs and appearances preserves reading, search, and expanded paper details', async ({ page }) => {
  await page.goto('/still?edition=black&review=1')
  await publicationsControl(page).click()
  await page.getByRole('searchbox', { name: 'Search publications', exact: true }).fill('rank-1 fisher')
  await expect(page.locator('.quiet-paper')).toHaveCount(1)
  await page.locator('.quiet-paper-details summary').click()
  for (const name of ['Paper', 'Black']) {
    await page.getByRole('button', { name, exact: true }).click()
    await expect(page.locator('.quiet')).toHaveAttribute('data-edition', name.toLowerCase())
    await expect(page.locator('.quiet')).toHaveAttribute('data-mode', 'work')
    await expect(page.getByRole('searchbox')).toHaveValue('rank-1 fisher')
    await expect(page.locator('.quiet-paper')).toHaveCount(1)
    await expect(page.locator('.quiet-paper-details')).toHaveAttribute('open', '')
    await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true')
  }
  for (const study of studies) {
    await changeStudy(page, study)
    await expect(page.getByRole('searchbox')).toHaveValue('rank-1 fisher')
    await expect(page.locator('.quiet-paper-details')).toHaveAttribute('open', '')
    await expect(page.locator('.quiet')).toHaveAttribute('data-mode', 'work')
  }
  await page.getByRole('button', { name: '收起 Still 风格切换栏' }).click()
  await expect(page.getByRole('group', { name: 'Still styles' })).toHaveCount(0)
  await page.getByRole('button', { name: '展开 Still 风格切换栏' }).click()
  await expect(page.getByRole('group', { name: 'Still styles' })).toBeVisible()
  await page.getByRole('button', { name: 'Back to introduction', exact: true }).first().click()
  await expect(publicationsControl(page)).toBeFocused()
})

test('Still remembers preferences, respects explicit links, and handles back navigation', async ({ page }) => {
  await page.goto('/still?review=1')
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'black')
  await changeStudy(page, 'drift')
  await page.getByRole('button', { name: 'Paper', exact: true }).click()
  await page.reload()
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'paper')
  await page.goto('/still')
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'paper')
  await expect(page.locator('.quiet')).toHaveAttribute('data-study', 'drift')
  await page.goto('/still?edition=black&study=frame')
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'black')
  await expect(page.locator('.quiet')).toHaveAttribute('data-study', 'frame')
  await page.goto('/still?edition=stone&study=lens&review=1')
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'paper')
  await page.getByRole('button', { name: 'Black', exact: true }).click()
  await page.goBack()
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'paper')
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(245, 241, 232)')
  await page.getByRole('link', { name: '并排比较 Still 风格' }).click()
  await expect(page.locator('.studio-comparison-panel')).toHaveCount(2)
  await expect(page.locator('html')).not.toHaveAttribute('style', /--still-screen/)
  await page.getByRole('link', { name: /Still 系列/ }).click()
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'paper')
  await expect(page.locator('.quiet')).toHaveAttribute('data-study', 'lens')
  await expect(page.locator('.quiet-background')).toBeVisible()
})

test('Still designs and appearances can be compared as independent working pages', async ({ page }) => {
  await page.goto('/still?edition=black&review=1')
  await page.getByRole('link', { name: '并排比较 Still 风格' }).click()
  const black = page.frameLocator('iframe[title="Still / Lens / Black 桌面预览"]')
  const drift = page.frameLocator('iframe[title="Still / Drift / Black 桌面预览"]')
  await expect(black.locator('.quiet')).toHaveAttribute('data-edition', 'black')
  await expect(drift.locator('.quiet')).toHaveAttribute('data-study', 'drift')
  await expect(black.locator('.still-controls')).toHaveCount(0)
  await black.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Publications', exact: true }).click()
  await expect(black.locator('.quiet-reader')).toBeVisible()
  await expect(drift.locator('.quiet-home')).toBeVisible()
  await page.getByRole('button', { name: '手机', exact: true }).click()
  await page.getByLabel('右侧 Still 风格', { exact: true }).selectOption('paper')
  await page.getByLabel('右侧 Still 设计', { exact: true }).selectOption('frame')
  const paper = page.frameLocator('iframe[title="Still / Frame / Paper 手机预览"]')
  await expect(paper.locator('.quiet')).toHaveAttribute('data-edition', 'paper')
  expect(await paper.locator('html').evaluate((element) => element.clientWidth)).toBe(390)
  await expect(paper.locator('.still-controls')).toHaveCount(0)
})

test('all Still editions fit a narrow phone, including the review controls', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/still?edition=black&review=1')
  for (const study of studies) for (const name of ['Black', 'Paper']) {
    await changeStudy(page, study)
    await page.getByRole('button', { name, exact: true }).click()
    await expect(page.locator('.quiet')).toHaveAttribute('data-edition', name.toLowerCase())
    await fitsScreen(page)
    const bounds = await page.locator('.still-controls').boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320)
    await expect(page.locator('.quiet-background')).toBeVisible()
    for (const control of await page.locator('.quiet-home .quiet-navigation :is(button, a)').all()) {
      const rect = await control.boundingBox()
      expect(rect!.x).toBeGreaterThanOrEqual(0)
      expect(rect!.x + rect!.width).toBeLessThanOrEqual(320)
      expect(rect!.height).toBeGreaterThanOrEqual(44)
    }
  }
})

test('Lens publication links open the existing list directly, including on a fresh visit', async ({ page }) => {
  const split = page.viewportSize()!.width >= 1024
  await page.goto('/still?study=lens&edition=paper#publications')
  const heading = page.getByRole('heading', { name: 'Publications', exact: true })
  await expect(heading).toBeFocused()
  if (split) {
    expect((await heading.boundingBox())!.x).toBeGreaterThan(page.viewportSize()!.width / 2 - 40)
    expect(await page.evaluate(() => scrollY)).toBe(0)
  } else await expect.poll(() => heading.evaluate((element) => element.getBoundingClientRect().top)).toBeLessThan(40)
  await expect(page.locator('.quiet-paper')).toHaveCount(15)
  await expect(page.locator('.quiet-paper-title-link').first()).toHaveAttribute('target', '_blank')
  await expect(page.locator('.quiet-paper-title-link').first()).toHaveAttribute('href', /^https:\/\//)
  await page.getByRole('link', { name: 'Back to introduction', exact: true }).click()
  await expect(split ? publicationsControl(page) : page.locator('.quiet-home')).toBeFocused()
  await expect(page.locator('.quiet-paper')).toHaveCount(15)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5)
})

test('the appearance control works in a clean preview and increased contrast stays readable', async ({ page }) => {
  await page.goto('/still?study=frame&edition=black&embed=1')
  await expect(page.locator('.still-controls')).toHaveCount(0)
  await page.getByRole('button', { name: 'Switch to Paper appearance' }).click()
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'paper')
  await expect(page.getByRole('button', { name: 'Switch to Black appearance' })).toBeFocused()
  await page.emulateMedia({ contrast: 'more', reducedMotion: 'reduce' })
  await accessible(page)
  await publicationsControl(page).click()
  await expect(page.locator('.quiet-reader')).toBeVisible()
  await page.getByRole('button', { name: 'Switch to Black appearance' }).click()
  await expect(page.locator('.quiet')).toHaveAttribute('data-mode', 'work')
  await expect(page.locator('.quiet')).toHaveAttribute('data-edition', 'black')
})
