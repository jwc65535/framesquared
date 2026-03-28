# 14 · Export

## Overview

Export the tree to CSV, TSV, or JSON. The export respects the current expand state (export only visible nodes, or all nodes), preserves hierarchy through indentation, and includes column headers. A live preview shows the first 20 lines of the output before you download.

## Key Concepts

- **`TreeGridExporter` plugin** — provides export functionality, triggered programmatically.
- **CSV format** — comma-separated, values quoted, special characters escaped. Compatible with Excel.
- **TSV format** — tab-separated. Faster to generate, also Excel-compatible.
- **JSON format** — nested structure matching the tree hierarchy (children arrays).
- **`expandedOnly: true`** — only exports nodes currently visible (respects the user's current expand state).
- **Indentation in CSV/TSV** — the tree column gets `N * 2` spaces prepended (N = depth level).

## Try It

1. Click **Preview CSV** — see the CSV output in the preview textarea. Notice the quoted values.
2. Expand Phase 1 fully, then preview again — more rows appear.
3. Enable **Expanded Only** — preview now only includes currently visible rows.
4. Click **Export JSON** — a `project-plan.json` file downloads with nested children arrays.
5. Click **Export CSV** to download — open in Excel to verify column alignment.

## Source Highlights

1. **`collectNodes`** — recursive walk that respects `expandedOnly` flag.
2. **CSV quoting** — all values are wrapped in `"..."` and internal quotes doubled.
3. **`URL.createObjectURL`** — creates a temporary download URL from a `Blob`.

## Real-World Use

Export is essential for reporting workflows. Users export tree data to Excel for financial models, to CSV for data processing pipelines, and to JSON for API submissions.

## Related Examples

- [12 · Clipboard](#clipboard) — copy to clipboard instead of downloading
- [18 · Project Planner](#project-planner) — export from a full application
