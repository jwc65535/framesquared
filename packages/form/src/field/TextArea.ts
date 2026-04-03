/**
 * @framesquared/form – TextArea
 * Multi-line text field using <textarea>.  Supports rows, cols,
 * and auto-grow (grow, growMin, growMax).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { TextField } from './Text.js';
import type { TextFieldConfig } from './Text.js';

export interface TextAreaConfig extends TextFieldConfig {
  rows?: number;
  cols?: number;
  grow?: boolean;
  growMin?: number;
  growMax?: number;
}

export class TextArea extends TextField {
  static override $className = 'Ext.form.field.TextArea';

  declare private _textareaEl: HTMLTextAreaElement;

  constructor(config: TextAreaConfig = {}) {
    super({ xtype: 'textarea', ...config });
  }

  protected override afterRender(): void {
    // Call Field's afterRender (label + bodyWrap), skip TextField's input creation
    // We need to replicate the field base render then create our own textarea
    const FieldProto = Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(this)));
    FieldProto.afterRender?.call(this);

    const cfg = this._config as TextAreaConfig;

    this._textareaEl = document.createElement('textarea');
    this._textareaEl.classList.add('x-field-input');
    if (this._name) this._textareaEl.name = this._name;
    if (cfg.emptyText) this._textareaEl.placeholder = cfg.emptyText;
    if (cfg.readOnly) this._textareaEl.readOnly = true;
    if (cfg.disabled) this._textareaEl.disabled = true;
    if (cfg.rows) this._textareaEl.rows = cfg.rows;
    if (cfg.cols) this._textareaEl.cols = cfg.cols;

    if (cfg.grow) {
      if (cfg.growMin) this._textareaEl.style.minHeight = `${cfg.growMin}px`;
      if (cfg.growMax) this._textareaEl.style.maxHeight = `${cfg.growMax}px`;
      this._textareaEl.style.overflow = 'auto';
    }

    if (this._value !== undefined && this._value !== null && this._value !== '') {
      this._textareaEl.value = String(this._value);
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this._bodyWrapEl!.appendChild(this._textareaEl);

    // Reuse TextField's event attachment
    // Override _inputEl to point to textarea for event handling
    (this as any)._inputEl = this._textareaEl as any;

    this.attachInputEvents(cfg);

    // Initialize validity state
    this.initFieldValidity();
  }

  override getInputEl(): HTMLInputElement {
    return this._textareaEl as any;
  }

  override getValue(): string {
    if (this._textareaEl) return this._textareaEl.value;
    return String(this._value ?? '');
  }

  override setValue(value: unknown): void {
    const old = this.getValue();
    this._value = value;
    if (this._textareaEl) {
      this._textareaEl.value = String(value ?? '');
    }
    this.onValueChange(old, this.getValue());
  }
}
