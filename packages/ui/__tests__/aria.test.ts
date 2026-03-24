import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AriaManager } from '@ext-ts/core';
import { FocusManager } from '@ext-ts/core';

// UI components
import { Button } from '../src/button/Button.js';
import { Panel } from '../src/panel/Panel.js';
import { Window as ExtWindow } from '../src/window/Window.js';
import { Toolbar } from '../src/toolbar/Toolbar.js';
import { Menu } from '../src/menu/Menu.js';
import { MenuItem } from '../src/menu/MenuItem.js';
import { Tooltip } from '../src/tip/Tooltip.js';
import { TabPanel } from '../src/tab/TabPanel.js';
import { Tab } from '../src/tab/Tab.js';
import { TabBar } from '../src/tab/TabBar.js';

class MockRO { constructor() {} observe() {} unobserve() {} disconnect() {} }
beforeEach(() => { (globalThis as any).ResizeObserver = MockRO; });
afterEach(() => { document.body.innerHTML = ''; FocusManager.reset(); });

// ═══════════════════════════════════════════════════════════════════════════
// AriaManager
// ═══════════════════════════════════════════════════════════════════════════

describe('AriaManager', () => {
  it('setRole sets role attribute', () => {
    const el = document.createElement('div');
    AriaManager.setRole(el, 'button');
    expect(el.getAttribute('role')).toBe('button');
  });

  it('setLabel sets aria-label', () => {
    const el = document.createElement('div');
    AriaManager.setLabel(el, 'Save document');
    expect(el.getAttribute('aria-label')).toBe('Save document');
  });

  it('setDescription sets aria-describedby with generated ID', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    AriaManager.setDescription(el, 'Help text here');
    const descId = el.getAttribute('aria-describedby');
    expect(descId).not.toBeNull();
    const descEl = document.getElementById(descId!);
    expect(descEl).not.toBeNull();
    expect(descEl!.textContent).toBe('Help text here');
  });

  it('setLive sets aria-live', () => {
    const el = document.createElement('div');
    AriaManager.setLive(el, 'polite');
    expect(el.getAttribute('aria-live')).toBe('polite');
  });

  it('announce injects message into live region', () => {
    AriaManager.announce('Item deleted');
    const region = document.querySelector('[aria-live]');
    expect(region).not.toBeNull();
    expect(region!.textContent).toBe('Item deleted');
  });

  it('announce with assertive priority', () => {
    AriaManager.announce('Error occurred', 'assertive');
    const region = document.querySelector('[aria-live="assertive"]');
    expect(region).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FocusManager
// ═══════════════════════════════════════════════════════════════════════════

describe('FocusManager', () => {
  it('trapFocus keeps focus within container', () => {
    const container = document.createElement('div');
    const btn1 = document.createElement('button'); btn1.textContent = 'A';
    const btn2 = document.createElement('button'); btn2.textContent = 'B';
    container.appendChild(btn1);
    container.appendChild(btn2);
    document.body.appendChild(container);

    FocusManager.trapFocus(container);
    btn1.focus();
    // Tab from last element should cycle to first
    const trapped = FocusManager.isTrapped();
    expect(trapped).toBe(true);
    FocusManager.releaseFocus();
  });

  it('releaseFocus stops trapping', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    FocusManager.trapFocus(container);
    FocusManager.releaseFocus();
    expect(FocusManager.isTrapped()).toBe(false);
  });

  it('saveFocus and restoreFocus', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    btn.focus();
    FocusManager.saveFocus();
    // Focus something else
    const other = document.createElement('button');
    document.body.appendChild(other);
    other.focus();
    FocusManager.restoreFocus();
    expect(document.activeElement).toBe(btn);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Button ARIA
// ═══════════════════════════════════════════════════════════════════════════

describe('Button — ARIA', () => {
  it('has role="button"', () => {
    const b = new Button({ text: 'Save', renderTo: document.body });
    expect(b.el!.getAttribute('role')).toBe('button');
  });

  it('has aria-label from text', () => {
    const b = new Button({ text: 'Delete', renderTo: document.body });
    expect(b.el!.getAttribute('aria-label')).toBe('Delete');
  });

  it('disabled sets aria-disabled', () => {
    const b = new Button({ text: 'No', disabled: true, renderTo: document.body });
    expect(b.el!.getAttribute('aria-disabled')).toBe('true');
  });

  it('toggle button has aria-pressed', () => {
    const b = new Button({ text: 'Bold', enableToggle: true, renderTo: document.body });
    expect(b.el!.hasAttribute('aria-pressed')).toBe(true);
  });

  it('menu button has aria-haspopup and aria-expanded', () => {
    const b = new Button({
      text: 'Options',
      menu: new Menu({ items: [new MenuItem({ text: 'A' })] }),
      renderTo: document.body,
    });
    expect(b.el!.getAttribute('aria-haspopup')).toBe('true');
    expect(b.el!.hasAttribute('aria-expanded')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Panel ARIA
// ═══════════════════════════════════════════════════════════════════════════

describe('Panel — ARIA', () => {
  it('has role="region"', () => {
    const p = new Panel({ title: 'Settings', renderTo: document.body });
    expect(p.el!.getAttribute('role')).toBe('region');
  });

  it('has aria-label from title', () => {
    const p = new Panel({ title: 'My Panel', renderTo: document.body });
    expect(p.el!.getAttribute('aria-label')).toBe('My Panel');
  });

  it('collapsible panel has aria-expanded', () => {
    const p = new Panel({ title: 'Info', collapsible: true, renderTo: document.body });
    expect(p.el!.getAttribute('aria-expanded')).toBe('true');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Window / Dialog ARIA
// ═══════════════════════════════════════════════════════════════════════════

describe('Window — ARIA', () => {
  it('has role="dialog"', () => {
    const w = new ExtWindow({ title: 'Confirm', renderTo: document.body });
    expect(w.el!.getAttribute('role')).toBe('dialog');
  });

  it('modal window has aria-modal', () => {
    const w = new ExtWindow({ title: 'Alert', modal: true, renderTo: document.body });
    expect(w.el!.getAttribute('aria-modal')).toBe('true');
  });

  it('has aria-labelledby pointing to title', () => {
    const w = new ExtWindow({ title: 'Edit', renderTo: document.body });
    const labelId = w.el!.getAttribute('aria-labelledby');
    expect(labelId).not.toBeNull();
    const titleEl = document.getElementById(labelId!);
    expect(titleEl).not.toBeNull();
    expect(titleEl!.textContent).toContain('Edit');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Menu ARIA
// ═══════════════════════════════════════════════════════════════════════════

describe('Menu — ARIA', () => {
  it('menu has role="menu"', () => {
    const m = new Menu({ renderTo: document.body, items: [new MenuItem({ text: 'A' })] });
    expect(m.el!.getAttribute('role')).toBe('menu');
  });

  it('menuitem has role="menuitem"', () => {
    const m = new Menu({ renderTo: document.body, items: [new MenuItem({ text: 'A' })] });
    const item = m.el!.querySelector('.x-menu-item');
    expect(item?.getAttribute('role')).toBe('menuitem');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Toolbar ARIA
// ═══════════════════════════════════════════════════════════════════════════

describe('Toolbar — ARIA', () => {
  it('has role="toolbar"', () => {
    const tb = new Toolbar({ renderTo: document.body, items: [] });
    expect(tb.el!.getAttribute('role')).toBe('toolbar');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TabPanel ARIA
// ═══════════════════════════════════════════════════════════════════════════

describe('TabPanel — ARIA', () => {
  function tp() {
    return new TabPanel({
      renderTo: document.body,
      items: [
        new Panel({ title: 'Home', html: '<p>Home</p>' }),
        new Panel({ title: 'Settings', html: '<p>Settings</p>' }),
      ],
    });
  }

  it('tab bar has role="tablist"', () => {
    const t = tp();
    expect(t.el!.querySelector('[role="tablist"]')).not.toBeNull();
  });

  it('tabs have role="tab"', () => {
    const t = tp();
    const tabs = t.el!.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(2);
  });

  it('active tab has aria-selected="true"', () => {
    const t = tp();
    const tabs = t.el!.querySelectorAll('[role="tab"]');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
  });

  it('tab panels have role="tabpanel"', () => {
    const t = tp();
    const panels = t.el!.querySelectorAll('[role="tabpanel"]');
    expect(panels.length).toBeGreaterThanOrEqual(1);
  });

  it('tab has aria-controls linking to tabpanel', () => {
    const t = tp();
    const tab = t.el!.querySelector('[role="tab"]');
    const controlsId = tab?.getAttribute('aria-controls');
    expect(controlsId).not.toBeNull();
    const panel = document.getElementById(controlsId!);
    expect(panel).not.toBeNull();
    expect(panel!.getAttribute('role')).toBe('tabpanel');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tooltip ARIA
// ═══════════════════════════════════════════════════════════════════════════

describe('Tooltip — ARIA', () => {
  it('has role="tooltip"', () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const t = new Tooltip({ html: 'Help text', target });
    // Trigger internal render
    (t as any).showTip();
    expect(t.el!.getAttribute('role')).toBe('tooltip');
  });
});
