/**
 * @framesquared/form – FieldContainer
 *
 * A Container that groups multiple Field children under a single
 * label.  Optionally combines child validation errors.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Container } from '@framesquared/component';
import type { ContainerConfig } from '@framesquared/component';
import { Field } from './Field.js';

export interface FieldContainerConfig extends ContainerConfig {
  fieldLabel?: string;
  labelSeparator?: string;
  combineErrors?: boolean;
}

export class FieldContainer extends Container {
  static override $className = 'Ext.form.FieldContainer';

  constructor(config: FieldContainerConfig = {}) {
    super({ xtype: 'fieldcontainer', ...config });
  }

  protected override afterRender(): void {
    super.afterRender();
    const cfg = this._config as FieldContainerConfig;
    this.el!.classList.add('x-field-container');

    // Label
    if (cfg.fieldLabel) {
      const label = document.createElement('label');
      label.classList.add('x-field-label');
      label.textContent = cfg.fieldLabel + (cfg.labelSeparator ?? ':');
      this.el!.insertBefore(label, this.el!.firstChild);
    }
  }

  getErrors(): string[] {
    const errors: string[] = [];
    for (const item of this.getItems()) {
      if (item instanceof Field) {
        errors.push(...item.getErrors());
      }
    }
    return errors;
  }

  isValid(): boolean {
    return this.getItems()
      .filter((item): item is Field => item instanceof Field)
      .every(f => f.isValid());
  }
}
