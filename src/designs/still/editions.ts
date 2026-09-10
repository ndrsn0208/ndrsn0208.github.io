export type StillEditionId = 'black' | 'paper'

export interface StillEdition {
  id: StillEditionId
  number: string
  name: string
  chinese: string
  description: string
  background: string
  ink: string
  scheme: 'light' | 'dark'
}

export const stillEditions: StillEdition[] = [
  {
    id: 'black', number: '01', name: 'Black', chinese: '纯黑',
    description: '屏幕般的纯黑，柔白文字与安静的阅读空间。',
    background: '#000000', ink: '#e9e8e2', scheme: 'dark',
  },
  {
    id: 'paper', number: '02', name: 'Paper', chinese: '暖纸',
    description: '温暖的纸色、柔和的墨色文字，像一本展开的书。',
    background: '#f5f1e8', ink: '#39382f', scheme: 'light',
  },
]

export const stillEditionStorageKey = 'zekun-still-edition-v1'

export function getStillEdition(value: string | null | undefined): StillEdition | undefined {
  // Old light-edition links and saved preferences continue in the retained light appearance.
  const current = value === 'stone' || value === 'line' ? 'paper' : value
  return stillEditions.find((edition) => edition.id === current)
}

export function initialStillEdition(): StillEdition {
  const requested = getStillEdition(new URLSearchParams(window.location.search).get('edition'))
  if (requested) return requested
  try {
    const saved = getStillEdition(localStorage.getItem(stillEditionStorageKey))
    if (saved) return saved
  } catch { /* Keep browsing when storage is unavailable. */ }
  return stillEditions[0]
}
