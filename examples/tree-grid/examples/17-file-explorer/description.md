# 17 · File Explorer Application

## Overview

A full macOS Finder-style file manager application built on TreeGrid. This real-world application combines sidebar navigation, toolbar actions, breadcrumb trail, search filtering, context menus, and a status bar — all coordinated through TreeGrid events.

## Key Concepts

- **BorderLayout composition** — sidebar (favorites), main TreeGrid, toolbar (north), breadcrumb (below toolbar), status bar (south).
- **Sidebar navigation** — clicking a favorite (Documents, Pictures, etc.) calls `grid.expandNode()` and `scrollToNode()` to navigate the tree.
- **Breadcrumb** — updates on `itemclick` by walking `node.parentNode` up to root.
- **Context menu** — `contextmenu` event on the grid area shows an inline menu (Open, Rename, Delete, Properties).
- **Status bar** — shows total item count and selected item count, updating on `selectionchange`.
- **Dynamic CRUD** — New Folder button appends a node; Delete removes; Rename edits the text in-place.

## Try It

1. Click **Documents** in the sidebar — the tree expands and scrolls to that folder.
2. Click on a file — the breadcrumb updates to show its path.
3. Right-click any file — context menu appears with Open, Rename, Delete, Properties.
4. Click **📁 New Folder** — a new folder is added inside the selected folder.
5. Type in the search box — files not matching are hidden.
6. Select a file and click **🗑 Delete** — confirm to remove it.

## Source Highlights

1. `getFileIcon(node)` — returns an emoji based on file extension.
2. `updateBreadcrumb` — walks `node.parentNode` recursively to build the path.
3. Context menu built with vanilla DOM — `contextmenu` event on the grid container.

## Real-World Use

This pattern applies to any file management UI, document management system, or hierarchical content editor where users navigate, organize, and perform CRUD on tree nodes.

## Related Examples

- [06 · Drag & Drop](#drag-drop) — add drag-to-move to this file explorer
- [03 · Async Loading](#async-loading) — lazy-load folder contents from an API
