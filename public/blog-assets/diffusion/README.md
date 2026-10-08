# Diffusion article media

The article hero and blog-index preview use the author's supplied
`cw10_task1_s42_4methods.gif`. It compares Trust Region, Replay, EWC, and
Fine-tuning on the CW10 hammer task immediately after task 1 and again after
all ten tasks. This is one recorded rollout, seed 42, not an aggregate result.
The source recording is preserved without changing labels or experiment frames.

## Assets

- `cw10-hammer.gif`: exact original GIF, 1200 × 756, 151 frames, 7.55 seconds.
- `cw10-hammer.mp4`: H.264 delivery copy, same frames and timing, no audio,
  YUV420p and fast-start metadata for browser and native social-video playback.
- `cw10-hammer-poster.png`: the complete final frame, without cropping.
- `cw10-hammer-social.png`: the final frame proportionally resized onto a
  1200 × 630 canvas. Both checkpoints and all four methods remain visible.
- `cw10-hammer-manifest.json`: source checksum, frame count, dimensions,
  duration, poster frame, and asset sizes.

## Paper canvas

`cw10-hammer-paper.mp4`, `cw10-hammer-paper.gif`, and
`cw10-hammer-paper-poster.png` are presentation copies for the Paper theme.
The canvas matches the page's `#f5f1e8`. Near-white pixels in the margins are
normalized to that color, including the rounded timeline's outer corners.
Text antialiasing is composited against the Paper matte.

The eight robot views, nine task thumbnails, and blue method label retain their
source pixels before ordinary delivery encoding. The GIF uses a fixed palette
across frames and combines identical adjacent frames without changing their
duration. The MP4 uses H.264, YUV420p, and fast-start metadata and preserves all
151 source frames. Both last 7.55 seconds. The original GIF, video, and poster stay unchanged.
`cw10-hammer-paper-manifest.json` records the protected regions and checks.

## Paper thumbnails

- `papers/rank-one-fisher-cover.png`: first page of
  https://arxiv.org/pdf/2509.23593v2
- `papers/trust-region-cover.png`: first page of
  `/papers/trust-region-continual-learning.pdf`, the author's supplied
  32-page NeurIPS 2026 camera-ready version (received October 8, 2026).

Both thumbnails are unaltered first-page renders at 850 × 1100 pixels. The
article links them to the corresponding full PDF. Source PDFs are retained
locally under `artifacts/diffusion-blog/papers/`.
The cards display ICLR 2026 and NeurIPS 2026 respectively. The Trust Region PDF is hosted
on the personal website, with a checksum recorded in
`/papers/trust-region-continual-learning.version.json`. The PDF and cover URLs
include the checksum prefix to replace earlier cached editions. The arXiv
link remains available separately. The source anchors used for individual
experimental results remain tied to the version from which they were transcribed.

## Original convergence figures

`convergence/imagenet500-figure2a.png` and `convergence/cw10-figure2b.png`
are direct crops of Figure 2 on page 7 of
https://arxiv.org/pdf/2602.02417v1, rendered at 240 DPI. They preserve the
paper's curves, axes, task transitions, and method labels. No plot data was
reconstructed. `convergence/manifest.json` records the crop coordinates and
checksums.

The website blends the white paper background into its Paper appearance.
Black appearance applies a display filter to the complete image and matching
legend swatches. The source PNGs remain unchanged and can be opened directly.
On phones, the wide original figures scroll horizontally instead of shrinking
their text. Table 2 is linked for exact recovery-threshold counts.

`src/blog/diffusion/media.ts` is the playback manifest. `RobotFilm.tsx` is shared
by the article and index. A prominent Play/Pause animation button sits above
the recording, alongside Restart and Full size. Muted inline playback starts when the figure is visible,
pauses offscreen or in a hidden tab, and respects reduced motion. Explicit Play
remains available. A user pause persists when returning to the figure. Playback
never scrolls the page. If video loading fails, the poster and matching GIF link
remain available. The article also has a video download link.

## Sharing

The static Open Graph and X `summary_large_image` tags use the robot comparison
poster. No JavaScript is required for crawlers to find it. Ordinary link previews
do not reliably animate GIFs. For animated X posts, attach the provided GIF or
MP4 and include the article URL. Native media playback still follows each
viewer's autoplay settings:
https://help.x.com/en/using-x/x-videos

The previous low-resolution image samples, their original figure panels and
provenance manifest, and the retired gallery component are preserved outside
the published assets in `artifacts/diffusion-blog/retired-image-samples/`.
Quantitative image-generation and CW10 evidence remains in the article.
