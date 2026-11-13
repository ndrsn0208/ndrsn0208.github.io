// Inline marks in essay text. The page and the static build both read them,
// so this module has no imports.
//   **words**   the sentence a reader should leave with
//   [^id]       a numbered reference

export type EssayPart = { kind: 'text' | 'strong' | 'cite', text: string }

export function essayParts(text: string): EssayPart[] {
  return text.split(/(\*\*[^*]+\*\*|\[\^[a-z0-9-]+\])/g).filter(Boolean).map((part): EssayPart => {
    if (part.startsWith('**')) return { kind: 'strong', text: part.slice(2, -2) }
    if (part.startsWith('[^')) return { kind: 'cite', text: part.slice(2, -1) }
    return { kind: 'text', text: part }
  })
}

/** The text as it reads aloud, without marks. */
export function essayPlain(text: string) {
  return essayParts(text).filter(part => part.kind !== 'cite').map(part => part.text).join('')
}

/** Text as it is set on the page: a term such as rank-1 or ImageNet-500 stays on one line. */
export const essayType = (text: string) => text.replace(/([A-Za-z0-9])-(\d)/g, '$1\u2011$2')

/** Where a figure's share image lives. Every figure has one, and the essay itself has `essay`. */
export const essayCard = (essay: string, figure: string) => `/blog-assets/${essay}/share/${figure}.png`
