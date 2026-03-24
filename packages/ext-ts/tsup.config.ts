import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    core: 'src/core.ts',
    data: 'src/data.ts',
    component: 'src/component.ts',
    layout: 'src/layout.ts',
    ui: 'src/ui.ts',
    form: 'src/form.ts',
    grid: 'src/grid.ts',
    dd: 'src/dd.ts',
    fx: 'src/fx.ts',
    app: 'src/app.ts',
    theme: 'src/theme.ts',
  },
  format: ['esm'],
  dts: false,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  outDir: 'dist',
  splitting: true,
  treeshake: true,
  external: [
    '@ext-ts/core', '@ext-ts/data', '@ext-ts/component', '@ext-ts/layout',
    '@ext-ts/ui', '@ext-ts/form', '@ext-ts/grid', '@ext-ts/dd',
    '@ext-ts/fx', '@ext-ts/app', '@ext-ts/theme',
  ],
});
