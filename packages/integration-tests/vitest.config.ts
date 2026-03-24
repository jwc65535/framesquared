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
      '@framesquared/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@framesquared/data': path.resolve(__dirname, '../data/src/index.ts'),
      '@framesquared/component': path.resolve(__dirname, '../component/src/index.ts'),
      '@framesquared/layout': path.resolve(__dirname, '../layout/src/index.ts'),
      '@framesquared/ui': path.resolve(__dirname, '../ui/src/index.ts'),
      '@framesquared/form': path.resolve(__dirname, '../form/src/index.ts'),
      '@framesquared/grid': path.resolve(__dirname, '../grid/src/index.ts'),
      '@framesquared/dd': path.resolve(__dirname, '../dd/src/index.ts'),
      '@framesquared/fx': path.resolve(__dirname, '../fx/src/index.ts'),
      '@framesquared/app': path.resolve(__dirname, '../app/src/index.ts'),
      '@framesquared/theme': path.resolve(__dirname, '../theme/src/index.ts'),
    },
  },
});
