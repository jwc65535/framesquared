# Prompt: Implement Complete TreeGrid Example Application Suite

You are working on **ext-ts**, a ground-up reimplementation of Sencha ExtJS in modern TypeScript with ESM modules. There is **no Internet Explorer support** — use any modern browser API freely.

The TreeGrid component and all its dependencies are **fully implemented and working**. Your task is to build a comprehensive **example application suite** in `examples/tree-grid/` that demonstrates every feature, serves as living documentation, and functions as a manual integration test surface.

These examples must be **runnable in a browser** with a dev server. They use the real ext-ts components — no mocks, no stubs. Every example must be a self-contained module that can be loaded individually or as part of the full showcase.

---

## Prerequisites (All Fully Implemented and Importable)

```typescript
// ─── Core ───
import { Base, Observable, Identifiable, ClassManager, define, generateId } from '@ext-ts/core';
import { apply, applyIf, clone, isObject, isString, isArray, isDefined } from '@ext-ts/core';

// ─── Data ───
import { Model, Store, TreeModel, TreeStore, NodeInterface } from '@ext-ts/data';
import { Collection, Sorter, Filter, Field } from '@ext-ts/data';
import { MemoryProxy, AjaxProxy, RestProxy } from '@ext-ts/data';
import { JsonReader, TreeReader, JsonWriter, TreeWriter } from '@ext-ts/data';
import { Operation, ResultSet } from '@ext-ts/data';

// ─── Component & Layout ───
import { Component, Container, XTemplate } from '@ext-ts/component';
import { FitLayout, HBoxLayout, VBoxLayout, BorderLayout, CardLayout } from '@ext-ts/layout';

// ─── UI ───
import { Panel, Window, MessageBox } from '@ext-ts/ui';
import { Grid, GridView, Column, NumberColumn, DateColumn, BooleanColumn } from '@ext-ts/ui';
import { CheckColumn, ActionColumn, TemplateColumn, WidgetColumn, RowNumbererColumn } from '@ext-ts/ui';
import { HeaderContainer, SelectionModel, RowSelectionModel, CellSelectionModel } from '@ext-ts/ui';
import { Toolbar, Button, SplitButton, SegmentedButton } from '@ext-ts/ui';
import { Menu, MenuItem, CheckItem, Separator as MenuSeparator } from '@ext-ts/ui';
import { Tooltip } from '@ext-ts/ui';
import { TabPanel } from '@ext-ts/ui';
import { Viewport } from '@ext-ts/ui';

// ─── TreeGrid (the component we're demonstrating) ───
import { TreeGrid } from '@ext-ts/ui';
import { TreeGridView } from '@ext-ts/ui';
import { TreeGridColumn } from '@ext-ts/ui';
import { TreeGridDragDrop } from '@ext-ts/ui';
import { TreeGridCellEditing } from '@ext-ts/ui';
import { TreeGridRowEditing } from '@ext-ts/ui';
import { TreeGridClipboard } from '@ext-ts/ui';
import { TreeGridSummary } from '@ext-ts/ui';
import { TreeGridGroupingSummary } from '@ext-ts/ui';
import { TreeGridRowExpander } from '@ext-ts/ui';
import { TreeGridFilterPlugin } from '@ext-ts/ui';
import { TreeGridStateMixin } from '@ext-ts/ui';
import { TreeGridLockable } from '@ext-ts/ui';
import { TreeGridSelectionModel } from '@ext-ts/ui';
import { TreeGridExporter } from '@ext-ts/ui';

// ─── Form ───
import { FormPanel, TextField, NumberField, DateField, ComboBox } from '@ext-ts/form';
import { Checkbox, TextArea, DisplayField, Slider } from '@ext-ts/form';

// ─── Drag & Drop ───
import { Draggable, Droppable, DragData } from '@ext-ts/dd';

// ─── FX ───
import { Animation, Anim } from '@ext-ts/fx';

// ─── Theme ───
import { ThemeManager, Theme } from '@ext-ts/theme';

// ─── App ───
import { Application, ViewController, ViewModel, Router } from '@ext-ts/app';
```

---

## Project Structure

```
examples/tree-grid/
├── index.html                           — Main entry: showcase shell with navigation
├── index.ts                             — Boots the showcase Application
├── shared/
│   ├── ExamplePanel.ts                  — Wrapper component: example + source code + description
│   ├── SourceViewer.ts                  — Syntax-highlighted source code panel
│   ├── ControlBar.ts                    — Toggle/config controls that live alongside examples
│   ├── DataGenerator.ts                 — Generates realistic sample data for all examples
│   ├── MockServer.ts                    — Fake REST API for async examples (intercepts fetch)
│   ├── SampleData.ts                    — Static sample datasets
│   └── styles.css                       — Shared example styles
├── examples/
│   ├── 01-basic/
│   │   ├── BasicTreeGrid.ts            — Simplest possible TreeGrid
│   │   └── description.md
│   ├── 02-columns/
│   │   ├── MultiColumnTree.ts          — Multiple column types
│   │   └── description.md
│   ├── 03-async-loading/
│   │   ├── AsyncTreeGrid.ts            — Lazy-loading from REST API
│   │   └── description.md
│   ├── 04-checkbox/
│   │   ├── CheckboxTreeGrid.ts         — Checkbox tree with cascade
│   │   └── description.md
│   ├── 05-editing/
│   │   ├── CellEditingTreeGrid.ts      — Inline cell editing
│   │   ├── RowEditingTreeGrid.ts        — Row-level editing
│   │   └── description.md
│   ├── 06-drag-drop/
│   │   ├── ReorderTreeGrid.ts          — Drag-and-drop reorder within tree
│   │   ├── CrossTreeDrag.ts            — Drag between two TreeGrids
│   │   └── description.md
│   ├── 07-sorting-filtering/
│   │   ├── SortableTreeGrid.ts         — Column sorting with folderSort
│   │   ├── FilterableTreeGrid.ts       — Column filters on tree data
│   │   └── description.md
│   ├── 08-selection/
│   │   ├── SelectionTreeGrid.ts        — Single, multi, range, checkbox selection
│   │   └── description.md
│   ├── 09-locked-columns/
│   │   ├── LockedTreeGrid.ts           — Frozen tree column + scrollable data columns
│   │   └── description.md
│   ├── 10-summary/
│   │   ├── SummaryTreeGrid.ts          — Footer summary row
│   │   ├── GroupingSummaryTreeGrid.ts   — Per-parent summary rows
│   │   └── description.md
│   ├── 11-row-expander/
│   │   ├── RowExpanderTreeGrid.ts      — Detail view below each node
│   │   └── description.md
│   ├── 12-clipboard/
│   │   ├── ClipboardTreeGrid.ts        — Copy/paste with hierarchy
│   │   └── description.md
│   ├── 13-state/
│   │   ├── StatefulTreeGrid.ts         — Persistent state across page reloads
│   │   └── description.md
│   ├── 14-export/
│   │   ├── ExportTreeGrid.ts           — Export to CSV, JSON, XLSX
│   │   └── description.md
│   ├── 15-theming/
│   │   ├── ThemedTreeGrid.ts           — Theme switching demonstration
│   │   └── description.md
│   ├── 16-large-dataset/
│   │   ├── LargeTreeGrid.ts            — 100,000 nodes, virtual scrolling
│   │   └── description.md
│   ├── 17-file-explorer/
│   │   ├── FileExplorer.ts             — Full file explorer application
│   │   ├── FileExplorerController.ts
│   │   ├── FileExplorerModel.ts
│   │   └── description.md
│   ├── 18-project-planner/
│   │   ├── ProjectPlanner.ts           — Full project management application
│   │   ├── ProjectPlannerController.ts
│   │   ├── TaskModel.ts
│   │   └── description.md
│   ├── 19-org-chart/
│   │   ├── OrgChart.ts                 — Organizational chart with editable structure
│   │   ├── OrgChartController.ts
│   │   ├── EmployeeModel.ts
│   │   └── description.md
│   ├── 20-accessibility/
│   │   ├── AccessibleTreeGrid.ts       — Full keyboard + screen reader demonstration
│   │   └── description.md
│   └── 21-kitchen-sink/
│       ├── KitchenSink.ts              — Every feature enabled simultaneously
│       └── description.md
├── vite.config.ts                       — Vite dev server configuration
├── tsconfig.json                        — TypeScript config for examples
└── package.json                         — Dependencies and scripts
```

---

## Deliverables — Every File in Full

### File: `examples/tree-grid/package.json`

```json
{
  "name": "@ext-ts/examples-tree-grid",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@ext-ts/core": "workspace:*",
    "@ext-ts/data": "workspace:*",
    "@ext-ts/component": "workspace:*",
    "@ext-ts/layout": "workspace:*",
    "@ext-ts/ui": "workspace:*",
    "@ext-ts/form": "workspace:*",
    "@ext-ts/dd": "workspace:*",
    "@ext-ts/fx": "workspace:*",
    "@ext-ts/theme": "workspace:*",
    "@ext-ts/app": "workspace:*"
  },
  "devDependencies": {
    "vite": "^6.x",
    "typescript": "^5.x"
  }
}
```

