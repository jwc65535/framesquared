import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Model, Store } from '@framesquared/data';
import { Component, Container } from '@framesquared/component';

class PerfModel extends Model {
  static override fields = [
    { name: 'id', type: 'int' as const },
    { name: 'name', type: 'string' as const },
    { name: 'value', type: 'float' as const },
    { name: 'category', type: 'string' as const },
  ];
}

class MockRO { constructor() {} observe() {} unobserve() {} disconnect() {} }
beforeEach(() => { (globalThis as any).ResizeObserver = MockRO; });
afterEach(() => { document.body.innerHTML = ''; });

function generateRecords(count: number): Record<string, unknown>[] {
  const categories = ['A', 'B', 'C', 'D', 'E'];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Record ${i + 1}`,
    value: Math.random() * 10000,
    category: categories[i % 5],
  }));
}

describe('Performance — Store operations', () => {
  it('Store with 10,000 records: create under 500ms', () => {
    const data = generateRecords(10000);
    const start = performance.now();
    const store = new Store({ model: PerfModel, data });
    const elapsed = performance.now() - start;

    expect(store.getCount()).toBe(10000);
    expect(elapsed).toBeLessThan(500);
  });

  it('Store sort 10,000 records under 200ms', () => {
    const data = generateRecords(10000);
    const store = new Store({ model: PerfModel, data });

    const start = performance.now();
    store.sort('name');
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(200);
    // Verify sorted
    const first = store.getAt(0)!.get('name') as string;
    const second = store.getAt(1)!.get('name') as string;
    expect(first <= second).toBe(true);
  });

  it('Store filter 10,000 records under 100ms', () => {
    const data = generateRecords(10000);
    const store = new Store({ model: PerfModel, data });

    const start = performance.now();
    store.filter('category', 'A');
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(100);
    expect(store.getCount()).toBe(2000); // 10000 / 5 categories
  });

  it('Store add/remove 1000 records individually under 500ms', () => {
    const store = new Store({ model: PerfModel, data: [] });

    const start = performance.now();
    const records: Model[] = [];
    for (let i = 0; i < 1000; i++) {
      const rec = PerfModel.create({ id: i, name: `R${i}`, value: i, category: 'X' });
      store.add(rec);
      records.push(rec);
    }
    for (const rec of records) {
      store.remove(rec);
    }
    const elapsed = performance.now() - start;

    expect(store.getCount()).toBe(0);
    expect(elapsed).toBeLessThan(500);
  });

  it('Store clearFilter restores all records', () => {
    const data = generateRecords(5000);
    const store = new Store({ model: PerfModel, data });

    store.filter('category', 'B');
    expect(store.getCount()).toBe(1000);

    store.clearFilter();
    expect(store.getCount()).toBe(5000);
  });
});

describe('Performance — Component creation', () => {
  it('create and destroy 200 Components under 1000ms', () => {
    const start = performance.now();
    const components: Component[] = [];

    for (let i = 0; i < 200; i++) {
      const c = new Component({ renderTo: document.body, html: `<p>Component ${i}</p>` });
      components.push(c);
    }

    expect(document.body.children.length).toBeGreaterThanOrEqual(200);

    for (const c of components) {
      c.destroy();
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });

  it('nested Container hierarchy: 5 levels × 4 children = 1365 components', () => {
    // 4^0 + 4^1 + 4^2 + 4^3 + 4^4 = 1 + 4 + 16 + 64 + 256 = 341
    function createTree(depth: number): Container {
      const children: Component[] = [];
      if (depth > 0) {
        for (let i = 0; i < 4; i++) {
          children.push(createTree(depth - 1));
        }
      }
      return new Container({ items: children });
    }

    const start = performance.now();
    const root = createTree(4);
    root.render(document.body);
    const elapsed = performance.now() - start;

    expect(root.el).not.toBeNull();
    expect(elapsed).toBeLessThan(2000);

    // Destroy
    const destroyStart = performance.now();
    root.destroy();
    const destroyElapsed = performance.now() - destroyStart;
    expect(destroyElapsed).toBeLessThan(1000);
  });

  it('Model.create 5000 records under 200ms', () => {
    const start = performance.now();
    const records: Model[] = [];
    for (let i = 0; i < 5000; i++) {
      records.push(PerfModel.create({ id: i, name: `R${i}`, value: i * 1.5, category: 'X' }));
    }
    const elapsed = performance.now() - start;

    expect(records.length).toBe(5000);
    expect(records[0].get('name')).toBe('R0');
    expect(elapsed).toBeLessThan(200);
  });
});

describe('Performance — memory patterns', () => {
  it('create and destroy cycle does not accumulate DOM nodes', () => {
    const initialChildCount = document.body.children.length;

    for (let cycle = 0; cycle < 5; cycle++) {
      const components: Component[] = [];
      for (let i = 0; i < 50; i++) {
        components.push(new Component({ renderTo: document.body }));
      }
      for (const c of components) {
        c.destroy();
      }
    }

    // After all cycles, DOM should be clean
    expect(document.body.children.length).toBe(initialChildCount);
  });

  it('Store getRange returns defensive copy', () => {
    const store = new Store({
      model: PerfModel,
      data: generateRecords(100),
    });

    const range1 = store.getRange();
    const range2 = store.getRange();

    // Different array instances
    expect(range1).not.toBe(range2);
    expect(range1.length).toBe(range2.length);
  });
});
