export interface PaperGradient {
  /** Conic stops as { color, position-in-degrees }. */
  stops: { color: string; pos: number }[]
  /** Conic gradient `from <fromAngle>deg`. */
  fromAngle: number
  /** Conic origin x percent (0–100). */
  cx: number
  /** Conic origin y percent (0–100). */
  cy: number
  /** Specular highlight x (0–100). */
  hx: number
  /** Specular highlight y (0–100). */
  hy: number
  /** Highlight whiteness 0..1. */
  hIntensity: number
  /** SVG turbulence base frequency for noise overlay. */
  noiseFreq: number
  /** Noise overlay opacity 0..1. */
  noiseOpacity: number
}

export interface Publication {
  id: string
  title: string
  authors: string[]
  venue: string
  year: number
  /** Canonical paper page, including proceedings and DOI destinations. */
  url?: string
  arxivId?: string
  arxivUrl?: string
  arxivHtmlUrl?: string
  arxivHtmlAvailable?: boolean
  pdfUrl?: string
  scholarUrl?: string
  summary: string
  tldr: string
  tags: string[]
  equalContribution?: string[]
  /** Optional badge: "spotlight", "oral", "best paper", etc. */
  award?: string
  gradient?: PaperGradient
  embedding?: number[]
  addedAt: string
}

export interface PublicationsFile {
  lastUpdated: string
  publications: Publication[]
}

export interface NewsItem {
  id: string
  /** Month of the announcement, YYYY-MM. */
  date: string
  /** Inline text and links, also suitable for a future published blog post. */
  content: { text: string; href?: string }[]
}

export interface SiteConfig {
  name: string
  title: string
  affiliation: string
  advisor: string
  advisorUrl?: string
  bio: string
  shortBio?: string
  researchStatement?: string
  researchQuestion?: string
  researchVision?: string[]
  academicService?: {
    role: string
    title: string
    note?: string
    url?: string
  }[]
  personalNote?: string
  education?: {
    degree: string
    field: string
    institution: string
    startYear: number
    endYear: number
    expected?: boolean
  }
  previousEducation?: {
    degree: string
    field: string
    institution: string
    startYear: number
    endYear: number
    detail?: string
  }[]
  industryExperience?: { role: string; organization: string; location?: string; dates?: string }[]
  researchInterests: string[]
  contacts: {
    email?: string
    googleScholar?: string
    twitter?: string
    github?: string
    linkedin?: string
    instagram?: string
    semanticScholar?: string
  }
  googleScholarId?: string
  featuredPaperIds?: string[]
}
