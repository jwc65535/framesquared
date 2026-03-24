/**
 * @ext-ts/layout – FitLayout
 *
 * Single child fills the entire container.  If multiple children
 * are present, only the first is visible.
 *
 * Alias: 'fit'
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Component } from '@ext-ts/component';
import { Layout } from './Layout.js';
import type { LayoutConfig } from './Layout.js';

export class FitLayout extends Layout {
  constructor(config: LayoutConfig = {}) {
    super({ ...config, type: 'fit' });
  }

  configureContainer(el: HTMLElement): void {
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
  }

  applyItemStyles(items: Component[], _target: Element): void {
    for (let i = 0; i < items.length; i++) {
      const el = items[i].el;
      if (!el) continue;
      if (i === 0) {
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.boxSizing = 'border-box';
      } else {
        el.style.display = 'none';
      }
    }
  }

  override renderItems(items: Component[], target: Element): void {
    this.configureContainer(target as HTMLElement);
    super.renderItems(items, target);
    this.applyItemStyles(items, target);
  }
}
