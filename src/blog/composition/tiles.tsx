/* Every picture in this essay is an output of a model, cut from a figure of the paper
   (public/blog-assets/composition/). A sheet is a grid of square tiles, and a tile
   shows one of them. BLOG.md says how the sheets are built. */

export type Sheet = { file: string, columns: number, rows: number, pixels?: boolean }

export const sheets = {
  /** Rows: start image, noised copy, prototype, weights, samples. The last row holds the mean of the product of experts. */
  compose: { file: 'compose.png', columns: 8, rows: 6, pixels: true },
  /** One row per noise level and start. Columns: the image, its noised copy, then 1, 2, 3, 5, 10 and 40 ascent steps. */
  ascent: { file: 'ascent.png', columns: 8, rows: 8, pixels: true },
  /** Column 0: the query and three prototypes. Columns 1 to 4: five samples each of Ours, Comp. 1, Comp. 3 and SDEdit. */
  colormnist: { file: 'samples-colormnist.png', columns: 5, rows: 5, pixels: true },
  celeba: { file: 'samples-celeba.webp', columns: 5, rows: 5 },
} satisfies Record<string, Sheet>

export function Tile({ sheet, column, row }: { sheet: Sheet, column: number, row: number }) {
  const at = (index: number, count: number) => count > 1 ? index / (count - 1) * 100 : 0
  return <span className="tile" data-pixels={sheet.pixels || undefined} style={{
    backgroundImage: `url(/blog-assets/composition/${sheet.file})`,
    backgroundSize: `${sheet.columns * 100}% ${sheet.rows * 100}%`,
    backgroundPosition: `${at(column, sheet.columns)}% ${at(row, sheet.rows)}%`,
  }} />
}
