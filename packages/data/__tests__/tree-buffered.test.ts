import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Model } from '../src/Model.js';
import { FieldType } from '../src/field/Field.js';
import { Operation } from '../src/Operation.js';
import { ResultSet } from '../src/ResultSet.js';
import { TreeStore } from '../src/store/TreeStore.js';
import { BufferedStore } from '../src/store/BufferedStore.js';
import type { NodeInterface } from '../src/mixin/NodeInterface.js';
import { applyNodeInterface } from '../src/mixin/NodeInterface.js';

// ---------------------------------------------------------------------------
// Test models
// ---------------------------------------------------------------------------

class TreeNode extends Model {
  static override $className = 'tree.test.Node';
  static override fields = [
    { name: 'id', type: FieldType.INT },
    { name: 'text', type: FieldType.STRING },
    { name: 'leaf', type: FieldType.BOOLEAN, defaultValue: false },
  ];
  static override idProperty = 'id';
}

class PagedItem extends Model {
  static override $className = 'buffered.test.Item';
  static override fields = [
    { name: 'id', type: FieldType.INT },
    { name: 'name', type: FieldType.STRING },
  ];
  static override idProperty = 'id';
}

// ═══════════════════════════════════════════════════════════════════════════
// NodeInterface
// ═══════════════════════════════════════════════════════════════════════════