### File: `examples/tree-grid/vite.config.ts`

Standard Vite config resolving the workspace packages, serving from the examples root, with HMR enabled. Configure `resolve.alias` to map `@ext-ts/*` to the monorepo source directories so examples run against unbuilt source for fast iteration.

### File: `examples/tree-grid/tsconfig.json`

Extends the root tsconfig, targets ES2022, module ES2022, includes `src/**/*.ts` and `examples/**/*.ts`, path aliases for `@ext-ts/*`.

---

## File: `examples/tree-grid/index.html`

The main HTML shell for the showcase. This is a single-page application with a sidebar navigation listing all 21 examples and a content area that renders the selected example.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ext-ts TreeGrid Examples</title>
  <link rel="stylesheet" href="./shared/styles.css">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./index.ts"></script>
</body>
</html>
```

Design the page with a clean, modern aesthetic:
- Dark sidebar (240px wide) with a list of example names, grouped into categories (Basics, Features, Plugins, Real-World Apps, Advanced)
- Each example name is a clickable link that loads the example in the main content area
- The main content area has a split layout:
  - **Top** (70%): the rendered example (live component)
  - **Bottom** (30%): tabbed panel with tabs for "Description" (from description.md), "Source Code" (syntax-highlighted), and "Controls" (runtime configuration toggles)
- A header bar with the ext-ts logo/title and a theme switcher dropdown (Classic, Modern, Dark)
- The currently selected example is highlighted in the sidebar
- URL hash routing: `#basic`, `#columns`, `#async-loading`, etc. — allows deep-linking to any example
- Responsive: on narrow screens, sidebar collapses to a hamburger menu

---

## File: `examples/tree-grid/index.ts`

Boot the showcase application. Create a `Viewport` with `BorderLayout`:
- **west** region: Navigation panel (sidebar) with the example list
- **center** region: `ExamplePanel` that loads the selected example
- Configure `Router` for hash-based navigation between examples
- Register all 21 examples in a registry
- On app launch, load the example from the URL hash, or default to example 01

---

## File: `examples/tree-grid/shared/DataGenerator.ts`

A utility class that generates realistic, diverse sample datasets on the fly. Every dataset function returns data in the format `TreeStore` expects (nested objects with `children` arrays).

```typescript
export class DataGenerator {

  static fileSystem(options?: {
    depth?: number;          // Max nesting depth. Default: 4
    breadth?: number;        // Children per folder. Default: 5
    totalNodes?: number;     // Approximate total. Default: 200
    includeHidden?: boolean; // Include .dotfiles. Default: false
  }): TreeNodeData[];
  // Generates a realistic file system tree:
  // Root folders: Documents, Pictures, Music, Downloads, Projects, Desktop
  // Each contains subfolders and files with realistic names.
  // Files have: name, extension, size (bytes), modified (Date), type (MIME), permissions
  // Folders have: name, modified, itemCount
  // File names drawn from realistic pools:
  //   Documents: report-q3.pdf, meeting-notes.docx, budget-2025.xlsx, presentation.pptx, readme.md, ...
  //   Pictures: vacation-001.jpg, screenshot-2025-03-15.png, profile-photo.heic, ...
  //   Music: song-title.mp3, album-track-01.flac, podcast-episode-42.m4a, ...
  //   Projects: index.ts, package.json, tsconfig.json, README.md, .gitignore, src/, dist/, node_modules/, ...
  // Extensions mapped to icons: .pdf → pdf-icon, .ts → typescript-icon, .jpg → image-icon, etc.
  // Size ranges: documents 10KB-50MB, images 500KB-30MB, music 3MB-100MB, code 100B-500KB

  static projectPlan(options?: {
    phases?: number;         // Number of phases. Default: 4
    tasksPerPhase?: number;  // Tasks per phase. Default: 6
    subtaskDepth?: number;   // Subtask nesting. Default: 2
  }): TreeNodeData[];
  // Generates a software project plan:
  // Level 0: Project ("E-Commerce Platform Rebuild")
  // Level 1: Phase ("Phase 1: Planning", "Phase 2: Design", "Phase 3: Implementation", "Phase 4: Launch")
  // Level 2: Task ("Define Requirements", "Create Wireframes", "Set Up CI/CD", ...)
  // Level 3: Subtask ("Interview Stakeholders", "Document User Stories", ...)
  // Fields per task:
  //   name, assignee (realistic names from a pool), status (Not Started|In Progress|Completed|Blocked|Review),
  //   priority (Critical|High|Medium|Low), estimatedHours (1-80), actualHours (0-estimatedHours×1.3),
  //   startDate, endDate, percentComplete (0-100), dependencies (IDs of other tasks),
  //   notes (short text), tags (array: ["frontend", "backend", "design", "devops", "testing"])
  // Assignee pool: 15+ realistic names (diverse, international)
  // Status distribution: 30% Completed, 25% In Progress, 20% Not Started, 15% Review, 10% Blocked
  // Dates: realistic ranges over a 6-month span starting from today
  // Hours: subtasks sum roughly to parent task's estimate

  static organization(options?: {
    departments?: number;    // Default: 6
    teamsPerDept?: number;   // Default: 3
    membersPerTeam?: number; // Default: 8
  }): TreeNodeData[];
  // Generates an organizational hierarchy:
  // Level 0: Company ("Acme Corporation")
  // Level 1: Department ("Engineering", "Product", "Design", "Marketing", "Sales", "Operations")
  // Level 2: Team ("Frontend Team", "Backend Team", "Mobile Team", ...)
  // Level 3: Person
  // Fields per person:
  //   name (full name, diverse international names), title ("Senior Engineer", "Product Manager", ...),
  //   email (derived from name @acme.com), phone, location ("San Francisco", "London", "Tokyo", "Remote"),
  //   hireDate, salary (range by title seniority), isManager (boolean),
  //   skills (array: ["TypeScript", "React", "Python", ...]), performanceRating (1-5)
  // Department heads are isManager=true
  // Team leads are isManager=true
  // Salaries: realistic ranges by title ($60K-$300K)
  // Locations weighted: 40% SF, 20% London, 15% Tokyo, 25% Remote

  static categoryTree(options?: {
    categories?: number;
    subcategories?: number;
    items?: number;
  }): TreeNodeData[];
  // Generates a product category tree (like an e-commerce taxonomy):
  // Electronics → Computers → Laptops, Desktops, Tablets
  // Electronics → Phones → Smartphones, Feature Phones
  // Clothing → Men's → Shirts, Pants, Shoes
  // Clothing → Women's → Dresses, Tops, Accessories
  // Each leaf item has: name, sku, price, stock, rating, reviewCount

  static largeDataset(totalNodes: number, maxDepth?: number, maxChildren?: number): TreeNodeData[];
  // Generates a synthetic tree of arbitrary size for performance testing.
  // Nodes have: id (sequential), text ("Node {id}"), value (random 0-1000),
  //   score (random 0-100), active (random boolean), created (random date in last year)
  // Tree shape: random branching within maxDepth and maxChildren constraints.
  // Fast generation: should produce 100,000 nodes in < 500ms.
}
```

---

## File: `examples/tree-grid/shared/MockServer.ts`

A fake REST API that intercepts `fetch()` calls and returns tree data with realistic latency. Used by async-loading examples.

```typescript
export class MockServer {

  static install(): void;
  // Overrides globalThis.fetch with an interceptor.
  // Any fetch to URLs matching the patterns below returns mock data.
  // All other fetch calls pass through to the real fetch.

  static uninstall(): void;
  // Restores the original fetch.

  // ─── Endpoints ───

  // GET /api/files?node={parentId}
  // Returns children of the given node in the file system tree.
  // Root (node=root): returns top-level folders.
  // Folder (node=folder-id): returns that folder's children.
  // Latency: 200-600ms random delay to simulate network.
  // Response format:
  // {
  //   "success": true,
  //   "children": [
  //     { "id": "...", "text": "...", "leaf": true/false, "size": ..., "modified": "..." },
  //     ...
  //   ],
  //   "total": 5
  // }

  // GET /api/tasks?node={parentId}
  // Returns children of a project plan node.
  // Same response format with task-specific fields.

  // GET /api/org?node={parentId}
  // Returns children of an organization node.

  // POST /api/files  — Create file/folder
  // PUT /api/files/{id}  — Update file/folder
  // DELETE /api/files/{id}  — Delete file/folder
  // All CRUD operations update the in-memory dataset and return success/failure.

  // GET /api/files/search?q={query}
  // Full-text search across all file names. Returns flat array of matching nodes
  // with their ancestor paths for tree reconstruction.

  // Configurable options:
  static setLatency(min: number, max: number): void;
  // Set the artificial latency range in ms.

  static setFailureRate(rate: number): void;
  // Set the probability (0-1) of a request failing with a 500 error.
  // Default: 0. Set to 0.1 to test error handling.

  static getRequestLog(): RequestLogEntry[];
  // Returns a log of all intercepted requests (method, url, params, timestamp, latency).
  // Useful for the "Network" tab in the example controls.
}
```

