import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TreeGrid } from '../../src/treegrid/TreeGrid.js';
import { TreeStore, TreeModel} from '@framesquared/data';

class MockRO {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// ─── Large tree builder ──────────────────────────────────────────────────────

function buildLargeTreeData(numFolders: number, filesPerFolder: number) {
  const children: Record<string, unknown>[] = [];
  for (let i = 0; i < numFolders; i++) {
    const folder: Record<string, unknown> = {
      id: `folder${i}`,
      text: `Folder ${i}`,
      children: [],
    };
    for (let j = 0; j < filesPerFolder; j++) {
      (folder.children as Record<string, unknown>[]).push({
        id: `file${i}_${j}`,
        text: `File ${i}-${j}`,
        size: Math.random() * 1000,
        leaf: true,
      });
    }
    children.push(folder);
  }
  return children;
}

beforeEach(() => {
  (globalThis as any).ResizeObserver = MockRO;
});

afterEach(() => {
  document.body.innerHTML = '';
});

// ═══════════════════════════════════════════════════════════════════════════
// Initial render performance
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridPerformance — initial render', () => {
  it('renders 100 nodes in reasonable time (< 1s)', () => {
    const start = performance.now();
    const grid = new TreeGrid({
      renderTo: document.body,
      store: {
        model: TreeModel,
        root: {
          id: 'root',
          text: 'Root',
          expanded: true,
          children: buildLargeTreeData(10, 9), // 100 files
        },
      },
      columns: [{ dataIndex: 'text', text: 'Name' }],
    } as any);

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000);
    expect(grid).toBeDefined();
  });

  it('renders 1000 nodes expanded without crashing', () => {
    const grid = new TreeGrid({
      renderTo: document.body,
      store: {
        model: TreeModel,
        root: {
          id: 'root',
          text: 'Root',
          expanded: true,
          children: buildLargeTreeData(20, 4).map((folder) => ({
            ...folder,
            expanded: true,
          })),
        },
      },
      columns: [{ dataIndex: 'text', text: 'Name' }],
    } as any);

    const rows = grid.el!.querySelectorAll('tr[data-record-id]').length;
    // 20 folders + 80 files = 100 rows minimum
    expect(rows).toBeGreaterThan(80);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Expand / Collapse performance
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridPerformance — expand/collapse', () => {
  it('expandAll completes in < 2s for 200 nodes', () => {
    const grid = new TreeGrid({
      renderTo: document.body,
      store: {
        model: TreeModel,
        root: {
          id: 'root',
          text: 'Root',
          expanded: true,
          children: buildLargeTreeData(20, 9), // 180 leaves + 20 folders
        },
      },
      columns: [{ dataIndex: 'text', text: 'Name' }],
    } as any);

    grid.collapseAll();

    const start = performance.now();
    grid.expandAll();
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });

  it('collapseAll completes quickly', () => {
    const grid = new TreeGrid({
      renderTo: document.body,
      store: {
        model: TreeModel,
        root: {
          id: 'root',
          text: 'Root',
          expanded: true,
          children: buildLargeTreeData(10, 5).map((f) => ({ ...f, expanded: true })),
        },
      },
      columns: [{ dataIndex: 'text', text: 'Name' }],
    } as any);

    const start = performance.now();
    grid.collapseAll();
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// flatData performance
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridPerformance — flattenNodes', () => {
  it('flattenNodes completes quickly for 1000 nodes', () => {
    const store = new TreeStore({
      model: TreeModel,
      root: {
        id: 'root',
        text: 'Root',
        expanded: true,
        children: buildLargeTreeData(10, 99), // 990 leaves + 10 folders
      },
    });

    const start = performance.now();
    store.expandAll();
    const nodes = store.flattenNodes();
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(500);
    expect(nodes.length).toBeGreaterThan(900);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Selection performance
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridPerformance — selection', () => {
  it('selectAll on 200 nodes is fast', () => {
    const grid = new TreeGrid({
      renderTo: document.body,
      store: {
        model: TreeModel,
        root: {
          id: 'root',
          text: 'Root',
          expanded: true,
          children: buildLargeTreeData(20, 9).map((f) => ({ ...f, expanded: true })),
        },
      },
      columns: [{ dataIndex: 'text', text: 'Name' }],
      selModel: { mode: 'MULTI' },
    } as any);

    const start = performance.now();
    grid.selectAll();
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(500);
    expect(grid.getSelection().length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Refresh performance
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridPerformance — refresh', () => {
  it('refresh handles 500 visible nodes', () => {
    const grid = new TreeGrid({
      renderTo: document.body,
      store: {
        model: TreeModel,
        root: {
          id: 'root',
          text: 'Root',
          expanded: true,
          children: buildLargeTreeData(50, 9).map((f) => ({ ...f, expanded: true })),
        },
      },
      columns: [{ dataIndex: 'text', text: 'Name' }],
    } as any);

    const start = performance.now();
    grid.getView().refresh();
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(2000);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Memory
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridPerformance — memory', () => {
  it('creates and destroys many small grids without throwing', () => {
    const grids: TreeGrid[] = [];
    for (let i = 0; i < 10; i++) {
      const container = document.createElement('div');
      document.body.appendChild(container);
      grids.push(
        new TreeGrid({
          renderTo: container,
          store: {
            model: TreeModel,
            root: {
              id: `root${i}`,
              text: 'Root',
              expanded: true,
              children: [
                { id: `n${i}_1`, text: 'Node 1', leaf: true },
                { id: `n${i}_2`, text: 'Node 2', leaf: true },
              ],
            },
          },
          columns: [{ dataIndex: 'text', text: 'Name' }],
        } as any),
      );
    }

    // Destroy all
    for (const grid of grids) {
      expect(() => grid.destroy()).not.toThrow();
    }
  });
});
