/**
 * @framesquared/ui – WidgetColumn (TreeGrid)
 *
 * A column that renders a live Component instance into each cell.
 * Pass a Component subclass via `widget`; one instance is created per node
 * and mounted into the cell's inner div.
 *
 * TreeGridView detects WidgetColumn via `mountToCell()` and calls it after
 * inserting each cell into the DOM.  Instances are destroyed when the view
 * refreshes or the column is garbage collected.
 *
 * ```ts
 * new WidgetColumn({
 *   text: 'Progress',
 *   width: 140,
 *   widget: ProgressBar,
 * })
 * ```
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NodeInterface } from '@framesquared/data';
import { Component } from '@framesquared/component';
import { Column } from './TreeGridColumn.js';
import type { ColumnConfig } from './TreeGridColumn.js';

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
  private _instances = new Map<string, Component>();

  constructor(config: WidgetColumnConfig) {
    super(config);
    this._widget = config.widget;
  }

  /**
   * Returns an empty string — cell content is provided by mountToCell().
   */
  override renderValue(_record: NodeInterface): string {
    return '';
  }

  /**
   * Called by TreeGridView after the cell inner div is in the DOM.
   * Destroys any prior instance for this node, then renders a fresh one.
   */
  mountToCell(inner: HTMLElement, record: NodeInterface): void {
    const id = String((record as any).getId?.() ?? '');
    this._instances.get(id)?.destroy();
    const cmp = new this._widget({ renderTo: inner });
    if (id) this._instances.set(id, cmp);
  }

  /**
   * Destroys all live widget instances.  Called by TreeGridView before refresh.
   */
  destroyWidgets(): void {
    this._instances.forEach((cmp) => cmp.destroy());
    this._instances.clear();
  }
}
