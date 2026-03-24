/**
 * @ext-ts/core – Hookable mixin
 *
 * Provides per-instance before/after hook points for any method.
 * Hooks fire in registration order.  Adding a hook wraps the method
 * on the instance (not the prototype), so other instances are unaffected.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import { Base } from '../class/Base.js';
import { define } from '../class/ClassManager.js';

interface HookEntry {
  before: Function[];
  after: Function[];
  original: Function;
  installed: boolean;
}

/** Per-instance hook storage.  Keyed by method name. */
const hookStore = new WeakMap<Base, Map<string, HookEntry>>();

function getHookMap(inst: Base): Map<string, HookEntry> {
  let map = hookStore.get(inst);
  if (!map) {
    map = new Map();
    hookStore.set(inst, map);
  }
  return map;
}

function ensureEntry(inst: Base, methodName: string): HookEntry {
  const map = getHookMap(inst);
  let entry = map.get(methodName);
  if (!entry) {
    // Grab original from the instance (or its prototype)
    const original = (inst as any)[methodName];
    if (typeof original !== 'function') {
      throw new Error(`Hookable: "${methodName}" is not a method on this instance`);
    }
    entry = { before: [], after: [], original, installed: false };
    map.set(methodName, entry);
  }
  return entry;
}

/**
 * Install the wrapping function on the instance that calls
 * before hooks → original → after hooks.
 */
function installWrapper(inst: Base, methodName: string, entry: HookEntry): void {
  if (entry.installed) return;
  entry.installed = true;

  (inst as any)[methodName] = function (this: any, ...args: unknown[]) {
    // Before hooks
    for (const fn of entry.before) {
      fn.apply(this, args);
    }

    // Original
    const result = entry.original.apply(this, args);

    // After hooks (receive the return value)
    for (const fn of entry.after) {
      fn.call(this, result);
    }

    return result;
  };
}

export const Hookable: typeof Base = define('Ext.mixin.Hookable', {
  /**
   * Adds a function that runs BEFORE the named method.
   * The hook receives the same arguments as the method.
   */
  addBeforeHook(this: Base, methodName: string, fn: Function): void {
    const entry = ensureEntry(this, methodName);
    entry.before.push(fn);
    installWrapper(this, methodName, entry);
  },

  /**
   * Adds a function that runs AFTER the named method.
   * The hook receives the method's return value as its single argument.
   */
  addAfterHook(this: Base, methodName: string, fn: Function): void {
    const entry = ensureEntry(this, methodName);
    entry.after.push(fn);
    installWrapper(this, methodName, entry);
  },

  /**
   * Removes a previously registered hook (before or after).
   */
  removeHook(this: Base, methodName: string, fn: Function): void {
    const map = hookStore.get(this);
    if (!map) return;
    const entry = map.get(methodName);
    if (!entry) return;

    entry.before = entry.before.filter((f) => f !== fn);
    entry.after = entry.after.filter((f) => f !== fn);
  },
});
