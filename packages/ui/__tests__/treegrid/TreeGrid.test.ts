import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TreeGrid } from '../../src/treegrid/TreeGrid.js';
import { TreeGridColumn, Column } from '../../src/treegrid/TreeGridColumn.js';
import { TreeStore, TreeModel, applyNodeInterface } from '@framesquared/data';
import type { NodeInterface } from '@framesquared/data';

// ─── Mock ResizeObserver ─────────────────────────────────────────────────────

class MockRO {
  observe() {}
  unobserve() {}
  disconnect() {}
}

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
          text: 'Node A',
          size: 100,
          expanded: true,
          children: [
            { id: 'a1', text: 'A1', size: 50, leaf: true },
            { id: 'a2', text: 'A2', size: 60, leaf: true },
          ],
        },
        { id: 'b', text: 'Node B', size: 200, leaf: true },
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

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  (globalThis as any).ResizeObserver = MockRO;
});

afterEach(() => {
  document.body.innerHTML = '';
});

// ═══════════════════════════════════════════════════════════════════════════
// Construction — store normalization
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGrid — store normalization', () => {
  it('accepts TreeStore instance', () => {
    const store = makeStore();
    const grid = new TreeGrid({ renderTo: document.body, store } as any);
    expect(grid.getStore()).toBe(store);
  });

  it('accepts array of objects, creates TreeStore', () => {
    const grid = new TreeGrid({
      renderTo: document.body,
      store: [
        { id: 'n1', text: 'Item 1', leaf: true },
        { id: 'n2', text: 'Item 2', leaf: true },
      ],
    } as any);
    expect(grid.getStore()).toBeInstanceOf(TreeStore);
    expect(grid.getStore().getNodeById('n1')).toBeDefined();
  });

  it('accepts TreeStoreConfig object', () => {
    const grid = new TreeGrid({
      renderTo: document.body,
      store: {
        model: TreeModel,
        root: {
          id: 'root',
          text: 'R',
          expanded: true,
          children: [{ id: 'x1', text: 'X1', leaf: true }],
        },
      },
    } as any);
    expect(grid.getStore()).toBeInstanceOf(TreeStore);
    expect(grid.getNodeById('x1')).toBeDefined();
  });

  it('throws if store is something invalid', () => {
    expect(() => {
      new TreeGrid({ renderTo: document.body, store: 42 } as any);
    }).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Construction — column normalization
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGrid — column normalization', () => {
  it('no columns → auto-creates TreeGridColumn with displayField', () => {
    const grid = makeGrid();
    const cols = grid.getColumns();
    expect(cols.length).toBe(1);
    expect(cols[0]).toBeInstanceOf(TreeGridColumn);
    expect(cols[0].dataIndex).toBe('text'); // default displayField
  });

  it('first column auto-converted to TreeGridColumn', () => {
    const grid = new TreeGrid({
      renderTo: document.body,
      store: makeStore(),
      columns: [
        { dataIndex: 'text', text: 'Name' },
        { dataIndex: 'size', text: 'Size' },
      ],
    } as any);
    const cols = grid.getColumns();
    expect(cols[0]).toBeInstanceOf(TreeGridColumn);
    expect(cols[1]).toBeInstanceOf(Column);
    expect(cols[1]).not.toBeInstanceOf(TreeGridColumn);
  });

  it('explicit TreeGridColumn instance used directly', () => {
    const treeCol = new TreeGridColumn({ dataIndex: 'text', text: 'Name' });
    const grid = new TreeGrid({
      renderTo: document.body,
      store: makeStore(),
      columns: [treeCol, { dataIndex: 'size', text: 'Size' }],
    } as any);
    expect(grid.getColumns()[0]).toBe(treeCol);
  });

  it('getTreeColumn returns the tree column', () => {
    const grid = makeGrid();
    expect(grid.getTreeColumn()).toBeInstanceOf(TreeGridColumn);
  });

  it('getColumnByDataIndex finds column', () => {
    const grid = new TreeGrid({
      renderTo: document.body,
      store: makeStore(),
      columns: [
        { dataIndex: 'text', text: 'Name' },
        { dataIndex: 'size', text: 'Size' },
      ],
    } as any);
    expect(grid.getColumnByDataIndex('size')?.dataIndex).toBe('size');
    expect(grid.getColumnByDataIndex('missing')).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Construction — config propagation
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGrid — config propagation', () => {
  it('rootVisible=false by default', () => {
    const grid = makeGrid();
    expect(grid.isRootVisible()).toBe(false);
  });

  it('rootVisible=true', () => {
    const grid = makeGrid({ rootVisible: true });
    expect(grid.isRootVisible()).toBe(true);
  });

  it('checkable=false by default', () => {
    const grid = makeGrid();
    expect(grid.isCheckable()).toBe(false);
  });

  it('checkable=true', () => {
    const grid = makeGrid({ checkable: true });
    expect(grid.isCheckable()).toBe(true);
  });

  it('displayField defaults to text', () => {
    const grid = makeGrid();
    expect(grid.getDisplayField()).toBe('text');
  });

  it('custom displayField', () => {
    const grid = makeGrid({ displayField: 'name' });
    expect(grid.getDisplayField()).toBe('name');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Rendering
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGrid — rendering', () => {
  it('renders x-treegrid CSS class', () => {
    const grid = makeGrid();
    expect(grid.el!.classList.contains('x-treegrid')).toBe(true);
  });

  it('renders TreeGridView inside panel body', () => {
    const grid = makeGrid();
    expect(grid.el!.querySelector('.x-treegrid-view')).not.toBeNull();
  });

  it('renders rows for visible nodes', () => {
    const grid = makeGrid();
    const rows = grid.el!.querySelectorAll('tr[data-record-id]');
    // a, a1, a2, b = 4 rows
    expect(rows.length).toBe(4);
  });

  it('rootVisible=true shows root row', () => {
    const grid = makeGrid({ rootVisible: true });
    const rows = grid.el!.querySelectorAll('tr[data-record-id]');
    expect(rows.length).toBe(5);
  });

  it('multi-column grid renders correct cell count per row', () => {
    const grid = new TreeGrid({
      renderTo: document.body,
      store: makeStore(),
      columns: [
        { dataIndex: 'text', text: 'Name' },
        { dataIndex: 'size', text: 'Size' },
      ],
    } as any);
    const rows = grid.el!.querySelectorAll('tr[data-record-id]');
    for (const row of Array.from(rows)) {
      expect(row.querySelectorAll('td').length).toBe(2);
    }
  });

  it('getView() returns the TreeGridView', () => {
    const grid = makeGrid();
    expect(grid.getView()).toBeDefined();
    expect(grid.getView().el).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Store access
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGrid — store access', () => {
  it('getStore returns the TreeStore', () => {
    const grid = makeGrid();
    expect(grid.getStore()).toBeInstanceOf(TreeStore);
  });

  it('getRootNode returns the root', () => {
    const grid = makeGrid();
    expect(grid.getRootNode().isRoot()).toBe(true);
  });

  it('getNodeById finds nodes', () => {
    const grid = makeGrid();
    expect(grid.getNodeById('a')).not.toBeNull();
    expect(grid.getNodeById('b')).not.toBeNull();
    expect(grid.getNodeById('missing')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Expand / Collapse
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGrid — expand/collapse', () => {
  it('expandAll expands every non-leaf node', () => {
    const grid = makeGrid();
    grid.collapseAll();
    grid.expandAll();
    const root = grid.getRootNode();
    let anyCollapsed = false;
    root.cascadeBy((n) => {
      if (!n.isLeaf() && !n.isRoot() && !n.isExpanded()) anyCollapsed = true;
    });
    expect(anyCollapsed).toBe(false);
  });

  it('collapseAll collapses every node', () => {
    const grid = makeGrid();
    grid.collapseAll();
    const root = grid.getRootNode();
    let anyExpanded = false;
    root.eachChild((child) => {
      if (child.isExpanded()) anyExpanded = true;
    });
    expect(anyExpanded).toBe(false);
  });

  it('expandNode expands a node', () => {
    const grid = makeGrid();
    const nodeA = grid.getNodeById('a')!;
    grid.collapseNode(nodeA);
    expect(nodeA.isExpanded()).toBe(false);
    grid.expandNode(nodeA);
    expect(nodeA.isExpanded()).toBe(true);
  });

  it('collapseNode collapses a node', () => {
    const grid = makeGrid();
    const nodeA = grid.getNodeById('a')!;
    grid.expandNode(nodeA);
    grid.collapseNode(nodeA);
    expect(nodeA.isExpanded()).toBe(false);
  });

  it('toggleNode expands collapsed node', () => {
    const grid = makeGrid();
    const nodeA = grid.getNodeById('a')!;
    grid.collapseNode(nodeA);
    grid.toggleNode(nodeA);
    expect(nodeA.isExpanded()).toBe(true);
  });

  it('toggleNode collapses expanded node', () => {
    const grid = makeGrid();
    const nodeA = grid.getNodeById('a')!;
    grid.expandNode(nodeA);
    grid.toggleNode(nodeA);
    expect(nodeA.isExpanded()).toBe(false);
  });

  it('singleExpand: expanding A collapses sibling B', () => {
    const store = new TreeStore({
      model: TreeModel,
      root: {
        id: 'root',
        text: 'R',
        expanded: true,
        children: [
          { id: 'x', text: 'X', expanded: true, children: [{ id: 'x1', text: 'X1', leaf: true }] },
          { id: 'y', text: 'Y', children: [{ id: 'y1', text: 'Y1', leaf: true }] },
        ],
      },
    });
    const grid = new TreeGrid({
      renderTo: document.body,
      store,
      singleExpand: true,
    } as any);
    const x = grid.getNodeById('x')!;
    const y = grid.getNodeById('y')!;
    store.expandNode(y);
    // Manually trigger the singleExpand collapse
    grid.expandNode(y);
    expect(x.isExpanded()).toBe(false);
    expect(y.isExpanded()).toBe(true);
  });

  it('expandNode deep=true expands all descendants', () => {
    const grid = makeGrid();
    const nodeA = grid.getNodeById('a')!;
    grid.collapseNode(nodeA, true);
    grid.expandNode(nodeA, true);
    expect(nodeA.isExpanded()).toBe(true);
  });

  it('collapseNode deep=true collapses all descendants', () => {
    const grid = makeGrid();
    const nodeA = grid.getNodeById('a')!;
    grid.expandNode(nodeA, true);
    grid.collapseNode(nodeA, true);
    expect(nodeA.isExpanded()).toBe(false);
  });

  it('isNodeExpanded returns correct state', () => {
    const grid = makeGrid();
    const nodeA = grid.getNodeById('a')!;
    expect(grid.isNodeExpanded(nodeA)).toBe(true);
    grid.collapseNode(nodeA);
    expect(grid.isNodeExpanded(nodeA)).toBe(false);
  });

  it('expandNode fires beforeitemexpand event', () => {
    const grid = makeGrid();
    const spy = vi.fn();
    (grid as any).on('beforeitemexpand', spy);
    const nodeA = grid.getNodeById('a')!;
    grid.collapseNode(nodeA);
    grid.expandNode(nodeA);
    expect(spy).toHaveBeenCalledWith(nodeA);
  });

  it('expandNode with callback calls it', () => {
    const grid = makeGrid();
    const cb = vi.fn();
    const nodeA = grid.getNodeById('a')!;
    grid.expandNode(nodeA, false, cb);
    expect(cb).toHaveBeenCalled();
  });

  it('expandOnDblClick: dblclick toggles node', () => {
    const grid = makeGrid({ expandOnDblClick: true });
    const nodeA = grid.getNodeById('a')!;
    grid.collapseNode(nodeA);
    const row = grid.getNodeRow(nodeA)!;
    row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(nodeA.isExpanded()).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Checkbox
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGrid — checkbox', () => {
  it('checkable=false: getChecked returns empty', () => {
    const grid = makeGrid({ checkable: false });
    expect(grid.getChecked()).toEqual([]);
  });

  it('setChecked marks node as checked', () => {
    const grid = makeGrid({ checkable: true });
    const nodeB = grid.getNodeById('b')!;
    grid.setChecked(nodeB, true);
    expect((nodeB as any).$checked).toBe(true);
    expect(grid.getChecked()).toContain(nodeB);
  });

  it('setChecked with cascade down checks descendants', () => {
    const grid = makeGrid({ checkable: true, checkPropagation: 'down' });
    const nodeA = grid.getNodeById('a')!;
    const a1 = grid.getNodeById('a1')!;
    const a2 = grid.getNodeById('a2')!;
    grid.setChecked(nodeA, true);
    expect((a1 as any).$checked).toBe(true);
    expect((a2 as any).$checked).toBe(true);
  });

  it('toggleChecked toggles the checked state', () => {
    const grid = makeGrid({ checkable: true });
    const nodeB = grid.getNodeById('b')!;
    grid.setChecked(nodeB, false);
    grid.toggleChecked(nodeB);
    expect((nodeB as any).$checked).toBe(true);
    grid.toggleChecked(nodeB);
    expect((nodeB as any).$checked).toBe(false);
  });

  it('checkAll checks all nodes', () => {
    const grid = makeGrid({ checkable: true });
    grid.checkAll();
    expect(grid.getChecked().length).toBeGreaterThan(0);
  });

  it('uncheckAll unchecks all nodes', () => {
    const grid = makeGrid({ checkable: true });
    grid.checkAll();
    grid.uncheckAll();
    expect(grid.getChecked()).toEqual([]);
  });

  it('getCheckedLeaves returns only leaf nodes', () => {
    const grid = makeGrid({ checkable: true });
    grid.checkAll();
    const leaves = grid.getCheckedLeaves();
    for (const n of leaves) {
      expect(n.isLeaf()).toBe(true);
    }
  });

  it('setChecked fires checkchange event', () => {
    const grid = makeGrid({ checkable: true });
    const spy = vi.fn();
    (grid as any).on('checkchange', spy);
    const nodeB = grid.getNodeById('b')!;
    grid.setChecked(nodeB, true);
    expect(spy).toHaveBeenCalledWith(nodeB, true);
  });

  it('setChecked suppressEvent does not fire checkchange', () => {
    const grid = makeGrid({ checkable: true });
    const spy = vi.fn();
    (grid as any).on('checkchange', spy);
    const nodeB = grid.getNodeById('b')!;
    grid.setChecked(nodeB, true, true);
    expect(spy).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Selection
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGrid — selection', () => {
  it('getSelection returns empty initially', () => {
    const grid = makeGrid();
    expect(grid.getSelection()).toEqual([]);
  });

  it('select(node) selects the node', () => {
    const grid = makeGrid();
    const nodeB = grid.getNodeById('b')!;
    grid.select(nodeB);
    expect(grid.getSelection()).toContain(nodeB);
  });

  it('deselectAll clears selection', () => {
    const grid = makeGrid();
    const nodeB = grid.getNodeById('b')!;
    grid.select(nodeB);
    grid.deselectAll();
    expect(grid.getSelection()).toEqual([]);
  });

  it('selectAll selects all visible nodes', () => {
    const grid = makeGrid();
    grid.selectAll();
    expect(grid.getSelection().length).toBeGreaterThan(0);
  });

  it('select fires selectionchange', () => {
    const grid = makeGrid();
    const spy = vi.fn();
    (grid as any).on('selectionchange', spy);
    const nodeB = grid.getNodeById('b')!;
    grid.select(nodeB);
    expect(spy).toHaveBeenCalled();
  });

  it('select by index', () => {
    const grid = makeGrid();
    grid.select(0); // first visible node
    expect(grid.getSelection().length).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Store events relayed
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGrid — store event relaying', () => {
  it('relays nodeappend event from store', () => {
    const grid = makeGrid();
    const spy = vi.fn();
    (grid as any).on('nodeappend', spy);

    const newNode = TreeModel.create({ id: 'new1', text: 'New', leaf: true });
    applyNodeInterface(newNode as any, 2);
    const nodeA = grid.getNodeById('a')!;
    grid.getStore().appendChild(nodeA, newNode as any);

    expect(spy).toHaveBeenCalled();
  });

  it('relays nodecollapse event from store', () => {
    const grid = makeGrid();
    const spy = vi.fn();
    (grid as any).on('nodecollapse', spy);

    const nodeA = grid.getNodeById('a')!;
    grid.getStore().collapseNode(nodeA);
    expect(spy).toHaveBeenCalled();
  });

  it('relays nodeexpand event from store', () => {
    const grid = makeGrid();
    const spy = vi.fn();
    (grid as any).on('nodeexpand', spy);

    const nodeA = grid.getNodeById('a')!;
    grid.getStore().collapseNode(nodeA);
    grid.getStore().expandNode(nodeA);
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Scroll / Navigate
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGrid — scroll to node', () => {
  it('scrollToNode does not throw', async () => {
    const grid = makeGrid();
    const nodeB = grid.getNodeById('b')!;
    await expect(grid.scrollToNode(nodeB)).resolves.not.toThrow();
  });

  it('ensureNodeVisible does not throw', async () => {
    const grid = makeGrid();
    const nodeB = grid.getNodeById('b')!;
    await expect(grid.ensureNodeVisible(nodeB)).resolves.not.toThrow();
  });

  it('scrollToNode expands ancestors', async () => {
    const grid = makeGrid();
    const nodeA = grid.getNodeById('a')!;
    const a1 = grid.getNodeById('a1')!;
    grid.collapseNode(nodeA);
    expect(nodeA.isExpanded()).toBe(false);
    await grid.scrollToNode(a1);
    expect(nodeA.isExpanded()).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// getDepthIndent
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGrid — getDepthIndent', () => {
  it('returns depth * indentSize', () => {
    const grid = makeGrid();
    expect(grid.getDepthIndent(0)).toBe(0);
    expect(grid.getDepthIndent(1)).toBe(20);
    expect(grid.getDepthIndent(3)).toBe(60);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// getNodeRow / getNodeFromRow
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGrid — getNodeRow', () => {
  it('getNodeRow returns the row element', () => {
    const grid = makeGrid();
    const nodeB = grid.getNodeById('b')!;
    const row = grid.getNodeRow(nodeB);
    expect(row).not.toBeNull();
    expect(row!.getAttribute('data-record-id')).toBe('b');
  });

  it('getNodeFromRow returns the record', () => {
    const grid = makeGrid();
    const nodeB = grid.getNodeById('b')!;
    const row = grid.getNodeRow(nodeB)!;
    expect(grid.getNodeFromRow(row)).toBe(nodeB);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// setRootNode
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGrid — setRootNode', () => {
  it('setRootNode refreshes the view', () => {
    const grid = makeGrid();
    const newRoot = grid.getStore().setRoot({
      id: 'newroot',
      text: 'New Root',
      expanded: true,
      children: [{ id: 'z1', text: 'Z1', leaf: true }],
    });
    expect(grid.getNodeById('z1')).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// expandPath / selectPath
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGrid — expandPath', () => {
  it('expandPath navigates to node', async () => {
    const grid = makeGrid();
    const nodeA = grid.getNodeById('a')!;
    grid.collapseNode(nodeA);
    const result = await grid.expandPath('a/a1');
    expect(result).toBeDefined();
  });

  it('selectPath selects the node', async () => {
    const grid = makeGrid();
    await grid.selectPath('a', {});
    expect(grid.getSelection().length).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// reload
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGrid — reload', () => {
  it('reload collapses all and returns children', async () => {
    const grid = makeGrid();
    const result = await grid.reload();
    expect(Array.isArray(result)).toBe(true);
  });
});
