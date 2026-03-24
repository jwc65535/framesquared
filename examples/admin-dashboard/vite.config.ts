import { defineConfig } from 'vite';
import path from 'node:path';

const pkgRoot = path.resolve(__dirname, '../../packages');

export default defineConfig({
  resolve: {
    alias: {
      '@ext-ts/core': path.resolve(pkgRoot, 'core/src/index.ts'),
      '@ext-ts/data': path.resolve(pkgRoot, 'data/src/index.ts'),
      '@ext-ts/component': path.resolve(pkgRoot, 'component/src/index.ts'),
      '@ext-ts/layout': path.resolve(pkgRoot, 'layout/src/index.ts'),
      '@ext-ts/ui': path.resolve(pkgRoot, 'ui/src/index.ts'),
      '@ext-ts/form': path.resolve(pkgRoot, 'form/src/index.ts'),
      '@ext-ts/grid': path.resolve(pkgRoot, 'grid/src/index.ts'),
      '@ext-ts/dd': path.resolve(pkgRoot, 'dd/src/index.ts'),
      '@ext-ts/fx': path.resolve(pkgRoot, 'fx/src/index.ts'),
      '@ext-ts/app': path.resolve(pkgRoot, 'app/src/index.ts'),
      '@ext-ts/theme': path.resolve(pkgRoot, 'theme/src/index.ts'),
    },
  },
  server: {
    watch: {
      // Only watch the example's own src/ and the packages it actually imports.
      // Ignore everything else to stay under the OS file watcher limit.
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/__tests__/**',
        '**/coverage/**',
        '**/docs/**',
        '**/examples/!(admin-dashboard)/**',
        '**/packages/integration-tests/**',
        '**/packages/build-tests/**',
        '**/packages/ext-ts/**',
      ],
    },
  },
});
