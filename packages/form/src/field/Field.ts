/**
 * @framesquared/form – Field (base class)
 *
 * Abstract base for all form fields.  Provides label rendering,
 * value management, dirty tracking, validation framework, and
 * error display.  Subclasses implement the actual input element.
 */

 

import { Component } from '@framesquared/component';
import type { ComponentConfig } from '@framesquared/component';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface FieldConfig extends ComponentConfig {
  name?: string;
  value?: unknown;
  fieldLabel?: string;
  labelAlign?: 'left' | 'top' | 'right';
  labelWidth?: number;
  labelSeparator?: string;
  hideLabel?: boolean;
  emptyText?: string;
  readOnly?: boolean;
  disabled?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  msgTarget?: 'side' | 'under' | 'qtip' | 'title' | 'none';
  submitValue?: boolean;
}

// ---------------------------------------------------------------------------
// Field
// ---------------------------------------------------------------------------

export class Field extends Component {
  static override $className = 'Ext.form.field.Field';

  declare protected _name: string;
  declare protected _originalValue: unknown;
  declare protected _value: unknown;
  declare protected _errors: string[];
  declare protected _wasValid: boolean;
  declare protected _wasDirty: boolean;
  declare protected _labelEl: HTMLElement | null;
  declare protected _bodyWrapEl: HTMLElement | null;
  declare protected _errorEl: HTMLElement | null;

  constructor(config: FieldConfig = {}) {
    super({ xtype: 'field', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as FieldConfig;
    this._name = cfg.name ?? '';
    this._originalValue = cfg.value ?? '';
    this._value = cfg.value ?? '';
    this._errors = [];
    this._wasValid = true;
    this._wasDirty = false;
    this._labelEl = null;
    this._bodyWrapEl = null;
    this._errorEl = null;
  }

  protected override afterRender(): void {
    super.afterRender();
    const cfg = this._config as FieldConfig;
    const el = this.el!;
    el.classList.add('x-field');

    const labelAlign = cfg.labelAlign ?? 'left';
    el.classList.add(`x-label-${labelAlign}`);

    // Label
    if (cfg.fieldLabel) {
      this._labelEl = document.createElement('label');
      this._labelEl.classList.add('x-field-label');
      this._labelEl.textContent = cfg.fieldLabel + (cfg.labelSeparator ?? ':');
      if (cfg.labelWidth) this._labelEl.style.width = `${cfg.labelWidth}px`;
      if (cfg.hideLabel) this._labelEl.style.display = 'none';
      el.appendChild(this._labelEl);
    }

    // Body wrap — subclasses add their input here
    this._bodyWrapEl = document.createElement('div');
    this._bodyWrapEl.classList.add('x-field-body');
    el.appendChild(this._bodyWrapEl);
  }

  /**
   * Called after the full subclass afterRender chain completes.
   * Subclasses that need post-render init should call super.afterRender()
   * then do their work — this method sets initial validity once
   * the input element exists.
   */
  protected initFieldValidity(): void {
    this._wasValid = this.isValid();
  }

  // -----------------------------------------------------------------------
  // Value
  // -----------------------------------------------------------------------

  getValue(): unknown {
    return this._value;
  }

  setValue(value: unknown): void {
    const oldValue = this._value;
    this._value = value;
    this.onValueChange(oldValue, value);
  }

  getRawValue(): string {
    return String(this._value ?? '');
  }

  setRawValue(value: string): void {
    this.setValue(value);
  }

  protected onValueChange(oldValue: unknown, newValue: unknown): void {
    if (oldValue !== newValue) {
      this.fire('change', this, newValue, oldValue);
      this.checkDirty();
      this.checkValidity();
    }
  }

  // -----------------------------------------------------------------------
  // Dirty tracking
  // -----------------------------------------------------------------------

  isDirty(): boolean {
    return this._value !== this._originalValue;
  }

  reset(): void {
    this.setValue(this._originalValue);
    this.clearInvalid();
  }

  protected checkDirty(): void {
    const dirty = this.isDirty();
    if (dirty !== this._wasDirty) {
      this._wasDirty = dirty;
      this.fire('dirtychange', this, dirty);
    }
  }

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  getErrors(): string[] {
    return this.computeErrors();
  }

  isValid(): boolean {
    const errors = this.computeErrors();
    return errors.length === 0;
  }

  validate(): boolean {
    const errors = this.computeErrors();
    if (errors.length > 0) {
      this.markInvalid(errors);
      return false;
    }
    this.clearInvalid();
    return true;
  }

  /** Subclasses override to add field-specific validation. */
  protected computeErrors(): string[] {
    return [];
  }

  markInvalid(errors: string | string[]): void {
    this._errors = Array.isArray(errors) ? errors : [errors];
    if (this.el) {
      this.el.classList.add('x-field-invalid');
      this.showErrors();
    }
    this.fire('errorchange', this, this._errors);
  }

  clearInvalid(): void {
    this._errors = [];
    if (this.el) {
      this.el.classList.remove('x-field-invalid');
      this.removeErrorEl();
    }
    this.fire('errorchange', this, []);
  }

  protected checkValidity(): void {
    const valid = this.isValid();
    if (valid !== this._wasValid) {
      this._wasValid = valid;
      this.fire('validitychange', this, valid);
    }
  }

  // -----------------------------------------------------------------------
  // Error display
  // -----------------------------------------------------------------------

  protected showErrors(): void {
    this.removeErrorEl();
    if (this._errors.length === 0 || !this.el) return;
    this._errorEl = document.createElement('div');
    this._errorEl.classList.add('x-field-error');
    this._errorEl.textContent = this._errors.join(', ');
    this.el.appendChild(this._errorEl);
  }

  protected removeErrorEl(): void {
    if (this._errorEl && this._errorEl.parentNode) {
      this._errorEl.parentNode.removeChild(this._errorEl);
    }
    this._errorEl = null;
  }

  // -----------------------------------------------------------------------
  // Submission
  // -----------------------------------------------------------------------

  getSubmitValue(): string {
    const cfg = this._config as FieldConfig;
    if (cfg.submitValue === false) return '';
    return String(this._value ?? '');
  }

  getName(): string {
    return this._name;
  }
}
