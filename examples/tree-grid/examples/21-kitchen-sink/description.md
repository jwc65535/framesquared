# 21 · Kitchen Sink

## Overview

Every TreeGrid feature enabled simultaneously on a single component. This is the stress test: checkboxes with cascade, drag-and-drop reordering, row expander detail panels, cell editing, summary footer, filter plugin, state persistence, export, and clipboard — all working together without conflicts.

## Key Concepts

- **All plugins coexist** — `TreeGridCellEditing`, `TreeGridSummary`, `TreeGridRowExpander`, `TreeGridFilterPlugin`, `TreeGridStateMixin`, `TreeGridExporter`, `TreeGridClipboard`, `TreeGridDragDrop` are all instantiated and passed in the `plugins` array.
- **No conflicts** — each plugin has a specific responsibility and they don't interfere with each other.
- **Performance** — 3 phases × 5 tasks × 3 subtasks = ~60 nodes with every feature. This is the realistic usage limit for all features simultaneously.
- **Stats bar** — live counts for total nodes, selected, and checked update on every event.

## Try It

1. Click the **▶** expander on a task — see the row expander detail panel.
2. Check **Phase 1** — cascades to all its tasks and subtasks.
3. Drag a task to another phase — drag-and-drop reordering works alongside all other features.
4. Double-click a cell — inline editing activates.
5. Click **Export CSV** — downloads all data including checked state.
6. Click **Save State** then **Clear State** — toggle state persistence.
7. Type in the filter box — instant filtering.

## Source Highlights

1. `plugins: [cellEditing, summary, rowExpander, filterPlugin, stateMixin, exporter, clipboard, dd]` — all 8 plugins in one array.
2. Stats update wires to `selectionchange`, `checkchange`, `itemexpand`, `itemcollapse` events.
3. Export builds a CSV in-memory using `cascadeBy` then downloads via Blob URL.

## Real-World Use

The Kitchen Sink demonstrates that all TreeGrid features are composable. In production, enable only the features your users need — but knowing they all coexist means you can add features incrementally without rearchitecting.

## Related Examples

Start with [01 · Basic TreeGrid](#basic) and work through the examples in order to understand each feature before seeing them combined here.