---

## File: `examples/tree-grid/shared/SampleData.ts`

Pre-generated static datasets for examples that don't need dynamic generation. Export as plain objects:

```typescript
export const smallFileSystem: TreeNodeData[];    // ~30 nodes, 3 levels
export const mediumFileSystem: TreeNodeData[];   // ~200 nodes, 4 levels
export const smallProjectPlan: TreeNodeData[];   // ~40 tasks, 3 levels
export const smallOrganization: TreeNodeData[];  // ~50 people, 3 levels
export const productCategories: TreeNodeData[];  // ~60 items, 3 levels
```

Each dataset must be fully fleshed out with realistic, diverse data — not placeholder "Item 1", "Item 2" text. Use real-sounding names, dates, numbers, and descriptions.

---

## File: `examples/tree-grid/shared/ExamplePanel.ts`

A wrapper component that hosts each example with consistent framing.

```typescript
class ExamplePanel extends Panel {
  // Config:
  //   title: string — example name
  //   description: string — markdown description (rendered as HTML)
  //   sourceCode: string — the example's source code (displayed in SourceViewer)
  //   example: Component — the actual example component
  //   controls?: Component — optional ControlBar for runtime toggles
  //
  // Layout: BorderLayout
  //   center: The example component (the live TreeGrid)
  //   south (collapsible, 30% height): TabPanel with tabs:
  //     "Description" tab: rendered markdown
  //     "Source" tab: syntax-highlighted TypeScript source
  //     "Controls" tab: ControlBar (if provided)
  //     "Events" tab: live event log showing events fired by the TreeGrid
  //     "Data" tab: JSON view of the current tree data (auto-updates on change)
  //
  // The Events tab shows a scrolling log of events as they fire:
  //   [12:34:56.789] nodeexpand — Node: "Documents" (id: 3), Children: 5
  //   [12:34:57.123] itemclick — Node: "report.pdf" (id: 7), Column: "name"
  //   [12:34:58.456] checkchange — Node: "Pictures" (id: 4), Checked: true
  //   Maximum 200 entries, oldest removed when exceeded.
  //   Clear button to reset the log.
  //   Filter input to filter events by name.
  //
  // The Data tab shows the tree serialized as indented JSON with:
  //   - Syntax highlighting (keys blue, strings green, numbers orange, booleans purple)
  //   - Collapsible JSON nodes
  //   - Auto-refresh when tree data changes (debounced 500ms)
  //   - Copy button to copy JSON to clipboard
}
```

---

## File: `examples/tree-grid/shared/ControlBar.ts`

A reusable panel for runtime configuration controls.

```typescript
class ControlBar extends Panel {
  // Renders a set of controls that modify the example at runtime.
  // Each control is defined as:
  //   { type: 'checkbox', label: 'Show Lines', field: 'lines', value: false }
  //   { type: 'checkbox', label: 'Use Arrows', field: 'useArrows', value: true }
  //   { type: 'number', label: 'Indent Size', field: 'indentSize', value: 20, min: 10, max: 50 }
  //   { type: 'select', label: 'Selection Mode', field: 'selMode', options: ['SINGLE','MULTI','SIMPLE'], value: 'SINGLE' }
  //   { type: 'button', label: 'Expand All', handler: fn }
  //   { type: 'button', label: 'Collapse All', handler: fn }
  //   { type: 'slider', label: 'Row Height', field: 'rowHeight', value: 28, min: 20, max: 60 }
  //   { type: 'text', label: 'Filter Text', field: 'filterText', value: '' }
  //   { type: 'color', label: 'Highlight Color', field: 'highlightColor', value: '#ffeb3b' }
  //
  // When a control changes, fires 'controlchange' event with { field, value }.
  // The example listens and applies the change to the TreeGrid.
  //
  // Layout: wrapping horizontal flow, controls are compact form fields with labels.
  // Grouped with titled fieldsets.
}
```

---

## Example 01: Basic TreeGrid

`examples/examples/01-basic/BasicTreeGrid.ts`

**The simplest possible TreeGrid.** This is the first thing a developer sees — it must be clean, understandable, and demonstrate the core concept in minimal code.

### Specification

- **Data**: `smallFileSystem` dataset (30 nodes, 3 levels deep)
- **Columns**:
  1. TreeGridColumn — `text: 'Name'`, `dataIndex: 'text'`, `flex: 2`
  2. Column — `text: 'Size'`, `dataIndex: 'size'`, `width: 100`, renderer that formats bytes (1024 → "1 KB", 1048576 → "1 MB", etc.)
  3. DateColumn — `text: 'Modified'`, `dataIndex: 'modified'`, `width: 150`, `format: 'MMM d, yyyy'`
- **Config**: `rootVisible: false`, `useArrows: true`, `animate: true`
- **No plugins, no features** — just the bare TreeGrid
- **Height**: 500px, width: 100% of container
- **Title**: "File Browser"
- Top-level folders start collapsed. User clicks to expand.

### Controls

- Checkbox: "Root Visible" — toggles `rootVisible` and refreshes
- Checkbox: "Use Arrows" — switches between arrows and +/- icons
- Checkbox: "Show Lines" — toggles tree connector lines
- Checkbox: "Animate" — toggles expand/collapse animation
- Number: "Indent Size" — slider from 10 to 50 pixels
- Button: "Expand All"
- Button: "Collapse All"

### Source Code Display

Show the MINIMAL code needed to create this TreeGrid. The source should look like something a developer would copy-paste as a starting point:

```typescript
import { TreeGrid, TreeGridColumn, Column, DateColumn, TreeStore } from '@ext-ts/ui';

const store = new TreeStore({
  root: {
    expanded: true,
    children: [
      { text: 'Documents', leaf: false, children: [
        { text: 'report-q3.pdf', leaf: true, size: 245760, modified: '2025-03-01' },
        { text: 'meeting-notes.docx', leaf: true, size: 32768, modified: '2025-03-10' },
      ]},
      { text: 'Pictures', leaf: false, children: [
        { text: 'vacation-001.jpg', leaf: true, size: 4194304, modified: '2025-02-15' },
      ]},
      // ...
    ]
  }
});

const treeGrid = new TreeGrid({
  title: 'File Browser',
  store,
  rootVisible: false,
  useArrows: true,
  columns: [
    { xtype: 'treegridcolumn', text: 'Name', dataIndex: 'text', flex: 2 },
    { text: 'Size', dataIndex: 'size', width: 100, renderer: formatFileSize },
    { xtype: 'datecolumn', text: 'Modified', dataIndex: 'modified', width: 150, format: 'MMM d, yyyy' },
  ],
  renderTo: document.getElementById('example-container'),
  height: 500,
});
```

---

## Example 02: Multi-Column Tree

`examples/examples/02-columns/MultiColumnTree.ts`

Demonstrates all column types working within a TreeGrid.

### Specification

- **Data**: `smallProjectPlan` dataset (40 tasks, 3 levels)
- **Columns**:
  1. TreeGridColumn — `text: 'Task'`, `dataIndex: 'name'`, `flex: 2`
  2. Column — `text: 'Assignee'`, `dataIndex: 'assignee'`, `width: 130`
  3. Column — `text: 'Status'`, `dataIndex: 'status'`, `width: 110`, custom renderer with color-coded badge:
    - Not Started → gray badge
    - In Progress → blue badge
    - Completed → green badge
    - Blocked → red badge
    - Review → orange badge
  4. NumberColumn — `text: 'Est. Hours'`, `dataIndex: 'estimatedHours'`, `width: 90`, `format: '0.0'`
  5. NumberColumn — `text: 'Actual Hours'`, `dataIndex: 'actualHours'`, `width: 90`, `format: '0.0'`
  6. WidgetColumn — `text: 'Progress'`, `dataIndex: 'percentComplete'`, `width: 140`, renders a progress bar component in each cell:
    - 0-33%: red bar
    - 34-66%: yellow bar
    - 67-99%: blue bar
    - 100%: green bar with checkmark
  7. DateColumn — `text: 'Start'`, `dataIndex: 'startDate'`, `width: 110`, `format: 'MMM d'`
  8. DateColumn — `text: 'End'`, `dataIndex: 'endDate'`, `width: 110`, `format: 'MMM d'`
  9. Column — `text: 'Priority'`, `dataIndex: 'priority'`, `width: 80`, custom renderer with icon:
    - Critical → red flag icon
    - High → orange up-arrow
    - Medium → yellow dash
    - Low → green down-arrow

