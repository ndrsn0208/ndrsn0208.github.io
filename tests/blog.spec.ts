import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const post = '/blog/self-consolidating-language-models?edition=paper'

test('the homepage leads to the blog and the article serves the reviewed paper', async ({ page, request }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/?edition=paper')
  await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Blog', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Research notes', exact: true })).toBeVisible()
  await expect(page.locator('.scol-blog')).toHaveAttribute('data-edition', 'paper')
  await page.getByRole('link', { name: 'Read the story', exact: true }).click()
  await expect(page.locator('.scol-subtitle')).toHaveText('Writing context into model weights at test time')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Self-Consolidating')
  await expect(page).toHaveTitle('Self-Consolidating Language Models · Zekun Wang')
  await expect(page.locator('.scol-author-row a')).toHaveAttribute('href', '/papers/self-consolidating-language-models.pdf')
  const pdf = await request.get('/papers/self-consolidating-language-models.pdf')
  expect(pdf.ok()).toBe(true)
  expect(pdf.headers()['content-type']).toContain('application/pdf')
  expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-')
  expect(errors).toEqual([])
})

test('changing appearance preserves the chapter and reading position', async ({ page }) => {
  await page.goto(post)
  await page.getByRole('navigation', { name: 'Article chapters', exact: true }).getByRole('link', { name: /Evidence/ }).click()
  await expect(page).toHaveURL(/#results$/)
  const before = await page.evaluate(() => window.scrollY)
  await page.getByRole('button', { name: 'Switch to Black appearance', exact: true }).click()
  await expect(page.locator('.scol-blog')).toHaveCSS('background-color', 'rgb(0, 0, 0)')
  await expect(page).toHaveURL(/edition=black#results$/)
  expect(Math.abs(await page.evaluate(() => window.scrollY) - before)).toBeLessThan(3)
  await page.getByRole('button', { name: 'Switch to Paper appearance', exact: true }).click()
  await expect(page).toHaveURL(/edition=paper#results$/)
  await expect(page.locator('.scol-blog')).toHaveCSS('background-color', 'rgb(245, 241, 232)')
})

test('the length comparison updates its data and correctly identifies the leading baseline', async ({ page }) => {
  await page.goto(post)
  const figure = page.locator('.scol-results--length')
  await expect(figure.locator('.scol-results__leader')).toContainText('SCoL, 42.3%')
  await figure.getByRole('radio', { name: /Long \(generalization\) 32k to 64k/ }).check()
  await expect(figure.locator('.scol-results__leader')).toContainText('Batch TTT, 41.5%')
  const rows = figure.getByRole('list', { name: 'Long-context results', exact: true })
  await expect(rows.locator('li').filter({ has: page.locator('.scol-results__method[data-highlight="true"]') }).locator('data')).toHaveText('37.0%')
  await figure.getByRole('radio', { name: /Short 16k to 32k/ }).check()
  await expect(figure.locator('.scol-results__leader')).toContainText('SCoL, 42.3%')
  const retention = page.locator('.scol-results--retention')
  await retention.locator('summary').click()
  await expect(retention.getByRole('row', { name: /Prompting only/ })).toContainText('Not reported')
  await expect(retention.getByRole('row', { name: /Batch TTT/ })).toContainText('Not reported')
})

test('the article remains readable on its viewport and exposes accessible controls', async ({ page }) => {
  await page.goto(post)
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width)
  if (page.viewportSize()!.width > 720) {
    const title = await page.locator('.scol-hero h1').evaluate(node => {
      const range = document.createRange()
      range.selectNodeContents(node)
      return {
        lines: range.getClientRects().length,
        width: range.getBoundingClientRect().width,
        available: node.getBoundingClientRect().width,
      }
    })
    expect(title.lines).toBe(1)
    expect(title.width).toBeLessThanOrEqual(title.available)
  }
  const accessibility = await new AxeBuilder({ page }).include('.scol-post').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(accessibility.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(node => node.target) }))).toEqual([])
  await page.getByRole('button', { name: 'Preview here', exact: true }).click()
  await expect(page.getByTitle('Self-Consolidating Language Models PDF, 26 pages')).toBeVisible()
  await page.getByRole('button', { name: 'Close preview', exact: true }).click()
  await expect(page.getByTitle('Self-Consolidating Language Models PDF, 26 pages')).toHaveCount(0)
})

