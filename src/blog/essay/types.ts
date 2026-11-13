/* One shape for every essay. An essay is a claim, a short summary, one lead
   exhibit, and sections that each ask a question and answer it. */

export type EssayStep = {
  /** One or two words under the station. */
  label: string
  /** What the drawing shows at this station, in one or two sentences. */
  say: string
}

export type EssayExhibit = {
  /** Names the figure for assistive technology and for its own page. */
  title: string
  /** What it shows. Read aloud, shown without JavaScript, and used when the figure is shared. */
  description: string
  /** Wider than the reading column. */
  wide?: boolean
  /** Parallel instances of the same figure. */
  tabs?: readonly string[]
  tabsLabel?: string
  /** An argument in order. The reader moves along it. */
  steps?: readonly EssayStep[]
  /** Behind the plus: what is measured, what is illustrated, and under which conditions. */
  notes?: readonly string[]
  sources?: readonly { label: string, href: string }[]
  /** Earlier addresses that should still open this figure. */
  aliases?: readonly string[]
}

export type EssayBlock =
  | { p: string }
  | { math: string, label: string }
  | { exhibit: string }

export type EssaySection = {
  id: string
  /** The section's name in the outline. */
  label: string
  /** The question it answers. */
  heading: string
  blocks: readonly EssayBlock[]
}

export type EssayReference = { id: string, title: string, url: string, detail?: string }

export type Essay = {
  id: 'diffusion' | 'scol' | 'composition'
  path: string
  /** What the work is called. */
  name: string
  /** What it does, as the page's largest line. */
  headline: string
  description: string
  date: string
  authors: readonly { name: string, equal?: boolean }[]
  authorNote?: string
  affiliation: string
  links: readonly { label: string, href: string }[]
  summary: readonly string[]
  /** The exhibit that opens the essay. */
  lead: string
  sections: readonly EssaySection[]
  exhibits: Readonly<Record<string, EssayExhibit>>
  /** Publication ids, listed the way the Papers page lists them. */
  papers: readonly string[]
  references: readonly EssayReference[]
  image: string
  imageAlt: string
}
