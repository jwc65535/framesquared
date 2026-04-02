/**
 * @framesquared/ui – TreeGridCellEditing
 *
 * Tree-aware inline cell editing plugin for TreeGrid.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NodeInterface } from '@framesquared/data';
import type { EditorConfig } from './TreeGridColumn.js';
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
  private activeEditor: HTMLElement | null = null;
  private editingRecord: NodeInterface | null = null;
  private editingField: string | null = null;

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

    const col = columns[colIdx];

    // Column marked read-only
    if (col.editor === false) return;

    const cells = row.querySelectorAll('td');
    const cell = cells[colIdx] as HTMLElement;
    if (!cell) return;

    const value = (record as any).get?.(dataIndex) ?? '';
    this.editingRecord = record;
    this.editingField = dataIndex;

    // Create the appropriate editor element
    const editorCfg = col.editor ?? null;
    const editor = this._createEditorElement(editorCfg, value);

    cell.style.position = 'relative';
    cell.appendChild(editor);

    const focusable = editor.querySelector<HTMLElement>('input,select,textarea') ?? editor;
    if ((focusable as HTMLInputElement).select) {
      (focusable as HTMLInputElement).select?.();
    }
    focusable.focus();

    this.activeEditor = editor;

    const onKeydown = (e: KeyboardEvent): void => {
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
    };

    const onBlur = (): void => {
      setTimeout(() => {
        if (this.activeEditor === editor) this.completeEdit();
      }, 150);
    };

    // Attach to the focusable child (or the editor wrapper for checkboxes etc.)
    focusable.addEventListener('keydown', onKeydown);
    focusable.addEventListener('blur', onBlur);

    // For editors that are a wrapper div (checkbox, radiogroup, colorfield):
    // also attach keydown to the wrapper so Escape/Enter still work
    if (editor !== focusable) {
      editor.addEventListener('keydown', onKeydown);
    }
  }

  completeEdit(): void {
    if (!this.activeEditor || !this.editingRecord || !this.editingField) return;

    const editorCfg = this._currentEditorConfig();
    const newValue = this._getEditorValue(this.activeEditor, editorCfg);

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
  }

  cancelEdit(): void {
    this._removeEditor();
    this.editingRecord = null;
    this.editingField = null;
  }

  isEditing(): boolean {
    return this.activeEditor !== null;
  }

  // -------------------------------------------------------------------------
  // Editor creation
  // -------------------------------------------------------------------------

  private _createEditorElement(cfg: EditorConfig | null, value: unknown): HTMLElement {
    const xtype = cfg?.xtype ?? 'textfield';
    const base =
      'position:absolute;top:0;left:0;z-index:100;width:100%;height:100%;' +
      'box-sizing:border-box;border:2px solid #3b82f6;outline:none;background:#fff;font:inherit;';

    switch (xtype) {
      case 'combobox':
      case 'combo':
      case 'select': {
        const select = document.createElement('select');
        select.className = 'x-treegrid-cell-editor x-treegrid-cell-editor-select';
        select.style.cssText = base + 'padding:0 4px;cursor:pointer;';
        const options = cfg?.options ?? cfg?.store ?? [];
        for (const opt of options) {
          const o = document.createElement('option');
          if (typeof opt === 'string') {
            o.value = opt;
            o.text = opt;
          } else {
            o.value = String(opt.value);
            o.text = opt.text;
          }
          select.appendChild(o);
        }
        select.value = String(value ?? '');
        return select;
      }

      case 'checkbox': {
        const wrapper = document.createElement('div');
        wrapper.className = 'x-treegrid-cell-editor x-treegrid-cell-editor-checkbox';
        wrapper.style.cssText =
          'position:absolute;top:0;left:0;z-index:100;width:100%;height:100%;' +
          'box-sizing:border-box;border:2px solid #3b82f6;background:#fff;' +
          'display:flex;align-items:center;justify-content:center;cursor:pointer;';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.style.cssText = 'width:16px;height:16px;cursor:pointer;';
        input.checked = Boolean(value);
        wrapper.appendChild(input);
        // Clicking the wrapper toggles the checkbox
        wrapper.addEventListener('click', (e) => {
          if (e.target !== input) input.checked = !input.checked;
        });
        return wrapper;
      }

      case 'radiogroup': {
        const wrapper = document.createElement('div');
        wrapper.className = 'x-treegrid-cell-editor x-treegrid-cell-editor-radiogroup';
        wrapper.style.cssText =
          'position:absolute;top:0;left:0;z-index:100;width:100%;height:100%;' +
          'box-sizing:border-box;border:2px solid #3b82f6;background:#fff;' +
          'display:flex;align-items:center;gap:8px;padding:0 6px;overflow:hidden;';
        wrapper.setAttribute('tabindex', '0');
        const items = cfg?.options ?? cfg?.store ?? [];
        const groupName = `rg_${Date.now()}`;
        for (const item of items) {
          const v = typeof item === 'string' ? item : String(item.value);
          const t = typeof item === 'string' ? item : item.text;
          const label = document.createElement('label');
          label.style.cssText =
            'display:flex;align-items:center;gap:3px;cursor:pointer;white-space:nowrap;font:inherit;';
          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = groupName;
          radio.value = v;
          radio.checked = String(value) === v;
          label.appendChild(radio);
          label.appendChild(document.createTextNode(t));
          wrapper.appendChild(label);
        }
        return wrapper;
      }

      case 'numberfield':
      case 'number': {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'x-treegrid-cell-editor x-treegrid-cell-editor-number';
        input.style.cssText = base + 'padding:0 6px;';
        input.value = String(value ?? '');
        if (cfg?.minValue != null) input.min = String(cfg.minValue);
        if (cfg?.maxValue != null) input.max = String(cfg.maxValue);
        if (cfg?.step != null) input.step = String(cfg.step);
        return input;
      }

      case 'datefield':
      case 'date': {
        const input = document.createElement('input');
        input.type = 'date';
        input.className = 'x-treegrid-cell-editor x-treegrid-cell-editor-date';
        input.style.cssText = base + 'padding:0 6px;';
        input.value = String(value ?? '');
        return input;
      }

      case 'colorfield':
      case 'color': {
        const wrapper = document.createElement('div');
        wrapper.className = 'x-treegrid-cell-editor x-treegrid-cell-editor-color';
        wrapper.style.cssText =
          'position:absolute;top:0;left:0;z-index:100;width:100%;height:100%;' +
          'box-sizing:border-box;border:2px solid #3b82f6;background:#fff;' +
          'display:flex;align-items:center;gap:4px;padding:0 4px;';
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.style.cssText =
          'width:32px;height:24px;border:none;padding:0;cursor:pointer;background:transparent;';
        colorInput.value = String(value ?? '#000000');
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.style.cssText =
          'flex:1;border:none;outline:none;font:inherit;background:transparent;';
        textInput.value = String(value ?? '');
        colorInput.addEventListener('input', () => {
          textInput.value = colorInput.value;
        });
        textInput.addEventListener('input', () => {
          if (/^#[0-9a-fA-F]{6}$/.test(textInput.value)) {
            colorInput.value = textInput.value;
          }
        });
        wrapper.appendChild(colorInput);
        wrapper.appendChild(textInput);
        return wrapper;
      }

      case 'textarea':
      case 'textareafield': {
        const ta = document.createElement('textarea');
        ta.className = 'x-treegrid-cell-editor x-treegrid-cell-editor-textarea';
        ta.style.cssText = base + 'padding:2px 6px;resize:none;';
        if (cfg?.rows) ta.rows = cfg.rows;
        ta.value = String(value ?? '');
        return ta;
      }

      default: {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'x-treegrid-cell-editor';
        input.style.cssText = base + 'padding:0 6px;';
        input.value = String(value ?? '');
        return input;
      }
    }
  }

  private _getEditorValue(editor: HTMLElement, cfg: EditorConfig | null): unknown {
    const xtype = cfg?.xtype ?? 'textfield';

    switch (xtype) {
      case 'checkbox': {
        const input = editor.querySelector<HTMLInputElement>('input[type="checkbox"]');
        return input ? input.checked : false;
      }
      case 'radiogroup': {
        const checked = editor.querySelector<HTMLInputElement>('input[type="radio"]:checked');
        return checked ? checked.value : '';
      }
      case 'colorfield':
      case 'color': {
        const text = editor.querySelector<HTMLInputElement>('input[type="text"]');
        return text ? text.value : '';
      }
      case 'numberfield':
      case 'number': {
        return (editor as HTMLInputElement).valueAsNumber;
      }
      default: {
        const focusable = editor.querySelector<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >('input,select,textarea');
        return focusable ? focusable.value : ((editor as HTMLInputElement).value ?? '');
      }
    }
  }

  private _currentEditorConfig(): EditorConfig | null {
    if (!this.editingField) return null;
    const columns = this.treeGrid?.getColumns() ?? [];
    const col = columns.find((c) => c.dataIndex === this.editingField);
    if (!col || col.editor === false || col.editor == null) return null;
    return col.editor;
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private _removeEditor(): void {
    this.activeEditor?.remove();
    this.activeEditor = null;
  }

  private _focusNextCell(record: NodeInterface, currentDataIndex: string, reverse = false): void {
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
