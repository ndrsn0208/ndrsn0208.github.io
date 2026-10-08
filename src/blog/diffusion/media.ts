/** Author-supplied CW10 recording. The video preserves the GIF's 151 frames and timing. */
export const diffusionRobot = {
  src: '/blog-assets/diffusion/cw10-hammer.mp4',
  gif: '/blog-assets/diffusion/cw10-hammer.gif',
  poster: '/blog-assets/diffusion/cw10-hammer-poster.png',
  paper: {
    src: '/blog-assets/diffusion/cw10-hammer-paper.mp4?v=paper1',
    gif: '/blog-assets/diffusion/cw10-hammer-paper.gif?v=paper1',
    poster: '/blog-assets/diffusion/cw10-hammer-paper-poster.png?v=paper1',
  },
  width: 1200,
  height: 756,
  durationSeconds: 7.55,
  alt: 'Four diffusion policies perform the CW10 hammer task. The top row shows each policy just after learning task 1. The bottom row shows the same task after learning all ten tasks, comparing Trust Region, Replay, EWC, and Fine-tuning.',
  caption: 'CW10 task 1, hammer, before and after learning nine more tasks.',
} as const
