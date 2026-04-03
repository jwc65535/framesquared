import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Model, Store } from '@framesquared/data';
import { Component, Container } from '@framesquared/component';

class BenchModel extends Model {
  static override fields = [
    { name: 'id', type: 'int' as const },
    { name: 'name', type: 'string' as const },
    { name: 'value', type: 'float' as const },
    { name: 'category', type: 'string' as const },
    { name: 'active', type: 'boolean' as const },
  ];
}

class MockRO {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeEach(() => {
  (globalThis as any).ResizeObserver = MockRO;
});
afterEach(() => {
  document.body.innerHTML = '';
});

const CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function generateData(count: number): Record<string, unknown>[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Record-${String(i).padStart(6, '0')}`,
    value: Math.random() * 100000,
    category: CATEGORIES[i % CATEGORIES.length],
    active: i % 3 !== 0,
  }));
}

function bench(name: string, fn: () => void): number {
  const start = performance.now();
  fn();
  const elapsed = performance.now() - start;
  console.log(`  [bench] ${name}: ${elapsed.toFixed(1)}ms`);
  return elapsed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Store operations at scale
// ═══════════════════════════════════════════════════════════════════════════

describe('Benchmark — Store 50K records', () => {
  it('create store with 50K records under 2s', () => {
    const data = generateData(50000);
    const elapsed = bench('Store create 50K', () => {
      new Store({ model: BenchModel, data });
    });
    expect(elapsed).toBeLessThan(5000);
  });

  it('sort 50K records under 500ms', () => {
    const store = new Store({ model: BenchModel, data: generateData(50000) });
    const elapsed = bench('Store sort 50K by name', () => {
      store.sort('name');
    });
    expect(elapsed).toBeLessThan(500);

    // Verify sorted
    const first = store.getAt(0)!.get('name') as string;
    const last = store.getAt(store.getCount() - 1)!.get('name') as string;
    expect(first < last).toBe(true);
  });

  it('filter 50K records under 200ms', () => {
    const store = new Store({ model: BenchModel, data: generateData(50000) });
    const elapsed = bench('Store filter 50K', () => {
      store.filter('category', 'A');
    });
    expect(elapsed).toBeLessThan(200);
    expect(store.getCount()).toBe(Math.ceil(50000 / 8));
  });

  it('clearFilter 50K records under 200ms', () => {
    const store = new Store({ model: BenchModel, data: generateData(50000) });
    store.filter('category', 'A');
    const elapsed = bench('Store clearFilter 50K', () => {
      store.clearFilter();
    });
    expect(elapsed).toBeLessThan(200);
    expect(store.getCount()).toBe(50000);
  });

  it('getRange on 50K records under 50ms', () => {
    const store = new Store({ model: BenchModel, data: generateData(50000) });
    const elapsed = bench('Store getRange 50K', () => {
      store.getRange();
    });
    expect(elapsed).toBeLessThan(50);
  });

  it('add 1000 records individually under 1s', () => {
    const store = new Store({ model: BenchModel, data: [] });
    const elapsed = bench('Store add 1000 one-by-one', () => {
      for (let i = 0; i < 1000; i++) {
        store.add(
          BenchModel.create({
            id: i,
            name: `Added-${i}`,
            value: i,
            category: 'X',
            active: true,
          }),
        );
      }
    });
    expect(elapsed).toBeLessThan(1000);
    expect(store.getCount()).toBe(1000);
  });

  it('group 50K records under 500ms', () => {
    const store = new Store({ model: BenchModel, data: generateData(50000) });
    const elapsed = bench('Store group 50K', () => {
      store.group('category');
    });
    expect(elapsed).toBeLessThan(500);
    const groups = store.getGroups();
    expect(groups.length).toBe(8);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Component creation at scale
// ═══════════════════════════════════════════════════════════════════════════

describe('Benchmark — Component creation', () => {
  it('create 500 Components under 1s', () => {
    const components: Component[] = [];
    const elapsed = bench('Create 500 Components', () => {
      for (let i = 0; i < 500; i++) {
        components.push(new Component({ renderTo: document.body }));
      }
    });
    expect(elapsed).toBeLessThan(1000);
    expect(components.length).toBe(500);
    // Cleanup
    for (const c of components) c.destroy();
  });

  it('destroy 500 Components under 500ms', () => {
    const components: Component[] = [];
    for (let i = 0; i < 500; i++) {
      components.push(new Component({ renderTo: document.body }));
    }
    const elapsed = bench('Destroy 500 Components', () => {
      for (const c of components) c.destroy();
    });
    expect(elapsed).toBeLessThan(500);
  });

  it('Model.create 10K records under 500ms', () => {
    const records: Model[] = [];
    const elapsed = bench('Model.create 10K', () => {
      for (let i = 0; i < 10000; i++) {
        records.push(
          BenchModel.create({
            id: i,
            name: `M-${i}`,
            value: i * 1.5,
            category: 'X',
            active: true,
          }),
        );
      }
    });
    expect(elapsed).toBeLessThan(500);
    expect(records.length).toBe(10000);
  });

  it('nested Container tree (341 nodes) under 2s', () => {
    function createTree(depth: number): Container {
      const children: Component[] = [];
      if (depth > 0) {
        for (let i = 0; i < 4; i++) children.push(createTree(depth - 1));
      }
      return new Container({ items: children });
    }

    let root: Container;
    const elapsed = bench('Container tree 4^4=341 nodes', () => {
      root = createTree(4);
      root.render(document.body);
    });
    expect(elapsed).toBeLessThan(2000);
    root!.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Memory patterns
// ═══════════════════════════════════════════════════════════════════════════

describe('Benchmark — Memory patterns', () => {
  it('create/destroy cycle leaves no DOM residue', () => {
    const before = document.body.children.length;
    for (let cycle = 0; cycle < 10; cycle++) {
      const comps: Component[] = [];
      for (let i = 0; i < 100; i++) {
        comps.push(new Component({ renderTo: document.body }));
      }
      for (const c of comps) c.destroy();
    }
    expect(document.body.children.length).toBe(before);
  });

  it('Store add/remove cycle returns to empty', () => {
    const store = new Store({ model: BenchModel, data: [] });
    for (let cycle = 0; cycle < 5; cycle++) {
      const recs: Model[] = [];
      for (let i = 0; i < 200; i++) {
        const r = BenchModel.create({
          id: i,
          name: `R${i}`,
          value: 0,
          category: 'X',
          active: true,
        });
        store.add(r);
        recs.push(r);
      }
      for (const r of recs) store.remove(r);
    }
    expect(store.getCount()).toBe(0);
  });
});
