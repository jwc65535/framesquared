/**
 * TDD suite for menu-capabilities-demo
 *
 * Tests are grouped by spec requirement so that a failure immediately
 * names the capability that broke.  The View and Controller are
 * instantiated together in beforeEach — this mirrors production and gives
 * full end-to-end coverage of handler wiring.
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { createMenuDemoView, type MenuDemoViewRefs } from '../src/MenuDemoView.js';
import { MenuDemoController } from '../src/MenuDemoController.js';

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let host: HTMLDivElement;
let refs: MenuDemoViewRefs;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  Application.clearInstance();
  refs = createMenuDemoView(host);
  new MenuDemoController(refs);   // wires all handlers
});

afterEach(() => {
  host.remove();
  document.body.innerHTML = '';
  Application.clearInstance();
});

// ---------------------------------------------------------------------------
// Application lifecycle
// ---------------------------------------------------------------------------

describe('Application lifecycle', () => {
  it('singleton resets cleanly', () => {
    Application.clearInstance();
    expect(Application.getInstance()).toBeNull();
  });

  it('Application.start() calls launch()', () => {
    Application.clearInstance();
    let launched = false;
    class TestApp extends Application {
      constructor() { super({ name: 'test' }); }
      override launch() { launched = true; }
    }
    new TestApp().start();
    expect(launched).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Renders — toolbar, menus, content panel
// ---------------------------------------------------------------------------

describe('Initial render', () => {
  it('toolbar is rendered in the host', () => {
    expect(host.querySelector('.x-toolbar')).toBeTruthy();
  });

  it('Edit button is rendered', () => {
    expect(refs.editBtn.el).toBeTruthy();
  });

  it('View button is rendered', () => {
    expect(refs.viewBtn.el).toBeTruthy();
  });

  it('status display button is rendered', () => {
    expect(refs.statusDisplay.el).toBeTruthy();
  });

  it('status display shows "Ready" initially', () => {
    expect(refs.statusDisplay.el!.textContent).toContain('Ready');
  });

  it('content panel is rendered in the host', () => {
    expect(refs.contentPanel.el).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Standard menu items — §2 "Standard Menu Items"
// ---------------------------------------------------------------------------

describe('Standard menu items', () => {
  it('Edit menu is not visible before the Edit button is clicked', () => {
    expect(refs.editMenu.isVisible()).toBe(false);
  });

  it('clicking Edit button shows the Edit menu', () => {
    refs.editBtn.el!.click();
    expect(refs.editMenu.isVisible()).toBe(true);
  });

  it('Edit menu items all have elements after the menu is shown', () => {
    refs.editBtn.el!.click();
    expect(refs.newItem.el).toBeTruthy();
    expect(refs.saveItem.el).toBeTruthy();
    expect(refs.undoItem.el).toBeTruthy();
    expect(refs.copyItem.el).toBeTruthy();
    expect(refs.pasteItem.el).toBeTruthy();
  });

  it('saveItem has an icon element', () => {
    refs.editBtn.el!.click();
    expect(refs.saveItem.el!.querySelector('.x-menu-item-icon')).toBeTruthy();
  });

  it('newItem has an icon element', () => {
    refs.editBtn.el!.click();
    expect(refs.newItem.el!.querySelector('.x-menu-item-icon')).toBeTruthy();
  });

  it('clicking New fires the handler and updates status', () => {
    refs.editBtn.el!.click();
    refs.newItem.el!.click();
    expect(refs.statusDisplay.el!.textContent).toContain('New note created');
  });
});

// ---------------------------------------------------------------------------
// Separators & Headers — §2 "Separators & Headers"
// ---------------------------------------------------------------------------

describe('Separators and MenuHeaders', () => {
  it('Edit menu contains separators', () => {
    refs.editBtn.el!.click();
    const seps = refs.editMenu.el!.querySelectorAll('.x-menu-separator');
    expect(seps.length).toBeGreaterThanOrEqual(2);
  });

  it('separators have role="separator"', () => {
    refs.editBtn.el!.click();
    const sep = refs.editMenu.el!.querySelector('[role="separator"]');
    expect(sep).toBeTruthy();
  });

  it('Edit menu contains section headers', () => {
    refs.editBtn.el!.click();
    const headers = refs.editMenu.el!.querySelectorAll('.x-menu-header');
    expect(headers.length).toBeGreaterThanOrEqual(3); // Document, History, Clipboard
  });

  it('headers have role="presentation"', () => {
    refs.editBtn.el!.click();
    const header = refs.editMenu.el!.querySelector('.x-menu-header');
    expect(header?.getAttribute('role')).toBe('presentation');
  });

  it('first header text is "DOCUMENT" (uppercased by CSS)', () => {
    refs.editBtn.el!.click();
    const headerText = refs.editMenu.el!.querySelector('.x-menu-header-text');
    expect(headerText?.textContent).toBe('Document');
  });

  it('View menu contains separators', () => {
    refs.viewBtn.el!.click();
    const seps = refs.viewMenu.el!.querySelectorAll('.x-menu-separator');
    expect(seps.length).toBeGreaterThanOrEqual(2);
  });

  it('View menu contains section headers', () => {
    refs.viewBtn.el!.click();
    const headers = refs.viewMenu.el!.querySelectorAll('.x-menu-header');
    expect(headers.length).toBeGreaterThanOrEqual(3); // Theme, Text Size, Panels
  });
});

// ---------------------------------------------------------------------------
// Dynamic interaction — §2 "Dynamic Interaction (disable/enable + setText)"
// ---------------------------------------------------------------------------

describe('Dynamic interaction — disable / enable', () => {
  it('pasteItem starts disabled', () => {
    expect(refs.pasteItem.isDisabled()).toBe(true);
  });

  it('undoItem starts disabled', () => {
    expect(refs.undoItem.isDisabled()).toBe(true);
  });

  it('redoItem is always disabled in this demo', () => {
    expect(refs.redoItem.isDisabled()).toBe(true);
  });

  it('clicking Copy enables pasteItem', () => {
    refs.editBtn.el!.click();
    refs.copyItem.el!.click();
    expect(refs.pasteItem.isDisabled()).toBe(false);
  });

  it('clicking Copy enables ctxPasteItem (shared clipboard state)', () => {
    refs.editBtn.el!.click();
    refs.copyItem.el!.click();
    expect(refs.ctxPasteItem.isDisabled()).toBe(false);
  });

  it('pasteItem click when enabled fires handler and updates status', () => {
    refs.editBtn.el!.click();
    refs.copyItem.el!.click();
    refs.editBtn.el!.click();
    refs.pasteItem.el!.click();
    expect(refs.statusDisplay.el!.textContent).toContain('Pasted');
  });

  it('clicking disabled undoItem does nothing', () => {
    refs.editBtn.el!.click();
    refs.undoItem.el!.click();
    // Status stays at "Ready" — disabled item click is a no-op
    expect(refs.statusDisplay.el!.textContent).toContain('Ready');
  });
});

describe('Dynamic interaction — setText()', () => {
  it('undoItem text starts as "Undo"', () => {
    refs.editBtn.el!.click();
    expect(refs.undoItem.el!.textContent).toContain('Undo');
  });

  it('after Save, undoItem is enabled', () => {
    refs.editBtn.el!.click();
    refs.saveItem.el!.click();
    expect(refs.undoItem.isDisabled()).toBe(false);
  });

  it('after Save, undoItem text changes to "Undo: Save"', () => {
    refs.editBtn.el!.click();
    refs.saveItem.el!.click();
    refs.editBtn.el!.click();
    expect(refs.undoItem.el!.textContent).toContain('Undo: Save');
  });

  it('after Undo, undoItem text resets to "Undo"', () => {
    refs.editBtn.el!.click();
    refs.saveItem.el!.click();
    refs.editBtn.el!.click();
    refs.undoItem.el!.click();
    refs.editBtn.el!.click();
    expect(refs.undoItem.el!.textContent).toContain('Undo');
    expect(refs.undoItem.el!.textContent).not.toContain('Undo: Save');
  });

  it('after Undo, undoItem is disabled again', () => {
    refs.editBtn.el!.click();
    refs.saveItem.el!.click();
    refs.editBtn.el!.click();
    refs.undoItem.el!.click();
    expect(refs.undoItem.isDisabled()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Check & Radio Items — §2 "Check & Radio Items"
// ---------------------------------------------------------------------------

describe('Check & Radio Items', () => {
  it('Light theme starts checked', () => {
    expect(refs.lightThemeItem.isChecked()).toBe(true);
  });

  it('Dark theme starts unchecked', () => {
    expect(refs.darkThemeItem.isChecked()).toBe(false);
  });

  it('clicking Dark theme checks Dark and unchecks Light (radio group)', () => {
    refs.viewBtn.el!.click();
    refs.darkThemeItem.el!.click();
    expect(refs.darkThemeItem.isChecked()).toBe(true);
    expect(refs.lightThemeItem.isChecked()).toBe(false);
  });

  it('clicking Light theme after Dark restores Light (radio group)', () => {
    refs.viewBtn.el!.click();
    refs.darkThemeItem.el!.click();
    refs.viewBtn.el!.click();
    refs.lightThemeItem.el!.click();
    expect(refs.lightThemeItem.isChecked()).toBe(true);
    expect(refs.darkThemeItem.isChecked()).toBe(false);
  });

  it('exactly one theme item is checked at all times', () => {
    refs.viewBtn.el!.click();
    refs.darkThemeItem.el!.click();
    const checkedCount = [refs.lightThemeItem, refs.darkThemeItem]
      .filter((i) => i.isChecked()).length;
    expect(checkedCount).toBe(1);
  });

  it('showSidebarItem starts checked', () => {
    expect(refs.showSidebarItem.isChecked()).toBe(true);
  });

  it('showPreviewItem starts unchecked', () => {
    expect(refs.showPreviewItem.isChecked()).toBe(false);
  });

  it('showSidebarItem toggles independently', () => {
    refs.viewBtn.el!.click();
    refs.showSidebarItem.el!.click();
    expect(refs.showSidebarItem.isChecked()).toBe(false);
    // showPreviewItem unaffected
    expect(refs.showPreviewItem.isChecked()).toBe(false);
  });

  it('showPreviewItem toggles independently', () => {
    refs.viewBtn.el!.click();
    refs.showPreviewItem.el!.click();
    expect(refs.showPreviewItem.isChecked()).toBe(true);
    expect(refs.showSidebarItem.isChecked()).toBe(true);
  });

  it('CheckItem checkchange event updates status via Controller', () => {
    refs.viewBtn.el!.click();
    refs.darkThemeItem.el!.click();
    expect(refs.statusDisplay.el!.textContent).toContain('Theme: Dark');
  });
});

// ---------------------------------------------------------------------------
// Nested sub-menus — §2 "Nested Sub-menus"
// ---------------------------------------------------------------------------

describe('Nested sub-menus', () => {
  it('fontSizeItem has a sub-menu arrow', () => {
    refs.viewBtn.el!.click();
    expect(refs.fontSizeItem.el!.querySelector('.x-menu-item-arrow')).toBeTruthy();
  });

  it('fontSizeSubMenu is not visible initially', () => {
    expect(refs.fontSizeSubMenu.isVisible()).toBe(false);
  });

  it('clicking fontSizeItem shows the sub-menu', () => {
    refs.viewBtn.el!.click();
    refs.fontSizeItem.el!.click();
    expect(refs.fontSizeSubMenu.isVisible()).toBe(true);
  });

  it('sub-menu contains all four size options', () => {
    refs.viewBtn.el!.click();
    refs.fontSizeItem.el!.click();
    expect(refs.fontSizeSmall.el).toBeTruthy();
    expect(refs.fontSizeMedium.el).toBeTruthy();
    expect(refs.fontSizeLarge.el).toBeTruthy();
    expect(refs.fontSizeXLarge.el).toBeTruthy();
  });

  it('clicking a sub-menu item fires its handler and updates status', () => {
    refs.viewBtn.el!.click();
    refs.fontSizeItem.el!.click();
    refs.fontSizeLarge.el!.click();
    expect(refs.statusDisplay.el!.textContent).toContain('Font: Large');
  });

  it('clicking each size option updates status correctly', () => {
    const sizes = [
      [refs.fontSizeSmall,  'Font: Small'  ],
      [refs.fontSizeMedium, 'Font: Medium' ],
      [refs.fontSizeLarge,  'Font: Large'  ],
      [refs.fontSizeXLarge, 'Font: X-Large'],
    ] as const;

    for (const [item, expected] of sizes) {
      refs.viewBtn.el!.click();
      refs.fontSizeItem.el!.click();
      item.el!.click();
      expect(refs.statusDisplay.el!.textContent).toContain(expected);
    }
  });
});

// ---------------------------------------------------------------------------
// Context menu — §2 "Integration: right-click context area"
// ---------------------------------------------------------------------------

describe('Context menu', () => {
  it('context menu is not visible initially', () => {
    expect(refs.contextMenu.isVisible()).toBe(false);
  });

  it('right-click on content panel body shows context menu', () => {
    const event = new MouseEvent('contextmenu', {
      bubbles: true, cancelable: true, clientX: 50, clientY: 50,
    });
    refs.contentPanel.getBodyEl().dispatchEvent(event);
    expect(refs.contextMenu.isVisible()).toBe(true);
  });

  it('context menu items are rendered after show', () => {
    refs.contentPanel.getBodyEl().dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true }),
    );
    expect(refs.ctxCopyItem.el).toBeTruthy();
    expect(refs.ctxCutItem.el).toBeTruthy();
    expect(refs.ctxPasteItem.el).toBeTruthy();
    expect(refs.ctxSelectAllItem.el).toBeTruthy();
    expect(refs.ctxPropertiesItem.el).toBeTruthy();
  });

  it('ctxPasteItem starts disabled', () => {
    expect(refs.ctxPasteItem.isDisabled()).toBe(true);
  });

  it('ctxCutItem enables ctxPasteItem (shared clipboard state)', () => {
    refs.contentPanel.getBodyEl().dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true }),
    );
    refs.ctxCutItem.el!.click();
    expect(refs.ctxPasteItem.isDisabled()).toBe(false);
  });

  it('ctxCutItem updates status', () => {
    refs.contentPanel.getBodyEl().dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true }),
    );
    refs.ctxCutItem.el!.click();
    expect(refs.statusDisplay.el!.textContent).toContain('Cut to clipboard');
  });

  it('ctxSelectAllItem updates status', () => {
    refs.contentPanel.getBodyEl().dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true }),
    );
    refs.ctxSelectAllItem.el!.click();
    expect(refs.statusDisplay.el!.textContent).toContain('All selected');
  });

  it('ctxPropertiesItem updates status', () => {
    refs.contentPanel.getBodyEl().dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true }),
    );
    refs.ctxPropertiesItem.el!.click();
    expect(refs.statusDisplay.el!.textContent).toContain('Note Properties');
  });

  it('context menu has a separator', () => {
    refs.contentPanel.getBodyEl().dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true }),
    );
    expect(refs.contextMenu.el!.querySelectorAll('.x-menu-separator').length)
      .toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Keyboard — Escape closes the open menu
// ---------------------------------------------------------------------------

describe('Keyboard interaction', () => {
  it('Escape key closes the Edit menu', () => {
    refs.editBtn.el!.click();
    expect(refs.editMenu.isVisible()).toBe(true);

    refs.editMenu.el!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(refs.editMenu.isVisible()).toBe(false);
  });

  it('Escape key closes the context menu', () => {
    refs.contentPanel.getBodyEl().dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true }),
    );
    expect(refs.contextMenu.isVisible()).toBe(true);

    refs.contextMenu.el!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(refs.contextMenu.isVisible()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Resizable panel — §2 "Ext.panel.Resizer / Resizable"
// ---------------------------------------------------------------------------

// jsdom 24 does not ship PointerEvent — polyfill it once for this suite.
if (typeof PointerEvent === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).PointerEvent = class PointerEvent extends MouseEvent {
    readonly pointerId: number;
    constructor(type: string, init?: PointerEventInit) {
      super(type, init as MouseEventInit);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.pointerId = (init as any)?.pointerId ?? 0;
    }
  };
}

function firePointer(target: EventTarget, type: string, opts: PointerEventInit = {}): void {
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, ...opts }));
}

describe('Resizable panel', () => {
  it('resizablePanel is rendered inside the content panel body', () => {
    expect(refs.resizablePanel.el).toBeTruthy();
    expect(refs.contentPanel.getBodyEl().contains(refs.resizablePanel.el!)).toBe(true);
  });

  it('SE resize handle is present', () => {
    expect(refs.resizablePanel.el!.querySelector('.x-resizable-handle-se')).toBeTruthy();
  });

  it('E resize handle is present', () => {
    expect(refs.resizablePanel.el!.querySelector('.x-resizable-handle-e')).toBeTruthy();
  });

  it('S resize handle is present', () => {
    expect(refs.resizablePanel.el!.querySelector('.x-resizable-handle-s')).toBeTruthy();
  });

  it('SE handle has nwse-resize cursor', () => {
    const handle = refs.resizablePanel.el!.querySelector('.x-resizable-handle-se') as HTMLElement;
    expect(handle.style.cursor).toBe('nwse-resize');
  });

  it('E handle has ew-resize cursor', () => {
    const handle = refs.resizablePanel.el!.querySelector('.x-resizable-handle-e') as HTMLElement;
    expect(handle.style.cursor).toBe('ew-resize');
  });

  it('dragging SE handle increments resizeCount', () => {
    const handle = refs.resizablePanel.el!.querySelector('.x-resizable-handle-se')!;
    firePointer(handle,    'pointerdown', { clientX: 0,  clientY: 0  });
    firePointer(document,  'pointermove', { clientX: 50, clientY: 30 });
    firePointer(document,  'pointerup'                                );
    expect(refs.resizeCount.value).toBe(1);
  });

  it('dragging SE handle updates lastResizeW and lastResizeH', () => {
    const handle = refs.resizablePanel.el!.querySelector('.x-resizable-handle-se')!;
    firePointer(handle,   'pointerdown', { clientX: 0,  clientY: 0  });
    firePointer(document, 'pointermove', { clientX: 50, clientY: 30 });
    firePointer(document, 'pointerup'                                );
    expect(refs.lastResizeW.value).toBeGreaterThan(300);
    expect(refs.lastResizeH.value).toBeGreaterThan(150);
  });

  it('status shows "Resized to…" after drag ends', () => {
    const handle = refs.resizablePanel.el!.querySelector('.x-resizable-handle-se')!;
    firePointer(handle,   'pointerdown', { clientX: 0,  clientY: 0  });
    firePointer(document, 'pointermove', { clientX: 50, clientY: 30 });
    firePointer(document, 'pointerup'                                );
    expect(refs.statusDisplay.el!.textContent).toContain('Resized to');
  });

  it('resizablePanel width is clamped at maxWidth (600)', () => {
    const handle = refs.resizablePanel.el!.querySelector('.x-resizable-handle-se')!;
    firePointer(handle,   'pointerdown', { clientX: 0,   clientY: 0 });
    firePointer(document, 'pointermove', { clientX: 9999, clientY: 0 });
    firePointer(document, 'pointerup'                                );
    expect(refs.lastResizeW.value).toBeLessThanOrEqual(600);
  });

  it('resizablePanel height is clamped at minHeight (80)', () => {
    const handle = refs.resizablePanel.el!.querySelector('.x-resizable-handle-se')!;
    firePointer(handle,   'pointerdown', { clientX: 0, clientY: 0     });
    firePointer(document, 'pointermove', { clientX: 0, clientY: -9999 });
    firePointer(document, 'pointerup'                                  );
    expect(refs.lastResizeH.value).toBeGreaterThanOrEqual(80);
  });
});
