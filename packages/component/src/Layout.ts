/**
 * @framesquared/component – Layout (placeholder)
 *
 * Base layout class.  Actual layout managers (HBox, VBox, Border, etc.)
 * will be implemented in @framesquared/layout.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface LayoutConfig {
  type?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Layout registry
// ---------------------------------------------------------------------------

const _registry = new Map<string, new (config: LayoutConfig) => Layout>();

/**
 * Register a Layout subclass under a string alias.
 * Called by @framesquared/layout at module init time.
 */
export function registerLayout(type: string, Cls: new (config: any) => any): void {
  _registry.set(type, Cls as new (config: LayoutConfig) => Layout);
}

// ---------------------------------------------------------------------------
// Base Layout
// ---------------------------------------------------------------------------

export class Layout {
  readonly type: string;

  constructor(config: LayoutConfig = {}) {
    this.type = config.type ?? 'auto';
  }

  /**
   * Apply CSS to the container's body element.
   * No-op in the base class; overridden by BoxLayout etc.
   */
  configureContainer(_el: HTMLElement): void {}

  /**
   * Performs layout on the owner container.
   * Override in subclasses.
   */
  doLayout(_owner: any): void {
    // Auto layout: no-op — children use natural flow
  }
}

/**
 * Resolves a layout config to a Layout instance.
 * Uses the registry so that layouts registered by @framesquared/layout
 * are returned with the correct subclass.
 */
export function resolveLayout(config: string | LayoutConfig | undefined): Layout {
  if (!config) return new Layout();
  const cfg = typeof config === 'string' ? { type: config } : config;
  const type = cfg.type ?? 'auto';
  const Cls = _registry.get(type);
  return Cls ? new Cls(cfg) : new Layout(cfg);
}
