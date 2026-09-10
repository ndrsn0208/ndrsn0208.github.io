export interface DesignDirection {
  id: string
  slug: string
  name: string
  chinese: string
  summary: string
  structure: string
  interaction: string
  palette: [string, string, string]
}

export const directions: DesignDirection[] = [
  {
    id: '01', slug: 'folio', name: 'Folio', chinese: '学术刊物',
    summary: '像读一本有主编眼光的研究刊物，在重点、旁注和留白之间认识你的工作。',
    structure: '编辑式首页 · 多栏阅读 · 研究档案',
    interaction: '先读精选，再展开论文',
    palette: ['#f5f0e7', '#742b39', '#252721'],
  },
  {
    id: '02', slug: 'atlas', name: 'Atlas', chinese: '研究地图',
    summary: '把研究领域变成可探索的知识地图，从一个概念走向与它相连的论文。',
    structure: '关系地图 · 主题导航 · 论文侧栏',
    interaction: '点选概念，探索关联',
    palette: ['#111c23', '#dcde8a', '#e4e4d5'],
  },
  {
    id: '03', slug: 'monograph', name: 'Monograph', chinese: '一本小书',
    summary: '用章节、页边注和书目，让研究有叙事、有停顿，也有随时跳读的自由。',
    structure: '常驻目录 · 章节阅读 · 书目',
    interaction: '按章节翻阅，自由跳读',
    palette: ['#777c65', '#f5f1e6', '#343b2e'],
  },
  {
    id: '04', slug: 'workbench', name: 'Workbench', chinese: '实验工作台',
    summary: '先亲手观察一个概念如何变化，再走进它背后的研究。',
    structure: '交互图解 · 相关研究 · 完整文库',
    interaction: '操作概念示意，理解问题',
    palette: ['#eff4fa', '#3155d9', '#e98068'],
  },
  {
    id: '05', slug: 'index', name: 'Index', chinese: '论文索引',
    summary: '为带着问题而来的同行设计，搜索、筛选和阅读都在触手可及的地方。',
    structure: '身份侧栏 · 检索目录 · 阅读面板',
    interaction: '搜索、筛选、原位阅读',
    palette: ['#ffffff', '#243bc0', '#272a2d'],
  },
  {
    id: '06', slug: 'gallery', name: 'Gallery', chinese: '研究展览',
    summary: '让研究成为一场精心策划的展览，抽象图形与论文形成可读的视觉对话。',
    structure: '策展式展品 · 大幅图形 · 馆藏',
    interaction: '切换展品，进入完整馆藏',
    palette: ['#f8f7f3', '#252322', '#d2e358'],
  },
  {
    id: '07', slug: 'timeline', name: 'Continuum', chinese: '研究脉络',
    summary: '沿时间与主题阅读论文，看问题如何延伸、分岔，再彼此相遇。',
    structure: '时间路径 · 年份导航 · 主题透镜',
    interaction: '沿年份浏览，按主题聚焦',
    palette: ['#f3eade', '#b55c40', '#503748'],
  },
  {
    id: '08', slug: 'dialogue', name: 'Dialogue', chinese: '从问题开始',
    summary: '以一个好问题打开对话，让不同背景的访客找到适合自己的阅读入口。',
    structure: '问题导航 · 个人回答 · 论文路径',
    interaction: '选择问题，沿回答深入',
    palette: ['#f1edf8', '#5c386c', '#cac1df'],
  },
  {
    id: '09', slug: 'fieldnotes', name: 'Fieldnotes', chinese: '研究手记',
    summary: '带着观察者的好奇心，翻开图解、批注和参考文献组成的研究手记。',
    structure: '主题标签页 · 注解图形 · 文献',
    interaction: '切换调查主题，展开注解',
    palette: ['#f5efcf', '#3d604b', '#e2c978'],
  },
  {
    id: '10', slug: 'quiet', name: 'Still', chinese: '安静的名片',
    summary: '把第一印象收拢到恰好的信息里，想多了解时，再从容展开。',
    structure: '一屏介绍 · 工作模式 · 专注阅读',
    interaction: '轻量切换，按需展开',
    palette: ['#000000', '#e9e8e2', '#787872'],
  },
]

export function getDirection(slug: string | undefined): DesignDirection | undefined {
  return directions.find((direction) => direction.slug === slug)
}
