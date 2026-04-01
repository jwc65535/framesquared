import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const pkgRoot = resolve(fileURLToPath(new URL('../../packages', import.meta.url)));

export default defineConfig({
  resolve: {
    alias: {
      '@framesquared/core': resolve(pkgRoot, 'core/src/index.ts'),
      '@framesquared/data': resolve(pkgRoot, 'data/src/index.ts'),
      '@framesquared/component': resolve(pkgRoot, 'component/src/index.ts'),
      '@framesquared/layout': resolve(pkgRoot, 'layout/src/index.ts'),
      '@framesquared/ui': resolve(pkgRoot, 'ui/src/index.ts'),
      '@framesquared/form': resolve(pkgRoot, 'form/src/index.ts'),
      '@framesquared/grid': resolve(pkgRoot, 'grid/src/index.ts'),
      '@framesquared/dd': resolve(pkgRoot, 'dd/src/index.ts'),
      '@framesquared/fx': resolve(pkgRoot, 'fx/src/index.ts'),
      '@framesquared/app': resolve(pkgRoot, 'app/src/index.ts'),
      '@framesquared/theme': resolve(pkgRoot, 'theme/src/index.ts'),
    },
  },
  server: {
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/__tests__/**',
        '**/coverage/**',
        '**/docs/**',
        '**/examples/!(tree-grid)/**',
        '**/packages/integration-tests/**',
        '**/packages/build-tests/**',
        '**/packages/framesquared/**',
      ],
    },
  },
});
