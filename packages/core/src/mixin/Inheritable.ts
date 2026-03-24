/**
 * @ext-ts/core – Inheritable mixin
 *
 * Provides hierarchical parent → child config inheritance.  Each instance
 * can have an "inherited parent" whose inherited state is merged with the
 * instance's own inherited state.  Lookup walks up the chain.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Base } from '../class/Base.js';
import { define } from '../class/ClassManager.js';

// Per-instance storage for inherited state and parent reference.
const ownState = new WeakMap<Base, Record<string, unknown>>();
const parentRef = new WeakMap<Base, Base>();

export const Inheritable: typeof Base = define('Ext.mixin.Inheritable', {
  /**
   * Sets the parent in the inherited-state chain.
   */
  setInheritedParent(this: Base, parent: Base): void {
    parentRef.set(this, parent);
  },

  /**
   * Returns the parent in the inherited-state chain, or undefined.
   */
  getInheritedParent(this: Base): Base | undefined {
    return parentRef.get(this);
  },

  /**
   * Stores this instance's own inherited state.  This is typically
   * called during component setup.
   */
  initInheritedState(this: Base, state: Record<string, unknown>): void {
    ownState.set(this, state);
  },

  /**
   * Returns the fully merged inherited state, walking up the parent chain.
   * Own state overrides parent state on key collisions.
   */
  getInherited(this: Base): Record<string, unknown> {
    const parent = parentRef.get(this);
    const parentState = parent && typeof (parent as any).getInherited === 'function'
      ? (parent as any).getInherited()
      : {};
    const own = ownState.get(this) ?? {};
    return { ...parentState, ...own };
  },

  /**
   * Resolves a single key by walking up the inherited chain.
   * Returns the first defined value found, or undefined.
   */
  getInheritedConfig(this: Base, key: string): unknown {
    const own = ownState.get(this);
    if (own && key in own) {
      return own[key];
    }
    const parent = parentRef.get(this);
    if (parent && typeof (parent as any).getInheritedConfig === 'function') {
      return (parent as any).getInheritedConfig(key);
    }
    return undefined;
  },
});
