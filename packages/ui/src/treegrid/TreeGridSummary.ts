/**
 * @framesquared/ui – TreeGridSummary
 *
 * Feature that adds a summary row aggregating values across visible nodes.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NodeInterface } from '@framesquared/data';
import type { TreeGrid } from './TreeGrid.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SummaryType = 'sum' | 'count' | 'average' | 'min' | 'max' | 'none';

export interface SummaryColumnConfig {
  dataIndex: string;
  summaryType?: SummaryType;
  summaryRenderer?: (value: number, count: number) => string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TreeGridSummaryConfig {
  position?: 'bottom' | 'top';
  includeCollapsed?: boolean;
  treeColumnSummaryText?: string;
  summaryColumns?: SummaryColumnConfig[];
}

// ---------------------------------------------------------------------------
// TreeGridSummary
// ---------------------------------------------------------------------------

export class TreeGridSummary {
  private treeGrid: TreeGrid | null = null;
  private config: Required<TreeGridSummaryConfig>;
  private summaryRowEl: HTMLElement | null = null;

  constructor(config: TreeGridSummaryConfig = {}) {
    this.config = {
      position: config.position ?? 'bottom',
      includeCollapsed: config.includeCollapsed ?? true,
      treeColumnSummaryText: config.treeColumnSummaryText ?? 'Summary',
      summaryColumns: config.summaryColumns ?? [],
    };
  }

  init(treeGrid: TreeGrid): void {
    this.treeGrid = treeGrid;
    // Wire store events to recalculate
    (treeGrid.getStore() as any).on('datachanged', () => this.updateSummary());
    (treeGrid.getStore() as any).on('nodeexpand', () => this.updateSummary());
    (treeGrid.getStore() as any).on('nodecollapse', () => this.updateSummary());
  }

  destroy(): void {
    this.summaryRowEl?.remove();
    this.treeGrid = null;
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  renderSummary(): void {
    if (!this.treeGrid) return;
    const viewEl = this.treeGrid.getView()?.el;
    if (!viewEl) return;

    this.summaryRowEl?.remove();

    const tableEl = viewEl.querySelector('table');
    if (!tableEl) return;

    const summaryRow = this._buildSummaryRow();
    this.summaryRowEl = summaryRow;

    if (this.config.position === 'top') {
      tableEl.insertAdjacentElement('afterbegin', summaryRow);
    } else {
      tableEl.appendChild(summaryRow);
    }
  }

  updateSummary(): void {
    this.renderSummary();
  }

  // -------------------------------------------------------------------------
  // Calculation
  // -------------------------------------------------------------------------

  calculateSummary(dataIndex: string, summaryType: SummaryType): number {
    const nodes = this._getNodes();
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

  private _getNodes(): NodeInterface[] {
    const tg = this.treeGrid!;
    if (this.config.includeCollapsed) {
      const all: NodeInterface[] = [];
      tg.getRootNode().cascadeBy((n) => {
        if (!n.isRoot()) all.push(n);
      });
      return all;
    }
    // Only visible (expanded) nodes
    return (tg.getStore().flattenNodes() as NodeInterface[]).filter((n) => !n.isRoot());
  }

  private _buildSummaryRow(): HTMLElement {
    const tg = this.treeGrid!;
    const columns = tg.getColumns();
    const treeCol = tg.getTreeColumn();

    const tr = document.createElement('tr');
    tr.className = 'x-treegrid-summary-row';
    tr.setAttribute('role', 'row');

    for (const col of columns) {
      if (col.hidden) continue;
      const td = document.createElement('td');
      td.className = 'x-grid-cell x-treegrid-summary-cell';
      const inner = document.createElement('div');
      inner.className = 'x-grid-cell-inner';

      if (col === treeCol) {
        inner.textContent = this.config.treeColumnSummaryText;
      } else {
        const summaryColCfg = this.config.summaryColumns.find(
          (sc) => sc.dataIndex === col.dataIndex,
        );
        if (summaryColCfg && summaryColCfg.summaryType && summaryColCfg.summaryType !== 'none') {
          const val = this.calculateSummary(col.dataIndex, summaryColCfg.summaryType);
          const nodes = this._getNodes();
          inner.textContent = summaryColCfg.summaryRenderer
            ? summaryColCfg.summaryRenderer(val, nodes.length)
            : String(val);
        } else {
          inner.textContent = '';
        }
      }

      td.appendChild(inner);
      tr.appendChild(td);
    }

    return tr;
  }
}
