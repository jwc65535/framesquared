# 09 · Locked Columns

## Overview

Locked (frozen) columns stay fixed on the left side of the grid while the user scrolls the remaining columns horizontally. This is essential for wide grids where users need to maintain context of which row they're looking at while scrolling through many data columns.

## Key Concepts

- **`TreeGridLockable` plugin** — splits the grid into two panels: locked (left) and normal (right). Vertical scroll is synchronized between both.
- **`locked: true`** on a Column config — places that column in the locked panel.
- **Tree column is always locked** — the TreeGridColumn must remain in the locked panel to preserve tree chrome alignment.
- **Synchronized expand/collapse** — expanding a node in the locked panel causes rows to appear/disappear in both panels simultaneously.
- **Column header menu** — right-click any column header to access "Lock" / "Unlock" options (moves columns between panels).

## Try It

1. Expand **Documents** folder — both the locked Name panel and the scrollable Size/Modified panel show the new rows.
2. Scroll the grid **horizontally** — Name and Type columns stay fixed; Size, Modified, Owner, Permissions, Path scroll.
3. Resize the Name column by dragging its header edge.
4. Notice that the locked and normal panels' row heights stay synchronized as you expand/collapse.

## Source Highlights

1. **`locked: true`** on TreeGridColumn and the Type column — these go into the left panel.
2. **`TreeGridLockable` plugin** — handles the CSS and DOM split into two synchronized scrollable panels.
3. **Vertical sync** — the plugin listens to `scroll` events on both panels and mirrors the `scrollTop`.

## Real-World Use

Use locked columns in financial tables (freeze the instrument name while scrolling through dates), HR spreadsheets (freeze name/ID while scrolling through many attributes), and any wide table where the first column(s) are the primary identifier.

## Related Examples

- [17 · File Explorer](#file-explorer) — full application using locked tree column
- [21 · Kitchen Sink](#kitchen-sink) — locked columns combined with all other features
