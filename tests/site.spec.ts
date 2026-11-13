import { expect, test, type Page } from '@playwright/test'

const navigation = (page: Page) => page.getByRole('navigation', { name: 'Main navigation', exact: true })
const fits = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width)

test('the overview leads with the name over the landscape, then news, papers, and essays', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/?edition=paper')
  // The first thing on the page is whose page it is.
  const name = page.getByRole('heading', { level: 1, name: 'Zekun Wang', exact: true })
  await expect(name).toBeVisible()
  expect(parseFloat(await name.evaluate(node => getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(56)
  await expect(page.locator('#home-question')).toHaveText('How can models keep learning after deployment?')
  // Beside the name: who this is, what the research is about, and the research interests.
  // Nothing else is written in the opening, and no caption, hint, or disclaimer sits with the drawing.
  await expect(page.locator('.home-hero p')).toHaveCount(4)
  // It is written once for the eye: beside the name on a wide screen, under the drawing on a narrow one.
  const bio = page.locator('.home-bio:visible')
  await expect(bio).toHaveCount(1)
  await expect(bio).toContainText('I’m a third-year PhD student in Computer Science at Georgia Tech')
  await expect(bio).toContainText('Prior to that, I received my M.S.')
  await expect(bio.locator('.home-interests')).toContainText('Research interests: continual learning, compositionality')
  // It begins on the first screen.
  expect((await bio.boundingBox())!.y).toBeLessThan(page.viewportSize()!.height)
  // The name stays on one line, and the drawing keeps the room under the name and the question: the introduction takes none of it.
  const nameBox = (await name.boundingBox())!
  expect(nameBox.height).toBeLessThan(parseFloat(await name.evaluate(node => getComputedStyle(node).fontSize)) * 1.2)
  const leadBottom = await page.locator('.home-lead').evaluate(node => node.getBoundingClientRect().bottom)
  const heroBottom = await page.locator('.home-hero').evaluate(node => node.getBoundingClientRect().bottom)
  expect(heroBottom - leadBottom).toBeGreaterThan(page.viewportSize()!.height * .42)
  // The header repeats the name only after the large one has scrolled away.
  const headerName = page.getByRole('banner').locator('.site-name')
  await expect(headerName).toBeHidden()

  // The drawing is there and carries the blue region, path, and point.
  const field = page.locator('canvas.site-landscape')
  await expect(field).toBeVisible()
  await expect.poll(() => field.evaluate((canvas: HTMLCanvasElement) => {
    const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data
    let blue = 0
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] > 200 && pixels[index + 2] > 180 && pixels[index] < 70) blue += 1
    }
    return blue
  })).toBeGreaterThan(60)

  const news = page.getByRole('region', { name: 'News', exact: true })
  await expect(news.getByRole('listitem')).toHaveCount(7)
  await expect(news).toContainText('was accepted to NeurIPS 2026')
  await expect(news.getByRole('link', { name: 'TTCL', exact: true })).toHaveAttribute('href', 'https://ttcl-agents.github.io/')
  await expect(page.locator('#selected-publications li')).toHaveCount(6)
  await expect(page.locator('#writing li')).toHaveCount(3)
  await expect(page.locator('#selected-publications li').first().getByRole('link')).toHaveAttribute('href', /trust-region-continual-learning\.pdf|arxiv\.org/)
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'zekun@gatech.edu', exact: true })).toHaveAttribute('href', 'mailto:zekun@gatech.edu')
  await fits(page)
  await news.scrollIntoViewIfNeeded()
  await expect(headerName).toBeVisible()
  expect(errors).toEqual([])
})

test('the blue point marks the current page', async ({ page }) => {
  await page.goto('/?edition=paper')
  await expect(navigation(page).getByRole('link')).toHaveText(['Papers', 'Writing', 'About', 'CV'])
  await expect(navigation(page).locator('[aria-current="page"]')).toHaveCount(0)
  for (const [label, heading, path] of [
    ['Papers', 'Papers', '/publications'], ['Writing', 'Writing', '/blog'], ['CV', 'Curriculum vitae', '/cv'],
  ] as const) {
    await navigation(page).getByRole('link', { name: label, exact: true }).click()
    await expect(page.getByRole('heading', { level: 1, name: heading, exact: true })).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`${path}/?\\?edition=paper`))
    const current = navigation(page).locator('[aria-current="page"]')
    await expect(current).toHaveText(label)
    await expect(current.locator('.site-nav-point')).toBeVisible()
    await fits(page)
  }
  await page.getByRole('banner').getByRole('link', { name: 'Zekun Wang', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Zekun Wang', exact: true })).toBeVisible()
})

