/**
 * @framesquared/ui – CheckItem
 *
 * A menu item with checkbox behavior.  Supports radio groups
 * where only one item in the group can be checked at a time.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Component } from '@framesquared/component';
import type { ComponentConfig } from '@framesquared/component';

// Radio group registry
const checkGroups = new Map<string, Set<CheckItem>>();

export interface CheckItemConfig extends ComponentConfig {
  text?: string;
  iconCls?: string;
  checked?: boolean;
  group?: string;
  handler?: (item: CheckItem, event: Event) => void;
}

export class CheckItem extends Component {
  static override $className = 'Ext.menu.CheckItem';

  declare private _checked: boolean;

  constructor(config: CheckItemConfig = {}) {
    super({ xtype: 'menucheckitem', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as CheckItemConfig;
    this._checked = cfg.checked ?? false;
  }

  protected override afterRender(): void {
    super.afterRender();
    const cfg = this._config as CheckItemConfig;
    const el = this.el!;

    el.classList.add('x-menu-item', 'x-menu-check-item');
    el.setAttribute('role', 'menuitemcheckbox');

    if (cfg.iconCls) {
      const icon = document.createElement('span');
      icon.classList.add('x-menu-item-icon', cfg.iconCls);
      el.appendChild(icon);
    }

    // Check indicator
    const check = document.createElement('span');
    check.classList.add('x-menu-item-check');
    el.appendChild(check);

    // Text
    if (cfg.text) {
      const text = document.createElement('span');
      text.classList.add('x-menu-item-text');
      text.textContent = cfg.text;
      el.appendChild(text);
    }

    if (this._checked) {
      el.classList.add('x-menu-item-checked');
    }

    // Group registration
    if (cfg.group) {
      let grp = checkGroups.get(cfg.group);
      if (!grp) {
        grp = new Set();
        checkGroups.set(cfg.group, grp);
      }
      grp.add(this);
    }

    // Click
    el.addEventListener('click', (e: MouseEvent) => {
      if (this.isDisabled()) return;
      if (cfg.group) {
        // Radio: uncheck others, check this
        const grp = checkGroups.get(cfg.group);
        if (grp) {
          for (const member of grp) {
            if (member !== this && member._checked) member.setChecked(false);
          }
        }
        this.setChecked(true);
      } else {
        this.setChecked(!this._checked);
      }
      if (cfg.handler) cfg.handler(this, e);
      this.fire('click', this, e);
    });
  }

  isChecked(): boolean {
    return this._checked;
  }

  setChecked(checked: boolean): void {
    const old = this._checked;
    this._checked = checked;
    if (this.el) {
      this.el.classList.toggle('x-menu-item-checked', checked);
    }
    if (old !== checked) {
      this.fire('checkchange', this, checked);
    }
  }

  protected override onDestroy(): void {
    const cfg = this._config as CheckItemConfig;
    if (cfg.group) checkGroups.get(cfg.group)?.delete(this);
    super.onDestroy();
  }
}
