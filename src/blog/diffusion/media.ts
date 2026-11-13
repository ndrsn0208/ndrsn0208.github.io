/** The author's recording of four diffusion policies on the first Continual World task.
    One video holds eight views: four policies across, just after the task and after all ten.
    The page and the static build both read this, so it has no imports. */
export const recording = {
  src: '/blog-assets/diffusion/cw10-hammer.mp4',
  still: '/blog-assets/diffusion/cw10-hammer-poster.png',
  seconds: 7.55,
  width: 1200,
  height: 756,
  name: 'The first Continual World task, before and after nine more',
  description: 'Four diffusion policies perform the hammer task just after learning it and again after learning all ten tasks. Trust Region still succeeds. Replay, EWC, and fine-tuning fail.',
} as const
