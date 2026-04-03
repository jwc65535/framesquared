import { describe, it, expect } from 'vitest';
import {
  keys,
  values,
  entries,
  fromEntries,
  merge,
  pick,
  omit,
  mapValues,
  mapKeys,
  freeze,
  equals,
  getNestedValue,
  setNestedValue,
  flattenObject,
  unflattenObject,
} from '../src/util/Object.js';

// ---------------------------------------------------------------------------
// keys
// ---------------------------------------------------------------------------
describe('keys', () => {
  it('returns own enumerable keys', () => {
    expect(keys({ a: 1, b: 2 })).toEqual(['a', 'b']);
  });

  it('returns empty array for empty object', () => {
    expect(keys({})).toEqual([]);
  });

  it('does not include inherited keys', () => {
    const proto = { inherited: true };
    const obj = Object.create(proto) as Record<string, unknown>;
    obj.own = true;
    expect(keys(obj)).toEqual(['own']);
  });

  it('returns string keys for numeric keys', () => {
    const result = keys({ 0: 'a', 1: 'b' });
    expect(result).toEqual(['0', '1']);
  });
});

// ---------------------------------------------------------------------------
// values
// ---------------------------------------------------------------------------
describe('values', () => {
  it('returns own enumerable values', () => {
    expect(values({ a: 1, b: 2 })).toEqual([1, 2]);
  });

  it('returns empty array for empty object', () => {
    expect(values({})).toEqual([]);
  });

  it('handles mixed value types', () => {
    const result = values({ a: 1, b: 'two', c: true });
    expect(result).toEqual([1, 'two', true]);
  });
});

