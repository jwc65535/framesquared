/**
 * @framesquared/grid – GridView
 *
 * Renders the grid body using a <table> with <thead> and <tbody>.
 * Manages row rendering, striping, cell content, and item events.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Column } from './column/Column.js';
import { ActionColumn } from './column/Column.js';
import { HeaderContainer } from './HeaderContainer.js';
import type { GridStore, GridRecord } from './GridStore.js';

export interface GridViewConfig {
  store: GridStore;
  columns: Column[];
  emptyText?: string;
}

export class GridView {
  private store: GridStore;
  private columns: Column[];
  private emptyText: string;
  private tableEl: HTMLTableElement | null = null;
  private tbodyEl: HTMLTableSectionElement | null = null;
  private theadEl: HTMLTableSectionElement | null = null;
  headerContainer: HeaderContainer;

  /** Event listeners set by Grid */
  onItemClick?: (record: GridRecord, rowIndex: number, event: Event) => void;
  onItemDblClick?: (record: GridRecord, rowIndex: number, event: Event) => void;

  /** Set by RowSelectionModel so selection classes survive refresh() */
  isSelected?: (record: GridRecord) => boolean;

  constructor(config: GridViewConfig) {
    this.store = config.store;
    this.columns = config.columns;
    this.emptyText = config.emptyText ?? '';
    this.headerContainer = new HeaderContainer({ columns: this.columns });
  }

  render(): HTMLTableElement {
    this.tableEl = document.createElement('table');
    this.tableEl.classList.add('x-grid-table');
    this.tableEl.style.width = '100%';
    this.tableEl.style.borderCollapse = 'collapse';

    // Thead
    this.theadEl = document.createElement('thead');
    const headerRow = this.headerContainer.render();
    this.theadEl.appendChild(headerRow);
    this.tableEl.appendChild(this.theadEl);

    // Tbody
    this.tbodyEl = document.createElement('tbody');
    this.tableEl.appendChild(this.tbodyEl);

    this.renderRows();
    return this.tableEl;
  }

  refresh(): void {
    this.renderRows();
  }

  private renderRows(): void {
    if (!this.tbodyEl) return;
    this.tbodyEl.innerHTML = '';

    const records = this.store.getRange();

    if (records.length === 0 && this.emptyText) {
      const emptyRow = document.createElement('tr');
      const emptyTd = document.createElement('td');
      emptyTd.colSpan = this.columns.length;
      emptyTd.classList.add('x-grid-empty');
      emptyTd.textContent = this.emptyText;
      emptyRow.appendChild(emptyTd);
      this.tbodyEl.appendChild(emptyRow);
      return;
    }

    for (let rowIdx = 0; rowIdx < records.length; rowIdx++) {
      const record = records[rowIdx];
      const tr = this.createRow(record, rowIdx);
      this.tbodyEl.appendChild(tr);
    }
  }

  private createRow(record: GridRecord, rowIndex: number): HTMLTableRowElement {
    const tr = document.createElement('tr');
    tr.classList.add('x-grid-row');
    if (rowIndex % 2 === 1) tr.classList.add('x-grid-row-alt');
    if (this.isSelected?.(record)) tr.classList.add('x-grid-row-selected');
    tr.setAttribute('data-rowindex', String(rowIndex));

    for (let colIdx = 0; colIdx < this.columns.length; colIdx++) {
      const col = this.columns[colIdx];
      const td = document.createElement('td');
      td.classList.add('x-grid-cell');

      if (col.hidden) td.style.display = 'none';
      if (col.align) td.style.textAlign = col.align;
      if (col.config.tdCls) td.classList.add(col.config.tdCls);

      const value = col.getCellValue(record);
      const html = col.renderCellHtml(value, {}, record, rowIndex, colIdx);
      td.innerHTML = html;

      // Action column click delegation
      if (col instanceof ActionColumn) {
        td.addEventListener('click', (e) => {
          const target = (e.target as HTMLElement).closest('.x-action-col-icon') as HTMLElement | null;
          if (!target) return;
          const actionIdx = parseInt(target.getAttribute('data-action') ?? '0', 10);
          const action = col.actions[actionIdx];
          if (action?.handler) action.handler(record, rowIndex);
        });
      }

      // CheckColumn click
      if (col.config.xtype === 'checkcolumn') {
        const input = td.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
        if (input) {
          input.addEventListener('change', () => {
            record.set?.(col.dataIndex, input.checked);
          });
        }
      }

      tr.appendChild(td);
    }

    // Item events
    tr.addEventListener('click', (e) => {
      this.onItemClick?.(record, rowIndex, e);
    });
    tr.addEventListener('dblclick', (e) => {
      this.onItemDblClick?.(record, rowIndex, e);
    });

    return tr;
  }

  setColumnHidden(index: number, hidden: boolean): void {
    this.headerContainer.setColumnHidden(index, hidden);
    // Also hide/show cells in existing rows
    if (this.tbodyEl) {
      for (const row of this.tbodyEl.rows) {
        if (row.cells[index]) {
          (row.cells[index] as HTMLElement).style.display = hidden ? 'none' : '';
        }
      }
    }
  }

  getTable(): HTMLTableElement | null {
    return this.tableEl;
  }
}
