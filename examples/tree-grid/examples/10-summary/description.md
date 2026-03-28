# 10 · Summary Rows

## Overview

Two complementary summary features for aggregating data in a tree: `TreeGridSummary` adds a global footer row with totals/averages across all visible nodes, while `TreeGridGroupingSummary` adds per-parent subtotals after each group's children. This is essential for reports and dashboards where users need to see both details and aggregates.

## Key Concepts

- **`TreeGridSummary`** — plugin that appends a summary row at the bottom (or top) of the grid with aggregated values from all visible nodes.
- **`summaryType`** — per-column aggregation: `'sum'` (total numeric values), `'average'` (mean), `'count'` (row count), `'min'` (minimum), `'max'` (maximum).
- **`summaryRenderer`** — formats the aggregated value for display (e.g., appending "h" to hours, "%" to averages).
- **`includeCollapsed: false`** — only counts visible (expanded) nodes. Set `true` to always aggregate the full dataset regardless of expand state.
- **`TreeGridGroupingSummary`** — adds a summary row after each parent node's last child. Shows per-phase totals in this example.

## Try It

1. Look at the bottom row — it shows total estimated hours, total actual hours, and average progress.
2. Collapse **Phase 1** — the footer updates instantly (collapsed nodes excluded).
3. Enable **Include Collapsed Nodes** in Controls — footer now counts all tasks, including those in collapsed phases.
4. Toggle **Show Grouping Summary** — per-phase subtotals appear/disappear after each phase's tasks.
5. Change **Summary Position** to `top` — the summary row moves above the data.

## Source Highlights

1. **`summaryColumns`** — array of column configs with `summaryType` and optional `summaryRenderer`.
2. **`TreeGridGroupingSummary`** — no extra config needed; it auto-detects non-leaf parents and inserts a summary row after each one.
3. **Expand/collapse causes summary recalculation** — the plugin listens to `nodeexpand`/`nodecollapse` events.

## Real-World Use

Summary rows are essential in financial dashboards (total portfolio value), project trackers (total hours, average completion), HR tools (average salary, headcount), and any aggregation-heavy reporting scenario.

## Related Examples

- [18 · Project Planner](#project-planner) — full application with both summary types
- [21 · Kitchen Sink](#kitchen-sink) — all features combined
