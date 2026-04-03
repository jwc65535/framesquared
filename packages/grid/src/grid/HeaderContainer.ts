/**
 * @framesquared/grid – HeaderContainer
 *
 * Renders and manages the <thead> <tr> of column headers.
 * Applies width, hidden state, and sort indicator classes.
 */

import type { Column } from './column/Column.js';

export interface HeaderContainerConfig {
  columns: Column[];
}

export class HeaderContainer {
  private columns: Column[];
  private headerRow: HTMLTableRowElement | null = null;
  private thElements: HTMLTableCellElement[] = [];

  constructor(config: HeaderContainerConfig) {
    this.columns = config.columns;
  }

  render(): HTMLTableRowElement {
    this.headerRow = document.createElement('tr');
    this.headerRow.classList.add('x-grid-header-row');
    this.thElements = [];

    for (const col of this.columns) {
      const th = document.createElement('th');
      th.classList.add('x-column-header');
      th.textContent = col.text;

      if (col.width > 0) th.style.width = `${col.width}px`;
      if (col.hidden) th.style.display = 'none';
      if (col.align) th.style.textAlign = col.align;

      th.setAttribute('data-dataindex', col.dataIndex);
      this.thElements.push(th);
      this.headerRow.appendChild(th);
    }

    return this.headerRow;
  }

  getColumns(): Column[] {
    return this.columns;
  }

  getThElements(): HTMLTableCellElement[] {
    return this.thElements;
  }

  setColumnHidden(index: number, hidden: boolean): void {
    const th = this.thElements[index];
    if (th) th.style.display = hidden ? 'none' : '';
  }

  setSortIndicator(index: number, direction: 'ASC' | 'DESC' | null): void {
    // Clear all
    for (const th of this.thElements) {
      th.classList.remove('x-column-header-sort-ASC', 'x-column-header-sort-DESC');
    }
    if (direction !== null && this.thElements[index]) {
      this.thElements[index].classList.add(`x-column-header-sort-${direction}`);
    }
  }
}
