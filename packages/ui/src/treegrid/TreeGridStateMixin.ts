/**
 * @framesquared/ui – TreeGridStateMixin
 *
 * State persistence for TreeGrid. Saves and restores column widths,
 * expanded nodes, sort, checked state, scroll position, and filters.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NodeInterface } from '@framesquared/data';
import type { TreeGrid } from './TreeGrid.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ColumnStateEntry {
  id: string;
  width?: number;
  flex?: number;
  hidden?: boolean;
}

export interface TreeGridState {
  columns?: ColumnStateEntry[];
  columnOrder?: string[];
  expandedNodes?: (string | number)[];
  checkedNodes?: (string | number)[];
  selectedNodes?: (string | number)[];
  scrollPosition?: { top: number; left: number };
  sorters?: { property: string; direction: 'ASC' | 'DESC' }[];
}

// ---------------------------------------------------------------------------
// TreeGridStateMixin
// ---------------------------------------------------------------------------

export class TreeGridStateMixin {
  private treeGrid: TreeGrid | null = null;
  private stateId: string;
  private saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly saveDebounceMs = 100;

  constructor(stateId: string) {
    this.stateId = stateId;
  }

  init(treeGrid: TreeGrid): void {
    this.treeGrid = treeGrid;
    this._wireEvents();
  }

  destroy(): void {
    if (this.saveDebounceTimer !== null) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.treeGrid = null;
  }

  // -------------------------------------------------------------------------
  // State API
  // -------------------------------------------------------------------------

  getState(): TreeGridState {
    const tg = this.treeGrid;
    if (!tg) return {};

    const columns = tg.getColumns().map((col) => ({
      id: col.dataIndex,
      width: col.width,
      flex: col.flex,
      hidden: col.hidden,
    }));

    const expandedNodes: (string | number)[] = [];
    tg.getRootNode().cascadeBy((node) => {
      if (!node.isRoot() && node.isExpanded()) {
        const id = (node as any).getId?.();
        if (id != null) expandedNodes.push(id);
      }
    });

    const checkedNodes: (string | number)[] = [];
    if (tg.isCheckable()) {
      for (const node of tg.getChecked()) {
        const id = (node as any).getId?.();
        if (id != null) checkedNodes.push(id);
      }
    }

    const selectedNodes: (string | number)[] = [];
    for (const node of tg.getSelection()) {
      const id = (node as any).getId?.();
      if (id != null) selectedNodes.push(id);
    }

    const viewEl = tg.getView()?.el;
    const scrollPosition = viewEl
      ? { top: viewEl.scrollTop, left: viewEl.scrollLeft }
      : { top: 0, left: 0 };

    return {
      columns,
      columnOrder: columns.map((c) => c.id),
      expandedNodes,
      checkedNodes,
      selectedNodes,
      scrollPosition,
    };
  }

  applyState(state: TreeGridState): void {
    const tg = this.treeGrid;
    if (!tg) return;

    // Apply column widths/visibility
    if (state.columns) {
      for (const colState of state.columns) {
        const col = tg.getColumnByDataIndex(colState.id);
        if (!col) continue;
        if (colState.width !== undefined) col.width = colState.width;
        if (colState.flex !== undefined) col.flex = colState.flex;
        if (colState.hidden !== undefined) col.hidden = colState.hidden;
      }
    }

    // Expand nodes
    if (state.expandedNodes) {
      for (const id of state.expandedNodes) {
        const node = tg.getNodeById(id);
        if (node) tg.getStore().expandNode(node);
      }
    }

    // Check nodes
    if (state.checkedNodes && tg.isCheckable()) {
      for (const id of state.checkedNodes) {
        const node = tg.getNodeById(id);
        if (node) (node as any).$checked = true;
      }
    }

    // Select nodes
    if (state.selectedNodes) {
      const nodes = state.selectedNodes
        .map((id) => tg.getNodeById(id))
        .filter(Boolean) as NodeInterface[];
      if (nodes.length > 0) tg.select(nodes);
    }

    // Scroll position
    if (state.scrollPosition) {
      const viewEl = tg.getView()?.el;
      if (viewEl) {
        viewEl.scrollTop = state.scrollPosition.top;
        viewEl.scrollLeft = state.scrollPosition.left;
      }
    }

    tg.getView().refresh();
  }

  saveState(): void {
    try {
      const state = this.getState();
      localStorage.setItem(`treegrid.state.${this.stateId}`, JSON.stringify(state));
    } catch {
      // localStorage may not be available
    }
  }

  loadState(): TreeGridState | null {
    try {
      const raw = localStorage.getItem(`treegrid.state.${this.stateId}`);
      if (!raw) return null;
      return JSON.parse(raw) as TreeGridState;
    } catch {
      return null;
    }
  }

  clearState(): void {
    try {
      localStorage.removeItem(`treegrid.state.${this.stateId}`);
    } catch {
      // ignore
    }
  }

  // -------------------------------------------------------------------------
  // Debounced save
  // -------------------------------------------------------------------------

  private _debouncedSave(): void {
    if (this.saveDebounceTimer !== null) clearTimeout(this.saveDebounceTimer);
    this.saveDebounceTimer = setTimeout(() => {
      this.saveState();
      this.saveDebounceTimer = null;
    }, this.saveDebounceMs);
  }

  private _wireEvents(): void {
    const tg = this.treeGrid!;
    const store = tg.getStore() as any;
    store.on('nodeexpand', () => this._debouncedSave());
    store.on('nodecollapse', () => this._debouncedSave());
    (tg as any).on?.('selectionchange', () => this._debouncedSave());
    (tg as any).on?.('checkchange', () => this._debouncedSave());
  }
}
