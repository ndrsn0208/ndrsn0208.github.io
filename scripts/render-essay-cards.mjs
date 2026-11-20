// Renders the share images for every essay: one per figure, and one for the essay itself.
//
//   npm run blog:figure-cards             every essay
//   npm run blog:figure-cards -- tease    one essay, by its id
//
// Each card is the live figure, photographed in the page at 1200 × 630 with the
// essay's name and the figure's title above it. Run it after a figure changes,
// look at the images, then build. The build checks that every card exists.

import fs from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from '@playwright/test'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function loadSource(relativePath) {
  const source = await fs.readFile(path.join(root, relativePath), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
}

const [{ essayCard, essayType }, { diffusionEssay }, { scolEssay }, { compositionEssay }, { teaseEssay }] = await Promise.all([
  loadSource('src/blog/essay/format.ts'),
  loadSource('src/blog/diffusion/article.ts'),
  loadSource('src/blog/scol/article.ts'),
  loadSource('src/blog/composition/article.ts'),
  loadSource('src/blog/tease/article.ts'),
])

// The width a figure is photographed at. A tall figure is given less than a chart or a grid.
// A key with an essay's id applies to that essay's figure only.
const widths = {
  forgetting: 1040, region: 860, methods: 520, 'scol/results': 560, 'scol/additional': 560,
  'composition/compose': 640, 'composition/modes': 760, 'composition/ascent': 560, 'composition/weights': 900, 'composition/samples': 700, 'composition/results': 560, 'composition/number': 560,
  'tease/results': 1088, 'tease/table': 800, 'tease/atoms': 820, 'tease/turn': 590, 'tease/play': 920, 'tease/stages': 920, 'tease/pairs': 560, 'tease/functions': 660, 'tease/budget': 680,
  'tease/steps': 660, 'tease/gain': 720, 'tease/first': 660, 'tease/open': 580, 'tease/shown': 640,
}
// The comparison of methods is three strips. The essay's own card shows the last one, Trust Region.
const strips = { methods: { count: 3, ratio: 1000 / 800 } }
// The figure that stands for the whole essay.
const face = { diffusion: 'methods', scol: 'writing', composition: 'compose', tease: 'table' }
// The width of that figure on the essay's own card, where the headline takes more room.
const faceWidths = { composition: 520, tease: 600 }
// A figure laid out for a tall page is laid out again for a card, which is wider than it is tall.
const cardStyles = {
  tease: `
    .readout { margin-bottom: 2px; } .readout dd { font-size: 2.2rem; }
    .curves-plot { padding-top: 2.5rem; padding-bottom: 3.2rem; }
    .columns-field { height: 200px; }
    .tease-pair { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); column-gap: 32px; align-items: start; }
    .tease-pair-front { grid-column: 1; grid-row: 1 / span 3; }
    .tease-pair > .tease-line, .tease-pair-row { grid-column: 2; }
    .tease-plays { grid-template-columns: minmax(0, 1fr) minmax(0, 1.7fr); gap: 40px; }
    .tease-turn-text { min-height: 0; }
    .tease-results { --tease-plot: 172px; }
    .tease-results .readout { margin-bottom: 12px; }
    .tease-results .columns-name { display: flex; justify-content: center; }
    .tease-results .columns-name-full { display: block; flex: none; width: 4.3rem; } .tease-results .columns-name-short { display: none; }
  `,
}
// On the essay's own card the headline takes more room, so the figure shows less.
const faceStyles = { tease: '.tease-uses { display: none; }' }
// With ids after the command, only those essays are rendered.
const wanted = process.argv.slice(2)
const only = essays => wanted.length ? essays.filter(essay => wanted.includes(essay.id)) : essays

const server = await createServer({ root, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } })
await server.listen()
const address = server.httpServer.address()
const base = `http://127.0.0.1:${address.port}`
const browser = await chromium.launch({ channel: 'chrome' })
let count = 0

try {
  for (const essay of only([diffusionEssay, scolEssay, compositionEssay, teaseEssay])) {
    const cards = [
      ...Object.keys(essay.exhibits).map(id => ({ id, figure: id, small: essay.name, large: essayType(essay.exhibits[id].title), size: 40 })),
      { id: 'essay', figure: face[essay.id], small: essay.name, large: essayType(essay.headline), size: 60 },
    ]
    for (const card of cards) {
      // A fresh page each time: the figure is lifted out of the essay for its photograph.
      const context = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
      const page = await context.newPage()
      await page.goto(`${base}${essay.path}?edition=paper`, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      await page.evaluate(({ figure, small, large, size, width, strip, style }) => {
        const stage = document.querySelector(`#figure-${figure} .exhibit-stage`)
        if (!stage) throw new Error(`No figure named ${figure}`)
        if (style) document.head.append(Object.assign(document.createElement('style'), { textContent: style }))
        const shell = document.querySelector('.essay-system')
        const sheet = document.createElement('div')
        sheet.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;box-sizing:border-box;width:1200px;height:630px;padding:46px 56px 40px;display:flex;flex-direction:column;background:var(--site-paper);color:var(--site-ink);overflow:hidden'
        const name = document.createElement('p')
        name.textContent = small
        name.style.cssText = 'margin:0;color:var(--site-muted);font-size:24px;line-height:1.2;letter-spacing:-.02em'
        const title = document.createElement('p')
        title.textContent = large
        title.style.cssText = `margin:8px 0 0;max-width:${size > 50 ? 900 : 1000}px;font-size:${size}px;font-weight:${size > 50 ? 360 : 400};line-height:1.06;letter-spacing:-.04em;text-wrap:balance`
        const room = document.createElement('div')
        room.style.cssText = 'flex:1;min-height:0;display:flex;align-items:center'
        const holder = document.createElement('div')
        holder.style.cssText = `width:${width}px;max-width:100%`
        if (strip) {
          // Keep the last strip in view: the stage is held to its bottom edge and the rest is cut off.
          holder.style.cssText += `;position:relative;overflow:hidden;height:${width / strip.ratio / strip.count}px`
          stage.style.cssText = 'position:absolute;left:0;right:0;bottom:0;padding:0'
        }
        holder.append(stage)
        room.append(holder)
        sheet.append(name, title, room)
        shell.append(sheet)
        document.querySelector('.adapt-launcher')?.remove()
      }, { ...card, width: card.id === 'essay' ? faceWidths[essay.id] ?? 1088 : widths[`${essay.id}/${card.figure}`] ?? widths[card.figure] ?? 1088, strip: card.id === 'essay' ? strips[card.figure] : undefined, style: `${cardStyles[essay.id] ?? ''}${card.id === 'essay' ? faceStyles[essay.id] ?? '' : ''}` })
      await page.waitForTimeout(700)
      const file = path.join(root, 'public', essayCard(essay.id, card.id))
      await fs.mkdir(path.dirname(file), { recursive: true })
      await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 1200, height: 630 } })
      await context.close()
      count += 1
    }
  }
} finally {
  await browser.close()
  await server.close()
}
console.log(`Rendered ${count} share images under public/blog-assets/*/share/.`)
