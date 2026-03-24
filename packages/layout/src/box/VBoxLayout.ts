/**
 * @ext-ts/layout – VBoxLayout
 *
 * Vertical box layout.  Children are arranged top-to-bottom
 * (or bottom-to-top when reverse=true).  Uses CSS Flexbox with
 * flex-direction: column.
 *
 * Alias: 'vbox'
 */

import { BoxLayout } from './BoxLayout.js';
import type { BoxLayoutConfig } from './BoxLayout.js';

export class VBoxLayout extends BoxLayout {
  constructor(config: BoxLayoutConfig = {}) {
    super({ ...config, type: 'vbox' });
  }

  protected getDirection(): string {
    return 'column';
  }

  protected getPrimaryAxisProp(): string {
    return 'height';
  }
}
