import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  identity,
  emptyFn,
  applyIf,
  apply,
  clone,
  isObject,
  isString,
  isNumber,
  isBoolean,
  isFunction,
  isArray,
  isDefined,
  isEmpty,
  isIterable,
  isPrimitive,
  namespace,
  defer,
  interval,
  now,
  generateId,
} from '../src/util/index.js';

// ---------------------------------------------------------------------------
// identity
// ---------------------------------------------------------------------------
describe('identity', () => {
  it('returns the same primitive value', () => {
    expect(identity(42)).toBe(42);
    expect(identity('hello')).toBe('hello');
    expect(identity(true)).toBe(true);
    expect(identity(null)).toBe(null);
    expect(identity(undefined)).toBe(undefined);
  });

  it('returns the same object reference', () => {
    const obj = { a: 1 };
    expect(identity(obj)).toBe(obj);
  });

  it('returns the same array reference', () => {
    const arr = [1, 2, 3];
    expect(identity(arr)).toBe(arr);
  });

  it('returns the same function reference', () => {
    const fn = () => {};
    expect(identity(fn)).toBe(fn);
  });

  it('preserves the type through generics', () => {
    const num: number = identity(10);
    const str: string = identity('test');
    expect(num).toBe(10);
    expect(str).toBe('test');
  });
});

