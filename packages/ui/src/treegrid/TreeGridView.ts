/**
 * @framesquared/ui – TreeGridView
 *
 * Renders the tree grid body: a <table> with rows for each visible node.
 * First column uses TreeGridColumn for tree chrome; subsequent columns render plain values.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { TreeStore, NodeInterface } from '@framesquared/data';
import type { Column } from './TreeGridColumn.js';
import { TreeGridColumn } from './TreeGridColumn.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TreeGridViewConfig {
  store: TreeStore;
  columns: (TreeGridColumn | Column)[];
  rootVisible?: boolean;
  checkable?: boolean;
  lines?: boolean;
  animate?: boolean;
  animationDuration?: number;
  expanderSelector?: string;
  checkboxSelector?: string;
}

// ---------------------------------------------------------------------------
// TreeGridView
// ---------------------------------------------------------------------------

export class TreeGridView {
  el: HTMLElement | null = null;
  private tableEl: HTMLTableElement | null = null;
  private tbodyEl: HTMLTableSectionElement | null = null;

  private store: TreeStore;
  private columns: (TreeGridColumn | Column)[];
  private rootVisible: boolean;
  private checkable: boolean;
  private lines: boolean;

  private listeners = new Map<string, ((...args: any[]) => void)[]>();
  private focusedNode: NodeInterface | null = null;
  private _rowCache = new Map<string, HTMLTableRowElement>();

  constructor(config: TreeGridViewConfig) {
    this.store = config.store;
    this.columns = config.columns;
    this.rootVisible = config.rootVisible ?? false;
    this.checkable = config.checkable ?? false;
    this.lines = config.lines ?? false;
  }

  // -------------------------------------------------------------------------
  // Event system
  // -------------------------------------------------------------------------

  on(event: string, fn: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.listeners.get(event)!.push(fn);
  }

  un(event: string, fn: (...args: any[]) => void): void {
    const fns = this.listeners.get(event);
    if (!fns) return;
    const i = fns.indexOf(fn);
    if (i !== -1) fns.splice(i, 1);
  }

  private fireEvent(event: string, ...args: unknown[]): void {
    for (const fn of [...(this.listeners.get(event) ?? [])]) fn(...args);
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  render(container: HTMLElement): void {
    this.el = document.createElement('div');
    this.el.className = 'x-treegrid-view';
    this.el.setAttribute('role', 'treegrid');

    this.tableEl = document.createElement('table');
    this.tableEl.className = 'x-treegrid-table';
    this.el.appendChild(this.tableEl);

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.className = 'x-treegrid-header-row';
    for (const col of this.columns) {
      if (col.hidden) continue;
      const th = document.createElement('th');
      th.className = 'x-treegrid-column-header';
      th.textContent = col.text;
      if (col.width) th.style.width = `${col.width}px`;
      else if (col.flex) th.style.width = '';
      thead.appendChild(headerRow);
      headerRow.appendChild(th);
    }
    this.tableEl.appendChild(thead);

    this.tbodyEl = document.createElement('tbody');
    this.tableEl.appendChild(this.tbodyEl);

    container.appendChild(this.el);

    this.el.addEventListener('click', this._onViewClick.bind(this));
    this.el.addEventListener('dblclick', this._onViewDblClick.bind(this));
    this.el.addEventListener('contextmenu', this._onViewContextMenu.bind(this));
    this.el.addEventListener('keydown', this._onKeyDown.bind(this));

    this.refresh();
  }

  // -------------------------------------------------------------------------
  // Node rendering
  // -------------------------------------------------------------------------

  refresh(): void {
    if (!this.tbodyEl) return;
    // Destroy any live widget instances before clearing the DOM
    for (const col of this.columns) {
      if ('destroyWidgets' in col && typeof (col as any).destroyWidgets === 'function') {
        (col as any).destroyWidgets();
      }
    }
    this.tbodyEl.innerHTML = '';
    this._rowCache.clear();

    const flatData = this.store.flattenNodes() as NodeInterface[];
    const frag = document.createDocumentFragment();
    for (const node of flatData) {
      if (node.isRoot() && !this.rootVisible) continue;
      if ((node as any)._filterHidden) continue;
      frag.appendChild(this._buildRow(node));
    }
    this.tbodyEl.appendChild(frag);
  }

  private _buildRow(node: NodeInterface): HTMLTableRowElement {
    const tr = document.createElement('tr');
    tr.className = 'x-grid-row x-treegrid-node';
    tr.setAttribute('role', 'row');
    const nodeId = String((node as any).getId?.() ?? '');
    tr.setAttribute('data-record-id', nodeId);
    tr.setAttribute('data-depth', String(node.depth ?? 0));
    if (nodeId) this._rowCache.set(nodeId, tr);
    tr.setAttribute('tabindex', '-1');

    // ARIA
    const isExplicitLeaf = (node as any).get('leaf') === true;
    tr.setAttribute('aria-level', String((node.depth ?? 0) + 1));
    if (!isExplicitLeaf) {
      tr.setAttribute('aria-expanded', node.isExpanded() ? 'true' : 'false');
    }
    tr.setAttribute('aria-selected', 'false');

    const parent = node.parentNode;
    if (parent) {
      tr.setAttribute('aria-setsize', String(parent.childNodes.length));
      const idx = parent.childNodes.indexOf(node);
      tr.setAttribute('aria-posinset', String(idx + 1));
    }

    if (node.isExpanded()) tr.classList.add('x-treegrid-expanded');
    else if (!isExplicitLeaf) tr.classList.add('x-treegrid-collapsed');
    if (isExplicitLeaf) tr.classList.add('x-treegrid-leaf');
    if (node.isRoot()) tr.classList.add('x-treegrid-root-node');

    // Cells
    for (const col of this.columns) {
      if (col.hidden) continue;
      const td = document.createElement('td');
      td.className = 'x-grid-cell';
      td.setAttribute('role', 'gridcell');
      const inner = document.createElement('div');
      inner.className = 'x-grid-cell-inner';

      if (col instanceof TreeGridColumn) {
        td.classList.add('x-treegrid-cell');
        inner.innerHTML = col.renderCell(node, this.checkable, this.lines);
      } else {
        inner.innerHTML = col.renderValue(node);
        // WidgetColumn: mount the component after the cell inner is in the DOM
        if ('mountToCell' in col && typeof (col as any).mountToCell === 'function') {
          (col as any).mountToCell(inner, node);
        }
      }

      td.appendChild(inner);
      tr.appendChild(td);
    }

    return tr;
  }

  refreshNode(record: NodeInterface): void {
    const row = this.getNodeRow(record);
    if (!row || !this.tbodyEl) return;
    const newRow = this._buildRow(record);
    // Transfer focus state
    if (row.getAttribute('tabindex') === '0') {
      newRow.setAttribute('tabindex', '0');
    }
    if (row.getAttribute('aria-selected') === 'true') {
      newRow.setAttribute('aria-selected', 'true');
      newRow.classList.add('x-treegrid-selected');
    }
    this.tbodyEl.replaceChild(newRow, row);
    // _buildRow already updated cache; no extra step needed
  }

  // -------------------------------------------------------------------------
  // Expand / Collapse DOM updates
  // -------------------------------------------------------------------------

  onNodeExpand(parentNode: NodeInterface, childNodes: NodeInterface[]): void {
    if (!this.tbodyEl) return;
    const parentRow = this.getNodeRow(parentNode);

    // Update parent row expand state
    if (parentRow) {
      parentRow.classList.remove('x-treegrid-collapsed');
      parentRow.classList.add('x-treegrid-expanded');
      parentRow.setAttribute('aria-expanded', 'true');
      // Refresh tree column cell (to update expander icon)
      this._refreshTreeColumnCell(parentRow as HTMLTableRowElement, parentNode);
    }

    // Insert child rows after parent row
    if (parentRow) {
      const newRows: HTMLTableRowElement[] = [];
      for (const child of this._flattenVisible(parentNode)) {
        if (child === parentNode) continue;
        newRows.push(this._buildRow(child));
      }
      let refNode: Node = parentRow;
      for (const rowEl of newRows) {
        refNode.parentNode?.insertBefore(rowEl, refNode.nextSibling);
        refNode = rowEl;
      }
    }

    this.fireEvent('expand', parentNode, childNodes);
  }

  onNodeCollapse(parentNode: NodeInterface): void {
    if (!this.tbodyEl) return;
    const parentRow = this.getNodeRow(parentNode);

    if (parentRow) {
      parentRow.classList.remove('x-treegrid-expanded');
      parentRow.classList.add('x-treegrid-collapsed');
      parentRow.setAttribute('aria-expanded', 'false');
      this._refreshTreeColumnCell(parentRow as HTMLTableRowElement, parentNode);
    }

    // Remove all descendant rows
    const rows = Array.from(this.tbodyEl.querySelectorAll('tr[data-record-id]')) as HTMLElement[];
    const toRemove: HTMLElement[] = [];
    let removing = false;

    for (const row of rows) {
      if (removing) {
        const rowDepth = parseInt(row.getAttribute('data-depth') ?? '0', 10);
        const parentDepth = parentNode.depth ?? 0;
        if (rowDepth > parentDepth) {
          toRemove.push(row);
        } else {
          removing = false;
        }
      }
      if (row === parentRow) {
        removing = true;
      }
    }

    for (const row of toRemove) {
      const rid = row.getAttribute('data-record-id');
      if (rid) this._rowCache.delete(rid);
      row.remove();
    }
    this.fireEvent('collapse', parentNode);
  }

  onNodeInsert(parent: NodeInterface, _node: NodeInterface): void {
    if (!parent.isExpanded() && !parent.isRoot()) return;
    this.refresh();
  }

  onNodeRemove(_parent: NodeInterface, node: NodeInterface): void {
    const id = String((node as any).getId?.() ?? '');
    if (id) this._rowCache.delete(id);
    const row = this.getNodeRow(node);
    if (row) row.remove();
  }

  onNodeUpdate(node: NodeInterface): void {
    this.refreshNode(node);
  }

  // -------------------------------------------------------------------------
  // Node lookup
  // -------------------------------------------------------------------------

  getNodeRow(record: NodeInterface): HTMLElement | null {
    if (!this.tbodyEl) return null;
    const id = (record as any).getId?.();
    if (id == null) return null;
    return this._rowCache.get(String(id)) ?? null;
  }

  getRecord(rowElement: HTMLElement): NodeInterface | null {
    let el: HTMLElement | null = rowElement;
    while (el) {
      const id = el.getAttribute('data-record-id');
      if (id !== null) {
        return (this.store.getNodeById(id) as NodeInterface | undefined) ?? null;
      }
      el = el.parentElement;
    }
    return null;
  }

  getNodeByEvent(event: Event): NodeInterface | null {
    return this.getRecord(event.target as HTMLElement);
  }

  // -------------------------------------------------------------------------
  // Focus
  // -------------------------------------------------------------------------

  focusRow(record: NodeInterface): void {
    const row = this.getNodeRow(record);
    if (!row) return;

    // Remove focus from previous
    if (this.tbodyEl) {
      this.tbodyEl.querySelectorAll('tr[tabindex="0"]').forEach((r) => {
        (r as HTMLElement).setAttribute('tabindex', '-1');
        (r as HTMLElement).classList.remove('x-treegrid-focused');
      });
    }

    row.setAttribute('tabindex', '0');
    row.classList.add('x-treegrid-focused');
    this.focusedNode = record;
    row.focus();
  }

  getFocusedNode(): NodeInterface | null {
    return this.focusedNode;
  }

  // -------------------------------------------------------------------------
  // Selection visual update
  // -------------------------------------------------------------------------

  markSelected(record: NodeInterface, selected: boolean): void {
    const row = this.getNodeRow(record);
    if (!row) return;
    row.setAttribute('aria-selected', selected ? 'true' : 'false');
    if (selected) {
      row.classList.add('x-treegrid-selected');
    } else {
      row.classList.remove('x-treegrid-selected');
    }
  }

  // -------------------------------------------------------------------------
  // Loading indicator
  // -------------------------------------------------------------------------

  showLoadingIndicator(node: NodeInterface): void {
    const row = this.getNodeRow(node);
    if (row) row.classList.add('x-treegrid-loading');
  }

  hideLoadingIndicator(node: NodeInterface): void {
    const row = this.getNodeRow(node);
    if (row) row.classList.remove('x-treegrid-loading');
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private _refreshTreeColumnCell(row: HTMLTableRowElement, node: NodeInterface): void {
    const treeColIdx = this.columns.findIndex((c) => c instanceof TreeGridColumn);
    if (treeColIdx === -1) return;
    const cells = row.querySelectorAll('td');
    const visibleIdx = this._visibleColumnIndex(treeColIdx);
    const cell = cells[visibleIdx];
    if (!cell) return;
    const inner = cell.querySelector('.x-grid-cell-inner');
    if (inner) {
      inner.innerHTML = (this.columns[treeColIdx] as TreeGridColumn).renderCell(
        node,
        this.checkable,
        this.lines,
      );
    }
  }

  private _visibleColumnIndex(colIdx: number): number {
    let count = 0;
    for (let i = 0; i < colIdx; i++) {
      if (!this.columns[i].hidden) count++;
    }
    return count;
  }

  private _flattenVisible(node: NodeInterface): NodeInterface[] {
    const result: NodeInterface[] = [];
    const walk = (n: NodeInterface) => {
      result.push(n);
      if (n.isExpanded()) {
        for (const child of n.childNodes) walk(child);
      }
    };
    walk(node);
    return result;
  }

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  private _getRowRecord(e: Event): NodeInterface | null {
    let el = e.target as HTMLElement | null;
    while (el && el !== this.el) {
      if (el.hasAttribute('data-record-id')) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const id = el.getAttribute('data-record-id')!;
        return (this.store.getNodeById(id) as NodeInterface | undefined) ?? null;
      }
      el = el.parentElement;
    }
    return null;
  }

  private _onViewClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;

    // Check if click on expander
    if (
      target.classList.contains('x-treegrid-expander') &&
      !target.classList.contains('x-treegrid-expander-leaf')
    ) {
      const record = this._getRowRecord(e);
      if (record) {
        if (record.isExpanded()) {
          this.store.collapseNode(record);
        } else {
          this.store.expandNode(record);
        }
        this.fireEvent('expanderclick', record, e);
        this.fireEvent('itemclick', record, e);
        return;
      }
    }

    // Check if click on checkbox
    if (target.classList.contains('x-treegrid-checkbox')) {
      const record = this._getRowRecord(e);
      if (record) {
        this.fireEvent('checkboxclick', record, e);
        return;
      }
    }

    const record = this._getRowRecord(e);
    if (record) {
      this.fireEvent('itemclick', record, e);
    }
  }

  private _onViewDblClick(e: MouseEvent): void {
    const record = this._getRowRecord(e);
    if (record) this.fireEvent('itemdblclick', record, e);
  }

  private _onViewContextMenu(e: MouseEvent): void {
    const record = this._getRowRecord(e);
    if (record) this.fireEvent('itemcontextmenu', record, e);
  }

  private _onKeyDown(e: KeyboardEvent): void {
    const rows = this.tbodyEl
      ? (Array.from(this.tbodyEl.querySelectorAll('tr[data-record-id]')) as HTMLElement[])
      : [];
    const focused = document.activeElement as HTMLElement;
    const idx = rows.indexOf(focused);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = rows[idx + 1];
      if (next) {
        focused?.setAttribute('tabindex', '-1');
        focused?.classList.remove('x-treegrid-focused');
        next.setAttribute('tabindex', '0');
        next.classList.add('x-treegrid-focused');
        next.focus();
        const record = this.getRecord(next);
        if (record) this.focusedNode = record;
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = rows[idx - 1];
      if (prev) {
        focused?.setAttribute('tabindex', '-1');
        focused?.classList.remove('x-treegrid-focused');
        prev.setAttribute('tabindex', '0');
        prev.classList.add('x-treegrid-focused');
        prev.focus();
        const record = this.getRecord(prev);
        if (record) this.focusedNode = record;
      }
    } else if (e.key === 'ArrowRight') {
      const record = this.getRecord(focused);
      if (record && !record.isLeaf()) {
        if (!record.isExpanded()) {
          this.store.expandNode(record);
          this.fireEvent('expanderclick', record, e);
        }
      }
    } else if (e.key === 'ArrowLeft') {
      const record = this.getRecord(focused);
      if (record && record.isExpanded()) {
        this.store.collapseNode(record);
        this.fireEvent('expanderclick', record, e);
      } else if (record && record.parentNode && !record.parentNode.isRoot()) {
        const parentRow = this.getNodeRow(record.parentNode);
        if (parentRow) {
          focused?.setAttribute('tabindex', '-1');
          parentRow.setAttribute('tabindex', '0');
          parentRow.focus();
          this.focusedNode = record.parentNode;
        }
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      const record = this.getRecord(focused);
      if (record) this.fireEvent('itemclick', record, e);
    } else if (e.key === 'Home') {
      const first = rows[0];
      if (first) {
        focused?.setAttribute('tabindex', '-1');
        first.setAttribute('tabindex', '0');
        first.focus();
      }
    } else if (e.key === 'End') {
      const last = rows[rows.length - 1];
      if (last) {
        focused?.setAttribute('tabindex', '-1');
        last.setAttribute('tabindex', '0');
        last.focus();
      }
    }
  }

  // -------------------------------------------------------------------------
  // Config updates
  // -------------------------------------------------------------------------

  getColumns(): (TreeGridColumn | Column)[] {
    return this.columns;
  }

  setColumns(columns: (TreeGridColumn | Column)[]): void {
    this.columns = columns;
    this.refresh();
  }

  setCheckable(checkable: boolean): void {
    this.checkable = checkable;
    this.refresh();
  }
}
