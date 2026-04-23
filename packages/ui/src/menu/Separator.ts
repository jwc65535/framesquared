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
    // border-top is more reliable than height+backgroundColor in a flex column.
    // Inline styles act as a fallback when the stylesheet has not loaded.
    el.style.height = '0';
    el.style.margin = '6px 0';
    el.style.borderTop = '1px solid rgba(0, 0, 0, 0.18)';
    el.style.pointerEvents = 'none';
  }
}