- **Config**: `rootVisible: false`, `folderSort: true`
- **Title**: "Project Plan"

### Controls

- Checkbox: "Folder Sort" — non-leaf tasks sorted before leaf tasks
- Select: "Column visibility" — multi-select dropdown to hide/show columns
- Button: "Auto-size Columns" — auto-fits column widths to content

---

## Example 03: Async Loading

`examples/examples/03-async-loading/AsyncTreeGrid.ts`

Demonstrates lazy-loading children from a REST API on expand.

### Specification

- **Data source**: MockServer (`GET /api/files?node={id}`)
- **Store**: TreeStore with AjaxProxy pointing to `/api/files`
- **Root**: Starts with an empty root node (no inline children). Expanding root triggers the first API call.
- **Columns**: Name, Size, Modified, Type (same as basic example but with a Type column)
- **Behavior**:
  - Initially shows only the root or top-level skeleton
  - Clicking expand on a folder → shows a loading spinner in the tree column → after 200-600ms → children appear
  - Already-loaded nodes expand instantly (no re-fetch)
  - Error handling: if MockServer.setFailureRate(0.1), show an error tooltip on the node and a retry button
- **Loading indicator**: The tree column shows a small spinning indicator replacing the folder icon while children are loading
- **Title**: "Lazy-Loading File Browser"

### Controls

- Slider: "Latency (ms)" — adjusts MockServer latency (50-2000ms)
- Slider: "Failure Rate" — adjusts MockServer failure rate (0-50%)
- Button: "Reload Tree" — clears tree and re-fetches root
- TextField: "Expand Path" — input a path like "/Documents/Reports" and click "Go" to expandPath
- Display: "API Calls" — shows count of fetch calls made
- Display: "Total Nodes Loaded" — shows total nodes in store

### Extra Features

- Show a "Network Log" panel below the controls that displays each API request:
  ```
  GET /api/files?node=root → 200 OK (342ms) — 6 items
  GET /api/files?node=3    → 200 OK (187ms) — 4 items
  GET /api/files?node=5    → 500 Error (412ms) — retry available
  ```

---

## Example 04: Checkbox Tree

`examples/examples/04-checkbox/CheckboxTreeGrid.ts`

Demonstrates checkbox tree with tri-state cascade, multiple propagation modes, and practical use cases.

### Specification

- **Data**: A permissions/features tree:
  ```
  Application Features
  ├── ☑ User Management
  │   ├── ☑ Create Users
  │   ├── ☑ Edit Users
  │   ├── ☐ Delete Users
  │   └── ☑ View Users
  ├── ☐ Billing
  │   ├── ☐ View Invoices
  │   ├── ☐ Create Invoices
  │   └── ☐ Manage Subscriptions
  ├── ◪ Reports (indeterminate — some children checked)
  │   ├── ☑ View Reports
  │   ├── ☐ Create Reports
  │   └── ☑ Export Reports
  └── ☑ Settings
      ├── ☑ General Settings
      └── ☑ Security Settings
  ```
- **Columns**:
  1. TreeGridColumn — `text: 'Feature'`, `dataIndex: 'text'`, `flex: 2`
  2. Column — `text: 'Description'`, `dataIndex: 'description'`, `flex: 3`
  3. Column — `text: 'Risk Level'`, `dataIndex: 'riskLevel'`, `width: 100`, renderer with color badge
- **Config**: `checkable: true`, `cascadeChecks: true`, `rootVisible: false`
- **Title**: "Feature Permissions"
- **Footer toolbar**: Shows "X of Y features selected" dynamically updating as checks change

### Controls

- Select: "Propagation" — dropdown: 'both', 'up', 'down', 'none'
- Checkbox: "Only Leaf Checkable" — toggles `onlyLeafCheckable`
- Button: "Check All"
- Button: "Uncheck All"
- Button: "Get Checked" — opens a MessageBox listing all checked node names
- Button: "Get Checked Leaves" — same but only leaves
- Display: "Checked Count" — live count

### Behavior to Demonstrate

- Checking "User Management" checks all 4 children
- Unchecking "Create Users" changes "User Management" to indeterminate (◪)
- With propagation='down': checking parent cascades down, unchecking child does NOT bubble up
- With propagation='up': checking child bubbles up, checking parent does NOT cascade down
- With propagation='none': each checkbox is independent
- onlyLeafCheckable: parent nodes show read-only computed state, only leaves are interactive

---

## Example 05: Editing

`examples/examples/05-editing/CellEditingTreeGrid.ts`

Demonstrates inline cell editing in a TreeGrid.

### Specification

- **Data**: `smallProjectPlan` dataset
- **Columns**:
  1. TreeGridColumn — `text: 'Task'`, `dataIndex: 'name'`, `editor: { xtype: 'textfield', allowBlank: false }`
  2. Column — `text: 'Assignee'`, `dataIndex: 'assignee'`, `editor: { xtype: 'combobox', store: assigneeStore, displayField: 'name', valueField: 'name' }`
  3. Column — `text: 'Status'`, `dataIndex: 'status'`, `editor: { xtype: 'combobox', store: statusStore, editable: false }`
  4. NumberColumn — `text: 'Est. Hours'`, `dataIndex: 'estimatedHours'`, `editor: { xtype: 'numberfield', minValue: 0, maxValue: 500 }`
  5. NumberColumn — `text: 'Actual Hours'`, `dataIndex: 'actualHours'`, `editor: { xtype: 'numberfield', minValue: 0 }`
  6. DateColumn — `text: 'Start'`, `dataIndex: 'startDate'`, `editor: { xtype: 'datefield', format: 'Y-m-d' }`
  7. DateColumn — `text: 'End'`, `dataIndex: 'endDate'`, `editor: { xtype: 'datefield', format: 'Y-m-d' }`
- **Plugin**: `TreeGridCellEditing`
- **Config**: Double-click a cell to edit
- **Title**: "Editable Task Plan"
- **Toolbar**:
  - Button: "Add Task" — appends a new phantom task as child of selected node (or root)
  - Button: "Add Subtask" — appends child to selected node
  - Button: "Delete" — removes selected node (with confirmation MessageBox)
  - Button: "Save Changes" — logs modified records to console (demonstrates sync)
  - Button: "Reject Changes" — reverts all edits

### Behavior to Demonstrate

- Click cell → editor appears inline
- Tree column editing: editor appears over the text only, tree chrome stays visible
- Tab → moves to next editable cell (skips read-only cells)
- Enter → commits edit, moves to cell below
- Escape → cancels edit
- Validation: task name can't be blank (shows error indicator)
- ComboBox editor: dropdown appears with assignee/status options
- DateField editor: date picker appears
- After editing, modified cells/rows visually marked (e.g., italic text or colored indicator)
- "Add Task" creates a new row, immediately starts editing its name
- "Delete" removes with animation

### RowEditingTreeGrid.ts

Same dataset but with `TreeGridRowEditing` plugin:
- Double-click → entire row enters edit mode
- Update/Cancel buttons appear
- All fields editable simultaneously
- Tree chrome stays visible during edit

---

## Example 06: Drag and Drop

`examples/examples/06-drag-drop/ReorderTreeGrid.ts`

### Specification

- **Data**: `smallFileSystem` (30 nodes)
- **Config**: `enableDrag: true`, `enableDrop: true`, `animate: true`
- **Columns**: Name, Size, Modified
- **Title**: "Drag & Drop File Manager"

### Behavior to Demonstrate

- Drag a file from one folder to another → file moves
- Drag a folder into another folder → entire subtree moves
- Drop indicators:
  - Line above row: insert before (as sibling)
  - Highlighted row: append as child
  - Line below row: insert after (as sibling)
- Hover over collapsed folder for 500ms → auto-expands
- Drag to edges of scrollable area → auto-scrolls
- Ctrl+drag → copy instead of move (new node with new ID)
- Cannot drag root
- Cannot drop a folder into its own descendant (circular prevention shown with "not allowed" cursor)
- After drop, the moved node briefly highlights

### Controls

- Checkbox: "Append Only" — only allow dropping INTO folders, not between items
- Checkbox: "Allow Copy" — enable Ctrl+drag copy
- Checkbox: "Sort On Drop" — alphabetically sort siblings after drop
- Number: "Expand Delay" — ms before auto-expand (100-2000)
- Checkbox: "Allow Container Drops" — drop on empty area appends to root
- Display: "Last Action" — shows what happened ("Moved 'report.pdf' from 'Documents' to 'Projects'")

### CrossTreeDrag.ts

Two TreeGrids side by side (HBox layout, each flex: 1):
- **Left**: "Source Files" — file system tree
- **Right**: "Target Location" — initially empty tree with a root folder "Uploads"
- Same `ddGroup` — can drag from left to right
- Demonstrate:
  - Drag file from left tree → drops into right tree
  - Original remains in left tree (cross-tree defaults to copy)
  - Drag from right back to left also works
  - Different ddGroup example: change right tree's group → drops no longer work (shows "not allowed")

