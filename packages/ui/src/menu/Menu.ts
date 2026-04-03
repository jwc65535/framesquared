/**
 * @framesquared/ui – Menu
 *
 * A floating container that holds MenuItems.  Shows at a specific
 * position or aligned to a component.  Registers with MenuManager
 * for outside-click dismissal.  Supports keyboard navigation.
 */

import { Container } from '@framesquared/component';
import type { ContainerConfig, Component } from '@framesquared/component';
import { MenuManager } from './MenuManager.js';

export interface MenuConfig extends ContainerConfig {
  plain?: boolean;
  showSeparator?: boolean;
  allowOtherMenus?: boolean;
}

export class Menu extends Container {
  static override $className = 'Ext.menu.Menu';

  declare private _isMenuVisible: boolean;

  constructor(config: MenuConfig = {}) {
    super({ xtype: 'menu', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    this._isMenuVisible = false;
  }

  protected override afterRender(): void {
    super.afterRender();
    const cfg = this._config as MenuConfig;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const el = this.el!;

    el.classList.add('x-menu');
    el.style.position = 'fixed';
    el.setAttribute('role', 'menu');

    if (cfg.plain) el.classList.add('x-menu-plain');

    // Keyboard
    el.tabIndex = -1;
    el.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.hide();
      }
    });
  }

  // -----------------------------------------------------------------------
  // Show / Hide
  // -----------------------------------------------------------------------

  showAt(x: number, y: number): void {
    if (!this.rendered) {
      this.render(document.body);
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.el!.style.left = `${x}px`;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.el!.style.top = `${y}px`;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.el!.style.display = '';
    this._isMenuVisible = true;
    MenuManager.getInstance().register(this);
    this.fire('show', this);
  }

  showBy(component: Component, _alignment?: string): void {
    if (!this.rendered) {
      this.render(document.body);
    }
    // Position near the component
    const rect = component.el?.getBoundingClientRect();
    const x = rect?.left ?? 0;
    const y = rect?.bottom ?? 0;
    this.showAt(x, y);
  }

  override hide(): void {
    if (!this._isMenuVisible) return;
    this._isMenuVisible = false;
    if (this.el) this.el.style.display = 'none';
    MenuManager.getInstance().unregister(this);
    this.fire('hide', this);
  }

  override isVisible(): boolean {
    return this._isMenuVisible;
  }

  override show(): void {
    this.showAt(0, 0);
  }

  protected override onDestroy(): void {
    MenuManager.getInstance().unregister(this);
    super.onDestroy();
  }
}
