import fs from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const template = await fs.readFile(path.join(dist, 'index.html'), 'utf8')
const source = await fs.readFile(path.join(root, 'src/blog/scol/article.ts'), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const { scolArticle, paragraphCitations, paragraphParts } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
const origin = 'https://ndrsn0208.github.io'
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character])

const pages = [
  {
    route: '/blog/',
    title: 'Research notes · Zekun Wang',
    description: 'Research notes on how models learn, adapt, and retain what they know.',
    article: false,
  },
  {
    route: '/blog/self-consolidating-language-models/',
    title: 'Self-Consolidating Language Models · Zekun Wang',
    description: `${scolArticle.subtitle}. An illustrated account of continual context consolidation, sparse updates, and learning to adapt while limiting forgetting.`,
    article: true,
  },
]

for (const page of pages) {
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
  for (const [attribute, name, content] of [
    ['name', 'description', page.description],
    ['property', 'og:title', page.title],
    ['property', 'og:description', page.description],
    ['property', 'og:type', page.article ? 'article' : 'website'],
    ['property', 'og:image', `${origin}/blog-assets/scol/social-card.png`],
  ]) {
    html = html.replace(new RegExp(`<meta ${attribute}="${name}" content="[^"]*"\\s*/?>`), `<meta ${attribute}="${name}" content="${escapeHtml(content)}" />`)
  }
  const structured = {
    '@context': 'https://schema.org',
    '@type': page.article ? 'Article' : 'CollectionPage',
    headline: page.article ? scolArticle.title : 'Research notes',
    description: page.description,
    url: `${origin}${page.route}`,
    image: `${origin}/blog-assets/scol/social-card.png`,
    ...(page.article ? {
      datePublished: '2026-09-25',
      inLanguage: 'en',
      author: ['Zekun Wang', 'Anant Gupta', 'Zihan Dong', 'Christopher J. MacLellan'].map(name => ({ '@type': 'Person', name })),
    } : {}),
  }
  html = html.replace('</head>', `
    <link rel="canonical" href="${origin}${page.route}" />
    <meta property="og:url" content="${origin}${page.route}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Self-Consolidating Language Models. Writing context into model weights at test time." />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${origin}/blog-assets/scol/social-card.png" />
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
  const body = page.article
    ? `<h1>${escapeHtml(scolArticle.title)}</h1><p>${escapeHtml(scolArticle.subtitle)}</p><p>Zekun Wang, Anant Gupta, Zihan Dong, and Christopher J. MacLellan</p>${paragraphs([scolArticle.deck, ...scolArticle.introduction])}${scolArticle.sections.map(section => `<section id="${section.id}"><h2>${escapeHtml(section.title)}</h2>${paragraphs(section.paragraphs, section.id)}${paragraphs(section.afterFigure ?? [], `${section.id}-after`)}</section>`).join('\n')}${paragraphs(scolArticle.closing)}<p><a href="/papers/self-consolidating-language-models.pdf">Read the full paper (PDF)</a></p>${references}`
    : `<h1>Research notes</h1><p>${escapeHtml(page.description)}</p><h2><a href="/blog/self-consolidating-language-models/">${escapeHtml(scolArticle.title)}</a></h2><p>${escapeHtml(scolArticle.subtitle)}</p>`
  html = html.replace('<div id="root"></div>', `<div id="root"></div><noscript><style>body{background:#f5f1e8;color:#292c29;font:20px/1.6 Georgia,serif}#root{display:none}.blog-static{max-width:700px;margin:60px auto;padding:0 24px}.blog-static h1{line-height:1.1}.blog-static h2{margin-top:2em}.blog-static a{text-decoration:underline}</style><article class="blog-static"><a href="/">Zekun Wang</a>${body}</article></noscript>`)
  const directory = path.join(dist, page.route)
  await fs.mkdir(directory, { recursive: true })
  await fs.writeFile(path.join(directory, 'index.html'), html)
}
console.log('Built blog pages with article metadata and a static reading fallback.')
