/**
 * @framesquared/form – NumberField
 *
 * Numeric input with spinner triggers for increment/decrement,
 * min/max validation, and decimal precision formatting.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { TextField } from './Text.js';
import type { TextFieldConfig } from './Text.js';

export interface NumberFieldConfig extends TextFieldConfig {
  minValue?: number;
  maxValue?: number;
  step?: number;
  allowDecimals?: boolean;
  decimalPrecision?: number;
  decimalSeparator?: string;
  autoStripChars?: boolean;
}

export class NumberField extends TextField {
  static override $className = 'Ext.form.field.Number';

  declare private _minValue: number | undefined;
  declare private _maxValue: number | undefined;
  declare private _step: number;
  declare private _allowDecimals: boolean;
  declare private _decimalPrecision: number;

  constructor(config: NumberFieldConfig = {}) {
    // Add spinner triggers
    const triggers = [
      { type: 'spinner-up', handler: (_f: any) => this.spinUp() },
      { type: 'spinner-down', handler: (_f: any) => this.spinDown() },
      ...(config.triggers ?? []),
    ];
    super({ xtype: 'numberfield', ...config, triggers, maskRe: config.maskRe ?? /[0-9.\-]/ });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as NumberFieldConfig;
    this._minValue = cfg.minValue;
    this._maxValue = cfg.maxValue;
    this._step = cfg.step ?? 1;
    this._allowDecimals = cfg.allowDecimals ?? true;
    this._decimalPrecision = cfg.decimalPrecision ?? 10;
  }

  protected override afterRender(): void {
    super.afterRender();
    this.el!.classList.add('x-numberfield');

    // Format initial value with precision
    if (this._config.value !== undefined && this._config.value !== null) {
      this.formatInputValue();
    }
  }

  // -----------------------------------------------------------------------
  // Value
  // -----------------------------------------------------------------------

  getNumberValue(): number {
    const raw = this.getInputEl()?.value ?? '';
    const n = parseFloat(raw);
    return isNaN(n) ? 0 : n;
  }

  override setValue(value: unknown): void {
    super.setValue(value);
    this.formatInputValue();
  }

  private formatInputValue(): void {
    if (!this._inputEl) return;
    const n = parseFloat(this._inputEl.value);
    if (!isNaN(n) && this._decimalPrecision < 10) {
      this._inputEl.value = n.toFixed(this._decimalPrecision);
    }
  }

  // -----------------------------------------------------------------------
  // Spin
  // -----------------------------------------------------------------------

  spinUp(): void {
    let val = this.getNumberValue() + this._step;
    if (this._maxValue !== undefined && val > this._maxValue) val = this._maxValue;
    this.setValue(val);
    this.fire('spin', this, val, 'up');
  }

  spinDown(): void {
    let val = this.getNumberValue() - this._step;
    if (this._minValue !== undefined && val < this._minValue) val = this._minValue;
    this.setValue(val);
    this.fire('spin', this, val, 'down');
  }

  // -----------------------------------------------------------------------
  // Constraints
  // -----------------------------------------------------------------------

  setMinValue(value: number): void {
    this._minValue = value;
  }
  setMaxValue(value: number): void {
    this._maxValue = value;
  }

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  protected override computeErrors(): string[] {
    const errors = super.computeErrors();
    const raw = this.getInputEl()?.value ?? '';
    if (raw === '') return errors;

    const num = parseFloat(raw);

    if (isNaN(num)) {
      errors.push('Not a valid number');
      return errors;
    }

    if (!this._allowDecimals && raw.includes('.')) {
      errors.push('Decimal values are not allowed');
    }

    if (this._minValue !== undefined && num < this._minValue) {
      errors.push(`Value must be at least ${this._minValue}`);
    }

    if (this._maxValue !== undefined && num > this._maxValue) {
      errors.push(`Value must be at most ${this._maxValue}`);
    }

    return errors;
  }
}
