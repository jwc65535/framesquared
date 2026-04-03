/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Field } from '../src/field/Field.js';
import { TextField } from '../src/field/Text.js';
import { TextArea } from '../src/field/TextArea.js';
import { DisplayField } from '../src/field/Display.js';
import { HiddenField } from '../src/field/Hidden.js';
import { VTypes } from '../src/field/VTypes.js';

class MockRO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = MockRO;
});
afterEach(() => {
  document.body.innerHTML = '';
});

function textField(cfg: Record<string, unknown> = {}): TextField {
  return new TextField({ renderTo: document.body, ...cfg });
}

// ═══════════════════════════════════════════════════════════════════════════
// Field base — DOM structure
// ═══════════════════════════════════════════════════════════════════════════

describe('Field — DOM structure', () => {
  it('renders with x-field class', () => {
    const f = textField({ name: 'first', fieldLabel: 'Name' });
    expect(f.el!.classList.contains('x-field')).toBe(true);
  });

  it('renders label element', () => {
    const f = textField({ fieldLabel: 'Email' });
    const label = f.el!.querySelector('.x-field-label');
    expect(label).not.toBeNull();
    expect(label!.textContent).toContain('Email');
  });

  it('label includes separator', () => {
    const f = textField({ fieldLabel: 'Name', labelSeparator: ':' });
    const label = f.el!.querySelector('.x-field-label');
    expect(label!.textContent).toContain(':');
  });

  it('hideLabel:true hides the label', () => {
    const f = textField({ fieldLabel: 'Hidden', hideLabel: true });
    const label = f.el!.querySelector('.x-field-label') as HTMLElement;
    expect(label?.style.display).toBe('none');
  });

  it('labelAlign:"top" adds x-label-top class', () => {
    const f = textField({ fieldLabel: 'Top', labelAlign: 'top' });
    expect(f.el!.classList.contains('x-label-top')).toBe(true);
  });

  it('labelAlign:"left" (default)', () => {
    const f = textField({ fieldLabel: 'Left' });
    expect(f.el!.classList.contains('x-label-left')).toBe(true);
  });

  it('labelWidth sets label width', () => {
    const f = textField({ fieldLabel: 'Wide', labelWidth: 150 });
    const label = f.el!.querySelector('.x-field-label') as HTMLElement;
    expect(label.style.width).toBe('150px');
  });

  it('no fieldLabel renders without label', () => {
    const f = textField({});
    expect(f.el!.querySelector('.x-field-label')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TextField — basics
// ═══════════════════════════════════════════════════════════════════════════

describe('TextField — basics', () => {
  it('renders a native <input> element', () => {
    const f = textField({ name: 'user' });
    const input = f.el!.querySelector('input');
    expect(input).not.toBeNull();
    expect(input!.name).toBe('user');
  });

  it('inputType sets the type attribute', () => {
    const f = textField({ inputType: 'password' });
    expect(f.getInputEl().type).toBe('password');
  });

  it('emptyText sets placeholder', () => {
    const f = textField({ emptyText: 'Enter name...' });
    expect(f.getInputEl().placeholder).toBe('Enter name...');
  });

  it('readOnly sets readonly attribute', () => {
    const f = textField({ readOnly: true });
    expect(f.getInputEl().readOnly).toBe(true);
  });

  it('disabled sets disabled attribute', () => {
    const f = textField({ disabled: true });
    expect(f.getInputEl().disabled).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TextField — getValue / setValue
// ═══════════════════════════════════════════════════════════════════════════

describe('TextField — value', () => {
  it('getValue returns current value', () => {
    const f = textField({ value: 'hello' });
    expect(f.getValue()).toBe('hello');
  });

  it('setValue updates the input', () => {
    const f = textField();
    f.setValue('world');
    expect(f.getInputEl().value).toBe('world');
    expect(f.getValue()).toBe('world');
  });

  it('getRawValue returns the input value string', () => {
    const f = textField({ value: 'raw' });
    expect(f.getRawValue()).toBe('raw');
  });

  it('setRawValue sets input value directly', () => {
    const f = textField();
    f.setRawValue('direct');
    expect(f.getInputEl().value).toBe('direct');
  });

  it('initial value config sets input value', () => {
    const f = textField({ value: 'initial' });
    expect(f.getInputEl().value).toBe('initial');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Dirty tracking
// ═══════════════════════════════════════════════════════════════════════════

describe('Dirty tracking', () => {
  it('isDirty returns false initially', () => {
    const f = textField({ value: 'original' });
    expect(f.isDirty()).toBe(false);
  });

  it('isDirty returns true after value change', () => {
    const f = textField({ value: 'original' });
    f.setValue('changed');
    expect(f.isDirty()).toBe(true);
  });

  it('reset reverts to original value', () => {
    const f = textField({ value: 'original' });
    f.setValue('changed');
    f.reset();
    expect(f.getValue()).toBe('original');
    expect(f.isDirty()).toBe(false);
  });

  it('fires dirtychange event', () => {
    const spy = vi.fn();
    const f = textField({ value: 'a', listeners: { dirtychange: spy } });
    f.setValue('b');
    expect(spy).toHaveBeenCalledWith(f, true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════════════════

describe('Validation', () => {
  it('allowBlank:false — empty value is invalid', () => {
    const f = textField({ allowBlank: false });
    expect(f.isValid()).toBe(false);
    expect(f.getErrors().length).toBeGreaterThan(0);
  });

  it('allowBlank:true — empty value is valid', () => {
    const f = textField({ allowBlank: true });
    expect(f.isValid()).toBe(true);
  });

  it('minLength validation', () => {
    const f = textField({ minLength: 3, value: 'ab' });
    expect(f.isValid()).toBe(false);
    f.setValue('abc');
    expect(f.isValid()).toBe(true);
  });

  it('maxLength validation', () => {
    const f = textField({ maxLength: 5, value: '123456' });
    expect(f.isValid()).toBe(false);
    f.setValue('12345');
    expect(f.isValid()).toBe(true);
  });

  it('regex validation', () => {
    const f = textField({ regex: /^\d+$/, regexText: 'Numbers only', value: 'abc' });
    expect(f.isValid()).toBe(false);
    expect(f.getErrors()).toContain('Numbers only');
    f.setValue('123');
    expect(f.isValid()).toBe(true);
  });

  it('vtype:"email" validation', () => {
    const f = textField({ vtype: 'email', value: 'bad' });
    expect(f.isValid()).toBe(false);
    f.setValue('good@test.com');
    expect(f.isValid()).toBe(true);
  });

  it('vtype:"url" validation', () => {
    const f = textField({ vtype: 'url', value: 'not-a-url' });
    expect(f.isValid()).toBe(false);
    f.setValue('https://example.com');
    expect(f.isValid()).toBe(true);
  });

  it('vtype:"alpha" validation', () => {
    const f = textField({ vtype: 'alpha', value: 'abc123' });
    expect(f.isValid()).toBe(false);
    f.setValue('abcDEF');
    expect(f.isValid()).toBe(true);
  });

  it('vtype:"alphanum" validation', () => {
    const f = textField({ vtype: 'alphanum', value: 'abc-def' });
    expect(f.isValid()).toBe(false);
    f.setValue('abc123');
    expect(f.isValid()).toBe(true);
  });

  it('validate() returns boolean and shows errors', () => {
    const f = textField({ allowBlank: false });
    expect(f.validate()).toBe(false);
    expect(f.el!.classList.contains('x-field-invalid')).toBe(true);
  });

  it('markInvalid shows error', () => {
    const f = textField();
    f.markInvalid('Custom error');
    expect(f.el!.classList.contains('x-field-invalid')).toBe(true);
    const errEl = f.el!.querySelector('.x-field-error');
    expect(errEl?.textContent).toContain('Custom error');
  });

  it('markInvalid with array', () => {
    const f = textField();
    f.markInvalid(['Error 1', 'Error 2']);
    const errEl = f.el!.querySelector('.x-field-error');
    expect(errEl?.textContent).toContain('Error 1');
  });

  it('clearInvalid removes error', () => {
    const f = textField();
    f.markInvalid('Error');
    f.clearInvalid();
    expect(f.el!.classList.contains('x-field-invalid')).toBe(false);
  });

  it('fires validitychange event', () => {
    const spy = vi.fn();
    const f = textField({ allowBlank: false, listeners: { validitychange: spy } });
    f.setValue('valid');
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Events
// ═══════════════════════════════════════════════════════════════════════════

describe('Events', () => {
  it('change event fires on setValue', () => {
    const spy = vi.fn();
    const f = textField({ listeners: { change: spy } });
    f.setValue('new');
    expect(spy).toHaveBeenCalledWith(f, 'new', '');
  });

  it('focus event fires on input focus', () => {
    const spy = vi.fn();
    const f = textField({ listeners: { focus: spy } });
    f.getInputEl().dispatchEvent(new Event('focus', { bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });

  it('blur event fires on input blur', () => {
    const spy = vi.fn();
    const f = textField({ listeners: { blur: spy } });
    f.getInputEl().dispatchEvent(new Event('blur', { bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });

  it('validateOnBlur triggers validation on blur', () => {
    const f = textField({ allowBlank: false, validateOnBlur: true });
    f.getInputEl().dispatchEvent(new Event('blur', { bubbles: true }));
    expect(f.el!.classList.contains('x-field-invalid')).toBe(true);
  });

  it('specialkey event fires for Enter', () => {
    const spy = vi.fn();
    const f = textField({ listeners: { specialkey: spy } });
    f.getInputEl().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });

  it('specialkey event fires for Escape', () => {
    const spy = vi.fn();
    const f = textField({ listeners: { specialkey: spy } });
    f.getInputEl().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });

  it('specialkey event fires for Tab', () => {
    const spy = vi.fn();
    const f = textField({ listeners: { specialkey: spy } });
    f.getInputEl().dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// maskRe
// ═══════════════════════════════════════════════════════════════════════════

describe('maskRe', () => {
  it('prevents typing blocked characters', () => {
    const f = textField({ maskRe: /[0-9]/ });
    const input = f.getInputEl();
    const ev = new KeyboardEvent('keypress', { key: 'a', bubbles: true, cancelable: true });
    const prevented = !input.dispatchEvent(ev);
    expect(prevented).toBe(true);
  });

  it('allows matching characters', () => {
    const f = textField({ maskRe: /[0-9]/ });
    const input = f.getInputEl();
    const ev = new KeyboardEvent('keypress', { key: '5', bubbles: true, cancelable: true });
    const prevented = !input.dispatchEvent(ev);
    expect(prevented).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Triggers
// ═══════════════════════════════════════════════════════════════════════════

describe('Triggers', () => {
  it('trigger renders in the field', () => {
    const f = textField({
      triggers: [{ type: 'clear', handler: vi.fn() }],
    });
    const trigger = f.el!.querySelector('.x-field-trigger');
    expect(trigger).not.toBeNull();
    expect(trigger!.classList.contains('x-trigger-clear')).toBe(true);
  });

  it('trigger click fires handler', () => {
    const handler = vi.fn();
    const f = textField({
      triggers: [{ type: 'search', handler }],
    });
    const trigger = f.el!.querySelector('.x-field-trigger') as HTMLElement;
    trigger.click();
    expect(handler).toHaveBeenCalled();
  });

  it('multiple triggers render', () => {
    const f = textField({
      triggers: [
        { type: 'clear', handler: vi.fn() },
        { type: 'search', handler: vi.fn() },
      ],
    });
    const triggers = f.el!.querySelectorAll('.x-field-trigger');
    expect(triggers.length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TextArea
// ═══════════════════════════════════════════════════════════════════════════

describe('TextArea', () => {
  function textArea(cfg: Record<string, unknown> = {}): TextArea {
    return new TextArea({ renderTo: document.body, ...cfg });
  }

  it('renders a <textarea> element', () => {
    const f = textArea({ name: 'notes' });
    const ta = f.el!.querySelector('textarea');
    expect(ta).not.toBeNull();
  });

  it('rows/cols config', () => {
    const f = textArea({ rows: 10, cols: 40 });
    const ta = f.el!.querySelector('textarea') as HTMLTextAreaElement;
    expect(ta.rows).toBe(10);
    expect(ta.cols).toBe(40);
  });

  it('getValue/setValue work', () => {
    const f = textArea({ value: 'hello' });
    expect(f.getValue()).toBe('hello');
    f.setValue('world');
    expect(f.getValue()).toBe('world');
  });

  it('grows when grow:true (sets min/max height)', () => {
    const f = textArea({ grow: true, growMin: 50, growMax: 200 });
    const ta = f.el!.querySelector('textarea') as HTMLTextAreaElement;
    expect(ta.style.minHeight).toBe('50px');
    expect(ta.style.maxHeight).toBe('200px');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DisplayField
// ═══════════════════════════════════════════════════════════════════════════

describe('DisplayField', () => {
  function displayField(cfg: Record<string, unknown> = {}): DisplayField {
    return new DisplayField({ renderTo: document.body, ...cfg });
  }

  it('renders value as text, no input', () => {
    const f = displayField({ value: 'Read Only', fieldLabel: 'Status' });
    expect(f.el!.querySelector('input')).toBeNull();
    expect(f.el!.querySelector('.x-display-field-value')?.textContent).toBe('Read Only');
  });

  it('setValue updates the displayed text', () => {
    const f = displayField({ value: 'Old' });
    f.setValue('New');
    expect(f.el!.querySelector('.x-display-field-value')?.textContent).toBe('New');
  });

  it('renderer transforms the value', () => {
    const f = displayField({ value: 42, renderer: (v: unknown) => `$${v}` });
    expect(f.el!.querySelector('.x-display-field-value')?.textContent).toBe('$42');
  });

  it('submitValue:false by default', () => {
    const f = displayField({ value: 'X' });
    expect(f.getSubmitValue()).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HiddenField
// ═══════════════════════════════════════════════════════════════════════════

describe('HiddenField', () => {
  function hiddenField(cfg: Record<string, unknown> = {}): HiddenField {
    return new HiddenField({ renderTo: document.body, ...cfg });
  }

  it('renders as <input type="hidden">', () => {
    const f = hiddenField({ name: 'token', value: 'abc123' });
    const input = f.el!.querySelector('input');
    expect(input).not.toBeNull();
    expect(input!.type).toBe('hidden');
    expect(input!.value).toBe('abc123');
  });

  it('getValue/setValue work', () => {
    const f = hiddenField({ name: 'id', value: '1' });
    expect(f.getValue()).toBe('1');
    f.setValue('2');
    expect(f.getValue()).toBe('2');
  });

  it('no label rendered', () => {
    const f = hiddenField({ name: 'x' });
    expect(f.el!.querySelector('.x-field-label')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// VTypes
// ═══════════════════════════════════════════════════════════════════════════

describe('VTypes', () => {
  it('email validates correctly', () => {
    expect(VTypes.email.test('user@test.com')).toBe(true);
    expect(VTypes.email.test('bad')).toBe(false);
  });

  it('url validates correctly', () => {
    expect(VTypes.url.test('https://example.com')).toBe(true);
    expect(VTypes.url.test('not-url')).toBe(false);
  });

  it('alpha validates correctly', () => {
    expect(VTypes.alpha.test('abcDEF')).toBe(true);
    expect(VTypes.alpha.test('abc123')).toBe(false);
  });

  it('alphanum validates correctly', () => {
    expect(VTypes.alphanum.test('abc123')).toBe(true);
    expect(VTypes.alphanum.test('abc-123')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// getSubmitValue
// ═══════════════════════════════════════════════════════════════════════════

describe('getSubmitValue', () => {
  it('returns value string for text field', () => {
    const f = textField({ name: 'x', value: 'hello' });
    expect(f.getSubmitValue()).toBe('hello');
  });

  it('submitValue:false returns empty string', () => {
    const f = textField({ name: 'x', value: 'hello', submitValue: false });
    expect(f.getSubmitValue()).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Additional coverage
// ═══════════════════════════════════════════════════════════════════════════

describe('Additional field coverage', () => {
  it('getName returns the name config', () => {
    const f = textField({ name: 'email' });
    expect(f.getName()).toBe('email');
  });

  it('validate returns true for valid field', () => {
    const f = textField({ allowBlank: true, value: 'ok' });
    expect(f.validate()).toBe(true);
  });

  it('validate returns false and marks invalid', () => {
    const f = textField({ allowBlank: false });
    expect(f.validate()).toBe(false);
    expect(f.el!.classList.contains('x-field-invalid')).toBe(true);
  });

  it('setRawValue on text field', () => {
    const f = textField();
    f.setRawValue('raw-value');
    expect(f.getInputEl().value).toBe('raw-value');
  });

  it('getRawValue returns input value', () => {
    const f = textField({ value: 'test' });
    expect(f.getRawValue()).toBe('test');
  });

  it('Field base getRawValue', () => {
    const f = new Field({ renderTo: document.body, value: 'base' });
    expect(f.getRawValue()).toBe('base');
  });

  it('Field base setRawValue', () => {
    const f = new Field({ renderTo: document.body });
    f.setRawValue('raw');
    expect(f.getValue()).toBe('raw');
  });

  it('Field base getSubmitValue', () => {
    const f = new Field({ renderTo: document.body, value: 'val' });
    expect(f.getSubmitValue()).toBe('val');
  });

  it('Field base getSubmitValue with submitValue:false', () => {
    const f = new Field({ renderTo: document.body, value: 'val', submitValue: false });
    expect(f.getSubmitValue()).toBe('');
  });

  it('HiddenField getSubmitValue', () => {
    const f = new HiddenField({ renderTo: document.body, name: 'tok', value: 'abc' });
    expect(f.getSubmitValue()).toBe('abc');
  });

  it('stripCharsRe strips on blur', () => {
    const f = textField({ stripCharsRe: /[^0-9]/g, value: 'abc123' });
    f.getInputEl().dispatchEvent(new Event('blur', { bubbles: true }));
    expect(f.getValue()).toBe('123');
  });

  it('validateOnChange triggers validation', () => {
    const f = textField({ allowBlank: false, validateOnChange: true });
    f.getInputEl().value = 'valid';
    f.getInputEl().dispatchEvent(new Event('input', { bubbles: true }));
    // Should clear invalid state since value is now valid
    expect(f.isValid()).toBe(true);
  });

  it('DisplayField with no renderer', () => {
    const f = new DisplayField({ renderTo: document.body, value: 'plain' });
    expect(f.el!.querySelector('.x-display-field-value')?.textContent).toBe('plain');
  });

  it('TextArea getRawValue', () => {
    const f = new TextArea({ renderTo: document.body, value: 'ta' });
    expect(f.getRawValue()).toBe('ta');
  });
});
