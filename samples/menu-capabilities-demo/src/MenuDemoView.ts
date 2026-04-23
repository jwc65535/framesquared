/**
 * menu-capabilities-demo — MenuDemoView
 *
 * Demonstrates every Menu capability the framework supports:
 *   - Standard MenuItems with icons and click handlers (wired by Controller)
 *   - MenuHeader for visual section grouping
 *   - MenuSeparator between groups
 *   - CheckItems with independent toggle state
 *   - CheckItems in a radio group (mutual exclusion)
 *   - Nested sub-menus (MenuItem.menu + showBy in handler)
 *   - Dynamic text via MenuItem.setText()
 *   - Dynamic enable/disable via Component.enable() / disable()
 *   - Context menu triggered by right-click on a content area
 *   - Toolbar embedding of menu trigger buttons
 *   - Resizable panel via Resizable from @framesquared/dd (handles wired by Controller)
 *
 * The View is intentionally handler-free: all business logic belongs to
 * MenuDemoController so that the view can be tested in isolation.
 * Only structural wiring (showing menus on button/item click) lives here.
 */

import '@framesquared/layout';
import {
  Button,
  Menu,
  MenuHeader,
  MenuItem,
  MenuSeparator,
  CheckItem,
  Toolbar,
  Panel,
  Viewport,
} from '@framesquared/ui';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface MenuDemoViewRefs {
  // ── Toolbar ───────────────────────────────────────────────────────────────
  editBtn:       Button;
  viewBtn:       Button;
  statusDisplay: Button;

  // ── Edit menu ─────────────────────────────────────────────────────────────
  editMenu:  Menu;
  newItem:   MenuItem;
  saveItem:  MenuItem;
  undoItem:  MenuItem;
  redoItem:  MenuItem;
  copyItem:  MenuItem;
  pasteItem: MenuItem;

  // ── View menu ─────────────────────────────────────────────────────────────
  viewMenu:        Menu;
  lightThemeItem:  CheckItem;
  darkThemeItem:   CheckItem;
  fontSizeItem:    MenuItem;
  fontSizeSubMenu: Menu;
  fontSizeSmall:   MenuItem;
  fontSizeMedium:  MenuItem;
  fontSizeLarge:   MenuItem;
  fontSizeXLarge:  MenuItem;
  showSidebarItem: CheckItem;
  showPreviewItem: CheckItem;

  // ── Context menu ─────────────────────────────────────────────────────────
  contextMenu:       Menu;
  ctxCopyItem:       MenuItem;
  ctxCutItem:        MenuItem;
  ctxPasteItem:      MenuItem;
  ctxSelectAllItem:  MenuItem;
  ctxPropertiesItem: MenuItem;

  // ── Content area ─────────────────────────────────────────────────────────
  contentPanel: Panel;

  // ── Resizable panel ───────────────────────────────────────────────────────
  resizablePanel: Panel;
  resizeCount:    { value: number };
  lastResizeW:    { value: number };
  lastResizeH:    { value: number };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createMenuDemoView(host: Element): MenuDemoViewRefs {

  // ── Font size sub-menu ────────────────────────────────────────────────────
  const fontSizeSmall  = new MenuItem({ text: 'Small'   });
  const fontSizeMedium = new MenuItem({ text: 'Medium'  });
  const fontSizeLarge  = new MenuItem({ text: 'Large'   });
  const fontSizeXLarge = new MenuItem({ text: 'X-Large' });

  const fontSizeSubMenu = new Menu({
    items: [fontSizeSmall, fontSizeMedium, fontSizeLarge, fontSizeXLarge],
  });

  // ── Edit menu ─────────────────────────────────────────────────────────────
  const newItem  = new MenuItem({ text: 'New Note', iconCls: 'x-icon-new'  });
  const saveItem = new MenuItem({ text: 'Save',     iconCls: 'x-icon-save' });

  // undoItem starts disabled; Controller enables it and updates its text after Save.
  const undoItem = new MenuItem({ text: 'Undo', disabled: true });
  const redoItem = new MenuItem({ text: 'Redo', disabled: true });

  const copyItem  = new MenuItem({ text: 'Copy'  });
  // pasteItem starts disabled; Controller enables it after Copy/Cut.
  const pasteItem = new MenuItem({ text: 'Paste', disabled: true });

  const editMenu = new Menu({
    items: [
      new MenuHeader({ text: 'Document' }),
      newItem,
      saveItem,
      new MenuSeparator(),
      new MenuHeader({ text: 'History' }),
      undoItem,
      redoItem,
      new MenuSeparator(),
      new MenuHeader({ text: 'Clipboard' }),
      copyItem,
      pasteItem,
    ],
  });

  // ── View menu ─────────────────────────────────────────────────────────────
  // Radio group — only one theme can be active at a time.
  const lightThemeItem = new CheckItem({ text: 'Light', group: 'noteTheme', checked: true  });
  const darkThemeItem  = new CheckItem({ text: 'Dark',  group: 'noteTheme', checked: false });

  // fontSizeItem shows its sub-menu when clicked (structural wiring in view).
  const fontSizeItem = new MenuItem({
    text:    'Text Size',
    menu:    fontSizeSubMenu,
    handler: (item) => fontSizeSubMenu.showBy(item),
  });

  const showSidebarItem = new CheckItem({ text: 'Show Sidebar', checked: true  });
  const showPreviewItem = new CheckItem({ text: 'Show Preview', checked: false });

  const viewMenu = new Menu({
    items: [
      new MenuHeader({ text: 'Theme' }),
      lightThemeItem,
      darkThemeItem,
      new MenuSeparator(),
      new MenuHeader({ text: 'Text Size' }),
      fontSizeItem,
      new MenuSeparator(),
      new MenuHeader({ text: 'Panels' }),
      showSidebarItem,
      showPreviewItem,
    ],
  });

  // ── Context menu ──────────────────────────────────────────────────────────
  const ctxCopyItem       = new MenuItem({ text: 'Copy'             });
  const ctxCutItem        = new MenuItem({ text: 'Cut'              });
  const ctxPasteItem      = new MenuItem({ text: 'Paste', disabled: true });
  const ctxSelectAllItem  = new MenuItem({ text: 'Select All'       });
  const ctxPropertiesItem = new MenuItem({ text: 'Note Properties'  });

  const contextMenu = new Menu({
    items: [
      ctxCopyItem,
      ctxCutItem,
      ctxPasteItem,
      new MenuSeparator(),
      ctxSelectAllItem,
      new MenuSeparator(),
      ctxPropertiesItem,
    ],
  });

  // ── Toolbar ───────────────────────────────────────────────────────────────
  const editBtn = new Button({
    text:    'Edit',
    handler: (btn) => editMenu.showBy(btn),
  });

  const viewBtn = new Button({
    text:    'View',
    handler: (btn) => viewMenu.showBy(btn),
  });

  const statusDisplay = new Button({
    text:     'Ready',
    disabled: true,
    ui:       'default',
  });

  const toolbar = new Toolbar({
    items: [editBtn, viewBtn, '->', statusDisplay],
  });

  // ── Content panel (right-click triggers context menu) ────────────────────
  const contentPanel = new Panel({
    title: 'Content Area — right-click for context menu',
    flex:  1,
  });

  // ── Outer panel ───────────────────────────────────────────────────────────
  new Panel({
    renderTo: host,
    header:   false,
    layout:   { type: 'vbox', align: 'stretch' },
    items:    [toolbar, contentPanel],
  });

  // Wire context menu after render (structural view concern, not business logic).
  contentPanel.getBodyEl().addEventListener('contextmenu', (e: Event) => {
    e.preventDefault();
    const me = e as MouseEvent;
    contextMenu.showAt(me.clientX, me.clientY);
  });

  // ── Resizable panel ───────────────────────────────────────────────────────
  // Rendered into the content panel body with explicit dimensions so that
  // Resizable (wired by Controller) can read startW/startH from el.style.
  const resizablePanel = new Panel({
    renderTo: contentPanel.getBodyEl(),
    title:    'Resizable Panel — drag the SE corner or edges',
    width:    300,
    height:   150,
  });

  const resizeCount = { value: 0 };
  const lastResizeW = { value: 300 };
  const lastResizeH = { value: 150 };

  return {
    editBtn, viewBtn, statusDisplay,
    editMenu, newItem, saveItem, undoItem, redoItem, copyItem, pasteItem,
    viewMenu, lightThemeItem, darkThemeItem,
    fontSizeItem, fontSizeSubMenu, fontSizeSmall, fontSizeMedium, fontSizeLarge, fontSizeXLarge,
    showSidebarItem, showPreviewItem,
    contextMenu, ctxCopyItem, ctxCutItem, ctxPasteItem, ctxSelectAllItem, ctxPropertiesItem,
    contentPanel,
    resizablePanel, resizeCount, lastResizeW, lastResizeH,
  };
}

// ---------------------------------------------------------------------------
// Viewport entry point — used by src/App.ts
// ---------------------------------------------------------------------------

export function createViewport(): Viewport {
  const vp = new Viewport({ layout: { type: 'vbox', align: 'stretch' } });
  createMenuDemoView(vp.getBodyEl());
  return vp;
}
