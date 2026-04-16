/**
 * @framesquared/grid – RowBody feature
 *
 * Adds a static body row below each data row with custom content.
 * Provide either `rowBodyTpl` (XTemplate or string) for template-based
 * rendering, or `getAdditionalData` for a callback that also controls
 * the body row's CSS class.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { XTemplate } from '@framesquared/component';

export interface RowBodyConfig {
  rowBodyTpl?: XTemplate | string;
  getAdditionalData?: (
    data: any,
    rowIndex: number,
    record: any,
  ) => { rowBody: string; rowBodyCls?: string };
}

export class RowBody {
  private grid: any = null;
  private _tpl: XTemplate | null;
  private getAdditionalData: RowBodyConfig['getAdditionalData'];

  constructor(config: RowBodyConfig) {
    if (config.rowBodyTpl instanceof XTemplate) {
      this._tpl = config.rowBodyTpl;
    } else if (typeof config.rowBodyTpl === 'string') {
      this._tpl = new XTemplate(config.rowBodyTpl);
    } else {
      this._tpl = null;
    }
    this.getAdditionalData = config.getAdditionalData;
  }

  init(grid: any): void {
    this.grid = grid;
    this.addRowBodies();
  }

  private addRowBodies(): void {
    const view = this.grid?.getView?.();
    if (!view) return;
    const table = view.getTable?.();
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const store = this.grid.getStore();
    const records = store.getRange();
    const columns = this.grid.getColumns();
    const rows = Array.from(tbody.querySelectorAll('tr.x-grid-row')) as HTMLElement[];

    for (let i = 0; i < rows.length && i < records.length; i++) {
      const rec = records[i];
      const bodyRow = document.createElement('tr');
      bodyRow.classList.add('x-grid-rowbody');
      const td = document.createElement('td');
      td.colSpan = columns.length;

      if (this._tpl) {
        const data = rec.getData?.() ?? rec.data ?? rec;
        td.innerHTML = this._tpl.apply(data);
      } else if (this.getAdditionalData) {
        const result = this.getAdditionalData(rec.data, i, rec);
        if (result.rowBodyCls) bodyRow.classList.add(result.rowBodyCls);
        td.innerHTML = result.rowBody;
      }

      bodyRow.appendChild(td);
      rows[i].after(bodyRow);
    }
  }
}
