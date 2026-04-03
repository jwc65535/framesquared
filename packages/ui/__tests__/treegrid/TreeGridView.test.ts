import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TreeGridView } from '../../src/treegrid/TreeGridView.js';
import { TreeGridColumn, Column } from '../../src/treegrid/TreeGridColumn.js';
import { TreeStore, TreeModel, applyNodeInterface } from '@framesquared/data';
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
          id: 'folder1',
          text: 'Folder 1',
          expanded: true,
          children: [
            { id: 'leaf1', text: 'Leaf 1', size: 100, leaf: true },
            { id: 'leaf2', text: 'Leaf 2', size: 200, leaf: true },
          ],
        },
        { id: 'folder2', text: 'Folder 2', size: 0 },
      ],
    },
  });
}

function makeColumns() {
  return [
    new TreeGridColumn({ dataIndex: 'text', text: 'Name', width: 200 }),
    new Column({ dataIndex: 'size', text: 'Size', width: 100 }),
  ];
}

function makeView(
  store: TreeStore,
  extra: Partial<ConstructorParameters<typeof TreeGridView>[0]> = {},
) {
  const view = new TreeGridView({
    store,
    columns: makeColumns(),
    ...extra,
  });
  view.render(document.body);
  return view;
}

// ─── Setup ───────────────────────────────────────────────────────────────────

afterEach(() => {
  document.body.innerHTML = '';
});

