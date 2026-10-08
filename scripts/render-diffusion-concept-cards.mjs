/**
 * Offline, deterministic figure exports. Run from any directory:
 *   node /path/to/repo/scripts/render-diffusion-concept-cards.mjs
 *
 * The TypeScript models and private production StaticSurface are bundled in
 * memory. Nothing is written to application sources or to a temporary bundle.
 * KaTeX's bundled fonts become SVG paths, avoiding host font substitution.
 * Only the four share PNGs and their review SVGs are written.
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import katex from 'katex'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import sharp from 'sharp'
import { parse as parseFont } from 'three/examples/jsm/libs/opentype.module.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(import.meta.url)
const output = join(root, 'public/blog-assets/diffusion/share')
const review = join(root, 'artifacts/diffusion-blog/figure-sharing')
const WIDTH = 1200
const HEIGHT = 630
const C = {
  paper: '#f5f1e8', ink: '#282c29', muted: '#686e65', line: '#d6d0c3',
  positive: '#496577', negative: '#95664e', accent: '#276960',
  task1: '#ad802c', task2: '#657ca9', task3: '#62854e',
}
const theme = {
  '--scol-bg': C.paper, '--scol-ink': C.ink,
  '--arg-reference': '#343c37', '--arg-diagonal': '#a65133',
  '--arg-rank': C.accent, '--arg-muted': '#76796f',
  '--arg-task1': C.task1, '--arg-task2': C.task2, '--arg-task3': C.task3,
  '--arg-surface-low': '#9caeb4', '--arg-surface-high': '#eeece2',
  '--arg-mesh-ink': '#34577d',
  '--fisher-land-low': '#547e89', '--fisher-land-mid': '#8eaaa9',
  '--fisher-land-upper': '#c8d0bd', '--fisher-land-high': '#eee7d3',
  '--fisher-matrix-positive': C.positive, '--fisher-matrix-negative': C.negative,
}
const xml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
})[character])
const round = value => Number(value.toFixed(3))
const number = value => String(Number(value.toFixed(2))).replace('-', '−')
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const rendererHash = sha256(await fs.readFile(fileURLToPath(import.meta.url)))

const compiled = await build({
  absWorkingDir: root,
  stdin: {
    contents: `
      export { StaticSurface, homePose } from './src/blog/diffusion/ArgumentScene';
      export { default as FisherMatrix } from './src/blog/diffusion/FisherMatrix';
      export * from './src/blog/diffusion/fisher-comparison-model';
      export { gradientStoryModel } from './src/blog/diffusion/gradient-story-model';
      export * from './src/blog/diffusion/task-sharing-model';
      export { metaLearningConnection } from './src/blog/diffusion/meta-learning-connection';
      export { diffusionArticle } from './src/blog/diffusion/article';
    `,
    resolveDir: root, loader: 'tsx',
  },
  bundle: true, write: false, metafile: true,
  jsx: 'automatic', platform: 'node', format: 'cjs',
  external: ['react', 'react-dom', 'three'], loader: { '.css': 'empty' },
  plugins: [{
    name: 'export-production-static-surface',
    setup(builder) {
      builder.onLoad({ filter: /[/\\]ArgumentScene\.tsx$/ }, async ({ path }) => ({
        contents: `${await fs.readFile(path, 'utf8')}\nexport { StaticSurface };`,
        loader: 'tsx',
      }))
    },
  }],
})
const compiledModule = { exports: {} }
// esbuild's CommonJS output executes against the same installed React as SSR.
new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(
  require, compiledModule, compiledModule.exports,
)
const model = compiledModule.exports
const sourceHashes = Object.fromEntries(await Promise.all(
  Object.keys(compiled.metafile.inputs)
    .filter(path => path.startsWith('src/')).sort()
    .map(async path => [path, sha256(await fs.readFile(join(root, path)))]),
))
const fontNames = {
  serif: 'Main-Regular', bold: 'Main-Bold', sans: 'SansSerif-Regular',
  sansBold: 'SansSerif-Bold', math: 'Math-Italic', symbols: 'AMS-Regular',
  calligraphic: 'Caligraphic-Regular', large: 'Size1-Regular',
}
const fonts = Object.fromEntries(await Promise.all(
  Object.entries(fontNames).map(async ([name, filename]) => {
    const bytes = await fs.readFile(join(dirname(require.resolve('katex')), 'fonts', `KaTeX_${filename}.ttf`))
    return [name, parseFont(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))]
  }),
))

function mix(a, b, weight) {
  const p = Math.max(0, Math.min(1, weight))
  return `#${[1, 3, 5].map(index => Math.round(
    parseInt(a.slice(index, index + 2), 16) * p
    + parseInt(b.slice(index, index + 2), 16) * (1 - p),
  ).toString(16).padStart(2, '0')).join('')}`
}

/** Shape text using only versioned package fonts; fail on a missing glyph. */
function glyphs(value, size, style = 'sans') {
  let width = 0
  let above = 0
  let below = 0
  let previous
  const paths = []
  for (const character of String(value).replace(/\u00a0/g, ' ')) {
    const font = [fonts[style], fonts.serif, fonts.math, fonts.symbols, fonts.large]
      .find(candidate => candidate.charToGlyphIndex(character) !== 0)
    assert(font, `No bundled glyph for ${JSON.stringify(character)}`)
    const glyph = font.charToGlyph(character)
    if (previous?.font === font) width += font.getKerningValue(previous.glyph, glyph) * size / font.unitsPerEm
    const path = glyph.getPath(width, 0, size)
    if (path.commands.length) {
      const bounds = path.getBoundingBox()
      above = Math.max(above, -bounds.y1)
      below = Math.max(below, bounds.y2)
      paths.push(path.toPathData(3))
    }
    width += glyph.advanceWidth * size / font.unitsPerEm
    previous = { font, glyph }
  }
  return { width, above, below, content: `<path d="${paths.join(' ')}"/>` }
}

