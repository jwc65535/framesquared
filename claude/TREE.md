# Prompt: Implement Complete Tree System (TreeModel, TreeStore, Tree Panel & All Supporting Code)

You are working on **ext-ts**, a ground-up reimplementation of Sencha ExtJS in modern TypeScript with ESM modules. There is **no Internet Explorer support** — use any modern browser API freely (Proxy, WeakMap, WeakRef, ResizeObserver, MutationObserver, IntersectionObserver, structuredClone, Symbol.dispose, etc.).

This project uses **strict test-driven development**. For every module below, you must:
1. Write comprehensive failing tests FIRST
2. Verify they fail (red)
3. Implement the minimum code to pass (green)
4. Refactor while tests stay green
5. Maintain 90%+ code coverage

The test runner is **Vitest** with `jsdom` environment. Use `vi.fn()`, `vi.spyOn()`, `vi.useFakeTimers()`, and `vi.stubGlobal()` as needed. Mock `fetch()` for any async data loading.

---

## Prerequisites (Assumed Already Implemented)

The following modules exist and are importable from `@ext-ts/core` and `@ext-ts/data`. Reference them as needed — do NOT reimplement them.

```typescript
// @ext-ts/core
import { Base } from '@ext-ts/core';              // Base class with config system, destroy(), callParent()
import { Observable } from '@ext-ts/core';         // Mixin: on(), un(), fireEvent(), suspendEvents(), etc.
import { Identifiable } from '@ext-ts/core';       // Mixin: id config, auto-generated IDs, identity map
import { generateId } from '@ext-ts/core';         // Generates unique IDs like "ext-ts-42"
import { apply, applyIf, isObject, isString, isArray, isDefined, isEmpty } from '@ext-ts/core';

// @ext-ts/data — already implemented
import { Model } from '@ext-ts/data';              // Data model with fields, get/set, dirty tracking, validation
import { Store } from '@ext-ts/data';              // Flat data store with sort, filter, group, CRUD, events
import { Collection } from '@ext-ts/data';         // Ordered keyed collection used by Store internally
import { Field, StringField, IntField, BooleanField, AutoField } from '@ext-ts/data';
import { Proxy, MemoryProxy, AjaxProxy } from '@ext-ts/data';
import { JsonReader, JsonWriter } from '@ext-ts/data';
import { Operation, ResultSet } from '@ext-ts/data';
import { Sorter, Filter } from '@ext-ts/data';

// @ext-ts/component — already implemented
import { Component } from '@ext-ts/component';     // Base UI component with lifecycle, render, show/hide, etc.
import { Container } from '@ext-ts/component';     // Component that manages children, query(), down(), up()
import { XTemplate } from '@ext-ts/component';     // Template engine with {field}, <tpl for>, <tpl if>, etc.

// @ext-ts/ui — already implemented
import { Panel } from '@ext-ts/ui';                // Panel with header, tools, collapse, dock, body
import { Grid } from '@ext-ts/ui';                 // Grid panel with columns, selection, virtual scrolling
import { Column } from '@ext-ts/ui';               // Grid column base class
import { GridView } from '@ext-ts/ui';             // Grid view managing DOM row rendering
import { HeaderContainer } from '@ext-ts/ui';      // Column header container
import { SelectionModel, RowSelectionModel } from '@ext-ts/ui';

// @ext-ts/layout
import { Layout } from '@ext-ts/layout';

// @ext-ts/dd (drag and drop — already implemented)
import { Draggable, Droppable, DragData, Sortable } from '@ext-ts/dd';
```

---

## Deliverables — Full File List

Implement every file below in full. Each file must include complete TypeScript source with JSDoc comments, full type annotations, and zero use of `any` (use `unknown` and narrow).

### Source Files

```
packages/data/src/mixin/NodeInterface.ts
packages/data/src/model/TreeModel.ts
packages/data/src/store/TreeStore.ts
packages/data/src/reader/TreeReader.ts
packages/data/src/writer/TreeWriter.ts
packages/data/src/proxy/TreeProxy.ts           (optional enhanced proxy behavior)
packages/ui/src/tree/TreePanel.ts
packages/ui/src/tree/TreeView.ts
packages/ui/src/tree/TreeColumn.ts
packages/ui/src/tree/TreeDragZone.ts
packages/ui/src/tree/TreeDropZone.ts
packages/ui/src/tree/TreeViewDragDrop.ts       (plugin)
packages/ui/src/tree/CellEditingPlugin.ts      (tree-specific cell editing)
packages/ui/src/tree/CheckboxModel.ts          (tree checkbox selection)
packages/ui/src/selection/TreeSelectionModel.ts
```

### Test Files (write these BEFORE the source files)

```
packages/data/tests/NodeInterface.test.ts
packages/data/tests/TreeModel.test.ts
packages/data/tests/TreeStore.test.ts
packages/data/tests/TreeReader.test.ts
packages/data/tests/TreeWriter.test.ts
packages/ui/tests/tree/TreePanel.test.ts
packages/ui/tests/tree/TreeView.test.ts
packages/ui/tests/tree/TreeColumn.test.ts
packages/ui/tests/tree/TreeDragDrop.test.ts
packages/ui/tests/tree/TreeSelectionModel.test.ts
packages/ui/tests/tree/TreeIntegration.test.ts  (end-to-end tree scenarios)
```

---

## Part 1: NodeInterface Mixin

`packages/data/src/mixin/NodeInterface.ts`

NodeInterface is a **mixin** applied to any Model to give it tree-node capabilities. It is the single most critical piece of the tree system — every other tree module depends on it.

### Fields Added by NodeInterface

When NodeInterface is mixed into a Model, it injects the following **fields** onto the model (these are real model fields with get/set/dirty tracking). If the model already declares a field with the same name, NodeInterface does NOT overwrite it.

| Field | Type | Default | Persist | Description |
|-------|------|---------|---------|-------------|
| `parentId` | `auto` | `null` | `true` | ID of the parent node |
| `index` | `int` | `-1` | `false` | Position among siblings (0-based) |
| `depth` | `int` | `0` | `false` | Nesting depth (root = 0) |
| `expanded` | `boolean` | `false` | `false` | Whether children are visible |
| `expandable` | `boolean` | `true` | `false` | Whether the node can have children conceptually |
| `checked` | `boolean \| null` | `null` | `false` | Checkbox state: true, false, or null (tri-state indeterminate) |
| `leaf` | `boolean` | `false` | `true` | Whether this node is a leaf (no children) |
| `cls` | `string` | `''` | `false` | Extra CSS class for this node's row |
| `iconCls` | `string` | `''` | `false` | CSS class for this node's icon |
| `icon` | `string` | `''` | `false` | URL for this node's icon |
| `root` | `boolean` | `false` | `false` | Whether this node is the root |
| `isLast` | `boolean` | `false` | `false` | Whether this is the last sibling |
| `isFirst` | `boolean` | `false` | `false` | Whether this is the first sibling |
| `allowDrop` | `boolean` | `true` | `false` | Whether nodes can be dropped onto this node |
| `allowDrag` | `boolean` | `true` | `false` | Whether this node can be dragged |
| `loaded` | `boolean` | `false` | `false` | Whether children have been loaded (for async) |
| `loading` | `boolean` | `false` | `false` | Whether children are currently loading |
| `href` | `string` | `''` | `false` | Hyperlink URL |
| `hrefTarget` | `string` | `''` | `false` | Link target |
| `qtip` | `string` | `''` | `false` | Quick-tip tooltip text |
| `qtitle` | `string` | `''` | `false` | Quick-tip tooltip title |
| `qshowDelay` | `int` | `0` | `false` | Quick-tip show delay |
| `children` | `auto` | `null` | `false` | Inline child data for eager loading |
| `text` | `string` | `''` | `true` | Display text (the primary visible value) |

### Properties (non-field, runtime-only)

These are NOT model fields — they are plain object properties managed by NodeInterface methods. They are NOT serialized, NOT dirty-tracked, and have NO get/set auto-generation. They are set directly on the model instance.

```typescript
// Navigation pointers (managed by insert/remove operations)
parentNode: NodeInterface | null;     // Reference to parent (null for root)
firstChild: NodeInterface | null;     // First child node
lastChild: NodeInterface | null;      // Last child node
previousSibling: NodeInterface | null;// Previous sibling
nextSibling: NodeInterface | null;    // Next sibling

// Child array (the authoritative ordered list of children)
childNodes: NodeInterface[];          // Ordered array of child nodes

// Internal bookkeeping
childNodeHash: Map<string | number, NodeInterface>; // id → child for O(1) lookup
}
```

