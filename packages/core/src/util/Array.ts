/**
 * @framesquared/core – Array utilities
 */

// ---------------------------------------------------------------------------
// from
// ---------------------------------------------------------------------------

/**
 * Normalizes a value to an array.
 *
 * - If already an array, returns it as-is (same reference).
 * - If an iterable (but not a string), spreads it into a new array.
 * - Otherwise wraps it in a single-element array.
 *
 * Strings are intentionally *not* spread into characters — `from("hi")`
 * returns `["hi"]`, not `["h","i"]`.
 */
export function from<T>(value: T | T[] | Iterable<T>): T[] {
  if (Array.isArray(value)) return value as T[];
  // Exclude strings: they are iterable but we want to wrap, not spread.
  if (
    typeof value !== 'string' &&
    value != null &&
    typeof (value as Iterable<T>)[Symbol.iterator] === 'function'
  ) {
    return [...(value as Iterable<T>)];
  }
  return [value as T];
}

// ---------------------------------------------------------------------------
// contains / include / remove
// ---------------------------------------------------------------------------

/**
 * Returns `true` if `array` contains `item`, using `Array.prototype.includes`
 * (which handles `NaN`).
 */
export function contains<T>(array: T[], item: T): boolean {
  return array.includes(item);
}

/**
 * Adds `item` to `array` if it is not already present.  Mutates and returns
 * the same array reference.
 */
export function include<T>(array: T[], item: T): T[] {
  if (!array.includes(item)) {
    array.push(item);
  }
  return array;
}

/**
 * Removes the **first** occurrence of `item` from `array`.  Mutates and
 * returns the same array reference.
 */
export function remove<T>(array: T[], item: T): T[] {
  const idx = array.indexOf(item);
  if (idx !== -1) {
    array.splice(idx, 1);
  }
  return array;
}

// ---------------------------------------------------------------------------
// clean / unique
// ---------------------------------------------------------------------------

/**
 * Returns a **new** array with all `null` and `undefined` entries removed.
 */
export function clean<T>(array: (T | null | undefined)[]): T[] {
  return array.filter((v): v is T => v !== null && v !== undefined);
}

/**
 * Returns a **new** array with duplicate values removed, preserving the order
 * of first occurrence.  Uses a `Set` (strict/reference equality).
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

// ---------------------------------------------------------------------------
// flatten
// ---------------------------------------------------------------------------

/**
 * Flattens one level deep: `[1, [2, 3], 4]` → `[1, 2, 3, 4]`.
 * Does **not** recurse into deeper nesting.
 */
