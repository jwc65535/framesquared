/**
 * @framesquared/data – TreeWriter
 *
 * Serializes tree nodes (NodeInterface) into nested JSON structures.
 */

import type { NodeInterface } from '../mixin/NodeInterface.js';

export interface TreeWriterConfig {
  /** Name of the property used for child records. Defaults to 'children'. */
  childrenProperty?: string;
}

export class TreeWriter {
  readonly childrenProperty: string;

  constructor(config?: TreeWriterConfig) {
    this.childrenProperty = config?.childrenProperty ?? 'children';
  }

  /**
   * Serializes an array of root-level NodeInterface records to plain objects.
   * Children are nested under the configured `childrenProperty`.
   */
  writeRecords(records: NodeInterface[]): Record<string, unknown>[] {
    return records.map((r) => this.writeRecord(r));
  }

  private writeRecord(record: NodeInterface): Record<string, unknown> {
    // getData() returns only the declared model fields (persistent field data)
    const data = record.getData() as Record<string, unknown>;

    if (record.childNodes && record.childNodes.length > 0) {
      data[this.childrenProperty] = record.childNodes.map((c: NodeInterface) =>
        this.writeRecord(c),
      );
    }

    return data;
  }
}
