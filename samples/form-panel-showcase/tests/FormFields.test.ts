/**
 * TDD test suite for Form Panel Showcase
 * Tests all 11 field types and FormPanel integration.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { Application } from '@framesquared/app';
import {
  TextField,
  TextArea,
  NumberField,
  DateField,
  TimeField,
  parseTimeToMinutes,
  ComboBox,
  Checkbox,
  Radio,
  RadioGroup,
  DisplayField,
  HiddenField,
  FileField,
  FormPanel,
} from '@framesquared/form';

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

let host: HTMLDivElement;

beforeEach(() => {
  (globalThis as unknown as Record<string, unknown>).ResizeObserver = MockResizeObserver;
  host = document.createElement('div');
  document.body.appendChild(host);
  Application.clearInstance();
});

afterEach(() => {
  host.remove();
  document.body.innerHTML = '';
  Application.clearInstance();
});

// ---------------------------------------------------------------------------
// Application lifecycle
// ---------------------------------------------------------------------------

describe('Application lifecycle', () => {
  it('clearInstance resets singleton', () => {
    Application.clearInstance();
    expect(Application.getInstance()).toBeNull();
  });

  it('can be instantiated after clearInstance', () => {
    Application.clearInstance();
    class TestApp extends Application {
      constructor() { super({ name: 'test' }); }
    }
    const app = new TestApp();
    expect(app).toBeTruthy();
  });

  it('start() calls launch()', () => {
    Application.clearInstance();
    let launched = false;
    class TestApp extends Application {
      constructor() { super({ name: 'test' }); }
      override launch() { launched = true; }
    }
    new TestApp().start();
    expect(launched).toBe(true);
  });

  it('getInstance returns active app after start', () => {
    Application.clearInstance();
    class TestApp extends Application {
      constructor() { super({ name: 'test' }); }
    }
    const app = new TestApp();
    app.start();
    expect(Application.getInstance()).toBe(app);
  });

  it('Application has getName()', () => {
    Application.clearInstance();
    class TestApp extends Application {
      constructor() { super({ name: 'MyApp' }); }
    }
    const app = new TestApp();
    expect(app.getName()).toBe('MyApp');
  });
});

// ---------------------------------------------------------------------------
// parseTimeToMinutes utility
// ---------------------------------------------------------------------------

describe('parseTimeToMinutes — HH:mm format', () => {
  it('parses midnight', () => expect(parseTimeToMinutes('00:00', 'HH:mm')).toBe(0));
  it('parses noon', () => expect(parseTimeToMinutes('12:00', 'HH:mm')).toBe(720));
  it('parses 14:30', () => expect(parseTimeToMinutes('14:30', 'HH:mm')).toBe(870));
  it('parses 23:59', () => expect(parseTimeToMinutes('23:59', 'HH:mm')).toBe(1439));
  it('parses single-digit hour', () => expect(parseTimeToMinutes('9:05', 'HH:mm')).toBe(545));
  it('returns -1 for empty string', () => expect(parseTimeToMinutes('', 'HH:mm')).toBe(-1));
  it('returns -1 for bad format', () => expect(parseTimeToMinutes('9am', 'HH:mm')).toBe(-1));
  it('returns -1 for hour > 23', () => expect(parseTimeToMinutes('24:00', 'HH:mm')).toBe(-1));
  it('returns -1 for minute > 59', () => expect(parseTimeToMinutes('12:60', 'HH:mm')).toBe(-1));
});

describe('parseTimeToMinutes — hh:mm A format', () => {
  it('parses 12:00 AM as midnight', () => expect(parseTimeToMinutes('12:00 AM', 'hh:mm A')).toBe(0));
  it('parses 12:00 PM as noon', () => expect(parseTimeToMinutes('12:00 PM', 'hh:mm A')).toBe(720));
  it('parses 2:30 PM', () => expect(parseTimeToMinutes('2:30 PM', 'hh:mm A')).toBe(870));
  it('parses 11:59 PM', () => expect(parseTimeToMinutes('11:59 PM', 'hh:mm A')).toBe(1439));
  it('is case-insensitive for am/pm', () => expect(parseTimeToMinutes('2:30 pm', 'hh:mm A')).toBe(870));
  it('returns -1 for empty string', () => expect(parseTimeToMinutes('', 'hh:mm A')).toBe(-1));
  it('returns -1 for missing AM/PM', () => expect(parseTimeToMinutes('14:30', 'hh:mm A')).toBe(-1));
  it('returns -1 for hour 0', () => expect(parseTimeToMinutes('0:00 AM', 'hh:mm A')).toBe(-1));
  it('returns -1 for minute > 59', () => expect(parseTimeToMinutes('1:60 AM', 'hh:mm A')).toBe(-1));
});

// ---------------------------------------------------------------------------
// TimeField
// ---------------------------------------------------------------------------

describe('TimeField', () => {
  it('has $className Ext.form.field.Time', () => {
    expect(TimeField.$className).toBe('Ext.form.field.Time');
  });

  it('renders into host', () => {
    const f = new TimeField({ renderTo: host });
    expect(host.querySelector('.x-field')).toBeTruthy();
  });

  it('adds x-timefield class after render', () => {
    const f = new TimeField({ renderTo: host });
    expect(f.el!.classList.contains('x-timefield')).toBe(true);
  });

  it('defaults to HH:mm format', () => {
    const f = new TimeField({ renderTo: host });
    expect(f.getTimeFormat()).toBe('HH:mm');
  });

  it('accepts hh:mm A format', () => {
    const f = new TimeField({ format: 'hh:mm A', renderTo: host });
    expect(f.getTimeFormat()).toBe('hh:mm A');
  });

  it('renders a clock trigger', () => {
    const f = new TimeField({ renderTo: host });
    expect(host.querySelector('.x-trigger-clock')).toBeTruthy();
  });

  it('getValue returns empty by default', () => {
    const f = new TimeField({ renderTo: host });
    expect(f.getValue()).toBe('');
  });

  it('setValue updates value', () => {
    const f = new TimeField({ renderTo: host });
    f.setValue('14:30');
    expect(f.getValue()).toBe('14:30');
  });

  it('getMinutesValue returns -1 for empty', () => {
    const f = new TimeField({ renderTo: host });
    expect(f.getMinutesValue()).toBe(-1);
  });

  it('getMinutesValue returns minutes for valid value', () => {
    const f = new TimeField({ renderTo: host });
    f.setValue('14:30');
    expect(f.getMinutesValue()).toBe(870);
  });

  it('isValid true for valid time', () => {
    const f = new TimeField({ renderTo: host, allowBlank: false });
    f.setValue('09:00');
    expect(f.isValid()).toBe(true);
  });

  it('isValid false for blank when required', () => {
    const f = new TimeField({ renderTo: host, allowBlank: false });
    expect(f.isValid()).toBe(false);
  });

  it('validates format — invalid string fails', () => {
    const f = new TimeField({ renderTo: host });
    f.setValue('bad-time');
    const errors = f.getErrors();
    expect(errors.length).toBeGreaterThan(0);
  });

  it('validates minValue constraint', () => {
    const f = new TimeField({ renderTo: host, minValue: '09:00' });
    f.setValue('08:00');
    expect(f.isValid()).toBe(false);
  });

  it('validates maxValue constraint', () => {
    const f = new TimeField({ renderTo: host, maxValue: '17:00' });
    f.setValue('18:00');
    expect(f.isValid()).toBe(false);
  });

  it('passes when within min/max range', () => {
    const f = new TimeField({ renderTo: host, minValue: '09:00', maxValue: '17:00' });
    f.setValue('12:30');
    expect(f.isValid()).toBe(true);
  });

  it('supports initial value config', () => {
    const f = new TimeField({ renderTo: host, value: '10:00' });
    expect(f.getValue()).toBe('10:00');
  });
});

// ---------------------------------------------------------------------------
// TextField
// ---------------------------------------------------------------------------

describe('TextField', () => {
  it('renders into host', () => {
    new TextField({ renderTo: host });
    expect(host.querySelector('.x-field')).toBeTruthy();
  });

  it('displays fieldLabel', () => {
    new TextField({ renderTo: host, fieldLabel: 'First Name' });
    expect(host.querySelector('label')!.textContent).toContain('First Name');
  });

  it('setValue / getValue round-trip', () => {
    const f = new TextField({ renderTo: host });
    f.setValue('hello');
    expect(f.getValue()).toBe('hello');
  });

  it('validates allowBlank: false', () => {
    const f = new TextField({ renderTo: host, allowBlank: false });
    expect(f.isValid()).toBe(false);
  });

  it('validates minLength', () => {
    const f = new TextField({ renderTo: host, minLength: 5 });
    f.setValue('abc');
    expect(f.isValid()).toBe(false);
  });

  it('validates maxLength', () => {
    const f = new TextField({ renderTo: host, maxLength: 3 });
    f.setValue('abcdef');
    expect(f.isValid()).toBe(false);
  });

  it('renders trigger when configured', () => {
    new TextField({
      renderTo: host,
      triggers: [{ type: 'search', handler: () => {} }],
    });
    expect(host.querySelector('.x-trigger-search')).toBeTruthy();
  });

  it('trigger click fires handler', () => {
    let clicked = false;
    const f = new TextField({
      renderTo: host,
      triggers: [{ type: 'clear', handler: () => { clicked = true; } }],
    });
    (host.querySelector('.x-trigger-clear') as HTMLElement).click();
    expect(clicked).toBe(true);
  });

  it('reset restores original value', () => {
    const f = new TextField({ renderTo: host, value: 'init' });
    f.setValue('changed');
    f.reset();
    expect(f.getValue()).toBe('init');
  });
});

// ---------------------------------------------------------------------------
// NumberField
// ---------------------------------------------------------------------------

describe('NumberField', () => {
  it('renders into host', () => {
    new NumberField({ renderTo: host });
    expect(host.querySelector('.x-field')).toBeTruthy();
  });

  it('getValue returns number', () => {
    const f = new NumberField({ renderTo: host, value: 42 });
    expect(Number(f.getValue())).toBe(42);
  });

  it('validates minValue', () => {
    const f = new NumberField({ renderTo: host, minValue: 10 });
    f.setValue(5);
    expect(f.isValid()).toBe(false);
  });

  it('validates maxValue', () => {
    const f = new NumberField({ renderTo: host, maxValue: 100 });
    f.setValue(200);
    expect(f.isValid()).toBe(false);
  });

  it('passes within range', () => {
    const f = new NumberField({ renderTo: host, minValue: 0, maxValue: 100 });
    f.setValue(50);
    expect(f.isValid()).toBe(true);
  });

  it('has spinner-up trigger', () => {
    new NumberField({ renderTo: host });
    expect(host.querySelector('.x-trigger-spinner-up')).toBeTruthy();
  });

  it('has spinner-down trigger', () => {
    new NumberField({ renderTo: host });
    expect(host.querySelector('.x-trigger-spinner-down')).toBeTruthy();
  });

  it('allowBlank false fails on empty', () => {
    const f = new NumberField({ renderTo: host, allowBlank: false });
    expect(f.isValid()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TextArea
// ---------------------------------------------------------------------------

describe('TextArea', () => {
  it('renders a textarea element', () => {
    new TextArea({ renderTo: host });
    expect(host.querySelector('textarea')).toBeTruthy();
  });

  it('setValue / getValue round-trip', () => {
    const f = new TextArea({ renderTo: host });
    f.setValue('multi\nline');
    expect(f.getValue()).toBe('multi\nline');
  });

  it('validates maxLength', () => {
    const f = new TextArea({ renderTo: host, maxLength: 10 });
    f.setValue('this is too long text');
    expect(f.isValid()).toBe(false);
  });

  it('allows blank by default', () => {
    const f = new TextArea({ renderTo: host });
    expect(f.isValid()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// DateField
// ---------------------------------------------------------------------------

describe('DateField', () => {
  it('renders into host', () => {
    new DateField({ renderTo: host });
    expect(host.querySelector('.x-field')).toBeTruthy();
  });

  it('has x-datefield class after render', () => {
    const f = new DateField({ renderTo: host });
    expect(f.el!.classList.contains('x-datefield')).toBe(true);
  });

  it('renders calendar trigger', () => {
    new DateField({ renderTo: host });
    expect(host.querySelector('.x-trigger-date')).toBeTruthy();
  });

  it('setValue with date string', () => {
    const f = new DateField({ renderTo: host });
    f.setValue('2024-01-15');
    expect(f.getValue()).toBe('2024-01-15');
  });

  it('getDateValue returns null for empty', () => {
    const f = new DateField({ renderTo: host });
    expect(f.getDateValue()).toBeNull();
  });

  it('getDateValue returns Date for valid value', () => {
    const f = new DateField({ renderTo: host });
    f.setValue(new Date(2024, 0, 15));
    expect(f.getDateValue()).toBeInstanceOf(Date);
  });

  it('validates minValue date', () => {
    const f = new DateField({ renderTo: host, minValue: new Date(2024, 0, 1) });
    f.setValue(new Date(2023, 11, 31));
    expect(f.isValid()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Checkbox
// ---------------------------------------------------------------------------

describe('Checkbox', () => {
  it('renders into host', () => {
    new Checkbox({ renderTo: host });
    expect(host.querySelector('.x-checkbox')).toBeTruthy();
  });

  it('is unchecked by default', () => {
    const f = new Checkbox({ renderTo: host });
    expect(f.isChecked()).toBe(false);
  });

  it('can be checked initially', () => {
    const f = new Checkbox({ renderTo: host, checked: true });
    expect(f.isChecked()).toBe(true);
  });

  it('setChecked(true) checks box', () => {
    const f = new Checkbox({ renderTo: host });
    f.setChecked(true);
    expect(f.isChecked()).toBe(true);
  });

  it('setChecked(false) unchecks box', () => {
    const f = new Checkbox({ renderTo: host, checked: true });
    f.setChecked(false);
    expect(f.isChecked()).toBe(false);
  });

  it('renders boxLabel', () => {
    new Checkbox({ renderTo: host, boxLabel: 'Accept terms' });
    expect(host.textContent).toContain('Accept terms');
  });

  it('isValid always true (no required checkbox support in base)', () => {
    const f = new Checkbox({ renderTo: host });
    expect(f.isValid()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Radio / RadioGroup
// ---------------------------------------------------------------------------

describe('Radio and RadioGroup', () => {
  it('Radio renders into host', () => {
    new Radio({ renderTo: host, name: 'test', inputValue: 'a' });
    expect(host.querySelector('.x-radio')).toBeTruthy();
  });

  it('RadioGroup getValue returns checked radio value', () => {
    const group = new RadioGroup({
      renderTo: host,
      items: [
        new Radio({ name: 'color', inputValue: 'red', checked: true }),
        new Radio({ name: 'color', inputValue: 'blue' }),
      ],
    });
    expect(group.getValue()).toBe('red');
  });

  it('RadioGroup setValue selects correct radio', () => {
    const group = new RadioGroup({
      renderTo: host,
      items: [
        new Radio({ name: 'color', inputValue: 'red' }),
        new Radio({ name: 'color', inputValue: 'blue' }),
      ],
    });
    group.setValue('blue');
    expect(group.getValue()).toBe('blue');
  });

  it('RadioGroup returns empty string when nothing checked', () => {
    const group = new RadioGroup({
      renderTo: host,
      items: [
        new Radio({ name: 'color', inputValue: 'red' }),
        new Radio({ name: 'color', inputValue: 'blue' }),
      ],
    });
    expect(group.getValue()).toBe('');
  });

  it('checked Radio has isChecked() === true', () => {
    const r = new Radio({ renderTo: host, name: 'x', inputValue: 'y', checked: true });
    expect(r.isChecked()).toBe(true);
  });

  it('unchecked Radio has isChecked() === false', () => {
    const r = new Radio({ renderTo: host, name: 'x', inputValue: 'y' });
    expect(r.isChecked()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ComboBox
// ---------------------------------------------------------------------------

describe('ComboBox', () => {
  const COUNTRIES = ['Canada', 'France', 'Germany', 'Japan', 'USA'];

  it('renders into host', () => {
    new ComboBox({ renderTo: host, store: COUNTRIES });
    expect(host.querySelector('.x-field')).toBeTruthy();
  });

  it('renders expand trigger', () => {
    new ComboBox({ renderTo: host, store: COUNTRIES });
    expect(host.querySelector('.x-trigger-expand')).toBeTruthy();
  });

  it('setValue / getValue round-trip', () => {
    const f = new ComboBox({ renderTo: host, store: COUNTRIES });
    f.setValue('Japan');
    expect(f.getValue()).toBe('Japan');
  });

  it('has x-combobox class', () => {
    const f = new ComboBox({ renderTo: host, store: COUNTRIES });
    expect(f.el!.classList.contains('x-combobox')).toBe(true);
  });

  it('accepts array store', () => {
    expect(() => new ComboBox({ renderTo: host, store: COUNTRIES })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// DisplayField
// ---------------------------------------------------------------------------

describe('DisplayField', () => {
  it('renders into host', () => {
    new DisplayField({ renderTo: host });
    expect(host.querySelector('.x-field')).toBeTruthy();
  });

  it('shows initial value', () => {
    new DisplayField({ renderTo: host, value: 'Hello World' });
    expect(host.textContent).toContain('Hello World');
  });

  it('setValue updates display', () => {
    const f = new DisplayField({ renderTo: host });
    f.setValue('Updated');
    expect(host.textContent).toContain('Updated');
  });

  it('getValue returns current value', () => {
    const f = new DisplayField({ renderTo: host, value: 'test' });
    expect(f.getValue()).toBe('test');
  });

  it('getSubmitValue returns non-null', () => {
    const f = new DisplayField({ renderTo: host, value: 'test' });
    expect(f.getSubmitValue()).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// HiddenField
// ---------------------------------------------------------------------------

describe('HiddenField', () => {
  it('renders without visible UI', () => {
    const f = new HiddenField({ name: 'token', value: 'abc123', renderTo: host });
    expect(f).toBeTruthy();
  });

  it('getValue returns initial value', () => {
    const f = new HiddenField({ name: 'token', value: 'abc123', renderTo: host });
    expect(f.getValue()).toBe('abc123');
  });

  it('setValue updates value', () => {
    const f = new HiddenField({ name: 'token', renderTo: host });
    f.setValue('xyz');
    expect(f.getValue()).toBe('xyz');
  });

  it('getName returns field name', () => {
    const f = new HiddenField({ name: 'csrf', renderTo: host });
    expect(f.getName()).toBe('csrf');
  });

  it('isValid always true', () => {
    const f = new HiddenField({ name: 'x', renderTo: host });
    expect(f.isValid()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// FileField
// ---------------------------------------------------------------------------

describe('FileField', () => {
  it('renders into host', () => {
    new FileField({ renderTo: host });
    expect(host.querySelector('.x-filefield')).toBeTruthy();
  });

  it('renders browse button', () => {
    new FileField({ renderTo: host });
    expect(host.querySelector('.x-filefield-btn')).toBeTruthy();
  });

  it('button text defaults to Browse...', () => {
    new FileField({ renderTo: host });
    expect(host.querySelector('.x-filefield-btn')!.textContent).toContain('Browse');
  });

  it('accepts custom button text', () => {
    new FileField({ renderTo: host, buttonText: 'Upload Resume' });
    expect(host.querySelector('.x-filefield-btn')!.textContent).toContain('Upload Resume');
  });

  it('getValue returns null initially', () => {
    const f = new FileField({ renderTo: host });
    expect(f.getValue()).toBeNull();
  });

  it('has hidden file input', () => {
    new FileField({ renderTo: host });
    const input = host.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).toBeTruthy();
    expect(input!.style.display).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// FormPanel integration
// ---------------------------------------------------------------------------

describe('FormPanel integration', () => {
  function buildForm() {
    const hidden = new HiddenField({ name: 'csrf', value: 'token123' });
    const firstName = new TextField({ name: 'firstName', fieldLabel: 'First Name', value: 'John', allowBlank: false });
    const age = new NumberField({ name: 'age', fieldLabel: 'Age', value: 30 });
    const bio = new TextArea({ name: 'bio', fieldLabel: 'Bio', value: 'Hello' });
    const dob = new DateField({ name: 'dob', fieldLabel: 'Date of Birth' });
    const appt = new TimeField({ name: 'appt', fieldLabel: 'Appointment' });
    const country = new ComboBox({ name: 'country', fieldLabel: 'Country', store: ['USA', 'Canada'], value: 'USA' });
    const newsletter = new Checkbox({ name: 'newsletter', fieldLabel: 'Newsletter', checked: true });
    const status = new DisplayField({ name: 'status', fieldLabel: 'Status', value: 'Active' });

    const form = new FormPanel({
      renderTo: host,
      items: [hidden, firstName, age, bio, dob, appt, country, newsletter, status],
    });

    return { form, hidden, firstName, age, bio, dob, appt, country, newsletter, status };
  }

  it('collects all named fields', () => {
    const { form } = buildForm();
    const fields = form.getFields();
    expect(fields.length).toBeGreaterThanOrEqual(8);
  });

  it('getValues returns firstName', () => {
    const { form } = buildForm();
    const vals = form.getValues() as Record<string, unknown>;
    expect(vals.firstName).toBe('John');
  });

  it('getValues returns hidden field value', () => {
    const { form } = buildForm();
    const vals = form.getValues() as Record<string, unknown>;
    expect(vals.csrf).toBe('token123');
  });

  it('getValues returns age as string from input', () => {
    const { form } = buildForm();
    const vals = form.getValues() as Record<string, unknown>;
    expect(String(vals.age)).toBe('30');
  });

  it('getValues returns checkbox inputValue when checked', () => {
    const { form } = buildForm();
    const vals = form.getValues() as Record<string, unknown>;
    expect(vals.newsletter).toBe('on');
  });

  it('setValues updates field values', () => {
    const { form, firstName } = buildForm();
    form.setValues({ firstName: 'Jane' });
    expect(firstName.getValue()).toBe('Jane');
  });

  it('isValid true when all required fields filled', () => {
    const { form } = buildForm();
    expect(form.isValid()).toBe(true);
  });

  it('isValid false when required field is empty', () => {
    const { form, firstName } = buildForm();
    firstName.setValue('');
    expect(form.isValid()).toBe(false);
  });

  it('reset restores original values', () => {
    const { form, firstName } = buildForm();
    firstName.setValue('Changed');
    form.reset();
    expect(firstName.getValue()).toBe('John');
  });

  it('findField locates field by name', () => {
    const { form } = buildForm();
    const f = form.findField('firstName');
    expect(f).toBeTruthy();
  });

  it('findField returns undefined for missing name', () => {
    const { form } = buildForm();
    expect(form.findField('doesNotExist')).toBeUndefined();
  });

  it('getValues includes DisplayField value', () => {
    const { form } = buildForm();
    const vals = form.getValues() as Record<string, unknown>;
    expect(vals.status).toBeDefined();
  });

  it('clearInvalid removes error states', () => {
    const { form, firstName } = buildForm();
    firstName.setValue('');
    form.isValid();
    form.clearInvalid();
    expect(firstName.el!.classList.contains('x-field-invalid')).toBe(false);
  });

  it('isDirty returns false initially', () => {
    const { form } = buildForm();
    expect(form.isDirty()).toBe(false);
  });

  it('isDirty returns true after change', () => {
    const { form, firstName } = buildForm();
    firstName.setValue('Different');
    expect(form.isDirty()).toBe(true);
  });

  it('markInvalid marks a specific field', () => {
    const { form } = buildForm();
    form.markInvalid([{ field: 'firstName', message: 'Server says no' }]);
    const f = form.findField('firstName')!;
    expect(f.el!.classList.contains('x-field-invalid')).toBe(true);
  });
});
