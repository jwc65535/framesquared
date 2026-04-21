import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SplitButton, Menu, MenuItem, CheckItem,
  MenuManager, MessageBox,
} from '@framesquared/ui';
import { createMenuDemo, createViewport } from '../src/MenuDemo.js';
import type { MenuDemoRefs } from '../src/MenuDemo.js';

// ---------------------------------------------------------------------------
// Global setup
// ---------------------------------------------------------------------------

let host: HTMLDivElement;
let refs: MenuDemoRefs;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  refs = createMenuDemo(host);
});

afterEach(() => {
  MenuManager.getInstance().closeAll();
  refs.newMenu.destroy();
  refs.fileMenu.destroy();
  refs.viewMenu.destroy();
  // Remove any lingering menus or dialogs rendered directly onto body
  document.querySelectorAll('.x-menu, .x-msgbox, .x-window').forEach(el => {
    if (el.parentNode) el.parentNode.removeChild(el);
  });
  if (host.parentNode) host.parentNode.removeChild(host);
});

// ---------------------------------------------------------------------------
// 1 · Application / Viewport lifecycle
// ---------------------------------------------------------------------------

describe('Application lifecycle', () => {
  it('createViewport renders to document.body', () => {
    const vp = createViewport();
    expect(document.body.contains(vp.el!)).toBe(true);
    vp.destroy();
    document.querySelectorAll('.x-menu').forEach(el => el.parentNode?.removeChild(el));
  });

  it('viewport body contains a toolbar', () => {
    const vp = createViewport();
    expect(vp.el!.querySelector('.x-toolbar')).toBeTruthy();
    vp.destroy();
    document.querySelectorAll('.x-menu').forEach(el => el.parentNode?.removeChild(el));
  });

  it('toolbar contains the SplitButton (x-btn-split class)', () => {
    const vp = createViewport();
    expect(vp.el!.querySelector('.x-btn-split')).toBeTruthy();
    vp.destroy();
    document.querySelectorAll('.x-menu').forEach(el => el.parentNode?.removeChild(el));
  });

  it('toolbar contains a File button', () => {
    const vp = createViewport();
    const btns = Array.from(vp.el!.querySelectorAll('.x-btn'));
    expect(btns.some(b => b.textContent?.includes('File'))).toBe(true);
    vp.destroy();
    document.querySelectorAll('.x-menu').forEach(el => el.parentNode?.removeChild(el));
  });

  it('toolbar contains a View button', () => {
    const vp = createViewport();
    const btns = Array.from(vp.el!.querySelectorAll('.x-btn'));
    expect(btns.some(b => b.textContent?.includes('View'))).toBe(true);
    vp.destroy();
    document.querySelectorAll('.x-menu').forEach(el => el.parentNode?.removeChild(el));
  });
});

// ---------------------------------------------------------------------------
// 2 · Initial state (before any interaction)
// ---------------------------------------------------------------------------

describe('Initial state', () => {
  it('createMenuDemo returns a refs object with all expected keys', () => {
    expect(refs.newBtn).toBeDefined();
    expect(refs.fileBtn).toBeDefined();
    expect(refs.viewBtn).toBeDefined();
    expect(refs.newMenu).toBeDefined();
    expect(refs.fileMenu).toBeDefined();
    expect(refs.viewMenu).toBeDefined();
  });

  it('newBtn is a SplitButton', () => {
    expect(refs.newBtn).toBeInstanceOf(SplitButton);
  });

  it('fileMenu items include open, save, saveAs, separator, delete', () => {
    expect(refs.openItem).toBeInstanceOf(MenuItem);
    expect(refs.saveItem).toBeInstanceOf(MenuItem);
    expect(refs.saveAsItem).toBeInstanceOf(MenuItem);
    expect(refs.deleteItem).toBeInstanceOf(MenuItem);
  });

  it('viewListItem starts checked', () => {
    expect(refs.viewListItem.isChecked()).toBe(true);
  });

  it('viewGridItem starts unchecked', () => {
    expect(refs.viewGridItem.isChecked()).toBe(false);
  });

  it('viewDetailItem starts unchecked', () => {
    expect(refs.viewDetailItem.isChecked()).toBe(false);
  });

  it('showToolbarItem starts checked', () => {
    expect(refs.showToolbarItem.isChecked()).toBe(true);
  });

  it('showStatusItem starts checked', () => {
    expect(refs.showStatusItem.isChecked()).toBe(true);
  });

  it('newDocCallCount starts at 0', () => {
    expect(refs.newDocCallCount.value).toBe(0);
  });

  it('lastCreatedType starts as empty string', () => {
    expect(refs.lastCreatedType.value).toBe('');
  });
});

// ---------------------------------------------------------------------------
// 3 · SplitButton — New Document
// ---------------------------------------------------------------------------

