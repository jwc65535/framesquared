/**
 * @ext-ts/layout – ResponsiveColumnLayout
 *
 * Columns that automatically reflow based on container width.
 * Uses CSS Grid with auto-fill and minmax() for responsive columns
 * without JavaScript resize calculation.
 *
 * Config:
 *   minColumnWidth — minimum width of each column
 *   gap            — spacing between items
 *   maxColumns     — optional maximum number of columns
 *
 * Items with `columnSpan: N` span multiple grid columns.
 *
 * Alias: 'responsivecolumn'
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Component } from '@ext-ts/component';
import { Layout } from './Layout.js';
import type { LayoutConfig } from './Layout.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface ResponsiveColumnLayoutConfig extends LayoutConfig {
  minColumnWidth: number;
  gap?: number;
  maxColumns?: number;
}

// ---------------------------------------------------------------------------
// ResponsiveColumnLayout
// ---------------------------------------------------------------------------

export class ResponsiveColumnLayout extends Layout {
  private minColumnWidth: number;
  private gap: number;
  private maxColumns: number | undefined;

  constructor(config: ResponsiveColumnLayoutConfig) {
    super({ ...config, type: 'responsivecolumn' });
    this.minColumnWidth = config.minColumnWidth;
    this.gap = config.gap ?? 0;
    this.maxColumns = config.maxColumns;
  }

  /**
   * Configures the container element with CSS Grid responsive columns.
   */
  configureContainer(el: HTMLElement): void {
    el.style.display = 'grid';

    if (this.maxColumns) {
      // With maxColumns: use repeat(maxColumns, minmax(min, 1fr))
      el.style.gridTemplateColumns =
        `repeat(auto-fill, minmax(min(${this.minColumnWidth}px, 100%), ${Math.floor(100 / this.maxColumns)}%))`;
    } else {
      // Without maxColumns: use auto-fill with minmax
      el.style.gridTemplateColumns =
        `repeat(auto-fill, minmax(${this.minColumnWidth}px, 1fr))`;
    }

    if (this.gap > 0) {
      el.style.gap = `${this.gap}px`;
    }
  }

  /**
   * Applies columnSpan to items that need to span multiple columns.
   */
  applyItemStyles(items: Component[], _target: Element): void {
    for (const item of items) {
      const el = item.el;
      if (!el) continue;
      const span = (item as any)._config?.columnSpan as number | undefined;
      if (span && span > 1) {
        el.style.gridColumn = `span ${span}`;
      }
    }
  }

  override renderItems(items: Component[], target: Element): void {
    this.configureContainer(target as HTMLElement);
    super.renderItems(items, target);
    this.applyItemStyles(items, target);
  }
}
