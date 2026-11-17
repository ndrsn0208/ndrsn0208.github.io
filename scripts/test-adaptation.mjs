import { build } from 'esbuild'
import { readdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'

// The adaptation playground's tests, and the tests of the small libraries beside it.
const tests = []
for (const folder of ['src/adapt', 'src/lib']) {
  for (const name of await readdir(folder)) if (name.endsWith('.test.ts')) tests.push(`${folder}/${name}`)
}
if (!tests.length) throw new Error('No tests found')
const output = await mkdtemp(join(tmpdir(), 'ndrsn-adaptation-'))
try {
  await build({
    entryPoints: tests,
    outbase: 'src',
    bundle: true,
    platform: 'node',
    format: 'esm',
    outdir: output,
    outExtension: { '.js': '.mjs' },
    target: 'node20',
    logLevel: 'warning',
  })
  const files = tests.map(name => join(output, name.replace(/^src\//, '').replace(/\.ts$/, '.mjs')))
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--test', ...files], { stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', code => resolve(code ?? 1))
  })
  process.exitCode = code
} finally {
  await rm(output, { recursive: true, force: true })
}
