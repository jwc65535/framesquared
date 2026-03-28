# 07 · Sorting and Filtering

## Overview

Sorting and filtering operate on a tree — not a flat list. Column sorting reorders nodes *within* each level of the tree. Filtering shows matching nodes plus their ancestors, maintaining the hierarchical context. This example uses a project plan dataset to demonstrate both features together.

## Key Concepts

- **`sortable: true`** on a Column — enables click-to-sort on that column header. Click once for ascending, again for descending, again to clear.
- **`folderSort: true`** — non-leaf nodes (phases, groups) always appear before leaf nodes in sorted results. Without this, sorting by "Est. Hrs" would intermix phases and tasks.
- **`TreeGridFilterPlugin`** — attaches filter inputs to column headers (right-click column menu → Filter).
- **`filterMode: 'bottomup'`** — matching leaf nodes AND all their ancestor folders are shown. This preserves context.
- **`filterMode: 'topdown'`** — only nodes that directly match are shown (no ancestor context). More like a flat search result.

## Try It

1. Use the **Quick Filter** bar — type "Alice" to see only Alice's tasks (plus their parent phases).
2. Type "Blocked" — shows only blocked tasks with their phase hierarchy.
3. Switch **Filter Mode** to `topdown` — ancestors disappear, only matching tasks shown.
4. Clear filters, then click the **Assignee** column header — tasks sort alphabetically by assignee within each phase.
5. Enable **Folder Sort** — phases always stay at the top even when sorted by hours.

## Source Highlights

1. **`TreeGridFilterPlugin`** instantiated with `filterMode: 'bottomup'`.
2. **Quick filter** — calls `filterPlugin.filter('text', value)` to filter by the task name field.
3. **`sortchange` event** — fires when the user clicks a column header to sort.

## Real-World Use

Sorting and filtering are fundamental for any tree with 20+ nodes. File managers, org charts, and task trackers all need users to quickly find specific items.

## Related Examples

- [09 · Locked Columns](#locked-columns) — sorting with locked columns
- [16 · Large Dataset](#large-dataset) — filter/sort performance with 100K nodes
