/**
 * @framesquared/ui – MenuHeader
 *
 * A non-interactive section title within a Menu.  Provides visual
 * grouping of related menu items without being clickable.
 */

import { Component } from '@framesquared/component';
import type { ComponentConfig } from '@framesquared/component';

export interface MenuHeaderConfig extends ComponentConfig {
  text: string;
}

export class MenuHeader extends Component {
  static override $className = 'Ext.menu.MenuHeader';

  constructor(config: MenuHeaderConfig) {
    super({ xtype: 'menuheader', ...config });
  }

  protected override afterRender(): void {
    super.afterRender();
    const cfg = this._config as MenuHeaderConfig;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const el = this.el!;

    el.classList.add('x-menu-header');
    el.setAttribute('role', 'presentation');
    el.style.cursor = 'default';
    el.style.userSelect = 'none';
    el.style.padding = '6px 12px 2px';
    el.style.fontWeight = '600';
    el.style.fontSize = '11px';
    el.style.textTransform = 'uppercase';
    el.style.letterSpacing = '0.5px';
    el.style.opacity = '0.6';

    const span = document.createElement('span');
    span.classList.add('x-menu-header-text');
    span.textContent = cfg.text ?? '';
    el.appendChild(span);
  }
}
