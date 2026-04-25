/**
 * @framesquared/ui – TreeGridRowExpander
 *
 * Plugin adding a detail-view expander column to each row.
 * Independent from tree expand/collapse.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NodeInterface } from '@framesquared/data';
import { Component, XTemplate } from '@framesquared/component';
import type { TreeGrid } from './TreeGrid.js';
import { Column } from './TreeGridColumn.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TreeGridRowExpanderConfig {
  rowBodyTpl?: XTemplate | string | ((node: NodeInterface) => string);
  rowBodyComponent?: typeof Component;
  expandOnDblClick?: boolean;
  singleRowExpand?: boolean;
  bodyIndent?: boolean;
}

// ---------------------------------------------------------------------------
// TreeGridRowExpander
// ---------------------------------------------------------------------------

export class TreeGridRowExpander {
  private treeGrid: TreeGrid | null = null;
  private config: {
    rowBodyTpl: XTemplate | string | ((node: NodeInterface) => string);
    rowBodyComponent: typeof Component | undefined;
    expandOnDblClick: boolean;
    singleRowExpand: boolean;
    bodyIndent: boolean;
  };
  private bodyComponentMap = new Map<string | number, Component>();
  private expandedRows = new Set<string | number>();
  private bodyRowMap = new Map<string | number, HTMLElement>();

  private _onClick: (e: MouseEvent) => void;
  private _onDblClick: (e: MouseEvent) => void;

  constructor(config: TreeGridRowExpanderConfig = {}) {
    this.config = {
      rowBodyTpl: config.rowBodyTpl ?? new XTemplate(''),
      rowBodyComponent: config.rowBodyComponent,
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
    this._injectExpanderColumn(treeGrid);
  }

  private _injectExpanderColumn(treeGrid: TreeGrid): void {
    const expanderCol = new Column({
      dataIndex: '',
      text: '',
      width: 28,
      renderer: (_v, record) => {
        const id = (record as any).getId?.();
        const expanded = id != null && this.expandedRows.has(id);
        return `<button class="x-treegrid-row-expander-btn" title="${expanded ? 'Collapse' : 'Expand row'}">${expanded ? '&#9660;' : '&#9654;'}</button>`;
      },
    });
    const cols = treeGrid.getColumns();
    cols.unshift(expanderCol);
    treeGrid.getView().setColumns(cols);
  }

  destroy(): void {
    const viewEl = this.treeGrid?.getView()?.el;
    if (viewEl) {
      viewEl.removeEventListener('click', this._onClick);
      viewEl.removeEventListener('dblclick', this._onDblClick);
    }
    this.bodyComponentMap.forEach((cmp) => cmp.destroy());
    this.bodyComponentMap.clear();
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
    this.treeGrid?.getView().refreshNode(record);
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const tg = this.treeGrid!;
    const view = tg.getView();
    const row = view.getNodeRow(record);
    if (!row) return;

    const colCount = tg.getColumns().filter((c) => !c.hidden).length;

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

    if (this.config.rowBodyComponent) {
      const ComponentClass = this.config.rowBodyComponent;
      const cmp = new ComponentClass({ renderTo: td });
      const id = (record as any).getId?.();
      if (id != null) this.bodyComponentMap.set(id, cmp);
    } else {
      const tpl = this.config.rowBodyTpl;
      const content =
        typeof tpl === 'function'
          ? tpl(record)
          : this._renderTpl(tpl, record);
      td.innerHTML = content;
    }

    bodyRow.appendChild(td);

    // Insert after the data row (before tree children)
    row.insertAdjacentElement('afterend', bodyRow);

    const id = (record as any).getId?.();
    if (id != null) this.bodyRowMap.set(id, bodyRow);
  }

  private _collapseById(id: string | number): void {
    this.bodyComponentMap.get(id)?.destroy();
    this.bodyComponentMap.delete(id);
    const bodyRow = this.bodyRowMap.get(id);
    bodyRow?.remove();
    this.bodyRowMap.delete(id);
    this.expandedRows.delete(id);
    const record = this.treeGrid?.getNodeById(String(id)) as NodeInterface | undefined;
    if (record) this.treeGrid?.getView().refreshNode(record);
  }

  private _renderTpl(tpl: XTemplate | string, record: NodeInterface): string {
    // Use $data directly so non-schema fields (e.g. bio) are included.
    // getData() only returns declared schema fields.
    const data = (record as any).$data ?? (record as any).getData?.() ?? record;
    if (tpl instanceof XTemplate) {
      return tpl.apply(data);
    }
    return new XTemplate(tpl).apply(data);
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
