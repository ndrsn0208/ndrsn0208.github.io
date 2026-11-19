import assert from 'node:assert/strict'
import { test } from 'node:test'
import { pagePath, titleOf } from './analytics'

test('a page has one name, with or without a slash at the end', () => {
  assert.equal(pagePath('/'), '/')
  assert.equal(pagePath('/about'), '/about')
  assert.equal(pagePath('/blog/'), '/blog')
  assert.equal(pagePath('/blog/self-consolidating-language-models/'), '/blog/self-consolidating-language-models')
})

test('the title of a page is known before the page is drawn', () => {
  assert.equal(titleOf('/'), 'Zekun Wang · Research & writing')
  assert.equal(titleOf('/publications'), 'Publications · Zekun Wang')
  assert.equal(titleOf('/blog/'), 'Writing · Zekun Wang')
  assert.equal(titleOf('/about'), 'About · Zekun Wang')
  assert.equal(titleOf('/cv'), 'Curriculum vitae · Zekun Wang')
  assert.equal(titleOf('/blog/self-consolidating-language-models/'), 'Self-Consolidating Language Models · Zekun Wang')
  // A figure's page is known by its essay until the page says more.
  assert.equal(titleOf('/blog/continual-learning-diffusion-models/figures/forgetting'), 'Continual Learning Diffusion Models · Zekun Wang')
  assert.equal(titleOf('/nowhere'), null)
})
