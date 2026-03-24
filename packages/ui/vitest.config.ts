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
        statements: 90,
        branches: 82,
        functions: 90,
        lines: 90,
      },
    },
  },
  resolve: {
    alias: {
      '@framesquared/ui': path.resolve(__dirname, 'src/index.ts'),
      '@framesquared/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@framesquared/component': path.resolve(__dirname, '../component/src/index.ts'),
    },
  },
});