---

## Example 07: Sorting and Filtering

`examples/examples/07-sorting-filtering/SortableTreeGrid.ts`

### Specification

- **Data**: `smallProjectPlan` (40 tasks)
- **Columns**: Task (tree), Assignee, Status, Est. Hours, Actual Hours, Priority, Start Date
- **Config**: `sortableColumns: true`, `multiColumnSort: true`, `folderSort: true`
- **Title**: "Sortable Task Plan"
- **Plugin**: `TreeGridFilterPlugin`

### Behavior to Demonstrate

- Click "Assignee" header → sorts children within each parent alphabetically by assignee
- Click again → reverses
- Shift+click "Priority" → secondary sort by priority
- `folderSort: true` → phase/task groups always appear before leaf subtasks regardless of sort
- Column header shows sort indicator (arrow + number for multi-sort)
- Column header menu: Sort Ascending, Sort Descending, Columns submenu

### FilterableTreeGrid.ts

Same data with filters:
- Filter input in column header menu for each column
- Type "Design" in Assignee filter → only tasks assigned to people with "Design" in their name (and their ancestor phases/projects) visible
- Filter by Status: select "Blocked" → only blocked tasks visible
- Filter by Hours: range filter > 20 hours
- Filter by Date: date range filter
- `bottomup` mode: matching leaves AND all their ancestors shown
- Toggle to `topdown` mode: only matching nodes shown, children of non-matching parents hidden
- Clear individual filter vs Clear All Filters button
- Status bar shows "Showing X of Y tasks"

### Controls

- Select: "Filter Strategy" — bottomup / topdown
- Button: "Clear All Filters"
- Display: "Visible / Total" — live count

---

## Example 08: Selection Modes

`examples/examples/08-selection/SelectionTreeGrid.ts`

### Specification

- **Data**: `smallOrganization` (50 people)
- **Columns**: Name (tree), Title, Email, Location, Hire Date, Salary (NumberColumn)
- **Title**: "Team Directory"

### Controls

- Select: "Selection Mode" — SINGLE, SIMPLE, MULTI
- Checkbox: "Checkbox Select" — adds selection checkbox column
- Checkbox: "Deselect On Collapse" — deselects hidden descendants when parent collapses
- Button: "Select All"
- Button: "Deselect All"
- Button: "Select Children of Focused" — calls selectChildren on focused node
- Display: "Selected" — list of selected names, updating live

### Behavior to Demonstrate

- SINGLE: click selects one, deselects previous
- SIMPLE: click toggles without needing Ctrl
- MULTI: Ctrl+click adds, Shift+click ranges
- Range selection across tree depths (e.g., from a person in Engineering to a person in Marketing — selects all visible nodes between)
- checkboxSelect: separate checkbox column for selection (distinct from checkable tree checkbox)
- Collapse node with selected children → with deselectOnCollapse: they're deselected. Without: they stay selected but hidden; expanding restores visibility of selection highlight.
- Keyboard: Shift+Arrow extends selection

---

## Example 09: Locked Columns

`examples/examples/09-locked-columns/LockedTreeGrid.ts`

### Specification

- **Data**: `mediumFileSystem` (200 nodes)
- **Columns** (8 total — tree column + 7 data columns):
  1. TreeGridColumn — `text: 'Name'`, `locked: true`, `width: 250`
  2. Column — `text: 'Type'`, `locked: true`, `width: 80`
  3. NumberColumn — `text: 'Size'`, `width: 100`
  4. DateColumn — `text: 'Modified'`, `width: 150`
  5. Column — `text: 'Owner'`, `width: 120`
  6. Column — `text: 'Permissions'`, `width: 120`
  7. Column — `text: 'Path'`, `width: 300`
  8. BooleanColumn — `text: 'Hidden'`, `width: 80`
- **Config**: Locked columns enabled automatically (columns 1-2 locked)
- **Title**: "File System — Locked Columns"

### Behavior to Demonstrate

- Left panel (locked): tree column + Type column. Does NOT scroll horizontally.
- Right panel (normal): remaining 6 columns. Scrolls horizontally.
- Vertical scroll is synchronized between both panels.
- Expand/collapse in locked panel → rows appear/disappear in BOTH panels simultaneously.
- Draggable splitter between panels to resize locked area.
- Right-click column header → "Lock" moves column to locked panel. "Unlock" moves it back.
- Tree column cannot be unlocked (stays in locked panel always).

### Controls

- Button: "Lock 'Size'" — programmatically locks the Size column
- Button: "Unlock 'Type'" — programmatically unlocks the Type column
- Display: "Locked Columns" — list of currently locked column names

---

## Example 10: Summary Rows

`examples/examples/10-summary/SummaryTreeGrid.ts`

### Specification

- **Data**: `smallProjectPlan`
- **Columns**: Task (tree), Assignee, Status, Est. Hours (summaryType: 'sum'), Actual Hours (summaryType: 'sum'), Progress (summaryType: 'average')
- **Feature**: `TreeGridSummary` with position='bottom'
- **Title**: "Project Summary"

### Behavior to Demonstrate

- Bottom summary row shows total estimated hours, total actual hours, average progress
- Expand/collapse changes summary values (only visible nodes aggregated)
- `includeCollapsed: true` toggle: summary includes ALL nodes regardless of expand state

### GroupingSummaryTreeGrid.ts

Same data with `TreeGridGroupingSummary` feature:
- Each phase has a summary row after its last task
- Phase summary shows sum of hours and average progress for that phase's tasks
- Summary rows indented to match the task depth level
- Expand/collapse phase → summary row appears/disappears with children

### Controls

- Checkbox: "Include Collapsed Nodes" — toggles whether summary counts hidden nodes
- Select: "Summary Position" — top / bottom (for footer summary)
- Checkbox: "Show Grouping Summary" — toggles per-parent summary rows

---

## Example 11: Row Expander

`examples/examples/11-row-expander/RowExpanderTreeGrid.ts`

### Specification

- **Data**: `smallProjectPlan`
- **Columns**: Task (tree), Assignee, Status, Priority
- **Plugin**: `TreeGridRowExpander` with a detail template
- **Title**: "Task Details"

### Behavior to Demonstrate

- Each row has a small expand arrow on the far left (separate from the tree expander)
- Click the row expander → a detail panel slides open BELOW the task row, ABOVE any tree-children rows
- Detail panel shows:
  ```
  Task: {name}
  Description: {notes}
  Dependencies: {dependencies joined as comma list}
  Tags: {tags as colored pills}
  Start: {startDate} — End: {endDate}
  Estimated: {estimatedHours}h — Actual: {actualHours}h
  Progress: [=========>   ] 75%
  ```
- A task can be BOTH tree-expanded (showing subtasks) AND row-expanded (showing details) simultaneously
- Collapsing the tree parent also hides the row expander body
- singleRowExpand: only one detail panel open at a time

### Controls

- Checkbox: "Single Row Expand" — toggles whether only one detail view is open at a time
- Checkbox: "Expand on Double Click" — double-click toggles detail view

---

## Example 12: Clipboard

`examples/examples/12-clipboard/ClipboardTreeGrid.ts`

### Specification

- **Data**: `smallProjectPlan`
- **Columns**: Task (tree), Assignee, Status, Est. Hours, Actual Hours
- **Plugin**: `TreeGridClipboard`
- **Selection**: `CellSelectionModel` for spreadsheet-like selection
- **Title**: "Clipboard Integration"

### Behavior to Demonstrate

- Select cells → Ctrl+C → data copied as TSV to clipboard
- Show a "Clipboard Preview" panel below the grid displaying what was copied
- Paste into an empty TextArea to verify TSV format
- `copyHierarchy: true` → tree column includes indentation (leading spaces per depth level)
- Copy with hierarchy example:
  ```
  Phase 1: Planning
    Define Requirements    Alice    Not Started    40    0
    Create Wireframes      Bob      In Progress    24    12
  Phase 2: Design
    UI Mockups             Carol    Completed      32    35
  ```
- Select multiple rows across tree levels → copy preserves hierarchy
- Paste TSV into grid: new nodes created from pasted data

### Controls

- Checkbox: "Copy Hierarchy" — include indentation in tree column
- Checkbox: "Include Headers" — include column headers in copy
- Button: "Copy All" — copies entire visible tree to clipboard
- TextArea: "Paste Target" — paste here to see what was copied
- Display: "Last Copy" — shows row count and column count of last copy operation

---

## Example 13: State Persistence

`examples/examples/13-state/StatefulTreeGrid.ts`

### Specification

- **Data**: `mediumFileSystem`
- **Config**: `stateId: 'treegrid-state-demo'`, TreeGridStateMixin applied
- **Columns**: Name (tree, flex), Size, Modified, Type
- **Title**: "Stateful TreeGrid"

### Behavior to Demonstrate

