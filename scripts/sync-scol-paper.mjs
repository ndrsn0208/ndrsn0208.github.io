import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const folio = path.join(root, 'writing/self-consolidating-language-models/frontier-studies/folio')
const source = path.join(folio, 'output/pdf/self-consolidating-language-models-folio.pdf')
const pdf = await fs.readFile(source)
if (pdf.subarray(0, 5).toString() !== '%PDF-') throw new Error('The Folio output is not a PDF.')
await fs.mkdir(path.join(root, 'public/papers'), { recursive: true })
await fs.mkdir(path.join(root, 'public/blog-assets/scol'), { recursive: true })
await fs.writeFile(path.join(root, 'public/papers/self-consolidating-language-models.pdf'), pdf)
await fs.copyFile(path.join(folio, 'output/cover.png'), path.join(root, 'public/blog-assets/scol/paper-cover.png'))
await fs.writeFile(path.join(root, 'public/papers/self-consolidating-language-models.version.json'), JSON.stringify({
  edition: 'Folio',
  sha256: crypto.createHash('sha256').update(pdf).digest('hex'),
  syncedAt: new Date().toISOString(),
}, null, 2) + '\n')
console.log('Copied the current Folio PDF and cover into the website assets.')
