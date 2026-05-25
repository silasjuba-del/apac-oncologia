// eslint.config.js — APACApp oncologia · Flat Config (ESLint 9+)
// Fase de engenharia pré-hospital: regras equilibradas entre qualidade e velocidade.
// Contratos P0/P1 documentados em comentários — violações manuais devem ser
// detectadas em code review até que custom plugin seja implementado.
import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  // ── Ignores globais ────────────────────────────────────────────────────────
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'server/**',
      'src/dev/**',           // fixtures de dev — sem regras de produção
      '*.config.js',          // vite.config.js, eslint.config.js
      'patch_*.js',
      'liste_files.js',
    ],
  },

  // ── Base JS ────────────────────────────────────────────────────────────────
  js.configs.recommended,

  // ── Regras globais ─────────────────────────────────────────────────────────
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        Date: 'readonly',
        JSON: 'readonly',
        Promise: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        AbortController: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        FormData: 'readonly',
        // React JSX
        React: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // ── Qualidade geral ──────────────────────────────────────────────────
      'no-unused-vars': ['warn', {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',   // catch(_){} — swallow intencional
      }],
      'no-debugger': 'error',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-duplicate-imports': 'error',
      'prefer-const': ['warn', { destructuring: 'all' }],
      // Padrões comuns em security.js (localStorage, regex complexos):
      'no-empty': ['warn', { allowEmptyCatch: true }],  // catch(_){} intencional
      'no-useless-escape': 'warn',                       // regex clínico é complexo

      // ── Segurança básica ─────────────────────────────────────────────────
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // ── React ────────────────────────────────────────────────────────────
      'react/jsx-key': 'error',               // key em listas
      'react/no-array-index-key': 'warn',     // evitar index como key
      'react/no-danger': 'error',             // banir dangerouslySetInnerHTML
      'react/no-deprecated': 'warn',
      'react/self-closing-comp': 'warn',

      // ── React Hooks ──────────────────────────────────────────────────────
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ── Contrato P0: requireActivePatient ────────────────────────────────
      // Nota: não é possível enforçar via ESLint padrão sem custom plugin.
      // A regra abaixo bane o uso de setDossieOncologico como prop em filhos
      // (detecta padrões suspeitos mas não substitui code review):
      // 'no-restricted-syntax': ['warn', ...] // ver ROADMAP.md

      // ── Estilo (não-bloqueante) ──────────────────────────────────────────
      'eqeqeq': ['warn', 'always', { null: 'ignore' }],
      'no-var': 'warn',
    },
  },

  // ── Arquivos de teste — regras relaxadas ───────────────────────────────────
  {
    files: ['src/**/__tests__/**/*.{js,jsx}', 'src/**/*.test.{js,jsx}'],
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'warn',
      'react-hooks/exhaustive-deps': 'off',
    },
    languageOptions: {
      globals: {
        // Vitest globals
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        test: 'readonly',
      },
    },
  },
];
