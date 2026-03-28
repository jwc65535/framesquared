# 03 · Async Loading

## Overview

Demonstrates lazy-loading tree children from a REST API on node expand. Rather than loading the entire dataset upfront, each node fetches its children only when the user expands it. This pattern is essential for large file systems, organizational hierarchies, or any tree where the total dataset would be too large to load at once.

## Key Concepts

- **MockServer** — a fetch() interceptor that simulates a REST API with configurable latency (200–600ms default) and failure rate. All requests to `/api/*` are handled locally; all other fetch calls pass through.
- **Lazy-loading pattern** — listen for the `nodeexpand` event, then call the API and append child nodes to the expanded node. Track which nodes are already loaded to avoid duplicate fetches.
- **`node.appendChild(child)`** — adds a child node to an existing tree node. The tree view updates automatically.
- **Loading indicator** — while children are fetching, the node text shows a ⏳ spinner emoji. In production, use a proper CSS spinner class.
- **Error handling** — if the API returns an error, log it to the network log panel and allow retry.

## Try It

1. Click the root node **My Files** to expand it — watch the Network Log for the API call with latency.
2. Expand a subfolder — a second API call is made, only loading that folder's children.
3. Collapse and re-expand the same folder — no second API call (already loaded).
4. Increase **Failure Rate** to 30% in Controls — some expands will fail. See error in network log.
5. Increase **Latency** to 1500ms — expand a folder and watch the ⏳ indicator for 1.5 seconds.
6. Click **Reload Tree** — all loaded state is reset, forcing fresh fetches.

## Source Highlights

1. **Store starts empty** — `root: { id: 'root', text: 'My Files', leaf: false }` — no inline children.
2. **`store.on('nodeexpand', ...)`** — fires when the user clicks an expander. Check `loadedNodes` to prevent duplicate fetches.
3. **`node.appendChild(child)`** — appends a new node. The view refreshes automatically via `datachanged` event.

## Real-World Use

Use async loading whenever your tree has more than ~500 nodes, or when children depend on the parent's identity (e.g., fetching files by folder ID). This keeps the initial page load fast and memory usage low.

## Related Examples

- [01 · Basic TreeGrid](#basic) — synchronous data (simpler)
- [17 · File Explorer](#file-explorer) — full application using async loading
