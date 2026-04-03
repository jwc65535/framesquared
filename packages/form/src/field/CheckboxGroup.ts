/**
 * @framesquared/form – CheckboxGroup
 *
 * A container for Checkbox fields arranged in columns.
 * getValue returns array of checked values.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Container } from '@framesquared/component';
import type { ContainerConfig } from '@framesquared/component';
import { Checkbox } from './Checkbox.js';

export interface CheckboxGroupConfig extends ContainerConfig {
  columns?: number;
  vertical?: boolean;
}

export class CheckboxGroup extends Container {
  static override $className = 'Ext.form.CheckboxGroup';

  constructor(config: CheckboxGroupConfig = {}) {
    super({ xtype: 'checkboxgroup', ...config });
  }

  protected override afterRender(): void {
    super.afterRender();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.el!.classList.add('x-checkbox-group');

    const cfg = this._config as CheckboxGroupConfig;
    if (cfg.columns) {
      const body = this.getBodyEl();
      body.style.display = 'grid';
      body.style.gridTemplateColumns = `repeat(${cfg.columns}, 1fr)`;
    }
  }

  getValue(): string[] {
    return this.getItems()
      .filter((item): item is Checkbox => item instanceof Checkbox && item.isChecked())
      .map((cb) => cb.getValue());
  }

  setValue(values: string[]): void {
    for (const item of this.getItems()) {
      if (item instanceof Checkbox) {
        item.setChecked(
          values.includes(item.getValue()) || values.includes((item as any)._inputValue),
        );
      }
    }
  }
}
