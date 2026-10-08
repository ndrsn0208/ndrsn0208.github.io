// The original Figure 2 panels. Keep shared with the no-JavaScript article.
export const recoveryPaper = '/papers/trust-region-continual-learning.pdf?v=f24a30d7db6c#page=8'
export const recoveryTable = '/papers/trust-region-continual-learning.pdf?v=f24a30d7db6c#page=9'
export const recoveryMethods = [
  { name: 'Trust Region', color: '#dc143c', dash: undefined },
  { name: 'Replay', color: '#ff8c00', dash: '10 4 2 4' },
  { name: 'EWC', color: '#9370db', dash: '10 4 2 4' },
  { name: 'Fine-tuning', color: '#808080', dash: '10 4 2 4' },
  { name: 'VR-MCL', color: '#1f77b4', dash: '8 5' },
  { name: 'FTML', color: '#2ca02c', dash: '8 5' },
] as const
export const recoveryPanels = [
  {
    id: 'imagenet500',
    title: 'ImageNet-500',
    measure: 'Task 1 FID · lower is better',
    src: '/blog-assets/diffusion/convergence/imagenet500-figure2a.png',
    width: 1624,
    height: 284,
    alt: 'Original Figure 2(a). Task 1 FID during 500,000 gradient updates across ten ImageNet-500 tasks. The Trust Region curve repeatedly returns near the initial Task 1 FID after task transitions. Replay drifts upward, while FTML and VR-MCL deteriorate substantially.',
  },
  {
    id: 'cw10',
    title: 'Continual World 10',
    measure: 'Task 1 success rate · higher is better',
    src: '/blog-assets/diffusion/convergence/cw10-figure2b.png',
    width: 1624,
    height: 307,
    alt: 'Original Figure 2(b). Task 1 success during 500,000 gradient updates across ten CW10 tasks. Trust Region recovers high success after later tasks arrive. Replay and the meta-learning baselines retain lower success, while EWC and fine-tuning generally lose Task 1.',
  },
] as const
