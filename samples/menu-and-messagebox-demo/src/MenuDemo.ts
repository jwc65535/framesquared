import '@framesquared/layout';
import {
  Panel, Viewport, Button, Toolbar,
  Menu, MenuItem, CheckItem, MenuSeparator,
  MessageBox, SplitButton, MenuManager,
} from '@framesquared/ui';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface MenuDemoRefs {
  // ── SplitButton: New Document ─────────────────────────────────────────────
  newBtn:              SplitButton;
  newMenu:             Menu;
  newSpreadsheetItem:  MenuItem;
  newPresentationItem: MenuItem;
  newFolderItem:       MenuItem;

  // ── File menu ─────────────────────────────────────────────────────────────
  fileBtn:    Button;
  fileMenu:   Menu;
  openItem:   MenuItem;
  saveItem:   MenuItem;
  saveAsItem: MenuItem;
  deleteItem: MenuItem;

  // ── View menu ─────────────────────────────────────────────────────────────
  viewBtn:       Button;
  viewMenu:      Menu;
  viewListItem:   CheckItem;
  viewGridItem:   CheckItem;
  viewDetailItem: CheckItem;
  showToolbarItem: CheckItem;
  showStatusItem:  CheckItem;

  // ── Counters ──────────────────────────────────────────────────────────────
  newDocCallCount: { value: number };
  lastCreatedType: { value: string };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createMenuDemo(host: Element): MenuDemoRefs {
  const newDocCallCount = { value: 0 };
  const lastCreatedType = { value: '' };

  // ── New Document drop-down ─────────────────────────────────────────────────
  const newSpreadsheetItem = new MenuItem({
    text: 'New Spreadsheet',
    handler: () => { lastCreatedType.value = 'spreadsheet'; },
  });
  const newPresentationItem = new MenuItem({
    text: 'New Presentation',
    handler: () => { lastCreatedType.value = 'presentation'; },
  });
  const newFolderItem = new MenuItem({
    text: 'New Folder',
    handler: () => { lastCreatedType.value = 'folder'; },
  });

  const newMenu = new Menu({
    items: [newSpreadsheetItem, newPresentationItem, new MenuSeparator(), newFolderItem],
  });

  const newBtn = new SplitButton({
    text: 'New Document',
    handler: () => {
      newDocCallCount.value++;
      lastCreatedType.value = 'document';
    },
    arrowHandler: (btn) => {
      newMenu.showBy(btn);
    },
  });

  // ── File menu ──────────────────────────────────────────────────────────────
  const openItem = new MenuItem({
    text: 'Open…',
    handler: () => {
      MenuManager.getInstance().closeAll();
      MessageBox.prompt('Open File', 'Enter the filename to open:');
    },
  });

  const saveItem = new MenuItem({
    text: 'Save',
    handler: () => { MenuManager.getInstance().closeAll(); },
  });

  const saveAsItem = new MenuItem({
    text: 'Save As…',
    handler: () => { MenuManager.getInstance().closeAll(); },
  });

  const deleteItem = new MenuItem({
    text: 'Delete File',
    handler: () => {
      MenuManager.getInstance().closeAll();
      MessageBox.confirm(
        'Delete File',
        'Are you sure you want to permanently delete this file? This cannot be undone.',
      );
    },
  });

  const fileMenu = new Menu({
    items: [openItem, saveItem, saveAsItem, new MenuSeparator(), deleteItem],
  });

  const fileBtn = new Button({
    text: 'File',
    ui: 'default',
    handler: () => fileMenu.showBy(fileBtn),
  });

  // ── View menu ──────────────────────────────────────────────────────────────
  const viewListItem   = new CheckItem({ text: 'List View',       checked: true,  group: 'view-mode' });
  const viewGridItem   = new CheckItem({ text: 'Grid View',       checked: false, group: 'view-mode' });
  const viewDetailItem = new CheckItem({ text: 'Detail View',     checked: false, group: 'view-mode' });
  const showToolbarItem = new CheckItem({ text: 'Show Toolbar',    checked: true });
  const showStatusItem  = new CheckItem({ text: 'Show Status Bar', checked: true });

  const viewMenu = new Menu({
    items: [
      viewListItem, viewGridItem, viewDetailItem,
      new MenuSeparator(),
      showToolbarItem, showStatusItem,
    ],
  });

  const viewBtn = new Button({
    text: 'View',
    ui: 'default',
    handler: () => viewMenu.showBy(viewBtn),
  });

  // ── Toolbar ────────────────────────────────────────────────────────────────
  const toolbar = new Toolbar({
    items: [
      newBtn,
      '-',
      fileBtn,
      viewBtn,
      '->',
      new Button({
        text: 'About',
        ui: 'default',
        handler: () => MessageBox.alert(
          'framesquared',
          'Menu &amp; MessageBox Demonstration — framesquared v0.0.1',
        ),
      }),
    ],
  });

  // ── Wrapper (renders everything into host) ─────────────────────────────────
  new Panel({
    renderTo: host,
    header: false,
    layout: { type: 'vbox', align: 'stretch' },
    items: [toolbar],
  });

  return {
    newBtn, newMenu, newSpreadsheetItem, newPresentationItem, newFolderItem,
    fileBtn, fileMenu, openItem, saveItem, saveAsItem, deleteItem,
    viewBtn, viewMenu, viewListItem, viewGridItem, viewDetailItem,
    showToolbarItem, showStatusItem,
    newDocCallCount, lastCreatedType,
  };
}

// ---------------------------------------------------------------------------
// Viewport — used by src/App.ts
// ---------------------------------------------------------------------------

export function createViewport(): Viewport {
  const vp = new Viewport({ layout: { type: 'vbox', align: 'stretch' } });
  createMenuDemo(vp.getBodyEl());
  return vp;
}
