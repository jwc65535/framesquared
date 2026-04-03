/**
 * @framesquared/ui – DataView
 *
 * Renders store records using a template function.  Supports item
 * events (click, dblclick, mouseenter, mouseleave), single/multi
 * selection, hover tracking, empty text, and reactive store binding.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Component } from '@framesquared/component';
import type { ComponentConfig } from '@framesquared/component';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface DataViewConfig extends ComponentConfig {
  store?: any;
  itemTpl?: (record: any, index: number) => string;
  itemSelector?: string;
  itemCls?: string;
  selectedItemCls?: string;
  overItemCls?: string;
  emptyText?: string;
  multiSelect?: boolean;
  singleSelect?: boolean;
  trackOver?: boolean;
}

// ---------------------------------------------------------------------------
// DataView
// ---------------------------------------------------------------------------

export class DataView extends Component {
  static override $className = 'Ext.view.DataView';

  declare _store: any;
  declare private _itemTpl: (record: any, index: number) => string;
  declare private _itemSelector: string;
  declare private _itemCls: string;
  declare private _selectedItemCls: string;
  declare private _overItemCls: string;
  declare private _emptyText: string;
  declare private _multiSelect: boolean;
  declare private _singleSelect: boolean;
  declare private _trackOver: boolean;
  declare private _selectedRecords: Set<any>;
  declare private _contentEl: HTMLElement | null;

  constructor(config: DataViewConfig = {}) {
    super({ xtype: 'dataview', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as DataViewConfig;
    this._store = cfg.store ?? null;
    this._itemTpl = cfg.itemTpl ?? (() => '');
    this._itemSelector = cfg.itemSelector ?? '.x-dataview-item';
    this._itemCls = cfg.itemCls ?? '';
    this._selectedItemCls = cfg.selectedItemCls ?? 'x-item-selected';
    this._overItemCls = cfg.overItemCls ?? '';
    this._emptyText = cfg.emptyText ?? '';
    this._multiSelect = cfg.multiSelect ?? false;
    this._singleSelect = cfg.singleSelect ?? false;
    this._trackOver = cfg.trackOver ?? false;
    this._selectedRecords = new Set();
    this._contentEl = null;
  }

  protected override afterRender(): void {
    super.afterRender();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.el!.classList.add('x-dataview');

    this._contentEl = document.createElement('div');
    this._contentEl.classList.add('x-dataview-content');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.el!.appendChild(this._contentEl);

    this.renderItems();
    this.bindStoreEvents();
  }

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------

  refresh(): void {
    this._selectedRecords.clear();
    this.renderItems();
  }

  private renderItems(): void {
    if (!this._contentEl) return;
    this._contentEl.innerHTML = '';

    const records = this._store?.getRange?.() ?? [];

    if (records.length === 0 && this._emptyText) {
      const emptyEl = document.createElement('div');
      emptyEl.classList.add('x-dataview-empty');
      emptyEl.textContent = this._emptyText;
      this._contentEl.appendChild(emptyEl);
      return;
    }

    for (let i = 0; i < records.length; i++) {
      const html = this._itemTpl(records[i], i);
      // Parse the HTML into elements
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const el = temp.firstElementChild as HTMLElement;
      if (!el) continue;

      el.setAttribute('data-record-index', String(i));
      if (this._itemCls) el.classList.add(this._itemCls);

      this.attachItemEvents(el, records[i], i);
      this._contentEl.appendChild(el);
    }
  }

  private attachItemEvents(el: HTMLElement, record: any, index: number): void {
    el.addEventListener('click', (e) => {
      this.fire('itemclick', this, record, el, index, e);
      this.onItemClick(record, el);
    });

    el.addEventListener('dblclick', (e) => {
      this.fire('itemdblclick', this, record, el, index, e);
    });

    el.addEventListener('mouseenter', (e) => {
      this.fire('itemmouseenter', this, record, el, index, e);
      if (this._trackOver && this._overItemCls) {
        el.classList.add(this._overItemCls);
      }
    });

    el.addEventListener('mouseleave', (e) => {
      this.fire('itemmouseleave', this, record, el, index, e);
      if (this._trackOver && this._overItemCls) {
        el.classList.remove(this._overItemCls);
      }
    });
  }

  // -----------------------------------------------------------------------
  // Selection
  // -----------------------------------------------------------------------

  private onItemClick(record: any, el: HTMLElement): void {
    if (!this._singleSelect && !this._multiSelect) return;

    this.fire('beforeselect', this, record);

    if (this._singleSelect && !this._multiSelect) {
      // Deselect all others
      this.clearSelectionClasses();
      this._selectedRecords.clear();
      this._selectedRecords.add(record);
      el.classList.add(this._selectedItemCls);
    } else if (this._multiSelect) {
      if (this._selectedRecords.has(record)) {
        this._selectedRecords.delete(record);
        el.classList.remove(this._selectedItemCls);
      } else {
        this._selectedRecords.add(record);
        el.classList.add(this._selectedItemCls);
      }
    }

    this.fire('selectionchange', this, [...this._selectedRecords]);
  }

  private clearSelectionClasses(): void {
    if (!this._contentEl) return;
    const items = this._contentEl.querySelectorAll(this._itemSelector);
    for (const item of items) {
      item.classList.remove(this._selectedItemCls);
    }
  }

  getSelectedRecords(): any[] {
    return [...this._selectedRecords];
  }

  // -----------------------------------------------------------------------
  // Node accessors
  // -----------------------------------------------------------------------

  getNodes(): HTMLElement[] {
    if (!this._contentEl) return [];
    return Array.from(this._contentEl.querySelectorAll(this._itemSelector));
  }

  getNode(record: any): HTMLElement | null {
    const store = this._store;
    if (!store) return null;
    const records = store.getRange();
    const idx = records.indexOf(record);
    if (idx < 0) return null;
    const nodes = this.getNodes();
    return nodes[idx] ?? null;
  }

  getRecord(node: HTMLElement): any | null {
    const idx = node.getAttribute('data-record-index');
    if (idx === null) return null;
    return this._store?.getAt?.(parseInt(idx, 10)) ?? null;
  }

  // -----------------------------------------------------------------------
  // Store binding
  // -----------------------------------------------------------------------

  private bindStoreEvents(): void {
    if (!this._store?.on) return;
    this._store.on('datachanged', () => this.renderItems());
    this._store.on('add', () => this.renderItems());
    this._store.on('remove', () => this.renderItems());
    this._store.on('update', () => this.renderItems());
  }
}
