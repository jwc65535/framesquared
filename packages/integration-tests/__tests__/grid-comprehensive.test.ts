import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  Grid,
  RowSelectionModel,
  CellSelectionModel,
  TreePanel,
  TreeStore,
} from '@framesquared/grid';
import { Model, Store } from '@framesquared/data';

class Employee extends Model {
  static override fields = [
    { name: 'id', type: 'int' as const },
    { name: 'name', type: 'string' as const },
    { name: 'dept', type: 'string' as const },
    { name: 'salary', type: 'int' as const },
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

function employeeStore() {
  return new Store({
    model: Employee,
    data: [
      { id: 1, name: 'Alice', dept: 'Engineering', salary: 95000 },
      { id: 2, name: 'Bob', dept: 'Sales', salary: 72000 },
      { id: 3, name: 'Charlie', dept: 'Engineering', salary: 88000 },
      { id: 4, name: 'Diana', dept: 'HR', salary: 68000 },
      { id: 5, name: 'Eve', dept: 'Sales', salary: 76000 },
    ],
  });
}

function createGrid(store: Store, extra: Record<string, unknown> = {}) {
  return new Grid({
    renderTo: document.body,
    title: 'Employees',
    store,
    columns: [
      { text: 'Name', dataIndex: 'name', width: 120, sortable: true },
      { text: 'Dept', dataIndex: 'dept', width: 80, sortable: true },
      { text: 'Salary', dataIndex: 'salary', width: 100, sortable: true },
    ],
    ...extra,
  });
}

describe('Grid + real Store integration', () => {
  it('renders store data as table rows', () => {
    const store = employeeStore();
    const grid = createGrid(store);
    const rows = grid.el!.querySelectorAll('tbody tr');
    expect(rows.length).toBe(5);
    expect(rows[0].textContent).toContain('Alice');
  });

  it('column header click sorts real store and refreshes', () => {
    const store = employeeStore();
    const grid = createGrid(store);
    const th = grid.el!.querySelector('th') as HTMLElement;
    th.click(); // sort by Name ASC
    const rows = grid.el!.querySelectorAll('tbody tr');
    const names = Array.from(rows).map((r) => r.querySelector('td')!.textContent);
    expect(names).toEqual(['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']);
  });

  it('RowSelectionModel: click selects real Model, getSelection works', () => {
    const store = employeeStore();
    const grid = createGrid(store);
    const sm = new RowSelectionModel({ mode: 'MULTI' });
    sm.init(grid);

    const row = grid.el!.querySelector('tbody tr') as HTMLElement;
    row.click();
    expect(sm.getCount()).toBe(1);
    expect(sm.getSelection()[0].get('name')).toBe('Alice');
    expect(sm.getSelection()[0].getId()).toBe(1);
  });

  it('CellSelectionModel navigates with keyboard', () => {
    const store = employeeStore();
    const grid = createGrid(store);
    const sm = new CellSelectionModel();
    sm.init(grid);

    (grid.el!.querySelector('tbody td') as HTMLElement).click();
    expect(sm.getCurrentPosition()).toEqual({ row: 0, column: 0 });
    grid.el!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(sm.getCurrentPosition()!.column).toBe(1);
    grid.el!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(sm.getCurrentPosition()!.row).toBe(1);
  });

  it('store add/remove updates grid rows', () => {
    const store = employeeStore();
    const grid = createGrid(store);
    expect(grid.el!.querySelectorAll('tbody tr').length).toBe(5);

    store.add(Employee.create({ id: 6, name: 'Frank', dept: 'Finance', salary: 80000 }));
    expect(grid.el!.querySelectorAll('tbody tr').length).toBe(6);

    store.remove(store.getAt(0)!);
    expect(grid.el!.querySelectorAll('tbody tr').length).toBe(5);
  });

  it('store filter/clearFilter updates grid', () => {
    const store = employeeStore();
    const grid = createGrid(store);
    store.filter('dept', 'Engineering');
    expect(grid.el!.querySelectorAll('tbody tr').length).toBe(2);
    store.clearFilter();
    expect(grid.el!.querySelectorAll('tbody tr').length).toBe(5);
  });

  it('hide/show column', () => {
    const store = employeeStore();
    const grid = createGrid(store);
    grid.hideColumn(1);
    const th = grid.el!.querySelectorAll('th')[1] as HTMLElement;
    expect(th.style.display).toBe('none');
    grid.showColumn(1);
    expect(th.style.display).toBe('');
  });

  it('Grid has ARIA attributes from Panel', () => {
    const store = employeeStore();
    const grid = createGrid(store);
    expect(grid.el!.getAttribute('role')).toBe('region');
    expect(grid.el!.getAttribute('aria-label')).toBe('Employees');
  });
});

describe('TreePanel integration', () => {
  it('renders and expand/collapse works', () => {
    const store = new TreeStore({
      root: {
        text: 'Root',
        expanded: true,
        children: [
          {
            id: 'a',
            text: 'Folder A',
            children: [
              { id: 'a1', text: 'File 1', leaf: true },
              { id: 'a2', text: 'File 2', leaf: true },
            ],
          },
          { id: 'b', text: 'Folder B', leaf: true },
        ],
      },
    });

    const tree = new TreePanel({ renderTo: document.body, title: 'Files', store });
    expect(tree.el!.querySelectorAll('.x-tree-node').length).toBe(3);

    const expander = Array.from(tree.el!.querySelectorAll('.x-tree-node'))
      .find((n) => n.textContent?.includes('Folder A'))
      ?.querySelector('.x-tree-expander') as HTMLElement;
    expander.click();
    expect(tree.el!.querySelectorAll('.x-tree-node').length).toBe(5);
    expander.click();
    expect(tree.el!.querySelectorAll('.x-tree-node').length).toBe(3);
  });

  it('expandAll/collapseAll', () => {
    const store = new TreeStore({
      root: {
        text: 'Root',
        expanded: true,
        children: [
          { id: 'a', text: 'A', children: [{ id: 'a1', text: 'A1', leaf: true }] },
          { id: 'b', text: 'B', children: [{ id: 'b1', text: 'B1', leaf: true }] },
        ],
      },
    });
    const tree = new TreePanel({ renderTo: document.body, title: 'Tree', store });
    tree.expandAll();
    expect(tree.el!.querySelectorAll('.x-tree-node').length).toBe(5);
    tree.collapseAll();
    expect(tree.el!.querySelectorAll('.x-tree-node').length).toBe(1);
  });
});
