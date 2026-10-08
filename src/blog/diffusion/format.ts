export function diffusionTextParts(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map(part => ({
    text: part.startsWith('**') && part.endsWith('**') ? part.slice(2, -2) : part,
    emphasis: part.startsWith('**') && part.endsWith('**'),
  }))
}

export const diffusionPath = '/blog/continual-learning-diffusion-models/'
export const diffusionUrl = `https://ndrsn0208.github.io${diffusionPath}`
export const diffusionImage = '/blog-assets/diffusion/cw10-hammer-social.png'
export const diffusionImageAlt = 'CW10 hammer before and after nine more tasks. In this recorded rollout, all four methods succeed after task 1, while only Trust Region succeeds after task 10.'

export const diffusionPapers = [
  {
    id: 'rank-one-paper',
    venue: 'ICLR 2026',
    title: 'Avoid Catastrophic Forgetting with Rank-1 Fisher from Diffusion Models',
    authors: 'Zekun Wang, Anant Gupta, Zihan Dong, and Christopher J. MacLellan',
    description: 'The gradient geometry, rank-1 approximation, and continual image generation experiments.',
    url: 'https://arxiv.org/abs/2509.23593',
    pdf: 'https://arxiv.org/pdf/2509.23593v2',
    cover: '/blog-assets/diffusion/papers/rank-one-fisher-cover.png',
    bibtex: `@inproceedings{wang2026rank1fisher,
  title={Avoid Catastrophic Forgetting with Rank-1 Fisher from Diffusion Models},
  author={Wang, Zekun and Gupta, Anant and Dong, Zihan and MacLellan, Christopher J.},
  booktitle={International Conference on Learning Representations},
  year={2026},
  eprint={2509.23593},
  archivePrefix={arXiv}
}`,
  },
  {
    id: 'trust-region-paper',
    venue: 'NeurIPS 2026',
    title: 'Trust Region Continual Learning as an Implicit Meta-Learner',
    authors: 'Zekun Wang, Anant Gupta, and Christopher J. MacLellan',
    description: 'The trust region perspective, implicit meta-learning connection, and experiments in generation and control.',
    url: 'https://arxiv.org/abs/2602.02417',
    pdf: '/papers/trust-region-continual-learning.pdf?v=f24a30d7db6c',
    cover: '/blog-assets/diffusion/papers/trust-region-cover.png?v=f24a30d7db6c',
    bibtex: `@inproceedings{wang2026trustregion,
  title={Trust Region Continual Learning as an Implicit Meta-Learner},
  author={Wang, Zekun and Gupta, Anant and MacLellan, Christopher J.},
  booktitle={Advances in Neural Information Processing Systems},
  year={2026},
  url={https://ndrsn0208.github.io/papers/trust-region-continual-learning.pdf},
  eprint={2602.02417},
  archivePrefix={arXiv}
}`,
  },
] as const