### Methods

Implement every method below on the NodeInterface mixin. Each method must handle edge cases (null parent, empty children, destroyed nodes, etc.) and fire appropriate events on the owning TreeStore.

#### Hierarchy Queries

```typescript
isLeaf(): boolean;
// Returns the `leaf` field value.

isRoot(): boolean;
// Returns true if this node has no parentNode.

isLoaded(): boolean;
// Returns the `loaded` field value.

isLoading(): boolean;
// Returns the `loading` field value.

isExpanded(): boolean;
// Returns the `expanded` field value.

isExpandable(): boolean;
// Returns true if not a leaf, OR if the node has children.

isVisible(): boolean;
// A node is visible if every ancestor up to the root is expanded.
// The root itself is always "visible" (even if not rendered).

isAncestor(possibleDescendant: NodeInterface): boolean;
// Returns true if `possibleDescendant` is anywhere in this node's subtree.

contains(child: NodeInterface): boolean;
// Alias for isAncestor.

getDepth(): number;
// Returns the `depth` field value.

getPath(separator?: string, field?: string): string;
// Returns a path string like "/root/parent/child".
// `separator` defaults to "/".
// `field` defaults to "id" — uses that field's value for each segment.
// Walks up from this node to root, collecting field values, joins with separator.
// Example: node.getPath('/', 'text') => "/Root/Documents/Report.pdf"

getOwnerTree(): TreePanel | null;
// Returns the TreePanel that owns the TreeStore this node belongs to, or null.

getTreeStore(): TreeStore | null;
// Returns the TreeStore this node is registered in, or null.
```

#### Child Access

```typescript
hasChildNodes(): boolean;
// Returns true if childNodes.length > 0.

childCount(): number;
// Returns childNodes.length.

getChildAt(index: number): NodeInterface | undefined;
// Returns the child at the given index, or undefined if out of bounds.

indexOf(child: NodeInterface): number;
// Returns the index of the given child in this.childNodes, or -1.

indexOfId(id: string | number): number;
// Returns the index of the child with the given id, or -1.

findChild(field: string, value: unknown, deep?: boolean): NodeInterface | null;
// Searches childNodes for a node where get(field) === value.
// If deep=true (default false), searches entire subtree depth-first.
// Returns first match or null.

findChildBy(predicate: (node: NodeInterface) => boolean, deep?: boolean): NodeInterface | null;
// Like findChild but with a predicate function.
// If deep=true, searches entire subtree.

getChildById(id: string | number): NodeInterface | null;
// O(1) lookup via childNodeHash. Does NOT search deeply.

getChildren(deep?: boolean): NodeInterface[];
// Returns shallow copy of childNodes.
// If deep=true, returns flattened array of all descendants in depth-first order.
```

#### Tree Traversal

```typescript
cascadeBy(options: CascadeOptions | ((node: NodeInterface) => boolean | void)): void;
// Walks the subtree depth-first starting from this node.
// If `options` is a function, call it on each node. If it returns false, stop
// descending into that node's children (but continue siblings).
// If `options` is an object: { before?, after?, scope? }
//   before(node): called before descending into children. Return false to skip children.
//   after(node): called after all children have been visited.
//   scope: `this` context for callbacks.

eachChild(fn: (child: NodeInterface, index: number) => boolean | void, scope?: object): void;
// Calls fn for each direct child. If fn returns false, stops iteration.

bubble(fn: (node: NodeInterface) => boolean | void, scope?: object): void;
// Walks UP from this node to root, calling fn on each ancestor.
// If fn returns false, stops.

collect(field: string, deep?: boolean): unknown[];
// Collects the value of `field` from each child (or all descendants if deep=true).
// Returns array of values.
```

#### Mutation Operations

These are the heart of the tree. Every mutation must:
- Update all sibling pointers (previousSibling, nextSibling)
- Update parent pointers (firstChild, lastChild)
- Update the `index` field on all affected siblings
- Update the `depth` field recursively on moved subtrees
- Update `isFirst`/`isLast` fields
- Update `parentId` field
- Register/unregister nodes in TreeStore's node map
- Fire events on the TreeStore
- Handle the case where the node is being moved (remove from old parent first)
- NOT fire events or update store during a bulk/loading operation (use `suspendEvents`)

```typescript
appendChild(
  childOrChildren: NodeInterface | NodeInterface[] | object | object[],
  suppressEvents?: boolean,
  commit?: boolean
): NodeInterface | NodeInterface[];
// Appends one or more children to this node.
// If passed plain objects, wraps them as new model instances via the TreeStore's model.
// If a child already has a parent, REMOVES it from the old parent first (move operation).
// Updates all navigation pointers and fields.
// Fires 'nodeappend' on TreeStore (unless suppressed).
// If commit=true, calls commit() on the child to clear dirty state.
// Returns the appended child (or array of children).

insertBefore(
  newChild: NodeInterface | object,
  refChild: NodeInterface | null
): NodeInterface;
// Inserts newChild before refChild in this node's children.
// If refChild is null, appends to end (same as appendChild).
// If newChild already has a parent, moves it.
// Updates all pointers, indices, fields.
// Fires 'nodeinsert' on TreeStore.
// Returns the inserted child.

insertChild(index: number, childOrChildren: NodeInterface | NodeInterface[] | object | object[]): NodeInterface | NodeInterface[];
// Inserts child(ren) at the given index.
// Delegates to insertBefore using getChildAt(index) as the reference.

removeChild(child: NodeInterface, destroy?: boolean, suppressEvents?: boolean): NodeInterface;
// Removes the child from this node's children.
// If destroy=true (default false), calls child.destroy() which also destroys all descendants.
// If destroy=false, the child becomes a detached node (no parent, not in any store).
// Updates all pointers, indices, fields.
// Fires 'noderemove' on TreeStore (unless suppressed).
// Returns the removed child.

removeAll(destroy?: boolean, suppressEvents?: boolean): NodeInterface[];
// Removes all children.
// If destroy=true, destroys each child recursively.
// Returns array of removed children.

replaceChild(newChild: NodeInterface | object, oldChild: NodeInterface): NodeInterface;
// Replaces oldChild with newChild in this node's children.
// Equivalent to: insertBefore(newChild, oldChild); removeChild(oldChild);
// Returns the old child.

sort(sorterFn: (a: NodeInterface, b: NodeInterface) => number, recursive?: boolean, suppressEvents?: boolean): void;
// Sorts this node's children in place.
// If recursive=true, sorts each child's children as well (and so on).
// Updates all index, isFirst, isLast, previousSibling, nextSibling.
// Fires 'sort' on TreeStore (unless suppressed).

copy(newId?: string | number, deep?: boolean): NodeInterface;
// Creates a deep clone of this node.
// If deep=true (default true), recursively clones all descendants.
// Each cloned node gets a new auto-generated ID (unless newId is specified for the root clone).
// Cloned nodes are detached (no parent, no store).
// Does NOT clone navigation pointers — rebuilds them from cloned childNodes.
```

#### Expand / Collapse

```typescript
expand(recursive?: boolean, callback?: (records: NodeInterface[]) => void): void;
// Expands this node.
// If the node is a leaf, does nothing.
// If the node is not yet loaded (loaded=false, leaf=false), triggers an async load
//   via the TreeStore's proxy, then expands after loading completes.
// Sets expanded=true.
// Fires 'beforeexpand' on TreeStore (cancellable — if returns false, aborts).
// Fires 'expand' on TreeStore after expansion.
// If recursive=true, expands all child nodes recursively after this node expands.
// callback is called after expansion (and async loading, if any) completes.
// The callback receives the child records as an argument.

collapse(recursive?: boolean, callback?: () => void): void;
// Collapses this node.
// Sets expanded=false.
// Fires 'beforecollapse' on TreeStore (cancellable).
// Fires 'collapse' on TreeStore.
// If recursive=true, collapses all child nodes recursively.
// callback is called after collapse completes.

toggle(recursive?: boolean): void;
// Toggles between expanded and collapsed.

expandChildren(recursive?: boolean, callback?: () => void): void;
// Expands all child nodes (but not this node itself).
// If recursive=true, does so recursively.

collapseChildren(recursive?: boolean, callback?: () => void): void;
// Collapses all child nodes (but not this node itself).
```

