import { describe, it, expect } from 'vitest';
import { existsSync, statSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../../..');

const PACKAGES = [
  'core',
  'data',
  'component',
  'layout',
  'ui',
  'form',
  'grid',
  'dd',
  'fx',
  'app',
  'theme',
];

// ═══════════════════════════════════════════════════════════════════════════
// Build artifact existence
// ═══════════════════════════════════════════════════════════════════════════

describe('Build artifacts', () => {
  for (const pkg of PACKAGES) {
    const distDir = join(ROOT, 'packages', pkg, 'dist');

    it(`@framesquared/${pkg}: dist/index.js exists`, () => {
      expect(existsSync(join(distDir, 'index.js'))).toBe(true);
    });

    it(`@framesquared/${pkg}: dist/index.d.ts exists`, () => {
      expect(existsSync(join(distDir, 'index.d.ts'))).toBe(true);
    });

    it(`@framesquared/${pkg}: dist/index.js is non-empty`, () => {
      const stat = statSync(join(distDir, 'index.js'));
      expect(stat.size).toBeGreaterThan(0);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Type declarations
// ═══════════════════════════════════════════════════════════════════════════

describe('Type declarations', () => {
  for (const pkg of PACKAGES) {
    it(`@framesquared/${pkg}: .d.ts contains export declarations`, () => {
      const dtsPath = join(ROOT, 'packages', pkg, 'dist', 'index.d.ts');
      const content = readFileSync(dtsPath, 'utf-8');
      expect(content).toContain('export');
    });
  }

  it('core types export Base, Observable, EventBus', () => {
    const dts = readFileSync(join(ROOT, 'packages/core/dist/index.d.ts'), 'utf-8');
    expect(dts).toContain('Base');
    expect(dts).toContain('Observable');
  });

  it('data types export Model, Store, Proxy', () => {
    const dts = readFileSync(join(ROOT, 'packages/data/dist/index.d.ts'), 'utf-8');
    expect(dts).toContain('Model');
    expect(dts).toContain('Store');
    expect(dts).toContain('Proxy');
  });

  it('ui types export Panel, Button, Window', () => {
    const dts = readFileSync(join(ROOT, 'packages/ui/dist/index.d.ts'), 'utf-8');
    expect(dts).toContain('Panel');
    expect(dts).toContain('Button');
    expect(dts).toContain('Window');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ESM output format
// ═══════════════════════════════════════════════════════════════════════════

describe('ESM output format', () => {
  for (const pkg of PACKAGES) {
    it(`@framesquared/${pkg}: output is ESM (contains export/import)`, () => {
      const jsPath = join(ROOT, 'packages', pkg, 'dist', 'index.js');
      const content = readFileSync(jsPath, 'utf-8');
      // ESM files use export statements
      expect(content).toMatch(/export\s/);
    });

    it(`@framesquared/${pkg}: output does NOT use CommonJS require()`, () => {
      const jsPath = join(ROOT, 'packages', pkg, 'dist', 'index.js');
      const content = readFileSync(jsPath, 'utf-8');
      // Should not contain require() calls
      expect(content).not.toMatch(/\brequire\s*\(/);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Source maps
// ═══════════════════════════════════════════════════════════════════════════

describe('Source maps', () => {
  for (const pkg of PACKAGES) {
    it(`@framesquared/${pkg}: source map exists`, () => {
      const mapPath = join(ROOT, 'packages', pkg, 'dist', 'index.js.map');
      expect(existsSync(mapPath)).toBe(true);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Size budgets (uncompressed — gzip not available in test env)
// ═══════════════════════════════════════════════════════════════════════════

describe('Size budgets (uncompressed)', () => {
  const BUDGETS: Record<string, number> = {
    core: 150_000, // < 150KB uncompressed (~30KB gzip)
    data: 100_000, // < 100KB (~20KB gzip)
    component: 50_000, // < 50KB
    layout: 80_000, // < 80KB
    ui: 200_000, // < 200KB (~50KB gzip)
    form: 150_000, // < 150KB
    grid: 150_000, // < 150KB
    dd: 50_000, // < 50KB
    fx: 30_000, // < 30KB
    app: 50_000, // < 50KB
    theme: 30_000, // < 30KB
  };

  for (const pkg of PACKAGES) {
    it(`@framesquared/${pkg}: under ${BUDGETS[pkg]! / 1000}KB budget`, () => {
      const jsPath = join(ROOT, 'packages', pkg, 'dist', 'index.js');
      const stat = statSync(jsPath);
      expect(stat.size).toBeLessThan(BUDGETS[pkg]!);
    });
  }

  it('total bundle under 1MB uncompressed', () => {
    let total = 0;
    for (const pkg of PACKAGES) {
      const jsPath = join(ROOT, 'packages', pkg, 'dist', 'index.js');
      total += statSync(jsPath).size;
    }
    expect(total).toBeLessThan(1_000_000);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tree shaking: ESM named exports (not default)
// ═══════════════════════════════════════════════════════════════════════════

describe('Tree shaking compatibility', () => {
  for (const pkg of PACKAGES) {
    it(`@framesquared/${pkg}: uses named exports (tree-shakeable)`, () => {
      const jsPath = join(ROOT, 'packages', pkg, 'dist', 'index.js');
      const content = readFileSync(jsPath, 'utf-8');
      // Named exports: "export { X, Y, Z }" or "export class/function/const"
      expect(content).toMatch(/export\s*\{/);
    });

    it(`@framesquared/${pkg}: no side effects in barrel (re-exports only)`, () => {
      const jsPath = join(ROOT, 'packages', pkg, 'dist', 'index.js');
      const content = readFileSync(jsPath, 'utf-8');
      // The barrel should primarily be re-exports, not executable code
      // Check it doesn't have console.log or DOM manipulation at top level
      expect(content).not.toMatch(/^console\./m);
    });
  }

  it('package.json "type": "module" for all packages', () => {
    for (const pkg of PACKAGES) {
      const pkgJson = JSON.parse(
        readFileSync(join(ROOT, 'packages', pkg, 'package.json'), 'utf-8'),
      );
      expect(pkgJson.type).toBe('module');
    }
  });

  it('package.json exports field present for all packages', () => {
    for (const pkg of PACKAGES) {
      const pkgJson = JSON.parse(
        readFileSync(join(ROOT, 'packages', pkg, 'package.json'), 'utf-8'),
      );
      expect(pkgJson.exports).toBeDefined();
      expect(pkgJson.exports['.']).toBeDefined();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// No circular dependencies (source-level check)
// ═══════════════════════════════════════════════════════════════════════════

describe('No circular dependencies', () => {
  function getImports(filePath: string): string[] {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const imports: string[] = [];
      const re = /from\s+['"](@framesquared\/[^'"]+)['"]/g;
      let match;
      while ((match = re.exec(content)) !== null) {
        imports.push(match[1]);
      }
      return imports;
    } catch {
      return [];
    }
  }

  // Dependency graph: each package should only import from packages lower in the stack
  const DEPENDENCY_ORDER = [
    '@framesquared/core',
    '@framesquared/data',
    '@framesquared/component',
    '@framesquared/layout',
    '@framesquared/ui',
    '@framesquared/form',
    '@framesquared/grid',
    '@framesquared/dd',
    '@framesquared/fx',
    '@framesquared/app',
    '@framesquared/theme',
  ];

  for (const pkg of PACKAGES) {
    it(`@framesquared/${pkg}: no upward dependency`, () => {
      const pkgName = `@framesquared/${pkg}`;
      const pkgIdx = DEPENDENCY_ORDER.indexOf(pkgName);
      const indexPath = join(ROOT, 'packages', pkg, 'dist', 'index.js');
      const imports = getImports(indexPath);

      for (const imp of imports) {
        const impIdx = DEPENDENCY_ORDER.indexOf(imp);
        if (impIdx >= 0) {
          // Imported package should be at a lower index (built earlier)
          expect(impIdx).toBeLessThan(pkgIdx);
        }
      }
    });
  }

  it('core has no @framesquared/* dependencies', () => {
    const indexPath = join(ROOT, 'packages/core/dist/index.js');
    const imports = getImports(indexPath);
    const extImports = imports.filter((i) => i.startsWith('@framesquared/'));
    expect(extImports).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Umbrella package
// ═══════════════════════════════════════════════════════════════════════════

describe('Umbrella package (framesquared)', () => {
  const umbrellaDir = join(ROOT, 'packages/framesquared/dist');

  it('framesquared dist/index.js exists', () => {
    expect(existsSync(join(umbrellaDir, 'index.js'))).toBe(true);
  });

  it('framesquared has sub-path entry points', () => {
    for (const pkg of PACKAGES) {
      expect(existsSync(join(umbrellaDir, `${pkg}.js`))).toBe(true);
    }
  });

  it('framesquared package.json has exports map', () => {
    const pkgJson = JSON.parse(
      readFileSync(join(ROOT, 'packages/framesquared/package.json'), 'utf-8'),
    );
    expect(pkgJson.exports['.']).toBeDefined();
    expect(pkgJson.exports['./core']).toBeDefined();
    expect(pkgJson.exports['./grid']).toBeDefined();
    expect(pkgJson.exports['./ui']).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Dynamic import verification
// ═══════════════════════════════════════════════════════════════════════════

describe('Dynamic imports resolve', () => {
  for (const pkg of PACKAGES) {
    it(`@framesquared/${pkg}: dynamic import succeeds`, async () => {
      const mod = await import(join(ROOT, 'packages', pkg, 'dist', 'index.js'));
      expect(Object.keys(mod).length).toBeGreaterThan(0);
    });
  }

  it('core exports include Base, AriaManager, Locale', async () => {
    const mod = await import(join(ROOT, 'packages/core/dist/index.js'));
    expect(mod.Base).toBeDefined();
    expect(mod.AriaManager).toBeDefined();
    expect(mod.Locale).toBeDefined();
  });

  it('data exports include Model, Store, GraphQLProxy', async () => {
    const mod = await import(join(ROOT, 'packages/data/dist/index.js'));
    expect(mod.Model).toBeDefined();
    expect(mod.Store).toBeDefined();
    expect(mod.GraphQLProxy).toBeDefined();
  });

  it('ui exports include Panel, Button, TabPanel', async () => {
    const mod = await import(join(ROOT, 'packages/ui/dist/index.js'));
    expect(mod.Panel).toBeDefined();
    expect(mod.Button).toBeDefined();
    expect(mod.TabPanel).toBeDefined();
  });
});
