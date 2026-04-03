/**
 * @framesquared/form – FormPanel
 *
 * A Panel that manages form fields.  Extends Panel to provide
 * automatic field collection, validation, value management,
 * and submit/load via fetch().
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Panel } from '@framesquared/ui';
import type { PanelConfig } from '@framesquared/ui';
import { Component } from '@framesquared/component';
import { BasicForm } from './form/BasicForm.js';
import type { SubmitOptions, SubmitResult } from './form/BasicForm.js';
import { Field } from './field/Field.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface FormPanelConfig extends PanelConfig {
  url?: string;
  method?: 'GET' | 'POST';
  standardSubmit?: boolean;
  jsonSubmit?: boolean;
  waitMsg?: string;
  trackResetOnLoad?: boolean;
  fieldDefaults?: Record<string, unknown>;
  timeout?: number;
}

// ---------------------------------------------------------------------------
// FormPanel
// ---------------------------------------------------------------------------

export class FormPanel extends Panel {
  static override $className = 'Ext.form.Panel';

  declare private _basicForm: BasicForm;
  declare private _url: string;
  declare private _method: string;
  declare private _jsonSubmit: boolean;

  constructor(config: FormPanelConfig = {}) {
    // Apply fieldDefaults to items
    if (config.fieldDefaults && config.items) {
      config.items = (config.items as any[]).map((item) => {
        if (item instanceof Component) {
          const cfg = (item as any)._config;
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          for (const [k, v] of Object.entries(config.fieldDefaults!)) {
            if (cfg[k] === undefined) cfg[k] = v;
          }
          return item;
        }
        return { ...config.fieldDefaults, ...item };
      });
    }
    super({ xtype: 'form', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as FormPanelConfig;
    this._basicForm = new BasicForm();
    this._url = cfg.url ?? '';
    this._method = cfg.method ?? 'POST';
    this._jsonSubmit = cfg.jsonSubmit ?? false;
  }

  protected override afterRender(): void {
    super.afterRender();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.el!.classList.add('x-form');
    // Collect fields from children
    this.collectFields();
  }

  // -----------------------------------------------------------------------
  // Field collection
  // -----------------------------------------------------------------------

  private collectFields(): void {
    this.walkItems(this as any, (item: Component) => {
      if (item instanceof Field) {
        this._basicForm.addField(item);
      }
    });
  }

  private walkItems(container: any, fn: (item: Component) => void): void {
    const items = container.getItems?.() ?? [];
    for (const item of items) {
      fn(item);
      if (typeof item.getItems === 'function') {
        this.walkItems(item, fn);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Public API (delegates to BasicForm)
  // -----------------------------------------------------------------------

  getValues(asString = false, dirtyOnly = false): Record<string, unknown> | string {
    return this._basicForm.getValues(asString, dirtyOnly);
  }

  setValues(values: Record<string, unknown>): void {
    this._basicForm.setValues(values);
  }

  isFormValid(): boolean {
    return this._basicForm.isValid();
  }

  // Override component's isValid concept
  isValid(): boolean {
    return this._basicForm.isValid();
  }

  isDirty(): boolean {
    return this._basicForm.isDirty();
  }

  getFields(): Field[] {
    return this._basicForm.getFields();
  }

  findField(name: string): Field | undefined {
    return this._basicForm.findField(name);
  }

  reset(): void {
    this._basicForm.reset();
  }

  clearInvalid(): void {
    this._basicForm.clearInvalid();
  }

  markInvalid(errors: { field: string; message: string }[]): void {
    this._basicForm.markInvalid(errors);
  }

  hasInvalidField(): boolean {
    return !this._basicForm.isValid();
  }

  // -----------------------------------------------------------------------
  // Submit
  // -----------------------------------------------------------------------

  async submit(
    options: SubmitOptions & { clientValidation?: boolean } = {},
  ): Promise<SubmitResult> {
    // Client validation
    if (options.clientValidation !== false && options.clientValidation !== undefined) {
      if (!this.isValid()) {
        return { success: false, errors: 'Validation failed' };
      }
    }

    const url = options.url ?? this._url;
    if (!url) return { success: false, errors: 'No URL specified' };

    this.fire('beforeaction', this, 'submit');

    try {
      const result = await this._basicForm.submit(url, {
        method: options.method ?? this._method,
        params: options.params,
        headers: options.headers,
        jsonSubmit: options.jsonSubmit ?? this._jsonSubmit,
      });

      if (result.success) {
        this.fire('actioncomplete', this, result);
      } else {
        this.fire('actionfailed', this, result);
      }

      return result;
    } catch (err) {
      const result = { success: false, errors: err };
      this.fire('actionfailed', this, result);
      return result;
    }
  }

  // -----------------------------------------------------------------------
  // Load
  // -----------------------------------------------------------------------

  async load(options: SubmitOptions = {}): Promise<void> {
    const url = options.url ?? this._url;
    if (!url) return;

    this.fire('beforeaction', this, 'load');

    try {
      const result = await this._basicForm.load(url, {
        method: options.method ?? 'GET',
      });

      if (result.success) {
        this.fire('actioncomplete', this, result);
      } else {
        this.fire('actionfailed', this, result);
      }
    } catch (err) {
      this.fire('actionfailed', this, { success: false, errors: err });
    }
  }
}
