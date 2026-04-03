/**
 * @framesquared/ui – SplitButton
 *
 * A button with two click zones: the main button area and a
 * dropdown arrow area.  Clicking the arrow fires `arrowHandler`
 * and `'arrowclick'` event independently from the main click.
 */

import { Button } from './Button.js';
import type { ButtonConfig } from './Button.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface SplitButtonConfig extends ButtonConfig {
  arrowHandler?: (button: SplitButton, event: Event) => void;
}

// ---------------------------------------------------------------------------
// SplitButton
// ---------------------------------------------------------------------------

export class SplitButton extends Button {
  static override $className = 'Ext.button.SplitButton';

  declare private _splitArrowEl: HTMLElement | null;

  constructor(config: SplitButtonConfig = {}) {
    super({ arrowVisible: false, ...config }); // we render our own arrow
  }

  protected override initialize(): void {
    super.initialize();
    this._splitArrowEl = null;
  }

  protected override buildInnerDom(cfg: ButtonConfig): void {
    // Build icon + text from parent
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const el = this.el!;

    if (cfg.iconCls || cfg.icon) {
      this._iconEl = document.createElement('span');
      this._iconEl.classList.add('x-btn-icon');
      if (cfg.iconCls) this._iconEl.classList.add(cfg.iconCls);
      if (cfg.icon) this._iconEl.style.backgroundImage = `url(${cfg.icon})`;
      el.appendChild(this._iconEl);
    }

    if (cfg.text) {
      this._textEl = document.createElement('span');
      this._textEl.classList.add('x-btn-text');
      this._textEl.textContent = cfg.text;
      el.appendChild(this._textEl);
    }

    // Split arrow (always present on SplitButton)
    this._splitArrowEl = document.createElement('span');
    this._splitArrowEl.classList.add('x-btn-split-arrow');
    el.appendChild(this._splitArrowEl);

    el.classList.add('x-btn-split');
  }

  protected override attachEvents(cfg: ButtonConfig): void {
    super.attachEvents(cfg);

    const splitCfg = cfg as SplitButtonConfig;

    if (this._splitArrowEl) {
      this._splitArrowEl.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation(); // don't trigger the main click
        if (this.isDisabled()) return;

        if (splitCfg.arrowHandler) {
          splitCfg.arrowHandler(this, e);
        }
        this.fire('arrowclick', this, e);
      });
    }
  }
}
