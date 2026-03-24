/**
 * @ext-ts/grid – DragDrop plugin
 *
 * Enables row reordering via drag and drop.  Adds draggable
 * attributes to rows and provides a moveRow method.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export class GridDragDrop {
  private grid: any = null;

  init(grid: any): void {
    this.grid = grid;
    this.setupDrag();
  }

  private setupDrag(): void {
    const view = this.grid?.getView?.();
    if (!view) return;
    const table = view.getTable?.();
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr.x-grid-row');
    for (const row of rows) {
      row.setAttribute('draggable', 'true');

      row.addEventListener('dragstart', (e: DragEvent) => {
        const idx = row.getAttribute('data-rowindex');
        e.dataTransfer?.setData('text/plain', idx ?? '');
        this.grid?.fire?.('beforedrop', this.grid, parseInt(idx ?? '0', 10));
      });

      row.addEventListener('dragover', (e: DragEvent) => {
        e.preventDefault();
      });

      row.addEventListener('drop', (e: DragEvent) => {
        e.preventDefault();
        const fromIdx = parseInt(e.dataTransfer?.getData('text/plain') ?? '0', 10);
        const toIdx = parseInt(row.getAttribute('data-rowindex') ?? '0', 10);
        if (fromIdx !== toIdx) this.moveRow(fromIdx, toIdx);
      });
    }
  }

  moveRow(fromIndex: number, toIndex: number): void {
    const store = this.grid?.getStore?.();
    if (!store) return;

    const records = store.data?.items;
    if (!records || fromIndex >= records.length) return;

    const [moved] = records.splice(fromIndex, 1);
    records.splice(toIndex, 0, moved);

    this.grid?.fire?.('drop', this.grid, moved, fromIndex, toIndex);

    // Refresh grid
    this.grid?.getView?.()?.refresh?.();
  }
}
