import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AriaManager, FocusManager } from '@framesquared/core';
import {
  Button,
  Panel,
  Window as ExtWindow,
  TabPanel,
  Toolbar,
  Menu,
  MenuItem,
} from '@framesquared/ui';

class MockRO {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeEach(() => {
  (globalThis as any).ResizeObserver = MockRO;
});
afterEach(() => {
  document.body.innerHTML = '';
  FocusManager.reset();
});

describe('Accessibility integration', () => {
  it('AriaManager.announce creates live region', () => {
    AriaManager.announce('Record saved successfully');
    const region = document.querySelector('[aria-live="polite"]');
    expect(region).not.toBeNull();
    expect(region!.textContent).toBe('Record saved successfully');
  });

  it('AriaManager.announce with assertive priority', () => {
    AriaManager.announce('Error: connection lost', 'assertive');
    const region = document.querySelector('[aria-live="assertive"]');
    expect(region).not.toBeNull();
    expect(region!.textContent).toBe('Error: connection lost');
  });

  it('Button has correct ARIA', () => {
    const btn = new Button({ text: 'Save', renderTo: document.body });
    expect(btn.el!.getAttribute('role')).toBe('button');
    expect(btn.el!.getAttribute('aria-label')).toBe('Save');
  });

  it('Panel has correct ARIA', () => {
    const panel = new Panel({ title: 'Settings', renderTo: document.body });
    expect(panel.el!.getAttribute('role')).toBe('region');
    expect(panel.el!.getAttribute('aria-label')).toBe('Settings');
  });

  it('Toolbar has role=toolbar', () => {
    const tb = new Toolbar({ renderTo: document.body, items: [] });
    expect(tb.el!.getAttribute('role')).toBe('toolbar');
  });

  it('Modal Window has role=dialog and aria-modal', () => {
    const win = new ExtWindow({
      title: 'Confirm',
      modal: true,
      renderTo: document.body,
    });
    expect(win.el!.getAttribute('role')).toBe('dialog');
    expect(win.el!.getAttribute('aria-modal')).toBe('true');
    expect(win.el!.getAttribute('aria-labelledby')).not.toBeNull();
  });

  it('TabPanel has tablist/tab/tabpanel roles', () => {
    const tp = new TabPanel({
      renderTo: document.body,
      items: [
        new Panel({ title: 'Tab A', html: '<p>A</p>' }),
        new Panel({ title: 'Tab B', html: '<p>B</p>' }),
      ],
    });

    expect(tp.el!.querySelector('[role="tablist"]')).not.toBeNull();
    const tabs = tp.el!.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(2);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');

    // Tab has aria-controls pointing to panel
    const controlsId = tabs[0].getAttribute('aria-controls');
    expect(controlsId).not.toBeNull();
    const panel = document.getElementById(controlsId!);
    expect(panel).not.toBeNull();
    expect(panel!.getAttribute('role')).toBe('tabpanel');
  });

  it('switching tab updates aria-selected', () => {
    const tp = new TabPanel({
      renderTo: document.body,
      items: [new Panel({ title: 'X' }), new Panel({ title: 'Y' })],
    });

    const tabs = tp.el!.querySelectorAll('[role="tab"]');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');

    tp.setActiveTab(1);
    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
  });

  it('Menu has role=menu, items have role=menuitem', () => {
    const menu = new Menu({
      renderTo: document.body,
      items: [
        new MenuItem({ text: 'Cut' }),
        new MenuItem({ text: 'Copy' }),
        new MenuItem({ text: 'Paste' }),
      ],
    });
    expect(menu.el!.getAttribute('role')).toBe('menu');
    const items = menu.el!.querySelectorAll('[role="menuitem"]');
    expect(items.length).toBe(3);
  });

  it('FocusManager traps and releases focus', () => {
    const container = document.createElement('div');
    const btn1 = document.createElement('button');
    btn1.textContent = 'A';
    const btn2 = document.createElement('button');
    btn2.textContent = 'B';
    container.appendChild(btn1);
    container.appendChild(btn2);
    document.body.appendChild(container);

    FocusManager.trapFocus(container);
    expect(FocusManager.isTrapped()).toBe(true);

    FocusManager.releaseFocus();
    expect(FocusManager.isTrapped()).toBe(false);
  });

  it('FocusManager save/restore focus across dialog', () => {
    const mainBtn = document.createElement('button');
    mainBtn.textContent = 'Main';
    document.body.appendChild(mainBtn);
    mainBtn.focus();

    // Save focus before opening dialog
    FocusManager.saveFocus();

    // "Open dialog"
    const dialog = document.createElement('div');
    const dialogBtn = document.createElement('button');
    dialogBtn.textContent = 'Dialog OK';
    dialog.appendChild(dialogBtn);
    document.body.appendChild(dialog);
    dialogBtn.focus();

    expect(document.activeElement).toBe(dialogBtn);

    // "Close dialog" and restore
    FocusManager.restoreFocus();
    expect(document.activeElement).toBe(mainBtn);
  });

  it('collapsible Panel has aria-expanded', () => {
    const panel = new Panel({
      title: 'Collapsible',
      collapsible: true,
      renderTo: document.body,
    });
    expect(panel.el!.getAttribute('aria-expanded')).toBe('true');
  });
});
