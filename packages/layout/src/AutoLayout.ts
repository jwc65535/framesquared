/**
 * @framesquared/layout – AutoLayout
 *
 * The default layout.  Renders items in DOM order with no special
 * positioning — items use their natural or configured sizes and
 * rely on normal CSS flow.
 *
 * Alias: 'auto'
 */

import type { Component } from '@framesquared/component';
import { Layout } from './Layout.js';
import type { SizePolicy, LayoutConfig } from './Layout.js';
import type { LayoutContext } from './LayoutContext.js';

export class AutoLayout extends Layout {
  constructor(config: LayoutConfig = {}) {
    super({ ...config, type: 'auto' });
  }

  /**
   * Auto layout applies no container CSS — children flow in normal block order.
   * This is called by Container.afterRender() on every layout instance.
   */
  configureContainer(_el: HTMLElement): void {
    // Intentional no-op: AutoLayout defers entirely to CSS normal flow.
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
