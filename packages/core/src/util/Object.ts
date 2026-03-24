/**
 * @ext-ts/core – Object utilities
 */

// ---------------------------------------------------------------------------
// keys / values / entries / fromEntries
// ---------------------------------------------------------------------------

/**
 * Typed wrapper around `Object.keys`.
 */
export function keys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/**
 * Typed wrapper around `Object.values`.
 */
export function values<T extends object>(obj: T): T[keyof T][] {
  return Object.values(obj) as T[keyof T][];
}

/**
 * Typed wrapper around `Object.entries`.
 */
export function entries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/**
 * Typed wrapper around `Object.fromEntries`.
 */
export function fromEntries<K extends string, V>(
  items: [K, V][],
): Record<K, V> {
  return Object.fromEntries(items) as Record<K, V>;
}

// ---------------------------------------------------------------------------
// Helpers (not exported)
// ---------------------------------------------------------------------------

/**
 * Returns `true` for plain objects (those whose prototype is
 * `Object.prototype` or `null`).  Arrays, Dates, RegExps etc. → `false`.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

// ---------------------------------------------------------------------------
// merge (deep)
// ---------------------------------------------------------------------------

/**
 * Deep-merges own enumerable properties from every `source` into `target`.
 *
 * - Plain objects are recursively merged.
 * - Arrays and non-plain objects are **overwritten** (not merged element-wise).
 * - Mutates and returns `target`.
 */
export function merge<T extends object>(
  target: T,
  ...sources: Partial<T>[]
): T {
  for (const source of sources) {
    for (const key of Object.keys(source) as (keyof T)[]) {
      const srcVal = source[key];
      const tgtVal = (target as Record<keyof T, unknown>)[key];

      if (isPlainObject(srcVal) && isPlainObject(tgtVal)) {
        merge(tgtVal as Record<string, unknown>, srcVal as Record<string, unknown>);
      } else {
        (target as Record<keyof T, unknown>)[key] = srcVal;
      }
    }
  }
  return target;
}

// ---------------------------------------------------------------------------
// pick / omit
// ---------------------------------------------------------------------------

/**
 * Returns a new object containing only the specified `pickedKeys`.
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  pickedKeys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of pickedKeys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Returns a new object with the specified `omittedKeys` removed.
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  omittedKeys: K[],
): Omit<T, K> {
  const excluded = new Set<PropertyKey>(omittedKeys);
  const result = {} as Record<PropertyKey, unknown>;
  for (const key of Object.keys(obj)) {
    if (!excluded.has(key)) {
      result[key] = (obj as Record<string, unknown>)[key];
    }
  }
  return result as Omit<T, K>;
}

// ---------------------------------------------------------------------------
// mapValues / mapKeys
// ---------------------------------------------------------------------------

/**
 * Returns a new object with every value transformed by `fn`.
 */
export function mapValues<T extends object, U>(
  obj: T,
  fn: (value: T[keyof T], key: keyof T) => U,
): Record<keyof T, U> {
  const result = {} as Record<keyof T, U>;
  for (const key of Object.keys(obj) as (keyof T)[]) {
    result[key] = fn(obj[key] as T[keyof T], key);
  }
  return result;
}

/**
 * Returns a new object with every key transformed by `fn`.
 */
export function mapKeys<T extends object>(
  obj: T,
  fn: (key: keyof T) => string,
): Record<string, T[keyof T]> {
  const result = {} as Record<string, T[keyof T]>;
  for (const key of Object.keys(obj) as (keyof T)[]) {
    result[fn(key)] = obj[key] as T[keyof T];
  }
  return result;
}

// ---------------------------------------------------------------------------
// freeze (deep)
// ---------------------------------------------------------------------------

/**
 * Recursively freezes `obj` and all nested objects / arrays.
 * Returns the same reference.
 */
export function freeze<T extends object>(obj: T): Readonly<T> {
  Object.freeze(obj);
  for (const value of Object.values(obj)) {
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      freeze(value as object);
    }
  }
  return obj;
}

// ---------------------------------------------------------------------------
// equals (deep structural equality)
// ---------------------------------------------------------------------------

/**
 * Deep structural equality comparison.  Handles primitives, plain objects,
 * arrays, `Date`, `RegExp`, and `NaN`.
 */
export function equals(a: unknown, b: unknown): boolean {
  // Same reference (also covers identical primitives)
  if (a === b) return true;

  // NaN check
  if (typeof a === 'number' && typeof b === 'number') {
    return Number.isNaN(a) && Number.isNaN(b);
  }

  // null / undefined / type mismatch
  if (a === null || b === null || a === undefined || b === undefined) {
    return false;
  }
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false; // primitives already compared above

  // Date
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // RegExp
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.source === b.source && a.flags === b.flags;
  }

  // Array vs non-array
  const aIsArr = Array.isArray(a);
  const bIsArr = Array.isArray(b);
  if (aIsArr !== bIsArr) return false;

  if (aIsArr && bIsArr) {
    const arrA = a as unknown[];
    const arrB = b as unknown[];
    if (arrA.length !== arrB.length) return false;
    for (let i = 0; i < arrA.length; i++) {
      if (!equals(arrA[i], arrB[i])) return false;
    }
    return true;
  }

  // Plain objects
  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key)) return false;
    if (!equals(objA[key], objB[key])) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// getNestedValue / setNestedValue
// ---------------------------------------------------------------------------

/**
 * Traverses `obj` along the dot-separated `path` and returns the value found.
 * Returns `defaultValue` when the path does not exist (i.e. an intermediate
 * segment is missing).  If the final property exists but its value is
 * `undefined`, `undefined` is returned (not `defaultValue`).
 */
export function getNestedValue(
  obj: object,
  path: string,
  defaultValue?: unknown,
): unknown {
  const segments = path.split('.');
  let current: unknown = obj;

  for (let i = 0; i < segments.length; i++) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    const rec = current as Record<string, unknown>;
    const seg = segments[i];

    // Last segment: check existence
    if (i === segments.length - 1) {
      return seg in rec ? rec[seg] : defaultValue;
    }

    current = rec[seg];
  }

  /* istanbul ignore next – unreachable with non-empty path */
  return current;
}

/**
 * Sets a value at a dot-separated `path`, creating intermediate objects as
 * needed.
 */
export function setNestedValue(
  obj: object,
  path: string,
  value: unknown,
): void {
  const segments = path.split('.');
  let current: Record<string, unknown> = obj as Record<string, unknown>;

  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (
      current[seg] === undefined ||
      current[seg] === null ||
      typeof current[seg] !== 'object'
    ) {
      current[seg] = {};
    }
    current = current[seg] as Record<string, unknown>;
  }

  current[segments[segments.length - 1]] = value;
}

// ---------------------------------------------------------------------------
// flattenObject / unflattenObject
// ---------------------------------------------------------------------------

/**
 * Flattens a nested object into a single-level object with dot-separated keys.
 *
 * Arrays and non-plain objects are treated as leaf values (not recursed into).
 */
export function flattenObject(
  obj: object,
  prefix?: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = value;
    }
  }

  return result;
}

/**
 * Reverse of {@link flattenObject}: expands dot-separated keys into a nested
 * object.
 */
export function unflattenObject(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [path, value] of Object.entries(obj)) {
    setNestedValue(result, path, value);
  }

  return result;
}
