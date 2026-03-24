/**
 * ext-ts Tree Explorer Example
 *
 * Demonstrates: TreePanel, TreeStore, checkable nodes, expand/collapse,
 * detail panel, Panel layout, search filtering.
 */

import { TreePanel, TreeStore } from '@ext-ts/grid';
import { Panel, Button, Toolbar } from '@ext-ts/ui';
import { TextField } from '@ext-ts/form';
import { ThemeManager, ModernTheme } from '@ext-ts/theme';

// ─── File System Tree ────────────────────────────────────────────────────

const fileStore = new TreeStore({
  root: {
    text: 'My Computer', expanded: true,
    children: [
      { id: 'docs', text: 'Documents', iconCls: 'icon-folder', children: [
        { id: 'work', text: 'Work', iconCls: 'icon-folder', children: [
          { id: 'report', text: 'Q4 Report.pdf', leaf: true, iconCls: 'icon-pdf' },
          { id: 'slides', text: 'Presentation.pptx', leaf: true, iconCls: 'icon-ppt' },
          { id: 'spreadsheet', text: 'Budget.xlsx', leaf: true, iconCls: 'icon-xls' },
        ]},
        { id: 'personal', text: 'Personal', iconCls: 'icon-folder', children: [
          { id: 'resume', text: 'Resume.pdf', leaf: true, iconCls: 'icon-pdf' },
          { id: 'notes', text: 'Notes.txt', leaf: true, iconCls: 'icon-txt' },
        ]},
      ]},
      { id: 'photos', text: 'Photos', iconCls: 'icon-folder', children: [
        { id: 'vacation', text: 'Vacation 2024', iconCls: 'icon-folder', children: [
          { id: 'beach', text: 'beach.jpg', leaf: true, iconCls: 'icon-img' },
          { id: 'sunset', text: 'sunset.jpg', leaf: true, iconCls: 'icon-img' },
        ]},
        { id: 'profile', text: 'profile.png', leaf: true, iconCls: 'icon-img' },
      ]},
      { id: 'music', text: 'Music', iconCls: 'icon-folder', children: [
        { id: 'song1', text: 'favorite-track.mp3', leaf: true, iconCls: 'icon-music' },
      ]},
      { id: 'downloads', text: 'Downloads', iconCls: 'icon-folder', children: [
        { id: 'installer', text: 'app-installer.dmg', leaf: true },
        { id: 'archive', text: 'backup.zip', leaf: true },
      ]},
    ],
  },
});

// ─── Theme ───────────────────────────────────────────────────────────────

ThemeManager.register(ModernTheme);
ThemeManager.setTheme('modern');

// ─── UI ──────────────────────────────────────────────────────────────────

// Tree panel (left side)
const treePanel = new TreePanel({
  title: 'Files',
  store: fileStore,
  checkable: true,
  cascadeCheck: true,
  rootVisible: true,
});

// Detail panel (right side)
const detailPanel = new Panel({
  title: 'File Details',
  html: '<p>Select a file to see details</p>',
});

// Toolbar with actions
const toolbar = new Toolbar({
  items: [
    new Button({
      text: 'Expand All',
      handler: () => treePanel.expandAll(),
    }),
    new Button({
      text: 'Collapse All',
      handler: () => treePanel.collapseAll(),
    }),
    new Button({
      text: 'Get Checked',
      handler: () => {
        const checked = treePanel.getChecked();
        const names = checked.map(n => (n as any).text || 'unknown');
        detailPanel.setHtml(`<p><strong>Checked (${names.length}):</strong><br>${names.join('<br>')}</p>`);
      },
    }),
  ],
});

// Main layout
const mainPanel = new Panel({
  title: 'File Explorer',
  renderTo: document.body,
  dockedItems: [toolbar],
  items: [treePanel, detailPanel],
});
