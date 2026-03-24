/**
 * @ext-ts/ui – TabPanel
 *
 * A Panel that uses a card layout internally.  Each child panel
 * becomes a tab in the TabBar.  Clicking a tab switches the
 * visible card.  Supports closable tabs, deferred rendering,
 * and top/bottom/left/right tab positioning.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Component } from '@ext-ts/component';
import { Panel } from '../panel/Panel.js';
import type { PanelConfig } from '../panel/Panel.js';
import { TabBar } from './TabBar.js';
import { Tab } from './Tab.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TabPanelConfig extends PanelConfig {
  activeTab?: number | Component;
  tabPosition?: 'top' | 'bottom' | 'left' | 'right';
  plain?: boolean;
  deferredRender?: boolean;
  minTabWidth?: number;
  maxTabWidth?: number;
  removePanelHeader?: boolean;
}

// ---------------------------------------------------------------------------
// TabPanel
// ---------------------------------------------------------------------------

export class TabPanel extends Panel {
  static override $className = 'Ext.tab.Panel';
  private static _idCounter = 0;

  declare private _tabBar: TabBar | null;
  declare private _tabItems: Component[];
  declare private _tabs: Tab[];
  declare private _activeIndex: number;
  declare private _tabPosition: string;
  declare private _deferredRender: boolean;
  declare private _tabBodyEl: HTMLElement | null;
  declare private _pendingTabItems: Component[];

  constructor(config: TabPanelConfig = {}) {
    // Stash items on a private config key, pass items:[] to Panel
    const tabItems = (config.items as any[]) ?? [];
    super({ xtype: 'tabpanel', ...config, items: [], _tabPanelItems: tabItems });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as any;
    this._tabBar = null;
    this._tabItems = [];
    this._tabs = [];
    this._activeIndex = typeof cfg.activeTab === 'number' ? cfg.activeTab : 0;
    this._tabPosition = cfg.tabPosition ?? 'top';
    this._deferredRender = cfg.deferredRender ?? false;
    this._tabBodyEl = null;
    this._pendingTabItems = cfg._tabPanelItems ?? [];
  }

  protected override afterRender(): void {
    super.afterRender();
    const cfg = this._config as TabPanelConfig;
    this.el!.classList.add('x-tabpanel');
    if (cfg.plain) this.el!.classList.add('x-tabpanel-plain');

    const bodyEl = this.getBodyEl();
    bodyEl.classList.add('x-tabpanel-body');

    // Create tab body container (card layout area)
    this._tabBodyEl = bodyEl;

    // Create TabBar
    this._tabBar = new TabBar({ position: this._tabPosition as any });
    this._tabBar.render(this.el!);

    // Position the bar relative to body
    const barEl = this._tabBar.el!;
    if (this._tabPosition === 'bottom' || this._tabPosition === 'right') {
      // Bar after body
      bodyEl.parentNode!.insertBefore(barEl, bodyEl.nextSibling);
    } else {
      // Bar before body (top/left)
      bodyEl.parentNode!.insertBefore(barEl, bodyEl);
    }

    // For left/right, wrap in flex container
    if (this._tabPosition === 'left' || this._tabPosition === 'right') {
      const wrapper = bodyEl.parentNode as HTMLElement;
      wrapper.style.display = 'flex';
      if (this._tabPosition === 'right') {
        wrapper.style.flexDirection = 'row';
      }
      bodyEl.style.flexGrow = '1';
    }

    // Add tab items
    const pendingItems = (this as any)._pendingTabItems as Component[];
    for (const item of pendingItems) {
      this.addTabItem(item);
    }
    delete (this as any)._pendingTabItems;

    // Activate initial tab
    if (this._tabItems.length > 0) {
      this.activateTab(this._activeIndex, true);
    }
  }

  // -----------------------------------------------------------------------
  // Tab management
  // -----------------------------------------------------------------------

  private addTabItem(item: Component): void {
    const index = this._tabItems.length;
    this._tabItems.push(item);

    // Generate unique panel ID for ARIA linking
    const panelId = `ext-tabpanel-${TabPanel._idCounter++}`;

    // Create Tab
    const panelCfg = (item as any)._config ?? {};
    const tab = new Tab({
      text: panelCfg.title ?? `Tab ${index + 1}`,
      iconCls: panelCfg.iconCls,
      closable: panelCfg.closable ?? false,
      card: item,
    });

    // Tab click → activate
    (tab as any).on('click', () => {
      const idx = this._tabItems.indexOf(item);
      if (idx >= 0) this.setActiveTab(idx);
    });

    // Tab close → remove
    (tab as any).on('close', () => {
      this.closeTab(index);
    });

    this._tabs.push(tab);
    this._tabBar!.addTab(tab);

    // ARIA: link tab to its panel
    if (tab.el) {
      tab.el.setAttribute('aria-controls', panelId);
      tab.el.setAttribute('aria-selected', 'false');
    }

    // Handle rendering
    if (this._deferredRender) {
      // Don't render yet — will render on first activation
      // Store panelId for later
      (item as any)._ariaPanelId = panelId;
    } else {
      if (!item.rendered) item.render(this._tabBodyEl!);
      if (item.el) {
        item.el.id = panelId;
        item.el.setAttribute('role', 'tabpanel');
      }
      item.hide();
    }
  }

  private closeTab(originalIndex: number): void {
    // Find current index (may have shifted)
    const tab = this._tabs[originalIndex];
    if (!tab) return;
    const item = tab.card;
    const currentIndex = this._tabItems.indexOf(item!);
    if (currentIndex < 0) return;

    const cancelled = this.fire('beforetabclose', this, item);
    if (cancelled === false) return;

    // Remove tab and item
    this._tabBar!.removeTab(tab);
    this._tabs.splice(this._tabs.indexOf(tab), 1);
    this._tabItems.splice(currentIndex, 1);

    if (item?.el?.parentNode) item.el.parentNode.removeChild(item.el);

    // If we closed the active tab, activate another
    if (this._activeIndex === currentIndex) {
      const newIndex = Math.min(currentIndex, this._tabItems.length - 1);
      if (newIndex >= 0) {
        this.activateTab(newIndex, true);
      }
    } else if (this._activeIndex > currentIndex) {
      this._activeIndex--;
    }
  }

  // -----------------------------------------------------------------------
  // Activation
  // -----------------------------------------------------------------------

  setActiveTab(tabOrIndex: number | Component): void {
    let index: number;
    if (typeof tabOrIndex === 'number') {
      index = tabOrIndex;
    } else {
      index = this._tabItems.indexOf(tabOrIndex);
    }
    if (index < 0 || index >= this._tabItems.length) return;
    if (index === this._activeIndex && this._tabItems[index]?.rendered) return;

    const oldItem = this._tabItems[this._activeIndex];
    const newItem = this._tabItems[index];

    const cancelled = this.fire('beforetabchange', this, newItem, oldItem);
    if (cancelled === false) return;

    this.activateTab(index, false);
  }

  private activateTab(index: number, skipEvent: boolean): void {
    const oldIndex = this._activeIndex;
    const oldItem = this._tabItems[oldIndex];
    const newItem = this._tabItems[index];

    // Deactivate old
    if (this._tabs[oldIndex]) {
      this._tabs[oldIndex].setActive(false);
      this._tabs[oldIndex].el?.setAttribute('aria-selected', 'false');
    }
    if (oldItem?.rendered) oldItem.hide();

    // Activate new
    this._activeIndex = index;
    if (this._tabs[index]) {
      this._tabs[index].setActive(true);
      this._tabs[index].el?.setAttribute('aria-selected', 'true');
    }

    // Deferred render: render on first activation
    if (!newItem.rendered) {
      newItem.render(this._tabBodyEl!);
      // Apply deferred ARIA panel ID
      const panelId = (newItem as any)._ariaPanelId;
      if (panelId && newItem.el) {
        newItem.el.id = panelId;
        newItem.el.setAttribute('role', 'tabpanel');
      }
    }
    newItem.show();

    if (!skipEvent) {
      this.fire('tabchange', this, newItem, oldItem);
    }
  }

  getActiveTab(): Component | undefined {
    return this._tabItems[this._activeIndex];
  }

  getTabItems(): Component[] {
    return [...this._tabItems];
  }

  getTabBar(): TabBar | null {
    return this._tabBar;
  }
}
