# 18 · Project Planner Application

## Overview

A project management application showing phases, tasks, and subtasks with row editing, summary rows, undo/redo, progress tracking, and a properties panel. This demonstrates TreeGrid as the backbone of a real enterprise-grade application.

## Key Concepts

- **`TreeGridRowEditing` plugin** — double-click a row to edit all fields simultaneously in an inline form with Update/Cancel buttons.
- **`TreeGridSummary`** — footer row shows totals across all visible tasks.
- **Undo/redo stack** — simple array-based undo that tracks add/delete operations.
- **Properties panel** — `itemclick` event updates a side panel with full task details.
- **Status filter** — dropdown that shows/hides rows by status using DOM `display`.

## Try It

1. Double-click any task row — all fields enter edit mode simultaneously.
2. Click **+ Task** — a new row is appended, ready to fill in.
3. Delete a task, then click **↩ Undo** — the task reappears.
4. Filter by "Blocked" in the status dropdown — only blocked tasks are visible.
5. Click a task to see its full details in the Properties panel on the right.

## Source Highlights

1. `TreeGridRowEditing` with `clicksToEdit: 2` — double-click activates all editors in the row.
2. `pushUndo(entry)` — stores a closure `undo: () => void` that reverses the operation.
3. Status filter uses DOM manipulation on `tr[data-node-id]` rows.

## Real-World Use

Project management, task trackers, Sprint boards, issue trackers, and any application where users need to edit task metadata and track progress in a hierarchical list.

## Related Examples

- [05 · Editing](#editing) — cell editing (individual cells, not full rows)
- [10 · Summary Rows](#summary) — summary rows explained in detail
