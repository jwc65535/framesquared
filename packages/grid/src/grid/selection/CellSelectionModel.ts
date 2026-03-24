/**
 * @framesquared/grid – CellSelectionModel
 *
 * Selects individual cells.  Supports navigation via arrow keys
 * and Tab/Shift+Tab.  Selected cell gets x-grid-cell-selected class.
 */

import type { SelectableGrid } from './RowSelectionModel.js';
import type { Column } from '../column/Column.js';

export interface CellPosition {
  row: number;
  column: number;
}

interface CellSelectableGrid extends SelectableGrid {
  getColumns(): Column[];
  el: HTMLElement | null;
}

export class CellSelectionModel {
  private grid: CellSelectableGrid | null = null;
  private position: CellPosition | null = null;
  private listeners: Record<string, Function[]> = {};
  private maxRow = 0;
  private maxCol = 0;

  on(event: string, fn: Function): void {
    (this.listeners[event] ??= []).push(fn);
  }

  private fire(event: string, ...args: unknown[]): void {
    (this.listeners[event] ?? []).forEach(fn => fn(...args));
  }

  init(grid: CellSelectableGrid): void {
    this.grid = grid;
    const store = grid.getStore();
    this.maxRow = (store?.getCount() ?? 1) - 1;
    this.maxCol = grid.getColumns().length - 1;
    this.attachListeners();
  }

  getCurrentPosition(): CellPosition | null {
    return this.position ? { ...this.position } : null;
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private selectCell(row: number, col: number): void {
    this.clearSelection();

    row = Math.max(0, Math.min(row, this.maxRow));
    col = Math.max(0, Math.min(col, this.maxCol));
    this.position = { row, column: col };

    const cell = this.getCellElement(row, col);
    if (cell) cell.classList.add('x-grid-cell-selected');

    this.fire('selectionchange', this, this.position);
  }

  private clearSelection(): void {
    if (!this.grid) return;
    const table = this.grid.getView()?.getTable();
    if (!table) return;
    const selected = table.querySelectorAll('.x-grid-cell-selected');
    for (const el of selected) el.classList.remove('x-grid-cell-selected');
  }

  private getCellElement(row: number, col: number): HTMLElement | null {
    const table = this.grid?.getView()?.getTable();
    if (!table) return null;
    const tr = table.querySelector(`tbody tr[data-rowindex="${row}"]`);
    if (!tr) return null;
    return tr.children[col] as HTMLElement ?? null;
  }

  private attachListeners(): void {
    const view = this.grid?.getView();
    const table = view?.getTable();
    if (!table) return;

    // Cell click
    table.addEventListener('click', (e: MouseEvent) => {
      const td = (e.target as HTMLElement).closest('td.x-grid-cell') as HTMLElement;
      if (!td) return;
      const tr = td.closest('tr.x-grid-row') as HTMLElement;
      if (!tr) return;
      const rowIdx = parseInt(tr.getAttribute('data-rowindex') ?? '0', 10);
      const colIdx = Array.from(tr.children).indexOf(td);
      this.selectCell(rowIdx, colIdx);
    });

    // Keyboard navigation
    if (this.grid!.el) {
      this.grid!.el.setAttribute('tabindex', '0');
      this.grid!.el.addEventListener('keydown', (e: KeyboardEvent) => {
        if (!this.position) return;
        let { row, column } = this.position;

        switch (e.key) {
          case 'ArrowRight': column++; break;
          case 'ArrowLeft': column--; break;
          case 'ArrowDown': row++; break;
          case 'ArrowUp': row--; break;
          case 'Tab':
            e.preventDefault();
            if (e.shiftKey) column--;
            else column++;
            break;
          default: return;
        }

        this.selectCell(row, column);
      });
    }
  }
}
