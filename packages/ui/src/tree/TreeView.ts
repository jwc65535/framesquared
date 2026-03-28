/**
 * @framesquared/ui – TreeView
 *
 * Renders the flat list of visible tree nodes in a <table>.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { TreeStore, NodeInterface } from '@framesquared/data';
import { TreeColumn } from './TreeColumn.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TreeViewConfig {
  store: TreeStore;
  displayField?: string;
  checkable?: boolean;
  column?: TreeColumn;
}

// ---------------------------------------------------------------------------
// TreeView
// ---------------------------------------------------------------------------

export class TreeView {
  el: HTMLElement | null = null;
  private tableEl: HTMLTableElement | null = null;
  private store: TreeStore;
  private displayField: string;
  private checkable: boolean;
  private column: TreeColumn;
  private listeners: Map<string, Function[]> = new Map();

  constructor(config: TreeViewConfig) {
    this.store = config.store;
    this.displayField = config.displayField ?? 'text';
    this.checkable = config.checkable ?? false;
    this.column = config.column ?? new TreeColumn({ dataIndex: this.displayField });
  }

  // -------------------------------------------------------------------------
  // Event system
  // -------------------------------------------------------------------------

  on(event: string, fn: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(fn);
  }

  un(event: string, fn: Function): void {
    const fns = this.listeners.get(event);
    if (!fns) return;
    const idx = fns.indexOf(fn);
    if (idx !== -1) fns.splice(idx, 1);
  }

  private fireEvent(event: string, ...args: unknown[]): void {
    const fns = this.listeners.get(event);
    if (!fns) return;
    for (const fn of [...fns]) {
      fn(...args);
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  render(container: HTMLElement): void {
    this.el = document.createElement('div');
    this.el.className = 'x-tree-view';
    this.el.setAttribute('role', 'tree');

    this.tableEl = document.createElement('table');
    this.tableEl.className = 'x-tree-table';
    this.el.appendChild(this.tableEl);

    container.appendChild(this.el);

    this.el.addEventListener('click', this.onViewClick.bind(this));
    this.el.addEventListener('dblclick', this.onViewDblClick.bind(this));
    this.el.addEventListener('contextmenu', this.onViewContextMenu.bind(this));
    this.el.addEventListener('keydown', this.onKeyDown.bind(this));

    this.refresh();
  }

  // -------------------------------------------------------------------------
  // Node rendering
  // -------------------------------------------------------------------------

  refresh(): void {
    if (!this.tableEl) return;
    this.tableEl.innerHTML = '';

    const nodes = this.store.flattenNodes() as NodeInterface[];
    // flattenNodes includes root; we skip root (it has no parentNode)
    for (const node of nodes) {
      if (node.isRoot()) continue;
      const tr = this.buildRow(node);
      this.tableEl.appendChild(tr);
    }
  }

  private buildRow(node: NodeInterface): HTMLTableRowElement {
    const tr = document.createElement('tr');
    tr.className = 'x-tree-node';
    tr.setAttribute('role', 'treeitem');
    tr.setAttribute('aria-level', String(node.depth ?? 1));
    tr.setAttribute('tabindex', '-1');

    const id = (node as any).getId?.();
    if (id !== undefined && id !== null) {
      tr.setAttribute('data-node-id', String(id));
    }

    if (node.isExpanded()) {
      tr.classList.add('x-tree-expanded');
      tr.setAttribute('aria-expanded', 'true');
    } else if (!node.isLeaf()) {
      tr.setAttribute('aria-expanded', 'false');
    }

    if (node.isLeaf()) {
      tr.classList.add('x-tree-leaf');
    }

    const td = document.createElement('td');
    td.className = 'x-tree-cell';
    td.innerHTML = this.column.renderCell(node, this.checkable);
    tr.appendChild(td);

    return tr;
  }

  refreshNode(record: NodeInterface): void {
    const row = this.getNode(record);
    if (!row || !this.tableEl) return;

    const newRow = this.buildRow(record);
    this.tableEl.replaceChild(newRow, row);
  }

  // -------------------------------------------------------------------------
  // Node lookup
  // -------------------------------------------------------------------------

  getNode(record: NodeInterface): HTMLElement | null {
    if (!this.tableEl) return null;
    const id = (record as any).getId?.();
    if (id === undefined || id === null) return null;
    return this.tableEl.querySelector(`[data-node-id="${String(id).replace(/"/g, '\\"')}"]`);
  }

  getRecord(el: HTMLElement): NodeInterface | null {
    // Walk up to find a row with data-node-id
    let target: HTMLElement | null = el;
    while (target && target !== this.el) {
      const id = target.getAttribute('data-node-id');
      if (id !== null) {
        return this.store.getNodeById(id) as NodeInterface | null ?? null;
      }
      target = target.parentElement;
    }
    return null;
  }

  focusNode(record: NodeInterface): void {
    const row = this.getNode(record);
    if (!row) return;
    // Reset all tabindexes
    if (this.tableEl) {
      this.tableEl.querySelectorAll('[tabindex]').forEach((el) => {
        (el as HTMLElement).setAttribute('tabindex', '-1');
      });
    }
    row.setAttribute('tabindex', '0');
    (row as HTMLElement).focus();
  }

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  private getRowRecord(e: Event): NodeInterface | null {
    const target = e.target as HTMLElement;
    if (!target) return null;
    let el: HTMLElement | null = target;
    while (el && el !== this.el) {
      if (el.hasAttribute('data-node-id')) {
        const id = el.getAttribute('data-node-id')!;
        return this.store.getNodeById(id) as NodeInterface | null ?? null;
      }
      el = el.parentElement;
    }
    return null;
  }

  private onViewClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    // Check if click was on expander
    if (target.classList.contains('x-tree-expander')) {
      const record = this.getRowRecord(e);
      if (record) {
        if (record.isExpanded()) {
          this.store.collapseNode(record);
        } else {
          this.store.expandNode(record);
        }
        this.fireEvent('expanderclick', record);
        return;
      }
    }
    const record = this.getRowRecord(e);
    if (record) {
      this.fireEvent('itemclick', record, e);
    }
  }

  private onViewDblClick(e: MouseEvent): void {
    const record = this.getRowRecord(e);
    if (record) {
      this.fireEvent('itemdblclick', record, e);
    }
  }

  private onViewContextMenu(e: MouseEvent): void {
    const record = this.getRowRecord(e);
    if (record) {
      this.fireEvent('itemcontextmenu', record, e);
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    const rows = this.tableEl
      ? Array.from(this.tableEl.querySelectorAll('tr[data-node-id]')) as HTMLElement[]
      : [];
    const focused = document.activeElement as HTMLElement;
    const idx = rows.indexOf(focused);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = rows[idx + 1];
      if (next) {
        next.setAttribute('tabindex', '0');
        focused?.setAttribute('tabindex', '-1');
        next.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = rows[idx - 1];
      if (prev) {
        prev.setAttribute('tabindex', '0');
        focused?.setAttribute('tabindex', '-1');
        prev.focus();
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (focused) {
        const record = this.getRecord(focused);
        if (record) {
          this.fireEvent('itemclick', record, e);
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Selection helpers
  // -------------------------------------------------------------------------

  markSelected(record: NodeInterface, selected: boolean): void {
    const row = this.getNode(record);
    if (!row) return;
    if (selected) {
      row.classList.add('x-tree-selected');
    } else {
      row.classList.remove('x-tree-selected');
    }
  }
}
