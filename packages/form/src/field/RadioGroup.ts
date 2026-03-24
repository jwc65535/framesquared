/**
 * @ext-ts/form – RadioGroup
 *
 * A container for Radio fields.  Only one radio can be selected
 * at a time (enforced by Radio's group mechanism).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Container } from '@ext-ts/component';
import type { ContainerConfig } from '@ext-ts/component';
import { Radio } from './Radio.js';

export interface RadioGroupConfig extends ContainerConfig {
  columns?: number;
  vertical?: boolean;
}

export class RadioGroup extends Container {
  static override $className = 'Ext.form.RadioGroup';

  constructor(config: RadioGroupConfig = {}) {
    super({ xtype: 'radiogroup', ...config });
  }

  protected override afterRender(): void {
    super.afterRender();
    this.el!.classList.add('x-radio-group');

    const cfg = this._config as RadioGroupConfig;
    if (cfg.columns) {
      const body = this.getBodyEl();
      body.style.display = 'grid';
      body.style.gridTemplateColumns = `repeat(${cfg.columns}, 1fr)`;
    }
  }

  getValue(): string {
    for (const item of this.getItems()) {
      if (item instanceof Radio && item.isChecked()) {
        return item.getValue();
      }
    }
    return '';
  }

  setValue(value: string): void {
    for (const item of this.getItems()) {
      if (item instanceof Radio) {
        item.setChecked((item as any)._inputValue === value);
      }
    }
  }
}
