import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const cvPath = path.resolve(__dirname, 'public/cv.pdf')
const readCvVersion = () => createHash('sha256').update(readFileSync(cvPath)).digest('hex').slice(0, 12)
const cvVersion = readCvVersion()

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    {
      name: 'refresh-cv-version',
      configureServer(server) {
        server.watcher.add(cvPath)
        const refresh = (file: string) => {
          if (path.resolve(file) !== cvPath) return
          try {
            if (readCvVersion() !== cvVersion) void server.restart()
          } catch {
            // An editor may briefly remove the file before replacing it.
          }
        }
        server.watcher.on('change', refresh)
        server.watcher.on('add', refresh)
        server.httpServer?.once('close', () => {
          server.watcher.off('change', refresh)
          server.watcher.off('add', refresh)
        })
      },
    },
  ],
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
    host: '127.0.0.1',
    port: 5173,
    open: false,
  },
})
