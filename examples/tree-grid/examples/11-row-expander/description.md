# 11 · Row Expander

## Overview

The Row Expander plugin adds a secondary expand control (a small ▶ arrow on the far left) that opens a rich detail panel directly below each row. This panel is independent of tree children — a node can simultaneously show its subtasks (tree-expanded) AND its detail panel (row-expanded).

## Key Concepts

- **`TreeGridRowExpander` plugin** — adds a dedicated expander column and manages inline detail panels.
- **`rowBodyTpl`** — a function `(node) => string` that returns the HTML for the detail panel. Use any markup here: forms, lists, charts.
- **`singleExpand`** — when `true`, opening one detail panel closes any other open panel.
- **`expandOnDblClick`** — when `true`, double-clicking a row also toggles the detail panel.
- **Independent of tree expand** — collapsing a parent node hides its children's detail panels (they can't be seen), but the panels re-appear when the parent is re-expanded.

## Try It

1. Click the **▶** arrow on the far left of any task row — a detail panel slides open.
2. Click the **▶** on a second task — both panels are open simultaneously.
3. Enable **Single Expand** in Controls — opening a new detail panel closes the previous one.
4. Also expand the task's tree children (click the tree expander) — see both tree children and the detail panel visible at once.
5. Enable **Expand on Dbl-Click** — double-clicking the row now toggles the detail panel.

## Source Highlights

1. **`rowBodyTpl`** function builds HTML using node properties: tags as pills, progress bar, dates grid.
2. Plugin is passed in `plugins: [rowExpander]` array.
3. `rowexpand`/`rowcollapse` events fire when detail panels open/close.

## Real-World Use

Row expanders are ideal for email-list UIs (click to read full message), order management (click order row to see line items), or any scenario where each row has a richer detail view that doesn't warrant a full navigation to a detail page.

## Related Examples

- [05 · Editing](#editing) — edit data inline in the row
- [18 · Project Planner](#project-planner) — properties panel below the grid
