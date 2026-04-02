import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TabPanel } from '../src/tab/TabPanel.js';
import { TabBar } from '../src/tab/TabBar.js';
import { Tab } from '../src/tab/Tab.js';
import { Panel } from '../src/panel/Panel.js';

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
});

function tabPanel(cfg: Record<string, unknown> = {}): TabPanel {
  return new TabPanel({
    renderTo: document.body,
    items: cfg.items ?? [
      new Panel({ title: 'Home', html: '<p>Home content</p>' }),
      new Panel({ title: 'Settings', html: '<p>Settings content</p>' }),
      new Panel({ title: 'Profile', html: '<p>Profile content</p>' }),
    ],
    ...cfg,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// TabPanel — rendering
// ═══════════════════════════════════════════════════════════════════════════

describe('TabPanel — rendering', () => {
  it('renders with x-tabpanel class', () => {
    const tp = tabPanel();
    expect(tp.el!.classList.contains('x-tabpanel')).toBe(true);
  });

  it('renders a tab bar', () => {
    const tp = tabPanel();
    expect(tp.el!.querySelector('.x-tabbar')).not.toBeNull();
  });

  it('renders tabs matching child panels', () => {
    const tp = tabPanel();
    const tabs = tp.el!.querySelectorAll('.x-tab');
    expect(tabs.length).toBe(3);
  });

  it('tab text comes from panel title', () => {
    const tp = tabPanel();
    const tabs = tp.el!.querySelectorAll('.x-tab');
    expect(tabs[0].textContent).toContain('Home');
    expect(tabs[1].textContent).toContain('Settings');
    expect(tabs[2].textContent).toContain('Profile');
  });

  it('first tab is active by default', () => {
    const tp = tabPanel();
    const tabs = tp.el!.querySelectorAll('.x-tab');
    expect(tabs[0].classList.contains('x-tab-active')).toBe(true);
  });

  it('active panel content is visible', () => {
    const tp = tabPanel();
    const body = tp.el!.querySelector('.x-tabpanel-body');
    expect(body?.textContent).toContain('Home content');
  });

  it('inactive panel content is hidden', () => {
    const tp = tabPanel();
    const items = tp.getTabItems();
    expect(items[1].el?.style.display).toBe('none');
    expect(items[2].el?.style.display).toBe('none');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TabPanel — tab switching
// ═══════════════════════════════════════════════════════════════════════════

describe('TabPanel — switching', () => {
  it('clicking a tab activates it', () => {
    const tp = tabPanel();
    const tabs = tp.el!.querySelectorAll('.x-tab');
    (tabs[1] as HTMLElement).click();
    expect(tabs[1].classList.contains('x-tab-active')).toBe(true);
    expect(tabs[0].classList.contains('x-tab-active')).toBe(false);
  });

  it('clicking tab shows corresponding panel', () => {
    const tp = tabPanel();
    const tabs = tp.el!.querySelectorAll('.x-tab');
    (tabs[2] as HTMLElement).click();
    const items = tp.getTabItems();
    expect(items[2].el?.style.display).not.toBe('none');
    expect(items[0].el?.style.display).toBe('none');
  });

  it('setActiveTab by index', () => {
    const tp = tabPanel();
    tp.setActiveTab(1);
    expect(tp.getActiveTab()).toBe(tp.getTabItems()[1]);
  });

  it('setActiveTab by component reference', () => {
    const tp = tabPanel();
    const items = tp.getTabItems();
    tp.setActiveTab(items[2]);
    expect(tp.getActiveTab()).toBe(items[2]);
  });

  it('getActiveTab returns current active', () => {
    const tp = tabPanel();
    expect(tp.getActiveTab()).toBe(tp.getTabItems()[0]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TabPanel — events
// ═══════════════════════════════════════════════════════════════════════════

describe('TabPanel — events', () => {
  it('fires tabchange on switch', () => {
    const spy = vi.fn();
    const tp = tabPanel({ listeners: { tabchange: spy } });
    tp.setActiveTab(1);
    expect(spy).toHaveBeenCalled();
  });

  it('fires beforetabchange (cancellable)', () => {
    const spy = vi.fn(() => false); // return false to cancel
    const tp = tabPanel({ listeners: { beforetabchange: spy } });
    tp.setActiveTab(1);
    expect(spy).toHaveBeenCalled();
    // Should still be on tab 0 since we cancelled
    expect(tp.getActiveTab()).toBe(tp.getTabItems()[0]);
  });

  it('tabchange args: panel, newTab, oldTab', () => {
    const spy = vi.fn();
    const tp = tabPanel({ listeners: { tabchange: spy } });
    const items = tp.getTabItems();
    tp.setActiveTab(2);
    expect(spy.mock.calls[0][0]).toBe(tp);
    expect(spy.mock.calls[0][1]).toBe(items[2]);
    expect(spy.mock.calls[0][2]).toBe(items[0]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TabPanel — closable tabs
// ═══════════════════════════════════════════════════════════════════════════

describe('TabPanel — closable', () => {
  it('closable panel has close button on tab', () => {
    const tp = tabPanel({
      items: [new Panel({ title: 'A' }), new Panel({ title: 'B', closable: true })],
    });
    const tabs = tp.el!.querySelectorAll('.x-tab');
    expect(tabs[1].querySelector('.x-tab-close')).not.toBeNull();
    expect(tabs[0].querySelector('.x-tab-close')).toBeNull();
  });

  it('clicking close removes tab and panel', () => {
    const tp = tabPanel({
      items: [
        new Panel({ title: 'A' }),
        new Panel({ title: 'B', closable: true }),
        new Panel({ title: 'C' }),
      ],
    });
    const closeBtn = tp
      .el!.querySelectorAll('.x-tab')[1]
      .querySelector('.x-tab-close') as HTMLElement;
    closeBtn.click();
    expect(tp.el!.querySelectorAll('.x-tab').length).toBe(2);
    expect(tp.getTabItems().length).toBe(2);
  });

  it('closing active tab activates next', () => {
    const tp = tabPanel({
      items: [
        new Panel({ title: 'A', closable: true }),
        new Panel({ title: 'B' }),
        new Panel({ title: 'C' }),
      ],
    });
    // A is active. Close A → B becomes active
    const closeBtn = tp.el!.querySelector('.x-tab-close') as HTMLElement;
    closeBtn.click();
    expect(tp.getActiveTab()?.el?.textContent).toContain('B');
  });

  it('fires beforetabclose event', () => {
    const spy = vi.fn();
    const tp = tabPanel({
      items: [new Panel({ title: 'A', closable: true })],
      listeners: { beforetabclose: spy },
    });
    const closeBtn = tp.el!.querySelector('.x-tab-close') as HTMLElement;
    closeBtn.click();
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TabPanel — activeTab config
// ═══════════════════════════════════════════════════════════════════════════

describe('TabPanel — activeTab config', () => {
  it('activeTab:1 starts on second tab', () => {
    const tp = tabPanel({ activeTab: 1 });
    const tabs = tp.el!.querySelectorAll('.x-tab');
    expect(tabs[1].classList.contains('x-tab-active')).toBe(true);
    expect(tabs[0].classList.contains('x-tab-active')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TabPanel — tab position
// ═══════════════════════════════════════════════════════════════════════════

describe('TabPanel — tab position', () => {
  it('tabPosition:"top" (default) bar is before body', () => {
    const tp = tabPanel();
    const children = Array.from(
      tp.el!.querySelector('.x-panel-body')?.parentElement?.children ?? [],
    );
    const barIdx = children.findIndex((c) => c.classList.contains('x-tabbar'));
    const bodyIdx = children.findIndex((c) => c.classList.contains('x-panel-body'));
    expect(barIdx).toBeLessThan(bodyIdx);
  });

  it('tabPosition:"bottom" bar is after body', () => {
    const tp = tabPanel({ tabPosition: 'bottom' });
    const children = Array.from(
      tp.el!.querySelector('.x-panel-body')?.parentElement?.children ?? [],
    );
    const barIdx = children.findIndex((c) => c.classList.contains('x-tabbar'));
    const bodyIdx = children.findIndex((c) => c.classList.contains('x-panel-body'));
    expect(barIdx).toBeGreaterThan(bodyIdx);
  });

  it('tabPosition:"left" adds x-tabbar-left class', () => {
    const tp = tabPanel({ tabPosition: 'left' });
    expect(tp.el!.querySelector('.x-tabbar-left')).not.toBeNull();
  });

  it('tabPosition:"right" adds x-tabbar-right class', () => {
    const tp = tabPanel({ tabPosition: 'right' });
    expect(tp.el!.querySelector('.x-tabbar-right')).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TabPanel — deferred rendering
// ═══════════════════════════════════════════════════════════════════════════

describe('TabPanel — deferredRender', () => {
  it('inactive tabs not rendered until activated', () => {
    const tp = tabPanel({ deferredRender: true });
    const items = tp.getTabItems();
    // Item 0 (active) should be rendered
    expect(items[0].rendered).toBe(true);
    // Items 1 and 2 should NOT be rendered yet
    expect(items[1].rendered).toBe(false);
    expect(items[2].rendered).toBe(false);
  });

  it('switching to deferred tab renders it', () => {
    const tp = tabPanel({ deferredRender: true });
    const items = tp.getTabItems();
    expect(items[1].rendered).toBe(false);
    tp.setActiveTab(1);
    expect(items[1].rendered).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TabPanel — plain mode
// ═══════════════════════════════════════════════════════════════════════════

describe('TabPanel — plain', () => {
  it('plain:true adds x-tabpanel-plain class', () => {
    const tp = tabPanel({ plain: true });
    expect(tp.el!.classList.contains('x-tabpanel-plain')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tab component
// ═══════════════════════════════════════════════════════════════════════════

describe('Tab', () => {
  it('renders with x-tab class', () => {
    const t = new Tab({ text: 'Test', renderTo: document.body });
    expect(t.el!.classList.contains('x-tab')).toBe(true);
  });

  it('displays text', () => {
    const t = new Tab({ text: 'Hello', renderTo: document.body });
    expect(t.el!.textContent).toContain('Hello');
  });

  it('active:true adds x-tab-active class', () => {
    const t = new Tab({ text: 'A', active: true, renderTo: document.body });
    expect(t.el!.classList.contains('x-tab-active')).toBe(true);
  });

  it('closable:true adds close button', () => {
    const t = new Tab({ text: 'C', closable: true, renderTo: document.body });
    expect(t.el!.querySelector('.x-tab-close')).not.toBeNull();
  });

  it('setActive toggles class', () => {
    const t = new Tab({ text: 'T', renderTo: document.body });
    t.setActive(true);
    expect(t.el!.classList.contains('x-tab-active')).toBe(true);
    t.setActive(false);
    expect(t.el!.classList.contains('x-tab-active')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TabBar
// ═══════════════════════════════════════════════════════════════════════════

describe('TabBar', () => {
  it('renders with x-tabbar class', () => {
    const bar = new TabBar({ renderTo: document.body });
    expect(bar.el!.classList.contains('x-tabbar')).toBe(true);
  });

  it('contains tabs added via addTab', () => {
    const bar = new TabBar({ renderTo: document.body });
    bar.addTab(new Tab({ text: 'A' }));
    bar.addTab(new Tab({ text: 'B' }));
    expect(bar.el!.querySelectorAll('.x-tab').length).toBe(2);
  });

  it('removeTab removes a tab', () => {
    const bar = new TabBar({ renderTo: document.body });
    const t = new Tab({ text: 'X' });
    bar.addTab(t);
    bar.removeTab(t);
    expect(bar.el!.querySelectorAll('.x-tab').length).toBe(0);
  });
});