describe('SplitButton — New Document', () => {
  it('renders with text "New Document"', () => {
    expect(refs.newBtn.el?.textContent).toContain('New Document');
  });

  it('has a .x-btn-split-arrow element', () => {
    expect(refs.newBtn.el?.querySelector('.x-btn-split-arrow')).toBeTruthy();
  });

  it('main button click increments newDocCallCount', () => {
    refs.newBtn.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.newDocCallCount.value).toBe(1);
  });

  it('main button click sets lastCreatedType to "document"', () => {
    refs.newBtn.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.lastCreatedType.value).toBe('document');
  });

  it('arrow click does NOT increment newDocCallCount', () => {
    const arrow = refs.newBtn.el!.querySelector('.x-btn-split-arrow')!;
    arrow.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.newDocCallCount.value).toBe(0);
  });

  it('arrow click shows newMenu', () => {
    const arrow = refs.newBtn.el!.querySelector('.x-btn-split-arrow')!;
    arrow.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.newMenu.isVisible()).toBe(true);
  });

  it('newMenu contains a "New Spreadsheet" item', () => {
    refs.newMenu.showAt(0, 0);
    expect(refs.newSpreadsheetItem.el?.textContent).toContain('New Spreadsheet');
  });

  it('clicking newSpreadsheetItem sets lastCreatedType to "spreadsheet"', () => {
    refs.newMenu.showAt(0, 0);
    refs.newSpreadsheetItem.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.lastCreatedType.value).toBe('spreadsheet');
  });

  it('clicking newPresentationItem sets lastCreatedType to "presentation"', () => {
    refs.newMenu.showAt(0, 0);
    refs.newPresentationItem.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.lastCreatedType.value).toBe('presentation');
  });

  it('clicking newFolderItem sets lastCreatedType to "folder"', () => {
    refs.newMenu.showAt(0, 0);
    refs.newFolderItem.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.lastCreatedType.value).toBe('folder');
  });
});

// ---------------------------------------------------------------------------
// 4 · File menu
// ---------------------------------------------------------------------------

describe('File menu', () => {
  it('clicking fileBtn makes fileMenu visible', () => {
    refs.fileBtn.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.fileMenu.isVisible()).toBe(true);
  });

  it('openItem renders with text "Open…"', () => {
    refs.fileMenu.showAt(0, 0);
    expect(refs.openItem.el?.textContent).toContain('Open');
  });

  it('saveItem renders with text "Save"', () => {
    refs.fileMenu.showAt(0, 0);
    expect(refs.saveItem.el?.textContent).toContain('Save');
  });

  it('saveAsItem renders with text "Save As…"', () => {
    refs.fileMenu.showAt(0, 0);
    expect(refs.saveAsItem.el?.textContent).toContain('Save As');
  });

  it('deleteItem renders with text "Delete File"', () => {
    refs.fileMenu.showAt(0, 0);
    expect(refs.deleteItem.el?.textContent).toContain('Delete File');
  });

  it('fileMenu contains a separator element', () => {
    refs.fileMenu.showAt(0, 0);
    expect(refs.fileMenu.el?.querySelector('.x-menu-separator')).toBeTruthy();
  });

  it('clicking deleteItem calls MessageBox.confirm', () => {
    const spy = vi.spyOn(MessageBox, 'confirm').mockReturnValue(null as any);
    refs.fileMenu.showAt(0, 0);
    refs.deleteItem.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(spy).toHaveBeenCalledWith('Delete File', expect.any(String));
    spy.mockRestore();
  });

  it('clicking openItem calls MessageBox.prompt', () => {
    const spy = vi.spyOn(MessageBox, 'prompt').mockReturnValue(null as any);
    refs.fileMenu.showAt(0, 0);
    refs.openItem.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('clicking saveItem does not throw', () => {
    refs.fileMenu.showAt(0, 0);
    expect(() => {
      refs.saveItem.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }).not.toThrow();
  });

  it('openItem is an instance of MenuItem', () => {
    expect(refs.openItem).toBeInstanceOf(MenuItem);
  });
});

// ---------------------------------------------------------------------------
// 5 · View menu — CheckItems & radio group
// ---------------------------------------------------------------------------

describe('View menu — CheckItems', () => {
  it('viewListItem is a CheckItem', () => {
    expect(refs.viewListItem).toBeInstanceOf(CheckItem);
  });

  it('after clicking viewGridItem it becomes checked', () => {
    refs.viewMenu.showAt(0, 0);
    refs.viewGridItem.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.viewGridItem.isChecked()).toBe(true);
  });

  it('after clicking viewGridItem, viewListItem becomes unchecked (radio group)', () => {
    refs.viewMenu.showAt(0, 0);
    refs.viewGridItem.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.viewListItem.isChecked()).toBe(false);
  });

  it('after clicking viewDetailItem, viewGridItem is unchecked', () => {
    refs.viewMenu.showAt(0, 0);
    refs.viewGridItem.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    refs.viewDetailItem.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.viewGridItem.isChecked()).toBe(false);
    expect(refs.viewDetailItem.isChecked()).toBe(true);
  });

  it('only one view mode item is checked at a time', () => {
    refs.viewMenu.showAt(0, 0);
    refs.viewGridItem.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const checkedCount = [refs.viewListItem, refs.viewGridItem, refs.viewDetailItem]
      .filter(item => item.isChecked()).length;
    expect(checkedCount).toBe(1);
  });

  it('showToolbarItem toggles independently (not a radio item)', () => {
    refs.viewMenu.showAt(0, 0);
    refs.showToolbarItem.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.showToolbarItem.isChecked()).toBe(false);
    // Toggling showToolbar doesn't affect the view mode selection
    expect(refs.viewListItem.isChecked()).toBe(true);
  });

  it('showToolbarItem can be toggled back on', () => {
    refs.viewMenu.showAt(0, 0);
    refs.showToolbarItem.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    refs.showToolbarItem.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.showToolbarItem.isChecked()).toBe(true);
  });

  it('showStatusItem toggles independently', () => {
    refs.viewMenu.showAt(0, 0);
    refs.showStatusItem.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.showStatusItem.isChecked()).toBe(false);
    expect(refs.showToolbarItem.isChecked()).toBe(true);
  });

  it('showToolbarItem fires checkchange event on click', () => {
    refs.viewMenu.showAt(0, 0);
    const spy = vi.fn();
    refs.showToolbarItem.on('checkchange', spy);
    refs.showToolbarItem.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(spy).toHaveBeenCalledWith(refs.showToolbarItem, false);
  });

  it('viewGridItem fires checkchange event when selected', () => {
    refs.viewMenu.showAt(0, 0);
    const spy = vi.fn();
    refs.viewGridItem.on('checkchange', spy);
    refs.viewGridItem.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(spy).toHaveBeenCalledWith(refs.viewGridItem, true);
  });
});

