import { describe, it, expect, vi } from 'vitest';
import { Model } from '../src/Model.js';
import { FieldType } from '../src/field/Field.js';
import {
  presence,
  length as lengthValidator,
  formatValidator,
  inclusion,
  exclusion,
  rangeValidator,
  email,
} from '../src/validators.js';

// ═══════════════════════════════════════════════════════════════════════════
// Field definition and inheritance
// ═══════════════════════════════════════════════════════════════════════════

describe('Field definition', () => {
  it('defines fields from static fields array', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING },
        { name: 'age', type: FieldType.INT },
      ];
    }
    const u = User.create({ name: 'Alice', age: 30 });
    expect(u.get('name')).toBe('Alice');
    expect(u.get('age')).toBe(30);
  });

  it('fields apply type coercion', () => {
    class User extends Model {
      static override fields = [
        { name: 'age', type: FieldType.INT },
        { name: 'active', type: FieldType.BOOLEAN },
      ];
    }
    const u = User.create({ age: '25', active: 1 });
    expect(u.get('age')).toBe(25);
    expect(u.get('active')).toBe(true);
  });

  it('fields have default values when not provided', () => {
    class Item extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING },
        { name: 'count', type: FieldType.INT },
        { name: 'active', type: FieldType.BOOLEAN },
      ];
    }
    const item = Item.create({});
    expect(item.get('name')).toBe('');
    expect(item.get('count')).toBe(0);
    expect(item.get('active')).toBe(false);
  });

  it('supports custom defaultValue', () => {
    class Item extends Model {
      static override fields = [
        { name: 'status', type: FieldType.STRING, defaultValue: 'active' },
      ];
    }
    const item = Item.create({});
    expect(item.get('status')).toBe('active');
  });

  it('fields are inherited from parent model', () => {
    class Base extends Model {
      static override fields = [
        { name: 'id', type: FieldType.INT },
      ];
    }
    class Child extends Base {
      static override fields = [
        ...Base.fields,
        { name: 'name', type: FieldType.STRING },
      ];
    }
    const c = Child.create({ id: 1, name: 'Alice' });
    expect(c.get('id')).toBe(1);
    expect(c.get('name')).toBe('Alice');
  });

  it('custom convert function is called', () => {
    class Item extends Model {
      static override fields = [
        {
          name: 'tag',
          type: FieldType.STRING,
          convert: (v: unknown) => String(v).toUpperCase(),
        },
      ];
    }
    const item = Item.create({ tag: 'hello' });
    expect(item.get('tag')).toBe('HELLO');
  });

  it('field mapping extracts from nested source data', () => {
    class Contact extends Model {
      static override fields = [
        { name: 'city', type: FieldType.STRING, mapping: 'address.city' },
        { name: 'name', type: FieldType.STRING },
      ];
    }
    const c = Contact.create({ name: 'Alice', address: { city: 'NYC' } });
    expect(c.get('city')).toBe('NYC');
    expect(c.get('name')).toBe('Alice');
  });

  it('field mapping returns undefined for broken nested path', () => {
    class Contact extends Model {
      static override fields = [
        { name: 'city', type: FieldType.STRING, mapping: 'address.city' },
      ];
    }
    // address is missing entirely
    const c = Contact.create({});
    expect(c.get('city')).toBe('');
  });

  it('field mapping handles null intermediate in path', () => {
    class Contact extends Model {
      static override fields = [
        { name: 'city', type: FieldType.STRING, mapping: 'address.city' },
      ];
    }
    const c = Contact.create({ address: null });
    expect(c.get('city')).toBe('');
  });

  it('custom serialize function is called in getData', () => {
    class Item extends Model {
      static override fields = [
        {
          name: 'tag',
          type: FieldType.STRING,
          serialize: (v: unknown) => `TAG:${v}`,
        },
      ];
    }
    const item = Item.create({ tag: 'hello' });
    expect(item.getData({ serialize: true }).tag).toBe('TAG:hello');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Proxy-based property access
// ═══════════════════════════════════════════════════════════════════════════

describe('Proxy-based property access', () => {
  it('reading a field via property uses get()', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING },
      ];
    }
    const u = User.create({ name: 'Alice' });
    expect((u as any).name).toBe('Alice');
  });

  it('writing a field via property uses set()', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING },
      ];
    }
    const u = User.create({ name: 'Alice' });
    (u as any).name = 'Bob';
    expect(u.get('name')).toBe('Bob');
  });

  it('non-field properties work normally', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING },
      ];
    }
    const u = User.create({ name: 'Alice' });
    expect(u.isDestroyed).toBe(false);
    expect(typeof u.get).toBe('function');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Data access: get / set / getData
