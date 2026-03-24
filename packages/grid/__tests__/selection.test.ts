import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Grid } from '../src/grid/Grid.js';
import { RowSelectionModel } from '../src/grid/selection/RowSelectionModel.js';
import { CellSelectionModel } from '../src/grid/selection/CellSelectionModel.js';
import { SpreadsheetSelectionModel } from '../src/grid/selection/SpreadsheetSelectionModel.js';
import { Lockable } from '../src/grid/Lockable.js';
import { GridState } from '../src/grid/state/GridState.js';

class MockRO { constructor() {} observe() {} unobserve() {} disconnect() {} }
beforeEach(() => { (globalThis as any).ResizeObserver = MockRO; });
afterEach(() => { document.body.innerHTML = ''; localStorage.clear(); });

function mockStore(data: Record<string, unknown>[] = []) {
  const dataCopy = data.map(d => ({ ...d }));
  const records = dataCopy.map((d, i) => ({
    id: d.id ?? i, data: d,
    get(f: string) { return (d as any)[f]; },
    set(f: string, v: unknown) { (d as any)[f] = v; },
  }));
  const listeners: Record<string, Function[]> = {};
  return {
    data: { items: records },
    getRange: () => records,
    getCount: () => records.length,
    getAt: (i: number) => records[i],
    sort: vi.fn(),
    on: (evt: string, fn: Function) => { (listeners[evt] ??= []).push(fn); },
    fireEvent: (evt: string, ...args: unknown[]) => { (listeners[evt] ?? []).forEach(fn => fn(...args)); },
    each: (fn: Function) => records.forEach(fn),
    getTotalCount: () => records.length,
    isLoading: () => false,
  };
}

const DATA = [
  { id: 1, name: 'Alice', dept: 'Eng', salary: 90000 },
  { id: 2, name: 'Bob', dept: 'Eng', salary: 85000 },
  { id: 3, name: 'Charlie', dept: 'Sales', salary: 70000 },
  { id: 4, name: 'Diana', dept: 'Sales', salary: 75000 },
  { id: 5, name: 'Eve', dept: 'HR', salary: 65000 },
];

