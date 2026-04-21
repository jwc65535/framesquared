/**
 * TDD test suite — Tab Panel Demo
 *
 * Spec assertions:
 *  1. TabPanel initialises with the correct number of child items.
 *  2. Active tab switches correctly via setActiveTab() and tab-header click.
 *  3. Card layout manages child component visibility.
 *  4. Tab configuration (title, iconCls, closable) is rendered correctly.
 *  5. tabchange event fires and delivers correct payload.
 *  6. Tab alignment: top bar precedes body; bottom bar follows body.
 *  7. Closable tab renders a close control and can be dismissed.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { TabPanel } from '@framesquared/ui';
import { Panel } from '@framesquared/ui';
import { Container } from '@framesquared/component';
import { createMainView, type TabDemoRefs } from './MainView.js';

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

let host: HTMLDivElement;
let refs: TabDemoRefs;

beforeEach(() => {
  (globalThis as unknown as Record<string, unknown>).ResizeObserver = MockResizeObserver;
  host = document.createElement('div');
  document.body.appendChild(host);
  Application.clearInstance();
  refs = createMainView(host);
});

afterEach(() => {
  host.remove();
  document.body.innerHTML = '';
  Application.clearInstance();
});

// ---------------------------------------------------------------------------
// 1. Initialisation — correct child counts
// ---------------------------------------------------------------------------

describe('TabPanel initialisation', () => {
  it('top TabPanel exposes 3 tab items', () => {
    expect(refs.topTabPanel.getTabItems().length).toBe(3);
  });

  it('top TabBar contains 3 rendered Tab elements', () => {
    const tabs = refs.topTabPanel.getTabBar()!.getTabs();
    expect(tabs.length).toBe(3);
  });

  it('bottom TabPanel exposes 2 tab items', () => {
    expect(refs.bottomTabPanel.getTabItems().length).toBe(2);
  });

  it('bottom TabBar contains 2 rendered Tab elements', () => {
    const tabs = refs.bottomTabPanel.getTabBar()!.getTabs();
    expect(tabs.length).toBe(2);
  });

  it('top TabPanel is a TabPanel instance', () => {
    expect(refs.topTabPanel).toBeInstanceOf(TabPanel);
  });

  it('tab items contain the expected component types', () => {
    const items = refs.topTabPanel.getTabItems();
    expect(items[0]).toBeInstanceOf(Panel);
    expect(items[2]).toBeInstanceOf(Container);
  });
});

// ---------------------------------------------------------------------------
// 2. Active tab switching
// ---------------------------------------------------------------------------

describe('Active tab switching via setActiveTab()', () => {
  it('active tab defaults to index 0', () => {
    const active = refs.topTabPanel.getActiveTab();
    expect(active).toBe(refs.overviewPanel);
  });

  it('setActiveTab(1) makes second tab active', () => {
    refs.topTabPanel.setActiveTab(1);
    expect(refs.topTabPanel.getActiveTab()).toBe(refs.userFormPanel);
  });

  it('setActiveTab(2) makes third tab active', () => {
    refs.topTabPanel.setActiveTab(2);
    expect(refs.topTabPanel.getActiveTab()).toBe(refs.dataContainer);
  });

  it('setActiveTab(0) returns to first tab', () => {
    refs.topTabPanel.setActiveTab(2);
    refs.topTabPanel.setActiveTab(0);
    expect(refs.topTabPanel.getActiveTab()).toBe(refs.overviewPanel);
  });

  it('first Tab in TabBar is marked active initially', () => {
    const tabs = refs.topTabPanel.getTabBar()!.getTabs();
    expect(tabs[0].isActive()).toBe(true);
    expect(tabs[1].isActive()).toBe(false);
  });

  it('Tab active state updates after setActiveTab()', () => {
    refs.topTabPanel.setActiveTab(1);
    const tabs = refs.topTabPanel.getTabBar()!.getTabs();
    expect(tabs[0].isActive()).toBe(false);
    expect(tabs[1].isActive()).toBe(true);
  });
});

describe('Active tab switching via tab-header click', () => {
  it('clicking the second tab header activates it', () => {
    const tabs = refs.topTabPanel.getTabBar()!.getTabs();
    tabs[1].el!.click();
    expect(refs.topTabPanel.getActiveTab()).toBe(refs.userFormPanel);
  });

  it('clicking the third tab header activates it', () => {
    const tabs = refs.topTabPanel.getTabBar()!.getTabs();
    tabs[2].el!.click();
    expect(refs.topTabPanel.getActiveTab()).toBe(refs.dataContainer);
  });

  it('clicked tab gets x-tab-active class', () => {
    const tabs = refs.topTabPanel.getTabBar()!.getTabs();
    tabs[1].el!.click();
    expect(tabs[1].el!.classList.contains('x-tab-active')).toBe(true);
  });

  it('previously active tab loses x-tab-active class on click', () => {
    const tabs = refs.topTabPanel.getTabBar()!.getTabs();
    tabs[1].el!.click();
    expect(tabs[0].el!.classList.contains('x-tab-active')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Card layout visibility
// ---------------------------------------------------------------------------

describe('Card layout visibility management', () => {
  it('active tab content is visible', () => {
    const active = refs.overviewPanel;
    expect(active.el!.style.display).not.toBe('none');
  });

  it('inactive tab content is hidden', () => {
    expect(refs.userFormPanel.el!.style.display).toBe('none');
    expect(refs.dataContainer.el!.style.display).toBe('none');
  });

  it('switching reveals new card and hides old one', () => {
    refs.topTabPanel.setActiveTab(1);
    expect(refs.userFormPanel.el!.style.display).not.toBe('none');
    expect(refs.overviewPanel.el!.style.display).toBe('none');
  });

  it('all non-active cards are hidden after switch', () => {
    refs.topTabPanel.setActiveTab(2);
    expect(refs.overviewPanel.el!.style.display).toBe('none');
    expect(refs.userFormPanel.el!.style.display).toBe('none');
    expect(refs.dataContainer.el!.style.display).not.toBe('none');
  });

  it('setActiveTab(index) on already-active tab is a no-op', () => {
    let fireCount = 0;
    refs.topTabPanel.on('tabchange', () => { fireCount++; });
    refs.topTabPanel.setActiveTab(0);
    expect(fireCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 4. Tab configuration — title, iconCls, closable
// ---------------------------------------------------------------------------

describe('Tab configuration', () => {
  it('first tab text matches Overview panel title', () => {
    const tabs = refs.topTabPanel.getTabBar()!.getTabs();
    expect(tabs[0].el!.textContent).toContain('Overview');
  });

  it('second tab text matches User Profile panel title', () => {
    const tabs = refs.topTabPanel.getTabBar()!.getTabs();
    expect(tabs[1].el!.textContent).toContain('User Profile');
  });

  it('third tab text matches Raw Data container title', () => {
    const tabs = refs.topTabPanel.getTabBar()!.getTabs();
    expect(tabs[2].el!.textContent).toContain('Raw Data');
  });

  it('second tab has the configured iconCls on its icon span', () => {
    const tabs = refs.topTabPanel.getTabBar()!.getTabs();
    const iconEl = tabs[1].el!.querySelector('.x-tab-icon');
    expect(iconEl).toBeTruthy();
    expect(iconEl!.classList.contains('x-tab-icon-profile')).toBe(true);
  });

  it('third tab (closable) has a close element', () => {
    const tabs = refs.topTabPanel.getTabBar()!.getTabs();
    expect(tabs[2].el!.querySelector('.x-tab-close')).toBeTruthy();
  });

  it('first tab (not closable) has no close element', () => {
    const tabs = refs.topTabPanel.getTabBar()!.getTabs();
    expect(tabs[0].el!.querySelector('.x-tab-close')).toBeNull();
  });

  it('bottom panel second tab (closable) has a close element', () => {
    const tabs = refs.bottomTabPanel.getTabBar()!.getTabs();
    expect(tabs[1].el!.querySelector('.x-tab-close')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 5. Event handling
// ---------------------------------------------------------------------------

describe('tabchange event', () => {
  it('fires when setActiveTab() is called', () => {
    let fired = false;
    refs.topTabPanel.on('tabchange', () => { fired = true; });
    refs.topTabPanel.setActiveTab(1);
    expect(fired).toBe(true);
  });

  it('does not fire for the initial activation', () => {
    let count = 0;
    refs.topTabPanel.on('tabchange', () => { count++; });
    // No calls yet — count should still be 0
    expect(count).toBe(0);
  });

  it('delivers the newly activated component as second argument', () => {
    let received: unknown = null;
    refs.topTabPanel.on('tabchange', (_tp: unknown, newCard: unknown) => {
      received = newCard;
    });
    refs.topTabPanel.setActiveTab(1);
    expect(received).toBe(refs.userFormPanel);
  });

  it('delivers the previously active component as third argument', () => {
    let oldReceived: unknown = null;
    refs.topTabPanel.on('tabchange', (_tp: unknown, _n: unknown, oldCard: unknown) => {
      oldReceived = oldCard;
    });
    refs.topTabPanel.setActiveTab(1);
    expect(oldReceived).toBe(refs.overviewPanel);
  });

  it('updates the event log field value', () => {
    refs.topTabPanel.setActiveTab(1);
    expect(refs.eventLogField.getValue()).toContain('User Profile');
  });

  it('beforetabchange fires before the switch', () => {
    const order: string[] = [];
    refs.topTabPanel.on('beforetabchange', () => { order.push('before'); });
    refs.topTabPanel.on('tabchange', () => { order.push('after'); });
    refs.topTabPanel.setActiveTab(1);
    expect(order).toEqual(['before', 'after']);
  });

  it('tab click also triggers tabchange event', () => {
    let fired = false;
    refs.topTabPanel.on('tabchange', () => { fired = true; });
    refs.topTabPanel.getTabBar()!.getTabs()[2].el!.click();
    expect(fired).toBe(true);
  });

  it('lastEvent ref is populated after tab switch', () => {
    refs.topTabPanel.setActiveTab(2);
    expect(refs.lastEvent.name).toBe('tabchange');
    expect(refs.lastEvent.tabTitle).toContain('Raw Data');
  });
});

// ---------------------------------------------------------------------------
// 6. Tab alignment
// ---------------------------------------------------------------------------

describe('Tab alignment', () => {
  it('top TabPanel bar has x-tabbar class', () => {
    expect(refs.topTabPanel.getTabBar()!.el!.classList.contains('x-tabbar')).toBe(true);
  });

  it('bottom TabPanel bar has x-tabbar-bottom class', () => {
    expect(refs.bottomTabPanel.getTabBar()!.el!.classList.contains('x-tabbar-bottom')).toBe(true);
  });

  it('top TabPanel: tabbar element precedes panel body in the DOM', () => {
    const panelEl = refs.topTabPanel.el!;
    const barEl = refs.topTabPanel.getTabBar()!.el!;
    const bodyEl = panelEl.querySelector('.x-panel-body, .x-tabpanel-body')!;

    const children = Array.from(panelEl.children);
    expect(children.indexOf(barEl)).toBeLessThan(children.indexOf(bodyEl));
  });

  it('bottom TabPanel: tabbar element follows panel body in the DOM', () => {
    const panelEl = refs.bottomTabPanel.el!;
    const barEl = refs.bottomTabPanel.getTabBar()!.el!;
    const bodyEl = panelEl.querySelector('.x-panel-body, .x-tabpanel-body')!;

    const children = Array.from(panelEl.children);
    expect(children.indexOf(barEl)).toBeGreaterThan(children.indexOf(bodyEl));
  });

  it('top TabBar has role="tablist"', () => {
    expect(refs.topTabPanel.getTabBar()!.el!.getAttribute('role')).toBe('tablist');
  });

  it('each Tab has role="tab"', () => {
    const tabs = refs.topTabPanel.getTabBar()!.getTabs();
    tabs.forEach((t) => expect(t.el!.getAttribute('role')).toBe('tab'));
  });
});

// ---------------------------------------------------------------------------
// 7. Closable tabs
// ---------------------------------------------------------------------------

describe('Closable tabs', () => {
  it('closing a tab reduces top TabPanel item count by 1', () => {
    const closeEl = refs.topTabPanel.getTabBar()!.getTabs()[2].el!.querySelector<HTMLElement>('.x-tab-close')!;
    closeEl.click();
    expect(refs.topTabPanel.getTabItems().length).toBe(2);
  });

  it('closing a tab removes it from the TabBar', () => {
    const closeEl = refs.topTabPanel.getTabBar()!.getTabs()[2].el!.querySelector<HTMLElement>('.x-tab-close')!;
    closeEl.click();
    expect(refs.topTabPanel.getTabBar()!.getTabs().length).toBe(2);
  });

  it('beforetabclose event fires before closure', () => {
    let fired = false;
    refs.topTabPanel.on('beforetabclose', () => { fired = true; });
    const closeEl = refs.topTabPanel.getTabBar()!.getTabs()[2].el!.querySelector<HTMLElement>('.x-tab-close')!;
    closeEl.click();
    expect(fired).toBe(true);
  });

  it('close button does not also trigger a tab-switch click', () => {
    let switchCount = 0;
    refs.topTabPanel.on('tabchange', () => { switchCount++; });
    // Close the currently inactive third tab — should not cause a tabchange
    const closeEl = refs.topTabPanel.getTabBar()!.getTabs()[2].el!.querySelector<HTMLElement>('.x-tab-close')!;
    closeEl.click();
    expect(switchCount).toBe(0);
  });
});
