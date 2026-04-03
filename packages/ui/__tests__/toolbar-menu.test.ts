/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Component } from '@framesquared/component';
import { Button } from '../src/button/Button.js';
import { Toolbar } from '../src/toolbar/Toolbar.js';
import { PagingToolbar } from '../src/toolbar/Paging.js';
import { Menu } from '../src/menu/Menu.js';
import { MenuItem } from '../src/menu/MenuItem.js';
import { CheckItem } from '../src/menu/CheckItem.js';
import { MenuSeparator } from '../src/menu/Separator.js';
import { MenuManager } from '../src/menu/MenuManager.js';

class MockRO {
  callback: ResizeObserverCallback;
  static instances: MockRO[] = [];
  constructor(cb: ResizeObserverCallback) {
    this.callback = cb;
    MockRO.instances.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  trigger(entries: Partial<ResizeObserverEntry>[]) {
    this.callback(entries as ResizeObserverEntry[], this as unknown as ResizeObserver);
  }
}
beforeEach(() => {
  MockRO.instances = [];
  (globalThis as any).ResizeObserver = MockRO;
  MenuManager.getInstance().closeAll();
});
afterEach(() => {
  document.body.innerHTML = '';
});

// ═══════════════════════════════════════════════════════════════════════════
// Toolbar
// ═══════════════════════════════════════════════════════════════════════════

describe('Toolbar', () => {
  it('renders with x-toolbar class', () => {
    const tb = new Toolbar({ renderTo: document.body });
    expect(tb.el!.classList.contains('x-toolbar')).toBe(true);
  });

  it('uses horizontal flex layout by default', () => {
    const tb = new Toolbar({ renderTo: document.body });
    const body = tb.getBodyEl();
    expect(body.style.display).toBe('flex');
    expect(body.style.flexDirection).toBe('row');
  });

  it('vertical:true uses column direction', () => {
    const tb = new Toolbar({ renderTo: document.body, vertical: true });
    expect(tb.getBodyEl().style.flexDirection).toBe('column');
  });

  it('renders button children', () => {
    const tb = new Toolbar({
      renderTo: document.body,
      items: [new Button({ text: 'Save' }), new Button({ text: 'Cancel' })],
    });
    expect(tb.getItems().length).toBe(2);
  });

  it('"->" renders a flex spacer', () => {
    const tb = new Toolbar({
      renderTo: document.body,
      items: [new Button({ text: 'A' }), '->', new Button({ text: 'B' })],
    });
    const items = tb.getItems();
    expect(items.length).toBe(3);
    expect(items[1].el!.classList.contains('x-toolbar-fill')).toBe(true);
    expect(items[1].el!.style.flexGrow).toBe('1');
  });

  it('"-" renders a separator', () => {
    const tb = new Toolbar({
      renderTo: document.body,
      items: [new Button({ text: 'A' }), '-', new Button({ text: 'B' })],
    });
    const items = tb.getItems();
    expect(items[1].el!.classList.contains('x-toolbar-separator')).toBe(true);
  });

  it('" " renders a spacer', () => {
    const tb = new Toolbar({
      renderTo: document.body,
      items: [new Button({ text: 'A' }), ' ', new Button({ text: 'B' })],
    });
    const items = tb.getItems();
    expect(items[1].el!.classList.contains('x-toolbar-spacer')).toBe(true);
  });

  it('text string renders as TextItem', () => {
    const tb = new Toolbar({
      renderTo: document.body,
      items: ['Status: Ready'],
    });
    const items = tb.getItems();
    expect(items[0].el!.classList.contains('x-toolbar-text')).toBe(true);
    expect(items[0].el!.textContent).toBe('Status: Ready');
  });

  it('accepts Component instances directly', () => {
    const c = new Component({ html: 'Custom' });
    const tb = new Toolbar({ renderTo: document.body, items: [c] });
    expect(tb.getItems().length).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PagingToolbar
// ═══════════════════════════════════════════════════════════════════════════

describe('PagingToolbar', () => {
  // Minimal mock store
  function mockStore() {
    return {
      currentPage: 1,
      pageSize: 25,
      totalCount: 100,
      getCount: () => 25,
      getTotalCount: () => 100,
      loadPage: vi.fn(),
    };
  }

  it('renders with paging controls', () => {
    const store = mockStore();
    const tb = new PagingToolbar({ renderTo: document.body, store });
    expect(tb.el!.querySelector('.x-paging-first')).not.toBeNull();
    expect(tb.el!.querySelector('.x-paging-prev')).not.toBeNull();
    expect(tb.el!.querySelector('.x-paging-next')).not.toBeNull();
    expect(tb.el!.querySelector('.x-paging-last')).not.toBeNull();
    expect(tb.el!.querySelector('.x-paging-refresh')).not.toBeNull();
  });

  it('displays page info', () => {
    const store = mockStore();
    const tb = new PagingToolbar({ renderTo: document.body, store });
    const pageInput = tb.el!.querySelector('.x-paging-page') as HTMLInputElement;
    expect(pageInput).not.toBeNull();
    expect(pageInput.value).toBe('1');
  });

  it('displays total pages', () => {
    const store = mockStore();
    const tb = new PagingToolbar({ renderTo: document.body, store });
    const text = tb.el!.querySelector('.x-paging-total');
    expect(text?.textContent).toContain('4'); // 100/25 = 4 pages
  });

  it('next button loads next page', () => {
    const store = mockStore();
    const tb = new PagingToolbar({ renderTo: document.body, store });
    const nextBtn = tb.el!.querySelector('.x-paging-next') as HTMLElement;
    nextBtn.click();
    expect(store.loadPage).toHaveBeenCalledWith(2);
  });

  it('prev button loads previous page', () => {
    const store = mockStore();
    store.currentPage = 2;
    const tb = new PagingToolbar({ renderTo: document.body, store });
    const prevBtn = tb.el!.querySelector('.x-paging-prev') as HTMLElement;
    prevBtn.click();
    expect(store.loadPage).toHaveBeenCalledWith(1);
  });

  it('first button loads page 1', () => {
    const store = mockStore();
    store.currentPage = 3;
    const tb = new PagingToolbar({ renderTo: document.body, store });
    const firstBtn = tb.el!.querySelector('.x-paging-first') as HTMLElement;
    firstBtn.click();
    expect(store.loadPage).toHaveBeenCalledWith(1);
  });

  it('last button loads last page', () => {
    const store = mockStore();
    const tb = new PagingToolbar({ renderTo: document.body, store });
    const lastBtn = tb.el!.querySelector('.x-paging-last') as HTMLElement;
    lastBtn.click();
    expect(store.loadPage).toHaveBeenCalledWith(4);
  });

  it('displayInfo shows record range', () => {
    const store = mockStore();
    const tb = new PagingToolbar({ renderTo: document.body, store, displayInfo: true });
    const info = tb.el!.querySelector('.x-paging-info');
    expect(info?.textContent).toContain('1');
    expect(info?.textContent).toContain('25');
    expect(info?.textContent).toContain('100');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Menu
// ═══════════════════════════════════════════════════════════════════════════

describe('Menu', () => {
  it('renders as floating panel with x-menu class', () => {
    const menu = new Menu({
      items: [new MenuItem({ text: 'Open' }), new MenuItem({ text: 'Save' })],
    });
    menu.showAt(100, 200);
    expect(menu.el!.classList.contains('x-menu')).toBe(true);
    expect(menu.el!.style.position === 'fixed' || menu.el!.style.position === 'absolute').toBe(
      true,
    );
    menu.hide();
  });

  it('showAt positions at x,y', () => {
    const menu = new Menu({ items: [new MenuItem({ text: 'A' })] });
    menu.showAt(150, 250);
    expect(menu.el!.style.left).toBe('150px');
    expect(menu.el!.style.top).toBe('250px');
    menu.hide();
  });

  it('contains MenuItems', () => {
    const menu = new Menu({
      items: [new MenuItem({ text: 'A' }), new MenuItem({ text: 'B' })],
    });
    menu.showAt(0, 0);
    expect(menu.getItems().length).toBe(2);
    menu.hide();
  });

  it('hide removes from DOM visibility', () => {
    const menu = new Menu({ items: [new MenuItem({ text: 'A' })] });
    menu.showAt(0, 0);
    menu.hide();
    expect(menu.isVisible()).toBe(false);
  });

  it('showBy positions relative to a component', () => {
    const anchor = new Component({ renderTo: document.body, html: 'Anchor' });
    const menu = new Menu({ items: [new MenuItem({ text: 'A' })] });
    menu.showBy(anchor);
    expect(menu.rendered).toBe(true);
    expect(menu.isVisible()).toBe(true);
    menu.hide();
  });

  it('plain:true adds x-menu-plain class', () => {
    const menu = new Menu({ items: [new MenuItem({ text: 'A' })], plain: true });
    menu.showAt(0, 0);
    expect(menu.el!.classList.contains('x-menu-plain')).toBe(true);
    menu.hide();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MenuItem
// ═══════════════════════════════════════════════════════════════════════════

describe('MenuItem', () => {
  it('renders with x-menu-item class', () => {
    const item = new MenuItem({ renderTo: document.body, text: 'Open' });
    expect(item.el!.classList.contains('x-menu-item')).toBe(true);
  });

  it('displays text', () => {
    const item = new MenuItem({ renderTo: document.body, text: 'Save' });
    expect(item.el!.textContent).toContain('Save');
  });

  it('click fires handler', () => {
    const handler = vi.fn();
    const item = new MenuItem({ renderTo: document.body, text: 'Do', handler });
    item.el!.click();
    expect(handler).toHaveBeenCalled();
  });

  it('click fires "click" event', () => {
    const spy = vi.fn();
    const item = new MenuItem({ renderTo: document.body, text: 'Do', listeners: { click: spy } });
    item.el!.click();
    expect(spy).toHaveBeenCalled();
  });

  it('iconCls adds icon element', () => {
    const item = new MenuItem({ renderTo: document.body, text: 'Open', iconCls: 'fa-folder' });
    const icon = item.el!.querySelector('.x-menu-item-icon');
    expect(icon).not.toBeNull();
    expect(icon!.classList.contains('fa-folder')).toBe(true);
  });

  it('disabled prevents click', () => {
    const handler = vi.fn();
    const item = new MenuItem({ renderTo: document.body, text: 'No', handler, disabled: true });
    item.el!.click();
    expect(handler).not.toHaveBeenCalled();
  });

  it('sub-menu indicator shown when menu config present', () => {
    const item = new MenuItem({
      renderTo: document.body,
      text: 'More',
      menu: { items: [{ text: 'Sub' }] },
    });
    expect(item.el!.querySelector('.x-menu-item-arrow')).not.toBeNull();
  });

  it('href renders as <a>', () => {
    const item = new MenuItem({
      renderTo: document.body,
      text: 'Link',
      href: 'https://example.com',
    });
    const link = item.el!.querySelector('a');
    expect(link).not.toBeNull();
    expect(link!.href).toContain('example.com');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CheckItem
// ═══════════════════════════════════════════════════════════════════════════

describe('CheckItem', () => {
  it('renders with checkbox indicator', () => {
    const item = new CheckItem({ renderTo: document.body, text: 'Option', checked: true });
    expect(item.el!.classList.contains('x-menu-item-checked')).toBe(true);
  });

  it('click toggles checked state', () => {
    const item = new CheckItem({ renderTo: document.body, text: 'Option' });
    item.el!.click();
    expect(item.isChecked()).toBe(true);
    item.el!.click();
    expect(item.isChecked()).toBe(false);
  });

  it('fires checkchange event', () => {
    const spy = vi.fn();
    const item = new CheckItem({
      renderTo: document.body,
      text: 'Opt',
      listeners: { checkchange: spy },
    });
    item.el!.click();
    expect(spy).toHaveBeenCalledWith(item, true);
  });

  it('radio group: only one checked in same group', () => {
    const a = new CheckItem({ renderTo: document.body, text: 'A', group: 'g1' });
    const b = new CheckItem({ renderTo: document.body, text: 'B', group: 'g1' });
    a.el!.click();
    expect(a.isChecked()).toBe(true);
    b.el!.click();
    expect(a.isChecked()).toBe(false);
    expect(b.isChecked()).toBe(true);
  });

  it('setChecked programmatically', () => {
    const item = new CheckItem({ renderTo: document.body, text: 'X' });
    item.setChecked(true);
    expect(item.isChecked()).toBe(true);
    expect(item.el!.classList.contains('x-menu-item-checked')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MenuSeparator
// ═══════════════════════════════════════════════════════════════════════════

describe('MenuSeparator', () => {
  it('renders with x-menu-separator class', () => {
    const sep = new MenuSeparator({ renderTo: document.body });
    expect(sep.el!.classList.contains('x-menu-separator')).toBe(true);
  });

  it('renders as <hr> or div', () => {
    const sep = new MenuSeparator({ renderTo: document.body });
    expect(sep.rendered).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MenuManager
// ═══════════════════════════════════════════════════════════════════════════

describe('MenuManager', () => {
  it('is a singleton', () => {
    expect(MenuManager.getInstance()).toBe(MenuManager.getInstance());
  });

  it('registers open menus', () => {
    const mgr = MenuManager.getInstance();
    const menu = new Menu({ items: [new MenuItem({ text: 'A' })] });
    menu.showAt(0, 0);
    expect(mgr.getOpenMenus().length).toBe(1);
    menu.hide();
  });

  it('closeAll closes all open menus', () => {
    const mgr = MenuManager.getInstance();
    const m1 = new Menu({ items: [new MenuItem({ text: 'A' })] });
    const m2 = new Menu({ items: [new MenuItem({ text: 'B' })] });
    m1.showAt(0, 0);
    m2.showAt(50, 50);
    mgr.closeAll();
    expect(m1.isVisible()).toBe(false);
    expect(m2.isVisible()).toBe(false);
  });

  it('clicking outside closes menus', () => {
    const mgr = MenuManager.getInstance();
    const menu = new Menu({ items: [new MenuItem({ text: 'A' })] });
    menu.showAt(0, 0);
    // Simulate outside click
    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(mgr.getOpenMenus().length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Menu keyboard navigation
// ═══════════════════════════════════════════════════════════════════════════

describe('Menu — keyboard', () => {
  it('Escape closes the menu', () => {
    const menu = new Menu({ items: [new MenuItem({ text: 'A' })] });
    menu.showAt(0, 0);
    menu.el!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(menu.isVisible()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Context menu support
// ═══════════════════════════════════════════════════════════════════════════

describe('Context menu', () => {
  it('right-click on component with contextMenu shows menu', () => {
    const menu = new Menu({ items: [new MenuItem({ text: 'Copy' })] });
    const c = new Component({ renderTo: document.body, html: 'Right click me' });
    // Attach context menu
    c.el!.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      menu.showAt(e.clientX, e.clientY);
    });
    c.el!.dispatchEvent(
      new MouseEvent('contextmenu', { clientX: 100, clientY: 200, bubbles: true }),
    );
    expect(menu.isVisible()).toBe(true);
    menu.hide();
  });
});
