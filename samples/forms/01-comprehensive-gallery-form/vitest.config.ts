import { defineConfig } from 'vitest/config';
import path from 'node:path';

const pkgRoot = path.resolve(__dirname, '../../../packages');

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
  },
  resolve: {
    alias: {
      '@framesquared/core':      path.resolve(pkgRoot, 'core/src/index.ts'),
      '@framesquared/component': path.resolve(pkgRoot, 'component/src/index.ts'),
      '@framesquared/layout':    path.resolve(pkgRoot, 'layout/src/index.ts'),
      '@framesquared/theme':     path.resolve(pkgRoot, 'theme/src/index.ts'),
      '@framesquared/ui':        path.resolve(pkgRoot, 'ui/src/index.ts'),
      '@framesquared/app':       path.resolve(pkgRoot, 'app/src/index.ts'),
      '@framesquared/data':      path.resolve(pkgRoot, 'data/src/index.ts'),
      '@framesquared/form':      path.resolve(pkgRoot, 'form/src/index.ts'),
    },
  },
});
