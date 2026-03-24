/**
 * @ext-ts/layout – ColumnLayout
 *
 * Arranges children in columns.  Items with `columnWidth` (0–1)
 * get a percentage of the container width.  Fixed-width items
 * keep their configured width.  Uses CSS Flexbox with wrap.
 *
 * Alias: 'column'
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Component } from '@ext-ts/component';
import { Layout } from './Layout.js';
import type { LayoutConfig } from './Layout.js';

export class ColumnLayout extends Layout {
  constructor(config: LayoutConfig = {}) {
    super({ ...config, type: 'column' });
  }

  configureContainer(el: HTMLElement): void {
    el.style.display = 'flex';
    el.style.flexWrap = 'wrap';
    el.style.alignItems = 'flex-start';
  }

  applyItemStyles(items: Component[], _target: Element): void {
    for (const item of items) {
      const el = item.el;
      if (!el) continue;
      const cfg = (item as any)._config ?? {};
      const cw = cfg.columnWidth as number | undefined;

      if (cw !== undefined && cw > 0 && cw <= 1) {
        el.style.width = `${(cw * 100)}%`;
        el.style.boxSizing = 'border-box';
      } else if (cfg.width !== undefined) {
        el.style.flexShrink = '0';
      }
    }
  }

  override renderItems(items: Component[], target: Element): void {
    this.configureContainer(target as HTMLElement);
    super.renderItems(items, target);
    this.applyItemStyles(items, target);
  }
}
