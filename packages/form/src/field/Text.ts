/**
 * @ext-ts/form – TextField
 *
 * A text input field with validation (allowBlank, minLength, maxLength,
 * regex, vtype), character masking, triggers, and keyboard events.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Field } from './Field.js';
import type { FieldConfig } from './Field.js';
import { VTypes } from './VTypes.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TriggerConfig {
  type: string;
  handler?: (field: TextField, trigger: HTMLElement, event: Event) => void;
  cls?: string;
}

export interface TextFieldConfig extends FieldConfig {
  maxLength?: number;
  minLength?: number;
  allowBlank?: boolean;
  regex?: RegExp;
  regexText?: string;
  vtype?: string;
  maskRe?: RegExp;
  stripCharsRe?: RegExp;
  inputType?: string;
  triggers?: TriggerConfig[];
}

// ---------------------------------------------------------------------------
// TextField
// ---------------------------------------------------------------------------

const SPECIAL_KEYS = new Set(['Enter', 'Escape', 'Tab']);

export class TextField extends Field {
  static override $className = 'Ext.form.field.Text';

  declare protected _inputEl: HTMLInputElement;

  constructor(config: TextFieldConfig = {}) {
    super({ xtype: 'textfield', ...config });
  }

  protected override afterRender(): void {
    super.afterRender();
    const cfg = this._config as TextFieldConfig;

    // Create input
    this._inputEl = document.createElement('input');
    this._inputEl.type = cfg.inputType ?? 'text';
    this._inputEl.classList.add('x-field-input');
    if (this._name) this._inputEl.name = this._name;
    if (cfg.emptyText) this._inputEl.placeholder = cfg.emptyText;
    if (cfg.readOnly) this._inputEl.readOnly = true;
    if (cfg.disabled) this._inputEl.disabled = true;
    if (cfg.maxLength) this._inputEl.maxLength = cfg.maxLength;

    // Set initial value
    if (this._value !== undefined && this._value !== null && this._value !== '') {
      this._inputEl.value = String(this._value);
    }

    this._bodyWrapEl!.appendChild(this._inputEl);

    // Triggers
    if (cfg.triggers) {
      for (const trig of cfg.triggers) {
        this.renderTrigger(trig);
      }
    }

    // Events
    this.attachInputEvents(cfg);

    // Initialize validity state after input exists
    this.initFieldValidity();
  }

  // -----------------------------------------------------------------------
  // Input element access
  // -----------------------------------------------------------------------

  getInputEl(): HTMLInputElement {
    return this._inputEl;
  }

  // -----------------------------------------------------------------------
  // Value override — sync with DOM
  // -----------------------------------------------------------------------

  override getValue(): string {
    if (this._inputEl) return this._inputEl.value;
    return String(this._value ?? '');
  }

  override setValue(value: unknown): void {
    const old = this.getValue();
    this._value = value;
    if (this._inputEl) {
      this._inputEl.value = String(value ?? '');
    }
    this.onValueChange(old, this.getValue());
  }

  override getRawValue(): string {
    return this._inputEl?.value ?? '';
  }

  override setRawValue(value: string): void {
    if (this._inputEl) this._inputEl.value = value;
    this._value = value;
  }

  override getSubmitValue(): string {
    if ((this._config as any).submitValue === false) return '';
    return this.getValue();
  }

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  protected override computeErrors(): string[] {
    const cfg = this._config as TextFieldConfig;
    const value = this.getValue();
    const errors: string[] = [];

    // allowBlank
    if (cfg.allowBlank === false && (!value || value.trim() === '')) {
      errors.push('This field is required');
    }

    if (value && value.length > 0) {
      // minLength
      if (cfg.minLength !== undefined && value.length < cfg.minLength) {
        errors.push(`Minimum length is ${cfg.minLength}`);
      }

      // maxLength
      if (cfg.maxLength !== undefined && value.length > cfg.maxLength) {
        errors.push(`Maximum length is ${cfg.maxLength}`);
      }

      // regex
      if (cfg.regex && !cfg.regex.test(value)) {
        errors.push(cfg.regexText ?? 'Invalid format');
      }

      // vtype
      if (cfg.vtype && VTypes[cfg.vtype]) {
        const vt = VTypes[cfg.vtype];
        if (!vt.test(value)) {
          errors.push(vt.text);
        }
      }
    }

    return errors;
  }

  // -----------------------------------------------------------------------
  // Events
  // -----------------------------------------------------------------------

  protected attachInputEvents(cfg: TextFieldConfig): void {
    const input = this._inputEl;

    // Input change (live)
    input.addEventListener('input', () => {
      const newVal = input.value;
      const oldVal = this._value;
      this._value = newVal;
      if (newVal !== oldVal) {
        this.fire('change', this, newVal, oldVal);
        this.checkDirty();
        if (cfg.validateOnChange) this.validate();
        this.checkValidity();
      }
    });

    // Focus / Blur
    input.addEventListener('focus', () => {
      this.fire('focus', this);
    });

    input.addEventListener('blur', () => {
      this.fire('blur', this);
      if (cfg.validateOnBlur) this.validate();
      // Strip chars on blur
      if (cfg.stripCharsRe) {
        input.value = input.value.replace(cfg.stripCharsRe, '');
        this._value = input.value;
      }
    });

    // Special keys
    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (SPECIAL_KEYS.has(e.key)) {
        this.fire('specialkey', this, e);
      }
    });

    // maskRe — prevent disallowed characters
    if (cfg.maskRe) {
      const re = cfg.maskRe;
      input.addEventListener('keypress', (e: KeyboardEvent) => {
        if (e.key.length === 1 && !re.test(e.key)) {
          e.preventDefault();
        }
      });
    }
  }

  // -----------------------------------------------------------------------
  // Triggers
  // -----------------------------------------------------------------------

  protected renderTrigger(trig: TriggerConfig): void {
    const el = document.createElement('div');
    el.classList.add('x-field-trigger', `x-trigger-${trig.type}`);
    if (trig.cls) el.classList.add(trig.cls);
    el.setAttribute('role', 'button');

    if (trig.handler) {
      const handler = trig.handler;
      el.addEventListener('click', (e) => {
        handler(this, el, e);
      });
    }

    this._bodyWrapEl!.appendChild(el);
  }
}