// ═══════════════════════════════════════════════════════════════════════════

describe('get / set / getData', () => {
  it('set returns array of modified field names', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING },
        { name: 'age', type: FieldType.INT },
      ];
    }
    const u = User.create({ name: 'Alice', age: 25 });
    const changed = u.set('name', 'Bob');
    expect(changed).toEqual(['name']);
  });

  it('set with object modifies multiple fields', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING },
        { name: 'age', type: FieldType.INT },
      ];
    }
    const u = User.create({ name: 'Alice', age: 25 });
    const changed = u.set({ name: 'Bob', age: 30 });
    expect(changed).toContain('name');
    expect(changed).toContain('age');
  });

  it('set returns empty array when value does not change', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING },
      ];
    }
    const u = User.create({ name: 'Alice' });
    const changed = u.set('name', 'Alice');
    expect(changed).toEqual([]);
  });

  it('getData returns all field values as a plain object', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING },
        { name: 'age', type: FieldType.INT },
      ];
    }
    const u = User.create({ name: 'Alice', age: 25 });
    const data = u.getData();
    expect(data).toEqual({ name: 'Alice', age: 25 });
  });

  it('getData with serialize uses field serializers', () => {
    class Event extends Model {
      static override fields = [
        { name: 'date', type: FieldType.DATE },
        { name: 'title', type: FieldType.STRING },
      ];
    }
    const e = Event.create({ date: '2024-01-15T00:00:00.000Z', title: 'Test' });
    const data = e.getData({ serialize: true });
    expect(typeof data.date).toBe('string');
    expect(data.date).toBe('2024-01-15T00:00:00.000Z');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Dirty tracking
// ═══════════════════════════════════════════════════════════════════════════

describe('Dirty tracking', () => {
  it('is not modified after creation', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING },
      ];
    }
    const u = User.create({ name: 'Alice' });
    expect(u.isModified()).toBe(false);
  });

  it('is modified after set()', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING },
      ];
    }
    const u = User.create({ name: 'Alice' });
    u.set('name', 'Bob');
    expect(u.isModified()).toBe(true);
    expect(u.isModified('name')).toBe(true);
  });

  it('isModified(fieldName) returns false for unmodified field', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING },
        { name: 'age', type: FieldType.INT },
      ];
    }
    const u = User.create({ name: 'Alice', age: 25 });
    u.set('name', 'Bob');
    expect(u.isModified('age')).toBe(false);
  });

  it('getChanges returns only modified fields', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING },
        { name: 'age', type: FieldType.INT },
      ];
    }
    const u = User.create({ name: 'Alice', age: 25 });
    u.set('name', 'Bob');
    expect(u.getChanges()).toEqual({ name: 'Bob' });
  });

  it('modified stores previous values', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING },
      ];
    }
    const u = User.create({ name: 'Alice' });
    u.set('name', 'Bob');
    expect(u.modified).toEqual({ name: 'Alice' });
  });

  it('commit clears dirty state', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING },
      ];
    }
    const u = User.create({ name: 'Alice' });
    u.set('name', 'Bob');
    u.commit();
    expect(u.isModified()).toBe(false);
    expect(u.get('name')).toBe('Bob');
    expect(u.modified).toEqual({});
  });

  it('reject reverts to previous values', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING },
        { name: 'age', type: FieldType.INT },
      ];
    }
    const u = User.create({ name: 'Alice', age: 25 });
    u.set({ name: 'Bob', age: 30 });
    u.reject();
    expect(u.get('name')).toBe('Alice');
    expect(u.get('age')).toBe(25);
    expect(u.isModified()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Identification and phantom
// ═══════════════════════════════════════════════════════════════════════════

describe('Identification', () => {
  it('default idProperty is "id"', () => {
    class User extends Model {
      static override fields = [
        { name: 'id', type: FieldType.INT },
        { name: 'name', type: FieldType.STRING },
      ];
    }
    const u = User.create({ id: 42, name: 'Alice' });
    expect(u.getId()).toBe(42);
  });

  it('custom idProperty', () => {
    class Item extends Model {
      static override idProperty = 'itemId';
      static override fields = [
        { name: 'itemId', type: FieldType.STRING },
      ];
    }
    const item = Item.create({ itemId: 'abc-123' });
    expect(item.getId()).toBe('abc-123');
  });

  it('setId updates the id field', () => {
    class User extends Model {
      static override fields = [
        { name: 'id', type: FieldType.INT },
      ];
    }
    const u = User.create({ id: 1 });
    u.setId(42);
    expect(u.getId()).toBe(42);
  });

  it('phantom is true when no id is set', () => {
    class User extends Model {
      static override fields = [
        { name: 'id', type: FieldType.INT },
        { name: 'name', type: FieldType.STRING },
      ];
    }
    const u = User.create({ name: 'Alice' });
    expect(u.phantom).toBe(true);
  });

  it('phantom is false when id is set', () => {
    class User extends Model {
      static override fields = [
        { name: 'id', type: FieldType.INT },
      ];
    }
    const u = User.create({ id: 1 });
    expect(u.phantom).toBe(false);
  });

  it('phantom becomes false after setId', () => {
    class User extends Model {
      static override fields = [
        { name: 'id', type: FieldType.INT },
      ];
    }
    const u = User.create({});
    expect(u.phantom).toBe(true);
    u.setId(1);
    expect(u.phantom).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════════════════

describe('Validation', () => {
  it('validate returns valid result when all validators pass', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING, validators: [presence()] },
      ];
    }
    const u = User.create({ name: 'Alice' });
    const result = u.validate();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('presence validator fails for empty string', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING, validators: [presence()] },
      ];
    }
    const u = User.create({ name: '' });
    const result = u.validate();
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].field).toBe('name');
  });

  it('length validator checks min/max', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING, validators: [lengthValidator({ min: 2, max: 10 })] },
      ];
    }
    expect(User.create({ name: 'A' }).validate().valid).toBe(false);
    expect(User.create({ name: 'Alice' }).validate().valid).toBe(true);
    expect(User.create({ name: 'A very long name' }).validate().valid).toBe(false);
  });

  it('format validator checks regex', () => {
    class Code extends Model {
      static override fields = [
        { name: 'code', type: FieldType.STRING, validators: [formatValidator(/^[A-Z]{3}$/)] },
      ];
    }
    expect(Code.create({ code: 'ABC' }).validate().valid).toBe(true);
    expect(Code.create({ code: 'ab' }).validate().valid).toBe(false);
  });

  it('inclusion validator checks allowed values', () => {
    class Status extends Model {
      static override fields = [
        { name: 'status', type: FieldType.STRING, validators: [inclusion(['active', 'inactive'])] },
      ];
    }
    expect(Status.create({ status: 'active' }).validate().valid).toBe(true);
    expect(Status.create({ status: 'deleted' }).validate().valid).toBe(false);
  });

  it('exclusion validator rejects disallowed values', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING, validators: [exclusion(['admin', 'root'])] },
      ];
    }
    expect(User.create({ name: 'alice' }).validate().valid).toBe(true);
    expect(User.create({ name: 'admin' }).validate().valid).toBe(false);
  });

  it('range validator checks numeric range', () => {
    class Score extends Model {
      static override fields = [
        { name: 'value', type: FieldType.INT, validators: [rangeValidator({ min: 0, max: 100 })] },
      ];
    }
    expect(Score.create({ value: 50 }).validate().valid).toBe(true);
    expect(Score.create({ value: -1 }).validate().valid).toBe(false);
    expect(Score.create({ value: 101 }).validate().valid).toBe(false);
  });

  it('email validator', () => {
    class Contact extends Model {
      static override fields = [
        { name: 'email', type: FieldType.STRING, validators: [email()] },
      ];
    }
    expect(Contact.create({ email: 'a@b.com' }).validate().valid).toBe(true);
    expect(Contact.create({ email: 'not-email' }).validate().valid).toBe(false);
  });

  it('custom function validator', () => {
    const even = (value: unknown) =>
      typeof value === 'number' && value % 2 === 0
        ? null
        : 'Must be even';
    class Num extends Model {
      static override fields = [
        { name: 'n', type: FieldType.INT, validators: [even] },
      ];
    }
    expect(Num.create({ n: 4 }).validate().valid).toBe(true);
    const r = Num.create({ n: 3 }).validate();
    expect(r.valid).toBe(false);
    expect(r.errors[0].message).toBe('Must be even');
  });

  it('isValid is a shorthand for validate().valid', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING, validators: [presence()] },
      ];
    }
    expect(User.create({ name: 'Alice' }).isValid()).toBe(true);
    expect(User.create({ name: '' }).isValid()).toBe(false);
  });

  it('multiple validators on one field', () => {
    class User extends Model {
      static override fields = [
        {
          name: 'name',
          type: FieldType.STRING,
          validators: [presence(), lengthValidator({ min: 2 })],
        },
      ];
    }
    expect(User.create({ name: '' }).validate().errors.length).toBeGreaterThanOrEqual(1);
    expect(User.create({ name: 'A' }).validate().valid).toBe(false);
    expect(User.create({ name: 'Al' }).validate().valid).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Events
// ═══════════════════════════════════════════════════════════════════════════

describe('Events', () => {
  it('fires "change" event on set()', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING },
      ];
    }
    const u = User.create({ name: 'Alice' });
    const spy = vi.fn();
    u.on('change', spy);
    u.set('name', 'Bob');
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(u, ['name']);
  });

  it('does not fire "change" when value unchanged', () => {
    class User extends Model {
      static override fields = [
        { name: 'name', type: FieldType.STRING },
      ];
    }
    const u = User.create({ name: 'Alice' });
    const spy = vi.fn();
    u.on('change', spy);
    u.set('name', 'Alice');
    expect(spy).not.toHaveBeenCalled();
  });

  it('fires "commit" event on commit()', () => {
    class User extends Model {
      static override fields = [{ name: 'name', type: FieldType.STRING }];
    }
    const u = User.create({ name: 'Alice' });
    u.set('name', 'Bob');
    const spy = vi.fn();
    u.on('commit', spy);
    u.commit();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('fires "reject" event on reject()', () => {
    class User extends Model {
      static override fields = [{ name: 'name', type: FieldType.STRING }];
    }
    const u = User.create({ name: 'Alice' });
    u.set('name', 'Bob');
    const spy = vi.fn();
    u.on('reject', spy);
    u.reject();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('fires "idchanged" when ID changes via setId', () => {
    class User extends Model {
      static override fields = [
        { name: 'id', type: FieldType.INT },
      ];
    }
    const u = User.create({});
    const spy = vi.fn();
    u.on('idchanged', spy);
    u.setId(42);
    expect(spy).toHaveBeenCalledWith(u, 42, 0);
  });

  it('commit(silent=true) does not fire event', () => {
    class User extends Model {
      static override fields = [{ name: 'name', type: FieldType.STRING }];
    }
    const u = User.create({ name: 'Alice' });
    u.set('name', 'Bob');
    const spy = vi.fn();
    u.on('commit', spy);
    u.commit(true);
    expect(spy).not.toHaveBeenCalled();
  });

  it('reject(silent=true) does not fire event', () => {
    class User extends Model {
      static override fields = [{ name: 'name', type: FieldType.STRING }];
    }
    const u = User.create({ name: 'Alice' });
    u.set('name', 'Bob');
    const spy = vi.fn();
    u.on('reject', spy);
    u.reject(true);
    expect(spy).not.toHaveBeenCalled();
  });
});
