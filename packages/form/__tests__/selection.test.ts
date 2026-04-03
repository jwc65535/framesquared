import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComboBox } from '../src/field/ComboBox.js';
import { TagField } from '../src/field/Tag.js';
import { Checkbox } from '../src/field/Checkbox.js';
import { Radio } from '../src/field/Radio.js';
import { CheckboxGroup } from '../src/field/CheckboxGroup.js';
import { RadioGroup } from '../src/field/RadioGroup.js';
import { BoundList } from '../src/BoundList.js';

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

// Minimal mock store
function mockStore(data: Record<string, unknown>[] = []) {
  const records = data.map((d, i) => ({
    id: i,
    data: d,
    get(f: string) {
      return (d as any)[f];
    },
  }));
  let filtered = [...records];
  return {
    data: { items: filtered, length: filtered.length },
    getRange: () => filtered,
    getCount: () => filtered.length,
    filter: vi.fn((field: string, value: string) => {
      filtered = records.filter((r) =>
        String(r.get(field)).toLowerCase().includes(value.toLowerCase()),
      );
    }),
    clearFilter: vi.fn(() => {
      filtered = [...records];
    }),
    loadPage: vi.fn(),
    load: vi.fn(),
    findRecord: (field: string, value: unknown) =>
      records.find((r) => r.get(field) === value) ?? null,
    each: (fn: Function) => {
      for (const r of filtered) fn(r);
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// BoundList
// ═══════════════════════════════════════════════════════════════════════════

describe('BoundList', () => {
  it('renders with x-boundlist class', () => {
    const store = mockStore([{ name: 'Alice' }, { name: 'Bob' }]);
    const bl = new BoundList({ renderTo: document.body, store, displayField: 'name' });
    expect(bl.el!.classList.contains('x-boundlist')).toBe(true);
  });

  it('renders items from store', () => {
    const store = mockStore([{ name: 'A' }, { name: 'B' }, { name: 'C' }]);
    const bl = new BoundList({ renderTo: document.body, store, displayField: 'name' });
    const items = bl.el!.querySelectorAll('.x-boundlist-item');
    expect(items.length).toBe(3);
    expect(items[0].textContent).toBe('A');
  });

  it('itemclick event fires on click', () => {
    const spy = vi.fn();
    const store = mockStore([{ name: 'A' }]);
    const bl = new BoundList({
      renderTo: document.body,
      store,
      displayField: 'name',
      listeners: { itemclick: spy },
    });
    (bl.el!.querySelector('.x-boundlist-item') as HTMLElement).click();
    expect(spy).toHaveBeenCalled();
  });

  it('refresh re-renders items', () => {
    const store = mockStore([{ name: 'A' }]);
    const bl = new BoundList({ renderTo: document.body, store, displayField: 'name' });
    expect(bl.el!.querySelectorAll('.x-boundlist-item').length).toBe(1);
    // Simulate filter reducing to empty
    store.filter('name', 'ZZZZZ');
    bl.refresh();
    expect(bl.el!.querySelectorAll('.x-boundlist-item').length).toBe(0);
  });

  it('keyboard: ArrowDown highlights next item', () => {
    const store = mockStore([{ name: 'A' }, { name: 'B' }]);
    const bl = new BoundList({ renderTo: document.body, store, displayField: 'name' });
    bl.el!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    const items = bl.el!.querySelectorAll('.x-boundlist-item');
    expect(items[0].classList.contains('x-boundlist-item-over')).toBe(true);
  });

  it('keyboard: Enter selects highlighted item', () => {
    const spy = vi.fn();
    const store = mockStore([{ name: 'A' }, { name: 'B' }]);
    const bl = new BoundList({
      renderTo: document.body,
      store,
      displayField: 'name',
      listeners: { select: spy },
    });
    bl.el!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    bl.el!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ComboBox — local mode
// ═══════════════════════════════════════════════════════════════════════════

describe('ComboBox — local mode', () => {
  function combo(cfg: Record<string, unknown> = {}): ComboBox {
    const store = mockStore([
      { id: 1, name: 'Apple' },
      { id: 2, name: 'Banana' },
      { id: 3, name: 'Cherry' },
    ]);
    return new ComboBox({
      renderTo: document.body,
      store,
      displayField: 'name',
      valueField: 'id',
      queryMode: 'local',
      ...cfg,
    });
  }

  it('renders with x-combobox class', () => {
    const c = combo();
    expect(c.el!.classList.contains('x-combobox')).toBe(true);
  });

  it('has expand trigger', () => {
    const c = combo();
    expect(c.el!.querySelector('.x-trigger-expand')).not.toBeNull();
  });

  it('expand() shows the dropdown', () => {
    const c = combo();
    c.expand();
    expect(c.isExpanded()).toBe(true);
  });

  it('collapse() hides the dropdown', () => {
    const c = combo();
    c.expand();
    c.collapse();
    expect(c.isExpanded()).toBe(false);
  });

  it('select(record) sets value and display', () => {
    const c = combo();
    const store = (c as any)._store;
    const rec = store.findRecord('name', 'Banana');
    c.select(rec);
    expect(c.getValue()).toBe(2);
    expect(c.getInputEl().value).toBe('Banana');
  });

  it('fires "select" event', () => {
    const spy = vi.fn();
    const c = combo({ listeners: { select: spy } });
    const store = (c as any)._store;
    c.select(store.findRecord('name', 'Apple'));
    expect(spy).toHaveBeenCalled();
  });

  it('doQuery filters store in local mode', () => {
    const c = combo();
    c.doQuery('an');
    const store = (c as any)._store;
    expect(store.filter).toHaveBeenCalled();
  });

  it('findRecord returns matching record', () => {
    const c = combo();
    const rec = c.findRecord('name', 'Cherry');
    expect(rec).not.toBeNull();
    expect(rec!.get('name')).toBe('Cherry');
  });

  it('forceSelection rejects non-matching value on blur', () => {
    const c = combo({ forceSelection: true });
    c.getInputEl().value = 'Nonexistent';
    c.getInputEl().dispatchEvent(new Event('blur', { bubbles: true }));
    // Should revert
    expect(c.getInputEl().value).toBe('');
  });

  it('fires expand/collapse events', () => {
    const expandSpy = vi.fn();
    const collapseSpy = vi.fn();
    const c = combo({ listeners: { expand: expandSpy, collapse: collapseSpy } });
    c.expand();
    expect(expandSpy).toHaveBeenCalled();
    c.collapse();
    expect(collapseSpy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ComboBox — multiSelect
// ═══════════════════════════════════════════════════════════════════════════

describe('ComboBox — multiSelect', () => {
  function combo(cfg: Record<string, unknown> = {}): ComboBox {
    const store = mockStore([
      { id: 1, name: 'Red' },
      { id: 2, name: 'Green' },
      { id: 3, name: 'Blue' },
    ]);
    return new ComboBox({
      renderTo: document.body,
      store,
      displayField: 'name',
      valueField: 'id',
      queryMode: 'local',
      multiSelect: true,
      delimiter: ', ',
      ...cfg,
    });
  }

  it('selecting multiple records sets comma-separated display', () => {
    const c = combo();
    const store = (c as any)._store;
    c.select(store.findRecord('name', 'Red'));
    c.select(store.findRecord('name', 'Blue'));
    expect(c.getInputEl().value).toContain('Red');
    expect(c.getInputEl().value).toContain('Blue');
  });

  it('getSelection returns array', () => {
    const c = combo();
    const store = (c as any)._store;
    c.select(store.findRecord('name', 'Red'));
    c.select(store.findRecord('name', 'Green'));
    expect(c.getSelection()).toHaveLength(2);
  });

  it('deselect removes from selection', () => {
    const c = combo();
    const store = (c as any)._store;
    const red = store.findRecord('name', 'Red');
    c.select(red);
    c.select(store.findRecord('name', 'Green'));
    c.deselect(red);
    expect(c.getSelection()).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TagField
// ═══════════════════════════════════════════════════════════════════════════

describe('TagField', () => {
  function tagField(cfg: Record<string, unknown> = {}): TagField {
    const store = mockStore([
      { id: 1, name: 'JavaScript' },
      { id: 2, name: 'TypeScript' },
      { id: 3, name: 'Python' },
    ]);
    return new TagField({
      renderTo: document.body,
      store,
      displayField: 'name',
      valueField: 'id',
      ...cfg,
    });
  }

  it('renders with x-tagfield class', () => {
    const t = tagField();
    expect(t.el!.classList.contains('x-tagfield')).toBe(true);
  });

  it('selecting adds a tag chip', () => {
    const t = tagField();
    const store = (t as any)._store;
    t.select(store.findRecord('name', 'JavaScript'));
    const tags = t.el!.querySelectorAll('.x-tagfield-tag');
    expect(tags.length).toBe(1);
    expect(tags[0].textContent).toContain('JavaScript');
  });

  it('tag has remove button', () => {
    const t = tagField();
    const store = (t as any)._store;
    t.select(store.findRecord('name', 'TypeScript'));
    const removeBtn = t.el!.querySelector('.x-tagfield-tag-close');
    expect(removeBtn).not.toBeNull();
  });

  it('clicking remove button removes tag', () => {
    const t = tagField();
    const store = (t as any)._store;
    t.select(store.findRecord('name', 'Python'));
    const removeBtn = t.el!.querySelector('.x-tagfield-tag-close') as HTMLElement;
    removeBtn.click();
    expect(t.el!.querySelectorAll('.x-tagfield-tag').length).toBe(0);
  });

  it('getValue returns array of selected values', () => {
    const t = tagField();
    const store = (t as any)._store;
    t.select(store.findRecord('name', 'JavaScript'));
    t.select(store.findRecord('name', 'Python'));
    const val = t.getValue();
    expect(Array.isArray(val)).toBe(true);
    expect(val).toHaveLength(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Checkbox
// ═══════════════════════════════════════════════════════════════════════════

describe('Checkbox', () => {
  function checkbox(cfg: Record<string, unknown> = {}): Checkbox {
    return new Checkbox({ renderTo: document.body, ...cfg });
  }

  it('renders with x-checkbox class', () => {
    const c = checkbox({ boxLabel: 'Accept' });
    expect(c.el!.classList.contains('x-checkbox')).toBe(true);
  });

  it('renders native checkbox input', () => {
    const c = checkbox();
    const input = c.el!.querySelector('input[type="checkbox"]');
    expect(input).not.toBeNull();
  });

  it('checked:true starts checked', () => {
    const c = checkbox({ checked: true });
    expect((c.el!.querySelector('input') as HTMLInputElement).checked).toBe(true);
  });

  it('clicking toggles checked state', () => {
    const c = checkbox();
    const input = c.el!.querySelector('input') as HTMLInputElement;
    input.click();
    expect(input.checked).toBe(true);
    input.click();
    expect(input.checked).toBe(false);
  });

  it('getValue returns inputValue when checked', () => {
    const c = checkbox({ inputValue: 'yes', uncheckedValue: 'no', checked: true });
    expect(c.getValue()).toBe('yes');
  });

  it('getValue returns uncheckedValue when unchecked', () => {
    const c = checkbox({ inputValue: 'yes', uncheckedValue: 'no' });
    expect(c.getValue()).toBe('no');
  });

  it('fires "change" on toggle', () => {
    const spy = vi.fn();
    const c = checkbox({ listeners: { change: spy } });
    (c.el!.querySelector('input') as HTMLInputElement).click();
    expect(spy).toHaveBeenCalled();
  });

  it('boxLabel renders next to checkbox', () => {
    const c = checkbox({ boxLabel: 'I agree' });
    expect(c.el!.textContent).toContain('I agree');
  });

  it('isChecked returns boolean', () => {
    const c = checkbox({ checked: true });
    expect(c.isChecked()).toBe(true);
  });

  it('setChecked programmatic', () => {
    const c = checkbox();
    c.setChecked(true);
    expect((c.el!.querySelector('input') as HTMLInputElement).checked).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Radio
// ═══════════════════════════════════════════════════════════════════════════

describe('Radio', () => {
  function radio(cfg: Record<string, unknown> = {}): Radio {
    return new Radio({ renderTo: document.body, ...cfg });
  }

  it('renders with x-radio class', () => {
    const r = radio({ boxLabel: 'Option A' });
    expect(r.el!.classList.contains('x-radio')).toBe(true);
  });

  it('renders native radio input', () => {
    const r = radio({ name: 'choice' });
    const input = r.el!.querySelector('input[type="radio"]');
    expect(input).not.toBeNull();
    expect((input as HTMLInputElement).name).toBe('choice');
  });

  it('radio group: only one selected via name', () => {
    const a = radio({ name: 'g', inputValue: 'a', checked: true });
    const b = radio({ name: 'g', inputValue: 'b' });
    // In real browser, clicking b would uncheck a via native radio behavior
    // In jsdom we simulate by testing the Radio class group tracking
    b.setChecked(true);
    expect(b.isChecked()).toBe(true);
  });

  it('getGroupValue returns the checked radio value', () => {
    const a = radio({ name: 'grp', inputValue: 'a' });
    const b = radio({ name: 'grp', inputValue: 'b', checked: true });
    expect(b.getGroupValue()).toBe('b');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CheckboxGroup
// ═══════════════════════════════════════════════════════════════════════════

describe('CheckboxGroup', () => {
  function checkGroup(cfg: Record<string, unknown> = {}): CheckboxGroup {
    return new CheckboxGroup({
      renderTo: document.body,
      items: [
        new Checkbox({ inputValue: 'a', boxLabel: 'A' }),
        new Checkbox({ inputValue: 'b', boxLabel: 'B' }),
        new Checkbox({ inputValue: 'c', boxLabel: 'C' }),
      ],
      ...cfg,
    });
  }

  it('renders with x-checkbox-group class', () => {
    const g = checkGroup();
    expect(g.el!.classList.contains('x-checkbox-group')).toBe(true);
  });

  it('contains checkbox children', () => {
    const g = checkGroup();
    expect(g.getItems().length).toBe(3);
  });

  it('getValue returns array of checked values', () => {
    const g = checkGroup();
    const items = g.getItems() as Checkbox[];
    items[0].setChecked(true);
    items[2].setChecked(true);
    expect(g.getValue()).toEqual(['a', 'c']);
  });

  it('setValue sets checked states', () => {
    const g = checkGroup();
    g.setValue(['b']);
    const items = g.getItems() as Checkbox[];
    expect(items[0].isChecked()).toBe(false);
    expect(items[1].isChecked()).toBe(true);
    expect(items[2].isChecked()).toBe(false);
  });

  it('columns config sets grid layout', () => {
    const g = checkGroup({ columns: 2 });
    const body = g.getBodyEl();
    expect(body.style.display).toBe('grid');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RadioGroup
// ═══════════════════════════════════════════════════════════════════════════

describe('RadioGroup', () => {
  function radioGroup(cfg: Record<string, unknown> = {}): RadioGroup {
    return new RadioGroup({
      renderTo: document.body,
      items: [
        new Radio({ name: 'rg', inputValue: 'x', boxLabel: 'X' }),
        new Radio({ name: 'rg', inputValue: 'y', boxLabel: 'Y' }),
        new Radio({ name: 'rg', inputValue: 'z', boxLabel: 'Z' }),
      ],
      ...cfg,
    });
  }

  it('renders with x-radio-group class', () => {
    const g = radioGroup();
    expect(g.el!.classList.contains('x-radio-group')).toBe(true);
  });

  it('getValue returns the checked radio value', () => {
    const g = radioGroup();
    const items = g.getItems() as Radio[];
    items[1].setChecked(true);
    expect(g.getValue()).toBe('y');
  });

  it('setValue checks the matching radio', () => {
    const g = radioGroup();
    g.setValue('z');
    const items = g.getItems() as Radio[];
    expect(items[2].isChecked()).toBe(true);
  });

  it('only one radio checked at a time', () => {
    const g = radioGroup();
    const items = g.getItems() as Radio[];
    items[0].setChecked(true);
    items[2].setChecked(true);
    // In RadioGroup, setting z should uncheck x
    expect(items[0].isChecked()).toBe(false);
    expect(items[2].isChecked()).toBe(true);
  });
});
