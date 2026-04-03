import { describe, it, expect } from 'vitest';
import {
  FieldType,
  StringField,
  IntField,
  FloatField,
  BooleanField,
  DateField,
  AutoField,
  createField,
} from '../src/field/Field.js';

// ═══════════════════════════════════════════════════════════════════════════
// FieldType enum
// ═══════════════════════════════════════════════════════════════════════════

describe('FieldType', () => {
  it('has the expected values', () => {
    expect(FieldType.STRING).toBe('string');
    expect(FieldType.INT).toBe('int');
    expect(FieldType.FLOAT).toBe('float');
    expect(FieldType.BOOLEAN).toBe('boolean');
    expect(FieldType.DATE).toBe('date');
    expect(FieldType.AUTO).toBe('auto');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// StringField
// ═══════════════════════════════════════════════════════════════════════════

describe('StringField', () => {
  it('converts number to string', () => {
    const f = new StringField({ name: 'x' });
    expect(f.convert(42)).toBe('42');
  });

  it('converts boolean to string', () => {
    const f = new StringField({ name: 'x' });
    expect(f.convert(true)).toBe('true');
  });

  it('returns string as-is', () => {
    const f = new StringField({ name: 'x' });
    expect(f.convert('hello')).toBe('hello');
  });

  it('returns null when allowNull and value is null', () => {
    const f = new StringField({ name: 'x', allowNull: true });
    expect(f.convert(null)).toBeNull();
  });

  it('converts null to empty string when allowNull=false', () => {
    const f = new StringField({ name: 'x' });
    expect(f.convert(null)).toBe('');
  });

  it('defaultValue is empty string', () => {
    const f = new StringField({ name: 'x' });
    expect(f.defaultValue).toBe('');
  });

  it('serialize returns the value as-is', () => {
    const f = new StringField({ name: 'x' });
    expect(f.serialize('test')).toBe('test');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// IntField
// ═══════════════════════════════════════════════════════════════════════════

describe('IntField', () => {
  it('converts string to integer', () => {
    const f = new IntField({ name: 'x' });
    expect(f.convert('42')).toBe(42);
  });

  it('truncates float to integer', () => {
    const f = new IntField({ name: 'x' });
    expect(f.convert(3.7)).toBe(3);
  });

  it('converts string float to integer', () => {
    const f = new IntField({ name: 'x' });
    expect(f.convert('3.7')).toBe(3);
  });

  it('returns 0 for non-numeric string', () => {
    const f = new IntField({ name: 'x' });
    expect(f.convert('abc')).toBe(0);
  });

  it('returns null when allowNull and value is null', () => {
    const f = new IntField({ name: 'x', allowNull: true });
    expect(f.convert(null)).toBeNull();
  });

  it('defaultValue is 0', () => {
    const f = new IntField({ name: 'x' });
    expect(f.defaultValue).toBe(0);
  });

  it('converts boolean true to 1', () => {
    const f = new IntField({ name: 'x' });
    expect(f.convert(true)).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FloatField
// ═══════════════════════════════════════════════════════════════════════════

describe('FloatField', () => {
  it('converts string to float', () => {
    const f = new FloatField({ name: 'x' });
    expect(f.convert('3.14')).toBeCloseTo(3.14);
  });

  it('keeps float values', () => {
    const f = new FloatField({ name: 'x' });
    expect(f.convert(2.5)).toBe(2.5);
  });

  it('returns 0 for NaN', () => {
    const f = new FloatField({ name: 'x' });
    expect(f.convert('abc')).toBe(0);
  });

  it('defaultValue is 0', () => {
    const f = new FloatField({ name: 'x' });
    expect(f.defaultValue).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BooleanField
// ═══════════════════════════════════════════════════════════════════════════

describe('BooleanField', () => {
  it('converts truthy values to true', () => {
    const f = new BooleanField({ name: 'x' });
    expect(f.convert(1)).toBe(true);
    expect(f.convert('yes')).toBe(true);
    expect(f.convert('true')).toBe(true);
    expect(f.convert('1')).toBe(true);
  });

  it('converts falsy values to false', () => {
    const f = new BooleanField({ name: 'x' });
    expect(f.convert(0)).toBe(false);
    expect(f.convert('')).toBe(false);
    expect(f.convert('false')).toBe(false);
    expect(f.convert('0')).toBe(false);
    expect(f.convert(null)).toBe(false);
  });

  it('defaultValue is false', () => {
    const f = new BooleanField({ name: 'x' });
    expect(f.defaultValue).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DateField
// ═══════════════════════════════════════════════════════════════════════════

describe('DateField', () => {
  it('converts ISO string to Date', () => {
    const f = new DateField({ name: 'x' });
    const d = f.convert('2024-01-15') as Date;
    expect(d).toBeInstanceOf(Date);
    expect(d.getFullYear()).toBe(2024);
  });

  it('converts timestamp number to Date', () => {
    const f = new DateField({ name: 'x' });
    const ts = new Date('2024-06-01').getTime();
    const d = f.convert(ts) as Date;
    expect(d).toBeInstanceOf(Date);
    expect(d.getTime()).toBe(ts);
  });

  it('keeps Date instances', () => {
    const f = new DateField({ name: 'x' });
    const orig = new Date('2024-01-01');
    expect(f.convert(orig)).toBeInstanceOf(Date);
  });

  it('returns null for null when allowNull', () => {
    const f = new DateField({ name: 'x', allowNull: true });
    expect(f.convert(null)).toBeNull();
  });

  it('serializes Date to ISO string', () => {
    const f = new DateField({ name: 'x' });
    const d = new Date('2024-01-15T00:00:00.000Z');
    expect(f.serialize(d)).toBe('2024-01-15T00:00:00.000Z');
  });

  it('defaultValue is null', () => {
    const f = new DateField({ name: 'x' });
    expect(f.defaultValue).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// AutoField
// ═══════════════════════════════════════════════════════════════════════════

describe('AutoField', () => {
  it('returns value as-is (no coercion)', () => {
    const f = new AutoField({ name: 'x' });
    expect(f.convert(42)).toBe(42);
    expect(f.convert('hello')).toBe('hello');
    expect(f.convert(null)).toBeNull();
    const obj = { a: 1 };
    expect(f.convert(obj)).toBe(obj);
  });

  it('defaultValue is undefined', () => {
    const f = new AutoField({ name: 'x' });
    expect(f.defaultValue).toBeUndefined();
  });

  it('returns default for undefined input', () => {
    const f = new AutoField({ name: 'x' });
    expect(f.convert(undefined)).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Edge cases across types
// ═══════════════════════════════════════════════════════════════════════════

describe('Field edge cases', () => {
  it('custom serialize overrides default', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f = new StringField({ name: 'x', serialize: (v) => `custom:${v}` } as any);
    expect(f.serialize('test')).toBe('custom:test');
  });

  it('DateField coerce returns null for non-date input', () => {
    const f = new DateField({ name: 'x' });
    expect(f.convert({})).toBeNull();
    expect(f.convert(true)).toBeNull();
  });

  it('DateField serialize returns non-Date value as-is', () => {
    const f = new DateField({ name: 'x' });
    expect(f.serialize('already-string')).toBe('already-string');
    expect(f.serialize(null)).toBeNull();
  });

  it('FloatField converts boolean', () => {
    const f = new FloatField({ name: 'x' });
    expect(f.convert(true)).toBe(1);
  });

  it('IntField with allowNull converts null', () => {
    const f = new IntField({ name: 'x', allowNull: true });
    expect(f.convert(null)).toBeNull();
  });

  it('custom defaultValue overrides type default', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f = new IntField({ name: 'x', defaultValue: 99 } as any);
    expect(f.defaultValue).toBe(99);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// createField factory
// ═══════════════════════════════════════════════════════════════════════════

describe('createField', () => {
  it('creates a StringField for type STRING', () => {
    const f = createField({ name: 'x', type: FieldType.STRING });
    expect(f).toBeInstanceOf(StringField);
  });

  it('creates an IntField for type INT', () => {
    const f = createField({ name: 'x', type: FieldType.INT });
    expect(f).toBeInstanceOf(IntField);
  });

  it('creates an AutoField when no type specified', () => {
    const f = createField({ name: 'x' });
    expect(f).toBeInstanceOf(AutoField);
  });

  it('preserves field config (persist, mapping, etc.)', () => {
    const f = createField({ name: 'x', type: FieldType.STRING, persist: false, mapping: 'a.b' });
    expect(f.persist).toBe(false);
    expect(f.mapping).toBe('a.b');
  });

  it('creates from shorthand string name', () => {
    const f = createField('myField');
    expect(f.name).toBe('myField');
    expect(f).toBeInstanceOf(AutoField);
  });
});
