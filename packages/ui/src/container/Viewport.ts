/**
 * @framesquared/ui – Viewport
 *
 * A Container that fills the entire browser viewport.
 * Renders into document.body, sets overflow: hidden,
 * and fires 'resize' on window resize.
 */

import { Container } from '@framesquared/component';
import type { ContainerConfig } from '@framesquared/component';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ViewportConfig extends ContainerConfig {}

export class Viewport extends Container {
  static override $className = 'Ext.container.Viewport';

  declare private _resizeHandler: (() => void) | null;

  constructor(config: ViewportConfig = {}) {
    super({ xtype: 'viewport', renderTo: document.body, ...config });
  }

  protected override initialize(): void {
    super.initialize();
    this._resizeHandler = null;
  }

  protected override afterRender(): void {
    super.afterRender();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const el = this.el!;
    el.classList.add('x-viewport');
    el.style.width = '100vw';
    el.style.height = '100vh';
    el.style.overflow = 'hidden';
    el.style.position = 'relative';

    // The Container body must fill the full viewport so that flex children
    // with flex:1 (e.g. a scrollable content panel) have a definite height
    // to grow into. Without this the VBox has no height to distribute.
    const body = this.getBodyEl();
    body.style.width = '100%';
    body.style.height = '100%';

    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';

    this._resizeHandler = () => {
      this.fire('resize', this, window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', this._resizeHandler);
  }

  protected override onDestroy(): void {
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    super.onDestroy();
  }
}
