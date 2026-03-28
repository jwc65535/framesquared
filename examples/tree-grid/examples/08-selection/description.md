# 08 · Selection Modes

## Overview

TreeGrid supports three selection modes. This example uses a company org chart dataset to demonstrate how different modes behave, including range selection across tree depth levels, checkbox selection, and the deselect-on-collapse behavior.

## Key Concepts

- **`SINGLE` mode** — click selects one row, deselects the previous. The default for most applications.
- **`SIMPLE` mode** — click toggles each row independently. No Ctrl or Shift modifier needed. Good for multi-select where the user expects list-like behavior.
- **`MULTI` mode** — standard browser multi-select: Ctrl+click to add/remove, Shift+click for range. Range selection works across tree depth levels (all visible rows between anchor and target are selected).
- **`checkboxSelect`** — adds a dedicated checkbox column separate from the tree's checkable feature. Used when selection and "checked" are different concepts.
- **`TreeGridSelectionModel`** — the selection model is instantiated separately so you can change its `mode` property at runtime.

## Try It

1. Switch **Selection Mode** to `MULTI` — now Ctrl+click to add rows, Shift+click to select a range.
2. Expand **Engineering** and **Product** — hold Shift and click from Alice Chen to Grace Lee — all visible rows between are selected.
3. Enable **Checkbox Select** — a dedicated checkbox column appears. Selection and checkbox are independent.
4. Click **Select All** — selects every visible node.
5. Collapse a team that has selected members — switch **Selection Mode** to MULTI and verify selected count includes/excludes hidden nodes.

## Source Highlights

1. **`new TreeGridSelectionModel({ mode: 'SINGLE' })`** — instantiated separately and passed as `selModel`.
2. **`selectionchange` event** — fires after every selection change with the new selection array.
3. **`grid.getSelection()`** — returns the current array of selected `NodeInterface` instances.

## Real-World Use

Selection is used for bulk operations (delete multiple, export selected, batch edit), master-detail layouts (select a row, see details in a side panel), and multi-step workflows.

## Related Examples

- [04 · Checkbox Tree](#checkbox) — checkbox as "checked" state, not selection
- [12 · Clipboard](#clipboard) — copy selected rows to clipboard
