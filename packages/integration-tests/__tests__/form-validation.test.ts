import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FormPanel, TextField, NumberField, Checkbox } from '@ext-ts/form';

class MockRO { constructor() {} observe() {} unobserve() {} disconnect() {} }
beforeEach(() => { (globalThis as any).ResizeObserver = MockRO; });
afterEach(() => { document.body.innerHTML = ''; });

describe('Form validation integration', () => {
  it('FormPanel with multiple field types', () => {
    const form = new FormPanel({
      renderTo: document.body,
      title: 'User Form',
      items: [
        new TextField({ name: 'name', fieldLabel: 'Name', allowBlank: false }),
        new TextField({ name: 'email', fieldLabel: 'Email' }),
        new NumberField({ name: 'age', fieldLabel: 'Age', minValue: 0, maxValue: 150 }),
        new Checkbox({ name: 'active', fieldLabel: 'Active' }),
      ],
    });

    expect(form.el).not.toBeNull();
    expect(form.el!.querySelectorAll('.x-field').length).toBe(4);
  });

  it('getValues returns all field values', () => {
    const nameField = new TextField({ name: 'name', fieldLabel: 'Name' });
    const emailField = new TextField({ name: 'email', fieldLabel: 'Email' });

    const form = new FormPanel({
      renderTo: document.body,
      title: 'Form',
      items: [nameField, emailField],
    });

    nameField.setValue('Alice');
    emailField.setValue('alice@example.com');

    const values = form.getValues() as Record<string, unknown>;
    expect(values.name).toBe('Alice');
    expect(values.email).toBe('alice@example.com');
  });

  it('setValues populates all fields', () => {
    const nameField = new TextField({ name: 'name', fieldLabel: 'Name' });
    const ageField = new NumberField({ name: 'age', fieldLabel: 'Age' });

    const form = new FormPanel({
      renderTo: document.body,
      title: 'Form',
      items: [nameField, ageField],
    });

    form.setValues({ name: 'Bob', age: 30 });
    expect(nameField.getValue()).toBe('Bob');
    expect(Number(ageField.getValue())).toBe(30);
  });

  it('isValid checks all fields', () => {
    const nameField = new TextField({ name: 'name', fieldLabel: 'Name', allowBlank: false });
    const emailField = new TextField({ name: 'email', fieldLabel: 'Email' });

    const form = new FormPanel({
      renderTo: document.body,
      title: 'Form',
      items: [nameField, emailField],
    });

    // Name is required but empty
    expect(form.isValid()).toBe(false);

    nameField.setValue('Alice');
    expect(form.isValid()).toBe(true);
  });

  it('NumberField validates min/max', () => {
    const ageField = new NumberField({
      name: 'age', fieldLabel: 'Age',
      minValue: 18, maxValue: 99,
      renderTo: document.body,
    });

    ageField.setValue(10);
    expect(ageField.isValid()).toBe(false);

    ageField.setValue(25);
    expect(ageField.isValid()).toBe(true);

    ageField.setValue(200);
    expect(ageField.isValid()).toBe(false);
  });

  it('TextField validates minLength/maxLength', () => {
    const field = new TextField({
      name: 'code', fieldLabel: 'Code',
      minLength: 3, maxLength: 10,
      renderTo: document.body,
    });

    field.setValue('ab');
    expect(field.isValid()).toBe(false);

    field.setValue('abc');
    expect(field.isValid()).toBe(true);

    field.setValue('abcdefghijk');
    expect(field.isValid()).toBe(false);
  });

  it('form with all valid fields reports isValid=true', () => {
    const form = new FormPanel({
      renderTo: document.body,
      title: 'Complete Form',
      items: [
        new TextField({ name: 'name', fieldLabel: 'Name', allowBlank: false }),
        new NumberField({ name: 'salary', fieldLabel: 'Salary', minValue: 0 }),
      ],
    });

    form.setValues({ name: 'Alice', salary: 50000 });
    expect(form.isValid()).toBe(true);
  });

  it('reset restores original values', () => {
    const nameField = new TextField({ name: 'name', fieldLabel: 'Name', value: 'Original' });
    const form = new FormPanel({
      renderTo: document.body,
      title: 'Form',
      items: [nameField],
    });

    nameField.setValue('Changed');
    expect(nameField.getValue()).toBe('Changed');

    nameField.reset();
    expect(nameField.getValue()).toBe('Original');
  });
});
