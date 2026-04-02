/**
 * @framesquared/form – DisplayField
 * Read-only display of a value.  No input element, no form submission.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Field } from './Field.js';
import type { FieldConfig } from './Field.js';

export interface DisplayFieldConfig extends FieldConfig {
  renderer?: (value: unknown) => string;
}

export class DisplayField extends Field {
  static override $className = 'Ext.form.field.Display';

  declare private _displayEl: HTMLElement | null;

  constructor(config: DisplayFieldConfig = {}) {
    super({ xtype: 'displayfield', submitValue: false, ...config });
  }

  protected override initialize(): void {
    super.initialize();
    this._displayEl = null;
  }

  protected override afterRender(): void {
    super.afterRender();

    this._displayEl = document.createElement('div');
    this._displayEl.classList.add('x-display-field-value');
    this.updateDisplay();
    this._bodyWrapEl!.appendChild(this._displayEl);

    this.el!.classList.add('x-display-field');
  }

  override setValue(value: unknown): void {
    const old = this._value;
    this._value = value;
    this.updateDisplay();
    this.onValueChange(old, value);
  }

  override getSubmitValue(): string {
    return '';
  }

  private updateDisplay(): void {
    if (!this._displayEl) return;
    const cfg = this._config as DisplayFieldConfig;
    const text = cfg.renderer ? cfg.renderer(this._value) : String(this._value ?? '');
    this._displayEl.textContent = text;
  }
}
