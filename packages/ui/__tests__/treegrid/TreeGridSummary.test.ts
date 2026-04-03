import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TreeGridSummary } from '../../src/treegrid/TreeGridSummary.js';
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
          { id: 'a', text: 'A', size: 10, leaf: true },
          { id: 'b', text: 'B', size: 20, leaf: true },
          { id: 'c', text: 'C', size: 30, leaf: true },
        ],
      },
    }),
    columns: [
      { dataIndex: 'text', text: 'Name' },
      { dataIndex: 'size', text: 'Size' },
    ],
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

describe('TreeGridSummary — construction', () => {
  it('creates with defaults', () => {
    const feature = new TreeGridSummary();
    expect(feature).toBeDefined();
  });

  it('init does not throw', () => {
    const grid = makeGrid();
    const feature = new TreeGridSummary();
    expect(() => feature.init(grid)).not.toThrow();
  });

  it('destroy does not throw', () => {
    const grid = makeGrid();
    const feature = new TreeGridSummary();
    feature.init(grid);
    expect(() => feature.destroy()).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Calculation
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridSummary — calculation', () => {
  it('summaryType sum adds values', () => {
    const grid = makeGrid();
    const feature = new TreeGridSummary({
      summaryColumns: [{ dataIndex: 'size', summaryType: 'sum' }],
    });
    feature.init(grid);
    const total = feature.calculateSummary('size', 'sum');
    expect(total).toBe(60); // 10+20+30
  });

  it('summaryType count counts nodes', () => {
    const grid = makeGrid();
    const feature = new TreeGridSummary({
      summaryColumns: [{ dataIndex: 'size', summaryType: 'count' }],
    });
    feature.init(grid);
    expect(feature.calculateSummary('size', 'count')).toBe(3);
  });

  it('summaryType average computes mean', () => {
    const grid = makeGrid();
    const feature = new TreeGridSummary({
      summaryColumns: [{ dataIndex: 'size', summaryType: 'average' }],
    });
    feature.init(grid);
    expect(feature.calculateSummary('size', 'average')).toBe(20); // (10+20+30)/3
  });

  it('summaryType min returns minimum', () => {
    const grid = makeGrid();
    const feature = new TreeGridSummary();
    feature.init(grid);
    expect(feature.calculateSummary('size', 'min')).toBe(10);
  });

  it('summaryType max returns maximum', () => {
    const grid = makeGrid();
    const feature = new TreeGridSummary();
    feature.init(grid);
    expect(feature.calculateSummary('size', 'max')).toBe(30);
  });

  it('non-numeric field returns 0 for sum', () => {
    const grid = makeGrid();
    const feature = new TreeGridSummary();
    feature.init(grid);
    expect(feature.calculateSummary('text', 'sum')).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Rendering
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridSummary — rendering', () => {
  it('renderSummary inserts summary row', () => {
    const grid = makeGrid();
    const feature = new TreeGridSummary({
      summaryColumns: [{ dataIndex: 'size', summaryType: 'sum' }],
    });
    feature.init(grid);
    feature.renderSummary();

    const summaryRow = document.querySelector('.x-treegrid-summary-row');
    expect(summaryRow).not.toBeNull();
  });

  it('summary row shows treeColumnSummaryText', () => {
    const grid = makeGrid();
    const feature = new TreeGridSummary({
      treeColumnSummaryText: 'Total',
    });
    feature.init(grid);
    feature.renderSummary();

    const summaryRow = document.querySelector('.x-treegrid-summary-row')!;
    expect(summaryRow.textContent).toContain('Total');
  });

  it('summary row shows sum value', () => {
    const grid = makeGrid();
    const feature = new TreeGridSummary({
      summaryColumns: [{ dataIndex: 'size', summaryType: 'sum' }],
    });
    feature.init(grid);
    feature.renderSummary();

    const summaryRow = document.querySelector('.x-treegrid-summary-row')!;
    expect(summaryRow.textContent).toContain('60');
  });

  it('position=top inserts at beginning', () => {
    const grid = makeGrid();
    const feature = new TreeGridSummary({ position: 'top' });
    feature.init(grid);
    feature.renderSummary();

    const table = grid.el!.querySelector('table')!;
    expect(table.firstChild).not.toBeNull();
    // The first row should be the summary
    const firstRow = table.querySelector('tr:first-child')!;
    expect(firstRow.classList.contains('x-treegrid-summary-row')).toBe(true);
  });

  it('updateSummary re-renders the summary', () => {
    const grid = makeGrid();
    const feature = new TreeGridSummary({
      summaryColumns: [{ dataIndex: 'size', summaryType: 'sum' }],
    });
    feature.init(grid);
    feature.renderSummary();
    feature.updateSummary();

    const summaryRows = document.querySelectorAll('.x-treegrid-summary-row');
    // Should only have one summary row (old one replaced)
    expect(summaryRows.length).toBe(1);
  });

  it('summaryRenderer formats the output', () => {
    const grid = makeGrid();
    const feature = new TreeGridSummary({
      summaryColumns: [
        {
          dataIndex: 'size',
          summaryType: 'sum',
          summaryRenderer: (val) => `Total: ${val}`,
        },
      ],
    });
    feature.init(grid);
    feature.renderSummary();

    const summaryRow = document.querySelector('.x-treegrid-summary-row')!;
    expect(summaryRow.textContent).toContain('Total: 60');
  });
});
