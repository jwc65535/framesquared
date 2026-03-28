/**
 * @framesquared/ui – TreeGridCellEditing
 *
 * Tree-aware inline cell editing plugin for TreeGrid.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NodeInterface } from '@framesquared/data';
import type { TreeGrid } from './TreeGrid.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TreeGridCellEditingConfig {
  editableTreeColumn?: boolean;
  addChildOnInsert?: boolean;
  addSiblingOnEnter?: boolean;
  clicksToEdit?: number;
}

// ---------------------------------------------------------------------------
// TreeGridCellEditing
// ---------------------------------------------------------------------------

export class TreeGridCellEditing {
  private treeGrid: TreeGrid | null = null;
  private config: Required<TreeGridCellEditingConfig>;
  private activeEditor: HTMLInputElement | null = null;
  private editingRecord: NodeInterface | null = null;
  private editingField: string | null = null;
  private editingCell: HTMLElement | null = null;
  private originalValue: unknown = null;

  private _onClick: (e: MouseEvent) => void;
  private _onDblClick: (e: MouseEvent) => void;

  constructor(config: TreeGridCellEditingConfig = {}) {
    this.config = {
      editableTreeColumn: config.editableTreeColumn ?? true,
      addChildOnInsert: config.addChildOnInsert ?? false,
      addSiblingOnEnter: config.addSiblingOnEnter ?? false,
      clicksToEdit: config.clicksToEdit ?? 2,
    };
    this._onClick = this._handleClick.bind(this);
    this._onDblClick = this._handleDblClick.bind(this);
  }

  init(treeGrid: TreeGrid): void {
    this.treeGrid = treeGrid;
    const viewEl = treeGrid.getView()?.el;
    if (!viewEl) return;
    if (this.config.clicksToEdit === 1) {
      viewEl.addEventListener('click', this._onClick);
    } else {
      viewEl.addEventListener('dblclick', this._onDblClick);
    }
  }

  destroy(): void {
    const viewEl = this.treeGrid?.getView()?.el;
    if (viewEl) {
      viewEl.removeEventListener('click', this._onClick);
      viewEl.removeEventListener('dblclick', this._onDblClick);
    }
    this.cancelEdit();
    this.treeGrid = null;
  }

  // -------------------------------------------------------------------------
  // Edit lifecycle
  // -------------------------------------------------------------------------

  startEdit(record: NodeInterface, dataIndex: string): void {
    if (this.activeEditor) this.completeEdit();

    const view = this.treeGrid?.getView();
    if (!view) return;

    const row = view.getNodeRow(record);
    if (!row) return;

    const columns = this.treeGrid?.getColumns() ?? [];
    const colIdx = columns.findIndex((c) => c.dataIndex === dataIndex);
    if (colIdx === -1) return;

    const cells = row.querySelectorAll('td');
    const cell = cells[colIdx] as HTMLElement;
    if (!cell) return;

    const value = (record as any).get?.(dataIndex) ?? '';
    this.originalValue = value;
    this.editingRecord = record;
    this.editingField = dataIndex;
    this.editingCell = cell;

    // Create editor
    const editor = document.createElement('input');
    editor.type = 'text';
    editor.className = 'x-treegrid-cell-editor';
    editor.value = String(value);
    editor.style.cssText =
      'position:absolute;top:0;left:0;z-index:100;width:100%;height:100%;' +
      'box-sizing:border-box;padding:0 6px;border:2px solid #3b82f6;outline:none;background:#fff;font:inherit;';

    cell.style.position = 'relative';
    cell.appendChild(editor);
    editor.focus();
    editor.select();

    this.activeEditor = editor;

    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.completeEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.cancelEdit();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        this.completeEdit();
        this._focusNextCell(record, dataIndex, e.shiftKey);
      }
    });

    editor.addEventListener('blur', () => {
      // Delay to allow keydown to fire first
      setTimeout(() => {
        if (this.activeEditor === editor) this.completeEdit();
      }, 100);
    });
  }

  completeEdit(): void {
    if (!this.activeEditor || !this.editingRecord || !this.editingField) return;

    const newValue = this.activeEditor.value;

    // Fire validateedit — if returns false, cancel
    const canEdit = this.treeGrid?.getView().el?.dispatchEvent(
      new CustomEvent('validateedit', {
        bubbles: true,
        cancelable: true,
        detail: { record: this.editingRecord, field: this.editingField, value: newValue },
      }),
    );

    if (canEdit === false) {
      this.cancelEdit();
      return;
    }

    (this.editingRecord as any).set?.(this.editingField, newValue);
    this._removeEditor();
    this.treeGrid?.getView().refreshNode(this.editingRecord);
    this.editingRecord = null;
    this.editingField = null;
    this.editingCell = null;
  }

  cancelEdit(): void {
    this._removeEditor();
    this.editingRecord = null;
    this.editingField = null;
    this.editingCell = null;
    this.originalValue = null;
  }

  isEditing(): boolean {
    return this.activeEditor !== null;
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private _removeEditor(): void {
    this.activeEditor?.remove();
    this.activeEditor = null;
  }

  private _focusNextCell(
    record: NodeInterface,
    currentDataIndex: string,
    reverse = false,
  ): void {
    const columns = this.treeGrid?.getColumns() ?? [];
    const currentIdx = columns.findIndex((c) => c.dataIndex === currentDataIndex);
    const nextIdx = reverse ? currentIdx - 1 : currentIdx + 1;

    if (nextIdx >= 0 && nextIdx < columns.length) {
      this.startEdit(record, columns[nextIdx].dataIndex);
    } else {
      // Move to next/prev row's first/last column
      const flatData = this.treeGrid?.getStore().flattenNodes() as NodeInterface[];
      const rowIdx = flatData.indexOf(record);
      const nextRowIdx = reverse ? rowIdx - 1 : rowIdx + 1;
      if (nextRowIdx >= 0 && nextRowIdx < flatData.length) {
        const col = reverse ? columns[columns.length - 1] : columns[0];
        this.startEdit(flatData[nextRowIdx], col.dataIndex);
      }
    }
  }

  private _handleClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    // Don't start edit on expander or checkbox
    if (
      target.classList.contains('x-treegrid-expander') ||
      target.classList.contains('x-treegrid-checkbox')
    ) {
      if (this.activeEditor) this.completeEdit();
      return;
    }
    this._startEditFromEvent(e);
  }

  private _handleDblClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (
      target.classList.contains('x-treegrid-expander') ||
      target.classList.contains('x-treegrid-checkbox')
    ) {
      if (this.activeEditor) this.completeEdit();
      return;
    }
    this._startEditFromEvent(e);
  }

  private _startEditFromEvent(e: MouseEvent): void {
    const view = this.treeGrid?.getView();
    if (!view) return;
    const record = view.getNodeByEvent(e);
    if (!record) return;

    const cell = (e.target as HTMLElement).closest('td') as HTMLElement;
    if (!cell) return;

    const row = cell.parentElement as HTMLElement;
    const cellIdx = Array.from(row.children).indexOf(cell);
    const columns = this.treeGrid?.getColumns() ?? [];
    const col = columns[cellIdx];
    if (!col) return;

    this.startEdit(record, col.dataIndex);
  }
}