#### Serialization

```typescript
serialize(): TreeNodeData;
// Serializes this node (and all descendants) to a plain JSON-compatible object.
// Includes all persistent fields.
// Children are nested under a "children" property.
// Non-persistent fields (index, depth, etc.) are excluded.
// Example output:
// {
//   id: 1, text: 'Documents', leaf: false, expanded: true,
//   children: [
//     { id: 2, text: 'Report.pdf', leaf: true },
//     { id: 3, text: 'Photos', leaf: false, children: [...] }
//   ]
// }

toJSON(): TreeNodeData;
// Alias for serialize().
```

#### Checkbox Operations (for checked trees)

```typescript
isChecked(): boolean | null;
// Returns the `checked` field. null = indeterminate.

setChecked(checked: boolean, suppressEvents?: boolean): void;
// Sets the `checked` field.
// Fires 'checkchange' on TreeStore (unless suppressed).

cascadeCheck(checked: boolean): void;
// Sets checked on this node AND all descendants recursively.

bubbleCheck(): void;
// Walks up from this node to root, updating each ancestor's checked state:
// - If ALL children are checked → parent = true
// - If NO children are checked → parent = false
// - If SOME children are checked → parent = null (indeterminate)
// This is called automatically after setChecked if the TreeStore has
// cascadeChecks enabled.

updateCheckState(): void;
// Recalculates this node's checked state based on children, without cascading further.
```

#### Utility

```typescript
createNode(data: object): NodeInterface;
// Creates a new child node from a plain data object using the TreeStore's model class.
// Applies NodeInterface mixin if not already applied.
// Returns the new node (NOT yet added to any parent).

destroy(silent?: boolean): void;
// Destroys this node and all descendants.
// Removes from parent.
// Unregisters from TreeStore.
// Nullifies all navigation pointers.
// Calls super.destroy().
```

### Types

```typescript
interface CascadeOptions {
  before?: (node: NodeInterface) => boolean | void;
  after?: (node: NodeInterface) => void;
  scope?: object;
}

interface TreeNodeData {
  [key: string]: unknown;
  children?: TreeNodeData[];
}
```

### Tests for NodeInterface (write FIRST)

```
packages/data/tests/NodeInterface.test.ts
```

Write tests covering:

1. **Field injection**: Verify all 24+ fields are added to model, with correct types and defaults
2. **Property initialization**: childNodes=[], parentNode=null, etc.
3. **appendChild**:
  - Append single child, verify parent/child pointers
  - Append multiple children, verify sibling pointers (previousSibling/nextSibling)
  - Append to non-empty node, verify existing children's pointers update
  - Append with plain data object (auto-wraps as model)
  - Append node that already has a parent (move operation): removed from old parent
  - Index, depth, isFirst, isLast fields update correctly
  - parentId field updates
  - Events fire on TreeStore: 'nodeappend'
  - suppressEvents prevents events
4. **insertBefore**:
  - Insert at beginning (before firstChild)
  - Insert in middle
  - Insert before null (appends)
  - Insert node from another parent (move)
  - All sibling/index pointers correct after insert
5. **insertChild**:
  - Insert at index 0, middle, end
6. **removeChild**:
  - Remove from middle, verify sibling pointers heal
  - Remove only child, verify parent.firstChild/lastChild = null
  - destroy=true destroys child and all grandchildren
  - destroy=false leaves child intact but detached
  - Events fire: 'noderemove'
7. **removeAll**:
  - Removes all children, resets pointers
  - destroy=true destroys all
8. **replaceChild**:
  - Replace middle child, verify new child has correct pointers
9. **sort**:
  - Sorts children, indices update
  - recursive=true sorts grandchildren too
10. **copy**:
  - Deep copy creates independent subtree with new IDs
  - Shallow copy copies only this node
  - Cloned tree structure is intact (parent/child pointers rebuilt)
11. **Hierarchy queries**:
  - isRoot, isLeaf, isExpanded, isExpandable
  - isVisible: expanded ancestors → true; collapsed ancestor → false
  - isAncestor/contains
  - getDepth at various levels
  - getPath with default and custom separator/field
12. **Child access**:
  - hasChildNodes, childCount, getChildAt(valid/invalid index)
  - indexOf, indexOfId
  - findChild shallow and deep
  - findChildBy with predicate
  - getChildById (O(1) via hash)
13. **Traversal**:
  - cascadeBy visits all nodes depth-first
  - cascadeBy with before/after callbacks
  - cascadeBy returning false skips subtree
  - eachChild iterates direct children, stops on false
  - bubble walks to root, stops on false
  - collect gathers field values
14. **Expand/collapse**:
  - expand sets expanded=true, fires events
  - expand on leaf does nothing
  - expand when not loaded triggers async load (mock proxy)
  - recursive expand
  - collapse sets expanded=false, fires events
  - beforeexpand returning false cancels
  - toggle switches state
15. **Checkbox**:
  - setChecked → checkchange event
  - cascadeCheck sets all descendants
  - bubbleCheck: all children checked → parent true
  - bubbleCheck: some children checked → parent null (indeterminate)
  - bubbleCheck: no children checked → parent false
  - Three-level deep cascade+bubble interaction
16. **Serialization**:
  - serialize produces correct nested JSON
  - Non-persistent fields excluded
  - Deep nesting preserved
  - toJSON alias works
17. **Destroy**:
  - Destroys all descendants
  - Removes from parent
  - Clears pointers
  - Unregisters from store
18. **Edge cases**:
  - Operations on destroyed node throw
  - Moving a node to a descendant of itself throws (circular)
  - Appending a node as a child of itself throws
  - Empty tree (root with no children) operations
  - Very deep tree (50+ levels): getPath, cascadeBy, depth

---

## Part 2: TreeModel

`packages/data/src/model/TreeModel.ts`

TreeModel is a **convenience Model subclass** that has NodeInterface pre-applied. Applications can either use TreeModel directly or apply the NodeInterface mixin to their own Model subclass.

```typescript
@alias('model.tree')
class TreeModel extends Model {
  // NodeInterface is mixed in
  static mixins = [NodeInterface];

  // Default fields: id, text, leaf, cls, iconCls, icon, etc.
  // (All NodeInterface fields)

  // Additional static config
  static override idProperty = 'id';

  // Default root node config
  static defaultRootId = 'root';
  static defaultRootText = 'Root';
  static defaultRootProperty = 'children';
}
```

### Tests for TreeModel

```
packages/data/tests/TreeModel.test.ts
```

- TreeModel instances have all NodeInterface methods
- TreeModel instances have all NodeInterface fields
- Can create custom model extending TreeModel with additional fields
- Custom fields do not conflict with NodeInterface fields
- idProperty works correctly
- Registering in ClassManager works with alias 'model.tree'

---

## Part 3: TreeStore

`packages/data/src/store/TreeStore.ts`

TreeStore is a **specialized Store** that manages hierarchical data. It wraps a root node and provides tree-specific CRUD operations, async lazy loading, and a flattened view of visible nodes for rendering.

### Configuration

```typescript
interface TreeStoreConfig {
  // Inherited from Store
  model?: typeof Model | string;       // Default: TreeModel
  proxy?: ProxyConfig | Proxy;
  autoLoad?: boolean;
  listeners?: Record<string, Function>;
  filters?: Filter[];
  sorters?: Sorter[];

  // Tree-specific
  root?: NodeInterface | object;        // Root node or data to create root from
  rootVisible?: boolean;                // Whether root appears in flat data (default true)
  defaultRootId?: string | number;      // ID for auto-created root (default 'root')
  defaultRootText?: string;             // Text for auto-created root (default '')
  defaultRootProperty?: string;         // Property name for nested children data (default 'children')
  nodeParam?: string;                   // Param name sent to proxy for the parent node ID when loading children (default 'node')
  parentIdProperty?: string;            // Field name for parent ID (default 'parentId')
  folderSort?: boolean;                 // Sort non-leaf before leaf (default false)
  clearOnLoad?: boolean;               // Clear children before reloading a node (default true)
  clearRemovedOnLoad?: boolean;         // Clear removed records on successful load (default true)
  lazyFill?: boolean;                   // Don't populate children until expanded (default false)
  cascadeChecks?: boolean;              // Check/uncheck cascades to children and bubbles to parents (default true)
  filterer?: 'bottomup' | 'topdown';   // Filter strategy (default 'bottomup')
  // bottomup: a parent is visible if any descendant matches the filter
  // topdown: a parent is visible only if it matches; children of hidden parents are hidden
}
```

