/**
 * @framesquared/layout – TableLayout
 *
 * Renders children in a grid structure using CSS Grid.
 * Supports `columns`, `colspan`, and `rowspan` on items.
 *
 * Alias: 'table'
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Component } from '@framesquared/component';
import { Layout } from './Layout.js';
import type { LayoutConfig } from './Layout.js';

export interface TableLayoutConfig extends LayoutConfig {
  columns?: number;
  cellPadding?: number | string;
  cellAlign?: 'left' | 'center' | 'right';
  cellVAlign?: 'top' | 'middle' | 'bottom';
}

const HALIGN_MAP: Record<string, string> = { left: 'start', center: 'center', right: 'end' };
const VALIGN_MAP: Record<string, string> = { top: 'start', middle: 'center', bottom: 'end' };

export class TableLayout extends Layout {
  private columns: number;
  private cellPadding?: string;
  private cellAlign?: string;
  private cellVAlign?: string;

  constructor(config: TableLayoutConfig = {}) {
    super({ ...config, type: 'table' });
    this.columns = config.columns ?? 1;
    if (config.cellPadding !== undefined) {
      this.cellPadding =
        typeof config.cellPadding === 'number' ? `${config.cellPadding}px` : config.cellPadding;
    }
    if (config.cellAlign)  this.cellAlign  = HALIGN_MAP[config.cellAlign]  ?? config.cellAlign;
    if (config.cellVAlign) this.cellVAlign = VALIGN_MAP[config.cellVAlign] ?? config.cellVAlign;
  }

  configureContainer(el: HTMLElement): void {
    el.style.display = 'grid';
    el.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;
  }

  applyItemStyles(items: Component[], _target: Element): void {
    for (const item of items) {
      const el = item.el;
      if (!el) continue;
      const cfg = (item as any)._config ?? {};

      if (cfg.colspan && cfg.colspan > 1) {
        el.style.gridColumn = `span ${cfg.colspan}`;
      }
      if (cfg.rowspan && cfg.rowspan > 1) {
        el.style.gridRow = `span ${cfg.rowspan}`;
      }
      if (this.cellPadding) el.style.padding   = this.cellPadding;
      if (this.cellAlign)   el.style.justifySelf = this.cellAlign;
      if (this.cellVAlign)  el.style.alignSelf   = this.cellVAlign;
    }
  }

  override renderItems(items: Component[], target: Element): void {
    this.configureContainer(target as HTMLElement);
    super.renderItems(items, target);
    this.applyItemStyles(items, target);
  }
}
