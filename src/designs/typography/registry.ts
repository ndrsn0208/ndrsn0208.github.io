export type TypographyId = 'original' | 'book' | 'editorial' | 'humanist' | 'poem'

export interface TypographyStudy {
  id: TypographyId
  number: string
  name: string
  chinese: string
  pairing: string
  description: string
  rhythm: string
  fontLoads: string[]
}

export const typographyStudies: TypographyStudy[] = [
  {
    id: 'original',
    number: '00',
    name: 'Lens',
    chinese: '原始版本',
    pairing: 'Fraunces · Geist',
    description: '保留最初的 Lens 排版，作为比较时的参照。',
    rhythm: '柔和衬线 · 清晰的信息层级',
    fontLoads: ['400 24px Fraunces', '400 16px Geist'],
  },
  {
    id: 'book',
    number: '01',
    name: 'Book',
    chinese: '书卷',
    pairing: 'EB Garamond · Source Sans 3',
    description: '像翻开一本学术随笔。古典字形、从容的行距，让研究和个人介绍读起来更自然。',
    rhythm: '古典书籍 · 温润的阅读节奏',
    fontLoads: ['400 24px "EB Garamond"', '400 16px "Source Sans 3"', '450 24px Newsreader'],
  },
  {
    id: 'editorial',
    number: '02',
    name: 'Editorial',
    chinese: '文刊',
    pairing: 'Newsreader · Geist',
    description: '借用文学杂志的字级与疏密关系。名字更有分量，研究陈述和经历则收得简洁。',
    rhythm: '文学杂志 · 鲜明的标题层级',
    fontLoads: ['400 24px Newsreader', 'italic 400 24px Newsreader', '400 16px Geist'],
  },
  {
    id: 'humanist',
    number: '03',
    name: 'Humanist',
    chinese: '亲和',
    pairing: 'Source Sans 3 · Newsreader',
    description: '以柔和、开放的无衬线字形介绍自己，长段落保留衬线的阅读感。轻松，也清楚。',
    rhythm: '人文无衬线 · 开放而清晰',
    fontLoads: ['400 24px "Source Sans 3"', 'italic 400 24px "Source Sans 3"', '400 24px Newsreader'],
  },
  {
    id: 'poem',
    number: '04',
    name: 'Poem',
    chinese: '诗页',
    pairing: 'Cormorant Garamond · Newsreader',
    description: '更轻盈的标题和更宽松的留白，带一点诗集的气质。研究内容仍然平实、易读。',
    rhythm: '轻盈字形 · 舒展的留白',
    fontLoads: ['400 24px "Cormorant Garamond"', 'italic 500 24px "Cormorant Garamond"', '400 24px Newsreader', 'italic 400 24px Newsreader', '400 16px "Source Sans 3"'],
  },
]

export function getTypography(value: string | null | undefined) {
  return typographyStudies.find((study) => study.id === value)
}

const fontRequests = new Map<TypographyId, Promise<void>>()

export function loadTypography(study: TypographyStudy): Promise<void> {
  const previous = fontRequests.get(study.id)
  if (previous) return previous
  const request = Promise.all(study.fontLoads.map((font) => document.fonts.load(font)))
    .then(() => undefined)
    .catch((error: unknown) => {
      fontRequests.delete(study.id)
      throw error
    })
  fontRequests.set(study.id, request)
  return request
}
