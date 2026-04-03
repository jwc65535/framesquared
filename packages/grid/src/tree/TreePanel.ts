/**
 * @framesquared/grid – TreePanel
 *
 * Displays hierarchical data from a TreeStore.  Each node is
 * rendered with depth-based indentation, expand/collapse icons,
 * folder/leaf icons, and optional checkboxes with cascade behavior.
 */

import { Panel } from '@framesquared/ui';
import type { PanelConfig } from '@framesquared/ui';
import type { TreeStore, TreeNode } from './TreeStore.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TreePanelConfig extends PanelConfig {
  store?: TreeStore;
  rootVisible?: boolean;
  singleExpand?: boolean;
  useArrows?: boolean;
  lines?: boolean;
  animate?: boolean;
  checkable?: boolean;
  cascadeCheck?: boolean;
}

// ---------------------------------------------------------------------------
// TreePanel
// ---------------------------------------------------------------------------

export class TreePanel extends Panel {
  static override $className = 'Ext.tree.Panel';

  declare private _treeStore: TreeStore;
  declare private _rootVisible: boolean;
  declare private _singleExpand: boolean;
  declare private _checkable: boolean;
  declare private _cascadeCheck: boolean;
  declare private _treeBody: HTMLElement | null;
  declare private _checkedSet: Set<string>;

  constructor(config: TreePanelConfig = {}) {
    super({ xtype: 'treepanel', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as TreePanelConfig;
    this._treeStore = cfg.store as TreeStore;
    this._rootVisible = cfg.rootVisible ?? true;
    this._singleExpand = cfg.singleExpand ?? false;
    this._checkable = cfg.checkable ?? false;
    this._cascadeCheck = cfg.cascadeCheck ?? false;
    this._treeBody = null;
    this._checkedSet = new Set();
  }

  protected override afterRender(): void {
    super.afterRender();
    const cfg = this._config as TreePanelConfig;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.el!.classList.add('x-treepanel');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (cfg.useArrows) this.el!.classList.add('x-tree-arrows');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (cfg.lines) this.el!.classList.add('x-tree-lines');

    this._treeBody = document.createElement('div');
    this._treeBody.classList.add('x-tree-body');
    this.getBodyEl().appendChild(this._treeBody);

    this.renderTree();
  }

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------

  refresh(): void {
    this.renderTree();
  }

  private renderTree(): void {
    if (!this._treeBody || !this._treeStore) return;
    this._treeBody.innerHTML = '';

    const nodes = this._treeStore.getVisibleNodes(this._rootVisible);
    for (const node of nodes) {
      this._treeBody.appendChild(this.createNodeElement(node));
    }
  }

  private createNodeElement(node: TreeNode): HTMLElement {
    const row = document.createElement('div');
    row.classList.add('x-tree-node');
    row.setAttribute('data-node-id', node.id);

    // Indent
    const indent = document.createElement('span');
    indent.classList.add('x-tree-indent');
    const indentLevel = this._rootVisible ? node.depth : Math.max(0, node.depth - 1);
    indent.style.paddingLeft = `${indentLevel * 20}px`;
    row.appendChild(indent);

    // Expander
    if (!node.leaf) {
      const expander = document.createElement('span');
      expander.classList.add('x-tree-expander');
      expander.textContent = node.expanded ? '▾' : '▸';
      expander.style.cursor = 'pointer';
      expander.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleNode(node);
      });
      row.appendChild(expander);
    } else {
      // Spacer for leaf alignment
      const spacer = document.createElement('span');
      spacer.classList.add('x-tree-expander-spacer');
      spacer.textContent = ' ';
      row.appendChild(spacer);
    }

    // Checkbox
    if (this._checkable) {
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.classList.add('x-tree-checkbox');
      cb.checked = node.checked;
      cb.addEventListener('click', (e) => {
        e.stopPropagation();
        const checked = cb.checked;
        node.checked = checked;
        if (this._cascadeCheck) {
          this._treeStore.cascadeCheck(node, checked);
        }
        this.fire('checkchange', this, node, checked);
        // Re-render to update child checkboxes
        this.renderTree();
      });
      row.appendChild(cb);
    }

    // Icon
    const icon = document.createElement('span');
    icon.classList.add('x-tree-icon', node.leaf ? 'x-tree-icon-leaf' : 'x-tree-icon-folder');
    row.appendChild(icon);

    // Text
    const text = document.createElement('span');
    text.classList.add('x-tree-node-text');
    text.textContent = node.text;
    row.appendChild(text);

    return row;
  }

  // -----------------------------------------------------------------------
  // Expand / Collapse
  // -----------------------------------------------------------------------

  private toggleNode(node: TreeNode): void {
    if (node.expanded) {
      this.collapseNode(node);
    } else {
      this.expandNode(node);
    }
  }

  private expandNode(node: TreeNode): void {
    this.fire('beforeitemexpand', this, node);

    if (this._singleExpand && node.parent) {
      // Collapse siblings
      for (const sibling of node.parent.children) {
        if (sibling !== node && sibling.expanded) {
          this._treeStore.collapseAll(sibling);
        }
      }
    }

    node.expanded = true;
    this.fire('itemexpand', this, node);
    this.renderTree();
  }

  private collapseNode(node: TreeNode): void {
    this.fire('beforeitemcollapse', this, node);
    node.expanded = false;
    this.fire('itemcollapse', this, node);
    this.renderTree();
  }

  expandAll(): void {
    this._treeStore.expandAll();
    this.renderTree();
  }

  collapseAll(): void {
    this._treeStore.collapseAll();
    this.renderTree();
  }

  async expandPath(path: string): Promise<void> {
    const node = this._treeStore.findByPath(path);
    if (!node) return;
    this._treeStore.expandToNode(node);
    this.renderTree();
  }

  // -----------------------------------------------------------------------
  // Checkbox
  // -----------------------------------------------------------------------

  getChecked(): TreeNode[] {
    return this._treeStore.getChecked();
  }

  // -----------------------------------------------------------------------
  // Accessors
  // -----------------------------------------------------------------------

  getStore(): TreeStore {
    return this._treeStore;
  }
}
