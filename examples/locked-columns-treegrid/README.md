# Locked Columns TreeGrid

Demonstrates the `TreeGridLockable` plugin: freeze one or more columns to the
left of the grid while the rest of the columns scroll horizontally.

---

## Running the example

The page imports from `esm.sh` and therefore requires an HTTP server — it will
not work when opened as a local `file://` URL.

Any static file server works.  From the repository root:

```bash
# Node (npx)
npx serve examples/locked-columns-treegrid

# Python 3
python3 -m http.server --directory examples/locked-columns-treegrid 8080

# Or from the repo root and navigate to the sub-path
npx serve .
# then open http://localhost:3000/examples/locked-columns-treegrid/
```

Open the URL printed by the server in any modern browser.

---

## What the example shows

| Feature | Description |
|---|---|
| **Frozen tree column** | The Name column is always locked and cannot be unfrozen. |
| **Additional locked column** | Employee ID starts frozen alongside Name. |
| **Horizontal scrolling** | The remaining eight columns (Job Title → Manager) scroll independently in the right panel. |
| **Runtime lock toggling** | Click any chip in the lock bar to freeze or unfreeze that column instantly. |
| **Row selection** | Click any row to select it; Ctrl/Cmd-click to multi-select. The selection highlight tracks correctly across both the locked and scrollable panels. |
| **Expand / Collapse All** | Toolbar buttons expand or collapse every department node at once. |

---

## Using the lock bar

The lock bar sits directly above the grid.  Each chip represents one column.

| Chip style | Meaning | Action on click |
|---|---|---|
| Gray, grayed-out (Name) | Always locked — cannot be changed | Nothing |
| Blue (🔒) | Column is currently frozen | Unfreezes the column |
| Gray (🔓) | Column is currently scrollable | Freezes the column |

You can freeze as many columns as you like.  The blue separator line between the
locked and scrollable panels moves to reflect the current frozen set.

> **Note:** at least one scrollable column must remain — if all non-tree columns
> are frozen the plugin will leave the layout unchanged.

---

## Using the grid

### Expanding and collapsing nodes

- Click the **▶** arrow next to a department name to expand it and reveal
  employees.
- Click **▼** to collapse.
- Use the **Expand All** / **Collapse All** toolbar buttons to act on every
  node at once.

### Selecting rows

| Action | Result |
|---|---|
| Click a row | Selects that row (deselects any previous selection) |
| Ctrl / Cmd + click | Adds or removes the row from the current selection |

Selection highlights appear in both the locked panel (Name, Emp ID) and the
scrollable panel simultaneously.

---

## Code walkthrough

### 1. Plugin setup

```js
const lockable = new TreeGridLockable({ syncScroll: true });

const grid = new TreeGrid({
  columns: [ nameCol, idCol, titleCol, /* … */ ],
  height: 480,
});

grid.render(document.getElementById('grid-container'));

// Call init() explicitly — the CDN build does not invoke it automatically.
lockable.init(grid);
```

`TreeGridLockable.init()` clears the grid's panel body and replaces it with
two independent `TreeGridView` instances: one for the locked columns and one for
the scrollable columns.  `syncScroll: true` keeps their vertical scroll
positions in sync.

### 2. Marking a column as initially locked

Set the `.locked` property on a `Column` instance **before** passing it to the
grid.  The `TreeGridColumn` (tree chrome) is always locked regardless of this
flag.

```js
const idCol = new Column({ text: 'Emp ID', dataIndex: 'empId', width: 100 });
idCol.locked = true; // starts in the frozen panel
```

### 3. Toggling lock state at runtime

```js
lockable.lockColumn(col);   // moves col to the frozen panel
lockable.unlockColumn(col); // moves col to the scrollable panel
```

Both calls rebuild the two internal views via `_rebuild()`.  After rebuilding,
any `itemclick` listeners previously attached to the old views are gone, so
`wireSelection()` must be called again (see below).

### 4. Row selection wiring

`TreeGridLockable` creates its own view instances that are not automatically
connected to the grid's selection model.  The example wires them manually:

```js
function wireSelection() {
  const onItemClick = (node, e) => grid.select(node, e.ctrlKey || e.metaKey);
  lockable.getLockedView()?.on('itemclick', onItemClick);
  lockable.getNormalView()?.on('itemclick', onItemClick);
}

// Keep selection highlights in sync across both panels.
grid.on('selectionchange', (_sel, selected) => {
  const sel = new Set(selected);
  const flat = grid.getStore().flattenNodes();
  for (const n of flat) {
    lockable.getLockedView()?.markSelected(n, sel.has(n));
    lockable.getNormalView()?.markSelected(n, sel.has(n));
  }
});

wireSelection(); // initial wire-up
```

The chip click handler calls `wireSelection()` again after every
`lockColumn` / `unlockColumn` call so that freshly created views are always
connected.

### 5. Expand / Collapse All with lockable views

`TreeStore.expandAll()` and `collapseAll()` update `node.expanded` directly
without firing store events, so the lockable views do not update automatically.
Refresh both views manually afterward:

```js
function refreshBothViews() {
  lockable.getLockedView()?.refresh();
  lockable.getNormalView()?.refresh();
}

grid.getStore().expandAll();
refreshBothViews();
```

### 6. CSS layout

Three rules make the two-panel layout work correctly:

```css
/* Override the default flex-direction:column on .x-panel-body so the two
   panels sit side-by-side instead of stacking vertically. */
.grid-wrapper .x-panel-body {
  display: flex !important;
  flex-direction: row !important;  /* critical — default is column */
  overflow-x: hidden !important;
  padding: 0 !important;           /* remove default 16px body padding */
  gap: 0 !important;               /* remove default 8px gap */
}

/* Locked panel: stays at its natural width, never shrinks */
.grid-wrapper .x-treegrid-locked-panel {
  flex-shrink: 0;
}

/* Normal panel: fills all remaining space and scrolls horizontally */
.grid-wrapper .x-treegrid-normal-panel {
  flex: 1;
  min-width: 0;
}
```

`flex-direction: row` is the critical override.  Without it the two panels
stack vertically (the default `column` direction), which looks identical to a
non-split grid.  `overflow-x: hidden` on the body ensures only the right
panel scrolls horizontally.

---

## Dataset

The example uses a fictional employee directory.

| Field | Description |
|---|---|
| `text` | Full name (also the tree node label) |
| `empId` | Employee ID (e.g. `E-001`) |
| `title` | Job title |
| `location` | City |
| `startDate` | ISO date string |
| `salary` | Annual salary in USD |
| `bonus` | Bonus percentage |
| `performance` | `Exceptional` · `Exceeds` · `Meets` · `Below` |
| `email` | Work email address |
| `manager` | Manager's full name |

Five departments — Engineering, Design, Product, Marketing, Data Science — each
contain two to four employees represented as `leaf: true` nodes.

---

## File structure

```
examples/locked-columns-treegrid/
├── index.html   # self-contained example (HTML + CSS + JS in one file)
└── README.md    # this file
```

All logic lives in the `<script type="module">` block inside `index.html`.
There are no build steps or external asset dependencies beyond the two CDN
imports (`@framesquared/ui` and `@framesquared/theme`).
