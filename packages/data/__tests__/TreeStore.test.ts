import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TreeStore } from '../src/store/TreeStore.js';
import { TreeModel } from '../src/model/TreeModel.js';
import type { NodeInterface } from '../src/mixin/NodeInterface.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildStore(rootData?: Record<string, unknown>): TreeStore {
  return new TreeStore({
    model: TreeModel,
    root: rootData ?? { id: 1, text: 'Root' },
  });
}

describe('TreeStore – existing API', () => {
  describe('getRoot', () => {
    it('returns the root node', () => {
      const store = buildStore({ id: 1, text: 'Root' });
      const root = store.getRoot();
      expect(root).toBeDefined();
      expect(root.get('text')).toBe('Root');
    });
  });

  describe('getRootNode (alias)', () => {
    it('is an alias for getRoot', () => {
      const store = buildStore({ id: 1, text: 'Root' });
      expect(store.getRootNode()).toBe(store.getRoot());
    });
  });

  describe('getNodeById', () => {
    it('finds node by id', () => {
      const store = buildStore({
        id: 1,
        text: 'Root',
        children: [{ id: 2, text: 'Child', leaf: true }],
      });
      const node = store.getNodeById(2);
      expect(node).toBeDefined();
      expect(node!.get('text')).toBe('Child');
    });

    it('returns undefined for unknown id', () => {
      const store = buildStore({ id: 1, text: 'Root' });
      expect(store.getNodeById(999)).toBeUndefined();
    });
  });

  describe('appendChild', () => {
    it('appends a child to parent', () => {
      const store = buildStore({ id: 1, text: 'Root' });
      const root = store.getRoot();
      const child = TreeModel.create({ id: 2, text: 'C' }) as InstanceType<typeof TreeModel> &
        NodeInterface;
      store.appendChild(root, child);
      expect(root.childNodes).toHaveLength(1);
      expect(store.getNodeById(2)).toBe(child);
    });

    it('fires nodeappend event', () => {
      const store = buildStore({ id: 1, text: 'Root' });
      const spy = vi.fn();
      (store as unknown as { on: (e: string, fn: () => void) => void }).on('nodeappend', spy);
      const child = TreeModel.create({ id: 2, text: 'C' }) as InstanceType<typeof TreeModel> &
        NodeInterface;
      store.appendChild(store.getRoot(), child);
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe('removeChild', () => {
    it('removes a child', () => {
      const store = buildStore({
        id: 1,
        text: 'Root',
        children: [{ id: 2, text: 'C', leaf: true }],
      });
      const root = store.getRoot();
      store.removeChild(root, root.childNodes[0]);
      expect(root.childNodes).toHaveLength(0);
      expect(store.getNodeById(2)).toBeUndefined();
    });
  });

  describe('insertBefore', () => {
    it('inserts a node before another', () => {
      const store = buildStore({
        id: 1,
        text: 'Root',
        children: [
          { id: 2, text: 'A', leaf: true },
          { id: 3, text: 'C', leaf: true },
        ],
      });
      const root = store.getRoot();
      const refNode = root.childNodes[1]; // C
      const newNode = TreeModel.create({ id: 10, text: 'B' }) as InstanceType<typeof TreeModel> &
        NodeInterface;
      store.insertBefore(newNode, refNode);
      expect(root.childNodes[1]).toBe(newNode);
      expect(root.childNodes).toHaveLength(3);
    });
  });

  describe('expandNode / collapseNode', () => {
    it('expandNode sets expanded=true', () => {
      const store = buildStore({
        id: 1,
        text: 'Root',
        children: [{ id: 2, text: 'A' }],
      });
      const node = store.getNodeById(2)!;
      store.expandNode(node);
      expect(node.expanded).toBe(true);
    });

    it('collapseNode sets expanded=false', () => {
      const store = buildStore({
        id: 1,
        text: 'Root',
        expanded: true,
        children: [{ id: 2, text: 'A', expanded: true }],
      });
      const node = store.getNodeById(2)!;
      store.collapseNode(node);
      expect(node.expanded).toBe(false);
    });
  });

  describe('flattenNodes', () => {
    it('returns all visible nodes in depth-first order', () => {
      const store = buildStore({
        id: 1,
        text: 'Root',
        expanded: true,
        children: [
          { id: 2, text: 'A', expanded: true, children: [{ id: 4, text: 'A1', leaf: true }] },
          { id: 3, text: 'B', leaf: true },
        ],
      });
      const flat = store.flattenNodes();
      const texts = flat.map((n) => n.get('text'));
      expect(texts).toEqual(['Root', 'A', 'A1', 'B']);
    });

    it('hides children of collapsed nodes', () => {
      const store = buildStore({
        id: 1,
        text: 'Root',
        expanded: true,
        children: [
          { id: 2, text: 'A', expanded: false, children: [{ id: 4, text: 'A1', leaf: true }] },
          { id: 3, text: 'B', leaf: true },
        ],
      });
      const flat = store.flattenNodes();
      const texts = flat.map((n) => n.get('text'));
      expect(texts).toEqual(['Root', 'A', 'B']);
    });
  });
});

// ---------------------------------------------------------------------------
// New API
// ---------------------------------------------------------------------------

describe('TreeStore – setRoot', () => {
  it('replaces the root node', () => {
    const store = buildStore({ id: 1, text: 'OldRoot' });
    const newRoot = store.setRoot({ id: 10, text: 'NewRoot' });
    expect(store.getRoot()).toBe(newRoot);
    expect(store.getRoot().get('text')).toBe('NewRoot');
  });

  it('fires rootchange event', () => {
    const store = buildStore({ id: 1, text: 'Root' });
    const spy = vi.fn();
    (store as unknown as { on: (e: string, fn: () => void) => void }).on('rootchange', spy);
    store.setRoot({ id: 2, text: 'NewRoot' });
    // rootchange fires once on setRoot call (not counting constructor)
    expect(spy).toHaveBeenCalled();
  });

  it('old root nodes are unregistered', () => {
    const store = buildStore({
      id: 1,
      text: 'Root',
      children: [{ id: 2, text: 'C', leaf: true }],
    });
    expect(store.getNodeById(2)).toBeDefined();
    store.setRoot({ id: 10, text: 'NewRoot' });
    expect(store.getNodeById(2)).toBeUndefined();
  });

  it('new root with children registers them', () => {
    const store = buildStore({ id: 1, text: 'Root' });
    store.setRoot({
      id: 10,
      text: 'NewRoot',
      children: [{ id: 20, text: 'Child', leaf: true }],
    });
    expect(store.getNodeById(20)).toBeDefined();
  });
});

describe('TreeStore – findNode', () => {
  let store: TreeStore;

  beforeEach(() => {
    store = buildStore({
      id: 1,
      text: 'Root',
      children: [
        { id: 2, text: 'Alpha', leaf: true },
        { id: 3, text: 'Beta', children: [{ id: 4, text: 'Gamma', leaf: true }] },
      ],
    });
  });

  it('finds a direct child of root', () => {
    const node = store.findNode('text', 'Alpha');
    expect(node).toBeDefined();
    expect(node!.getId()).toBe(2);
  });

  it('finds a deeply nested node', () => {
    const node = store.findNode('text', 'Gamma');
    expect(node).toBeDefined();
    expect(node!.getId()).toBe(4);
  });

  it('returns undefined when not found', () => {
    expect(store.findNode('text', 'ZZZ')).toBeUndefined();
  });

  it('can search by id field', () => {
    const node = store.findNode('id', 3);
    expect(node).toBeDefined();
    expect(node!.get('text')).toBe('Beta');
  });
});

describe('TreeStore – collapseAll / expandAll', () => {
  it('collapseAll collapses all nodes', () => {
    const store = buildStore({
      id: 1,
      text: 'Root',
      expanded: true,
      children: [
        { id: 2, text: 'A', expanded: true, children: [{ id: 3, text: 'A1', leaf: true }] },
        { id: 4, text: 'B', expanded: true },
      ],
    });

    store.collapseAll();

    const root = store.getRoot();
    expect(root.expanded).toBe(false);
    expect(store.getNodeById(2)!.expanded).toBe(false);
    expect(store.getNodeById(4)!.expanded).toBe(false);
  });

  it('expandAll expands all nodes', () => {
    const store = buildStore({
      id: 1,
      text: 'Root',
      children: [
        { id: 2, text: 'A', children: [{ id: 3, text: 'A1', leaf: true }] },
        { id: 4, text: 'B' },
      ],
    });

    store.expandAll();

    const root = store.getRoot();
    expect(root.expanded).toBe(true);
    expect(store.getNodeById(2)!.expanded).toBe(true);
    expect(store.getNodeById(4)!.expanded).toBe(true);
  });
});

describe('TreeStore – getCount / getTotalCount', () => {
  it('getCount returns number of visible (flattened) nodes', () => {
    const store = buildStore({
      id: 1,
      text: 'Root',
      expanded: true,
      children: [
        { id: 2, text: 'A', leaf: true },
        { id: 3, text: 'B', leaf: true },
      ],
    });
    // Root + 2 children
    expect(store.getCount()).toBe(3);
  });

  it('getCount excludes children of collapsed nodes', () => {
    const store = buildStore({
      id: 1,
      text: 'Root',
      expanded: true,
      children: [
        { id: 2, text: 'A', expanded: false, children: [{ id: 4, text: 'A1', leaf: true }] },
        { id: 3, text: 'B', leaf: true },
      ],
    });
    // Root + A + B (A1 hidden because A collapsed)
    expect(store.getCount()).toBe(3);
  });

  it('getTotalCount returns total number of nodes in tree', () => {
    const store = buildStore({
      id: 1,
      text: 'Root',
      children: [
        { id: 2, text: 'A', children: [{ id: 4, text: 'A1', leaf: true }] },
        { id: 3, text: 'B', leaf: true },
      ],
    });
    // Root + A + A1 + B = 4
    expect(store.getTotalCount()).toBe(4);
  });
});
