import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/apac-oncologia/',
  server: {
    host: '0.0.0.0',
    port: 5177,
    strictPort: true,
    open: false,
  },
  build: {
    charset: 'utf8',
    chunkSizeWarningLimit: 1200,
  },
  esbuild: {
    // Escape acentos no bundle para evitar mojibake em ambientes Windows.
    charset: 'ascii',
  },
})
