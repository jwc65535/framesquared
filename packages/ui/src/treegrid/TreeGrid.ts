/**
 * @framesquared/ui – TreeGrid
 *
 * Hybrid tree + grid component. Renders hierarchical data with multiple
 * columns. The first column is a TreeGridColumn (tree chrome + value),
 * subsequent columns display plain field values.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Panel } from '../panel/Panel.js';
import type { PanelConfig } from '../panel/Panel.js';
import { TreeStore, TreeModel } from '@framesquared/data';
import type { TreeStoreConfig, NodeInterface } from '@framesquared/data';
import { TreeGridView } from './TreeGridView.js';
import { TreeGridColumn, Column } from './TreeGridColumn.js';
import type { TreeGridColumnConfig, ColumnConfig } from './TreeGridColumn.js';
import { TreeGridSelectionModel } from './TreeGridSelectionModel.js';
import type { TreeGridSelectionModelConfig } from './TreeGridSelectionModel.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TreeGridConfig extends PanelConfig {
  store: TreeStore | TreeStoreConfig | object[] | NodeInterface;
  rootVisible?: boolean;
  displayField?: string;
  useArrows?: boolean;
  lines?: boolean;
  singleExpand?: boolean;
  animate?: boolean;
  expandOnDblClick?: boolean;
  folderSort?: boolean;
  checkable?: boolean;
  cascadeChecks?: boolean;
  checkPropagation?: 'up' | 'down' | 'both' | 'none';
  onlyLeafCheckable?: boolean;
  columns?: (ColumnConfig | TreeGridColumnConfig)[];
  treeColumn?: TreeGridColumnConfig | number;
  enableDrag?: boolean;
  enableDrop?: boolean;
  ddGroup?: string;
  selModel?: TreeGridSelectionModelConfig;
  emptyText?: string;
}

// ---------------------------------------------------------------------------
// TreeGrid
// ---------------------------------------------------------------------------

export class TreeGrid extends Panel {
  static override $className = 'Ext.tree.TreeGrid';

  readonly isTreeGrid: boolean = true;

  declare private _store: TreeStore;
  declare private _columns: (TreeGridColumn | Column)[];
  declare private _treeColumn: TreeGridColumn;
  declare private _view: TreeGridView | null;
  declare private _selModel: TreeGridSelectionModel;

  // Config props stored as instance properties for accessor
  declare private _rootVisible: boolean;
  declare private _displayField: string;
  declare private _lines: boolean;
  declare private _singleExpand: boolean;
  declare private _checkable: boolean;
  declare private _cascadeChecks: boolean;
  declare private _checkPropagation: 'up' | 'down' | 'both' | 'none';
  declare private _onlyLeafCheckable: boolean;
  declare private _animate: boolean;
  declare private _expandOnDblClick: boolean;
  declare private _folderSort: boolean;

  constructor(config: TreeGridConfig) {
    super(config as any);
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as TreeGridConfig;

    // Normalize store
    this._store = this._normalizeStore(cfg.store);

    // Config props
    this._rootVisible = cfg.rootVisible ?? false;
    this._displayField = cfg.displayField ?? 'text';
    this._lines = cfg.lines ?? false;
    this._singleExpand = cfg.singleExpand ?? false;
    this._checkable = cfg.checkable ?? false;
    this._cascadeChecks = cfg.cascadeChecks ?? true;
    this._checkPropagation = cfg.checkPropagation ?? 'both';
    this._onlyLeafCheckable = cfg.onlyLeafCheckable ?? false;
    this._animate = cfg.animate ?? true;
    this._expandOnDblClick = cfg.expandOnDblClick ?? true;
    this._folderSort = cfg.folderSort ?? false;

    // Normalize columns
    this._columns = this._normalizeColumns(cfg.columns ?? []);
    this._treeColumn = this._columns.find((c) => c instanceof TreeGridColumn) as TreeGridColumn;

    // Selection model
    this._selModel = new TreeGridSelectionModel(
      (cfg.selModel as TreeGridSelectionModelConfig) ?? {},
    );

    this._view = null;

    // Wire store events to relay on this instance
    this._wireStoreEvents();
  }

  protected override afterRender(): void {
    super.afterRender();

    this.el!.classList.add('x-treegrid');

    // Create and render the view into panel body
    this._view = new TreeGridView({
      store: this._store,
      columns: this._columns,
      rootVisible: this._rootVisible,
      checkable: this._checkable,
      lines: this._lines,
      animate: this._animate,
    });
    this._view.render(this.getBodyEl());

    // Update ARIA on the view's el
    if (this._view.el) {
      this._view.el.setAttribute('aria-multiselectable', 'false');
      if ((this._config as any).title) {
        this._view.el.setAttribute('aria-label', (this._config as any).title);
      }
    }

    // Wire view events
    this._view.on('itemclick', (node: NodeInterface, e: MouseEvent) => {
      this._selModel.select(node, e.ctrlKey || e.metaKey, true);
      this._updateSelectionVisuals();
      this.fire('itemclick', this._view, node, e);
      this.fire('selectionchange', this._selModel, this._selModel.getSelection());
    });

    this._view.on('itemdblclick', (node: NodeInterface, e: MouseEvent) => {
      if (this._expandOnDblClick && !node.isLeaf()) {
        this.toggleNode(node);
      }
      this.fire('itemdblclick', this._view, node, e);
    });

    this._view.on('itemcontextmenu', (node: NodeInterface, e: MouseEvent) => {
      this.fire('itemcontextmenu', this._view, node, e);
    });

    this._view.on('expanderclick', (_node: NodeInterface) => {
      // Already handled by store; just need to refresh
    });

    this._view.on('checkboxclick', (node: NodeInterface) => {
      this.toggleChecked(node);
    });

    // Wire store events for view refresh
    (this._store as any).on('nodeexpand', (_s: unknown, node: NodeInterface) => {
      if (!node) return;
      if (this._singleExpand) this._collapseSiblings(node);
      this._view?.onNodeExpand(node, node.childNodes);
      this.fire('itemexpand', node, node.childNodes);
    });

    (this._store as any).on('nodecollapse', (_s: unknown, node: NodeInterface) => {
      if (!node) return;
      this._selModel.onNodeCollapsed(node);
      this._view?.onNodeCollapse(node);
      this.fire('itemcollapse', node);
    });

    (this._store as any).on('nodeappend', (_s: unknown, child: NodeInterface, parent: NodeInterface) => {
      if (!child || !parent) return;
      this._view?.onNodeInsert(parent, child);
    });

    (this._store as any).on('nodeinsert', (_s: unknown, node: NodeInterface, _ref: NodeInterface, parent: NodeInterface) => {
      this._view?.onNodeInsert(parent, node);
    });

    (this._store as any).on('noderemove', (_s: unknown, child: NodeInterface) => {
      this._selModel.onNodeRemoved(child);
      this._view?.onNodeRemove(child.parentNode ?? this._store.getRootNode(), child);
    });

    (this._store as any).on('datachanged', () => {
      this._view?.refresh();
    });

    (this._store as any).on('rootchange', () => {
      this._view?.refresh();
    });

    // Initialize plugins — must happen after view is rendered
    const plugins = (this._config as any).plugins as any[] | undefined;
    if (plugins) {
      for (const plugin of plugins) {
        if (typeof plugin.init === 'function') {
          plugin.init(this);
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Store normalization
  // -------------------------------------------------------------------------

  private _normalizeStore(storeArg: unknown): TreeStore {
    if (storeArg instanceof TreeStore) {
      return storeArg;
    }
    if (Array.isArray(storeArg)) {
      // Array of objects → TreeStore with them as root children
      return new TreeStore({
        model: TreeModel,
        root: {
          id: '__root__',
          text: 'Root',
          expanded: true,
          children: storeArg as Record<string, unknown>[],
        },
      });
    }
    if (typeof storeArg === 'object' && storeArg !== null) {
      // Check if it's a NodeInterface (has childNodes + parentNode + isRoot)
      if (
        'childNodes' in storeArg &&
        'parentNode' in storeArg &&
        typeof (storeArg as any).isRoot === 'function'
      ) {
        return new TreeStore({
          model: TreeModel,
          root: (storeArg as any).serialize?.() ?? storeArg,
        });
      }
      // TreeStoreConfig
      if ('model' in storeArg) {
        return new TreeStore(storeArg as TreeStoreConfig);
      }
      // Root data object
      return new TreeStore({
        model: TreeModel,
        root: storeArg as Record<string, unknown>,
      });
    }
    throw new Error('TreeGrid requires a TreeStore or tree data');
  }

  // -------------------------------------------------------------------------
  // Column normalization
  // -------------------------------------------------------------------------

  private _normalizeColumns(
    cfgColumns: (ColumnConfig | TreeGridColumnConfig)[],
  ): (TreeGridColumn | Column)[] {
    if (cfgColumns.length === 0) {
      // Auto-create a single TreeGridColumn
      return [
        new TreeGridColumn({
          dataIndex: this._displayField,
          text: 'Name',
          flex: 1,
        }),
      ];
    }

    const result: (TreeGridColumn | Column)[] = [];
    let treeColCreated = false;

    for (let i = 0; i < cfgColumns.length; i++) {
      const cfg = cfgColumns[i] as any;
      if (cfg instanceof TreeGridColumn) {
        result.push(cfg);
        treeColCreated = true;
      } else if (cfg instanceof Column) {
        if (!treeColCreated && i === 0) {
          // Convert first column to TreeGridColumn
          result.push(new TreeGridColumn(cfg as unknown as TreeGridColumnConfig));
          treeColCreated = true;
        } else {
          result.push(cfg);
        }
      } else if (cfg.isTreeGridColumn === true) {
        result.push(new TreeGridColumn(cfg));
        treeColCreated = true;
      } else if (!treeColCreated && i === 0) {
        // Auto-convert first column config to TreeGridColumn
        result.push(new TreeGridColumn(cfg));
        treeColCreated = true;
      } else {
        const col = new Column(cfg);
        (col as any)._autoCreated = true;
        result.push(col);
      }
    }

    if (!treeColCreated) {
      result.unshift(
        new TreeGridColumn({ dataIndex: this._displayField, text: 'Name', flex: 1 }),
      );
    }

    return result;
  }

  // -------------------------------------------------------------------------
  // Store event wiring (relay to this instance)
  // -------------------------------------------------------------------------

  private _wireStoreEvents(): void {
    const relayEvents = [
      'nodeappend',
      'nodeinsert',
      'noderemove',
      'nodemove',
      'nodeexpand',
      'nodecollapse',
      'beforeexpand',
      'beforecollapse',
      'nodesort',
      'rootchange',
      'checkchange',
      'load',
      'beforeload',
      'datachanged',
      'refresh',
    ];
    for (const evt of relayEvents) {
      (this._store as any).on(evt, (...args: unknown[]) => {
        this.fire(evt, ...args);
      });
    }
  }

  // -------------------------------------------------------------------------
  // Store access
  // -------------------------------------------------------------------------

  getStore(): TreeStore {
    return this._store;
  }

  getRootNode(): NodeInterface {
    return this._store.getRootNode();
  }

  setRootNode(rootOrData: NodeInterface | Record<string, unknown>): NodeInterface {
    const root = this._store.setRoot(rootOrData);
    this._view?.refresh();
    return root;
  }

  getNodeById(id: string | number): NodeInterface | null {
    return (this._store.getNodeById(id) as NodeInterface | undefined) ?? null;
  }

  // -------------------------------------------------------------------------
  // Expand / Collapse
  // -------------------------------------------------------------------------

  expandAll(callback?: () => void): void {
    this._store.expandAll();
    this._view?.refresh();
    callback?.();
  }

  collapseAll(callback?: () => void): void {
    this._store.collapseAll();
    this._view?.refresh();
    callback?.();
  }

  expandNode(node: NodeInterface, deep = false, callback?: (children: NodeInterface[]) => void): void {
    if (this.fire('beforeitemexpand', node) === false) return;
    this._store.expandNode(node);
    if (deep) {
      node.cascadeBy((child) => {
        if (!child.isLeaf() && child !== node) {
          this._store.expandNode(child);
        }
      });
    }
    this._view?.refresh();
    callback?.(node.childNodes);
  }

  collapseNode(node: NodeInterface, deep = false, callback?: () => void): void {
    if (this.fire('beforeitemcollapse', node) === false) return;
    this._store.collapseNode(node);
    if (deep) {
      node.cascadeBy((child) => {
        if (!child.isLeaf() && child !== node) {
          this._store.collapseNode(child);
        }
      });
    }
    this._view?.refresh();
    callback?.();
  }

  toggleNode(node: NodeInterface): void {
    if (node.isExpanded()) {
      this.collapseNode(node);
    } else {
      this.expandNode(node);
    }
  }

  isNodeExpanded(node: NodeInterface): boolean {
    return node.isExpanded();
  }

  isNodeLoaded(node: NodeInterface): boolean {
    return node.isLoaded();
  }

  async expandPath(
    path: string,
    options: { separator?: string; field?: string; select?: boolean } = {},
  ): Promise<NodeInterface> {
    const separator = options.separator ?? '/';
    const field = options.field ?? 'id';
    const segments = path.split(separator).filter(Boolean);

    let current = this._store.getRootNode();
    for (const seg of segments) {
      if (!current.isExpanded()) {
        this._store.expandNode(current);
      }
      const child = current.findChild(field, seg, false);
      if (!child) break;
      current = child;
    }

    if (!current.isExpanded() && !current.isLeaf()) {
      this._store.expandNode(current);
    }

    this._view?.refresh();

    if (options.select) {
      this.select(current);
    }
    return current;
  }

  async selectPath(
    path: string,
    options: { separator?: string; field?: string } = {},
  ): Promise<NodeInterface> {
    return this.expandPath(path, { ...options, select: true });
  }

  // -------------------------------------------------------------------------
  // Checkbox
  // -------------------------------------------------------------------------

  getChecked(): NodeInterface[] {
    if (!this._checkable) return [];
    const result: NodeInterface[] = [];
    this._store.getRootNode().cascadeBy((node) => {
      if ((node as any).$checked === true) result.push(node);
    });
    return result;
  }

  getCheckedLeaves(): NodeInterface[] {
    return this.getChecked().filter((n) => n.isLeaf());
  }

  setChecked(node: NodeInterface, checked: boolean, suppressEvent = false): void {
    (node as any).$checked = checked;

    if (this._cascadeChecks) {
      const prop = this._checkPropagation;
      if (prop === 'both' || prop === 'down') {
        node.cascadeBy((child) => {
          if (child !== node) (child as any).$checked = checked;
        });
      }
      if (prop === 'both' || prop === 'up') {
        this._updateAncestorChecks(node);
      }
    }

    this._view?.refreshNode(node);

    if (!suppressEvent) {
      this.fire('checkchange', node, checked);
    }
  }

  toggleChecked(node: NodeInterface): void {
    const current = (node as any).$checked;
    this.setChecked(node, !current);
  }

  checkAll(): void {
    this._store.getRootNode().cascadeBy((node) => {
      (node as any).$checked = true;
    });
    this._view?.refresh();
  }

  uncheckAll(): void {
    this._store.getRootNode().cascadeBy((node) => {
      (node as any).$checked = false;
    });
    this._view?.refresh();
  }

  private _updateAncestorChecks(node: NodeInterface): void {
    node.bubble((ancestor) => {
      if (ancestor === node || ancestor.isRoot()) return;
      let allChecked = true;
      let someChecked = false;
      ancestor.eachChild((child) => {
        const state = (child as any).$checked;
        if (state === true) someChecked = true;
        else if (state !== true) allChecked = false;
      });
      if (allChecked) {
        (ancestor as any).$checked = true;
      } else if (someChecked) {
        (ancestor as any).$checked = null; // indeterminate
      } else {
        (ancestor as any).$checked = false;
      }
    });
  }

  // -------------------------------------------------------------------------
  // Selection
  // -------------------------------------------------------------------------

  getSelection(): NodeInterface[] {
    return this._selModel.getSelection();
  }

  select(
    nodes: NodeInterface | NodeInterface[] | number | number[],
    keepExisting = false,
    suppressEvent = false,
  ): void {
    const flatData = this._store.flattenNodes() as NodeInterface[];
    const toSelect = (Array.isArray(nodes) ? nodes : [nodes]).map((n) =>
      typeof n === 'number' ? flatData[n] : n,
    ).filter(Boolean) as NodeInterface[];

    this._selModel.select(toSelect, keepExisting, suppressEvent);
    this._updateSelectionVisuals();
    if (!suppressEvent) {
      this.fire('selectionchange', this._selModel, this._selModel.getSelection());
    }
  }

  deselect(
    nodes: NodeInterface | NodeInterface[] | number | number[],
    suppressEvent = false,
  ): void {
    const flatData = this._store.flattenNodes() as NodeInterface[];
    const toDeselect = (Array.isArray(nodes) ? nodes : [nodes]).map((n) =>
      typeof n === 'number' ? flatData[n] : n,
    ).filter(Boolean) as NodeInterface[];

    this._selModel.deselect(toDeselect, suppressEvent);
    this._updateSelectionVisuals();
  }

  deselectAll(suppressEvent = false): void {
    const prev = this._selModel.getSelection();
    this._selModel.deselectAll(suppressEvent);
    for (const node of prev) this._view?.markSelected(node, false);
  }

  selectAll(suppressEvent = false): void {
    const flatData = this._store.flattenNodes() as NodeInterface[];
    this._selModel.selectAll(flatData, suppressEvent);
    this._updateSelectionVisuals();
  }

  private _updateSelectionVisuals(): void {
    const selected = new Set(this._selModel.getSelection());
    const flatData = this._store.flattenNodes() as NodeInterface[];
    for (const node of flatData) {
      this._view?.markSelected(node, selected.has(node));
    }
  }

  // -------------------------------------------------------------------------
  // Scroll
  // -------------------------------------------------------------------------

  async scrollToNode(
    node: NodeInterface,
    options: { focus?: boolean; select?: boolean } = {},
  ): Promise<void> {
    // Expand ancestors
    let ancestor = node.parentNode;
    while (ancestor && !ancestor.isRoot()) {
      if (!ancestor.isExpanded()) {
        this._store.expandNode(ancestor);
      }
      ancestor = ancestor.parentNode;
    }
    this._view?.refresh();

    const row = this._view?.getNodeRow(node);
    row?.scrollIntoView?.({ block: 'nearest' });

    if (options.focus) this._view?.focusRow(node);
    if (options.select) this.select(node);
  }

  async ensureNodeVisible(node: NodeInterface): Promise<void> {
    return this.scrollToNode(node);
  }

  // -------------------------------------------------------------------------
  // View / Column access
  // -------------------------------------------------------------------------

  getView(): TreeGridView {
    return this._view!;
  }

  getTreeColumn(): TreeGridColumn {
    return this._treeColumn;
  }

  getColumns(): (TreeGridColumn | Column)[] {
    return this._columns;
  }

  getColumnByDataIndex(dataIndex: string): Column | undefined {
    return this._columns.find((c) => c.dataIndex === dataIndex);
  }

  getNodeRow(node: NodeInterface): HTMLElement | null {
    return this._view?.getNodeRow(node) ?? null;
  }

  getNodeFromRow(rowEl: HTMLElement): NodeInterface | null {
    return this._view?.getRecord(rowEl) ?? null;
  }

  getDepthIndent(depth: number): number {
    return depth * this._treeColumn.indentSize;
  }

  // -------------------------------------------------------------------------
  // Reload
  // -------------------------------------------------------------------------

  reload(): Promise<NodeInterface[]> {
    this._store.collapseAll();
    this._view?.refresh();
    return Promise.resolve(this._store.getRootNode().childNodes);
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

  getDisplayField(): string {
    return this._displayField;
  }

  // -------------------------------------------------------------------------
  // Single expand helper
  // -------------------------------------------------------------------------

  private _collapseSiblings(expandedNode: NodeInterface): void {
    const parent = expandedNode.parentNode;
    if (!parent) return;
    parent.eachChild((sibling) => {
      if (sibling !== expandedNode && sibling.isExpanded()) {
        this._store.collapseNode(sibling);
      }
    });
  }

  // -------------------------------------------------------------------------
  // Event helper
  // -------------------------------------------------------------------------

  private fire(eventName: string, ...args: unknown[]): boolean {
    if (typeof (this as any).fireEvent === 'function') {
      return (this as any).fireEvent(eventName, ...args);
    }
    return true;
  }
}
