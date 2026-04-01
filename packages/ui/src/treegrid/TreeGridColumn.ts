/**
 * @framesquared/ui – TreeGridColumn
 *
 * Column definition for the tree (first) column of a TreeGrid.
 * Renders tree chrome: indentation, expander, icon, checkbox, node text.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NodeInterface } from '@framesquared/data';

// ---------------------------------------------------------------------------
// Elbow types for tree connector lines
// ---------------------------------------------------------------------------

export type ElbowType = 'line' | 'empty' | 'end' | 'end-plus' | 'tee' | 'tee-plus';

// ---------------------------------------------------------------------------
// Column (plain grid column, not tree column)
// ---------------------------------------------------------------------------

export interface EditorConfig {
  xtype: string;
  /** options for combobox/select/radiogroup — array of {value,text} or plain strings */
  options?: Array<{ value: string; text: string } | string>;
  /** legacy: ExtJS-style store for combobox */
  store?: Array<{ value: string; text: string } | string>;
  displayField?: string;
  valueField?: string;
  minValue?: number;
  maxValue?: number;
  step?: number;
  rows?: number;
  allowBlank?: boolean;
  [key: string]: unknown;
}

export interface ColumnConfig {
  dataIndex: string;
  text?: string;
  width?: number;
  flex?: number;
  hidden?: boolean;
  renderer?: (value: unknown, record: NodeInterface) => string;
  /** Editor config. Pass false to mark the column as read-only. */
  editor?: EditorConfig | false;
}

export class Column {
  readonly isColumn: boolean = true;
  dataIndex: string;
  text: string;
  width: number;
  flex: number;
  hidden: boolean;
  renderer: ((value: unknown, record: NodeInterface) => string) | undefined;
  editor: EditorConfig | false | undefined;

  constructor(config: ColumnConfig) {
    this.dataIndex = config.dataIndex;
    this.text = config.text ?? config.dataIndex;
    this.width = config.width ?? 100;
    this.flex = config.flex ?? 0;
    this.hidden = config.hidden ?? false;
    this.renderer = config.renderer;
    this.editor = config.editor;
  }

  /**
   * Returns the rendered cell value HTML for this column.
   */
  renderValue(record: NodeInterface): string {
    const raw = (record as any).get(this.dataIndex);
    const value = raw != null ? String(raw) : '';
    if (this.renderer) {
      return this.renderer(raw, record);
    }
    return value;
  }
}

// ---------------------------------------------------------------------------
// TreeGridColumn config
// ---------------------------------------------------------------------------

export interface TreeGridColumnConfig extends Omit<ColumnConfig, 'dataIndex'> {
  dataIndex?: string;
  indentSize?: number;
  iconProperty?: string;
  iconClsProperty?: string;
  displayProperty?: string;
  defaultFolderIcon?: string;
  defaultFolderOpenIcon?: string;
  defaultLeafIcon?: string;
  showIcons?: boolean;
  showExpanders?: boolean;
  innerRenderer?: (value: unknown, record: NodeInterface) => string;
}

// ---------------------------------------------------------------------------
// TreeGridColumn
// ---------------------------------------------------------------------------

export class TreeGridColumn extends Column {
  readonly isTreeGridColumn: boolean = true;

  indentSize: number;
  iconProperty: string;
  iconClsProperty: string;
  displayProperty: string;
  defaultFolderIcon: string;
  defaultFolderOpenIcon: string;
  defaultLeafIcon: string;
  showIcons: boolean;
  showExpanders: boolean;
  innerRenderer: ((value: unknown, record: NodeInterface) => string) | undefined;

  constructor(config: TreeGridColumnConfig = {}) {
    super({ ...config, dataIndex: config.dataIndex ?? (config.displayProperty ?? 'text') });
    this.indentSize = config.indentSize ?? 20;
    this.iconProperty = config.iconProperty ?? 'icon';
    this.iconClsProperty = config.iconClsProperty ?? 'iconCls';
    this.displayProperty = config.displayProperty ?? config.dataIndex ?? 'text';
    this.defaultFolderIcon = config.defaultFolderIcon ?? 'x-treegrid-icon-folder';
    this.defaultFolderOpenIcon = config.defaultFolderOpenIcon ?? 'x-treegrid-icon-folder-open';
    this.defaultLeafIcon = config.defaultLeafIcon ?? 'x-treegrid-icon-leaf';
    this.showIcons = config.showIcons ?? true;
    this.showExpanders = config.showExpanders ?? true;
    this.innerRenderer = config.innerRenderer;
  }

