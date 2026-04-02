/**
 * @framesquared/core – ClassManager + define()
 *
 * Central registry for framesquared classes and the `define()` factory that
 * creates, configures, and registers new classes in a single call.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import { Base, processClassConfigs, wrapMethod } from './Base.js';

// ---------------------------------------------------------------------------
// ClassDefinition type
// ---------------------------------------------------------------------------

export interface ClassDefinition {
  /** Parent class (defaults to Base). */
  extend?: typeof Base;
  /** Mixins to apply. */
  mixins?: (typeof Base)[];
  /** One or more alias strings for ClassManager lookup. */
  alias?: string | string[];
  /** Config property defaults (auto-generates getX / setX). */
  config?: Record<string, unknown>;
  /** Static members to copy onto the constructor. */
  statics?: Record<string, unknown>;
  /** Any other properties are treated as prototype methods / members. */
  [key: string]: unknown;
}

// Reserved keys that are NOT copied to the prototype as methods.
const RESERVED_DEF_KEYS = new Set(['extend', 'mixins', 'alias', 'config', 'statics']);

// ---------------------------------------------------------------------------
// ClassManager singleton
// ---------------------------------------------------------------------------

class ClassManagerImpl {
  /** className → constructor */
  private classes = new Map<string, typeof Base>();

  /** alias → constructor */
  private aliases = new Map<string, typeof Base>();

  // -- Registration -------------------------------------------------------

  register(name: string, cls: typeof Base): void {
    this.classes.set(name, cls);
  }

  // -- Lookup -------------------------------------------------------------

  get(name: string): typeof Base | undefined {
    return this.classes.get(name);
  }

  getByAlias(alias: string): typeof Base | undefined {
    return this.aliases.get(alias);
  }

  isRegistered(name: string): boolean {
    return this.classes.has(name);
  }

  /**
   * Returns all registered class names that start with `prefix`.
   */
  getNamesByPrefix(prefix: string): string[] {
    const result: string[] = [];
    for (const name of this.classes.keys()) {
      if (name.startsWith(prefix)) result.push(name);
    }
    return result;
  }

  // -- Instantiation ------------------------------------------------------

  /**
   * Creates an instance by alias, passing remaining args to the constructor.
   */
  instantiateByAlias(alias: string, ...args: any[]): Base {
    const Cls = this.aliases.get(alias);
    if (!Cls) {
      throw new Error(`ClassManager: no class registered for alias "${alias}"`);
    }
    return new (Cls as any)(...args) as Base;
  }

  // -- Alias management (used by define) ----------------------------------

  registerAlias(alias: string, cls: typeof Base): void {
    this.aliases.set(alias, cls);
  }
}

/** Singleton instance. */
export const ClassManager = new ClassManagerImpl();

// ---------------------------------------------------------------------------
// Mixin application
// ---------------------------------------------------------------------------

function applyMixins(targetClass: typeof Base, mixins: (typeof Base)[]): void {
  if (!targetClass.$mixins) {
    targetClass.$mixins = new Set();
  }

  for (const mixin of mixins) {
    // Guard against diamond: skip if already applied.
    if (targetClass.$mixins.has(mixin)) continue;

    targetClass.$mixins.add(mixin);

    // Also pull in the mixin's own mixins (transitive).
    if (mixin.$mixins) {
      for (const transitive of mixin.$mixins) {
        targetClass.$mixins.add(transitive);
      }
    }

    // Copy prototype members (methods, getters, etc.) — don't overwrite.
    for (const name of Object.getOwnPropertyNames(mixin.prototype)) {
      if (name === 'constructor') continue;
      // Don't overwrite existing members on the target.
      if (name in targetClass.prototype) continue;

      const desc = Object.getOwnPropertyDescriptor(mixin.prototype, name);
      if (desc) {
        Object.defineProperty(targetClass.prototype, name, desc);
      }
    }

    // Merge mixin config defs (mixin defaults lose to target defaults).
    if (mixin.$configDefs) {
      targetClass.$configDefs = {
        ...mixin.$configDefs,
        ...(targetClass.$configDefs || {}),
      };
    }
  }
}

// ---------------------------------------------------------------------------
// define()
// ---------------------------------------------------------------------------

/**
 * Creates a new class, applies mixins, sets up config accessors, wraps
 * methods for `callParent()`, registers with {@link ClassManager}, and
 * returns the ready-to-use constructor.
 *
 * ```ts
 * const Button = define('ui.Button', {
 *   extend: Component,
 *   mixins: [Focusable],
 *   alias: 'widget.button',
 *   config: { text: '', disabled: false },
 *   onClick() { ... },
 * });
 * ```
 */
export function define(className: string, definition: ClassDefinition): typeof Base {
  const SuperClass = definition.extend || Base;

  // 1. Create the subclass dynamically.
  const NewClass = class extends SuperClass {} as unknown as typeof Base & (new (...args: any[]) => any);

  // Set class identity.
  NewClass.$className = className;

  // 2. Own config definitions.
  if (definition.config) {
    // Start from parent's defs (if any), overlay own.
    NewClass.$configDefs = {
      ...(SuperClass.$configDefs || {}),
      ...definition.config,
    };
  } else {
    // Still inherit parent defs.
    if (SuperClass.$configDefs) {
      NewClass.$configDefs = { ...SuperClass.$configDefs };
    }
  }

  // 3. Copy prototype members from the definition (methods, apply/update hooks, etc.).
  for (const key of Object.keys(definition)) {
    if (RESERVED_DEF_KEYS.has(key)) continue;

    const value = definition[key];
    if (typeof value === 'function') {
      // Wrap for callParent support.
      (NewClass.prototype as any)[key] = wrapMethod(value as Function, key, NewClass);
    } else {
      (NewClass.prototype as any)[key] = value;
    }
  }

  // 4. Mixins.
  if (definition.mixins && definition.mixins.length > 0) {
    applyMixins(NewClass, definition.mixins);
  }

  // Initialise mixin set if not already present.
  if (!NewClass.$mixins) {
    NewClass.$mixins = new Set();
  }

  // 5. Process configs (generate get/set accessors).
  processClassConfigs(NewClass);

  // 6. Static members.
  if (definition.statics) {
    for (const [k, v] of Object.entries(definition.statics)) {
      (NewClass as any)[k] = v;
    }
  }

  // 7. Register with ClassManager.
  ClassManager.register(className, NewClass);

  // 8. Aliases.
  if (definition.alias) {
    const aliases = Array.isArray(definition.alias) ? definition.alias : [definition.alias];
    for (const a of aliases) {
      ClassManager.registerAlias(a, NewClass);
    }
  }

  return NewClass;
}
