/**
 * @ext-ts/grid – GridState
 *
 * Saves and restores grid column state (widths, hidden, order)
 * and sort state to localStorage.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface GridStateConfig {
  stateId: string;
}

interface ColumnState {
  dataIndex: string;
  width: number;
  hidden: boolean;
}

interface SavedState {
  columns: ColumnState[];
  sort?: { field: string; direction: string };
}

export class GridState {
  private grid: any = null;
  private stateId: string;

  constructor(config: GridStateConfig) {
    this.stateId = config.stateId;
  }

  init(grid: any): void {
    this.grid = grid;
  }

  private get storageKey(): string {
    return `ext-grid-state-${this.stateId}`;
  }

  save(): void {
    if (!this.grid) return;

    const columns = this.grid.getColumns();
    const view = this.grid.getView?.();
    const ths = view?.headerContainer?.getThElements?.() ?? [];

    const colState: ColumnState[] = columns.map((col: any, i: number) => ({
      dataIndex: col.dataIndex,
      width: col.width,
      hidden: ths[i] ? ths[i].style.display === 'none' : col.hidden,
    }));

    const state: SavedState = { columns: colState };

    // Sort state
    const sortIdx = (this.grid as any)._sortColumnIndex;
    const sortDir = (this.grid as any)._sortDirection;
    if (sortIdx >= 0 && columns[sortIdx]) {
      state.sort = {
        field: columns[sortIdx].dataIndex,
        direction: sortDir,
      };
    }

    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  restore(): void {
    if (!this.grid) return;
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return;

    let state: SavedState;
    try { state = JSON.parse(raw); } catch { return; }

    const columns = this.grid.getColumns();

    if (state.columns) {
      for (const saved of state.columns) {
        const idx = columns.findIndex((c: any) => c.dataIndex === saved.dataIndex);
        if (idx < 0) continue;
        if (saved.hidden) {
          this.grid.hideColumn(idx);
        } else {
          this.grid.showColumn(idx);
        }
      }
    }
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }
}
