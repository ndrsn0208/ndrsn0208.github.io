import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/* Both essays are laid out by one component and every figure sits in one frame.
   These tests hold that system to its rules, then check what each figure shows. */

const essays = [
  {
    path: '/blog/continual-learning-diffusion-models/',
    name: 'Continual Learning Diffusion Models',
    headline: 'Generative replay with a rank-1 Fisher trust region',
    figures: ['return', 'forgetting', 'region', 'methods', 'recovery', 'results'],
    papers: 2,
  },
  {
    path: '/blog/self-consolidating-language-models/',
    name: 'Self-Consolidating Language Models',
    headline: 'Writing context into model weights at test time',
    figures: ['writing', 'interference', 'loop', 'results', 'additional', 'fisher'],
    papers: 1,
  },
] as const

const fits = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width)
const figure = (page: Page, id: string) => page.locator(`#figure-${id}`)
const station = (page: Page, id: string, name: string) => figure(page, id).locator('.exhibit-path').getByRole('button', { name, exact: true })

for (const essay of essays) {
  test(`${essay.name}: a headline, a figure, a summary, then sections that state their point`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${essay.path}?edition=paper`)

    // On the page a term such as rank-1 is set with a hyphen that does not break.
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${essay.name}: ${essay.headline}`.replace(/([A-Za-z0-9])-(\d)/g, '$1\u2011$2'))
    await expect(page.locator('.essay-summary p')).toHaveCount(3)
    // The opening figure comes first, and the summary follows it directly.
    await expect(page.locator('.essay-flow > :first-child')).toHaveAttribute('id', `figure-${essay.figures[0]}`)
    await expect(page.locator(`#figure-${essay.figures[0]} + .essay-summary`)).toHaveCount(1)

    // A heading states what its section shows. None is a question.
    const headings = await page.locator('.essay-section:not(.essay-papers):not(.essay-references) > h2').allTextContents()
    expect(headings.length).toBeGreaterThanOrEqual(6)
    for (const heading of headings) expect(heading).not.toMatch(/\?/)

    // The essay ends with its papers, listed the way the Papers page lists them, and its references.
    await expect(page.locator('#papers .paper')).toHaveCount(essay.papers)
    await expect(page.locator('#papers .paper').first().getByRole('button', { name: /^Show summary and links/ })).toBeVisible()
    expect(await page.locator('#references li').count()).toBeGreaterThanOrEqual(12)
    const cited = await page.locator('.essay-cite a').evaluateAll(links => links.map(link => link.getAttribute('href')!))
    for (const href of new Set(cited)) await expect(page.locator(href)).toHaveCount(1)

    // The outline marks the section being read.
    if (page.viewportSize()!.width >= 1240) {
      await expect(page.getByRole('navigation', { name: 'On this page', exact: true }).locator('[aria-current="location"]')).toHaveCount(1)
    } else {
      await expect(page.getByRole('combobox', { name: 'On this page' })).toBeVisible()
    }
    await fits(page)
    expect(errors).toEqual([])
  })

  test(`${essay.name}: every figure sits in the same frame`, async ({ page }) => {
    await page.goto(`${essay.path}?edition=paper`)
    await expect(page.locator('figure.exhibit')).toHaveCount(essay.figures.length)
    for (const id of essay.figures) {
      const frame = figure(page, id)
      await frame.scrollIntoViewIfNeeded()
      await expect(frame.locator('.exhibit-stage')).toBeVisible()
      // The plus opens what lies behind the figure, in place, and closes it again.
      const more = frame.getByRole('button', { name: /^Show notes and links for/ })
      await expect(more).toHaveAttribute('aria-expanded', 'false')
      await more.click()
      await expect(frame.getByRole('button', { name: 'Copy link', exact: true })).toBeVisible()
      await expect(frame.getByRole('link', { name: 'Image', exact: true })).toHaveAttribute('href', new RegExp(`/share/${id}\\.png$`))
      await frame.getByRole('button', { name: /^Hide notes and links for/ }).click()
      await expect(frame.getByRole('button', { name: 'Copy link', exact: true })).toHaveCount(0)
      // A figure with an argument has stations. Exactly one is current, and its sentence is shown.
      if (await frame.locator('.exhibit-path').count()) {
        await expect(frame.locator('.exhibit-path [aria-current="step"]')).toHaveCount(1)
        await expect(frame.locator('.exhibit-say')).not.toBeEmpty()
        await expect(frame.getByRole('button', { name: /^Play / })).toBeVisible()
      }
    }

    // Nothing in an essay is set smaller than the site's smallest size. Mathematics and superscript marks keep their own.
    const small = await page.evaluate(() => {
      const found: string[] = []
      const walker = document.createTreeWalker(document.querySelector('.essay')!, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const node = walker.currentNode
        const parent = node.parentElement!
        if (!node.textContent!.trim() || parent.closest('.katex, .site-hidden, sup')) continue
        const style = getComputedStyle(parent)
        const box = parent.getBoundingClientRect()
        if (style.visibility === 'hidden' || !box.width || !box.height) continue
        if (parseFloat(style.fontSize) < 15) found.push(`${node.textContent!.trim().slice(0, 30)} (${style.fontSize})`)
      }
      return found
    })
    expect(small).toEqual([])
    await fits(page)
  })

  test(`${essay.name}: has no accessibility violations`, async ({ page }) => {
    await page.goto(`${essay.path}?edition=paper`)
    await expect(page.locator('figure.exhibit')).toHaveCount(essay.figures.length)
    const paper = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    expect(paper.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(' | ')}`)).toEqual([])
    await page.getByRole('banner').getByRole('button', { name: 'Switch to Black appearance', exact: true }).click()
    await expect(page.locator('.site-shell')).toHaveCSS('background-color', 'rgb(0, 0, 0)')
    const black = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    expect(black.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(' | ')}`)).toEqual([])
  })
}

