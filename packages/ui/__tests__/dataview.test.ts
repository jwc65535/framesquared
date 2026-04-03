/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DataView } from '../src/view/DataView.js';
import { ListView } from '../src/view/ListView.js';

class MockRO {
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
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
  return {
    data: { items: records },
    getRange: () => records,
    getCount: () => records.length,
    getAt: (i: number) => records[i],
    on: (evt: string, fn: (...args: unknown[]) => void) => {
      (listeners[evt] ??= []).push(fn);
    },
    fireEvent: (evt: string, ...args: unknown[]) => {
      (listeners[evt] ?? []).forEach((fn) => fn(...args));
    },
    each: (fn: (...args: unknown[]) => void) => records.forEach(fn),
    isLoading: () => false,
    add: (rec: Record<string, unknown>) => {
      const r = {
        id: records.length,
        data: rec,
        get: (f: string) => (rec as any)[f],
        set: (f: string, v: unknown) => {
          (rec as any)[f] = v;
        },
      };
      records.push(r as any);
      (listeners['add'] ?? []).forEach((fn) => fn(r));
      (listeners['datachanged'] ?? []).forEach((fn) => fn());
    },
    removeAt: (idx: number) => {
      records.splice(idx, 1);
      (listeners['remove'] ?? []).forEach((fn) => fn());
      (listeners['datachanged'] ?? []).forEach((fn) => fn());
    },
  };
}

const SAMPLE = [
  { id: 1, name: 'Alice', role: 'Engineer' },
  { id: 2, name: 'Bob', role: 'Designer' },
  { id: 3, name: 'Charlie', role: 'Manager' },
];

// ═══════════════════════════════════════════════════════════════════════════
// DataView — rendering
// ═══════════════════════════════════════════════════════════════════════════

