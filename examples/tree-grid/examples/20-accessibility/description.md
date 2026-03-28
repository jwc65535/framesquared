# 20 · Accessibility

## Overview

Explicit demonstration of the TreeGrid's accessibility features: ARIA attributes, keyboard navigation, checkbox states, and a live audit. An information panel on the right shows what a screen reader would announce for the focused node.

## Key Concepts

- **ARIA `role="treeitem"`** — each row has the treeitem role so screen readers announce it correctly.
- **`aria-expanded`** — true/false on expandable rows tells screen readers whether the subtree is open.
- **`aria-selected`** — set on selected rows.
- **`aria-level`, `aria-posinset`, `aria-setsize`** — communicate depth, position, and sibling count to screen readers.
- **Checkboxes** — `role="checkbox"` and `aria-checked` including `"mixed"` for indeterminate state.
- **Keyboard navigation** — ↑↓ moves focus, ←→ collapses/expands, Space toggles check, Enter activates.

## Try It

1. Click a task row — the **Current Focus** panel shows what a screen reader would receive.
2. Expand a node — notice the focus panel shows `Expanded: Yes`.
3. Click **Run Accessibility Audit** — checks for missing ARIA attributes and reports coverage %.
4. Use keyboard navigation: click the grid, then use ↑↓ arrows to move between rows.
5. Check several items — the focus panel updates `Checked: Yes`.

## Source Highlights

1. Status badge renderer adds `role="status"` and `aria-label` for screen reader clarity.
2. `updateFocusInfo(node)` calls `getDepth()`, `eachChild()` to build a screen-reader-style summary.
3. `runAudit()` queries DOM for `role`, `aria-expanded`, and `aria-label` attributes.

## Real-World Use

Accessibility is required for government, enterprise, and public-facing applications. WCAG 2.1 AA requires keyboard navigation, screen reader support, and sufficient color contrast.

## Related Examples

- [21 · Kitchen Sink](#kitchen-sink) — all features including accessibility
