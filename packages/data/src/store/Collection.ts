/**
 * @framesquared/data – Collection
 *
 * An ordered, optionally keyed collection used internally by Store.
 * Provides add, insert, remove, sort, find, and iteration.
 */

export class Collection<T> {
  private items: T[] = [];
  private keyMap: Map<unknown, T> | null = null;
  private keyFn: ((item: T) => unknown) | undefined;

  constructor(keyFn?: (item: T) => unknown) {
    this.keyFn = keyFn;
    if (keyFn) {
      this.keyMap = new Map();
    }
  }

  getCount(): number {
    return this.items.length;
  }

  getAt(index: number): T | undefined {
    return this.items[index];
  }

  getByKey(key: unknown): T | undefined {
    return this.keyMap?.get(key);
  }

  indexOf(item: T): number {
    return this.items.indexOf(item);
  }

  contains(item: T): boolean {
    return this.items.includes(item);
  }

  add(item: T): void {
    this.items.push(item);
    if (this.keyFn && this.keyMap) {
      this.keyMap.set(this.keyFn(item), item);
    }
  }

  insert(index: number, item: T): void {
    this.items.splice(index, 0, item);
    if (this.keyFn && this.keyMap) {
      this.keyMap.set(this.keyFn(item), item);
    }
  }

  remove(item: T): T | undefined {
    const idx = this.items.indexOf(item);
    if (idx === -1) return undefined;
    this.items.splice(idx, 1);
    if (this.keyFn && this.keyMap) {
      this.keyMap.delete(this.keyFn(item));
    }
    return item;
  }

  removeAt(index: number, count = 1): T[] {
    const removed = this.items.splice(index, count);
    if (this.keyFn && this.keyMap) {
      for (const item of removed) {
        this.keyMap.delete(this.keyFn(item));
      }
    }
    return removed;
  }

  clear(): void {
    this.items.length = 0;
    this.keyMap?.clear();
  }

  toArray(): T[] {
    return [...this.items];
  }

  each(fn: (item: T, index: number) => boolean | undefined): void {
    for (let i = 0; i < this.items.length; i++) {
      if (fn(this.items[i], i) === false) break;
    }
  }

  find(fn: (item: T) => boolean): T | undefined {
    return this.items.find(fn);
  }

  filter(fn: (item: T) => boolean): T[] {
    return this.items.filter(fn);
  }

  sort(compareFn: (a: T, b: T) => number): void {
    this.items.sort(compareFn);
  }

  first(): T | undefined {
    return this.items[0];
  }

  last(): T | undefined {
    return this.items[this.items.length - 1];
  }

  getRange(start = 0, end?: number): T[] {
    return this.items.slice(start, end);
  }

  /** Rebuilds the key map (call after sort or external mutation). */
  rekey(): void {
    if (this.keyFn && this.keyMap) {
      this.keyMap.clear();
      for (const item of this.items) {
        this.keyMap.set(this.keyFn(item), item);
      }
    }
  }
}
