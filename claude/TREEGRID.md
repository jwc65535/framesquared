# Prompt: Implement Complete TreeGrid System

You are working on **ext-ts**, a ground-up reimplementation of Sencha ExtJS in modern TypeScript with ESM modules. There is **no Internet Explorer support** — use any modern browser API freely (Proxy, WeakMap, WeakRef, ResizeObserver, MutationObserver, IntersectionObserver, structuredClone, Symbol.dispose, CSS Container Queries, CSS `subgrid`, Popover API, etc.).

This project uses **strict test-driven development**. For every module below:
1. Write comprehensive failing tests FIRST
2. Verify they fail (red)
3. Implement the minimum code to pass (green)
4. Refactor while tests stay green
5. Maintain 90%+ code coverage

The test runner is **Vitest** with `jsdom` environment. Use `vi.fn()`, `vi.spyOn()`, `vi.useFakeTimers()`, and `vi.stubGlobal()` as needed. Mock `fetch()` for async data loading. Use `vi.advanceTimersByTime()` for debounce/throttle testing.

---

## Context: What Is a TreeGrid?

In ExtJS, a TreeGrid (also called `Ext.tree.Panel` with columns) is a **hybrid component** that combines:

- **Tree behavior**: hierarchical expand/collapse, parent-child relationships, lazy loading, indentation, tree lines, drag-and-drop reorder within a hierarchy
- **Grid behavior**: multiple sortable/resizable/reorderable columns, cell renderers, row selection, column headers, scrollable body, cell/row editing, grouping summaries, locked (frozen) columns, buffered/virtual rendering, clipboard, column menu, column hide/show

It is NOT simply a TreePanel with extra columns, nor a Grid with indentation. It is a fully unified component where:

- The **first column** (the "tree column") shows the hierarchical structure: indentation spacers, expand/collapse icons, node icons, checkboxes, and the primary text value
- **Subsequent columns** show additional data fields for each node, rendered identically to a standard Grid column
- **All Grid features** (sorting, filtering, column operations, editing, selection, virtual scrolling, features/plugins) work correctly with hierarchical data
- **All Tree features** (expand/collapse, lazy loading, checkbox cascade, drag-drop reparenting, tree keyboard navigation) work correctly within the grid structure

In ExtJS 4+, `Ext.tree.Panel` actually extends `Ext.grid.Panel`, making every tree a grid. Our reimplementation follows this pattern: **TreeGrid extends Grid**, with TreeStore as its store and TreeColumn as a mandatory first column.

---

## Prerequisites (Assumed Already Implemented)

The following modules exist and are fully functional. Import them as needed — do NOT reimplement them.

```typescript
// ─── @ext-ts/core ───
import { Base } from '@ext-ts/core';                    // Base class: config system, destroy(), callParent(), Symbol.dispose
import { Observable } from '@ext-ts/core';               // Mixin: on(), un(), fireEvent(), suspendEvents(), resumeEvents(), relayEvents(), mon()
import { Identifiable } from '@ext-ts/core';             // Mixin: id config, auto-generated IDs, global identity map
import { Pluggable } from '@ext-ts/core';                // Mixin: plugins config, addPlugin(), getPlugin()
import { Plugin } from '@ext-ts/core';                   // Base plugin class
import { ClassManager, define } from '@ext-ts/core';     // Class registration, alias resolution, xtype lookup
import { generateId, apply, applyIf, clone } from '@ext-ts/core';
import { isObject, isString, isArray, isNumber, isFunction, isDefined, isEmpty } from '@ext-ts/core';
import { Destroyable } from '@ext-ts/core';              // Interface with destroy(), Destroyable.combine()

// ─── @ext-ts/data ───
import { Model } from '@ext-ts/data';                    // Data model: fields, get/set, Proxy-based access, dirty tracking, validation
import { Store } from '@ext-ts/data';                    // Flat store: sort, filter, group, CRUD, events, Collection
import { TreeModel } from '@ext-ts/data';                // Model with NodeInterface pre-mixed
import { TreeStore } from '@ext-ts/data';                // Hierarchical store: root, flatData, async loading, expand/collapse, checkbox cascade, tree filtering
import { NodeInterface } from '@ext-ts/data';            // Mixin: parentNode, childNodes, appendChild, insertBefore, removeChild, expand, collapse, cascadeBy, bubble, getPath, serialize, etc.
import { Collection } from '@ext-ts/data';               // Ordered keyed collection
import { Sorter, Filter } from '@ext-ts/data';           // Sort/filter descriptors
import { Proxy, MemoryProxy, AjaxProxy, RestProxy } from '@ext-ts/data';
import { JsonReader, TreeReader } from '@ext-ts/data';   // JSON and nested-tree JSON readers
import { JsonWriter, TreeWriter } from '@ext-ts/data';   // JSON and nested-tree JSON writers
import { Operation, ResultSet } from '@ext-ts/data';

// ─── @ext-ts/component ───
import { Component } from '@ext-ts/component';           // Base UI: lifecycle, render, show/hide, resize, CSS ops, focus
import { Container } from '@ext-ts/component';           // Child management, query(), down(), up(), Component Query
import { XTemplate } from '@ext-ts/component';           // Template engine: {field}, <tpl for>, <tpl if>, format functions

// ─── @ext-ts/layout ───
import { Layout } from '@ext-ts/layout';
import { FitLayout } from '@ext-ts/layout';
import { HBoxLayout, VBoxLayout } from '@ext-ts/layout';

// ─── @ext-ts/ui ───
import { Panel } from '@ext-ts/ui';                      // Panel: header, tools, collapse, dock, body
import { Grid } from '@ext-ts/ui';                       // Grid panel: columns, selection, virtual scrolling, features, plugins
import { GridView } from '@ext-ts/ui';                   // Grid view: DOM row rendering, virtual scrolling, row events
import { Column } from '@ext-ts/ui';                     // Column base: dataIndex, width, flex, sortable, renderer, editor, hideable
import { NumberColumn } from '@ext-ts/ui';               // Number-formatted column
import { DateColumn } from '@ext-ts/ui';                 // Date-formatted column
import { BooleanColumn } from '@ext-ts/ui';              // True/false text column
import { CheckColumn } from '@ext-ts/ui';                // Checkbox column
import { ActionColumn } from '@ext-ts/ui';               // Action icon buttons column
import { TemplateColumn } from '@ext-ts/ui';             // XTemplate-rendered column
import { WidgetColumn } from '@ext-ts/ui';               // Component-in-cell column
import { RowNumbererColumn } from '@ext-ts/ui';          // Row numbering column
import { HeaderContainer } from '@ext-ts/ui';            // Column header management: resize, reorder, column menu
import { SelectionModel, RowSelectionModel, CellSelectionModel } from '@ext-ts/ui';
import { Toolbar } from '@ext-ts/ui';
import { Button } from '@ext-ts/ui';

// ─── @ext-ts/ui (Tree — already implemented from previous prompt) ───
import { TreePanel } from '@ext-ts/ui';                  // Basic single-column tree panel
import { TreeView } from '@ext-ts/ui';                   // Tree node renderer
import { TreeColumn as BasicTreeColumn } from '@ext-ts/ui'; // Single-column tree column
import { TreeDragZone } from '@ext-ts/ui';               // Tree drag source
import { TreeDropZone } from '@ext-ts/ui';               // Tree drop target
import { TreeViewDragDrop } from '@ext-ts/ui';           // Tree drag-drop plugin
import { TreeSelectionModel } from '@ext-ts/ui';         // Tree-aware selection

// ─── @ext-ts/ui (Grid features/plugins — already implemented) ───
import { Grouping as GridGroupingFeature } from '@ext-ts/ui';
import { Summary as GridSummaryFeature } from '@ext-ts/ui';
import { GroupingSummary as GridGroupingSummaryFeature } from '@ext-ts/ui';
import { RowBody as GridRowBodyFeature } from '@ext-ts/ui';
import { CellEditing as GridCellEditingPlugin } from '@ext-ts/ui';
import { RowEditing as GridRowEditingPlugin } from '@ext-ts/ui';
import { RowExpander as GridRowExpanderPlugin } from '@ext-ts/ui';
import { Clipboard as GridClipboardPlugin } from '@ext-ts/ui';
import { PagingToolbar } from '@ext-ts/ui';

// ─── @ext-ts/dd ───
import { Draggable, Droppable, DragData, Sortable, DragManager, DragProxy } from '@ext-ts/dd';

// ─── @ext-ts/fx ───
import { Animation, Anim } from '@ext-ts/fx';            // Web Animations API wrappers

// ─── @ext-ts/form ───
import { Field, TextField, NumberField, DateField, ComboBox, Checkbox } from '@ext-ts/form';
```

---

## Deliverables — Complete File List

### Source Files

```
packages/ui/src/treegrid/TreeGrid.ts                      — Main TreeGrid component
packages/ui/src/treegrid/TreeGridView.ts                   — Tree-aware grid view renderer
packages/ui/src/treegrid/TreeGridColumn.ts                 — Tree column for grids (indentation + data)
packages/ui/src/treegrid/TreeGridDragDrop.ts               — Drag-and-drop plugin for TreeGrid
packages/ui/src/treegrid/TreeGridCellEditing.ts            — Tree-aware cell editing plugin
packages/ui/src/treegrid/TreeGridRowEditing.ts             — Tree-aware row editing plugin
packages/ui/src/treegrid/TreeGridClipboard.ts              — Tree-aware clipboard plugin
packages/ui/src/treegrid/TreeGridSummary.ts                — Summary feature for tree-structured data
packages/ui/src/treegrid/TreeGridGroupingSummary.ts        — Per-depth-level grouping summary
packages/ui/src/treegrid/TreeGridRowExpander.ts            — Row expander (detail view below node rows)
packages/ui/src/treegrid/TreeGridFilterPlugin.ts           — Column filter integration for tree data
packages/ui/src/treegrid/TreeGridStateMixin.ts             — State persistence (column widths, expanded nodes, sort, etc.)
packages/ui/src/treegrid/TreeGridLockable.ts               — Locked/frozen columns support for TreeGrid
packages/ui/src/treegrid/TreeGridSelectionModel.ts         — Selection model with tree-grid awareness
packages/ui/src/treegrid/TreeGridExporter.ts               — Export to CSV/JSON/XLSX with hierarchy
packages/ui/src/treegrid/index.ts                          — Barrel exports
```

### Test Files (write ALL of these BEFORE any source file)

```
packages/ui/tests/treegrid/TreeGrid.test.ts
packages/ui/tests/treegrid/TreeGridView.test.ts
packages/ui/tests/treegrid/TreeGridColumn.test.ts
packages/ui/tests/treegrid/TreeGridDragDrop.test.ts
packages/ui/tests/treegrid/TreeGridCellEditing.test.ts
packages/ui/tests/treegrid/TreeGridRowEditing.test.ts
packages/ui/tests/treegrid/TreeGridClipboard.test.ts
packages/ui/tests/treegrid/TreeGridSummary.test.ts
packages/ui/tests/treegrid/TreeGridGroupingSummary.test.ts
packages/ui/tests/treegrid/TreeGridRowExpander.test.ts
packages/ui/tests/treegrid/TreeGridFilterPlugin.test.ts
packages/ui/tests/treegrid/TreeGridState.test.ts
packages/ui/tests/treegrid/TreeGridLockable.test.ts
packages/ui/tests/treegrid/TreeGridSelectionModel.test.ts
packages/ui/tests/treegrid/TreeGridExporter.test.ts
packages/ui/tests/treegrid/TreeGridIntegration.test.ts    — Full end-to-end scenarios
packages/ui/tests/treegrid/TreeGridPerformance.test.ts    — Performance and memory benchmarks
packages/ui/tests/treegrid/TreeGridAccessibility.test.ts  — ARIA and keyboard conformance
```

