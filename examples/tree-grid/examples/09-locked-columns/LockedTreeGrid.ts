/**
 * Example 09: Locked Columns
 *
 * Demonstrates frozen/locked columns on the left with scrollable columns on the right.
 * The tree column is always in the locked panel. Vertical scroll is synchronized.
 */

import { TreeGrid, TreeGridColumn, Column, TreeGridLockable } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { DataGenerator } from '../../shared/DataGenerator.js';
import { ControlBar } from '../../shared/ControlBar.js';

function formatSize(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: unknown): string {
  if (!iso) return '—';
  return new Date(String(iso)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function createExample(container: HTMLElement): { destroy: () => void } {
  const data = DataGenerator.fileSystem({ depth: 3, breadth: 6 });
  const store = new TreeStore({
    root: { id: '__root__', text: 'File System', expanded: true, children: data as any[] },
  });

  // TreeGridLockable plugin enables split locked/scrollable column panels
  const lockable = new TreeGridLockable({});

  const grid = new TreeGrid({
    title: 'File System — Locked Columns',
    store,
    rootVisible: false,
    useArrows: true,
    plugins: [lockable] as any,
    columns: [
      // locked: true — this column stays in the left (locked) panel
      new TreeGridColumn({ text: 'Name', dataIndex: 'text', width: 220, locked: true } as any),
      new Column({ text: 'Type', dataIndex: 'type', width: 80, locked: true } as any),
      // The following columns are in the scrollable right panel
      new Column({ text: 'Size', dataIndex: 'size', width: 90, renderer: (v: unknown) => formatSize(v as number) }),
      new Column({ text: 'Modified', dataIndex: 'modified', width: 140, renderer: (v: unknown) => formatDate(v) }),
      new Column({ text: 'Owner', dataIndex: 'owner', width: 100 }),
      new Column({ text: 'Permissions', dataIndex: 'permissions', width: 110 }),
      new Column({
        text: 'Path', dataIndex: 'id', width: 250,
        renderer: (v: unknown) => `/files/${v}`,
      }),
    ],
    height: 460,
  });

  (grid as any).on?.('itemclick', (_view: unknown, node: any) => {
    window.__logEvent?.('itemclick', `"${node.text}" (${node.isLeaf() ? 'file' : 'folder'})`);
  });
  (grid as any).on?.('itemexpand', (node: any) => {
    window.__logEvent?.('itemexpand', `"${node.text}"`);
  });

  grid.render(container);

  const hint = document.createElement('div');
  hint.style.cssText = 'margin-top:8px;font-size:12px;color:#666;padding:4px 8px;background:#f8f9fa;border-radius:4px';
  hint.textContent = '💡 Scroll the grid horizontally — the Name and Type columns stay fixed on the left.';
  container.appendChild(hint);

  // Controls
  const controlContainer = document.getElementById('tab-controls');
  if (controlContainer) {
    new ControlBar(controlContainer, [
      {
        title: 'Locked Columns',
        controls: [
          { type: 'button', label: 'Expand All', handler: () => grid.expandAll() },
          { type: 'button', label: 'Collapse All', handler: () => grid.collapseAll() },
        ],
      },
    ], () => {});
  }

  return { destroy() { grid.destroy?.(); } };
}
