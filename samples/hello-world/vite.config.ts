import { defineConfig } from 'vite';
import path from 'node:path';

const pkgRoot = path.resolve(__dirname, '../../packages');

export default defineConfig({
  build: {
    outDir: '.',
    emptyOutDir: false,
    lib: {
      entry: 'app.ts',
      formats: ['es'],
      fileName: () => 'app.js',
    },
    rollupOptions: {
      external: Object.keys({
        '@framesquared/core': 1,
        '@framesquared/component': 1,
        '@framesquared/layout': 1,
        '@framesquared/theme': 1,
        '@framesquared/ui': 1,
        '@framesquared/app': 1,
      }),
    },
  },
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
