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
const [
  { scolArticle, paragraphCitations, paragraphParts },
  { diffusionArticle },
  { diffusionTextParts, diffusionPath, diffusionImage, diffusionImageAlt, diffusionPapers },
  { diffusionRobot },
  diffusionEvidence,
  { metaLearningConnection },
  { recoveryPanels, recoveryPaper },
  { diffusionFigureShares, diffusionFigurePath, diffusionShareBase },
] = await Promise.all([
  loadSource('src/blog/scol/article.ts'),
  loadSource('src/blog/diffusion/article.ts'),
  loadSource('src/blog/diffusion/format.ts'),
  loadSource('src/blog/diffusion/media.ts'),
  loadSource('src/blog/diffusion/evidence.ts'),
  loadSource('src/blog/diffusion/meta-learning-connection.ts'),
  loadSource('src/blog/diffusion/recovery-data.ts'),
  loadSource('src/blog/diffusion/figure-shares.ts'),
])
if (diffusionShareBase !== diffusionPath) throw new Error('Figure-share routes must belong to the diffusion article.')
const origin = 'https://ndrsn0208.github.io'
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character])
const staticMath = (tex, label) => `<div role="img" aria-label="${escapeHtml(label)}" style="overflow-x:auto;font-size:20px;padding:4px 0">${katex.renderToString(tex, { displayMode: true, throwOnError: true, output: 'html' })}</div>`
const metaDerivationFallback = `<figure id="meta-learning-derivation"><h3>${escapeHtml(metaLearningConnection.title)}</h3><p>${escapeHtml(metaLearningConnection.introduction)}</p>${metaLearningConnection.steps.map(step => `<section><h4>${escapeHtml(step.title)}</h4><p>${escapeHtml(step.text)}</p>${staticMath(step.sharedTex, step.sharedLabel)}<p><strong>Trust Region</strong></p>${staticMath(step.trustTex, step.trustLabel)}<p><strong>One-step MAML</strong></p>${staticMath(step.mamlTex, step.mamlLabel)}<p><a href="${escapeHtml(step.source)}">${escapeHtml(step.sourceLabel)}</a></p></section>`).join('')}${staticMath(metaLearningConnection.conditionTex, metaLearningConnection.conditionLabel)}<figcaption>${escapeHtml(metaLearningConnection.conclusion)}</figcaption></figure>`
const recoveryFallback = `<figure id="meta-learning-explorer"><h3>Fast recovery during continual learning</h3>${recoveryPanels.map(panel => `<h4>${escapeHtml(panel.title)}</h4><p>${escapeHtml(panel.measure)}</p><a href="${escapeHtml(panel.src)}"><img src="${escapeHtml(panel.src)}" alt="${escapeHtml(panel.alt)}" width="${panel.width}" height="${panel.height}" loading="lazy" style="display:block;width:100%;height:auto" /></a>`).join('')}<figcaption><a href="${escapeHtml(recoveryPaper)}">Original Figure 2 from the paper.</a></figcaption></figure>`

const pages = [
  {
    route: '/blog/',
    title: 'Research notes · Zekun Wang',
    description: 'Research notes on how models learn, adapt, and retain what they know.',
    article: false,
    image: diffusionImage,
    imageAlt: diffusionImageAlt,
  },
  {
    route: '/blog/self-consolidating-language-models/',
    title: 'Self-Consolidating Language Models · Zekun Wang',
    description: `${scolArticle.subtitle}. An illustrated account of continual context consolidation, sparse updates, and learning to adapt while limiting forgetting.`,
    article: true,
    image: '/blog-assets/scol/social-card.png',
    imageAlt: `${scolArticle.title}. ${scolArticle.subtitle}.`,
    headline: scolArticle.title,
    date: '2026-09-25',
    authors: ['Zekun Wang', 'Anant Gupta', 'Zihan Dong', 'Christopher J. MacLellan'],
  },
  {
    route: diffusionPath,
    title: `${diffusionArticle.title} · Zekun Wang`,
    description: diffusionArticle.description,
    article: true,
    image: diffusionImage,
    imageAlt: diffusionImageAlt,
    headline: diffusionArticle.title,
    date: diffusionArticle.date,
    authors: ['Zekun Wang'],
    diffusion: true,
  },
  ...diffusionFigureShares.map(figure => ({
    route: diffusionFigurePath(figure.id),
    title: `${figure.title} · ${diffusionArticle.title}`,
    description: figure.description,
    article: true,
    image: figure.image,
    imageAlt: figure.imageAlt,
    headline: figure.title,
    date: diffusionArticle.date,
    authors: ['Zekun Wang'],
    diffusion: true,
    figure,
  })),
]