test('the forgetting penalty changes the committed update and preferences return to the saved start', async ({ page }) => {
  await page.goto(post)
  const figure = page.locator('.scol-meta')
  const compare = figure.getByRole('button', { name: 'Step 3. Compare what is learned and what is lost', exact: true })
  const commit = figure.getByRole('button', { name: 'Step 4. Keep the chosen update', exact: true })
  await expect(figure).toBeVisible()
  const inspectB = figure.getByRole('button', { name: 'Inspect candidate B', exact: true })
  if (await inspectB.isVisible()) await inspectB.click()
  await expect(figure.getByRole('article', { name: 'Illustrative candidate B', exact: true }).locator('.scol-meta-layer-list')).toHaveText('[8, 18, 25]')
  await compare.click()
  const penalty = figure.getByRole('slider', { name: 'Penalty for forgetting', exact: true })
  await penalty.press('Home')
  await expect(penalty).toHaveValue('0')
  await expect(figure.getByRole('article', { name: 'Illustrative candidate A', exact: true })).toHaveAttribute('data-best', 'true')
  await commit.click()
  await expect(figure.locator('.scol-meta-choice')).toContainText('Keep candidate A')
  await expect(figure.locator('.scol-meta-kept-state .scol-meta-model')).toHaveAttribute('data-selected-layers', '4,12,20')
  await expect(figure.locator('.scol-meta-pairs')).toContainText('A')
  await compare.click()
  await penalty.press('End')
  await expect(penalty).toHaveValue('1')
  await expect(figure.getByRole('article', { name: 'Illustrative candidate B', exact: true })).toHaveAttribute('data-best', 'true')
  await page.getByRole('button', { name: 'Switch to Black appearance', exact: true }).click()
  await expect(page.locator('.scol-blog')).toHaveCSS('background-color', 'rgb(0, 0, 0)')
  const accessibility = await new AxeBuilder({ page }).include('.scol-meta').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(accessibility.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(node => node.target) }))).toEqual([])
  await commit.click()
  await expect(figure.locator('.scol-meta-choice')).toContainText('Keep candidate B')
  await expect(figure.locator('.scol-meta-winning-update .scol-meta-layer-list')).toHaveText('[8, 18, 25]')
  await expect(figure.locator('.scol-meta-kept-state .scol-meta-layer-list')).toHaveText('[8, 18, 25]')
  await expect(figure.locator('.scol-meta-kept-state .scol-meta-model')).toHaveAttribute('data-selected-layers', '8,18,25')
  expect(await figure.locator('.scol-meta-kept-state rect[data-selected="true"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-layer')))).toEqual(['8', '18', '25'])
  await expect(figure.locator('.scol-meta-commit .scol-meta-fresh-proposals')).toHaveCount(0)
  await figure.getByRole('button', { name: 'Step 5. Let the updated model read the next chunk', exact: true }).click()
  await expect(figure.locator('.scol-meta-commit-reminder')).toContainText('Candidate B [8, 18, 25]')
  await expect(figure.locator('.scol-meta-continue .scol-meta-model')).toHaveAttribute('data-selected-layers', '8,18,25')
  await expect(figure.locator('.scol-meta-fresh-proposals')).toContainText('Sample 10 layer lists')
  await expect(figure.locator('.scol-meta-repeat-stream')).toContainText('remaining chunks')
  await expect(figure).not.toContainText('[4, 17, 26]')
  await figure.getByRole('button', { name: 'Step 6. Train the model that began the round', exact: true }).click()
  await expect(figure.getByText('Saved round-start model', { exact: true })).toBeVisible()
  await expect(figure.getByText('Next round-start model', { exact: true })).toBeVisible()
  await expect(figure.locator('.scol-meta-buffer-label')).toContainText('comparison for chunk cₜ')
  await expect(figure.locator('.scol-meta-stream-complete')).toContainText('All chunks have been processed')
  await expect(figure.locator('.scol-meta-outer').getByRole('listitem', { name: 'Selection B preferred to selection A', exact: true })).toBeVisible()
  await figure.getByRole('button', { name: 'Step 7. A new starting point for the next round', exact: true }).click()
  await expect(figure.getByText('Improved starting model', { exact: true })).toBeVisible()
})

