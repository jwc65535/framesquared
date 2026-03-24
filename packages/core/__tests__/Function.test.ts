import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  bind,
  createBuffered,
  createDelayed,
  createThrottled,
  createBarrier,
  interceptBefore,
  interceptAfter,
  createSequence,
  memoize,
  once,
  negate,
  compose,
  pipe,
} from '../src/util/Function.js';

// ---------------------------------------------------------------------------
// bind
// ---------------------------------------------------------------------------
describe('bind', () => {
  it('binds scope (this)', () => {
    const scope = { name: 'ctx' };
    function greet(this: { name: string }) {
      return this.name;
    }
    const bound = bind(greet, scope);
    expect(bound()).toBe('ctx');
  });

  it('pre-fills arguments', () => {
    function add(a: number, b: number) {
      return a + b;
    }
    const add5 = bind(add, null, 5);
    expect(add5(3)).toBe(8);
  });

  it('combines scope and pre-filled args', () => {
    const scope = { factor: 10 };
    function multiply(this: { factor: number }, v: number) {
      return this.factor * v;
    }
    const fn = bind(multiply, scope);
    expect(fn(3)).toBe(30);
  });

  it('returns a function', () => {
    expect(typeof bind(() => {}, null)).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// createBuffered (debounce)
// ---------------------------------------------------------------------------
describe('createBuffered', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays execution by the buffer time', () => {
    const spy = vi.fn();
    const buffered = createBuffered(spy, 100);
    buffered();
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('resets the timer on subsequent calls', () => {
    const spy = vi.fn();
    const buffered = createBuffered(spy, 100);
    buffered();
    vi.advanceTimersByTime(80);
    buffered(); // reset
    vi.advanceTimersByTime(80);
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(20);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('applies scope', () => {
    const scope = { v: 42 };
    function fn(this: { v: number }) {
      return this.v;
    }
    const spy = vi.fn(fn);
    const buffered = createBuffered(spy, 50, scope);
    buffered();
    vi.advanceTimersByTime(50);
    expect(spy.mock.instances[0]).toBe(scope);
  });

  it('passes arguments from the last call', () => {
    const spy = vi.fn();
    const buffered = createBuffered(spy, 50);
    buffered('first');
    buffered('second');
    vi.advanceTimersByTime(50);
    expect(spy).toHaveBeenCalledWith('second');
  });

  it('executes only once if called many times within the buffer', () => {
    const spy = vi.fn();
    const buffered = createBuffered(spy, 100);
    for (let i = 0; i < 10; i++) {
      buffered();
      vi.advanceTimersByTime(50);
    }
    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// createDelayed
// ---------------------------------------------------------------------------
describe('createDelayed', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays execution by the specified time', () => {
    const spy = vi.fn();
    const delayed = createDelayed(spy, 100);
    delayed();
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('does NOT reset the timer on subsequent calls (each call is independent)', () => {
    const spy = vi.fn();
    const delayed = createDelayed(spy, 100);
    delayed();
    vi.advanceTimersByTime(50);
    delayed(); // second call — schedules a new independent timer
    vi.advanceTimersByTime(50);
    // First call fires at t=100
    expect(spy).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(50);
    // Second call fires at t=150
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('applies scope', () => {
    const scope = { v: 7 };
    const spy = vi.fn(function (this: { v: number }) {
      return this.v;
    });
    const delayed = createDelayed(spy, 50, scope);
    delayed();
    vi.advanceTimersByTime(50);
    expect(spy.mock.instances[0]).toBe(scope);
  });

  it('passes arguments', () => {
    const spy = vi.fn();
    const delayed = createDelayed(spy, 50);
    delayed('a', 'b');
    vi.advanceTimersByTime(50);
    expect(spy).toHaveBeenCalledWith('a', 'b');
  });
});

// ---------------------------------------------------------------------------
// createThrottled
// ---------------------------------------------------------------------------
describe('createThrottled', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes immediately on the first call', () => {
    const spy = vi.fn();
    const throttled = createThrottled(spy, 100);
    throttled();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('suppresses calls within the interval', () => {
    const spy = vi.fn();
    const throttled = createThrottled(spy, 100);
    throttled();
    throttled(); // suppressed
    throttled(); // suppressed
    expect(spy).toHaveBeenCalledOnce();
  });

  it('allows another call after the interval has elapsed', () => {
    const spy = vi.fn();
    const throttled = createThrottled(spy, 100);
    throttled();
    vi.advanceTimersByTime(100);
    throttled();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('applies scope', () => {
    const scope = { v: 1 };
    const spy = vi.fn(function (this: { v: number }) {
      return this.v;
    });
    const throttled = createThrottled(spy, 100, scope);
    throttled();
    expect(spy.mock.instances[0]).toBe(scope);
  });

  it('passes arguments from the current call', () => {
    const spy = vi.fn();
    const throttled = createThrottled(spy, 100);
    throttled('hello');
    expect(spy).toHaveBeenCalledWith('hello');
  });
});

// ---------------------------------------------------------------------------
// createBarrier
// ---------------------------------------------------------------------------
describe('createBarrier', () => {
  it('does not call fn until the barrier count is reached', () => {
    const spy = vi.fn();
    const barrier = createBarrier(3, spy);
    barrier();
    barrier();
    expect(spy).not.toHaveBeenCalled();
  });

  it('calls fn on the Nth invocation', () => {
    const spy = vi.fn();
    const barrier = createBarrier(3, spy);
    barrier();
    barrier();
    barrier();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('does not call fn again after the barrier has been reached', () => {
    const spy = vi.fn();
    const barrier = createBarrier(2, spy);
    barrier();
    barrier();
    barrier();
    barrier();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('applies scope', () => {
    const scope = { v: 1 };
    const spy = vi.fn(function (this: { v: number }) {
      return this.v;
    });
    const barrier = createBarrier(1, spy, scope);
    barrier();
    expect(spy.mock.instances[0]).toBe(scope);
  });

  it('fires immediately when count is 1', () => {
    const spy = vi.fn();
    const barrier = createBarrier(1, spy);
    barrier();
    expect(spy).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// interceptBefore
// ---------------------------------------------------------------------------
describe('interceptBefore', () => {
  it('runs the interceptor before the original method', () => {
    const order: string[] = [];
    const obj = {
      greet() {
        order.push('original');
        return 'hello';
      },
    };
    interceptBefore(obj, 'greet', () => {
      order.push('before');
    });
    obj.greet();
    expect(order).toEqual(['before', 'original']);
  });

  it('passes arguments to the interceptor', () => {
    const spy = vi.fn();
    const obj = {
      add(a: number, b: number) {
        return a + b;
      },
    };
    interceptBefore(obj, 'add', spy);
    obj.add(1, 2);
    expect(spy).toHaveBeenCalledWith(1, 2);
  });

  it('preserves the original return value', () => {
    const obj = {
      value() {
        return 42;
      },
    };
    interceptBefore(obj, 'value', () => {});
    expect(obj.value()).toBe(42);
  });

  it('can be stacked (multiple before interceptors)', () => {
    const order: string[] = [];
    const obj = {
      run() {
        order.push('original');
      },
    };
    interceptBefore(obj, 'run', () => order.push('first'));
    interceptBefore(obj, 'run', () => order.push('second'));
    obj.run();
    expect(order).toEqual(['second', 'first', 'original']);
  });
});

// ---------------------------------------------------------------------------
// interceptAfter
// ---------------------------------------------------------------------------
describe('interceptAfter', () => {
  it('runs the interceptor after the original method', () => {
    const order: string[] = [];
    const obj = {
      greet() {
        order.push('original');
        return 'hello';
      },
    };
    interceptAfter(obj, 'greet', () => {
      order.push('after');
    });
    obj.greet();
    expect(order).toEqual(['original', 'after']);
  });

  it('passes the original return value to the interceptor', () => {
    const spy = vi.fn();
    const obj = {
      value() {
        return 42;
      },
    };
    interceptAfter(obj, 'value', spy);
    obj.value();
    expect(spy).toHaveBeenCalledWith(42);
  });

  it('preserves the original return value', () => {
    const obj = {
      value() {
        return 42;
      },
    };
    interceptAfter(obj, 'value', () => 'ignored');
    expect(obj.value()).toBe(42);
  });

  it('can be stacked', () => {
    const order: string[] = [];
    const obj = {
      run() {
        order.push('original');
      },
    };
    interceptAfter(obj, 'run', () => order.push('first'));
    interceptAfter(obj, 'run', () => order.push('second'));
    obj.run();
    expect(order).toEqual(['original', 'first', 'second']);
  });
});

// ---------------------------------------------------------------------------
// createSequence
// ---------------------------------------------------------------------------
describe('createSequence', () => {
  it('calls all functions in order', () => {
    const order: number[] = [];
    const seq = createSequence(
      () => order.push(1),
      () => order.push(2),
      () => order.push(3),
    );
    seq();
    expect(order).toEqual([1, 2, 3]);
  });

  it('passes arguments to each function', () => {
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    const seq = createSequence(spy1, spy2);
    seq('a', 'b');
    expect(spy1).toHaveBeenCalledWith('a', 'b');
    expect(spy2).toHaveBeenCalledWith('a', 'b');
  });

  it('returns undefined', () => {
    const seq = createSequence(() => 1, () => 2);
    expect(seq()).toBeUndefined();
  });

  it('handles zero functions', () => {
    const seq = createSequence();
    expect(() => seq()).not.toThrow();
  });

  it('handles a single function', () => {
    const spy = vi.fn();
    const seq = createSequence(spy);
    seq();
    expect(spy).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// memoize
// ---------------------------------------------------------------------------
describe('memoize', () => {
  it('returns cached result for the same arguments', () => {
    let callCount = 0;
    const expensive = (n: number) => {
      callCount++;
      return n * 2;
    };
    const memo = memoize(expensive);
    expect(memo(5)).toBe(10);
    expect(memo(5)).toBe(10);
    expect(callCount).toBe(1);
  });

  it('recomputes for different arguments', () => {
    let callCount = 0;
    const fn = (n: number) => {
      callCount++;
      return n + 1;
    };
    const memo = memoize(fn);
    expect(memo(1)).toBe(2);
    expect(memo(2)).toBe(3);
    expect(callCount).toBe(2);
  });

  it('uses the first argument as default cache key', () => {
    const fn = (a: number, b: number) => a + b;
    const memo = memoize(fn);
    expect(memo(1, 2)).toBe(3);
    // Same first arg → cache hit, even though second arg differs
    expect(memo(1, 100)).toBe(3);
  });

  it('uses a custom hasher for the cache key', () => {
    let callCount = 0;
    const fn = (a: number, b: number) => {
      callCount++;
      return a + b;
    };
    const memo = memoize(fn, (a, b) => `${a},${b}`);
    expect(memo(1, 2)).toBe(3);
    expect(memo(1, 2)).toBe(3);
    expect(callCount).toBe(1);
    expect(memo(1, 3)).toBe(4);
    expect(callCount).toBe(2);
  });

  it('caches undefined/null return values', () => {
    let callCount = 0;
    const fn = () => {
      callCount++;
      return undefined;
    };
    const memo = memoize(fn);
    expect(memo()).toBeUndefined();
    expect(memo()).toBeUndefined();
    expect(callCount).toBe(1);
  });

  it('handles string arguments as cache keys', () => {
    let callCount = 0;
    const fn = (s: string) => {
      callCount++;
      return s.toUpperCase();
    };
    const memo = memoize(fn);
    expect(memo('hello')).toBe('HELLO');
    expect(memo('hello')).toBe('HELLO');
    expect(callCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// once
// ---------------------------------------------------------------------------
describe('once', () => {
  it('calls the function only once', () => {
    let callCount = 0;
    const fn = once(() => {
      callCount++;
      return 42;
    });
    expect(fn()).toBe(42);
    expect(fn()).toBe(42);
    expect(fn()).toBe(42);
    expect(callCount).toBe(1);
  });

  it('returns the first result on subsequent calls', () => {
    let counter = 0;
    const fn = once(() => ++counter);
    expect(fn()).toBe(1);
    expect(fn()).toBe(1);
  });

  it('handles void functions', () => {
    const spy = vi.fn();
    const fn = once(spy);
    fn();
    fn();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('passes arguments on the first call', () => {
    const fn = once((a: number, b: number) => a + b);
    expect(fn(1, 2)).toBe(3);
    expect(fn(10, 20)).toBe(3); // still returns first result
  });
});

// ---------------------------------------------------------------------------
// negate
// ---------------------------------------------------------------------------
describe('negate', () => {
  it('negates a predicate', () => {
    const isEven = (n: number) => n % 2 === 0;
    const isOdd = negate(isEven);
    expect(isOdd(2)).toBe(false);
    expect(isOdd(3)).toBe(true);
  });

  it('negates true to false', () => {
    const alwaysTrue = () => true;
    const fn = negate(alwaysTrue);
    expect(fn()).toBe(false);
  });

  it('negates false to true', () => {
    const alwaysFalse = () => false;
    const fn = negate(alwaysFalse);
    expect(fn()).toBe(true);
  });

  it('passes arguments through', () => {
    const startsWith = (s: string, prefix: string) => s.startsWith(prefix);
    const doesNotStartWith = negate(startsWith);
    expect(doesNotStartWith('hello', 'he')).toBe(false);
    expect(doesNotStartWith('hello', 'xy')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// compose (right-to-left)
// ---------------------------------------------------------------------------
describe('compose', () => {
  it('composes right-to-left', () => {
    const add1 = (n: number) => n + 1;
    const double = (n: number) => n * 2;
    const composed = compose(add1, double);
    // double(3) = 6 → add1(6) = 7
    expect(composed(3)).toBe(7);
  });

  it('handles a single function', () => {
    const add1 = (n: number) => n + 1;
    expect(compose(add1)(5)).toBe(6);
  });

  it('handles three functions', () => {
    const add1 = (n: number) => n + 1;
    const double = (n: number) => n * 2;
    const square = (n: number) => n * n;
    // square(2)=4, double(4)=8, add1(8)=9
    const composed = compose(add1, double, square);
    expect(composed(2)).toBe(9);
  });

  it('passes arguments to the rightmost function', () => {
    const sum = (a: number, b: number) => a + b;
    const double = (n: number) => n * 2;
    const composed = compose(double, sum);
    expect(composed(3, 4)).toBe(14); // sum(3,4)=7, double(7)=14
  });
});

// ---------------------------------------------------------------------------
// pipe (left-to-right)
// ---------------------------------------------------------------------------
describe('pipe', () => {
  it('composes left-to-right', () => {
    const add1 = (n: number) => n + 1;
    const double = (n: number) => n * 2;
    const piped = pipe(add1, double);
    // add1(3) = 4 → double(4) = 8
    expect(piped(3)).toBe(8);
  });

  it('handles a single function', () => {
    const add1 = (n: number) => n + 1;
    expect(pipe(add1)(5)).toBe(6);
  });

  it('handles three functions', () => {
    const add1 = (n: number) => n + 1;
    const double = (n: number) => n * 2;
    const square = (n: number) => n * n;
    // add1(2)=3, double(3)=6, square(6)=36
    const piped = pipe(add1, double, square);
    expect(piped(2)).toBe(36);
  });

  it('is the reverse of compose', () => {
    const add1 = (n: number) => n + 1;
    const double = (n: number) => n * 2;
    expect(pipe(add1, double)(5)).toBe(compose(double, add1)(5));
  });

  it('passes arguments to the leftmost function', () => {
    const sum = (a: number, b: number) => a + b;
    const double = (n: number) => n * 2;
    const piped = pipe(sum, double);
    expect(piped(3, 4)).toBe(14);
  });
});
