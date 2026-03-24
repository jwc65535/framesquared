/**
 * @ext-ts/grid – Lockable
 *
 * Splits a grid into locked (frozen left) and normal (scrollable right)
 * panels.  Columns with config.locked=true go into the locked panel.
 * Locked panel does not scroll horizontally.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export class Lockable {
  private grid: any = null;

  init(grid: any): void {
    this.grid = grid;
    this.rebuild();
  }

  private rebuild(): void {
    const grid = this.grid;
    const view = grid?.getView?.();
    const table = view?.getTable?.();
    if (!table || !grid.el) return;

    const store = grid.getStore();
    const records = store.getRange();
    const columns = grid.getColumns();

    const lockedCols = columns.filter((c: any) => c.config?.locked);
    const normalCols = columns.filter((c: any) => !c.config?.locked);

    if (lockedCols.length === 0) return; // nothing to lock

    // Get the panel body
    const body = grid.getBodyEl();

    // Remove the original table
    table.remove();

    // Container: flex row
    const container = document.createElement('div');
    container.classList.add('x-grid-lock-container');
    container.style.display = 'flex';
    container.style.width = '100%';
    container.style.overflow = 'hidden';

    // Locked panel
    const lockedPanel = document.createElement('div');
    lockedPanel.classList.add('x-grid-locked');
    lockedPanel.style.overflowX = 'hidden';
    lockedPanel.style.overflowY = 'auto';
    lockedPanel.style.flexShrink = '0';
    lockedPanel.appendChild(this.buildTable(lockedCols, records));

    // Normal panel
    const normalPanel = document.createElement('div');
    normalPanel.classList.add('x-grid-normal');
    normalPanel.style.overflowX = 'auto';
    normalPanel.style.overflowY = 'auto';
    normalPanel.style.flexGrow = '1';
    normalPanel.appendChild(this.buildTable(normalCols, records));

    // Sync vertical scroll
    lockedPanel.addEventListener('scroll', () => {
      normalPanel.scrollTop = lockedPanel.scrollTop;
    });
    normalPanel.addEventListener('scroll', () => {
      lockedPanel.scrollTop = normalPanel.scrollTop;
    });

    container.appendChild(lockedPanel);
    container.appendChild(normalPanel);
    body.appendChild(container);
  }

  private buildTable(columns: any[], records: any[]): HTMLTableElement {
    const table = document.createElement('table');
    table.classList.add('x-grid-table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    // Thead
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (const col of columns) {
      const th = document.createElement('th');
      th.classList.add('x-column-header');
      th.textContent = col.text;
      if (col.width > 0) th.style.width = `${col.width}px`;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Tbody
    const tbody = document.createElement('tbody');
    for (let ri = 0; ri < records.length; ri++) {
      const rec = records[ri];
      const tr = document.createElement('tr');
      tr.classList.add('x-grid-row');
      tr.setAttribute('data-rowindex', String(ri));
      if (ri % 2 === 1) tr.classList.add('x-grid-row-alt');

      for (let ci = 0; ci < columns.length; ci++) {
        const col = columns[ci];
        const td = document.createElement('td');
        td.classList.add('x-grid-cell');
        const val = col.getCellValue(rec);
        td.innerHTML = col.renderCellHtml(val, {}, rec, ri, ci);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    return table;
  }
}