1. Initial load: tree in default state (all collapsed, default column widths)
2. Interact: expand some nodes, resize a column, sort by Size, hide Modified column
3. Refresh the page (or click "Simulate Page Reload" button)
4. Tree restores: same nodes expanded, same column widths, same sort, Modified still hidden
5. Click "Clear State" → refresh → back to defaults

### Controls

- Button: "Simulate Page Reload" — destroys and re-creates the TreeGrid with same stateId
- Button: "Clear State" — removes state from localStorage
- Button: "Show Current State" — opens MessageBox with JSON of the current state
- Display: "State Size" — size of the serialized state in bytes
- Display: "Saved State Keys" — what's being persisted (expandedNodes, columnWidths, sort, ...)

---

## Example 14: Export

`examples/examples/14-export/ExportTreeGrid.ts`

### Specification

- **Data**: `smallProjectPlan`
- **Columns**: Task (tree), Assignee, Status, Est. Hours, Actual Hours, Start, End, Priority
- **Title**: "Export Demo"

### Controls

- Button: "Export CSV" → downloads `project-plan.csv`
- Button: "Export JSON" → downloads `project-plan.json` (nested with children)
- Button: "Export TSV" → downloads `project-plan.tsv`
- Button: "Export XLSX" → downloads `project-plan.xlsx` (with outline levels)
- Checkbox: "Expanded Only" → only export visible nodes
- Checkbox: "Include Headers" → include column headers
- Checkbox: "Include Indentation" → tree column has depth-based leading spaces
- Select: "Columns" — multi-select which columns to include
- Preview panel: shows first 20 lines of the export output before downloading

### Behavior to Demonstrate

- CSV: proper escaping of commas and quotes in values
- JSON: nested structure matching tree hierarchy
- XLSX: Excel row outline levels match tree depth (groups collapsible in Excel)
- "Expanded Only" vs "All Nodes" produce different outputs
- Preview updates live as checkboxes change

---

## Example 15: Theme Switching

`examples/examples/15-theming/ThemedTreeGrid.ts`

### Specification

- **Data**: `smallProjectPlan`
- **Columns**: Task (tree), Assignee, Status (with colored badges), Hours, Progress (widget column)
- **Title**: "Themed TreeGrid"

### Controls

- SegmentedButton: "Theme" — Classic | Modern | Dark
- Clicking each theme instantly re-themes the entire TreeGrid:
  - **Classic**: Light gray background, traditional icons, borders, slightly rounded corners, serif-influenced headers
  - **Modern**: Clean white background, flat design, no borders, large spacing, sans-serif, subtle shadows
  - **Dark**: Dark gray/black background, light text, neon-accent colors, thin borders
- Color pickers for customizing individual tokens:
  - Primary color
  - Background color
  - Text color
  - Row hover color
  - Selection color
- Display: "Current Theme" — name and token values

### Behavior to Demonstrate

- Theme switch is instant (no flicker, no re-render — CSS custom properties change)
- All TreeGrid elements adapt: headers, rows, tree chrome, expanders, checkboxes, icons, scrollbars, selection highlight, drag indicators
- Status badge colors adapt to theme (dark theme: lighter badge colors for readability)
- Progress bar colors adapt
- Focus indicators adapt (visible on both light and dark backgrounds)
- Row alternation (striping) adapts

---

## Example 16: Large Dataset

`examples/examples/16-large-dataset/LargeTreeGrid.ts`

### Specification

- **Data**: `DataGenerator.largeDataset(100_000, 8, 20)` — 100,000 nodes, max 8 levels deep, max 20 children per node
- **Columns**:
  1. TreeGridColumn — `text: 'Name'`, `dataIndex: 'text'`, `flex: 1`
  2. NumberColumn — `text: 'Value'`, `dataIndex: 'value'`, `width: 100`
  3. NumberColumn — `text: 'Score'`, `dataIndex: 'score'`, `width: 80`
  4. BooleanColumn — `text: 'Active'`, `dataIndex: 'active'`, `width: 70`
  5. DateColumn — `text: 'Created'`, `dataIndex: 'created'`, `width: 120`
- **Config**: virtual scrolling enabled, `height: 600`
- **Title**: "100K Nodes — Performance Demo"

### Behavior to Demonstrate