// ═══════════════════════════════════════════════════════════════════════════
// Rendering basics
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridView — rendering', () => {
  it('renders el with treegrid role', () => {
    const view = makeView(makeStore());
    expect(view.el).not.toBeNull();
    expect(view.el!.getAttribute('role')).toBe('treegrid');
  });

  it('renders correct number of rows (non-root, visible only)', () => {
    const store = makeStore();
    const view = makeView(store);
    // root hidden, folder1 + leaf1 + leaf2 + folder2 = 4
    const rows = view.el!.querySelectorAll('tr[data-record-id]');
    expect(rows.length).toBe(4);
  });

  it('renders rootVisible=true includes root row', () => {
    const store = makeStore();
    const view = makeView(store, { rootVisible: true });
    const rows = view.el!.querySelectorAll('tr[data-record-id]');
    expect(rows.length).toBe(5); // root + 4
  });

  it('each row has correct column count', () => {
    const store = makeStore();
    const view = makeView(store);
    const firstRow = view.el!.querySelector('tr[data-record-id]');
    expect(firstRow!.querySelectorAll('td').length).toBe(2);
  });

  it('tree column cell has x-treegrid-cell class', () => {
    const store = makeStore();
    const view = makeView(store);
    const firstCell = view.el!.querySelector('td');
    expect(firstCell!.classList.contains('x-treegrid-cell')).toBe(true);
  });

  it('second column cell does NOT have x-treegrid-cell class', () => {
    const store = makeStore();
    const view = makeView(store);
    const cells = view.el!.querySelectorAll('tr[data-record-id] td');
    expect(cells[1].classList.contains('x-treegrid-cell')).toBe(false);
  });

  it('leaf row has x-treegrid-leaf class', () => {
    const store = makeStore();
    const view = makeView(store);
    const leaf1Row = view.getNodeRow(store.getNodeById('leaf1') as NodeInterface);
    expect(leaf1Row!.classList.contains('x-treegrid-leaf')).toBe(true);
  });

  it('expanded row has x-treegrid-expanded class', () => {
    const store = makeStore();
    const view = makeView(store);
    const folder1Row = view.getNodeRow(store.getNodeById('folder1') as NodeInterface);
    expect(folder1Row!.classList.contains('x-treegrid-expanded')).toBe(true);
  });

  it('collapsed row has x-treegrid-collapsed class', () => {
    const store = makeStore();
    const view = makeView(store);
    const folder2Row = view.getNodeRow(store.getNodeById('folder2') as NodeInterface);
    expect(folder2Row!.classList.contains('x-treegrid-collapsed')).toBe(true);
  });

  it('expanded node has aria-expanded=true', () => {
    const store = makeStore();
    const view = makeView(store);
    const folder1Row = view.getNodeRow(store.getNodeById('folder1') as NodeInterface);
    expect(folder1Row!.getAttribute('aria-expanded')).toBe('true');
  });

  it('collapsed node has aria-expanded=false', () => {
    const store = makeStore();
    const view = makeView(store);
    const folder2Row = view.getNodeRow(store.getNodeById('folder2') as NodeInterface);
    expect(folder2Row!.getAttribute('aria-expanded')).toBe('false');
  });

  it('leaf node has no aria-expanded attribute', () => {
    const store = makeStore();
    const view = makeView(store);
    const leaf1Row = view.getNodeRow(store.getNodeById('leaf1') as NodeInterface);
    expect(leaf1Row!.hasAttribute('aria-expanded')).toBe(false);
  });

  it('rows have correct aria-level', () => {
    const store = makeStore();
    const view = makeView(store);
    const folder1Row = view.getNodeRow(store.getNodeById('folder1') as NodeInterface);
    const leaf1Row = view.getNodeRow(store.getNodeById('leaf1') as NodeInterface);
    expect(folder1Row!.getAttribute('aria-level')).toBe('2'); // depth 1 + 1
    expect(leaf1Row!.getAttribute('aria-level')).toBe('3'); // depth 2 + 1
  });

  it('second column shows correct plain value', () => {
    const store = makeStore();
    const view = makeView(store);
    const leaf1Row = view.getNodeRow(store.getNodeById('leaf1') as NodeInterface);
    const cells = leaf1Row!.querySelectorAll('td');
    expect(cells[1].textContent?.trim()).toBe('100');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Node lookup
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridView — node lookup', () => {
  it('getNodeRow returns the row for a node', () => {
    const store = makeStore();
    const view = makeView(store);
    const node = store.getNodeById('leaf1') as NodeInterface;
    const row = view.getNodeRow(node);
    expect(row).not.toBeNull();
    expect(row!.getAttribute('data-record-id')).toBe('leaf1');
  });

  it('getNodeRow returns null for root when rootVisible=false', () => {
    const store = makeStore();
    const view = makeView(store);
    const root = store.getRootNode();
    expect(view.getNodeRow(root)).toBeNull();
  });

  it('getRecord returns node for a row element', () => {
    const store = makeStore();
    const view = makeView(store);
    const node = store.getNodeById('leaf2') as NodeInterface;
    const row = view.getNodeRow(node)!;
    expect(view.getRecord(row)).toBe(node);
  });

  it('getRecord from a child element walks up to row', () => {
    const store = makeStore();
    const view = makeView(store);
    const node = store.getNodeById('leaf1') as NodeInterface;
    const row = view.getNodeRow(node)!;
    const span = row.querySelector('.x-treegrid-node-text')!;
    expect(view.getRecord(span as HTMLElement)).toBe(node);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// refreshNode
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridView — refreshNode', () => {
  it('updates cell content when record data changes', () => {
    const store = makeStore();
    const view = makeView(store);
    const node = store.getNodeById('leaf1') as NodeInterface;

    // Change text
    (node as any).set?.('text', 'Updated Leaf');
    view.refreshNode(node);

    const row = view.getNodeRow(node)!;
    expect(row.textContent).toContain('Updated Leaf');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Expand / Collapse DOM updates
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridView — expand/collapse', () => {
  it('onNodeCollapse removes child rows from DOM', () => {
    const store = makeStore();
    const view = makeView(store);

    // Collapse folder1
    store.collapseNode(store.getNodeById('folder1') as NodeInterface);
    view.onNodeCollapse(store.getNodeById('folder1') as NodeInterface);

    const leaf1Row = view.getNodeRow(store.getNodeById('leaf1') as NodeInterface);
    const leaf2Row = view.getNodeRow(store.getNodeById('leaf2') as NodeInterface);
    expect(leaf1Row).toBeNull();
    expect(leaf2Row).toBeNull();
  });

  it('onNodeCollapse updates parent row classes', () => {
    const store = makeStore();
    const view = makeView(store);
    const folder1 = store.getNodeById('folder1') as NodeInterface;
    store.collapseNode(folder1);
    view.onNodeCollapse(folder1);
    const row = view.getNodeRow(folder1)!;
    expect(row.classList.contains('x-treegrid-collapsed')).toBe(true);
    expect(row.getAttribute('aria-expanded')).toBe('false');
  });

  it('refresh after expand shows child rows', () => {
    const store = makeStore();
    // Start with folder2 collapsed
    const folder2 = store.getNodeById('folder2') as NodeInterface;
    // Add children to folder2
    const childData = TreeModel.create({ id: 'child1', text: 'Child 1', leaf: true });
    applyNodeInterface(childData as any, 2);
    store.appendChild(folder2, childData as any);
    store.expandNode(folder2);

    const view = makeView(store);
    const childRow = view.getNodeRow(childData as any);
    expect(childRow).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Selection visual
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridView — selection', () => {
  it('markSelected adds x-treegrid-selected class', () => {
    const store = makeStore();
    const view = makeView(store);
    const node = store.getNodeById('leaf1') as NodeInterface;
    view.markSelected(node, true);
    const row = view.getNodeRow(node)!;
    expect(row.classList.contains('x-treegrid-selected')).toBe(true);
    expect(row.getAttribute('aria-selected')).toBe('true');
  });

  it('markSelected removes x-treegrid-selected class', () => {
    const store = makeStore();
    const view = makeView(store);
    const node = store.getNodeById('leaf1') as NodeInterface;
    view.markSelected(node, true);
    view.markSelected(node, false);
    const row = view.getNodeRow(node)!;
    expect(row.classList.contains('x-treegrid-selected')).toBe(false);
    expect(row.getAttribute('aria-selected')).toBe('false');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Focus
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridView — focus', () => {
  it('focusRow sets tabindex=0 on the row', () => {
    const store = makeStore();
    const view = makeView(store);
    const node = store.getNodeById('leaf1') as NodeInterface;
    view.focusRow(node);
    const row = view.getNodeRow(node)!;
    expect(row.getAttribute('tabindex')).toBe('0');
  });

  it('focusRow adds x-treegrid-focused class', () => {
    const store = makeStore();
    const view = makeView(store);
    const node = store.getNodeById('leaf1') as NodeInterface;
    view.focusRow(node);
    const row = view.getNodeRow(node)!;
    expect(row.classList.contains('x-treegrid-focused')).toBe(true);
  });

  it('focusRow removes focus from previous row', () => {
    const store = makeStore();
    const view = makeView(store);
    const node1 = store.getNodeById('leaf1') as NodeInterface;
    const node2 = store.getNodeById('leaf2') as NodeInterface;
    view.focusRow(node1);
    view.focusRow(node2);
    const row1 = view.getNodeRow(node1)!;
    expect(row1.getAttribute('tabindex')).toBe('-1');
    expect(row1.classList.contains('x-treegrid-focused')).toBe(false);
  });

  it('getFocusedNode returns the focused node', () => {
    const store = makeStore();
    const view = makeView(store);
    const node = store.getNodeById('leaf1') as NodeInterface;
    view.focusRow(node);
    expect(view.getFocusedNode()).toBe(node);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Loading indicator
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridView — loading indicator', () => {
  it('showLoadingIndicator adds x-treegrid-loading class', () => {
    const store = makeStore();
    const view = makeView(store);
    const node = store.getNodeById('folder2') as NodeInterface;
    view.showLoadingIndicator(node);
    const row = view.getNodeRow(node)!;
    expect(row.classList.contains('x-treegrid-loading')).toBe(true);
  });

  it('hideLoadingIndicator removes x-treegrid-loading class', () => {
    const store = makeStore();
    const view = makeView(store);
    const node = store.getNodeById('folder2') as NodeInterface;
    view.showLoadingIndicator(node);
    view.hideLoadingIndicator(node);
    const row = view.getNodeRow(node)!;
    expect(row.classList.contains('x-treegrid-loading')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Events
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridView — events', () => {
  it('click on row fires itemclick event', () => {
    const store = makeStore();
    const view = makeView(store);
    const spy = vi.fn();
    view.on('itemclick', spy);

    const node = store.getNodeById('leaf1') as NodeInterface;
    const row = view.getNodeRow(node)!;
    row.click();
    expect(spy).toHaveBeenCalledWith(node, expect.any(MouseEvent));
  });

  it('click on expander fires expanderclick', () => {
    const store = makeStore();
    const view = makeView(store);
    const spy = vi.fn();
    view.on('expanderclick', spy);

    const node = store.getNodeById('folder2') as NodeInterface;
    const row = view.getNodeRow(node)!;
    const expander = row.querySelector(
      '.x-treegrid-expander:not(.x-treegrid-expander-leaf)',
    ) as HTMLElement;
    if (expander) {
      expander.click();
      expect(spy).toHaveBeenCalled();
    }
  });

  it('on/un event system works', () => {
    const store = makeStore();
    const view = makeView(store);
    const spy = vi.fn();
    view.on('itemclick', spy);
    view.un('itemclick', spy);

    const node = store.getNodeById('leaf1') as NodeInterface;
    const row = view.getNodeRow(node)!;
    row.click();
    expect(spy).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Hidden columns
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridView — hidden columns', () => {
  it('hidden column cells are not rendered', () => {
    const store = makeStore();
    const columns = [
      new TreeGridColumn({ dataIndex: 'text', text: 'Name', width: 200 }),
      new Column({ dataIndex: 'size', text: 'Size', width: 100, hidden: true }),
    ];
    const view = new TreeGridView({ store, columns });
    view.render(document.body);

    const firstRow = view.el!.querySelector('tr[data-record-id]');
    // Only 1 cell (hidden col skipped)
    expect(firstRow!.querySelectorAll('td').length).toBe(1);
  });
});
