/* The essays as the index pages list them. `title` repeats the essay's name
   and `subtitle` its headline from src/blog/<essay>/article.ts, so the overview
   does not load the full text. Change them in both places. */
export const essays = [
  {
    id: 'composition',
    title: 'Test-Time Compositional Generalization',
    subtitle: 'Composing a held-out combination from prototypes discovered at test time',
    path: '/blog/test-time-compositional-generalization/',
    date: '2026-11-13',
    month: 'November 2026',
  },
  {
    id: 'diffusion',
    title: 'Continual Learning Diffusion Models',
    subtitle: 'Generative replay with a rank-1 Fisher trust region',
    path: '/blog/continual-learning-diffusion-models/',
    date: '2026-10-08',
    month: 'October 2026',
  },
  {
    id: 'scol',
    title: 'Self-Consolidating Language Models',
    subtitle: 'Writing context into model weights at test time',
    path: '/blog/self-consolidating-language-models/',
    date: '2026-09-25',
    month: 'September 2026',
  },
] as const

export type Essay = typeof essays[number]
