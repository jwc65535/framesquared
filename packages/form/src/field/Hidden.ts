/**
 * @framesquared/form – HiddenField
 * Renders as <input type="hidden">.  No label, no visible UI.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Field } from './Field.js';
import type { FieldConfig } from './Field.js';

export class HiddenField extends Field {
  static override $className = 'Ext.form.field.Hidden';

  declare private _hiddenInput: HTMLInputElement;

  constructor(config: FieldConfig = {}) {
    super({ xtype: 'hiddenfield', ...config });
  }

  protected override afterRender(): void {
    // Skip label rendering — call Component afterRender only
    const ComponentProto = Object.getPrototypeOf(
      Object.getPrototypeOf(Object.getPrototypeOf(this)),
    );
    ComponentProto.afterRender?.call(this);

    this.el!.classList.add('x-field', 'x-hidden-field');
    this.el!.style.display = 'none';

    this._hiddenInput = document.createElement('input');
    this._hiddenInput.type = 'hidden';
    if (this._name) this._hiddenInput.name = this._name;
    if (this._value !== undefined && this._value !== null) {
      this._hiddenInput.value = String(this._value);
    }
    this.el!.appendChild(this._hiddenInput);
  }

  override getValue(): string {
    return this._hiddenInput?.value ?? String(this._value ?? '');
  }

  override setValue(value: unknown): void {
    const old = this.getValue();
    this._value = value;
    if (this._hiddenInput) this._hiddenInput.value = String(value ?? '');
    this.onValueChange(old, this.getValue());
  }

  override getSubmitValue(): string {
    return this.getValue();
  }
}
