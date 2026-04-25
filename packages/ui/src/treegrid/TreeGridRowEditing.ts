/**
 * @framesquared/ui – TreeGridRowEditing
 *
 * Tree-aware row editing plugin for TreeGrid.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NodeInterface } from '@framesquared/data';
import type { TreeGrid } from './TreeGrid.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TreeGridRowEditingConfig {
  clicksToEdit?: number;
  autoCancel?: boolean;
  saveBtnText?: string;
  cancelBtnText?: string;
}

// ---------------------------------------------------------------------------
// TreeGridRowEditing
// ---------------------------------------------------------------------------

export class TreeGridRowEditing {
  private treeGrid: TreeGrid | null = null;
  private config: Required<TreeGridRowEditingConfig>;
  private editingRecord: NodeInterface | null = null;
  private editorRow: HTMLElement | null = null;
  private fieldMap = new Map<string, HTMLInputElement>();

  private _onDblClick: (e: MouseEvent) => void;

  constructor(config: TreeGridRowEditingConfig = {}) {
    this.config = {
      clicksToEdit: config.clicksToEdit ?? 2,
      autoCancel: config.autoCancel ?? true,
      saveBtnText: config.saveBtnText ?? 'Update',
      cancelBtnText: config.cancelBtnText ?? 'Cancel',
    };
    this._onDblClick = this._handleDblClick.bind(this);
  }

  init(treeGrid: TreeGrid): void {
    this.treeGrid = treeGrid;
    const viewEl = treeGrid.getView()?.el;
    if (viewEl) viewEl.addEventListener('dblclick', this._onDblClick);
  }

  destroy(): void {
    const viewEl = this.treeGrid?.getView()?.el;
    if (viewEl) viewEl.removeEventListener('dblclick', this._onDblClick);
    this.cancelEdit();
    this.treeGrid = null;
  }

  // -------------------------------------------------------------------------
  // Edit lifecycle
  // -------------------------------------------------------------------------

  startEdit(record: NodeInterface): void {
    if (this.editingRecord) this.cancelEdit();

    this.editingRecord = record;
    const view = this.treeGrid?.getView();
    if (!view) return;

    const row = view.getNodeRow(record);
    if (!row) return;

    const columns = this.treeGrid?.getColumns() ?? [];

    // Build editor row
    const editorRow = document.createElement('tr');
    editorRow.className = 'x-treegrid-row-editor';
    this.fieldMap.clear();

    let lastTd: HTMLTableCellElement | null = null;

    for (const col of columns) {
      if (col.hidden) continue;
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'text';
      input.className = `x-row-editor-field x-row-editor-field-${col.dataIndex}`;
      input.value = String((record as any).get?.(col.dataIndex) ?? '');
      input.setAttribute('data-dataindex', col.dataIndex);
      td.appendChild(input);
      editorRow.appendChild(td);
      this.fieldMap.set(col.dataIndex, input);
      lastTd = td;
    }

    // Action buttons go inside the last cell to keep column count consistent
    const btnWrapper = document.createElement('span');
    btnWrapper.className = 'x-row-editor-buttons';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = this.config.saveBtnText;
    saveBtn.className = 'x-row-editor-save';
    saveBtn.addEventListener('click', () => this.completeEdit());

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = this.config.cancelBtnText;
    cancelBtn.className = 'x-row-editor-cancel';
    cancelBtn.addEventListener('click', () => this.cancelEdit());

    btnWrapper.appendChild(saveBtn);
    btnWrapper.appendChild(cancelBtn);
    (lastTd ?? editorRow).appendChild(btnWrapper);

    row.insertAdjacentElement('afterend', editorRow);
    this.editorRow = editorRow;

    // Focus first field
    const firstInput = editorRow.querySelector('input') as HTMLInputElement | null;
    firstInput?.focus();
  }

  completeEdit(): void {
    if (!this.editingRecord) return;
    for (const [field, input] of this.fieldMap) {
      (this.editingRecord as any).set?.(field, input.value);
    }
    this.treeGrid?.getView().refreshNode(this.editingRecord);
    this._removeEditorRow();
    this.editingRecord = null;
  }

  cancelEdit(): void {
    this._removeEditorRow();
    this.editingRecord = null;
  }

  isEditing(): boolean {
    return this.editingRecord !== null;
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private _removeEditorRow(): void {
    this.editorRow?.remove();
    this.editorRow = null;
    this.fieldMap.clear();
  }

  private _handleDblClick(e: MouseEvent): void {
    const view = this.treeGrid?.getView();
    if (!view) return;
    const record = view.getNodeByEvent(e);
    if (!record) return;
    this.startEdit(record);
  }
}
