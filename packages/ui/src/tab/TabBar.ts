/**
 * @framesquared/ui – TabBar
 *
 * A container for Tab components.  Renders as a horizontal (or vertical)
 * strip of tabs.  Supports adding, removing, and overflow.
 */

import { Component } from '@framesquared/component';
import type { ComponentConfig } from '@framesquared/component';
import type { Tab } from './Tab.js';

export interface TabBarConfig extends ComponentConfig {
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export class TabBar extends Component {
  static override $className = 'Ext.tab.Bar';

  declare private _tabs: Tab[];
  declare private _stripEl: HTMLElement | null;
  declare private _position: string;

  constructor(config: TabBarConfig = {}) {
    super({ xtype: 'tabbar', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    this._tabs = [];
    this._stripEl = null;
    this._position = (this._config as TabBarConfig).position ?? 'top';
  }

  protected override afterRender(): void {
    super.afterRender();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const el = this.el!;
    el.classList.add('x-tabbar');
    if (this._position !== 'top') {
      el.classList.add(`x-tabbar-${this._position}`);
    }
    el.setAttribute('role', 'tablist');

    this._stripEl = document.createElement('div');
    this._stripEl.classList.add('x-tabbar-strip');
    const isVertical = this._position === 'left' || this._position === 'right';
    this._stripEl.style.display = 'flex';
    this._stripEl.style.flexDirection = isVertical ? 'column' : 'row';
    el.appendChild(this._stripEl);

    // Render any pre-added tabs
    for (const tab of this._tabs) {
      if (!tab.rendered) tab.render(this._stripEl);
    }
  }

  addTab(tab: Tab): void {
    this._tabs.push(tab);
    if (this._stripEl && !tab.rendered) {
      tab.render(this._stripEl);
    }
  }

  removeTab(tab: Tab): void {
    const idx = this._tabs.indexOf(tab);
    if (idx >= 0) this._tabs.splice(idx, 1);
    if (tab.el?.parentNode) tab.el.parentNode.removeChild(tab.el);
    tab.destroy();
  }

  getTabs(): Tab[] {
    return [...this._tabs];
  }
}
