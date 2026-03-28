# 06 · Drag and Drop

## Overview

Drag-and-drop file management within a single TreeGrid. Drag any node to a new position — drop it between rows to reorder siblings, or drop it onto a folder to move it inside. Auto-expand lets you drop into collapsed folders by hovering over them.

## Key Concepts

- **`TreeGridDragDrop` plugin** — enables drag handles (on mousedown) and drop zones (with position indicators).
- **`ddGroup`** — a named group that determines which grids can exchange nodes. Two grids with the same `ddGroup` can cross-drag.
- **Drop position indicators** — a blue line above the row means "insert before" (sibling), a highlighted row means "append as child", a blue line below means "insert after".
- **`appendOnly: true`** — disables sibling insertion; nodes can only be dropped *into* folders.
- **`expandDelay`** — milliseconds to hover before a collapsed folder auto-expands. Default 600ms.
- **Circular prevention** — you cannot drop a folder into one of its own descendants. The cursor shows "not allowed" if you try.

## Try It

1. Drag **Q3-Report.pdf** from Work folder and drop it onto **Personal** folder.
2. Drag **Music** folder onto **Projects** folder — the entire Music subtree moves.
3. Hover over the collapsed **Downloads** folder while dragging — it auto-expands after 600ms.
4. Try dragging **Documents** onto **Work** (its child) — see the "not allowed" cursor (circular prevention).
5. Increase **Expand Delay** to 2000ms in Controls — notice the longer pause before auto-expand.
6. Enable **Append Only** — you can now only drop *into* folders, not between items.

## Source Highlights

1. **Plugin instantiation** — `new TreeGridDragDrop({ ddGroup: 'tree-dnd-01', expandDelay: 600 })`.
2. **`nodedrop` event** — fires after a successful drop with `dropData.dragData.node` (the dragged node) and `dropData.target` (the drop target node).
3. **`enableDrag` and `enableDrop`** on TreeGrid config — these flags initialize the drag source and drop target.

## Real-World Use

Use drag-and-drop for file managers, page builders (reorder page components), task boards, category managers, and any tree where users need to reorganize the hierarchy visually.

## Related Examples

- [17 · File Explorer](#file-explorer) — full file manager with drag-drop
- [19 · Org Chart](#org-chart) — drag employees between teams
