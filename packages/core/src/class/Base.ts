/**
 * @framesquared/core – Base class
 *
 * Foundation for the framesquared class system.  Provides:
 *  - Config auto-generation (getX / setX / applyX / updateX lifecycle)
 *  - callParent() for wrapped methods (set up by define())
 *  - destroy() + Symbol.dispose
 *  - Mixin tracking via hasMixin()
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import { capitalize } from '../util/String.js';

// ---------------------------------------------------------------------------
// Internal symbols & types
// ---------------------------------------------------------------------------

/** Tracks whether config accessors have been generated on this class. */
const CONFIGS_PROCESSED = Symbol('configsProcessed');

/** Per-instance call-stack entries for callParent(). */
export interface CallStackEntry {
  methodName: string;
  owner: typeof Base;
}

// ---------------------------------------------------------------------------
// Config processing utilities
// ---------------------------------------------------------------------------

/**
 * Collects the merged `$configDefs` from the full prototype chain and
 * generates `getFoo` / `setFoo` accessor pairs on the prototype for every
 * config key that doesn't already have them.
 *
 * This is called once per class, lazily on first instantiation **or**
 * eagerly by `define()`.
 */
export function processClassConfigs(Ctor: typeof Base): void {
  // Must use hasOwn — otherwise the child inherits the parent's flag via
  // the static prototype chain (ChildCtor.__proto__ === ParentCtor).
  if (Object.hasOwn(Ctor, CONFIGS_PROCESSED)) return;

  // Merge config definitions from the ancestor chain (parent first, child overrides).
  const chain: (typeof Base)[] = [];
  let cur: typeof Base | null = Ctor;
  while (cur && cur !== Function.prototype) {
    chain.unshift(cur);
    cur = Object.getPrototypeOf(cur) as typeof Base | null;
  }

  const merged: Record<string, unknown> = {};
  for (const cls of chain) {
    if (cls.hasOwnProperty('$configDefs')) {
      Object.assign(merged, cls.$configDefs);
    }
  }

  // Store the final merged defs on *this* class so instances can read them.
  Ctor.$configDefs = merged;

  // Generate accessor pairs.
  for (const configName of Object.keys(merged)) {
    generateAccessors(Ctor.prototype, configName);
  }

  (Ctor as any)[CONFIGS_PROCESSED] = true;
}

/**
 * Generates `getFoo` and `setFoo` methods on `proto` for the given config
 * name, unless they already exist (allowing user-defined overrides).
 */
function generateAccessors(proto: object, configName: string): void {
  const cap = capitalize(configName);
  const getterName = `get${cap}`;
  const setterName = `set${cap}`;
  const privateProp = `_${configName}`;
  const applyName = `apply${cap}`;
  const updateName = `update${cap}`;

  if (!(getterName in proto)) {
    (proto as any)[getterName] = function (this: any) {
      // Lazy init: if never explicitly set, apply the default.
      if (!this.$configInitialized.has(configName)) {
        const defaults = (this.constructor as typeof Base).$configDefs;
        if (defaults && configName in defaults) {
          this[setterName](defaults[configName]);
        }
      }
      return this[privateProp];
    };
  }

  if (!(setterName in proto)) {
    (proto as any)[setterName] = function (this: any, value: unknown) {
      const oldValue = this[privateProp];

      // Apply transform
      if (typeof this[applyName] === 'function') {
        value = this[applyName](value, oldValue);
      }

      this[privateProp] = value;
      this.$configInitialized.add(configName);

      // Update hook (only if the value actually changed)
      if (typeof this[updateName] === 'function' && value !== oldValue) {
        this[updateName](value, oldValue);
      }
    };
  }
}

// ---------------------------------------------------------------------------
// Method wrapping for callParent
// ---------------------------------------------------------------------------

/**
 * Wraps a method so it pushes / pops from the instance's `$callStack`,
 * enabling `callParent()` to locate the correct super-method.
 */
export function wrapMethod(
  fn: Function,
  methodName: string,
  ownerClass: typeof Base,
): Function {
  const wrapped = function (this: Base, ...args: unknown[]) {
    this.$callStack.push({ methodName, owner: ownerClass });
    try {
      return fn.apply(this, args);
    } finally {
      this.$callStack.pop();
    }
  };
  // Mark so we don't double-wrap.
  (wrapped as any).$wrapped = true;
  (wrapped as any).$original = fn;
  (wrapped as any).$owner = ownerClass;
  return wrapped;
}

// ---------------------------------------------------------------------------
// Base class
// ---------------------------------------------------------------------------

