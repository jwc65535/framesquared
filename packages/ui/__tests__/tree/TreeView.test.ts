import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TreeView } from '../../src/tree/TreeView.js';
import { TreeStore, TreeModel } from '@framesquared/data';
import type { NodeInterface } from '@framesquared/data';

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

function makeStore(rootData?: Record<string, unknown>): TreeStore {
  return new TreeStore({
    model: TreeModel,
    root: rootData ?? {
      id: 'root',
      text: 'Root',
      expanded: true,
      children: [
        {
          id: 'a',
          text: 'Node A',
          expanded: true,
          children: [{ id: 'a1', text: 'A1', leaf: true }],
        },
        { id: 'b', text: 'Node B', leaf: true },
      ],
    },
  });
}

function makeView(store?: TreeStore): TreeView {
  const s = store ?? makeStore();
  const view = new TreeView({ store: s });
  const container = document.createElement('div');
  document.body.appendChild(container);
  view.render(container);
  return view;
}

// ═══════════════════════════════════════════════════════════════════════════
// Structure
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeView structure', () => {
  it('renders a div with x-tree-view class', () => {
    const view = makeView();
    expect(view.el!.classList.contains('x-tree-view')).toBe(true);
  });

  it('has role="tree" on root element', () => {
    const view = makeView();
    expect(view.el!.getAttribute('role')).toBe('tree');
  });

  it('renders a table element inside', () => {
    const view = makeView();
    const table = view.el!.querySelector('table');
    expect(table).not.toBeNull();
  });

  it('renders correct number of visible node rows', () => {
    const store = makeStore();
    const view = makeView(store);
    // Root is hidden; A, A1 (A is expanded), B => 3 rows
    const rows = view.el!.querySelectorAll('tr[data-node-id]');
    expect(rows.length).toBe(3);
  });

  it('each row has role="treeitem"', () => {
    const view = makeView();
    const rows = view.el!.querySelectorAll('tr');
    rows.forEach((row) => {
      expect(row.getAttribute('role')).toBe('treeitem');
    });
  });

  it('rows have data-node-id attribute', () => {
    const view = makeView();
    const rows = view.el!.querySelectorAll('tr[data-node-id]');
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((row) => {
      expect(row.getAttribute('data-node-id')).toBeTruthy();
    });
  });

  it('node text is rendered', () => {
    const view = makeView();
    const texts = Array.from(view.el!.querySelectorAll('.x-tree-node-text')).map((el) =>
      el.textContent?.trim(),
    );
    expect(texts).toContain('Node A');
    expect(texts).toContain('Node B');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// getNode / getRecord
// ═══════════════════════════════════════════════════════════════════════════

describe('getNode / getRecord', () => {
  it('getNode returns row element for a record', () => {
    const store = makeStore();
    const view = makeView(store);
    const nodeB = store.getNodeById('b') as NodeInterface;
    const row = view.getNode(nodeB);
    expect(row).not.toBeNull();
    expect(row!.getAttribute('data-node-id')).toBe('b');
  });

  it('getRecord returns record for a row element', () => {
    const store = makeStore();
    const view = makeView(store);
    const nodeB = store.getNodeById('b') as NodeInterface;
    const row = view.getNode(nodeB)!;
    const record = view.getRecord(row);
    expect(record).toBe(nodeB);
  });

  it('getRecord works when clicking a child element inside the row', () => {
    const store = makeStore();
    const view = makeView(store);
    const nodeB = store.getNodeById('b') as NodeInterface;
    const row = view.getNode(nodeB)!;
    const textEl = row.querySelector('.x-tree-node-text') as HTMLElement;
    const record = view.getRecord(textEl);
    expect(record).toBe(nodeB);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// refresh / refreshNode
// ═══════════════════════════════════════════════════════════════════════════

describe('refresh / refreshNode', () => {
  it('refresh() re-renders all rows', () => {
    const store = makeStore();
    const view = makeView(store);
    // Add a new node then refresh manually
    const root = store.getRootNode();
    store.appendChild(root, (TreeModel as any).create({ id: 'c', text: 'Node C', leaf: true }));
    view.refresh();
    const texts = Array.from(view.el!.querySelectorAll('.x-tree-node-text')).map((el) =>
      el.textContent?.trim(),
    );
    expect(texts).toContain('Node C');
  });

  it('refreshNode() updates text of a single row', () => {
    const store = makeStore();
    const view = makeView(store);
    const nodeB = store.getNodeById('b') as NodeInterface;
    (nodeB as any).set('text', 'Node B Updated');
    view.refreshNode(nodeB);
    const row = view.getNode(nodeB)!;
    const text = row.querySelector('.x-tree-node-text')!.textContent?.trim();
    expect(text).toBe('Node B Updated');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Expand / Collapse rows
// ═══════════════════════════════════════════════════════════════════════════

describe('Expand / Collapse rows', () => {
  it('collapsing a node removes its children from rows', () => {
    const store = makeStore();
    const view = makeView(store);
    const nodeA = store.getNodeById('a') as NodeInterface;

    // A is expanded, A1 should be visible
    let rows = view.el!.querySelectorAll('tr[data-node-id]');
    expect(rows.length).toBe(3); // A, A1, B

    store.collapseNode(nodeA);
    view.refresh();
    rows = view.el!.querySelectorAll('tr[data-node-id]');
    expect(rows.length).toBe(2); // A, B (A1 hidden)
  });

  it('expanding a node shows its children', () => {
    const store = makeStore();
    const nodeA = store.getNodeById('a') as NodeInterface;
    store.collapseNode(nodeA);

    const view = makeView(store);
    let rows = view.el!.querySelectorAll('tr[data-node-id]');
    expect(rows.length).toBe(2); // A, B

    store.expandNode(nodeA);
    view.refresh();
    rows = view.el!.querySelectorAll('tr[data-node-id]');
    expect(rows.length).toBe(3); // A, A1, B
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// focusNode
// ═══════════════════════════════════════════════════════════════════════════

describe('focusNode', () => {
  it('focusNode sets tabindex=0 on the row', () => {
    const store = makeStore();
    const view = makeView(store);
    const nodeB = store.getNodeById('b') as NodeInterface;
    view.focusNode(nodeB);
    const row = view.getNode(nodeB)!;
    expect(row.getAttribute('tabindex')).toBe('0');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Events
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeView events', () => {
  it('fires itemclick when a row is clicked', () => {
    const store = makeStore();
    const view = makeView(store);
    const spy = vi.fn();
    view.on('itemclick', spy);
    const nodeB = store.getNodeById('b') as NodeInterface;
    const row = view.getNode(nodeB)!;
    row.click();
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toBe(nodeB);
  });

  it('fires itemdblclick on double click', () => {
    const store = makeStore();
    const view = makeView(store);
    const spy = vi.fn();
    view.on('itemdblclick', spy);
    const nodeB = store.getNodeById('b') as NodeInterface;
    const row = view.getNode(nodeB)!;
    row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });

  it('fires itemcontextmenu on right-click', () => {
    const store = makeStore();
    const view = makeView(store);
    const spy = vi.fn();
    view.on('itemcontextmenu', spy);
    const nodeB = store.getNodeById('b') as NodeInterface;
    const row = view.getNode(nodeB)!;
    row.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });

  it('clicking expander fires store expand', () => {
    const store = makeStore();
    // Start with A collapsed
    const nodeA = store.getNodeById('a') as NodeInterface;
    store.collapseNode(nodeA);
    const view = makeView(store);
    const row = view.getNode(nodeA)!;
    const expander = row.querySelector('.x-tree-expander') as HTMLElement;
    expect(expander).not.toBeNull();
    expander.click();
    // After clicking expander, node should be expanded
    expect(nodeA.isExpanded()).toBe(true);
  });
});
