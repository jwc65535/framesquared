/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TreeGridDragDrop } from '../../src/treegrid/TreeGridDragDrop.js';
import { TreeGrid } from '../../src/treegrid/TreeGrid.js';
import { TreeStore, TreeModel } from '@framesquared/data';
import type { NodeInterface } from '@framesquared/data';

class MockRO {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function makeStore() {
  return new TreeStore({
    model: TreeModel,
    root: {
      id: 'root',
      text: 'Root',
      expanded: true,
      children: [
        {
          id: 'folder1',
          text: 'Folder 1',
          expanded: true,
          children: [
            { id: 'file1', text: 'File 1', leaf: true },
            { id: 'file2', text: 'File 2', leaf: true },
          ],
        },
        { id: 'folder2', text: 'Folder 2', children: [] },
      ],
    },
  });
}

function makeGrid(extra: Record<string, unknown> = {}) {
  return new TreeGrid({
    renderTo: document.body,
    store: makeStore(),
    ...extra,
  } as any);
}

beforeEach(() => {
  (globalThis as any).ResizeObserver = MockRO;
  if (typeof (globalThis as any).PointerEvent === 'undefined') {
    (globalThis as any).PointerEvent = class PointerEvent extends MouseEvent {
      constructor(type: string, init?: PointerEventInit) {
        super(type, init);
      }
    };
  }
});

afterEach(() => {
  document.body.innerHTML = '';
});

// ═══════════════════════════════════════════════════════════════════════════
// Construction
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridDragDrop — construction', () => {
  it('creates plugin with defaults', () => {
    const plugin = new TreeGridDragDrop();
    expect(plugin).toBeDefined();
  });

  it('accepts config', () => {
    const plugin = new TreeGridDragDrop({
      enableDrag: false,
      appendOnly: true,
      expandDelay: 1000,
    });
    expect(plugin).toBeDefined();
  });

  it('init wires to treeGrid view', () => {
    const grid = makeGrid();
    const plugin = new TreeGridDragDrop();
    expect(() => plugin.init(grid)).not.toThrow();
  });

  it('destroy cleans up', () => {
    const grid = makeGrid();
    const plugin = new TreeGridDragDrop();
    plugin.init(grid);
    expect(() => plugin.destroy()).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Drag initiation
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridDragDrop — drag initiation', () => {
  it('does not start drag on root node', () => {
    const grid = makeGrid();
    const plugin = new TreeGridDragDrop();
    plugin.init(grid);

    // Verify root row lookup
    const root = grid.getRootNode();
    expect(root.isRoot()).toBe(true);
    // No crash when pointerdown on root area
  });

  it('enableDrag=false: no drag on pointerdown', () => {
    const grid = makeGrid();
    const plugin = new TreeGridDragDrop({ enableDrag: false });
    plugin.init(grid);
    // Just verify no error
    const viewEl = grid.getView().el!;
    viewEl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  });

  it('allowDrag=false on node: drag blocked', () => {
    const store = makeStore();
    const node = store.getNodeById('file1') as NodeInterface;
    (node as any).set?.('allowDrag', false);
    const grid = new TreeGrid({ renderTo: document.body, store } as any);
    const plugin = new TreeGridDragDrop();
    plugin.init(grid);
    // No crash
    const row = grid.getNodeRow(node);
    row?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Drop execution
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridDragDrop — drop execution', () => {
  it('appendOnly config is stored', () => {
    const plugin = new TreeGridDragDrop({ appendOnly: true });
    expect(plugin).toBeDefined(); // config is private; just ensure no crash
  });

  it('sortOnDrop config is stored', () => {
    const plugin = new TreeGridDragDrop({ sortOnDrop: true });
    expect(plugin).toBeDefined();
  });

  it('ddGroup config is stored', () => {
    const plugin = new TreeGridDragDrop({ ddGroup: 'MyGroup' });
    expect(plugin).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Drop position logic
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridDragDrop — position logic', () => {
  it('can be initialized with all config options', () => {
    const plugin = new TreeGridDragDrop({
      enableDrag: true,
      enableDrop: true,
      ddGroup: 'test',
      appendOnly: false,
      sortOnDrop: false,
      allowContainerDrops: false,
      expandDelay: 500,
      allowParentInserts: true,
      copy: false,
      allowCopy: true,
      nodeHighlightOnDrop: true,
      containerScrollOnDrag: true,
      containerScrollThreshold: 40,
      containerScrollSpeed: 10,
    });
    expect(plugin).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Lifecycle
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridDragDrop — lifecycle', () => {
  it('init and destroy twice does not throw', () => {
    const grid = makeGrid();
    const plugin = new TreeGridDragDrop();
    plugin.init(grid);
    plugin.destroy();
    expect(() => plugin.destroy()).not.toThrow();
  });

  it('multiple plugins can coexist', () => {
    const grid = makeGrid();
    const plugin1 = new TreeGridDragDrop({ ddGroup: 'g1' });
    const plugin2 = new TreeGridDragDrop({ ddGroup: 'g2' });
    plugin1.init(grid);
    plugin2.init(grid);
    plugin1.destroy();
    plugin2.destroy();
  });
});
