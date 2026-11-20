import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

const navigation = (page: Page) => page.getByRole('navigation', { name: 'Main navigation', exact: true })
const directionNames = ['Continual learning', 'Test-time adaptation', 'Compositional generalization']
const fits = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width)

test('the overview leads with the name over the landscape, then news, papers, and essays', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/?edition=paper')
  // The first thing on the page is whose page it is.
  const name = page.getByRole('heading', { level: 1, name: 'Zekun Wang', exact: true })
  await expect(name).toBeVisible()
  await expect(page).toHaveTitle('Zekun Wang')
  // The name is a heading and not a banner: larger than the question under it, and no more than 72px.
  const nameSize = parseFloat(await name.evaluate(node => getComputedStyle(node).fontSize))
  expect(nameSize).toBeGreaterThanOrEqual(40)
  expect(nameSize).toBeLessThanOrEqual(72)
  expect(nameSize).toBeGreaterThan(parseFloat(await page.locator('#home-question').evaluate(node => getComputedStyle(node).fontSize)) * 1.4)
  await expect(page.locator('#home-question')).toHaveText('How can foundation models keep learning from a few samples and a few interactions?')
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
  // The header repeats the name only after the page's own has scrolled away. A phone's header has no room for it.
  const headerName = page.getByRole('banner').locator('.site-name')
  const roomForName = page.viewportSize()!.width > 480
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
  await expect(page.locator('#blogs li')).toHaveCount(4)
  await expect(page.locator('#blogs h2')).toHaveText('Blogs')
  await expect(page.locator('#selected-publications li').first().getByRole('link')).toHaveAttribute('href', /trust-region-continual-learning\.pdf|arxiv\.org/)
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'zekun@gatech.edu', exact: true })).toHaveAttribute('href', 'mailto:zekun@gatech.edu')
  await fits(page)
  await news.scrollIntoViewIfNeeded()
  if (roomForName) await expect(headerName).toBeVisible()
  else await expect(headerName).toBeHidden()
  expect(errors).toEqual([])
})

test('the drawing shows the three research directions, and the point marks the one on it', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/?edition=paper')
  const directions = page.getByRole('group', { name: 'Research directions', exact: true }).getByRole('button')
  await expect(directions).toHaveText(['Continual learning', 'Test-time adaptation', 'Compositional generalization'])
  const field = page.locator('canvas.site-landscape')
  const picture = () => field.evaluate((canvas: HTMLCanvasElement) => {
    const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data
    let blue = 0
    let sum = 0
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] > 200 && pixels[index + 2] > 180 && pixels[index] < 70) { blue += 1; sum += index }
    }
    return { blue, sum }
  })
  // They lie over the far edge of the drawing and take no room from it.
  const questionBottom = await page.locator('#home-question').evaluate(node => node.getBoundingClientRect().bottom)
  const leadBottom = await page.locator('.home-lead').evaluate(node => node.getBoundingClientRect().bottom)
  expect(leadBottom - questionBottom).toBeLessThan(2)
  expect((await directions.first().boundingBox())!.y).toBeGreaterThanOrEqual(questionBottom)

  let before = { blue: 0, sum: 0 }
  for (const [index, words] of [[0, /trust region/], [1, /three samples or from three interactions/], [2, /held-out combination/]] as const) {
    await directions.nth(index).click()
    await expect(page.locator('.home-directions button[aria-pressed="true"]')).toHaveText(directionNames[index])
    await expect(field).toHaveAttribute('aria-label', words)
    // Each direction is its own scene: the model, in blue, is drawn somewhere else.
    await expect.poll(async () => (await picture()).blue).toBeGreaterThan(60)
    await expect.poll(async () => (await picture()).sum).not.toBe(before.sum)
    before = await picture()
  }
  await fits(page)
  expect(errors).toEqual([])
})

