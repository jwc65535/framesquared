/**
 * @ext-ts/grid – CellEditing plugin
 *
 * Double-click a cell to start inline editing.  The cell content
 * is replaced with an input field.  Enter completes; Escape cancels.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export class CellEditing {
  private grid: any = null;
  private activeEditor: HTMLElement | null = null;
  private activeInput: HTMLInputElement | null = null;
  private activeRecord: any = null;
  private activeColumn: any = null;
  private activeCell: HTMLElement | null = null;
  private originalValue: string = '';

  init(grid: any): void {
    this.grid = grid;
    this.attachCellListeners();
  }

  private attachCellListeners(): void {
    const view = this.grid?.getView?.();
    if (!view) return;
    const table = view.getTable?.();
    if (!table) return;

    table.addEventListener('dblclick', (e: MouseEvent) => {
      const td = (e.target as HTMLElement).closest('td.x-grid-cell') as HTMLElement | null;
      if (!td) return;
      const tr = td.closest('tr.x-grid-row') as HTMLElement | null;
      if (!tr) return;

      const rowIdx = parseInt(tr.getAttribute('data-rowindex') ?? '0', 10);
      const colIdx = Array.from(tr.children).indexOf(td);
      const columns = this.grid.getColumns();
      const col = columns[colIdx];
      if (!col?.config?.editor) return;

      const store = this.grid.getStore();
      const record = store.getAt(rowIdx);
      if (!record) return;

      this.startEdit(record, col, td);
    });
  }

  private startEdit(record: any, column: any, cell: HTMLElement): void {
    if (this.activeEditor) this.cancelEdit();

    this.grid?.fire?.('beforeedit', this.grid, { record, column });

    this.activeRecord = record;
    this.activeColumn = column;
    this.activeCell = cell;
    this.originalValue = String(record.get(column.dataIndex) ?? '');

    // Create editor
    const editor = document.createElement('div');
    editor.classList.add('x-grid-cell-editor');

    const input = document.createElement('input');
    input.type = 'text';
    input.value = this.originalValue;
    input.classList.add('x-grid-editor-input');

    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); this.completeEdit(); }
      else if (e.key === 'Escape') { e.preventDefault(); this.cancelEdit(); }
    });

    editor.appendChild(input);
    cell.innerHTML = '';
    cell.appendChild(editor);
    this.activeEditor = editor;
    this.activeInput = input;
    input.focus();
    input.select();
  }

  completeEdit(): void {
    if (!this.activeInput || !this.activeRecord || !this.activeColumn || !this.activeCell) return;

    const newValue = this.activeInput.value;
    this.activeRecord.set(this.activeColumn.dataIndex, newValue);
    this.activeCell.innerHTML = newValue;

    this.grid?.fire?.('edit', this.grid, {
      record: this.activeRecord,
      column: this.activeColumn,
      value: newValue,
      originalValue: this.originalValue,
    });

    this.cleanup();
  }

  cancelEdit(): void {
    if (!this.activeCell) return;
    this.activeCell.innerHTML = this.originalValue;
    this.grid?.fire?.('canceledit', this.grid);
    this.cleanup();
  }

  private cleanup(): void {
    this.activeEditor = null;
    this.activeInput = null;
    this.activeRecord = null;
    this.activeColumn = null;
    this.activeCell = null;
    this.originalValue = '';
  }
}
