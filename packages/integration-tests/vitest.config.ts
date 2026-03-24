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
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@ext-ts/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@ext-ts/data': path.resolve(__dirname, '../data/src/index.ts'),
      '@ext-ts/component': path.resolve(__dirname, '../component/src/index.ts'),
      '@ext-ts/layout': path.resolve(__dirname, '../layout/src/index.ts'),
      '@ext-ts/ui': path.resolve(__dirname, '../ui/src/index.ts'),
      '@ext-ts/form': path.resolve(__dirname, '../form/src/index.ts'),
      '@ext-ts/grid': path.resolve(__dirname, '../grid/src/index.ts'),
      '@ext-ts/dd': path.resolve(__dirname, '../dd/src/index.ts'),
      '@ext-ts/fx': path.resolve(__dirname, '../fx/src/index.ts'),
      '@ext-ts/app': path.resolve(__dirname, '../app/src/index.ts'),
      '@ext-ts/theme': path.resolve(__dirname, '../theme/src/index.ts'),
    },
  },
});
