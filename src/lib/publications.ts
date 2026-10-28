import publicationsData from '@/data/publications.json'
import configData from '@/data/config.json'
import type { Publication, PublicationsFile, SiteConfig } from '@/types'
import { generateGradient } from './gradient'

export const config: SiteConfig = configData as SiteConfig

const file = publicationsData as PublicationsFile

export function comparePublications(a: Publication, b: Publication): number {
  return b.year - a.year
    || (b.publicationDate ?? String(b.year)).localeCompare(a.publicationDate ?? String(a.year))
    || a.title.localeCompare(b.title)
}

/* Hydrate any publication missing a precomputed gradient.
   Once the Python pipeline runs, every entry will already have one. */
export const publications: Publication[] = file.publications.map((p) => ({
  ...p,
  gradient: p.gradient ?? generateGradient(p.id, p.tags),
})).sort(comparePublications)

export const lastUpdated = file.lastUpdated

export function getPublication(id: string): Publication | undefined {
  return publications.find((p) => p.id === id)
}

export function featuredPublications(): Publication[] {
  const featuredIds = config.featuredPaperIds ?? []
  if (featuredIds.length > 0) {
    // Accept either a slug id ("trust-region-…") or an arxiv id ("2509.23593"),
    // since the user's canonical reference for a paper in papers.toml is the
    // arxiv id and copying obscure slugs into config.json is a chore.
    const bySlug = new Map(publications.map((p) => [p.id, p]))
    const byArxiv = new Map(
      publications.filter((p) => p.arxivId).map((p) => [p.arxivId as string, p]),
    )
    return featuredIds
      .map((id) => bySlug.get(id) ?? byArxiv.get(id))
      .filter((p): p is Publication => Boolean(p))
      .sort(comparePublications)
  }
  // fallback: 4 newest
  return [...publications]
    .sort(comparePublications)
    .slice(0, 4)
}
