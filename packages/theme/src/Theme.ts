/**
 * @ext-ts/theme – Theme
 *
 * A design token container.  Tokens are a nested object of values
 * (colors, spacing, typography, etc.).  Themes can inherit from
 * a parent — child tokens override parent tokens.  apply() sets
 * all tokens as CSS custom properties on :root.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ThemeConfig {
  name: string;
  parent?: Theme;
  tokens: Record<string, unknown>;
}

export class Theme {
  private _name: string;
  private _parent: Theme | null;
  private _tokens: Record<string, unknown>;
  private _appliedVars: string[] = [];

  constructor(config: ThemeConfig) {
    this._name = config.name;
    this._parent = config.parent ?? null;
    this._tokens = this.deepClone(config.tokens);
  }

  getName(): string {
    return this._name;
  }

  // -----------------------------------------------------------------------
  // Token access
  // -----------------------------------------------------------------------

  getToken(path: string): unknown {
    // Check local tokens first
    const local = this.getByPath(this._tokens, path);
    if (local !== undefined) return local;
    // Fall back to parent
    if (this._parent) return this._parent.getToken(path);
    return undefined;
  }

  setToken(path: string, value: unknown): void {
    this.setByPath(this._tokens, path, value);
  }

  // -----------------------------------------------------------------------
  // CSS custom properties
  // -----------------------------------------------------------------------

  apply(): void {
    this._appliedVars = [];
    const flat = this.flatten();
    const root = document.documentElement;
    for (const [varName, value] of flat) {
      root.style.setProperty(varName, String(value));
      this._appliedVars.push(varName);
    }
  }

  unapply(): void {
    const root = document.documentElement;
    for (const varName of this._appliedVars) {
      root.style.removeProperty(varName);
    }
    this._appliedVars = [];
  }

  getVariableNames(): string[] {
    return this.flatten().map(([name]) => name);
  }

  // -----------------------------------------------------------------------
  // Flatten tokens to CSS variable pairs
  // -----------------------------------------------------------------------

  private flatten(): [string, unknown][] {
    const result: [string, unknown][] = [];
    // Merge parent tokens first, then local tokens override
    const merged = this.getMergedTokens();
    this.flattenObj(merged, '--ext', result);
    return result;
  }

  private getMergedTokens(): Record<string, unknown> {
    if (!this._parent) return this._tokens;
    const parentTokens = (this._parent as any).getMergedTokens();
    return this.deepMerge(parentTokens, this._tokens);
  }

  private flattenObj(obj: any, prefix: string, result: [string, unknown][]): void {
    for (const [key, value] of Object.entries(obj)) {
      const varName = `${prefix}-${key}`;
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        this.flattenObj(value, varName, result);
      } else {
        result.push([varName, value]);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private getByPath(obj: any, path: string): unknown {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current == null || typeof current !== 'object') return undefined;
      current = current[part];
    }
    return current;
  }

  private setByPath(obj: any, path: string, value: unknown): void {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]] == null || typeof current[parts[i]] !== 'object') {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }

  private deepClone(obj: Record<string, unknown>): Record<string, unknown> {
    return JSON.parse(JSON.stringify(obj));
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (
        source[key] !== null &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        target[key] !== null &&
        typeof target[key] === 'object' &&
        !Array.isArray(target[key])
      ) {
        result[key] = this.deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
}
