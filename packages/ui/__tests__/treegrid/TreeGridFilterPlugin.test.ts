/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TreeGridFilterPlugin } from '../../src/treegrid/TreeGridFilterPlugin.js';
import { TreeGrid } from '../../src/treegrid/TreeGrid.js';
import { TreeStore, TreeModel } from '@framesquared/data';

class MockRO {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function makeGrid() {
  return new TreeGrid({
    renderTo: document.body,
    store: new TreeStore({
      model: TreeModel,
      root: {
        id: 'root',
        text: 'Root',
        expanded: true,
        children: [
          {
            id: 'folder1',
            text: 'Alpha',
            expanded: true,
            children: [
              { id: 'item1', text: 'Apple', size: 10, leaf: true },
              { id: 'item2', text: 'Banana', size: 20, leaf: true },
            ],
          },
          {
            id: 'folder2',
            text: 'Beta',
            expanded: true,
            children: [{ id: 'item3', text: 'Cherry', size: 30, leaf: true }],
          },
        ],
      },
    }),
    columns: [
      { dataIndex: 'text', text: 'Name' },
      { dataIndex: 'size', text: 'Size' },
    ],
  } as any);
}

beforeEach(() => {
  (globalThis as any).ResizeObserver = MockRO;
});

afterEach(() => {
  document.body.innerHTML = '';
});

// ═══════════════════════════════════════════════════════════════════════════
// Construction
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridFilterPlugin — construction', () => {
  it('creates with defaults', () => {
    const plugin = new TreeGridFilterPlugin();
    expect(plugin).toBeDefined();
  });

  it('init does not throw', () => {
    const grid = makeGrid();
    const plugin = new TreeGridFilterPlugin();
    expect(() => plugin.init(grid)).not.toThrow();
  });

