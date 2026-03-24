/**
 * @framesquared/data – Built-in validators
 *
 * Each factory returns a Validator function: (value) => errorMsg | null
 */

import type { Validator } from './field/Field.js';

/**
 * Value must not be null, undefined, or empty string.
 */
export function presence(message = 'is required'): Validator {
  return (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return message;
    }
    return null;
  };
}

/**
 * String length must be within min/max bounds.
 */
export function length(opts: { min?: number; max?: number; message?: string }): Validator {
  return (value: unknown) => {
    const str = String(value ?? '');
    if (opts.min !== undefined && str.length < opts.min) {
      return opts.message ?? `must be at least ${opts.min} characters`;
    }
    if (opts.max !== undefined && str.length > opts.max) {
      return opts.message ?? `must be at most ${opts.max} characters`;
    }
    return null;
  };
}

/**
 * Value must match the given regex.
 */
export function formatValidator(pattern: RegExp, message?: string): Validator {
  return (value: unknown) => {
    if (!pattern.test(String(value ?? ''))) {
      return message ?? `does not match the required format`;
    }
    return null;
  };
}

/**
 * Value must be in the allowed list.
 */
export function inclusion(list: unknown[], message?: string): Validator {
  return (value: unknown) => {
    if (!list.includes(value)) {
      return message ?? `must be one of: ${list.join(', ')}`;
    }
    return null;
  };
}

/**
 * Value must NOT be in the disallowed list.
 */
export function exclusion(list: unknown[], message?: string): Validator {
  return (value: unknown) => {
    if (list.includes(value)) {
      return message ?? `is not allowed`;
    }
    return null;
  };
}

/**
 * Numeric value must be within min/max.
 */
export function rangeValidator(opts: { min?: number; max?: number; message?: string }): Validator {
  return (value: unknown) => {
    const n = Number(value);
    if (opts.min !== undefined && n < opts.min) {
      return opts.message ?? `must be at least ${opts.min}`;
    }
    if (opts.max !== undefined && n > opts.max) {
      return opts.message ?? `must be at most ${opts.max}`;
    }
    return null;
  };
}

/**
 * Basic email format check.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function email(message = 'is not a valid email address'): Validator {
  return (value: unknown) => {
    if (!EMAIL_RE.test(String(value ?? ''))) {
      return message;
    }
    return null;
  };
}
