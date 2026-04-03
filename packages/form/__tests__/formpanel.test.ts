import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TextField } from '../src/field/Text.js';
import { Checkbox } from '../src/field/Checkbox.js';
import { Field } from '../src/field/Field.js';
import { FormPanel } from '../src/FormPanel.js';
import { BasicForm } from '../src/form/BasicForm.js';
import { FieldContainer } from '../src/field/FieldContainer.js';
import * as V from '../src/form/Validators.js';

class MockRO {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeEach(() => {
  (globalThis as any).ResizeObserver = MockRO;
  // Mock fetch
  (globalThis as any).fetch = vi.fn();
});
afterEach(() => {
  document.body.innerHTML = '';
});

function tf(cfg: Record<string, unknown> = {}): TextField {
  return new TextField(cfg);
}

// ═══════════════════════════════════════════════════════════════════════════
// Validators
// ═══════════════════════════════════════════════════════════════════════════

describe('Validators', () => {
  it('presence: empty fails', () => {
    const result = V.presence('');
    expect(result).not.toBe(true);
  });

  it('presence: non-empty passes', () => {
    expect(V.presence('hello')).toBe(true);
  });

  it('length: min/max', () => {
    expect(V.length('ab', { min: 3 })).not.toBe(true);
    expect(V.length('abc', { min: 3 })).toBe(true);
    expect(V.length('abcdef', { max: 5 })).not.toBe(true);
    expect(V.length('abcde', { max: 5 })).toBe(true);
  });

  it('email: valid/invalid', () => {
    expect(V.email('a@b.com')).toBe(true);
    expect(V.email('bad')).not.toBe(true);
  });

  it('url: valid/invalid', () => {
    expect(V.url('https://x.com')).toBe(true);
    expect(V.url('nope')).not.toBe(true);
  });

  it('alpha: letters only', () => {
    expect(V.alpha('abc')).toBe(true);
    expect(V.alpha('a1')).not.toBe(true);
  });

  it('alphanum: letters and numbers', () => {
    expect(V.alphanum('abc123')).toBe(true);
    expect(V.alphanum('a-b')).not.toBe(true);
  });

  it('range: numeric min/max', () => {
    expect(V.range(5, { min: 1, max: 10 })).toBe(true);
    expect(V.range(0, { min: 1, max: 10 })).not.toBe(true);
    expect(V.range(11, { min: 1, max: 10 })).not.toBe(true);
  });

  it('format: custom regex', () => {
    expect(V.format('123', { matcher: /^\d+$/ })).toBe(true);
    expect(V.format('abc', { matcher: /^\d+$/ })).not.toBe(true);
  });

  it('inclusion: value in list', () => {
    expect(V.inclusion('a', { list: ['a', 'b', 'c'] })).toBe(true);
    expect(V.inclusion('d', { list: ['a', 'b', 'c'] })).not.toBe(true);
  });

  it('exclusion: value not in list', () => {
    expect(V.exclusion('d', { list: ['a', 'b', 'c'] })).toBe(true);
    expect(V.exclusion('a', { list: ['a', 'b', 'c'] })).not.toBe(true);
  });

  it('custom function validator', () => {
    const custom = (val: unknown) => (val === 'magic' ? true : 'Not magic');
    expect(V.custom('magic', { fn: custom })).toBe(true);
    expect(V.custom('other', { fn: custom })).toBe('Not magic');
  });

  it('chain: multiple validators', () => {
    const chain = [
      { type: 'presence' as const },
      { type: 'length' as const, min: 3, max: 50 },
      { type: 'alpha' as const },
    ];
    expect(V.validateChain('abc', chain)).toEqual([]);
    expect(V.validateChain('', chain).length).toBeGreaterThan(0);
    expect(V.validateChain('ab', chain).length).toBeGreaterThan(0);
    expect(V.validateChain('a1c', chain).length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BasicForm
// ═══════════════════════════════════════════════════════════════════════════

describe('BasicForm', () => {
  it('addField / getFields', () => {
    const bf = new BasicForm();
    const f = tf({ name: 'x', renderTo: document.body });
    bf.addField(f);
    expect(bf.getFields().length).toBe(1);
  });

  it('findField by name', () => {
    const bf = new BasicForm();
    const f = tf({ name: 'email', renderTo: document.body });
    bf.addField(f);
    expect(bf.findField('email')).toBe(f);
  });

  it('getValues collects all field values', () => {
    const bf = new BasicForm();
    bf.addField(tf({ name: 'a', value: '1', renderTo: document.body }));
    bf.addField(tf({ name: 'b', value: '2', renderTo: document.body }));
    const vals = bf.getValues();
    expect(vals).toEqual({ a: '1', b: '2' });
  });

  it('getValues dirtyOnly', () => {
    const bf = new BasicForm();
    const f1 = tf({ name: 'a', value: 'original', renderTo: document.body });
    const f2 = tf({ name: 'b', value: 'original', renderTo: document.body });
    bf.addField(f1);
    bf.addField(f2);
    f1.setValue('changed');
    const vals = bf.getValues(false, true);
    expect(vals).toEqual({ a: 'changed' });
  });

  it('setValues distributes to fields', () => {
    const bf = new BasicForm();
    const f1 = tf({ name: 'x', renderTo: document.body });
    const f2 = tf({ name: 'y', renderTo: document.body });
    bf.addField(f1);
    bf.addField(f2);
    bf.setValues({ x: 'hello', y: 'world' });
    expect(f1.getValue()).toBe('hello');
    expect(f2.getValue()).toBe('world');
  });

  it('isValid returns true when all fields valid', () => {
    const bf = new BasicForm();
    bf.addField(tf({ name: 'a', value: 'ok', allowBlank: false, renderTo: document.body }));
    expect(bf.isValid()).toBe(true);
  });

  it('isValid returns false when any field invalid', () => {
    const bf = new BasicForm();
    bf.addField(tf({ name: 'a', value: '', allowBlank: false, renderTo: document.body }));
    expect(bf.isValid()).toBe(false);
  });

  it('isDirty checks all fields', () => {
    const bf = new BasicForm();
    const f = tf({ name: 'a', value: 'orig', renderTo: document.body });
    bf.addField(f);
    expect(bf.isDirty()).toBe(false);
    f.setValue('changed');
    expect(bf.isDirty()).toBe(true);
  });

  it('reset resets all fields', () => {
    const bf = new BasicForm();
    const f = tf({ name: 'a', value: 'orig', renderTo: document.body });
    bf.addField(f);
    f.setValue('changed');
    bf.reset();
    expect(f.getValue()).toBe('orig');
  });

  it('clearInvalid clears all fields', () => {
    const bf = new BasicForm();
    const f = tf({ name: 'a', renderTo: document.body });
    bf.addField(f);
    f.markInvalid('Error');
    bf.clearInvalid();
    expect(f.el!.classList.contains('x-field-invalid')).toBe(false);
  });

  it('markInvalid targets specific fields', () => {
    const bf = new BasicForm();
    const f = tf({ name: 'email', renderTo: document.body });
    bf.addField(f);
    bf.markInvalid([{ field: 'email', message: 'Invalid email' }]);
    expect(f.el!.classList.contains('x-field-invalid')).toBe(true);
  });

  it('removeField removes a field', () => {
    const bf = new BasicForm();
    const f = tf({ name: 'a', renderTo: document.body });
    bf.addField(f);
    bf.removeField(f);
    expect(bf.getFields().length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FormPanel
// ═══════════════════════════════════════════════════════════════════════════

describe('FormPanel', () => {
  function formPanel(cfg: Record<string, unknown> = {}): FormPanel {
    return new FormPanel({
      renderTo: document.body,
      title: 'Form',
      items: [
        tf({ name: 'first', fieldLabel: 'First', value: 'John' }),
        tf({ name: 'last', fieldLabel: 'Last', value: 'Doe' }),
      ],
      ...cfg,
    });
  }

  it('renders with x-form class', () => {
    const fp = formPanel();
    expect(fp.el!.classList.contains('x-form')).toBe(true);
  });

  it('getValues collects from child fields', () => {
    const fp = formPanel();
    const vals = fp.getValues();
    expect(vals).toEqual({ first: 'John', last: 'Doe' });
  });

  it('setValues distributes to child fields', () => {
    const fp = formPanel();
    fp.setValues({ first: 'Jane', last: 'Smith' });
    expect(fp.getValues()).toEqual({ first: 'Jane', last: 'Smith' });
  });

  it('isValid checks all child fields', () => {
    const fp = new FormPanel({
      renderTo: document.body,
      items: [tf({ name: 'req', allowBlank: false })],
    });
    expect(fp.isValid()).toBe(false);
  });

  it('isDirty checks child fields', () => {
    const fp = formPanel();
    expect(fp.isDirty()).toBe(false);
    fp.findField('first')?.setValue('Changed');
    expect(fp.isDirty()).toBe(true);
  });

  it('reset clears all fields', () => {
    const fp = formPanel();
    fp.findField('first')?.setValue('Changed');
    fp.reset();
    expect(fp.getValues()).toEqual({ first: 'John', last: 'Doe' });
  });

  it('findField returns field by name', () => {
    const fp = formPanel();
    const f = fp.findField('last');
    expect(f).toBeDefined();
    expect(f!.getValue()).toBe('Doe');
  });

  it('getFields returns all Field instances', () => {
    const fp = formPanel();
    expect(fp.getFields().length).toBe(2);
  });

  it('clearInvalid clears all field errors', () => {
    const fp = formPanel();
    fp.findField('first')?.markInvalid('Error');
    fp.clearInvalid();
    expect(fp.findField('first')?.el!.classList.contains('x-field-invalid')).toBe(false);
  });

  it('markInvalid targets specific fields by name', () => {
    const fp = formPanel();
    fp.markInvalid([{ field: 'last', message: 'Required' }]);
    expect(fp.findField('last')?.el!.classList.contains('x-field-invalid')).toBe(true);
  });

  it('fieldDefaults applies to children', () => {
    const fp = new FormPanel({
      renderTo: document.body,
      fieldDefaults: { labelWidth: 120 },
      items: [tf({ name: 'x', fieldLabel: 'X' })],
    });
    const label = fp.findField('x')?.el!.querySelector('.x-field-label') as HTMLElement;
    expect(label?.style.width).toBe('120px');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FormPanel — submit
// ═══════════════════════════════════════════════════════════════════════════

describe('FormPanel — submit', () => {
  it('submit sends field values via fetch', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const fp = new FormPanel({
      renderTo: document.body,
      url: '/api/save',
      items: [tf({ name: 'name', value: 'Alice' })],
    });

    const result = await fp.submit();
    expect(fetch).toHaveBeenCalled();
    const [url, opts] = (fetch as any).mock.calls[0];
    expect(url).toBe('/api/save');
    expect(opts.method).toBe('POST');
    expect(result.success).toBe(true);
  });

  it('submit with clientValidation:false skips validation', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const fp = new FormPanel({
      renderTo: document.body,
      url: '/api/save',
      items: [tf({ name: 'req', allowBlank: false })],
    });

    await fp.submit({ clientValidation: false });
    expect(fetch).toHaveBeenCalled();
  });

  it('submit with clientValidation:true rejects if invalid', async () => {
    const fp = new FormPanel({
      renderTo: document.body,
      url: '/api/save',
      items: [tf({ name: 'req', allowBlank: false })],
    });

    const result = await fp.submit({ clientValidation: true });
    expect(result.success).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('jsonSubmit sends JSON body', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const fp = new FormPanel({
      renderTo: document.body,
      url: '/api/save',
      jsonSubmit: true,
      items: [tf({ name: 'x', value: 'hello' })],
    });

    await fp.submit();
    const [, opts] = (fetch as any).mock.calls[0];
    expect(opts.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(opts.body)).toEqual({ x: 'hello' });
  });

  it('fires beforeaction and actioncomplete', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const beforeSpy = vi.fn();
    const completeSpy = vi.fn();
    const fp = new FormPanel({
      renderTo: document.body,
      url: '/api/save',
      items: [tf({ name: 'x', value: 'v' })],
      listeners: { beforeaction: beforeSpy, actioncomplete: completeSpy },
    });

    await fp.submit();
    expect(beforeSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('fires actionfailed on fetch error', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ success: false }),
    });

    const failSpy = vi.fn();
    const fp = new FormPanel({
      renderTo: document.body,
      url: '/api/save',
      items: [tf({ name: 'x', value: 'v' })],
      listeners: { actionfailed: failSpy },
    });

    await fp.submit();
    expect(failSpy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FormPanel — load
// ═══════════════════════════════════════════════════════════════════════════

describe('FormPanel — load', () => {
  it('load populates fields from server response', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { first: 'Loaded', last: 'Data' } }),
    });

    const fp = new FormPanel({
      renderTo: document.body,
      url: '/api/load',
      items: [tf({ name: 'first' }), tf({ name: 'last' })],
    });

    await fp.load();
    expect(fp.getValues()).toEqual({ first: 'Loaded', last: 'Data' });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FieldContainer
// ═══════════════════════════════════════════════════════════════════════════

describe('FieldContainer', () => {
  it('renders with x-field-container class', () => {
    const fc = new FieldContainer({
      renderTo: document.body,
      fieldLabel: 'Name',
      items: [tf({ name: 'first' }), tf({ name: 'last' })],
    });
    expect(fc.el!.classList.contains('x-field-container')).toBe(true);
  });

  it('has a label', () => {
    const fc = new FieldContainer({
      renderTo: document.body,
      fieldLabel: 'Address',
      items: [tf({ name: 'street' })],
    });
    expect(fc.el!.querySelector('.x-field-label')?.textContent).toContain('Address');
  });

  it('combineErrors collects child errors', () => {
    const fc = new FieldContainer({
      renderTo: document.body,
      fieldLabel: 'Info',
      combineErrors: true,
      items: [tf({ name: 'a', allowBlank: false }), tf({ name: 'b', allowBlank: false })],
    });
    const errors = fc.getErrors();
    expect(errors.length).toBeGreaterThan(0);
  });

  it('isValid checks child fields', () => {
    const fc = new FieldContainer({
      renderTo: document.body,
      items: [tf({ name: 'a', value: 'ok', allowBlank: false })],
    });
    expect(fc.isValid()).toBe(true);
  });
});
