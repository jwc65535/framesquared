/**
 * @ext-ts/ui – MenuSeparator
 * A visual separator line within a Menu.
 */

import { Component } from '@ext-ts/component';

export class MenuSeparator extends Component {
  static override $className = 'Ext.menu.Separator';

  constructor(config: Record<string, unknown> = {}) {
    super({ xtype: 'menuseparator', ...config });
  }

  protected override afterRender(): void {
    super.afterRender();
    this.el!.classList.add('x-menu-separator');
    this.el!.setAttribute('role', 'separator');
  }
}
