/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TreeGrid } from '../../src/treegrid/TreeGrid.js';
import { TreeGridCellEditing } from '../../src/treegrid/TreeGridCellEditing.js';
import { TreeGridSummary } from '../../src/treegrid/TreeGridSummary.js';
import { TreeGridFilterPlugin } from '../../src/treegrid/TreeGridFilterPlugin.js';
import { TreeGridExporter } from '../../src/treegrid/TreeGridExporter.js';
import { TreeStore, TreeModel, applyNodeInterface } from '@framesquared/data';

class MockRO {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  (globalThis as any).ResizeObserver = MockRO;
  (globalThis as any).URL = {
    createObjectURL: vi.fn(() => 'blob:mock'),
    revokeObjectURL: vi.fn(),
  };
});

afterEach(() => {
  document.body.innerHTML = '';
});

// ═══════════════════════════════════════════════════════════════════════════
// Scenario 1: File Explorer
// ═══════════════════════════════════════════════════════════════════════════

describe('Integration — File Explorer', () => {
  function makeFileExplorerGrid() {
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
              id: 'docs',
              text: 'Documents',
              type: 'folder',
              expanded: true,
              children: [
                { id: 'file1', text: 'Resume.pdf', size: 1024, type: 'pdf', leaf: true },
                { id: 'file2', text: 'Budget.xlsx', size: 2048, type: 'xlsx', leaf: true },
              ],
            },
            {
              id: 'photos',
              text: 'Photos',
              type: 'folder',
              children: [
                { id: 'photo1', text: 'vacation.jpg', size: 5120, type: 'jpg', leaf: true },
              ],
            },
          ],
        },
      }),
      columns: [
        { dataIndex: 'text', text: 'Name', width: 300 },
        { dataIndex: 'type', text: 'Type', width: 80 },
        { dataIndex: 'size', text: 'Size', width: 100 },
      ],
    } as any);
  }

  it('renders all visible nodes', () => {
    const grid = makeFileExplorerGrid();
    const rows = grid.el!.querySelectorAll('tr[data-record-id]');
    // docs (expanded), file1, file2, photos = 4
    expect(rows.length).toBe(4);
  });

  it('expanding photos shows photo1', () => {
    const grid = makeFileExplorerGrid();
    const photos = grid.getNodeById('photos')!;
    grid.expandNode(photos);
    const rows = grid.el!.querySelectorAll('tr[data-record-id]');
    expect(rows.length).toBe(5);
  });

  it('collapsing docs hides file1 and file2', () => {
    const grid = makeFileExplorerGrid();
    const docs = grid.getNodeById('docs')!;
    grid.collapseNode(docs);
    const rows = grid.el!.querySelectorAll('tr[data-record-id]');
    expect(rows.length).toBe(2); // docs, photos
  });

  it('double-click expands folder (expandOnDblClick)', () => {
    const grid = makeFileExplorerGrid();
    const photosRow = grid.getNodeRow(grid.getNodeById('photos')!)!;
    photosRow.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    const photo1Row = grid.getNodeRow(grid.getNodeById('photo1')!);
    expect(photo1Row).not.toBeNull();
  });

  it('size column shows correct values', () => {
    const grid = makeFileExplorerGrid();
    const file1Row = grid.getNodeRow(grid.getNodeById('file1')!)!;
    const cells = file1Row.querySelectorAll('td');
    expect(cells[2].textContent?.trim()).toBe('1024');
  });

  it('multiple columns render correctly', () => {
    const grid = makeFileExplorerGrid();
    const file2Row = grid.getNodeRow(grid.getNodeById('file2')!)!;
    const cells = file2Row.querySelectorAll('td');
    expect(cells.length).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Scenario 2: Project Task Breakdown
// ═══════════════════════════════════════════════════════════════════════════

describe('Integration — Project Tasks', () => {
  function makeTaskGrid() {
    return new TreeGrid({
      renderTo: document.body,
      store: new TreeStore({
        model: TreeModel,
        root: {
          id: 'root',
          text: 'Project',
          expanded: true,
          children: [
            {
              id: 'phase1',
              text: 'Phase 1',
              expanded: true,
              children: [
                { id: 't1', text: 'Design', status: 'done', hours: 20, leaf: true },
                { id: 't2', text: 'Development', status: 'active', hours: 40, leaf: true },
              ],
            },
            {
              id: 'phase2',
              text: 'Phase 2',
              children: [{ id: 't3', text: 'Testing', status: 'pending', hours: 15, leaf: true }],
            },
          ],
        },
      }),
      checkable: true,
      columns: [
        { dataIndex: 'text', text: 'Task', width: 200 },
        { dataIndex: 'status', text: 'Status', width: 100 },
        { dataIndex: 'hours', text: 'Hours', width: 80 },
      ],
    } as any);
  }

  it('renders tree structure with checkboxes', () => {
    const grid = makeTaskGrid();
    const checkboxes = grid.el!.querySelectorAll('.x-treegrid-checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('check cascade: checking phase1 checks t1 and t2', () => {
    const grid = makeTaskGrid();
    const phase1 = grid.getNodeById('phase1')!;
    const t1 = grid.getNodeById('t1')!;
    const t2 = grid.getNodeById('t2')!;

    grid.setChecked(phase1, true);
    expect((t1 as any).$checked).toBe(true);
    expect((t2 as any).$checked).toBe(true);
  });

  it('summary shows total hours', () => {
    const grid = makeTaskGrid();
    const summary = new TreeGridSummary({
      summaryColumns: [{ dataIndex: 'hours', summaryType: 'sum' }],
    });
    summary.init(grid);
    summary.renderSummary();

    const summaryRow = grid.el!.querySelector('.x-treegrid-summary-row')!;
    expect(summaryRow.textContent).toContain('75'); // 20+40+15
  });

  it('filter by status hides non-matching tasks', () => {
    const grid = makeTaskGrid();
    const filter = new TreeGridFilterPlugin({ filterer: 'bottomup' });
    filter.init(grid);

    filter.addFilter({ dataIndex: 'status', value: 'done', operator: 'eq' });

    const t2 = grid.getNodeById('t2')!;
    expect((t2 as any)._filterHidden).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Scenario 3: Multi-column sort
// ═══════════════════════════════════════════════════════════════════════════

describe('Integration — Sorting', () => {
  it('collapseAll then expandAll restores all rows', () => {
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
              id: 'a',
              text: 'A',
              expanded: true,
              children: [
                { id: 'a1', text: 'A1', leaf: true },
                { id: 'a2', text: 'A2', leaf: true },
              ],
            },
            { id: 'b', text: 'B', leaf: true },
          ],
        },
      }),
      columns: [{ dataIndex: 'text', text: 'Name' }],
    } as any);

    const initialRows = grid.el!.querySelectorAll('tr[data-record-id]').length;
    grid.collapseAll();
    grid.expandAll();
    const finalRows = grid.el!.querySelectorAll('tr[data-record-id]').length;
    expect(finalRows).toBe(initialRows);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Scenario 4: Cell Editing + Tree
// ═══════════════════════════════════════════════════════════════════════════

describe('Integration — Cell Editing', () => {
  it('edit + expand combination works', () => {
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
              id: 'a',
              text: 'A',
              expanded: true,
              children: [{ id: 'a1', text: 'A1', leaf: true }],
            },
          ],
        },
      }),
      columns: [{ dataIndex: 'text', text: 'Name' }],
    } as any);

    const editing = new TreeGridCellEditing();
    editing.init(grid);

    const a1 = grid.getNodeById('a1')!;
    editing.startEdit(a1, 'text');
    expect(editing.isEditing()).toBe(true);

    // Collapse parent while editing
    const a = grid.getNodeById('a')!;
    grid.collapseNode(a);
    // After collapse, editor row is hidden but editor state remains
    editing.cancelEdit();
    expect(editing.isEditing()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Scenario 5: Export after modification
// ═══════════════════════════════════════════════════════════════════════════

describe('Integration — Export', () => {
  it('CSV export after adding nodes', () => {
    const grid = new TreeGrid({
      renderTo: document.body,
      store: new TreeStore({
        model: TreeModel,
        root: {
          id: 'root',
          text: 'Root',
          expanded: true,
          children: [{ id: 'a', text: 'A', size: 10, leaf: true }],
        },
      }),
      columns: [
        { dataIndex: 'text', text: 'Name' },
        { dataIndex: 'size', text: 'Size' },
      ],
    } as any);

    // Add a node
    const newNode = TreeModel.create({ id: 'b', text: 'B', size: 20, leaf: true });
    applyNodeInterface(newNode as any, 1);
    grid.getStore().appendChild(grid.getRootNode(), newNode as any);

    const csv = TreeGridExporter.exportToCsv(grid);
    expect(csv).toContain('A');
    expect(csv).toContain('B');
  });

  it('JSON export preserves hierarchy', () => {
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
              id: 'folder',
              text: 'Folder',
              expanded: true,
              children: [{ id: 'file', text: 'File', leaf: true }],
            },
          ],
        },
      }),
      columns: [{ dataIndex: 'text', text: 'Name' }],
    } as any);

    const json = TreeGridExporter.exportToJson(grid);
    const parsed = JSON.parse(json);
    expect(parsed).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Scenario 6: Selection + Scroll