---

## Part 1: TreeGrid

`packages/ui/src/treegrid/TreeGrid.ts`

### Class Definition

TreeGrid **extends Grid**. It is the primary entry point and replaces both `Ext.tree.Panel` (for multi-column trees) and any "tree grid" usage. It is aliased as `xtype: 'treegrid'` and also registered as `xtype: 'treepanel'` when columns are present.

```typescript
@alias('widget.treegrid')
class TreeGrid extends Grid {
  // ...
}
```

### Configuration

```typescript
interface TreeGridConfig extends GridConfig {
  // ─── Store ───
  // TreeGrid REQUIRES a TreeStore. If a plain Store or array is passed,
  // it is automatically wrapped in a TreeStore.
  store: TreeStore | TreeStoreConfig | object[] | NodeInterface;

  // ─── Tree Behavior ───
  rootVisible?: boolean;
  // Whether the root node is rendered as a row. Default: false.
  // When false, the root's children are the top-level visible rows.

  displayField?: string;
  // The field name shown in the tree column text. Default: 'text'.

  useArrows?: boolean;
  // true: modern disclosure triangle/chevron. false: classic +/- icons. Default: true.

  lines?: boolean;
  // Render tree connector lines between parent and children. Default: false.
  // When true, each depth level gets vertical/horizontal line segments
  // showing the hierarchy relationship.

  singleExpand?: boolean;
  // At each depth level, only one node can be expanded at a time.
  // Expanding a node at depth N auto-collapses its siblings. Default: false.

  animate?: boolean;
  // Animate expand/collapse transitions (slide child rows). Default: true.
  // Uses Web Animations API for smooth height transitions.

  expandOnDblClick?: boolean;
  // Double-clicking a row expands/collapses it. Default: true.
  // Only applies to the tree column row, not other columns' double-click behavior.

  folderSort?: boolean;
  // Sort non-leaf (folder) nodes before leaf nodes at each level, regardless
  // of the user's column sort. Default: false.

  // ─── Checkbox Tree ───
  checkable?: boolean;
  // Show a checkbox on every node (or every leaf if onlyLeafCheckable). Default: false.

  cascadeChecks?: boolean;
  // When a node is checked, cascade to all descendants. When unchecked, cascade
  // down. When a child changes, bubble up tri-state to ancestors. Default: true.
  // Only meaningful when checkable=true.

  checkPropagation?: 'up' | 'down' | 'both' | 'none';
  // Fine-grained control over check cascade direction.
  // 'both': cascade down + bubble up (default when cascadeChecks=true).
  // 'down': only cascade to descendants when checking.
  // 'up': only bubble to ancestors.
  // 'none': no cascade at all (same as cascadeChecks=false).

  onlyLeafCheckable?: boolean;
  // Only show checkboxes on leaf nodes. Parent nodes infer their state from
  // children but have no clickable checkbox. Default: false.

  // ─── Columns ───
  // The first column MUST be a TreeGridColumn (or will be automatically wrapped).
  // If the user provides columns without specifying the tree column, the first
  // column is converted to a TreeGridColumn.
  // If no columns are provided at all, a single TreeGridColumn bound to
  // displayField is auto-created.
  columns?: (ColumnConfig | TreeGridColumnConfig)[];

  treeColumn?: TreeGridColumn | TreeGridColumnConfig | number;
  // Explicit reference to the tree column by instance, config, or index.
  // If omitted, the first column is used.

  // ─── Drag & Drop ───
  enableDrag?: boolean;                   // Default: false
  enableDrop?: boolean;                   // Default: false
  ddGroup?: string;                       // Drag/drop group. Default: 'TreeGridDD'
  appendOnly?: boolean;                   // Only allow 'append' drops, not insert-between. Default: false
  sortOnDrop?: boolean;                   // Sort siblings after a drop operation. Default: false
  allowContainerDrops?: boolean;          // Allow dropping on empty body area. Default: false
  expandDelay?: number;                   // ms to hover before auto-expanding a collapsed node. Default: 500
  allowParentInserts?: boolean;           // Allow insert-between operation at parent level. Default: true
  dragText?: string;                      // Text shown in drag ghost. Default: '{0} selected node(s)'
  copy?: boolean;                         // Default to copy instead of move. Default: false
  allowCopy?: boolean;                    // Allow Ctrl+drag to copy. Default: true

  // ─── View ───
  viewType?: string;                      // View xtype. Default: 'treegridview'
  viewConfig?: TreeGridViewConfig;        // Config passed to the view

  // ─── Grid Features (inherited, but tree-aware) ───
  // All standard Grid configs are inherited:
  // enableColumnHide, enableColumnMove, enableColumnResize, sortableColumns,
  // multiColumnSort, emptyText, loadMask, scroll, selModel, features, plugins, etc.
}
```

### Constructor Behavior

1. **Store normalization**: If `config.store` is not a TreeStore instance, wrap it:
  - If it's a plain `Store`, throw an error — TreeGrid requires TreeStore.
  - If it's an array of objects, create a TreeStore with `MemoryProxy` and inline root children.
  - If it's a `TreeStoreConfig` object, instantiate a new TreeStore.
  - If it's a `NodeInterface` (a root node), create a TreeStore with that root.
  - Ensure the store's model has `NodeInterface` mixed in.

2. **Column normalization**:
  - Scan `config.columns` for a `TreeGridColumn`. If none found, convert the first column to a `TreeGridColumn` by transferring its config and adding tree rendering.
  - If `config.columns` is empty or undefined, create a default `TreeGridColumn` with `dataIndex: config.displayField || 'text'`, `text: 'Name'`, `flex: 1`.
  - Record the tree column reference as `this.treeColumn`.

3. **Apply tree defaults**:
  - Set `this.rootVisible` from config (default `false`).
  - Propagate `rootVisible` to the TreeStore.
  - Set `this.singleExpand`, `this.animate`, etc.
  - If `checkable`, set `cascadeChecks` on the TreeStore.

4. **Relay TreeStore events**: The TreeGrid relays all TreeStore events so listeners can be attached directly to the TreeGrid:
   ```
   nodeappend, nodeinsert, noderemove, nodemove, nodeexpand, nodecollapse,
   beforeexpand, beforecollapse, nodesort, rootchange, checkchange,
   load, beforeload, datachanged, refresh
   ```

5. **Initialize plugins**: If `enableDrag` or `enableDrop`, auto-add `TreeGridDragDrop` plugin.

6. **View creation**: Override `viewType` to `'treegridview'` (resolved to `TreeGridView`).

7. **Call super**: `super(normalizedConfig)` — delegates to Grid constructor which handles column creation, header container, selection model, feature initialization, etc.

### Properties

```typescript
readonly isTreeGrid: boolean = true;

// Quick access
treeColumn: TreeGridColumn;              // The tree column instance (set during construction)
rootVisible: boolean;                    // Whether root is shown
singleExpand: boolean;
checkable: boolean;
```

### Methods

#### Store Access

```typescript
getStore(): TreeStore;
// Returns the TreeStore. Always a TreeStore, never a plain Store.
// Overrides Grid.getStore() return type.

getRootNode(): NodeInterface;
// Shortcut: this.getStore().getRootNode().

setRootNode(rootOrData: NodeInterface | object): NodeInterface;
// Replaces the tree root. Delegates to TreeStore.setRootNode().
// Refreshes the grid view completely.
// Returns the new root node.

getNodeById(id: string | number): NodeInterface | null;
// Shortcut: this.getStore().getNodeById(id).
```

#### Expand / Collapse

```typescript
expandAll(callback?: () => void): void;
// Expands every node in the tree. If async nodes need loading, waits for all
// loads to complete before calling callback.
// Delegates to TreeStore.expandAll().
// After all expansions, refreshes the view once.

collapseAll(callback?: () => void): void;
// Collapses every node. Delegates to TreeStore.collapseAll().
// After all collapses, refreshes the view once.

expandNode(node: NodeInterface, deep?: boolean, callback?: (childNodes: NodeInterface[]) => void): void;
// Expands a single node. If deep=true, recursively expands all descendants.
// If the node is not yet loaded, triggers async load through proxy.
// Handles singleExpand: if enabled, collapses siblings at the same depth.
// Fires 'beforeexpand' (cancellable) and 'expand' events.
// callback receives the child nodes after expansion (and loading) completes.
// If animate=true, the child rows are animated in via a height transition.

collapseNode(node: NodeInterface, deep?: boolean, callback?: () => void): void;
// Collapses a single node. If deep=true, recursively collapses all descendants.
// Fires 'beforecollapse' (cancellable) and 'collapse' events.
// If animate=true, child rows slide out.

toggleNode(node: NodeInterface): void;
// If expanded, collapse. If collapsed, expand.

expandPath(path: string, options?: ExpandPathOptions): Promise<NodeInterface>;
// Expands nodes along a path string (e.g., "/root/folder1/subfolder").
// Each segment is resolved by field value (default: 'id', configurable).
// If a segment's node is not yet loaded, triggers async load and waits.
// Returns Promise resolving to the final node in the path.
// Options:
//   separator?: string (default '/')
//   field?: string (default 'id')
//   select?: boolean — if true, selects the final node after expanding
//   focus?: boolean — if true, focuses and scrolls to the final node

selectPath(path: string, options?: ExpandPathOptions): Promise<NodeInterface>;
// Convenience: calls expandPath with select=true and focus=true.

isNodeExpanded(node: NodeInterface): boolean;
// Returns node.isExpanded().

isNodeLoaded(node: NodeInterface): boolean;
// Returns node.isLoaded().
```

#### Checkbox

```typescript
getChecked(): NodeInterface[];
// Returns all nodes where checked === true (not indeterminate).
// Deep search across entire tree.

getCheckedLeaves(): NodeInterface[];
// Returns only LEAF nodes that are checked.

setChecked(node: NodeInterface, checked: boolean, suppressEvent?: boolean): void;
// Sets the checked state on a node.
// If cascadeChecks and checkPropagation includes 'down': cascades to descendants.
// If cascadeChecks and checkPropagation includes 'up': bubbles tri-state to ancestors.
// Fires 'checkchange' event (unless suppressed).
// Updates the checkbox DOM in the tree column cell.

checkAll(): void;
// Checks every checkable node.

uncheckAll(): void;
// Unchecks every checkable node.

toggleChecked(node: NodeInterface): void;
// Toggles the node's checked state.
```

#### Selection (overrides/extends Grid selection)

```typescript
getSelection(): NodeInterface[];
// Returns selected nodes (delegates to selection model).

select(nodesOrIndices: NodeInterface | NodeInterface[] | number | number[], keepExisting?: boolean, suppressEvent?: boolean): void;
// Selects nodes by reference or by flatData index.

deselect(nodesOrIndices: NodeInterface | NodeInterface[] | number | number[], suppressEvent?: boolean): void;

deselectAll(suppressEvent?: boolean): void;

selectAll(suppressEvent?: boolean): void;
// Selects all visible (flatData) nodes.
```

#### Scrolling

```typescript
scrollToNode(node: NodeInterface, options?: ScrollToNodeOptions): Promise<void>;
// Ensures the node is visible by:
// 1. Expanding all ancestors (async if needed — loads unloaded ancestors)
// 2. Waiting for flatData rebuild
// 3. Scrolling the view to bring the node's row into the viewport
// 4. Optionally focusing the row
// Options:
//   animate?: boolean (default true) — smooth scroll
//   focus?: boolean (default false) — focus the row after scrolling
//   select?: boolean (default false) — select the row after scrolling
//   highlight?: boolean (default false) — briefly highlight the row with a flash effect
//   highlightColor?: string (default theme accent)

ensureNodeVisible(node: NodeInterface): Promise<void>;
// Alias for scrollToNode with default options.
```

