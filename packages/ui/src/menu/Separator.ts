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
    el.style.height = '1px';
    el.style.margin = '5px 0';
    el.style.backgroundColor = 'rgba(0, 0, 0, 0.15)';
    el.style.overflow = 'hidden';
    el.style.pointerEvents = 'none';
  }
}
