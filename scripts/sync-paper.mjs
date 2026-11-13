// Copy a paper's PDF into the site and record which edition it is.
//
//   node scripts/sync-paper.mjs <slug> <pdf> <pages> "<edition>" "<title>"
//
// Writes public/papers/<slug>.pdf and public/papers/<slug>.version.json, and prints the
// address with the content hash that src/data/publications.json should link to.
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const [slug, source, pages, edition, title] = process.argv.slice(2)
if (!slug || !source || !Number(pages) || !edition || !title) {
  throw new Error('Usage: node scripts/sync-paper.mjs <slug> <pdf> <pages> "<edition>" "<title>"')
}
const pdf = await fs.readFile(source)
if (pdf.subarray(0, 5).toString() !== '%PDF-') throw new Error(`${source} is not a PDF.`)
const sha256 = crypto.createHash('sha256').update(pdf).digest('hex')
const url = `https://ndrsn0208.github.io/papers/${slug}.pdf`
await fs.mkdir(path.join(root, 'public/papers'), { recursive: true })
await fs.writeFile(path.join(root, `public/papers/${slug}.pdf`), pdf)
await fs.writeFile(path.join(root, `public/papers/${slug}.version.json`), JSON.stringify({
  title, edition, pages: Number(pages), sha256, syncedAt: new Date().toISOString().replace(/\.\d+Z$/, '+00:00'), url,
}, null, 2) + '\n')
console.log(`${url}?v=${sha256.slice(0, 12)}`)