### Internal Data Structures

```typescript
// The flattened, ordered array of visible nodes — this is what the TreeView renders.
// Recalculated whenever expand/collapse/add/remove/filter/sort changes.
private flatData: NodeInterface[];

// O(1) lookup: node id → node reference. Every node in the tree is registered here.
private nodeHash: Map<string | number, NodeInterface>;

// Removed nodes (for sync tracking)
private removedNodes: NodeInterface[];

// The virtual root. Always exists, even if rootVisible=false.
private rootNode: NodeInterface;
```

### Constructor Logic

1. If no `model` is provided, default to `TreeModel`.
2. Ensure the model class has `NodeInterface` mixed in. If not, dynamically apply it.
3. Create the root node from the `root` config (or create a default empty root).
4. If `root` is a plain object with nested `children`, recursively create child nodes.
5. Register all initial nodes in `nodeHash`.
6. Build `flatData` from the expanded/visible state.
7. If `autoLoad` is true, trigger `load()`.

### Methods

#### Root & Node Access

```typescript
getRootNode(): NodeInterface;
// Returns the root node.

setRootNode(rootOrData: NodeInterface | object): NodeInterface;
// Replaces the entire tree with a new root.
// If passed a plain object, creates a new model instance.
// Unregisters all old nodes from nodeHash.
// Registers all new nodes.
// Rebuilds flatData.
// Fires 'rootchange' event.
// Returns the new root.

getNodeById(id: string | number): NodeInterface | null;
// O(1) lookup via nodeHash. Returns null if not found.

getNodeByInternalId(internalId: string): NodeInterface | null;
// Lookup by model's internal unique ID (not the data `id`).

findNode(field: string, value: unknown, deep?: boolean): NodeInterface | null;
// Delegates to root.findChild(field, value, true). Always deep.

isNodeLoading(node: NodeInterface): boolean;
// Returns node.isLoading().

getCount(): number;
// Returns flatData.length (the number of *visible* nodes).

getTotalCount(): number;
// Returns nodeHash.size (the total number of nodes, visible or not).
```

#### Data Loading

```typescript
load(options?: TreeLoadOptions): Promise<NodeInterface[]>;
// Loads the root node's children from the proxy.
// Sends the root node's ID as the `nodeParam` parameter.
// On success:
//   - If clearOnLoad, removes existing children
//   - Parses response via reader
//   - Creates model instances for each record
//   - Appends as children of the root
//   - Sets root.loaded = true
//   - Fires 'load' event
// Returns promise resolving to the loaded child nodes.

loadNode(node: NodeInterface, options?: TreeLoadOptions): Promise<NodeInterface[]>;
// Loads a specific node's children from the proxy.
// Sets node.loading = true during load.
// Sends node's ID as `nodeParam`.
// Creates children and appends.
// Sets node.loaded = true, node.loading = false.
// Fires 'load' event with the node as context.
// If node is the root, delegates to load().
// Used for lazy/async tree loading.

reload(): Promise<NodeInterface[]>;
// Clears the entire tree and reloads from proxy.
// Equivalent to: root.removeAll(true); load();

isLoaded(): boolean;
// Returns root.isLoaded().

isLoading(): boolean;
// Returns root.isLoading().
```

#### Flat Data (for rendering)

```typescript
getAt(index: number): NodeInterface | undefined;
// Returns flatData[index].

indexOf(node: NodeInterface): number;
// Returns the index of the node in flatData, or -1 if not visible.

getRange(start?: number, end?: number): NodeInterface[];
// Returns a slice of flatData.

each(fn: (node: NodeInterface, index: number) => boolean | void): void;
// Iterates over flatData.

collect(field: string): unknown[];
// Collects field values from flatData.

getData(): NodeInterface[];
// Returns a shallow copy of flatData.

rebuildFlatData(): void;
// Walks the tree depth-first from root.
// For each node:
//   - If rootVisible=false, skip the root itself
//   - If node is visible (all ancestors expanded) and passes filters, include in flatData
//   - If node is expanded, include its children recursively
// Sort children at each level if sorters are configured
// Apply folderSort if enabled (non-leaf before leaf)
// This is called internally whenever the tree structure or expand state changes.
```

#### Tree Mutation (convenience methods that delegate to NodeInterface)

```typescript
appendChild(parent: NodeInterface, childOrChildren: NodeInterface | object | (NodeInterface | object)[]): NodeInterface | NodeInterface[];
removeNode(node: NodeInterface, destroy?: boolean): void;
insertBefore(newChild: NodeInterface | object, refChild: NodeInterface): NodeInterface;
moveNode(node: NodeInterface, newParent: NodeInterface, index?: number): void;
```

#### Sorting

```typescript
sort(sorters?: Sorter[], recursive?: boolean): void;
// If no sorters passed, uses the store's configured sorters.
// Sorts the root's children (and recursively all descendants if recursive=true, which is the default).
// If folderSort=true, applies a primary sorter that puts non-leaf nodes before leaf nodes,
// then applies the user's sorters as secondary.
// Rebuilds flatData after sort.
// Fires 'sort' event.
```

#### Filtering

```typescript
filter(filters: Filter | Filter[] | string, value?: unknown): void;
// Applies filters to the tree.
// Strategy depends on `filterer` config:
//
// 'bottomup' (default):
//   A node is visible if:
//   - It matches the filter, OR
//   - Any of its descendants match the filter (ancestors of matches are shown for context)
//   This means you never have a visible child under a hidden parent.
//
// 'topdown':
//   A node is visible if:
//   - It matches the filter AND its parent is visible
//   Children of filtered-out parents are hidden regardless of their own match.
//
// After applying filter logic, rebuilds flatData with only visible nodes.
// Fires 'filter' event.

clearFilter(suppressEvent?: boolean): void;
// Removes all filters. Rebuilds flatData. Fires 'filter' event.

isFiltered(): boolean;
```

#### Sync & Dirty Tracking

```typescript
getModifiedRecords(): NodeInterface[];
// Returns all nodes in the tree that have uncommitted changes.

getNewRecords(): NodeInterface[];
// Returns all phantom nodes (new, not yet persisted).

getRemovedRecords(): NodeInterface[];
// Returns removedNodes array.

commitChanges(): void;
// Commits all modified nodes. Clears removedNodes.

rejectChanges(): void;
// Rejects all modified nodes. Re-adds removed nodes.
```

#### Expand/Collapse Helpers

```typescript
expandAll(callback?: () => void): void;
// Expands every node in the tree, loading as needed.
// callback fires when all expansions (including async loads) complete.

collapseAll(callback?: () => void): void;
// Collapses every node in the tree.

expandPath(path: string, options?: ExpandPathOptions): Promise<NodeInterface>;
// Expands nodes along a path (e.g., "/root/parent/child").
// Returns promise resolving to the final node.
// Options: { separator?: string, field?: string, select?: boolean }
// If select=true, selects the final node in the tree panel.

selectPath(path: string, options?: ExpandPathOptions): Promise<NodeInterface>;
// Expands to the node and selects it. Convenience for expandPath with select=true.
```

### Events

The TreeStore fires these events. ALL events include the TreeStore as `this` (scope).

| Event | Args | Description |
|-------|------|-------------|
| `nodeappend` | `(parent, child, index)` | Child appended to parent |
| `nodeinsert` | `(parent, child, refChild)` | Child inserted before refChild |
| `noderemove` | `(parent, child, index, isMove)` | Child removed (isMove=true if being moved, not truly removed) |
| `nodemove` | `(node, oldParent, newParent, oldIndex, newIndex)` | Node moved between parents |
| `nodeexpand` | `(node, childNodes)` | Node expanded |
| `nodecollapse` | `(node)` | Node collapsed |
| `beforeexpand` | `(node)` → return false to cancel | Before expansion |
| `beforecollapse` | `(node)` → return false to cancel | Before collapse |
| `nodesort` | `(node, childNodes)` | Children of node sorted |
| `rootchange` | `(newRoot, oldRoot)` | Root node replaced |
| `load` | `(store, records, successful, operation)` | Data loaded |
| `beforeload` | `(store, operation)` → return false to cancel | Before loading |
| `checkchange` | `(node, checked)` | Node check state changed |
| `datachanged` | `()` | Any structural change |
| `refresh` | `()` | Flat data rebuilt |
| `update` | `(store, node, operation, modifiedFieldNames)` | Node record updated |
| `add` | `(store, nodes, index)` | Nodes added to flat data |
| `remove` | `(store, nodes, index)` | Nodes removed from flat data |

