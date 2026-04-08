/**
 * @framesquared/ui – TreeGridGroupingSummary
 *
 * Feature adding per-parent summary rows after each expanded parent's last child.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NodeInterface } from '@framesquared/data';
import type { TreeGrid } from './TreeGrid.js';
import type { SummaryType, SummaryColumnConfig } from './TreeGridSummary.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TreeGridGroupingSummaryConfig {
  includeDescendants?: boolean;
  summaryRowCls?: string;
  showSummaryFor?: 'all' | 'nonleaf';
  summaryColumns?: SummaryColumnConfig[];
  treeColumnSummaryText?: string;
}

// ---------------------------------------------------------------------------
// TreeGridGroupingSummary
// ---------------------------------------------------------------------------

export class TreeGridGroupingSummary {
  private treeGrid: TreeGrid | null = null;
  private config: Required<TreeGridGroupingSummaryConfig>;

  constructor(config: TreeGridGroupingSummaryConfig = {}) {
    this.config = {
      includeDescendants: config.includeDescendants ?? false,
      summaryRowCls: config.summaryRowCls ?? 'x-treegrid-summary-row',
      showSummaryFor: config.showSummaryFor ?? 'nonleaf',
      summaryColumns: config.summaryColumns ?? [],
      treeColumnSummaryText: config.treeColumnSummaryText ?? 'Summary',
    };
  }

  init(treeGrid: TreeGrid): void {
    this.treeGrid = treeGrid;
    (treeGrid.getStore() as any).on('datachanged', () => this._renderGroupSummaries());
    (treeGrid.getStore() as any).on('nodeexpand', () => this._renderGroupSummaries());
    (treeGrid.getStore() as any).on('nodecollapse', () => this._renderGroupSummaries());
  }

  destroy(): void {
    this.treeGrid = null;
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  renderGroupSummaries(): void {
    this._renderGroupSummaries();
  }

  private _renderGroupSummaries(): void {
    if (!this.treeGrid) return;
    const viewEl = this.treeGrid.getView()?.el;
    if (!viewEl) return;

    // Remove existing group summary rows only (those with [data-summary-for]).
    // Rows without that attribute (e.g. a grand-total row from TreeGridSummary)
    // must not be touched.
    viewEl
      .querySelectorAll(`.${this.config.summaryRowCls}[data-summary-for]`)
      .forEach((el) => el.remove());

    const flatData = (this.treeGrid.getStore().flattenNodes() as NodeInterface[]).filter(
      (n) => !n.isRoot(),
    );

    // Find expanded non-leaf nodes
    const insertions: { afterEl: HTMLElement; summaryRow: HTMLElement }[] = [];

    for (const node of flatData) {
      const shouldShow = this.config.showSummaryFor === 'all' || !node.isLeaf();
      if (!shouldShow || !node.isExpanded() || node.isLeaf()) continue;

      const lastChild = node.lastChild;
      if (!lastChild) continue;

      // Find the last visible descendant of node
      const lastDescendant = this._findLastVisible(node);
      const lastRow = this.treeGrid.getNodeRow(lastDescendant);
      if (!lastRow) continue;

      const summaryRow = this._buildGroupSummaryRow(node);
      insertions.push({ afterEl: lastRow, summaryRow });
    }

    // Insert in reverse order to maintain positions
    for (const { afterEl, summaryRow } of insertions.reverse()) {
      afterEl.insertAdjacentElement('afterend', summaryRow);
    }
  }

  private _findLastVisible(node: NodeInterface): NodeInterface {
    if (node.isLeaf() || !node.isExpanded()) return node;
    const last = node.lastChild;
    if (!last) return node;
    return this._findLastVisible(last);
  }

  private _buildGroupSummaryRow(parent: NodeInterface): HTMLElement {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const tg = this.treeGrid!;
    const columns = tg.getColumns();

    const tr = document.createElement('tr');
    tr.className = this.config.summaryRowCls;
    tr.setAttribute('role', 'row');
    tr.setAttribute('aria-selected', 'false');
    tr.setAttribute('data-summary-for', String((parent as any).getId?.() ?? ''));

    const depth = (parent.depth ?? 0) + 1;
    const indent = depth * tg.getTreeColumn().indentSize;

    for (const col of columns) {
      if (col.hidden) continue;
      const td = document.createElement('td');
      td.className = 'x-grid-cell x-treegrid-summary-cell';
      const inner = document.createElement('div');
      inner.className = 'x-grid-cell-inner';

      if (col === tg.getTreeColumn()) {
        inner.style.paddingLeft = `${indent}px`;
        inner.textContent = this.config.treeColumnSummaryText;
      } else {
        const summaryColCfg = this.config.summaryColumns.find(
          (sc) => sc.dataIndex === col.dataIndex,
        );
        if (summaryColCfg?.summaryType && summaryColCfg.summaryType !== 'none') {
          const val = this._calculate(parent, col.dataIndex, summaryColCfg.summaryType);
          const nodes = this._getChildNodes(parent);
          inner.textContent = summaryColCfg.summaryRenderer
            ? summaryColCfg.summaryRenderer(val, nodes.length)
            : String(val);
        }
      }

      td.appendChild(inner);
      tr.appendChild(td);
    }

    return tr;
  }

  private _getChildNodes(parent: NodeInterface): NodeInterface[] {
    if (this.config.includeDescendants) {
      const result: NodeInterface[] = [];
      parent.cascadeBy((n) => {
        if (n !== parent) result.push(n);
      });
      return result;
    }
    return parent.childNodes;
  }

  private _calculate(parent: NodeInterface, dataIndex: string, summaryType: SummaryType): number {
    const nodes = this._getChildNodes(parent);
    if (summaryType === 'count') return nodes.length;

    const values = nodes
      .map((n) => parseFloat(String((n as any).get?.(dataIndex) ?? '0')))
      .filter((v) => !isNaN(v));

    if (values.length === 0) return 0;

    switch (summaryType) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'average':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      default:
        return 0;
    }
  }
}
