/**
 * @framesquared/core – Plugin base class
 *
 * Base class for plugins used with the Pluggable mixin.
 * Each plugin has an `id`, an `init(owner)` lifecycle hook, and
 * is destroyed when its owner is destroyed.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Base } from './class/Base.js';
import { generateId } from './util/index.js';
import { capitalize } from './util/String.js';

/**
 * Declare the config-generated methods so TypeScript knows about them.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface Plugin {
  getId(): string;
  setId(id: string): void;
  getOwner(): Base | null;
  setOwner(owner: Base | null): void;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class Plugin extends Base {
  static override $className = 'Plugin';

  // $configDefs for the define()-style config system
  static override $configDefs: Record<string, unknown> = {
    id: '',
    owner: null,
  };

  /**
   * Initialises this plugin.  Called by the Pluggable mixin after the
   * plugin is added to an owner.
   */
  init(owner: Base): void {
    (this as any).setOwner(owner);
  }

  /**
   * Override of initConfig that ensures an auto-generated id.
   */
  override initConfig(config?: Record<string, unknown>): void {
    super.initConfig(config);

    // Auto-generate id if not provided
    if (!(this as any).$configInitialized.has('id') || !(this as any)._id) {
      const setter = `set${capitalize('id')}`;
      if (typeof (this as any)[setter] === 'function') {
        (this as any)[setter](generateId('plugin'));
      }
    }
  }
}
