import type { Publication } from '@/types'
import { comparePublications } from '@/lib/publications'

const origin = 'https://ndrsn0208.github.io'
const scolPdf = '/papers/self-consolidating-language-models.pdf'
const diffusionArticle = '/blog/continual-learning-diffusion-models/'

// These short introductions describe the authored homepage selection.
const contributions: Record<string, string> = {
  '2605.07076': 'Learns where to update a language model as new context arrives.',
  '2602.02417': 'Connects replay and Fisher trust regions to a local form of meta-learning.',
  '2605.07078': 'Discovers and combines concepts in a pretrained diffusion model at test time.',
  '2509.23593': 'Uses a compact Fisher approximation with replay to reduce forgetting in diffusion models.',
  '2405.13828': 'Studies interactive language learning through trials and demonstrations.',
}

const articles: Record<string, string> = {
  '2605.07076': '/blog/self-consolidating-language-models/',
  '2602.02417': diffusionArticle,
  '2509.23593': diffusionArticle,
}

export function publicationContribution(paper: Publication) {
  return contributions[paper.arxivId ?? '']
}

export function safePublicationHref(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined
  try {
    const url = new URL(value, origin)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return undefined
    return url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : url.href
  } catch {
    return undefined
  }
}

export function publicationResources(paper: Publication) {
  const reviewed = paper.arxivId === '2605.07076'
  const pdf = safePublicationHref(reviewed ? scolPdf : paper.pdfUrl)
  const canonical = safePublicationHref(paper.url)
  const arxiv = safePublicationHref(paper.arxivUrl)
  const html = paper.arxivHtmlAvailable ? safePublicationHref(paper.arxivHtmlUrl) : undefined
  const scholar = safePublicationHref(paper.scholarUrl)
  const artifacts: { label: string, href: string }[] = []
  const add = (label: string, href: string | undefined) => {
    if (href && !artifacts.some(link => link.href === href)) artifacts.push({ label, href })
  }
  add('PDF', pdf)
  add('Paper', canonical)
  add('arXiv', arxiv)
  add('arXiv HTML', html)
  add('Scholar', scholar)
  return {
    primary: reviewed ? pdf : canonical ?? arxiv ?? pdf ?? html ?? scholar,
    artifacts,
    article: articles[paper.arxivId ?? ''],
  }
}

export function publicationSummary(paper: Publication) {
  return (paper.summary || paper.tldr || '')
    .replace(/\s+—\s+(.+?)\s+—\s+/g, ' ($1) ')
    .replace(/\s*—\s*/g, ', ')
    .replace(/;\s*(\S?)/g, (_, next: string) => `. ${next.toUpperCase()}`)
}

function searchText(value: string) {
  return value.normalize('NFKD').replace(/\p{M}/gu, '')
    .replace(/[‐‑‒–—−]/g, '-').replace(/[‘’]/g, "'").toLocaleLowerCase()
}

export function filterPublications(record: readonly Publication[], query: string, topic: string) {
  const terms = searchText(query).trim().split(/\s+/).filter(Boolean)
  return record.filter(paper => {
    if (topic && !paper.tags.includes(topic)) return false
    const text = searchText([
      paper.title, paper.venue, paper.year, paper.arxivId, paper.award,
      ...paper.authors, ...paper.tags, paper.summary, paper.tldr,
      publicationContribution(paper),
    ].join(' '))
    return terms.every(term => text.includes(term))
  }).sort(comparePublications)
}

const texEscapes: Record<string, string> = {
  '\\': '\\textbackslash{}', '{': '\\{', '}': '\\}', '&': '\\&',
  '%': '\\%', '$': '\\$', '#': '\\#', '_': '\\_', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}',
}
const tex = (text: string) => text.replace(/[\\{}&%$#_~^]/g, character => texEscapes[character])

export function publicationBibtex(paper: Publication) {
  const journal = paper.venue.match(/^(Cognitive Systems Research)\s+(\d+)\s+\(\d{4}\),\s*(\d+)$/)
  const conference = /\b(NeurIPS|ICLR|ICML|AAAI|ACL|NAACL|CogSci|NeuS|LREC-COLING|ICOTS|Advances in Cognitive Systems)\b/.test(paper.venue)
  const type = journal ? 'article' : conference ? 'inproceedings' : 'misc'
  const fields: [string, string][] = [
    ['title', `{${tex(paper.title)}}`],
    ['author', paper.authors.map(tex).join(' and ')],
    ['year', String(paper.year)],
    [journal ? 'journal' : conference ? 'booktitle' : 'howpublished', tex(journal?.[1] ?? paper.venue)],
  ]
  if (journal) fields.push(['volume', journal[2]], ['pages', journal[3]])
  if (paper.arxivId) fields.push(['eprint', tex(paper.arxivId)], ['archivePrefix', 'arXiv'])
  const canonical = safePublicationHref(paper.url)
  if (canonical?.startsWith('https://doi.org/')) {
    fields.push(['doi', canonical.slice('https://doi.org/'.length)])
  }
  const url = canonical ?? safePublicationHref(paper.arxivUrl) ?? publicationResources(paper).primary
  if (url) fields.push(['url', new URL(url, origin).href.replace(/{/g, '%7B').replace(/}/g, '%7D')])
  const key = paper.id.replace(/[^a-zA-Z0-9_-]/g, '')
  return `@${type}{${key},\n${fields.map(([name, value]) => `  ${name} = {${value}}`).join(',\n')}\n}`
}
