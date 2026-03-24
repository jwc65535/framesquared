/**
 * @framesquared/layout – AbsoluteLayout
 *
 * Positions children absolutely within the container using x/y configs.
 *
 * Alias: 'absolute'
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Component } from '@framesquared/component';
import { Layout } from './Layout.js';
import type { LayoutConfig } from './Layout.js';

export class AbsoluteLayout extends Layout {
  constructor(config: LayoutConfig = {}) {
    super({ ...config, type: 'absolute' });
  }

  configureContainer(el: HTMLElement): void {
    el.style.position = 'relative';
  }

  applyItemStyles(items: Component[], _target: Element): void {
    for (const item of items) {
      const el = item.el;
      if (!el) continue;
      const cfg = (item as any)._config ?? {};

      el.style.position = 'absolute';
      el.style.left = `${cfg.x ?? 0}px`;
      el.style.top = `${cfg.y ?? 0}px`;
    }
  }

  override renderItems(items: Component[], target: Element): void {
    this.configureContainer(target as HTMLElement);
    super.renderItems(items, target);
    this.applyItemStyles(items, target);
  }
}
