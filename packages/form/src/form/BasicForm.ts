/**
 * @framesquared/form – BasicForm
 *
 * Core form logic separated from UI.  Manages a collection of
 * Field instances, collects/distributes values, validates,
 * and handles submit/load via fetch().
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Field } from '../field/Field.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SubmitOptions {
  url?: string;
  method?: string;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  clientValidation?: boolean;
  jsonSubmit?: boolean;
}

export interface SubmitResult {
  success: boolean;
  data?: any;
  errors?: any;
}

// ---------------------------------------------------------------------------
// BasicForm
// ---------------------------------------------------------------------------

export class BasicForm {
  private fields: Field[] = [];

  // -----------------------------------------------------------------------
  // Field management
  // -----------------------------------------------------------------------

  addField(field: Field): void {
    if (!this.fields.includes(field)) {
      this.fields.push(field);
    }
  }

  removeField(field: Field): void {
    const idx = this.fields.indexOf(field);
    if (idx !== -1) this.fields.splice(idx, 1);
  }

  getFields(): Field[] {
    return [...this.fields];
  }

  findField(name: string): Field | undefined {
    return this.fields.find(f => f.getName() === name);
  }

  // -----------------------------------------------------------------------
  // Values
  // -----------------------------------------------------------------------

  getValues(asString = false, dirtyOnly = false): Record<string, unknown> | string {
    const values: Record<string, unknown> = {};
    for (const field of this.fields) {
      const name = field.getName();
      if (!name) continue;
      if (dirtyOnly && !field.isDirty()) continue;
      values[name] = field.getSubmitValue?.() ?? field.getValue();
    }
    if (asString) {
      return new URLSearchParams(values as Record<string, string>).toString();
    }
    return values;
  }

  setValues(values: Record<string, unknown>): void {
    for (const [key, val] of Object.entries(values)) {
      const field = this.findField(key);
      if (field) field.setValue(val);
    }
  }

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  isValid(): boolean {
    return this.fields.every(f => f.isValid());
  }

  isDirty(): boolean {
    return this.fields.some(f => f.isDirty());
  }

  reset(): void {
    for (const field of this.fields) field.reset();
  }

  clearInvalid(): void {
    for (const field of this.fields) field.clearInvalid();
  }

  markInvalid(errors: { field: string; message: string }[]): void {
    for (const err of errors) {
      const field = this.findField(err.field);
      if (field) field.markInvalid(err.message);
    }
  }

  // -----------------------------------------------------------------------
  // Submit / Load
  // -----------------------------------------------------------------------

  async submit(url: string, options: SubmitOptions = {}): Promise<SubmitResult> {
    const method = options.method ?? 'POST';
    const values = this.getValues() as Record<string, unknown>;
    const params = { ...values, ...(options.params ?? {}) };

    let body: string;
    const headers: Record<string, string> = { ...(options.headers ?? {}) };

    if (options.jsonSubmit) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(params);
    } else {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      body = new URLSearchParams(params as Record<string, string>).toString();
    }

    const response = await fetch(url, { method, headers, body });
    const data = await response.json();

    return {
      success: response.ok && data.success !== false,
      data,
    };
  }

  async load(url: string, options: SubmitOptions = {}): Promise<SubmitResult> {
    const method = options.method ?? 'GET';
    const response = await fetch(url, { method });
    const data = await response.json();

    if (response.ok && data.data) {
      this.setValues(data.data);
    }

    return { success: response.ok, data };
  }
}
