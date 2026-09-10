export type StillStudyId = 'lens' | 'drift' | 'frame'

export interface StillStudy {
  id: StillStudyId
  number: string
  name: string
  chinese: string
  description: string
}

export const stillStudies: StillStudy[] = [
  {
    id: 'lens', number: '01', name: 'Lens', chinese: '透镜',
    description: '一笔线稿、一段安静的介绍。舒展的衬线排版与简洁的文字导航，保留学术网站的人文感。',
  },
  {
    id: 'drift', number: '02', name: 'Drift', chinese: '流动',
    description: '舒展的编辑式排版与流动线条，借鉴 MAI 的人文气质，让研究有自己的节奏。',
  },
  {
    id: 'frame', number: '03', name: 'Frame', chinese: '取景',
    description: '清晰的字级与学术索引，四枚有触感的玻璃入口，把信息组织成可浏览的秩序。',
  },
]

export const stillStudyStorageKey = 'zekun-still-study-v1'

export function getStillStudy(value: string | null | undefined) {
  return stillStudies.find((study) => study.id === value)
}

export function initialStillStudy(): StillStudy {
  const requested = getStillStudy(new URLSearchParams(window.location.search).get('study'))
  if (requested) return requested
  try {
    const saved = getStillStudy(localStorage.getItem(stillStudyStorageKey))
    if (saved) return saved
  } catch { /* An explicit link and the default remain available without storage. */ }
  return stillStudies[0]
}
