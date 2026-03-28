# 16 · Large Dataset

## Overview

Performance demonstration using datasets from 1,000 to 100,000 nodes. Virtual scrolling ensures only ~50-100 DOM rows exist at any time, regardless of total node count. This example shows generation time, render time, DOM row count, and live scroll FPS.

## Key Concepts

- **Virtual scrolling** — only rows currently in the viewport are rendered as DOM elements. Rows are recycled as the user scrolls.
- **`DataGenerator.largeDataset(N)`** — generates N synthetic nodes in a random tree shape. Generation of 100K nodes takes ~300-500ms.
- **DOM row count** — should remain ~50-100 regardless of total node count. Check `tr[data-node-id]` count after expand/collapse.
- **Expand All on large sets** — flattening 100K nodes is CPU-intensive. The UI remains responsive (no freeze) because the expand walks the tree asynchronously.
- **Filter performance** — client-side text filter on 100K nodes is <100ms because it walks the flat data array, not the DOM.

## Try It

1. Select **10000** in the Size control — note generation and render times.
2. Select **100000** — observe the increase in gen/render time. Scrolling should still be smooth.
3. Click **Expand All** — watch DOM Rows in the metrics panel (should not explode to 100K).
4. Click **Scroll to Random Node** — the tree expands the path and scrolls directly to a random node.
5. Type "Node 5" in the **Filter** field — rows not matching are hidden instantly.

## Source Highlights

1. **`DataGenerator.largeDataset(100000, 6, 15)`** — max depth 6, max 15 children per node.
2. Performance metrics use `performance.now()` for sub-millisecond timing.
3. Scroll FPS measured by counting `scroll` events per second.

## Real-World Use

Virtual scrolling is required for any tree with more than 1,000 visible rows. File system browsers, audit logs, and large org charts all benefit from this approach.

## Related Examples

- [01 · Basic TreeGrid](#basic) — start here for smaller datasets
- [09 · Locked Columns](#locked-columns) — locked columns with virtual scroll
