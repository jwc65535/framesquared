/**
 * @framesquared/grid – Summary feature
 *
 * Adds a summary row at the bottom of the grid with aggregate
 * calculations per column (sum, count, average, min, max, custom).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type SummaryType = 'sum' | 'count' | 'average' | 'min' | 'max' | ((records: any[]) => unknown);

export interface SummaryConfig {
  summaryTypes: Record<string, SummaryType>;
}

export class Summary {
  private grid: any = null;
  private summaryTypes: Record<string, SummaryType>;

  constructor(config: SummaryConfig) {
    this.summaryTypes = config.summaryTypes;
  }

  init(grid: any): void {
    this.grid = grid;
    this.renderSummary();
  }

  private renderSummary(): void {
    const view = this.grid?.getView?.();
    if (!view) return;
    const table = view.getTable?.();
    if (!table) return;

    const store = this.grid.getStore();
    const records = store.getRange();
    const columns = this.grid.getColumns();

    const tr = this.buildSummaryRow(records, columns);
    const tbody = table.querySelector('tbody');
    if (tbody) tbody.appendChild(tr);
  }

  protected buildSummaryRow(records: any[], columns: any[]): HTMLTableRowElement {
    const tr = document.createElement('tr');
    tr.classList.add('x-grid-summary-row');

    for (const col of columns) {
      const td = document.createElement('td');
      td.classList.add('x-grid-cell', 'x-grid-summary-cell');
      const type = this.summaryTypes[col.dataIndex];
      if (type) {
        td.textContent = String(this.calculate(records, col.dataIndex, type));
      }
      tr.appendChild(td);
    }
    return tr;
  }

  protected calculate(records: any[], field: string, type: SummaryType): unknown {
    if (typeof type === 'function') return type(records);

    const values = records.map(r => Number(r.get(field))).filter(n => !isNaN(n));
    switch (type) {
      case 'sum': return values.reduce((a, b) => a + b, 0);
      case 'count': return records.length;
      case 'average': return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
      case 'min': return values.length ? Math.min(...values) : 0;
      case 'max': return values.length ? Math.max(...values) : 0;
      default: return '';
    }
  }
}
