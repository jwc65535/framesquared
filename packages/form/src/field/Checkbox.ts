/**
 * @ext-ts/form – Checkbox
 *
 * A checkbox field using native <input type="checkbox">.
 * Returns inputValue when checked, uncheckedValue when unchecked.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Field } from './Field.js';
import type { FieldConfig } from './Field.js';

export interface CheckboxConfig extends FieldConfig {
  inputValue?: string;
  uncheckedValue?: string;
  checked?: boolean;
  boxLabel?: string;
}

export class Checkbox extends Field {
  static override $className = 'Ext.form.field.Checkbox';

  declare protected _inputEl: HTMLInputElement;
  declare protected _checked: boolean;
  declare protected _inputValue: string;
  declare protected _uncheckedValue: string;

  constructor(config: CheckboxConfig = {}) {
    super({ xtype: 'checkboxfield', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as CheckboxConfig;
    this._checked = cfg.checked ?? false;
    this._inputValue = cfg.inputValue ?? 'on';
    this._uncheckedValue = cfg.uncheckedValue ?? '';
  }

  protected override afterRender(): void {
    super.afterRender();
    const cfg = this._config as CheckboxConfig;
    this.el!.classList.add('x-checkbox');

    // Create checkbox input
    this._inputEl = document.createElement('input');
    this._inputEl.type = 'checkbox';
    this._inputEl.classList.add('x-checkbox-input');
    if (this._name) this._inputEl.name = this._name;
    this._inputEl.checked = this._checked;

    this._bodyWrapEl!.appendChild(this._inputEl);

    // Box label
    if (cfg.boxLabel) {
      const label = document.createElement('span');
      label.classList.add('x-checkbox-label');
      label.textContent = cfg.boxLabel;
      this._bodyWrapEl!.appendChild(label);
    }

    // Change handler
    this._inputEl.addEventListener('change', () => {
      const prev = this._checked;
      this._checked = this._inputEl.checked;
      this.fire('change', this, this.getValue(), prev ? this._inputValue : this._uncheckedValue);
    });
  }

  // -----------------------------------------------------------------------
  // Value
  // -----------------------------------------------------------------------

  override getValue(): string {
    return this._checked ? this._inputValue : this._uncheckedValue;
  }

  isChecked(): boolean {
    return this._checked;
  }

  setChecked(checked: boolean): void {
    this._checked = checked;
    if (this._inputEl) this._inputEl.checked = checked;
    this.fire('change', this, this.getValue());
  }

  override getSubmitValue(): string {
    return this.getValue();
  }
}
