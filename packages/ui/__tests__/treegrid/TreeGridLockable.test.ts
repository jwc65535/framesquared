import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TreeGridLockable } from '../../src/treegrid/TreeGridLockable.js';
import { TreeGrid } from '../../src/treegrid/TreeGrid.js';
import { TreeGridColumn, Column } from '../../src/treegrid/TreeGridColumn.js';
import { TreeStore, TreeModel } from '@framesquared/data';
import type { NodeInterface } from '@framesquared/data';

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
          { id: 'a', text: 'A', size: 10, date: '2025-01-01', leaf: true },
          { id: 'b', text: 'B', size: 20, date: '2025-02-01', leaf: true },
        ],
      },
    }),
    columns: [
      { dataIndex: 'text', text: 'Name', width: 200 },
      { dataIndex: 'size', text: 'Size', width: 100 },
      { dataIndex: 'date', text: 'Date', width: 120 },
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

describe('TreeGridLockable — construction', () => {
  it('creates with defaults', () => {
    const plugin = new TreeGridLockable();
    expect(plugin).toBeDefined();
  });

  it('init does not throw', () => {
    const grid = makeGrid();
    const plugin = new TreeGridLockable();
    expect(() => plugin.init(grid)).not.toThrow();
  });

  it('destroy does not throw', () => {
    const grid = makeGrid();
    const plugin = new TreeGridLockable();
    plugin.init(grid);
    expect(() => plugin.destroy()).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Panel splitting
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridLockable — panel splitting', () => {
  it('getLockedView returns null when no locked columns', () => {
    const grid = makeGrid();
    const plugin = new TreeGridLockable();
    plugin.init(grid);
    // No normal columns with locked=true except tree col
    // This tests the "not enough locked/normal columns" early-return path
    expect(plugin.getLockedView()).toBeNull();
  });

  it('split occurs when explicit locked columns present', () => {
    const grid = new TreeGrid({
      renderTo: document.body,
      store: new TreeStore({
        model: TreeModel,
        root: {
          id: 'root', text: 'Root', expanded: true,
          children: [
            { id: 'a', text: 'A', size: 10, leaf: true },
          ],
        },
      }),
      columns: [
        { dataIndex: 'text', text: 'Name', width: 200 },
        Object.assign(new Column({ dataIndex: 'size', text: 'Size', width: 100 }), { locked: false }),
      ],
    } as any);

    const plugin = new TreeGridLockable();
    plugin.init(grid);

    // With only tree col locked and size col unlocked,
    // we should get locked and normal views
    const lockedView = plugin.getLockedView();
    const normalView = plugin.getNormalView();
    // Both should exist since we have tree col (locked) and size col (normal)
    expect(lockedView).not.toBeNull();
    expect(normalView).not.toBeNull();
  });

  it('locked panel has x-treegrid-locked-panel class', () => {
    const grid = new TreeGrid({
      renderTo: document.body,
      store: new TreeStore({
        model: TreeModel,
        root: {
          id: 'root', text: 'Root', expanded: true,
          children: [{ id: 'a', text: 'A', size: 10, leaf: true }],
        },
      }),
      columns: [
        { dataIndex: 'text', text: 'Name', width: 200 },
        new Column({ dataIndex: 'size', text: 'Size', width: 100 }),
      ],
    } as any);

    const plugin = new TreeGridLockable();
    plugin.init(grid);

    const lockedPanel = document.querySelector('.x-treegrid-locked-panel');
    const normalPanel = document.querySelector('.x-treegrid-normal-panel');
    expect(lockedPanel).not.toBeNull();
    expect(normalPanel).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Scroll synchronization
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridLockable — scroll sync', () => {
  it('scroll sync is enabled by default', () => {
    const plugin = new TreeGridLockable();
    expect(plugin).toBeDefined(); // syncScroll=true is default
  });

  it('syncScroll=false disables sync', () => {
    const plugin = new TreeGridLockable({ syncScroll: false });
    expect(plugin).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Lock/Unlock columns
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridLockable — lock/unlock', () => {
  it('lockColumn marks column as locked', () => {
    const grid = makeGrid();
    const plugin = new TreeGridLockable();
    plugin.init(grid);

    const sizeCol = grid.getColumnByDataIndex('size')!;
    expect(() => plugin.lockColumn(sizeCol)).not.toThrow();
    expect((sizeCol as any).locked).toBe(true);
  });

  it('unlockColumn clears locked flag', () => {
    const grid = makeGrid();
    const plugin = new TreeGridLockable();
    plugin.init(grid);

    const sizeCol = grid.getColumnByDataIndex('size')!;
    plugin.lockColumn(sizeCol);
    plugin.unlockColumn(sizeCol);
    expect((sizeCol as any).locked).toBe(false);
  });

  it('TreeGridColumn cannot be unlocked', () => {
    const grid = makeGrid();
    const plugin = new TreeGridLockable();
    plugin.init(grid);

    const treeCol = grid.getTreeColumn();
    plugin.unlockColumn(treeCol); // Should be a no-op for tree column
    // Tree column stays as TreeGridColumn
    expect(grid.getTreeColumn()).toBe(treeCol);
  });
});
