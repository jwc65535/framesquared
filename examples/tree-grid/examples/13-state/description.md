# 13 · State Persistence

## Overview

The `TreeGridStateMixin` plugin serializes and restores the TreeGrid's UI state to `localStorage`. State includes which nodes are expanded, column widths, sort order, and hidden columns. When the user returns to the page, the grid resumes exactly where they left it.

## Key Concepts

- **`TreeGridStateMixin`** — plugin that hooks into the grid's lifecycle. On destroy, it saves state. On initialization, it restores state.
- **`stateId`** — a unique string key used for `localStorage.getItem/setItem`. Different stateIds give different grids independent state.
- **What's persisted** — expanded node IDs, column widths (`px`), sort column + direction, hidden column list.
- **`localStorage`** — browser storage that survives page reloads but is cleared when the user clears browser data.

## Try It

1. Expand **Documents → Work** to see the files inside.
2. Drag a column header edge to resize it.
3. Click **Simulate Page Reload** in Controls — the grid is destroyed and re-created. The same nodes are expanded and columns are the same width.
4. Click **Clear State** — then reload — the grid starts fresh (all collapsed, default widths).
5. Click **Show State JSON** — inspect the JSON object stored in localStorage.

## Source Highlights

1. `new TreeGridStateMixin({ stateId: 'treegrid-state-demo' })` — the plugin is instantiated with a unique ID.
2. The "Simulate Page Reload" button calls `grid.destroy()` then recreates it — this triggers the state save and then restore cycle.
3. `localStorage.getItem(STATE_ID)` — reads the raw JSON string to display size and keys.

## Real-World Use

State persistence eliminates friction for power users who frequently return to complex trees. File managers, project dashboards, and admin interfaces all benefit from remembering the user's last view.

## Related Examples

- [21 · Kitchen Sink](#kitchen-sink) — state persistence combined with all other features
