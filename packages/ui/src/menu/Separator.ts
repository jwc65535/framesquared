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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.el!.classList.add('x-menu-separator');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.el!.setAttribute('role', 'separator');
  }
}
