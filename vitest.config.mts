import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // 'server-only' lança erro fora do Next; nos testes ele não faz nada.
      'server-only': fileURLToPath(new URL('./src/lib/testes/vazio.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Os de integração precisam do banco: rodam à parte com `npm run test:integracao`.
    exclude: ['**/node_modules/**', 'src/**/*.integracao.test.ts'],
    // Fixa o fuso do processo em UTC para provar que as regras não dependem do fuso do servidor.
    env: { TZ: 'UTC' },
  },
});
