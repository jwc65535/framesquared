/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Model } from '../src/Model.js';
import { FieldType } from '../src/field/Field.js';
import { Store } from '../src/store/Store.js';
import { Collection } from '../src/store/Collection.js';

// ---------------------------------------------------------------------------
// Shared test model
// ---------------------------------------------------------------------------

class User extends Model {
  static override $className = 'store.test.User';
  static override fields = [
    { name: 'id', type: FieldType.INT },
    { name: 'name', type: FieldType.STRING },
    { name: 'age', type: FieldType.INT },
    { name: 'city', type: FieldType.STRING },
    { name: 'active', type: FieldType.BOOLEAN },
  ];
  static override idProperty = 'id';
}

function u(data: Record<string, unknown>): Model {
  return User.create(data);
}

// ═══════════════════════════════════════════════════════════════════════════
// Collection
// ═══════════════════════════════════════════════════════════════════════════

describe('Collection', () => {
  it('add and getCount', () => {
    const c = new Collection<Model>();
    const r = u({ id: 1, name: 'A' });
    c.add(r);
    expect(c.getCount()).toBe(1);
  });

  it('getByKey retrieves by id', () => {
    const c = new Collection<Model>((r) => r.getId());
    const r = u({ id: 42, name: 'A' });
    c.add(r);
    expect(c.getByKey(42)).toBe(r);
  });

  it('getAt retrieves by index', () => {
    const c = new Collection<Model>();
    const r1 = u({ id: 1, name: 'A' });
    const r2 = u({ id: 2, name: 'B' });
    c.add(r1);
    c.add(r2);
    expect(c.getAt(0)).toBe(r1);
    expect(c.getAt(1)).toBe(r2);
  });

  it('insert at specific index', () => {
    const c = new Collection<Model>();
    c.add(u({ id: 1, name: 'A' }));
    c.add(u({ id: 3, name: 'C' }));
    const r2 = u({ id: 2, name: 'B' });
    c.insert(1, r2);
    expect(c.getAt(1)).toBe(r2);
    expect(c.getCount()).toBe(3);
  });

  it('remove removes item and returns it', () => {
    const c = new Collection<Model>();
    const r = u({ id: 1, name: 'A' });
    c.add(r);
    const removed = c.remove(r);
    expect(removed).toBe(r);
    expect(c.getCount()).toBe(0);
  });

  it('removeAt removes by index', () => {
    const c = new Collection<Model>();
    const r1 = u({ id: 1, name: 'A' });
    const r2 = u({ id: 2, name: 'B' });
    c.add(r1);
    c.add(r2);
    c.removeAt(0);
    expect(c.getCount()).toBe(1);
    expect(c.getAt(0)).toBe(r2);
  });

  it('clear empties the collection', () => {
    const c = new Collection<Model>();
    c.add(u({ id: 1, name: 'A' }));
    c.add(u({ id: 2, name: 'B' }));
    c.clear();
    expect(c.getCount()).toBe(0);
  });

  it('indexOf returns correct index', () => {
    const c = new Collection<Model>();
    const r1 = u({ id: 1, name: 'A' });
    const r2 = u({ id: 2, name: 'B' });
    c.add(r1);
    c.add(r2);
    expect(c.indexOf(r2)).toBe(1);
  });

  it('contains returns true/false', () => {
    const c = new Collection<Model>();
    const r = u({ id: 1, name: 'A' });
    expect(c.contains(r)).toBe(false);
    c.add(r);
    expect(c.contains(r)).toBe(true);
  });

  it('toArray returns a copy', () => {
    const c = new Collection<Model>();
    c.add(u({ id: 1, name: 'A' }));
    const arr = c.toArray();
    expect(arr.length).toBe(1);
    arr.push(u({ id: 2, name: 'B' }));
    expect(c.getCount()).toBe(1); // original unchanged
  });

  it('each iterates in order', () => {
    const c = new Collection<Model>();
    c.add(u({ id: 1, name: 'A' }));
    c.add(u({ id: 2, name: 'B' }));
    const names: string[] = [];
    c.each((r) => {
      names.push(r.get('name') as string);
    });
    expect(names).toEqual(['A', 'B']);
  });

  it('each can break early by returning false', () => {
    const c = new Collection<Model>();
    c.add(u({ id: 1, name: 'A' }));
    c.add(u({ id: 2, name: 'B' }));
    c.add(u({ id: 3, name: 'C' }));
    const names: string[] = [];
    c.each((r) => {
      names.push(r.get('name') as string);
      if (r.get('name') === 'B') return false;
    });
    expect(names).toEqual(['A', 'B']);
  });

  it('find returns first matching item', () => {
    const c = new Collection<Model>();
    c.add(u({ id: 1, name: 'Alice' }));
    c.add(u({ id: 2, name: 'Bob' }));
    const found = c.find((r) => r.get('name') === 'Bob');
    expect(found?.getId()).toBe(2);
  });

  it('sort sorts in place', () => {
    const c = new Collection<Model>();
    c.add(u({ id: 3, name: 'C' }));
    c.add(u({ id: 1, name: 'A' }));
    c.add(u({ id: 2, name: 'B' }));
    c.sort((a, b) => (a.getId() as number) - (b.getId() as number));
    expect(c.getAt(0)!.getId()).toBe(1);
    expect(c.getAt(2)!.getId()).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Store — CRUD
// ═══════════════════════════════════════════════════════════════════════════

describe('Store CRUD', () => {
  let store: InstanceType<typeof Store>;

  beforeEach(() => {
    store = new Store({
      model: User,
      data: [
        { id: 1, name: 'Alice', age: 30, city: 'NYC', active: true },
        { id: 2, name: 'Bob', age: 25, city: 'LA', active: true },
        { id: 3, name: 'Carol', age: 35, city: 'NYC', active: false },
      ],
    });
  });

  it('loads initial data', () => {
    expect(store.getCount()).toBe(3);
  });

  it('getAt returns record by index', () => {
    expect(store.getAt(0)!.get('name')).toBe('Alice');
  });

  it('getById returns record by ID', () => {
    expect(store.getById(2)!.get('name')).toBe('Bob');
  });

  it('getById returns undefined for unknown ID', () => {
    expect(store.getById(99)).toBeUndefined();
  });

  it('indexOf returns correct index', () => {
    const bob = store.getById(2)!;
    expect(store.indexOf(bob)).toBe(1);
  });

  it('contains returns true for existing record', () => {
    expect(store.contains(store.getAt(0)!)).toBe(true);
  });

  it('first and last', () => {
    expect(store.first()!.get('name')).toBe('Alice');
    expect(store.last()!.get('name')).toBe('Carol');
  });

  it('getRange returns a slice', () => {
    const range = store.getRange(0, 2);
    expect(range.length).toBe(2);
    expect(range[0].get('name')).toBe('Alice');
    expect(range[1].get('name')).toBe('Bob');
  });

  it('add appends records', () => {
    const r = u({ id: 4, name: 'Dave', age: 28, city: 'SF', active: true });
    const added = store.add(r);
    expect(added).toEqual([r]);
    expect(store.getCount()).toBe(4);
    expect(store.getAt(3)).toBe(r);
  });

  it('insert at specific index', () => {
    const r = u({ id: 4, name: 'Dave', age: 28, city: 'SF', active: true });
    store.insert(1, r);
    expect(store.getAt(1)).toBe(r);
    expect(store.getCount()).toBe(4);
  });

  it('remove removes records', () => {
    const bob = store.getById(2)!;
    const removed = store.remove(bob);
    expect(removed).toEqual([bob]);
    expect(store.getCount()).toBe(2);
    expect(store.getById(2)).toBeUndefined();
  });

  it('removeAt removes by index', () => {
    const removed = store.removeAt(0);
    expect(removed.length).toBe(1);
    expect(removed[0].get('name')).toBe('Alice');
    expect(store.getCount()).toBe(2);
  });

  it('removeAt with count removes multiple', () => {
    const removed = store.removeAt(0, 2);
    expect(removed.length).toBe(2);
    expect(store.getCount()).toBe(1);
  });

  it('removeAll clears the store', () => {
    store.removeAll();
    expect(store.getCount()).toBe(0);
  });

  it('each iterates all records', () => {
    const names: string[] = [];
    store.each((r) => {
      names.push(r.get('name') as string);
    });
    expect(names).toEqual(['Alice', 'Bob', 'Carol']);
  });

  it('collect returns unique values for a field', () => {
    const cities = store.collect('city');
    expect(cities).toContain('NYC');
    expect(cities).toContain('LA');
    expect(cities.length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Store — Sorting
// ═══════════════════════════════════════════════════════════════════════════

describe('Store Sorting', () => {
  let store: InstanceType<typeof Store>;

  beforeEach(() => {
    store = new Store({
      model: User,
      data: [
        { id: 3, name: 'Carol', age: 35, city: 'NYC', active: false },
        { id: 1, name: 'Alice', age: 30, city: 'NYC', active: true },
        { id: 2, name: 'Bob', age: 25, city: 'LA', active: true },
      ],
    });
  });

  it('sorts by field ascending', () => {
    store.sort('name');
    expect(store.getAt(0)!.get('name')).toBe('Alice');
    expect(store.getAt(1)!.get('name')).toBe('Bob');
    expect(store.getAt(2)!.get('name')).toBe('Carol');
  });

  it('sorts by field descending', () => {
    store.sort('name', 'DESC');
    expect(store.getAt(0)!.get('name')).toBe('Carol');
    expect(store.getAt(2)!.get('name')).toBe('Alice');
  });

  it('sorts by numeric field', () => {
    store.sort('age');
    expect(store.getAt(0)!.get('age')).toBe(25);
    expect(store.getAt(2)!.get('age')).toBe(35);
  });

  it('multi-sort with sorter array', () => {
    store = new Store({
      model: User,
      data: [
        { id: 1, name: 'Alice', age: 30, city: 'NYC', active: true },
        { id: 2, name: 'Bob', age: 25, city: 'NYC', active: true },
        { id: 3, name: 'Carol', age: 25, city: 'LA', active: false },
      ],
    });
    store.sort([
      { property: 'age', direction: 'ASC' },
      { property: 'name', direction: 'ASC' },
    ]);
    expect(store.getAt(0)!.get('name')).toBe('Bob');
    expect(store.getAt(1)!.get('name')).toBe('Carol');
    expect(store.getAt(2)!.get('name')).toBe('Alice');
  });

  it('custom sorterFn', () => {
    store.sort([
      {
        property: 'name',
        direction: 'ASC',
        sorterFn: (a, b) => {
          const an = a.get('name') as string;
          const bn = b.get('name') as string;
          return bn.length - an.length; // sort by name length desc
        },
      },
    ]);
    expect(store.getAt(0)!.get('name')).toBe('Carol');
  });

  it('getSorters returns current sorters', () => {
    store.sort('name');
    const sorters = store.getSorters();
    expect(sorters.length).toBe(1);
    expect(sorters[0].property).toBe('name');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Store — Filtering
// ═══════════════════════════════════════════════════════════════════════════

describe('Store Filtering', () => {
  let store: InstanceType<typeof Store>;

  beforeEach(() => {
    store = new Store({
      model: User,
      data: [
        { id: 1, name: 'Alice', age: 30, city: 'NYC', active: true },
        { id: 2, name: 'Bob', age: 25, city: 'LA', active: true },
        { id: 3, name: 'Carol', age: 35, city: 'NYC', active: false },
        { id: 4, name: 'Dave', age: 28, city: 'SF', active: true },
      ],
    });
  });

  it('filters by field and value (exact match)', () => {
    store.filter('city', 'NYC');
    expect(store.getCount()).toBe(2);
    expect(store.getAt(0)!.get('name')).toBe('Alice');
    expect(store.getAt(1)!.get('name')).toBe('Carol');
  });

  it('clearFilter restores all records', () => {
    store.filter('city', 'NYC');
    expect(store.getCount()).toBe(2);
    store.clearFilter();
    expect(store.getCount()).toBe(4);
  });

  it('filter with operator ">"', () => {
    store.filter([{ property: 'age', value: 28, operator: '>' }]);
    expect(store.getCount()).toBe(2);
    store.each((r) => {
      expect(r.get('age') as number).toBeGreaterThan(28);
    });
  });

  it('filter with operator "<="', () => {
    store.filter([{ property: 'age', value: 28, operator: '<=' }]);
    expect(store.getCount()).toBe(2);
  });

  it('filter with operator "!="', () => {
    store.filter([{ property: 'city', value: 'NYC', operator: '!=' }]);
    expect(store.getCount()).toBe(2);
  });

  it('filter with operator "like" (substring)', () => {
    store.filter([{ property: 'name', value: 'a', operator: 'like' }]);
    // 'Alice', 'Carol', 'Dave' all contain 'a' (case-insensitive by default)
    expect(store.getCount()).toBe(3);
  });

  it('filter with operator "in"', () => {
    store.filter([{ property: 'city', value: ['NYC', 'SF'], operator: 'in' }]);
    expect(store.getCount()).toBe(3);
  });

  it('filter with operator "notin"', () => {
    store.filter([{ property: 'city', value: ['NYC', 'SF'], operator: 'notin' }]);
    expect(store.getCount()).toBe(1);
    expect(store.getAt(0)!.get('city')).toBe('LA');
  });

  it('custom filterFn', () => {
    store.filter([
      {
        property: 'name',
        value: null,
        filterFn: (record) => (record.get('name') as string).length > 3,
      },
    ]);
    expect(store.getCount()).toBe(3); // Alice, Carol, Dave
  });

  it('filter with caseSensitive: true', () => {
    store.filter([{ property: 'name', value: 'alice', operator: 'like', caseSensitive: true }]);
    expect(store.getCount()).toBe(0); // 'Alice' ≠ 'alice' case-sensitive
  });

  it('multiple filters are additive (AND)', () => {
    store.filter([
      { property: 'city', value: 'NYC' },
      { property: 'active', value: true },
    ]);
    expect(store.getCount()).toBe(1);
    expect(store.getAt(0)!.get('name')).toBe('Alice');
  });

  it('getFilters returns current filters', () => {
    store.filter('city', 'NYC');
    expect(store.getFilters().length).toBe(1);
  });

  it('clearFilter with suppressEvent=true does not fire event', () => {
    const spy = vi.fn();
    store.filter('city', 'NYC');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (store as any).on('filter', spy);
    store.clearFilter(true);
    expect(spy).not.toHaveBeenCalled();
  });

  it('filtering preserves unfiltered data', () => {
    store.filter('city', 'NYC');
    expect(store.getCount()).toBe(2);
    expect(store.getTotalCount()).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Store — Grouping
// ═══════════════════════════════════════════════════════════════════════════

describe('Store Grouping', () => {
  let store: InstanceType<typeof Store>;

  beforeEach(() => {
    store = new Store({
      model: User,
      data: [
        { id: 1, name: 'Alice', age: 30, city: 'NYC', active: true },
        { id: 2, name: 'Bob', age: 25, city: 'LA', active: true },
        { id: 3, name: 'Carol', age: 35, city: 'NYC', active: false },
        { id: 4, name: 'Dave', age: 28, city: 'SF', active: true },
      ],
    });
  });

  it('groups by a field', () => {
    store.group('city');
    const groups = store.getGroups();
    expect(groups.length).toBe(3);
    const nycGroup = groups.find((g) => g.name === 'NYC');
    expect(nycGroup).toBeDefined();
    expect(nycGroup!.children.length).toBe(2);
  });

  it('isGrouped returns true when grouped', () => {
    expect(store.isGrouped()).toBe(false);
    store.group('city');
    expect(store.isGrouped()).toBe(true);
  });

  it('clearGrouping removes groups', () => {
    store.group('city');
    store.clearGrouping();
    expect(store.isGrouped()).toBe(false);
    expect(store.getGroups().length).toBe(0);
  });

  it('groups are sorted by group name ascending by default', () => {
    store.group('city');
    const names = store.getGroups().map((g) => g.name);
    expect(names).toEqual(['LA', 'NYC', 'SF']);
  });

  it('group with direction DESC', () => {
    store.group('city', 'DESC');
    const names = store.getGroups().map((g) => g.name);
    expect(names).toEqual(['SF', 'NYC', 'LA']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Store — Events
// ═══════════════════════════════════════════════════════════════════════════

describe('Store Events', () => {
  let store: InstanceType<typeof Store>;

  beforeEach(() => {
    store = new Store({
      model: User,
      data: [{ id: 1, name: 'Alice', age: 30, city: 'NYC', active: true }],
    });
  });

  it('fires "add" when records are added', () => {
    const spy = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (store as any).on('add', spy);
    store.add(u({ id: 2, name: 'Bob', age: 25, city: 'LA', active: true }));
    expect(spy).toHaveBeenCalledOnce();
  });

  it('fires "remove" when records are removed', () => {
    const spy = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (store as any).on('remove', spy);
    store.remove(store.getAt(0)!);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('fires "clear" on removeAll', () => {
    const spy = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (store as any).on('clear', spy);
    store.removeAll();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('removeAll(silent=true) does not fire "clear"', () => {
    const spy = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (store as any).on('clear', spy);
    store.removeAll(true);
    expect(spy).not.toHaveBeenCalled();
  });

  it('fires "sort" when sorted', () => {
    const spy = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (store as any).on('sort', spy);
    store.sort('name');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('fires "filter" when filtered', () => {
    const spy = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (store as any).on('filter', spy);
    store.filter('city', 'NYC');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('fires "groupchange" when grouped', () => {
    const spy = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (store as any).on('groupchange', spy);
    store.group('city');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('fires "datachanged" on add, remove, and removeAll', () => {
    const spy = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (store as any).on('datachanged', spy);
    store.add(u({ id: 2, name: 'Bob', age: 25, city: 'LA', active: true }));
    store.remove(store.getById(2)!);
    store.removeAll();
    expect(spy).toHaveBeenCalledTimes(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Store — Sync tracking
// ═══════════════════════════════════════════════════════════════════════════

describe('Store Sync tracking', () => {
  let store: InstanceType<typeof Store>;

  beforeEach(() => {
    store = new Store({
      model: User,
      data: [
        { id: 1, name: 'Alice', age: 30, city: 'NYC', active: true },
        { id: 2, name: 'Bob', age: 25, city: 'LA', active: true },
      ],
    });
  });

  it('getModifiedRecords returns records with dirty fields', () => {
    store.getById(1)!.set('name', 'Alice2');
    const modified = store.getModifiedRecords();
    expect(modified.length).toBe(1);
    expect(modified[0].getId()).toBe(1);
  });

  it('getNewRecords returns phantom records', () => {
    store.add(u({ name: 'New', age: 20, city: 'XX', active: true }));
    const newRecs = store.getNewRecords();
    expect(newRecs.length).toBe(1);
    expect(newRecs[0].phantom).toBe(true);
  });

  it('getRemovedRecords returns removed records', () => {
    const bob = store.getById(2)!;
    store.remove(bob);
    const removed = store.getRemovedRecords();
    expect(removed.length).toBe(1);
    expect(removed[0]).toBe(bob);
  });

  it('commitChanges commits all modified and clears removed', () => {
    store.getById(1)!.set('name', 'Alice2');
    const bob = store.getById(2)!;
    store.remove(bob);
    store.commitChanges();
    expect(store.getModifiedRecords().length).toBe(0);
    expect(store.getRemovedRecords().length).toBe(0);
    expect(store.getById(1)!.isModified()).toBe(false);
  });

  it('rejectChanges reverts modified and re-adds removed', () => {
    store.getById(1)!.set('name', 'Alice2');
    const bob = store.getById(2)!;
    store.remove(bob);
    store.rejectChanges();
    expect(store.getById(1)!.get('name')).toBe('Alice');
    expect(store.getCount()).toBe(2);
    expect(store.getModifiedRecords().length).toBe(0);
    expect(store.getRemovedRecords().length).toBe(0);
  });
});
