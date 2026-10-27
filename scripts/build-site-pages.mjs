import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const [template, config, record, news, cvBytes] = await Promise.all([
  fs.readFile(path.join(dist, 'index.html'), 'utf8'),
  fs.readFile(path.join(root, 'src/data/config.json'), 'utf8').then(JSON.parse),
  fs.readFile(path.join(root, 'src/data/publications.json'), 'utf8').then(JSON.parse),
  fs.readFile(path.join(root, 'src/data/news.json'), 'utf8').then(JSON.parse),
  fs.readFile(path.join(root, 'public/cv.pdf')),
])
const origin = 'https://ndrsn0208.github.io'
const cv = `/cv.pdf?v=${createHash('sha256').update(cvBytes).digest('hex').slice(0, 12)}`
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
const link = (href, text) => `<a href="${escape(href)}">${escape(text)}</a>`
const paperHref = paper => paper.arxivId === '2605.07076' ? '/papers/self-consolidating-language-models.pdf' : paper.pdfUrl || paper.url || paper.arxivUrl || config.contacts.googleScholar
const paperRow = paper => `<article><p class="meta">${escape(paper.venue)} · ${paper.year}${paper.award ? ` · ${escape(paper.award)}` : ''}</p><h3>${link(paperHref(paper), paper.title)}</h3><p>${escape(paper.authors.join(', '))}</p>${paper.tldr ? `<p>${escape(paper.tldr)}</p>` : ''}</article>`
const selected = config.featuredPaperIds.map(id => record.publications.find(paper => paper.id === id || paper.arxivId === id)).filter(Boolean)
const title = 'Zekun Wang · Research & writing'
const researchDescription = 'Continual learning for deployment-time adaptation and generalization. Research, publications, and illustrated essays by Zekun Wang, a Computer Science PhD student at Georgia Tech.'
const education = [config.education, ...config.previousEducation].map(item => `<article><h3>${escape(item.institution)}</h3><p>${escape(item.degree)}, ${escape(item.field)} · ${item.startYear}–${item.endYear}${item.expected ? ' expected' : ''}</p>${item === config.education ? `<p>Advised by ${link(config.advisorUrl, config.advisor)}.</p>` : ''}${item.detail ? `<p>${escape(item.detail)}</p>` : ''}</article>`).join('')
const pages = [
  {
    route: '/', title, description: researchDescription, schema: 'Person',
    body: `<h1>Zekun Wang</h1><p class="lead">How can models keep learning after deployment?</p><p>${escape(config.bio)}</p><p>${escape(config.researchStatement)}</p><p>${link(`mailto:${config.contacts.email}`, config.contacts.email)} · ${link(config.contacts.googleScholar, 'Google Scholar')} · ${link('/about/', 'About me')}</p><section id="news"><h2>News</h2>${news.map(item => `<p><time>${escape(item.date)}</time> ${item.content.map(part => part.href ? link(part.href, part.text) : escape(part.text)).join('')}</p>`).join('')}</section><section id="writing"><h2>Inside the research</h2><article><h3>${link('/blog/continual-learning-diffusion-models/', 'Continual Learning Diffusion Models')}</h3><p>Learning new tasks while preserving earlier abilities.</p></article><article><h3>${link('/blog/self-consolidating-language-models/', 'Self-Consolidating Language Models')}</h3><p>Writing context into model weights at test time.</p></article></section><section id="selected-publications"><h2>Selected publications</h2>${selected.map(paperRow).join('')}<p>${link('/publications/', 'All publications')}</p></section>`,
  },
  {
    route: '/publications/', title: 'Publications · Zekun Wang', schema: 'CollectionPage',
    description: 'Publications by Zekun Wang on continual learning, compositionality, language models, reinforcement learning, concept learning, and diffusion models.',
    body: `<h1>Publications</h1><p>Research on learning, adaptation, and generalization.</p><p>${link(config.contacts.googleScholar, 'Google Scholar')}</p>${[...new Set(record.publications.map(paper => paper.year))].sort((a, b) => b - a).map(year => `<section><h2>${year}</h2>${record.publications.filter(paper => paper.year === year).map(paperRow).join('')}</section>`).join('')}`,
  },
  {
    route: '/about/', title: 'About · Zekun Wang', schema: 'AboutPage',
    description: 'Research vision, education, industry experience, academic service, and photography.',
    body: `<h1>About me</h1><p>${escape(config.bio)}</p><section><h2>Research</h2>${config.researchVision.map(paragraph => `<p>${escape(paragraph)}</p>`).join('')}</section><section id="education"><h2>Education</h2>${education}</section><section><h2>Industry experience</h2>${config.industryExperience.map(item => `<article><h3>${escape(item.organization)}</h3><p>${escape(item.role)} · ${escape(item.location)} · ${escape(item.dates)}</p></article>`).join('')}</section><section><h2>Academic service</h2>${config.academicService.map(item => `<p><strong>${escape(item.role)}</strong><br>${item.url ? link(item.url, item.title) : escape(item.title)}${item.note ? `<br>${escape(item.note)}` : ''}</p>`).join('')}</section><section id="photography"><h2>Photography</h2><p>${escape(config.personalNote)}</p><p>${link(config.contacts.instagram, 'See my photographs')}</p></section>`,
  },
  {
    route: '/cv/', title: 'Curriculum vitae · Zekun Wang', schema: 'ProfilePage',
    description: 'Curriculum vitae of Zekun Wang, PhD student in Computer Science at Georgia Tech.',
    body: `<h1>Curriculum vitae</h1><p>${escape(config.bio)}</p><p class="lead">${link(cv, 'Read the current CV (PDF)')}</p><section><h2>Research focus</h2><p>${escape(config.researchStatement)}</p></section><section><h2>Education</h2>${education}</section>`,
  },
]
const navigation = `<nav>${link('/', 'Overview')}<span>${link('/publications/', 'Publications')} ${link('/blog/', 'Blog')} ${link('/about/', 'About')} ${link('/cv/', 'CV')}</span></nav>`
for (const page of pages) {
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${escape(page.title)}</title>`)
  for (const [attribute, name, content] of [
    ['name', 'description', page.description], ['property', 'og:title', page.title],
    ['property', 'og:description', page.description], ['property', 'og:type', 'website'],
  ]) html = html.replace(new RegExp(`<meta ${attribute}="${name}" content="[^"]*"\\s*/?>`), `<meta ${attribute}="${name}" content="${escape(content)}" />`)
  const structured = { '@context': 'https://schema.org', '@type': page.schema, name: page.route === '/' ? config.name : page.title, url: `${origin}${page.route}`, description: page.description, ...(page.route === '/' ? { affiliation: { '@type': 'CollegeOrUniversity', name: config.affiliation }, sameAs: [config.contacts.googleScholar, config.contacts.linkedin] } : {}) }
  html = html.replace('</head>', `<link rel="canonical" href="${origin}${page.route}" />
    <meta property="og:url" content="${origin}${page.route}" />
    <meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Zekun Wang. Continual learning for adaptation and generalization." />
    <meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${escape(page.title)}" />
    <meta name="twitter:description" content="${escape(page.description)}" /><meta name="twitter:image" content="${origin}/site-card.png" />
    <script type="application/ld+json">${JSON.stringify(structured).replace(/</g, '\\u003c')}</script></head>`)
  html = html.replace('<div id="root"></div>', `<div id="root"></div><noscript><style>body{background:#f5f1e8;color:#242923;font:19px/1.6 Georgia,serif}#root{display:none}.site-static{max-width:940px;margin:auto;padding:32px 24px}.site-static nav{display:flex;justify-content:space-between;gap:24px;padding-bottom:24px;border-bottom:1px solid #cfcec1}.site-static nav span{display:flex;flex-wrap:wrap;gap:18px}.site-static h1{font-size:clamp(42px,7vw,80px);font-weight:400;line-height:1.1;margin:60px 0 24px}.site-static h2{font-size:34px;font-weight:400;margin:40px 0 20px}.site-static h3{font-size:24px;font-weight:400;margin:12px 0}.site-static .lead{font-size:28px}.site-static article{border-top:1px solid #cfcec1;padding:20px 0}.site-static p{margin:12px 0}.site-static a{text-decoration:underline;text-underline-offset:3px}.site-static .meta,.site-static time{color:#60675b;font:16px/1.5 system-ui,sans-serif}.site-static footer{border-top:1px solid #cfcec1;margin-top:56px;padding-top:24px}</style><div class="site-static">${navigation}<main>${page.body}</main><footer>${link(`mailto:${config.contacts.email}`, config.contacts.email)}</footer></div></noscript>`)
  const directory = path.join(dist, page.route)
  await fs.mkdir(directory, { recursive: true })
  await fs.writeFile(path.join(directory, 'index.html'), html)
}
const sitemapPaths = [...pages.map(page => page.route), '/blog/', '/blog/self-consolidating-language-models/', '/blog/continual-learning-diffusion-models/']
await fs.writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapPaths.map(route => `<url><loc>${origin}${route}</loc></url>`).join('')}</urlset>\n`)
await fs.writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /unlisted/\nSitemap: ${origin}/sitemap.xml\n`)
console.log('Built overview, publications, about, and CV pages with metadata and static reading fallbacks.')
