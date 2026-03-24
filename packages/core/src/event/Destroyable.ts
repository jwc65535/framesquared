/**
 * @framesquared/core – Destroyable
 *
 * Interface for objects that support deterministic cleanup, plus a
 * utility to combine multiple destroyables into one.
 */

export interface Destroyable {
  destroy(): void;
}

export const DestroyableUtil = {
  /**
   * Returns a single {@link Destroyable} whose `destroy()` method calls
   * `destroy()` on every item.  The combined handle is idempotent — second
   * and subsequent calls are no-ops.
   */
  combine(...items: Destroyable[]): Destroyable {
    let destroyed = false;
    return {
      destroy() {
        if (destroyed) return;
        destroyed = true;
        for (const item of items) {
          item.destroy();
        }
      },
    };
  },
};
