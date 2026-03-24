/**
 * @ext-ts/theme – StyleSheet
 *
 * Manages CSS rule injection via a <style> element.  Supports
 * addRule/removeRule with camelCase→kebab-case conversion.
 */

let ruleCounter = 0;

function toKebab(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

export class StyleSheet {
  private _styleEl: HTMLStyleElement;
  private _rules = new Map<number, string>();

  constructor(name: string) {
    this._styleEl = document.createElement('style');
    this._styleEl.setAttribute('data-ext-stylesheet', name);
  }

  getStyleElement(): HTMLStyleElement {
    return this._styleEl;
  }

  /**
   * Add a CSS rule.  Returns an ID that can be used to remove it.
   */
  addRule(selector: string, styles: Record<string, string | number>): number {
    const id = ruleCounter++;
    const declarations = Object.entries(styles)
      .map(([prop, val]) => `${toKebab(prop)}: ${val}`)
      .join('; ');
    const ruleText = `${selector} { ${declarations}; }`;
    this._rules.set(id, ruleText);
    this.rebuild();
    return id;
  }

  /**
   * Remove a previously added rule by its ID.
   */
  removeRule(id: number): void {
    this._rules.delete(id);
    this.rebuild();
  }

  /**
   * Remove the style element from DOM and clear all rules.
   */
  destroy(): void {
    if (this._styleEl.parentNode) {
      this._styleEl.parentNode.removeChild(this._styleEl);
    }
    this._rules.clear();
  }

  private rebuild(): void {
    this._styleEl.textContent = Array.from(this._rules.values()).join('\n');
  }
}
