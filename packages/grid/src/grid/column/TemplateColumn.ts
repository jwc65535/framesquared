/**
 * @framesquared/grid – TemplateColumn
 *
 * A grid column whose cell content is rendered by an XTemplate.
 * Passes the full record data object to the template, so all fields
 * are available — not just the column's dataIndex value.
 *
 * ```ts
 * new TemplateColumn({
 *   text: 'Name',
 *   dataIndex: 'firstName',
 *   tpl: new XTemplate('{firstName} {lastName:htmlEncode}'),
 * })
 * ```
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { XTemplate } from '@framesquared/component';
import { Column } from './Column.js';
import type { ColumnConfig } from './Column.js';

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
  private _tpl: XTemplate;

  constructor(config: TemplateColumnConfig) {
    super({ ...config, xtype: 'templatecolumn' });
    this._tpl = config.tpl;
  }

  /**
   * Renders the cell using the configured XTemplate.
   * The full record data object is passed — not just the column value.
   */
  override renderCellHtml(
    _value: unknown,
    _metaData: any,
    record: any,
    _rowIndex: number,
    _colIndex: number,
  ): string {
    const data = record.getData?.() ?? record.data ?? record;
    return this._tpl.apply(data);
  }
}
