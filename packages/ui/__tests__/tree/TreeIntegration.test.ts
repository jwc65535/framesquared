/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TreePanel } from '../../src/tree/TreePanel.js';
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

function makeStore(data?: Record<string, unknown>): TreeStore {
  return new TreeStore({
    model: TreeModel,
    root: data ?? {
      id: 'root',
      text: 'Root',
      expanded: true,
      children: [
        {
          id: 'a',
          text: 'Node A',
          expanded: false,
          children: [{ id: 'a1', text: 'A1', leaf: true }],
        },
        { id: 'b', text: 'Node B', leaf: true },
      ],
    },
  });
}

function makePanel(store: TreeStore, extra: Record<string, unknown> = {}): TreePanel {
  return new TreePanel({ renderTo: document.body, store, ...extra } as any);
}

// ═══════════════════════════════════════════════════════════════════════════
// Full render
// ═══════════════════════════════════════════════════════════════════════════

describe('Full render', () => {
  it('all visible nodes appear in DOM', () => {
    const store = makeStore();
    const p = makePanel(store);
    // Root hidden (rootVisible=false), A not expanded => A and B visible
    const rows = p.el!.querySelectorAll('tr[data-node-id]');
    expect(rows.length).toBe(2); // A, B
  });

  it('node text appears in DOM', () => {
    const store = makeStore();
    const p = makePanel(store);
    const texts = Array.from(p.el!.querySelectorAll('.x-tree-node-text')).map((el) =>
      el.textContent?.trim(),
    );
    expect(texts).toContain('Node A');
    expect(texts).toContain('Node B');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Expand / Collapse in DOM
// ═══════════════════════════════════════════════════════════════════════════

describe('Expand / Collapse DOM updates', () => {
  it('expand root children: A1 appears', () => {
    const store = makeStore();
    const p = makePanel(store);
    const nodeA = store.getNodeById('a') as NodeInterface;
    p.expandNode(nodeA);
    const rows = p.el!.querySelectorAll('tr[data-node-id]');
    expect(rows.length).toBe(3); // A, A1, B
  });

  it('collapse nodeA: A1 disappears', () => {
    const store = makeStore();
    const p = makePanel(store);
    const nodeA = store.getNodeById('a') as NodeInterface;
    p.expandNode(nodeA);
    p.collapseNode(nodeA);
    const rows = p.el!.querySelectorAll('tr[data-node-id]');
    expect(rows.length).toBe(2); // A, B
  });

  it('expandAll shows all nodes', () => {
    const store = makeStore();
    const p = makePanel(store);
    p.expandAll();
    const rows = p.el!.querySelectorAll('tr[data-node-id]');
    expect(rows.length).toBe(3); // A, A1, B
  });

  it('collapseAll hides children', () => {
    const store = makeStore();
    const p = makePanel(store);
    p.expandAll();
    p.collapseAll();
    const rows = p.el!.querySelectorAll('tr[data-node-id]');
    expect(rows.length).toBe(2); // A, B
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Selection integration
// ═══════════════════════════════════════════════════════════════════════════

describe('Selection integration', () => {
  it('select node then getSelection returns it', () => {
    const store = makeStore();
    const p = makePanel(store);
    const nodeB = store.getNodeById('b') as NodeInterface;
    p.select(nodeB);
    expect(p.getSelection()).toContain(nodeB);
  });

  it('selected node gets x-tree-selected class', () => {
    const store = makeStore();
    const p = makePanel(store);
    const nodeB = store.getNodeById('b') as NodeInterface;
    p.select(nodeB);
    const row = p.getView().getNode(nodeB)!;
    expect(row.classList.contains('x-tree-selected')).toBe(true);
  });

  it('deselectAll clears selection and removes x-tree-selected class', () => {
    const store = makeStore();
    const p = makePanel(store);
    const nodeB = store.getNodeById('b') as NodeInterface;
    p.select(nodeB);
    p.deselectAll();
    expect(p.getSelection()).toEqual([]);
    const row = p.getView().getNode(nodeB)!;
    expect(row.classList.contains('x-tree-selected')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Checkbox integration
// ═══════════════════════════════════════════════════════════════════════════

describe('Checkbox integration', () => {
  it('checkable: true renders checkbox spans', () => {
    const store = makeStore();
    const p = makePanel(store, { checkable: true });
    const checkboxes = p.el!.querySelectorAll('.x-tree-checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('getChecked returns all checked nodes', () => {
    const store = makeStore();
    const p = makePanel(store, { checkable: true });
    const nodeB = store.getNodeById('b') as NodeInterface;
    (nodeB as any).$checked = true;
    const checked = p.getChecked();
    expect(checked).toContain(nodeB);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// singleExpand
// ═══════════════════════════════════════════════════════════════════════════

describe('singleExpand integration', () => {
  it('singleExpand: expanding B collapses A', () => {
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
    const _p = makePanel(store, { singleExpand: true });
    const nodeA = store.getNodeById('a') as NodeInterface;
    const nodeB = store.getNodeById('b') as NodeInterface;
    // Expand B — should collapse A
    store.expandNode(nodeB);
    expect(nodeA.isExpanded()).toBe(false);
    expect(nodeB.isExpanded()).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Keyboard
// ═══════════════════════════════════════════════════════════════════════════

describe('Keyboard navigation', () => {
  it('ArrowDown moves focus to next row', () => {
    const store = makeStore();
    const p = makePanel(store);
    const view = p.getView();
    const nodeA = store.getNodeById('a') as NodeInterface;
    const nodeB = store.getNodeById('b') as NodeInterface;
    view.focusNode(nodeA);
    const rowA = view.getNode(nodeA)!;
    rowA.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    const rowB = view.getNode(nodeB)!;
    // After ArrowDown, B row should have tabindex=0
    expect(rowB.getAttribute('tabindex')).toBe('0');
  });

  it('ArrowUp moves focus to previous row', () => {
    const store = makeStore();
    const p = makePanel(store);
    const view = p.getView();
    const nodeA = store.getNodeById('a') as NodeInterface;
    const nodeB = store.getNodeById('b') as NodeInterface;
    view.focusNode(nodeB);
    const rowB = view.getNode(nodeB)!;
    rowB.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    const rowA = view.getNode(nodeA)!;
    expect(rowA.getAttribute('tabindex')).toBe('0');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Programmatic changes
// ═══════════════════════════════════════════════════════════════════════════

describe('Programmatic tree changes', () => {
  it('appendChild causes re-render with new node', () => {
    const store = makeStore();
    const p = makePanel(store);
    const root = store.getRootNode();
    store.appendChild(root, (TreeModel as any).create({ id: 'c', text: 'Node C', leaf: true }));
    const texts = Array.from(p.el!.querySelectorAll('.x-tree-node-text')).map((el) =>
      el.textContent?.trim(),
    );
    expect(texts).toContain('Node C');
  });

  it('removeChild causes re-render without removed node', () => {
    const store = makeStore();
    const p = makePanel(store);
    const root = store.getRootNode();
    const nodeB = store.getNodeById('b') as NodeInterface;
    store.removeChild(root, nodeB);
    const texts = Array.from(p.el!.querySelectorAll('.x-tree-node-text')).map((el) =>
      el.textContent?.trim(),
    );
    expect(texts).not.toContain('Node B');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Panel events
// ═══════════════════════════════════════════════════════════════════════════

describe('Panel events', () => {
  it('itemclick fires when a node row is clicked', () => {
    const store = makeStore();
    const spy = vi.fn();
    const p = new TreePanel({
      renderTo: document.body,
      store,
      listeners: { itemclick: spy },
    } as any);
    const nodeB = store.getNodeById('b') as NodeInterface;
    const row = p.getView().getNode(nodeB)!;
    row.click();
    expect(spy).toHaveBeenCalled();
  });

  it('itemdblclick fires on double click', () => {
    const store = makeStore();
    const spy = vi.fn();
    const p = new TreePanel({
      renderTo: document.body,
      store,
      listeners: { itemdblclick: spy },
    } as any);
    const nodeB = store.getNodeById('b') as NodeInterface;
    const row = p.getView().getNode(nodeB)!;
    row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });
});
