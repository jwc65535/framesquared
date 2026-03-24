/**
 * @framesquared/form – Validators
 *
 * Built-in validator functions and chain runner.
 * Each validator returns `true` on success or an error string on failure.
 */

// ---------------------------------------------------------------------------
// Individual validators
// ---------------------------------------------------------------------------

export function presence(value: unknown): true | string {
  if (value === null || value === undefined || String(value).trim() === '') {
    return 'This field is required';
  }
  return true;
}

export function length(value: unknown, opts: { min?: number; max?: number }): true | string {
  const s = String(value ?? '');
  if (opts.min !== undefined && s.length < opts.min) {
    return `Minimum length is ${opts.min}`;
  }
  if (opts.max !== undefined && s.length > opts.max) {
    return `Maximum length is ${opts.max}`;
  }
  return true;
}

export function email(value: unknown): true | string {
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(value))) return true;
  return 'Not a valid email address';
}

export function url(value: unknown): true | string {
  if (/^https?:\/\/.+/.test(String(value))) return true;
  return 'Not a valid URL';
}

export function alpha(value: unknown): true | string {
  if (/^[a-zA-Z]+$/.test(String(value))) return true;
  return 'Only letters are allowed';
}

export function alphanum(value: unknown): true | string {
  if (/^[a-zA-Z0-9]+$/.test(String(value))) return true;
  return 'Only letters and numbers are allowed';
}

export function range(value: unknown, opts: { min?: number; max?: number }): true | string {
  const n = Number(value);
  if (opts.min !== undefined && n < opts.min) return `Value must be at least ${opts.min}`;
  if (opts.max !== undefined && n > opts.max) return `Value must be at most ${opts.max}`;
  return true;
}

export function format(value: unknown, opts: { matcher: RegExp; message?: string }): true | string {
  if (opts.matcher.test(String(value))) return true;
  return opts.message ?? 'Invalid format';
}

export function inclusion(value: unknown, opts: { list: unknown[] }): true | string {
  if (opts.list.includes(value)) return true;
  return 'Value is not in the allowed list';
}

export function exclusion(value: unknown, opts: { list: unknown[] }): true | string {
  if (!opts.list.includes(value)) return true;
  return 'Value is in the excluded list';
}

export function custom(value: unknown, opts: { fn: (v: unknown) => true | string }): true | string {
  return opts.fn(value);
}

// ---------------------------------------------------------------------------
// Validator chain
// ---------------------------------------------------------------------------

interface ChainEntry {
  type: 'presence' | 'length' | 'email' | 'url' | 'alpha' | 'alphanum' | 'range' | 'format' | 'inclusion' | 'exclusion' | 'custom';
  [key: string]: unknown;
}

const VALIDATORS: Record<string, (value: unknown, opts: any) => true | string> = {
  presence: (v) => presence(v),
  length: (v, o) => length(v, o),
  email: (v) => email(v),
  url: (v) => url(v),
  alpha: (v) => alpha(v),
  alphanum: (v) => alphanum(v),
  range: (v, o) => range(v, o),
  format: (v, o) => format(v, o),
  inclusion: (v, o) => inclusion(v, o),
  exclusion: (v, o) => exclusion(v, o),
  custom: (v, o) => custom(v, o),
};

/**
 * Run a chain of validators against a value.
 * Returns an array of error strings (empty if all pass).
 */
export function validateChain(value: unknown, chain: ChainEntry[]): string[] {
  const errors: string[] = [];
  for (const entry of chain) {
    const fn = VALIDATORS[entry.type];
    if (!fn) continue;
    const result = fn(value, entry);
    if (result !== true) {
      errors.push(result);
    }
  }
  return errors;
}
