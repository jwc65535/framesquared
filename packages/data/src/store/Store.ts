/**
 * @framesquared/data – Store
 *
 * A client-side collection of Model records with sorting, filtering,
 * grouping, events, and sync/change tracking.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Base, Observable } from '@framesquared/core';
import type { Model } from '../Model.js';
import { Collection } from './Collection.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface Sorter {
  property: string;
  direction: 'ASC' | 'DESC';
  sorterFn?: (a: Model, b: Model) => number;
}

export type FilterOperator = '=' | '!=' | '<' | '<=' | '>' | '>=' | 'like' | 'in' | 'notin';

export interface Filter {
  property: string;
  value: unknown;
  operator?: FilterOperator;
  filterFn?: (record: Model) => boolean;
  anyMatch?: boolean;
  caseSensitive?: boolean;
}

export interface Group {
  name: string;
  children: Model[];
}

export interface StoreConfig {
  model: typeof Model;
  data?: Record<string, unknown>[];
}

// ---------------------------------------------------------------------------
// Observable bootstrap — install mixin once on Store.prototype
// ---------------------------------------------------------------------------

const ObservableMixin: typeof Base = Observable;

function ensureObservable(instance: Store): void {
  const proto = ObservableMixin.prototype;
  for (const name of Object.getOwnPropertyNames(proto)) {
    if (name === 'constructor') continue;
    if (name in instance) continue;
    const desc = Object.getOwnPropertyDescriptor(proto, name);
    if (desc && typeof desc.value === 'function') {
      (instance as any)[name] = desc.value.bind(instance);
    }
  }
}

// ---------------------------------------------------------------------------
// Filter matching
// ---------------------------------------------------------------------------

function matchFilter(record: Model, f: Filter): boolean {
  if (f.filterFn) return f.filterFn(record);

  const fieldValue = record.get(f.property);
  const filterValue = f.value;
  const op = f.operator ?? '=';
  const ci = !(f.caseSensitive ?? false);

  switch (op) {
    case '=':
      return fieldValue === filterValue;
    case '!=':
      return fieldValue !== filterValue;
    case '<':
      return (fieldValue as number) < (filterValue as number);
    case '<=':
      return (fieldValue as number) <= (filterValue as number);
    case '>':
      return (fieldValue as number) > (filterValue as number);
    case '>=':
      return (fieldValue as number) >= (filterValue as number);
    case 'like': {
      const sv = ci ? String(fieldValue).toLowerCase() : String(fieldValue);
      const fv = ci ? String(filterValue).toLowerCase() : String(filterValue);
      return sv.includes(fv);
    }
    case 'in':
      return Array.isArray(filterValue) && filterValue.includes(fieldValue);
    case 'notin':
      return Array.isArray(filterValue) && !filterValue.includes(fieldValue);
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Sorter comparator builder
// ---------------------------------------------------------------------------

function buildComparator(sorters: Sorter[]): (a: Model, b: Model) => number {
  return (a: Model, b: Model) => {
    for (const sorter of sorters) {
      if (sorter.sorterFn) {
        const result = sorter.sorterFn(a, b);
        if (result !== 0) return result;
        continue;
      }
      const va = a.get(sorter.property) as string | number;
      const vb = b.get(sorter.property) as string | number;
      const dir = sorter.direction === 'DESC' ? -1 : 1;
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
    }
    return 0;
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export class Store extends Base {
  static override $className = 'Ext.data.Store';

  private ModelClass: typeof Model;
  private data: Collection<Model>;
  private allData: Collection<Model>; // unfiltered snapshot
  private currentSorters: Sorter[] = [];
  private currentFilters: Filter[] = [];
  private groupField: string | null = null;
  private groupDirection: 'ASC' | 'DESC' = 'ASC';
  private cachedGroups: Group[] | null = null;
  private removedRecords: Model[] = [];

  // Observable state (populated by ensureObservable)
  $destroyHooks: (() => void)[] = [];

  constructor(config: StoreConfig) {
    super();
    ensureObservable(this);

    this.ModelClass = config.model;
    this.data = new Collection<Model>((r) => r.getId());
    this.allData = new Collection<Model>((r) => r.getId());

    if (config.data) {
      this.loadData(config.data);
    }
  }

  // -----------------------------------------------------------------------
  // Data loading
  // -----------------------------------------------------------------------

  private loadData(rawRecords: Record<string, unknown>[]): void {
    for (const raw of rawRecords) {
      const record = this.ModelClass.create(raw);
      this.data.add(record);
      this.allData.add(record);
    }
  }

  // -----------------------------------------------------------------------
  // CRUD
  // -----------------------------------------------------------------------

  add(...records: Model[]): Model[] {
    for (const record of records) {
      this.data.add(record);
      this.allData.add(record);
    }
    this.invalidateGroups();
    this.fire('add', this, records);
    this.fire('datachanged', this);
    return records;
  }

  insert(index: number, ...records: Model[]): Model[] {
    for (let i = 0; i < records.length; i++) {
      this.data.insert(index + i, records[i]);
      this.allData.add(records[i]);
    }
    this.invalidateGroups();
    this.fire('add', this, records, index);
    this.fire('datachanged', this);
    return records;
  }

  remove(...records: Model[]): Model[] {
    const removed: Model[] = [];
    for (const record of records) {
      if (this.data.remove(record)) {
        this.allData.remove(record);
        removed.push(record);
        if (!record.phantom) {
          this.removedRecords.push(record);
        }
      }
    }
    if (removed.length > 0) {
      this.invalidateGroups();
      this.fire('remove', this, removed);
      this.fire('datachanged', this);
    }
    return removed;
  }

  removeAt(index: number, count = 1): Model[] {
    const removed = this.data.removeAt(index, count);
    for (const record of removed) {
      this.allData.remove(record);
      if (!record.phantom) {
        this.removedRecords.push(record);
      }
    }
    if (removed.length > 0) {
      this.invalidateGroups();
      this.fire('remove', this, removed);
      this.fire('datachanged', this);
    }
    return removed;
  }

  removeAll(silent?: boolean): void {
    this.data.clear();
    this.allData.clear();
    this.invalidateGroups();
    if (!silent) {
      this.fire('clear', this);
      this.fire('datachanged', this);
    }
  }

  // -----------------------------------------------------------------------
  // Lookup
  // -----------------------------------------------------------------------

  getAt(index: number): Model | undefined {
    return this.data.getAt(index);
  }

  getById(id: string | number): Model | undefined {
    return this.data.getByKey(id);
  }

  getRange(start?: number, end?: number): Model[] {
    return this.data.getRange(start, end);
  }

  getCount(): number {
    return this.data.getCount();
  }

  getTotalCount(): number {
    return this.allData.getCount();
  }

  indexOf(record: Model): number {
    return this.data.indexOf(record);
  }

  contains(record: Model): boolean {
    return this.data.contains(record);
  }

  first(): Model | undefined {
    return this.data.first();
  }

  last(): Model | undefined {
    return this.data.last();
  }

  each(fn: (record: Model, index: number) => boolean | undefined): void {
    this.data.each(fn);
  }

  collect(fieldName: string): unknown[] {
    const seen = new Set<unknown>();
    this.data.each((r) => {
      seen.add(r.get(fieldName));
    });
    return [...seen];
  }

  getData(): Collection<Model> {
    return this.data;
  }

  // -----------------------------------------------------------------------
  // Sorting
  // -----------------------------------------------------------------------

  sort(fieldOrSorters?: string | Sorter[], direction: 'ASC' | 'DESC' = 'ASC'): void {
    if (typeof fieldOrSorters === 'string') {
      this.currentSorters = [{ property: fieldOrSorters, direction }];
    } else if (Array.isArray(fieldOrSorters)) {
      this.currentSorters = fieldOrSorters;
    }

    if (this.currentSorters.length > 0) {
      this.data.sort(buildComparator(this.currentSorters));
    }
    this.invalidateGroups();
    this.fire('sort', this, this.currentSorters);
  }

  getSorters(): Sorter[] {
    return [...this.currentSorters];
  }

  // -----------------------------------------------------------------------
  // Filtering
  // -----------------------------------------------------------------------

  filter(fieldOrFilters: string | Filter[], value?: unknown): void {
    if (typeof fieldOrFilters === 'string') {
      this.currentFilters = [{ property: fieldOrFilters, value }];
    } else {
      this.currentFilters = fieldOrFilters;
    }
    this.applyFilters();
    this.fire('filter', this, this.currentFilters);
  }

  clearFilter(suppressEvent?: boolean): void {
    this.currentFilters = [];
    this.applyFilters();
    if (!suppressEvent) {
      this.fire('filter', this, []);
    }
  }

  getFilters(): Filter[] {
    return [...this.currentFilters];
  }

  private applyFilters(): void {
    if (this.currentFilters.length === 0) {
      // Restore all data
      this.data = new Collection<Model>((r) => r.getId());
      this.allData.each((r) => this.data.add(r));
    } else {
      this.data = new Collection<Model>((r) => r.getId());
      this.allData.each((r) => {
        const passes = this.currentFilters.every((f) => matchFilter(r, f));
        if (passes) this.data.add(r);
      });
    }

    // Re-apply sort if active
    if (this.currentSorters.length > 0) {
      this.data.sort(buildComparator(this.currentSorters));
    }

    this.invalidateGroups();
  }

  // -----------------------------------------------------------------------
  // Grouping
  // -----------------------------------------------------------------------

  group(field: string, direction: 'ASC' | 'DESC' = 'ASC'): void {
    this.groupField = field;
    this.groupDirection = direction;
    this.invalidateGroups();
    this.fire('groupchange', this, field, direction);
  }

  clearGrouping(): void {
    this.groupField = null;
    this.cachedGroups = null;
    this.fire('groupchange', this, null, null);
  }

  isGrouped(): boolean {
    return this.groupField !== null;
  }

  getGroups(): Group[] {
    if (!this.groupField) return [];
    if (this.cachedGroups) return this.cachedGroups;

    const map = new Map<string, Model[]>();
    this.data.each((r) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const key = String(r.get(this.groupField!) ?? '');
      if (!map.has(key)) map.set(key, []);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      map.get(key)!.push(r);
    });

    const groups = [...map.entries()].map(([name, children]) => ({ name, children }));
    const dir = this.groupDirection === 'DESC' ? -1 : 1;
    groups.sort((a, b) => {
      if (a.name < b.name) return -1 * dir;
      if (a.name > b.name) return 1 * dir;
      return 0;
    });

    this.cachedGroups = groups;
    return groups;
  }

  private invalidateGroups(): void {
    this.cachedGroups = null;
  }

  // -----------------------------------------------------------------------
  // Sync / change tracking
  // -----------------------------------------------------------------------

  getModifiedRecords(): Model[] {
    const result: Model[] = [];
    this.data.each((r) => {
      if (r.isModified()) result.push(r);
    });
    return result;
  }

  getNewRecords(): Model[] {
    const result: Model[] = [];
    this.data.each((r) => {
      if (r.phantom) result.push(r);
    });
    return result;
  }

  getRemovedRecords(): Model[] {
    return [...this.removedRecords];
  }

  commitChanges(): void {
    this.data.each((r) => {
      if (r.isModified()) r.commit(true);
    });
    this.removedRecords.length = 0;
  }

  rejectChanges(): void {
    // Revert modified records
    this.data.each((r) => {
      if (r.isModified()) r.reject(true);
    });

    // Re-add removed records
    for (const record of this.removedRecords) {
      this.data.add(record);
      this.allData.add(record);
    }
    this.removedRecords.length = 0;
    this.invalidateGroups();
  }

  // -----------------------------------------------------------------------
  // Event helper
  // -----------------------------------------------------------------------

  private fire(eventName: string, ...args: unknown[]): void {
    if (typeof (this as any).fireEvent === 'function') {
      (this as any).fireEvent(eventName, ...args);
    }
  }
}
