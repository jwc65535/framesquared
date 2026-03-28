# 02 · Multi-Column Tree

## Overview

Extends the basic TreeGrid with all major column types on a project plan dataset. Demonstrates custom renderers for status badges, priority icons, and inline progress bars — the kinds of rich data displays you'd see in a real project management application.

## Key Concepts

- **Custom `renderer` functions** — each Column accepts a `renderer: (value, record) => string` function that returns HTML. Use this to display badges, icons, sparklines, or any custom markup.
- **Status badges** — CSS classes `.badge-completed`, `.badge-in-progress`, etc. are defined in `styles.css` and applied via the status renderer.
- **Progress bars** — inline `<div>` elements with `width` driven by the percentage value, colored by range (red < 34%, yellow < 67%, blue < 100%, green = 100%).
- **`folderSort: true`** — phase nodes (non-leaf) always appear before their child tasks, regardless of which column is sorted. Without this, sorting by hours would intermix phases with tasks.

## Try It

1. Expand **Phase 1: Planning & Discovery** — see tasks with different statuses and priorities.
2. Notice the progress bars: Completed tasks show green with a ✓ checkmark.
3. Expand a task to see its subtasks — subtask progress bars are narrower (less hours).
4. Toggle **Folder Sort** in Controls — then sort by "Est. Hrs" to see phases stay at the top.
5. Watch how the status badges update the Events tab on each click.

## Source Highlights

1. **`statusRenderer`** — returns `<span class="badge badge-in-progress">In Progress</span>`. Status-to-class mapping is just a plain JS object.
2. **`progressRenderer`** — uses four CSS classes to color the bar differently based on percentage range.
3. **`flex: 2` on Task column** — fills remaining horizontal space proportionally.

## Real-World Use

Use multi-column trees with custom renderers for dashboards, project trackers, resource planners, and any application that needs to display multiple data attributes alongside a hierarchy.

## Related Examples

- [01 · Basic TreeGrid](#basic) — the simpler starting point
- [05 · Editing](#editing) — make these columns editable
- [10 · Summary Rows](#summary) — add summary totals for the numeric columns
