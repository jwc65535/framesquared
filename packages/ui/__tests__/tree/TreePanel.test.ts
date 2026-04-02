import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TreePanel } from '../../src/tree/TreePanel.js';
import { TreeSelectionModel } from '../../src/selection/TreeSelectionModel.js';
import { TreeStore, TreeModel } from '@framesquared/data';
import type { NodeInterface } from '@framesquared/data';

// Mock ResizeObserver
class MockRO {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function makeStore(rootData?: Record<string, unknown>): TreeStore {
  return new TreeStore({
    model: TreeModel,
    root: rootData ?? {
      id: 'root',
      text: 'Root',
      expanded: true,
      children: [
        { id: 'a', text: 'Node A', children: [{ id: 'a1', text: 'A1', leaf: true }] },
        { id: 'b', text: 'Node B', leaf: true },
      ],
    },
  });
}

function makePanel(extra: Record<string, unknown> = {}): TreePanel {
  return new TreePanel({
    renderTo: document.body,
    store: makeStore(),
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
// TreePanel structure
// ═══════════════════════════════════════════════════════════════════════════

describe('TreePanel structure', () => {
  it('renders with x-tree-panel class', () => {
    const p = makePanel();
    expect(p.el!.classList.contains('x-tree-panel')).toBe(true);
  });

  it('renders with x-panel class', () => {
    const p = makePanel();
    expect(p.el!.classList.contains('x-panel')).toBe(true);
  });

  it('renders panel body', () => {
    const p = makePanel();
    expect(p.el!.querySelector('.x-panel-body')).not.toBeNull();
  });

  it('renders tree view inside panel body', () => {
    const p = makePanel();
    const body = p.el!.querySelector('.x-panel-body');
    expect(body!.querySelector('.x-tree-view')).not.toBeNull();
  });

  it('tree view has role="tree"', () => {
    const p = makePanel();
    const treeView = p.el!.querySelector('.x-tree-view');
    expect(treeView!.getAttribute('role')).toBe('tree');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Store & Root
// ═══════════════════════════════════════════════════════════════════════════

describe('Store & Root', () => {
  it('getStore() returns the store', () => {
    const store = makeStore();
    const p = new TreePanel({ renderTo: document.body, store } as any);
    expect(p.getStore()).toBe(store);
  });

  it('getRootNode() returns root node', () => {
    const p = makePanel();
    const root = p.getRootNode();
    expect(root).toBeDefined();
    expect(root.isRoot()).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Expand / Collapse
// ═══════════════════════════════════════════════════════════════════════════

describe('Expand / Collapse', () => {
  it('expandAll expands all nodes', () => {
    const p = makePanel();
    p.collapseAll();
    p.expandAll();
    const root = p.getRootNode();
    let allExpanded = true;
    root.cascadeBy((node) => {
      if (!node.isLeaf() && !node.isRoot() && !node.isExpanded()) {
        allExpanded = false;
      }
    });
    expect(allExpanded).toBe(true);
  });

  it('collapseAll collapses all nodes', () => {
    const p = makePanel();
    p.collapseAll();
    const root = p.getRootNode();
    let anyExpanded = false;
    root.eachChild((child) => {
      if (child.isExpanded()) anyExpanded = true;
    });
    expect(anyExpanded).toBe(false);
  });

  it('expandNode expands a specific node', () => {
    const p = makePanel();
    const nodeA = p.getStore().getNodeById('a') as NodeInterface;
    p.getStore().collapseNode(nodeA);
    expect(nodeA.isExpanded()).toBe(false);
    p.expandNode(nodeA);
    expect(nodeA.isExpanded()).toBe(true);
  });

  it('collapseNode collapses a specific node', () => {
    const p = makePanel();
    const nodeA = p.getStore().getNodeById('a') as NodeInterface;
    p.expandNode(nodeA);
    p.collapseNode(nodeA);
    expect(nodeA.isExpanded()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Selection
// ═══════════════════════════════════════════════════════════════════════════

describe('Selection', () => {
  it('getSelection returns empty array initially', () => {
    const p = makePanel();
    expect(p.getSelection()).toEqual([]);
  });

  it('select(node) selects a node', () => {
    const p = makePanel();
    const nodeB = p.getStore().getNodeById('b') as NodeInterface;
    p.select(nodeB);
    expect(p.getSelection()).toContain(nodeB);
  });

  it('deselectAll clears selection', () => {
    const p = makePanel();
    const nodeB = p.getStore().getNodeById('b') as NodeInterface;
    p.select(nodeB);
    p.deselectAll();
    expect(p.getSelection()).toEqual([]);
  });

  it('select multiple nodes array with multi mode', () => {
    const store = makeStore();
    const p = new TreePanel({
      renderTo: document.body,
      store,
    } as any);
    const nodeA = store.getNodeById('a') as NodeInterface;
    const nodeB = store.getNodeById('b') as NodeInterface;
    // Swap to multi mode to support multiple selections
    (p as any)._selModel = new TreeSelectionModel({ mode: 'multi' });
    p.select([nodeA, nodeB]);
    // With multi mode, both are selected
    expect(p.getSelection().length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Checked nodes
// ═══════════════════════════════════════════════════════════════════════════

describe('Checked nodes', () => {
  it('checkable: false by default — getChecked returns empty', () => {
    const p = makePanel();
    expect(p.isCheckable()).toBe(false);
    expect(p.getChecked()).toEqual([]);
  });

  it('checkable: true — getChecked returns checked nodes', () => {
    const p = makePanel({ checkable: true });
    const nodeB = p.getStore().getNodeById('b') as NodeInterface;
    (nodeB as any).$checked = true;
    const checked = p.getChecked();
    expect(checked).toContain(nodeB);
  });

  it('getChecked returns empty array when no nodes are checked', () => {
    const p = makePanel({ checkable: true });
    expect(p.getChecked()).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Config defaults
// ═══════════════════════════════════════════════════════════════════════════

describe('Config defaults', () => {
  it('rootVisible is false by default', () => {
    const p = makePanel();
    expect(p.isRootVisible()).toBe(false);
  });

  it('rootVisible can be set to true', () => {
    const p = makePanel({ rootVisible: true });
    expect(p.isRootVisible()).toBe(true);
  });

  it('checkable defaults to false', () => {
    const p = makePanel();
    expect(p.isCheckable()).toBe(false);
  });

  it('checkable can be set to true', () => {
    const p = makePanel({ checkable: true });
    expect(p.isCheckable()).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// View access
// ═══════════════════════════════════════════════════════════════════════════

describe('View', () => {
  it('getView() returns the TreeView instance', () => {
    const p = makePanel();
    const view = p.getView();
    expect(view).toBeDefined();
    expect(view.el).not.toBeNull();
  });

  it('scrollToNode does not throw', () => {
    const p = makePanel();
    const nodeB = p.getStore().getNodeById('b') as NodeInterface;
    expect(() => p.scrollToNode(nodeB)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// singleExpand
// ═══════════════════════════════════════════════════════════════════════════

describe('singleExpand', () => {
  it('singleExpand: expanding one node collapses others', () => {
    const store = new TreeStore({
      model: TreeModel,
      root: {
        id: 'root',
        text: 'Root',
        expanded: true,
        children: [
          { id: 'a', text: 'A', expanded: true, children: [{ id: 'a1', text: 'A1', leaf: true }] },
          { id: 'b', text: 'B', children: [{ id: 'b1', text: 'B1', leaf: true }] },
        ],
      },
    });
    const _p = new TreePanel({ renderTo: document.body, store, singleExpand: true } as any);
    const nodeB = store.getNodeById('b') as NodeInterface;
    const nodeA = store.getNodeById('a') as NodeInterface;
    store.expandNode(nodeB);
    // Node A should now be collapsed
    expect(nodeA.isExpanded()).toBe(false);
    expect(nodeB.isExpanded()).toBe(true);
  });
});