export class Base {
  // -- Class-level metadata ------------------------------------------------

  /** Fully-qualified class name. */
  static $className = 'Base';

  /** Merged config defaults for this class (populated by processClassConfigs). */
  static $configDefs: Record<string, unknown>;

  /** Set of mixin constructors applied to this class (populated by define). */
  static $mixins: Set<typeof Base>;

  // -- Instance state ------------------------------------------------------

  /** Per-instance call-stack used by `callParent()`. */
  $callStack: CallStackEntry[] = [];

  /** Tracks which config properties have been explicitly initialized. */
  $configInitialized: Set<string> = new Set();

  /**
   * Raw config object passed to the constructor.  Decorator-based configs
   * are consumed from here by `addInitializer` callbacks (which run after
   * auto-accessor field initialization).
   */
  $pendingConfig: Record<string, unknown> | undefined;

  /** Whether `destroy()` has been called. */
  isDestroyed = false;

  /**
   * Array of cleanup callbacks.  Mixins (and user code) can push
   * functions here; they all run during `destroy()`.
   */
  $destroyHooks: (() => void)[] = [];

  // -- Getters -------------------------------------------------------------

  /** The fully-qualified class name of this instance's constructor. */
  get $className(): string {
    return (this.constructor as typeof Base).$className;
  }

  /** Reference to the constructor (like ExtJS's `this.self`). */
  get self(): typeof Base {
    return this.constructor as typeof Base;
  }

  // -- Constructor ---------------------------------------------------------

  constructor(config?: Record<string, unknown>) {
    // Store for decorator-based configs (consumed by addInitializer).
    this.$pendingConfig = config ? { ...config } : undefined;

    if (config) {
      this.initConfig(config);
    }
  }

  // -- Factory -------------------------------------------------------------

  /**
   * Static factory — creates an instance of the class.
   */
  static create(this: new (...a: any[]) => Base, ...args: any[]): Base {
    return new this(...args);
  }

  // -- Config initialisation -----------------------------------------------

  /**
   * Applies the given config properties to this instance.  Ensures that
   * config accessors have been generated for the class first.
   */
  initConfig(config?: Record<string, unknown>): void {
    const Ctor = this.constructor as typeof Base;

    // Ensure define()-style accessors exist (once per class).
    processClassConfigs(Ctor);

    if (!config) return;

    // Only apply configs that have define()-style $configDefs entries.
    // Decorator-based configs (@config accessor) are handled by the
    // decorator's addInitializer callback which runs after auto-accessor
    // field initialization.
    const defs = Ctor.$configDefs;

    for (const key of Object.keys(config)) {
      if (defs && key in defs) {
        const setter = `set${capitalize(key)}`;
        if (typeof (this as any)[setter] === 'function') {
          (this as any)[setter](config[key]);
        }
      }
      // Keys not in $configDefs stay in $pendingConfig for decorator processing
    }
  }

  // -- callParent ----------------------------------------------------------

  /**
   * Calls the parent (super) class's implementation of the method that is
   * currently executing.  Only works for methods wrapped via `define()`.
   */
  callParent(args?: unknown[]): unknown {
    const stack = this.$callStack;
    if (stack.length === 0) {
      return undefined;
    }

    const current = stack[stack.length - 1];
    const parentProto = Object.getPrototypeOf(current.owner.prototype);

    if (parentProto && typeof parentProto[current.methodName] === 'function') {
      return parentProto[current.methodName].apply(this, args ?? []);
    }

    return undefined;
  }

  // -- Mixin query ---------------------------------------------------------

  /**
   * Returns `true` if the given mixin has been applied to this class (or
   * to any of its ancestors / other mixins).
   */
  hasMixin(mixin: typeof Base): boolean {
    const Ctor = this.constructor as typeof Base;
    return Ctor.$mixins?.has(mixin) ?? false;
  }

  // -- Destroy lifecycle ---------------------------------------------------

  /**
   * Tears down this instance.  Calls `onDestroy()` if defined.
   * Idempotent — second and subsequent calls are no-ops.
   */
  destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    // Run all registered destroy hooks (from mixins, plugins, etc.)
    for (const hook of this.$destroyHooks) {
      hook.call(this);
    }

    if (typeof (this as any).onDestroy === 'function') {
      (this as any).onDestroy();
    }
  }

  /**
   * `Symbol.dispose` support — calling `[Symbol.dispose]()` is equivalent
   * to `destroy()`, enabling the TC39 `using` keyword.
   */
  [Symbol.dispose](): void {
    this.destroy();
  }
}
