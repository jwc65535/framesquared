import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['__tests__/**/*.test.ts'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
      thresholds: {
        statements: 85,
        branches: 70,
        functions: 83,
        lines: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@ext-ts/dd': path.resolve(__dirname, 'src/index.ts'),
      '@ext-ts/core': path.resolve(__dirname, '../core/src/index.ts'),
    },
  },
});
