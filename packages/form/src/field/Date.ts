/**
 * @framesquared/form – DateField
 *
 * A text field for date input.  Formats/parses dates using a
 * configurable format string.  Has a calendar trigger that opens
 * a DatePicker dropdown.  Validates min/max date boundaries.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { TextField } from './Text.js';
import type { TextFieldConfig } from './Text.js';
import { DatePicker } from '../picker/DatePicker.js';
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
  declare private _picker: DatePicker | null;
  declare private _pickerVisible: boolean;
  declare private _outsideClickHandler: ((e: MouseEvent) => void) | null;

  constructor(config: DateFieldConfig = {}) {
    const triggers = [
      {
        type: 'date',
        handler: (_f: any) => {
          if (this._pickerVisible) this.closePicker();
          else this.openPicker();
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
    this._picker = null;
    this._pickerVisible = false;
    this._outsideClickHandler = null;
  }

  protected override afterRender(): void {
    super.afterRender();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.el!.classList.add('x-datefield');

    if (this._dateValue) {
      this._inputEl.value = formatDate(this._dateValue, this._format);
    }
  }

  // -----------------------------------------------------------------------
  // Picker
  // -----------------------------------------------------------------------

  openPicker(): void {
    if (this._pickerVisible) return;

    const cfg = this._config as DateFieldConfig;

    if (!this._picker) {
      this._picker = new DatePicker({
        value: this._dateValue ?? new Date(),
        minValue: this._minDate,
        maxValue: this._maxDate,
        disabledDays: cfg.disabledDays,
        showToday: cfg.showToday,
        renderTo: document.body,
      });

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const pickerEl = this._picker.el!;
      pickerEl.style.position = 'fixed';
      pickerEl.style.zIndex = '2000';

      this._picker.on('select', (_picker: any, date: Date) => {
        this.setValue(date);
        this.closePicker();
        this.fire('select', this, date);
      });
    }

    // Position below the field input
    const rect = this._inputEl.getBoundingClientRect();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const pickerEl = this._picker.el!;
    pickerEl.style.top = `${rect.bottom + 2}px`;
    pickerEl.style.left = `${rect.left}px`;
    pickerEl.style.display = '';

    this._pickerVisible = true;

    // Close on outside click
    this._outsideClickHandler = (e: MouseEvent) => {
      const target = e.target as Node;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (!pickerEl.contains(target) && !this.el!.contains(target)) {
        this.closePicker();
      }
    };
    setTimeout(() => {
      document.addEventListener('click', this._outsideClickHandler!);
    }, 0);

    this.fire('expand', this);
  }

  closePicker(): void {
    if (!this._pickerVisible) return;
    this._pickerVisible = false;
    if (this._picker?.el) {
      this._picker.el.style.display = 'none';
    }
    if (this._outsideClickHandler) {
      document.removeEventListener('click', this._outsideClickHandler);
      this._outsideClickHandler = null;
    }
    this.fire('collapse', this);
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

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  protected override onDestroy(): void {
    this.closePicker();
    if (this._picker) {
      this._picker.destroy();
      this._picker = null;
    }
    super.onDestroy();
  }
}
