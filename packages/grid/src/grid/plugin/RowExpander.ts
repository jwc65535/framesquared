/**
 * @framesquared/grid – RowExpander plugin
 *
 * Adds an expand button to each row.  Clicking toggles a body
 * row below with custom content.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface RowExpanderConfig {
  rowBodyTpl: (record: any) => string;
  singleExpand?: boolean;
}

export class RowExpander {
  private grid: any = null;
  private rowBodyTpl: (record: any) => string;
  private singleExpand: boolean;
  private expandedRows = new Set<number>();

  constructor(config: RowExpanderConfig) {
    this.rowBodyTpl = config.rowBodyTpl;
    this.singleExpand = config.singleExpand ?? false;
  }

  init(grid: any): void {
    this.grid = grid;
    this.addExpanders();
  }

  private addExpanders(): void {
    const view = this.grid?.getView?.();
    if (!view) return;
    const table = view.getTable?.();
    if (!table) return;

    const store = this.grid.getStore();
    const records = store.getRange();
    const columns = this.grid.getColumns();
    const rows = table.querySelectorAll('tbody tr.x-grid-row');

    for (let i = 0; i < rows.length && i < records.length; i++) {
      const row = rows[i] as HTMLElement;
      const record = records[i];

      // Insert expander cell at beginning
      const expanderTd = document.createElement('td');
      expanderTd.classList.add('x-grid-cell');
      const btn = document.createElement('span');
      btn.classList.add('x-grid-row-expander');
      btn.textContent = '+';
      btn.style.cursor = 'pointer';
      expanderTd.appendChild(btn);
      row.insertBefore(expanderTd, row.firstChild);

      btn.addEventListener('click', () => {
        this.toggle(i, record, row, columns.length + 1);
      });
    }
  }

  private toggle(rowIndex: number, record: any, row: HTMLElement, colSpan: number): void {
    if (this.expandedRows.has(rowIndex)) {
      this.collapseRow(rowIndex, row);
    } else {
      if (this.singleExpand) this.collapseAll();
      this.expandRow(rowIndex, record, row, colSpan);
    }
  }

  private expandRow(rowIndex: number, record: any, row: HTMLElement, colSpan: number): void {
    this.expandedRows.add(rowIndex);
    const bodyRow = document.createElement('tr');
    bodyRow.classList.add('x-grid-rowexpand-body');
    bodyRow.setAttribute('data-expand-row', String(rowIndex));
    const td = document.createElement('td');
    td.colSpan = colSpan;
    td.innerHTML = this.rowBodyTpl(record);
    bodyRow.appendChild(td);
    row.after(bodyRow);
  }

  private collapseRow(rowIndex: number, _row: HTMLElement): void {
    this.expandedRows.delete(rowIndex);
    const table = this.grid?.getView?.()?.getTable?.();
    if (!table) return;
    const bodyRow = table.querySelector(`tr[data-expand-row="${rowIndex}"]`);
    bodyRow?.remove();
  }

  private collapseAll(): void {
    const table = this.grid?.getView?.()?.getTable?.();
    if (!table) return;
    for (const idx of this.expandedRows) {
      const bodyRow = table.querySelector(`tr[data-expand-row="${idx}"]`);
      bodyRow?.remove();
    }
    this.expandedRows.clear();
  }
}
