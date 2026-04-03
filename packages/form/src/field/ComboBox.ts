/**
 * @framesquared/form – ComboBox
 *
 * A text field with a dropdown list of options.  Supports local
 * and remote query modes, multi-select, forceSelection, typeAhead,
 * and keyboard navigation.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { TextField } from './Text.js';
import type { TextFieldConfig } from './Text.js';
import { BoundList } from '../BoundList.js';

export interface ComboBoxConfig extends TextFieldConfig {
  store?: any;
  displayField?: string;
  valueField?: string;
  queryMode?: 'local' | 'remote';
  queryParam?: string;
  queryDelay?: number;
  minChars?: number;
  triggerAction?: 'all' | 'last' | 'query';
  forceSelection?: boolean;
  typeAhead?: boolean;
  multiSelect?: boolean;
  delimiter?: string;
  editable?: boolean;
  autoSelect?: boolean;
  pageSize?: number;
}

export class ComboBox extends TextField {
  static override $className = 'Ext.form.field.ComboBox';

  declare _store: any;
  declare private _displayField: string;
  declare private _valueField: string;
  declare private _queryMode: string;
  declare private _forceSelection: boolean;
  declare private _multiSelect: boolean;
  declare private _delimiter: string;
  declare private _expanded: boolean;
  declare private _selection: any[];
  declare private _boundList: BoundList | null;
  declare private _selectedValue: unknown;

  constructor(config: ComboBoxConfig = {}) {
    const triggers = [
      {
        type: 'expand',
        handler: (_f: any) => {
          if (this._expanded) this.collapse();
          else this.expand();
        },
      },
      ...(config.triggers ?? []),
    ];
    super({ xtype: 'combobox', ...config, triggers });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as ComboBoxConfig;
    this._store = cfg.store ?? null;
    this._displayField = cfg.displayField ?? 'text';
    this._valueField = cfg.valueField ?? 'id';
    this._queryMode = cfg.queryMode ?? 'local';
    this._forceSelection = cfg.forceSelection ?? false;
    this._multiSelect = cfg.multiSelect ?? false;
    this._delimiter = cfg.delimiter ?? ', ';
    this._expanded = false;
    this._selection = [];
    this._boundList = null;
    this._selectedValue = null;
  }

  protected override afterRender(): void {
    super.afterRender();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.el!.classList.add('x-combobox');

    // forceSelection: revert on blur if no match
    if (this._forceSelection) {
      this.getInputEl().addEventListener('blur', () => {
        const raw = this.getInputEl().value;
        if (raw && !this.findRecord(this._displayField, raw)) {
          this.getInputEl().value = '';
          this._selectedValue = null;
        }
      });
    }
  }

  // -----------------------------------------------------------------------
  // Expand / Collapse
  // -----------------------------------------------------------------------

  expand(): void {
    if (this._expanded) return;
    this._expanded = true;

    if (!this._boundList) {
      this._boundList = new BoundList({
        store: this._store,
        displayField: this._displayField,
        renderTo: document.body,
      });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const listEl = this._boundList.el!;
      listEl.classList.add('x-combobox-list');
      listEl.style.display = 'none';
      listEl.style.position = 'fixed';
      listEl.style.zIndex = '1000';
      listEl.style.backgroundColor = '#fff';
      listEl.style.border = '1px solid #ccc';
      listEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
      listEl.style.minWidth = '100px';
      listEl.style.maxHeight = '200px';
      listEl.style.overflowY = 'auto';

      // Listen for selection
      (this._boundList as any).on?.('select', (_bl: any, rec: any) => {
        this.select(rec);
        this.collapse();
      });
    } else {
      this._boundList.refresh();
    }

    // Position below the field element
    const anchor = this.el ?? this.getInputEl();
    const rect = anchor.getBoundingClientRect();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const listEl = this._boundList.el!;
    listEl.style.top = `${rect.bottom}px`;
    listEl.style.left = `${rect.left}px`;
    listEl.style.width = `${rect.width}px`;
    listEl.style.display = '';

    this.fire('expand', this);
  }

  collapse(): void {
    if (!this._expanded) return;
    this._expanded = false;
    if (this._boundList?.el) this._boundList.el.style.display = 'none';
    this.fire('collapse', this);
  }

  isExpanded(): boolean {
    return this._expanded;
  }

  // -----------------------------------------------------------------------
  // Selection
  // -----------------------------------------------------------------------

  select(record: any): void {
    if (!record) return;
    this.fire('beforeselect', this, record);

    if (this._multiSelect) {
      if (!this._selection.includes(record)) {
        this._selection.push(record);
      }
      this.updateMultiDisplay();
    } else {
      this._selection = [record];
      const display = record.get
        ? record.get(this._displayField)
        : (record[this._displayField] ?? '');
      const value = record.get ? record.get(this._valueField) : (record[this._valueField] ?? '');
      this.getInputEl().value = display;
      this._selectedValue = value;
      this._value = value;
    }

    this.fire('select', this, record);
  }

  deselect(record: any): void {
    this.fire('beforedeselect', this, record);
    const idx = this._selection.indexOf(record);
    if (idx !== -1) {
      this._selection.splice(idx, 1);
      if (this._multiSelect) this.updateMultiDisplay();
    }
  }

  getSelection(): any[] {
    return [...this._selection];
  }

  private updateMultiDisplay(): void {
    const display = this._selection
      .map((r) => (r.get ? r.get(this._displayField) : (r[this._displayField] ?? '')))
      .join(this._delimiter);
    this.getInputEl().value = display;
    this._value = this._selection.map((r) =>
      r.get ? r.get(this._valueField) : (r[this._valueField] ?? null),
    );
  }

  // -----------------------------------------------------------------------
  // Query
  // -----------------------------------------------------------------------

  doQuery(queryString: string): void {
    this.fire('beforequery', this, queryString);
    if (this._queryMode === 'local' && this._store) {
      this._store.filter(this._displayField, queryString);
    } else if (this._queryMode === 'remote' && this._store) {
      const cfg = this._config as ComboBoxConfig;
      this._store.load({ params: { [cfg.queryParam ?? 'query']: queryString } });
    }
  }

  // -----------------------------------------------------------------------
  // Finding
  // -----------------------------------------------------------------------

  findRecord(field: string, value: unknown): any | null {
    return this._store?.findRecord?.(field, value) ?? null;
  }

  // -----------------------------------------------------------------------
  // Value override
  // -----------------------------------------------------------------------

  override getValue(): any {
    if (this._multiSelect) {
      return this._selection.map((r) =>
        r.get ? r.get(this._valueField) : (r[this._valueField] ?? null),
      );
    }
    return this._selectedValue ?? super.getValue();
  }

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  protected override onDestroy(): void {
    if (this._boundList) {
      this._boundList.destroy();
      this._boundList = null;
    }
    super.onDestroy();
  }
}
