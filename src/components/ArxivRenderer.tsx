import { useEffect, useMemo, useState } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface Props {
  arxivId: string
  /** When the cached HTML doesn't load, the parent renders its own fallback. */
  onUnavailable?: () => void
}

interface TocEntry {
  id: string
  level: 2 | 3
  text: string
}

/* Re-render arxiv's HTML5 (LaTeXML) output inside the site's design system.

   Strategy:
   - Lazy-fetch /arxiv-cache/{id}.html
   - Parse with DOMParser
   - Strip <style>, <link>, <script>, the arxiv banner, and inline color/font styles
   - Rewrite figure src to absolute arxiv URLs (cached HTML references relative paths)
   - Replace TeX-delimited spans (\(…\), \[…\]) with KaTeX
   - Native browsers handle <math> MathML well enough to leave alone
   - Generate a TOC from h2/h3 with stable ids
*/
export default function ArxivRenderer({ arxivId, onUnavailable }: Props) {
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const url = `/arxiv-cache/${arxivId}.html`
  const arxivAssetBase = `https://arxiv.org/html/${arxivId}/`

  useEffect(() => {
    let cancelled = false
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then((text) => {
        if (cancelled) return
        setHtml(text)
      })
      .catch((e: Error) => {
        if (cancelled) return
        setError(e.message)
        onUnavailable?.()
      })
    return () => {
      cancelled = true
    }
  }, [url, onUnavailable])

  const { sanitized, toc } = useMemo(() => {
    if (!html) return { sanitized: '', toc: [] as TocEntry[] }
    return processArxivHtml(html, arxivAssetBase)
  }, [html, arxivAssetBase])

  // Render KaTeX into the placeholder spans we left during processing.
  useEffect(() => {
    if (!sanitized) return
    const root = document.getElementById('arxiv-body')
    if (!root) return
    root.querySelectorAll<HTMLElement>('[data-tex]').forEach((el) => {
      const tex = el.dataset.tex ?? ''
      const display = el.dataset.display === '1'
      try {
        katex.render(tex, el, { displayMode: display, throwOnError: false })
      } catch {
        el.textContent = tex
      }
    })
  }, [sanitized])

  if (error) return null
  if (!html) {
    return (
      <div className="chrome-r rounded-md p-6 my-8 font-mono text-[12px] uppercase tracking-[0.2em] text-ink-dim">
        loading paper…
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-6 md:gap-8 mt-12">
      <article
        id="arxiv-body"
        className="col-span-12 md:col-span-9 prose prose-invert max-w-none arxiv-prose"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
      <aside className="col-span-12 md:col-span-3 hidden md:block">
        <div className="sticky top-20">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-dim mb-3">
            contents
          </div>
          <nav className="space-y-2 text-[13px]">
            {toc.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className={`block leading-snug text-ink-dim hover:text-ink transition ${
                  t.level === 3 ? 'pl-3 text-[12px]' : ''
                }`}
              >
                {t.text}
              </a>
            ))}
          </nav>
        </div>
      </aside>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* HTML processing                                                     */
/* ------------------------------------------------------------------ */

function processArxivHtml(rawHtml: string, assetBase: string): { sanitized: string; toc: TocEntry[] } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(rawHtml, 'text/html')

  // Strip the obvious cruft.
  const dropSelectors = [
    'script', 'style', 'link[rel="stylesheet"]',
    '.ltx_page_navbar', '.ltx_page_logo', '.ltx_pagination',
    '.ltx_role_pagenumber', 'meta',
    'header.ltx_page_header', 'footer.ltx_page_footer',
    '#arxiv-toolbar', '.arxiv-toolbar',
  ]
  dropSelectors.forEach((sel) => doc.querySelectorAll(sel).forEach((n) => n.remove()))

  // Remove inline color/font styles that fight our theme.
  doc.querySelectorAll<HTMLElement>('[style]').forEach((el) => {
    const cleaned = (el.getAttribute('style') ?? '')
      .split(';')
      .map((d) => d.trim())
      .filter((d) => {
        const k = d.split(':')[0]?.trim().toLowerCase()
        return k && !['color', 'background', 'background-color', 'font-family', 'font'].includes(k)
      })
      .join('; ')
    if (cleaned) el.setAttribute('style', cleaned)
    else el.removeAttribute('style')
  })

  // Rewrite figure / inline image src to absolute arxiv URLs.
  doc.querySelectorAll<HTMLImageElement>('img[src]').forEach((img) => {
    const src = img.getAttribute('src') ?? ''
    if (src && !src.startsWith('http') && !src.startsWith('data:')) {
      img.setAttribute('src', new URL(src, assetBase).toString())
    }
    img.removeAttribute('width')
    img.removeAttribute('height')
    img.classList.add('arxiv-figure-img')
  })

  // Replace TeX delimiters (\(...\) inline, \[...\] display) with placeholders
  // we render via KaTeX after mount. Many papers use MathML directly, in
  // which case nothing to do — modern browsers render <math> natively.
  walkText(doc.body, (textNode) => {
    const t = textNode.nodeValue ?? ''
    if (!/\\\(|\\\[/.test(t)) return null
    const frag = doc.createDocumentFragment()
    const re = /\\\((.+?)\\\)|\\\[(.+?)\\\]/gs
    let lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(t)) !== null) {
      if (m.index > lastIndex) frag.appendChild(doc.createTextNode(t.slice(lastIndex, m.index)))
      const span = doc.createElement('span')
      span.dataset.tex = (m[1] ?? m[2] ?? '').trim()
      if (m[2]) span.dataset.display = '1'
      frag.appendChild(span)
      lastIndex = m.index + m[0].length
    }
    if (lastIndex < t.length) frag.appendChild(doc.createTextNode(t.slice(lastIndex)))
    return frag
  })

  // Pick the article body — prefer .ltx_document, else <article>, else body.
  const root: Element =
    doc.querySelector('.ltx_document') ??
    doc.querySelector('article') ??
    doc.body

  // Collect TOC from h2 / h3 inside the body.
  const toc: TocEntry[] = []
  let counter = 0
  root.querySelectorAll<HTMLElement>('h2, h3').forEach((h) => {
    if (!h.id) h.id = `arxiv-h-${counter++}`
    const text = (h.textContent ?? '').trim().replace(/\s+/g, ' ')
    if (!text) return
    toc.push({ id: h.id, level: h.tagName === 'H2' ? 2 : 3, text })
  })

  return { sanitized: root.innerHTML, toc }
}

function walkText(root: Node, fn: (node: Text) => DocumentFragment | null): void {
  // Two-pass to avoid mutating the tree we're iterating.
  const queue: Text[] = []
  const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let n: Node | null
  while ((n = it.nextNode())) queue.push(n as Text)
  for (const node of queue) {
    if (!node.parentNode) continue
    const replacement = fn(node)
    if (replacement) node.parentNode.replaceChild(replacement, node)
  }
}
