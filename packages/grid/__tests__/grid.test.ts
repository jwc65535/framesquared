/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Grid } from '../src/grid/Grid.js';
import { Column, NumberColumn, DateColumn, BooleanColumn } from '../src/grid/column/Column.js';
import { GridView } from '../src/grid/GridView.js';
import { HeaderContainer } from '../src/grid/HeaderContainer.js';

class MockRO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = MockRO;
});
afterEach(() => {
  document.body.innerHTML = '';
});

// Minimal mock store
function mockStore(data: Record<string, unknown>[] = []) {
  const records = data.map((d, i) => ({
    id: d.id ?? i,
    data: d,
    get(f: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (d as any)[f];
    },
    set(f: string, v: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (d as any)[f] = v;
    },
  }));
  const listeners: Record<string, ((...args: unknown[]) => unknown)[]> = {};
  return {
    data: { items: records },
    getRange: () => records,
    getCount: () => records.length,
    getAt: (i: number) => records[i],
    findRecord: (f: string, v: unknown) => records.find((r) => r.get(f) === v),
    sort: vi.fn(),
    on: (evt: string, fn: (...args: unknown[]) => unknown) => {
      (listeners[evt] ??= []).push(fn);
    },
    fireEvent: (evt: string, ...args: unknown[]) => {
      (listeners[evt] ?? []).forEach((fn) => fn(...args));
    },
    each: (fn: (...args: unknown[]) => unknown) => records.forEach(fn),
    getTotalCount: () => records.length,
    isLoading: () => false,
  };
}

