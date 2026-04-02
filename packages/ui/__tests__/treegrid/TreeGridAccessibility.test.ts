import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TreeGrid } from '../../src/treegrid/TreeGrid.js';
import { TreeStore, TreeModel } from '@framesquared/data';

class MockRO {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function makeGrid(extra: Record<string, unknown> = {}) {
  return new TreeGrid({
    renderTo: document.body,
    store: new TreeStore({
      model: TreeModel,
      root: {
        id: 'root',
        text: 'Root',
        expanded: true,
        children: [
          {
            id: 'a',
            text: 'Node A',
            expanded: true,
            children: [
              { id: 'a1', text: 'A1', leaf: true },
              { id: 'a2', text: 'A2', leaf: true },
            ],
          },
          { id: 'b', text: 'Node B', leaf: true },
          { id: 'c', text: 'Node C', leaf: true },
        ],
      },
    }),
    columns: [{ dataIndex: 'text', text: 'Name' }],
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
// ARIA roles
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridAccessibility — ARIA roles', () => {
  it('view container has role="treegrid"', () => {
    const grid = makeGrid();
    const view = grid.getView().el!;
    expect(view.getAttribute('role')).toBe('treegrid');
  });

  it('rows have role="row"', () => {
    const grid = makeGrid();
    const rows = grid.el!.querySelectorAll('tr[data-record-id]');
    rows.forEach((row) => {
      expect(row.getAttribute('role')).toBe('row');
    });
  });

  it('cells have role="gridcell"', () => {
    const grid = makeGrid();
    const cells = grid.el!.querySelectorAll('td');
    cells.forEach((cell) => {
      expect(cell.getAttribute('role')).toBe('gridcell');
    });
  });

  it('expanders have role="button"', () => {
    const grid = makeGrid();
    const expanders = grid.el!.querySelectorAll(
      '.x-treegrid-expander:not(.x-treegrid-expander-leaf)',
    );
    expanders.forEach((exp) => {
      expect(exp.getAttribute('role')).toBe('button');
    });
  });

  it('expanders have aria-label', () => {
    const grid = makeGrid();
    const expanders = grid.el!.querySelectorAll(
      '.x-treegrid-expander:not(.x-treegrid-expander-leaf)',
    );
    expanders.forEach((exp) => {
      expect(exp.getAttribute('aria-label')).toBeTruthy();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ARIA levels
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridAccessibility — ARIA levels', () => {
  it('root-level nodes have aria-level=2 (depth 1 = level 2)', () => {
    const grid = makeGrid();
    const nodeARow = grid.getNodeRow(grid.getNodeById('a')!)!;
    expect(nodeARow.getAttribute('aria-level')).toBe('2');
  });

  it('depth-2 nodes have aria-level=3', () => {
    const grid = makeGrid();
    const a1Row = grid.getNodeRow(grid.getNodeById('a1')!)!;
    expect(a1Row.getAttribute('aria-level')).toBe('3');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// aria-expanded
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridAccessibility — aria-expanded', () => {
  it('expanded non-leaf has aria-expanded="true"', () => {
    const grid = makeGrid();
    const nodeARow = grid.getNodeRow(grid.getNodeById('a')!)!;
    expect(nodeARow.getAttribute('aria-expanded')).toBe('true');
  });

  it('leaf nodes do NOT have aria-expanded attribute', () => {
    const grid = makeGrid();
    const a1Row = grid.getNodeRow(grid.getNodeById('a1')!)!;
    expect(a1Row.hasAttribute('aria-expanded')).toBe(false);
  });

  it('aria-expanded changes on collapse', () => {
    const grid = makeGrid();
    const nodeA = grid.getNodeById('a')!;
    grid.collapseNode(nodeA);
    const nodeARow = grid.getNodeRow(nodeA)!;
    expect(nodeARow.getAttribute('aria-expanded')).toBe('false');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// aria-selected
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridAccessibility — aria-selected', () => {
  it('rows have aria-selected="false" by default', () => {
    const grid = makeGrid();
    const rows = grid.el!.querySelectorAll('tr[data-record-id]');
    rows.forEach((row) => {
      expect(row.getAttribute('aria-selected')).toBe('false');
    });
  });

  it('selected row has aria-selected="true"', () => {
    const grid = makeGrid();
    const nodeB = grid.getNodeById('b')!;
    grid.select(nodeB);
    const row = grid.getNodeRow(nodeB)!;
    expect(row.getAttribute('aria-selected')).toBe('true');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// aria-setsize and aria-posinset
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridAccessibility — aria-setsize/aria-posinset', () => {
  it('root-level nodes have correct aria-setsize', () => {
    const grid = makeGrid();
    const nodeARow = grid.getNodeRow(grid.getNodeById('a')!)!;
    // Root has 3 children (a, b, c)
    expect(nodeARow.getAttribute('aria-setsize')).toBe('3');
  });

  it('root-level nodes have correct aria-posinset', () => {
    const grid = makeGrid();
    const nodeARow = grid.getNodeRow(grid.getNodeById('a')!)!;
    expect(nodeARow.getAttribute('aria-posinset')).toBe('1'); // first child
    const nodeBRow = grid.getNodeRow(grid.getNodeById('b')!)!;
    expect(nodeBRow.getAttribute('aria-posinset')).toBe('2');
    const nodeCRow = grid.getNodeRow(grid.getNodeById('c')!)!;
    expect(nodeCRow.getAttribute('aria-posinset')).toBe('3');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Checkbox ARIA
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridAccessibility — checkbox ARIA', () => {
  it('checkboxes have role="checkbox"', () => {
    const grid = makeGrid({ checkable: true });
    const checkboxes = grid.el!.querySelectorAll('.x-treegrid-checkbox');
    checkboxes.forEach((cb) => {
      expect(cb.getAttribute('role')).toBe('checkbox');
    });
  });

  it('unchecked checkbox has aria-checked="false"', () => {
    const grid = makeGrid({ checkable: true });
    const checkboxes = grid.el!.querySelectorAll(
      '.x-treegrid-checkbox:not(.x-treegrid-checkbox-checked)',
    );
    checkboxes.forEach((cb) => {
      expect(cb.getAttribute('aria-checked')).toBe('false');
    });
  });

  it('checked checkbox has aria-checked="true"', () => {
    const grid = makeGrid({ checkable: true });
    const nodeB = grid.getNodeById('b')!;
    grid.setChecked(nodeB, true);
    const row = grid.getNodeRow(nodeB)!;
    const checkbox = row.querySelector('.x-treegrid-checkbox')!;
    expect(checkbox.getAttribute('aria-checked')).toBe('true');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Keyboard navigation
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridAccessibility — keyboard', () => {
  it('ArrowDown moves focus to next row', () => {
    const grid = makeGrid();
    const view = grid.getView();
    const nodeA = grid.getNodeById('a')!;
    view.focusRow(nodeA);

    const viewEl = view.el!;
    viewEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

    const focused = view.getFocusedNode();
    expect(focused).not.toBe(nodeA);
  });

  it('ArrowUp moves focus to previous row', () => {
    const grid = makeGrid();
    const view = grid.getView();
    const a1 = grid.getNodeById('a1')!;
    view.focusRow(a1);

    const viewEl = view.el!;
    viewEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));

    const focused = view.getFocusedNode();
    expect(focused).not.toBe(a1);
  });

  it('ArrowRight on collapsed node expands it', () => {
    const grid = makeGrid();
    const view = grid.getView();
    const nodeA = grid.getNodeById('a')!;
    grid.collapseNode(nodeA);
    view.focusRow(nodeA);

    const viewEl = view.el!;
    const nodeARow = grid.getNodeRow(nodeA)!;
    // Focus the element first
    nodeARow.focus();
    viewEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    expect(nodeA.isExpanded()).toBe(true);
  });

  it('ArrowLeft on expanded node collapses it', () => {
    const grid = makeGrid();
    const view = grid.getView();
    const nodeA = grid.getNodeById('a')!;
    grid.expandNode(nodeA);
    view.focusRow(nodeA);

    const nodeARow = grid.getNodeRow(nodeA)!;
    nodeARow.focus();
    const viewEl = view.el!;
    viewEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));

    expect(nodeA.isExpanded()).toBe(false);
  });

  it('Home key moves focus to first row', () => {
    const grid = makeGrid();
    const view = grid.getView();
    const nodeB = grid.getNodeById('b')!;
    view.focusRow(nodeB);

    const viewEl = view.el!;
    viewEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));

    // First row should have tabindex=0
    const firstRow = grid.el!.querySelector('tr[data-record-id]') as HTMLElement;
    expect(firstRow?.getAttribute('tabindex')).toBe('0');
  });

  it('End key moves focus to last row', () => {
    const grid = makeGrid();
    const view = grid.getView();

    const viewEl = view.el!;
    viewEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));

    const rows = grid.el!.querySelectorAll('tr[data-record-id]');
    const lastRow = rows[rows.length - 1] as HTMLElement;
    expect(lastRow?.getAttribute('tabindex')).toBe('0');
  });

  it('only one row has tabindex="0" at a time', () => {
    const grid = makeGrid();
    const view = grid.getView();
    const nodeA = grid.getNodeById('a')!;
    const nodeB = grid.getNodeById('b')!;

    view.focusRow(nodeA);
    view.focusRow(nodeB);

    const rowsWith0 = grid.el!.querySelectorAll('tr[tabindex="0"]');
    expect(rowsWith0.length).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Focus visible
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridAccessibility — focus visible', () => {
  it('focused row has x-treegrid-focused class', () => {
    const grid = makeGrid();
    const view = grid.getView();
    const nodeA = grid.getNodeById('a')!;
    view.focusRow(nodeA);
    const row = grid.getNodeRow(nodeA)!;
    expect(row.classList.contains('x-treegrid-focused')).toBe(true);
  });

  it('unfocused rows do not have x-treegrid-focused class', () => {
    const grid = makeGrid();
    const view = grid.getView();
    const nodeA = grid.getNodeById('a')!;
    const nodeB = grid.getNodeById('b')!;
    view.focusRow(nodeA);
    view.focusRow(nodeB);

    const rowA = grid.getNodeRow(nodeA)!;
    expect(rowA.classList.contains('x-treegrid-focused')).toBe(false);
  });
});