// ---------------------------------------------------------------------------
// 6 · MessageBox API
// ---------------------------------------------------------------------------

describe('MessageBox', () => {
  it('MessageBox.alert creates a .x-msgbox element in the DOM', () => {
    const win = MessageBox.alert('Test', 'Hello there');
    expect(document.querySelector('.x-msgbox')).toBeTruthy();
    win.destroy();
  });

  it('alert window has an OK button', () => {
    const win = MessageBox.alert('Test', 'Hello');
    expect(document.querySelector('.x-msgbox-btn-ok')).toBeTruthy();
    win.destroy();
  });

  it('alert callback fires with "ok" when OK is clicked', () => {
    let result = '';
    MessageBox.alert('Test', 'Hello', (btnId) => { result = btnId; });
    (document.querySelector('.x-msgbox-btn-ok') as HTMLElement)
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(result).toBe('ok');
  });

  it('MessageBox.confirm has Yes and No buttons', () => {
    const win = MessageBox.confirm('Delete?', 'Are you sure?');
    expect(document.querySelector('.x-msgbox-btn-yes')).toBeTruthy();
    expect(document.querySelector('.x-msgbox-btn-no')).toBeTruthy();
    win.destroy();
  });

  it('confirm callback fires with "yes" when Yes is clicked', () => {
    let result = '';
    MessageBox.confirm('Delete?', 'Sure?', (btnId) => { result = btnId; });
    (document.querySelector('.x-msgbox-btn-yes') as HTMLElement)
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(result).toBe('yes');
  });

  it('confirm callback fires with "no" when No is clicked', () => {
    let result = '';
    MessageBox.confirm('Delete?', 'Sure?', (btnId) => { result = btnId; });
    (document.querySelector('.x-msgbox-btn-no') as HTMLElement)
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(result).toBe('no');
  });

  it('MessageBox.prompt has an input element', () => {
    const win = MessageBox.prompt('Open', 'Enter filename:');
    expect(document.querySelector('.x-msgbox-input')).toBeTruthy();
    win.destroy();
  });

  it('prompt callback receives the typed value', () => {
    let resultBtn = '';
    let resultVal = '';
    MessageBox.prompt('Open', 'Enter filename:', (btnId, value) => {
      resultBtn = btnId;
      resultVal = value ?? '';
    });
    const input = document.querySelector('.x-msgbox-input') as HTMLInputElement;
    input.value = 'report.csv';
    (document.querySelector('.x-msgbox-btn-ok') as HTMLElement)
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(resultBtn).toBe('ok');
    expect(resultVal).toBe('report.csv');
  });

  it('prompt Cancel callback fires with "cancel"', () => {
    let result = '';
    MessageBox.prompt('Open', 'Enter filename:', (btnId) => { result = btnId; });
    (document.querySelector('.x-msgbox-btn-cancel') as HTMLElement)
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(result).toBe('cancel');
  });
});
