/**
 * @ext-ts/core – utility functions
 *
 * Pure, side-effect-free helpers (except timer wrappers and generateId).
 * Every function is individually exported so tree-shaking works out of the box.
 */

// ---------------------------------------------------------------------------
// identity / emptyFn
// ---------------------------------------------------------------------------

/**
 * Returns the value unchanged. Useful as a default transform or callback.
 */
export function identity<T>(value: T): T {
  return value;
}

/**
 * A reusable no-op function.
 */
export function emptyFn(): void {
  /* intentionally blank */
}

// ---------------------------------------------------------------------------
// apply / applyIf
// ---------------------------------------------------------------------------

/**
 * Copies **own** enumerable properties from `source` to `target`,
 * but only when the property does **not** already exist on `target`
 * (checked via the `in` operator so even `undefined` values are preserved).
 *
 * Returns the mutated `target`.
 */
export function applyIf<T extends object>(target: T, source: Partial<T>): T {
  const keys = Object.keys(source) as (keyof T)[];
  for (const key of keys) {
    if (!(key in target)) {
      (target as Record<keyof T, unknown>)[key] = source[key];
    }
  }
  return target;
}

/**
 * Copies **own** enumerable properties from every `source` to `target`,
 * overwriting any existing values.  Sources are applied left-to-right so
 * later sources win.
 *
 * Returns the mutated `target`.
 */
export function apply<T extends object>(target: T, ...sources: Partial<T>[]): T {
  for (const source of sources) {
    const keys = Object.keys(source) as (keyof T)[];
    for (const key of keys) {
      (target as Record<keyof T, unknown>)[key] = source[key];
    }
  }
  return target;
}

// ---------------------------------------------------------------------------
// clone
// ---------------------------------------------------------------------------

/**
 * Deep-clones `value` using the platform's `structuredClone`.
 */
export function clone<T>(value: T): T {
  return structuredClone(value);
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

/**
 * `true` for plain objects only — `{}`, `Object.create(null)`, and objects
 * whose prototype is `Object.prototype`.  Returns `false` for arrays,
 * functions, `null`, class instances (`Date`, `RegExp`, …), and primitives.
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * `true` for primitive `string` values only (not `String` wrapper objects).
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * `true` for finite numbers and `±Infinity`.  Explicitly **excludes** `NaN`.
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/**
 * `true` for primitive `boolean` values only (not `Boolean` wrapper objects).
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * `true` for any callable — arrows, named functions, async functions,
 * generators, and class constructors.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

/**
 * Thin wrapper around `Array.isArray` with an `unknown[]` return type.
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * `true` when `value` is neither `undefined` nor `null`.
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * `true` for values that are conceptually "empty":
 * `undefined`, `null`, `''`, `[]`, `{}` (plain, no own keys), and `NaN`.
 */
export function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'number') return Number.isNaN(value);
  if (typeof value === 'string') return value.length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  return false;
}

/**
 * `true` when `value` implements the iterable protocol (`Symbol.iterator`).
 * Returns `false` for `null`, `undefined`, and non-iterable objects.
 */
export function isIterable(value: unknown): value is Iterable<unknown> {
  if (value === null || value === undefined) return false;
  return typeof (value as Iterable<unknown>)[Symbol.iterator] === 'function';
}

/**
 * `true` for all seven primitive types:
 * `string`, `number`, `boolean`, `undefined`, `null`, `symbol`, and `bigint`.
 */
export function isPrimitive(value: unknown): boolean {
  if (value === null) return true;
  const t = typeof value;
  return t !== 'object' && t !== 'function';
}

// ---------------------------------------------------------------------------
// namespace
// ---------------------------------------------------------------------------

/**
 * Walks (and lazily creates) a dot-separated namespace on `root`.
 *
 * ```ts
 * const root = {};
 * namespace(root, 'a.b.c'); // root is now { a: { b: { c: {} } } }
 * ```
 *
 * Existing intermediate objects are preserved; only missing segments are
 * created as empty plain objects.  Returns the **leaf** object.
 */
export function namespace(root: object, path: string): object {
  const segments = path.split('.');
  let current: Record<string, unknown> = root as Record<string, unknown>;

  for (const segment of segments) {
    if (current[segment] === undefined || current[segment] === null) {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
  }

  return current;
}

// ---------------------------------------------------------------------------
// Timer helpers
// ---------------------------------------------------------------------------

/**
 * Wrapper around `setTimeout` that returns the numeric timer id.
 */
export function defer(fn: () => void, millis = 0): number {
  return +setTimeout(fn, millis);
}

/**
 * Wrapper around `setInterval` that returns the numeric timer id.
 */
export function interval(fn: () => void, millis: number): number {
  return +setInterval(fn, millis);
}

/**
 * High-resolution timestamp via `performance.now()`.
 */
export function now(): number {
  return performance.now();
}

// ---------------------------------------------------------------------------
// generateId
// ---------------------------------------------------------------------------

let idCounter = 0;

/**
 * Generates a globally-unique ID string.  The counter is monotonically
 * increasing across all prefixes.
 *
 * ```ts
 * generateId();          // "ext-ts-1"
 * generateId();          // "ext-ts-2"
 * generateId('widget');  // "widget-3"
 * ```
 */
export function generateId(prefix = 'ext-ts'): string {
  return `${prefix}-${++idCounter}`;
}
