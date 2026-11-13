// After the site is built, writes a real page for the Writing index, for each
// essay, and for each figure. Every page carries its own title, description and
// share image for crawlers, and the complete text for readers without JavaScript.
// Every essay comes from the same shape, so they are written by the same code.

import fs from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'
import katex from 'katex'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const template = await fs.readFile(path.join(dist, 'index.html'), 'utf8')
async function loadSource(relativePath) {
  const source = await fs.readFile(path.join(root, relativePath), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
}
const [{ essayParts, essayCard }, { diffusionEssay }, { scolEssay }, { compositionEssay }, { recording }, record] = await Promise.all([
  loadSource('src/blog/essay/format.ts'),
  loadSource('src/blog/diffusion/article.ts'),
  loadSource('src/blog/scol/article.ts'),
  loadSource('src/blog/composition/article.ts'),
  loadSource('src/blog/diffusion/media.ts'),
  fs.readFile(path.join(root, 'src/data/publications.json'), 'utf8').then(JSON.parse),
])
const essays = [compositionEssay, diffusionEssay, scolEssay]
const origin = 'https://ndrsn0208.github.io'
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character])

function words(essay, text) {
  return essayParts(text).map(part => {
    if (part.kind === 'strong') return `<strong>${escapeHtml(part.text)}</strong>`
    if (part.kind === 'cite') {
      const at = essay.references.findIndex(reference => reference.id === part.text)
      if (at < 0) throw new Error(`${essay.name} cites an unknown reference: ${part.text}`)
      return `<sup><a href="#ref-${escapeHtml(part.text)}">${at + 1}</a></sup>`
    }
    return escapeHtml(part.text)
  }).join('')
}
const math = (tex, label) => `<div role="math" aria-label="${escapeHtml(label)}" style="overflow-x:auto;padding:4px 0">${katex.renderToString(tex, { displayMode: true, throwOnError: true, output: 'html' })}</div>`
function figure(essay, id) {
  const spec = essay.exhibits[id]
  if (!spec) throw new Error(`${essay.name} has no figure named ${id}`)
  const card = essayCard(essay.id, id)
  const steps = spec.steps ? `<ol>${spec.steps.map(step => `<li>${escapeHtml(step.say)}</li>`).join('')}</ol>` : ''
  return `<figure id="figure-${escapeHtml(id)}"><a href="${card}"><img src="${card}" alt="${escapeHtml(spec.title)}" width="1200" height="630" loading="lazy" style="display:block;width:100%;height:auto" /></a><figcaption>${escapeHtml(spec.description)}</figcaption>${steps}</figure>`
}
const authorLine = essay => essay.authors.map(author => author.name).join(', ')
function paper(id) {
  const entry = record.publications.find(item => item.id === id)
  if (!entry) throw new Error(`No publication with id ${id}`)
  const href = entry.arxivId === '2605.07076' ? '/papers/self-consolidating-language-models.pdf' : entry.pdfUrl || entry.url || entry.arxivUrl
  return `<p><a href="${escapeHtml(href)}">${escapeHtml(entry.title)}</a><br />${escapeHtml(entry.authors.join(', '))}. ${escapeHtml(entry.venue)}.</p>`
}
function essayBody(essay) {
  const sections = essay.sections.map(section => `<section id="${escapeHtml(section.id)}"><h2>${escapeHtml(section.heading)}</h2>${section.blocks.map(block => {
    if ('p' in block) return `<p>${words(essay, block.p)}</p>`
    if ('math' in block) return math(block.math, block.label)
    return figure(essay, block.exhibit)
  }).join('\n')}</section>`).join('\n')
  const references = `<section id="references"><h2>References</h2><ol>${essay.references.map(reference => `<li id="ref-${escapeHtml(reference.id)}"><a href="${escapeHtml(reference.url)}">${escapeHtml(reference.title)}</a>${reference.detail ? `<br />${escapeHtml(reference.detail)}` : ''}</li>`).join('\n')}</ol></section>`
  return `<h1>${escapeHtml(essay.name)}<br />${escapeHtml(essay.headline)}</h1><p>${escapeHtml(authorLine(essay))}. ${escapeHtml(essay.affiliation)}.</p>${figure(essay, essay.lead)}${essay.summary.map(paragraph => `<p>${words(essay, paragraph)}</p>`).join('\n')}${sections}<section id="papers"><h2>${essay.papers.length > 1 ? 'The papers' : 'The paper'}</h2>${essay.papers.map(paper).join('\n')}</section>${references}`
}
function figureBody(essay, id) {
  const spec = essay.exhibits[id]
  const card = essayCard(essay.id, id)
  return `<h1>${escapeHtml(spec.title)}</h1><p>${escapeHtml(spec.description)}</p><figure><a href="${card}"><img src="${card}" alt="${escapeHtml(spec.title)}" width="1200" height="630" style="display:block;width:100%;height:auto" /></a></figure><p><a href="${essay.path}#figure-${escapeHtml(id)}">Open this figure in the essay</a></p><p>From <a href="${essay.path}">${escapeHtml(essay.name)}</a>.</p>`
}

