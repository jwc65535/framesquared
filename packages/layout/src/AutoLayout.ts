/**
 * @ext-ts/layout – AutoLayout
 *
 * The default layout.  Renders items in DOM order with no special
 * positioning — items use their natural or configured sizes and
 * rely on normal CSS flow.
 *
 * Alias: 'auto'
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Component } from '@ext-ts/component';
import { Layout } from './Layout.js';
import type { SizePolicy, LayoutConfig } from './Layout.js';
import type { LayoutContext } from './LayoutContext.js';

export class AutoLayout extends Layout {
  constructor(config: LayoutConfig = {}) {
    super({ ...config, type: 'auto' });
  }

  /**
   * Auto layout: no calculation needed — items use natural CSS flow.
   */
  override calculate(_context: LayoutContext): void {
    // No-op: items size themselves via CSS
  }

  /**
   * All items use natural sizing in auto layout.
   */
  override getItemSizePolicy(_item: Component): SizePolicy {
    return { width: 'natural', height: 'natural' };
  }
}
