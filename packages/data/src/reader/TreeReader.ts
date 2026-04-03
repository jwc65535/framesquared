/**
 * @framesquared/data – TreeReader
 *
 * Reads nested (hierarchical) JSON data, flattening it into a ResultSet
 * while preserving the children references.
 */

import { JsonReader } from './Reader.js';
import type { JsonReaderConfig } from './Reader.js';
import { ResultSet } from '../ResultSet.js';

export interface TreeReaderConfig extends JsonReaderConfig {
  /** Name of the property that holds child records. Defaults to 'children'. */
  childrenProperty?: string;
}

export class TreeReader extends JsonReader {
  readonly childrenProperty: string;

  constructor(config: TreeReaderConfig) {
    super(config);
    this.childrenProperty = config.childrenProperty ?? 'children';
  }

  /**
   * Reads data, recursively collecting ALL nodes (at all levels) into a flat
   * ResultSet.  The original children references are preserved on the raw
   * objects, so the tree structure is available to callers (e.g. TreeStore).
   */
  override read(data: unknown): ResultSet {
    const flat: Record<string, unknown>[] = [];
    const rootRecords = this.extractRootArray(data);
    this.collectFlat(rootRecords, flat);
    // Build ResultSet directly to avoid rootProperty re-extraction in super.read()
    const model = this.config.model;
    const records = flat.map((raw) => model.create(raw));
    return new ResultSet({ records, total: records.length, success: true });
  }

  /**
   * Returns `{ root, records }` where `root` is the first raw record and
   * `records` is the full flat list of all nodes.
   */
  readTree(data: Record<string, unknown>): {
    root: Record<string, unknown>;
    records: Record<string, unknown>[];
  } {
    const flat: Record<string, unknown>[] = [];
    this.collectFlat([data], flat);
    return { root: data, records: flat };
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private extractRootArray(data: unknown): Record<string, unknown>[] {
    if (this.config.rootProperty) {
      const root = getNestedValue(data, this.config.rootProperty);
      return Array.isArray(root) ? (root as Record<string, unknown>[]) : [];
    }
    return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  }

  private collectFlat(items: Record<string, unknown>[], out: Record<string, unknown>[]): void {
    for (const item of items) {
      out.push(item);
      const children = item[this.childrenProperty];
      if (Array.isArray(children) && children.length > 0) {
        this.collectFlat(children as Record<string, unknown>[], out);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helper (mirrors Reader.ts private helper)
// ---------------------------------------------------------------------------

function getNestedValue(obj: unknown, path: string): unknown {
  const segments = path.split('.');
  let current: unknown = obj;
  for (const seg of segments) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[seg];
  }
  return current;
}
