import { expect, test } from '@playwright/test'

for (const route of ['/?edition=paper', '/typography/book?edition=black']) {
  test(`${route}: research directions are visible and filter alongside search`, async ({ page }) => {
    await page.goto(route)
    await page.getByRole('navigation', { name: 'Main navigation', exact: true }).locator('[data-nav-destination="publications"]').click()
    const topics = page.getByRole('group', { name: 'Research topics', exact: true })
    await expect(topics.getByRole('button')).toHaveCount(6)
    await expect(page.getByRole('combobox', { name: 'Research topic', exact: true })).toHaveCount(0)
    const search = page.getByRole('searchbox', { name: 'Search publications' })
    const topicBounds = (await topics.boundingBox())!
    expect(topicBounds.y + topicBounds.height).toBeLessThan((await search.boundingBox())!.y)

    const continual = topics.getByRole('button', { name: 'continual learning', exact: true })
    await continual.focus()
    await page.keyboard.press('Space')
    await expect(continual).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('heading', { name: 'Self-Consolidating Language Models: Continual Knowledge Incorporation from Context', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Test-Time Compositional Generalization in Diffusion Models via Concept Discovery', exact: true })).toHaveCount(0)

    await search.fill('rank-1 fisher')
    await expect(page.locator('.quiet-paper')).toHaveCount(1)
    await expect(page.getByRole('heading', { name: 'Avoid Catastrophic Forgetting with Rank-1 Fisher from Diffusion Models', exact: true })).toBeVisible()
    await topics.getByRole('button', { name: 'language models', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'No papers found.' })).toBeVisible()
    await page.getByRole('button', { name: /^Show all .* papers$/ }).click()
    await expect(search).toHaveValue('')
    await expect(page.getByRole('button', { name: 'All papers', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.quiet-paper')).toHaveCount(15)
  })
}
