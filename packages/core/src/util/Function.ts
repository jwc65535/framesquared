/**
 * @ext-ts/core – Function utilities
 */

/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// bind
// ---------------------------------------------------------------------------

/**
 * Binds `fn` to `scope` with optional pre-filled arguments.
 */
export function bind<T extends Function>(
  fn: T,
  scope: unknown,
  ...args: unknown[]
): T {
  return ((...callArgs: unknown[]) =>
    fn.apply(scope, [...args, ...callArgs])) as unknown as T;
}

// ---------------------------------------------------------------------------
// createBuffered (debounce)
// ---------------------------------------------------------------------------

/**
 * Returns a function that delays invoking `fn` until `buffer` milliseconds
 * have elapsed since the **last** call.  Each new call resets the timer
 * (classic debounce).
 */
export function createBuffered(
  fn: Function,
  buffer: number,
  scope?: unknown,
): (...args: unknown[]) => void {
  let timerId: ReturnType<typeof setTimeout> | undefined;

  return function (this: unknown, ...args: unknown[]) {
    if (timerId !== undefined) clearTimeout(timerId);
    const ctx = scope ?? this;
    timerId = setTimeout(() => {
      fn.apply(ctx, args);
      timerId = undefined;
    }, buffer);
  };
}

// ---------------------------------------------------------------------------
// createDelayed
// ---------------------------------------------------------------------------

/**
 * Returns a function that always delays invoking `fn` by `delay` ms.
 * Each call schedules its **own** independent timer (unlike debounce).
 */
export function createDelayed(
  fn: Function,
  delay: number,
  scope?: unknown,
): (...args: unknown[]) => void {
  return function (this: unknown, ...args: unknown[]) {
    const ctx = scope ?? this;
    setTimeout(() => fn.apply(ctx, args), delay);
  };
}

// ---------------------------------------------------------------------------
// createThrottled
// ---------------------------------------------------------------------------

/**
 * Returns a function that invokes `fn` at most once per `intervalMs`
 * milliseconds.  The first call executes immediately.
 */
export function createThrottled(
  fn: Function,
  intervalMs: number,
  scope?: unknown,
): (...args: unknown[]) => void {
  let lastCall = 0;

  return function (this: unknown, ...args: unknown[]) {
    const ctx = scope ?? this;
    const elapsed = Date.now() - lastCall;
    if (elapsed >= intervalMs) {
      lastCall = Date.now();
      fn.apply(ctx, args);
    }
  };
}

// ---------------------------------------------------------------------------
// createBarrier
// ---------------------------------------------------------------------------

/**
 * Returns a function that only invokes `fn` once the returned function has
 * been called exactly `count` times.  Subsequent calls are no-ops.
 */
export function createBarrier(
  count: number,
  fn: Function,
  scope?: unknown,
): (...args: unknown[]) => void {
  let remaining = count;
  let fired = false;

  return function (this: unknown, ...args: unknown[]) {
    if (fired) return;
    remaining--;
    if (remaining <= 0) {
      fired = true;
      const ctx = scope ?? this;
      fn.apply(ctx, args);
    }
  };
}

// ---------------------------------------------------------------------------
// interceptBefore / interceptAfter
// ---------------------------------------------------------------------------

/**
 * Replaces `obj[methodName]` with a wrapper that calls `fn` **before** the
 * original method.  `fn` receives the same arguments as the original.
 */
export function interceptBefore(
  obj: object,
  methodName: string,
  fn: Function,
): void {
  const rec = obj as Record<string, Function>;
  const original = rec[methodName];

  rec[methodName] = function (this: unknown, ...args: unknown[]) {
    fn.apply(this, args);
    return original.apply(this, args);
  };
}

/**
 * Replaces `obj[methodName]` with a wrapper that calls `fn` **after** the
 * original method.  `fn` receives the original method's return value as its
 * single argument.  The wrapper still returns the original return value.
 */
export function interceptAfter(
  obj: object,
  methodName: string,
  fn: Function,
): void {
  const rec = obj as Record<string, Function>;
  const original = rec[methodName];

  rec[methodName] = function (this: unknown, ...args: unknown[]) {
    const result = original.apply(this, args);
    fn.call(this, result);
    return result;
  };
}

// ---------------------------------------------------------------------------
// createSequence
// ---------------------------------------------------------------------------

/**
 * Returns a function that calls every function in `fns` in order, passing
 * all received arguments to each.
 */
export function createSequence(
  ...fns: Function[]
): (...args: unknown[]) => void {
  return (...args: unknown[]) => {
    for (const fn of fns) {
      fn(...args);
    }
  };
}

// ---------------------------------------------------------------------------
// memoize
// ---------------------------------------------------------------------------

/**
 * Returns a memoized version of `fn`.  By default the first argument
 * (stringified) is used as the cache key.  Supply a `hasher` for
 * multi-argument or non-primitive keys.
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  hasher?: (...args: Parameters<T>) => string,
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = hasher ? hasher(...args) : String(args[0]);
    if (cache.has(key)) return cache.get(key) as ReturnType<T>;
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}

// ---------------------------------------------------------------------------
// once
// ---------------------------------------------------------------------------

/**
 * Returns a function that invokes `fn` at most once.  Subsequent calls
 * return the result of the first invocation.
 */
export function once<T extends (...args: any[]) => any>(fn: T): T {
  let called = false;
  let result: ReturnType<T>;

  return ((...args: Parameters<T>): ReturnType<T> => {
    if (!called) {
      called = true;
      result = fn(...args) as ReturnType<T>;
    }
    return result;
  }) as T;
}

// ---------------------------------------------------------------------------
// negate
// ---------------------------------------------------------------------------

/**
 * Returns a function that negates the boolean return value of `fn`.
 */
export function negate<T extends (...args: any[]) => boolean>(fn: T): T {
  return ((...args: Parameters<T>): boolean => !fn(...args)) as unknown as T;
}

// ---------------------------------------------------------------------------
// compose / pipe
// ---------------------------------------------------------------------------

/**
 * Right-to-left function composition.
 * `compose(f, g, h)(x)` is equivalent to `f(g(h(x)))`.
 */
export function compose(
  ...fns: Function[]
): (...args: unknown[]) => unknown {
  return (...args: unknown[]) => {
    let result: unknown = fns[fns.length - 1](...args);
    for (let i = fns.length - 2; i >= 0; i--) {
      result = fns[i](result);
    }
    return result;
  };
}

/**
 * Left-to-right function composition (aka pipeline).
 * `pipe(f, g, h)(x)` is equivalent to `h(g(f(x)))`.
 */
export function pipe(
  ...fns: Function[]
): (...args: unknown[]) => unknown {
  return (...args: unknown[]) => {
    let result: unknown = fns[0](...args);
    for (let i = 1; i < fns.length; i++) {
      result = fns[i](result);
    }
    return result;
  };
}