test('a paper opens its summary, links, and citation in place', async ({ page }) => {
  await page.goto('/publications?edition=paper')
  await expect(page.locator('.paper')).toHaveCount(20)
  const paper = page.locator('.paper').first()
  await expect(paper.getByRole('heading', { level: 3 })).toHaveText('Trust Region Continual Learning as an Implicit Meta-Learner')
  await expect(paper.locator('.paper-detail')).toHaveCount(0)
  await paper.getByRole('button', { name: /^Show summary and links/ }).click()
  const links = paper.getByRole('group', { name: /^Links for/ })
  await expect(links.getByRole('link', { name: 'PDF', exact: true })).toHaveAttribute('href', /trust-region-continual-learning\.pdf/)
  await expect(links.getByRole('link', { name: 'Essay', exact: true })).toHaveAttribute('href', /\/blog\/continual-learning-diffusion-models\//)
  await links.getByRole('button', { name: 'BibTeX', exact: true }).click()
  await expect(paper.getByRole('textbox', { name: /^BibTeX for/ })).toHaveValue(/@inproceedings\{/)
  await paper.getByRole('button', { name: /^Hide summary and links/ }).click()
  await expect(paper.locator('.paper-detail')).toHaveCount(0)

  // Topics and search narrow the same list. The address keeps both.
  const topics = page.getByRole('group', { name: 'Research topics', exact: true })
  await expect(topics.getByRole('button')).toHaveCount(7)
  await topics.getByRole('button', { name: 'diffusion models', exact: true }).click()
  await expect(topics.getByRole('button', { name: 'diffusion models', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveURL(/tag=diffusion\+models/)
  await expect(page.getByRole('status')).toContainText('4 of 20 papers in diffusion models')
  await page.getByRole('searchbox', { name: 'Search papers' }).fill('rank-1 fisher')
  await expect(page.locator('.paper')).toHaveCount(1)
  await page.getByRole('searchbox', { name: 'Search papers' }).fill('no such paper')
  await expect(page.getByRole('heading', { name: 'No papers match.', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Show all papers', exact: true }).click()
  await expect(page.locator('.paper')).toHaveCount(20)
  await expect(topics.getByRole('button', { name: 'All', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await fits(page)
})

test('writing lists every essay and each row opens its essay', async ({ page }) => {
  await page.goto('/blog/?edition=paper')
  await expect(page.locator('.essay-row')).toHaveCount(3)
  // Each row carries the essay's own drawing.
  await expect(page.locator('.essay-row canvas.terrain')).toHaveCount(1)
  await expect(page.locator('.essay-row .essay-figure-layers')).toHaveCount(1)
  await expect(page.locator('.essay-row .essay-figure-pairs span')).toHaveCount(16)
  await page.getByRole('link', { name: /Self-Consolidating Language Models/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Self-Consolidating Language Models: Writing context into model weights at test time')

  // Share is one word until it is asked for.
  const share = page.locator('.essay-header').getByRole('group', { name: 'Share this article', exact: true })
  await expect(share.getByRole('link')).toHaveCount(0)
  await share.getByRole('button', { name: 'Share', exact: true }).click()
  await expect(share.getByRole('link')).toHaveText(['X', 'LinkedIn', 'Bluesky'])
  await expect(share.getByRole('button', { name: 'Copy link', exact: true })).toBeVisible()
  await fits(page)
})

test('the paper keeps its color and the header stays while a page loads', async ({ page }) => {
  // Hold back one page's code so the loading frame is on screen long enough to inspect.
  await page.route(/\/src\/site\/PublicationsPage\.tsx|\/assets\/PublicationsPage-/, async route => {
    await new Promise(resolve => setTimeout(resolve, 1200))
    await route.continue()
  })
  await page.goto('/?edition=paper')
  await page.evaluate(() => {
    const seen: string[] = []
    const watch = () => {
      seen.push(getComputedStyle(document.documentElement).backgroundColor)
      ;(window as unknown as { __seen: string[] }).__seen = seen
      requestAnimationFrame(watch)
    }
    watch()
  })
  await navigation(page).getByRole('link', { name: 'Papers', exact: true }).click()
  await expect(page.locator('main.site-loading')).toBeVisible()
  await expect(navigation(page).locator('[aria-current="page"]')).toHaveText('Papers')
  await expect(page.getByRole('heading', { level: 1, name: 'Papers', exact: true })).toBeVisible()
  const seen = await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen)
  expect(new Set(seen)).toEqual(new Set(['rgb(255, 255, 255)']))
})

test('the appearance switch is always in reach and keeps the place', async ({ page }) => {
  await page.goto('/about?edition=paper#education')
  await expect(page.locator('#education')).toBeInViewport()
  await page.evaluate(() => document.fonts.ready)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  const before = await page.evaluate(() => window.scrollY)
  await page.getByRole('banner').getByRole('button', { name: 'Switch to Black appearance', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-site-edition', 'black')
  await expect(page.locator('.site-shell')).toHaveCSS('background-color', 'rgb(0, 0, 0)')
  await expect(page).toHaveURL(/edition=black#education$/)
  expect(Math.abs(await page.evaluate(() => window.scrollY) - before)).toBeLessThan(3)
  await page.getByRole('banner').getByRole('button', { name: 'Switch to White appearance', exact: true }).click()
  await expect(page.locator('.site-shell')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
})

test('earlier addresses still lead somewhere useful', async ({ page }) => {
  await page.goto('/?edition=paper#cv')
  await expect(page).toHaveURL(/\/cv\?edition=paper$/)
  await page.goto('/?edition=paper#about')
  await expect(page).toHaveURL(/\/about\?edition=paper$/)
  await page.goto('/photography?edition=paper')
  await expect(page).toHaveURL(/\/about\?edition=paper#photography$/)
  await expect(page.locator('#photography')).toBeInViewport()
  await page.goto('/this-page-does-not-exist?edition=paper')
  await expect(page.getByRole('heading', { level: 1, name: 'This page is not here.', exact: true })).toBeVisible()
})
