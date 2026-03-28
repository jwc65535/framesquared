import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TreeGridSelectionModel } from '../../src/treegrid/TreeGridSelectionModel.js';
import { TreeStore, TreeModel } from '@framesquared/data';
import type { NodeInterface } from '@framesquared/data';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeStore() {
  return new TreeStore({
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
        { id: 'c', text: 'C', leaf: true },
      ],
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLE mode
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridSelectionModel — SINGLE mode', () => {
  let store: TreeStore;
  let model: TreeGridSelectionModel;

  beforeEach(() => {
    store = makeStore();
    model = new TreeGridSelectionModel({ mode: 'SINGLE' });
  });

  it('starts with empty selection', () => {
    expect(model.getSelection()).toEqual([]);
    expect(model.getCount()).toBe(0);
  });

  it('select(node) selects the node', () => {
    const b = store.getNodeById('b') as NodeInterface;
    model.select(b);
    expect(model.isSelected(b)).toBe(true);
    expect(model.getCount()).toBe(1);
  });

  it('selecting a second node deselects the first', () => {
    const b = store.getNodeById('b') as NodeInterface;
    const c = store.getNodeById('c') as NodeInterface;
    model.select(b);
    model.select(c);
    expect(model.isSelected(b)).toBe(false);
    expect(model.isSelected(c)).toBe(true);
    expect(model.getCount()).toBe(1);
  });

  it('deselect removes from selection', () => {
    const b = store.getNodeById('b') as NodeInterface;
    model.select(b);
    model.deselect(b);
    expect(model.isSelected(b)).toBe(false);
  });

  it('deselectAll clears selection', () => {
    const b = store.getNodeById('b') as NodeInterface;
    model.select(b);
    model.deselectAll();
    expect(model.getSelection()).toEqual([]);
  });

  it('fires selectionchange on select', () => {
    const spy = vi.fn();
    model.on('selectionchange', spy);
    const b = store.getNodeById('b') as NodeInterface;
    model.select(b);
    expect(spy).toHaveBeenCalledWith(model, [b]);
  });

  it('suppressEvent skips selectionchange on select', () => {
    const spy = vi.fn();
    model.on('selectionchange', spy);
    const b = store.getNodeById('b') as NodeInterface;
    model.select(b, false, true);
    expect(spy).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MULTI mode
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridSelectionModel — MULTI mode', () => {
  let store: TreeStore;
  let model: TreeGridSelectionModel;

  beforeEach(() => {
    store = makeStore();
    model = new TreeGridSelectionModel({ mode: 'MULTI' });
  });

  it('select with keepExisting adds to selection', () => {
    const b = store.getNodeById('b') as NodeInterface;
    const c = store.getNodeById('c') as NodeInterface;
    model.select(b);
    model.select(c, true);
    expect(model.getCount()).toBe(2);
    expect(model.isSelected(b)).toBe(true);
    expect(model.isSelected(c)).toBe(true);
  });

  it('select array of nodes', () => {
    const b = store.getNodeById('b') as NodeInterface;
    const c = store.getNodeById('c') as NodeInterface;
    model.select([b, c]);
    expect(model.getCount()).toBe(2);
  });

  it('selectAll selects all nodes', () => {
    const flatData = store.flattenNodes() as NodeInterface[];
    model.selectAll(flatData);
    // root + all nodes
    expect(model.getCount()).toBeGreaterThan(0);
  });

  it('selectRange selects range in flatData order', () => {
    const flatData = store.flattenNodes() as NodeInterface[];
    const b = store.getNodeById('b') as NodeInterface;
    const c = store.getNodeById('c') as NodeInterface;
    // Select b first (anchor), then range to c
    model.select(b);
    model.selectRange(flatData, c);
    // Should include b, a2 (between b and c), and c in flat order
    expect(model.isSelected(b)).toBe(true);
    expect(model.isSelected(c)).toBe(true);
  });

  it('selectChildren selects direct children', () => {
    const a = store.getNodeById('a') as NodeInterface;
    const a1 = store.getNodeById('a1') as NodeInterface;
    const a2 = store.getNodeById('a2') as NodeInterface;
    model.selectChildren(a);
    expect(model.isSelected(a1)).toBe(true);
    expect(model.isSelected(a2)).toBe(true);
    expect(model.isSelected(a)).toBe(false);
  });

  it('selectChildren deep selects all descendants', () => {
    const a = store.getNodeById('a') as NodeInterface;
    const a1 = store.getNodeById('a1') as NodeInterface;
    const a2 = store.getNodeById('a2') as NodeInterface;
    model.selectChildren(a, true);
    expect(model.isSelected(a1)).toBe(true);
    expect(model.isSelected(a2)).toBe(true);
  });

  it('deselectChildren removes children from selection', () => {
    const a = store.getNodeById('a') as NodeInterface;
    const a1 = store.getNodeById('a1') as NodeInterface;
    const a2 = store.getNodeById('a2') as NodeInterface;
    model.selectChildren(a);
    model.deselectChildren(a);
    expect(model.isSelected(a1)).toBe(false);
    expect(model.isSelected(a2)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// deselectOnCollapse
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridSelectionModel — deselectOnCollapse', () => {
  it('deselectOnCollapse=true removes selected descendants when collapsed', () => {
    const store = makeStore();
    const model = new TreeGridSelectionModel({ mode: 'MULTI', deselectOnCollapse: true });
    const a = store.getNodeById('a') as NodeInterface;
    const a1 = store.getNodeById('a1') as NodeInterface;
    model.select(a1);
    model.onNodeCollapsed(a);
    expect(model.isSelected(a1)).toBe(false);
  });

  it('deselectOnCollapse=false keeps selected descendants', () => {
    const store = makeStore();
    const model = new TreeGridSelectionModel({ mode: 'MULTI', deselectOnCollapse: false });
    const a = store.getNodeById('a') as NodeInterface;
    const a1 = store.getNodeById('a1') as NodeInterface;
    model.select(a1);
    model.onNodeCollapsed(a);
    expect(model.isSelected(a1)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// pruneRemoved
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridSelectionModel — pruneRemoved', () => {
  it('pruneRemoved=true removes node on onNodeRemoved', () => {
    const store = makeStore();
    const model = new TreeGridSelectionModel({ pruneRemoved: true });
    const b = store.getNodeById('b') as NodeInterface;
    model.select(b);
    model.onNodeRemoved(b);
    expect(model.isSelected(b)).toBe(false);
  });

  it('pruneRemoved=false keeps node after onNodeRemoved', () => {
    const store = makeStore();
    const model = new TreeGridSelectionModel({ pruneRemoved: false });
    const b = store.getNodeById('b') as NodeInterface;
    model.select(b);
    model.onNodeRemoved(b);
    expect(model.isSelected(b)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Mode switching
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridSelectionModel — mode', () => {
  it('getMode returns current mode', () => {
    const model = new TreeGridSelectionModel({ mode: 'MULTI' });
    expect(model.getMode()).toBe('MULTI');
  });

  it('setMode changes mode', () => {
    const model = new TreeGridSelectionModel({ mode: 'MULTI' });
    model.setMode('SINGLE');
    expect(model.getMode()).toBe('SINGLE');
  });

  it('switching to SINGLE with multiple selected keeps only first', () => {
    const store = makeStore();
    const model = new TreeGridSelectionModel({ mode: 'MULTI' });
    const b = store.getNodeById('b') as NodeInterface;
    const c = store.getNodeById('c') as NodeInterface;
    model.select([b, c]);
    model.setMode('SINGLE');
    expect(model.getCount()).toBe(1);
  });
});
