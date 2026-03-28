import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TreeGridClipboard } from '../../src/treegrid/TreeGridClipboard.js';
import { TreeGrid } from '../../src/treegrid/TreeGrid.js';
import { TreeStore, TreeModel } from '@framesquared/data';

class MockRO {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function makeGrid(extra: Record<string, unknown> = {}) {
  return new TreeGrid({
    renderTo: document.body,
    store: new TreeStore({
      model: TreeModel,
      root: {
        id: 'root', text: 'Root', expanded: true,
        children: [
          { id: 'a', text: 'Alpha', size: 10, leaf: true },
          { id: 'b', text: 'Beta', size: 20, leaf: true },
        ],
      },
    }),
    columns: [
      { dataIndex: 'text', text: 'Name' },
      { dataIndex: 'size', text: 'Size' },
    ],
    ...extra,
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

describe('TreeGridClipboard — construction', () => {
  it('creates with defaults', () => {
    const plugin = new TreeGridClipboard();
    expect(plugin).toBeDefined();
  });

  it('init does not throw', () => {
    const grid = makeGrid();
    const plugin = new TreeGridClipboard();
    expect(() => plugin.init(grid)).not.toThrow();
  });

  it('destroy does not throw', () => {
    const grid = makeGrid();
    const plugin = new TreeGridClipboard();
    plugin.init(grid);
    expect(() => plugin.destroy()).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Copy
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridClipboard — copy', () => {
  it('copyToClipboard returns TSV with headers', () => {
    const grid = makeGrid();
    const plugin = new TreeGridClipboard();
    plugin.init(grid);

    const text = plugin.copyToClipboard();
    expect(text).toContain('Name');
    expect(text).toContain('Size');
  });

  it('copyToClipboard includes selected nodes', () => {
    const grid = makeGrid();
    const plugin = new TreeGridClipboard();
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    grid.select(nodeA);

    const text = plugin.copyToClipboard();
    expect(text).toContain('Alpha');
  });

  it('copyToClipboard with no selection has header only', () => {
    const grid = makeGrid();
    const plugin = new TreeGridClipboard();
    plugin.init(grid);

    const text = plugin.copyToClipboard();
    const lines = text.split('\n').filter(Boolean);
    expect(lines.length).toBe(1); // header only, no selected nodes
  });

  it('copyHierarchy=true indents tree column value', () => {
    const grid = new TreeGrid({
      renderTo: document.body,
      store: new TreeStore({
        model: TreeModel,
        root: {
          id: 'root', text: 'Root', expanded: true,
          children: [
            { id: 'parent', text: 'Parent', expanded: true, children: [
              { id: 'child1', text: 'Child', leaf: true },
            ]},
          ],
        },
      }),
      columns: [{ dataIndex: 'text', text: 'Name' }],
    } as any);

    const plugin = new TreeGridClipboard({ copyHierarchy: true });
    plugin.init(grid);

    const childNode = grid.getNodeById('child1')!;
    grid.select(childNode);
    const text = plugin.copyToClipboard();
    // depth 2 → 2 tabs or spaces prefix
    const lines = text.split('\n');
    const dataLine = lines.find((l) => l.includes('Child'));
    expect(dataLine).toBeDefined();
    expect(dataLine!.startsWith('\t\t')).toBe(true);
  });

  it('multiple selected nodes produce multiple rows', () => {
    const grid = makeGrid();
    const plugin = new TreeGridClipboard();
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    const nodeB = grid.getNodeById('b')!;
    grid.select([nodeA, nodeB]);

    const text = plugin.copyToClipboard();
    const lines = text.split('\n').filter(Boolean);
    expect(lines.length).toBe(3); // header + 2 nodes
  });
});
