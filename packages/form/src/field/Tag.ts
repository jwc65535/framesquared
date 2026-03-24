/**
 * @framesquared/form – TagField
 *
 * A ComboBox variant that shows selected values as removable tag
 * chips in the input area.  Always multi-select.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { ComboBox } from './ComboBox.js';
import type { ComboBoxConfig } from './ComboBox.js';

export interface TagFieldConfig extends ComboBoxConfig {
  filterPickList?: boolean;
  stacked?: boolean;
  createNewOnEnter?: boolean;
}

export class TagField extends ComboBox {
  static override $className = 'Ext.form.field.Tag';

  declare private _tagWrapEl: HTMLElement | null;

  constructor(config: TagFieldConfig = {}) {
    super({ xtype: 'tagfield', multiSelect: true, ...config });
  }

  protected override initialize(): void {
    super.initialize();
    this._tagWrapEl = null;
  }

  protected override afterRender(): void {
    super.afterRender();
    this.el!.classList.add('x-tagfield');

    // Create tag container before the input
    this._tagWrapEl = document.createElement('div');
    this._tagWrapEl.classList.add('x-tagfield-tags');
    this._bodyWrapEl!.insertBefore(this._tagWrapEl, this._bodyWrapEl!.firstChild);
  }

  // -----------------------------------------------------------------------
  // Override select to render tags
  // -----------------------------------------------------------------------

  override select(record: any): void {
    if (!record) return;
    const selection = this.getSelection();
    if (selection.includes(record)) return;

    this.fire('beforeselect', this, record);

    // Add to selection
    (this as any)._selection.push(record);
    this.renderTags();
    this.getInputEl().value = '';

    this.fire('select', this, record);
  }

  override deselect(record: any): void {
    this.fire('beforedeselect', this, record);
    const sel = (this as any)._selection as any[];
    const idx = sel.indexOf(record);
    if (idx !== -1) {
      sel.splice(idx, 1);
      this.renderTags();
    }
  }

  // -----------------------------------------------------------------------
  // Tag rendering
  // -----------------------------------------------------------------------

  private renderTags(): void {
    if (!this._tagWrapEl) return;
    this._tagWrapEl.innerHTML = '';

    const displayField = (this as any)._displayField;
    for (const rec of this.getSelection()) {
      const tag = document.createElement('span');
      tag.classList.add('x-tagfield-tag');

      const text = document.createElement('span');
      text.classList.add('x-tagfield-tag-text');
      text.textContent = rec.get ? rec.get(displayField) : '';
      tag.appendChild(text);

      const close = document.createElement('span');
      close.classList.add('x-tagfield-tag-close');
      close.textContent = '×';
      close.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deselect(rec);
      });
      tag.appendChild(close);

      this._tagWrapEl.appendChild(tag);
    }
  }

  // -----------------------------------------------------------------------
  // Value override
  // -----------------------------------------------------------------------

  override getValue(): any {
    const valueField = (this as any)._valueField;
    return this.getSelection().map(r => r.get ? r.get(valueField) : null);
  }
}