test('the path moves a landscape figure through its argument', async ({ page }) => {
  await page.goto(`${essays[0].path}?edition=paper`)
  const frame = figure(page, 'methods')
  await frame.scrollIntoViewIfNeeded()
  // It rests on the last station, where the whole argument is drawn.
  await expect(station(page, 'methods', 'Trust Region')).toHaveAttribute('aria-current', 'step')
  await expect(frame.locator('.exhibit-say')).toContainText('in the shared basin inside the trust region')

  await station(page, 'methods', 'EWC').click()
  await expect(station(page, 'methods', 'EWC')).toHaveAttribute('aria-current', 'step')
  await expect(frame.locator('.exhibit-say')).toContainText('stops at its boundary')
  await expect(frame.getByRole('img')).toHaveAttribute('aria-label', /stops at its boundary/)

  // Arrow keys walk the path, and focus follows the point.
  await page.keyboard.press('ArrowRight')
  await expect(station(page, 'methods', 'Replay')).toHaveAttribute('aria-current', 'step')
  await expect(station(page, 'methods', 'Replay')).toBeFocused()
  await expect(frame.locator('.exhibit-say')).toContainText('drift to a different shared basin far from the old-task optimum')

  // The drawing carries the parameters, their path, and the trust region in blue.
  await expect.poll(() => frame.locator('canvas.terrain').evaluate((canvas: HTMLCanvasElement) => {
    const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data
    let blue = 0
    for (let index = 0; index < pixels.length; index += 4) if (pixels[index + 3] > 200 && pixels[index + 2] > 180 && pixels[index] < 70) blue += 1
    return blue
  })).toBeGreaterThan(80)

  // Play starts from where the path stands and can be paused.
  await frame.getByRole('button', { name: /^Play / }).click()
  await expect(frame.getByRole('button', { name: /^Pause / })).toBeVisible()
  await frame.getByRole('button', { name: /^Pause / }).click()
  await expect(frame.getByRole('button', { name: /^Play / })).toBeVisible()
})

test('the recording shows four policies after Task 1 and after Task 10', async ({ page }) => {
  await page.goto(`${essays[0].path}?edition=paper`)
  const frame = figure(page, 'return')
  await expect(frame.locator('canvas')).toHaveCount(8)
  await expect(frame.getByRole('img', { name: 'Trust Region, after Task 10: succeeds' })).toBeVisible()
  await expect(frame.getByRole('img', { name: 'Replay, after Task 10: fails' })).toBeVisible()
  const drawn = () => frame.locator('canvas').last().evaluate((canvas: HTMLCanvasElement) => {
    const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data
    const seen = new Set<number>()
    for (let index = 0; index < pixels.length; index += 4 * 97) seen.add(pixels[index] >> 4)
    return seen.size
  })
  // Before it plays, each view shows the last frame of the recording.
  await expect.poll(drawn).toBeGreaterThan(3)
  await frame.getByRole('button', { name: /^Play / }).click()
  await expect(frame.getByRole('button', { name: /^Pause / })).toBeVisible()
  await expect.poll(() => frame.getByRole('slider').evaluate((input: HTMLInputElement) => Number(input.value))).toBeLessThan(1000)
  await frame.getByRole('button', { name: /^Pause / }).click()
  await expect(frame.getByRole('button', { name: /^Play / })).toBeVisible()
})

