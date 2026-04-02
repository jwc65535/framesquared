/**
 * @framesquared/form – DatePicker
 *
 * Full calendar widget.  Shows a month grid with day cells,
 * prev/next navigation, today button, and disabled date support.
 * Fires 'select' when a date is clicked.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Component } from '@framesquared/component';
import type { ComponentConfig } from '@framesquared/component';
import { getMonthName, getDaysInMonth } from '../util/DateUtil.js';

export interface DatePickerConfig extends ComponentConfig {
  value?: Date;
  minValue?: Date;
  maxValue?: Date;
  disabledDays?: number[];
  disabledDates?: string[];
  showToday?: boolean;
}

export class DatePicker extends Component {
  static override $className = 'Ext.picker.Date';

  declare private _viewDate: Date;
  declare private _selectedDate: Date;
  declare private _minDate: Date | undefined;
  declare private _maxDate: Date | undefined;
  declare private _disabledDays: Set<number>;
  declare private _gridEl: HTMLElement | null;
  declare private _headerEl: HTMLElement | null;

  constructor(config: DatePickerConfig = {}) {
    super({ xtype: 'datepicker', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as DatePickerConfig;
    const now = cfg.value ?? new Date();
    this._viewDate = new Date(now.getFullYear(), now.getMonth(), 1);
    this._selectedDate = new Date(now.getTime());
    this._minDate = cfg.minValue;
    this._maxDate = cfg.maxValue;
    this._disabledDays = new Set(cfg.disabledDays ?? []);
    this._gridEl = null;
    this._headerEl = null;
  }

  protected override afterRender(): void {
    super.afterRender();
    this.el!.classList.add('x-datepicker');
    this.buildUI();
  }

  // -----------------------------------------------------------------------
  // UI Build
  // -----------------------------------------------------------------------

  private buildUI(): void {
    const el = this.el!;
    el.innerHTML = '';

    // Navigation
    const nav = document.createElement('div');
    nav.classList.add('x-datepicker-nav');

    const prevBtn = document.createElement('button');
    prevBtn.classList.add('x-datepicker-prev');
    prevBtn.type = 'button';
    prevBtn.textContent = '‹';
    prevBtn.addEventListener('click', () => this.navigate(-1));

    this._headerEl = document.createElement('span');
    this._headerEl.classList.add('x-datepicker-header');

    const nextBtn = document.createElement('button');
    nextBtn.classList.add('x-datepicker-next');
    nextBtn.type = 'button';
    nextBtn.textContent = '›';
    nextBtn.addEventListener('click', () => this.navigate(1));

    nav.appendChild(prevBtn);
    nav.appendChild(this._headerEl);
    nav.appendChild(nextBtn);
    el.appendChild(nav);

    // Day headers
    const dayHeaders = document.createElement('div');
    dayHeaders.classList.add('x-datepicker-days');
    for (const d of ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']) {
      const dh = document.createElement('span');
      dh.classList.add('x-datepicker-dayname');
      dh.textContent = d;
      dayHeaders.appendChild(dh);
    }
    el.appendChild(dayHeaders);

    // Grid
    this._gridEl = document.createElement('div');
    this._gridEl.classList.add('x-datepicker-grid');
    el.appendChild(this._gridEl);

    // Today button
    const cfg = this._config as DatePickerConfig;
    if (cfg.showToday !== false) {
      const todayBtn = document.createElement('button');
      todayBtn.classList.add('x-datepicker-today');
      todayBtn.type = 'button';
      todayBtn.textContent = 'Today';
      todayBtn.addEventListener('click', () => {
        const today = new Date();
        this._selectedDate = today;
        this._viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
        this.renderGrid();
        this.fire('select', this, today);
      });
      el.appendChild(todayBtn);
    }

    this.renderGrid();
  }

  private renderGrid(): void {
    if (!this._gridEl || !this._headerEl) return;

    const year = this._viewDate.getFullYear();
    const month = this._viewDate.getMonth();

    // Header
    this._headerEl.textContent = `${getMonthName(month)} ${year}`;

    // Clear grid
    this._gridEl.innerHTML = '';

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun

    // Leading blanks
    for (let i = 0; i < firstDay; i++) {
      const blank = document.createElement('span');
      blank.classList.add('x-datepicker-blank');
      this._gridEl.appendChild(blank);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const cell = document.createElement('span');
      cell.classList.add('x-datepicker-cell');
      cell.textContent = String(day);
      cell.setAttribute(
        'data-date',
        `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      );

      const disabled = this.isDateDisabled(cellDate);
      if (disabled) {
        cell.classList.add('x-datepicker-disabled');
      }

      // Selected
      if (
        this._selectedDate &&
        cellDate.getFullYear() === this._selectedDate.getFullYear() &&
        cellDate.getMonth() === this._selectedDate.getMonth() &&
        cellDate.getDate() === this._selectedDate.getDate()
      ) {
        cell.classList.add('x-datepicker-selected');
      }

      cell.addEventListener('click', () => {
        if (disabled) return;
        this._selectedDate = cellDate;
        this.renderGrid();
        this.fire('select', this, cellDate);
      });

      this._gridEl.appendChild(cell);
    }
  }

  // -----------------------------------------------------------------------
  // Navigation
  // -----------------------------------------------------------------------

  private navigate(delta: number): void {
    this._viewDate.setMonth(this._viewDate.getMonth() + delta);
    this.renderGrid();
  }

  // -----------------------------------------------------------------------
  // Disabled date check
  // -----------------------------------------------------------------------

  private isDateDisabled(date: Date): boolean {
    // Day of week
    if (this._disabledDays.has(date.getDay())) return true;

    // Min/Max
    if (this._minDate && date.getTime() < this.startOfDay(this._minDate).getTime()) return true;
    if (this._maxDate && date.getTime() > this.startOfDay(this._maxDate).getTime()) return true;

    return false;
  }

  private startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  // -----------------------------------------------------------------------
  // Public
  // -----------------------------------------------------------------------

  getSelectedDate(): Date {
    return new Date(this._selectedDate.getTime());
  }
}
