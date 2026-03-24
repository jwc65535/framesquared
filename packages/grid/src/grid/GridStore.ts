/**
 * @framesquared/grid – GridStore
 *
 * Interface that defines the store contract Grid components require.
 * The real `@framesquared/data` Store satisfies this interface natively.
 * Custom stores can implement this interface for compatibility.
 *
 * @since 0.1.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface GridRecord {
  /** Get a field value by name. */
  get(field: string): unknown;
  /** Set a field value by name. */
  set?(field: string, value: unknown): void;
  /** Get the record's ID. */
  getId?(): unknown;
  /** Get all data as a plain object. */
  getData?(): Record<string, unknown>;
}

export interface GridStore {
  /** Return all (filtered) records. */
  getRange(start?: number, end?: number): GridRecord[];
  /** Return record at index. */
  getAt(index: number): GridRecord | undefined;
  /** Return the count of (filtered) records. */
  getCount(): number;
  /** Return total (unfiltered) count. */
  getTotalCount?(): number;
  /** Sort by field name and direction. */
  sort(field: string, direction?: 'ASC' | 'DESC'): void;
  /** Subscribe to store events. */
  on(event: string, fn: Function, ...args: any[]): any;
  /** Iterate all records. */
  each?(fn: (record: GridRecord, index: number) => boolean | void): void;
}