// ---------------------------------------------------------------------------
// entries
// ---------------------------------------------------------------------------
describe('entries', () => {
  it('returns key-value pairs', () => {
    expect(entries({ a: 1, b: 2 })).toEqual([
      ['a', 1],
      ['b', 2],
    ]);
  });

  it('returns empty array for empty object', () => {
    expect(entries({})).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// fromEntries
// ---------------------------------------------------------------------------
describe('fromEntries', () => {
  it('creates an object from key-value pairs', () => {
    expect(
      fromEntries([
        ['a', 1],
        ['b', 2],
      ]),
    ).toEqual({ a: 1, b: 2 });
  });

  it('returns empty object for empty input', () => {
    expect(fromEntries([])).toEqual({});
  });

  it('last entry wins on duplicate keys', () => {
    expect(
      fromEntries([
        ['a', 1],
        ['a', 2],
      ]),
    ).toEqual({ a: 2 });
  });

  it('round-trips with entries()', () => {
    const obj = { x: 10, y: 20 };
    expect(fromEntries(entries(obj) as [string, number][])).toEqual(obj);
  });
});

// ---------------------------------------------------------------------------
// merge (deep merge)
// ---------------------------------------------------------------------------
describe('merge', () => {
  it('deep-merges nested objects', () => {
    const target = { a: { b: 1, c: 2 } };
    const source = { a: { c: 3, d: 4 } };
    const result = merge(target, source);
    expect(result).toEqual({ a: { b: 1, c: 3, d: 4 } });
  });

  it('overwrites primitives', () => {
    const target = { a: 1, b: 'old' };
    const result = merge(target, { a: 2, b: 'new' });
    expect(result).toEqual({ a: 2, b: 'new' });
  });

  it('adds new keys', () => {
    const target = { a: 1 } as Record<string, unknown>;
    const result = merge(target, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('merges multiple sources left-to-right', () => {
    const target = { a: 1 } as Record<string, unknown>;
    const result = merge(target, { b: 2 }, { c: 3, a: 99 });
    expect(result).toEqual({ a: 99, b: 2, c: 3 });
  });

  it('returns the same target reference', () => {
    const target = { a: 1 };
    expect(merge(target, { a: 2 })).toBe(target);
  });

  it('replaces arrays rather than merging them', () => {
    const target = { arr: [1, 2, 3] };
    const result = merge(target, { arr: [4, 5] });
    expect(result.arr).toEqual([4, 5]);
  });

  it('handles deeply nested merge (3+ levels)', () => {
    const target = { a: { b: { c: { d: 1 } } } };
    const source = { a: { b: { c: { e: 2 } } } };
    const result = merge(target, source);
    expect(result).toEqual({ a: { b: { c: { d: 1, e: 2 } } } });
  });

  it('handles empty target', () => {
    const result = merge({} as Record<string, unknown>, { a: 1, b: { c: 2 } });
    expect(result).toEqual({ a: 1, b: { c: 2 } });
  });

  it('handles empty source', () => {
    const target = { a: 1 };
    expect(merge(target, {})).toEqual({ a: 1 });
  });

  it('does not merge across type boundaries (object overwritten by primitive)', () => {
    const target = { a: { nested: true } } as Record<string, unknown>;
    const result = merge(target, { a: 42 });
    expect(result.a).toBe(42);
  });

  it('does not modify source objects', () => {
    const source = { a: { b: 1 } };
    const sourceCopy = JSON.parse(JSON.stringify(source));
    merge({} as Record<string, unknown>, source);
    expect(source).toEqual(sourceCopy);
  });
});

// ---------------------------------------------------------------------------
// pick
// ---------------------------------------------------------------------------
describe('pick', () => {
  it('picks specified keys', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });

  it('returns empty object when no keys match', () => {
    const obj = { a: 1 };
    expect(pick(obj, [])).toEqual({});
  });

  it('ignores keys not present on the object', () => {
    const obj = { a: 1, b: 2 };
    // Force a non-existent key through the type system
    const result = pick(obj, ['a', 'c' as keyof typeof obj]);
    expect(result).toEqual({ a: 1 });
  });

  it('does not mutate the original', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const picked = pick(obj, ['a']);
    expect(picked).toEqual({ a: 1 });
    expect(obj).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('returns a new object (not the same reference)', () => {
    const obj = { a: 1 };
    expect(pick(obj, ['a'])).not.toBe(obj);
  });
});

// ---------------------------------------------------------------------------
// omit
// ---------------------------------------------------------------------------
describe('omit', () => {
  it('omits specified keys', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 });
  });

  it('returns a copy with no keys omitted when array is empty', () => {
    const obj = { a: 1, b: 2 };
    const result = omit(obj, []);
    expect(result).toEqual({ a: 1, b: 2 });
    expect(result).not.toBe(obj);
  });

  it('ignores keys not present on the object', () => {
    const obj = { a: 1, b: 2 };
    const result = omit(obj, ['c' as keyof typeof obj]);
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('returns empty object when all keys are omitted', () => {
    const obj = { a: 1, b: 2 };
    expect(omit(obj, ['a', 'b'])).toEqual({});
  });

  it('does not mutate the original', () => {
    const obj = { a: 1, b: 2 };
    omit(obj, ['a']);
    expect(obj).toEqual({ a: 1, b: 2 });
  });
});

// ---------------------------------------------------------------------------
// mapValues
// ---------------------------------------------------------------------------
describe('mapValues', () => {
  it('transforms each value', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = mapValues(obj, (v) => (v as number) * 10);
    expect(result).toEqual({ a: 10, b: 20, c: 30 });
  });

  it('passes key as second argument', () => {
    const obj = { x: 1, y: 2 };
    const result = mapValues(obj, (_v, k) => String(k));
    expect(result).toEqual({ x: 'x', y: 'y' });
  });

  it('returns empty object for empty input', () => {
    expect(mapValues({}, (v) => v)).toEqual({});
  });

  it('returns a new object', () => {
    const obj = { a: 1 };
    expect(mapValues(obj, (v) => v)).not.toBe(obj);
  });
});

// ---------------------------------------------------------------------------
// mapKeys
// ---------------------------------------------------------------------------
describe('mapKeys', () => {
  it('transforms each key', () => {
    const obj = { a: 1, b: 2 };
    const result = mapKeys(obj, (k) => `prefix_${String(k)}`);
    expect(result).toEqual({ prefix_a: 1, prefix_b: 2 });
  });

  it('returns empty object for empty input', () => {
    expect(mapKeys({}, (k) => String(k))).toEqual({});
  });

  it('returns a new object', () => {
    const obj = { a: 1 };
    expect(mapKeys(obj, (k) => String(k))).not.toBe(obj);
  });

  it('handles key collisions (last write wins)', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = mapKeys(obj, () => 'same');
    expect(Object.keys(result)).toEqual(['same']);
  });
});

// ---------------------------------------------------------------------------
// freeze (deep freeze)
// ---------------------------------------------------------------------------
describe('freeze', () => {
  it('freezes the top-level object', () => {
    const obj = { a: 1 };
    const frozen = freeze(obj);
    expect(Object.isFrozen(frozen)).toBe(true);
  });

  it('freezes nested objects', () => {
    const obj = { a: { b: { c: 1 } } };
    const frozen = freeze(obj);
    expect(Object.isFrozen(frozen.a)).toBe(true);
    expect(Object.isFrozen(frozen.a.b)).toBe(true);
  });

  it('freezes arrays inside the object', () => {
    const obj = { arr: [1, 2, 3] };
    const frozen = freeze(obj);
    expect(Object.isFrozen(frozen.arr)).toBe(true);
  });

  it('returns the same reference', () => {
    const obj = { a: 1 };
    expect(freeze(obj)).toBe(obj);
  });

  it('prevents mutation (in strict mode)', () => {
    const obj = { a: 1, nested: { b: 2 } };
    freeze(obj);
    expect(() => {
      (obj as Record<string, unknown>).a = 99;
    }).toThrow();
    expect(() => {
      (obj.nested as Record<string, unknown>).b = 99;
    }).toThrow();
  });

  it('handles already-frozen objects without error', () => {
    const obj = Object.freeze({ a: 1 });
    expect(() => freeze(obj)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// equals (deep structural equality)
// ---------------------------------------------------------------------------
describe('equals', () => {
  it('returns true for identical primitives', () => {
    expect(equals(1, 1)).toBe(true);
    expect(equals('a', 'a')).toBe(true);
    expect(equals(true, true)).toBe(true);
    expect(equals(null, null)).toBe(true);
    expect(equals(undefined, undefined)).toBe(true);
  });

  it('returns false for different primitives', () => {
    expect(equals(1, 2)).toBe(false);
    expect(equals('a', 'b')).toBe(false);
    expect(equals(true, false)).toBe(false);
    expect(equals(null, undefined)).toBe(false);
  });

  it('returns true for deeply equal objects', () => {
    expect(equals({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(true);
  });

  it('returns false for objects with different values', () => {
    expect(equals({ a: 1 }, { a: 2 })).toBe(false);
  });

  it('returns false for objects with different keys', () => {
    expect(equals({ a: 1 }, { b: 1 })).toBe(false);
  });

  it('returns false when key count differs', () => {
    expect(equals({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(equals({ a: 1, b: 2 }, { a: 1 })).toBe(false);
  });

  it('compares arrays element-by-element', () => {
    expect(equals([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(equals([1, 2], [1, 2, 3])).toBe(false);
    expect(equals([1, 2, 3], [1, 2])).toBe(false);
  });

  it('compares nested arrays and objects', () => {
    expect(equals([{ a: [1] }], [{ a: [1] }])).toBe(true);
    expect(equals([{ a: [1] }], [{ a: [2] }])).toBe(false);
  });

  it('handles NaN === NaN as true', () => {
    expect(equals(NaN, NaN)).toBe(true);
  });

  it('returns false for mismatched types', () => {
    expect(equals(1, '1')).toBe(false);
    expect(equals(null, 0)).toBe(false);
    expect(equals(undefined, null)).toBe(false);
    expect(equals([], {})).toBe(false);
  });

  it('compares Dates by value', () => {
    const d1 = new Date('2024-01-01');
    const d2 = new Date('2024-01-01');
    const d3 = new Date('2024-06-15');
    expect(equals(d1, d2)).toBe(true);
    expect(equals(d1, d3)).toBe(false);
  });

  it('compares RegExps', () => {
    expect(equals(/abc/gi, /abc/gi)).toBe(true);
    expect(equals(/abc/g, /abc/i)).toBe(false);
    expect(equals(/abc/, /def/)).toBe(false);
  });

  it('handles the same reference as equal', () => {
    const obj = { deep: { a: 1 } };
    expect(equals(obj, obj)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getNestedValue
// ---------------------------------------------------------------------------
describe('getNestedValue', () => {
  it('retrieves a top-level property', () => {
    expect(getNestedValue({ a: 1 }, 'a')).toBe(1);
  });

  it('retrieves a deeply nested property', () => {
    expect(getNestedValue({ a: { b: { c: 42 } } }, 'a.b.c')).toBe(42);
  });

  it('returns undefined for a missing path', () => {
    expect(getNestedValue({ a: 1 }, 'b')).toBeUndefined();
  });

  it('returns undefined when traversal hits a non-object', () => {
    expect(getNestedValue({ a: 1 }, 'a.b.c')).toBeUndefined();
  });

  it('returns the defaultValue when path is missing', () => {
    expect(getNestedValue({ a: 1 }, 'b.c', 'fallback')).toBe('fallback');
  });

  it('returns the actual value even if it is undefined (no default used)', () => {
    const obj = { a: { b: undefined } };
    // The property exists — should return undefined, not the default
    expect(getNestedValue(obj, 'a.b', 'default')).toBeUndefined();
  });

  it('returns the defaultValue when an intermediate segment is missing', () => {
    expect(getNestedValue({ a: {} }, 'a.b.c', 'nope')).toBe('nope');
  });

  it('handles array indices in path via numeric segments', () => {
    const obj = { a: [10, 20, 30] };
    expect(getNestedValue(obj, 'a.1')).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// setNestedValue
// ---------------------------------------------------------------------------
describe('setNestedValue', () => {
  it('sets a top-level property', () => {
    const obj: Record<string, unknown> = {};
    setNestedValue(obj, 'a', 42);
    expect(obj.a).toBe(42);
  });

  it('sets a deeply nested property, creating intermediaries', () => {
    const obj: Record<string, unknown> = {};
    setNestedValue(obj, 'a.b.c', 99);
    expect((obj as Record<string, Record<string, Record<string, number>>>).a.b.c).toBe(99);
  });

  it('overwrites an existing value', () => {
    const obj = { a: { b: 1 } };
    setNestedValue(obj, 'a.b', 2);
    expect(obj.a.b).toBe(2);
  });

  it('creates intermediate objects without overwriting siblings', () => {
    const obj = { a: { existing: 'keep' } } as Record<string, unknown>;
    setNestedValue(obj, 'a.b.c', 'new');
    const a = obj.a as Record<string, unknown>;
    expect(a.existing).toBe('keep');
    expect((a.b as Record<string, unknown>).c).toBe('new');
  });

  it('handles single-segment path', () => {
    const obj: Record<string, unknown> = { x: 1 };
    setNestedValue(obj, 'x', 2);
    expect(obj.x).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// flattenObject
// ---------------------------------------------------------------------------
describe('flattenObject', () => {
  it('flattens a nested object with dot paths', () => {
    expect(flattenObject({ a: { b: 1 }, c: 2 })).toEqual({
      'a.b': 1,
      c: 2,
    });
  });

  it('flattens deeply nested objects', () => {
    expect(flattenObject({ a: { b: { c: { d: 1 } } } })).toEqual({
      'a.b.c.d': 1,
    });
  });

  it('returns empty object for empty input', () => {
    expect(flattenObject({})).toEqual({});
  });

  it('preserves arrays as leaf values', () => {
    const result = flattenObject({ a: { b: [1, 2, 3] } });
    expect(result).toEqual({ 'a.b': [1, 2, 3] });
  });

  it('preserves Dates as leaf values', () => {
    const d = new Date('2024-01-01');
    const result = flattenObject({ a: { b: d } });
    expect(result['a.b']).toBe(d);
  });

  it('uses custom prefix', () => {
    expect(flattenObject({ b: 1 }, 'a')).toEqual({ 'a.b': 1 });
  });

  it('handles top-level primitives', () => {
    expect(flattenObject({ a: 1, b: 'two', c: true })).toEqual({
      a: 1,
      b: 'two',
      c: true,
    });
  });
});

// ---------------------------------------------------------------------------
// unflattenObject
// ---------------------------------------------------------------------------
describe('unflattenObject', () => {
  it('unflattens dot-path keys', () => {
    expect(unflattenObject({ 'a.b': 1, c: 2 })).toEqual({
      a: { b: 1 },
      c: 2,
    });
  });

  it('unflattens deeply nested paths', () => {
    expect(unflattenObject({ 'a.b.c.d': 1 })).toEqual({
      a: { b: { c: { d: 1 } } },
    });
  });

  it('returns empty object for empty input', () => {
    expect(unflattenObject({})).toEqual({});
  });

  it('merges sibling paths correctly', () => {
    expect(unflattenObject({ 'a.b': 1, 'a.c': 2 })).toEqual({
      a: { b: 1, c: 2 },
    });
  });

  it('round-trips with flattenObject', () => {
    const original = { a: { b: 1, c: 2 }, d: 3 };
    expect(unflattenObject(flattenObject(original))).toEqual(original);
  });
});
