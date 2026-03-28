/**
 * Example 06: Drag and Drop
 *
 * Demonstrates drag-and-drop reordering within a TreeGrid:
 *  - Drag files between folders
 *  - Drop position indicators (before/after sibling, into folder)
 *  - Auto-expand hovered folders after a delay
 *  - Circular drag prevention (can't drop into own descendant)
 */

import { TreeGrid, TreeGridColumn, Column, TreeGridDragDrop } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { smallFileSystem } from '../../shared/SampleData.js';
import { ControlBar } from '../../shared/ControlBar.js';

function formatSize(bytes: number): string {
  if (!bytes || bytes === 0) return '—';
  if (bytes < 1024) return `${(bytes).toFixed(0)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function createExample(container: HTMLElement): { destroy: () => void } {
  const store = new TreeStore({
    root: { id: '__root__', text: 'My Files', expanded: true, children: smallFileSystem as any[] },
  });

  // TreeGridDragDrop plugin adds drag handles and drop zones
  const dd = new TreeGridDragDrop({
    // ddGroup: name for grouping — drag/drop only works between grids with the same group
    ddGroup: 'tree-dnd-01',
    // appendOnly: true — only allow dropping INTO folders (not between items)
    appendOnly: false,
    // sortOnDrop: true — after dropping, sort siblings alphabetically
    sortOnDrop: false,
    // expandDelay: ms to hover over collapsed folder before it auto-expands
    expandDelay: 600,
    // enableDrag: enable dragging from this grid
    enableDrag: true,
    // enableDrop: enable dropping onto this grid
    enableDrop: true,
  });

  const grid = new TreeGrid({
    title: 'Drag & Drop File Manager',
    store,
    rootVisible: false,
    useArrows: true,
    animate: true,
    enableDrag: true,
    enableDrop: true,
    plugins: [dd] as any,
    columns: [
      new TreeGridColumn({ text: 'Name', dataIndex: 'text', flex: 2 }),
      new Column({ text: 'Size', dataIndex: 'size', width: 90, renderer: (v: unknown) => formatSize(v as number) }),
      new Column({ text: 'Modified', dataIndex: 'modified', width: 130, renderer: (v: unknown) => formatDate(v as string) }),
      new Column({ text: 'Type', dataIndex: 'type', width: 80 }),
    ],
    height: 460,
  });

  // Log drag events
  (grid as any).on?.('beforenodedrop', (dropData: any) => {
    window.__logEvent?.('beforenodedrop', `Attempting to drop "${dropData?.dragData?.node?.text}"`);
  });
  (grid as any).on?.('nodedrop', (dropData: any) => {
    window.__logEvent?.('nodedrop', `Dropped "${dropData?.dragData?.node?.text}" onto "${dropData?.target?.text}"`);
    const lastAction = document.getElementById('dd-last-action');
    if (lastAction && dropData?.dragData?.node) {
      lastAction.textContent = `Moved "${dropData.dragData.node.text}" to "${dropData.target?.text ?? 'root'}"`;
    }
  });
  (grid as any).on?.('itemclick', (_view: unknown, node: any) => {
    window.__logEvent?.('itemclick', `"${node.text}"`);
  });

  grid.render(container);

  // Add a hint
  const hint = document.createElement('div');
  hint.style.cssText = 'margin-top:8px;font-size:12px;color:#666;padding:4px 8px;background:#f8f9fa;border-radius:4px';
  hint.textContent = '💡 Drag a file to another folder. Hover over a collapsed folder to auto-expand it.';
  container.appendChild(hint);

  // Controls
  const controlContainer = document.getElementById('tab-controls');
  if (controlContainer) {
    new ControlBar(controlContainer, [
      {
        title: 'Drag & Drop Options',
        controls: [
          { type: 'checkbox', label: 'Append Only', field: 'appendOnly', value: false },
          { type: 'checkbox', label: 'Sort On Drop', field: 'sortOnDrop', value: false },
          { type: 'slider', label: 'Expand Delay (ms)', field: 'expandDelay', value: 600, min: 100, max: 2000 },
        ],
      },
      {
        title: 'Status',
        controls: [
          { type: 'display', label: 'Last Action', id: 'dd-last-action', value: '—' },
        ],
      },
    ], (field, value) => {
      if (field === 'appendOnly') (dd as any).appendOnly = value;
      if (field === 'sortOnDrop') (dd as any).sortOnDrop = value;
      if (field === 'expandDelay') (dd as any).expandDelay = Number(value);
    });
  }

  return { destroy() { grid.destroy?.(); } };
}
