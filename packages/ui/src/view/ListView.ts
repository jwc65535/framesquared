/**
 * @framesquared/ui – ListView
 *
 * A lightweight column-based list view using <table> for alignment.
 * Simpler than a full Grid — no features, plugins, or editing.
 * Supports item events, empty text, and reactive store binding.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Component } from '@framesquared/component';
import type { ComponentConfig } from '@framesquared/component';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface ListColumnConfig {
  text: string;
  dataIndex: string;
  width?: number;
}

export interface ListViewConfig extends ComponentConfig {
  store?: any;
  columns?: ListColumnConfig[];
  emptyText?: string;
}

// ---------------------------------------------------------------------------
// ListView
// ---------------------------------------------------------------------------

export class ListView extends Component {
  static override $className = 'Ext.view.ListView';

  declare private _store: any;
  declare private _columns: ListColumnConfig[];
  declare private _emptyText: string;
  declare private _tableEl: HTMLTableElement | null;
  declare private _tbodyEl: HTMLTableSectionElement | null;

  constructor(config: ListViewConfig = {}) {
    super({ xtype: 'listview', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as ListViewConfig;
    this._store = cfg.store ?? null;
    this._columns = cfg.columns ?? [];
    this._emptyText = cfg.emptyText ?? '';
    this._tableEl = null;
    this._tbodyEl = null;
  }

  protected override afterRender(): void {
    super.afterRender();
    this.el!.classList.add('x-listview');

    this._tableEl = document.createElement('table');
    this._tableEl.classList.add('x-listview-table');
    this._tableEl.style.width = '100%';
    this._tableEl.style.borderCollapse = 'collapse';

    // Thead
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (const col of this._columns) {
      const th = document.createElement('th');
      th.textContent = col.text;
      if (col.width) th.style.width = `${col.width}px`;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    this._tableEl.appendChild(thead);

    // Tbody
    this._tbodyEl = document.createElement('tbody');
    this._tableEl.appendChild(this._tbodyEl);

    this.el!.appendChild(this._tableEl);
    this.renderRows();
    this.bindStoreEvents();
  }

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------

  refresh(): void {
    this.renderRows();
  }

  private renderRows(): void {
    if (!this._tbodyEl) return;
    this._tbodyEl.innerHTML = '';

    const records = this._store?.getRange?.() ?? [];

    if (records.length === 0 && this._emptyText) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = this._columns.length || 1;
      td.classList.add('x-listview-empty');
      td.textContent = this._emptyText;
      tr.appendChild(td);
      this._tbodyEl.appendChild(tr);
      return;
    }

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const tr = document.createElement('tr');
      tr.classList.add('x-listview-row');
      tr.setAttribute('data-rowindex', String(i));

      for (const col of this._columns) {
        const td = document.createElement('td');
        const val = record.get ? record.get(col.dataIndex) : record.data?.[col.dataIndex];
        td.textContent = val === null || val === undefined ? '' : String(val);
        tr.appendChild(td);
      }

      tr.addEventListener('click', (e) => {
        this.fire('itemclick', this, record, tr, i, e);
      });

      tr.addEventListener('dblclick', (e) => {
        this.fire('itemdblclick', this, record, tr, i, e);
      });

      this._tbodyEl.appendChild(tr);
    }
  }

  // -----------------------------------------------------------------------
  // Store binding
  // -----------------------------------------------------------------------

  private bindStoreEvents(): void {
    if (!this._store?.on) return;
    this._store.on('datachanged', () => this.renderRows());
    this._store.on('add', () => this.renderRows());
    this._store.on('remove', () => this.renderRows());
  }
}