test('the training animation plays and its controls remain reachable beside the scene', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(post)
  const figure = page.locator('.scol-meta')
  const scene = figure.locator('.scol-meta-scene')
  const play = figure.getByRole('button', { name: 'Play the explanation', exact: true })
  await play.click()
  await expect(figure.locator('.scol-meta-play-progress span')).not.toHaveCSS('transform', 'matrix(0, 0, 0, 1, 0, 0)')
  await expect(figure.getByRole('button', { name: 'Step 2. Try each selection from the same starting state', exact: true })).toHaveAttribute('aria-current', 'step', { timeout: 12000 })
  await figure.getByRole('button', { name: 'Pause the explanation', exact: true }).click()
  await expect(play).toBeVisible()
  await scene.scrollIntoViewIfNeeded()
  const controls = await figure.locator('.scol-meta-controls').boundingBox()
  expect(controls).not.toBeNull()
  expect(controls!.y).toBeGreaterThanOrEqual(100)
  expect(controls!.y + controls!.height).toBeLessThan(page.viewportSize()!.height)
})

test('explicit playback works with reduced motion, and citations return to their paragraph', async ({ page }) => {
  await page.goto(post)
  const inspiration = page.locator('#scol-text-history-2')
  await expect(inspiration).toContainText('human memory consolidation')
  await inspiration.getByRole('link', { name: /Reference 2:/ }).click()
  await expect(page).toHaveURL(/#reference-2$/)
  await expect(page.locator('#reference-2')).toContainText('The Consolidation and Transformation of Memory')
  await page.getByRole('link', { name: 'Back to the text citing reference 2', exact: true }).click()
  await expect(page).toHaveURL(/#scol-text-history-2$/)
  const figure = page.locator('.scol-meta')
  const play = figure.getByRole('button', { name: 'Play the explanation', exact: true })
  await expect(play).toBeEnabled()
  await play.click()
  await expect(figure.getByRole('button', { name: 'Step 2. Try each selection from the same starting state', exact: true })).toHaveAttribute('aria-current', 'step', { timeout: 8000 })
  await figure.getByRole('button', { name: 'Pause the explanation', exact: true }).click()
})

test('the story, annotations, and evidence stay readable within the reading column', async ({ page }) => {
  await page.goto(post)
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('#history')).toContainText('Lina puts the key in a blue box')
  await expect(page.locator('.scol-post')).not.toContainText('seed 42')
  const text = await page.locator('.scol-evidence > .scol-prose').first().boundingBox()
  for (const figure of await page.locator('.scol-results').all()) {
    const bounds = await figure.boundingBox()
    expect(bounds!.width).toBeLessThanOrEqual(text!.width + 1)
    expect(Math.abs(bounds!.x - text!.x)).toBeLessThanOrEqual(1)
  }
  const annotationSizes = await page.locator('.scol-affiliation, .scol-section-label, .scol-equation-key, .scol-meta-scene-note').evaluateAll(elements =>
    elements.map(element => parseFloat(getComputedStyle(element).fontSize)),
  )
  expect(Math.min(...annotationSizes)).toBeGreaterThanOrEqual(15)
  await expect(page.getByRole('heading', { name: 'The learned selections align with Fisher importance', exact: true })).toBeVisible()
  await expect(page.locator('.scol-fisher')).toContainText('45.1%')
  await expect(page.locator('.scol-fisher')).toContainText('35.7%')
})

test('the opening sequence keeps its weight changes after the context is cleared', async ({ page }) => {
  await page.goto(post)
  const hero = page.locator('.scol-deployment')
  await expect(hero).toHaveAttribute('data-phase', 'overview')
  await expect(hero.getByText('At deployment time', { exact: true })).toBeVisible()
  await hero.getByRole('button', { name: 'Play the deployment sequence', exact: true }).click()
  await expect(hero).toHaveAttribute('data-playing', 'true')
  await expect(hero).toHaveAttribute('data-phase', 'arrive')
  await expect(hero.locator('.scol-deployment-weight[data-changed="true"]')).toHaveCount(3, { timeout: 5000 })
  await expect(hero).toHaveAttribute('data-phase', 'clear', { timeout: 12000 })
  await expect(hero.locator('.scol-deployment-weight[data-changed="true"]')).toHaveCount(9)
  await expect(hero.getByText('Original prompt empty', { exact: true })).toBeVisible()
  await expect(hero).toHaveAttribute('data-phase', 'answer', { timeout: 6000 })
  await expect(hero.locator('.scol-deployment-answer-word')).toHaveText('Upstairs.')
  await expect(hero.locator('.scol-deployment-chunks')).toHaveAttribute('aria-hidden', 'true')
  await expect(hero).toHaveAttribute('data-playing', 'false')
  await expect(hero.locator('.scol-deployment-weight[data-changed="true"]')).toHaveCount(9)
  const connection = await hero.locator('.scol-deployment-wire-query').evaluate(node => {
    const path = node as SVGPathElement
    const matrix = path.getScreenCTM()!
    const start = path.getPointAtLength(0).matrixTransform(matrix)
    const end = path.getPointAtLength(path.getTotalLength()).matrixTransform(matrix)
    const figure = path.closest('.scol-deployment')!
    const source = figure.querySelector('.scol-deployment-question-port')!.getBoundingClientRect()
    const target = figure.querySelector('.scol-deployment-model-query-port')!.getBoundingClientRect()
    return {
      dash: getComputedStyle(path).strokeDasharray,
      startError: Math.hypot(start.x - source.x, start.y - source.y),
      endError: Math.hypot(end.x - target.x, end.y - target.y),
    }
  })
  expect(connection.dash).toBe('5px, 7px')
  expect(connection.startError).toBeLessThan(2)
  expect(connection.endError).toBeLessThan(2)
})

test('stream consolidation reveals notes in order and retains the model after clearing the prompt', async ({ page }) => {
  await page.goto(`${post}#consolidation`)
  const figure = page.locator('.scol-journey[data-scene="consolidation"]')
  await expect(figure).toHaveAttribute('data-step', '7')
  for (let step = 7; step > 0; step--) {
    await figure.getByRole('button', { name: 'Previous step', exact: true }).click()
  }
  await expect(figure).toHaveAttribute('data-step', '0')
  await expect(figure.locator('[data-node="c2"] .scol-journey-relation')).toHaveText('Note 2 · upcoming')
  await expect(figure.locator('[data-node="c3"] .scol-journey-relation')).toHaveText('Note 3 · upcoming')
  await expect(figure.getByRole('img', { name: /same language model at theta 0/ })).toBeVisible()
  const next = figure.getByRole('button', { name: 'Next step', exact: true })
  for (let step = 1; step <= 5; step++) {
    await next.click()
    await expect(figure).toHaveAttribute('data-step', String(step))
  }
  await expect(figure.getByRole('img', { name: /same language model at theta 3/ })).toBeVisible()
  await next.click()
  await expect(figure).toHaveAttribute('data-phase', 'clear')
  for (const id of ['c1', 'c2', 'c3']) {
    await expect(figure.locator(`[data-node="${id}"]`)).toHaveAttribute('aria-hidden', 'true')
  }
  await expect(figure.getByRole('img', { name: /same language model at theta 3/ })).toBeVisible()
  await next.click()
  await expect(figure).toHaveAttribute('data-phase', 'question')
  await expect(figure.locator('[data-node="question"]')).toHaveAttribute('aria-hidden', 'false')
  await expect(figure.locator('path[data-route="question-input"]')).toHaveCSS('stroke-dasharray', '8px, 7px')
  await expect(next).toBeDisabled()
})

test('Fisher playback reveals the diagnostic without changing the selected layers', async ({ page }) => {
  await page.goto(post)
  const figure = page.locator('.scol-fisher')
  const selections = figure.locator('.scol-fisher__selection[data-selected="true"]')
  const readSelection = () => selections.evaluateAll(nodes => nodes.map(node => node.parentElement!.getAttribute('data-layer')))
  await expect(selections).toHaveCount(10)
  await expect(figure.locator('.scol-fisher__profile')).toHaveCount(1)
  const layerPositions = await figure.locator('.scol-fisher__profile g[data-layer]').evaluateAll(nodes => nodes.map(node => {
    const dot = node.querySelector('circle.scol-fisher__selection') as SVGCircleElement
    return { layer: Number(node.getAttribute('data-layer')), x: dot.cx.baseVal.value, y: dot.cy.baseVal.value }
  }))
  expect(layerPositions.map(point => point.layer)).toEqual(Array.from({ length: 28 }, (_, layer) => layer))
  expect(new Set(layerPositions.map(point => point.y)).size).toBe(1)
  expect(layerPositions.every((point, index) => index === 0 || point.x > layerPositions[index - 1].x)).toBe(true)
  const selectedBefore = await readSelection()
  expect(selectedBefore).toHaveLength(10)
  await expect(figure.locator('.scol-fisher__stage')).toHaveAttribute('data-step', '2')
  await expect(figure.locator('g[data-overlap="true"]')).toHaveCount(5)
  await expect(figure.locator('.scol-fisher__description')).toContainText('5 of 10 layers overlap')
  await figure.getByRole('button', { name: 'Play Fisher explanation', exact: true }).click()
  await expect(figure.locator('.scol-fisher__stage')).toHaveAttribute('data-step', '0')
  await expect(figure.locator('.scol-fisher__stage')).toHaveAttribute('data-step', '2', { timeout: 5000 })
  expect(await readSelection()).toEqual(selectedBefore)
  await expect(figure.locator('g[data-overlap="true"]')).toHaveCount(5)
  await expect(figure.locator('.scol-fisher__description')).toContainText('5 of 10 layers overlap')
  await figure.getByRole('button', { name: 'Next passage', exact: true }).click()
  expect(await readSelection()).not.toEqual(selectedBefore)
  await expect(figure.locator('g[data-overlap="true"]')).toHaveCount(4)
  await expect(figure.locator('.scol-fisher__description')).toContainText('4 of 10 layers overlap')
  await expect(figure.locator('.scol-fisher__schematic')).toContainText('illustrative')
  await expect(figure.locator('.scol-fisher__results')).toContainText('45.1%')
  for (const edition of ['black', 'paper'] as const) {
    await page.getByRole('button', { name: `Switch to ${edition === 'black' ? 'Black' : 'Paper'} appearance`, exact: true }).click()
    const background = edition === 'black' ? 'rgb(0, 0, 0)' : 'rgb(245, 241, 232)'
    await expect(page.locator('.scol-blog')).toHaveCSS('background-color', background)
    await expect(figure).toHaveCSS('background-color', background)
    for (const result of await page.locator('.scol-results').all()) {
      await expect(result).toHaveCSS('background-color', background)
    }
  }
})
