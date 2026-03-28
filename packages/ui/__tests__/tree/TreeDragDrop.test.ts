import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TreeDragZone } from '../../src/tree/TreeDragZone.js';
import { TreeDropZone } from '../../src/tree/TreeDropZone.js';
import { TreeViewDragDrop } from '../../src/tree/TreeViewDragDrop.js';
import { TreeStore, TreeModel } from '@framesquared/data';
import type { NodeInterface } from '@framesquared/data';
import type { TreePanelLike } from '../../src/tree/TreeDragZone.js';

class MockRO {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  (globalThis as any).ResizeObserver = MockRO;
});

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
      ],
    },
  });
}

function makeViewEl(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'x-tree-view';
  document.body.appendChild(el);
  return el;
}

function makeMockTree(store: TreeStore): TreePanelLike & { getStore(): TreeStore } {
  const el = makeViewEl();
  return {
    getView: () => ({ el }),
    getSelection: () => [],
    getStore: () => store,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TreeDragZone
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeDragZone', () => {
  it('can be constructed', () => {
    const store = makeStore();
    const tree = makeMockTree(store);
    const dz = new TreeDragZone(tree, { ddGroup: 'TestDD' });
    expect(dz).toBeDefined();
    expect(dz.ddGroup).toBe('TestDD');
  });

  it('uses default ddGroup "TreeDD"', () => {
    const store = makeStore();
    const tree = makeMockTree(store);
    const dz = new TreeDragZone(tree);
    expect(dz.ddGroup).toBe('TreeDD');
  });

  it('destroy() does not throw', () => {
    const store = makeStore();
    const tree = makeMockTree(store);
    const dz = new TreeDragZone(tree);
    expect(() => dz.destroy()).not.toThrow();
  });

  it('isDragging() returns false initially', () => {
    const store = makeStore();
    const tree = makeMockTree(store);
    const dz = new TreeDragZone(tree);
    expect(dz.isDragging()).toBe(false);
  });

  it('dragData is null initially', () => {
    const store = makeStore();
    const tree = makeMockTree(store);
    const dz = new TreeDragZone(tree);
    expect(dz.dragData).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TreeDropZone
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeDropZone', () => {
  it('can be constructed', () => {
    const store = makeStore();
    const tree = makeMockTree(store);
    const dz = new TreeDropZone(tree, { ddGroup: 'TestDD' });
    expect(dz).toBeDefined();
    expect(dz.ddGroup).toBe('TestDD');
  });

  it('uses default ddGroup "TreeDD"', () => {
    const store = makeStore();
    const tree = makeMockTree(store);
    const dz = new TreeDropZone(tree);
    expect(dz.ddGroup).toBe('TreeDD');
  });

  it('destroy() does not throw', () => {
    const store = makeStore();
    const tree = makeMockTree(store);
    const dz = new TreeDropZone(tree);
    expect(() => dz.destroy()).not.toThrow();
  });

  it('default expandDelay is 500', () => {
    const store = makeStore();
    const tree = makeMockTree(store);
    const dz = new TreeDropZone(tree);
    expect(dz.expandDelay).toBe(500);
  });

  it('custom expandDelay is respected', () => {
    const store = makeStore();
    const tree = makeMockTree(store);
    const dz = new TreeDropZone(tree, { expandDelay: 1000 });
    expect(dz.expandDelay).toBe(1000);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// getDropPosition
// ═══════════════════════════════════════════════════════════════════════════

describe('getDropPosition', () => {
  function makeRowEl(top: number, height: number): HTMLElement {
    const el = document.createElement('tr');
    // Mock getBoundingClientRect
    el.getBoundingClientRect = () => ({
      top,
      bottom: top + height,
      left: 0,
      right: 100,
      width: 100,
      height,
      x: 0,
      y: top,
      toJSON: () => ({}),
    });
    return el;
  }

  it('returns "before" for top 25% of row', () => {
    const store = makeStore();
    const tree = makeMockTree(store);
    const dz = new TreeDropZone(tree);
    const row = makeRowEl(100, 20); // row top=100, height=20
    // clientY at 102 => relY=2, 2/20 = 10% => before
    expect(dz.getDropPosition(row, 102)).toBe('before');
  });

  it('returns "append" for middle 50% of row', () => {
    const store = makeStore();
    const tree = makeMockTree(store);
    const dz = new TreeDropZone(tree);
    const row = makeRowEl(100, 20);
    // clientY at 110 => relY=10, 10/20 = 50% => append
    expect(dz.getDropPosition(row, 110)).toBe('append');
  });

  it('returns "after" for bottom 25% of row', () => {
    const store = makeStore();
    const tree = makeMockTree(store);
    const dz = new TreeDropZone(tree);
    const row = makeRowEl(100, 20);
    // clientY at 117 => relY=17, 17/20 = 85% => after
    expect(dz.getDropPosition(row, 117)).toBe('after');
  });

  it('appendOnly always returns "append"', () => {
    const store = makeStore();
    const tree = makeMockTree(store);
    const dz = new TreeDropZone(tree, { appendOnly: true });
    const row = makeRowEl(100, 20);
    expect(dz.getDropPosition(row, 102)).toBe('append');
    expect(dz.getDropPosition(row, 117)).toBe('append');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TreeViewDragDrop
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeViewDragDrop', () => {
  it('can be constructed', () => {
    const plugin = new TreeViewDragDrop();
    expect(plugin).toBeDefined();
  });

  it('init() creates drag and drop zones', () => {
    const store = makeStore();
    const tree = makeMockTree(store);
    const plugin = new TreeViewDragDrop({ ddGroup: 'TestDD' });
    plugin.init(tree);
    expect(plugin.getDragZone()).not.toBeNull();
    expect(plugin.getDropZone()).not.toBeNull();
  });

  it('init() with enableDrag:false skips drag zone', () => {
    const store = makeStore();
    const tree = makeMockTree(store);
    const plugin = new TreeViewDragDrop({ enableDrag: false });
    plugin.init(tree);
    expect(plugin.getDragZone()).toBeNull();
    expect(plugin.getDropZone()).not.toBeNull();
  });

  it('init() with enableDrop:false skips drop zone', () => {
    const store = makeStore();
    const tree = makeMockTree(store);
    const plugin = new TreeViewDragDrop({ enableDrop: false });
    plugin.init(tree);
    expect(plugin.getDragZone()).not.toBeNull();
    expect(plugin.getDropZone()).toBeNull();
  });

  it('destroy() cleans up zones', () => {
    const store = makeStore();
    const tree = makeMockTree(store);
    const plugin = new TreeViewDragDrop();
    plugin.init(tree);
    plugin.destroy();
    expect(plugin.getDragZone()).toBeNull();
    expect(plugin.getDropZone()).toBeNull();
  });

  it('destroy() is safe to call without init()', () => {
    const plugin = new TreeViewDragDrop();
    expect(() => plugin.destroy()).not.toThrow();
  });
});
