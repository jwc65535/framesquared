/**
 * @framesquared/ui – TreeGridRowExpander
 *
 * Plugin adding a detail-view expander column to each row.
 * Independent from tree expand/collapse.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NodeInterface } from '@framesquared/data';
import type { TreeGrid } from './TreeGrid.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TreeGridRowExpanderConfig {
  rowBodyTpl?: string;
  expandOnDblClick?: boolean;
  singleRowExpand?: boolean;
  bodyIndent?: boolean;
}

// ---------------------------------------------------------------------------
// TreeGridRowExpander
// ---------------------------------------------------------------------------

export class TreeGridRowExpander {
  private treeGrid: TreeGrid | null = null;
  private config: Required<TreeGridRowExpanderConfig>;
  private expandedRows: Set<string | number> = new Set();
  private bodyRowMap: Map<string | number, HTMLElement> = new Map();

  private _onClick: (e: MouseEvent) => void;
  private _onDblClick: (e: MouseEvent) => void;

  constructor(config: TreeGridRowExpanderConfig = {}) {
    this.config = {
      rowBodyTpl: config.rowBodyTpl ?? '',
      expandOnDblClick: config.expandOnDblClick ?? false,
      singleRowExpand: config.singleRowExpand ?? false,
      bodyIndent: config.bodyIndent ?? true,
    };
    this._onClick = this._handleClick.bind(this);
    this._onDblClick = this._handleDblClick.bind(this);
  }

  init(treeGrid: TreeGrid): void {
    this.treeGrid = treeGrid;
    const viewEl = treeGrid.getView()?.el;
    if (!viewEl) return;
    viewEl.addEventListener('click', this._onClick);
    if (this.config.expandOnDblClick) {
      viewEl.addEventListener('dblclick', this._onDblClick);
    }
  }

  destroy(): void {
    const viewEl = this.treeGrid?.getView()?.el;
    if (viewEl) {
      viewEl.removeEventListener('click', this._onClick);
      viewEl.removeEventListener('dblclick', this._onDblClick);
    }
    this.bodyRowMap.forEach((el) => el.remove());
    this.bodyRowMap.clear();
    this.expandedRows.clear();
    this.treeGrid = null;
  }

  // -------------------------------------------------------------------------
  // Expand / Collapse
  // -------------------------------------------------------------------------

  expandRow(record: NodeInterface): void {
    const id = (record as any).getId?.();
    if (id == null) return;

    if (this.config.singleRowExpand) {
      // Collapse all others first
      for (const existingId of this.expandedRows) {
        if (existingId !== id) this._collapseById(existingId);
      }
    }

    if (this.expandedRows.has(id)) return;
    this.expandedRows.add(id);
    this._insertBodyRow(record);
  }

  collapseRow(record: NodeInterface): void {
    const id = (record as any).getId?.();
    if (id == null) return;
    this._collapseById(id);
  }

  toggleRow(record: NodeInterface): void {
    const id = (record as any).getId?.();
    if (id == null) return;
    if (this.expandedRows.has(id)) {
      this.collapseRow(record);
    } else {
      this.expandRow(record);
    }
  }

  isRowExpanded(record: NodeInterface): boolean {
    const id = (record as any).getId?.();
    return id != null && this.expandedRows.has(id);
  }

  // -------------------------------------------------------------------------
  // DOM
  // -------------------------------------------------------------------------

  private _insertBodyRow(record: NodeInterface): void {
    const tg = this.treeGrid!;
    const view = tg.getView();
    const row = view.getNodeRow(record);
    if (!row) return;

    const colCount = tg.getColumns().filter((c) => !c.hidden).length + 1; // +1 for expander col

    const bodyRow = document.createElement('tr');
    bodyRow.className = 'x-treegrid-row-body';

    const td = document.createElement('td');
    td.colSpan = colCount;
    td.className = 'x-treegrid-row-body-cell';

    if (this.config.bodyIndent) {
      const depth = record.depth ?? 0;
      const indent = depth * tg.getTreeColumn().indentSize;
      td.style.paddingLeft = `${indent + tg.getTreeColumn().indentSize}px`;
    }

    const content = this.config.rowBodyTpl
      ? this._renderTpl(this.config.rowBodyTpl, record)
      : '';
    td.innerHTML = content;

    bodyRow.appendChild(td);

    // Insert after the data row (before tree children)
    row.insertAdjacentElement('afterend', bodyRow);

    const id = (record as any).getId?.();
    if (id != null) this.bodyRowMap.set(id, bodyRow);
  }

  private _collapseById(id: string | number): void {
    const bodyRow = this.bodyRowMap.get(id);
    bodyRow?.remove();
    this.bodyRowMap.delete(id);
    this.expandedRows.delete(id);
  }

  private _renderTpl(tpl: string, record: NodeInterface): string {
    return tpl.replace(/\{(\w+)\}/g, (_match, field) => {
      return String((record as any).get?.(field) ?? '');
    });
  }

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  private _handleClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('x-treegrid-row-expander-btn')) return;
    const view = this.treeGrid?.getView();
    if (!view) return;
    const record = view.getRecord(target);
    if (record) this.toggleRow(record);
  }

  private _handleDblClick(e: MouseEvent): void {
    const view = this.treeGrid?.getView();
    if (!view) return;
    const record = view.getNodeByEvent(e);
    if (record) this.toggleRow(record);
  }
}
