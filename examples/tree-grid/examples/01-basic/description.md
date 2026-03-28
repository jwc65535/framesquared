# 01 · Basic TreeGrid

## Overview

The simplest possible TreeGrid — a file browser showing three columns: Name (with tree chrome), Size, and Modified date. This is the starting point for any TreeGrid application, demonstrating the core configuration in under 30 lines of code.

## Key Concepts

- **`rootVisible: false`** — hides the root node so the tree appears to start at the top-level folders. This is the most common setting for file browsers and navigation trees.
- **`useArrows: true`** — shows triangle ▶/▼ expand indicators instead of the classic +/− squares.
- **`animate: true`** — smooth expand/collapse transitions (CSS height animation).
- **`TreeGridColumn`** — the first column type that renders the tree chrome (indentation, expander icon, folder/leaf icon) plus the node's display value.
- **`renderer`** — a function on Column that transforms a raw data value into display HTML. Here used to format bytes and ISO dates into human-readable strings.

## Try It

1. Click **Documents** to expand it — see the Work, Personal, and Archive subfolders appear.
2. Click **Work** to expand it — see the PDF, DOCX, and XLSX files with their sizes and dates.
3. Click the **Expand All** control to expand every node at once.
4. Check **Show Lines** to add connector lines between tree nodes.
5. Uncheck **Use Arrows** to switch to +/− icons.
6. Watch the Events tab to see `itemclick`, `itemexpand`, and `itemcollapse` events firing.

## Source Highlights

1. **`TreeStore` with inline data** — pass a `root` object with nested `children` arrays. No API calls needed for static data.
2. **`flex: 2` on the tree column** — makes the Name column take twice as much space as other columns. Use `width` for fixed-width columns.
3. **`renderer` function** — `(v: unknown) => formatFileSize(v as number)` receives the raw field value and returns a display string.

## Real-World Use

Use this pattern for any hierarchical navigation: file browsers, category trees, table-of-contents, org-chart navigation sidebars.

## Related Examples

- [02 · Multi-Column Tree](#columns) — more column types with custom renderers
- [03 · Async Loading](#async-loading) — lazy-load children from an API
- [17 · File Explorer](#file-explorer) — a complete file manager application built on this foundation
