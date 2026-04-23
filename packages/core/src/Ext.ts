/**
 * @framesquared/core – Ext namespace
 *
 * Provides the top-level `Ext` object that mirrors the ExtJS global API
 * surface used in configuration-driven code:
 *
 *   Ext.create('Ext.panel.Panel', { ... })
 *   Ext.getBody()
 */

import { ClassManager } from './class/ClassManager.js';

export const Ext = {
  /**
   * Creates an instance of a registered framesquared class by its full
   * class name (the value stored in `$className`).
   *
   * @example
   *   Ext.create('Ext.panel.Panel', { title: 'Hello', width: 300 })
   */
  create<T = unknown>(className: string, config: Record<string, unknown> = {}): T {
    const Cls = ClassManager.get(className);
    if (!Cls) {
      throw new Error(`Ext.create: no class registered for "${className}"`);
    }
    return new (Cls as new (cfg: Record<string, unknown>) => T)(config);
  },

  /** Returns document.body — suitable for use as `renderTo: Ext.getBody()`. */
  getBody(): HTMLBodyElement {
    return document.body as HTMLBodyElement;
  },
};
