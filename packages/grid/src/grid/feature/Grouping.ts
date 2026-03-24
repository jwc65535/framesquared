/**
 * @framesquared/grid – Grouping feature
 *
 * Groups rows by a field value.  Renders group header rows with
 * expand/collapse behavior.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface GroupingConfig {
  groupField: string;
  startCollapsed?: boolean;
  groupHeaderTpl?: (groupValue: string, records: any[]) => string;
}

export class Grouping {
  private grid: any = null;
  private groupField: string;
  private startCollapsed: boolean;
  private collapsedGroups = new Set<string>();
  private groupHeaderTpl: (gv: string, recs: any[]) => string;

  constructor(config: GroupingConfig) {
    this.groupField = config.groupField;
    this.startCollapsed = config.startCollapsed ?? false;
    this.groupHeaderTpl = config.groupHeaderTpl ?? ((gv) => gv);
  }

  init(grid: any): void {
    this.grid = grid;
    this.rebuildGroupedView();
  }

  collapse(groupValue: string): void {
    this.collapsedGroups.add(groupValue);
    this.setGroupRowsVisible(groupValue, false);
    this.grid?.fire?.('groupcollapse', this.grid, groupValue);
  }

  expand(groupValue: string): void {
    this.collapsedGroups.delete(groupValue);
    this.setGroupRowsVisible(groupValue, true);
    this.grid?.fire?.('groupexpand', this.grid, groupValue);
  }

  isCollapsed(groupValue: string): boolean {
    return this.collapsedGroups.has(groupValue);
  }

  private rebuildGroupedView(): void {
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
      if (this.startCollapsed) this.collapsedGroups.add(groupValue);

      const groupEl = document.createElement('tbody');
      groupEl.classList.add('x-grid-group');
      groupEl.setAttribute('data-group', groupValue);

      // Group header row
      const headerRow = document.createElement('tr');
      headerRow.classList.add('x-grid-group-hd');
      const headerTd = document.createElement('td');
      headerTd.colSpan = columns.length;
      headerTd.classList.add('x-grid-group-title');
      headerTd.textContent = this.groupHeaderTpl(groupValue, groupRecords);
      headerRow.appendChild(headerTd);

      headerRow.style.cursor = 'pointer';
      headerRow.addEventListener('click', () => {
        if (this.isCollapsed(groupValue)) this.expand(groupValue);
        else this.collapse(groupValue);
      });

      groupEl.appendChild(headerRow);

      // Data rows
      for (let i = 0; i < groupRecords.length; i++) {
        const rec = groupRecords[i];
        const tr = document.createElement('tr');
        tr.classList.add('x-grid-row');
        if (this.collapsedGroups.has(groupValue)) tr.style.display = 'none';

        for (let ci = 0; ci < columns.length; ci++) {
          const col = columns[ci];
          const td = document.createElement('td');
          td.classList.add('x-grid-cell');
          const val = col.getCellValue(rec);
          td.innerHTML = col.renderCellHtml(val, {}, rec, i, ci);
          tr.appendChild(td);
        }
        groupEl.appendChild(tr);
      }

      // Replace original tbody with group tbodies
      table.appendChild(groupEl);
    }

    // Remove original tbody
    tbody.remove();
  }

  private groupRecords(records: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    for (const rec of records) {
      const val = String(rec.get(this.groupField));
      if (!groups.has(val)) groups.set(val, []);
      groups.get(val)!.push(rec);
    }
    return groups;
  }

  private setGroupRowsVisible(groupValue: string, visible: boolean): void {
    const groupEl = this.grid?.el?.querySelector(`.x-grid-group[data-group="${groupValue}"]`);
    if (!groupEl) return;
    const rows = groupEl.querySelectorAll('.x-grid-row');
    for (const row of rows) {
      (row as HTMLElement).style.display = visible ? '' : 'none';
    }
  }
}