#### Utility

```typescript
getView(): TreeGridView;
// Returns the TreeGridView (overrides Grid.getView() return type).

getTreeColumn(): TreeGridColumn;
// Returns the tree column instance.

getColumnByDataIndex(dataIndex: string): Column | undefined;
// Finds a column by its dataIndex. Inherited from Grid.

reload(): Promise<NodeInterface[]>;
// Reloads the tree from proxy. Delegates to TreeStore.reload().
// Collapses all → clears tree → loads root children.

getNodeRow(node: NodeInterface): HTMLElement | null;
// Returns the <tr> DOM element for the given node, or null if not rendered
// (e.g., node is in a collapsed subtree or outside the virtual scroll window).

getNodeFromRow(rowElement: HTMLElement): NodeInterface | null;
// Returns the node for a given row element.

getDepthIndent(depth: number): number;
// Returns the total indentation in pixels for a given depth level.
// Calculated as: depth * treeColumn.indentSize.
```

### Events

TreeGrid fires all Grid events PLUS all TreeStore events (relayed), PLUS:

| Event | Arguments | Description |
|-------|-----------|-------------|
| `itemexpand` | `(node: NodeInterface, childNodes: NodeInterface[])` | Node expanded |
| `itemcollapse` | `(node: NodeInterface)` | Node collapsed |
| `beforeitemexpand` | `(node: NodeInterface)` → return false to cancel | Before expand |
| `beforeitemcollapse` | `(node: NodeInterface)` → return false to cancel | Before collapse |
| `checkchange` | `(node: NodeInterface, checked: boolean)` | Checkbox toggled |
| `itemclick` | `(view: TreeGridView, record: NodeInterface, rowEl: HTMLElement, index: number, event: Event)` | Row clicked |
| `itemdblclick` | `(view: TreeGridView, record: NodeInterface, rowEl: HTMLElement, index: number, event: Event)` | Row double-clicked |
| `itemcontextmenu` | `(view: TreeGridView, record: NodeInterface, rowEl: HTMLElement, index: number, event: Event)` | Right-click on row |
| `itemmouseenter` | `(view: TreeGridView, record: NodeInterface, rowEl: HTMLElement, index: number, event: Event)` | Mouse enters row |
| `itemmouseleave` | `(view: TreeGridView, record: NodeInterface, rowEl: HTMLElement, index: number, event: Event)` | Mouse leaves row |
| `beforedrop` | `(targetNode: NodeInterface, dragData: DragData, overModel: NodeInterface, dropPosition: DropPosition, dropFn: Function)` | Before drop executes |
| `drop` | `(targetNode: NodeInterface, dragData: DragData, overModel: NodeInterface, dropPosition: DropPosition)` | After drop executes |
| `nodedragover` | `(targetNode: NodeInterface, position: DropPosition, dragData: DragData)` → return false to cancel | During drag over |
| `selectionchange` | `(model: SelectionModel, selected: NodeInterface[])` | Selection changed |
| `sortchange` | `(headerContainer: HeaderContainer, column: Column, direction: 'ASC' \| 'DESC')` | Column sort changed |
| `columnresize` | `(column: Column, width: number)` | Column resized |
| `columnmove` | `(column: Column, fromIndex: number, toIndex: number)` | Column reordered |
| `columnhide` | `(column: Column)` | Column hidden |
| `columnshow` | `(column: Column)` | Column shown |
| `afterlayout` | `()` | After layout completes |

### Tests for TreeGrid

`packages/ui/tests/treegrid/TreeGrid.test.ts`

Write comprehensive tests covering:

#### Construction

1. **Store normalization**:
  - Pass TreeStore instance → used directly
  - Pass TreeStoreConfig object → TreeStore created
  - Pass array of objects → TreeStore created with MemoryProxy, objects as root children
  - Pass NodeInterface root → TreeStore created with that root
  - Pass plain Store → throws meaningful error

2. **Column normalization**:
  - Pass columns with first being TreeGridColumnConfig → used directly
  - Pass columns where none is TreeGridColumn → first column auto-converted
  - Pass no columns → default TreeGridColumn created with displayField
  - getTreeColumn() returns the correct column instance

3. **Config propagation**:
  - rootVisible propagated to TreeStore
  - cascadeChecks propagated to TreeStore
  - singleExpand stored on instance
  - animate stored on instance

4. **Event relaying**:
  - TreeStore 'nodeappend' is relayed as TreeGrid 'nodeappend'
  - TreeStore 'checkchange' is relayed as TreeGrid 'checkchange'
  - Verify all 14+ relayed events

#### Rendering

5. Renders as a grid table with column headers
6. Renders rows for visible (flatData) nodes from TreeStore
7. rootVisible=false → root node not rendered as a row
8. rootVisible=true → root node rendered as first row
9. Empty tree (root with no children) shows emptyText
10. Each row has correct data in each column cell
11. First column (tree column) shows indentation, icon, text
12. Subsequent columns show plain data values

#### Expand / Collapse

13. expandNode() → child rows appear in DOM at correct position
14. collapseNode() → child rows removed from DOM
15. toggleNode() alternates between expanded and collapsed
16. singleExpand: expanding A collapses sibling B at same depth
17. singleExpand: nodes at different depths can be expanded independently
18. expandAll → every non-leaf node expanded, all rows visible
19. collapseAll → only top-level rows visible (or root if rootVisible)
20. expandOnDblClick: double-clicking row toggles expansion
21. animate=true: expand triggers height transition animation (mock WAAPI)
22. Deep expand: expandNode(node, true) recursively expands descendants
23. Async expand: expanding non-loaded node triggers TreeStore.loadNode(), shows loading indicator in row, then renders children after load
24. expandPath: resolves each path segment, loads async segments, returns final node
25. selectPath: expands + selects + focuses the final node

#### Checkbox

26. checkable=true → checkbox rendered in tree column for each node
27. Click checkbox → toggles checked state
28. cascadeChecks + checkPropagation='both': check parent → all descendants checked
29. Uncheck one grandchild → parent becomes indeterminate, grandparent becomes indeterminate
30. onlyLeafCheckable → checkboxes only on leaf nodes, parent shows read-only state
31. getChecked() returns only checked nodes
32. getCheckedLeaves() returns only checked leaf nodes
33. checkAll() / uncheckAll() affects all checkable nodes
34. checkchange event fires with correct node and state

#### Selection

35. Click row → selected (row highlight applied)
36. Ctrl+click → adds to selection (MULTI mode)
37. Shift+click → range selection in flatData order (visible order)
38. selectionchange event fires
39. Collapsing a node with selected children: children stay selected but are hidden
40. Expanding restores visibility of selected children (selection highlight appears)
41. Removing a selected node auto-deselects it (pruneRemoved)
42. selectAll() selects all visible nodes
43. deselectAll() clears selection

#### Sorting

44. Click column header → sorts tree by that column's dataIndex
45. Sort is applied recursively: each parent's children sorted independently
46. folderSort: non-leaf before leaf at each level, then user sort within each group
47. Multi-column sort: primary by first header click, secondary by Shift+click
48. Sort direction toggles: ASC → DESC → no sort
49. Sort updates flatData and re-renders view
50. sortchange event fires

#### Filtering

51. Filter tree by column value → matching nodes and their ancestors visible
52. Non-matching leaf nodes hidden
53. Non-matching parent with matching descendant stays visible (bottomup default)
54. clearFilter restores full tree
55. Column filter menu integration (if filter plugin active)

#### Scrolling

56. scrollToNode: expands ancestors, scrolls row into view
57. scrollToNode with highlight=true: row briefly flashes
58. ensureNodeVisible: same behavior

#### Store Binding

59. TreeStore appendChild → new row appears at correct position
60. TreeStore removeChild → row disappears
61. TreeStore node field change (text, iconCls) → row cell DOM updates
62. TreeStore setRootNode → entire grid refreshes
63. TreeStore reload → grid refreshes

#### Destroy

64. destroy() destroys view, columns, cleans up events
65. After destroy, all DOM removed, no event listener leaks

---

## Part 2: TreeGridView

`packages/ui/src/treegrid/TreeGridView.ts`

TreeGridView **extends GridView** to add tree-specific rendering, expand/collapse animations, and hierarchical row management.

### How It Differs from GridView

| Aspect | GridView | TreeGridView |
|--------|----------|--------------|
| Data source | Store.getRange() — flat array | TreeStore.getData() — flat projection of visible nodes |
| Row rendering | All rows equal | Tree column cell has indentation, expander, icon, checkbox |
| Add/remove rows | Based on store add/remove | Based on expand/collapse (children appear/disappear) |
| Row attributes | Standard grid row | Additional tree ARIA attributes |
| Virtual scrolling | By row index | By flatData index (accounts for expand/collapse) |
| Events | Standard grid events | Additional: expand/collapse click handling, checkbox clicks |

### Configuration

```typescript
interface TreeGridViewConfig extends GridViewConfig {
  animate?: boolean;                     // Animate expand/collapse. Default: true
  animationDuration?: number;            // ms. Default: 250
  expanderSelector?: string;             // CSS selector for the expand/collapse icon. Default: '.x-treegrid-expander'
  checkboxSelector?: string;             // CSS selector for the checkbox. Default: '.x-treegrid-checkbox'
  loadingCls?: string;                   // CSS class for loading indicator. Default: 'x-treegrid-loading'
  expandedCls?: string;                  // CSS class for expanded node row. Default: 'x-treegrid-expanded'
  collapsedCls?: string;                 // CSS class for collapsed node row. Default: 'x-treegrid-collapsed'
  leafCls?: string;                      // CSS class for leaf node row. Default: 'x-treegrid-leaf'
  nodeOverCls?: string;                  // CSS class on mouse over. Default: 'x-treegrid-node-over'
  selectedCls?: string;                  // CSS class on selected row. Default: 'x-treegrid-selected'
  focusedCls?: string;                   // CSS class on focused row. Default: 'x-treegrid-focused'
  rootNodeCls?: string;                  // CSS class for the root row (if visible). Default: 'x-treegrid-root-node'
  containerEmptyText?: string;           // Text shown when tree is completely empty
  deferEmptyText?: boolean;              // Wait for first load before showing empty text. Default: true
}
```

### DOM Structure

Each row rendered by TreeGridView:

```html
<tr class="x-grid-row x-treegrid-node x-treegrid-expanded"
    role="row"
    aria-level="2"
    aria-expanded="true"
    aria-selected="false"
    aria-setsize="5"
    aria-posinset="2"
    data-record-id="node-42"
    data-depth="1"
    tabindex="-1">

  <!-- Tree column cell -->
  <td class="x-grid-cell x-treegrid-cell" role="gridcell">
    <div class="x-grid-cell-inner x-treegrid-cell-inner" style="padding-left: 40px;">
      <!-- Indentation: rendered via padding-left OR spacer elements -->

      <!-- Expander: only on non-leaf nodes -->
      <span class="x-treegrid-expander x-treegrid-expander-expanded"
            role="button"
            aria-label="Collapse row"
            tabindex="-1"></span>
      <!-- For leaf nodes: -->
      <!-- <span class="x-treegrid-expander x-treegrid-expander-leaf"></span> -->

      <!-- Checkbox: only when checkable=true -->
      <span class="x-treegrid-checkbox x-treegrid-checkbox-checked"
            role="checkbox"
            aria-checked="true"
            tabindex="-1"></span>
      <!-- Indeterminate: class="x-treegrid-checkbox-indeterminate", aria-checked="mixed" -->

      <!-- Node icon -->
      <span class="x-treegrid-icon x-treegrid-icon-folder-open"></span>
      <!-- Or custom: class="x-treegrid-icon my-custom-icon" -->
      <!-- Or image: <img class="x-treegrid-icon" src="..." alt=""> -->

      <!-- Node text (or custom renderer output) -->
      <span class="x-treegrid-node-text">Documents</span>
    </div>
  </td>

  <!-- Additional grid columns -->
  <td class="x-grid-cell" role="gridcell">
    <div class="x-grid-cell-inner">42 KB</div>
  </td>
  <td class="x-grid-cell" role="gridcell">
    <div class="x-grid-cell-inner">2025-03-15</div>
  </td>
</tr>
```