function grid(cfg: Record<string, unknown> = {}): Grid {
  const store =
    cfg.store ??
    mockStore([
      { id: 1, name: 'Alice', age: 30, active: true, joined: '2020-01-15' },
      { id: 2, name: 'Bob', age: 25, active: false, joined: '2021-06-20' },
      { id: 3, name: 'Charlie', age: 35, active: true, joined: '2019-03-10' },
    ]);
  return new Grid({
    renderTo: document.body,
    title: 'Test Grid',
    store,
    columns: cfg.columns ?? [
      { text: 'Name', dataIndex: 'name', width: 150 },
      { text: 'Age', dataIndex: 'age', width: 80 },
      { text: 'Active', dataIndex: 'active', width: 80 },
    ],
    ...cfg,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Grid — rendering
// ═══════════════════════════════════════════════════════════════════════════

describe('Grid — rendering', () => {
  it('renders with x-grid class', () => {
    const g = grid();
    expect(g.el!.classList.contains('x-grid')).toBe(true);
  });

  it('renders a table element', () => {
    const g = grid();
    expect(g.el!.querySelector('table')).not.toBeNull();
  });

  it('renders column headers', () => {
    const g = grid();
    const ths = g.el!.querySelectorAll('th');
    expect(ths.length).toBe(3);
    expect(ths[0].textContent).toContain('Name');
    expect(ths[1].textContent).toContain('Age');
  });

  it('renders data rows', () => {
    const g = grid();
    const rows = g.el!.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
  });

  it('renders cell values from store', () => {
    const g = grid();
    const cells = g.el!.querySelectorAll('tbody tr:first-child td');
    expect(cells[0].textContent).toBe('Alice');
    expect(cells[1].textContent).toBe('30');
  });

  it('column widths applied', () => {
    const g = grid();
    const ths = g.el!.querySelectorAll('th');
    expect((ths[0] as HTMLElement).style.width).toBe('150px');
    expect((ths[1] as HTMLElement).style.width).toBe('80px');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Grid — empty text
// ═══════════════════════════════════════════════════════════════════════════

describe('Grid — empty', () => {
  it('shows emptyText when store is empty', () => {
    const g = grid({ store: mockStore([]), emptyText: 'No data' });
    expect(g.el!.textContent).toContain('No data');
  });

  it('no emptyText element when store has data', () => {
    const g = grid({ emptyText: 'No data' });
    const empty = g.el!.querySelector('.x-grid-empty');
    expect(empty).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Grid — column renderer
// ═══════════════════════════════════════════════════════════════════════════

describe('Grid — renderer', () => {
  it('custom renderer called with (value, metaData, record, rowIndex, colIndex)', () => {
    const renderer = vi.fn((_v: unknown) => 'custom');
    const g = grid({
      columns: [{ text: 'Name', dataIndex: 'name', renderer }],
    });
    expect(renderer).toHaveBeenCalled();
    const args = renderer.mock.calls[0];
    expect(args[0]).toBe('Alice'); // value
    expect(args[3]).toBe(0); // rowIndex
    expect(args[4]).toBe(0); // colIndex

    const cells = g.el!.querySelectorAll('tbody td');
    expect(cells[0].textContent).toBe('custom');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Grid — sorting
// ═══════════════════════════════════════════════════════════════════════════

describe('Grid — sorting', () => {
  it('clicking header calls store.sort', () => {
    const g = grid({ sortableColumns: true });
    const th = g.el!.querySelector('th') as HTMLElement;
    th.click();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store = (g as any)._store;
    expect(store.sort).toHaveBeenCalled();
  });

  it('header gets sort indicator class', () => {
    const g = grid({ sortableColumns: true });
    const th = g.el!.querySelector('th') as HTMLElement;
    th.click();
    expect(
      th.classList.contains('x-column-header-sort-ASC') ||
        th.classList.contains('x-column-header-sort-DESC'),
    ).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Grid — column hide/show
// ═══════════════════════════════════════════════════════════════════════════

describe('Grid — column visibility', () => {
  it('hidden column is not rendered', () => {
    const g = grid({
      columns: [
        { text: 'Name', dataIndex: 'name' },
        { text: 'Age', dataIndex: 'age', hidden: true },
      ],
    });
    const ths = g.el!.querySelectorAll('th:not([style*="display: none"])');
    expect(ths.length).toBe(1);
  });

  it('hideColumn/showColumn toggle visibility', () => {
    const g = grid();
    g.hideColumn(1); // hide Age
    let ths = g.el!.querySelectorAll('th');
    expect((ths[1] as HTMLElement).style.display).toBe('none');

    g.showColumn(1);
    ths = g.el!.querySelectorAll('th');
    expect((ths[1] as HTMLElement).style.display).not.toBe('none');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Grid — store events
// ═══════════════════════════════════════════════════════════════════════════

describe('Grid — store binding', () => {
  it('store datachanged triggers refresh', () => {
    const store = mockStore([{ id: 1, name: 'A', age: 1, active: true }]);
    const g = grid({ store });
    expect(g.el!.querySelectorAll('tbody tr').length).toBe(1);

    // Simulate adding a record and firing datachanged
    store.data.items.push({
      id: 2,
      data: { id: 2, name: 'B', age: 2, active: false },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      get: (f: string) => (({ id: 2, name: 'B', age: 2, active: false }) as any)[f],
      set: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    store.fireEvent('datachanged');

    expect(g.el!.querySelectorAll('tbody tr').length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Grid — item events
// ═══════════════════════════════════════════════════════════════════════════

describe('Grid — item events', () => {
  it('fires itemclick on row click', () => {
    const spy = vi.fn();
    const g = grid({ listeners: { itemclick: spy } });
    const row = g.el!.querySelector('tbody tr') as HTMLElement;
    row.click();
    expect(spy).toHaveBeenCalled();
  });

  it('fires itemdblclick on row double-click', () => {
    const spy = vi.fn();
    const g = grid({ listeners: { itemdblclick: spy } });
    const row = g.el!.querySelector('tbody tr') as HTMLElement;
    row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Grid — row striping
// ═══════════════════════════════════════════════════════════════════════════

describe('Grid — row striping', () => {
  it('alternating rows have stripe classes', () => {
    const g = grid();
    const rows = g.el!.querySelectorAll('tbody tr');
    expect(rows[0].classList.contains('x-grid-row-alt')).toBe(false);
    expect(rows[1].classList.contains('x-grid-row-alt')).toBe(true);
    expect(rows[2].classList.contains('x-grid-row-alt')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// NumberColumn
// ═══════════════════════════════════════════════════════════════════════════

describe('NumberColumn', () => {
  it('formats numbers with fixed decimals', () => {
    const col = new NumberColumn({ text: 'Price', dataIndex: 'price', format: '0.00' });
    expect(col.formatValue(42)).toBe('42.00');
    expect(col.formatValue(3.1)).toBe('3.10');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DateColumn
// ═══════════════════════════════════════════════════════════════════════════

describe('DateColumn', () => {
  it('formats dates', () => {
    const col = new DateColumn({ text: 'Date', dataIndex: 'joined', format: 'Y-m-d' });
    expect(col.formatValue(new Date(2024, 0, 15))).toBe('2024-01-15');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BooleanColumn
// ═══════════════════════════════════════════════════════════════════════════

describe('BooleanColumn', () => {
  it('shows trueText/falseText', () => {
    const col = new BooleanColumn({
      text: 'Active',
      dataIndex: 'active',
      trueText: 'Yes',
      falseText: 'No',
    });
    expect(col.formatValue(true)).toBe('Yes');
    expect(col.formatValue(false)).toBe('No');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CheckColumn
// ═══════════════════════════════════════════════════════════════════════════

describe('CheckColumn', () => {
  it('renders checkboxes in cells', () => {
    const g = grid({
      columns: [{ text: 'Active', dataIndex: 'active', xtype: 'checkcolumn' }],
    });
    const checkboxes = g.el!.querySelectorAll('tbody td input[type="checkbox"]');
    expect(checkboxes.length).toBe(3);
  });

  it('checkbox reflects record value', () => {
    const g = grid({
      columns: [{ text: 'Active', dataIndex: 'active', xtype: 'checkcolumn' }],
    });
    const checkboxes = g.el!.querySelectorAll(
      'tbody td input[type="checkbox"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(checkboxes[0].checked).toBe(true); // Alice active
    expect(checkboxes[1].checked).toBe(false); // Bob not active
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ActionColumn
// ═══════════════════════════════════════════════════════════════════════════

describe('ActionColumn', () => {
  it('renders action icons', () => {
    const g = grid({
      columns: [
        { text: 'Name', dataIndex: 'name' },
        {
          text: 'Actions',
          xtype: 'actioncolumn',
          actions: [
            { iconCls: 'fa-edit', tooltip: 'Edit' },
            { iconCls: 'fa-trash', tooltip: 'Delete' },
          ],
        },
      ],
    });
    const actions = g.el!.querySelectorAll('.x-action-col-icon');
    expect(actions.length).toBe(6); // 3 rows × 2 actions
  });

  it('action click fires handler', () => {
    const handler = vi.fn();
    const g = grid({
      columns: [
        {
          text: 'Act',
          xtype: 'actioncolumn',
          actions: [{ iconCls: 'fa-edit', handler }],
        },
      ],
    });
    const icon = g.el!.querySelector('.x-action-col-icon') as HTMLElement;
    icon.click();
    expect(handler).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RowNumbererColumn
// ═══════════════════════════════════════════════════════════════════════════

describe('RowNumbererColumn', () => {
  it('shows row numbers starting at 1', () => {
    const g = grid({
      columns: [{ xtype: 'rownumberer' }, { text: 'Name', dataIndex: 'name' }],
    });
    const cells = g.el!.querySelectorAll('tbody tr td:first-child');
    expect(cells[0].textContent).toBe('1');
    expect(cells[1].textContent).toBe('2');
    expect(cells[2].textContent).toBe('3');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GridView
// ═══════════════════════════════════════════════════════════════════════════

describe('GridView', () => {
  it('constructs and renders', () => {
    const store = mockStore([{ id: 1, name: 'A' }]);
    const cols = [new Column({ text: 'Name', dataIndex: 'name' })];
    const view = new GridView({ store, columns: cols });
    const table = view.render();
    expect(table.tagName).toBe('TABLE');
    expect(table.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('refresh re-renders rows', () => {
    const store = mockStore([{ id: 1, name: 'A' }]);
    const cols = [new Column({ text: 'Name', dataIndex: 'name' })];
    const view = new GridView({ store, columns: cols });
    const table = view.render();
    document.body.appendChild(table);

    store.data.items.push({
      id: 2,
      data: { name: 'B' },
      get: (f: string) => (f === 'name' ? 'B' : null),
      set: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    view.refresh();
    expect(table.querySelectorAll('tbody tr').length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HeaderContainer
// ═══════════════════════════════════════════════════════════════════════════

describe('HeaderContainer', () => {
  it('creates header row', () => {
    const cols = [
      new Column({ text: 'Name', dataIndex: 'name', width: 100 }),
      new Column({ text: 'Age', dataIndex: 'age', width: 50 }),
    ];
    const hc = new HeaderContainer({ columns: cols });
    const tr = hc.render();
    expect(tr.tagName).toBe('TR');
    expect(tr.querySelectorAll('th').length).toBe(2);
  });

  it('column width set on th', () => {
    const cols = [new Column({ text: 'X', dataIndex: 'x', width: 200 })];
    const hc = new HeaderContainer({ columns: cols });
    const tr = hc.render();
    expect((tr.querySelector('th') as HTMLElement).style.width).toBe('200px');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Column
// ═══════════════════════════════════════════════════════════════════════════

describe('Column', () => {
  it('stores text and dataIndex', () => {
    const c = new Column({ text: 'Name', dataIndex: 'name' });
    expect(c.text).toBe('Name');
    expect(c.dataIndex).toBe('name');
  });

  it('getCellValue extracts from record', () => {
    const c = new Column({ text: 'X', dataIndex: 'x' });
    const rec = { get: (f: string) => (f === 'x' ? 42 : null) };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(c.getCellValue(rec as any)).toBe(42);
  });

  it('renderer overrides cell content', () => {
    const c = new Column({ text: 'X', dataIndex: 'x', renderer: (v: unknown) => `$${v}` });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(c.renderCell(100, {} as any, {} as any, 0, 0)).toBe('$100');
  });
});
