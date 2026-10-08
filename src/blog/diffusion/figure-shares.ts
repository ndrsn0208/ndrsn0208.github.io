// Each figure has a real HTML route so social crawlers can read its own card.
// Fragments alone cannot select a different Open Graph image on GitHub Pages.
export const diffusionShareBase = '/blog/continual-learning-diffusion-models/'

export const diffusionFigureShares = [
  {
    id: 'fisher-comparison',
    anchor: 'fisher-explorer',
    title: 'What diagonal Fisher misses',
    description: 'Diagonal Fisher removes parameter correlations. A rank-1 estimate preserves the dominant pattern and stays close to full Fisher in this illustrative comparison.',
    image: '/blog-assets/diffusion/share/fisher-comparison.png',
    imageAlt: 'Full Fisher, diagonal Fisher, and rank-1 matrices above their corresponding illustrative loss surfaces. Full Fisher and rank-1 retain similar correlation patterns and valleys.',
  },
  {
    id: 'fisher-construction',
    anchor: 'gradient-explorer',
    title: 'Watch the Fisher matrix take shape',
    description: 'Averaging gradient outer products builds empirical Fisher. When gradients align, a scaled outer product of their mean keeps the dominant correlations.',
    image: '/blog-assets/diffusion/share/fisher-construction.png',
    imageAlt: 'A constructed example comparing full empirical Fisher, its diagonal, and the rank-1 approximation built from the mean gradient. The rank-1 matrix preserves the dominant off-diagonal structure.',
  },
  {
    id: 'parameter-sharing',
    anchor: 'trust-region-explorer',
    title: 'EWC, replay, and Trust Region',
    description: 'EWC protects earlier solutions locally. Replay promotes parameter sharing. Trust Region combines both to preserve a useful shared solution.',
    image: '/blog-assets/diffusion/share/parameter-sharing.png',
    imageAlt: 'Three illustrative task-loss landscapes. EWC faces an empty three-task feasible set, replay can drift from the original tasks, and Trust Region retains a nearby shared solution when one exists.',
  },
  {
    id: 'meta-learning',
    anchor: 'meta-learning-derivation',
    title: 'The meta-learning structure inside Trust Region',
    description: 'Under local rank-1 assumptions and a positive MAML coefficient, the old-task Trust Region and one-step MAML gradients share a direction, with potentially different scales.',
    image: '/blog-assets/diffusion/share/meta-learning.png',
    imageAlt: 'A side-by-side derivation of the Trust Region and one-step MAML old-task gradients. Rank-1 Fisher reduces both to scaled Fisher-times-displacement directions under the stated local assumptions.',
  },
  {
    id: 'recovery',
    anchor: 'meta-learning-explorer',
    title: 'Fast recovery during continual learning',
    description: 'Original Task 1 learning curves for ImageNet-500 and CW10 show how earlier performance recovers while the diffusion model keeps learning later tasks.',
    image: '/blog-assets/diffusion/share/recovery.png',
    imageAlt: 'The original ImageNet-500 Task 1 FID and CW10 Task 1 success curves across ten tasks, comparing Trust Region with Replay, EWC, fine-tuning, and meta-learning baselines.',
  },
  {
    id: 'recovery-imagenet500',
    anchor: 'recovery-imagenet500',
    title: 'Recovering earlier image-generation abilities',
    description: 'Task 1 FID throughout ten ImageNet-500 tasks. The original learning curves track recovery during ongoing continual training.',
    image: '/blog-assets/diffusion/share/recovery-imagenet500.png',
    imageAlt: 'Original Figure 2(a): Task 1 FID over 500,000 gradient updates on ImageNet-500. Trust Region repeatedly recovers earlier image-generation performance after task transitions.',
  },
  {
    id: 'recovery-cw10',
    anchor: 'recovery-cw10',
    title: 'How quickly does an earlier robot skill return?',
    description: 'Task 1 success throughout ten CW10 tasks. The original learning curves track the earlier skill while the diffusion policy learns new ones.',
    image: '/blog-assets/diffusion/share/recovery-cw10.png',
    imageAlt: 'Original Figure 2(b): Task 1 success over 500,000 gradient updates on CW10. Trust Region recovers high success after learning later tasks.',
  },
  {
    id: 'measured-results',
    anchor: 'diffusion-results',
    title: 'Measured results',
    description: 'Final performance and forgetting on ImageNet-1k, ImageNet-500, and CW10, with one-standard-error bars. Compare methods within each benchmark.',
    image: '/blog-assets/diffusion/share/measured-results.png',
    imageAlt: 'Six measured bar plots in two rows and three columns. ImageNet-1k FID, ImageNet-500 FID, and CW10 success are above their corresponding forgetting plots. Means and one-standard-error bars compare Trust Region with baselines within each protocol.',
  },
] as const

export type DiffusionFigureShareId = typeof diffusionFigureShares[number]['id']
export type DiffusionFigure = typeof diffusionFigureShares[number]

export function getDiffusionFigure(id: string | undefined): DiffusionFigure | undefined {
  return diffusionFigureShares.find(figure => figure.id === id)
}

export function diffusionFigurePath(id: DiffusionFigureShareId) {
  return `${diffusionShareBase}figures/${id}/`
}

export function diffusionFigureUrl(id: DiffusionFigureShareId) {
  return `https://ndrsn0208.github.io${diffusionFigurePath(id)}`
}