### Tree Connector Lines (when `lines=true`)

When `lines=true`, instead of simple padding-left indentation, the tree column renders explicit line elements at each depth level:

```html
<div class="x-treegrid-cell-inner">
  <!-- Depth 0 line: vertical line if parent has more siblings after it -->
  <span class="x-treegrid-elbow x-treegrid-elbow-line"></span>
  <!-- Depth 1 line: L-shaped elbow if this is the last sibling -->
  <span class="x-treegrid-elbow x-treegrid-elbow-end-plus"></span>
  <!-- Expander is part of the last elbow element -->
  <span class="x-treegrid-icon ..."></span>
  <span class="x-treegrid-node-text">...</span>
</div>
```

Elbow types:
- `x-treegrid-elbow-line`: vertical line (│) — ancestor at this depth is NOT the last sibling
- `x-treegrid-elbow-empty`: blank spacer — ancestor at this depth IS the last sibling (no line needed)
- `x-treegrid-elbow-end`: L-shaped terminator (└) — this node is the last sibling and is a leaf
- `x-treegrid-elbow-end-plus`: L-shaped with expander (└─►) — last sibling, has children
- `x-treegrid-elbow-tee`: T-junction (├) — not the last sibling, is a leaf
- `x-treegrid-elbow-tee-plus`: T-junction with expander (├─►) — not last sibling, has children

**Algorithm to compute elbow types for a node at depth D:**
```
For each depth level i from 0 to D-1:
  ancestor = the node's ancestor at depth i
  if ancestor.get('isLast'):
    elbows[i] = 'empty'     // No line needed — this branch has ended
  else:
    elbows[i] = 'line'      // Vertical line continues — more siblings below

At depth D (the node's own depth):
  if node.get('isLast') and node.isLeaf():
    elbows[D] = 'end'
  else if node.get('isLast') and !node.isLeaf():
    elbows[D] = 'end-plus'
  else if !node.get('isLast') and node.isLeaf():
    elbows[D] = 'tee'
  else:
    elbows[D] = 'tee-plus'
```

### Virtual Scrolling for Trees

TreeGridView must support **virtual/buffered rendering** for large trees. When the tree has thousands of visible nodes (after expansion), rendering all rows causes performance degradation.

Strategy:
1. Use `TreeStore.getData()` (the `flatData`) as the canonical ordered list of visible nodes.
2. Maintain a scroll container with a spacer element whose height equals `flatData.length * rowHeight` to produce the correct scrollbar size.
3. Only render rows for the viewport range plus a buffer zone (e.g., 20 rows above and below).
4. On scroll, calculate which flatData indices are visible and render/recycle row elements.
5. When expand/collapse changes flatData, recalculate the spacer height and re-render the visible window.
6. Use `IntersectionObserver` on sentinel elements at the buffer boundaries to trigger re-renders, OR use a scroll event listener with `requestAnimationFrame` debouncing.

```typescript
// Virtual scrolling config
bufferSize: number = 20;               // Rows above/below viewport to pre-render
rowHeight: number = 28;                // Estimated row height (used for spacer calculation)
variableRowHeight: boolean = false;    // If true, measures actual row heights (slower but accurate)
```

### Methods

```typescript
// ─── Row Access ───
getNodeRow(record: NodeInterface): HTMLElement | null;
// Returns the <tr> element for the given node, or null if not currently rendered
// (collapsed ancestor, outside virtual scroll window, filtered out).

getRecord(rowElement: HTMLElement): NodeInterface | null;
// Returns the node for a given <tr> element.

getNodeByEvent(event: Event): NodeInterface | null;
// From a DOM event, finds the row and returns the corresponding node.

// ─── Rendering ───
refresh(): void;
// Full re-render: rebuilds all rendered rows from current flatData.

refreshNode(record: NodeInterface): void;
// Re-renders a single row without disturbing others.
// Used when a node's data changes (text, iconCls, checked, etc.).

onNodeExpand(parentNode: NodeInterface, childNodes: NodeInterface[]): void;
// Called when a node is expanded. Inserts child rows at the correct position
// in the DOM. If animate=true, performs a slide-down animation.
// Updates virtual scroll spacer height.
// Handles the case where the expanded node is outside the render window
// (adjusts spacer but doesn't create DOM elements).

onNodeCollapse(parentNode: NodeInterface): void;
// Called when a node is collapsed. Removes descendant rows from DOM.
// If animate=true, performs a slide-up animation before removing.
// Updates virtual scroll spacer height.

onNodeInsert(parent: NodeInterface, node: NodeInterface, refNode: NodeInterface | null): void;
// Called when a node is inserted into the tree. Adds a row if the node is
// in the visible range.

onNodeRemove(parent: NodeInterface, node: NodeInterface, index: number): void;
// Called when a node is removed from the tree. Removes the row from DOM.

onNodeUpdate(node: NodeInterface, modifiedFields: string[]): void;
// Called when a node's data changes. Re-renders the affected cells.
// Optimized: only updates cells whose columns map to the modified fields.

// ─── Focus ───
focusRow(record: NodeInterface): void;
// Sets focus to the row for the given record.
// Implements roving tabindex: sets tabindex="0" on the focused row,
// tabindex="-1" on all others.
// Scrolls row into view if necessary.
// Applies focusedCls.

getFocusedNode(): NodeInterface | null;
// Returns the currently focused node.

// ─── Animation ───
animateExpand(parentRow: HTMLElement, childRows: HTMLElement[]): Animation;
// Wraps child rows in a container, animates height from 0 to full.
// Uses Web Animations API: container.animate([{ height: '0px', overflow: 'hidden' }, { height: fullHeight + 'px' }], { duration, easing: 'ease-out' })
// Returns the Animation handle.

animateCollapse(parentRow: HTMLElement, childRows: HTMLElement[]): Animation;
// Reverse of animateExpand. Animates height to 0, then removes child rows from DOM.

// ─── Elbow Computation ───
computeElbows(node: NodeInterface): ElbowType[];
// Computes the array of elbow/line types for a node based on its depth
// and the isLast status of each ancestor. See algorithm above.
// Returns array of length depth+1.

// ─── Loading Indicator ───
showLoadingIndicator(node: NodeInterface): void;
// Adds a loading spinner or CSS class to the node's row while children are loading.

hideLoadingIndicator(node: NodeInterface): void;
// Removes the loading indicator.
```

### ARIA Attributes

Every row:
```
role="row"
aria-level="{depth + 1}"               (1-based depth)
aria-expanded="true|false"             (only on non-leaf nodes; omit on leaves)
aria-selected="true|false"
aria-setsize="{parent.childCount()}"   (number of siblings including self)
aria-posinset="{node.get('index') + 1}" (1-based position among siblings)
aria-checked="true|false|mixed"        (only when checkable; mixed = indeterminate)
data-record-id="{node.getId()}"
```

The overall grid container:
```
role="treegrid"                        (NOT "grid" — treegrid is the correct ARIA role)
aria-label="{title}"
aria-multiselectable="true|false"
aria-rowcount="{flatData.length}"
aria-colcount="{columns.length}"
```

Column headers:
```
role="columnheader"
aria-sort="ascending|descending|none"
```

### Tests for TreeGridView

`packages/ui/tests/treegrid/TreeGridView.test.ts`

1. **Rendering**:
  - Renders correct number of `<tr>` elements matching flatData.length
  - Each row has correct cell count matching column count
  - Tree column cell has correct indentation (padding-left = depth × indentSize)
  - Leaf node row: no expander icon, leaf icon class
  - Non-leaf node row: expander icon, folder icon class
  - Expanded node: expander has expanded class, aria-expanded="true"
  - Collapsed node: expander has collapsed class, aria-expanded="false"
  - rootVisible=false: root not rendered as a row
  - Empty tree: shows emptyText

2. **Elbow/lines**:
  - lines=true: correct elbow elements at each depth
  - Last child: elbow-end (└)
  - Middle child: elbow-tee (├)
  - Ancestor's depth position: line (│) or empty based on isLast
  - 4-level deep tree: verify complete elbow pattern
  - After add/remove sibling, elbows recalculate for affected rows

3. **Expand/collapse rendering**:
  - onNodeExpand: child rows inserted at correct DOM position (after parent row)
  - onNodeCollapse: descendant rows removed
  - Deep collapse: collapsing a grandparent removes children AND grandchildren
  - animate=true: animateExpand called with correct elements (mock WAAPI)

4. **Virtual scrolling**:
  - With 10,000 visible nodes, renders only ~viewport + 2×buffer rows
  - Scrolling renders new rows and removes old rows
  - getNodeRow returns null for non-rendered (off-screen) nodes
  - Expand/collapse adjusts spacer height correctly
  - Scroll position maintained when nodes above viewport are expanded/collapsed

5. **Incremental updates**:
  - onNodeUpdate: only modified cells re-rendered
  - Text change → tree column cell text updated
  - iconCls change → icon class updated
  - checked change → checkbox visual updated
  - Adding a node to an expanded parent → new row inserted

6. **Checkbox rendering**:
  - checkable=true: checkbox element in every tree column cell
  - Checked: checkbox-checked class, aria-checked="true"
  - Unchecked: no checked class, aria-checked="false"
  - Indeterminate: checkbox-indeterminate class, aria-checked="mixed"
  - onlyLeafCheckable: only leaf rows have checkboxes

7. **Focus and keyboard** (detailed in Part 3):
  - focusRow sets tabindex="0", adds focusedCls
  - Previous focused row loses tabindex, loses focusedCls

8. **Loading indicator**:
  - showLoadingIndicator adds loading class/spinner to row
  - hideLoadingIndicator removes it

9. **ARIA**:
  - Container has role="treegrid", aria-rowcount, aria-colcount
  - Each row has aria-level, aria-setsize, aria-posinset
  - Non-leaf rows have aria-expanded
  - Leaf rows do NOT have aria-expanded
  - Selected rows have aria-selected="true"
  - Checkable rows have aria-checked

---

## Part 3: TreeGridColumn

`packages/ui/src/treegrid/TreeGridColumn.ts`

TreeGridColumn **extends Column** to render the tree structure (indentation, expander, icon, checkbox, text) within a grid cell.

### Configuration

```typescript
interface TreeGridColumnConfig extends ColumnConfig {
  // Inherited from Column:
  // text, dataIndex, width, flex, minWidth, maxWidth, sortable, hideable, hidden,
  // align, renderer, editor, menuDisabled, resizable, draggable, tdCls, tdAttr

  indentSize?: number;
  // Pixels of indentation per depth level. Default: 20.

  iconProperty?: string;
  // Field on the node that provides an icon URL. Default: 'icon'.

  iconClsProperty?: string;
  // Field on the node that provides an icon CSS class. Default: 'iconCls'.

  displayProperty?: string;
  // Field on the node whose value is shown as the node text. Default: 'text'.
  // This overrides dataIndex for text display purposes.

  defaultFolderIcon?: string;
  // CSS class for the default folder icon. Default: 'x-treegrid-icon-folder'.

  defaultFolderOpenIcon?: string;
  // CSS class for an expanded folder icon. Default: 'x-treegrid-icon-folder-open'.

  defaultLeafIcon?: string;
  // CSS class for the default leaf icon. Default: 'x-treegrid-icon-leaf'.

  showIcons?: boolean;
  // Whether to render node icons at all. Default: true.

  showExpanders?: boolean;
  // Whether to render expand/collapse controls. Default: true.
  // Setting to false makes a flat-looking tree (indentation only, no interactivity).

  innerRenderer?: (value: unknown, metaData: CellMetaData, record: NodeInterface, rowIndex: number, colIndex: number, store: TreeStore, view: TreeGridView) => string;
  // Custom renderer for the text portion ONLY. The tree chrome
  // (indentation, expander, icon, checkbox) is always rendered by
  // TreeGridColumn; innerRenderer controls just the text/content area.
  // If not provided, the raw field value is used.

  innerTpl?: XTemplate;
  // Alternative to innerRenderer: an XTemplate for the text area.
}
```