- Initial render is fast (< 200ms) — virtual scrolling only renders ~50 rows
- Scrolling is smooth (60fps) — rows recycle as user scrolls
- Expand/collapse is responsive even with thousands of visible nodes
- "Expand All" works (takes a few seconds for 100K but doesn't freeze the UI — show a progress bar)
- Filter 100K nodes → result appears within 100ms
- Sort 100K nodes → result appears within 200ms

### Controls

- Display: "Total Nodes" — 100,000
- Display: "Visible Nodes" — live count of flatData length (changes with expand/collapse)
- Display: "Rendered DOM Rows" — live count of `<tr>` elements in the DOM (should be ~50-100 regardless of total)
- Display: "Render Time" — ms for last render operation
- Display: "Scroll FPS" — live frames-per-second during scrolling
- Slider: "Dataset Size" — 1,000 / 10,000 / 50,000 / 100,000 / 500,000 — regenerates data
- Button: "Expand All" (with progress indicator)
- Button: "Collapse All"
- Button: "Expand To Depth 3" — expands all nodes up to depth 3
- Button: "Scroll to Random Node" — picks a random node, expands its path, scrolls to it
- TextField: "Filter" — live filter as you type (debounced 300ms)
- Display: "Memory Usage" — `performance.memory.usedJSHeapSize` if available

### Performance Overlay

Show a small semi-transparent overlay in the top-right corner of the TreeGrid with real-time metrics:
- FPS during scroll (updated per frame)
- DOM node count
- JS heap size
- Last operation timing

---

## Example 17: File Explorer Application

`examples/examples/17-file-explorer/FileExplorer.ts`

A **full application** simulating a file manager like macOS Finder or Windows Explorer, demonstrating TreeGrid as the centerpiece of a real-world application.

### Layout

```
┌──────────────────────────────────────────────────────┐
│  Toolbar: [New Folder] [Upload] [Delete] [Cut] ...   │
│  Breadcrumb: Home > Documents > Reports               │
├────────────┬─────────────────────────────────────────┤
│            │  Name  │ Size │ Modified │ Type │ Owner  │
│ Sidebar    │────────│──────│──────────│──────│────────│
│            │  ► Documents                             │
│ Favorites  │    ► Reports                             │
│  ★ Home    │      📄 Q3-Report.pdf  245KB  Mar 1     │
│  ★ Desktop │      📄 Q4-Report.pdf  312KB  Mar 15    │
│  ★ Docs    │    ► Presentations                      │
│            │  ► Pictures                              │
│ Devices    │  ► Music                                 │
│  💻 Macbook│  📄 readme.txt        1.2KB  Mar 20     │
│  ☁ iCloud  │                                         │
│            │                                         │
├────────────┴─────────────────────────────────────────┤
│  Status: 42 items, 3 selected — 1.2 MB total         │
└──────────────────────────────────────────────────────┘
```

### Components

- **Viewport** with BorderLayout
- **West** (200px, collapsible): Sidebar with:
  - "Favorites" section: clickable shortcuts that navigate the tree
  - "Devices" section: simulated device list
  - Sidebar is a simple tree (not a TreeGrid) or a list
- **Center**: TreeGrid with locked "Name" column and scrollable metadata columns
- **North**: Toolbar with action buttons + Breadcrumb showing current path
- **South**: Status bar showing item count, selection count, total size

### Features Used

- **Async loading**: MockServer serves file data lazily
- **Drag and drop**: Drag files between folders
- **Cell editing**: Rename files by double-clicking the name
- **Checkbox**: Multi-select via checkboxes for batch operations
- **Sorting**: Sort by any column
- **Filtering**: Search box in toolbar filters the tree
- **Context menu**: Right-click shows:
  - Open, Rename, Duplicate, Move to Trash
  - Copy Path, Properties (opens Window with details)
  - New Folder, New File (inside folders)
- **Keyboard shortcuts**:
  - `Cmd/Ctrl+N`: New folder
  - `Cmd/Ctrl+Backspace`: Delete
  - `Cmd/Ctrl+C / Cmd/Ctrl+V`: Copy/paste files
  - `Cmd/Ctrl+A`: Select all
  - `F2`: Rename
  - `Enter`: Open (expand folder or "open" file — shows a toast notification)
- **Breadcrumb**: Clicking a segment navigates (collapses to that level and selects)
- **Status bar**: Live updates: "42 items, 3 selected — 1.2 MB total"
- **Properties window**: Double-click or right-click → Properties opens a Window (modal) with:
  - File name, path, size, type, modified date, created date, permissions
  - Preview (for images: show a placeholder; for text: show first 100 characters)
  - "Apply" and "Cancel" buttons

### Controller

`FileExplorerController.ts` — ViewController managing:
- Navigation between folders (sidebar click → expand tree path + select)
- Breadcrumb sync (tree selection changes → breadcrumb updates)
- CRUD operations (create, rename, delete via MockServer)
- Clipboard (internal cut/copy/paste state)
- Search/filter

### Model

`FileExplorerModel.ts` — TreeModel with fields:
- `name` (String), `size` (Int), `modified` (Date), `created` (Date)
- `type` (String: 'folder', 'document', 'image', 'audio', 'video', 'code', 'archive')
- `extension` (String), `owner` (String), `permissions` (String: 'rwxr-xr-x')
- `mimeType` (String), `isHidden` (Boolean)

---

## Example 18: Project Planner Application

`examples/examples/18-project-planner/ProjectPlanner.ts`

A **full application** for managing a software project plan with tasks, assignments, time tracking, and progress.

### Layout

```
┌──────────────────────────────────────────────────────┐
│  Toolbar: [Add Phase] [Add Task] [Delete] [Save]     │
│  [Undo] [Redo] | View: [Table] [Board] | [Export ▼]  │
├──────────────────────────────────────────────────────┤
│  Task           │ Assignee │ Status  │ Hours │ Prog  │
│──────────────────│──────────│─────────│───────│───────│
│  ▼ Phase 1       │          │         │  120  │  75%  │
│    ▼ Design      │ Alice    │ ✅ Done │   40  │ 100%  │
│      Wireframes  │ Alice    │ ✅ Done │   16  │ 100%  │
│      Mockups     │ Bob      │ ✅ Done │   24  │ 100%  │
│    ▼ Implement   │          │ 🔵 WIP │   80  │  62%  │
│      Frontend    │ Carol    │ 🔵 WIP │   40  │  80%  │
│      Backend     │ Dave     │ 🔵 WIP │   40  │  45%  │
│  ► Phase 2       │          │         │  200  │  10%  │
│────────────────── Summary ─────────────────────────── │
│  Total           │          │         │  320  │  43%  │
├──────────────────────────────────────────────────────┤
│  Properties Panel (south, collapsible):               │
│  [Task Details] [Dependencies] [History]              │
│  Name: Frontend Implementation                        │
│  Assignee: Carol    Status: In Progress               │
│  Start: Mar 1       End: Apr 15                       │
│  Notes: [text area for notes]                         │
└──────────────────────────────────────────────────────┘
```

### Features Used

- **Row editing**: Edit task details inline
- **Grouping summary**: Each phase shows subtotals for hours and average progress
- **Footer summary**: Grand totals at the bottom
- **Checkbox**: Mark tasks as included/excluded from reports
- **Drag and drop**: Reorder tasks within phases, move tasks between phases
- **Column sorting**: Sort by any field within each phase
- **Filtering**: Filter by assignee, status, priority via toolbar ComboBoxes
- **State persistence**: Expanded nodes, column sizes, sort order remembered
- **Export**: Toolbar dropdown for CSV, JSON, XLSX export
- **Locked columns**: Task name column locked; other columns scroll
- **Widget column**: Progress bars rendered as real components
- **Action column**: Quick-action icons per row (edit, delete, mark complete)

### Properties Panel (South Region)

When a task is selected, the south panel shows:
- **Task Details tab**: FormPanel with fields for name, assignee, status, priority, dates, hours, notes
- **Dependencies tab**: List of dependent tasks (selectable from a ComboBox)
- **History tab**: Simulated changelog ("Mar 15: Status changed from 'Not Started' to 'In Progress' by Carol")

Editing in the properties panel updates the tree record live (two-way binding via ViewModel).

### Controller

`ProjectPlannerController.ts`:
- CRUD for phases, tasks, subtasks
- Undo/redo stack (tracks last 20 operations)
- Export actions
- Filter/search
- Progress recalculation (parent progress = weighted average of children by hours)
- Validation: end date must be after start date, hours must be positive

### Model

`TaskModel.ts` — TreeModel with fields:
- `name`, `assignee`, `status`, `priority`, `estimatedHours`, `actualHours`
- `percentComplete`, `startDate`, `endDate`, `notes`, `tags`, `dependencies`
- `includedInReport` (for checkbox)

---

## Example 19: Organizational Chart

`examples/examples/19-org-chart/OrgChart.ts`

A TreeGrid showing a company's organizational hierarchy.

### Layout

- TreeGrid fills the center
- Side panel (east, collapsible, 300px): employee profile card
- Toolbar: search, filter by department, filter by location

### TreeGrid Configuration

- **Data**: `DataGenerator.organization()` — ~150 people
- **Columns**:
  1. TreeGridColumn — `text: 'Name'`, custom innerRenderer showing avatar circle + name:
     ```
     [AJ] Alice Johnson
     ```
     Avatar circle has initials, colored by department (Engineering=blue, Design=purple, Marketing=green, etc.)
  2. Column — `text: 'Title'`, `width: 180`
  3. Column — `text: 'Location'`, `width: 120`, with flag emoji or icon
  4. Column — `text: 'Email'`, `width: 200`
  5. NumberColumn — `text: 'Team Size'`, `width: 80` (only for managers — shows count of direct reports)
  6. Column — `text: 'Skills'`, `width: 200`, renderer showing colored pill/tag badges
- **Config**: `rootVisible: true` (show CEO at top), `checkable: false`, `enableDrag: true`, `enableDrop: true` (reorganize)

### Profile Card (East Panel)

When a person is selected:
- Large avatar with initials and department color
- Full name, title, department, team
- Email (clickable mailto), phone
- Location with flag
- Hire date, tenure
- Skills as tags
- Performance rating as stars (★★★★☆)
- Direct reports listed
- Reports to (manager) with clickable link that navigates to that person

### Features

- Search: toolbar search field filters by name or title
- Filter by department: ComboBox
- Filter by location: ComboBox
- Drag person between teams: updates their department/team
- Click on "Reports to" in profile → navigates to that person in the tree (expandPath + select + scroll)
- Team Size column: managers show count, non-managers show dash
- Sort by name, title, or hire date within each level

### Controller

`OrgChartController.ts`:
- Profile card binding to selected node
- Search/filter actions
- Drag-drop reorganization
- Navigation between related people

---

## Example 20: Accessibility Demo

`examples/examples/20-accessibility/AccessibleTreeGrid.ts`

Explicitly demonstrates and documents the TreeGrid's accessibility features.

### Layout

- TreeGrid on the left (60%)
- Accessibility info panel on the right (40%)

### TreeGrid

- **Data**: `smallProjectPlan`
- **Columns**: Task (tree), Assignee, Status, Priority, Hours
- **Config**: `checkable: true`, selection mode MULTI
- All ARIA attributes fully populated

### Accessibility Info Panel

A live panel that shows what a screen reader would announce. Updated in real-time as the user interacts:

```
Current Focus:
  Role: treeitem
  Name: "Frontend Implementation"
  Level: 3 of 4
  Position: 2 of 5 (in set)
  Expanded: No (leaf)
  Selected: Yes
  Checked: Not checked

Last Announcement:
  "Frontend Implementation, tree item, level 3, 2 of 5,
   selected, not checked, row 8 of 15"

Keyboard Hint:
  ↑↓ Navigate rows | ←→ Expand/Collapse/Navigate columns
  Enter: Select | Space: Toggle check | F2: Edit
  Home/End: First/Last | Ctrl+A: Select all
```

### Features

- **ARIA attribute inspector**: highlights each aria-* attribute on the focused row
- **Keyboard shortcut reference**: always-visible panel listing all keyboard shortcuts
- **Focus indicator**: extra-visible focus ring (3px solid blue) for demo purposes
- **Screen reader simulation**: text log showing what would be announced
- **Tab order visualization**: numbered indicators showing the tab order through the page
- **High contrast mode**: toggle to test with high contrast colors
- **Focus trap indicator**: when in the grid, shows "Focus trapped in grid — Tab to exit"

### Controls

- Checkbox: "High Contrast Mode" — increases contrast ratios
- Checkbox: "Large Focus Ring" — extra-visible focus indicator
- Checkbox: "Show ARIA Attributes" — overlays aria attributes on DOM elements
- Button: "Run Accessibility Audit" — runs automated checks and reports issues:
  - Missing aria-label
  - Missing role
  - Insufficient contrast ratio
  - Keyboard traps
  - Missing focus indicators
- Display: "Issues Found" — count from last audit
- Display: "ARIA Coverage" — percentage of interactive elements with proper ARIA

---

## Example 21: Kitchen Sink

`examples/examples/21-kitchen-sink/KitchenSink.ts`

**Every feature enabled simultaneously** on a single TreeGrid. This is the stress test and the ultimate demo.

### Configuration

- **Data**: `mediumFileSystem` (200 nodes)
- **All features enabled**:
  - `checkable: true`, `cascadeChecks: true`
  - `enableDrag: true`, `enableDrop: true`
  - `sortableColumns: true`, `multiColumnSort: true`, `folderSort: true`
  - `lines: true`, `useArrows: true`, `animate: true`
  - `rootVisible: true`
  - Locked columns: Name and Type locked
  - Cell editing on all columns
  - Row expander with detail template
  - Summary row (footer)
  - Grouping summary (per-parent)
  - Column filters
  - State persistence
  - Clipboard
  - Export toolbar
  - Virtual scrolling
- **Columns**: Name (tree, locked), Type (locked), Size, Modified, Owner, Permissions, Path, Hidden (boolean)
- **Toolbar**: Every action button: Add, Delete, Expand All, Collapse All, Check All, Uncheck All, Export dropdown (CSV/JSON/XLSX), Save State, Clear State, Theme dropdown
- **Status bar**: Items count, selected count, checked count, total size
- **Title**: "Kitchen Sink — All Features"

### Controls

Master control panel with EVERY configurable option:

**Tree group**:
- Checkbox: Root Visible, Use Arrows, Show Lines, Animate, Single Expand, Folder Sort, Expand on DblClick

**Checkbox group**:
- Checkbox: Checkable, Cascade Checks
- Select: Check Propagation (both/up/down/none)
- Checkbox: Only Leaf Checkable

**Drag & Drop group**:
- Checkbox: Enable Drag, Enable Drop, Append Only, Sort On Drop, Allow Copy, Allow Container Drops
- Number: Expand Delay

**Selection group**:
- Select: Mode (SINGLE/SIMPLE/MULTI)
- Checkbox: Checkbox Select, Deselect On Collapse

**Columns group**:
- Number: Indent Size (10-50)
- Checkbox: Show Icons, Show Expanders
- Button: Auto-Size Columns

**Filter group**:
- Select: Filter Strategy (bottomup/topdown)
- Button: Clear All Filters

**Summary group**:
- Checkbox: Show Footer Summary, Show Grouping Summary, Include Collapsed

**Performance group**:
- Display: Total Nodes, Visible Nodes, DOM Rows, Render Time, Memory

**State group**:
- Button: Save State, Load State, Clear State, Show State JSON

Every control immediately applies to the TreeGrid. This demonstrates that all features can coexist without conflicts.

---

## File: `examples/tree-grid/shared/styles.css`

Comprehensive CSS for the example showcase. Design guidelines:

- Clean, professional appearance
- Consistent spacing using an 8px grid
- System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif`
- Color scheme: neutral grays for chrome, accent color for interactive elements
- Dark sidebar: `#1a1a2e` background, `#e0e0e0` text, `#0f3460` selected item
- Content area: white background, `#333` text
- Code blocks: `'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace`
- Responsive breakpoints: 768px (tablet), 1024px (desktop)
- Smooth transitions on all interactive elements
- Accessible: all interactive elements have visible focus indicators, minimum 4.5:1 contrast ratio
- Print styles: hide sidebar and controls when printing

Include styles for:
- Showcase shell (sidebar, header, content area)
- ExamplePanel (splitter, tab panel)
- ControlBar (form fields, fieldsets, buttons)
- SourceViewer (syntax highlighting colors for TypeScript: keywords blue, strings green, numbers orange, comments gray, types teal)
- Event log (monospace, alternating row colors)
- Data viewer (JSON syntax highlighting)
- Status badges (colored pills for status values)
- Avatar circles (initials, department colors)
- Progress bars (colored by percentage)
- File type icons (SVG-based or CSS-drawn)
- Tree connector lines (1px solid #ccc, proper spacing)
- Drag-drop indicators (blue line for insert position, blue background for append target)
- Loading spinners (CSS animation, no external dependencies)
- Performance overlay (semi-transparent black background, white monospace text)
- Toast notifications (slide in from top-right, auto-dismiss)

---

## File: `examples/tree-grid/shared/SourceViewer.ts`

A component that displays syntax-highlighted TypeScript source code.

```typescript
class SourceViewer extends Panel {
  // Config:
  //   source: string — the TypeScript source code
  //   language: string — 'typescript' (default)
  //
  // Renders source code with syntax highlighting using a simple regex-based
  // tokenizer (no external dependency like Prism or Highlight.js).
  //
  // Tokenizer recognizes:
  //   - Keywords: import, export, from, class, extends, const, let, function, return, if, else, for, while, new, this, typeof, interface, type, enum, async, await, static, readonly, private, public, protected, override
  //   - Types: string, number, boolean, void, null, undefined, unknown, any, never, object
  //   - Strings: single-quoted, double-quoted, template literals
  //   - Numbers: integers, floats, hex
  //   - Comments: // line comments, /* block comments */
  //   - Decorators: @alias, @config, etc.
  //   - Operators: =, +, -, *, /, =>, ?, :, ;, {, }, [, ], (, ), <, >, ., ,
  //
  // Features:
  //   - Line numbers (toggleable)
  //   - Copy button (copies source to clipboard)
  //   - Word wrap toggle
  //   - Font size adjustment (12-20px)
  //   - Highlight specific lines (e.g., highlight lines 5-10 with yellow background)
  //   - Scrollable for long source
}
```

---

## Implementation Instructions

For every example file:

1. **Write clean, readable TypeScript** — these examples ARE documentation. A developer should be able to read any example and immediately understand how to use that feature.

2. **Generous comments** — explain WHY each config is set, not just what it does:
   ```typescript
   // folderSort ensures phases and task groups always appear above their
   // leaf subtasks, regardless of the sort column. Without this, sorting
   // by "Hours" would intermix phases with tasks.
   folderSort: true,
   ```

3. **Realistic data** — every example must use data that looks like it came from a real application. No "Node 1", "Test A", "Lorem ipsum".

4. **Error handling** — async examples must handle and display errors gracefully (network failures, invalid data). Show the user what went wrong and how to recover.

5. **Progressive disclosure** — simple examples first, complexity builds. Example 01 should be understandable by someone who has never used ExtJS. Example 21 is for experts.

6. **Self-contained** — each example module exports a single function `createExample(container: HTMLElement): Component` that creates and renders the example into the container. The showcase shell calls this function.

7. **Cleanup** — each example must implement a `destroy()` method that cleans up all components, listeners, and mock server hooks. The showcase calls this when switching examples.

8. **Mobile-friendly** — examples should work on tablets (1024px wide). Controls should wrap. TreeGrids should fill available space.

9. **No external dependencies** — everything uses ext-ts components. Syntax highlighting is custom. No Prism, no D3, no React, no Angular.

10. **Performance** — examples 16+ with large datasets must not freeze the browser. Use requestAnimationFrame for updates, debounce user input, and limit DOM mutations.

---

## Description Files

Each `description.md` is a Markdown document (200-500 words) with:

1. **Title**: What this example demonstrates
2. **Overview**: One paragraph explaining the feature
3. **Key Concepts**: 3-5 bullet points of important config options or behaviors
4. **Try It**: Suggested interactions for the reader to try ("Click on Documents to expand...", "Try dragging a file...")
5. **Source Highlights**: Point out 2-3 interesting parts of the source code
6. **Real-World Use**: One sentence on when you'd use this feature in a production application
7. **Related Examples**: Links to related examples in the showcase

Write the description for EVERY example (21 descriptions total).

---

## Final Deliverable Checklist

- [ ] `package.json` with correct workspace dependencies and scripts
- [ ] `vite.config.ts` with correct alias resolution
- [ ] `tsconfig.json` extending root
- [ ] `index.html` — clean, semantic, accessible shell
- [ ] `index.ts` — boots Application with Router and navigation
- [ ] `shared/ExamplePanel.ts` — wrapper with description, source, controls, events, data tabs
- [ ] `shared/SourceViewer.ts` — syntax-highlighted code viewer
- [ ] `shared/ControlBar.ts` — runtime configuration controls
- [ ] `shared/DataGenerator.ts` — generates 5+ realistic datasets
- [ ] `shared/MockServer.ts` — fetch interceptor for async examples
- [ ] `shared/SampleData.ts` — pre-generated static datasets
- [ ] `shared/styles.css` — comprehensive, accessible, responsive stylesheet
- [ ] All 21 example directories with TypeScript source files
- [ ] All 21 `description.md` files
- [ ] `pnpm dev` starts Vite and the showcase loads in browser
- [ ] Hash routing works: `#basic`, `#columns`, `#async-loading`, etc.
- [ ] Theme switcher works across all examples
- [ ] Events tab logs events from the active example
- [ ] Data tab shows live JSON of the tree
- [ ] Controls tab modifies the example at runtime
- [ ] Source tab shows syntax-highlighted, copyable source
- [ ] All 21 examples render without errors
- [ ] All examples destroy cleanly when switching
- [ ] Performance examples handle 100K nodes smoothly
- [ ] Accessibility example passes automated audit
- [ ] No console errors in any example
- [ ] Responsive layout works at 1024px width

Show every file with its complete content. Begin with the shared infrastructure, then the examples in order 01 through 21.
