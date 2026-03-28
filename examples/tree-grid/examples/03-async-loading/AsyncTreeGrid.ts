/**
 * Example 03: Async Loading
 *
 * Demonstrates lazy-loading children from a REST API on node expand.
 * Uses MockServer to intercept fetch() calls and return file system data
 * with configurable latency and failure rate.
 *
 * Key patterns:
 *  - TreeStore with async proxy configuration
 *  - Loading indicator while children are being fetched
 *  - Error display with retry functionality
 *  - Network request log panel
 */

import { TreeGrid, TreeGridColumn, Column } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { MockServer } from '../../shared/MockServer.js';
import { ControlBar } from '../../shared/ControlBar.js';

let apiCallCount = 0;
let totalNodesLoaded = 0;

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatSize(bytes: number): string {
  if (!bytes || bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function appendNetworkLog(container: HTMLElement, entry: string, isError = false): void {
  const line = document.createElement('div');
  line.className = `network-log-entry${isError ? ' network-log-error' : ''}`;
  line.textContent = entry;
  container.appendChild(line);
  container.scrollTop = container.scrollHeight;
  while (container.children.length > 50) container.removeChild(container.firstChild!);
}

export function createExample(container: HTMLElement): { destroy: () => void } {
  // Install the mock server (intercepts fetch calls to /api/*)
  MockServer.install();

  // Create the main layout
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;flex-direction:column;height:480px;gap:8px';

  const gridWrapper = document.createElement('div');
  gridWrapper.style.cssText = 'flex:1;min-height:0';
  wrapper.appendChild(gridWrapper);

  container.appendChild(wrapper);

  // ── TreeStore ──
  // The store starts empty (no inline children). When a node is expanded,
  // the store fires a 'nodeexpand' event. We intercept this to manually
  // fetch children and append them.
  const store = new TreeStore({
    root: {
      id: 'root',
      text: 'My Files',
      expanded: false,
      leaf: false,
    },
  });

  const grid = new TreeGrid({
    title: 'Lazy-Loading File Browser',
    store,
    rootVisible: true,
    useArrows: true,
    animate: true,
    columns: [
      new TreeGridColumn({ text: 'Name', dataIndex: 'text', flex: 2 }),
      new Column({
        text: 'Size', dataIndex: 'size', width: 90,
        renderer: (v: unknown) => formatSize(v as number),
      }),
      new Column({
        text: 'Modified', dataIndex: 'modified', width: 140,
        renderer: (v: unknown) => formatDate(v as string),
      }),
      new Column({ text: 'Type', dataIndex: 'type', width: 80 }),
    ],
    height: 440,
  });

  grid.render(gridWrapper);

  // ── Async fetch logic ──
  // Track which nodes are currently loading or already loaded
  const loadingNodes = new Set<string>();
  const loadedNodes = new Set<string>();

  async function loadChildren(node: any): Promise<void> {
    const nodeId = node.id ?? node.text;
    if (loadingNodes.has(nodeId) || loadedNodes.has(nodeId)) return;

    loadingNodes.add(nodeId);
    // Visual: set a loading indicator text on the node
    const originalText = node.text;
    if (typeof (node as any).set === 'function') {
      (node as any).set('text', `${originalText} ⏳`);
    }
    store.expandNode(node);
    (grid as any)._view?.refresh();

    const startTime = Date.now();
    apiCallCount++;

    const controlsBar = document.getElementById('async-api-count');
    if (controlsBar) controlsBar.textContent = String(apiCallCount);

    const networkLog = document.getElementById('async-network-log');

    try {
      const res = await fetch(`/api/files?node=${encodeURIComponent(nodeId)}`);
      const latency = Date.now() - startTime;

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { success: boolean; children: any[]; total: number };

      if (!data.success) throw new Error('Server returned success:false');

      // Append children to the node
      for (const child of data.children) {
        const childNode = store.getRootNode().createNode?.({
          ...child,
          leaf: child.leaf ?? !child.hasChildren,
          expanded: false,
        }) ?? child;
        node.appendChild(childNode);
      }

      totalNodesLoaded += data.children.length;
      loadedNodes.add(nodeId);

      if (networkLog) {
        appendNetworkLog(networkLog, `GET /api/files?node=${nodeId} → 200 OK (${latency}ms) — ${data.children.length} items`);
      }
    } catch (err) {
      if (networkLog) {
        appendNetworkLog(networkLog, `GET /api/files?node=${nodeId} → ERROR: ${err} — click to retry`, true);
      }
      window.__logEvent?.('loadfail', `Node "${originalText}" failed to load: ${err}`);
    } finally {
      loadingNodes.delete(nodeId);
      // Restore original text
      if (typeof (node as any).set === 'function') {
        (node as any).set('text', originalText);
      }
      (grid as any)._view?.refresh();
      const totalEl = document.getElementById('async-total-count');
      if (totalEl) totalEl.textContent = String(totalNodesLoaded);
    }
  }

  // Listen for expand events to trigger lazy loading
  (store as any).on('nodeexpand', (_s: unknown, node: any) => {
    if (!node || node.isRoot()) return;
    const nodeId = node.id ?? node.text;
    if (!loadedNodes.has(nodeId) && !loadingNodes.has(nodeId)) {
      loadChildren(node);
    }
    window.__logEvent?.('nodeexpand', `"${node.text}"`);
  });

  (grid as any).on?.('itemclick', (_view: unknown, node: any) => {
    window.__logEvent?.('itemclick', `"${node.text}"`);
  });

  // ── Controls ──
  const controlContainer = document.getElementById('tab-controls');
  if (controlContainer) {
    const networkLogHtml = `<div id="async-network-log" class="network-log" style="height:100px;overflow-y:auto;font-family:monospace;font-size:12px;background:#1a1a2e;color:#a6e3a1;padding:8px;border-radius:4px;margin-top:8px"></div>`;
    new ControlBar(controlContainer, [
      {
        title: 'Network',
        controls: [
          { type: 'slider', label: 'Latency (ms)', field: 'latency', value: 400, min: 50, max: 2000 },
          { type: 'slider', label: 'Failure Rate %', field: 'failureRate', value: 0, min: 0, max: 50 },
          { type: 'button', label: 'Reload Tree', handler: () => {
            loadingNodes.clear(); loadedNodes.clear(); apiCallCount = 0; totalNodesLoaded = 0;
            store.setRoot({ id: 'root', text: 'My Files', expanded: false, leaf: false });
            (grid as any)._view?.refresh();
          }},
        ],
      },
      {
        title: 'Stats',
        controls: [
          { type: 'display', label: 'API Calls', id: 'async-api-count', value: '0' },
          { type: 'display', label: 'Nodes Loaded', id: 'async-total-count', value: '0' },
        ],
      },
    ], (field, value) => {
      if (field === 'latency') {
        MockServer.setLatency(100, Number(value));
      } else if (field === 'failureRate') {
        MockServer.setFailureRate(Number(value) / 100);
      }
    });
    controlContainer.insertAdjacentHTML('beforeend', networkLogHtml);
  }

  return {
    destroy() {
      MockServer.uninstall();
      grid.destroy?.();
    },
  };
}