describe('NodeInterface', () => {
  it('applyNodeInterface adds node properties to a model', () => {
    const node = TreeNode.create({ id: 1, text: 'Root' }) as Model & NodeInterface;
    applyNodeInterface(node);
    expect(node.childNodes).toEqual([]);
    expect(node.parentNode).toBeNull();
    expect(node.depth).toBe(0);
    expect(node.isRoot()).toBe(true);
  });

  it('isLeaf returns true when leaf=true', () => {
    const node = TreeNode.create({ id: 1, text: 'Leaf', leaf: true }) as Model & NodeInterface;
    applyNodeInterface(node);
    expect(node.isLeaf()).toBe(true);
  });

  it('isLeaf returns false when node has children', () => {
    const parent = TreeNode.create({ id: 1, text: 'P' }) as Model & NodeInterface;
    const child = TreeNode.create({ id: 2, text: 'C' }) as Model & NodeInterface;
    applyNodeInterface(parent);
    applyNodeInterface(child);
    parent.appendChild(child);
    expect(parent.isLeaf()).toBe(false);
  });

  it('appendChild sets up parent/child relationships', () => {
    const p = TreeNode.create({ id: 1, text: 'P' }) as Model & NodeInterface;
    const c1 = TreeNode.create({ id: 2, text: 'C1' }) as Model & NodeInterface;
    const c2 = TreeNode.create({ id: 3, text: 'C2' }) as Model & NodeInterface;
    applyNodeInterface(p);
    applyNodeInterface(c1);
    applyNodeInterface(c2);

    p.appendChild(c1);
    p.appendChild(c2);

    expect(p.childNodes.length).toBe(2);
    expect(c1.parentNode).toBe(p);
    expect(c2.parentNode).toBe(p);
    expect(p.firstChild).toBe(c1);
    expect(p.lastChild).toBe(c2);
    expect(c1.nextSibling).toBe(c2);
    expect(c2.previousSibling).toBe(c1);
    expect(c1.depth).toBe(1);
  });

  it('removeChild removes a child and updates siblings', () => {
    const p = TreeNode.create({ id: 1, text: 'P' }) as Model & NodeInterface;
    const c1 = TreeNode.create({ id: 2, text: 'C1' }) as Model & NodeInterface;
    const c2 = TreeNode.create({ id: 3, text: 'C2' }) as Model & NodeInterface;
    const c3 = TreeNode.create({ id: 4, text: 'C3' }) as Model & NodeInterface;
    applyNodeInterface(p);
    applyNodeInterface(c1);
    applyNodeInterface(c2);
    applyNodeInterface(c3);

    p.appendChild(c1);
    p.appendChild(c2);
    p.appendChild(c3);
    p.removeChild(c2);

    expect(p.childNodes.length).toBe(2);
    expect(c1.nextSibling).toBe(c3);
    expect(c3.previousSibling).toBe(c1);
    expect(c2.parentNode).toBeNull();
  });

  it('insertBefore inserts at correct position', () => {
    const p = TreeNode.create({ id: 1, text: 'P' }) as Model & NodeInterface;
    const c1 = TreeNode.create({ id: 2, text: 'C1' }) as Model & NodeInterface;
    const c3 = TreeNode.create({ id: 4, text: 'C3' }) as Model & NodeInterface;
    const c2 = TreeNode.create({ id: 3, text: 'C2' }) as Model & NodeInterface;
    applyNodeInterface(p);
    applyNodeInterface(c1);
    applyNodeInterface(c2);
    applyNodeInterface(c3);

    p.appendChild(c1);
    p.appendChild(c3);
    p.insertBefore(c2, c3);

    expect(p.childNodes[1]).toBe(c2);
    expect(c1.nextSibling).toBe(c2);
    expect(c2.nextSibling).toBe(c3);
    expect(c2.previousSibling).toBe(c1);
  });

  it('getPath returns slash-separated path', () => {
    const root = TreeNode.create({ id: 1, text: 'Root' }) as Model & NodeInterface;
    const parent = TreeNode.create({ id: 2, text: 'Parent' }) as Model & NodeInterface;
    const child = TreeNode.create({ id: 3, text: 'Child' }) as Model & NodeInterface;
    applyNodeInterface(root);
    applyNodeInterface(parent);
    applyNodeInterface(child);

    root.appendChild(parent);
    parent.appendChild(child);

    expect(child.getPath()).toBe('/Root/Parent/Child');
    expect(root.getPath()).toBe('/Root');
  });

  it('getPath with custom separator', () => {
    const root = TreeNode.create({ id: 1, text: 'A' }) as Model & NodeInterface;
    const child = TreeNode.create({ id: 2, text: 'B' }) as Model & NodeInterface;
    applyNodeInterface(root);
    applyNodeInterface(child);
    root.appendChild(child);
    expect(child.getPath('.')).toBe('.A.B');
  });

  it('cascadeBy walks depth-first', () => {
    const root = TreeNode.create({ id: 1, text: 'R' }) as Model & NodeInterface;
    const c1 = TreeNode.create({ id: 2, text: 'C1' }) as Model & NodeInterface;
    const c2 = TreeNode.create({ id: 3, text: 'C2' }) as Model & NodeInterface;
    const gc = TreeNode.create({ id: 4, text: 'GC' }) as Model & NodeInterface;
    [root, c1, c2, gc].forEach(applyNodeInterface);

    root.appendChild(c1);
    root.appendChild(c2);
    c1.appendChild(gc);

    const visited: string[] = [];
    root.cascadeBy((n) => { visited.push(n.get('text') as string); });
    expect(visited).toEqual(['R', 'C1', 'GC', 'C2']);
  });

  it('cascadeBy can stop early by returning false', () => {
    const root = TreeNode.create({ id: 1, text: 'R' }) as Model & NodeInterface;
    const c1 = TreeNode.create({ id: 2, text: 'C1' }) as Model & NodeInterface;
    const c2 = TreeNode.create({ id: 3, text: 'C2' }) as Model & NodeInterface;
    [root, c1, c2].forEach(applyNodeInterface);
    root.appendChild(c1);
    root.appendChild(c2);

    const visited: string[] = [];
    root.cascadeBy((n) => {
      visited.push(n.get('text') as string);
      if (n.get('text') === 'C1') return false;
    });
    expect(visited).toEqual(['R', 'C1']);
  });

  it('bubble walks up from node to root', () => {
    const root = TreeNode.create({ id: 1, text: 'R' }) as Model & NodeInterface;
    const mid = TreeNode.create({ id: 2, text: 'M' }) as Model & NodeInterface;
    const leaf = TreeNode.create({ id: 3, text: 'L' }) as Model & NodeInterface;
    [root, mid, leaf].forEach(applyNodeInterface);
    root.appendChild(mid);
    mid.appendChild(leaf);

    const visited: string[] = [];
    leaf.bubble((n) => { visited.push(n.get('text') as string); });
    expect(visited).toEqual(['L', 'M', 'R']);
  });

  it('contains checks descendant relationship', () => {
    const root = TreeNode.create({ id: 1, text: 'R' }) as Model & NodeInterface;
    const child = TreeNode.create({ id: 2, text: 'C' }) as Model & NodeInterface;
    const gc = TreeNode.create({ id: 3, text: 'GC' }) as Model & NodeInterface;
    const other = TreeNode.create({ id: 4, text: 'O' }) as Model & NodeInterface;
    [root, child, gc, other].forEach(applyNodeInterface);
    root.appendChild(child);
    child.appendChild(gc);

    expect(root.contains(gc)).toBe(true);
    expect(root.contains(other)).toBe(false);
    expect(child.contains(gc)).toBe(true);
  });

  it('findChild searches children by field value', () => {
    const root = TreeNode.create({ id: 1, text: 'R' }) as Model & NodeInterface;
    const c1 = TreeNode.create({ id: 2, text: 'Alpha' }) as Model & NodeInterface;
    const c2 = TreeNode.create({ id: 3, text: 'Beta' }) as Model & NodeInterface;
    [root, c1, c2].forEach(applyNodeInterface);
    root.appendChild(c1);
    root.appendChild(c2);

    expect(root.findChild('text', 'Beta')).toBe(c2);
    expect(root.findChild('text', 'Gamma')).toBeUndefined();
  });

  it('findChild with deep=true searches descendants', () => {
    const root = TreeNode.create({ id: 1, text: 'R' }) as Model & NodeInterface;
    const child = TreeNode.create({ id: 2, text: 'C' }) as Model & NodeInterface;
    const gc = TreeNode.create({ id: 3, text: 'Target' }) as Model & NodeInterface;
    [root, child, gc].forEach(applyNodeInterface);
    root.appendChild(child);
    child.appendChild(gc);

    expect(root.findChild('text', 'Target', true)).toBe(gc);
    expect(root.findChild('text', 'Target', false)).toBeUndefined();
  });

  it('sort sorts children', () => {
    const root = TreeNode.create({ id: 1, text: 'R' }) as Model & NodeInterface;
    const c3 = TreeNode.create({ id: 3, text: 'C' }) as Model & NodeInterface;
    const c1 = TreeNode.create({ id: 1, text: 'A' }) as Model & NodeInterface;
    const c2 = TreeNode.create({ id: 2, text: 'B' }) as Model & NodeInterface;
    [root, c1, c2, c3].forEach(applyNodeInterface);
    root.appendChild(c3);
    root.appendChild(c1);
    root.appendChild(c2);

    root.sort([{ property: 'text', direction: 'ASC' }]);
    expect(root.childNodes[0].get('text')).toBe('A');
    expect(root.childNodes[1].get('text')).toBe('B');
    expect(root.childNodes[2].get('text')).toBe('C');
  });

  it('isExpanded / isLoaded defaults', () => {
    const node = TreeNode.create({ id: 1, text: 'N' }) as Model & NodeInterface;
    applyNodeInterface(node);
    expect(node.isExpanded()).toBe(false);
    expect(node.isLoaded()).toBe(false);
  });

  it('serializes to nested JSON', () => {
    const root = TreeNode.create({ id: 1, text: 'R' }) as Model & NodeInterface;
    const c1 = TreeNode.create({ id: 2, text: 'C1', leaf: true }) as Model & NodeInterface;
    const c2 = TreeNode.create({ id: 3, text: 'C2' }) as Model & NodeInterface;
    const gc = TreeNode.create({ id: 4, text: 'GC', leaf: true }) as Model & NodeInterface;
    [root, c1, c2, gc].forEach(applyNodeInterface);
    root.appendChild(c1);
    root.appendChild(c2);
    c2.appendChild(gc);

    const json = root.serialize();
    expect(json.text).toBe('R');
    expect(json.children.length).toBe(2);
    expect(json.children[0].text).toBe('C1');
    expect(json.children[0].leaf).toBe(true);
    expect(json.children[1].children.length).toBe(1);
    expect(json.children[1].children[0].text).toBe('GC');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TreeStore
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeStore', () => {
  describe('construction from nested JSON', () => {
    it('builds a tree from nested data', () => {
      const store = new TreeStore({
        model: TreeNode,
        root: {
          id: 1, text: 'Root', children: [
            { id: 2, text: 'A', leaf: true },
            {
              id: 3, text: 'B', children: [
                { id: 4, text: 'B1', leaf: true },
                { id: 5, text: 'B2', leaf: true },
              ],
            },
          ],
        },
      });
      const root = store.getRoot();
      expect(root).toBeDefined();
      expect(root.childNodes.length).toBe(2);
      expect(root.childNodes[1].childNodes.length).toBe(2);
    });

    it('getNodeById finds nodes at any depth', () => {
      const store = new TreeStore({
        model: TreeNode,
        root: {
          id: 1, text: 'Root', children: [
            {
              id: 2, text: 'A', children: [
                { id: 3, text: 'Deep', leaf: true },
              ],
            },
          ],
        },
      });
      const deep = store.getNodeById(3);
      expect(deep).toBeDefined();
      expect(deep!.get('text')).toBe('Deep');
    });

    it('parent/child relationships are correct', () => {
      const store = new TreeStore({
        model: TreeNode,
        root: {
          id: 1, text: 'R', children: [
            { id: 2, text: 'C', leaf: true },
          ],
        },
      });
      const root = store.getRoot();
      const child = root.childNodes[0];
      expect(child.parentNode).toBe(root);
      expect(child.depth).toBe(1);
    });
  });

  describe('tree operations', () => {
    let store: InstanceType<typeof TreeStore>;

    beforeEach(() => {
      store = new TreeStore({
        model: TreeNode,
        root: {
          id: 1, text: 'Root', children: [
            { id: 2, text: 'A', leaf: true },
            { id: 3, text: 'B', leaf: true },
          ],
        },
      });
    });

    it('appendChild adds a child', () => {
      const root = store.getRoot();
      const newNode = TreeNode.create({ id: 4, text: 'C', leaf: true }) as Model & NodeInterface;
      applyNodeInterface(newNode);
      store.appendChild(root, newNode);
      expect(root.childNodes.length).toBe(3);
      expect(store.getNodeById(4)).toBe(newNode);
    });

    it('removeChild removes a child', () => {
      const root = store.getRoot();
      const a = root.childNodes[0];
      store.removeChild(root, a);
      expect(root.childNodes.length).toBe(1);
      expect(store.getNodeById(2)).toBeUndefined();
    });

    it('insertBefore inserts at correct position', () => {
      const root = store.getRoot();
      const b = root.childNodes[1];
      const newNode = TreeNode.create({ id: 4, text: 'A.5' }) as Model & NodeInterface;
      applyNodeInterface(newNode);
      store.insertBefore(newNode, b);
      expect(root.childNodes[1]).toBe(newNode);
      expect(root.childNodes.length).toBe(3);
    });
  });

  describe('flattenNodes', () => {
    it('returns all nodes in depth-first order when all expanded', () => {
      const store = new TreeStore({
        model: TreeNode,
        root: {
          id: 1, text: 'R', expanded: true, children: [
            { id: 2, text: 'A', expanded: true, children: [
              { id: 4, text: 'A1', leaf: true },
            ]},
            { id: 3, text: 'B', leaf: true },
          ],
        },
      });
      const flat = store.flattenNodes();
      const texts = flat.map((n) => n.get('text'));
      expect(texts).toEqual(['R', 'A', 'A1', 'B']);
    });

    it('skips children of collapsed nodes', () => {
      const store = new TreeStore({
        model: TreeNode,
        root: {
          id: 1, text: 'R', expanded: true, children: [
            { id: 2, text: 'A', expanded: false, children: [
              { id: 4, text: 'A1', leaf: true },
            ]},
            { id: 3, text: 'B', leaf: true },
          ],
        },
      });
      const flat = store.flattenNodes();
      const texts = flat.map((n) => n.get('text'));
      expect(texts).toEqual(['R', 'A', 'B']);
    });
  });

  describe('expandNode / collapseNode', () => {
    it('expandNode sets expanded=true and fires event', () => {
      const store = new TreeStore({
        model: TreeNode,
        root: {
          id: 1, text: 'R', children: [
            { id: 2, text: 'A', children: [
              { id: 3, text: 'A1', leaf: true },
            ]},
          ],
        },
      });
      const spy = vi.fn();
      (store as any).on('nodeexpand', spy);
      const a = store.getNodeById(2)!;
      store.expandNode(a as any);
      expect(a.isExpanded()).toBe(true);
      expect(spy).toHaveBeenCalledOnce();
    });

    it('collapseNode sets expanded=false and fires event', () => {
      const store = new TreeStore({
        model: TreeNode,
        root: {
          id: 1, text: 'R', expanded: true, children: [
            { id: 2, text: 'A', expanded: true, children: [
              { id: 3, text: 'A1', leaf: true },
            ]},
          ],
        },
      });
      const spy = vi.fn();
      (store as any).on('nodecollapse', spy);
      const a = store.getNodeById(2)!;
      store.collapseNode(a as any);
      expect(a.isExpanded()).toBe(false);
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe('events', () => {
    it('fires nodeappend on appendChild', () => {
      const store = new TreeStore({
        model: TreeNode,
        root: { id: 1, text: 'R' },
      });
      const spy = vi.fn();
      (store as any).on('nodeappend', spy);
      const child = TreeNode.create({ id: 2, text: 'C' }) as Model & NodeInterface;
      applyNodeInterface(child);
      store.appendChild(store.getRoot(), child);
      expect(spy).toHaveBeenCalledOnce();
    });

    it('fires noderemove on removeChild', () => {
      const store = new TreeStore({
        model: TreeNode,
        root: {
          id: 1, text: 'R', children: [
            { id: 2, text: 'C', leaf: true },
          ],
        },
      });
      const spy = vi.fn();
      (store as any).on('noderemove', spy);
      const root = store.getRoot();
      store.removeChild(root, root.childNodes[0]);
      expect(spy).toHaveBeenCalledOnce();
    });

    it('fires nodeinsert on insertBefore', () => {
      const store = new TreeStore({
        model: TreeNode,
        root: {
          id: 1, text: 'R', children: [
            { id: 2, text: 'A', leaf: true },
          ],
        },
      });
      const spy = vi.fn();
      (store as any).on('nodeinsert', spy);
      const newNode = TreeNode.create({ id: 3, text: 'B' }) as Model & NodeInterface;
      applyNodeInterface(newNode);
      store.insertBefore(newNode, store.getRoot().childNodes[0]);
      expect(spy).toHaveBeenCalledOnce();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BufferedStore
// ═══════════════════════════════════════════════════════════════════════════

describe('BufferedStore', () => {
  function createMockProxy() {
    return {
      model: PagedItem,
      read: vi.fn(async (op: Operation) => {
        const start = op.start ?? 0;
        const limit = op.limit ?? 25;
        const records: Model[] = [];
        for (let i = start; i < start + limit && i < 200; i++) {
          records.push(PagedItem.create({ id: i + 1, name: `Item ${i + 1}` }));
        }
        return new ResultSet({ records, total: 200, success: true });
      }),
      create: vi.fn(async () => new ResultSet({ records: [], success: true })),
      update: vi.fn(async () => new ResultSet({ records: [], success: true })),
      destroy: vi.fn(async () => new ResultSet({ records: [], success: true })),
    };
  }

  it('constructs with pageSize config', () => {
    const store = new BufferedStore({
      model: PagedItem,
      pageSize: 50,
    });
    expect(store.getPageSize()).toBe(50);
  });

  it('getCount returns 0 before any load', () => {
    const store = new BufferedStore({ model: PagedItem, pageSize: 25 });
    expect(store.getCount()).toBe(0);
  });

  it('guaranteeRange loads data from proxy', async () => {
    const proxy = createMockProxy();
    const store = new BufferedStore({
      model: PagedItem,
      pageSize: 25,
      proxy: proxy as any,
    });

    await store.guaranteeRange(0, 24);
    expect(proxy.read).toHaveBeenCalled();
    expect(store.getCount()).toBeGreaterThan(0);
  });

  it('guaranteeRange fires guaranteedrange event', async () => {
    const proxy = createMockProxy();
    const store = new BufferedStore({
      model: PagedItem,
      pageSize: 25,
      proxy: proxy as any,
    });

    const spy = vi.fn();
    (store as any).on('guaranteedrange', spy);
    await store.guaranteeRange(0, 24);
    expect(spy).toHaveBeenCalled();
  });

  it('getTotalCount returns server total after load', async () => {
    const proxy = createMockProxy();
    const store = new BufferedStore({
      model: PagedItem,
      pageSize: 25,
      proxy: proxy as any,
    });

    await store.guaranteeRange(0, 24);
    expect(store.getTotalCount()).toBe(200);
  });

  it('does not re-fetch already loaded pages', async () => {
    const proxy = createMockProxy();
    const store = new BufferedStore({
      model: PagedItem,
      pageSize: 25,
      proxy: proxy as any,
    });

    await store.guaranteeRange(0, 24);
    const callCount = proxy.read.mock.calls.length;
    await store.guaranteeRange(0, 24);
    expect(proxy.read.mock.calls.length).toBe(callCount);
  });

  it('loads additional pages for uncached range', async () => {
    const proxy = createMockProxy();
    const store = new BufferedStore({
      model: PagedItem,
      pageSize: 25,
      proxy: proxy as any,
    });

    await store.guaranteeRange(0, 24);
    const callsAfterFirst = proxy.read.mock.calls.length;
    await store.guaranteeRange(25, 49);
    expect(proxy.read.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it('getAt returns record from loaded page', async () => {
    const proxy = createMockProxy();
    const store = new BufferedStore({
      model: PagedItem,
      pageSize: 25,
      proxy: proxy as any,
    });

    await store.guaranteeRange(0, 24);
    const record = store.getAt(0);
    expect(record).toBeDefined();
    expect(record!.get('name')).toBe('Item 1');
  });

  it('getAt returns undefined for unloaded index', () => {
    const store = new BufferedStore({ model: PagedItem, pageSize: 25 });
    expect(store.getAt(100)).toBeUndefined();
  });

  it('prefetches adjacent pages based on buffer zones', async () => {
    const proxy = createMockProxy();
    const store = new BufferedStore({
      model: PagedItem,
      pageSize: 25,
      proxy: proxy as any,
      leadingBufferZone: 25,
      trailingBufferZone: 25,
    });

    await store.guaranteeRange(25, 49);
    // Should have loaded page 1 (25-49) PLUS prefetched page 0 (0-24) and page 2 (50-74)
    expect(proxy.read.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('isPageLoaded returns correct state', async () => {
    const proxy = createMockProxy();
    const store = new BufferedStore({
      model: PagedItem,
      pageSize: 25,
      proxy: proxy as any,
    });

    expect(store.isPageLoaded(0)).toBe(false);
    await store.guaranteeRange(0, 24);
    expect(store.isPageLoaded(0)).toBe(true);
    expect(store.isPageLoaded(1)).toBe(false);
  });
});
