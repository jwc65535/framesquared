import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NumberField } from '../src/field/Number.js';
import { DateField } from '../src/field/Date.js';
import { DatePicker } from '../src/picker/DatePicker.js';
import { ColorPicker } from '../src/picker/ColorPicker.js';
import * as DateUtil from '../src/util/DateUtil.js';

class MockRO { constructor() {} observe() {} unobserve() {} disconnect() {} }
beforeEach(() => { (globalThis as any).ResizeObserver = MockRO; });
afterEach(() => { document.body.innerHTML = ''; });

// ═══════════════════════════════════════════════════════════════════════════
// DateUtil
// ═══════════════════════════════════════════════════════════════════════════

describe('DateUtil — format', () => {
  it('Y-m-d format', () => {
    expect(DateUtil.formatDate(new Date(2024, 0, 15), 'Y-m-d')).toBe('2024-01-15');
  });

  it('m/d/Y format', () => {
    expect(DateUtil.formatDate(new Date(2024, 11, 25), 'm/d/Y')).toBe('12/25/2024');
  });

  it('d.m.Y format', () => {
    expect(DateUtil.formatDate(new Date(2024, 5, 3), 'd.m.Y')).toBe('03.06.2024');
  });

  it('H:i:s format', () => {
    const d = new Date(2024, 0, 1, 14, 5, 9);
    expect(DateUtil.formatDate(d, 'H:i:s')).toBe('14:05:09');
  });

  it('Y-m-d H:i format', () => {
    const d = new Date(2024, 6, 4, 9, 30);
    expect(DateUtil.formatDate(d, 'Y-m-d H:i')).toBe('2024-07-04 09:30');
  });

  it('g:i A format (12-hour)', () => {
    expect(DateUtil.formatDate(new Date(2024, 0, 1, 14, 30), 'g:i A')).toBe('2:30 PM');
    expect(DateUtil.formatDate(new Date(2024, 0, 1, 9, 5), 'g:i A')).toBe('9:05 AM');
  });

  it('midnight is 12 AM in 12-hour', () => {
    expect(DateUtil.formatDate(new Date(2024, 0, 1, 0, 0), 'g:i A')).toBe('12:00 AM');
  });

  it('noon is 12 PM in 12-hour', () => {
    expect(DateUtil.formatDate(new Date(2024, 0, 1, 12, 0), 'g:i A')).toBe('12:00 PM');
  });
});

describe('DateUtil — parse', () => {
  it('parses Y-m-d', () => {
    const d = DateUtil.parseDate('2024-01-15', 'Y-m-d');
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(15);
  });

  it('parses m/d/Y', () => {
    const d = DateUtil.parseDate('12/25/2024', 'm/d/Y');
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(25);
  });

  it('parse/format roundtrip', () => {
    const fmt = 'Y-m-d';
    const original = '2024-06-15';
    expect(DateUtil.formatDate(DateUtil.parseDate(original, fmt), fmt)).toBe(original);
  });
});

describe('DateUtil — add', () => {
  it('add days', () => {
    const d = DateUtil.addDate(new Date(2024, 0, 30), 'day', 3);
    expect(d.getDate()).toBe(2);
    expect(d.getMonth()).toBe(1);
  });

  it('add months', () => {
    const d = DateUtil.addDate(new Date(2024, 0, 15), 'month', 1);
    expect(d.getMonth()).toBe(1); // Feb 15
    expect(d.getDate()).toBe(15);
  });

  it('add years', () => {
    const d = DateUtil.addDate(new Date(2024, 5, 15), 'year', 2);
    expect(d.getFullYear()).toBe(2026);
  });

  it('add negative (subtract)', () => {
    const d = DateUtil.addDate(new Date(2024, 0, 1), 'day', -1);
    expect(d.getFullYear()).toBe(2023);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(31);
  });
});

describe('DateUtil — diff', () => {
  it('diff days', () => {
    const a = new Date(2024, 0, 1);
    const b = new Date(2024, 0, 11);
    expect(DateUtil.diffDate(a, b, 'day')).toBe(10);
  });

  it('diff negative', () => {
    const a = new Date(2024, 0, 11);
    const b = new Date(2024, 0, 1);
    expect(DateUtil.diffDate(a, b, 'day')).toBe(-10);
  });
});

