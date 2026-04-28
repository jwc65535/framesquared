import { defineConfig } from 'vite';
import path from 'node:path';

const pkgRoot = path.resolve(__dirname, '../../../packages');

export default defineConfig({
  resolve: {
    alias: {
      '@framesquared/core':      path.resolve(pkgRoot, 'core/src/index.ts'),
      '@framesquared/component': path.resolve(pkgRoot, 'component/src/index.ts'),
      '@framesquared/layout':    path.resolve(pkgRoot, 'layout/src/index.ts'),
      '@framesquared/theme':     path.resolve(pkgRoot, 'theme/src/index.ts'),
      '@framesquared/ui':        path.resolve(pkgRoot, 'ui/src/index.ts'),
      '@framesquared/app':       path.resolve(pkgRoot, 'app/src/index.ts'),
    },
  },
});
