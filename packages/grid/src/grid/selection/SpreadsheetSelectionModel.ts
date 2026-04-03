/**
 * @framesquared/grid – SpreadsheetSelectionModel
 *
 * Spreadsheet-like selection: click selects a cell, Shift+click
 * extends to a range.  Selected cells get x-grid-cell-selected class.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface SelectionRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export class SpreadsheetSelectionModel {
  private grid: any = null;
  private range: SelectionRange | null = null;
  private listeners: Record<string, ((...args: unknown[]) => void)[]> = {};

  on(event: string, fn: (...args: unknown[]) => void): void {
    (this.listeners[event] ??= []).push(fn);
  }

  private fire(event: string, ...args: unknown[]): void {
    (this.listeners[event] ?? []).forEach((fn) => fn(...args));
  }

  init(grid: any): void {
    this.grid = grid;
    this.attachListeners();
  }

  getSelectedRange(): SelectionRange | null {
    return this.range ? { ...this.range } : null;
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private attachListeners(): void {
    const view = this.grid?.getView?.();
    const table = view?.getTable?.();
    if (!table) return;

    table.addEventListener('click', (e: MouseEvent) => {
      const td = (e.target as HTMLElement).closest('td.x-grid-cell') as HTMLElement;
      if (!td) return;
      const tr = td.closest('tr.x-grid-row') as HTMLElement;
      if (!tr) return;
      const rowIdx = parseInt(tr.getAttribute('data-rowindex') ?? '0', 10);
      const colIdx = Array.from(tr.children).indexOf(td);

      if (e.shiftKey && this.range) {
        // Extend range
        this.range = {
          startRow: this.range.startRow,
          startCol: this.range.startCol,
          endRow: rowIdx,
          endCol: colIdx,
        };
      } else {
        // New single-cell selection
        this.range = {
          startRow: rowIdx,
          startCol: colIdx,
          endRow: rowIdx,
          endCol: colIdx,
        };
      }

      this.highlightRange();
      this.fire('selectionchange', this, this.range);
    });
  }

  private highlightRange(): void {
    const table = this.grid?.getView()?.getTable?.();
    if (!table || !this.range) return;

    // Clear previous
    const prev = table.querySelectorAll('.x-grid-cell-selected');
    for (const el of prev) el.classList.remove('x-grid-cell-selected');

    const { startRow, startCol, endRow, endCol } = this.range;
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    const rows = table.querySelectorAll('tbody tr.x-grid-row');
    for (let r = minRow; r <= maxRow && r < rows.length; r++) {
      const row = rows[r];
      for (let c = minCol; c <= maxCol && c < row.children.length; c++) {
        (row.children[c] as HTMLElement).classList.add('x-grid-cell-selected');
      }
    }
  }
}
