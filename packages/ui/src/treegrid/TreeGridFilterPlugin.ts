/**
 * @framesquared/ui – TreeGridFilterPlugin
 *
 * Column filter integration for TreeGrid with tree-aware filtering.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NodeInterface } from '@framesquared/data';
import type { TreeGrid } from './TreeGrid.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TreeGridFilterPluginConfig {
  filterer?: 'bottomup' | 'topdown';
  showFilterRow?: boolean;
  menuFilter?: boolean;
}

export interface FilterValue {
  dataIndex: string;
  value: unknown;
  operator?: 'eq' | 'lt' | 'gt' | 'contains' | 'gte' | 'lte';
}

// ---------------------------------------------------------------------------
// TreeGridFilterPlugin
// ---------------------------------------------------------------------------

export class TreeGridFilterPlugin {
  private treeGrid: TreeGrid | null = null;
  private config: Required<TreeGridFilterPluginConfig>;
  private activeFilters: FilterValue[] = [];
  private filterRowEl: HTMLElement | null = null;

  constructor(config: TreeGridFilterPluginConfig = {}) {
    this.config = {
      filterer: config.filterer ?? 'bottomup',
      showFilterRow: config.showFilterRow ?? false,
      menuFilter: config.menuFilter ?? true,
    };
  }

  init(treeGrid: TreeGrid): void {
    this.treeGrid = treeGrid;
    if (this.config.showFilterRow) {
      this._renderFilterRow();
    }
  }

  destroy(): void {
    this.filterRowEl?.remove();
    this.treeGrid = null;
  }

  // -------------------------------------------------------------------------
  // Filter API
  // -------------------------------------------------------------------------

  addFilter(filter: FilterValue): void {
    const existing = this.activeFilters.findIndex((f) => f.dataIndex === filter.dataIndex);
    if (existing !== -1) {
      this.activeFilters[existing] = filter;
    } else {
      this.activeFilters.push(filter);
    }
    this._applyFilters();
  }

  removeFilter(dataIndex: string): void {
    this.activeFilters = this.activeFilters.filter((f) => f.dataIndex !== dataIndex);
    this._applyFilters();
  }

  clearFilters(): void {
    this.activeFilters = [];
    this.filterRowEl?.querySelectorAll('input').forEach((input) => {
      (input as HTMLInputElement).value = '';
    });
    this._applyFilters();
  }

  getActiveFilters(): FilterValue[] {
    return [...this.activeFilters];
  }

  getFilteredCount(): number {
    if (!this.treeGrid) return 0;
    return this._getVisibleNodes().length;
  }

  // -------------------------------------------------------------------------
  // Filtering logic
  // -------------------------------------------------------------------------

  private _applyFilters(): void {
    if (!this.treeGrid) return;

    if (this.activeFilters.length === 0) {
      // Show all nodes
      this._showAllNodes(this.treeGrid.getRootNode());
      this.treeGrid.getView().refresh();
      return;
    }

    if (this.config.filterer === 'bottomup') {
      this._applyBottomUp(this.treeGrid.getRootNode());
    } else {
      this._applyTopDown(this.treeGrid.getRootNode(), true);
    }

    this.treeGrid.getView().refresh();
  }

  /** bottomup: a node is visible if it or any descendant matches */
  private _applyBottomUp(node: NodeInterface): boolean {
    let anyChildVisible = false;
    for (const child of node.childNodes) {
      const visible = this._applyBottomUp(child);
      if (visible) anyChildVisible = true;
    }

    if (node.isRoot()) {
      // Root always visible; expand if any children visible
      if (anyChildVisible) node.expanded = true;
      return true;
    }

    const nodeMatches = this._matchesAllFilters(node);
    const visible = nodeMatches || anyChildVisible;

    // Mark node hidden/shown via a custom property
    (node as any)._filterHidden = !visible;

    if (anyChildVisible && !node.isLeaf()) {
      node.expanded = true;
    }

    return visible;
  }

  /** topdown: a node is visible only if it and all ancestors match */
  private _applyTopDown(node: NodeInterface, parentVisible: boolean): void {
    const visible = parentVisible && (node.isRoot() || this._matchesAllFilters(node));
    (node as any)._filterHidden = !visible;

    for (const child of node.childNodes) {
      this._applyTopDown(child, visible);
    }
  }

  private _matchesAllFilters(node: NodeInterface): boolean {
    return this.activeFilters.every((f) => this._matchesFilter(node, f));
  }

  private _matchesFilter(node: NodeInterface, filter: FilterValue): boolean {
    const nodeVal = (node as any).get?.(filter.dataIndex);
    const filterVal = filter.value;
    const op = filter.operator ?? 'contains';

    switch (op) {
      case 'eq':
        return nodeVal === filterVal;
      case 'lt':
        return Number(nodeVal) < Number(filterVal);
      case 'gt':
        return Number(nodeVal) > Number(filterVal);
      case 'gte':
        return Number(nodeVal) >= Number(filterVal);
      case 'lte':
        return Number(nodeVal) <= Number(filterVal);
      case 'contains':
      default:
        return String(nodeVal ?? '')
          .toLowerCase()
          .includes(String(filterVal ?? '').toLowerCase());
    }
  }

  private _showAllNodes(node: NodeInterface): void {
    (node as any)._filterHidden = false;
    for (const child of node.childNodes) {
      this._showAllNodes(child);
    }
  }

  private _getVisibleNodes(): NodeInterface[] {
    const result: NodeInterface[] = [];
    if (!this.treeGrid) return result;
    this.treeGrid.getRootNode().cascadeBy((n) => {
      if (!n.isRoot() && !(n as any)._filterHidden) result.push(n);
    });
    return result;
  }

  // -------------------------------------------------------------------------
  // Filter row UI
  // -------------------------------------------------------------------------

  private _renderFilterRow(): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const tg = this.treeGrid!;
    const viewEl = tg.getView()?.el;
    if (!viewEl) return;

    const tableEl = viewEl.querySelector('table');
    if (!tableEl) return;

    const filterRow = document.createElement('tr');
    filterRow.className = 'x-treegrid-filter-row';

    for (const col of tg.getColumns()) {
      if (col.hidden) continue;
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = `Filter ${col.text}...`;
      input.className = 'x-treegrid-filter-input';
      input.setAttribute('data-dataindex', col.dataIndex);
      input.addEventListener('input', () => {
        const val = input.value.trim();
        if (val) {
          this.addFilter({ dataIndex: col.dataIndex, value: val, operator: 'contains' });
        } else {
          this.removeFilter(col.dataIndex);
        }
      });
      td.appendChild(input);
      filterRow.appendChild(td);
    }

    tableEl.insertAdjacentElement('afterbegin', filterRow);
    this.filterRowEl = filterRow;
  }
}