describe('DataView — rendering', () => {
  it('renders with x-dataview class', () => {
    const dv = new DataView({
      renderTo: document.body,
      store: mockStore(SAMPLE),
      itemTpl: (record: any) => `<div class="item">${record.get('name')}</div>`,
      itemSelector: '.item',
    });
    expect(dv.el!.classList.contains('x-dataview')).toBe(true);
  });

  it('renders items from store using template', () => {
    const dv = new DataView({
      renderTo: document.body,
      store: mockStore(SAMPLE),
      itemTpl: (record: any) => `<div class="item">${record.get('name')}</div>`,
      itemSelector: '.item',
    });
    const items = dv.el!.querySelectorAll('.item');
    expect(items.length).toBe(3);
    expect(items[0].textContent).toBe('Alice');
    expect(items[1].textContent).toBe('Bob');
  });

  it('applies itemCls to each item', () => {
    const dv = new DataView({
      renderTo: document.body,
      store: mockStore(SAMPLE),
      itemTpl: (record: any) => `<div class="item">${record.get('name')}</div>`,
      itemSelector: '.item',
      itemCls: 'my-item',
    });
    const items = dv.el!.querySelectorAll('.item');
    expect(items[0].classList.contains('my-item')).toBe(true);
  });

  it('emptyText shown when store is empty', () => {
    const dv = new DataView({
      renderTo: document.body,
      store: mockStore([]),
      itemTpl: (record: any) => `<div class="item">${record.get('name')}</div>`,
      itemSelector: '.item',
      emptyText: 'No items found',
    });
    expect(dv.el!.textContent).toContain('No items found');
  });

  it('no emptyText when store has data', () => {
    const dv = new DataView({
      renderTo: document.body,
      store: mockStore(SAMPLE),
      itemTpl: (record: any) => `<div class="item">${record.get('name')}</div>`,
      itemSelector: '.item',
      emptyText: 'No items found',
    });
    expect(dv.el!.querySelector('.x-dataview-empty')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DataView — item events
// ═══════════════════════════════════════════════════════════════════════════

describe('DataView — item events', () => {
  function dv(cfg: Record<string, unknown> = {}): DataView {
    return new DataView({
      renderTo: document.body,
      store: mockStore(SAMPLE),
      itemTpl: (record: any) =>
        `<div class="item" data-idx="${record.id}">${record.get('name')}</div>`,
      itemSelector: '.item',
      ...cfg,
    });
  }

  it('itemclick fires with record on click', () => {
    const spy = vi.fn();
    const d = dv({ listeners: { itemclick: spy } });
    const item = d.el!.querySelector('.item') as HTMLElement;
    item.click();
    expect(spy).toHaveBeenCalled();
    // First arg is the view, second is the record
    expect(spy.mock.calls[0][1].get('name')).toBe('Alice');
  });

  it('itemdblclick fires on double-click', () => {
    const spy = vi.fn();
    const d = dv({ listeners: { itemdblclick: spy } });
    const item = d.el!.querySelector('.item') as HTMLElement;
    item.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });

  it('itemmouseenter fires on mouseenter', () => {
    const spy = vi.fn();
    const d = dv({ listeners: { itemmouseenter: spy } });
    const item = d.el!.querySelector('.item') as HTMLElement;
    item.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });

  it('itemmouseleave fires on mouseleave', () => {
    const spy = vi.fn();
    const d = dv({ listeners: { itemmouseleave: spy } });
    const item = d.el!.querySelector('.item') as HTMLElement;
    item.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DataView — selection
// ═══════════════════════════════════════════════════════════════════════════

describe('DataView — selection', () => {
  function dv(cfg: Record<string, unknown> = {}): DataView {
    return new DataView({
      renderTo: document.body,
      store: mockStore(SAMPLE),
      itemTpl: (record: any) => `<div class="item">${record.get('name')}</div>`,
      itemSelector: '.item',
      singleSelect: true,
      ...cfg,
    });
  }

  it('clicking item selects it', () => {
    const d = dv();
    const item = d.el!.querySelector('.item') as HTMLElement;
    item.click();
    expect(d.getSelectedRecords().length).toBe(1);
  });

  it('selected item gets selectedItemCls', () => {
    const d = dv({ selectedItemCls: 'selected' });
    const item = d.el!.querySelector('.item') as HTMLElement;
    item.click();
    expect(item.classList.contains('selected')).toBe(true);
  });

  it('singleSelect: clicking another deselects previous', () => {
    const d = dv({ selectedItemCls: 'selected' });
    const items = d.el!.querySelectorAll('.item') as NodeListOf<HTMLElement>;
    items[0].click();
    items[1].click();
    expect(items[0].classList.contains('selected')).toBe(false);
    expect(items[1].classList.contains('selected')).toBe(true);
    expect(d.getSelectedRecords().length).toBe(1);
  });

  it('multiSelect: click adds to selection', () => {
    const d = dv({ multiSelect: true, singleSelect: false, selectedItemCls: 'selected' });
    const items = d.el!.querySelectorAll('.item') as NodeListOf<HTMLElement>;
    items[0].click();
    items[2].click();
    expect(d.getSelectedRecords().length).toBe(2);
  });

  it('fires selectionchange event', () => {
    const spy = vi.fn();
    const d = dv({ listeners: { selectionchange: spy } });
    const item = d.el!.querySelector('.item') as HTMLElement;
    item.click();
    expect(spy).toHaveBeenCalled();
  });

  it('fires beforeselect event', () => {
    const spy = vi.fn();
    const d = dv({ listeners: { beforeselect: spy } });
    const item = d.el!.querySelector('.item') as HTMLElement;
    item.click();
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DataView — store changes
// ═══════════════════════════════════════════════════════════════════════════

describe('DataView — store reactivity', () => {
  it('store add → new item appears', () => {
    const store = mockStore(SAMPLE);
    const d = new DataView({
      renderTo: document.body,
      store,
      itemTpl: (record: any) => `<div class="item">${record.get('name')}</div>`,
      itemSelector: '.item',
    });
    expect(d.el!.querySelectorAll('.item').length).toBe(3);
    store.add({ id: 4, name: 'Diana', role: 'Analyst' });
    expect(d.el!.querySelectorAll('.item').length).toBe(4);
  });

  it('store remove → item removed', () => {
    const store = mockStore(SAMPLE);
    const d = new DataView({
      renderTo: document.body,
      store,
      itemTpl: (record: any) => `<div class="item">${record.get('name')}</div>`,
      itemSelector: '.item',
    });
    store.removeAt(0);
    expect(d.el!.querySelectorAll('.item').length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DataView — trackOver
// ═══════════════════════════════════════════════════════════════════════════

describe('DataView — trackOver', () => {
  it('hover applies overItemCls', () => {
    const d = new DataView({
      renderTo: document.body,
      store: mockStore(SAMPLE),
      itemTpl: (record: any) => `<div class="item">${record.get('name')}</div>`,
      itemSelector: '.item',
      trackOver: true,
      overItemCls: 'hover',
    });
    const item = d.el!.querySelector('.item') as HTMLElement;
    item.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    expect(item.classList.contains('hover')).toBe(true);
  });

  it('mouseleave removes overItemCls', () => {
    const d = new DataView({
      renderTo: document.body,
      store: mockStore(SAMPLE),
      itemTpl: (record: any) => `<div class="item">${record.get('name')}</div>`,
      itemSelector: '.item',
      trackOver: true,
      overItemCls: 'hover',
    });
    const item = d.el!.querySelector('.item') as HTMLElement;
    item.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    item.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    expect(item.classList.contains('hover')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DataView — methods
// ═══════════════════════════════════════════════════════════════════════════

describe('DataView — methods', () => {
  function dv(): DataView {
    return new DataView({
      renderTo: document.body,
      store: mockStore(SAMPLE),
      itemTpl: (record: any) => `<div class="item">${record.get('name')}</div>`,
      itemSelector: '.item',
    });
  }

  it('getNodes returns all item elements', () => {
    const d = dv();
    expect(d.getNodes().length).toBe(3);
  });

  it('getNode returns element for record', () => {
    const d = dv();
    const store = (d as any)._store;
    const node = d.getNode(store.getAt(1));
    expect(node).not.toBeNull();
    expect(node!.textContent).toBe('Bob');
  });

  it('getRecord returns record for element', () => {
    const d = dv();
    const node = d.getNodes()[2];
    const rec = d.getRecord(node);
    expect(rec).not.toBeNull();
    expect(rec!.get('name')).toBe('Charlie');
  });

  it('refresh re-renders all items', () => {
    const d = dv();
    const store = (d as any)._store;
    store.getAt(0).set('name', 'Alicia');
    d.refresh();
    expect(d.el!.querySelector('.item')!.textContent).toBe('Alicia');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ListView
// ═══════════════════════════════════════════════════════════════════════════

describe('ListView', () => {
  function lv(cfg: Record<string, unknown> = {}): ListView {
    return new ListView({
      renderTo: document.body,
      store: mockStore(SAMPLE),
      columns: [
        { text: 'Name', dataIndex: 'name', width: 120 },
        { text: 'Role', dataIndex: 'role', width: 100 },
      ],
      ...cfg,
    });
  }

  it('renders with x-listview class', () => {
    const l = lv();
    expect(l.el!.classList.contains('x-listview')).toBe(true);
  });

  it('renders a table with headers', () => {
    const l = lv();
    const ths = l.el!.querySelectorAll('th');
    expect(ths.length).toBe(2);
    expect(ths[0].textContent).toBe('Name');
    expect(ths[1].textContent).toBe('Role');
  });

  it('renders data rows', () => {
    const l = lv();
    const rows = l.el!.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
  });

  it('cell values from store', () => {
    const l = lv();
    const cells = l.el!.querySelectorAll('tbody tr:first-child td');
    expect(cells[0].textContent).toBe('Alice');
    expect(cells[1].textContent).toBe('Engineer');
  });

  it('clicking a row fires itemclick', () => {
    const spy = vi.fn();
    const l = lv({ listeners: { itemclick: spy } });
    const row = l.el!.querySelector('tbody tr') as HTMLElement;
    row.click();
    expect(spy).toHaveBeenCalled();
  });

  it('emptyText when store is empty', () => {
    const l = new ListView({
      renderTo: document.body,
      store: mockStore([]),
      columns: [{ text: 'Name', dataIndex: 'name' }],
      emptyText: 'Nothing here',
    });
    expect(l.el!.textContent).toContain('Nothing here');
  });

  it('store change refreshes table', () => {
    const store = mockStore(SAMPLE);
    const l = new ListView({
      renderTo: document.body,
      store,
      columns: [{ text: 'Name', dataIndex: 'name' }],
    });
    store.add({ name: 'Diana' });
    expect(l.el!.querySelectorAll('tbody tr').length).toBe(4);
  });

  it('column widths applied', () => {
    const l = lv();
    const ths = l.el!.querySelectorAll('th');
    expect((ths[0] as HTMLElement).style.width).toBe('120px');
  });
});
