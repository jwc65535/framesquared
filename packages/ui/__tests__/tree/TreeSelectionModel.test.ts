import { describe, it, expect, vi, afterEach } from 'vitest';
import { TreeSelectionModel } from '../../src/selection/TreeSelectionModel.js';
import { CheckboxModel } from '../../src/tree/CheckboxModel.js';
import { TreeStore, TreeModel } from '@framesquared/data';
import type { NodeInterface } from '@framesquared/data';

afterEach(() => {
  document.body.innerHTML = '';
});

function makeStore(): TreeStore {
  return new TreeStore({
    model: TreeModel,
    root: {
      id: 'root',
      text: 'Root',
      expanded: true,
      children: [
        { id: 'a', text: 'A', children: [{ id: 'a1', text: 'A1', leaf: true }] },
        { id: 'b', text: 'B', leaf: true },
        { id: 'c', text: 'C', leaf: true },
      ],
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// TreeSelectionModel
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeSelectionModel basics', () => {
  it('starts with empty selection', () => {
    const sm = new TreeSelectionModel();
    expect(sm.getSelection()).toEqual([]);
    expect(sm.getCount()).toBe(0);
  });

  it('select() selects a node', () => {
    const store = makeStore();
    const sm = new TreeSelectionModel();
    const nodeA = store.getNodeById('a') as NodeInterface;
    sm.select(nodeA);
    expect(sm.isSelected(nodeA)).toBe(true);
    expect(sm.getSelection()).toContain(nodeA);
  });

  it('select() with array selects multiple (multi mode)', () => {
    const store = makeStore();
    const sm = new TreeSelectionModel({ mode: 'multi' });
    const nodeA = store.getNodeById('a') as NodeInterface;
    const nodeB = store.getNodeById('b') as NodeInterface;
    sm.select([nodeA, nodeB]);
    expect(sm.isSelected(nodeA)).toBe(true);
    expect(sm.isSelected(nodeB)).toBe(true);
    expect(sm.getCount()).toBe(2);
  });

  it('deselect() removes a node from selection', () => {
    const store = makeStore();
    const sm = new TreeSelectionModel({ mode: 'multi' });
    const nodeA = store.getNodeById('a') as NodeInterface;
    sm.select(nodeA);
    sm.deselect(nodeA);
    expect(sm.isSelected(nodeA)).toBe(false);
  });

  it('deselectAll() clears all selections', () => {
    const store = makeStore();
    const sm = new TreeSelectionModel({ mode: 'multi' });
    const nodeA = store.getNodeById('a') as NodeInterface;
    const nodeB = store.getNodeById('b') as NodeInterface;
    sm.select([nodeA, nodeB]);
    sm.deselectAll();
    expect(sm.getSelection()).toEqual([]);
    expect(sm.getCount()).toBe(0);
  });

  it('isSelected() returns correct boolean', () => {
    const store = makeStore();
    const sm = new TreeSelectionModel();
    const nodeA = store.getNodeById('a') as NodeInterface;
    const nodeB = store.getNodeById('b') as NodeInterface;
    sm.select(nodeA);
    expect(sm.isSelected(nodeA)).toBe(true);
    expect(sm.isSelected(nodeB)).toBe(false);
  });

  it('getSelection() returns array of selected nodes', () => {
    const store = makeStore();
    const sm = new TreeSelectionModel({ mode: 'multi' });
    const nodeA = store.getNodeById('a') as NodeInterface;
    sm.select(nodeA);
    const sel = sm.getSelection();
    expect(Array.isArray(sel)).toBe(true);
    expect(sel).toContain(nodeA);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Single mode
// ═══════════════════════════════════════════════════════════════════════════

describe('single mode', () => {
  it('selecting new node deselects previous', () => {
    const store = makeStore();
    const sm = new TreeSelectionModel({ mode: 'single' });
    const nodeA = store.getNodeById('a') as NodeInterface;
    const nodeB = store.getNodeById('b') as NodeInterface;
    sm.select(nodeA);
    sm.select(nodeB);
    expect(sm.isSelected(nodeA)).toBe(false);
    expect(sm.isSelected(nodeB)).toBe(true);
    expect(sm.getCount()).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Multi mode
// ═══════════════════════════════════════════════════════════════════════════

describe('multi mode', () => {
  it('multiple nodes can be selected', () => {
    const store = makeStore();
    const sm = new TreeSelectionModel({ mode: 'multi' });
    const nodeA = store.getNodeById('a') as NodeInterface;
    const nodeB = store.getNodeById('b') as NodeInterface;
    const nodeC = store.getNodeById('c') as NodeInterface;
    sm.select(nodeA);
    sm.select(nodeB, true);
    sm.select(nodeC, true);
    expect(sm.getCount()).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Events
// ═══════════════════════════════════════════════════════════════════════════

describe('events', () => {
  it('selectionchange event fires on select', () => {
    const store = makeStore();
    const sm = new TreeSelectionModel();
    const spy = vi.fn();
    sm.on('selectionchange', spy);
    const nodeA = store.getNodeById('a') as NodeInterface;
    sm.select(nodeA);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('selectionchange event fires on deselect', () => {
    const store = makeStore();
    const sm = new TreeSelectionModel({ mode: 'multi' });
    const spy = vi.fn();
    const nodeA = store.getNodeById('a') as NodeInterface;
    sm.select(nodeA);
    sm.on('selectionchange', spy);
    sm.deselect(nodeA);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('selectionchange event fires on deselectAll', () => {
    const _store = makeStore();
    const sm = new TreeSelectionModel();
    const spy = vi.fn();
    sm.on('selectionchange', spy);
    sm.deselectAll();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('suppressEvent=true prevents event from firing', () => {
    const store = makeStore();
    const sm = new TreeSelectionModel();
    const spy = vi.fn();
    sm.on('selectionchange', spy);
    const nodeA = store.getNodeById('a') as NodeInterface;
    sm.select(nodeA, false, true);
    expect(spy).not.toHaveBeenCalled();
  });

  it('un() removes an event listener', () => {
    const sm = new TreeSelectionModel();
    const spy = vi.fn();
    sm.on('selectionchange', spy);
    sm.un('selectionchange', spy);
    const store = makeStore();
    const nodeA = store.getNodeById('a') as NodeInterface;
    sm.select(nodeA);
    expect(spy).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Aliases
// ═══════════════════════════════════════════════════════════════════════════

describe('node-specific aliases', () => {
  it('selectNode() works like select()', () => {
    const store = makeStore();
    const sm = new TreeSelectionModel();
    const nodeA = store.getNodeById('a') as NodeInterface;
    sm.selectNode(nodeA);
    expect(sm.isNodeSelected(nodeA)).toBe(true);
  });

  it('deselectNode() works like deselect()', () => {
    const store = makeStore();
    const sm = new TreeSelectionModel({ mode: 'multi' });
    const nodeA = store.getNodeById('a') as NodeInterface;
    sm.selectNode(nodeA);
    sm.deselectNode(nodeA);
    expect(sm.isNodeSelected(nodeA)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// pruneRemovedNodes
// ═══════════════════════════════════════════════════════════════════════════

describe('pruneRemovedNodes', () => {
  it('deselects nodes that have been removed', () => {
    const store = makeStore();
    const sm = new TreeSelectionModel({ mode: 'multi', pruneRemoved: true });
    const nodeA = store.getNodeById('a') as NodeInterface;
    const nodeB = store.getNodeById('b') as NodeInterface;
    sm.select([nodeA, nodeB]);
    sm.pruneRemovedNodes([nodeA]);
    expect(sm.isSelected(nodeA)).toBe(false);
    expect(sm.isSelected(nodeB)).toBe(true);
  });

  it('pruneRemoved:false does not deselect', () => {
    const store = makeStore();
    const sm = new TreeSelectionModel({ mode: 'multi', pruneRemoved: false });
    const nodeA = store.getNodeById('a') as NodeInterface;
    sm.select(nodeA);
    sm.pruneRemovedNodes([nodeA]);
    expect(sm.isSelected(nodeA)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CheckboxModel
// ═══════════════════════════════════════════════════════════════════════════

describe('CheckboxModel', () => {
  it('extends TreeSelectionModel', () => {
    const cm = new CheckboxModel();
    expect(cm).toBeInstanceOf(TreeSelectionModel);
  });

  it('toggleCheck sets checked to true initially', () => {
    const store = makeStore();
    const nodeB = store.getNodeById('b') as NodeInterface;
    (nodeB as any).$checked = false;
    const cm = new CheckboxModel();
    cm.toggleCheck(nodeB);
    expect((nodeB as any).$checked).toBe(true);
  });

  it('toggleCheck toggles from true to false', () => {
    const store = makeStore();
    const nodeB = store.getNodeById('b') as NodeInterface;
    (nodeB as any).$checked = true;
    const cm = new CheckboxModel();
    cm.toggleCheck(nodeB);
    expect((nodeB as any).$checked).toBe(false);
  });

  it('cascadeChecks=true propagates to children', () => {
    const store = makeStore();
    const nodeA = store.getNodeById('a') as NodeInterface;
    const nodeA1 = store.getNodeById('a1') as NodeInterface;
    const cm = new CheckboxModel({ cascadeChecks: true });
    cm.setChecked(nodeA, true);
    expect((nodeA1 as any).$checked).toBe(true);
  });

  it('cascadeChecks=false does not propagate to children', () => {
    const store = makeStore();
    const nodeA = store.getNodeById('a') as NodeInterface;
    const nodeA1 = store.getNodeById('a1') as NodeInterface;
    (nodeA1 as any).$checked = false;
    const cm = new CheckboxModel({ cascadeChecks: false });
    cm.setChecked(nodeA, true);
    expect((nodeA1 as any).$checked).toBe(false);
  });

  it('getChecked returns nodes with checked=true', () => {
    const store = makeStore();
    const nodeB = store.getNodeById('b') as NodeInterface;
    (nodeB as any).$checked = true;
    const cm = new CheckboxModel();
    const checked = cm.getChecked(store);
    expect(checked).toContain(nodeB);
  });

  it('getChecked returns empty array when nothing checked', () => {
    const store = makeStore();
    const cm = new CheckboxModel();
    expect(cm.getChecked(store)).toEqual([]);
  });

  it('isCheckable returns true for all nodes by default', () => {
    const store = makeStore();
    const nodeA = store.getNodeById('a') as NodeInterface;
    const nodeB = store.getNodeById('b') as NodeInterface;
    const cm = new CheckboxModel();
    expect(cm.isCheckable(nodeA)).toBe(true);
    expect(cm.isCheckable(nodeB)).toBe(true);
  });

  it('onlyLeafCheckable=true: non-leaf returns false', () => {
    const store = makeStore();
    const nodeA = store.getNodeById('a') as NodeInterface;
    const nodeB = store.getNodeById('b') as NodeInterface;
    const cm = new CheckboxModel({ onlyLeafCheckable: true });
    expect(cm.isCheckable(nodeA)).toBe(false);
    expect(cm.isCheckable(nodeB)).toBe(true);
  });
});
