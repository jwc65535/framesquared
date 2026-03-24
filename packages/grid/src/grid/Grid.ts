/**
 * @framesquared/grid – Grid
 *
 * The main grid panel.  Extends Panel to display tabular data from
 * a Store with configurable columns, sorting, column visibility,
 * row striping, and item events.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Panel } from '@framesquared/ui';
import type { PanelConfig } from '@framesquared/ui';
import { Column, createColumn } from './column/Column.js';
import type { ColumnConfig } from './column/Column.js';
import { GridView } from './GridView.js';
import type { GridStore } from './GridStore.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface GridConfig extends PanelConfig {
  store?: GridStore;
  columns?: ColumnConfig[];
  sortableColumns?: boolean;
  enableColumnHide?: boolean;
  enableColumnResize?: boolean;
  emptyText?: string;
  scroll?: 'both' | 'horizontal' | 'vertical' | 'none';
}

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

export class Grid extends Panel {
  static override $className = 'Ext.grid.Grid';

  declare _store: GridStore | null;
  declare private _columns: Column[];
  declare private _gridView: GridView | null;
  declare private _sortableColumns: boolean;
  declare private _sortDirection: 'ASC' | 'DESC';
  declare private _sortColumnIndex: number;

  constructor(config: GridConfig = {}) {
    super({ xtype: 'grid', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as GridConfig;
    this._store = cfg.store ?? null;
    this._columns = (cfg.columns ?? []).map(c => c instanceof Column ? c : createColumn(c));
    this._gridView = null;
    this._sortableColumns = cfg.sortableColumns ?? true;
    this._sortDirection = 'ASC';
    this._sortColumnIndex = -1;
  }

  protected override afterRender(): void {
    super.afterRender();
    const cfg = this._config as GridConfig;
    this.el!.classList.add('x-grid');

    // Create the grid view (requires a store)
    if (!this._store) return;

    this._gridView = new GridView({
      store: this._store,
      columns: this._columns,
      emptyText: cfg.emptyText,
    });

    // Wire item events
    this._gridView.onItemClick = (record, rowIndex, event) => {
      this.fire('itemclick', this, record, rowIndex, event);
    };
    this._gridView.onItemDblClick = (record, rowIndex, event) => {
      this.fire('itemdblclick', this, record, rowIndex, event);
    };

    // Render table into panel body
    const body = this.getBodyEl();
    const table = this._gridView.render();
    body.appendChild(table);

    // Setup header click for sorting
    if (this._sortableColumns) {
      this.setupSortableHeaders();
    }

    // Store event binding
    if (this._store?.on) {
      this._store.on('datachanged', () => this.onStoreDataChanged());
      this._store.on('sort', () => this.onStoreDataChanged());
      this._store.on('filter', () => this.onStoreDataChanged());
    }
  }

  // -----------------------------------------------------------------------
  // Sorting
  // -----------------------------------------------------------------------

  private setupSortableHeaders(): void {
    const ths = this._gridView!.headerContainer.getThElements();
    for (let i = 0; i < ths.length; i++) {
      const col = this._columns[i];
      if (!col.sortable) continue;

      ths[i].style.cursor = 'pointer';
      ths[i].addEventListener('click', () => {
        this.onHeaderClick(i);
      });
    }
  }

  private onHeaderClick(colIndex: number): void {
    const col = this._columns[colIndex];
    if (!col.sortable || !col.dataIndex) return;

    // Toggle direction
    if (this._sortColumnIndex === colIndex) {
      this._sortDirection = this._sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this._sortDirection = 'ASC';
      this._sortColumnIndex = colIndex;
    }

    this._gridView!.headerContainer.setSortIndicator(colIndex, this._sortDirection);

    if (this._store?.sort) {
      this._store.sort(col.dataIndex, this._sortDirection);
    }
  }

  // -----------------------------------------------------------------------
  // Column visibility
  // -----------------------------------------------------------------------

  hideColumn(index: number): void {
    if (this._gridView) {
      this._gridView.setColumnHidden(index, true);
    }
  }

  showColumn(index: number): void {
    if (this._gridView) {
      this._gridView.setColumnHidden(index, false);
    }
  }

  // -----------------------------------------------------------------------
  // Store data changed
  // -----------------------------------------------------------------------

  private onStoreDataChanged(): void {
    if (this._gridView) {
      this._gridView.refresh();
    }
  }

  // -----------------------------------------------------------------------
  // Accessors
  // -----------------------------------------------------------------------

  getStore(): GridStore | null {
    return this._store;
  }

  getColumns(): Column[] {
    return [...this._columns];
  }

  getView(): GridView | null {
    return this._gridView;
  }
}
