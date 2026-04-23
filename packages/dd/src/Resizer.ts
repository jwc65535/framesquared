/**
 * @framesquared/dd – Resizer (Ext.panel.Resizer)
 *
 * Panel-oriented wrapper around Resizable.  Accepts a `target` that
 * exposes an `el` property (satisfied by any framesquared Panel or
 * Component) so callers never need to unwrap `panel.el` themselves.
 *
 * Default handle set is 's e se' — the conventional panel-resize
 * affordance: right edge, bottom edge, and SE corner grip.
 */

import { Resizable } from './Resizable.js';
import type { ResizableConfig } from './Resizable.js';

/** Structural interface — satisfied by Panel, Component, or any object with an `el`. */
export interface HasEl {
  el: HTMLElement | null;
}

export interface ResizerConfig extends Omit<ResizableConfig, 'el'> {
  /** The panel (or component) to make resizable. */
  target: HasEl;
  /** Handle directions. Defaults to 's e se'. */
  handles?: string;
}

export class Resizer {
  static $className = 'Ext.panel.Resizer';

  private resizable: Resizable;

  constructor(config: ResizerConfig) {
    const { target, handles = 's e se', ...rest } = config;
    if (!target.el) {
      throw new Error('Ext.panel.Resizer: target has no rendered el');
    }
    this.resizable = new Resizable({ ...rest, el: target.el, handles });
  }

  destroy(): void {
    this.resizable.destroy();
  }
}
