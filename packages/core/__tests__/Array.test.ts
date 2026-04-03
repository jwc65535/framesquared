import { describe, it, expect } from 'vitest';
import {
  from,
  contains,
  include,
  remove,
  clean,
  unique,
  flatten,
  pluck,
  sum,
  mean,
  min,
  max,
  groupBy,
  partition,
  chunk,
  difference,
  intersection,
  sortBy,
  findBy,
  range,
} from '../src/util/Array.js';

// ---------------------------------------------------------------------------
// from
// ---------------------------------------------------------------------------
describe('from', () => {
  it('wraps a single value in an array', () => {
    expect(from(42)).toEqual([42]);
  });

  it('returns the same array if already an array', () => {
    const arr = [1, 2, 3];
    expect(from(arr)).toBe(arr);
  });

  it('converts a Set to an array', () => {
    const result = from(new Set([1, 2, 3]));
    expect(result).toEqual([1, 2, 3]);
  });

  it('converts a Map to an array of entries', () => {
    const map = new Map([['a', 1]]);
    const result = from(map);
    expect(result).toEqual([['a', 1]]);
  });

  it('converts a generator to an array', () => {
    function* gen() {
      yield 'a';
      yield 'b';
    }
    expect(from(gen())).toEqual(['a', 'b']);
  });

  it('wraps a string as a single-element array (not char split)', () => {
    expect(from('hello')).toEqual(['hello']);
  });

  it('wraps null/undefined as single-element arrays', () => {
    expect(from(null)).toEqual([null]);
    expect(from(undefined)).toEqual([undefined]);
  });

  it('wraps an object as a single-element array', () => {
    const obj = { a: 1 };
    expect(from(obj)).toEqual([obj]);
  });

  it('returns empty array for empty array input', () => {
    const arr: number[] = [];
    expect(from(arr)).toBe(arr);
    expect(from(arr)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// contains
// ---------------------------------------------------------------------------
describe('contains', () => {
  it('returns true when item is present', () => {
    expect(contains([1, 2, 3], 2)).toBe(true);
  });

  it('returns false when item is absent', () => {
    expect(contains([1, 2, 3], 4)).toBe(false);
  });

  it('uses strict equality', () => {
    expect(contains([1, 2, 3], '2' as unknown as number)).toBe(false);
  });

  it('finds NaN', () => {
    expect(contains([NaN, 1, 2], NaN)).toBe(true);
  });

  it('returns false for empty array', () => {
    expect(contains([], 1)).toBe(false);
  });

  it('finds objects by reference', () => {
    const obj = { a: 1 };
    expect(contains([obj], obj)).toBe(true);
    expect(contains([{ a: 1 }], obj)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// include
// ---------------------------------------------------------------------------
describe('include', () => {
  it('adds the item if not present', () => {
    const arr = [1, 2];
    const result = include(arr, 3);
    expect(result).toEqual([1, 2, 3]);
  });

  it('does not add the item if already present', () => {
    const arr = [1, 2, 3];
    const result = include(arr, 2);
    expect(result).toEqual([1, 2, 3]);
  });

  it('returns the same array reference', () => {
    const arr = [1, 2];
    expect(include(arr, 3)).toBe(arr);
  });

  it('works with an empty array', () => {
    const arr: number[] = [];
    expect(include(arr, 1)).toEqual([1]);
  });
});

// ---------------------------------------------------------------------------
// remove
// ---------------------------------------------------------------------------
describe('remove', () => {
  it('removes the first occurrence', () => {
    expect(remove([1, 2, 3, 2], 2)).toEqual([1, 3, 2]);
  });

  it('returns the same array reference', () => {
    const arr = [1, 2, 3];
    expect(remove(arr, 2)).toBe(arr);
  });

  it('does nothing when item is not found', () => {
    const arr = [1, 2, 3];
    remove(arr, 4);
    expect(arr).toEqual([1, 2, 3]);
  });

  it('works with empty array', () => {
    const arr: number[] = [];
    expect(remove(arr, 1)).toEqual([]);
  });

  it('handles removing the only element', () => {
    expect(remove([1], 1)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// clean
// ---------------------------------------------------------------------------
describe('clean', () => {
  it('removes null values', () => {
    expect(clean([1, null, 2])).toEqual([1, 2]);
  });

  it('removes undefined values', () => {
    expect(clean([1, undefined, 2])).toEqual([1, 2]);
  });

  it('removes both null and undefined', () => {
    expect(clean([null, 1, undefined, 2, null])).toEqual([1, 2]);
  });

  it('preserves falsy values that are not null/undefined', () => {
    expect(clean([0, '', false, null, undefined])).toEqual([0, '', false]);
  });

  it('returns empty array for all-null/undefined input', () => {
    expect(clean([null, undefined, null])).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(clean([])).toEqual([]);
  });

  it('does not mutate the original array', () => {
    const arr = [1, null, 2];
    clean(arr);
    expect(arr).toEqual([1, null, 2]);
  });
});

// ---------------------------------------------------------------------------
// unique
// ---------------------------------------------------------------------------
describe('unique', () => {
  it('removes duplicates', () => {
    expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
  });

  it('preserves order of first occurrence', () => {
    expect(unique([3, 1, 2, 1, 3])).toEqual([3, 1, 2]);
  });

  it('returns empty array for empty input', () => {
    expect(unique([])).toEqual([]);
  });

  it('handles all-unique input', () => {
    expect(unique([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('uses strict equality (reference for objects)', () => {
    const a = { v: 1 };
    const b = { v: 1 };
    expect(unique([a, b, a])).toEqual([a, b]);
  });

  it('does not mutate the original array', () => {
    const arr = [1, 2, 2];
    unique(arr);
    expect(arr).toEqual([1, 2, 2]);
  });
});

// ---------------------------------------------------------------------------
// flatten
// ---------------------------------------------------------------------------
describe('flatten', () => {
  it('flattens one level deep', () => {
    expect(flatten([1, [2, 3], 4])).toEqual([1, 2, 3, 4]);
  });

  it('does NOT flatten nested arrays beyond one level', () => {
    expect(flatten([[1, [2]]])).toEqual([1, [2]]);
  });

  it('returns empty array for empty input', () => {
    expect(flatten([])).toEqual([]);
  });

  it('handles mix of elements and arrays', () => {
    expect(flatten(['a', ['b', 'c'], 'd', ['e']])).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('handles all-flat input (no nesting)', () => {
    expect(flatten([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('does not mutate the original', () => {
    const arr = [1, [2, 3]];
    flatten(arr);
    expect(arr).toEqual([1, [2, 3]]);
  });
});

// ---------------------------------------------------------------------------
// pluck
// ---------------------------------------------------------------------------
describe('pluck', () => {
  it('extracts values by key', () => {
    const items = [
      { name: 'a', v: 1 },
      { name: 'b', v: 2 },
    ];
    expect(pluck(items, 'name')).toEqual(['a', 'b']);
  });

  it('returns undefined for missing keys', () => {
    const items = [{ a: 1 }, { b: 2 }] as { a?: number; b?: number }[];
    expect(pluck(items, 'a')).toEqual([1, undefined]);
  });

  it('returns empty array for empty input', () => {
    expect(pluck([], 'x' as never)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// sum
// ---------------------------------------------------------------------------
describe('sum', () => {
  it('sums numbers', () => {
    expect(sum([1, 2, 3, 4])).toBe(10);
  });

  it('returns 0 for empty array', () => {
    expect(sum([])).toBe(0);
  });

  it('handles negative numbers', () => {
    expect(sum([-1, -2, 3])).toBe(0);
  });

  it('handles single element', () => {
    expect(sum([42])).toBe(42);
  });

  it('handles floats', () => {
    expect(sum([0.1, 0.2])).toBeCloseTo(0.3);
  });
});

// ---------------------------------------------------------------------------
// mean
// ---------------------------------------------------------------------------
describe('mean', () => {
  it('computes the arithmetic mean', () => {
    expect(mean([2, 4, 6])).toBe(4);
  });

  it('returns NaN for empty array', () => {
    expect(mean([])).toBeNaN();
  });

  it('handles single element', () => {
    expect(mean([7])).toBe(7);
  });

  it('handles floats', () => {
    expect(mean([1, 2])).toBe(1.5);
  });
});

// ---------------------------------------------------------------------------
// min
// ---------------------------------------------------------------------------
describe('min', () => {
  it('returns the smallest number', () => {
    expect(min([3, 1, 2])).toBe(1);
  });

  it('uses a custom compare function', () => {
    const items = [{ v: 3 }, { v: 1 }, { v: 2 }];
    expect(min(items, (a, b) => a.v - b.v)).toEqual({ v: 1 });
  });

  it('returns the first element in a single-element array', () => {
    expect(min([42])).toBe(42);
  });

  it('throws for empty array', () => {
    expect(() => min([])).toThrow();
  });

  it('works with strings (lexicographic)', () => {
    expect(min(['banana', 'apple', 'cherry'])).toBe('apple');
  });
});

// ---------------------------------------------------------------------------
// max
// ---------------------------------------------------------------------------
describe('max', () => {
  it('returns the largest number', () => {
    expect(max([3, 1, 2])).toBe(3);
  });

  it('uses a custom compare function', () => {
    const items = [{ v: 3 }, { v: 1 }, { v: 2 }];
    expect(max(items, (a, b) => a.v - b.v)).toEqual({ v: 3 });
  });

  it('returns the first element in a single-element array', () => {
    expect(max([42])).toBe(42);
  });

  it('throws for empty array', () => {
    expect(() => max([])).toThrow();
  });

  it('works with strings', () => {
    expect(max(['banana', 'apple', 'cherry'])).toBe('cherry');
  });
});

// ---------------------------------------------------------------------------
// groupBy
// ---------------------------------------------------------------------------
describe('groupBy', () => {
  it('groups items by the key function', () => {
    const items = [
      { type: 'a', v: 1 },
      { type: 'b', v: 2 },
      { type: 'a', v: 3 },
    ];
    const result = groupBy(items, (i) => i.type);
    expect(result).toEqual({
      a: [
        { type: 'a', v: 1 },
        { type: 'a', v: 3 },
      ],
      b: [{ type: 'b', v: 2 }],
    });
  });

  it('returns empty object for empty array', () => {
    expect(groupBy([], () => 'x')).toEqual({});
  });

  it('handles numeric keys', () => {
    const result = groupBy([1, 2, 3, 4, 5], (n) => (n % 2 === 0 ? 0 : 1));
    expect(result).toEqual({
      0: [2, 4],
      1: [1, 3, 5],
    });
  });

  it('preserves insertion order within groups', () => {
    const items = ['cat', 'car', 'bat', 'bar'];
    const result = groupBy(items, (s) => s[0]);
    expect(result['c']).toEqual(['cat', 'car']);
    expect(result['b']).toEqual(['bat', 'bar']);
  });
});

// ---------------------------------------------------------------------------
// partition
// ---------------------------------------------------------------------------
describe('partition', () => {
  it('splits into matching and non-matching', () => {
    const [evens, odds] = partition([1, 2, 3, 4, 5], (n) => n % 2 === 0);
    expect(evens).toEqual([2, 4]);
    expect(odds).toEqual([1, 3, 5]);
  });

  it('returns two empty arrays for empty input', () => {
    const [a, b] = partition([], () => true);
    expect(a).toEqual([]);
    expect(b).toEqual([]);
  });

  it('all match → second array is empty', () => {
    const [yes, no] = partition([1, 2, 3], () => true);
    expect(yes).toEqual([1, 2, 3]);
    expect(no).toEqual([]);
  });

  it('none match → first array is empty', () => {
    const [yes, no] = partition([1, 2, 3], () => false);
    expect(yes).toEqual([]);
    expect(no).toEqual([1, 2, 3]);
  });
});

// ---------------------------------------------------------------------------
// chunk
// ---------------------------------------------------------------------------
describe('chunk', () => {
  it('splits into equal-sized chunks', () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('last chunk may be smaller', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns empty array for empty input', () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it('returns single chunk when size >= length', () => {
    expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
  });

  it('each element in its own chunk when size=1', () => {
    expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });

  it('throws for size <= 0', () => {
    expect(() => chunk([1, 2], 0)).toThrow();
    expect(() => chunk([1, 2], -1)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// difference
// ---------------------------------------------------------------------------
describe('difference', () => {
  it('returns elements in array1 not in array2', () => {
    expect(difference([1, 2, 3, 4], [2, 4])).toEqual([1, 3]);
  });

  it('returns all elements when array2 is empty', () => {
    expect(difference([1, 2, 3], [])).toEqual([1, 2, 3]);
  });

  it('returns empty array when array1 is empty', () => {
    expect(difference([], [1, 2])).toEqual([]);
  });

  it('returns empty array when arrays are identical', () => {
    expect(difference([1, 2], [1, 2])).toEqual([]);
  });

  it('handles duplicates in array1', () => {
    expect(difference([1, 1, 2, 2], [1])).toEqual([2, 2]);
  });

  it('uses strict equality', () => {
    const a = { v: 1 };
    const b = { v: 1 };
    expect(difference([a], [b])).toEqual([a]);
  });
});

// ---------------------------------------------------------------------------
// intersection
// ---------------------------------------------------------------------------
describe('intersection', () => {
  it('returns common elements', () => {
    expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
  });

  it('returns empty array when nothing in common', () => {
    expect(intersection([1, 2], [3, 4])).toEqual([]);
  });

  it('returns empty array when either input is empty', () => {
    expect(intersection([], [1, 2])).toEqual([]);
    expect(intersection([1, 2], [])).toEqual([]);
  });

  it('preserves order from array1', () => {
    expect(intersection([3, 2, 1], [1, 2])).toEqual([2, 1]);
  });

  it('does not include duplicates beyond what array1 has', () => {
    expect(intersection([1, 1, 2], [1, 2, 2])).toEqual([1, 2]);
  });

  it('uses strict equality', () => {
    const ref = { v: 1 };
    expect(intersection([ref, { v: 2 }], [ref])).toEqual([ref]);
  });
});

// ---------------------------------------------------------------------------
// sortBy
// ---------------------------------------------------------------------------
describe('sortBy', () => {
  it('sorts by a key (ascending by default)', () => {
    const items = [{ n: 3 }, { n: 1 }, { n: 2 }];
    expect(sortBy(items, 'n')).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
  });

  it('sorts descending when direction=DESC', () => {
    const items = [{ n: 1 }, { n: 3 }, { n: 2 }];
    expect(sortBy(items, 'n', 'DESC')).toEqual([{ n: 3 }, { n: 2 }, { n: 1 }]);
  });

  it('sorts by a function', () => {
    const items = [{ name: 'Banana' }, { name: 'Apple' }, { name: 'Cherry' }];
    expect(sortBy(items, (i) => i.name)).toEqual([
      { name: 'Apple' },
      { name: 'Banana' },
      { name: 'Cherry' },
    ]);
  });

  it('sorts by function descending', () => {
    expect(sortBy([3, 1, 2], (n) => n, 'DESC')).toEqual([3, 2, 1]);
  });

  it('returns a new array (does not mutate)', () => {
    const items = [{ n: 2 }, { n: 1 }];
    const sorted = sortBy(items, 'n');
    expect(sorted).not.toBe(items);
    expect(items).toEqual([{ n: 2 }, { n: 1 }]);
  });

  it('handles empty array', () => {
    expect(sortBy([], 'x' as never)).toEqual([]);
  });

  it('sorts strings correctly by key', () => {
    const items = [{ s: 'b' }, { s: 'a' }, { s: 'c' }];
    expect(sortBy(items, 's')).toEqual([{ s: 'a' }, { s: 'b' }, { s: 'c' }]);
  });
});

// ---------------------------------------------------------------------------
// findBy
// ---------------------------------------------------------------------------
describe('findBy', () => {
  it('returns the first matching element', () => {
    const items = [{ v: 1 }, { v: 2 }, { v: 3 }];
    expect(findBy(items, (i) => i.v === 2)).toEqual({ v: 2 });
  });

  it('returns undefined when nothing matches', () => {
    expect(findBy([1, 2, 3], (n) => n === 4)).toBeUndefined();
  });

  it('returns undefined for empty array', () => {
    expect(findBy([], () => true)).toBeUndefined();
  });

  it('returns the FIRST match, not the last', () => {
    const items = [{ v: 1 }, { v: 2 }, { v: 2 }];
    expect(findBy(items, (i) => i.v === 2)).toBe(items[1]);
  });
});

// ---------------------------------------------------------------------------
// range
// ---------------------------------------------------------------------------
describe('range', () => {
  it('generates a range [start, end) with default step=1', () => {
    expect(range(1, 5)).toEqual([1, 2, 3, 4]);
  });

  it('uses a custom step', () => {
    expect(range(0, 10, 3)).toEqual([0, 3, 6, 9]);
  });

  it('returns empty array when start >= end (positive step)', () => {
    expect(range(5, 5)).toEqual([]);
    expect(range(5, 3)).toEqual([]);
  });

  it('handles negative step (descending range)', () => {
    expect(range(5, 1, -1)).toEqual([5, 4, 3, 2]);
  });

  it('returns empty array for descending range with positive step', () => {
    expect(range(5, 1, 1)).toEqual([]);
  });

  it('returns empty array for ascending range with negative step', () => {
    expect(range(1, 5, -1)).toEqual([]);
  });

  it('handles step=0 by throwing', () => {
    expect(() => range(1, 5, 0)).toThrow();
  });

  it('works with fractional steps', () => {
    const result = range(0, 1, 0.25);
    expect(result).toEqual([0, 0.25, 0.5, 0.75]);
  });

  it('includes start but excludes end', () => {
    const result = range(0, 3);
    expect(result).toContain(0);
    expect(result).not.toContain(3);
  });
});
