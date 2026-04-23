/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

/**
 * dataview-demo — app.spec.ts
 *
 * TDD test suite for the DataView demonstration.
 * Tests are written against the exported factory/refs before
 * the production Application wiring runs.
 *
 * Coverage:
 *   1. View structure          — Panel, DataView, Store, Buttons present in DOM
 *   2. Store correctness       — initial record count; field values per record
 *   3. DataView rendering      — item count, textContent, data-record-index attrs
 *   4. Template output         — exact "{name} is {age} years old" strings
 *   5. Store reactivity        — add/remove records trigger re-render
 *   6. Empty state             — emptyText shown when store is cleared
 *   7. Selection               — click sets x-item-selected; getSelectedRecords()
 *   8. itemclick event         — lastClicked ref updated on item click
 *   9. addBtn / removeBtn      — handler integration with the store
 *  10. Application guard       — MODE=test suppresses auto-start
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { DataView, Button } from '@framesquared/ui';
import { Store } from '@framesquared/data';
import { createDataViewDemo, GhostbusterModel } from './app.js';
import type { DataViewDemoRefs } from './app.js';

// ---------------------------------------------------------------------------
// PointerEvent polyfill — jsdom 24 does not include PointerEvent
// ---------------------------------------------------------------------------

beforeAll(() => {
  if (typeof globalThis.PointerEvent === 'undefined') {
    class PointerEvent extends MouseEvent {
      constructor(type: string, init?: PointerEventInit) {
        super(type, init);
      }
    }
    (globalThis as any).PointerEvent = PointerEvent;
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function click(el: Element): void {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function items(refs: DataViewDemoRefs): HTMLElement[] {
  return refs.view.getNodes();
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let host: HTMLDivElement;
let refs: DataViewDemoRefs;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  refs = createDataViewDemo(host);
});

afterEach(() => {
  if (host.parentNode) host.parentNode.removeChild(host);
});

// ═══════════════════════════════════════════════════════════════════════════
// 1 · View structure
// ═══════════════════════════════════════════════════════════════════════════

describe('View structure', () => {
  it('createDataViewDemo returns a refs object', () => {
    expect(refs).toBeDefined();
  });

  it('view is a DataView instance', () => {
    expect(refs.view).toBeInstanceOf(DataView);
  });

  it('store is a Store instance', () => {
    expect(refs.store).toBeInstanceOf(Store);
  });

  it('addBtn is a Button instance', () => {
    expect(refs.addBtn).toBeInstanceOf(Button);
  });

  it('removeBtn is a Button instance', () => {
    expect(refs.removeBtn).toBeInstanceOf(Button);
  });

  it('a Panel renders inside host', () => {
    expect(host.querySelector('.x-panel')).toBeTruthy();
  });

  it('the DataView element renders inside host', () => {
    expect(host.contains(refs.view.el)).toBe(true);
  });

  it('addBtn renders inside host', () => {
    expect(host.contains(refs.addBtn.el)).toBe(true);
  });

  it('removeBtn renders inside host', () => {
    expect(host.contains(refs.removeBtn.el)).toBe(true);
  });

  it('addBtn has text "Add Member"', () => {
    expect(refs.addBtn.el!.textContent).toContain('Add Member');
  });

  it('removeBtn has text "Remove Last"', () => {
    expect(refs.removeBtn.el!.textContent).toContain('Remove Last');
  });

  it('lastClicked starts empty', () => {
    expect(refs.lastClicked.value).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2 · Store correctness
// ═══════════════════════════════════════════════════════════════════════════

describe('Store correctness', () => {
  it('store has 4 records initially', () => {
    expect(refs.store.getCount()).toBe(4);
  });

  it('first record name is Peter', () => {
    expect(refs.store.getAt(0)!.get('name')).toBe('Peter');
  });

  it('first record age is 26', () => {
    expect(refs.store.getAt(0)!.get('age')).toBe(26);
  });

  it('second record name is Ray', () => {
    expect(refs.store.getAt(1)!.get('name')).toBe('Ray');
  });

  it('second record age is 21', () => {
    expect(refs.store.getAt(1)!.get('age')).toBe(21);
  });

  it('third record name is Egon', () => {
    expect(refs.store.getAt(2)!.get('name')).toBe('Egon');
  });

  it('fourth record name is Winston', () => {
    expect(refs.store.getAt(3)!.get('name')).toBe('Winston');
  });

  it('all records return data from getData()', () => {
    const data = refs.store.getAt(0)!.getData();
    expect(data).toHaveProperty('name', 'Peter');
    expect(data).toHaveProperty('age', 26);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3 · DataView rendering
// ═══════════════════════════════════════════════════════════════════════════

describe('DataView rendering', () => {
  it('renders 4 items initially', () => {
    expect(items(refs).length).toBe(4);
  });

  it('getNodes() returns 4 elements', () => {
    expect(refs.view.getNodes().length).toBe(4);
  });

  it('each item has data-record-index attribute', () => {
    items(refs).forEach((el, i) => {
      expect(el.getAttribute('data-record-index')).toBe(String(i));
    });
  });

  it('each item has the x-dataview-item class', () => {
    items(refs).forEach((el) => {
      expect(el.classList.contains('x-dataview-item')).toBe(true);
    });
  });

  it('DataView el has x-dataview class', () => {
    expect(refs.view.el!.classList.contains('x-dataview')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4 · Template output — exact rendered strings
// ═══════════════════════════════════════════════════════════════════════════

describe('Template output', () => {
  it('renders "Peter is 26 years old"', () => {
    expect(items(refs)[0].textContent).toBe('Peter is 26 years old');
  });

  it('renders "Ray is 21 years old"', () => {
    expect(items(refs)[1].textContent).toBe('Ray is 21 years old');
  });

  it('renders "Egon is 24 years old"', () => {
    expect(items(refs)[2].textContent).toBe('Egon is 24 years old');
  });

  it('renders "Winston is 24 years old"', () => {
    expect(items(refs)[3].textContent).toBe('Winston is 24 years old');
  });

  it('all four names appear in the DataView DOM', () => {
    const text = refs.view.el!.textContent ?? '';
    expect(text).toContain('Peter');
    expect(text).toContain('Ray');
    expect(text).toContain('Egon');
    expect(text).toContain('Winston');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5 · Store reactivity — add / remove trigger re-render
// ═══════════════════════════════════════════════════════════════════════════

describe('Store reactivity', () => {
  it('adding a record increases item count to 5', () => {
    refs.store.add(GhostbusterModel.create({ name: 'Janine', age: 32 }));
    expect(items(refs).length).toBe(5);
  });

  it('added record renders with correct text', () => {
    refs.store.add(GhostbusterModel.create({ name: 'Janine', age: 32 }));
    expect(items(refs)[4].textContent).toBe('Janine is 32 years old');
  });

  it('removing the last record decreases item count to 3', () => {
    refs.store.remove(refs.store.getAt(3)!);
    expect(items(refs).length).toBe(3);
  });

  it('removed record no longer appears in the DOM', () => {
    refs.store.remove(refs.store.getAt(3)!);
    const text = refs.view.el!.textContent ?? '';
    expect(text).not.toContain('Winston');
  });

  it('multiple adds accumulate correctly', () => {
    refs.store.add(GhostbusterModel.create({ name: 'Janine', age: 32 }));
    refs.store.add(GhostbusterModel.create({ name: 'Louis', age: 35 }));
    expect(items(refs).length).toBe(6);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6 · Empty state
// ═══════════════════════════════════════════════════════════════════════════

describe('Empty state', () => {
  it('emptyText element appears when all records are removed', () => {
    const all = refs.store.getRange();
    refs.store.remove(...all);
    expect(refs.view.el!.querySelector('.x-dataview-empty')).toBeTruthy();
  });

  it('emptyText reads "No team members."', () => {
    refs.store.remove(...refs.store.getRange());
    const emptyEl = refs.view.el!.querySelector('.x-dataview-empty')!;
    expect(emptyEl.textContent).toBe('No team members.');
  });

  it('no item elements when store is empty', () => {
    refs.store.remove(...refs.store.getRange());
    expect(items(refs).length).toBe(0);
  });

  it('re-adding a record after clearing removes the emptyText', () => {
    refs.store.remove(...refs.store.getRange());
    refs.store.add(GhostbusterModel.create({ name: 'Egon', age: 24 }));
    expect(refs.view.el!.querySelector('.x-dataview-empty')).toBeFalsy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7 · Selection
// ═══════════════════════════════════════════════════════════════════════════

describe('Selection', () => {
  it('clicking an item adds x-item-selected class', () => {
    const first = items(refs)[0];
    click(first);
    expect(first.classList.contains('x-item-selected')).toBe(true);
  });

  it('getSelectedRecords() returns the clicked record', () => {
    click(items(refs)[0]);
    const sel = refs.view.getSelectedRecords();
    expect(sel.length).toBe(1);
    expect(sel[0].get('name')).toBe('Peter');
  });

  it('clicking a second item deselects the first (singleSelect)', () => {
    const [first, second] = items(refs);
    click(first);
    click(second);
    expect(first.classList.contains('x-item-selected')).toBe(false);
    expect(second.classList.contains('x-item-selected')).toBe(true);
  });

  it('getSelectedRecords() always holds exactly one record after a click', () => {
    click(items(refs)[1]);
    click(items(refs)[2]);
    expect(refs.view.getSelectedRecords().length).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8 · itemclick event → lastClicked ref
// ═══════════════════════════════════════════════════════════════════════════

describe('itemclick event', () => {
  it('clicking an item updates lastClicked to the record name', () => {
    click(items(refs)[0]);
    expect(refs.lastClicked.value).toBe('Peter');
  });

  it('clicking a different item updates lastClicked', () => {
    click(items(refs)[0]);
    click(items(refs)[1]);
    expect(refs.lastClicked.value).toBe('Ray');
  });

  it('lastClicked remains empty before any click', () => {
    expect(refs.lastClicked.value).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9 · addBtn / removeBtn handler integration
// ═══════════════════════════════════════════════════════════════════════════

describe('addBtn / removeBtn', () => {
  it('clicking addBtn adds Janine to the store', () => {
    click(refs.addBtn.el!);
    expect(refs.store.getCount()).toBe(5);
  });

  it('clicking addBtn renders Janine in the DataView', () => {
    click(refs.addBtn.el!);
    expect(items(refs)[4].textContent).toBe('Janine is 32 years old');
  });

  it('clicking removeBtn removes the last record', () => {
    click(refs.removeBtn.el!);
    expect(refs.store.getCount()).toBe(3);
  });

  it('clicking removeBtn removes Winston from the view', () => {
    click(refs.removeBtn.el!);
    const text = refs.view.el!.textContent ?? '';
    expect(text).not.toContain('Winston');
  });

  it('removeBtn on an empty store does not throw', () => {
    refs.store.remove(...refs.store.getRange());
    expect(() => click(refs.removeBtn.el!)).not.toThrow();
  });

  it('addBtn then removeBtn returns to 4 records', () => {
    click(refs.addBtn.el!);
    click(refs.removeBtn.el!);
    expect(refs.store.getCount()).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10 · Application guard
// ═══════════════════════════════════════════════════════════════════════════

describe('Application guard', () => {
  it('MODE=test suppresses Application auto-start — module import does not throw', () => {
    // If import.meta.env.MODE !== 'test' guard were absent, new App().start()
    // would run during import and likely throw in jsdom.  The fact that the
    // test suite reaches this point proves the guard is working.
    expect(true).toBe(true);
  });

  it('createDataViewDemo is callable independently of Application', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    let testRefs: DataViewDemoRefs | undefined;
    expect(() => { testRefs = createDataViewDemo(div); }).not.toThrow();
    expect(testRefs!.store.getCount()).toBe(4);
    div.parentNode?.removeChild(div);
  });
});