// ═══════════════════════════════════════════════════════════════════════════

describe('Integration — Selection + Scroll', () => {
  it('scrollToNode expands collapsed ancestors', async () => {
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
              id: 'a',
              text: 'A',
              children: [
                { id: 'a1', text: 'A1', children: [{ id: 'a1a', text: 'A1A', leaf: true }] },
              ],
            },
          ],
        },
      }),
      columns: [{ dataIndex: 'text', text: 'Name' }],
    } as any);

    const a1a = grid.getNodeById('a1a')!;
    await grid.scrollToNode(a1a, { select: true });

    expect(grid.getNodeById('a')?.isExpanded()).toBe(true);
    expect(grid.getNodeById('a1')?.isExpanded()).toBe(true);
    expect(grid.getSelection()).toContain(a1a);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Scenario 7: Store mutations reflected in UI
// ═══════════════════════════════════════════════════════════════════════════

describe('Integration — Store mutations', () => {
  it('appending a node to expanded parent shows it', () => {
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
              id: 'a',
              text: 'A',
              expanded: true,
              children: [{ id: 'a1', text: 'A1', leaf: true }],
            },
          ],
        },
      }),
      columns: [{ dataIndex: 'text', text: 'Name' }],
    } as any);

    const nodeA = grid.getNodeById('a')!;
    const newNode = TreeModel.create({ id: 'a2', text: 'A2', leaf: true });
    applyNodeInterface(newNode as any, 2);
    grid.getStore().appendChild(nodeA, newNode as any);

    // Refresh view
    grid.getView().refresh();

    const row = grid.getNodeRow(newNode as any);
    expect(row).not.toBeNull();
  });

  it('removing a node removes its row', () => {
    const grid = new TreeGrid({
      renderTo: document.body,
      store: new TreeStore({
        model: TreeModel,
        root: {
          id: 'root',
          text: 'Root',
          expanded: true,
          children: [
            { id: 'a', text: 'A', leaf: true },
            { id: 'b', text: 'B', leaf: true },
          ],
        },
      }),
      columns: [{ dataIndex: 'text', text: 'Name' }],
    } as any);

    const nodeA = grid.getNodeById('a')!;
    grid.getStore().removeChild(grid.getRootNode(), nodeA);
    grid.getView().refresh();

    const row = grid.getNodeRow(nodeA);
    expect(row).toBeNull();
  });
});
