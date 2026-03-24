/**
 * @framesquared/layout – HBoxLayout
 *
 * Horizontal box layout.  Children are arranged left-to-right
 * (or right-to-left when reverse=true).  Uses CSS Flexbox with
 * flex-direction: row.
 *
 * Alias: 'hbox'
 */

import { BoxLayout } from './BoxLayout.js';
import type { BoxLayoutConfig } from './BoxLayout.js';

export class HBoxLayout extends BoxLayout {
  constructor(config: BoxLayoutConfig = {}) {
    super({ ...config, type: 'hbox' });
  }

  protected getDirection(): string {
    return 'row';
  }

  protected getPrimaryAxisProp(): string {
    return 'width';
  }
}
