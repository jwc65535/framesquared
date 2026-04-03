/**
 * @framesquared/ui – SegmentedButton
 *
 * A Container that holds buttons in a group with single or multiple
 * selection behavior.  Manages toggle state across child buttons.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Container } from '@framesquared/component';
import type { ContainerConfig } from '@framesquared/component';
import { Button } from './Button.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface SegmentedButtonConfig extends ContainerConfig {
  allowMultiple?: boolean;
  allowDepress?: boolean;
}

// ---------------------------------------------------------------------------
// SegmentedButton
// ---------------------------------------------------------------------------

export class SegmentedButton extends Container {
  static override $className = 'Ext.button.SegmentedButton';

  declare private _allowMultiple: boolean;
  declare private _allowDepress: boolean;

  constructor(config: SegmentedButtonConfig = {}) {
    super(config);
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as SegmentedButtonConfig;
    this._allowMultiple = cfg.allowMultiple ?? false;
    this._allowDepress = cfg.allowDepress ?? false;
  }

  protected override afterRender(): void {
    super.afterRender();
    this.el!.classList.add('x-segmented-btn');

    // Attach click interceptors to each button
    this.setupButtonListeners();
  }

  // Called when items are added — need to re-setup listeners
  private setupButtonListeners(): void {
    for (const item of this.getItems()) {
      if (item instanceof Button) {
        this.attachSegmentListener(item);
      }
    }
  }

  private attachSegmentListener(btn: Button): void {
    if ((btn as any)._segmentAttached) return;
    (btn as any)._segmentAttached = true;

    btn.el?.addEventListener('click', () => {
      this.onSegmentClick(btn);
    });
  }

  private onSegmentClick(btn: Button): void {
    if (btn.isDisabled()) return;

    const wasPressed = btn.isPressed();

    if (this._allowMultiple) {
      // Multi-select: just toggle the clicked button
      btn.toggle(!wasPressed);
    } else {
      // Single-select
      if (wasPressed) {
        if (this._allowDepress) {
          btn.toggle(false);
        }
        // else keep pressed — no action
      } else {
        // Depress all others, press this one
        for (const item of this.getItems()) {
          if (item instanceof Button && item !== btn && item.isPressed()) {
            item.toggle(false);
          }
        }
        btn.toggle(true);
      }
    }

    this.fire('toggle', this, btn, btn.isPressed());
    this.fire('change', this, this.getValue());
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  getValue(): string | string[] {
    const pressed = this.getItems()
      .filter((item): item is Button => item instanceof Button && item.isPressed())
      .map((b) => b.getValue());

    if (this._allowMultiple) return pressed;
    return pressed[0] ?? '';
  }

  setValue(value: string | string[]): void {
    const values = Array.isArray(value) ? value : [value];
    for (const item of this.getItems()) {
      if (item instanceof Button) {
        const match = values.includes(item.getValue());
        item.toggle(match);
      }
    }
    this.fire('change', this, this.getValue());
  }
}
