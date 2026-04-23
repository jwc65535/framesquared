/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { Viewport } from '@framesquared/ui';
import { MenuManager } from '@framesquared/ui';
import { createMenuDemoView } from '../src/MenuDemoView.js';
import type { MenuDemoViewRefs } from '../src/MenuDemoView.js';
import { MenuDemoController } from '../src/MenuDemoController.js';

// ---------------------------------------------------------------------------
// PointerEvent polyfill — jsdom 24 does not ship PointerEvent
// ---------------------------------------------------------------------------

beforeAll(() => {
  if (typeof globalThis.PointerEvent === 'undefined') {
    class PointerEvent extends MouseEvent {
      constructor(type: string, init?: PointerEventInit) {
        super(type, init);
      }
    }
    (globalThis as any).PointerEvent = PointerEvent;
  }
});

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let vp: Viewport;
let refs: MenuDemoViewRefs;
let controller: MenuDemoController;

beforeEach(() => {
  vp = new Viewport({ layout: { type: 'vbox', align: 'stretch' } });
  refs = createMenuDemoView(vp.getBodyEl());
  controller = new MenuDemoController(refs);
});

afterEach(() => {
  // Destroy standalone menus to clean up CheckItem radio-group registrations.
  refs.fileMenu.destroy();
  refs.optionsMenu.destroy();
  refs.contextMenu.destroy();
  vp.destroy();
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------------------
// Module-level helpers
// ---------------------------------------------------------------------------

/** Fires a contextmenu event on the content panel body to show the context menu. */
function fireContextMenu(x = 50, y = 50): void {
  const e = new MouseEvent('contextmenu', { clientX: x, clientY: y, bubbles: true });
  refs.contentPanel.getBodyEl().dispatchEvent(e);
}

/** Returns the visible text of a menu item's text span. */
function menuItemText(item: { el: HTMLElement | null }): string {
  return item.el!.querySelector('.x-menu-item-text')?.textContent ?? item.el!.textContent ?? '';
}

/** Returns the visible text of the status Button. */
function statusText(): string {
  return refs.status.el!.querySelector('.x-btn-text')?.textContent ?? refs.status.el!.textContent ?? '';
}

// ═══════════════════════════════════════════════════════════════════════════
// File menu — structure
// ═══════════════════════════════════════════════════════════════════════════

describe('File menu — structure', () => {
  beforeEach(() => { refs.fileMenu.showAt(0, 0); });

  it('renders New item with correct text', () => {
    expect(refs.newItem.el!.textContent).toContain('New');
  });

  it('renders Open item with correct text', () => {
    expect(refs.openItem.el!.textContent).toContain('Open');
  });

  it('renders Save item with correct text', () => {
    expect(refs.saveItem.el!.textContent).toContain('Save');
  });

  it('renders Close item with correct text', () => {
    expect(refs.closeItem.el!.textContent).toContain('Close');
  });

  it('renders Last File item with em-dash placeholder', () => {
    expect(menuItemText(refs.lastFileItem)).toContain('—');
  });

  it('has at least two MenuSeparators', () => {
    const seps = refs.fileMenu.el!.querySelectorAll('[role="separator"]');
    expect(seps.length).toBeGreaterThanOrEqual(2);
  });

  it('items have role="menuitem"', () => {
    expect(refs.newItem.el!.getAttribute('role')).toBe('menuitem');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Options menu — structure
// ═══════════════════════════════════════════════════════════════════════════

describe('Options menu — structure', () => {
  beforeEach(() => { refs.optionsMenu.showAt(0, 0); });

  it('renders Auto-Save CheckItem', () => {
    expect(refs.autoSave.el!.textContent).toContain('Auto-Save');
  });

  it('renders Spell Check CheckItem', () => {
    expect(refs.spellCheck.el!.textContent).toContain('Spell Check');
  });

  it('renders Light theme CheckItem', () => {
    expect(refs.light.el!.textContent).toContain('Light');
  });

  it('renders Dark theme CheckItem', () => {
    expect(refs.dark.el!.textContent).toContain('Dark');
  });

  it('has at least one MenuSeparator between toggles and radio group', () => {
    const seps = refs.optionsMenu.el!.querySelectorAll('[role="separator"]');
    expect(seps.length).toBeGreaterThanOrEqual(1);
  });

  it('CheckItems have role="menuitemcheckbox"', () => {
    expect(refs.autoSave.el!.getAttribute('role')).toBe('menuitemcheckbox');
    expect(refs.light.el!.getAttribute('role')).toBe('menuitemcheckbox');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Context menu — structure
// ═══════════════════════════════════════════════════════════════════════════

describe('Context menu — structure', () => {
  beforeEach(() => { fireContextMenu(); });

  it('renders Copy item', () => {
    expect(refs.ctxCopyItem.el!.textContent).toContain('Copy');
  });

  it('renders Paste item', () => {
    expect(refs.ctxPasteItem.el!.textContent).toContain('Paste');
  });

  it('renders Select All item', () => {
    expect(refs.ctxSelectAll.el!.textContent).toContain('Select All');
  });

  it('has a MenuSeparator between Paste and Select All', () => {
    const seps = refs.contextMenu.el!.querySelectorAll('[role="separator"]');
    expect(seps.length).toBeGreaterThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MenuItem — initial disabled state
// ═══════════════════════════════════════════════════════════════════════════

describe('MenuItem — initial state', () => {
  it('saveItem starts disabled', () => {
    expect(refs.saveItem.isDisabled()).toBe(true);
  });

  it('newItem starts enabled', () => {
    expect(refs.newItem.isDisabled()).toBe(false);
  });

  it('openItem starts enabled', () => {
    expect(refs.openItem.isDisabled()).toBe(false);
  });

  it('ctxPasteItem starts disabled', () => {
    expect(refs.ctxPasteItem.isDisabled()).toBe(true);
  });

  it('ctxCopyItem starts enabled', () => {
    expect(refs.ctxCopyItem.isDisabled()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CheckItem — initial state
// ═══════════════════════════════════════════════════════════════════════════

describe('CheckItem — initial state', () => {
  it('autoSave starts checked', () => {
    expect(refs.autoSave.isChecked()).toBe(true);
  });

  it('spellCheck starts unchecked', () => {
    expect(refs.spellCheck.isChecked()).toBe(false);
  });

  it('light starts checked (radio group)', () => {
    expect(refs.light.isChecked()).toBe(true);
  });

  it('dark starts unchecked (radio group)', () => {
    expect(refs.dark.isChecked()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// File menu — onNew()
// ═══════════════════════════════════════════════════════════════════════════

describe('File menu — onNew()', () => {
  it('enables saveItem', () => {
    controller.onNew();
    expect(refs.saveItem.isDisabled()).toBe(false);
  });

  it('updates lastFileItem text away from the em-dash placeholder', () => {
    refs.fileMenu.showAt(0, 0); // render items so _textEl is set
    controller.onNew();
    expect(menuItemText(refs.lastFileItem)).not.toContain('—');
  });

  it('sets a non-empty last file name', () => {
    refs.fileMenu.showAt(0, 0);
    controller.onNew();
    expect(menuItemText(refs.lastFileItem).trim().length).toBeGreaterThan(0);
  });

  it('updates the status display', () => {
    controller.onNew();
    expect(statusText()).not.toBe('Ready');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// File menu — onOpen()
// ═══════════════════════════════════════════════════════════════════════════

describe('File menu — onOpen()', () => {
  it('enables saveItem', () => {
    controller.onOpen();
    expect(refs.saveItem.isDisabled()).toBe(false);
  });

  it('updates lastFileItem text away from the em-dash placeholder', () => {
    refs.fileMenu.showAt(0, 0);
    controller.onOpen();
    expect(menuItemText(refs.lastFileItem)).not.toContain('—');
  });

  it('updates the status display', () => {
    controller.onOpen();
    expect(statusText()).not.toBe('Ready');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// File menu — onSave() / onClose()
// ═══════════════════════════════════════════════════════════════════════════

describe('File menu — onSave() and onClose()', () => {
  it('onSave updates the status display', () => {
    controller.onNew();                    // enable save first
    refs.status.setText('Ready');          // reset for clean assertion
    controller.onSave();
    expect(statusText()).not.toBe('Ready');
  });

  it('onClose disables saveItem', () => {
    controller.onNew();   // enable
    controller.onClose(); // should disable
    expect(refs.saveItem.isDisabled()).toBe(true);
  });

  it('onClose updates the status display', () => {
    refs.status.setText('Ready');
    controller.onClose();
    expect(statusText()).not.toBe('Ready');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MenuItem — click wiring
// ═══════════════════════════════════════════════════════════════════════════

describe('MenuItem — click wiring', () => {
  it('clicking newItem enables saveItem', () => {
    refs.fileMenu.showAt(0, 0);
    refs.newItem.el!.click();
    expect(refs.saveItem.isDisabled()).toBe(false);
  });

  it('clicking a disabled saveItem does not call its handler', () => {
    refs.fileMenu.showAt(0, 0);
    const before = statusText();
    refs.saveItem.el!.click(); // saveItem is disabled — handler must not fire
    expect(statusText()).toBe(before);
  });

  it('clicking closeItem after New disables saveItem again', () => {
    refs.fileMenu.showAt(0, 0);
    refs.newItem.el!.click();
    refs.fileMenu.showAt(0, 0); // re-show (closeAll hid it)
    refs.closeItem.el!.click();
    expect(refs.saveItem.isDisabled()).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CheckItem — standalone toggle
// ═══════════════════════════════════════════════════════════════════════════

describe('CheckItem — standalone toggle', () => {
  beforeEach(() => { refs.optionsMenu.showAt(0, 0); });

  it('clicking spellCheck (unchecked) toggles it on', () => {
    refs.spellCheck.el!.click();
    expect(refs.spellCheck.isChecked()).toBe(true);
  });

  it('clicking spellCheck twice returns it to unchecked', () => {
    refs.spellCheck.el!.click();
    refs.optionsMenu.showAt(0, 0); // re-show after closeAll
    refs.spellCheck.el!.click();
    expect(refs.spellCheck.isChecked()).toBe(false);
  });

  it('clicking autoSave (checked) toggles it off', () => {
    refs.autoSave.el!.click();
    expect(refs.autoSave.isChecked()).toBe(false);
  });

  it('onSpellCheckChange updates status with correct label', () => {
    controller.onSpellCheckChange(true);
    expect(statusText()).toContain('Spell Check');
  });

  it('onAutoSaveChange updates status with correct label', () => {
    controller.onAutoSaveChange(false);
    expect(statusText()).toContain('Auto-Save');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CheckItem — radio group mutual exclusion
// ═══════════════════════════════════════════════════════════════════════════

describe('CheckItem — radio group', () => {
  beforeEach(() => { refs.optionsMenu.showAt(0, 0); });

  it('clicking dark sets dark checked', () => {
    refs.dark.el!.click();
    expect(refs.dark.isChecked()).toBe(true);
  });

  it('clicking dark unchecks light (mutual exclusion)', () => {
    refs.dark.el!.click();
    expect(refs.light.isChecked()).toBe(false);
  });

  it('clicking light after dark resets selection to light', () => {
    refs.dark.el!.click();
    refs.optionsMenu.showAt(0, 0);
    refs.light.el!.click();
    expect(refs.light.isChecked()).toBe(true);
    expect(refs.dark.isChecked()).toBe(false);
  });

  it('onThemeChange updates status with the theme name', () => {
    controller.onThemeChange('Dark');
    expect(statusText()).toContain('Dark');
  });

  it('onThemeChange for Light updates status with Light', () => {
    controller.onThemeChange('Light');
    expect(statusText()).toContain('Light');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Context menu
// ═══════════════════════════════════════════════════════════════════════════

describe('Context menu', () => {
  it('is not visible before right-click', () => {
    expect(refs.contextMenu.isVisible()).toBe(false);
  });

  it('right-click on content panel shows the context menu', () => {
    fireContextMenu();
    expect(refs.contextMenu.isVisible()).toBe(true);
  });

  it('right-click positions menu at mouse coordinates', () => {
    fireContextMenu(120, 240);
    expect(refs.contextMenu.el!.style.left).toBe('120px');
    expect(refs.contextMenu.el!.style.top).toBe('240px');
  });

  it('onCopy enables ctxPasteItem', () => {
    controller.onCopy();
    expect(refs.ctxPasteItem.isDisabled()).toBe(false);
  });

  it('clicking ctxCopyItem enables Paste', () => {
    fireContextMenu();
    refs.ctxCopyItem.el!.click();
    expect(refs.ctxPasteItem.isDisabled()).toBe(false);
  });

  it('onPaste updates the status display', () => {
    refs.status.setText('Ready');
    controller.onPaste();
    expect(statusText()).not.toBe('Ready');
  });

  it('onSelectAll updates the status display', () => {
    refs.status.setText('Ready');
    controller.onSelectAll();
    expect(statusText()).not.toBe('Ready');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Status display
// ═══════════════════════════════════════════════════════════════════════════

describe('Status display', () => {
  it('starts with "Ready"', () => {
    expect(statusText()).toContain('Ready');
  });

  it('is disabled (read-only display)', () => {
    expect(refs.status.isDisabled()).toBe(true);
  });

  it('reflects onNew status text', () => {
    controller.onNew();
    expect(statusText()).not.toContain('Ready');
  });

  it('reflects onCopy status text', () => {
    controller.onCopy();
    expect(statusText()).toContain('clipboard');
  });

  it('reflects onSelectAll status text', () => {
    controller.onSelectAll();
    expect(statusText()).toContain('selected');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Menu visibility
// ═══════════════════════════════════════════════════════════════════════════

describe('Menu visibility', () => {
  it('fileMenu is not visible initially', () => {
    expect(refs.fileMenu.isVisible()).toBe(false);
  });

  it('optionsMenu is not visible initially', () => {
    expect(refs.optionsMenu.isVisible()).toBe(false);
  });

  it('fileMenu.showAt() makes it visible', () => {
    refs.fileMenu.showAt(10, 10);
    expect(refs.fileMenu.isVisible()).toBe(true);
  });

  it('fileMenu.hide() makes it not visible', () => {
    refs.fileMenu.showAt(10, 10);
    refs.fileMenu.hide();
    expect(refs.fileMenu.isVisible()).toBe(false);
  });

  it('MenuManager.closeAll() hides an open fileMenu', () => {
    refs.fileMenu.showAt(10, 10);
    MenuManager.getInstance().closeAll();
    expect(refs.fileMenu.isVisible()).toBe(false);
  });

  it('MenuManager.closeAll() hides an open contextMenu', () => {
    fireContextMenu();
    MenuManager.getInstance().closeAll();
    expect(refs.contextMenu.isVisible()).toBe(false);
  });

  it('onNew() closes open menus via setStatus', () => {
    refs.fileMenu.showAt(0, 0);
    controller.onNew();
    expect(refs.fileMenu.isVisible()).toBe(false);
  });
});