const pages = [
  {
    route: '/blog/',
    title: 'Writing · Zekun Wang',
    description: 'Research essays on compositional generalization and continual learning in diffusion models, and on continual context consolidation in language models.',
    image: diffusionEssay.image,
    imageAlt: diffusionEssay.imageAlt,
    body: `<h1>Writing</h1>${essays.map(essay => `<h2><a href="${essay.path}">${escapeHtml(essay.name)}</a></h2><p>${escapeHtml(essay.headline)}.</p>`).join('')}`,
  },
  ...essays.flatMap(essay => [
    {
      route: essay.path,
      title: `${essay.name} · Zekun Wang`,
      description: essay.description,
      image: essay.image,
      imageAlt: essay.imageAlt,
      essay,
      body: essayBody(essay),
    },
    // A figure's own page, and every earlier address for it.
    ...Object.entries(essay.exhibits).flatMap(([id, spec]) => [id, ...(spec.aliases ?? [])].map(name => ({
      route: `${essay.path}figures/${name}/`,
      canonical: `${essay.path}figures/${id}/`,
      title: `${spec.title} · ${essay.name}`,
      description: spec.description,
      image: essayCard(essay.id, id),
      imageAlt: spec.description,
      essay,
      figure: spec,
      body: figureBody(essay, id),
    }))),
  ]),
]

for (const page of pages) {
  const imageFile = await fs.readFile(path.join(root, 'public', new URL(page.image, origin).pathname)).catch(() => {
    throw new Error(`Missing share image ${page.image}. Run npm run blog:figure-cards.`)
  })
  if (imageFile.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(`Share card must be a PNG: ${page.image}`)
  if (imageFile.length >= 5_000_000) throw new Error(`Share card exceeds X's 5 MB limit: ${page.image}`)
  const imageWidth = imageFile.readUInt32BE(16)
  const imageHeight = imageFile.readUInt32BE(20)
  const address = `${origin}${page.canonical ?? page.route}`
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
  for (const [attribute, name, content] of [
    ['name', 'description', page.description],
    ['property', 'og:title', page.title],
    ['property', 'og:description', page.description],
    ['property', 'og:type', page.essay ? 'article' : 'website'],
    ['property', 'og:image', `${origin}${page.image}`],
  ]) {
    html = html.replace(new RegExp(`<meta ${attribute}="${name}" content="[^"]*"\\s*/?>`), `<meta ${attribute}="${name}" content="${escapeHtml(content)}" />`)
  }
  const structured = {
    '@context': 'https://schema.org',
    '@type': page.essay ? 'Article' : 'CollectionPage',
    headline: page.figure ? page.figure.title : page.essay ? `${page.essay.name}: ${page.essay.headline}` : 'Writing',
    description: page.description,
    url: address,
    image: `${origin}${page.image}`,
    ...(page.figure ? {
      isPartOf: { '@type': 'Article', headline: page.essay.name, url: `${origin}${page.essay.path}` },
      mainEntity: { '@type': 'ImageObject', contentUrl: `${origin}${page.image}`, caption: page.imageAlt },
    } : {}),
    ...(page.essay?.id === 'diffusion' && !page.figure ? {
      video: {
        '@type': 'VideoObject',
        name: recording.name,
        description: recording.description,
        thumbnailUrl: `${origin}${recording.still}`,
        contentUrl: `${origin}${recording.src}`,
        encodingFormat: 'video/mp4',
        duration: `PT${recording.seconds}S`,
        width: recording.width,
        height: recording.height,
      },
    } : {}),
    ...(page.essay ? {
      datePublished: page.essay.date,
      inLanguage: 'en',
      author: page.essay.authors.map(author => ({ '@type': 'Person', name: author.name })),
    } : {}),
  }
  html = html.replace('</head>', `
    <link rel="canonical" href="${address}" />
    <meta property="og:url" content="${address}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="${imageWidth}" />
    <meta property="og:image:height" content="${imageHeight}" />
    <meta property="og:image:alt" content="${escapeHtml(page.imageAlt)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${origin}${page.image}" />
    <meta name="twitter:image:alt" content="${escapeHtml(page.imageAlt)}" />
    <script type="application/ld+json">${JSON.stringify(structured).replace(/</g, '\\u003c')}</script>
  </head>`)
  html = html.replace('<div id="root"></div>', `<div id="root"></div><noscript><style>html{background:#ffffff}body{background:#ffffff;color:#000000;font:19px/1.62 "Helvetica Neue",Helvetica,Arial,system-ui,sans-serif}#root{display:none}.blog-static{max-width:720px;margin:60px auto;padding:0 24px}.blog-static h1{font-size:clamp(34px,6vw,56px);font-weight:400;line-height:1.06;letter-spacing:-.04em}.blog-static h2{margin-top:2em;font-weight:400;letter-spacing:-.02em}.blog-static figure{margin:2em 0}.blog-static figcaption,.blog-static figure ol{font-size:17px;line-height:1.5;margin-top:12px}.blog-static [id]{scroll-margin-top:24px}.blog-static a{text-decoration:underline}</style><article class="blog-static"><a href="/">Zekun Wang</a>${page.body}</article></noscript>`)
  const directory = path.join(dist, page.route)
  await fs.mkdir(directory, { recursive: true })
  await fs.writeFile(path.join(directory, 'index.html'), html)
}
const figures = pages.filter(page => page.figure).length
console.log(`Built the Writing index, ${essays.length} essays, and ${figures} figure pages, each with its own share image and static text.`)