### Tests for TreeStore (write FIRST)

```
packages/data/tests/TreeStore.test.ts
```

Write tests covering:

1. **Construction**:
  - Default root is created with correct ID and text
  - Root from config object creates full tree with nested children
  - NodeInterface is auto-applied to model if missing
  - Nodes registered in nodeHash
  - flatData built correctly from initial tree state

2. **Root operations**:
  - getRootNode returns root
  - setRootNode replaces tree, fires 'rootchange', old tree cleaned up
  - getNodeById for root, child, grandchild
  - findNode searches deeply

3. **Loading**:
  - load() calls proxy with nodeParam=rootId
  - Load creates children from response data
  - clearOnLoad removes existing children before adding new ones
  - loadNode() loads a specific node's children
  - Async load: node.loading=true during load, false after
  - node.loaded=true after successful load
  - Events: beforeload (cancellable), load
  - Failed load: node stays not-loaded, error handling

4. **Flat data**:
  - Root (visible): root + expanded children in flatData
  - Root not visible: children in flatData, root excluded
  - Collapsed node: children excluded from flatData
  - Expand node → children appear in flatData
  - Collapse node → children disappear
  - Deeply nested: only expanded paths visible
  - getAt, indexOf, getRange on flatData
  - getCount vs getTotalCount difference

5. **Mutations**:
  - appendChild via store convenience method
  - removeNode removes from parent and flatData
  - moveNode: remove from old parent + add to new parent, single 'nodemove' event
  - insertBefore at specific position
  - All mutations trigger flatData rebuild

6. **Sorting**:
  - sort children alphabetically
  - Recursive sort (all levels)
  - folderSort: non-leaf before leaf
  - Sort + custom sorter function
  - flatData reflects new order after sort

7. **Filtering**:
  - bottomup: parent visible if any descendant matches
  - bottomup: non-matching leaf hidden
  - topdown: children of hidden parent also hidden
  - clearFilter restores full tree
  - Filter + expand interaction: expanding a node respects active filters
  - Multiple filters (additive)
  - Filter by field value
  - Filter by custom function

8. **Expand/Collapse**:
  - expandAll expands every node
  - collapseAll collapses every node
  - expandPath: expands nodes along path, loads lazily if needed
  - expandPath with async loading (mock proxy returns children on demand)
  - expandPath with custom field and separator

9. **Checkbox**:
  - cascadeChecks=true: checking parent checks all children
  - cascadeChecks=true: unchecking one child makes parent indeterminate
  - cascadeChecks=false: no cascade
  - checkchange event fires

10. **Dirty tracking**:
  - getModifiedRecords after node field change
  - getNewRecords for appended phantom nodes
  - getRemovedRecords after removeNode
  - commitChanges clears dirty state
  - rejectChanges reverts

11. **Edge cases**:
  - Empty tree (root only, no children)
  - Single node tree (root is leaf)
  - Moving node to its own descendant throws
  - Removing root throws (or is prevented)
  - Adding same node twice is idempotent (it moves)
  - Node IDs unique within tree
  - Very large tree (10,000 nodes): flatData build performance < 100ms

12. **Event ordering**:
  - appendChild fires: 'nodeappend' → 'datachanged' → 'refresh'
  - removeChild fires: 'noderemove' → 'datachanged' → 'refresh'
  - expand fires: 'beforeexpand' → 'nodeexpand' → 'datachanged' → 'refresh'
  - load fires: 'beforeload' → 'load' → 'datachanged' → 'refresh'

---

## Part 4: TreeReader and TreeWriter

### TreeReader

`packages/data/src/reader/TreeReader.ts`

Extends JsonReader to handle nested tree data.

```typescript
class TreeReader extends JsonReader {
  // Config
  childrenProperty: string = 'children';  // Property name for nested children in JSON

  // Overrides read() to:
  // 1. Extract root-level records normally
  // 2. For each record, check if it has a `children` property
  // 3. If so, recursively parse children and attach as node.childNodes
  // 4. Return a flat ResultSet with all records, but with tree structure intact

  readRecords(data: object): ResultSet;
  // Parses nested JSON like:
  // {
  //   "children": [
  //     { "text": "A", "leaf": true },
  //     { "text": "B", "children": [
  //       { "text": "B1", "leaf": true }
  //     ]}
  //   ]
  // }
  // Returns ResultSet with records A, B, B1 — but B has B1 as child in tree structure.
}
```

### TreeWriter

`packages/data/src/writer/TreeWriter.ts`

Extends JsonWriter to serialize tree data with nested children.

```typescript
class TreeWriter extends JsonWriter {
  // Serializes records by including nested children:
  // - For each record, if it has childNodes, serializes them under `children` key
  // - Recursive for deep trees
  // - Respects writeAllFields config
  // - Excludes non-persistent fields
}
```

### Tests

```
packages/data/tests/TreeReader.test.ts
```

- Parse flat array of root-level nodes
- Parse nested JSON with 3+ levels
- Custom childrenProperty name
- Empty children array → leaf detection
- Missing children property → treated as leaf
- Mixed: some nodes with children, some without
- Deeply nested (10+ levels)

```
packages/data/tests/TreeWriter.test.ts
```

- Serialize flat nodes (all leaves)
- Serialize nested tree
- writeAllFields=true includes all fields
- writeAllFields=false includes only modified fields
- Non-persistent fields excluded
- Round-trip: reader → writer → reader produces same tree

---

## Part 5: TreePanel

`packages/ui/src/tree/TreePanel.ts`

TreePanel extends Panel (NOT Grid, unlike ExtJS 4+). However, it internally uses a TreeView for rendering and supports columns (multi-column tree), making it behave similarly to a Grid but with tree-specific features.

*Design decision*: In ExtJS 4+, TreePanel extends GridPanel. In our implementation, TreePanel extends Panel directly but composes a TreeView internally. This gives cleaner separation and avoids inheriting grid features that don't apply. If multi-column tree is needed, the TreeGrid variant (below) extends Grid.

### Configuration

```typescript
interface TreePanelConfig extends PanelConfig {
  store: TreeStore | TreeStoreConfig;
  rootVisible?: boolean;               // Show root node (default false)
  displayField?: string;               // Field to display as node text (default 'text')
  useArrows?: boolean;                 // Modern disclosure arrows vs +/- (default true)
  lines?: boolean;                     // Tree lines connecting nodes (default false)
  singleExpand?: boolean;              // Only one node expanded per sibling group (default false)
  animate?: boolean;                   // Animate expand/collapse (default true)
  hideHeaders?: boolean;               // Hide column headers (default true for single-column tree)
  columns?: ColumnConfig[];            // Additional columns (tree column is auto-prepended)
  selModel?: SelectionModel | SelectionModelConfig;
  selType?: string;                    // Selection model type alias

  // Checkbox tree
  checkable?: boolean;                 // Show checkboxes on all nodes (default false)
  cascadeChecks?: boolean;             // Check cascades to children/parents (default true)
  checkPropagation?: 'up' | 'down' | 'both' | 'none'; // Direction of check cascade (default 'both')
  onlyLeafCheckable?: boolean;         // Only leaf nodes have checkboxes (default false)

  // Drag & drop
  enableDrag?: boolean;                // Enable drag (default false)
  enableDrop?: boolean;                // Enable drop (default false)
  allowParentInserts?: boolean;        // Allow dropping between nodes to insert (default false)
  appendOnly?: boolean;                // Only allow appending to nodes, not insert-between (default false)
  ddGroup?: string;                    // Drag/drop group name
  sortOnDrop?: boolean;               // Sort children after drop (default false)
  allowContainerDrops?: boolean;       // Allow dropping on empty tree body (default false)

  // View config
  viewConfig?: TreeViewConfig;

  // Events forwarded
  // All TreeStore events are relayed through TreePanel
}
```

### DOM Structure

