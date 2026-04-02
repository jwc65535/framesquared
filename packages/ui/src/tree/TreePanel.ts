/**
 * @framesquared/ui – TreePanel
 *
 * Main tree component. Extends Panel and uses TreeView for rendering.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Panel } from '../panel/Panel.js';
import type { PanelConfig } from '../panel/Panel.js';
import type { TreeStore, NodeInterface } from '@framesquared/data';
import { TreeView } from './TreeView.js';
import { TreeSelectionModel } from '../selection/TreeSelectionModel.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TreePanelConfig extends PanelConfig {
  store: TreeStore;
  rootVisible?: boolean;
  displayField?: string;
  useArrows?: boolean;
  lines?: boolean;
  singleExpand?: boolean;
  checkable?: boolean;
  cascadeChecks?: boolean;
}

// ---------------------------------------------------------------------------
// TreePanel
// ---------------------------------------------------------------------------

export class TreePanel extends Panel {
  static override $className = 'Ext.tree.Panel';

  declare private _store: TreeStore;
  declare private _treeView: TreeView | null;
  declare private _selModel: TreeSelectionModel;
  declare private _rootVisible: boolean;
  declare private _displayField: string;
  declare private _useArrows: boolean;
  declare private _lines: boolean;
  declare private _singleExpand: boolean;
  declare private _checkable: boolean;
  declare private _cascadeChecks: boolean;

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as TreePanelConfig;
    this._store = cfg.store;
    this._treeView = null;
    this._rootVisible = cfg.rootVisible ?? false;
    this._displayField = cfg.displayField ?? 'text';
    this._useArrows = cfg.useArrows ?? true;
    this._lines = cfg.lines ?? false;
    this._singleExpand = cfg.singleExpand ?? false;
    this._checkable = cfg.checkable ?? false;
    this._cascadeChecks = cfg.cascadeChecks ?? true;
    this._selModel = new TreeSelectionModel({ mode: 'single' });
  }

  protected override afterRender(): void {
    super.afterRender();

    // Add tree panel CSS class
    this.el!.classList.add('x-tree-panel');

    if (this._useArrows) {
      this.el!.classList.add('x-tree-arrows');
    }
    if (this._lines) {
      this.el!.classList.add('x-tree-lines');
    }

    // Create and render TreeView into the panel body
    this._treeView = new TreeView({
      store: this._store,
      displayField: this._displayField,
      checkable: this._checkable,
    });
    this._treeView.render(this.getBodyEl());

    // Wire store events
    (this._store as any).on('datachanged', () => this._treeView?.refresh());
    (this._store as any).on('nodeexpand', (_store: unknown, node: NodeInterface) => {
      if (this._singleExpand) {
        this._collapseAllExcept(node);
      }
      this._treeView?.refresh();
    });
    (this._store as any).on('nodecollapse', () => this._treeView?.refresh());
    (this._store as any).on('nodeappend', () => this._treeView?.refresh());
    (this._store as any).on('noderemove', () => this._treeView?.refresh());
    (this._store as any).on('nodeinsert', () => this._treeView?.refresh());

    // Wire TreeView events to TreePanel events
    this._treeView.on('itemclick', (node: NodeInterface, e: MouseEvent) => {
      this.fire('itemclick', this, node, e);
    });
    this._treeView.on('itemdblclick', (node: NodeInterface, e: MouseEvent) => {
      this.fire('itemdblclick', this, node, e);
    });
    this._treeView.on('itemcontextmenu', (node: NodeInterface, e: MouseEvent) => {
      this.fire('itemcontextmenu', this, node, e);
    });
  }

  // -------------------------------------------------------------------------
  // Store / Root
  // -------------------------------------------------------------------------

  getStore(): TreeStore {
    return this._store;
  }

  getRootNode(): NodeInterface {
    return this._store.getRootNode();
  }

  // -------------------------------------------------------------------------
  // Expand / Collapse
  // -------------------------------------------------------------------------

  expandAll(): void {
    this._store.expandAll();
    this._treeView?.refresh();
  }

  collapseAll(): void {
    this._store.collapseAll();
    this._treeView?.refresh();
  }

  expandNode(node: NodeInterface, deep = false): void {
    this._store.expandNode(node);
    if (deep) {
      node.cascadeBy((child) => {
        if (!child.isLeaf()) {
          this._store.expandNode(child);
        }
      });
    }
    this._treeView?.refresh();
  }

  collapseNode(node: NodeInterface, deep = false): void {
    this._store.collapseNode(node);
    if (deep) {
      node.cascadeBy((child) => {
        this._store.collapseNode(child);
      });
    }
    this._treeView?.refresh();
  }

  private _collapseAllExcept(except: NodeInterface): void {
    const root = this._store.getRootNode();
    root.eachChild((child) => {
      if (child !== except) {
        this._store.collapseNode(child);
      }
    });
  }

  // -------------------------------------------------------------------------
  // Selection
  // -------------------------------------------------------------------------

  getSelection(): NodeInterface[] {
    return this._selModel.getSelection();
  }

  select(nodes: NodeInterface | NodeInterface[]): void {
    this._selModel.select(nodes);
    const selected = this._selModel.getSelection();
    // Update visual state
    if (this._treeView) {
      const allNodes = this._store.flattenNodes() as NodeInterface[];
      for (const node of allNodes) {
        this._treeView.markSelected(node, selected.includes(node));
      }
    }
  }

  deselectAll(): void {
    if (this._treeView) {
      for (const node of this._selModel.getSelection()) {
        this._treeView.markSelected(node, false);
      }
    }
    this._selModel.deselectAll();
  }

  // -------------------------------------------------------------------------
  // Checked nodes
  // -------------------------------------------------------------------------

  getChecked(): NodeInterface[] {
    if (!this._checkable) return [];
    const checked: NodeInterface[] = [];
    const root = this._store.getRootNode();
    root.cascadeBy?.((node) => {
      if ((node as any).$checked === true) checked.push(node);
    });
    return checked;
  }

  // -------------------------------------------------------------------------
  // View
  // -------------------------------------------------------------------------

  getView(): TreeView {
    return this._treeView!;
  }

  scrollToNode(node: NodeInterface): void {
    const row = this._treeView?.getNode(node);
    row?.scrollIntoView?.({ block: 'nearest' });
  }

  // -------------------------------------------------------------------------
  // Config accessors
  // -------------------------------------------------------------------------

  isRootVisible(): boolean {
    return this._rootVisible;
  }

  isCheckable(): boolean {
    return this._checkable;
  }
}