### Rendering

TreeGridColumn overrides the Column's `renderer` method. The renderer produces the **complete cell HTML** including tree chrome:

```typescript
override renderer(
  value: unknown,
  metaData: CellMetaData,
  record: NodeInterface,
  rowIndex: number,
  colIndex: number,
  store: TreeStore,
  view: TreeGridView
): string {
  // 1. Compute indentation
  const depth = record.get('depth') as number;
  const indent = depth * this.indentSize;

  // 2. Compute elbows (if lines=true)
  let elbowsHtml = '';
  if (view.getTreeGrid().lines) {
    const elbows = view.computeElbows(record);
    elbowsHtml = elbows.map(type =>
      `<span class="x-treegrid-elbow x-treegrid-elbow-${type}"></span>`
    ).join('');
  }

  // 3. Expander
  let expanderHtml = '';
  if (this.showExpanders) {
    if (record.isLeaf()) {
      expanderHtml = '<span class="x-treegrid-expander x-treegrid-expander-leaf"></span>';
    } else {
      const expandedCls = record.isExpanded() ? 'x-treegrid-expander-expanded' : 'x-treegrid-expander-collapsed';
      const ariaLabel = record.isExpanded() ? 'Collapse row' : 'Expand row';
      expanderHtml = `<span class="x-treegrid-expander ${expandedCls}" role="button" aria-label="${ariaLabel}" tabindex="-1"></span>`;
    }
  }

  // 4. Checkbox (if checkable)
  let checkboxHtml = '';
  if (view.getTreeGrid().checkable) {
    const checked = record.get('checked');
    if (checked === true) {
      checkboxHtml = '<span class="x-treegrid-checkbox x-treegrid-checkbox-checked" role="checkbox" aria-checked="true" tabindex="-1"></span>';
    } else if (checked === false) {
      checkboxHtml = '<span class="x-treegrid-checkbox" role="checkbox" aria-checked="false" tabindex="-1"></span>';
    } else {
      checkboxHtml = '<span class="x-treegrid-checkbox x-treegrid-checkbox-indeterminate" role="checkbox" aria-checked="mixed" tabindex="-1"></span>';
    }
  }

  // 5. Icon
  let iconHtml = '';
  if (this.showIcons) {
    const customIconCls = record.get(this.iconClsProperty);
    const customIcon = record.get(this.iconProperty);
    if (customIcon) {
      iconHtml = `<img class="x-treegrid-icon" src="${customIcon}" alt="" />`;
    } else if (customIconCls) {
      iconHtml = `<span class="x-treegrid-icon ${customIconCls}"></span>`;
    } else if (record.isLeaf()) {
      iconHtml = `<span class="x-treegrid-icon ${this.defaultLeafIcon}"></span>`;
    } else if (record.isExpanded()) {
      iconHtml = `<span class="x-treegrid-icon ${this.defaultFolderOpenIcon}"></span>`;
    } else {
      iconHtml = `<span class="x-treegrid-icon ${this.defaultFolderIcon}"></span>`;
    }
  }

  // 6. Text content
  let textContent: string;
  if (this.innerRenderer) {
    textContent = this.innerRenderer(value, metaData, record, rowIndex, colIndex, store, view);
  } else if (this.innerTpl) {
    textContent = this.innerTpl.apply(record.getData());
  } else {
    textContent = value != null ? String(value) : '';
  }
  const textHtml = `<span class="x-treegrid-node-text">${textContent}</span>`;

  // 7. Assemble
  const paddingStyle = view.getTreeGrid().lines ? '' : `padding-left: ${indent}px;`;
  return `<div class="x-treegrid-cell-inner" style="${paddingStyle}">${elbowsHtml}${expanderHtml}${checkboxHtml}${iconHtml}${textHtml}</div>`;
}
```

### Column Menu Integration

TreeGridColumn adds tree-specific items to the column header context menu:

- **Expand All**: Expands all nodes at every level
- **Collapse All**: Collapses all nodes
- **---** (separator)
- Standard column menu items: Sort Ascending, Sort Descending, Columns submenu (hide/show)

### Sorting

Sorting by the tree column sorts children within each parent independently (hierarchical sort), NOT flat-sorting the entire dataset. This is critical: a tree sort must preserve the hierarchy.

```typescript
override doSort(direction: 'ASC' | 'DESC'): void {
  // Delegates to TreeStore.sort() with the tree column's dataIndex.
  // TreeStore handles recursive per-parent sorting.
  // folderSort is applied by the TreeStore.
}
```

### Tests for TreeGridColumn

`packages/ui/tests/treegrid/TreeGridColumn.test.ts`

1. **Renderer output**:
  - Root node (depth 0): no indentation, expander, folder icon, text
  - Depth 2 node: 40px indentation (2 × 20), expander, icon, text
  - Leaf node: no expander (or leaf-style spacer), leaf icon
  - Custom iconCls: node's iconCls used instead of default
  - Custom icon URL: `<img>` element rendered instead of `<span>`
  - Checked checkbox: correct CSS class and aria-checked="true"
  - Indeterminate checkbox: correct CSS class and aria-checked="mixed"
  - No checkbox when checkable=false

2. **innerRenderer**:
  - Custom innerRenderer called with correct arguments
  - innerRenderer output replaces default text
  - innerRenderer receives NodeInterface as record

3. **innerTpl**:
  - XTemplate applied with record data
  - Template output rendered in text area

4. **Lines mode**:
  - lines=true: elbow spans rendered instead of padding
  - Correct elbow types for various tree positions
  - No indentation padding when lines=true (elbows provide indentation)

5. **Column menu**:
  - "Expand All" menu item calls treeGrid.expandAll()
  - "Collapse All" menu item calls treeGrid.collapseAll()
  - Standard column menu items still present

6. **Sorting**:
  - Sort by tree column sorts hierarchically (children within parents)
  - folderSort applied correctly
  - Sort direction indicator in header

7. **Configuration**:
  - Custom indentSize changes indentation
  - showIcons=false: no icon elements
  - showExpanders=false: no expander elements
  - Custom defaultFolderIcon, defaultLeafIcon

---

## Part 4: TreeGridDragDrop

`packages/ui/src/treegrid/TreeGridDragDrop.ts`

A Plugin for TreeGrid that enables drag-and-drop reparenting and reordering of tree nodes within the grid view.

### Configuration

```typescript
interface TreeGridDragDropConfig {
  enableDrag?: boolean;                  // Default: true (when plugin is added)
  enableDrop?: boolean;                  // Default: true
  ddGroup?: string;                      // Default: 'TreeGridDD'
  appendOnly?: boolean;                  // Only 'append' drops (no insert-between). Default: false
  sortOnDrop?: boolean;                  // Sort siblings after drop. Default: false
  allowContainerDrops?: boolean;         // Drop on empty tree body → append to root. Default: false
  expandDelay?: number;                  // ms before auto-expanding hovered node. Default: 500
  allowParentInserts?: boolean;          // Allow insert at parent level. Default: true
  displayField?: string;                 // Field shown in drag ghost. Default: 'text'
  dragText?: string;                     // Template for ghost text. Default: '{0} selected node(s)'
  copy?: boolean;                        // Default action is copy. Default: false
  allowCopy?: boolean;                   // Ctrl+drag copies. Default: true
  dropHighlightCls?: string;            // CSS class for drop target highlight. Default: 'x-treegrid-drop-highlight'
  dropIndicatorCls?: string;            // CSS class for the insertion line. Default: 'x-treegrid-drop-indicator'
  nodeHighlightOnDrop?: boolean;         // Flash the dropped node. Default: true
  nodeHighlightColor?: string;           // Highlight color. Default: theme accent
  containerScrollOnDrag?: boolean;       // Auto-scroll when dragging near edges. Default: true
  containerScrollThreshold?: number;     // Pixels from edge to trigger scroll. Default: 40
  containerScrollSpeed?: number;         // Scroll px per frame. Default: 10
}
```

### Internal Behavior

#### Drag Source

- On `pointerdown` + `pointermove` beyond threshold on a tree row:
  - Check `node.get('allowDrag')` — if false, abort drag.
  - If the dragged node is selected and multi-selection is active, drag ALL selected nodes.
  - Create a `DragData` payload:
    ```typescript
    {
      records: NodeInterface[],       // The dragged nodes
      source: TreeGrid,               // The source TreeGrid
      copy: boolean,                  // Whether this is a copy (Ctrl held or config.copy)
      displayText: string             // e.g., "3 selected node(s)" or the single node's text
    }
    ```
  - Create a drag ghost element showing `displayText`.
  - Attach `pointermove` handler for drag tracking.
  - Root nodes CANNOT be dragged.

#### Drop Target