test('Google Analytics is told each page under its own title, and nothing without an account', async ({ page }) => {
  const id: string = JSON.parse(readFileSync('src/data/config.json', 'utf8')).analytics?.google ?? ''
  // The tests run on a developer's machine, which is otherwise left out.
  await page.addInitScript(() => { (window as unknown as { countHere: boolean }).countHere = true })
  // Google's tag is replaced by an empty script, so nothing leaves the test. The commands it would read stay in `dataLayer`.
  const asked: string[] = []
  await page.route(/googletagmanager\.com|google-analytics\.com/, async route => {
    asked.push(route.request().url())
    await route.fulfill({ contentType: 'text/javascript', body: '' })
  })
  const commands = () => page.evaluate(() => ((window as unknown as { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? []).map(command => Array.from(command).map(part => part instanceof Date ? 'a date' : part)))
  await page.goto('/?edition=paper')
  await expect(page.getByRole('heading', { level: 1, name: 'Zekun Wang', exact: true })).toBeVisible()
  if (!id) {
    await navigation(page).getByRole('link', { name: 'About', exact: true }).click()
    await expect(page.locator('.about-bio')).toBeVisible()
    expect(asked).toEqual([])
    expect(await commands()).toEqual([])
    return
  }
  // The tag is loaded once and counts the page that is open.
  // Google gave this site a tag that knows its own property, so it is loaded as it is and not named in a command.
  const container = id.startsWith('GTM-')
  await expect.poll(commands).toEqual(container ? [['js', 'a date']] : [['js', 'a date'], ['config', id]])
  expect(asked).toEqual([`https://www.googletagmanager.com/${container ? 'gtm.js' : 'gtag/js'}?id=${id}`])
  // A research direction the visitor chooses.
  await page.locator('.home-directions button').nth(1).click()
  await expect.poll(commands).toContainEqual(['event', 'select_content', { content_type: 'direction', content_id: 'Test-time adaptation' }])
  // The tag counts a page when the address changes, before the page is drawn. Each page's title is given ahead,
  // and it is the title the page then gives itself.
  for (const [link, title] of [
    ['Papers', 'Publications · Zekun Wang'], ['Blogs', 'Blogs · Zekun Wang'], ['About', 'About · Zekun Wang'], ['CV', 'Curriculum vitae · Zekun Wang'],
  ] as const) {
    await navigation(page).getByRole('link', { name: link, exact: true }).click()
    await expect(page).toHaveTitle(title)
    const titles = (await commands()).filter(command => command[0] === 'set').map(command => (command[1] as { page_title: string }).page_title)
    expect(titles[titles.length - 1]).toBe(title)
  }
  await navigation(page).getByRole('link', { name: 'Blogs', exact: true }).click()
  await page.locator('.essay-row').first().click()
  await expect(page).toHaveTitle('TEASE · Zekun Wang')
  const told = (await commands()).filter(command => command[0] === 'set').map(command => (command[1] as { page_title: string }).page_title)
  expect(told).toContain('TEASE · Zekun Wang')
  // No title was given that a page did not then take.
  expect(new Set(told)).toEqual(new Set(['Publications · Zekun Wang', 'Blogs · Zekun Wang', 'About · Zekun Wang', 'Curriculum vitae · Zekun Wang', 'TEASE · Zekun Wang']))
  // A developer's machine that does not ask to be counted is left out: the tag is not loaded there.
  const own = await page.context().newPage()
  const ownAsked: string[] = []
  await own.route(/googletagmanager\.com|google-analytics\.com/, async route => {
    ownAsked.push(route.request().url())
    await route.fulfill({ contentType: 'text/javascript', body: '' })
  })
  await own.goto('/?edition=paper')
  await expect(own.getByRole('heading', { level: 1, name: 'Zekun Wang', exact: true })).toBeVisible()
  await navigation(own).getByRole('link', { name: 'About', exact: true }).click()
  await expect(own.locator('.about-bio')).toBeVisible()
  expect(ownAsked).toEqual([])
  await own.close()
})

test('the blue point marks the current page', async ({ page }) => {
  await page.goto('/?edition=paper')
  // Home is one of the destinations, so that no one has to know that the name leads there.
  await expect(navigation(page).getByRole('link')).toHaveText(['Home', 'Papers', 'Blogs', 'About', 'CV'])
  await expect(navigation(page).locator('[aria-current="page"]')).toHaveText('Home')
  await fits(page)
  for (const [label, heading, path] of [
    ['Papers', 'Papers', '/publications'], ['Blogs', 'Blogs', '/blog'], ['CV', 'Curriculum vitae', '/cv'],
  ] as const) {
    await navigation(page).getByRole('link', { name: label, exact: true }).click()
    await expect(page.getByRole('heading', { level: 1, name: heading, exact: true })).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`${path}/?\\?edition=paper`))
    const current = navigation(page).locator('[aria-current="page"]')
    await expect(current).toHaveText(label)
    await expect(current.locator('.site-nav-point')).toBeVisible()
    await fits(page)
  }
  await navigation(page).getByRole('link', { name: 'Home', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Zekun Wang', exact: true })).toBeVisible()
  await expect(page).toHaveURL(/\/\?edition=paper$/)
  await expect(navigation(page).locator('[aria-current="page"]')).toHaveText('Home')
  // Where the header has room for the name, the name leads home too.
  if (page.viewportSize()!.width > 480) {
    await navigation(page).getByRole('link', { name: 'About', exact: true }).click()
    await expect(page.locator('.about-bio')).toBeVisible()
    await page.getByRole('banner').getByRole('link', { name: 'Zekun Wang', exact: true }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Zekun Wang', exact: true })).toBeVisible()
  }
  // The page that is not found is no one's current page.
  await page.goto('/nowhere?edition=paper')
  await expect(page.getByRole('heading', { level: 1, name: 'This page is not here.', exact: true })).toBeVisible()
  await expect(navigation(page).locator('[aria-current="page"]')).toHaveCount(0)
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

test('Blogs lists every essay and each row opens its essay', async ({ page }) => {
  await page.goto('/blog/?edition=paper')
  await expect(page.getByRole('heading', { level: 1, name: 'Blogs', exact: true })).toBeVisible()
  await expect(page).toHaveTitle('Blogs · Zekun Wang')
  await expect(page.locator('.essay-row')).toHaveCount(4)
  await expect(page.locator('.essay-row .essay-figure-moves span')).toHaveCount(10)
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
  // The essays on the overview were once under Writing. Both of its earlier anchors lead to them.
  for (const anchor of ['writing', 'blog', 'blogs']) {
    await page.goto(`/?edition=paper&from=${anchor}#${anchor}`)
    await expect(page.locator('#blogs')).toBeInViewport()
  }
  await page.goto('/this-page-does-not-exist?edition=paper')
  await expect(page.getByRole('heading', { level: 1, name: 'This page is not here.', exact: true })).toBeVisible()
})
