/**
 * @framesquared/theme – ThemeValidator
 *
 * Opt-in token validation.  Call `new ThemeValidator().validate(theme)` to
 * get a list of type errors in a theme's token values.  Useful in tests and
 * development builds to catch mistakes like putting a shadow string where a
 * color is expected.
 *
 * Validation is structural — it checks that token values match the type
 * expected for each well-known token category:
 *
 *   color.*              → valid CSS color string (#hex, rgb(), hsl(), etc.)
 *   spacing.*            → number
 *   borderRadius.*       → number OR CSS length/percentage string
 *   typography.fontSize  → number
 *   typography.fontWeight → number
 *   typography.lineHeight → number
 *   breakpoints.*        → number
 *   transition.*         → CSS time string (e.g. "200ms", "0.3s")
 *   zIndex.*             → number
 *
 * Token categories not listed above (shadow.*, typography.fontFamily.*,
 * component.*) contain heterogeneous or freeform values and are not checked.
 */

import type { Theme } from './Theme.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ValidationError {
  /** The CSS variable name that failed validation (e.g. "--ext-color-primary"). */
  varName: string;
  /** The raw token value that was rejected. */
  value: unknown;
  /** Human-readable description of the problem. */
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ---------------------------------------------------------------------------
// ThemeValidator
// ---------------------------------------------------------------------------

export class ThemeValidator {
  validate(theme: Theme): ValidationResult {
    const errors: ValidationError[] = [];

    for (const [varName, value] of theme.getFlatTokens()) {
      const err = this._checkToken(varName, value);
      if (err) errors.push({ varName, value, message: err });
    }

    return { valid: errors.length === 0, errors };
  }

  // -------------------------------------------------------------------------
  // Per-category checks
  // -------------------------------------------------------------------------

  private _checkToken(varName: string, value: unknown): string | null {
    if (varName.startsWith('--ext-color-')) {
      return this._expectColor(value);
    }

    if (
      varName.startsWith('--ext-spacing-') ||
      varName.startsWith('--ext-breakpoints-') ||
      varName.startsWith('--ext-zIndex-')
    ) {
      return this._expectNumber(value);
    }

    if (
      varName.startsWith('--ext-typography-fontSize-') ||
      varName.startsWith('--ext-typography-fontWeight-') ||
      varName.startsWith('--ext-typography-lineHeight-')
    ) {
      return this._expectNumber(value);
    }

    if (varName.startsWith('--ext-borderRadius-')) {
      return this._expectBorderRadius(value);
    }

    if (varName.startsWith('--ext-transition-')) {
      return this._expectTimeValue(value);
    }

    // shadow.*, typography.fontFamily.*, component.* — freeform, skip.
    return null;
  }

  // -------------------------------------------------------------------------
  // Type checkers
  // -------------------------------------------------------------------------

  private _expectColor(value: unknown): string | null {
    if (typeof value !== 'string') {
      return `Expected a CSS color string, got ${typeof value}`;
    }
    const s = value.trim();
    if (
      /^#[0-9a-fA-F]{3}$/.test(s) ||
      /^#[0-9a-fA-F]{4}$/.test(s) ||
      /^#[0-9a-fA-F]{6}$/.test(s) ||
      /^#[0-9a-fA-F]{8}$/.test(s) ||
      /^rgba?\s*\(/.test(s) ||
      /^hsla?\s*\(/.test(s) ||
      /^(transparent|currentColor|inherit|initial|unset)$/.test(s)
    ) {
      return null;
    }
    return `"${s}" is not a recognised CSS color value`;
  }

  private _expectNumber(value: unknown): string | null {
    if (typeof value !== 'number' || !isFinite(value)) {
      return `Expected a finite number, got ${JSON.stringify(value)}`;
    }
    return null;
  }

  private _expectBorderRadius(value: unknown): string | null {
    if (typeof value === 'number') {
      return value >= 0 ? null : `Border-radius number must be ≥ 0, got ${value}`;
    }
    if (typeof value === 'string') {
      const s = value.trim();
      if (/^\d+(\.\d+)?(px|%|em|rem|vw|vh|vmin|vmax)?$/.test(s)) return null;
      return `"${s}" is not a valid border-radius value`;
    }
    return `Expected a number or CSS length string, got ${typeof value}`;
  }

  private _expectTimeValue(value: unknown): string | null {
    if (typeof value !== 'string') {
      return `Expected a CSS time string (e.g. "200ms"), got ${typeof value}`;
    }
    if (/^\d+(\.\d+)?(ms|s)$/.test(value.trim())) return null;
    return `"${value}" is not a valid CSS time value`;
  }
}
