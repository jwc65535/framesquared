/**
 * @ext-ts/component – Layout (placeholder)
 *
 * Base layout class.  Actual layout managers (HBox, VBox, Border, etc.)
 * will be implemented in @ext-ts/layout.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface LayoutConfig {
  type?: string;
  [key: string]: unknown;
}

export class Layout {
  readonly type: string;

  constructor(config: LayoutConfig = {}) {
    this.type = config.type ?? 'auto';
  }

  /**
   * Performs layout calculation on the owner container.
   * Override in subclasses.
   */
  doLayout(_owner: any): void {
    // Auto layout: no-op — children use natural flow
  }
}

/**
 * Resolves a layout config to a Layout instance.
 */
export function resolveLayout(config: string | LayoutConfig | undefined): Layout {
  if (!config) return new Layout();
  if (typeof config === 'string') return new Layout({ type: config });
  return new Layout(config);
}
