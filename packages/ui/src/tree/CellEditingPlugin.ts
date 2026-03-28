/**
 * @framesquared/ui – CellEditingPlugin
 *
 * Simple in-place cell editing plugin for tree nodes.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NodeInterface } from '@framesquared/data';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface CellEditingConfig {
  clicksToEdit?: number;
}

/** Minimal interface CellEditingPlugin needs from TreePanel */
export interface CellEditingTreePanel {
  on(event: string, fn: Function): void;
  getView(): { getNode(record: NodeInterface): HTMLElement | null };
}

// ---------------------------------------------------------------------------
// CellEditingPlugin
// ---------------------------------------------------------------------------

export class CellEditingPlugin {
  private tree: CellEditingTreePanel | null = null;
  private config: CellEditingConfig;
  private activeEditor: HTMLInputElement | null = null;
  private editingNode: NodeInterface | null = null;
  private field = 'text';

  constructor(config?: CellEditingConfig) {
    this.config = { clicksToEdit: 2, ...config };
  }

  init(tree: CellEditingTreePanel): void {
    this.tree = tree;
    const clicksToEdit = this.config.clicksToEdit ?? 2;
    const eventName = clicksToEdit === 1 ? 'itemclick' : 'itemdblclick';
    tree.on(eventName, (node: NodeInterface) => this.startEdit(node));
  }

  startEdit(record: NodeInterface, fieldName?: string): void {
    if (this.activeEditor) {
      this.completeEdit();
    }

    this.editingNode = record;
    this.field = fieldName ?? 'text';

    const view = this.tree?.getView();
    const rowEl = view?.getNode(record);
    if (!rowEl) return;

    const textEl = rowEl.querySelector('.x-tree-node-text') as HTMLElement | null;
    if (!textEl) return;

    const currentValue = String(record.get(this.field) ?? '');

    this.activeEditor = document.createElement('input');
    this.activeEditor.type = 'text';
    this.activeEditor.value = currentValue;
    this.activeEditor.className = 'x-tree-editor';

    // Replace text span with editor
    textEl.textContent = '';
    textEl.appendChild(this.activeEditor);

    this.activeEditor.focus();
    this.activeEditor.select();

    this.activeEditor.addEventListener('blur', () => this.completeEdit());
    this.activeEditor.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        this.completeEdit();
      } else if (e.key === 'Escape') {
        this.cancelEdit();
      }
    });
  }

  completeEdit(): void {
    if (!this.activeEditor || !this.editingNode) return;

    const newValue = this.activeEditor.value;
    (this.editingNode as any).set(this.field, newValue);

    this.cleanupEditor();
  }

  cancelEdit(): void {
    if (!this.activeEditor) return;
    this.cleanupEditor();
  }

  private cleanupEditor(): void {
    if (this.activeEditor) {
      const parent = this.activeEditor.parentElement;
      if (parent) {
        parent.removeChild(this.activeEditor);
        const node = this.editingNode;
        if (node) {
          parent.textContent = String(node.get(this.field) ?? '');
        }
      }
    }
    this.activeEditor = null;
    this.editingNode = null;
  }

  isEditing(): boolean {
    return this.activeEditor !== null;
  }

  destroy(): void {
    this.cancelEdit();
    this.tree = null;
  }
}
