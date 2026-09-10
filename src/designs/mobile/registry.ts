export type MobileStudyId = 'folio' | 'index' | 'chapters'

export interface MobileStudy {
  id: MobileStudyId
  number: string
  name: string
  chinese: string
  description: string
  interaction: string
}

export const mobileStudies: MobileStudy[] = [
  {
    id: 'folio',
    number: '01',
    name: 'Folio',
    chinese: '书页',
    description: '舒展的书页，从个人简介顺着读到研究与论文。',
    interaction: '连续阅读 · 底部导航',
  },
  {
    id: 'index',
    number: '02',
    name: 'Index',
    chinese: '目录',
    description: '更紧凑的介绍，让研究方向和论文更早进入视线。',
    interaction: '紧凑目录 · 顶部导航',
  },
  {
    id: 'chapters',
    number: '03',
    name: 'Chapters',
    chinese: '分章',
    description: '每个板块是一页，底部切换，各自保留阅读位置。',
    interaction: '完整页面 · 固定底栏',
  },
]

export function getMobileStudy(value: string | null | undefined) {
  return mobileStudies.find((study) => study.id === value)
}
