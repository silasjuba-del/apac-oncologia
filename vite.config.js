/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/__tests__/**/*.test.{js,jsx,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      // Auditar apenas os contratos de negocio criticos (utils puras, testáveis sem DOM).
      // dossie.js e parse.js dependem de localStorage/DOM e aguardam fase de testes dedicada.
      include: [
        'src/utils/pipeline.js',
        'src/utils/apacDeterministico.js',
        'src/utils/apacValidator.js',
        'src/utils/security.js',
      ],
      exclude: [
        'src/utils/__tests__/**',
      ],
      // Limiares fase de engenharia (pre-hospital).
      // security.js tem funções de localStorage sem DOM — cobertura limitada em node env.
      // Aumentar progressivamente conforme testes de dossie/parse forem adicionados.
      thresholds: {
        statements: 55,
        branches:   40,
        functions:  50,
        lines:      55,
      },
    },
  },
  base: '/apac-oncologia/',
  server: {
    host: '0.0.0.0',
    port: 5177,
    strictPort: true,
    open: false,
  },
  build: {
    charset: 'utf8',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor: supabase (pesado, cache longo)
          if (id.includes('node_modules/@supabase')) return 'vendor-supabase';
          // Vendor: react core
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) return 'vendor-react';
          // Features por role — cada role carrega apenas quando acessado
          if (id.includes('/features/farmacia/'))          return 'role-farmacia';
          if (id.includes('/features/enfermagem/'))        return 'role-enfermagem';
          if (id.includes('/features/recepcao/') || id.includes('/features/carteirinha/') || id.includes('/features/paciente/')) return 'role-recepcao';
          if (id.includes('/features/comunicacao/') || id.includes('/features/assistencia-social/')) return 'role-comunicacao';
          if (id.includes('/features/faturamento/'))       return 'role-faturamento';
          if (id.includes('/features/prescricao/'))        return 'role-prescricao';
          // Medico: split em dois chunks (prontuário pesado vs resto)
          if (id.includes('/features/medico/') && (id.includes('ProntuarioDossie') || id.includes('StepperMedico') || id.includes('APACDossie') || id.includes('DossieBar'))) return 'medico-dossie';
          if (id.includes('/features/medico/'))            return 'medico-outros';
          // Componentes oncoagent e APAC pesados
          if (id.includes('/components/oncoagent/') || id.includes('/components/APACSystem') || id.includes('/agents/')) return 'onco-agent';
          // Utils compartilhados (pequenos, podem ficar no chunk padrão)
        },
      },
    },
  },
  esbuild: {
    // Escape acentos no bundle para evitar mojibake em ambientes Windows.
    charset: 'ascii',
  },
})
