/**
 * menu-demo — MenuDemoView
 *
 * Demonstrates the four framesquared menu components:
 *   Menu, MenuItem, MenuSeparator, CheckItem
 *
 * Layout:
 *   ┌────────────────────────────────────────────┐
 *   │  Toolbar: [File] [Options]    → [status]   │
 *   ├────────────────────────────────────────────┤
 *   │  Content panel (right-click → context menu)│
 *   └────────────────────────────────────────────┘
 *
 * The View owns only structural wiring (showing menus on button/item click).
 * All business logic belongs to MenuDemoController.
 */

import '@framesquared/layout';
import {
  Button,
  CheckItem,
  Menu,
  MenuItem,
  MenuSeparator,
  Panel,
  Toolbar,
} from '@framesquared/ui';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface MenuDemoViewRefs {
  // ── Toolbar ───────────────────────────────────────────────────────────────
  fileBtn:    Button;
  optionsBtn: Button;
  status:     Button;

  // ── File menu ─────────────────────────────────────────────────────────────
  fileMenu:     Menu;
  newItem:      MenuItem;
  openItem:     MenuItem;
  saveItem:     MenuItem;   // starts disabled
  lastFileItem: MenuItem;   // text updated by Controller after New/Open
  closeItem:    MenuItem;

  // ── Options menu ──────────────────────────────────────────────────────────
  optionsMenu: Menu;
  autoSave:    CheckItem;   // standalone toggle, starts checked
  spellCheck:  CheckItem;   // standalone toggle, starts unchecked
  light:       CheckItem;   // radio group 'theme', starts checked
  dark:        CheckItem;   // radio group 'theme', starts unchecked

  // ── Context menu ──────────────────────────────────────────────────────────
  contextMenu:   Menu;
  ctxCopyItem:   MenuItem;
  ctxPasteItem:  MenuItem;  // starts disabled
  ctxSelectAll:  MenuItem;

  // ── Content area ─────────────────────────────────────────────────────────
  contentPanel: Panel;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createMenuDemoView(host: Element): MenuDemoViewRefs {

  // ── File menu ─────────────────────────────────────────────────────────────
  const newItem      = new MenuItem({ text: 'New'          });
  const openItem     = new MenuItem({ text: 'Open'         });
  const saveItem     = new MenuItem({ text: 'Save', disabled: true });
  const lastFileItem = new MenuItem({ text: 'Last File: —' });
  const closeItem    = new MenuItem({ text: 'Close'        });

  const fileMenu = new Menu({
    items: [
      newItem,
      openItem,
      saveItem,
      new MenuSeparator(),
      lastFileItem,
      new MenuSeparator(),
      closeItem,
    ],
  });

  // ── Options menu ──────────────────────────────────────────────────────────
  const autoSave   = new CheckItem({ text: 'Auto-Save',   checked: true  });
  const spellCheck = new CheckItem({ text: 'Spell Check', checked: false });
  const light      = new CheckItem({ text: 'Light', group: 'theme', checked: true  });
  const dark       = new CheckItem({ text: 'Dark',  group: 'theme', checked: false });

  const optionsMenu = new Menu({
    items: [
      autoSave,
      spellCheck,
      new MenuSeparator(),
      light,
      dark,
    ],
  });

  // ── Context menu ──────────────────────────────────────────────────────────
  const ctxCopyItem  = new MenuItem({ text: 'Copy'                 });
  const ctxPasteItem = new MenuItem({ text: 'Paste', disabled: true });
  const ctxSelectAll = new MenuItem({ text: 'Select All'           });

  const contextMenu = new Menu({
    items: [
      ctxCopyItem,
      ctxPasteItem,
      new MenuSeparator(),
      ctxSelectAll,
    ],
  });

  // ── Toolbar ───────────────────────────────────────────────────────────────
  const fileBtn = new Button({
    text:    'File',
    handler: (btn) => fileMenu.showBy(btn),
  });

  const optionsBtn = new Button({
    text:    'Options',
    handler: (btn) => optionsMenu.showBy(btn),
  });

  const status = new Button({
    text:     'Ready',
    disabled: true,
  });

  const toolbar = new Toolbar({
    items: [fileBtn, optionsBtn, '->', status],
  });

  // ── Content panel ─────────────────────────────────────────────────────────
  const contentPanel = new Panel({
    header: false,
    flex:   1,
  });

  // ── Outer container ───────────────────────────────────────────────────────
  new Panel({
    renderTo: host,
    header:   false,
    layout:   { type: 'vbox', align: 'stretch' },
    items:    [toolbar, contentPanel],
  });

  // Wire context menu on right-click (structural view concern, not business logic).
  contentPanel.getBodyEl().addEventListener('contextmenu', (e: Event) => {
    e.preventDefault();
    const me = e as MouseEvent;
    contextMenu.showAt(me.clientX, me.clientY);
  });

  return {
    fileBtn, optionsBtn, status,
    fileMenu, newItem, openItem, saveItem, lastFileItem, closeItem,
    optionsMenu, autoSave, spellCheck, light, dark,
    contextMenu, ctxCopyItem, ctxPasteItem, ctxSelectAll,
    contentPanel,
  };
}
