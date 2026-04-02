/**
 * @framesquared/component – Template
 *
 * A simple template engine that supports `{token}` replacement.
 * Used by Component to render content from data.
 *
 * ```ts
 * const tpl = new Template('<div>{name} is {age} years old</div>');
 * const html = tpl.apply({ name: 'Alice', age: 30 });
 * // → '<div>Alice is 30 years old</div>'
 * ```
 */

 

export class Template {
  private source: string;

  constructor(source: string) {
    this.source = source;
  }

  /**
   * Applies data to the template and returns the resulting HTML string.
   * Replaces `{key}` tokens with values from the data object.
   * Supports nested keys via dot notation: `{user.name}`.
   */
  apply(data: Record<string, unknown>): string {
    return this.source.replace(/\{([^}]+)\}/g, (_match, key: string) => {
      const value = this.resolve(data, key.trim());
      return value !== undefined && value !== null ? String(value) : '';
    });
  }

  /**
   * Alias for apply().
   */
  render(data: Record<string, unknown>): string {
    return this.apply(data);
  }

  private resolve(data: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = data;
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }
}
