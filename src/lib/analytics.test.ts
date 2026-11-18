import assert from 'node:assert/strict'
import { test } from 'node:test'
import { clickName, originName, pagePath } from './analytics'

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

test('where a visit comes from is the owner of its network, then the place', () => {
  assert.equal(originName({ organization: 'Amazon.com, Inc.', city: 'Boardman', region: 'Oregon', country: 'US' }), 'Amazon.com, Inc. · Boardman, Oregon, US')
  // One service puts the network's number before its owner.
  assert.equal(originName({ organization: 'AS2637 Georgia Institute of Technology', city: 'Atlanta', region: 'Georgia', country: 'US' }), 'Georgia Institute of Technology · Atlanta, Georgia, US')
  // A city that is its own region is said once.
  assert.equal(originName({ organization: 'China Unicom', city: 'Beijing', region: 'Beijing', country: 'CN' }), 'China Unicom · Beijing, CN')
  assert.equal(originName({ city: 'Atlanta', region: 'Georgia', country: 'US' }), 'Atlanta, Georgia, US')
  assert.equal(originName({ organization: 'Comcast Cable Communications, LLC' }), 'Comcast Cable Communications, LLC')
  assert.equal(originName({}), null)
})