const place = (box, x, y) => `<g transform="translate(${round(x)} ${round(y)})">${box.content}</g>`
function label(value, x, y, { size = 18, style = 'sans', fill = C.ink, align = 'left', maxWidth } = {}) {
  const box = glyphs(value, size, style)
  assert(!maxWidth || box.width <= maxWidth, `Label too wide: ${value} (${round(box.width)} > ${maxWidth})`)
  const left = x - (align === 'center' ? box.width / 2 : align === 'right' ? box.width : 0)
  assert(left >= 0 && left + box.width <= WIDTH, `Label outside card: ${value}`)
  return `<g fill="${fill}" role="img" aria-label="${xml(value)}">${place(box, left, y)}</g>`
}
const line = (x1, y1, x2, y2, color = C.line, width = 1, dash = '') =>
  `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`
const rect = (x, y, width, height, fill, extra = '') =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" ${extra}/>`
const circle = (x, y, radius, fill, extra = '') =>
  `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" ${extra}/>`

/*
 * Lay out KaTeX's semantic MathML tree directly as vector glyphs. This small,
 * deliberately strict subset covers the source equations, retaining ≃, indices,
 * accents and powers. It never uses a browser or a foreignObject. Underbrace
 * captions in the final source row move to the shared explanatory line.
 */
