/**
 * @framesquared/grid – RowEditing plugin
 *
 * Row-level editing: shows input fields for all editable columns
 * in the selected row.  Update saves all; Cancel reverts.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export class RowEditing {
  private grid: any = null;
  private activeRowIndex = -1;
  private editorRow: HTMLElement | null = null;
  private inputs: Map<string, HTMLInputElement> = new Map();
  private originalValues: Map<string, string> = new Map();

  init(grid: any): void {
    this.grid = grid;
  }

  startEdit(rowIndex: number): void {
    if (this.editorRow) this.cancelEdit();

    const store = this.grid.getStore();
    const record = store.getAt(rowIndex);
    if (!record) return;

    this.activeRowIndex = rowIndex;
    const columns = this.grid.getColumns();

    // Find the data row
    const table = this.grid.getView()?.getTable?.();
    if (!table) return;
    const rows = table.querySelectorAll('tbody tr.x-grid-row');
    const targetRow = rows[rowIndex] as HTMLElement;
    if (!targetRow) return;

    // Create editor row
    this.editorRow = document.createElement('tr');
    this.editorRow.classList.add('x-grid-row-editor');
    this.inputs.clear();
    this.originalValues.clear();

    for (const col of columns) {
      const td = document.createElement('td');
      td.classList.add('x-grid-cell');

      if (col.config?.editor) {
        const input = document.createElement('input');
        input.type = 'text';
        const val = String(record.get(col.dataIndex) ?? '');
        input.value = val;
        this.inputs.set(col.dataIndex, input);
        this.originalValues.set(col.dataIndex, val);
        td.appendChild(input);
      } else {
        td.textContent = String(col.getCellValue(record) ?? '');
      }

      this.editorRow.appendChild(td);
    }

    // Replace the data row with editor row
    targetRow.style.display = 'none';
    targetRow.after(this.editorRow);

    this.grid?.fire?.('beforeedit', this.grid, { record, rowIndex });
  }

  completeEdit(): void {
    if (this.activeRowIndex < 0 || !this.grid) return;

    const store = this.grid.getStore();
    const record = store.getAt(this.activeRowIndex);
    if (!record) return;

    for (const [field, input] of this.inputs) {
      record.set(field, input.value);
    }

    this.grid.fire?.('edit', this.grid, { record, rowIndex: this.activeRowIndex });
    this.teardown();

    // Refresh the view
    this.grid.getView()?.refresh?.();
  }

  cancelEdit(): void {
    this.grid?.fire?.('canceledit', this.grid);
    this.teardown();
  }

  private teardown(): void {
    if (this.editorRow?.parentNode) {
      // Show original row again
      const prev = this.editorRow.previousElementSibling as HTMLElement;
      if (prev) prev.style.display = '';
      this.editorRow.remove();
    }
    this.editorRow = null;
    this.inputs.clear();
    this.originalValues.clear();
    this.activeRowIndex = -1;
  }
}
