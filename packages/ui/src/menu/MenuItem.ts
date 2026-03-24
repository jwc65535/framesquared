/**
 * @framesquared/ui – MenuItem
 *
 * A clickable item within a Menu.  Supports text, icon, handler,
 * sub-menu indicator, href (link), and disabled state.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Component } from '@framesquared/component';
import type { ComponentConfig } from '@framesquared/component';

export interface MenuItemConfig extends ComponentConfig {
  text?: string;
  iconCls?: string;
  handler?: (item: MenuItem, event: Event) => void;
  menu?: any;
  href?: string;
  plain?: boolean;
}

export class MenuItem extends Component {
  static override $className = 'Ext.menu.MenuItem';

  constructor(config: MenuItemConfig = {}) {
    super({ xtype: 'menuitem', ...config });
  }

  protected override afterRender(): void {
    super.afterRender();
    const cfg = this._config as MenuItemConfig;
    const el = this.el!;

    el.classList.add('x-menu-item');
    el.setAttribute('role', 'menuitem');

    // Icon
    if (cfg.iconCls) {
      const icon = document.createElement('span');
      icon.classList.add('x-menu-item-icon', cfg.iconCls);
      el.appendChild(icon);
    }

    // Text / link
    if (cfg.href) {
      const a = document.createElement('a');
      a.classList.add('x-menu-item-link');
      a.href = cfg.href;
      a.textContent = cfg.text ?? '';
      el.appendChild(a);
    } else if (cfg.text) {
      const text = document.createElement('span');
      text.classList.add('x-menu-item-text');
      text.textContent = cfg.text;
      el.appendChild(text);
    }

    // Sub-menu arrow
    if (cfg.menu) {
      const arrow = document.createElement('span');
      arrow.classList.add('x-menu-item-arrow');
      el.appendChild(arrow);
    }

    // Click handler
    el.addEventListener('click', (e: MouseEvent) => {
      if (this.isDisabled()) return;
      if (cfg.handler) cfg.handler(this, e);
      this.fire('click', this, e);
    });
  }
}
