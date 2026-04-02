import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TreeGridStateMixin } from '../../src/treegrid/TreeGridStateMixin.js';
import { TreeGrid } from '../../src/treegrid/TreeGrid.js';
import { TreeStore, TreeModel } from '@framesquared/data';
import type { NodeInterface } from '@framesquared/data';

class MockRO {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const STORAGE_KEY = 'treegrid.state.test-grid';

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
          {
            id: 'a',
            text: 'A',
            expanded: true,
            children: [
              { id: 'a1', text: 'A1', leaf: true },
              { id: 'a2', text: 'A2', leaf: true },
            ],
          },
          { id: 'b', text: 'B', leaf: true },
        ],
      },
    }),
    columns: [{ dataIndex: 'text', text: 'Name', width: 200 }],
    ...extra,
  } as any);
}

beforeEach(() => {
  (globalThis as any).ResizeObserver = MockRO;
  localStorage.clear();
});

afterEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
});

// ═══════════════════════════════════════════════════════════════════════════
// Construction
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridStateMixin — construction', () => {
  it('creates with stateId', () => {
    const mixin = new TreeGridStateMixin('my-grid');
    expect(mixin).toBeDefined();
  });

  it('init does not throw', () => {
    const grid = makeGrid();
    const mixin = new TreeGridStateMixin('test-grid');
    expect(() => mixin.init(grid)).not.toThrow();
  });

  it('destroy does not throw', () => {
    const grid = makeGrid();
    const mixin = new TreeGridStateMixin('test-grid');
    mixin.init(grid);
    expect(() => mixin.destroy()).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// getState
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridStateMixin — getState', () => {
  it('returns column widths', () => {
    const grid = makeGrid();
    const mixin = new TreeGridStateMixin('test-grid');
    mixin.init(grid);

    const state = mixin.getState();
    expect(state.columns).toBeDefined();
    expect(state.columns![0].id).toBe('text');
  });

  it('returns expanded nodes', () => {
    const grid = makeGrid();
    const mixin = new TreeGridStateMixin('test-grid');
    mixin.init(grid);

    const state = mixin.getState();
    expect(state.expandedNodes).toBeDefined();
    expect(state.expandedNodes).toContain('a');
  });

  it('returns checked nodes when checkable', () => {
    const grid = makeGrid({ checkable: true });
    const mixin = new TreeGridStateMixin('test-grid');
    mixin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    grid.setChecked(nodeA, true, true);

    const state = mixin.getState();
    expect(state.checkedNodes).toBeDefined();
    expect(state.checkedNodes).toContain('a');
  });

  it('returns selected nodes', () => {
    const grid = makeGrid();
    const mixin = new TreeGridStateMixin('test-grid');
    mixin.init(grid);

    const nodeB = grid.getNodeById('b')!;
    grid.select(nodeB);

    const state = mixin.getState();
    expect(state.selectedNodes).toContain('b');
  });

  it('returns column order', () => {
    const grid = makeGrid();
    const mixin = new TreeGridStateMixin('test-grid');
    mixin.init(grid);

    const state = mixin.getState();
    expect(state.columnOrder).toBeDefined();
    expect(state.columnOrder!.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// saveState / loadState
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridStateMixin — save/load', () => {
  it('saveState persists to localStorage', () => {
    const grid = makeGrid();
    const mixin = new TreeGridStateMixin('test-grid');
    mixin.init(grid);

    mixin.saveState();
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
  });

  it('loadState returns saved state', () => {
    const grid = makeGrid();
    const mixin = new TreeGridStateMixin('test-grid');
    mixin.init(grid);

    mixin.saveState();
    const state = mixin.loadState();
    expect(state).not.toBeNull();
    expect(state!.columns).toBeDefined();
  });

  it('loadState returns null when no state saved', () => {
    const mixin = new TreeGridStateMixin('nonexistent');
    expect(mixin.loadState()).toBeNull();
  });

  it('clearState removes from localStorage', () => {
    const grid = makeGrid();
    const mixin = new TreeGridStateMixin('test-grid');
    mixin.init(grid);

    mixin.saveState();
    mixin.clearState();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// applyState
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridStateMixin — applyState', () => {
  it('applyState restores column width', () => {
    const grid = makeGrid();
    const mixin = new TreeGridStateMixin('test-grid');
    mixin.init(grid);

    mixin.applyState({
      columns: [{ id: 'text', width: 350 }],
    });

    const col = grid.getColumnByDataIndex('text');
    expect(col!.width).toBe(350);
  });

  it('applyState restores hidden columns', () => {
    const grid = makeGrid();
    const mixin = new TreeGridStateMixin('test-grid');
    mixin.init(grid);

    mixin.applyState({
      columns: [{ id: 'text', hidden: true }],
    });

    const col = grid.getColumnByDataIndex('text');
    expect(col!.hidden).toBe(true);
  });

  it('applyState re-expands saved nodes', () => {
    const grid = makeGrid();
    const mixin = new TreeGridStateMixin('test-grid');
    mixin.init(grid);

    // Collapse first
    grid.collapseNode(grid.getNodeById('a')!);

    mixin.applyState({ expandedNodes: ['a'] });

    const nodeA = grid.getNodeById('a')!;
    expect(nodeA.isExpanded()).toBe(true);
  });

  it('applyState does not throw for unknown node ids', () => {
    const grid = makeGrid();
    const mixin = new TreeGridStateMixin('test-grid');
    mixin.init(grid);

    expect(() => {
      mixin.applyState({ expandedNodes: ['nonexistent'] });
    }).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Debounced save
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridStateMixin — debounced save', () => {
  it('rapid store events batch into single save', async () => {
    vi.useFakeTimers();
    const grid = makeGrid();
    const mixin = new TreeGridStateMixin('test-grid');
    mixin.init(grid);

    const saveSpy = vi.spyOn(mixin, 'saveState');

    // Fire multiple expand/collapse events
    (grid.getStore() as any).fireEvent?.('nodeexpand');
    (grid.getStore() as any).fireEvent?.('nodeexpand');
    (grid.getStore() as any).fireEvent?.('nodecollapse');

    // Not saved yet (debounce pending)
    expect(saveSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150);
    expect(saveSpy).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