const emptyBox = () => ({ width: 0, above: 0, below: 0, content: '' })
function row(boxes) {
  const result = emptyBox()
  for (const box of boxes) {
    result.content += place(box, result.width, 0)
    result.width += box.width
    result.above = Math.max(result.above, box.above)
    result.below = Math.max(result.below, box.below)
  }
  return result
}
const nodeText = node => node.text ?? (node.children ?? []).map(nodeText).join('')
function mathBox(node, size) {
  const children = node.children ?? []
  const type = node.type ?? node.constructor.name
  if (type === 'annotation') return emptyBox()
  if (type === 'SpaceNode') return { ...emptyBox(), width: node.width * size }
  if (type === 'semantics') return mathBox(children[0], size)
  if (['Span', 'DocumentFragment', 'math', 'mrow', 'mstyle'].includes(type)) return row(children.map(child => mathBox(child, size)))
  if (['mi', 'mo', 'mn', 'mtext', 'TextNode'].includes(type)) {
    const text = nodeText(node)
    if (/^[\u2061\u2062]$/.test(text)) return emptyBox()
    const style = type === 'mi'
      ? ({ normal: 'serif', 'double-struck': 'symbols', script: 'calligraphic' }[node.attributes?.mathvariant] ?? 'math')
      : 'serif'
    const box = glyphs(text === '≠' ? '=' : text, size, style)
    // KaTeX composes \ne from an equals sign and a negation stroke.
    if (text === '≠') box.content += line(box.width * 0.72, -size * 0.64,
      box.width * 0.28, size * 0.04, 'currentColor', size * 0.045)
    const spacing = type === 'mo' && /^[=≃≈≠><≤≥⇒⟹∩]$/.test(text) ? 0.22 * size
      : type === 'mo' && /^[+−×]$/.test(text) ? 0.15 * size : 0
    const trailing = text === ',' ? 0.12 * size : 0
    return { ...box, width: box.width + spacing * 2 + trailing, content: place(box, spacing, 0) }
  }
  if (['msub', 'msup', 'msubsup'].includes(type)) {
    const base = mathBox(children[0], size)
    const sub = type !== 'msup' ? mathBox(children[1], size * 0.68) : emptyBox()
    const sup = type !== 'msub' ? mathBox(children[type === 'msubsup' ? 2 : 1], size * 0.68) : emptyBox()
    const x = base.width + size * 0.035
    const subY = Math.max(size * 0.24, base.below + size * 0.12)
    const supY = -Math.max(size * 0.43, base.above - size * 0.22)
    return {
      width: x + Math.max(sub.width, sup.width),
      above: Math.max(base.above, sup.above - supY),
      below: Math.max(base.below, sub.below + (sub.width ? subY : 0)),
      content: base.content + place(sub, x, subY) + place(sup, x, supY),
    }
  }
  if (type === 'mover') {
    const base = mathBox(children[0], size)
    const accent = mathBox(children[1], size * 0.8)
    const width = Math.max(base.width, accent.width)
    const y = -base.above - accent.below - size * 0.055
    return {
      width, above: -y + accent.above, below: base.below,
      content: place(base, (width - base.width) / 2, 0) + place(accent, (width - accent.width) / 2, y),
    }
  }
  if (type === 'munder' && children[0]?.type === 'munder' && children[1]?.type === 'mtext') {
    return mathBox(children[0].children[0], size)
  }
  if (type === 'mfrac') {
    const numerator = mathBox(children[0], size * 0.78)
    const denominator = mathBox(children[1], size * 0.78)
    const width = Math.max(numerator.width, denominator.width) + size * 0.25
    const top = -size * 0.4 - numerator.below
    const bottom = size * 0.22 + denominator.above
    return {
      width, above: numerator.above - top, below: denominator.below + bottom,
      content: place(numerator, (width - numerator.width) / 2, top)
        + line(0, -size * 0.22, width, -size * 0.22, 'currentColor', 1)
        + place(denominator, (width - denominator.width) / 2, bottom),
    }
  }
  throw new Error(`Unimplemented MathML node: ${type}`)
}
function equation(tex, x, y, { size = 27, fill = C.ink, align = 'center', maxWidth } = {}) {
  const tree = katex.__renderToDomTree(tex, { output: 'mathml', throwOnError: true, strict: 'error' })
  const box = mathBox(tree, size)
  assert(!maxWidth || box.width <= maxWidth, `Equation too wide: ${tex} (${round(box.width)} > ${maxWidth})`)
  const left = x - (align === 'center' ? box.width / 2 : align === 'right' ? box.width : 0)
  assert(left >= 0 && left + box.width <= WIDTH, `Equation outside card: ${tex}`)
  return `<g fill="${fill}" color="${fill}" role="math" aria-label="${xml(tex)}">${place(box, left, y)}</g>`
}

