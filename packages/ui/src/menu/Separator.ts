/**
 * @framesquared/ui – MenuSeparator
 * A visual separator line within a Menu.
 */

import { Component } from '@framesquared/component';

export class MenuSeparator extends Component {
  static override $className = 'Ext.menu.Separator';

  constructor(config: Record<string, unknown> = {}) {
    super({ xtype: 'menuseparator', ...config });
  }

  protected override afterRender(): void {
    super.afterRender();
    const el = this.el!;
    el.classList.add('x-menu-separator');
    el.setAttribute('role', 'separator');
    el.style.display = 'block';
    el.style.height = '0';
    el.style.margin = '6px 0';
    // Use a fixed colour rather than --ext-color-border, which resolves to
    // #e0e0e0 in ModernTheme — nearly white-on-white and invisible.
    el.style.borderTop = '1px solid rgba(0, 0, 0, 0.40)';
    el.style.pointerEvents = 'none';
  }
}
