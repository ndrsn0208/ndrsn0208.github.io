import assert from 'node:assert/strict'
import { test } from 'node:test'
import { clickName, pagePath } from './analytics'

test('a page is counted under one path', () => {
  assert.equal(pagePath('/'), '/')
  assert.equal(pagePath('/about'), '/about')
  assert.equal(pagePath('/blog/'), '/blog')
  assert.equal(pagePath('/blog/self-consolidating-language-models/'), '/blog/self-consolidating-language-models')
})

test('a click that leaves the page has a name, and a link to another page of the site has none', () => {
  const here = 'https://ndrsn0208.github.io/publications?edition=paper'
  assert.equal(clickName('https://ndrsn0208.github.io/papers/trust-region-continual-learning.pdf', here), 'pdf trust-region-continual-learning.pdf')
  assert.equal(clickName('/cv.pdf?v=0123456789ab', here), 'pdf cv.pdf')
  assert.equal(clickName('https://arxiv.org/abs/2602.02417', here), 'out arxiv.org/abs/2602.02417')
  assert.equal(clickName('https://www.linkedin.com/in/andersonw142857/', here), 'out linkedin.com/in/andersonw142857')
  assert.equal(clickName('https://scholar.google.com/citations?user=VIGsFiYAAAAJ', here), 'out scholar.google.com/citations')
  assert.equal(clickName('mailto:zekun@gatech.edu', here), 'email')
  assert.equal(clickName('/about?edition=paper', here), null)
  assert.equal(clickName('#news', here), null)
  assert.equal(clickName('javascript:void(0)', here), null)
})
