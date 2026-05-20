import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/apac-oncologia/',
  server: {
    port: 5173,
    open: true
  },
  build: {
    charset: 'utf8',
    rollupOptions: {
      output: {
        // Força encoding UTF-8 no bundle
      }
    }
  },
  // Garante que arquivos JSX são lidos como UTF-8
  esbuild: {
    charset: 'ascii'  // escapa acentos como \uXXXX — funciona em qualquer encoding
  }
})