```html
<div class="x-tree-panel x-panel">
  <div class="x-panel-header"> ... </div>    <!-- if title set -->
  <div class="x-panel-body">
    <div class="x-tree-view" role="tree" aria-label="{title}">
      <!-- TreeView renders nodes here -->
      <table class="x-tree-table" role="treegrid">
        <colgroup>
          <col class="x-tree-col" style="width: ...">
          <!-- additional cols if multi-column -->
        </colgroup>
        <tbody>
          <tr class="x-tree-node" role="treeitem"
              aria-level="1" aria-expanded="true" aria-setsize="3" aria-posinset="1"
              data-record-id="node-1">
            <td class="x-tree-cell">
              <div class="x-tree-cell-inner">
                <span class="x-tree-elbow x-tree-elbow-end"></span>    <!-- or line -->
                <span class="x-tree-expander" role="button" aria-label="Collapse"></span>
                <span class="x-tree-checkbox" role="checkbox" aria-checked="false"></span>  <!-- if checkable -->
                <span class="x-tree-icon x-tree-icon-folder"></span>
                <span class="x-tree-node-text">Node Text</span>
              </div>
            </td>
            <!-- additional <td> if multi-column -->
          </tr>
          <!-- more rows -->
        </tbody>
      </table>
    </div>
  </div>
</div>
```

### Methods

```typescript
// Store access
getStore(): TreeStore;

// Root
getRootNode(): NodeInterface;
setRootNode(root: NodeInterface | object): NodeInterface;

// Expand/Collapse
expandAll(callback?: () => void): void;
collapseAll(callback?: () => void): void;
expandNode(node: NodeInterface, deep?: boolean, callback?: () => void): void;
collapseNode(node: NodeInterface, deep?: boolean, callback?: () => void): void;
expandPath(path: string, options?: ExpandPathOptions): Promise<NodeInterface>;
selectPath(path: string, options?: ExpandPathOptions): Promise<NodeInterface>;

// Selection
getSelection(): NodeInterface[];
getSelectionModel(): SelectionModel;
select(nodes: NodeInterface | NodeInterface[], keepExisting?: boolean, suppressEvent?: boolean): void;
deselect(nodes: NodeInterface | NodeInterface[], suppressEvent?: boolean): void;
deselectAll(): void;

// Checkbox
getChecked(): NodeInterface[];
// Returns all nodes where checked=true.

// View access
getView(): TreeView;

// Scrolling
scrollToNode(node: NodeInterface, options?: ScrollOptions): void;
// Ensures the node is visible: expands all ancestors, then scrolls the view.
// Uses element.scrollIntoView() with smooth behavior.
```

### Events (in addition to Panel events)

| Event | Args | Description |
|-------|------|-------------|
| `itemclick` | `(view, record, element, index, event)` | Node row clicked |
| `itemdblclick` | `(view, record, element, index, event)` | Node row double-clicked |
| `itemcontextmenu` | `(view, record, element, index, event)` | Right-click on node |
| `itemexpand` | `(node, childNodes)` | Node expanded (relayed from store) |
| `itemcollapse` | `(node)` | Node collapsed (relayed from store) |
| `checkchange` | `(node, checked)` | Checkbox toggled |
| `selectionchange` | `(model, selectedNodes)` | Selection changed |
| `beforeitemexpand` | `(node)` → return false to cancel | Before expand |
| `beforeitemcollapse` | `(node)` → return false to cancel | Before collapse |
| `itemmouseenter` | `(view, record, element, index, event)` | Mouse enters row |
| `itemmouseleave` | `(view, record, element, index, event)` | Mouse leaves row |
| `beforedrop` | `(node, data, overModel, dropPosition, dropFn)` | Before drag-drop completes |
| `drop` | `(node, data, overModel, dropPosition)` | After drop completes |
| `nodedragover` | `(targetNode, position, dragData)` | During drag over a node |

### ARIA Attributes

Every node row MUST have:
- `role="treeitem"`
- `aria-level="{depth + 1}"` (1-based)
- `aria-expanded="true|false"` (only on non-leaf nodes)
- `aria-selected="true|false"`
- `aria-setsize="{sibling count}"` (total siblings at this level)
- `aria-posinset="{index + 1}"` (1-based position among siblings)
- `aria-checked="true|false|mixed"` (if checkable)

The tree view container:
- `role="tree"`
- `aria-label="{panel title}"`
- `aria-multiselectable="true|false"` (based on selection model)

The expand/collapse icon:
- `role="button"`
- `aria-label="Expand"` or `"Collapse"`

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `ArrowDown` | Move focus to next visible node |
| `ArrowUp` | Move focus to previous visible node |
| `ArrowRight` | If collapsed: expand. If expanded: move to first child. If leaf: no action. |
| `ArrowLeft` | If expanded: collapse. If collapsed/leaf: move to parent. |
| `Enter` | Select the focused node. If checkable, toggle checkbox. |
| `Space` | Toggle checkbox (if checkable). Toggle selection otherwise. |
| `Home` | Move focus to first visible node |
| `End` | Move focus to last visible node |
| `*` (asterisk) | Expand all siblings of the focused node |
| `Ctrl+A` | Select all (if multi-select enabled) |
| `F2` | Begin editing (if editing plugin active) |
| `Escape` | Cancel editing |

Implement roving tabindex: only one node row has `tabindex="0"` at any time (the focused node). All other rows have `tabindex="-1"`.

### Tests for TreePanel (write FIRST)

```
packages/ui/tests/tree/TreePanel.test.ts
```

1. **Rendering**:
  - TreePanel renders with correct DOM structure
  - Nodes render with correct text from displayField
  - Root visible: root row rendered. rootVisible=false: root not rendered.
  - Node depth reflected in indentation (CSS class or style)
  - Leaf vs folder icons differ
  - Lines CSS classes when lines=true
  - Arrows vs +/- when useArrows=true/false
  - Empty tree shows no rows (or emptyText)

2. **Expand/Collapse**:
  - Click expander icon expands node, children appear
  - Click again collapses, children disappear
  - Double-click node text expands (configurable)
  - singleExpand: expanding node A collapses sibling node B
  - expandAll renders all nodes
  - collapseAll hides all children
  - Async expand: expand non-loaded node triggers load, shows loading indicator, then renders children
  - expandPath: deep expand with path string

3. **Checkbox**:
  - checkable=true: checkboxes rendered on every node
  - Clicking checkbox toggles checked state
  - cascadeChecks: checking parent checks all descendants
  - cascadeChecks: unchecking one child makes parent indeterminate
  - onlyLeafCheckable: only leaves have checkboxes
  - getChecked() returns correct nodes
  - checkchange event fires with correct args

4. **Selection**:
  - Click node selects it
  - Ctrl+click adds to selection (multi-select mode)
  - Shift+click selects range
  - selectionchange event fires
  - getSelection() returns selected nodes
  - deselectAll clears selection
  - select() programmatic selection

5. **Keyboard**:
  - ArrowDown moves to next visible node
  - ArrowUp moves to previous
  - ArrowRight expands or moves to first child
  - ArrowLeft collapses or moves to parent
  - Enter selects
  - Space toggles checkbox
  - Home/End move to first/last
  - Roving tabindex: only focused row has tabindex=0

6. **ARIA**:
  - role="tree" on container
  - role="treeitem" on each row
  - aria-level matches depth
  - aria-expanded on non-leaf nodes
  - aria-selected on selected nodes
  - aria-setsize/aria-posinset correct
  - aria-checked on checkable nodes (true/false/mixed)

7. **Drag & Drop**:
  - enableDrag + enableDrop: drag node to new parent
  - Drop indicator shows correct position (before/after/append)
  - appendOnly: only append drops allowed, no insert-between
  - beforedrop event can cancel drop
  - Drop updates tree structure
  - Drag to descendant of self is prevented
  - Cross-tree drag (different ddGroup)

8. **Store binding**:
  - Store add → new node appears in tree
  - Store remove → node disappears
  - Node field change (e.g., text) → DOM updates
  - Store reload → tree refreshes entirely
  - Store filter → hidden nodes disappear, ancestors stay if needed

9. **ScrollToNode**:
  - scrollToNode expands ancestors first, then scrolls into view

10. **Destroy**:
  - Destroying TreePanel destroys TreeView
  - Event listeners cleaned up
  - DOM removed

---

