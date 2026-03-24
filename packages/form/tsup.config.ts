import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  outDir: 'dist',
  tsconfig: 'tsconfig.build.json',
  external: ['@ext-ts/core', '@ext-ts/component', '@ext-ts/ui'],
});
