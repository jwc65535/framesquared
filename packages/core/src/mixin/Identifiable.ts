/**
 * @ext-ts/core – Identifiable mixin
 *
 * Adds an `id` config to any class.  If no id is provided, one is
 * auto-generated via `generateId()`.  Instances are registered in a
 * global {@link IdentityMap} for lookup by id and automatically
 * removed on destroy.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Base } from '../class/Base.js';
import { define } from '../class/ClassManager.js';
import { generateId } from '../util/index.js';

// ---------------------------------------------------------------------------
// Global identity registry
// ---------------------------------------------------------------------------

class IdentityMapImpl {
  private map = new Map<string, Base>();

  register(id: string, instance: Base): void {
    this.map.set(id, instance);
  }

  unregister(id: string): void {
    this.map.delete(id);
  }

  get(id: string): Base | undefined {
    return this.map.get(id);
  }

  has(id: string): boolean {
    return this.map.has(id);
  }
}

/** Singleton global identity map. */
export const IdentityMap = new IdentityMapImpl();

// ---------------------------------------------------------------------------
// Mixin class
// ---------------------------------------------------------------------------

export const Identifiable: typeof Base = define('Ext.mixin.Identifiable', {
  config: {
    id: '',
  },

  /**
   * applyId: auto-generates an id if none provided, and registers
   * in the global identity map.
   */
  applyId(this: any, id: string, oldId: string | undefined): string {
    // Unregister old id if present
    if (oldId) {
      IdentityMap.unregister(oldId);
    }

    // Auto-generate if empty
    if (!id) {
      id = generateId('ext-ts');
    }

    // Register
    IdentityMap.register(id, this as Base);

    // Install destroy hook (only once)
    if (!this.$identifiableHooked) {
      this.$identifiableHooked = true;
      this.$destroyHooks.push(() => {
        const currentId = this.getId?.();
        if (currentId) {
          IdentityMap.unregister(currentId);
        }
      });
    }

    return id;
  },
});
