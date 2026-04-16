/**
 * @framesquared/ui – TemplateColumn
 *
 * A grid column whose cell content is rendered by an XTemplate.
 * Use when a column's display requires loops, conditionals, or format
 * functions that a plain renderer function would have to re-implement by hand.
 *
 * ```ts
 * new TemplateColumn({
 *   dataIndex: 'tags',
 *   text: 'Tags',
 *   tpl: new XTemplate('<tpl for="tags"><span class="tag">{.:htmlEncode}</span></tpl>'),
 * })
 * ```
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NodeInterface } from '@framesquared/data';
import { XTemplate } from '@framesquared/component';
import { Column } from './TreeGridColumn.js';
import type { ColumnConfig } from './TreeGridColumn.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TemplateColumnConfig extends ColumnConfig {
  tpl: XTemplate;
}

// ---------------------------------------------------------------------------
// TemplateColumn
// ---------------------------------------------------------------------------

export class TemplateColumn extends Column {
  readonly isTemplateColumn: boolean = true;
  tpl: XTemplate;

  constructor(config: TemplateColumnConfig) {
    super(config);
    this.tpl = config.tpl;
  }

  /**
   * Renders the cell value using the configured XTemplate.
   * The full record data object is passed to the template.
   */
  override renderValue(record: NodeInterface): string {
    const data = (record as any).getData?.() ?? (record as any);
    return this.tpl.apply(data);
  }
}
