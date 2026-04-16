/**
 * @framesquared/grid – WidgetColumn
 *
 * A grid column that renders a live Component instance into each cell.
 * Pass a Component subclass via `widget`; one instance is created per row
 * and mounted directly into the cell element.
 *
 * GridView detects WidgetColumn via `mountToCell()` and calls it after
 * each row is inserted into the DOM.  Instances are destroyed when the
 * view re-renders or the column is garbage collected.
 *
 * ```ts
 * new WidgetColumn({
 *   text: 'Status',
 *   width: 120,
 *   widget: ProgressBar,
 * })
 * ```
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Component } from '@framesquared/component';
import { Column } from './Column.js';
import type { ColumnConfig } from './Column.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface WidgetColumnConfig extends ColumnConfig {
  widget: typeof Component;
}

// ---------------------------------------------------------------------------
// WidgetColumn
// ---------------------------------------------------------------------------

export class WidgetColumn extends Column {
  readonly isWidgetColumn: boolean = true;
  private _widget: typeof Component;
  private _instances = new Map<number, Component>();

  constructor(config: WidgetColumnConfig) {
    super({ ...config, xtype: 'widgetcolumn', sortable: false });
    this._widget = config.widget;
  }

  /**
   * Returns an empty string — cell content is provided by mountToCell().
   */
  override renderCellHtml(
    _value: unknown,
    _metaData: any,
    _record: any,
    _rowIndex: number,
    _colIndex: number,
  ): string {
    return '';
  }

  /**
   * Called by GridView after the cell TD is in the DOM.
   * Destroys any prior instance for this row, then renders a fresh one.
   */
  mountToCell(td: HTMLElement, _record: any, rowIndex: number): void {
    this._instances.get(rowIndex)?.destroy();
    const cmp = new this._widget({ renderTo: td });
    this._instances.set(rowIndex, cmp);
  }

  /**
   * Destroys all live widget instances.  Called by GridView before re-render.
   */
  destroyWidgets(): void {
    this._instances.forEach((cmp) => cmp.destroy());
    this._instances.clear();
  }
}
