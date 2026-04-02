/**
 * @framesquared/core – Factoryable
 *
 * Static factory that creates `Base` instances from flexible input:
 *
 * - Config object with `xtype` or `type` → alias lookup via ClassManager
 * - Plain string → treated as an alias
 * - Existing Base instance → returned as-is
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Base } from '../class/Base.js';
import { ClassManager } from '../class/ClassManager.js';

export const Factoryable = {
  /**
   * Creates a `Base` instance from a config descriptor.
   *
   * @param config  An object with `xtype`/`type`, a string alias, or
   *                an existing `Base` instance.
   */
  create(config: string | Base | Record<string, any>): Base {
    // Already an instance — return as-is.
    if (config instanceof Base) {
      return config;
    }

    // String shorthand — treat as alias.
    if (typeof config === 'string') {
      return ClassManager.instantiateByAlias(config);
    }

    // Object with xtype / type
    const alias = config.xtype ?? config.type;
    if (!alias || typeof alias !== 'string') {
      throw new Error(
        'Factoryable.create(): config must have an "xtype" or "type" property, ' +
          'be a string alias, or be a Base instance',
      );
    }

    // Remove xtype/type from the config passed to the constructor
    const { xtype: _x, type: _t, ...rest } = config;
    return ClassManager.instantiateByAlias(alias, rest);
  },
};