export function flatten<T>(array: (T | T[])[]): T[] {
  const result: T[] = [];
  for (const item of array) {
    if (Array.isArray(item)) {
      result.push(...(item as T[]));
    } else {
      result.push(item as T);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// pluck
// ---------------------------------------------------------------------------

/**
 * Extracts the value of `key` from every element.
 */
export function pluck<T, K extends keyof T>(array: T[], key: K): T[K][] {
  return array.map((item) => item[key]);
}

// ---------------------------------------------------------------------------
// Numeric aggregates
// ---------------------------------------------------------------------------

/**
 * Returns the sum of all elements.  Returns `0` for an empty array.
 */
export function sum(array: number[]): number {
  let total = 0;
  for (const n of array) total += n;
  return total;
}

/**
 * Returns the arithmetic mean.  Returns `NaN` for an empty array.
 */
export function mean(array: number[]): number {
  if (array.length === 0) return NaN;
  return sum(array) / array.length;
}

// ---------------------------------------------------------------------------
// min / max
// ---------------------------------------------------------------------------

/**
 * Returns the minimum element.  When no `compareFn` is given, uses `<`.
 * Throws if the array is empty.
 */
export function min<T>(array: T[], compareFn?: (a: T, b: T) => number): T {
  if (array.length === 0) throw new Error('min() requires a non-empty array');
  const cmp = compareFn ?? defaultCompare;
  let result = array[0];
  for (let i = 1; i < array.length; i++) {
    if (cmp(array[i], result) < 0) result = array[i];
  }
  return result;
}

/**
 * Returns the maximum element.  When no `compareFn` is given, uses `<`.
 * Throws if the array is empty.
 */
export function max<T>(array: T[], compareFn?: (a: T, b: T) => number): T {
  if (array.length === 0) throw new Error('max() requires a non-empty array');
  const cmp = compareFn ?? defaultCompare;
  let result = array[0];
  for (let i = 1; i < array.length; i++) {
    if (cmp(array[i], result) > 0) result = array[i];
  }
  return result;
}

function defaultCompare<T>(a: T, b: T): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

// ---------------------------------------------------------------------------
// groupBy / partition
// ---------------------------------------------------------------------------

/**
 * Groups elements by the string/number key returned by `fn`.
 */
export function groupBy<T, K extends string | number>(
  array: T[],
  fn: (item: T) => K,
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  for (const item of array) {
    const key = fn(item);
    if (result[key] === undefined) {
      result[key] = [];
    }
    result[key].push(item);
  }
  return result;
}

/**
 * Splits an array into two: elements that satisfy the predicate and those
 * that don't.
 */
export function partition<T>(
  array: T[],
  predicate: (item: T) => boolean,
): [T[], T[]] {
  const yes: T[] = [];
  const no: T[] = [];
  for (const item of array) {
    (predicate(item) ? yes : no).push(item);
  }
  return [yes, no];
}

// ---------------------------------------------------------------------------
// chunk
// ---------------------------------------------------------------------------

/**
 * Splits `array` into chunks of at most `size` elements.
 * Throws if `size` is ≤ 0.
 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) throw new Error('chunk() requires a positive size');
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Set operations
// ---------------------------------------------------------------------------

/**
 * Returns elements in `array1` that are **not** in `array2`.
 */
export function difference<T>(array1: T[], array2: T[]): T[] {
  const set = new Set(array2);
  return array1.filter((item) => !set.has(item));
}

/**
 * Returns elements that appear in **both** `array1` and `array2`, preserving
 * order from `array1`.  Each value appears at most once in the result.
 */
export function intersection<T>(array1: T[], array2: T[]): T[] {
  const set = new Set(array2);
  return unique(array1.filter((item) => set.has(item)));
}

// ---------------------------------------------------------------------------
// sortBy
// ---------------------------------------------------------------------------

/**
 * Returns a **new** sorted array.  `key` may be a property name or an
 * accessor function.  Default direction is `'ASC'`.
 */
export function sortBy<T>(
  array: T[],
  key: keyof T | ((item: T) => unknown),
  direction: 'ASC' | 'DESC' = 'ASC',
): T[] {
  const accessor: (item: T) => unknown =
    typeof key === 'function' ? key : (item: T) => item[key as keyof T];
  const dir = direction === 'DESC' ? -1 : 1;
  return [...array].sort((a, b) => {
    const va = accessor(a) as string | number;
    const vb = accessor(b) as string | number;
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });
}

// ---------------------------------------------------------------------------
// findBy
// ---------------------------------------------------------------------------

/**
 * Returns the first element for which `fn` returns `true`, or `undefined`.
 */
export function findBy<T>(array: T[], fn: (item: T) => boolean): T | undefined {
  return array.find(fn);
}

// ---------------------------------------------------------------------------
// range
// ---------------------------------------------------------------------------

/**
 * Generates a half-open range `[start, end)` with the given `step`
 * (default `1`).  A negative step produces a descending range.
 * Throws if `step` is `0`.
 */
export function range(start: number, end: number, step = 1): number[] {
  if (step === 0) throw new Error('range() step must not be zero');

  const result: number[] = [];
  if (step > 0) {
    for (let i = start; i < end; i += step) result.push(i);
  } else {
    for (let i = start; i > end; i += step) result.push(i);
  }
  return result;
}