## Part 6: TreeView

`packages/ui/src/tree/TreeView.ts`

TreeView handles the DOM rendering of tree nodes. It reads from the TreeStore's flattened data to render visible rows.

### Responsibilities

1. **Row rendering**: Creates a `<tr>` for each visible node in the TreeStore's flatData.
2. **Virtual scrolling**: For trees with 1000+ visible nodes, only render the visible viewport + buffer. Use IntersectionObserver or scroll position calculations.
3. **Indentation**: Each node row has depth-based indentation. Use CSS `padding-left` or spacer spans.
4. **Elbow/line rendering**: For each indent level, render the correct connector line or elbow:
  - `x-tree-elbow`: L-shaped connector (last child at this depth)
  - `x-tree-elbow-line`: vertical line (not last child at this depth)
  - `x-tree-elbow-end`: last child terminator
  - `x-tree-elbow-empty`: blank spacer (parent was last child)
  - Calculate the correct elbow type by walking up ancestors and checking isLast
5. **Expander icon**: Non-leaf nodes get an expand/collapse arrow or +/- icon.
6. **Node icon**: Leaf nodes get a document icon; folder nodes get an open/closed folder icon. Customizable via `iconCls` and `icon` fields on the node.
7. **Checkbox**: If tree is checkable, render a checkbox element.
8. **Row events**: Click, double-click, context menu, mouse enter/leave, delegated to TreePanel.
9. **Row updates**: When a node's data changes, re-render just that row. When tree structure changes, re-render affected rows (not the entire tree).
10. **Animation**: Optionally animate expand/collapse by sliding child rows in/out.

### Methods

```typescript
getNode(record: NodeInterface): HTMLElement | null;
// Returns the <tr> element for the given record, or null if not rendered.

getRecord(node: HTMLElement): NodeInterface | null;
// Returns the record for the given row element.

refreshNode(record: NodeInterface): void;
// Re-renders a single row (e.g., after text change).

refresh(): void;
// Full re-render of all visible rows.

focusNode(record: NodeInterface): void;
// Sets focus to the row for the given record. Updates roving tabindex.

getNodeByEvent(event: Event): NodeInterface | null;
// Finds which record was targeted by a DOM event (via event delegation).

isExpanding(node: NodeInterface): boolean;
// Returns true if the node is currently in the middle of an expand animation.
```

### Tests for TreeView (write FIRST)

```
packages/ui/tests/tree/TreeView.test.ts
```

1. **Rendering**:
  - Renders correct number of rows matching flatData count
  - Each row has correct node text
  - Each row has correct depth indentation
  - Elbow/line elements correct for various tree shapes (only child, middle child, last child)
  - Leaf icon vs folder icon
  - Expand icon present on non-leaf, absent on leaf
  - Checkbox present when checkable

2. **Updates**:
  - Node text change → row text updates without full re-render
  - Node expand → child rows inserted at correct position
  - Node collapse → child rows removed
  - Node add → row inserted at correct position
  - Node remove → row removed
  - Store filter → rows update to match filtered set

3. **Virtual scrolling**:
  - With 10,000 nodes, only ~50 rows rendered (viewport + buffer)
  - Scrolling renders new rows and removes off-screen rows
  - getNode returns null for non-rendered nodes

4. **Focus**:
  - focusNode sets tabindex=0 on target row, -1 on all others
  - Focus visible indicator (CSS class or outline)

5. **Event delegation**:
  - Click on row fires itemclick with correct record
  - Click on expander expands/collapses (does NOT fire itemclick)
  - Click on checkbox toggles check (does NOT fire itemclick)
  - Double-click fires itemdblclick
  - Right-click fires itemcontextmenu

---

## Part 7: TreeColumn

`packages/ui/src/tree/TreeColumn.ts`

TreeColumn is a special column that renders the tree structure (indentation, expander, icon, text). It is always the first column in a tree.

```typescript
class TreeColumn extends Column {
  // Fixed configs
  dataIndex: string;                   // Bound to displayField (default 'text')
  sortable: boolean = true;

  // Renderer: produces the full cell content including:
  // 1. Indentation spacers (depth × indentSize pixels)
  // 2. Expander icon (for non-leaf) or blank spacer (for leaf)
  // 3. Checkbox (if tree is checkable)
  // 4. Node icon (customizable via iconCls/icon)
  // 5. Node text

  renderer(value: unknown, metaData: CellMetaData, record: NodeInterface, rowIndex: number, colIndex: number, store: TreeStore, view: TreeView): string;

  // Config
  indentSize: number = 20;            // Pixels per depth level (default 20)
}
```

### Tests for TreeColumn (write FIRST)

```
packages/ui/tests/tree/TreeColumn.test.ts
```

1. Renderer produces correct HTML structure
2. Indentation scales with depth and indentSize
3. Leaf node: no expander, leaf icon
4. Folder node: expander present, folder icon
5. Custom iconCls on node used instead of default
6. Checkbox rendered when tree is checkable
7. Node text matches record's displayField value
8. Sorting via TreeColumn header sorts tree

---

## Part 8: Tree Drag & Drop

### TreeDragZone

`packages/ui/src/tree/TreeDragZone.ts`

Makes tree nodes draggable.

```typescript
class TreeDragZone extends Draggable {
  // Configs
  tree: TreePanel;
  ddGroup: string;
  allowParentInserts: boolean;

  // Creates DragData containing:
  // - records: NodeInterface[] (the dragged nodes)
  // - source: this TreeDragZone
  // - tree: the owning TreePanel

  // Validation:
  // - Check node.allowDrag
  // - Don't allow dragging root
  // - Multi-select: drag all selected nodes if dragging a selected node

  // Ghost/proxy:
  // - Shows node text (or count if multiple)
  // - Follows cursor during drag
}
```

### TreeDropZone

`packages/ui/src/tree/TreeDropZone.ts`

Makes the tree a drop target.

```typescript
class TreeDropZone extends Droppable {
  // Configs
  tree: TreePanel;
  ddGroup: string;
  allowContainerDrops: boolean;
  appendOnly: boolean;
  sortOnDrop: boolean;
  expandDelay: number = 500;          // Auto-expand delay when hovering over a collapsed node

  // Drop position calculation:
  // Based on cursor position relative to node row:
  // - Top 25%: 'before' (insert above)
  // - Middle 50%: 'append' (add as child)
  // - Bottom 25%: 'after' (insert below)
  // - If appendOnly: always 'append'
  // - If node is leaf: 'before' or 'after' only (can't append to leaf)

  // Visual indicator:
  // - Line indicator for 'before'/'after' (horizontal line between rows)
  // - Highlight background for 'append'

  // Validation:
  // - Check target node.allowDrop
  // - Prevent dropping a node onto its own descendant (circular)
  // - Prevent dropping a node onto itself
  // - Fire 'nodedragover' on TreePanel for custom validation
  // - Fire 'beforedrop' for final validation

  // Auto-expand:
  // - When hovering over a collapsed non-leaf node for expandDelay ms, auto-expand it

  // On drop:
  // - Move (default): remove from old parent, insert at new position
  // - Copy: if Ctrl held during drop, copy instead of move
  // - Fire 'drop' event on TreePanel
  // - If sortOnDrop, sort the target parent's children
}
```

### TreeViewDragDrop Plugin

`packages/ui/src/tree/TreeViewDragDrop.ts`

A plugin that wires TreeDragZone and TreeDropZone to a TreePanel.

```typescript
class TreeViewDragDrop extends Plugin {
  // Config
  enableDrag: boolean = true;
  enableDrop: boolean = true;
  ddGroup: string = 'TreeDD';
  appendOnly: boolean = false;
  sortOnDrop: boolean = false;
  allowContainerDrops: boolean = false;
  expandDelay: number = 500;
  allowParentInserts: boolean = false;
  displayField: string = 'text';       // Field shown in drag ghost

  // On init(tree):
  // - Create TreeDragZone if enableDrag
  // - Create TreeDropZone if enableDrop
  // - Wire events

  // On destroy:
  // - Destroy drag/drop zones
}
```

### Tests for Tree Drag & Drop (write FIRST)

```
packages/ui/tests/tree/TreeDragDrop.test.ts
```

Simulate drag & drop using synthetic PointerEvents dispatched to DOM elements.