  /**
   * Computes the array of elbow types for a node based on depth and sibling position.
   */
  computeElbows(record: NodeInterface): ElbowType[] {
    const elbows: ElbowType[] = [];

    // Collect ancestors from root to this node
    const ancestors: NodeInterface[] = [];
    let curr: NodeInterface | null = record.parentNode;
    while (curr && !curr.isRoot()) {
      ancestors.unshift(curr);
      curr = curr.parentNode;
    }

    // For each ancestor's depth level, determine if the ancestor is last
    for (const ancestor of ancestors) {
      const isLast = ancestor.nextSibling === null;
      elbows.push(isLast ? 'empty' : 'line');
    }

    // Node's own depth position — use explicit leaf flag for "is folder" determination
    const nodeIsLast = record.nextSibling === null;
    const nodeIsExplicitLeaf = (record as any).get('leaf') === true;
    if (nodeIsLast && nodeIsExplicitLeaf) {
      elbows.push('end');
    } else if (nodeIsLast && !nodeIsExplicitLeaf) {
      elbows.push('end-plus');
    } else if (!nodeIsLast && nodeIsExplicitLeaf) {
      elbows.push('tee');
    } else {
      elbows.push('tee-plus');
    }

    return elbows;
  }

  /**
   * Renders the complete tree cell HTML.
   */
  renderCell(
    record: NodeInterface,
    checkable: boolean,
    lines: boolean,
  ): string {
    const depth = record.depth ?? 0;
    const indent = depth * this.indentSize;

    // 1. Elbows or padding
    let elbowsHtml = '';
    let paddingStyle = '';
    if (lines) {
      const elbows = this.computeElbows(record);
      elbowsHtml = elbows
        .map((t) => `<span class="x-treegrid-elbow x-treegrid-elbow-${t}"></span>`)
        .join('');
    } else {
      paddingStyle = `padding-left: ${indent}px;`;
    }

    // 2. Expander — use explicit leaf flag so empty-children folders still show expander
    const isExplicitLeaf = (record as any).get('leaf') === true;
    let expanderHtml = '';
    if (this.showExpanders) {
      if (isExplicitLeaf) {
        expanderHtml = '<span class="x-treegrid-expander x-treegrid-expander-leaf"></span>';
      } else {
        const cls = record.isExpanded()
          ? 'x-treegrid-expander-expanded'
          : 'x-treegrid-expander-collapsed';
        const label = record.isExpanded() ? 'Collapse row' : 'Expand row';
        expanderHtml = `<span class="x-treegrid-expander ${cls}" role="button" aria-label="${label}" tabindex="-1"></span>`;
      }
    }

    // 3. Checkbox
    let checkboxHtml = '';
    if (checkable) {
      const checked = (record as any).$checked;
      if (checked === true) {
        checkboxHtml =
          '<span class="x-treegrid-checkbox x-treegrid-checkbox-checked" role="checkbox" aria-checked="true" tabindex="-1"></span>';
      } else if (checked === null || checked === undefined || checked === 'indeterminate') {
        const indeterminate = checked === 'indeterminate' || checked === null;
        if (indeterminate && checked !== undefined) {
          checkboxHtml =
            '<span class="x-treegrid-checkbox x-treegrid-checkbox-indeterminate" role="checkbox" aria-checked="mixed" tabindex="-1"></span>';
        } else {
          checkboxHtml =
            '<span class="x-treegrid-checkbox" role="checkbox" aria-checked="false" tabindex="-1"></span>';
        }
      } else {
        checkboxHtml =
          '<span class="x-treegrid-checkbox" role="checkbox" aria-checked="false" tabindex="-1"></span>';
      }
    }

    // 4. Icon
    let iconHtml = '';
    if (this.showIcons) {
      const customIconSrc = String((record as any).get(this.iconProperty) ?? '');
      const customIconCls = String((record as any).get(this.iconClsProperty) ?? '');
      if (customIconSrc) {
        iconHtml = `<img class="x-treegrid-icon" src="${customIconSrc}" alt="" />`;
      } else if (customIconCls) {
        iconHtml = `<span class="x-treegrid-icon ${customIconCls}"></span>`;
      } else if (isExplicitLeaf) {
        iconHtml = `<span class="x-treegrid-icon ${this.defaultLeafIcon}"></span>`;
      } else if (record.isExpanded()) {
        iconHtml = `<span class="x-treegrid-icon ${this.defaultFolderOpenIcon}"></span>`;
      } else {
        iconHtml = `<span class="x-treegrid-icon ${this.defaultFolderIcon}"></span>`;
      }
    }

    // 5. Text content
    const rawValue = (record as any).get(this.displayProperty);
    let textContent: string;
    if (this.innerRenderer) {
      textContent = this.innerRenderer(rawValue, record);
    } else {
      textContent = rawValue != null ? String(rawValue) : '';
    }
    const textHtml = `<span class="x-treegrid-node-text">${textContent}</span>`;

    return `<div class="x-treegrid-cell-inner" style="${paddingStyle}">${elbowsHtml}${expanderHtml}${checkboxHtml}${iconHtml}${textHtml}</div>`;
  }
}
