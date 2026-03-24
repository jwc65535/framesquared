import { defineConfig } from 'vite';
import path from 'node:path';

const pkgRoot = path.resolve(__dirname, '../../packages');

export default defineConfig({
  resolve: {
    alias: {
      '@framesquared/core': path.resolve(pkgRoot, 'core/src/index.ts'),
      '@framesquared/data': path.resolve(pkgRoot, 'data/src/index.ts'),
      '@framesquared/component': path.resolve(pkgRoot, 'component/src/index.ts'),
      '@framesquared/layout': path.resolve(pkgRoot, 'layout/src/index.ts'),
      '@framesquared/ui': path.resolve(pkgRoot, 'ui/src/index.ts'),
      '@framesquared/form': path.resolve(pkgRoot, 'form/src/index.ts'),
      '@framesquared/grid': path.resolve(pkgRoot, 'grid/src/index.ts'),
      '@framesquared/dd': path.resolve(pkgRoot, 'dd/src/index.ts'),
      '@framesquared/fx': path.resolve(pkgRoot, 'fx/src/index.ts'),
      '@framesquared/app': path.resolve(pkgRoot, 'app/src/index.ts'),
      '@framesquared/theme': path.resolve(pkgRoot, 'theme/src/index.ts'),
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
        '**/examples/!(basic-app)/**',
        '**/packages/integration-tests/**',
        '**/packages/build-tests/**',
        '**/packages/framesquared/**',
      ],
    },
  },
});