// ---------------------------------------------------------------------------
// emptyFn
// ---------------------------------------------------------------------------
describe('emptyFn', () => {
  it('is a function', () => {
    expect(typeof emptyFn).toBe('function');
  });

  it('returns undefined', () => {
    expect(emptyFn()).toBeUndefined();
  });

  it('is the same reference on every access (reusable)', () => {
    const ref1 = emptyFn;
    const ref2 = emptyFn;
    expect(ref1).toBe(ref2);
  });

  it('accepts any arguments without throwing', () => {
    // Cast so TS lets us pass args to a () => void for the runtime test
    const fn = emptyFn as (...args: unknown[]) => void;
    expect(() => fn(1, 'a', {}, [])).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// applyIf
// ---------------------------------------------------------------------------
describe('applyIf', () => {
  it('copies properties that do not exist on target', () => {
    const target = { a: 1 } as Record<string, number>;
    const result = applyIf(target, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('does NOT overwrite existing properties', () => {
    const target = { a: 1, b: 2 };
    const result = applyIf(target, { a: 99, b: 88 });
    expect(result.a).toBe(1);
    expect(result.b).toBe(2);
  });

  it('returns the same target reference', () => {
    const target = { x: 10 };
    const result = applyIf(target, {});
    expect(result).toBe(target);
  });

  it('handles empty source gracefully', () => {
    const target = { a: 1 };
    expect(applyIf(target, {})).toEqual({ a: 1 });
  });

  it('handles empty target', () => {
    const target = {} as Record<string, number>;
    const result = applyIf(target, { a: 1, b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('does not copy inherited (prototype) properties from source', () => {
    const proto = { inherited: true };
    const source = Object.create(proto) as Record<string, boolean>;
    source.own = true;
    const target = {} as Record<string, boolean>;
    applyIf(target, source);
    expect(target).toHaveProperty('own');
    expect(target).not.toHaveProperty('inherited');
  });

  it('preserves properties whose value is undefined on target', () => {
    const target: Record<string, unknown> = { a: undefined };
    applyIf(target, { a: 42 });
    // a already exists on target (even though undefined), so should NOT be overwritten
    expect(target.a).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// apply
// ---------------------------------------------------------------------------
describe('apply', () => {
  it('copies properties from a single source', () => {
    const target = { a: 1 } as Record<string, number>;
    const result = apply(target, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('overwrites existing properties', () => {
    const target = { a: 1 };
    const result = apply(target, { a: 99 });
    expect(result.a).toBe(99);
  });

  it('merges multiple sources left-to-right', () => {
    const target = {} as Record<string, number>;
    const result = apply(target, { a: 1 }, { b: 2 }, { a: 3, c: 4 });
    expect(result).toEqual({ a: 3, b: 2, c: 4 });
  });

  it('returns the same target reference', () => {
    const target = { x: 1 };
    const result = apply(target, { x: 2 });
    expect(result).toBe(target);
  });

  it('handles zero sources', () => {
    const target = { a: 1 };
    expect(apply(target)).toEqual({ a: 1 });
  });

  it('does not copy inherited properties from sources', () => {
    const proto = { inherited: true };
    const source = Object.create(proto) as Record<string, boolean>;
    source.own = true;
    const target = {} as Record<string, boolean>;
    apply(target, source);
    expect(target).toHaveProperty('own');
    expect(target).not.toHaveProperty('inherited');
  });
});

// ---------------------------------------------------------------------------
// clone
// ---------------------------------------------------------------------------
describe('clone', () => {
  it('deep-clones a plain object', () => {
    const obj = { a: 1, b: { c: 2 } };
    const result = clone(obj);
    expect(result).toEqual(obj);
    expect(result).not.toBe(obj);
    expect(result.b).not.toBe(obj.b);
  });

  it('deep-clones an array', () => {
    const arr = [1, [2, 3], { a: 4 }];
    const result = clone(arr);
    expect(result).toEqual(arr);
    expect(result).not.toBe(arr);
    expect(result[1]).not.toBe(arr[1]);
  });

  it('clones primitives by value', () => {
    expect(clone(42)).toBe(42);
    expect(clone('hello')).toBe('hello');
    expect(clone(true)).toBe(true);
    expect(clone(null)).toBe(null);
  });

  it('clones a Date', () => {
    const d = new Date('2024-01-01');
    const result = clone(d);
    expect(result).toEqual(d);
    expect(result).not.toBe(d);
  });

  it('clones a RegExp', () => {
    const re = /abc/gi;
    const result = clone(re);
    expect(result).toEqual(re);
    expect(result).not.toBe(re);
  });

  it('clones deeply nested objects', () => {
    const deep = { a: { b: { c: { d: { e: 'deep' } } } } };
    const result = clone(deep);
    expect(result).toEqual(deep);
    expect(result.a.b.c.d).not.toBe(deep.a.b.c.d);
  });

  it('clones a Map', () => {
    const map = new Map<string, number>([['a', 1], ['b', 2]]);
    const result = clone(map);
    expect(result).toEqual(map);
    expect(result).not.toBe(map);
  });

  it('clones a Set', () => {
    const set = new Set([1, 2, 3]);
    const result = clone(set);
    expect(result).toEqual(set);
    expect(result).not.toBe(set);
  });
});

// ---------------------------------------------------------------------------
// isObject
// ---------------------------------------------------------------------------
describe('isObject', () => {
  it('returns true for plain objects', () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ a: 1 })).toBe(true);
  });

  it('returns true for Object.create(null)', () => {
    expect(isObject(Object.create(null))).toBe(true);
  });

  it('returns false for null', () => {
    expect(isObject(null)).toBe(false);
  });

  it('returns false for arrays', () => {
    expect(isObject([])).toBe(false);
  });

  it('returns false for functions', () => {
    expect(isObject(() => {})).toBe(false);
  });

  it('returns false for primitives', () => {
    expect(isObject(42)).toBe(false);
    expect(isObject('string')).toBe(false);
    expect(isObject(true)).toBe(false);
    expect(isObject(undefined)).toBe(false);
    expect(isObject(Symbol())).toBe(false);
  });

  it('returns false for class instances (Date, RegExp)', () => {
    expect(isObject(new Date())).toBe(false);
    expect(isObject(/regex/)).toBe(false);
  });

  it('narrows the type so properties can be accessed', () => {
    const val: unknown = { key: 'value' };
    if (isObject(val)) {
      // This line would fail to compile if the type guard didn't work
      expect(val.key).toBe('value');
    }
  });
});

// ---------------------------------------------------------------------------
// isString
// ---------------------------------------------------------------------------
describe('isString', () => {
  it('returns true for string literals', () => {
    expect(isString('')).toBe(true);
    expect(isString('hello')).toBe(true);
  });

  it('returns true for template literals', () => {
    expect(isString(`template`)).toBe(true);
  });

  it('returns false for String objects', () => {
    // eslint-disable-next-line no-new-wrappers
    expect(isString(new String('wrapped'))).toBe(false);
  });

  it('returns false for non-strings', () => {
    expect(isString(42)).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString(true)).toBe(false);
    expect(isString({})).toBe(false);
    expect(isString([])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isNumber
// ---------------------------------------------------------------------------
describe('isNumber', () => {
  it('returns true for integers', () => {
    expect(isNumber(0)).toBe(true);
    expect(isNumber(42)).toBe(true);
    expect(isNumber(-1)).toBe(true);
  });

  it('returns true for floats', () => {
    expect(isNumber(3.14)).toBe(true);
    expect(isNumber(-0.5)).toBe(true);
  });

  it('returns true for Infinity', () => {
    expect(isNumber(Infinity)).toBe(true);
    expect(isNumber(-Infinity)).toBe(true);
  });

  it('returns FALSE for NaN', () => {
    expect(isNumber(NaN)).toBe(false);
  });

  it('returns false for numeric strings', () => {
    expect(isNumber('42')).toBe(false);
  });

  it('returns false for non-numbers', () => {
    expect(isNumber(null)).toBe(false);
    expect(isNumber(undefined)).toBe(false);
    expect(isNumber(true)).toBe(false);
    expect(isNumber({})).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isBoolean
// ---------------------------------------------------------------------------
describe('isBoolean', () => {
  it('returns true for boolean primitives', () => {
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(false)).toBe(true);
  });

  it('returns false for Boolean objects', () => {
    // eslint-disable-next-line no-new-wrappers
    expect(isBoolean(new Boolean(true))).toBe(false);
  });

  it('returns false for truthy/falsy non-booleans', () => {
    expect(isBoolean(0)).toBe(false);
    expect(isBoolean(1)).toBe(false);
    expect(isBoolean('')).toBe(false);
    expect(isBoolean(null)).toBe(false);
    expect(isBoolean(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isFunction
// ---------------------------------------------------------------------------
describe('isFunction', () => {
  it('returns true for arrow functions', () => {
    expect(isFunction(() => {})).toBe(true);
  });

  it('returns true for function declarations', () => {
    function namedFn() {}
    expect(isFunction(namedFn)).toBe(true);
  });

  it('returns true for class constructors', () => {
    class Foo {}
    expect(isFunction(Foo)).toBe(true);
  });

  it('returns true for async functions', () => {
    expect(isFunction(async () => {})).toBe(true);
  });

  it('returns true for generator functions', () => {
    function* gen() { yield 1; }
    expect(isFunction(gen)).toBe(true);
  });

  it('returns false for non-functions', () => {
    expect(isFunction(42)).toBe(false);
    expect(isFunction('fn')).toBe(false);
    expect(isFunction(null)).toBe(false);
    expect(isFunction(undefined)).toBe(false);
    expect(isFunction({})).toBe(false);
    expect(isFunction([])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isArray
// ---------------------------------------------------------------------------
describe('isArray', () => {
  it('returns true for arrays', () => {
    expect(isArray([])).toBe(true);
    expect(isArray([1, 2, 3])).toBe(true);
    expect(isArray(new Array(5))).toBe(true);
  });

  it('returns false for array-like objects', () => {
    expect(isArray({ length: 0 })).toBe(false);
    expect(isArray('string')).toBe(false);
  });

  it('returns false for non-arrays', () => {
    expect(isArray(null)).toBe(false);
    expect(isArray(undefined)).toBe(false);
    expect(isArray({})).toBe(false);
    expect(isArray(42)).toBe(false);
  });

  it('returns true for arrays from other contexts (Array.isArray semantics)', () => {
    // This just validates we use Array.isArray or equivalent
    const arr = Array.of(1, 2);
    expect(isArray(arr)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isDefined
// ---------------------------------------------------------------------------
describe('isDefined', () => {
  it('returns false for undefined', () => {
    expect(isDefined(undefined)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isDefined(null)).toBe(false);
  });

  it('returns true for zero', () => {
    expect(isDefined(0)).toBe(true);
  });

  it('returns true for empty string', () => {
    expect(isDefined('')).toBe(true);
  });

  it('returns true for false', () => {
    expect(isDefined(false)).toBe(true);
  });

  it('returns true for NaN', () => {
    expect(isDefined(NaN)).toBe(true);
  });

  it('returns true for objects', () => {
    expect(isDefined({})).toBe(true);
    expect(isDefined([])).toBe(true);
  });

  it('narrows the type correctly', () => {
    const val: string | undefined | null = 'hello';
    if (isDefined(val)) {
      // After narrowing, val should be string
      expect(val.toUpperCase()).toBe('HELLO');
    }
  });
});

// ---------------------------------------------------------------------------
// isEmpty
// ---------------------------------------------------------------------------
describe('isEmpty', () => {
  it('returns true for undefined', () => {
    expect(isEmpty(undefined)).toBe(true);
  });

  it('returns true for null', () => {
    expect(isEmpty(null)).toBe(true);
  });

  it('returns true for empty string', () => {
    expect(isEmpty('')).toBe(true);
  });

  it('returns true for empty array', () => {
    expect(isEmpty([])).toBe(true);
  });

  it('returns true for empty plain object', () => {
    expect(isEmpty({})).toBe(true);
  });

  it('returns true for NaN', () => {
    expect(isEmpty(NaN)).toBe(true);
  });

  it('returns false for non-empty string', () => {
    expect(isEmpty('hello')).toBe(false);
  });

  it('returns false for non-empty array', () => {
    expect(isEmpty([1])).toBe(false);
  });

  it('returns false for non-empty object', () => {
    expect(isEmpty({ a: 1 })).toBe(false);
  });

  it('returns false for zero', () => {
    expect(isEmpty(0)).toBe(false);
  });

  it('returns false for false', () => {
    expect(isEmpty(false)).toBe(false);
  });

  it('returns false for a function', () => {
    expect(isEmpty(() => {})).toBe(false);
  });

  it('returns false for whitespace-only strings (not "empty")', () => {
    expect(isEmpty(' ')).toBe(false);
    expect(isEmpty('\t')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isIterable
// ---------------------------------------------------------------------------
describe('isIterable', () => {
  it('returns true for arrays', () => {
    expect(isIterable([1, 2])).toBe(true);
  });

  it('returns true for strings', () => {
    expect(isIterable('hello')).toBe(true);
  });

  it('returns true for Maps', () => {
    expect(isIterable(new Map())).toBe(true);
  });

  it('returns true for Sets', () => {
    expect(isIterable(new Set())).toBe(true);
  });

  it('returns true for generators', () => {
    function* gen() { yield 1; }
    expect(isIterable(gen())).toBe(true);
  });

  it('returns true for custom iterables', () => {
    const custom = { [Symbol.iterator]: function* () { yield 1; } };
    expect(isIterable(custom)).toBe(true);
  });

  it('returns false for plain objects', () => {
    expect(isIterable({})).toBe(false);
  });

  it('returns false for numbers', () => {
    expect(isIterable(42)).toBe(false);
  });

  it('returns false for null and undefined', () => {
    expect(isIterable(null)).toBe(false);
    expect(isIterable(undefined)).toBe(false);
  });

  it('returns false for booleans', () => {
    expect(isIterable(true)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isPrimitive
// ---------------------------------------------------------------------------
describe('isPrimitive', () => {
  it('returns true for strings', () => {
    expect(isPrimitive('hello')).toBe(true);
    expect(isPrimitive('')).toBe(true);
  });

  it('returns true for numbers', () => {
    expect(isPrimitive(42)).toBe(true);
    expect(isPrimitive(NaN)).toBe(true);
    expect(isPrimitive(Infinity)).toBe(true);
  });

  it('returns true for booleans', () => {
    expect(isPrimitive(true)).toBe(true);
    expect(isPrimitive(false)).toBe(true);
  });

  it('returns true for null and undefined', () => {
    expect(isPrimitive(null)).toBe(true);
    expect(isPrimitive(undefined)).toBe(true);
  });

  it('returns true for symbols', () => {
    expect(isPrimitive(Symbol('test'))).toBe(true);
  });

  it('returns true for bigints', () => {
    expect(isPrimitive(BigInt(42))).toBe(true);
  });

  it('returns false for objects', () => {
    expect(isPrimitive({})).toBe(false);
    expect(isPrimitive([])).toBe(false);
    expect(isPrimitive(new Date())).toBe(false);
    expect(isPrimitive(/regex/)).toBe(false);
  });

  it('returns false for functions', () => {
    expect(isPrimitive(() => {})).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// namespace
// ---------------------------------------------------------------------------
describe('namespace', () => {
  it('creates a single-level namespace', () => {
    const root: Record<string, unknown> = {};
    const result = namespace(root, 'a');
    expect(root).toHaveProperty('a');
    expect(typeof root.a).toBe('object');
    expect(result).toBe(root.a);
  });

  it('creates deeply nested namespaces', () => {
    const root: Record<string, unknown> = {};
    const result = namespace(root, 'a.b.c');
    expect(result).toEqual({});
    expect((root as Record<string, Record<string, Record<string, object>>>).a.b.c).toBe(result);
  });

  it('does not overwrite existing intermediate objects', () => {
    const root = { a: { existing: 42 } } as Record<string, unknown>;
    namespace(root, 'a.b');
    const a = root.a as Record<string, unknown>;
    expect(a.existing).toBe(42);
    expect(a.b).toEqual({});
  });

  it('returns the existing object if namespace already exists', () => {
    const existing = { value: 1 };
    const root = { a: { b: existing } };
    const result = namespace(root, 'a.b');
    expect(result).toBe(existing);
  });

  it('handles a single segment that already exists', () => {
    const child = { x: 1 };
    const root = { a: child };
    expect(namespace(root, 'a')).toBe(child);
  });

  it('creates all segments when root is empty', () => {
    const root: Record<string, unknown> = {};
    namespace(root, 'x.y.z');
    const x = root.x as Record<string, unknown>;
    const y = x.y as Record<string, unknown>;
    expect(y).toHaveProperty('z');
    expect(typeof y.z).toBe('object');
  });
});

// ---------------------------------------------------------------------------
// defer
// ---------------------------------------------------------------------------
describe('defer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls the function after the specified delay', () => {
    const spy = vi.fn();
    defer(spy, 100);
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('defaults to 0ms delay when millis is omitted', () => {
    const spy = vi.fn();
    defer(spy);
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(0);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('returns a numeric timer id', () => {
    const id = defer(() => {}, 10);
    expect(typeof id).toBe('number');
  });

  it('can be cancelled via clearTimeout', () => {
    const spy = vi.fn();
    const id = defer(spy, 50);
    clearTimeout(id);
    vi.advanceTimersByTime(100);
    expect(spy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// interval
// ---------------------------------------------------------------------------
describe('interval', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls the function repeatedly at the given interval', () => {
    const spy = vi.fn();
    interval(spy, 50);
    vi.advanceTimersByTime(150);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('returns a numeric timer id', () => {
    const id = interval(() => {}, 100);
    expect(typeof id).toBe('number');
  });

  it('can be cancelled via clearInterval', () => {
    const spy = vi.fn();
    const id = interval(spy, 50);
    vi.advanceTimersByTime(75);
    expect(spy).toHaveBeenCalledTimes(1);
    clearInterval(id);
    vi.advanceTimersByTime(200);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// now
// ---------------------------------------------------------------------------
describe('now', () => {
  it('returns a number', () => {
    expect(typeof now()).toBe('number');
  });

  it('returns a non-negative value', () => {
    expect(now()).toBeGreaterThanOrEqual(0);
  });

  it('returns increasing values on successive calls', () => {
    const a = now();
    // Spin briefly so time passes
    for (let i = 0; i < 100_000; i++) { /* noop */ }
    const b = now();
    expect(b).toBeGreaterThanOrEqual(a);
  });
});

// ---------------------------------------------------------------------------
// generateId
// ---------------------------------------------------------------------------
describe('generateId', () => {
  it('returns a string starting with the default prefix', () => {
    const id = generateId();
    expect(id).toMatch(/^ext-ts-\d+$/);
  });

  it('uses a custom prefix', () => {
    const id = generateId('widget');
    expect(id).toMatch(/^widget-\d+$/);
  });

  it('returns unique IDs across successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it('returns unique IDs even with different prefixes', () => {
    const a = generateId('a');
    const b = generateId('b');
    // They differ because the counter is global
    const numA = parseInt(a.split('-').pop()!, 10);
    const numB = parseInt(b.split('-').pop()!, 10);
    expect(numB).toBeGreaterThan(numA);
  });

  it('monotonically increases the counter', () => {
    const id1 = generateId();
    const id2 = generateId();
    const n1 = parseInt(id1.split('-').pop()!, 10);
    const n2 = parseInt(id2.split('-').pop()!, 10);
    expect(n2).toBe(n1 + 1);
  });
});