/**
 * Materialize CSS variables, including the inherited per-region data-tone.
 * Resolving every tone as "reference" would silently erase task identities.
 */
function resolveSvg(svg) {
  const stack = ['reference']
  const resolved = svg.replace(/<[^>]+>/g, tag => {
    if (/^<\//.test(tag)) {
      stack.pop()
      return tag
    }
    const tone = tag.match(/\bdata-tone="([^"]+)"/)?.[1] ?? stack[stack.length - 1]
    if (!/\/>$/.test(tag) && !/^<[!?]/.test(tag)) stack.push(tone)
    let result = tag
      .replace(/var\(--arg-tone(?:,\s*var\(--arg-reference\))?\)/g, theme[`--arg-${tone}`])
      .replace(/var\((--[^)]+)\)/g, (_, name) => {
        assert(theme[name], `Unresolved theme variable ${name}`)
        return theme[name]
      })
      .replace(/color-mix\(in srgb, (#[0-9a-f]{6}) ([\d.]+)%, (#[0-9a-f]{6})\)/gi,
        (_, a, fraction, b) => mix(a, b, Number(fraction) / 100))
    if (result.includes('class="fisher-matrix-guide"')) {
      result = result.replace('class="fisher-matrix-guide"',
        `class="fisher-matrix-guide" fill="none" stroke="${C.ink}" stroke-width=".5" opacity=".12"`)
    }
    return result
  })
  assert(!/var\(|color-mix\(/.test(resolved), 'Unsupported SVG color expression')
  return resolved
}
const innerSvg = svg => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')
const ssr = (component, props, prefix) => resolveSvg(renderToStaticMarkup(
  React.createElement(component, props), { identifierPrefix: `${prefix}-` },
))
const surface = (panel, options = {}) => ssr(model.StaticSurface, { panel, ...options }, panel.id)
function commonBounds(svgs, annotationsOnly = false, padding = 8) {
  const coordinates = svgs.flatMap(svg => [...svg.matchAll(/<(?:polygon|polyline)\b[^>]*>/g)]
    .filter(([tag]) => !annotationsOnly || /\bdata-tone=/.test(tag))
    .flatMap(([tag]) => tag.match(/\bpoints="([^"]+)"/)[1].trim().split(/\s+/)
      .map(pair => pair.split(',').map(Number))))
  assert(coordinates.length > 0)
  const xs = coordinates.map(point => point[0]), ys = coordinates.map(point => point[1])
  const x = Math.min(...xs) - padding, y = Math.min(...ys) - padding
  return [x, y, Math.max(...xs) + padding - x, Math.max(...ys) + padding - y].map(round).join(' ')
}
const drawing = (svg, x, y, width, height, viewBox) =>
  `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">${innerSvg(svg)}</svg>`

function frame(title, subtitle, body, { tag = '', description = '' } = {}) {
  const provenance = {
    renderer: 'scripts/render-diffusion-concept-cards.mjs',
    rendererSha256: rendererHash,
    sources: sourceHashes,
    versions: { sharp: sharp.versions.sharp, vips: sharp.versions.vips, katex: katex.version, react: React.version },
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="card-title card-description">
    <title id="card-title">${xml(title)}</title>
    <desc id="card-description">${xml(description || subtitle)}</desc>
    <metadata>${xml(JSON.stringify(provenance))}</metadata>
    ${rect(0, 0, WIDTH, HEIGHT, C.paper)}
    ${label(title, 42, 52, { size: 35, style: 'serif', maxWidth: tag ? 875 : 1116 })}
    ${label(subtitle, 42, 84, { size: 18, fill: C.muted, maxWidth: 1116 })}
    ${tag ? label(tag, 1158, 49, { size: 16, fill: C.muted, align: 'right' }) : ''}
    ${line(42, 104, 1158, 104)}
    ${body}
    ${line(42, 583, 1158, 583)}
    ${label(model.diffusionArticle.title, 42, 613, { size: 21, style: 'serif', maxWidth: 920 })}
    ${label(model.diffusionArticle.author, 1158, 613, { size: 18, align: 'right' })}
  </svg>`
}
function signedKey(y, { x = 42, note = 'Common matrix color scale' } = {}) {
  return rect(x, y - 12, 12, 12, C.positive)
    + label('Positive', x + 20, y, { size: 16, fill: C.muted })
    + rect(x + 96, y - 12, 12, 12, C.negative)
    + label('Negative', x + 116, y, { size: 16, fill: C.muted })
    + rect(x + 202, y - 12, 12, 12, C.paper, `stroke="${C.line}"`)
    + label('Zero', x + 222, y, { size: 16, fill: C.muted })
    + label(note, 1158, y, { size: 16, fill: C.muted, align: 'right' })
}

function fisherCard() {
  assert(model.approximationErrors.rank > 0)
  assert(model.approximationErrors.rank < model.approximationErrors.diagonal)
  model.fisherPanels.forEach(panel => {
    assert.equal(panel.extent, model.FISHER_EXTENT)
    assert.deepEqual(panel.valueRange, model.FISHER_HEIGHT_RANGE)
  })
  const surfaces = model.fisherPanels.map(panel => surface(panel, {
    zoom: 1.1, offsetY: 0.2, pose: model.FISHER_VIEW,
  }))
  const bounds = commonBounds(surfaces)
  const readings = {
    full: 'All parameter interactions',
    diagonal: 'Cross terms removed',
    rank: 'Shared pattern retained',
  }
  const body = model.fisherEstimates.map((estimate, index) => {
    const x = 42 + index * 380, center = x + 178
    const matrix = ssr(model.FisherMatrix, {
      matrix: model.fisherMatrices[estimate.id],
      maximum: model.matrixColorMaximum,
      label: `${estimate.title}: illustrative Fisher matrix`,
    }, `matrix-${estimate.id}`)
    return (index ? line(x - 12, 121, x - 12, 544) : '')
      + label(estimate.title, center, 140, { size: 26, style: 'serif', align: 'center' })
      + label(readings[estimate.id], center, 166, { size: 17, fill: C.muted, align: 'center' })
      + drawing(matrix, center - 137, 183, 118, 118, `0 0 ${model.FISHER_DIMENSION} ${model.FISHER_DIMENSION}`)
      + label(estimate.id === 'full' ? 'Reference' : model.errorPercent(estimate.id),
        center + 3, 224, { size: estimate.id === 'full' ? 24 : 31, style: 'serif', maxWidth: 169 })
      + label(estimate.id === 'full' ? `${model.FISHER_DIMENSION} parameters` : 'relative matrix error',
        center + 3, 252, { size: 16, fill: C.muted, maxWidth: 169 })
      + drawing(surfaces[index], x - 3, 305, 362, 239, bounds)
  }).join('')
  return frame(
    'What the diagonal leaves out',
    'A rank-1 estimate preserves the dominant Fisher pattern and its local geometry.',
    body + signedKey(562, { note: 'Common matrix colors. Shared landscape view and height scale' }),
    {
      tag: 'Illustrative geometry',
      description: 'Three production FisherMatrix maps and StaticSurface landscapes from fisher-comparison-model. '
        + 'The nonlinear detail, view, parameter plane and height scale are shared. Relative errors are Frobenius '
        + 'matrix errors of this constructed example, not measured diffusion losses.',
    },
  )
}

function numericMatrix(matrix, center, y, maximum) {
  const cell = 64
  const left = center - cell * matrix.length / 2
  let content = ''
  for (let index = 0; index < matrix.length; index += 1) {
    content += equation(`\\theta_${index + 1}`, left + index * cell + cell / 2, y - 14,
      { size: 19, fill: C.muted })
    content += equation(`\\theta_${index + 1}`, left - 23, y + index * cell + 37,
      { size: 19, fill: C.muted })
  }
  matrix.forEach((row, i) => row.forEach((value, j) => {
    const x = left + j * cell, top = y + i * cell
    const fill = Math.abs(value) < 1e-12 ? C.paper
      : mix(value < 0 ? C.negative : C.positive, C.paper, 0.12 + 0.43 * Math.abs(value) / maximum)
    content += rect(x + 2, top + 2, cell - 4, cell - 4, fill,
      `rx="2" stroke="${C.line}" stroke-width=".7" data-row="${i}" data-column="${j}" data-value="${value}"`)
    content += label(number(value), x + cell / 2, top + 37,
      { size: 18.5, align: 'center', fill: value === 0 ? C.muted : C.ink, maxWidth: cell - 7 })
  }))
  return content
}
function scaleFraction(value) {
  for (let denominator = 1; denominator <= 1000; denominator += 1) {
    const numerator = Math.round(value * denominator)
    if (Math.abs(numerator / denominator - value) < 1e-12) return `${numerator}/${denominator}`
  }
  return String(Number(value.toPrecision(5)))
}
function constructionCard() {
  const data = model.gradientStoryModel
  const dimension = data.mean.length
  assert.equal(dimension, 4, 'The numeric matrix layout expects the four-parameter construction model')
  data.fisher.forEach((row, i) => row.forEach((value, j) => {
    assert(Math.abs(data.rankOne[i][j] - data.scale * data.mean[i] * data.mean[j]) < 1e-10)
    assert.equal(data.diagonal[i][j], i === j ? value : 0)
    assert(Math.abs(value - data.samples.reduce((sum, g) => sum + g[i] * g[j], 0) / data.samples.length) < 1e-10)
  }))
  const maximum = Math.max(...[data.fisher, data.diagonal, data.rankOne].flat(2).map(Math.abs))
  const columns = [
    { title: 'Full empirical Fisher', tex: String.raw`F=\mathbb E[gg^\top]`, matrix: data.fisher },
    { title: 'Diagonal', tex: String.raw`\operatorname{diag}(F)`, matrix: data.diagonal },
    { title: 'Scaled mean outer product', tex: String.raw`F\simeq c\,\mu\mu^\top`, matrix: data.rankOne },
  ]
  const body = columns.map((column, index) => {
    const center = 220 + index * 380
    return (index ? line(center - 190, 122, center - 190, 528) : '')
      + label(column.title, center, 142, { size: 24, style: 'serif', align: 'center', maxWidth: 352 })
      + equation(column.tex, center, 179, { size: 27 })
      + numericMatrix(column.matrix, center, 223, maximum)
  }).join('')
    + label(`${data.samples.length} outer products averaged`, 220, 497, { size: 18, align: 'center' })
    + label('Retain all parameter interactions', 220, 525, { size: 16, fill: C.muted, align: 'center' })
    + label(`${dimension * (dimension - 1)} cross terms removed`, 600, 497, { size: 18, align: 'center' })
    + label('Only individual magnitudes remain', 600, 525, { size: 16, fill: C.muted, align: 'center' })
    + equation(`\\mu=(${data.mean.join(',')})^\\top`, 980, 499, { size: 22, maxWidth: 350 })
    + label(`c = ${scaleFraction(data.scale)}. Small residual omitted`, 980, 528, { size: 16, fill: C.muted, align: 'center' })
  return frame(
    'Build Fisher from shared gradients',
    'Average the sample outer products. A scaled outer product of the mean keeps the dominant pattern.',
    body + signedKey(563),
    {
      tag: 'Constructed example',
      description: 'Exact full Fisher, diagonal and scaled mean outer product from gradient-story-model. '
        + 'All displayed entries share one color scale. The mean and scale come from the same four illustrative gradients.',
    },
  )
}

function sharingCard() {
  const methods = ['ewc', 'replay', 'hybrid']
  const scenes = methods.map(method => model.sharingFocusScene(method, 3, 1))
  const fits = methods.map(method => model.sharingFit(model.sharingMovingPoint(method, 3, 1), 3, method).fit)
  assert.equal(model.sharingFeasibleRegions(3, 'ewc').length, 0)
  assert.deepEqual(fits, [[2, 3], [3], [1, 2, 3]])
  assert.deepEqual(scenes[1].regions, scenes[2].regions)
  assert.deepEqual(model.sharingReplayFit(model.sharingMovingPoint('replay', 3, 1), 3).fit, [1, 2])
  const surfaces = scenes.map(panel => surface(panel, { pose: model.homePose, zoom: 1.75, offsetY: 0.4 }))
  // One common crop around every actual region and path, with quiet terrain
  // retained behind them. No geometry, annotation, or endpoint is relocated.
  const bounds = commonBounds(surfaces, true, 20)
  let body = ''
  for (const [index, value] of [1, 2, 3].entries()) {
    const x = 43 + index * 116
    body += line(x, 127, x + 22, 127, C[`task${value}`], 3)
      + label(`Task ${value}`, x + 30, 133, { size: 17 })
  }
  body += line(415, 127, 444, 127, C.muted, 2, '5 4')
    + label('Generated examples', 455, 133, { size: 17 })
    + circle(664, 127, 4, C.ink) + label('Final model', 677, 133, { size: 17 })
    + label('Solid loops show original task-loss regions', 1158, 133,
      { size: 16, fill: C.muted, align: 'right' })
  const ingredients = ['Fisher penalty', 'Generated earlier examples', 'Replay + Fisher penalty']
  const readings = ['No common fit for all three', 'Fits replay. Loses original tasks', 'Keeps a shared solution']
  scenes.forEach((panel, index) => {
    const x = 42 + index * 380, center = x + 178
    body += (index ? line(x - 12, 153, x - 12, 530) : '')
      + label(panel.title, center, 177, { size: 27, style: 'serif', align: 'center' })
      + label(ingredients[index], center, 202, { size: 17, fill: C.muted, align: 'center' })
      + drawing(surfaces[index], x - 4, 218, 364, 229, bounds)
      + label(readings[index], center, 473, { size: 19, style: 'serif', align: 'center', maxWidth: 350 })
      + (index === 0
        ? equation(String.raw`\mathcal C_1\cap\mathcal C_2\cap\mathcal C_3=\varnothing`, center, 505, { size: 24 })
        : label(`Original task fit: ${fits[index].join(', ')}`, center, 503, { size: 18, align: 'center' }))
      + label(index === 0 ? 'Separate case: incompatible tasks' : 'Same case: a shared solution exists',
        center, 528, { size: 15, fill: C.muted, align: 'center' })
  })
  body += label('Shaded overlap: Tasks 1 + 2. Height: scaled original task loss. Fisher acts through the penalty.', 42, 561,
    { size: 17, fill: C.muted, maxWidth: 1116 })
  return frame(
    'EWC, replay, and shared solutions',
    'Final Task 3 states: local protection, replay drift, and a shared solution.',
    body,
    {
      tag: 'Illustrative paths',
      description: model.sharingScene(3, 1).description,
    },
  )
}

function metaCard() {
  const data = model.metaLearningConnection
  const [updates, locality, rank] = data.steps
  assert.equal(data.conditionTex, String.raw`1-\alpha\rho_i>0`)
  assert(locality.sharedTex.includes(String.raw`\simeq`))
  assert(rank.sharedTex.includes(String.raw`\simeq`))
  let body = label('Trust Region', 315, 137, { size: 27, style: 'serif', align: 'center' })
    + label('One-step MAML', 885, 137, { size: 27, style: 'serif', align: 'center' })
    + line(600, 120, 600, 213)
    + equation(updates.trustTex, 315, 180, { size: 29, maxWidth: 510 })
    + equation(updates.mamlTex, 885, 180, { size: 28, maxWidth: 510 })
    + label('Replay gradient + Fisher penalty gradient', 315, 209, { size: 16, fill: C.muted, align: 'center' })
    + equation(updates.sharedTex, 885, 211, { size: 21, fill: C.muted, maxWidth: 510 })
    + rect(42, 229, 1116, 48, mix(C.accent, C.paper, 0.055), 'rx="3"')
    + label('Stay local', 60, 259, { size: 18, style: 'serif' })
    + equation(locality.sharedTex, 712, 260, { size: 25, maxWidth: 846 })
    + equation(locality.trustTex, 315, 318, { size: 29, maxWidth: 510 })
    + equation(locality.mamlTex, 885, 318, { size: 29, maxWidth: 510 })
    + rect(42, 340, 1116, 48, mix(C.accent, C.paper, 0.055), 'rx="3"')
    + label('Use rank-1', 60, 370, { size: 18, style: 'serif' })
    + equation(`${rank.sharedTex}\\qquad\\|u_i\\|=1`, 712, 371, { size: 26, maxWidth: 846 })
    + equation(rank.trustTex, 315, 429, { size: 30, fill: C.accent, maxWidth: 510 })
    + equation(rank.mamlTex, 885, 429, { size: 30, fill: C.accent, maxWidth: 510 })
    + line(42, 450, 1158, 450)
    + label('Per-task descent direction', 61, 487, { size: 20, style: 'serif' })
    + equation(String.raw`-F_i\delta_i`, 413, 488, { size: 29, fill: C.accent })
    + label('when', 553, 486, { size: 18, fill: C.muted })
    + equation(data.conditionTex, 800, 488, { size: 29 })
    + equation(String.raw`\beta+\lambda>0,\qquad F_i\delta_i\ne0`, 598, 526, { size: 20, fill: C.muted })
    + label('Local, task-wise agreement. Scales differ across tasks. Summed updates need not match.', 600, 561,
      { size: 18, fill: C.muted, align: 'center', maxWidth: 1116 })
  return frame(
    'The local link to meta-learning',
    'Compare one earlier task. The current-task gradient remains in the training update.',
    body + equation(String.raw`\delta_i=\theta-\theta_i^\star`, 1158, 82, { size: 20, fill: C.muted, align: 'right' }),
    {
      description: `${data.introduction} ${data.conclusion} Source equations: ${data.source}. `
        + 'The positive-coefficient and nonzero-direction conditions are retained. This is a task-wise local limit.',
    },
  )
}

const cards = [
  ['fisher-comparison', fisherCard],
  ['fisher-construction', constructionCard],
  ['parameter-sharing', sharingCard],
  ['meta-learning', metaCard],
]
// Prepare all four before writing so a model or layout mismatch cannot leave
// an apparently successful partial set.
const rendered = cards.map(([id, render]) => ({ id, svg: render() }))
await fs.mkdir(output, { recursive: true })
await fs.mkdir(review, { recursive: true })
for (const { id, svg } of rendered) {
  assert(!svg.includes('<foreignObject'))
  const png = await sharp(Buffer.from(svg), { density: 144 })
    .resize(WIDTH, HEIGHT, { kernel: 'lanczos3' }).removeAlpha()
    .png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer()
  const metadata = await sharp(png).metadata()
  assert.equal(metadata.width, WIDTH)
  assert.equal(metadata.height, HEIGHT)
  assert.equal(metadata.format, 'png')
  const corner = await sharp(png).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer()
  assert.deepEqual([...corner], [245, 241, 232])
  await fs.writeFile(join(review, `${id}.svg`), svg)
  await fs.writeFile(join(output, `${id}.png`), png)
  console.log(`${relative(root, join(output, `${id}.png`))}: ${WIDTH}x${HEIGHT}, ${png.length} bytes, sha256 ${sha256(png)}`)
}
console.log('Exported four offline model-derived figures and four review SVGs.')
