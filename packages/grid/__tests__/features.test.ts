import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Grid } from '../src/grid/Grid.js';
import { Grouping } from '../src/grid/feature/Grouping.js';
import { Summary } from '../src/grid/feature/Summary.js';
import { GroupingSummary } from '../src/grid/feature/GroupingSummary.js';
import { RowBody } from '../src/grid/feature/RowBody.js';
import { CellEditing } from '../src/grid/plugin/CellEditing.js';
import { RowEditing } from '../src/grid/plugin/RowEditing.js';
import { RowExpander } from '../src/grid/plugin/RowExpander.js';
import { GridClipboard } from '../src/grid/plugin/Clipboard.js';
import { GridDragDrop } from '../src/grid/plugin/DragDrop.js';

class MockRO {
  constructor() {}
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

function mockStore(data: Record<string, unknown>[] = []) {
  // Deep copy to prevent cross-test mutation
  const dataCopy = data.map((d) => ({ ...d }));
  const records = dataCopy.map((d, i) => ({
    id: d.id ?? i,
    data: d,
    get(f: string) {
      return (d as any)[f];
    },
    set(f: string, v: unknown) {
      (d as any)[f] = v;
    },
  }));
  const listeners: Record<string, Function[]> = {};
  return {
    data: { items: records },
    getRange: () => records,
    getCount: () => records.length,
    getAt: (i: number) => records[i],
    sort: vi.fn(),
    on: (evt: string, fn: Function) => {
      (listeners[evt] ??= []).push(fn);
    },
    fireEvent: (evt: string, ...args: unknown[]) => {
      (listeners[evt] ?? []).forEach((fn) => fn(...args));
    },
    each: (fn: Function) => records.forEach(fn),
    getTotalCount: () => records.length,
    isLoading: () => false,
  };
}

const SAMPLE_DATA = [
  { id: 1, name: 'Alice', dept: 'Eng', salary: 90000, active: true },
  { id: 2, name: 'Bob', dept: 'Eng', salary: 85000, active: true },
  { id: 3, name: 'Charlie', dept: 'Sales', salary: 70000, active: false },
  { id: 4, name: 'Diana', dept: 'Sales', salary: 75000, active: true },
  { id: 5, name: 'Eve', dept: 'HR', salary: 65000, active: true },
];

function testGrid(cfg: Record<string, unknown> = {}): Grid {
  return new Grid({
    renderTo: document.body,
    title: 'Test',
    store: cfg.store ?? mockStore(SAMPLE_DATA),
    columns: cfg.columns ?? [
      { text: 'Name', dataIndex: 'name', width: 120 },
      { text: 'Dept', dataIndex: 'dept', width: 80 },
      { text: 'Salary', dataIndex: 'salary', width: 100 },
    ],
    ...cfg,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Grouping
// ═══════════════════════════════════════════════════════════════════════════

describe('Grouping', () => {
  it('creates group header rows', () => {
    const g = testGrid();
    const grouping = new Grouping({ groupField: 'dept' });
    grouping.init(g);
    const headers = g.el!.querySelectorAll('.x-grid-group-hd');
    expect(headers.length).toBe(3); // Eng, Sales, HR
  });

  it('group header contains field value', () => {
    const g = testGrid();
    const grouping = new Grouping({ groupField: 'dept' });
    grouping.init(g);
    const headers = g.el!.querySelectorAll('.x-grid-group-hd');
    const texts = Array.from(headers).map((h) => h.textContent);
    expect(texts).toContain('Eng');
    expect(texts).toContain('Sales');
  });

  it('rows grouped under correct headers', () => {
    const g = testGrid();
    const grouping = new Grouping({ groupField: 'dept' });
    grouping.init(g);
    const allRows = g.el!.querySelectorAll('tbody tr');
    // 3 group headers + 5 data rows = 8
    expect(allRows.length).toBe(8);
  });

  it('collapse group hides its rows', () => {
    const g = testGrid();
    const grouping = new Grouping({ groupField: 'dept' });
    grouping.init(g);
    grouping.collapse('Eng');
    const engRows = g.el!.querySelectorAll('.x-grid-group[data-group="Eng"] .x-grid-row');
    for (const row of engRows) {
      expect((row as HTMLElement).style.display).toBe('none');
    }
  });

  it('expand group shows its rows', () => {
    const g = testGrid();
    const grouping = new Grouping({ groupField: 'dept', startCollapsed: true });
    grouping.init(g);
    grouping.expand('Sales');
    const salesRows = g.el!.querySelectorAll('.x-grid-group[data-group="Sales"] .x-grid-row');
    for (const row of salesRows) {
      expect((row as HTMLElement).style.display).not.toBe('none');
    }
  });

  it('fires groupcollapse event', () => {
    const spy = vi.fn();
    const g = testGrid({ listeners: { groupcollapse: spy } });
    const grouping = new Grouping({ groupField: 'dept' });
    grouping.init(g);
    grouping.collapse('Eng');
    expect(spy).toHaveBeenCalled();
  });

  it('fires groupexpand event', () => {
    const spy = vi.fn();
    const g = testGrid({ listeners: { groupexpand: spy } });
    const grouping = new Grouping({ groupField: 'dept', startCollapsed: true });
    grouping.init(g);
    grouping.expand('HR');
    expect(spy).toHaveBeenCalled();
  });

  it('clicking group header toggles collapse', () => {
    const g = testGrid();
    const grouping = new Grouping({ groupField: 'dept' });
    grouping.init(g);
    const hd = g.el!.querySelector('.x-grid-group-hd') as HTMLElement;
    hd.click(); // collapse
    expect(grouping.isCollapsed('Eng')).toBe(true);
    hd.click(); // expand
    expect(grouping.isCollapsed('Eng')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════

describe('Summary', () => {
  it('renders a summary row', () => {
    const g = testGrid();
    const summary = new Summary({
      summaryTypes: { salary: 'sum' },
    });
    summary.init(g);
    const sumRow = g.el!.querySelector('.x-grid-summary-row');
    expect(sumRow).not.toBeNull();
  });

  it('sum calculates total', () => {
    const g = testGrid();
    const summary = new Summary({
      summaryTypes: { salary: 'sum' },
    });
    summary.init(g);
    const sumRow = g.el!.querySelector('.x-grid-summary-row');
    expect(sumRow!.textContent).toContain('385000');
  });

  it('count returns record count', () => {
    const g = testGrid();
    const summary = new Summary({
      summaryTypes: { name: 'count' },
    });
    summary.init(g);
    const sumRow = g.el!.querySelector('.x-grid-summary-row');
    expect(sumRow!.textContent).toContain('5');
  });

  it('average calculates mean', () => {
    const g = testGrid();
    const summary = new Summary({
      summaryTypes: { salary: 'average' },
    });
    summary.init(g);
    const sumRow = g.el!.querySelector('.x-grid-summary-row');
    expect(sumRow!.textContent).toContain('77000');
  });

  it('min/max work', () => {
    const g = testGrid();
    const summary = new Summary({
      summaryTypes: { salary: 'min' },
    });
    summary.init(g);
    expect(g.el!.querySelector('.x-grid-summary-row')!.textContent).toContain('65000');
  });

  it('custom summary function', () => {
    const g = testGrid();
    const summary = new Summary({
      summaryTypes: { salary: (records: any[]) => records.length * 1000 },
    });
    summary.init(g);
    expect(g.el!.querySelector('.x-grid-summary-row')!.textContent).toContain('5000');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GroupingSummary
// ═══════════════════════════════════════════════════════════════════════════

describe('GroupingSummary', () => {
  it('renders group headers and per-group summary rows', () => {
    const g = testGrid();
    const gs = new GroupingSummary({
      groupField: 'dept',
      summaryTypes: { salary: 'sum' },
    });
    gs.init(g);
    const groupHeaders = g.el!.querySelectorAll('.x-grid-group-hd');
    const summaryRows = g.el!.querySelectorAll('.x-grid-group-summary');
    expect(groupHeaders.length).toBe(3);
    expect(summaryRows.length).toBe(3);
  });

  it('Eng group salary sum is 175000', () => {
    const g = testGrid();
    const gs = new GroupingSummary({
      groupField: 'dept',
      summaryTypes: { salary: 'sum' },
    });
    gs.init(g);
    const engGroup = g.el!.querySelector('.x-grid-group[data-group="Eng"]');
    const sumRow = engGroup!.querySelector('.x-grid-group-summary');
    expect(sumRow!.textContent).toContain('175000');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RowBody
// ═══════════════════════════════════════════════════════════════════════════

describe('RowBody', () => {
  it('adds expandable body row below each data row', () => {
    const g = testGrid();
    const rb = new RowBody({
      getAdditionalData: (_data: any, _idx: number, record: any) => ({
        rowBody: `Details for ${record.get('name')}`,
      }),
    });
    rb.init(g);
    const bodies = g.el!.querySelectorAll('.x-grid-rowbody');
    expect(bodies.length).toBe(5);
    expect(bodies[0].textContent).toContain('Details for Alice');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CellEditing
// ═══════════════════════════════════════════════════════════════════════════

describe('CellEditing', () => {
  function editableGrid(): Grid {
    return testGrid({
      columns: [
        { text: 'Name', dataIndex: 'name', width: 120, editor: true },
        { text: 'Salary', dataIndex: 'salary', width: 100, editor: true },
      ],
    });
  }

  it('double-click cell starts editing', () => {
    const g = editableGrid();
    const ce = new CellEditing();
    ce.init(g);
    const cell = g.el!.querySelector('tbody td') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(g.el!.querySelector('.x-grid-cell-editor')).not.toBeNull();
  });

  it('editor shows current cell value', () => {
    const g = editableGrid();
    const ce = new CellEditing();
    ce.init(g);
    const cell = g.el!.querySelector('tbody td') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    const input = g.el!.querySelector('.x-grid-cell-editor input') as HTMLInputElement;
    expect(input.value).toBe('Alice');
  });

  it('completeEdit saves the value', () => {
    const g = editableGrid();
    const ce = new CellEditing();
    ce.init(g);
    const cell = g.el!.querySelector('tbody td') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    const input = g.el!.querySelector('.x-grid-cell-editor input') as HTMLInputElement;
    input.value = 'Alicia';
    ce.completeEdit();
    const store = (g as any)._store;
    expect(store.getAt(0).get('name')).toBe('Alicia');
  });

  it('cancelEdit reverts to original', () => {
    const g = editableGrid();
    const ce = new CellEditing();
    ce.init(g);
    const cell = g.el!.querySelector('tbody td') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    const input = g.el!.querySelector('.x-grid-cell-editor input') as HTMLInputElement;
    input.value = 'Changed';
    ce.cancelEdit();
    expect(g.el!.querySelector('.x-grid-cell-editor')).toBeNull();
  });

  it('fires beforeedit event', () => {
    const spy = vi.fn();
    const g = editableGrid();
    g.on('beforeedit', spy);
    const ce = new CellEditing();
    ce.init(g);
    const cell = g.el!.querySelector('tbody td') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });

  it('fires edit event on complete', () => {
    const spy = vi.fn();
    const g = editableGrid();
    g.on('edit', spy);
    const ce = new CellEditing();
    ce.init(g);
    const cell = g.el!.querySelector('tbody td') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    ce.completeEdit();
    expect(spy).toHaveBeenCalled();
  });

  it('Escape key cancels edit', () => {
    const g = editableGrid();
    const ce = new CellEditing();
    ce.init(g);
    const cell = g.el!.querySelector('tbody td') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    const input = g.el!.querySelector('.x-grid-cell-editor input') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(g.el!.querySelector('.x-grid-cell-editor')).toBeNull();
  });

  it('Enter key completes edit', () => {
    const g = editableGrid();
    const ce = new CellEditing();
    ce.init(g);
    const cell = g.el!.querySelector('tbody td') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    const input = g.el!.querySelector('.x-grid-cell-editor input') as HTMLInputElement;
    input.value = 'New';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(g.el!.querySelector('.x-grid-cell-editor')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RowEditing
// ═══════════════════════════════════════════════════════════════════════════

describe('RowEditing', () => {
  function editableGrid(): Grid {
    return testGrid({
      columns: [
        { text: 'Name', dataIndex: 'name', editor: true },
        { text: 'Salary', dataIndex: 'salary', editor: true },
      ],
    });
  }

  it('startEdit shows editors for entire row', () => {
    const g = editableGrid();
    const re = new RowEditing();
    re.init(g);
    re.startEdit(0);
    const editors = g.el!.querySelectorAll('.x-grid-row-editor input');
    expect(editors.length).toBe(2);
  });

  it('update saves all fields', () => {
    const g = editableGrid();
    const re = new RowEditing();
    re.init(g);
    re.startEdit(0);
    const inputs = g.el!.querySelectorAll(
      '.x-grid-row-editor input',
    ) as NodeListOf<HTMLInputElement>;
    inputs[0].value = 'Updated';
    re.completeEdit();
    expect((g as any)._store.getAt(0).get('name')).toBe('Updated');
  });

  it('cancel reverts row', () => {
    const g = editableGrid();
    const re = new RowEditing();
    re.init(g);
    re.startEdit(0);
    re.cancelEdit();
    expect(g.el!.querySelector('.x-grid-row-editor')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RowExpander
// ═══════════════════════════════════════════════════════════════════════════

describe('RowExpander', () => {
  it('adds expander column', () => {
    const g = testGrid();
    const exp = new RowExpander({
      rowBodyTpl: (record: any) => `<div>Details: ${record.get('name')}</div>`,
    });
    exp.init(g);
    const expanders = g.el!.querySelectorAll('.x-grid-row-expander');
    expect(expanders.length).toBe(5);
  });

  it('clicking expander shows body content', () => {
    const g = testGrid();
    const exp = new RowExpander({
      rowBodyTpl: (record: any) => `Info: ${record.get('name')}`,
    });
    exp.init(g);
    const btn = g.el!.querySelector('.x-grid-row-expander') as HTMLElement;
    btn.click();
    const body = g.el!.querySelector('.x-grid-rowexpand-body');
    expect(body).not.toBeNull();
    expect(body!.textContent).toContain('Info: Alice');
  });

  it('clicking again collapses', () => {
    const g = testGrid();
    const exp = new RowExpander({
      rowBodyTpl: (record: any) => `Info: ${record.get('name')}`,
    });
    exp.init(g);
    const btn = g.el!.querySelector('.x-grid-row-expander') as HTMLElement;
    btn.click();
    btn.click();
    const body = g.el!.querySelector('.x-grid-rowexpand-body');
    expect(body).toBeNull();
  });

  it('singleExpand collapses others when expanding', () => {
    const g = testGrid();
    const exp = new RowExpander({
      rowBodyTpl: (record: any) => record.get('name'),
      singleExpand: true,
    });
    exp.init(g);
    const btns = g.el!.querySelectorAll('.x-grid-row-expander') as NodeListOf<HTMLElement>;
    btns[0].click();
    btns[1].click();
    const bodies = g.el!.querySelectorAll('.x-grid-rowexpand-body');
    expect(bodies.length).toBe(1);
    expect(bodies[0].textContent).toContain('Bob');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Clipboard
// ═══════════════════════════════════════════════════════════════════════════

describe('GridClipboard', () => {
  it('getGridText returns TSV representation', () => {
    const g = testGrid();
    const clip = new GridClipboard();
    clip.init(g);
    const text = clip.getGridText();
    expect(text).toContain('Alice');
    expect(text).toContain('\t'); // tab separated
    expect(text).toContain('\n'); // newline between rows
  });

  it('fires copy event', () => {
    const spy = vi.fn();
    const g = testGrid({ listeners: { copy: spy } });
    const clip = new GridClipboard();
    clip.init(g);
    clip.doCopy();
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DragDrop
// ═══════════════════════════════════════════════════════════════════════════

describe('GridDragDrop', () => {
  it('adds draggable attribute to rows', () => {
    const g = testGrid();
    const dd = new GridDragDrop();
    dd.init(g);
    const rows = g.el!.querySelectorAll('tbody tr.x-grid-row');
    for (const row of rows) {
      expect(row.getAttribute('draggable')).toBe('true');
    }
  });

  it('moveRow reorders records', () => {
    const g = testGrid();
    const dd = new GridDragDrop();
    dd.init(g);
    dd.moveRow(0, 2); // Move Alice from 0 to 2
    const store = (g as any)._store;
    expect(store.getAt(0).get('name')).toBe('Bob');
  });

  it('fires drop event', () => {
    const spy = vi.fn();
    const g = testGrid({ listeners: { drop: spy } });
    const dd = new GridDragDrop();
    dd.init(g);
    dd.moveRow(0, 1);
    expect(spy).toHaveBeenCalled();
  });
});
