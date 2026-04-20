/**
 * @framesquared/form – TimeField
 *
 * A text field for time input.  Supports HH:mm (24-hour) and hh:mm A (12-hour)
 * formats.  Clicking the clock trigger opens a dropdown list of time slots
 * spaced at `increment` minutes, bounded by `minValue`/`maxValue`.
 * Validates format and min/max boundaries.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { TextField } from './Text.js';
import type { TextFieldConfig } from './Text.js';

export type TimeFormat = 'HH:mm' | 'hh:mm A';

export interface TimeFieldConfig extends TextFieldConfig {
  format?: TimeFormat;
  minValue?: string;
  maxValue?: string;
  /** Slot spacing in minutes. Defaults to 30. */
  increment?: number;
}

export function parseTimeToMinutes(value: string, format: TimeFormat): number {
  const s = (value ?? '').trim();
  if (!s) return -1;

  if (format === 'HH:mm') {
    const m = /^(\d{1,2}):(\d{2})$/.exec(s);
    if (!m) return -1;
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (h > 23 || min > 59) return -1;
    return h * 60 + min;
  }

  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(s);
  if (!m) return -1;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (h < 1 || h > 12 || min > 59) return -1;
  if (ampm === 'AM') {
    if (h === 12) h = 0;
  } else {
    if (h !== 12) h += 12;
  }
  return h * 60 + min;
}

function minutesToDisplay(totalMinutes: number, format: TimeFormat): string {
  const h24 = Math.floor(totalMinutes / 60);
  const min = totalMinutes % 60;
  const mm = String(min).padStart(2, '0');

  if (format === 'HH:mm') {
    return `${String(h24).padStart(2, '0')}:${mm}`;
  }

  const period = h24 < 12 ? 'AM' : 'PM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${mm} ${period}`;
}

export class TimeField extends TextField {
  static override $className = 'Ext.form.field.Time';

  declare private _timeFormat: TimeFormat;
  declare private _minMinutes: number;
  declare private _maxMinutes: number;
  declare private _increment: number;
  declare private _dropdownEl: HTMLElement | null;
  declare private _dropdownVisible: boolean;
  declare private _outsideClickHandler: ((e: MouseEvent) => void) | null;

  constructor(config: TimeFieldConfig = {}) {
    const triggers = [
      {
        type: 'clock',
        handler: (_f: any) => {
          if (this._dropdownVisible) this.closeDropdown();
          else this.openDropdown();
        },
      },
      ...(config.triggers ?? []),
    ];
    super({ xtype: 'timefield', ...config, triggers });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as TimeFieldConfig;
    this._timeFormat = cfg.format ?? 'HH:mm';
    this._minMinutes = cfg.minValue ? parseTimeToMinutes(cfg.minValue, this._timeFormat) : 0;
    this._maxMinutes = cfg.maxValue ? parseTimeToMinutes(cfg.maxValue, this._timeFormat) : 23 * 60 + 30;
    this._increment = cfg.increment ?? 30;
    this._dropdownEl = null;
    this._dropdownVisible = false;
    this._outsideClickHandler = null;
  }

  protected override afterRender(): void {
    super.afterRender();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.el!.classList.add('x-timefield');

    const placeholder = this._timeFormat === 'HH:mm' ? 'HH:mm' : 'hh:mm AM/PM';
    if (!this._inputEl.placeholder) {
      this._inputEl.placeholder = placeholder;
    }
  }

  // -----------------------------------------------------------------------
  // Dropdown
  // -----------------------------------------------------------------------

  openDropdown(): void {
    if (this._dropdownVisible) return;

    if (!this._dropdownEl) {
      this._dropdownEl = document.createElement('div');
      this._dropdownEl.classList.add('x-boundlist');
      this._dropdownEl.style.position = 'fixed';
      this._dropdownEl.style.zIndex = '2000';
      this._dropdownEl.setAttribute('role', 'listbox');
      document.body.appendChild(this._dropdownEl);
    }

    this._renderSlots();

    const rect = this._inputEl.getBoundingClientRect();
    this._dropdownEl.style.top = `${rect.bottom + 2}px`;
    this._dropdownEl.style.left = `${rect.left}px`;
    this._dropdownEl.style.width = `${rect.width}px`;
    this._dropdownEl.style.display = '';

    this._dropdownVisible = true;

    this._outsideClickHandler = (e: MouseEvent) => {
      const target = e.target as Node;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (!this._dropdownEl!.contains(target) && !this.el!.contains(target)) {
        this.closeDropdown();
      }
    };
    setTimeout(() => {
      document.addEventListener('click', this._outsideClickHandler!);
    }, 0);
  }

  closeDropdown(): void {
    if (!this._dropdownVisible) return;
    this._dropdownVisible = false;
    if (this._dropdownEl) this._dropdownEl.style.display = 'none';
    if (this._outsideClickHandler) {
      document.removeEventListener('click', this._outsideClickHandler);
      this._outsideClickHandler = null;
    }
  }

  private _renderSlots(): void {
    if (!this._dropdownEl) return;
    this._dropdownEl.innerHTML = '';

    const currentMins = parseTimeToMinutes(this.getValue(), this._timeFormat);
    const start = this._minMinutes !== -1 ? this._minMinutes : 0;
    const end = this._maxMinutes !== -1 ? this._maxMinutes : 23 * 60 + 30;

    for (let mins = start; mins <= end; mins += this._increment) {
      const label = minutesToDisplay(mins, this._timeFormat);
      const item = document.createElement('div');
      item.classList.add('x-boundlist-item');
      item.setAttribute('role', 'option');
      item.textContent = label;

      if (mins === currentMins) {
        item.classList.add('x-boundlist-item-selected');
      }

      item.addEventListener('click', () => {
        this.setValue(label);
        this.closeDropdown();
        this.fire('select', this, label);
      });

      this._dropdownEl.appendChild(item);
    }
  }

  // -----------------------------------------------------------------------
  // Value / format queries
  // -----------------------------------------------------------------------

  getMinutesValue(): number {
    return parseTimeToMinutes(this.getValue(), this._timeFormat);
  }

  getTimeFormat(): TimeFormat {
    return this._timeFormat;
  }

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  protected override computeErrors(): string[] {
    const errors = super.computeErrors();
    const raw = this.getValue();
    if (!raw) return errors;

    const mins = parseTimeToMinutes(raw, this._timeFormat);
    if (mins === -1) {
      const fmt = this._timeFormat === 'HH:mm' ? 'HH:mm (e.g. 14:30)' : 'hh:mm AM/PM (e.g. 02:30 PM)';
      errors.push(`Time must be in format ${fmt}`);
      return errors;
    }

    const cfg = this._config as TimeFieldConfig;
    if (cfg.minValue) {
      const minMins = parseTimeToMinutes(cfg.minValue, this._timeFormat);
      if (minMins !== -1 && mins < minMins) {
        errors.push(`Time must be at or after ${cfg.minValue}`);
      }
    }
    if (cfg.maxValue) {
      const maxMins = parseTimeToMinutes(cfg.maxValue, this._timeFormat);
      if (maxMins !== -1 && mins > maxMins) {
        errors.push(`Time must be at or before ${cfg.maxValue}`);
      }
    }

    return errors;
  }

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  protected override onDestroy(): void {
    this.closeDropdown();
    if (this._dropdownEl) {
      this._dropdownEl.remove();
      this._dropdownEl = null;
    }
    super.onDestroy();
  }
}
