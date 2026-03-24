/**
 * @framesquared/form – BoundList
 *
 * The dropdown list used by ComboBox.  Renders items from a Store,
 * supports hover highlighting, keyboard navigation (up/down/enter/esc),
 * and fires itemclick/select events.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Component } from '@framesquared/component';
import type { ComponentConfig } from '@framesquared/component';

export interface BoundListConfig extends ComponentConfig {
  store?: any;
  displayField?: string;
}

export class BoundList extends Component {
  static override $className = 'Ext.form.BoundList';

  declare private _store: any;
  declare private _displayField: string;
  declare private _highlightIndex: number;

  constructor(config: BoundListConfig = {}) {
    super({ xtype: 'boundlist', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as BoundListConfig;
    this._store = cfg.store ?? null;
    this._displayField = cfg.displayField ?? 'text';
    this._highlightIndex = -1;
  }

  protected override afterRender(): void {
    super.afterRender();
    this.el!.classList.add('x-boundlist');
    this.el!.setAttribute('role', 'listbox');
    this.el!.tabIndex = -1;

    this.renderItems();

    this.el!.addEventListener('keydown', (e: KeyboardEvent) => {
      this.onKeyDown(e);
    });
  }

  refresh(): void {
    this.renderItems();
  }

  private renderItems(): void {
    if (!this.el) return;
    this.el.innerHTML = '';
    this._highlightIndex = -1;

    const records = this._store?.getRange?.() ?? [];
    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const item = document.createElement('div');
      item.classList.add('x-boundlist-item');
      item.setAttribute('role', 'option');
      item.setAttribute('data-index', String(i));
      item.textContent = rec.get ? rec.get(this._displayField) : String(rec.data?.[this._displayField] ?? '');

      item.addEventListener('click', () => {
        this.fire('itemclick', this, rec, item, i);
        this.fire('select', this, rec);
      });

      item.addEventListener('mouseover', () => {
        this.highlightItem(i);
      });

      this.el.appendChild(item);
    }
  }

  private highlightItem(index: number): void {
    const items = this.el!.querySelectorAll('.x-boundlist-item');
    items.forEach((el, i) => {
      el.classList.toggle('x-boundlist-item-over', i === index);
    });
    this._highlightIndex = index;
  }

  private onKeyDown(e: KeyboardEvent): void {
    const items = this.el!.querySelectorAll('.x-boundlist-item');
    const count = items.length;
    if (count === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.highlightItem(Math.min(this._highlightIndex + 1, count - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.highlightItem(Math.max(this._highlightIndex - 1, 0));
    } else if (e.key === 'Enter' && this._highlightIndex >= 0) {
      e.preventDefault();
      const records = this._store?.getRange?.() ?? [];
      const rec = records[this._highlightIndex];
      if (rec) {
        this.fire('select', this, rec);
      }
    }
  }

  getStore(): any {
    return this._store;
  }
}