  it('destroy does not throw', () => {
    const grid = makeGrid();
    const plugin = new TreeGridFilterPlugin();
    plugin.init(grid);
    expect(() => plugin.destroy()).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Filter API
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridFilterPlugin — filter API', () => {
  it('addFilter stores filter', () => {
    const grid = makeGrid();
    const plugin = new TreeGridFilterPlugin();
    plugin.init(grid);

    plugin.addFilter({ dataIndex: 'text', value: 'Apple', operator: 'contains' });
    const filters = plugin.getActiveFilters();
    expect(filters.length).toBe(1);
    expect(filters[0].value).toBe('Apple');
  });

  it('addFilter replaces existing filter for same dataIndex', () => {
    const grid = makeGrid();
    const plugin = new TreeGridFilterPlugin();
    plugin.init(grid);

    plugin.addFilter({ dataIndex: 'text', value: 'Apple' });
    plugin.addFilter({ dataIndex: 'text', value: 'Banana' });
    expect(plugin.getActiveFilters().length).toBe(1);
    expect(plugin.getActiveFilters()[0].value).toBe('Banana');
  });

  it('removeFilter removes by dataIndex', () => {
    const grid = makeGrid();
    const plugin = new TreeGridFilterPlugin();
    plugin.init(grid);

    plugin.addFilter({ dataIndex: 'text', value: 'Apple' });
    plugin.removeFilter('text');
    expect(plugin.getActiveFilters().length).toBe(0);
  });

  it('clearFilters removes all active filters', () => {
    const grid = makeGrid();
    const plugin = new TreeGridFilterPlugin();
    plugin.init(grid);

    plugin.addFilter({ dataIndex: 'text', value: 'A' });
    plugin.addFilter({ dataIndex: 'size', value: 10 });
    plugin.clearFilters();
    expect(plugin.getActiveFilters().length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Filtering logic
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridFilterPlugin — filter logic', () => {
  it('bottomup: matching node and ancestors visible', () => {
    const grid = makeGrid();
    const plugin = new TreeGridFilterPlugin({ filterer: 'bottomup' });
    plugin.init(grid);

    plugin.addFilter({ dataIndex: 'text', value: 'Apple', operator: 'contains' });

    const item1 = grid.getNodeById('item1')!;
    const folder1 = grid.getNodeById('folder1')!;
    expect((item1 as any)._filterHidden).toBe(false);
    expect((folder1 as any)._filterHidden).toBe(false);
  });

  it('bottomup: non-matching node hidden', () => {
    const grid = makeGrid();
    const plugin = new TreeGridFilterPlugin({ filterer: 'bottomup' });
    plugin.init(grid);

    plugin.addFilter({ dataIndex: 'text', value: 'Apple', operator: 'contains' });

    const item2 = grid.getNodeById('item2')!;
    expect((item2 as any)._filterHidden).toBe(true);
  });

  it('topdown: node visible only if matches', () => {
    const grid = makeGrid();
    const plugin = new TreeGridFilterPlugin({ filterer: 'topdown' });
    plugin.init(grid);

    plugin.addFilter({ dataIndex: 'text', value: 'Apple', operator: 'contains' });

    const folder1 = grid.getNodeById('folder1')!;
    // folder1 doesn't contain 'Apple' in its text field
    expect((folder1 as any)._filterHidden).toBe(true);
  });

  it('clearFilters shows all nodes', () => {
    const grid = makeGrid();
    const plugin = new TreeGridFilterPlugin();
    plugin.init(grid);

    plugin.addFilter({ dataIndex: 'text', value: 'Apple' });
    plugin.clearFilters();

    const item2 = grid.getNodeById('item2')!;
    expect((item2 as any)._filterHidden).toBe(false);
  });

  it('numeric filter with gt operator', () => {
    const grid = makeGrid();
    const plugin = new TreeGridFilterPlugin({ filterer: 'bottomup' });
    plugin.init(grid);

    plugin.addFilter({ dataIndex: 'size', value: 15, operator: 'gt' });

    const item1 = grid.getNodeById('item1')!; // size=10
    const item2 = grid.getNodeById('item2')!; // size=20
    expect((item1 as any)._filterHidden).toBe(true);
    expect((item2 as any)._filterHidden).toBe(false);
  });

  it('getFilteredCount returns visible node count', () => {
    const grid = makeGrid();
    const plugin = new TreeGridFilterPlugin({ filterer: 'bottomup' });
    plugin.init(grid);

    plugin.addFilter({ dataIndex: 'text', value: 'Apple', operator: 'eq' });
    const count = plugin.getFilteredCount();
    expect(count).toBeGreaterThan(0);
  });

  it('multiple filters are AND-ed', () => {
    const grid = makeGrid();
    const plugin = new TreeGridFilterPlugin({ filterer: 'bottomup' });
    plugin.init(grid);

    plugin.addFilter({ dataIndex: 'text', value: 'Apple', operator: 'contains' });
    plugin.addFilter({ dataIndex: 'size', value: 10, operator: 'eq' });

    const item1 = grid.getNodeById('item1')!; // matches both
    const item3 = grid.getNodeById('item3')!; // doesn't match text
    expect((item1 as any)._filterHidden).toBe(false);
    expect((item3 as any)._filterHidden).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// showFilterRow
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridFilterPlugin — filter row', () => {
  it('showFilterRow=true renders filter inputs', () => {
    const grid = makeGrid();
    const plugin = new TreeGridFilterPlugin({ showFilterRow: true });
    plugin.init(grid);

    const filterInputs = document.querySelectorAll('.x-treegrid-filter-input');
    expect(filterInputs.length).toBeGreaterThan(0);
  });

  it('filter input triggers filter on input event', () => {
    const grid = makeGrid();
    const plugin = new TreeGridFilterPlugin({ showFilterRow: true });
    plugin.init(grid);

    const input = document.querySelector('.x-treegrid-filter-input') as HTMLInputElement;
    input.value = 'Apple';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(plugin.getActiveFilters().length).toBe(1);
  });
});
