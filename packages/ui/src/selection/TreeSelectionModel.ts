/**
 * @framesquared/ui – TreeSelectionModel
 *
 * Manages selection state for tree nodes, supporting single and multi-select modes.
 */

import type { NodeInterface } from '@framesquared/data';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TreeSelectionModelConfig {
  mode?: 'single' | 'multi' | 'simple';
  pruneRemoved?: boolean;
}

// ---------------------------------------------------------------------------
// TreeSelectionModel
// ---------------------------------------------------------------------------

export class TreeSelectionModel {
  private selected: Set<NodeInterface>;
  private mode: string;
  private pruneRemoved: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private listeners: Map<string, ((...args: any[]) => void)[]>;

  constructor(config?: TreeSelectionModelConfig) {
    this.selected = new Set();
    this.mode = config?.mode ?? 'single';
    this.pruneRemoved = config?.pruneRemoved ?? true;
    this.listeners = new Map();
  }

  // -------------------------------------------------------------------------
  // Event system
  // -------------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, fn: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.listeners.get(event)!.push(fn);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  un(event: string, fn: (...args: any[]) => void): void {
    const fns = this.listeners.get(event);
    if (!fns) return;
    const idx = fns.indexOf(fn);
    if (idx !== -1) fns.splice(idx, 1);
  }

  fireEvent(event: string, ...args: unknown[]): void {
    const fns = this.listeners.get(event);
    if (!fns) return;
    for (const fn of [...fns]) {
      fn(...args);
    }
  }

  // -------------------------------------------------------------------------
  // Selection API
  // -------------------------------------------------------------------------

  select(
    records: NodeInterface | NodeInterface[],
    keepExisting = false,
    suppressEvent = false,
  ): void {
    const toSelect = Array.isArray(records) ? records : [records];
    if (!keepExisting && this.mode !== 'simple') {
      this.selected.clear();
    }
    if (this.mode === 'single' && toSelect.length > 0) {
      this.selected.clear();
      this.selected.add(toSelect[toSelect.length - 1]);
    } else {
      for (const record of toSelect) {
        this.selected.add(record);
      }
    }
    if (!suppressEvent) {
      this.fireEvent('selectionchange', this, this.getSelection());
    }
  }

  deselect(records: NodeInterface | NodeInterface[], suppressEvent = false): void {
    const toDeselect = Array.isArray(records) ? records : [records];
    for (const record of toDeselect) {
      this.selected.delete(record);
    }
    if (!suppressEvent) {
      this.fireEvent('selectionchange', this, this.getSelection());
    }
  }

  deselectAll(suppressEvent = false): void {
    this.selected.clear();
    if (!suppressEvent) {
      this.fireEvent('selectionchange', this, this.getSelection());
    }
  }

  isSelected(record: NodeInterface): boolean {
    return this.selected.has(record);
  }

  getSelection(): NodeInterface[] {
    return Array.from(this.selected);
  }

  getCount(): number {
    return this.selected.size;
  }

  // Convenience aliases matching Ext-style API
  selectNode(node: NodeInterface, keepExisting = false, suppressEvent = false): void {
    this.select(node, keepExisting, suppressEvent);
  }

  deselectNode(node: NodeInterface, suppressEvent = false): void {
    this.deselect(node, suppressEvent);
  }

  isNodeSelected(node: NodeInterface): boolean {
    return this.isSelected(node);
  }

  // -------------------------------------------------------------------------
  // Pruning
  // -------------------------------------------------------------------------

  pruneRemovedNodes(removedNodes: NodeInterface[]): void {
    if (!this.pruneRemoved) return;
    for (const node of removedNodes) {
      this.selected.delete(node);
    }
  }
}
