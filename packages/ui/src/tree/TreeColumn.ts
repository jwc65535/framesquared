/**
 * @framesquared/ui – TreeColumn
 *
 * Column definition / renderer for tree nodes.
 */

import type { NodeInterface } from '@framesquared/data';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TreeColumnConfig {
  dataIndex?: string;
  indentSize?: number;
  header?: string;
  width?: number;
}

// ---------------------------------------------------------------------------
// TreeColumn
// ---------------------------------------------------------------------------

export class TreeColumn {
  dataIndex: string;
  indentSize: number;
  header: string;
  width: number;

  constructor(config?: TreeColumnConfig) {
    this.dataIndex = config?.dataIndex ?? 'text';
    this.indentSize = config?.indentSize ?? 20;
    this.header = config?.header ?? '';
    this.width = config?.width ?? 200;
  }

  /**
   * Renders the full cell content for a tree node.
   */
  renderCell(record: NodeInterface, checkable?: boolean): string {
    const depth = record.depth ?? 0;
    const paddingLeft = depth * this.indentSize;
    const text = String(record.get(this.dataIndex) ?? '');
    const isLeaf = record.isLeaf();
    const isExpanded = record.isExpanded();
    const iconCls = String(record.get('iconCls') ?? '');
    const customIcon = String(record.get('icon') ?? '');

    const expanderHtml = isLeaf
      ? '<span class="x-tree-expander-placeholder"></span>'
      : `<span class="x-tree-expander x-tree-expander-${isExpanded ? 'collapse' : 'expand'}" role="button" aria-label="${isExpanded ? 'Collapse' : 'Expand'}"></span>`;

    const checkboxHtml = checkable ? `<span class="x-tree-checkbox" role="checkbox"></span>` : '';

    const defaultIconCls =
      iconCls ||
      (isLeaf ? 'x-tree-icon-leaf' : isExpanded ? 'x-tree-icon-open' : 'x-tree-icon-folder');

    const iconHtml = customIcon
      ? `<img class="x-tree-icon" src="${customIcon}" alt="">`
      : `<span class="x-tree-icon ${defaultIconCls}"></span>`;

    return `
      <div class="x-tree-cell-inner" style="padding-left: ${paddingLeft}px">
        ${expanderHtml}
        ${checkboxHtml}
        ${iconHtml}
        <span class="x-tree-node-text">${text}</span>
      </div>
    `;
  }
}
