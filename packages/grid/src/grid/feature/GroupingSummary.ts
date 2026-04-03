/**
 * @framesquared/grid – GroupingSummary feature
 *
 * Combines grouping with per-group summary rows.  Each group gets
 * a header and a summary row at the bottom.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { SummaryType } from './Summary.js';

export interface GroupingSummaryConfig {
  groupField: string;
  summaryTypes: Record<string, SummaryType>;
  startCollapsed?: boolean;
}

export class GroupingSummary {
  private grid: any = null;
  private groupField: string;
  private summaryTypes: Record<string, SummaryType>;

  constructor(config: GroupingSummaryConfig) {
    this.groupField = config.groupField;
    this.summaryTypes = config.summaryTypes;
  }

  init(grid: any): void {
    this.grid = grid;
    this.rebuild();
  }

  private rebuild(): void {
    const view = this.grid?.getView?.();
    if (!view) return;
    const table = view.getTable?.();
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const store = this.grid.getStore();
    const records = store.getRange();
    const columns = this.grid.getColumns();
    const groups = this.groupRecords(records);

    tbody.innerHTML = '';

    for (const [groupValue, groupRecords] of groups) {
      const groupEl = document.createElement('tbody');
      groupEl.classList.add('x-grid-group');
      groupEl.setAttribute('data-group', groupValue);

      // Group header
      const headerRow = document.createElement('tr');
      headerRow.classList.add('x-grid-group-hd');
      const headerTd = document.createElement('td');
      headerTd.colSpan = columns.length;
      headerTd.textContent = groupValue;
      headerRow.appendChild(headerTd);
      groupEl.appendChild(headerRow);

      // Data rows
      for (let i = 0; i < groupRecords.length; i++) {
        const rec = groupRecords[i];
        const tr = document.createElement('tr');
        tr.classList.add('x-grid-row');
        for (let ci = 0; ci < columns.length; ci++) {
          const col = columns[ci];
          const td = document.createElement('td');
          td.classList.add('x-grid-cell');
          td.innerHTML = col.renderCellHtml(col.getCellValue(rec), {}, rec, i, ci);
          tr.appendChild(td);
        }
        groupEl.appendChild(tr);
      }

      // Group summary row
      const sumRow = document.createElement('tr');
      sumRow.classList.add('x-grid-group-summary');
      for (const col of columns) {
        const td = document.createElement('td');
        td.classList.add('x-grid-cell');
        const type = this.summaryTypes[col.dataIndex];
        if (type) td.textContent = String(this.calculate(groupRecords, col.dataIndex, type));
        sumRow.appendChild(td);
      }
      groupEl.appendChild(sumRow);

      table.appendChild(groupEl);
    }

    tbody.remove();
  }

  private groupRecords(records: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    for (const rec of records) {
      const val = String(rec.get(this.groupField));
      if (!groups.has(val)) groups.set(val, []);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      groups.get(val)!.push(rec);
    }
    return groups;
  }

  private calculate(records: any[], field: string, type: SummaryType): unknown {
    if (typeof type === 'function') return type(records);
    const values = records.map((r) => Number(r.get(field))).filter((n) => !isNaN(n));
    switch (type) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'count':
        return records.length;
      case 'average':
        return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
      case 'min':
        return values.length ? Math.min(...values) : 0;
      case 'max':
        return values.length ? Math.max(...values) : 0;
      default:
        return '';
    }
  }
}
