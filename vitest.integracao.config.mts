import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Testes de integração (banco de verdade). Rodar: npm run test:integracao
// Config separada (não mesclada) porque o mergeConfig soma as listas de include/exclude.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'server-only': fileURLToPath(new URL('./src/lib/testes/vazio.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.integracao.test.ts'],
    env: { TZ: 'UTC' },
    testTimeout: 20_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});
