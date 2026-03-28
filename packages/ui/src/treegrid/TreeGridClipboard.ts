/**
 * @framesquared/ui – TreeGridClipboard
 *
 * Copy/paste plugin for TreeGrid. Supports TSV copy with optional
 * hierarchy indentation and paste as children/siblings.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NodeInterface } from '@framesquared/data';
import { TreeModel, applyNodeInterface } from '@framesquared/data';
import type { TreeGrid } from './TreeGrid.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TreeGridClipboardConfig {
  copyHierarchy?: boolean;
  pasteAsChildren?: boolean;
  pasteIndentLevel?: boolean;
  indentCharacter?: string;
}

// ---------------------------------------------------------------------------
// TreeGridClipboard
// ---------------------------------------------------------------------------

export class TreeGridClipboard {
  private treeGrid: TreeGrid | null = null;
  private config: Required<TreeGridClipboardConfig>;
  private _onKeyDown: (e: KeyboardEvent) => void;

  constructor(config: TreeGridClipboardConfig = {}) {
    this.config = {
      copyHierarchy: config.copyHierarchy ?? false,
      pasteAsChildren: config.pasteAsChildren ?? true,
      pasteIndentLevel: config.pasteIndentLevel ?? false,
      indentCharacter: config.indentCharacter ?? '\t',
    };
    this._onKeyDown = this._handleKeyDown.bind(this);
  }

  init(treeGrid: TreeGrid): void {
    this.treeGrid = treeGrid;
    const viewEl = treeGrid.getView()?.el;
    if (viewEl) viewEl.addEventListener('keydown', this._onKeyDown);
  }

  destroy(): void {
    const viewEl = this.treeGrid?.getView()?.el;
    if (viewEl) viewEl.removeEventListener('keydown', this._onKeyDown);
    this.treeGrid = null;
  }

  // -------------------------------------------------------------------------
  // Copy
  // -------------------------------------------------------------------------

  copyToClipboard(): string {
    const tg = this.treeGrid;
    if (!tg) return '';
    const columns = tg.getColumns();
    const selection = tg.getSelection();
    const nodes = selection.length > 0 ? selection : [];

    const rows: string[] = [];

    // Header row
    const headers = columns.filter((c) => !c.hidden).map((c) => c.text);
    rows.push(headers.join('\t'));

    for (const node of nodes) {
      const cells: string[] = [];
      for (const col of columns) {
        if (col.hidden) continue;
        let cellValue = String((node as any).get?.(col.dataIndex) ?? '');
        if (this.config.copyHierarchy && col === tg.getTreeColumn()) {
          const depth = node.depth ?? 0;
          cellValue = this.config.indentCharacter.repeat(depth) + cellValue;
        }
        cells.push(cellValue);
      }
      rows.push(cells.join('\t'));
    }

    return rows.join('\n');
  }

  pasteFromText(text: string): void {
    const tg = this.treeGrid;
    if (!tg) return;

    const lines = text.split('\n').filter(Boolean);
    const columns = tg.getColumns().filter((c) => !c.hidden);
    const selection = tg.getSelection();
    const parent =
      selection.length > 0 && this.config.pasteAsChildren
        ? selection[0]
        : tg.getRootNode();

    for (const line of lines) {
      const values = line.split('\t');
      const data: Record<string, unknown> = {};
      for (let i = 0; i < Math.min(values.length, columns.length); i++) {
        data[columns[i].dataIndex] = values[i] ?? '';
      }
      const newNode = TreeModel.create(data) as any;
      if (newNode && typeof newNode.isRoot !== 'function') {
        applyNodeInterface(newNode, (parent.depth ?? 0) + 1);
      }
      tg.getStore().appendChild(parent, newNode);
    }

    tg.getView().refresh();
  }

  // -------------------------------------------------------------------------
  // Keyboard
  // -------------------------------------------------------------------------

  private _handleKeyDown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault();
      const text = this.copyToClipboard();
      navigator.clipboard?.writeText?.(text);
    }
  }
}
