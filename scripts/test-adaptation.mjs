import { build } from 'esbuild'
import { readdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'

const tests = (await readdir('src/adapt')).filter(name => name.endsWith('.test.ts'))
if (!tests.length) throw new Error('No adaptation tests found')
const output = await mkdtemp(join(tmpdir(), 'ndrsn-adaptation-'))
try {
  await build({
    entryPoints: tests.map(name => `src/adapt/${name}`),
    bundle: true,
    platform: 'node',
    format: 'esm',
    outdir: output,
    outExtension: { '.js': '.mjs' },
    target: 'node20',
    logLevel: 'warning',
  })
  const files = tests.map(name => join(output, name.replace(/\.ts$/, '.mjs')))
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--test', ...files], { stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', code => resolve(code ?? 1))
  })
  process.exitCode = code
} finally {
  await rm(output, { recursive: true, force: true })
}
