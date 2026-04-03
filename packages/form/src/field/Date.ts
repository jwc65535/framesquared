/**
 * @framesquared/form – DateField
 *
 * A text field for date input.  Formats/parses dates using a
 * configurable format string.  Has an expand trigger for opening
 * a DatePicker dropdown.  Validates min/max date boundaries.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { TextField } from './Text.js';
import type { TextFieldConfig } from './Text.js';
import { formatDate, parseDate } from '../util/DateUtil.js';

export interface DateFieldConfig extends TextFieldConfig {
  format?: string;
  minValue?: Date;
  maxValue?: Date;
  disabledDates?: string[];
  disabledDays?: number[];
  showToday?: boolean;
}

export class DateField extends TextField {
  static override $className = 'Ext.form.field.Date';

  declare private _format: string;
  declare private _minDate: Date | undefined;
  declare private _maxDate: Date | undefined;
  declare private _dateValue: Date | null;

  constructor(config: DateFieldConfig = {}) {
    const triggers = [
      {
        type: 'expand',
        handler: (_f: any) => {
          /* open picker placeholder */
        },
      },
      ...(config.triggers ?? []),
    ];
    super({ xtype: 'datefield', ...config, triggers });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as DateFieldConfig;
    this._format = cfg.format ?? 'Y-m-d';
    this._minDate = cfg.minValue;
    this._maxDate = cfg.maxValue;
    this._dateValue = cfg.value instanceof Date ? cfg.value : null;
  }

  protected override afterRender(): void {
    super.afterRender();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.el!.classList.add('x-datefield');

    // Format initial date value
    if (this._dateValue) {
      this._inputEl.value = formatDate(this._dateValue, this._format);
    }
  }

  // -----------------------------------------------------------------------
  // Value
  // -----------------------------------------------------------------------

  getDateValue(): Date | null {
    return this._dateValue;
  }

  override setValue(value: unknown): void {
    if (value instanceof Date) {
      this._dateValue = value;
      const formatted = formatDate(value, this._format);
      this._value = formatted;
      if (this._inputEl) this._inputEl.value = formatted;
      this.onValueChange(null, value);
    } else if (typeof value === 'string' && value) {
      this._dateValue = parseDate(value, this._format);
      this._value = value;
      if (this._inputEl) this._inputEl.value = value;
      this.onValueChange(null, this._dateValue);
    } else {
      this._dateValue = null;
      this._value = '';
      if (this._inputEl) this._inputEl.value = '';
    }
  }

  // -----------------------------------------------------------------------
  // Constraints
  // -----------------------------------------------------------------------

  setMinValue(date: Date): void {
    this._minDate = date;
  }
  setMaxValue(date: Date): void {
    this._maxDate = date;
  }

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  protected override computeErrors(): string[] {
    const errors = super.computeErrors();
    const d = this._dateValue;
    if (!d) return errors;

    if (this._minDate && d.getTime() < this._minDate.getTime()) {
      errors.push(`Date must be on or after ${formatDate(this._minDate, this._format)}`);
    }
    if (this._maxDate && d.getTime() > this._maxDate.getTime()) {
      errors.push(`Date must be on or before ${formatDate(this._maxDate, this._format)}`);
    }

    return errors;
  }
}
