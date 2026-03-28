# 12 · Clipboard

## Overview

Copy tree data to the system clipboard as tab-separated values (TSV). The clipboard format is compatible with Microsoft Excel, Google Sheets, and any spreadsheet application. The `copyHierarchy` option preserves the tree structure by indenting the first column with spaces matching the node's depth.

## Key Concepts

- **`TreeGridClipboard` plugin** — handles Ctrl+C keyboard shortcut and programmatic copy operations.
- **`copyHierarchy: true`** — the tree column value is prefixed with spaces (2 per depth level). Pasting into Excel shows the hierarchy visually.
- **`includeHeaders: true`** — the first row of the TSV contains column header text.
- **TSV format** — tab-separated values. Each row is separated by `\n`, each column by `\t`. Special characters (tabs in values) are sanitized.
- **Clipboard preview** — the example shows the serialized output in a textarea. Paste this into a spreadsheet to verify the format.

## Try It

1. Click **Copy All Visible** — the textarea shows the TSV. Check the stats label for row/column counts.
2. Enable **Copy Hierarchy** and copy again — the Task column in the preview is indented by depth.
3. Expand Phase 1 fully, then click Copy All — subtasks appear indented under their parents.
4. Disable **Include Headers** — the first row is no longer a header row.
5. Open a spreadsheet, paste with Ctrl+V — the data pastes with columns correctly separated.

## Source Highlights

1. **`serializeVisible`** function walks the tree using `eachChild` recursively, collecting column values per row.
2. **Depth-based indentation** — `'  '.repeat(depth)` prepended to the tree column value.
3. **`navigator.clipboard.writeText(tsv)`** — the Web Clipboard API (requires HTTPS or localhost).

## Real-World Use

Clipboard integration is valuable in reporting tools, data editors, and any workflow where users need to export tree data into spreadsheets for further processing.

## Related Examples

- [14 · Export](#export) — download to CSV/JSON/XLSX files
- [08 · Selection Modes](#selection) — select specific rows to copy