test('measured figures carry the numbers from the papers', async ({ page }) => {
  await page.goto(`${essays[0].path}?edition=paper`)
  const results = figure(page, 'results')
  await results.scrollIntoViewIfNeeded()
  await expect(results.getByRole('row', { name: /^Trust Region/ }).first()).toContainText('48.5')
  await results.getByRole('button', { name: 'CW10', exact: true }).click()
  await expect(results.getByRole('button', { name: 'CW10', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(results.getByRole('row', { name: /^Trust Region/ }).first()).toContainText('88.3%')
  await expect(results.getByRole('row', { name: /^Trust Region/ }).last()).toContainText('4.4')
  await expect(results.getByRole('row', { name: /^Replay/ }).first()).toContainText('85.3%')
  await results.getByRole('button', { name: 'ImageNet-1k', exact: true }).click()
  // A value the source does not report is never drawn as zero.
  await expect(results.getByRole('row', { name: /^Non-continual/ }).last()).toContainText('not reported')

  const recovery = figure(page, 'recovery')
  await recovery.scrollIntoViewIfNeeded()
  await expect(recovery.getByRole('img', { name: /^90% of initial success rate/ })).toHaveAttribute('aria-label', /Task 10: Trust Region 2 gradient updates, Replay 8,000 gradient updates\./)
  await recovery.getByRole('button', { name: 'ImageNet-500', exact: true }).click()
  await expect(recovery.getByRole('img', { name: /^FID within \+10% of initial/ })).toHaveAttribute('aria-label', /Task 4: Trust Region not re-converged, Replay not re-converged\./)

  await page.goto(`${essays[1].path}?edition=paper`)
  const scol = figure(page, 'results')
  await scol.scrollIntoViewIfNeeded()
  await expect(scol.getByRole('row', { name: /^SCoL Immediate accuracy/ })).toContainText('40.7%')
  await expect(scol.getByRole('row', { name: /^SCoL Immediate accuracy/ })).toContainText('31.0%')
  await expect(scol.getByRole('row', { name: /^SEAL \(continual\)/ })).toContainText('21.4%')
  await expect(scol.getByRole('row', { name: /^Random-10/ })).toContainText('23.8%')
  await scol.getByRole('button', { name: 'LongBench v2', exact: true }).click()
  await expect(scol.getByRole('row', { name: /^Batch TTT/ })).toContainText('39.5%')
  await expect(scol.getByRole('row', { name: /^SCoL Short contexts/ })).toContainText('38.0%')
  // The additional results: another model, another stream, and general ability.
  const additional = figure(page, 'additional')
  await additional.scrollIntoViewIfNeeded()
  await expect(additional.getByRole('row', { name: /^SCoL Immediate accuracy/ })).toContainText('54.5%')
  await additional.getByRole('button', { name: 'Update budget', exact: true }).click()
  await expect(additional.getByRole('row', { name: /^SCoL, 20 layers/ })).toContainText('55.2%')
  await additional.getByRole('button', { name: 'Out-of-distribution stream', exact: true }).click()
  await expect(additional.getByRole('row', { name: /^SCoL Immediate accuracy/ })).toContainText('20.5%')
  await additional.getByRole('button', { name: 'General ability', exact: true }).click()
  await expect(additional.getByRole('row', { name: /^SCoL 73/ })).toContainText('73.6%')
  await expect(additional.getByRole('row', { name: /^Before any update/ })).toContainText('74.2%')
  const fisher = figure(page, 'fisher')
  await fisher.scrollIntoViewIfNeeded()
  await expect(fisher.getByRole('row', { name: /^SCoL 42/ })).toContainText('42.9%')
  // The passages are the ones in the paper's figure: measured Fisher information, and the layers SCoL selected.
  await expect(fisher.locator('.layers-values span')).toHaveCount(28)
  await expect(fisher.locator('.layer-row').nth(1).locator('[data-state="on"]')).toHaveCount(2)
  await fisher.getByRole('button', { name: 'Harvard University', exact: true }).click()
  await expect(fisher.locator('.layer-row').nth(1).locator('[data-state="on"]')).toHaveCount(8)
  await expect(fisher.getByRole('img', { name: /^SCoL selected layers 2, 7, 14, 22, 23, 26, 27, 28\./ })).toBeVisible()
})

test('three contexts are consolidated, the prompt is cleared, and the question is answered from the weights', async ({ page }) => {
  await page.goto(`${essays[1].path}?edition=paper`)
  const frame = figure(page, 'writing')
  const written = (row: number) => frame.locator('.layer-row').nth(row).locator('[data-state]')
  // With motion reduced it rests on the outcome.
  await expect(station(page, 'writing', 'Question')).toHaveAttribute('aria-current', 'step')
  await expect(frame.locator('.writing-reply')).toHaveText('Upstairs.')

  await station(page, 'writing', 'Context 1').click()
  await expect(frame.locator('.writing-prompt')).toHaveText('Lina puts the key in a blue box.')
  await expect(written(0)).toHaveCount(6)
  await expect(written(1)).toHaveCount(0)
  await expect(frame.locator('.writing-answer')).toHaveCSS('opacity', '0')

  await station(page, 'writing', 'Context 3').click()
  await expect(frame.locator('.writing-prompt')).toHaveText('The study is upstairs.')
  for (const row of [0, 1, 2]) await expect(written(row)).toHaveCount(6)

  // The contexts are removed from the prompt. The updates stay in the weights.
  await station(page, 'writing', 'Prompt cleared').click()
  await expect(frame.locator('.writing-prompt')).toHaveText('The prompt is empty.')
  for (const row of [0, 1, 2]) await expect(written(row)).toHaveCount(6)

  await station(page, 'writing', 'Question').click()
  await expect(frame.locator('.writing-prompt')).toHaveText('Is the key upstairs or downstairs?')
  await expect(frame.locator('.writing-answer')).toHaveCSS('opacity', '1')
})

test('an update in the same layers overwrites, and the training step commits the candidate with the highest reward', async ({ page }) => {
  await page.goto(`${essays[1].path}?edition=paper`)
  const interference = figure(page, 'interference')
  await interference.scrollIntoViewIfNeeded()
  await station(page, 'interference', 'Same layers').click()
  await expect(interference.locator('.layer-row').first().locator('[data-state="lost"]')).toHaveCount(2)
  await station(page, 'interference', 'Different layers').click()
  await expect(interference.locator('.layer-row').first().locator('[data-state="lost"]')).toHaveCount(0)
  await expect(interference.locator('.layer-row').first().locator('[data-state="kept"]')).toHaveCount(3)

  const loop = figure(page, 'loop')
  await loop.scrollIntoViewIfNeeded()
  await expect(loop.locator('.loop-row')).toHaveCount(10)
  await station(page, 'loop', 'Sample').click()
  await expect(loop.locator('.loop-score[data-shown]')).toHaveCount(0)
  await station(page, 'loop', 'Commit').click()
  await expect(loop.locator('.loop-row[data-winner]')).toHaveCount(1)
  await expect(loop.locator('.loop-row[data-faded]')).toHaveCount(9)
  // After the stream the candidates are ranked by reward.
  await station(page, 'loop', 'IPO').click()
  await expect(loop.locator('.loop-row').first()).toHaveAttribute('data-winner', 'true')
})

test('changing appearance keeps the section and the reading position', async ({ page }) => {
  await page.goto(`${essays[1].path}?edition=paper#results`)
  await expect(page.locator('#results')).toBeInViewport()
  await page.evaluate(() => document.fonts.ready)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(400)
  const before = await page.evaluate(() => window.scrollY)
  await page.getByRole('banner').getByRole('button', { name: 'Switch to Black appearance', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-site-edition', 'black')
  await expect(page).toHaveURL(/edition=black#results$/)
  expect(Math.abs(await page.evaluate(() => window.scrollY) - before)).toBeLessThan(4)
  // Figures follow the appearance: other methods stay grey, ours stays blue.
  await expect(figure(page, 'results').locator('.frontier-point[data-ours]')).toHaveCSS('background-color', 'rgb(94, 172, 255)')
})

test('a figure has its own address, and earlier addresses still open it', async ({ page }) => {
  await page.goto(`${essays[0].path}figures/methods/?edition=paper`)
  await expect(figure(page, 'methods')).toBeInViewport()
  await expect(page).toHaveTitle('Parameter updates for a new task under EWC, Replay, and Trust Region · Continual Learning Diffusion Models')
  // The address the figure had before the essay was rebuilt.
  await page.goto(`${essays[0].path}figures/parameter-sharing/?edition=paper`)
  await expect(figure(page, 'methods')).toBeInViewport()
  await page.goto(`${essays[0].path}figures/measured-results/?edition=paper`)
  await expect(figure(page, 'results')).toBeInViewport()
  await page.goto(`${essays[1].path}figures/loop/?edition=paper`)
  await expect(figure(page, 'loop')).toBeInViewport()
  await page.goto(`${essays[0].path}figures/no-such-figure/?edition=paper`)
  await expect(page).toHaveURL(new RegExp(`${essays[0].path}$`))
})