for (const page of pages) {
  const imageFile = await fs.readFile(path.join(root, 'public', new URL(page.image, origin).pathname))
  if (imageFile.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(`Share card must be a PNG: ${page.image}`)
  if (imageFile.length >= 5_000_000) throw new Error(`Share card exceeds X's 5 MB limit: ${page.image}`)
  const imageWidth = imageFile.readUInt32BE(16)
  const imageHeight = imageFile.readUInt32BE(20)
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
  for (const [attribute, name, content] of [
    ['name', 'description', page.description],
    ['property', 'og:title', page.title],
    ['property', 'og:description', page.description],
    ['property', 'og:type', page.article ? 'article' : 'website'],
    ['property', 'og:image', `${origin}${page.image}`],
  ]) {
    html = html.replace(new RegExp(`<meta ${attribute}="${name}" content="[^"]*"\\s*/?>`), `<meta ${attribute}="${name}" content="${escapeHtml(content)}" />`)
  }
  const structured = {
    '@context': 'https://schema.org',
    '@type': page.article ? 'Article' : 'CollectionPage',
    headline: page.headline ?? 'Research notes',
    description: page.description,
    url: `${origin}${page.route}`,
    image: `${origin}${page.image}`,
    ...(page.figure ? {
      isPartOf: { '@type': 'Article', headline: diffusionArticle.title, url: `${origin}${diffusionPath}` },
      mainEntity: { '@type': 'ImageObject', contentUrl: `${origin}${page.image}`, caption: page.imageAlt },
    } : {}),
    ...(page.diffusion && !page.figure ? {
      video: {
        '@type': 'VideoObject',
        name: 'CW10 hammer before and after nine more tasks',
        description: diffusionRobot.caption,
        thumbnailUrl: `${origin}${diffusionRobot.poster}`,
        contentUrl: `${origin}${diffusionRobot.src}`,
        encodingFormat: 'video/mp4',
        duration: `PT${diffusionRobot.durationSeconds}S`,
        width: diffusionRobot.width,
        height: diffusionRobot.height,
      },
    } : {}),
    ...(page.article ? {
      datePublished: page.date,
      inLanguage: 'en',
      author: page.authors.map(name => ({ '@type': 'Person', name })),
    } : {}),
  }
  html = html.replace('</head>', `
    <link rel="canonical" href="${origin}${page.route}" />
    <meta property="og:url" content="${origin}${page.route}" />
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
  const paragraphs = (texts, id = '') => texts.map((text, index) => {
    const citations = (paragraphCitations[id]?.[index] ?? [])
      .map(reference => `<a href="#reference-${reference}">${reference}</a>`).join(', ')
    const formatted = paragraphParts(id, index, text)
      .map(part => part.emphasis ? `<strong>${escapeHtml(part.text)}</strong>` : escapeHtml(part.text)).join('')
    return `<p>${formatted}${citations ? `<sup>${citations}</sup>` : ''}</p>`
  }).join('\n')
  const references = `<h2>Further reading</h2><ol>${scolArticle.references.map((reference, index) => `<li id="reference-${index + 1}"><a href="${escapeHtml(reference.url)}">${escapeHtml(reference.title)}</a></li>`).join('\n')}</ol>`
  const diffusionParagraphs = (texts, citations = []) => texts.map((text, index) => {
    const referenceLinks = index === texts.length - 1 ? citations.map(id => `<a href="#reference-${escapeHtml(id)}">${diffusionArticle.references.findIndex(reference => reference.id === id) + 1}</a>`).join(', ') : ''
    return `<p>${diffusionTextParts(text).map(part => part.emphasis ? `<strong>${escapeHtml(part.text)}</strong>` : escapeHtml(part.text)).join('')}${referenceLinks ? `<sup>${referenceLinks}</sup>` : ''}</p>`
  }).join('\n')
  const diffusionReferences = `<h2>Further reading</h2><ol>${diffusionArticle.references.map(reference => `<li id="reference-${escapeHtml(reference.id)}"><a href="${escapeHtml(reference.url)}">${escapeHtml(reference.title)}</a><p>${escapeHtml(reference.detail)}</p></li>`).join('\n')}</ol>`
  const diffusionPaperLinks = `<section id="papers"><h2>Read the full work</h2>${diffusionPapers.map(paper => `<article><a href="${paper.pdf}"><img src="${paper.cover}" alt="First page of ${escapeHtml(paper.title)}" width="180" height="233" loading="lazy" style="display:block;height:auto;max-width:100%;margin-top:2em" /></a><p><strong>${escapeHtml(paper.venue)}</strong></p><h3><a href="${paper.pdf}">${escapeHtml(paper.title)}</a></h3><p>${escapeHtml(paper.authors)}</p><p><a href="${paper.pdf}">Read PDF</a></p></article>`).join('\n')}</section>`
  const robotFallback = `<figure><video controls muted loop playsinline preload="metadata" poster="${diffusionRobot.poster}" width="${diffusionRobot.width}" height="${diffusionRobot.height}" style="display:block;width:100%;height:auto" aria-label="${escapeHtml(diffusionRobot.alt)}"><source src="${diffusionRobot.src}" type="video/mp4" /><a href="${diffusionRobot.gif}">View the original animation</a></video><figcaption>${escapeHtml(diffusionRobot.caption)}</figcaption></figure>`
  const diffusionBody = `<h1>${escapeHtml(diffusionArticle.title)}</h1><p>${escapeHtml(diffusionArticle.subtitle)}</p><p>Zekun Wang · Georgia Institute of Technology</p>${robotFallback}${diffusionParagraphs(diffusionArticle.introduction)}${diffusionArticle.sections.map(section => `<section id="${escapeHtml(section.id)}"><h2>${escapeHtml(section.title)}</h2>${diffusionParagraphs(section.paragraphs, section.citations)}${section.id === 'meta-learning' ? `${metaDerivationFallback}${diffusionParagraphs(section.recoveryIntro ?? [], ['meta-alignment', 'recovery-curves'])}${recoveryFallback}` : ''}${section.id === 'results' ? diffusionParagraphs(diffusionEvidence.evidenceSummaries ?? []) : ''}${diffusionParagraphs(section.afterFigure ?? [])}${section.technicalNote ? `<details><summary>The assumptions behind this connection</summary><p>${escapeHtml(section.technicalNote)}</p></details>` : ''}</section>`).join('\n')}${diffusionPaperLinks}${diffusionReferences}`
  const sharedFigureBody = page.figure ? `<h1>${escapeHtml(page.figure.title)}</h1><p>${escapeHtml(page.figure.description)}</p><figure><a href="${escapeHtml(page.figure.image)}"><img src="${escapeHtml(page.figure.image)}" alt="${escapeHtml(page.figure.imageAlt)}" width="${imageWidth}" height="${imageHeight}" style="display:block;width:100%;height:auto" /></a></figure><p><a href="${diffusionPath}#${escapeHtml(page.figure.anchor)}">Explore this figure in the article</a></p><p>From <a href="${diffusionPath}">${escapeHtml(diffusionArticle.title)}</a> by Zekun Wang.</p>` : ''
  const body = page.figure ? sharedFigureBody : page.diffusion ? diffusionBody : page.article
    ? `<h1>${escapeHtml(scolArticle.title)}</h1><p>${escapeHtml(scolArticle.subtitle)}</p><p>Zekun Wang, Anant Gupta, Zihan Dong, and Christopher J. MacLellan</p>${paragraphs([scolArticle.deck, ...scolArticle.introduction])}${scolArticle.sections.map(section => `<section id="${section.id}"><h2>${escapeHtml(section.title)}</h2>${paragraphs(section.paragraphs, section.id)}${paragraphs(section.afterFigure ?? [], `${section.id}-after`)}</section>`).join('\n')}${paragraphs(scolArticle.closing)}<p><a href="/papers/self-consolidating-language-models.pdf">Read the full paper (PDF)</a></p>${references}`
    : `<h1>Research notes</h1><p>${escapeHtml(page.description)}</p><h2><a href="${diffusionPath}">${escapeHtml(diffusionArticle.title)}</a></h2><p>${escapeHtml(diffusionArticle.subtitle)}</p><h2><a href="/blog/self-consolidating-language-models/">${escapeHtml(scolArticle.title)}</a></h2><p>${escapeHtml(scolArticle.subtitle)}</p>`
  html = html.replace('<div id="root"></div>', `<div id="root"></div><noscript><style>body{background:#f5f1e8;color:#292c29;font:20px/1.6 Georgia,serif}#root{display:none}.blog-static{max-width:700px;margin:60px auto;padding:0 24px}.blog-static h1{line-height:1.1}.blog-static h2{margin-top:2em}.blog-static a{text-decoration:underline}</style><article class="blog-static"><a href="/">Zekun Wang</a>${body}</article></noscript>`)
  const directory = path.join(dist, page.route)
  await fs.mkdir(directory, { recursive: true })
  await fs.writeFile(path.join(directory, 'index.html'), html)
}
console.log(`Built blog pages and ${diffusionFigureShares.length} figure-share pages with individual social cards and static reading fallbacks.`)
