/**
 * @framesquared/ui – TreeGridSelectionModel
 *
 * Selection model for TreeGrid. Supports SINGLE, SIMPLE, and MULTI modes.
 * Tree-aware: tracks selected nodes from flatData, supports range selection.
 */

import type { NodeInterface } from '@framesquared/data';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TreeGridSelectionModelConfig {
  mode?: 'SINGLE' | 'SIMPLE' | 'MULTI';
  deselectOnCollapse?: boolean;
  pruneRemoved?: boolean;
  checkboxSelect?: boolean;
}

// ---------------------------------------------------------------------------
// TreeGridSelectionModel
// ---------------------------------------------------------------------------

export class TreeGridSelectionModel {
  private mode: 'SINGLE' | 'SIMPLE' | 'MULTI';
  private selected = new Set<NodeInterface>();
  private listeners = new Map<string, ((...args: unknown[]) => void)[]>();
  readonly deselectOnCollapse: boolean;
  readonly pruneRemoved: boolean;
  readonly checkboxSelect: boolean;
  private anchor: NodeInterface | null = null;

  constructor(config: TreeGridSelectionModelConfig = {}) {
    this.mode = config.mode ?? 'SINGLE';
    this.deselectOnCollapse = config.deselectOnCollapse ?? false;
    this.pruneRemoved = config.pruneRemoved ?? true;
    this.checkboxSelect = config.checkboxSelect ?? false;
  }

  // -------------------------------------------------------------------------
  // Event system
  // -------------------------------------------------------------------------

  on(event: string, fn: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.listeners.get(event)!.push(fn);
  }

  un(event: string, fn: (...args: unknown[]) => void): void {
    const fns = this.listeners.get(event);
    if (!fns) return;
    const i = fns.indexOf(fn);
    if (i !== -1) fns.splice(i, 1);
  }

  private fireEvent(event: string, ...args: unknown[]): void {
    for (const fn of [...(this.listeners.get(event) ?? [])]) fn(...args);
  }

  // -------------------------------------------------------------------------
  // Core selection
  // -------------------------------------------------------------------------

  select(
    nodes: NodeInterface | NodeInterface[],
    keepExisting = false,
    suppressEvent = false,
  ): void {
    const isArray = Array.isArray(nodes);
    const toSelect = isArray ? (nodes as NodeInterface[]) : [nodes as NodeInterface];
    if (!keepExisting) {
      this.selected.clear();
    }
    for (const node of toSelect) {
      // In SINGLE mode with a single node, enforce single selection
      if (this.mode === 'SINGLE' && !isArray) {
        this.selected.clear();
      }
      this.selected.add(node);
      this.anchor = node;
    }
    if (!suppressEvent) this.fireEvent('selectionchange', this, this.getSelection());
  }

  deselect(nodes: NodeInterface | NodeInterface[], suppressEvent = false): void {
    const toDeselect = Array.isArray(nodes) ? nodes : [nodes];
    for (const node of toDeselect) this.selected.delete(node);
    if (!suppressEvent) this.fireEvent('selectionchange', this, this.getSelection());
  }

  deselectAll(suppressEvent = false): void {
    this.selected.clear();
    this.anchor = null;
    if (!suppressEvent) this.fireEvent('selectionchange', this, []);
  }

  selectAll(flatData: NodeInterface[], suppressEvent = false): void {
    for (const node of flatData) this.selected.add(node);
    if (!suppressEvent) this.fireEvent('selectionchange', this, this.getSelection());
  }

  /**
   * Selects a range of nodes between anchor and the given node (inclusive).
   */
  selectRange(flatData: NodeInterface[], toNode: NodeInterface, suppressEvent = false): void {
    if (this.mode !== 'MULTI') return;
    const anchorIdx = this.anchor ? flatData.indexOf(this.anchor) : 0;
    const toIdx = flatData.indexOf(toNode);
    if (anchorIdx === -1 || toIdx === -1) return;
    const lo = Math.min(anchorIdx, toIdx);
    const hi = Math.max(anchorIdx, toIdx);
    this.selected.clear();
    for (let i = lo; i <= hi; i++) this.selected.add(flatData[i]);
    if (!suppressEvent) this.fireEvent('selectionchange', this, this.getSelection());
  }

  isSelected(node: NodeInterface): boolean {
    return this.selected.has(node);
  }

  getSelection(): NodeInterface[] {
    return Array.from(this.selected);
  }

  getCount(): number {
    return this.selected.size;
  }

  getMode(): string {
    return this.mode;
  }

  setMode(mode: 'SINGLE' | 'SIMPLE' | 'MULTI'): void {
    this.mode = mode;
    if (mode === 'SINGLE' && this.selected.size > 1) {
      const first = this.selected.values().next().value;
      this.selected.clear();
      if (first) this.selected.add(first);
    }
  }

  /**
   * Removes a node from selection (for use when a node is removed from the store).
   */
  onNodeRemoved(node: NodeInterface): void {
    if (this.pruneRemoved) {
      this.selected.delete(node);
    }
  }

  /**
   * If deselectOnCollapse=true, deselects descendants of collapsed node.
   */
  onNodeCollapsed(node: NodeInterface): void {
    if (!this.deselectOnCollapse) return;
    node.cascadeBy((child) => {
      if (child !== node) this.selected.delete(child);
    });
  }

  /**
   * Selects all children of a node (direct or deep).
   */
  selectChildren(
    node: NodeInterface,
    deep = false,
    keepExisting = false,
    suppressEvent = false,
  ): void {
    if (!keepExisting) this.selected.clear();
    if (deep) {
      node.cascadeBy((child) => {
        if (child !== node) this.selected.add(child);
      });
    } else {
      node.eachChild((child) => {
        this.selected.add(child);
      });
    }
    if (!suppressEvent) this.fireEvent('selectionchange', this, this.getSelection());
  }

  deselectChildren(node: NodeInterface, deep = false, suppressEvent = false): void {
    if (deep) {
      node.cascadeBy((child) => {
        if (child !== node) this.selected.delete(child);
      });
    } else {
      node.eachChild((child) => {
        this.selected.delete(child);
      });
    }
    if (!suppressEvent) this.fireEvent('selectionchange', this, this.getSelection());
  }
}
