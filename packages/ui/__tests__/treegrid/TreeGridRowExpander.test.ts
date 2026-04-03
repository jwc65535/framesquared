/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TreeGridRowExpander } from '../../src/treegrid/TreeGridRowExpander.js';
import { TreeGrid } from '../../src/treegrid/TreeGrid.js';
import { TreeStore, TreeModel } from '@framesquared/data';

class MockRO {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function makeGrid() {
  return new TreeGrid({
    renderTo: document.body,
    store: new TreeStore({
      model: TreeModel,
      root: {
        id: 'root',
        text: 'Root',
        expanded: true,
        children: [
          { id: 'a', text: 'Node A', detail: 'Details for A', leaf: true },
          { id: 'b', text: 'Node B', detail: 'Details for B', leaf: true },
        ],
      },
    }),
    columns: [{ dataIndex: 'text', text: 'Name' }],
  } as any);
}

beforeEach(() => {
  (globalThis as any).ResizeObserver = MockRO;
});

afterEach(() => {
  document.body.innerHTML = '';
});

// ═══════════════════════════════════════════════════════════════════════════
// Construction
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridRowExpander — construction', () => {
  it('creates with defaults', () => {
    const plugin = new TreeGridRowExpander();
    expect(plugin).toBeDefined();
  });

  it('init does not throw', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowExpander();
    expect(() => plugin.init(grid)).not.toThrow();
  });

  it('destroy does not throw', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowExpander();
    plugin.init(grid);
    expect(() => plugin.destroy()).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Expand / Collapse
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridRowExpander — expand/collapse', () => {
  it('expandRow inserts body row after data row', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowExpander({
      rowBodyTpl: '<div>Detail: {detail}</div>',
    });
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    plugin.expandRow(nodeA);

    const bodyRow = document.querySelector('.x-treegrid-row-body');
    expect(bodyRow).not.toBeNull();
  });

  it('expandRow renders template content', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowExpander({
      rowBodyTpl: '<div>Detail: {detail}</div>',
    });
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    plugin.expandRow(nodeA);

    const bodyRow = document.querySelector('.x-treegrid-row-body')!;
    expect(bodyRow.textContent).toContain('Details for A');
  });

  it('isRowExpanded returns correct state', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowExpander();
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    expect(plugin.isRowExpanded(nodeA)).toBe(false);
    plugin.expandRow(nodeA);
    expect(plugin.isRowExpanded(nodeA)).toBe(true);
  });

  it('collapseRow removes body row', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowExpander({
      rowBodyTpl: '<div>{text}</div>',
    });
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    plugin.expandRow(nodeA);
    plugin.collapseRow(nodeA);

    expect(document.querySelector('.x-treegrid-row-body')).toBeNull();
    expect(plugin.isRowExpanded(nodeA)).toBe(false);
  });

  it('toggleRow expands collapsed row', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowExpander();
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    plugin.toggleRow(nodeA);
    expect(plugin.isRowExpanded(nodeA)).toBe(true);
  });

  it('toggleRow collapses expanded row', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowExpander();
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    plugin.expandRow(nodeA);
    plugin.toggleRow(nodeA);
    expect(plugin.isRowExpanded(nodeA)).toBe(false);
  });

  it('singleRowExpand closes existing when opening new', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowExpander({
      singleRowExpand: true,
      rowBodyTpl: '<div>{text}</div>',
    });
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    const nodeB = grid.getNodeById('b')!;
    plugin.expandRow(nodeA);
    plugin.expandRow(nodeB);

    expect(plugin.isRowExpanded(nodeA)).toBe(false);
    expect(plugin.isRowExpanded(nodeB)).toBe(true);
  });

  it('expanding same row twice only inserts one body row', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowExpander({
      rowBodyTpl: '<div>{text}</div>',
    });
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    plugin.expandRow(nodeA);
    plugin.expandRow(nodeA); // second call should be a no-op

    const bodyRows = document.querySelectorAll('.x-treegrid-row-body');
    expect(bodyRows.length).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// bodyIndent
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridRowExpander — bodyIndent', () => {
  it('bodyIndent=true adds padding to body cell', () => {
    const grid = new TreeGrid({
      renderTo: document.body,
      store: new TreeStore({
        model: TreeModel,
        root: {
          id: 'root',
          text: 'Root',
          expanded: true,
          children: [
            {
              id: 'parent',
              text: 'P',
              expanded: true,
              children: [{ id: 'child', text: 'C', leaf: true }],
            },
          ],
        },
      }),
      columns: [{ dataIndex: 'text', text: 'Name' }],
    } as any);

    const plugin = new TreeGridRowExpander({
      bodyIndent: true,
      rowBodyTpl: '<div>{text}</div>',
    });
    plugin.init(grid);

    const child = grid.getNodeById('child')!;
    plugin.expandRow(child);

    const bodyCell = document.querySelector('.x-treegrid-row-body-cell') as HTMLElement;
    expect(bodyCell).not.toBeNull();
    expect(bodyCell.style.paddingLeft).not.toBe('');
  });
});
