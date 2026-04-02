/**
 * @framesquared/form – Radio
 *
 * A radio button field.  Uses native <input type="radio"> with
 * group tracking to ensure single selection per name group.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Checkbox } from './Checkbox.js';
import type { CheckboxConfig } from './Checkbox.js';

// Module-level radio group registry
const radioGroups = new Map<string, Set<Radio>>();

export class Radio extends Checkbox {
  static override $className = 'Ext.form.field.Radio';

  constructor(config: CheckboxConfig = {}) {
    super({ xtype: 'radiofield', ...config });
  }

  protected override afterRender(): void {
    super.afterRender();

    // Convert to radio
    this._inputEl.type = 'radio';
    this.el!.classList.remove('x-checkbox');
    this.el!.classList.add('x-radio');

    // Register in group
    if (this._name) {
      let group = radioGroups.get(this._name);
      if (!group) {
        group = new Set();
        radioGroups.set(this._name, group);
      }
      group.add(this);
    }
  }

  override setChecked(checked: boolean): void {
    if (checked && this._name) {
      // Uncheck other radios in same group
      const group = radioGroups.get(this._name);
      if (group) {
        for (const radio of group) {
          if (radio !== this && radio._checked) {
            radio._checked = false;
            if (radio._inputEl) radio._inputEl.checked = false;
          }
        }
      }
    }
    super.setChecked(checked);
  }

  getGroupValue(): string {
    if (this._name) {
      const group = radioGroups.get(this._name);
      if (group) {
        for (const radio of group) {
          if (radio.isChecked()) return radio._inputValue;
        }
      }
    }
    return '';
  }

  protected override onDestroy(): void {
    if (this._name) {
      radioGroups.get(this._name)?.delete(this);
    }
    super.onDestroy();
  }
}
