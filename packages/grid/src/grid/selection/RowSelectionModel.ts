/**
 * @framesquared/grid – RowSelectionModel
 *
 * Row-level selection model supporting SINGLE, SIMPLE, and MULTI modes.
 * Optional checkbox column for visual selection.
 *
 * Works with any Grid that implements getStore()/getView() and any Store
 * that implements the GridStore interface.
 */

import type { GridStore, GridRecord } from '../GridStore.js';
import type { GridView } from '../GridView.js';

export interface RowSelectionModelConfig {
  mode?: 'SINGLE' | 'SIMPLE' | 'MULTI';
  checkboxSelect?: boolean;
}

export interface SelectableGrid {
  getStore(): GridStore | null;
  getView(): GridView | null;
}

export class RowSelectionModel {
  private grid: SelectableGrid | null = null;
  private mode: string;
  private checkboxSelect: boolean;
  private selected = new Set<GridRecord>();
  private listeners: Record<string, Function[]> = {};

  constructor(config: RowSelectionModelConfig = {}) {
    this.mode = config.mode ?? 'SINGLE';
    this.checkboxSelect = config.checkboxSelect ?? false;
  }

  on(event: string, fn: Function): void {
    (this.listeners[event] ??= []).push(fn);
  }

  private fire(event: string, ...args: unknown[]): void {
    (this.listeners[event] ?? []).forEach(fn => fn(...args));
  }

  init(grid: SelectableGrid): void {
    this.grid = grid;
    this.attachRowListeners();
    if (this.checkboxSelect) this.addCheckboxColumn();
  }

  // -----------------------------------------------------------------------
  // Selection API
  // -----------------------------------------------------------------------

  select(record: GridRecord, keepExisting = false): void {
    if (!record) return;
    this.fire('beforeselect', this, record);

    if (this.mode === 'SINGLE') {
      for (const r of this.selected) {
        if (r !== record) this.doDeselect(r);
      }
      if (this.selected.has(record)) return;
      this.doSelect(record);
    } else if (this.mode === 'SIMPLE') {
      if (this.selected.has(record)) {
        this.doDeselect(record);
      } else {
        this.doSelect(record);
      }
    } else {
      // MULTI
      if (keepExisting) {
        if (this.selected.has(record)) {
          this.doDeselect(record);
          return;
        }
        this.doSelect(record);
      } else {
        for (const r of this.selected) {
          if (r !== record) this.doDeselect(r);
        }
        this.doSelect(record);
      }
    }
  }

  deselect(record: GridRecord): void {
    if (this.selected.has(record)) {
      this.doDeselect(record);
    }
  }

  selectRange(start: GridRecord, end: GridRecord): void {
    const store = this.grid?.getStore();
    if (!store) return;
    const records = store.getRange();
    const startIdx = records.indexOf(start);
    const endIdx = records.indexOf(end);
    if (startIdx < 0 || endIdx < 0) return;

    const low = Math.min(startIdx, endIdx);
    const high = Math.max(startIdx, endIdx);
    for (let i = low; i <= high; i++) {
      this.doSelect(records[i]);
    }
  }

  selectAll(): void {
    const store = this.grid?.getStore();
    if (!store) return;
    for (const rec of store.getRange()) {
      this.doSelect(rec);
    }
  }

  deselectAll(): void {
    for (const rec of [...this.selected]) {
      this.doDeselect(rec);
    }
  }

  getSelection(): GridRecord[] {
    return [...this.selected];
  }

  isSelected(record: GridRecord): boolean {
    return this.selected.has(record);
  }

  getCount(): number {
    return this.selected.size;
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private doSelect(record: GridRecord): void {
    if (this.selected.has(record)) return;
    this.selected.add(record);
    this.updateRowClass(record, true);
    this.fire('select', this, record);
    this.fire('selectionchange', this, this.getSelection());
  }

  private doDeselect(record: GridRecord): void {
    this.selected.delete(record);
    this.updateRowClass(record, false);
    this.fire('deselect', this, record);
    this.fire('selectionchange', this, this.getSelection());
  }

  private updateRowClass(record: GridRecord, selected: boolean): void {
    const store = this.grid?.getStore();
    if (!store) return;
    const records = store.getRange();
    const idx = records.indexOf(record);
    if (idx < 0) return;

    const view = this.grid!.getView();
    const table = view?.getTable();
    if (!table) return;
    const row = table.querySelector(`tbody tr[data-rowindex="${idx}"]`) as HTMLElement;
    if (row) {
      row.classList.toggle('x-grid-row-selected', selected);
    }
  }

  // -----------------------------------------------------------------------
  // Row click listener
  // -----------------------------------------------------------------------

  private attachRowListeners(): void {
    const view = this.grid?.getView();
    const table = view?.getTable();
    if (!table) return;

    table.addEventListener('click', (e: MouseEvent) => {
      const tr = (e.target as HTMLElement).closest('tr.x-grid-row') as HTMLElement;
      if (!tr) return;

      if ((e.target as HTMLElement).closest('.x-grid-row-checker')) return;

      const rowIdx = parseInt(tr.getAttribute('data-rowindex') ?? '-1', 10);
      const store = this.grid!.getStore();
      if (!store) return;
      const record = store.getAt(rowIdx);
      if (!record) return;

      if (this.mode === 'MULTI' && e.ctrlKey) {
        this.select(record, true);
      } else if (this.mode === 'MULTI' && e.shiftKey) {
        const sel = this.getSelection();
        const anchor = sel.length > 0 ? sel[sel.length - 1] : record;
        this.deselectAll();
        this.selectRange(anchor, record);
      } else if (this.mode === 'SIMPLE') {
        this.select(record);
      } else {
        this.select(record);
      }
    });
  }

  // -----------------------------------------------------------------------
  // Checkbox column
  // -----------------------------------------------------------------------

  private addCheckboxColumn(): void {
    const view = this.grid?.getView();
    const table = view?.getTable();
    if (!table) return;

    const store = this.grid!.getStore();
    if (!store) return;
    const records = store.getRange();

    // Header checkbox
    const thead = table.querySelector('thead tr');
    if (thead) {
      const th = document.createElement('th');
      th.classList.add('x-column-header');
      const headerCb = document.createElement('input');
      headerCb.type = 'checkbox';
      headerCb.classList.add('x-grid-header-checker');
      headerCb.addEventListener('click', () => {
        if (headerCb.checked) this.selectAll();
        else this.deselectAll();
      });
      th.appendChild(headerCb);
      thead.insertBefore(th, thead.firstChild);
    }

    // Row checkboxes
    const rows = table.querySelectorAll('tbody tr.x-grid-row');
    for (let i = 0; i < rows.length && i < records.length; i++) {
      const row = rows[i];
      const record = records[i];
      const td = document.createElement('td');
      td.classList.add('x-grid-cell');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.classList.add('x-grid-row-checker');
      cb.addEventListener('click', (e) => {
        e.stopPropagation();
        if (cb.checked) {
          this.doSelect(record);
        } else {
          this.doDeselect(record);
        }
      });
      td.appendChild(cb);
      row.insertBefore(td, row.firstChild);
    }
  }
}