- On `pointermove` over the grid body during drag:
  - Determine which row the cursor is over (using `elementFromPoint` or hit testing).
  - Determine drop position based on cursor Y relative to the row:
    - **Top 25% of row height**: `'before'` — insert above this node (as sibling)
    - **Middle 50%**: `'append'` — add as child of this node
    - **Bottom 25%**: `'after'` — insert below this node (as sibling)
  - Adjustments:
    - If `appendOnly`: always `'append'`
    - If target is a leaf and position is `'append'`: change to `'after'` (can't append to leaf unless converting to branch)
    - If target is the root and position is `'before'`: reject (can't insert before root)
  - Validation:
    - `node.get('allowDrop')` must be true on the target
    - **Circular reference check**: the target must NOT be a descendant of ANY dragged node. Check using `draggedNode.contains(targetNode)` for each dragged node.
    - The dragged node must NOT be the target node itself.
    - Fire `'nodedragover'` event on TreeGrid — if any listener returns false, reject.
  - Visual feedback:
    - `'before'`/`'after'`: show a horizontal line indicator between rows (absolutely positioned `<div>` with `dropIndicatorCls`)
    - `'append'`: highlight the target row with `dropHighlightCls`
    - Remove indicators when cursor moves to a different row or leaves the grid
  - Auto-expand:
    - If hovering over a collapsed, non-leaf node for `expandDelay` ms, auto-expand it.
    - If the cursor moves away before the timer fires, cancel the timer.
  - Auto-scroll:
    - If cursor is within `containerScrollThreshold` px of the top/bottom edge of the scrollable grid body, auto-scroll in that direction at `containerScrollSpeed`.
    - Stop scrolling when cursor moves away from the edge or drag ends.

#### Drop Execution

When `pointerup` occurs over a valid drop position:

1. Fire `'beforedrop'` event. If any listener returns false, abort (revert ghost).
2. Determine if copy: `event.ctrlKey && allowCopy` → set `dragData.copy = true`.
3. If **move** (not copy):
  - Remove each dragged node from its current parent.
  - Insert at new position:
    - `'before'`: `targetNode.parentNode.insertBefore(draggedNode, targetNode)`
    - `'after'`: Insert after targetNode in parent's children
    - `'append'`: `targetNode.appendChild(draggedNode)`
  - TreeStore handles all pointer/index updates.
4. If **copy**:
  - Create deep copies of each dragged node (with new IDs).
  - Insert copies at the target position.
  - Original nodes remain in place.
5. If `sortOnDrop`: sort the target parent's children.
6. Fire `'drop'` event.
7. If `nodeHighlightOnDrop`: briefly highlight the dropped row(s) with a flash animation.
8. Clean up: remove ghost, remove all indicators, cancel any pending auto-expand timers.

#### Multi-Node Drag

When multiple nodes are dragged (multi-selection):
- All selected nodes are moved/copied together.
- They are inserted in their original relative order.
- For `'before'` or `'after'`: inserted as sequential siblings.
- For `'append'`: appended as children in their original order.
- If ANY dragged node is an ancestor of the target, the entire drop is rejected.
- If a dragged node is a descendant of another dragged node, skip it (the ancestor's subtree already includes it).

### Tests for TreeGridDragDrop

`packages/ui/tests/treegrid/TreeGridDragDrop.test.ts`

All tests use synthetic PointerEvent dispatched to DOM elements in jsdom.

1. **Drag initiation**:
  - pointerdown + pointermove beyond threshold → drag starts
  - Ghost element created with correct text
  - node.allowDrag=false → drag does not start
  - Root node → drag does not start
  - Multi-select: all selected nodes in DragData.records

2. **Drop position calculation**:
  - Hover top 25% → 'before' indicator (horizontal line above row)
  - Hover middle 50% → 'append' indicator (row highlight)
  - Hover bottom 25% → 'after' indicator (horizontal line below row)
  - appendOnly → always 'append' regardless of position
  - Leaf target → no 'append', only 'before'/'after'

3. **Validation**:
  - Drop onto descendant of dragged node → rejected, no indicators shown
  - Drop onto dragged node itself → rejected
  - node.allowDrop=false → rejected
  - nodedragover event returning false → rejected
  - beforedrop event returning false → drop aborted, ghost reverts

4. **Move execution**:
  - 'before': node inserted as sibling above target
  - 'after': node inserted as sibling below target
  - 'append': node appended as child of target
  - Old parent's children updated correctly
  - New parent's children updated correctly
  - All sibling pointers, indices, depths correct after move
  - TreeStore events fire: noderemove (isMove=true), nodeinsert or nodeappend, nodemove
  - Grid view re-renders affected rows
  - drop event fires with correct arguments

5. **Copy execution**:
  - Ctrl+pointerup → copy mode
  - Original node stays in place
  - New node has new ID, same data
  - If deep subtree, all descendants copied with new IDs

6. **Multi-node drag**:
  - 3 selected nodes dragged together
  - Inserted in original relative order
  - Ancestor + descendant selected: descendant skipped (covered by ancestor)
  - All 3 nodes under new parent after drop
  - 'before' inserts all 3 above target in order

7. **Auto-expand**:
  - Hover over collapsed node for expandDelay ms → node expands
  - Move away before timer → no expand
  - Expand reveals more drop targets

8. **Auto-scroll**:
  - Drag near bottom edge → grid scrolls down
  - Drag near top edge → grid scrolls up
  - Stop scrolling when cursor leaves edge zone

9. **Highlight on drop**:
  - nodeHighlightOnDrop=true → dropped row flashes briefly
  - Highlight uses Web Animations API (mock .animate())

10. **Cross-TreeGrid drag**:
  - Two TreeGrids with same ddGroup → drag between them works
  - Different ddGroup → drop rejected
  - Node removed from source tree, added to target tree

11. **sortOnDrop**:
  - After drop, target parent's children re-sorted

12. **Edge cases**:
  - Drop on empty tree body (allowContainerDrops=true) → appends to root
  - Drag and release outside any valid target → ghost reverts, no changes
  - Drag during async load (node expanding) → drag paused or handled gracefully

---

## Part 5: TreeGridCellEditing

`packages/ui/src/treegrid/TreeGridCellEditing.ts`

Extends GridCellEditingPlugin for tree-aware inline cell editing.

### Differences from Standard Cell Editing

1. **Tree column editing**: Clicking the text area of the tree column starts editing. The editor (typically a TextField) replaces ONLY the text content, NOT the tree chrome (indentation, expander, icon, checkbox remain visible and interactive).
2. **Expand/collapse during edit**: If the user clicks an expander while editing, the edit should complete (not cancel), then the expand/collapse executes.
3. **Adding nodes via editing**: An optional "add child" action can be triggered (e.g., pressing a key shortcut in the editor) which appends a new phantom child node and immediately starts editing it.
4. **Tab navigation**: Tab moves to the next editable cell. In a TreeGrid, "next cell" respects the flat visible order (expanding a node may change the tab order). Shift+Tab moves backward.
5. **Read-only tree chrome**: The editor ONLY covers the text area of the tree column. The indentation, expander, checkbox, and icon are NOT part of the editable area.
6. **Editor sizing**: In the tree column, the editor width is `cellWidth - indent - chromeWidth` so it doesn't overlap tree chrome.
7. **Depth-aware positioning**: The editor's left offset accounts for the tree indentation so it aligns with the text content.

### Configuration

```typescript
interface TreeGridCellEditingConfig extends GridCellEditingConfig {
  editableTreeColumn?: boolean;          // Allow editing the tree column text. Default: true
  addChildOnInsert?: boolean;            // Pressing Insert key adds a child and edits it. Default: false
  addSiblingOnEnter?: boolean;           // Pressing Enter after edit adds sibling below. Default: false
}
```

### Tests

`packages/ui/tests/treegrid/TreeGridCellEditing.test.ts`

1. Click tree column text → editor appears over text area only
2. Editor positioned correctly (accounts for indentation)
3. Editor width fits between tree chrome and cell right edge
4. Tab from tree column editor → moves to next column's editor
5. Tab from last column → moves to tree column of next visible row
6. Complete edit (Enter/Tab) → value saved to record
7. Cancel edit (Escape) → value reverted
8. Click expander during edit → edit completes, then expand happens
9. Click checkbox during edit → edit completes, then check toggles
10. Non-tree column editing works identically to standard grid
11. Editor on different depth nodes has correct left offset
12. Editing a leaf node vs folder node both work
13. addChildOnInsert: Insert key appends child and starts editing
14. validateedit event fires and can cancel

---

## Part 6: TreeGridRowEditing

`packages/ui/src/treegrid/TreeGridRowEditing.ts`

Extends GridRowEditingPlugin for tree-aware row-level editing.

### Differences from Standard Row Editing

1. The row editor bar spans all columns but in the tree column, the editor starts AFTER the tree chrome (same offset logic as CellEditing).
2. The tree chrome remains visible and interactive during row editing.
3. Update/Cancel buttons are positioned correctly even at deep indentation levels.
4. Expanding/collapsing other rows during a row edit does NOT cancel the edit but may shift the editor position if rows above are inserted/removed.

### Tests

`packages/ui/tests/treegrid/TreeGridRowEditing.test.ts`

1. Row editor appears with fields for each editable column
2. Tree column field positioned after tree chrome
3. Update saves all fields, Cancel reverts all
4. Expanding another node during edit → editor stays attached to correct row
5. Row editor buttons visible and functional
6. Tab between fields within the row editor

---

## Part 7: TreeGridClipboard

`packages/ui/src/treegrid/TreeGridClipboard.ts`

Extends GridClipboardPlugin for tree-aware copy/paste.

### Behavior

1. **Copy**: Copies selected rows as TSV. The tree column includes the node text (without tree chrome). Indentation level can optionally be represented with leading tabs or spaces in the tree column.
2. **Paste**: Pasting rows into a TreeGrid inserts them as children of the selected node (or as siblings). Indentation in pasted data (leading tabs) can optionally be interpreted as hierarchy.
3. **Copy with hierarchy**: An optional mode serializes the subtree as indented text or nested JSON.

### Configuration

```typescript
interface TreeGridClipboardConfig extends GridClipboardConfig {
  copyHierarchy?: boolean;              // Include indentation in copy. Default: false
  pasteAsChildren?: boolean;            // Paste as children of selected node. Default: true
  pasteIndentLevel?: boolean;           // Interpret tab indentation as hierarchy. Default: false
}
```

### Tests

`packages/ui/tests/treegrid/TreeGridClipboard.test.ts`

1. Copy single node → clipboard has TSV with all column values
2. Copy multiple nodes → multi-line TSV
3. copyHierarchy: tree column value indented with tabs per depth
4. Paste TSV → new nodes created as children of selection
5. pasteAsChildren=false → new nodes inserted as siblings
6. pasteIndentLevel: leading tabs create parent/child structure
7. Paste handles missing values gracefully

---

## Part 8: TreeGridSummary

`packages/ui/src/treegrid/TreeGridSummary.ts`

A feature that adds a summary row at the bottom of the tree grid (or at specified positions) that aggregates values across visible nodes.

### Behavior

- Extends GridSummaryFeature
- Summary calculations operate on `flatData` (only visible/expanded nodes), NOT the entire tree
- Alternatively, `includeCollapsed: true` calculates across ALL nodes regardless of expand state
- Each column can have a `summaryType` and `summaryRenderer`
- Tree column summary shows "Total" or a custom label

### Configuration

```typescript
interface TreeGridSummaryConfig {
  position?: 'bottom' | 'top';          // Default: 'bottom'
  includeCollapsed?: boolean;            // Include collapsed nodes in calculation. Default: false
  treeColumnSummaryText?: string;        // Text shown in tree column of summary row. Default: 'Summary'
}
```

### Tests

`packages/ui/tests/treegrid/TreeGridSummary.test.ts`

1. Summary row renders at bottom with correct aggregated values
2. summaryType 'sum': adds up all visible nodes' column values
3. summaryType 'count': counts visible nodes
4. summaryType 'average': averages visible nodes
5. Expand/collapse → summary recalculates (only visible nodes)
6. includeCollapsed=true → summary includes hidden nodes' values
7. Custom summaryRenderer formats output
8. Tree column shows summary label text

---

## Part 9: TreeGridGroupingSummary

`packages/ui/src/treegrid/TreeGridGroupingSummary.ts`

A feature that adds per-parent summary rows: a summary row at the bottom of each parent node's children showing aggregated values for that subtree.

### Behavior

- After each expanded parent's last child, insert a summary row
- Summary aggregates the direct children's values (or optionally all descendants)
- Summary row has the same indentation as the children
- Only shown for expanded parents
- Can be toggled on/off

### Configuration

```typescript
interface TreeGridGroupingSummaryConfig {
  includeDescendants?: boolean;          // Aggregate all descendants vs direct children only. Default: false
  summaryRowCls?: string;               // CSS class for summary rows. Default: 'x-treegrid-summary-row'
  showSummaryFor?: 'all' | 'nonleaf';   // Show summary for all parents or only non-leaf. Default: 'nonleaf'
}
```

### Tests

`packages/ui/tests/treegrid/TreeGridGroupingSummary.test.ts`

1. Each expanded parent has a summary row after its last child
2. Summary row at correct depth indentation
3. Aggregated values calculated from direct children
4. includeDescendants: aggregated from all descendants
5. Collapsing parent removes its summary row
6. Expanding parent shows summary row
7. Adding/removing child recalculates parent summary
8. Summary rows are not selectable
9. Summary rows are not draggable

---

## Part 10: TreeGridRowExpander

`packages/ui/src/treegrid/TreeGridRowExpander.ts`

A plugin that adds an expand/collapse toggle on each row to reveal a **detail view** (distinct from tree expand/collapse). This is for showing additional information about a node in an expanded body row below the data row.

### Clarification

This is NOT tree expand/collapse. This is the Grid's RowExpander feature applied to a TreeGrid. Each tree node row can independently show a detail pane beneath it, rendered from a template or component. Tree expand/collapse and row-body expand are independent concepts that coexist.

### Differences from Grid RowExpander

- The expand/collapse button column is an ADDITIONAL column (not the tree column's expander)
- The expanded body row spans all columns and sits between the node row and its tree-children rows (if any)
- Tree expand/collapse operates on the tree structure; row-body expand operates on the detail view
- A node can be tree-expanded AND row-body-expanded simultaneously
- The row body indentation matches the node's depth for visual consistency

### Configuration

```typescript
interface TreeGridRowExpanderConfig {
  rowBodyTpl?: XTemplate | string;       // Template for expanded body
  rowBodyComponent?: typeof Component;   // Component to render in expanded body
  expandOnDblClick?: boolean;            // Double-click toggles body expand. Default: false
  singleRowExpand?: boolean;             // Only one row body expanded at a time. Default: false
  bodyIndent?: boolean;                  // Indent body to match tree depth. Default: true
}
```

### Tests

`packages/ui/tests/treegrid/TreeGridRowExpander.test.ts`

1. Expander column rendered as extra column (separate from tree column)
2. Click expander → body row appears below data row
3. Body row spans all columns
4. Body row contains template output with correct record data
5. Body row appears ABOVE tree children rows (between parent row and first child)
6. Tree expand and row-body expand are independent
7. Node can be tree-expanded + row-body-expanded simultaneously
8. singleRowExpand: opening one body closes another
9. bodyIndent: body content indented to match tree depth
10. Collapse tree parent → body row hidden along with children

---

## Part 11: TreeGridFilterPlugin

`packages/ui/src/treegrid/TreeGridFilterPlugin.ts`

Adds column-header filter fields/menus to the TreeGrid with tree-aware filtering.

### Behavior

- Extends standard grid column filter plugin
- When a filter is applied, delegates to `TreeStore.filter()` which uses the configured `filterer` strategy ('bottomup' or 'topdown')
- **bottomup** (default): matching nodes AND all their ancestors are visible (so you always see the path to a match)
- **topdown**: only matching nodes whose parents also match are visible
- Column filter menus show the same UI as grid filters (text input, number range, date range, list selection)
- Clearing all filters restores the full tree

### Configuration

```typescript
interface TreeGridFilterPluginConfig {
  filterer?: 'bottomup' | 'topdown';     // Override TreeStore's filterer. Default: use store's setting
  showFilterRow?: boolean;               // Show a filter input row below headers. Default: false
  menuFilter?: boolean;                  // Show filter in column header menu. Default: true
}
```

### Tests

`packages/ui/tests/treegrid/TreeGridFilterPlugin.test.ts`

1. Typing in filter field filters tree (bottomup: ancestors visible)
2. topdown mode: only matching nodes visible, children hidden
3. Filter by numeric column: range filter
4. Filter by date column: date range
5. Multiple column filters: additive (AND)
6. Clear filter restores full tree
7. Filter + expand interaction: expanding node respects filter
8. Filter result count matches visible nodes
9. Column menu includes filter option

---

## Part 12: TreeGridStateMixin

`packages/ui/src/treegrid/TreeGridStateMixin.ts`

Mixin for TreeGrid that persists and restores component state.

### State Properties Saved

```typescript
interface TreeGridState {
  columns: {
    id: string;
    width?: number;
    flex?: number;
    hidden?: boolean;
    sortDirection?: 'ASC' | 'DESC' | null;
    sortIndex?: number;
    locked?: boolean;
  }[];
  columnOrder: string[];                  // Column IDs in display order
  expandedNodes: (string | number)[];     // IDs of expanded nodes
  checkedNodes?: (string | number)[];     // IDs of checked nodes (if checkable)
  selectedNodes?: (string | number)[];    // IDs of selected nodes
  scrollPosition?: { top: number; left: number };
  filters?: { column: string; value: unknown; operator: string }[];
  sorters?: { property: string; direction: 'ASC' | 'DESC' }[];
}
```

### Storage

- Uses `StateManager` which persists to `localStorage` by default
- State key: `treeGrid.stateId` config (required for state persistence)
- State saved on: column resize, column reorder, column hide/show, sort, expand, collapse, check, filter
- State restored on: component construction (before first render)
- Debounced save: state changes within 100ms are batched into a single save

### Methods

```typescript
getState(): TreeGridState;
applyState(state: TreeGridState): void;
saveState(): void;
clearState(): void;
```

### Tests

`packages/ui/tests/treegrid/TreeGridState.test.ts`

1. Column widths saved and restored on re-creation
2. Column order saved and restored
3. Hidden columns saved and restored
4. Sort direction saved and restored
5. Expanded nodes saved and restored (nodes re-expanded on load)
6. Checked nodes saved and restored
7. Scroll position saved and restored
8. Filters saved and restored
9. State cleared: next creation uses defaults
10. State debounced: rapid changes produce one save call
11. Async node expansion on restore (nodes loaded from proxy)

---

## Part 13: TreeGridLockable

`packages/ui/src/treegrid/TreeGridLockable.ts`

Mixin or plugin that enables locked (frozen) columns in a TreeGrid.

### Behavior

- When any column has `locked: true`, the TreeGrid splits into two synchronized panels:
  - **Locked panel** (left): contains locked columns including the tree column. Does NOT scroll horizontally.
  - **Normal panel** (right): contains unlocked columns. Scrolls horizontally independently.
- Both panels share the same TreeStore.
- **Vertical scroll is synchronized**: scrolling one panel scrolls the other.
- Both panels render from the same flatData.
- Expand/collapse in the locked panel affects both panels (same TreeStore).
- A draggable splitter between the panels allows resizing the locked area.
- Columns can be locked/unlocked via the column header menu ("Lock" / "Unlock" option).
- The tree column is ALWAYS in the locked panel when lockable is active (it cannot be moved to the normal panel).

### Configuration

```typescript
interface TreeGridLockableConfig {
  lockable?: boolean;                    // Enable locked columns. Default: auto (true if any column has locked=true)
  lockedGridConfig?: Partial<GridConfig>; // Config overrides for the locked panel
  normalGridConfig?: Partial<GridConfig>; // Config overrides for the normal panel
  syncScroll?: boolean;                  // Synchronize vertical scroll. Default: true
}
```

### Tests

`packages/ui/tests/treegrid/TreeGridLockable.test.ts`

1. locked=true on tree column + 1 other → two panels rendered
2. Locked panel doesn't scroll horizontally
3. Normal panel scrolls horizontally
4. Vertical scroll synchronized: scroll left panel → right panel scrolls too
5. Expand node in locked panel → rows appear in both panels
6. Collapse node → rows removed from both panels
7. Lock column via menu → column moves to locked panel
8. Unlock column → column moves to normal panel
9. Tree column always stays in locked panel
10. Splitter between panels is draggable
11. Selection synchronized across both panels
12. Editing across both panels works (editor in correct panel)

---

## Part 14: TreeGridSelectionModel

`packages/ui/src/treegrid/TreeGridSelectionModel.ts`

Selection model aware of TreeGrid's hierarchical structure.

### Extends

`TreeSelectionModel` (which extends `RowSelectionModel`).

### Additional Behavior

- **Cell selection mode**: If configured for cell selection, navigates cells across columns AND rows in the tree's visible order.
- **Range selection**: Shift+click selects a range in flatData order. The range includes all visible nodes between the anchor and the clicked node, regardless of tree depth.
- **Deselect on collapse**: When a node with selected descendants is collapsed, descendants remain selected but are hidden. Optionally (`deselectOnCollapse: true`), they are auto-deselected.
- **Select children**: A helper method `selectChildren(node, deep?)` selects all children (and optionally descendants) of a node.

### Configuration

```typescript
interface TreeGridSelectionModelConfig extends SelectionModelConfig {
  mode?: 'SINGLE' | 'SIMPLE' | 'MULTI';  // Default: 'SINGLE'
  deselectOnCollapse?: boolean;           // Deselect hidden descendants on collapse. Default: false
  pruneRemoved?: boolean;                 // Auto-deselect removed nodes. Default: true
  checkboxSelect?: boolean;               // Add checkbox column for selection. Default: false
  // Note: this is a SELECTION checkbox, separate from the TREE checkbox.
  // If both checkable and checkboxSelect are true, there are two checkbox columns.
}
```

### Methods

```typescript
selectChildren(node: NodeInterface, deep?: boolean, keepExisting?: boolean, suppressEvent?: boolean): void;
// Selects all children of the given node. If deep=true, selects all descendants.

deselectChildren(node: NodeInterface, deep?: boolean, suppressEvent?: boolean): void;
```

### Tests

`packages/ui/tests/treegrid/TreeGridSelectionModel.test.ts`

1. SINGLE mode: click one row, previous deselected
2. MULTI mode: Ctrl+click adds to selection
3. MULTI mode: Shift+click selects range in visible order
4. Range selection across different tree depths works correctly
5. deselectOnCollapse: collapsing deselects hidden descendants
6. deselectOnCollapse=false: collapsed descendants stay selected
7. pruneRemoved: removing node deselects it
8. selectChildren: selects direct children
9. selectChildren deep: selects all descendants
10. checkboxSelect: selection checkbox column rendered (separate from tree checkbox)
11. Keyboard selection: Shift+Arrow extends selection

---

## Part 15: TreeGridExporter

`packages/ui/src/treegrid/TreeGridExporter.ts`

Exports TreeGrid data to various formats, preserving hierarchy.

### Methods

```typescript
static exportToCsv(treeGrid: TreeGrid, options?: ExportOptions): string;
// Exports to CSV. Hierarchy represented by indentation in tree column
// (configurable: leading spaces, tabs, or a "level" column).

static exportToJson(treeGrid: TreeGrid, options?: ExportOptions): string;
// Exports to nested JSON preserving tree structure.
// Each node has a "children" array.

static exportToTsv(treeGrid: TreeGrid, options?: ExportOptions): string;
// Tab-separated values.

static exportToXlsx(treeGrid: TreeGrid, options?: ExportOptions): ArrayBuffer;
// Exports to XLSX with outline/grouping levels matching tree depth.
// Uses tree depth as Excel's row outline level for native expand/collapse.
// Requires a lightweight XLSX writer (or delegates to external lib).

static download(content: string | ArrayBuffer, filename: string, mimeType: string): void;
// Triggers browser download.
```

### Export Options

```typescript
interface ExportOptions {
  includeHeaders?: boolean;              // Include column headers. Default: true
  includeHidden?: boolean;               // Include hidden columns. Default: false
  expandedOnly?: boolean;                // Only export visible (expanded) nodes. Default: false
  allNodes?: boolean;                    // Export all nodes regardless of expand state. Default: true
  indentCharacter?: string;              // Character for tree column indentation. Default: '  ' (2 spaces)
  indentMultiplier?: number;             // Repeats per depth level. Default: 1
  columns?: string[];                    // Specific column dataIndex list to export. Default: all visible
  filename?: string;                     // Suggested filename for download
}
```

### Tests

`packages/ui/tests/treegrid/TreeGridExporter.test.ts`

1. CSV export: correct header row, data rows with all columns
2. CSV tree column: indentation with spaces representing depth
3. JSON export: nested structure with children arrays
4. JSON round-trip: export → import into new TreeStore → same structure
5. TSV export: tab-separated, tree column indented
6. expandedOnly: only visible nodes exported
7. allNodes: all nodes exported regardless of expand state
8. includeHeaders=false: no header row
9. Custom columns list: only specified columns exported
10. XLSX export produces valid buffer (verify header bytes)
11. download triggers browser download (mock URL.createObjectURL)

---

## Part 16: Keyboard Navigation (detailed specification)

This section specifies the COMPLETE keyboard behavior for TreeGrid. Implement this in `TreeGridView` and `TreeGrid`, not as a separate file.

### Focus Model

The TreeGrid uses **roving tabindex** within a `role="treegrid"` container:
- The entire grid is reachable via Tab from outside.
- Once inside, one cell has `tabindex="0"` (the focused cell). All other cells have `tabindex="-1"`.
- Arrow keys move focus between cells.
- The initial focus cell is the tree column cell of the first visible row.

### Key Bindings

| Key | Context | Action |
|-----|---------|--------|
| `Tab` | From outside grid | Focus enters the grid at the last-focused cell (or first cell) |
| `Tab` | Inside grid | Focus leaves the grid to the next tabbable element on the page |
| `Shift+Tab` | Inside grid | Focus leaves backward |
| `ArrowDown` | Any cell | Move focus to the same column in the next visible row |
| `ArrowUp` | Any cell | Move focus to the same column in the previous visible row |
| `ArrowRight` | Tree column cell, collapsed node | Expand the node |
| `ArrowRight` | Tree column cell, expanded node | Move focus to first child's tree column cell |
| `ArrowRight` | Tree column cell, leaf node | Move focus to the next column cell in the same row |
| `ArrowRight` | Non-tree column cell | Move focus to the next column cell (right) |
| `ArrowLeft` | Tree column cell, expanded node | Collapse the node |
| `ArrowLeft` | Tree column cell, collapsed or leaf node | Move focus to the parent node's tree column cell |
| `ArrowLeft` | Non-tree column cell | Move focus to the previous column cell (left) |
| `ArrowLeft` | First column (tree column), root level | No action |
| `Home` | Any cell | Move focus to the tree column cell of the first visible row |
| `End` | Any cell | Move focus to the tree column cell of the last visible row |
| `Ctrl+Home` | Any cell | Move focus to the first cell (tree column, first row) |
| `Ctrl+End` | Any cell | Move focus to the last cell (last column, last row) |
| `PageUp` | Any cell | Move focus up by one viewport height of rows |
| `PageDown` | Any cell | Move focus down by one viewport height of rows |
| `Enter` | Tree column cell | Select the node. If editable: start editing. |
| `Enter` | Non-tree column cell, editable | Start cell editing |
| `Space` | Tree column cell, checkable | Toggle the checkbox |
| `Space` | Any cell, row selection | Toggle row selection |
| `F2` | Any editable cell | Start cell editing |
| `Escape` | During edit | Cancel editing |
| `Escape` | Not editing | Clear selection (optional) |
| `*` (asterisk/numpad) | Tree column cell | Expand all siblings of the focused node |
| `Ctrl+A` | Any cell, MULTI mode | Select all visible rows |
| `Shift+ArrowDown` | Any cell, MULTI mode | Extend selection down one row |
| `Shift+ArrowUp` | Any cell, MULTI mode | Extend selection up one row |
| `Shift+Space` | Any cell, MULTI mode | Select range from anchor to focused row |
| `Ctrl+Space` | Any cell, MULTI mode | Toggle focused row selection without moving anchor |
| `Ctrl+C` | Any cell | Copy selected data to clipboard |
| `Ctrl+V` | Any cell | Paste from clipboard |
| `Delete` | Tree column cell (if configured) | Delete the focused node (fires an event, does not auto-delete) |
| `Insert` | Tree column cell (if configured) | Add a child node (fires an event) |

### Tests for Accessibility & Keyboard

`packages/ui/tests/treegrid/TreeGridAccessibility.test.ts`

1. Container has `role="treegrid"`
2. All rows have `role="row"` with correct aria-level, aria-expanded, aria-selected, aria-setsize, aria-posinset
3. Cells have `role="gridcell"` or `role="rowheader"` (for tree column)
4. Headers have `role="columnheader"` with `aria-sort`
5. Checkboxes have `role="checkbox"` with `aria-checked`
6. Expanders have `role="button"` with `aria-label`
7. Tab → focus enters grid at correct cell
8. ArrowDown/ArrowUp navigate between rows
9. ArrowRight on collapsed node → expands
10. ArrowRight on expanded node → moves to first child
11. ArrowLeft on expanded node → collapses
12. ArrowLeft on collapsed/leaf → moves to parent
13. Home/End → first/last row
14. Enter → selects or starts editing
15. Space → toggles checkbox or selection
16. F2 → starts editing
17. Escape → cancels editing
18. Asterisk → expands all siblings
19. Ctrl+A → selects all (MULTI mode)
20. Shift+Arrow → extends selection
21. Roving tabindex: only one cell has tabindex="0" at any time
22. Focus visible: focused cell has visual indicator (CSS outline or class)
23. Screen reader announcement: expanding/collapsing fires aria-live announcement

---

## Part 17: Integration Tests

`packages/ui/tests/treegrid/TreeGridIntegration.test.ts`

End-to-end scenarios exercising the complete TreeGrid system.

### Scenario 1: File Explorer
- Tree with folders and files, 3 levels deep
- Columns: Name (tree column), Size (NumberColumn), Modified (DateColumn), Type (Column)
- Expand folders, verify files shown with correct metadata
- Sort by Size within each folder
- folderSort=true: folders before files
- Double-click folder → expand
- Right-click → context menu (mock)
- Drag file from folder1 to folder2

### Scenario 2: Project Task Breakdown
- Tree: Project → Phase → Task → Subtask
- Columns: Task (tree column), Assignee, Status (ComboBox editor), Hours (NumberField editor), Progress (WidgetColumn with progress bar)
- Cell editing: edit Status via ComboBox, Hours via NumberField
- Summary row showing total hours per phase
- Checkbox: check completed tasks, cascade to subtasks
- Filter by Assignee

### Scenario 3: Organizational Chart
- Tree: Company → Department → Team → Person
- Drag person between teams
- Locked columns: tree column locked, other columns scrollable
- 10,000 nodes: virtual scrolling performance
- expandPath to navigate deep

### Scenario 4: Lazy-Loading Async Tree
- TreeStore with AjaxProxy (mock fetch)
- Root starts empty
- Expand root → loads departments from API
- Expand department → loads teams
- Expand team → loads members
- Loading indicators shown during each load
- expandPath loads each level sequentially

### Scenario 5: State Persistence
- Configure stateId
- Expand several nodes, sort by column, resize column, check some nodes
- Serialize state to localStorage
- Destroy TreeGrid
- Create new TreeGrid with same stateId
- Verify all state restored: expanded nodes, sort, column widths, checks

### Scenario 6: Full Keyboard Workflow
- Focus grid via Tab
- Navigate with arrows through tree + columns
- Expand/collapse with ArrowRight/ArrowLeft
- Select with Enter, check with Space
- Edit with F2, save with Enter
- Multi-select with Shift+Arrow
- Copy with Ctrl+C

---

## Part 18: Performance Tests

`packages/ui/tests/treegrid/TreeGridPerformance.test.ts`

1. **Initial render**: 10,000 node tree, 5 columns → first render < 200ms
2. **Expand all**: 10,000 nodes → expandAll completes < 500ms
3. **Virtual scroll**: 10,000 visible nodes → scroll frame time < 16ms (60fps)
4. **Filter**: 10,000 nodes, filter to 500 matches → filter < 100ms
5. **Sort**: 10,000 nodes, recursive sort → sort < 200ms
6. **flatData rebuild**: 10,000 nodes → rebuild < 50ms
7. **DOM node count**: 10,000 visible nodes → fewer than 200 DOM row elements (virtual scrolling)
8. **Memory**: create and destroy 50 TreeGrids with 1,000 nodes each → no memory leak (WeakRef verification)
9. **Drag-drop**: drag over 100 rows → smooth (no janky re-renders)
10. **Elbow computation**: 10,000 nodes with lines=true → elbow computation < 50ms

---

## Implementation Notes

### TypeScript Strictness

- **Zero `any`**. Use `unknown` with narrowing, proper generics, or specific types.
- **Strict null checks**. Every property access on potentially-null values uses optional chaining or explicit null checks.
- `readonly` on properties that should not be reassigned after construction.
- Private fields use `#` syntax where possible.
- Generic type parameters where they add type safety (e.g., `TreeGrid<T extends Model & NodeInterface>`).

### Performance Patterns

- **Batch DOM updates**: Use `DocumentFragment` for inserting multiple rows. Never insert rows one-at-a-time in a loop.
- **requestAnimationFrame**: Batch layout reads and writes. Read all measurements, then write all mutations.
- **Object pooling**: Recycle DOM row elements during virtual scrolling instead of creating new ones.
- **Debounce state saves**: Don't write to localStorage on every change.
- **Suspend events during bulk operations**: When expanding all or loading, suspend TreeStore events, do all mutations, resume, fire single 'refresh'.
- **Avoid forced reflows**: Never read `offsetHeight` immediately after writing `style.height`.

### CSS Class Naming Convention

All CSS classes use the `x-treegrid-` prefix:
```
x-treegrid                             — root container
x-treegrid-cell                        — tree column cell
x-treegrid-cell-inner                  — inner wrapper of tree column cell
x-treegrid-expander                    — expand/collapse icon
x-treegrid-expander-expanded           — expanded state
x-treegrid-expander-collapsed          — collapsed state
x-treegrid-expander-leaf               — leaf node (no expander)
x-treegrid-checkbox                    — checkbox element
x-treegrid-checkbox-checked            — checked state
x-treegrid-checkbox-indeterminate      — indeterminate state
x-treegrid-icon                        — node icon
x-treegrid-icon-folder                 — closed folder
x-treegrid-icon-folder-open            — open folder
x-treegrid-icon-leaf                   — leaf/document
x-treegrid-node-text                   — text content
x-treegrid-node                        — row element (on <tr>)
x-treegrid-expanded                    — expanded row
x-treegrid-collapsed                   — collapsed row
x-treegrid-leaf                        — leaf row
x-treegrid-loading                     — row loading children
x-treegrid-selected                    — selected row
x-treegrid-focused                     — focused row
x-treegrid-root-node                   — root row (if visible)
x-treegrid-elbow                       — connector line element
x-treegrid-elbow-line                  — vertical line (│)
x-treegrid-elbow-empty                 — blank spacer
x-treegrid-elbow-end                   — L-terminator (└)
x-treegrid-elbow-end-plus              — L with expander
x-treegrid-elbow-tee                   — T-junction (├)
x-treegrid-elbow-tee-plus              — T with expander
x-treegrid-drop-highlight              — drop target highlight
x-treegrid-drop-indicator              — insertion line indicator
x-treegrid-summary-row                 — summary row
x-treegrid-node-over                   — mouse hover
```

---

## Final Checklist

When implementation is complete, verify:

- [ ] All 18 test files exist and pass (red → green workflow followed)
- [ ] All 16 source files compile with `tsc --noEmit` (zero errors, zero warnings)
- [ ] 90%+ code coverage on every file
- [ ] Zero use of `any` type anywhere
- [ ] Every public method and class has JSDoc with `@param`, `@returns`, `@fires`, `@example`
- [ ] `role="treegrid"` on container (not `role="grid"`)
- [ ] All ARIA attributes correctly applied and dynamically updated
- [ ] Full keyboard navigation implemented per specification
- [ ] Roving tabindex working correctly
- [ ] Virtual scrolling handles 10,000+ visible nodes
- [ ] All performance benchmarks pass
- [ ] No memory leaks (WeakRef verification in tests)
- [ ] Drag-and-drop with circular reference prevention
- [ ] Checkbox cascade/bubble working correctly (including tri-state)
- [ ] Locked columns synchronized correctly
- [ ] State persistence round-trips correctly
- [ ] Export produces valid output
- [ ] All Grid features (sorting, filtering, editing, clipboard) work correctly with tree data
- [ ] Tree connector lines (elbows) render correctly for all tree shapes
- [ ] Animations use Web Animations API (not CSS transitions)
- [ ] All files exported from `packages/ui/src/treegrid/index.ts`
- [ ] All files exported from `packages/ui/src/index.ts`

Begin by writing ALL test files first. Then implement all source files to make the tests pass. Show every file with its complete content.