function testGrid(cfg: Record<string, unknown> = {}): Grid {
  return new Grid({
    renderTo: document.body,
    title: 'Test',
    store: cfg.store ?? mockStore(DATA),
    columns: cfg.columns ?? [
      { text: 'Name', dataIndex: 'name', width: 120 },
      { text: 'Dept', dataIndex: 'dept', width: 80 },
      { text: 'Salary', dataIndex: 'salary', width: 100 },
    ],
    ...cfg,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// RowSelectionModel — SINGLE
// ═══════════════════════════════════════════════════════════════════════════

describe('RowSelectionModel — SINGLE', () => {
  it('select adds to selection', () => {
    const g = testGrid();
    const sm = new RowSelectionModel({ mode: 'SINGLE' });
    sm.init(g);
    const store = (g as any)._store;
    sm.select(store.getAt(0));
    expect(sm.getCount()).toBe(1);
    expect(sm.isSelected(store.getAt(0))).toBe(true);
  });

  it('selecting another deselects previous', () => {
    const g = testGrid();
    const sm = new RowSelectionModel({ mode: 'SINGLE' });
    sm.init(g);
    const store = (g as any)._store;
    sm.select(store.getAt(0));
    sm.select(store.getAt(1));
    expect(sm.getCount()).toBe(1);
    expect(sm.isSelected(store.getAt(0))).toBe(false);
    expect(sm.isSelected(store.getAt(1))).toBe(true);
  });

  it('deselect removes from selection', () => {
    const g = testGrid();
    const sm = new RowSelectionModel({ mode: 'SINGLE' });
    sm.init(g);
    const store = (g as any)._store;
    sm.select(store.getAt(0));
    sm.deselect(store.getAt(0));
    expect(sm.getCount()).toBe(0);
  });

  it('getSelection returns selected records', () => {
    const g = testGrid();
    const sm = new RowSelectionModel({ mode: 'SINGLE' });
    sm.init(g);
    const store = (g as any)._store;
    sm.select(store.getAt(2));
    const sel = sm.getSelection();
    expect(sel).toHaveLength(1);
    expect(sel[0].get('name')).toBe('Charlie');
  });

  it('fires selectionchange event', () => {
    const spy = vi.fn();
    const g = testGrid();
    const sm = new RowSelectionModel({ mode: 'SINGLE' });
    sm.on('selectionchange', spy);
    sm.init(g);
    sm.select((g as any)._store.getAt(0));
    expect(spy).toHaveBeenCalled();
  });

  it('fires select event', () => {
    const spy = vi.fn();
    const g = testGrid();
    const sm = new RowSelectionModel({ mode: 'SINGLE' });
    sm.on('select', spy);
    sm.init(g);
    sm.select((g as any)._store.getAt(0));
    expect(spy).toHaveBeenCalled();
  });

  it('fires deselect event', () => {
    const spy = vi.fn();
    const g = testGrid();
    const sm = new RowSelectionModel({ mode: 'SINGLE' });
    sm.on('deselect', spy);
    sm.init(g);
    const rec = (g as any)._store.getAt(0);
    sm.select(rec);
    sm.deselect(rec);
    expect(spy).toHaveBeenCalled();
  });

  it('clicking a row selects it', () => {
    const g = testGrid();
    const sm = new RowSelectionModel({ mode: 'SINGLE' });
    sm.init(g);
    const row = g.el!.querySelector('tbody tr') as HTMLElement;
    row.click();
    expect(sm.getCount()).toBe(1);
  });

  it('selected row gets x-grid-row-selected class', () => {
    const g = testGrid();
    const sm = new RowSelectionModel({ mode: 'SINGLE' });
    sm.init(g);
    const row = g.el!.querySelector('tbody tr') as HTMLElement;
    row.click();
    expect(row.classList.contains('x-grid-row-selected')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RowSelectionModel — MULTI
// ═══════════════════════════════════════════════════════════════════════════

describe('RowSelectionModel — MULTI', () => {
  it('Ctrl+click toggles selection', () => {
    const g = testGrid();
    const sm = new RowSelectionModel({ mode: 'MULTI' });
    sm.init(g);
    const store = (g as any)._store;
    sm.select(store.getAt(0));
    sm.select(store.getAt(2), true); // keepExisting
    expect(sm.getCount()).toBe(2);
    sm.select(store.getAt(0), true); // toggle off
    expect(sm.getCount()).toBe(1);
  });

  it('selectRange selects range of records', () => {
    const g = testGrid();
    const sm = new RowSelectionModel({ mode: 'MULTI' });
    sm.init(g);
    const store = (g as any)._store;
    sm.selectRange(store.getAt(1), store.getAt(3));
    expect(sm.getCount()).toBe(3); // Bob, Charlie, Diana
  });

  it('selectAll selects everything', () => {
    const g = testGrid();
    const sm = new RowSelectionModel({ mode: 'MULTI' });
    sm.init(g);
    sm.selectAll();
    expect(sm.getCount()).toBe(5);
  });

  it('deselectAll clears everything', () => {
    const g = testGrid();
    const sm = new RowSelectionModel({ mode: 'MULTI' });
    sm.init(g);
    sm.selectAll();
    sm.deselectAll();
    expect(sm.getCount()).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RowSelectionModel — SIMPLE
// ═══════════════════════════════════════════════════════════════════════════

describe('RowSelectionModel — SIMPLE', () => {
  it('click toggles without modifier keys', () => {
    const g = testGrid();
    const sm = new RowSelectionModel({ mode: 'SIMPLE' });
    sm.init(g);
    const store = (g as any)._store;
    sm.select(store.getAt(0));
    sm.select(store.getAt(1));
    // In SIMPLE mode, both should be selected (toggle behavior)
    expect(sm.getCount()).toBe(2);
    sm.select(store.getAt(0)); // toggle off
    expect(sm.getCount()).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RowSelectionModel — checkbox
// ═══════════════════════════════════════════════════════════════════════════

describe('RowSelectionModel — checkboxSelect', () => {
  it('adds checkbox column', () => {
    const g = testGrid();
    const sm = new RowSelectionModel({ mode: 'MULTI', checkboxSelect: true });
    sm.init(g);
    const checkboxes = g.el!.querySelectorAll('.x-grid-row-checker');
    expect(checkboxes.length).toBe(5);
  });

  it('clicking checkbox selects row', () => {
    const g = testGrid();
    const sm = new RowSelectionModel({ mode: 'MULTI', checkboxSelect: true });
    sm.init(g);
    const cb = g.el!.querySelector('.x-grid-row-checker') as HTMLElement;
    cb.click();
    expect(sm.getCount()).toBe(1);
  });

  it('header checkbox selects all', () => {
    const g = testGrid();
    const sm = new RowSelectionModel({ mode: 'MULTI', checkboxSelect: true });
    sm.init(g);
    const headerCb = g.el!.querySelector('.x-grid-header-checker') as HTMLElement;
    headerCb?.click();
    expect(sm.getCount()).toBe(5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CellSelectionModel
// ═══════════════════════════════════════════════════════════════════════════

describe('CellSelectionModel', () => {
  it('clicking a cell selects it', () => {
    const g = testGrid();
    const sm = new CellSelectionModel();
    sm.init(g);
    const cell = g.el!.querySelector('tbody td') as HTMLElement;
    cell.click();
    const pos = sm.getCurrentPosition();
    expect(pos).not.toBeNull();
    expect(pos!.row).toBe(0);
    expect(pos!.column).toBe(0);
  });

  it('selected cell gets x-grid-cell-selected class', () => {
    const g = testGrid();
    const sm = new CellSelectionModel();
    sm.init(g);
    const cell = g.el!.querySelector('tbody td') as HTMLElement;
    cell.click();
    expect(cell.classList.contains('x-grid-cell-selected')).toBe(true);
  });

  it('arrow keys navigate', () => {
    const g = testGrid();
    const sm = new CellSelectionModel();
    sm.init(g);
    // Select first cell
    const cell = g.el!.querySelector('tbody td') as HTMLElement;
    cell.click();
    // ArrowRight
    g.el!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(sm.getCurrentPosition()!.column).toBe(1);
    // ArrowDown
    g.el!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(sm.getCurrentPosition()!.row).toBe(1);
    // ArrowLeft
    g.el!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(sm.getCurrentPosition()!.column).toBe(0);
    // ArrowUp
    g.el!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(sm.getCurrentPosition()!.row).toBe(0);
  });

  it('Tab moves to next cell', () => {
    const g = testGrid();
    const sm = new CellSelectionModel();
    sm.init(g);
    const cell = g.el!.querySelector('tbody td') as HTMLElement;
    cell.click();
    g.el!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(sm.getCurrentPosition()!.column).toBe(1);
  });

  it('fires selectionchange', () => {
    const spy = vi.fn();
    const g = testGrid();
    const sm = new CellSelectionModel();
    sm.on('selectionchange', spy);
    sm.init(g);
    const cell = g.el!.querySelector('tbody td') as HTMLElement;
    cell.click();
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SpreadsheetSelectionModel
// ═══════════════════════════════════════════════════════════════════════════

describe('SpreadsheetSelectionModel', () => {
  it('click selects a single cell', () => {
    const g = testGrid();
    const sm = new SpreadsheetSelectionModel();
    sm.init(g);
    const cell = g.el!.querySelector('tbody td') as HTMLElement;
    cell.click();
    expect(sm.getSelectedRange()).not.toBeNull();
    expect(sm.getSelectedRange()!.startRow).toBe(0);
    expect(sm.getSelectedRange()!.startCol).toBe(0);
  });

  it('Shift+click extends selection range', () => {
    const g = testGrid();
    const sm = new SpreadsheetSelectionModel();
    sm.init(g);
    // Click first cell
    const cells = g.el!.querySelectorAll('tbody td');
    (cells[0] as HTMLElement).click();
    // Shift+click cell at row 2, col 1
    const targetCell = g.el!.querySelectorAll('tbody tr')[2]?.querySelectorAll('td')[1] as HTMLElement;
    targetCell?.dispatchEvent(new MouseEvent('click', { shiftKey: true, bubbles: true }));

    const range = sm.getSelectedRange();
    expect(range).not.toBeNull();
    expect(range!.endRow).toBe(2);
    expect(range!.endCol).toBe(1);
  });

  it('selected cells get x-grid-cell-selected class', () => {
    const g = testGrid();
    const sm = new SpreadsheetSelectionModel();
    sm.init(g);
    const cell = g.el!.querySelector('tbody td') as HTMLElement;
    cell.click();
    expect(cell.classList.contains('x-grid-cell-selected')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Lockable
// ═══════════════════════════════════════════════════════════════════════════

describe('Lockable', () => {
  it('creates locked and normal panels', () => {
    const g = testGrid({
      columns: [
        { text: 'Name', dataIndex: 'name', width: 120, locked: true },
        { text: 'Dept', dataIndex: 'dept', width: 80 },
        { text: 'Salary', dataIndex: 'salary', width: 100 },
      ],
    });
    const lockable = new Lockable();
    lockable.init(g);
    const lockedPanel = g.el!.querySelector('.x-grid-locked');
    const normalPanel = g.el!.querySelector('.x-grid-normal');
    expect(lockedPanel).not.toBeNull();
    expect(normalPanel).not.toBeNull();
  });

  it('locked columns appear in locked panel', () => {
    const g = testGrid({
      columns: [
        { text: 'Name', dataIndex: 'name', width: 120, locked: true },
        { text: 'Dept', dataIndex: 'dept', width: 80 },
        { text: 'Salary', dataIndex: 'salary', width: 100 },
      ],
    });
    const lockable = new Lockable();
    lockable.init(g);
    const lockedHeaders = g.el!.querySelectorAll('.x-grid-locked th');
    expect(lockedHeaders.length).toBe(1);
    expect(lockedHeaders[0].textContent).toContain('Name');
  });

  it('normal columns appear in normal panel', () => {
    const g = testGrid({
      columns: [
        { text: 'Name', dataIndex: 'name', width: 120, locked: true },
        { text: 'Dept', dataIndex: 'dept', width: 80 },
        { text: 'Salary', dataIndex: 'salary', width: 100 },
      ],
    });
    const lockable = new Lockable();
    lockable.init(g);
    const normalHeaders = g.el!.querySelectorAll('.x-grid-normal th');
    expect(normalHeaders.length).toBe(2);
  });

  it('locked panel does not scroll horizontally', () => {
    const g = testGrid({
      columns: [
        { text: 'Name', dataIndex: 'name', locked: true },
        { text: 'Dept', dataIndex: 'dept' },
      ],
    });
    const lockable = new Lockable();
    lockable.init(g);
    const lockedPanel = g.el!.querySelector('.x-grid-locked') as HTMLElement;
    expect(lockedPanel.style.overflowX).toBe('hidden');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GridState
// ═══════════════════════════════════════════════════════════════════════════

describe('GridState', () => {
  it('save stores column state to localStorage', () => {
    const g = testGrid();
    const state = new GridState({ stateId: 'test-grid' });
    state.init(g);
    state.save();
    const saved = localStorage.getItem('ext-grid-state-test-grid');
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(parsed.columns).toHaveLength(3);
  });

  it('restore applies saved column state', () => {
    // Pre-save a state
    localStorage.setItem('ext-grid-state-myGrid', JSON.stringify({
      columns: [
        { dataIndex: 'name', width: 200, hidden: false },
        { dataIndex: 'dept', width: 100, hidden: true },
        { dataIndex: 'salary', width: 150, hidden: false },
      ],
    }));

    const g = testGrid();
    const state = new GridState({ stateId: 'myGrid' });
    state.init(g);
    state.restore();

    // Check that column 1 (dept) is hidden
    const ths = g.el!.querySelectorAll('th');
    expect((ths[1] as HTMLElement).style.display).toBe('none');
  });

  it('save includes sort state', () => {
    const g = testGrid({ sortableColumns: true });
    const state = new GridState({ stateId: 'sort-grid' });
    state.init(g);
    // Simulate a sort
    const th = g.el!.querySelector('th') as HTMLElement;
    th.click();
    state.save();
    const saved = JSON.parse(localStorage.getItem('ext-grid-state-sort-grid')!);
    expect(saved.sort).toBeDefined();
  });

  it('clear removes state from localStorage', () => {
    const g = testGrid();
    const state = new GridState({ stateId: 'clear-grid' });
    state.init(g);
    state.save();
    expect(localStorage.getItem('ext-grid-state-clear-grid')).not.toBeNull();
    state.clear();
    expect(localStorage.getItem('ext-grid-state-clear-grid')).toBeNull();
  });
});
