/**
 * @ext-ts/ui – Tab
 *
 * A tab component that renders as a clickable element with text,
 * optional icon, optional close button, and active state styling.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Component } from '@ext-ts/component';
import type { ComponentConfig } from '@ext-ts/component';

export interface TabConfig extends ComponentConfig {
  text?: string;
  iconCls?: string;
  closable?: boolean;
  active?: boolean;
  card?: Component;
}

export class Tab extends Component {
  static override $className = 'Ext.tab.Tab';

  declare private _text: string;
  declare private _closable: boolean;
  declare private _active: boolean;
  declare private _textEl: HTMLElement | null;
  declare private _closeEl: HTMLElement | null;
  /** The panel this tab represents */
  declare card: Component | null;

  constructor(config: TabConfig = {}) {
    super({ xtype: 'tab', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as TabConfig;
    this._text = cfg.text ?? '';
    this._closable = cfg.closable ?? false;
    this._active = cfg.active ?? false;
    this._textEl = null;
    this._closeEl = null;
    this.card = cfg.card ?? null;
  }

  protected override afterRender(): void {
    super.afterRender();
    const el = this.el!;
    el.classList.add('x-tab');
    el.style.cursor = 'pointer';
    el.style.display = 'inline-flex';
    el.style.alignItems = 'center';
    el.setAttribute('role', 'tab');

    const cfg = this._config as TabConfig;

    // Icon
    if (cfg.iconCls) {
      const icon = document.createElement('span');
      icon.classList.add('x-tab-icon', cfg.iconCls);
      el.appendChild(icon);
    }

    // Text
    this._textEl = document.createElement('span');
    this._textEl.classList.add('x-tab-text');
    this._textEl.textContent = this._text;
    el.appendChild(this._textEl);

    // Close button
    if (this._closable) {
      this._closeEl = document.createElement('span');
      this._closeEl.classList.add('x-tab-close');
      this._closeEl.textContent = '×';
      this._closeEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.fire('close', this);
      });
      el.appendChild(this._closeEl);
    }

    // Active state
    if (this._active) el.classList.add('x-tab-active');

    // Fire component 'click' on DOM click
    el.addEventListener('click', () => {
      this.fire('click', this);
    });
  }

  setActive(active: boolean): void {
    this._active = active;
    if (this.el) {
      this.el.classList.toggle('x-tab-active', active);
    }
  }

  isActive(): boolean {
    return this._active;
  }

  setText(text: string): void {
    this._text = text;
    if (this._textEl) this._textEl.textContent = text;
  }
}
