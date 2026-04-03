/**
 * @framesquared/ui – CardContainer
 *
 * A Container with card layout behavior: only one child is visible
 * at a time.  Provides next(), prev(), and setActiveItem() for
 * wizard-style navigation.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Container } from '@framesquared/component';
import type { ContainerConfig } from '@framesquared/component';

export interface CardContainerConfig extends ContainerConfig {
  activeItem?: number;
}

export class CardContainer extends Container {
  static override $className = 'Ext.container.CardContainer';

  declare private _activeIndex: number;

  constructor(config: CardContainerConfig = {}) {
    super({ xtype: 'cardcontainer', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    this._activeIndex = (this._config as CardContainerConfig).activeItem ?? 0;
  }

  protected override afterRender(): void {
    super.afterRender();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.el!.classList.add('x-card-container');

    const body = this.getBodyEl();
    body.style.position = 'relative';

    // Hide all except active
    const items = this.getItems();
    for (let i = 0; i < items.length; i++) {
      if (i !== this._activeIndex) {
        items[i].hide();
      }
    }
  }

  // -----------------------------------------------------------------------
  // Navigation
  // -----------------------------------------------------------------------

  setActiveItem(index: number): void {
    const items = this.getItems();
    if (index < 0 || index >= items.length) return;
    if (index === this._activeIndex) return;

    const oldItem = items[this._activeIndex];
    const newItem = items[index];
    const oldIndex = this._activeIndex;

    oldItem?.hide();
    newItem?.show();
    this._activeIndex = index;

    this.fire('cardchange', this, newItem, oldItem, index, oldIndex);
  }

  next(): void {
    const items = this.getItems();
    if (this._activeIndex < items.length - 1) {
      this.setActiveItem(this._activeIndex + 1);
    }
  }

  prev(): void {
    if (this._activeIndex > 0) {
      this.setActiveItem(this._activeIndex - 1);
    }
  }

  getActiveItem(): any {
    return this.getItems()[this._activeIndex] ?? null;
  }

  getActiveIndex(): number {
    return this._activeIndex;
  }
}
