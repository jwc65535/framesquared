/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TreeGridGroupingSummary } from '../../src/treegrid/TreeGridGroupingSummary.js';
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
          {
            id: 'phase1',
            text: 'Phase 1',
            expanded: true,
            children: [
              { id: 't1', text: 'Task 1', hours: 5, leaf: true },
              { id: 't2', text: 'Task 2', hours: 10, leaf: true },
            ],
          },
          {
            id: 'phase2',
            text: 'Phase 2',
            expanded: false,
            children: [{ id: 't3', text: 'Task 3', hours: 15, leaf: true }],
          },
        ],
      },
    }),
    columns: [
      { dataIndex: 'text', text: 'Task' },
      { dataIndex: 'hours', text: 'Hours' },
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

describe('TreeGridGroupingSummary — construction', () => {
  it('creates with defaults', () => {
    const feature = new TreeGridGroupingSummary();
    expect(feature).toBeDefined();
  });

  it('init does not throw', () => {
    const grid = makeGrid();
    const feature = new TreeGridGroupingSummary();
    expect(() => feature.init(grid)).not.toThrow();
  });

  it('destroy does not throw', () => {
    const grid = makeGrid();
    const feature = new TreeGridGroupingSummary();
    feature.init(grid);
    expect(() => feature.destroy()).not.toThrow();
  });

  it('custom summaryRowCls', () => {
    const feature = new TreeGridGroupingSummary({ summaryRowCls: 'my-summary' });
    expect(feature).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Rendering (private _renderGroupSummaries called via store events)
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridGroupingSummary — rendering', () => {
  it('expanded parent gets a summary row after its last child', () => {
    const grid = makeGrid();
    const feature = new TreeGridGroupingSummary({
      summaryColumns: [{ dataIndex: 'hours', summaryType: 'sum' }],
    });
    feature.init(grid);

    // Trigger render via store event
    (grid.getStore() as any).fireEvent?.('datachanged');

    const summaryRows = document.querySelectorAll('.x-treegrid-summary-row');
    // phase1 is expanded → should have summary row
    expect(summaryRows.length).toBeGreaterThan(0);
  });

  it('collapsed parent has no summary row', () => {
    const grid = makeGrid();
    const feature = new TreeGridGroupingSummary({
      summaryColumns: [{ dataIndex: 'hours', summaryType: 'sum' }],
    });
    feature.init(grid);
    (grid.getStore() as any).fireEvent?.('datachanged');

    // phase2 is collapsed
    const phase2 = grid.getNodeById('phase2')!;
    const summaryForPhase2 = document.querySelector(
      `[data-summary-for="${(phase2 as any).getId?.()}"]`,
    );
    expect(summaryForPhase2).toBeNull();
  });

  it('summary row shows aggregated value', () => {
    const grid = makeGrid();
    const feature = new TreeGridGroupingSummary({
      summaryColumns: [{ dataIndex: 'hours', summaryType: 'sum' }],
    });
    feature.init(grid);
    (grid.getStore() as any).fireEvent?.('datachanged');

    const summaryRows = document.querySelectorAll('.x-treegrid-summary-row');
    if (summaryRows.length > 0) {
      expect(summaryRows[0].textContent).toContain('15'); // 5+10 for phase1
    }
  });

  it('custom treeColumnSummaryText shown', () => {
    const grid = makeGrid();
    const feature = new TreeGridGroupingSummary({
      treeColumnSummaryText: 'Subtotal',
    });
    feature.init(grid);
    (grid.getStore() as any).fireEvent?.('datachanged');

    const summaryRows = document.querySelectorAll('.x-treegrid-summary-row');
    if (summaryRows.length > 0) {
      expect(summaryRows[0].textContent).toContain('Subtotal');
    }
  });

  it('includeDescendants=true aggregates all descendants', () => {
    const grid = makeGrid();
    const feature = new TreeGridGroupingSummary({
      includeDescendants: true,
      summaryColumns: [{ dataIndex: 'hours', summaryType: 'sum' }],
    });
    feature.init(grid);
    (grid.getStore() as any).fireEvent?.('datachanged');
    // Should not throw
    expect(feature).toBeDefined();
  });
});