1. **Drag start**:
  - Pointer down + move beyond threshold starts drag
  - Ghost element appears with node text
  - Multi-select: drag ghost shows count
  - node.allowDrag=false prevents drag
  - Root node cannot be dragged

2. **Drop position**:
  - Hover top 25% of row → 'before' indicator
  - Hover middle 50% → 'append' indicator (highlight)
  - Hover bottom 25% → 'after' indicator
  - appendOnly: always 'append' regardless of position
  - Leaf node: no 'append', only 'before'/'after'

3. **Validation**:
  - Drop onto descendant of dragged node → rejected (no circular)
  - Drop onto self → rejected
  - node.allowDrop=false → rejected
  - beforedrop returning false → rejected

4. **Drop execution**:
  - 'before': node inserted at position above target
  - 'after': node inserted at position below target
  - 'append': node appended as child of target
  - Old parent's children updated (node removed)
  - New parent's children updated (node added)
  - All sibling pointers and indices correct after drop

5. **Auto-expand**:
  - Hovering over collapsed node for 500ms auto-expands it
  - Moving away cancels the expand timer

6. **Copy**:
  - Ctrl+drop copies instead of moves
  - Original node stays in place
  - New node has new ID

7. **Cross-tree**:
  - Same ddGroup: drag between two TreePanels
  - Different ddGroup: drop rejected

---

## Part 9: TreeSelectionModel

`packages/ui/src/selection/TreeSelectionModel.ts`

Extends RowSelectionModel with tree-specific behavior.

```typescript
class TreeSelectionModel extends RowSelectionModel {
  // Additional config
  pruneRemoved: boolean = true;        // Auto-deselect removed nodes (default true)

  // Override: when a selected node is collapsed, optionally deselect hidden descendants
  // Override: Shift+click range selection works with visible (flat) order, not tree order

  // Method: selectNode(node, keepExisting?, suppressEvent?)
  // Method: deselectNode(node, suppressEvent?)
  // Method: isNodeSelected(node): boolean

  // Tree-specific: when a parent is removed from the tree, all its selected
  // descendants are also deselected (if pruneRemoved=true).
}
```

### Tests for TreeSelectionModel

```
packages/ui/tests/tree/TreeSelectionModel.test.ts
```

1. Single select: clicking one node deselects previous
2. Multi-select: Ctrl+click adds nodes to selection
3. Shift+click: selects range in visible (flat) order
4. Collapsing a node with selected children: selected children remain selected but are not visible
5. pruneRemoved: removing a selected node deselects it
6. pruneRemoved: removing parent deselects selected descendants
7. selectionchange event fires
8. selectNode/deselectNode programmatic API
9. Expanding node restores visibility of selected children (selection indicators appear)

---

## Part 10: Integration Tests

`packages/ui/tests/tree/TreeIntegration.test.ts`

Write end-to-end tests that exercise the full tree system together.

### Scenarios to Test

1. **Build and render a static tree**:
  - Create TreeStore with inline nested data (3 levels)
  - Create TreePanel, render to jsdom
  - Verify correct DOM structure
  - Expand all, verify all nodes visible
  - Collapse all, verify only root visible (or nothing if rootVisible=false)

2. **Lazy-loading async tree**:
  - Create TreeStore with AjaxProxy (mock fetch)
  - Root has no inline children
  - Expand root → proxy called with node='root' → returns children
  - Expand child → proxy called with node=childId → returns grandchildren
  - Verify loading indicator shown during load
  - Verify tree structure after all expansions

3. **Checkbox tree with cascade**:
  - 3-level tree with cascadeChecks=true
  - Check root → all nodes checked
  - Uncheck one grandchild → its parent becomes indeterminate → root becomes indeterminate
  - Check the parent → all its children checked → root stays indeterminate (other branch unchecked)
  - getChecked() returns correct set

4. **Drag and drop reorder**:
  - Tree with 3 nodes at root level: A, B, C
  - Drag C before A → order becomes C, A, B
  - Verify store, flatData, and DOM all reflect new order

5. **Drag between parents**:
  - Drag leaf from parent1 to parent2
  - Verify parent1.childCount decremented
  - Verify parent2 has new child
  - Verify moved node's depth/parentId updated

6. **Filter tree**:
  - Apply filter to tree, verify matching nodes and their ancestors visible
  - Clear filter, verify all nodes restored
  - Filter + expand interaction: expanding a filtered node still respects filter

7. **Sort tree**:
  - Sort by text ascending → verify DOM order
  - folderSort: folders before files regardless of alpha order

8. **Keyboard navigation full flow**:
  - Focus tree, use arrow keys to navigate
  - Right arrow expands, down moves into children
  - Left arrow from child moves to parent
  - Enter selects, Space toggles checkbox
  - Verify focus and selection state after each key

9. **Add/remove nodes dynamically**:
  - Programmatically add node → appears in tree
  - Remove node → disappears from tree
  - Add node to collapsed parent → not visible until expanded

10. **Performance**:
  - Create tree with 10,000 nodes
  - Verify render completes in < 200ms (virtual scrolling)
  - Verify expandAll completes in < 500ms
  - Verify filter completes in < 100ms

11. **Memory leak check**:
  - Create and destroy 100 TreePanels
  - Use WeakRef to verify old instances are GC-eligible
  - Verify no event listener leaks (count listeners before/after)

---

## Implementation Notes

### General TypeScript Guidelines

- **Zero `any`**. Use `unknown` with type guards and narrowing.
- **Strict null checks**. Handle null/undefined explicitly.
- **Generic types** where they add value (e.g., `TreeStore<T extends Model & NodeInterface>`).
- **Readonly** where mutation is not intended.
- **Private** fields with `#` syntax where possible, `private` keyword for protected-accessible.
- **Destructuring** and modern syntax throughout.
- **No `arguments` object** — use rest params.
- **No `var`** — use `const` and `let`.
- **Template literals** over string concatenation.

### Event Implementation Pattern

```typescript
// Standard event firing pattern in tree code:
if (!suppressEvents) {
  const store = this.getTreeStore();
  if (store) {
    store.fireEvent('nodeappend', parentNode, childNode, index);
    store.fireEvent('datachanged');
    store.triggerRefresh(); // rebuilds flatData and fires 'refresh'
  }
}
```

### Pointer Update Pattern After Mutation

After any appendChild/insertBefore/removeChild, run this to fix up all pointers:

```typescript
private updateChildPointers(parent: NodeInterface): void {
  const children = parent.childNodes;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    child.set('index', i);
    child.set('isFirst', i === 0);
    child.set('isLast', i === children.length - 1);
    child.previousSibling = i > 0 ? children[i - 1] : null;
    child.nextSibling = i < children.length - 1 ? children[i + 1] : null;
  }
  parent.firstChild = children[0] ?? null;
  parent.lastChild = children[children.length - 1] ?? null;
}
```

### Recursive Depth Update Pattern

When a node is moved (reparented), update depth recursively:

```typescript
private updateDepthRecursive(node: NodeInterface, depth: number): void {
  node.set('depth', depth);
  for (const child of node.childNodes) {
    this.updateDepthRecursive(child, depth + 1);
  }
}
```

### Circular Reference Prevention

Before any move/insert operation, verify no circularity:

```typescript
private assertNotCircular(parent: NodeInterface, child: NodeInterface): void {
  if (parent === child) {
    throw new Error(`Cannot append a node to itself: ${child.getId()}`);
  }
  let current: NodeInterface | null = parent;
  while (current) {
    if (current === child) {
      throw new Error(
        `Cannot append node "${child.getId()}" to its own descendant "${parent.getId()}"`
      );
    }
    current = current.parentNode;
  }
}
```

---

## Deliverable Checklist

When you are done, verify:

- [ ] Every test file exists and runs (red → green)
- [ ] Every source file compiles with `tsc --noEmit` (zero errors)
- [ ] 90%+ code coverage on every file
- [ ] Zero use of `any` type
- [ ] Every public method has JSDoc with @param, @returns, @fires, @example
- [ ] Every component has correct ARIA attributes
- [ ] Keyboard navigation fully implemented
- [ ] All TreeStore events tested
- [ ] Integration tests pass
- [ ] Performance benchmarks pass (10k nodes)
- [ ] No memory leaks detected
- [ ] All files exported from their package's index.ts

Begin by writing ALL test files first (Parts 1–10 test files). Then implement all source files to make the tests pass. Show every file with complete content.
