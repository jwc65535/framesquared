/**
 * Example 01: Basic TreeGrid
 *
 * The simplest possible TreeGrid. Demonstrates:
 *  - TreeStore with inline hierarchical data
 *  - Three column types: TreeGridColumn, plain Column with renderer, DateColumn
 *  - rootVisible: false — root node is hidden, only its children shown
 *  - useArrows: true — triangle expand/collapse indicators
 *
 * This is the starting point for any TreeGrid application.
 */

import { TreeGrid, TreeGridColumn, Column } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { smallFileSystem } from '../../shared/SampleData.js';
import { ControlBar } from '../../shared/ControlBar.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Format a byte count as a human-readable size string.
 * e.g., 1024 → "1.0 KB", 1048576 → "1.0 MB"
 */
function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Format an ISO date string as "MMM D, YYYY" (e.g., "Mar 1, 2025").
 */
function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Source Code (shown in the "Source" tab) ─────────────────────────────────
const SOURCE = `import { TreeGrid, TreeGridColumn, Column } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';

const store = new TreeStore({
  root: {
    expanded: true,
    children: [
      { text: 'Documents', leaf: false, children: [
        { text: 'Q3-Report.pdf', leaf: true, size: 245760, modified: '2025-03-01' },
        { text: 'Meeting-Notes.docx', leaf: true, size: 32768, modified: '2025-03-10' },
      ]},
      { text: 'Pictures', leaf: false, children: [
        { text: 'beach-morning.jpg', leaf: true, size: 4194304, modified: '2024-07-15' },
      ]},
      // ...
    ]
  }
});

const treeGrid = new TreeGrid({
  title: 'File Browser',
  store,
  rootVisible: false,  // hide root node; show only children
  useArrows: true,     // triangle ▶/▼ expanders (vs +/-)
  animate: true,       // smooth expand/collapse animation
  columns: [
    new TreeGridColumn({ text: 'Name', dataIndex: 'text', flex: 2 }),
    new Column({
      text: 'Size', dataIndex: 'size', width: 100,
      renderer: (v) => formatFileSize(v),
    }),
    new Column({
      text: 'Modified', dataIndex: 'modified', width: 150,
      renderer: (v) => formatDate(v),
    }),
  ],
  renderTo: document.getElementById('container'),
  height: 480,
});`;

// ─── Create Example ──────────────────────────────────────────────────────────

export function createExample(container: HTMLElement): { destroy: () => void } {
  // Update the source tab if available
  const srcTab = document.getElementById('tab-source');
  if (srcTab) {
    srcTab.innerHTML = `<div id="source-view-01"></div>`;
    import('../../shared/SourceViewer.js').then(({ SourceViewer }) => {
      new SourceViewer(document.getElementById('source-view-01')!, { source: SOURCE });
    });
  }

  // ── Store ──
  // TreeStore accepts a root object. Setting expanded: true on the root
  // means the root's children are visible immediately.
  const store = new TreeStore({
    root: {
      id: '__root__',
      text: 'My Files',
      expanded: true,
      children: smallFileSystem as any[],
    },
  });

  // ── TreeGrid ──
  const grid = new TreeGrid({
    title: 'File Browser',
    store,
    // rootVisible: false hides the root node. Users see the top-level
    // folders (Documents, Pictures, etc.) as the first visible level.
    rootVisible: false,
    // useArrows: true shows ▶/▼ triangle indicators.
    // Set to false for +/- indicators (classic ExtJS style).
    useArrows: true,
    animate: true,
    columns: [
      new TreeGridColumn({
        text: 'Name',
        dataIndex: 'text',
        flex: 2,
      }),
      new Column({
        text: 'Size',
        dataIndex: 'size',
        width: 100,
        renderer: (v: unknown) => formatFileSize(v as number),
      }),
      new Column({
        text: 'Modified',
        dataIndex: 'modified',
        width: 150,
        renderer: (v: unknown) => formatDate(v as string),
      }),
      new Column({
        text: 'Type',
        dataIndex: 'type',
        width: 90,
        renderer: (v: unknown) => String(v ?? '—'),
      }),
    ],
    height: 480,
  });

  // Emit events to the showcase event log
  (grid as any).on?.('itemclick', (_view: unknown, node: any) => {
    window.__logEvent?.('itemclick', `Node: "${node.text}" (${node.isLeaf() ? 'file' : 'folder'})`);
  });
  (grid as any).on?.('itemexpand', (node: any) => {
    window.__logEvent?.('itemexpand', `Node: "${node.text}", Children: ${node.childNodes.length}`);
  });
  (grid as any).on?.('itemcollapse', (node: any) => {
    window.__logEvent?.('itemcollapse', `Node: "${node.text}"`);
  });

  grid.render(container);

  // ── Controls ──
  const controlContainer = document.getElementById('tab-controls');
  if (controlContainer) {
    new ControlBar(controlContainer, [
      {
        title: 'Tree Options',
        controls: [
          { type: 'checkbox', label: 'Root Visible', field: 'rootVisible', value: false },
          { type: 'checkbox', label: 'Use Arrows', field: 'useArrows', value: true },
          { type: 'checkbox', label: 'Animate', field: 'animate', value: true },
          { type: 'checkbox', label: 'Show Lines', field: 'lines', value: false },
        ],
      },
      {
        title: 'Actions',
        controls: [
          { type: 'button', label: 'Expand All', handler: () => grid.expandAll() },
          { type: 'button', label: 'Collapse All', handler: () => grid.collapseAll() },
        ],
      },
    ], (field, value) => {
      // Apply config changes by recreating the grid (simplest approach for this demo)
      // In production, use setters
      if (field === 'rootVisible') {
        (grid as any)._rootVisible = value;
        (grid as any)._view?.refresh();
      }
      window.__logEvent?.('controlchange', `${field} = ${value}`);
    });
  }

  return {
    destroy() {
      grid.destroy?.();
    },
  };
}
