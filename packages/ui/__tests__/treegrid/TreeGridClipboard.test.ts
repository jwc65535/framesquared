/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
        id: 'root',
        text: 'Root',
        expanded: true,
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
    const plugin = new TreeGridClipboard({ includeHeaders: true });
    plugin.init(grid);

    grid.select(grid.getNodeById('a')!);
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
    const plugin = new TreeGridClipboard({ includeHeaders: true });
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
          id: 'root',
          text: 'Root',
          expanded: true,
          children: [
            {
              id: 'parent',
              text: 'Parent',
              expanded: true,
              children: [{ id: 'child1', text: 'Child', leaf: true }],
            },
          ],
        },
      }),
      columns: [{ dataIndex: 'text', text: 'Name' }],
    } as any);

    const plugin = new TreeGridClipboard({ copyHierarchy: true });
    plugin.init(grid);

    // Select the parent: cascadeBy includes parent (relDepth=0) and child (relDepth=1).
    const parentNode = grid.getNodeById('parent')!;
    grid.select(parentNode);
    const text = plugin.copyToClipboard();
    const lines = text.split('\n');
    const childLine = lines.find((l) => l.includes('Child'));
    expect(childLine).toBeDefined();
    // Child is one level deeper than the selected parent, so one leading tab.
    expect(childLine!.startsWith('\t')).toBe(true);
    expect(childLine!.startsWith('\t\t')).toBe(false);
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
    expect(lines.length).toBe(2); // 2 selected nodes, no headers by default
  });
});