describe('DateUtil — helpers', () => {
  it('isLeapYear', () => {
    expect(DateUtil.isLeapYear(2024)).toBe(true);
    expect(DateUtil.isLeapYear(2023)).toBe(false);
    expect(DateUtil.isLeapYear(1900)).toBe(false);
    expect(DateUtil.isLeapYear(2000)).toBe(true);
  });

  it('getDaysInMonth', () => {
    expect(DateUtil.getDaysInMonth(2024, 1)).toBe(29); // Feb leap
    expect(DateUtil.getDaysInMonth(2023, 1)).toBe(28); // Feb non-leap
    expect(DateUtil.getDaysInMonth(2024, 0)).toBe(31); // Jan
    expect(DateUtil.getDaysInMonth(2024, 3)).toBe(30); // Apr
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// NumberField
// ═══════════════════════════════════════════════════════════════════════════

describe('NumberField — basics', () => {
  function numField(cfg: Record<string, unknown> = {}): NumberField {
    return new NumberField({ renderTo: document.body, ...cfg });
  }

  it('renders with x-numberfield class', () => {
    const f = numField({ fieldLabel: 'Qty' });
    expect(f.el!.classList.contains('x-numberfield')).toBe(true);
  });

  it('has spinner triggers', () => {
    const f = numField();
    const up = f.el!.querySelector('.x-trigger-spinner-up');
    const down = f.el!.querySelector('.x-trigger-spinner-down');
    expect(up).not.toBeNull();
    expect(down).not.toBeNull();
  });

  it('getValue returns number', () => {
    const f = numField({ value: 42 });
    expect(f.getNumberValue()).toBe(42);
  });

  it('setValue sets input value', () => {
    const f = numField();
    f.setValue(99);
    expect(f.getInputEl().value).toBe('99');
  });
});

describe('NumberField — spin', () => {
  function numField(cfg: Record<string, unknown> = {}): NumberField {
    return new NumberField({ renderTo: document.body, ...cfg });
  }

  it('spinUp increments by step', () => {
    const f = numField({ value: 10, step: 5 });
    f.spinUp();
    expect(f.getNumberValue()).toBe(15);
  });

  it('spinDown decrements by step', () => {
    const f = numField({ value: 10, step: 5 });
    f.spinDown();
    expect(f.getNumberValue()).toBe(5);
  });

  it('default step is 1', () => {
    const f = numField({ value: 5 });
    f.spinUp();
    expect(f.getNumberValue()).toBe(6);
  });

  it('clicking spinner up trigger increments', () => {
    const f = numField({ value: 0 });
    const up = f.el!.querySelector('.x-trigger-spinner-up') as HTMLElement;
    up.click();
    expect(f.getNumberValue()).toBe(1);
  });

  it('clicking spinner down trigger decrements', () => {
    const f = numField({ value: 5 });
    const down = f.el!.querySelector('.x-trigger-spinner-down') as HTMLElement;
    down.click();
    expect(f.getNumberValue()).toBe(4);
  });

  it('spin fires "spin" event', () => {
    const spy = vi.fn();
    const f = numField({ value: 0, listeners: { spin: spy } });
    f.spinUp();
    expect(spy).toHaveBeenCalled();
  });
});

describe('NumberField — constraints', () => {
  function numField(cfg: Record<string, unknown> = {}): NumberField {
    return new NumberField({ renderTo: document.body, ...cfg });
  }

  it('maxValue clamps spinUp', () => {
    const f = numField({ value: 9, maxValue: 10, step: 5 });
    f.spinUp();
    expect(f.getNumberValue()).toBe(10);
  });

  it('minValue clamps spinDown', () => {
    const f = numField({ value: 2, minValue: 0, step: 5 });
    f.spinDown();
    expect(f.getNumberValue()).toBe(0);
  });

  it('validation fails for value > maxValue', () => {
    const f = numField({ value: 15, maxValue: 10 });
    expect(f.isValid()).toBe(false);
  });

  it('validation fails for value < minValue', () => {
    const f = numField({ value: -5, minValue: 0 });
    expect(f.isValid()).toBe(false);
  });

  it('setMinValue updates constraint', () => {
    const f = numField({ value: 5 });
    f.setMinValue(10);
    expect(f.isValid()).toBe(false);
  });

  it('setMaxValue updates constraint', () => {
    const f = numField({ value: 20 });
    f.setMaxValue(15);
    expect(f.isValid()).toBe(false);
  });
});

describe('NumberField — decimals', () => {
  function numField(cfg: Record<string, unknown> = {}): NumberField {
    return new NumberField({ renderTo: document.body, ...cfg });
  }

  it('allowDecimals:false rejects decimal values', () => {
    const f = numField({ value: 1.5, allowDecimals: false });
    expect(f.isValid()).toBe(false);
  });

  it('decimalPrecision formats value', () => {
    const f = numField({ value: 3.14159, decimalPrecision: 2 });
    expect(f.getInputEl().value).toBe('3.14');
  });

  it('non-numeric value is invalid', () => {
    const f = numField();
    f.setRawValue('abc');
    expect(f.isValid()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DateField
// ═══════════════════════════════════════════════════════════════════════════

describe('DateField', () => {
  function dateField(cfg: Record<string, unknown> = {}): DateField {
    return new DateField({ renderTo: document.body, format: 'Y-m-d', ...cfg });
  }

  it('renders with x-datefield class', () => {
    const f = dateField();
    expect(f.el!.classList.contains('x-datefield')).toBe(true);
  });

  it('has expand trigger', () => {
    const f = dateField();
    expect(f.el!.querySelector('.x-trigger-expand')).not.toBeNull();
  });

  it('getValue returns Date object', () => {
    const f = dateField({ value: new Date(2024, 5, 15) });
    const v = f.getDateValue();
    expect(v?.getFullYear()).toBe(2024);
    expect(v?.getMonth()).toBe(5);
    expect(v?.getDate()).toBe(15);
  });

  it('displays formatted date in input', () => {
    const f = dateField({ value: new Date(2024, 0, 1) });
    expect(f.getInputEl().value).toBe('2024-01-01');
  });

  it('setValue with Date updates display', () => {
    const f = dateField();
    f.setValue(new Date(2024, 11, 25));
    expect(f.getInputEl().value).toBe('2024-12-25');
  });

  it('setValue with string parses the date', () => {
    const f = dateField();
    f.setValue('2024-06-15');
    expect(f.getDateValue()?.getMonth()).toBe(5);
  });

  it('custom format m/d/Y', () => {
    const f = dateField({ format: 'm/d/Y', value: new Date(2024, 0, 5) });
    expect(f.getInputEl().value).toBe('01/05/2024');
  });

  it('minValue validation', () => {
    const f = dateField({ value: new Date(2024, 0, 1), minValue: new Date(2024, 5, 1) });
    expect(f.isValid()).toBe(false);
  });

  it('maxValue validation', () => {
    const f = dateField({ value: new Date(2024, 11, 31), maxValue: new Date(2024, 5, 30) });
    expect(f.isValid()).toBe(false);
  });

  it('valid date within range', () => {
    const f = dateField({
      value: new Date(2024, 5, 15),
      minValue: new Date(2024, 0, 1),
      maxValue: new Date(2024, 11, 31),
    });
    expect(f.isValid()).toBe(true);
  });

  it('setMinValue / setMaxValue update constraints', () => {
    const f = dateField({ value: new Date(2024, 5, 15) });
    f.setMinValue(new Date(2024, 8, 1));
    expect(f.isValid()).toBe(false);
    f.setMaxValue(new Date(2024, 3, 1));
    expect(f.isValid()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DatePicker
// ═══════════════════════════════════════════════════════════════════════════

describe('DatePicker', () => {
  function picker(cfg: Record<string, unknown> = {}): DatePicker {
    return new DatePicker({ renderTo: document.body, ...cfg });
  }

  it('renders with x-datepicker class', () => {
    const p = picker();
    expect(p.el!.classList.contains('x-datepicker')).toBe(true);
  });

  it('shows current month/year', () => {
    const p = picker({ value: new Date(2024, 5, 15) });
    const header = p.el!.querySelector('.x-datepicker-header');
    expect(header?.textContent).toContain('June');
    expect(header?.textContent).toContain('2024');
  });

  it('renders day cells for the month', () => {
    const p = picker({ value: new Date(2024, 0, 1) });
    const cells = p.el!.querySelectorAll('.x-datepicker-cell');
    expect(cells.length).toBeGreaterThanOrEqual(28); // At least 28 days in Jan
  });

  it('navigate to next month', () => {
    const p = picker({ value: new Date(2024, 0, 15) });
    const nextBtn = p.el!.querySelector('.x-datepicker-next') as HTMLElement;
    nextBtn.click();
    expect(p.el!.querySelector('.x-datepicker-header')?.textContent).toContain('February');
  });

  it('navigate to previous month', () => {
    const p = picker({ value: new Date(2024, 5, 15) });
    const prevBtn = p.el!.querySelector('.x-datepicker-prev') as HTMLElement;
    prevBtn.click();
    expect(p.el!.querySelector('.x-datepicker-header')?.textContent).toContain('May');
  });

  it('clicking a date fires "select" event', () => {
    const spy = vi.fn();
    const p = picker({ value: new Date(2024, 0, 15), listeners: { select: spy } });
    const cells = p.el!.querySelectorAll('.x-datepicker-cell:not(.x-datepicker-disabled)');
    const cell = cells[10] as HTMLElement; // pick an enabled cell
    cell.click();
    expect(spy).toHaveBeenCalled();
  });

  it('disabled dates have x-datepicker-disabled class', () => {
    const p = picker({
      value: new Date(2024, 0, 15),
      disabledDays: [0, 6], // Sun, Sat
    });
    const disabled = p.el!.querySelectorAll('.x-datepicker-disabled');
    expect(disabled.length).toBeGreaterThan(0);
  });

  it('clicking disabled date does not fire select', () => {
    const spy = vi.fn();
    const p = picker({
      value: new Date(2024, 0, 15),
      disabledDays: [0, 6],
      listeners: { select: spy },
    });
    const disabled = p.el!.querySelector('.x-datepicker-disabled') as HTMLElement;
    if (disabled) disabled.click();
    expect(spy).not.toHaveBeenCalled();
  });

  it('minDate disables earlier dates', () => {
    const p = picker({
      value: new Date(2024, 0, 15),
      minValue: new Date(2024, 0, 10),
    });
    const cells = p.el!.querySelectorAll('.x-datepicker-cell');
    // Day 1 through 9 should be disabled
    let disabledCount = 0;
    cells.forEach(c => { if (c.classList.contains('x-datepicker-disabled')) disabledCount++; });
    expect(disabledCount).toBeGreaterThan(0);
  });

  it('today button exists when showToday:true (default)', () => {
    const p = picker();
    expect(p.el!.querySelector('.x-datepicker-today')).not.toBeNull();
  });

  it('getSelectedDate returns the selected value', () => {
    const d = new Date(2024, 5, 15);
    const p = picker({ value: d });
    const sel = p.getSelectedDate();
    expect(sel.getFullYear()).toBe(2024);
    expect(sel.getMonth()).toBe(5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ColorPicker
// ═══════════════════════════════════════════════════════════════════════════

describe('ColorPicker', () => {
  function colorPicker(cfg: Record<string, unknown> = {}): ColorPicker {
    return new ColorPicker({ renderTo: document.body, ...cfg });
  }

  it('renders with x-colorpicker class', () => {
    const p = colorPicker();
    expect(p.el!.classList.contains('x-colorpicker')).toBe(true);
  });

  it('renders color swatches', () => {
    const p = colorPicker();
    const swatches = p.el!.querySelectorAll('.x-colorpicker-swatch');
    expect(swatches.length).toBeGreaterThan(0);
  });

  it('clicking a swatch fires "select" with color value', () => {
    const spy = vi.fn();
    const p = colorPicker({ listeners: { select: spy } });
    const swatch = p.el!.querySelector('.x-colorpicker-swatch') as HTMLElement;
    swatch.click();
    expect(spy).toHaveBeenCalled();
    // First argument should be the picker, second should be a color string
    expect(typeof spy.mock.calls[0][1]).toBe('string');
  });

  it('custom colors config', () => {
    const p = colorPicker({ colors: ['FF0000', '00FF00', '0000FF'] });
    const swatches = p.el!.querySelectorAll('.x-colorpicker-swatch');
    expect(swatches.length).toBe(3);
  });

  it('getValue returns the selected color', () => {
    const p = colorPicker();
    const swatch = p.el!.querySelector('.x-colorpicker-swatch') as HTMLElement;
    swatch.click();
    expect(p.getSelectedColor()).toBeTruthy();
  });
});
