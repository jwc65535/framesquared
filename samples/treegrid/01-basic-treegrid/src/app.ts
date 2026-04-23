/**
 * treegrid/01-basic-treegrid — app.ts
 *
 * Demonstrates TreeGrid bound to a hierarchical TreeStore.
 * Ports the classic file-system browser pattern to framesquared's
 * type-safe, class-based architecture.
 *
 *   store         — nested file-system data (Documents, Photos, sub-folders)
 *   grid          — TreeGrid with 3 columns: Name (tree), Type, Size
 *   expandAllBtn  — expands every node in the tree
 *   collapseAllBtn — collapses all nodes back to root children
 *
 * Architecture:
 *   createBasicTreeGrid(host) — pure factory; testable in isolation
 *   BasicTreeGridApp          — Application subclass; wires factory into Viewport
 *
 * The Application auto-start is guarded so importing this module during Vitest
 * does not trigger the browser launch sequence.
 */

import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { ModernTheme } from '@framesquared/theme';
import { Button, TreeGrid, Viewport } from '@framesquared/ui';
import { TreeStore, TreeModel } from '@framesquared/data';

// ---------------------------------------------------------------------------
// Public refs interface
// ---------------------------------------------------------------------------

export interface BasicTreeGridRefs {
  grid: TreeGrid;
  store: TreeStore;
  expandAllBtn: Button;
  collapseAllBtn: Button;
}

// ---------------------------------------------------------------------------
// View factory
// ---------------------------------------------------------------------------

export function createBasicTreeGrid(host: Element): BasicTreeGridRefs {
  // ── Store ────────────────────────────────────────────────────────────────
  const store = new TreeStore({
    model: TreeModel,
    root: {
      id: 'root',
      text: 'My Computer',
      expanded: true,
      children: [
        {
          id: 'docs',
          text: 'Documents',
          type: 'Folder',
          size: '',
          children: [
            { id: 'resume',  text: 'Resume.pdf',   type: 'PDF',         size: '128 KB', leaf: true },
            { id: 'budget',  text: 'Budget.xlsx',   type: 'Spreadsheet', size: '256 KB', leaf: true },
            {
              id: 'projects',
              text: 'Projects',
              type: 'Folder',
              size: '',
              children: [
                { id: 'website', text: 'Website.psd', type: 'Image', size: '4.5 MB', leaf: true },
              ],
            },
          ],
        },
        {
          id: 'photos',
          text: 'Photos',
          type: 'Folder',
          size: '',
          children: [
            { id: 'vacation', text: 'Vacation.jpg', type: 'Image', size: '2.1 MB', leaf: true },
            { id: 'family',   text: 'Family.png',   type: 'Image', size: '1.8 MB', leaf: true },
          ],
        },
      ],
    },
  });

  // ── Buttons (late binding via let) ────────────────────────────────────────
  // Buttons are created before the grid so they can be passed to tbar,
  // but the handlers close over `grid` which is assigned immediately after.
  let grid!: TreeGrid;

  const expandAllBtn = new Button({
    text:    'Expand All',
    iconCls: 'x-icon-expand',
    handler: () => grid.expandAll(),
  });

  const collapseAllBtn = new Button({
    text:    'Collapse All',
    iconCls: 'x-icon-collapse',
    handler: () => grid.collapseAll(),
  });

  // ── TreeGrid ─────────────────────────────────────────────────────────────
  grid = new TreeGrid({
    renderTo:  host,
    title:     'File System Browser',
    height:    400,
    store,
    tbar:      [expandAllBtn, collapseAllBtn],
    columns: [
      { dataIndex: 'text', text: 'Name', flex: 1  },
      { dataIndex: 'type', text: 'Type', width: 120 },
      { dataIndex: 'size', text: 'Size', width: 100 },
    ],
  } as any);

  return { grid, store, expandAllBtn, collapseAllBtn };
}

// ---------------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------------

class BasicTreeGridApp extends Application {
  constructor() {
    super({ name: 'BasicTreeGrid', theme: ModernTheme });
  }

  override launch(): void {
    const vp = new Viewport({ layout: { type: 'fit' } });
    createBasicTreeGrid(vp.getBodyEl());
  }
}

// Guard: do not auto-start when this module is imported by the test runner.
if (import.meta.env.MODE !== 'test') {
  new BasicTreeGridApp().start();
}
