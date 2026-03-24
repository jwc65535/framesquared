/**
 * @ext-ts/ui – CycleButton
 *
 * Cycles through a set of items on each click.  Extends SplitButton
 * to show the current item's text and advance on click.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { SplitButton } from './SplitButton.js';
import type { SplitButtonConfig } from './SplitButton.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CycleItem {
  text: string;
  iconCls?: string;
  checked?: boolean;
}

export interface CycleButtonConfig extends SplitButtonConfig {
  items?: CycleItem[];
}

// ---------------------------------------------------------------------------
// CycleButton
// ---------------------------------------------------------------------------

export class CycleButton extends SplitButton {
  static override $className = 'Ext.button.CycleButton';

  declare _cycleItems: CycleItem[];
  declare private _activeIndex: number;

  constructor(config: CycleButtonConfig = {}) {
    const items = config.items ?? [];
    const checkedIdx = items.findIndex(i => i.checked);
    const activeIdx = checkedIdx >= 0 ? checkedIdx : 0;
    const activeItem = items[activeIdx];

    super({
      ...config,
      text: activeItem?.text ?? '',
      iconCls: activeItem?.iconCls,
    });

    // Store after super (which calls initialize)
    this._cycleItems = items;
    this._activeIndex = activeIdx;
  }

  protected override initialize(): void {
    super.initialize();
    this._cycleItems = [];
    this._activeIndex = 0;
  }

  // Override click to cycle instead of normal button behavior
  protected override onButtonClick(e: Event): void {
    if (this.isDisabled()) return;

    // Advance to next item
    this._activeIndex = (this._activeIndex + 1) % this._cycleItems.length;
    const item = this._cycleItems[this._activeIndex];

    this.setText(item.text);
    if (item.iconCls) this.setIconCls(item.iconCls);

    this.fire('change', this, item);
    this.fire('click', this, e);
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  getActiveItem(): CycleItem {
    return this._cycleItems[this._activeIndex];
  }

  setActiveItem(item: CycleItem): void {
    const idx = this._cycleItems.indexOf(item);
    if (idx === -1) return;
    this._activeIndex = idx;
    this.setText(item.text);
    if (item.iconCls) this.setIconCls(item.iconCls);
    this.fire('change', this, item);
  }
}
