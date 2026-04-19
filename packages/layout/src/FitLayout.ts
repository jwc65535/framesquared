/**
 * @framesquared/layout – FitLayout
 *
 * Single child fills the entire container.  If multiple children
 * are present, only the first is visible.
 *
 * Alias: 'fit'
 */

import type { Component } from '@framesquared/component';
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
    // Container.add() calls renderItems([singleChild]) once per child, so
    // `items` is always a one-element array. Always use the full owner list so
    // applyItemStyles can correctly distinguish index-0 (visible) from index-1+
    // (hidden) — identical fix to ColumnLayout's partial-list bug.
    const allItems: Component[] = (this.owner as any)?.getItems?.() ?? items;
    this.applyItemStyles(allItems, target);
  }
}
