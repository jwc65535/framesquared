import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Grid } from '../src/grid/Grid.js';
import { RowSelectionModel } from '../src/grid/selection/RowSelectionModel.js';
import { CellSelectionModel } from '../src/grid/selection/CellSelectionModel.js';
import { Model, Store } from '@framesquared/data';

class Person extends Model {
  static override fields = [
    { name: 'id', type: 'int' as const },
    { name: 'name', type: 'string' as const },
    { name: 'age', type: 'int' as const },
    { name: 'dept', type: 'string' as const },
  ];
}

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

function createStore() {
  return new Store({
    model: Person,
    data: [
      { id: 1, name: 'Alice', age: 30, dept: 'Engineering' },
      { id: 2, name: 'Bob', age: 25, dept: 'Sales' },
      { id: 3, name: 'Charlie', age: 35, dept: 'Engineering' },
      { id: 4, name: 'Diana', age: 28, dept: 'HR' },
      { id: 5, name: 'Eve', age: 22, dept: 'Sales' },
    ],
  });
}

function createGrid(store: Store, extraCfg: Record<string, unknown> = {}) {
  return new Grid({
    renderTo: document.body,
    title: 'People',
    store,
    columns: [
      { text: 'Name', dataIndex: 'name', flex: 1, sortable: true },
      { text: 'Age', dataIndex: 'age', width: 80, sortable: true },
      { text: 'Dept', dataIndex: 'dept', width: 120, sortable: true },
    ],
    ...extraCfg,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Rendering with real Store
// ═══════════════════════════════════════════════════════════════════════════

describe('Grid + real Store — rendering', () => {
  it('renders correct number of rows', () => {
    const store = createStore();
    const grid = createGrid(store);
    expect(grid.el!.querySelectorAll('tbody tr').length).toBe(5);
  });

  it('renders Model field values in cells', () => {
    const store = createStore();
    const grid = createGrid(store);
    const firstRow = grid.el!.querySelector('tbody tr')!;
    const cells = firstRow.querySelectorAll('td');
    expect(cells[0].textContent).toBe('Alice');
    expect(cells[1].textContent).toBe('30');
    expect(cells[2].textContent).toBe('Engineering');
  });

  it('renders all rows with correct data', () => {
    const store = createStore();
    const grid = createGrid(store);
    const rows = grid.el!.querySelectorAll('tbody tr');
    const names = Array.from(rows).map((r) => r.querySelector('td')!.textContent);
    expect(names).toEqual(['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']);
  });

  it('renders empty grid with emptyText', () => {
    const store = new Store({ model: Person, data: [] });
    const grid = createGrid(store, { emptyText: 'No records found' });
    expect(grid.el!.textContent).toContain('No records found');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Sorting with real Store
// ═══════════════════════════════════════════════════════════════════════════

describe('Grid + real Store — sorting', () => {
  it('clicking header sorts store and refreshes grid', () => {
    const store = createStore();
    const grid = createGrid(store);
    const nameHeader = grid.el!.querySelector('th') as HTMLElement;
    nameHeader.click(); // ASC
    const rows = grid.el!.querySelectorAll('tbody tr');
    const names = Array.from(rows).map((r) => r.querySelector('td')!.textContent);
    expect(names).toEqual(['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']);
  });

  it('clicking same header twice reverses sort', () => {
    const store = createStore();
    const grid = createGrid(store);
    const nameHeader = grid.el!.querySelector('th') as HTMLElement;
    nameHeader.click(); // ASC
    nameHeader.click(); // DESC
    const rows = grid.el!.querySelectorAll('tbody tr');
    const names = Array.from(rows).map((r) => r.querySelector('td')!.textContent);
    expect(names).toEqual(['Eve', 'Diana', 'Charlie', 'Bob', 'Alice']);
  });

  it('sorting by age column works', () => {
    const store = createStore();
    const grid = createGrid(store);
    const ageHeader = grid.el!.querySelectorAll('th')[1] as HTMLElement;
    ageHeader.click(); // ASC by age
    const rows = grid.el!.querySelectorAll('tbody tr');
    const ages = Array.from(rows).map((r) => r.querySelectorAll('td')[1].textContent);
    expect(ages).toEqual(['22', '25', '28', '30', '35']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Store mutations reflected in Grid
// ═══════════════════════════════════════════════════════════════════════════

describe('Grid + real Store — mutations', () => {
  it('adding a record refreshes the grid', () => {
    const store = createStore();
    const grid = createGrid(store);
    expect(grid.el!.querySelectorAll('tbody tr').length).toBe(5);
    store.add(Person.create({ id: 6, name: 'Frank', age: 40, dept: 'Finance' }));
    expect(grid.el!.querySelectorAll('tbody tr').length).toBe(6);
    const names = Array.from(grid.el!.querySelectorAll('tbody tr')).map(
      (r) => r.querySelector('td')!.textContent,
    );
    expect(names).toContain('Frank');
  });

  it('removing a record refreshes the grid', () => {
    const store = createStore();
    const grid = createGrid(store);
    const alice = store.getAt(0)!;
    store.remove(alice);
    expect(grid.el!.querySelectorAll('tbody tr').length).toBe(4);
    const names = Array.from(grid.el!.querySelectorAll('tbody tr')).map(
      (r) => r.querySelector('td')!.textContent,
    );
    expect(names).not.toContain('Alice');
  });

  it('removeAll shows emptyText', () => {
    const store = createStore();
    const grid = createGrid(store, { emptyText: 'Empty' });
    store.removeAll();
    expect(grid.el!.querySelectorAll('tbody tr.x-grid-row').length).toBe(0);
    expect(grid.el!.textContent).toContain('Empty');
  });

  it('filtering hides rows and clearFilter restores', () => {
    const store = createStore();
    const grid = createGrid(store);
    store.filter('dept', 'Engineering');
    expect(grid.el!.querySelectorAll('tbody tr').length).toBe(2);
    store.clearFilter();
    expect(grid.el!.querySelectorAll('tbody tr').length).toBe(5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RowSelectionModel with real Store
// ═══════════════════════════════════════════════════════════════════════════

describe('Grid + real Store + RowSelectionModel', () => {
  it('clicking a row selects the real Model record', () => {
    const store = createStore();
    const grid = createGrid(store);
    const sm = new RowSelectionModel({ mode: 'SINGLE' });
    sm.init(grid);
    const firstRow = grid.el!.querySelector('tbody tr') as HTMLElement;
    firstRow.click();
    expect(sm.getCount()).toBe(1);
    const selected = sm.getSelection()[0];
    expect(selected.get('name')).toBe('Alice');
    expect(selected.get('age')).toBe(30);
  });

  it('clicking different row in SINGLE mode deselects previous', () => {
    const store = createStore();
    const grid = createGrid(store);
    const sm = new RowSelectionModel({ mode: 'SINGLE' });
    sm.init(grid);
    const rows = grid.el!.querySelectorAll('tbody tr');
    (rows[0] as HTMLElement).click();
    expect(sm.getSelection()[0].get('name')).toBe('Alice');
    (rows[2] as HTMLElement).click();
    expect(sm.getCount()).toBe(1);
    expect(sm.getSelection()[0].get('name')).toBe('Charlie');
    expect(rows[0].classList.contains('x-grid-row-selected')).toBe(false);
    expect(rows[2].classList.contains('x-grid-row-selected')).toBe(true);
  });

  it('MULTI mode with Ctrl+click accumulates selection', () => {
    const store = createStore();
    const grid = createGrid(store);
    const sm = new RowSelectionModel({ mode: 'MULTI' });
    sm.init(grid);
    const rows = grid.el!.querySelectorAll('tbody tr');
    (rows[0] as HTMLElement).click();
    (rows[2] as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true, ctrlKey: true }),
    );
    expect(sm.getCount()).toBe(2);
    const names = sm.getSelection().map((r) => r.get('name'));
    expect(names).toContain('Alice');
    expect(names).toContain('Charlie');
  });

  it('selectionchange event fires with real Model records', () => {
    const store = createStore();
    const grid = createGrid(store);
    const sm = new RowSelectionModel({ mode: 'SINGLE' });
    const spy = vi.fn();
    sm.on('selectionchange', spy);
    sm.init(grid);
    (grid.el!.querySelector('tbody tr') as HTMLElement).click();
    expect(spy).toHaveBeenCalled();
    const selected = spy.mock.calls[0][1];
    expect(selected.length).toBe(1);
    expect(selected[0].get('name')).toBe('Alice');
  });

  it('selectAll selects all store records', () => {
    const store = createStore();
    const grid = createGrid(store);
    const sm = new RowSelectionModel({ mode: 'MULTI' });
    sm.init(grid);
    sm.selectAll();
    expect(sm.getCount()).toBe(5);
  });

  it('deselectAll clears selection', () => {
    const store = createStore();
    const grid = createGrid(store);
    const sm = new RowSelectionModel({ mode: 'MULTI' });
    sm.init(grid);
    sm.selectAll();
    sm.deselectAll();
    expect(sm.getCount()).toBe(0);
  });

  it('checkbox selection mode works with real Store', () => {
    const store = createStore();
    const grid = createGrid(store);
    const sm = new RowSelectionModel({ mode: 'MULTI', checkboxSelect: true });
    sm.init(grid);
    const checkers = grid.el!.querySelectorAll('.x-grid-row-checker');
    expect(checkers.length).toBe(5);
    (checkers[0] as HTMLInputElement).click();
    expect(sm.getCount()).toBe(1);
    expect(sm.getSelection()[0].get('name')).toBe('Alice');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CellSelectionModel with real Store
// ═══════════════════════════════════════════════════════════════════════════

describe('Grid + real Store + CellSelectionModel', () => {
  it('clicking a cell sets position', () => {
    const store = createStore();
    const grid = createGrid(store);
    const sm = new CellSelectionModel();
    sm.init(grid);
    (grid.el!.querySelector('tbody td') as HTMLElement).click();
    expect(sm.getCurrentPosition()).toEqual({ row: 0, column: 0 });
  });

  it('arrow keys navigate cells', () => {
    const store = createStore();
    const grid = createGrid(store);
    const sm = new CellSelectionModel();
    sm.init(grid);
    (grid.el!.querySelector('tbody td') as HTMLElement).click();
    grid.el!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(sm.getCurrentPosition()!.column).toBe(1);
    grid.el!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(sm.getCurrentPosition()!.row).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Item events with real data
// ═══════════════════════════════════════════════════════════════════════════

describe('Grid + real Store — item events', () => {
  it('itemclick provides the real Model record', () => {
    const store = createStore();
    const spy = vi.fn();
    const grid = createGrid(store, { listeners: { itemclick: spy } });
    (grid.el!.querySelector('tbody tr') as HTMLElement).click();
    expect(spy).toHaveBeenCalled();
    const record = spy.mock.calls[0][1];
    expect(record.get('name')).toBe('Alice');
    expect(record.getId()).toBe(1);
  });

  it('custom renderer receives real Model values', () => {
    const store = createStore();
    const renderer = vi.fn((v: unknown) => `$${v}`);
    const grid = new Grid({
      renderTo: document.body,
      title: 'G',
      store,
      columns: [
        { text: 'Name', dataIndex: 'name' },
        { text: 'Age', dataIndex: 'age', renderer },
      ],
    });
    expect(renderer).toHaveBeenCalledTimes(5);
    expect(renderer.mock.calls[0][0]).toBe(30);
    const cells = grid.el!.querySelectorAll('tbody tr:first-child td');
    expect(cells[1].textContent).toBe('$30');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// End-to-end flows
// ═══════════════════════════════════════════════════════════════════════════

describe('End-to-end: Store → Grid → Selection → Modify', () => {
  it('full flow: render, click row, read record, modify, sort', () => {
    const store = createStore();
    const grid = createGrid(store);
    const sm = new RowSelectionModel({ mode: 'SINGLE' });
    sm.init(grid);

    // Renders 5 rows
    expect(grid.el!.querySelectorAll('tbody tr').length).toBe(5);

    // Click Charlie (row 2)
    (grid.el!.querySelectorAll('tbody tr')[2] as HTMLElement).click();
    const selected = sm.getSelection()[0];
    expect(selected.get('name')).toBe('Charlie');
    expect(selected.get('age')).toBe(35);
    expect(selected.getId()).toBe(3);

    // Modify the record
    selected.set('age', 36);
    expect(selected.get('age')).toBe(36);

    // Sort — model reference survives
    (grid.el!.querySelectorAll('th')[1] as HTMLElement).click();
    expect(selected.get('age')).toBe(36);
    expect(selected.get('name')).toBe('Charlie');
  });

  it('full flow: add → sort → filter → select → verify', () => {
    const store = createStore();
    const grid = createGrid(store);
    const sm = new RowSelectionModel({ mode: 'MULTI' });
    sm.init(grid);

    // Add a record
    store.add(Person.create({ id: 6, name: 'Frank', age: 45, dept: 'Engineering' }));
    expect(grid.el!.querySelectorAll('tbody tr').length).toBe(6);

    // Sort by name ASC
    (grid.el!.querySelector('th') as HTMLElement).click();

    // Filter to Engineering only
    store.filter('dept', 'Engineering');
    const rows = grid.el!.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
    const filteredNames = Array.from(rows).map((r) => r.querySelector('td')!.textContent);
    expect(filteredNames).toEqual(['Alice', 'Charlie', 'Frank']);

    // Select all visible
    sm.selectAll();
    expect(sm.getCount()).toBe(3);
    expect(sm.getSelection().every((r) => r.get('dept') === 'Engineering')).toBe(true);

    // Clear filter
    store.clearFilter();
    expect(grid.el!.querySelectorAll('tbody tr').length).toBe(6);
  });
});
