/**
 * @framesquared/layout – AnchorLayout
 *
 * Children sized relative to container using anchor strings:
 *   '100% 50%' → 100% width, 50% height
 *   '-50 -100'  → calc(100% - 50px), calc(100% - 100px)
 *   '-50'       → width offset only
 *
 * Alias: 'anchor'
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Component } from '@framesquared/component';
import { Layout } from './Layout.js';
import type { LayoutConfig } from './Layout.js';

export class AnchorLayout extends Layout {
  constructor(config: LayoutConfig = {}) {
    super({ ...config, type: 'anchor' });
  }

  configureContainer(el: HTMLElement): void {
    el.style.position = 'relative';
  }

  applyItemStyles(items: Component[], _target: Element): void {
    for (const item of items) {
      const el = item.el;
      if (!el) continue;
      const anchor = (item as any)._config?.anchor as string | undefined;
      if (!anchor) continue;

      const parts = anchor.trim().split(/\s+/);
      const w = parts[0];
      const h = parts[1];

      if (w) el.style.width = parseAnchorValue(w);
      if (h) el.style.height = parseAnchorValue(h);
    }
  }

  override renderItems(items: Component[], target: Element): void {
    this.configureContainer(target as HTMLElement);
    super.renderItems(items, target);
    this.applyItemStyles(items, target);
  }
}

function parseAnchorValue(val: string): string {
  if (val.endsWith('%')) return val;
  // Negative offset: -50 → calc(100% - 50px)
  const n = parseInt(val, 10);
  if (!isNaN(n) && n < 0) return `calc(100% - ${Math.abs(n)}px)`;
  if (!isNaN(n) && n > 0) return `${n}px`;
  return val;
}
