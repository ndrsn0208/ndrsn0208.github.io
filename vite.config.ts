import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const cvVersion = createHash('sha256')
  .update(readFileSync(path.resolve(__dirname, 'public/cv.pdf')))
  .digest('hex')
  .slice(0, 12)

export default defineConfig({
  base: '/',
  plugins: [react()],
  define: {
    __CV_PDF_URL__: JSON.stringify(`/cv.pdf?v=${cvVersion}`),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2022',
  },
  server: {
    port: 5173,
    open: false,
  },
})
