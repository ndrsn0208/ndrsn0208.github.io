import { createContext, useContext, useEffect, useLayoutEffect, type ReactNode } from 'react'
import SiteFrame, { useSiteTheme } from '../site/SiteFrame'
import './blog.css'
import './article-layout.css'

type Edition = 'black' | 'paper'
const BlogTheme = createContext<Edition>('paper')
export const useBlogTheme = () => useContext(BlogTheme)

export function useBlogMetadata({
  title, description, path, article = false,
  image = '/blog-assets/scol/social-card.png',
  imageAlt = 'Self-Consolidating Language Models. Writing context into model weights at test time.',
}: {
  title: string
  description: string
  path: string
  article?: boolean
  image?: string
  imageAlt?: string
}) {
  useEffect(() => {
    const oldTitle = document.title
    document.title = title
    const changes: (() => void)[] = []
    const meta = (attribute: 'name' | 'property', name: string, content: string) => {
      const found = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`)
      const element = found ?? document.createElement('meta')
      const old = element.getAttribute('content')
      element.setAttribute(attribute, name)
      element.content = content
      if (!found) document.head.append(element)
      changes.push(() => {
        if (!found) element.remove()
        else if (old !== null) element.content = old
        else element.removeAttribute('content')
      })
    }
    const origin = 'https://ndrsn0208.github.io'
    const url = new URL(path, origin).href
    const imageUrl = new URL(image, origin).href
    meta('name', 'description', description)
    meta('property', 'og:title', title)
    meta('property', 'og:description', description)
    meta('property', 'og:type', article ? 'article' : 'website')
    meta('property', 'og:url', url)
    meta('property', 'og:image', imageUrl)
    meta('property', 'og:image:alt', imageAlt)
    meta('name', 'twitter:card', 'summary_large_image')
    meta('name', 'twitter:title', title)
    meta('name', 'twitter:description', description)
    meta('name', 'twitter:image', imageUrl)
    meta('name', 'twitter:image:alt', imageAlt)
    const previousCanonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    const canonical = previousCanonical ?? document.createElement('link')
    const oldHref = canonical.getAttribute('href')
    canonical.rel = 'canonical'
    canonical.href = url
    if (!previousCanonical) document.head.append(canonical)
    return () => {
      document.title = oldTitle
      changes.forEach(restore => restore())
      if (!previousCanonical) canonical.remove()
      else if (oldHref !== null) canonical.setAttribute('href', oldHref)
    }
  }, [title, description, path, article, image, imageAlt])
}

function BlogThemeAdapter({ children }: { children: ReactNode }) {
  const { edition } = useSiteTheme()
  useLayoutEffect(() => {
    document.documentElement.dataset.blogEdition = edition
    return () => { delete document.documentElement.dataset.blogEdition }
  }, [edition])

  return (
    <BlogTheme.Provider value={edition}>
      <div className="scol-blog article-system" data-edition={edition}>{children}</div>
    </BlogTheme.Provider>
  )
}

export default function BlogLayout({ children, initialAnchor }: { children: ReactNode; initialAnchor?: string }) {
  return (
    <SiteFrame page="blog" mainId="blog-main" initialAnchor={initialAnchor}>
      <BlogThemeAdapter>{children}</BlogThemeAdapter>
    </SiteFrame>
  )
}
