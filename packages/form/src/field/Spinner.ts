/**
 * @framesquared/form – Spinner
 *
 * Abstract base for fields with up/down spin behavior.
 * Extends TextField with spinner triggers and ArrowUp/ArrowDown keyboard.
 * Subclasses implement onSpinUp() and onSpinDown().
 */

import { TextField } from './Text.js';
import type { TextFieldConfig } from './Text.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SpinnerConfig extends TextFieldConfig {}

export abstract class Spinner extends TextField {
  static override $className = 'Ext.form.field.Spinner';

  constructor(config: SpinnerConfig = {}) {
    const triggers = [
      { type: 'spinner-up', handler: () => this.spinUp() },
      { type: 'spinner-down', handler: () => this.spinDown() },
      ...(config.triggers ?? []),
    ];
    super({ xtype: 'spinnerfield', ...config, triggers });
  }

  protected override afterRender(): void {
    super.afterRender();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.el!.classList.add('x-spinner');

    // Keyboard up/down
    this.getInputEl().addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.spinUp();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.spinDown();
      }
    });
  }

  spinUp(): void {
    this.onSpinUp();
    this.fire('spin', this, 'up');
  }

  spinDown(): void {
    this.onSpinDown();
    this.fire('spin', this, 'down');
  }

  protected abstract onSpinUp(): void;
  protected abstract onSpinDown(): void;
}
