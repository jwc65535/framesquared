# 05 · Cell Editing

## Overview

Inline cell editing powered by the `TreeGridCellEditing` plugin. Double-click any editable cell to activate an in-place editor — text fields, comboboxes, number fields, and date pickers appear directly in the cell. The tree chrome (indentation, expander, icon) stays visible while editing the tree column.

## Key Concepts

- **`TreeGridCellEditing` plugin** — attach to `plugins` array on the TreeGrid config. Sets `clicksToEdit: 2` (double-click) or `1` (single-click).
- **`editor` on Column config** — each column that should be editable gets an `editor` object with an `xtype` key. Supported: `textfield`, `numberfield`, `datefield`, `combobox`, `checkbox`.
- **`allowBlank: false`** on the text editor — prevents saving an empty task name. Shows a red error indicator.
- **ComboBox editor** — set `editable: false` for a strict dropdown (no free-form text). Pass a `store` array as `{ value, text }` pairs.
- **`beforeedit` / `edit` / `canceledit` events** — fire before/after/on-cancel of an edit. Use `beforeedit` to conditionally prevent editing (return false).

## Try It

1. Double-click the **Task** column of any row to edit its name. Press Enter to save, Escape to cancel.
2. Double-click **Status** — a dropdown appears with the 5 status options.
3. Double-click **Est. Hrs** — a number input appears. Try entering a negative number (rejected by `minValue: 0`).
4. Click **+ Add Task** — a new row appears at the root level. It's immediately ready to edit.
5. Select a task and click **🗑 Delete Selected** — confirm the dialog to remove the node.

## Source Highlights

1. **Plugin instantiation** — `new TreeGridCellEditing({ clicksToEdit: 2 })` then pass to `plugins: [cellEditing]`.
2. **Editor config** — each column has an `editor: { xtype: 'combobox', store: [...] }` object. The editor is created on demand when the cell is activated.
3. **Creating new nodes** — `root.createNode({...})` then `root.appendChild(newNode)` followed by `_view.refresh()`.

## Real-World Use

Cell editing is ideal for spreadsheet-style data entry in tables, project planners, resource allocation grids, and any scenario where users need to update individual fields without opening a separate form.

## Related Examples

- [18 · Project Planner](#project-planner) — full application with cell editing
- [02 · Multi-Column Tree](#columns) — read-only version of the same data
