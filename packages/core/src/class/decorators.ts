/**
 * @framesquared/core – TC39 Stage 3 decorators
 *
 * Usage:
 * ```ts
 * @alias('widget.panel')
 * @mixin(Draggable)
 * class Panel extends Base {
 *   @config            accessor title: string = 'Untitled';
 *   @config.required   accessor id: string = '';
 *   @config.lazy(fn)   accessor data: object = {};
 *   @config.cached     accessor fullName: string = '';
 *   @config.merge      accessor style: object = {};
 *   @observable @config accessor theme: string = 'light';
 * }
 * ```
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { capitalize } from '../util/String.js';
import type { Base } from './Base.js';
import { ClassManager } from './ClassManager.js';
import { getOrCreateMetaMap } from './Configurator.js';
import type { ConfigMeta } from './Configurator.js';
import { merge as deepMerge } from '../util/Object.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

/** Per-instance cache for @config.cached. */
const cachedValues = new WeakMap<object, Map<string, { valid: boolean; value: unknown }>>();

function getCacheEntry(inst: object) {
  let m = cachedValues.get(inst);
  if (!m) {
    m = new Map();
    cachedValues.set(inst, m);
  }
  return m;
}

/**
 * Generates `getX()` / `setX()` convenience methods on the prototype,
 * guarded so it only happens once per class per config.
 */
function ensureAccessors(Ctor: Function, configName: string): void {
  const proto = Ctor.prototype;
  const cap = capitalize(configName);
  const getter = `get${cap}`;
  const setter = `set${cap}`;

  if (!(getter in proto)) {
    proto[getter] = function (this: any): unknown {
      return this[configName];
    };
  }
  if (!(setter in proto)) {
    proto[setter] = function (this: any, value: unknown): void {
      this[configName] = value;
    };
  }
}

// ---------------------------------------------------------------------------
// Core decorator builder
// ---------------------------------------------------------------------------

function createConfigDecorator(metaOverrides: Partial<ConfigMeta> = {}) {
  return function <This extends Base, Value>(
    target: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>,
  ): ClassAccessorDecoratorResult<This, Value> {
    const name = String(context.name);
    const cap = capitalize(name);
    const applyName = `apply${cap}`;
    const updateName = `update${cap}`;

    // ── Register metadata at CLASS DEFINITION time via context.metadata ──
    const metaMap = getOrCreateMetaMap(context.metadata as DecoratorMetadataObject);
    let meta = metaMap.get(name);
    if (!meta) {
      meta = {
        name,
        required: false,
        cached: false,
        merge: false,
        observable: false,
      };
      metaMap.set(name, meta);
    }
    Object.assign(meta, metaOverrides);

    // ── addInitializer: runs per-instance after super() + field init ──
    context.addInitializer(function (this: This) {
      const inst = this as any;
      const Ctor = inst.constructor as Function;

      // Generate getX / setX (once per class)
      ensureAccessors(Ctor, name);

      // Apply pending config that Base stored during super()
      if (inst.$pendingConfig && name in inst.$pendingConfig) {
        inst[name] = inst.$pendingConfig[name];
        delete inst.$pendingConfig[name];
        inst.$configInitialized?.add(name);
      }

      // Validate required
      if (meta!.required && !inst.$configInitialized?.has(name)) {
        throw new Error(
          `Config "${name}" is required for ${(Ctor as any).$className || Ctor.name}`,
        );
      }
    });

    // ── init: field initialiser, stores the default ──
    const initFn = function (this: This, initialValue: Value): Value {
      // If already set (shouldn't happen before init, but guard)
      if ((this as any).$configInitialized?.has(name)) {
        return target.get.call(this);
      }
      return initialValue;
    };

    // ── get: lazy / cached ──
    const getFn = function (this: This): Value {
      const inst = this as any;

      // Lazy factory: compute on first access if not explicitly set
      if (meta!.lazyFactory && !inst.$configInitialized?.has(name)) {
        const computed = meta!.lazyFactory.call(inst) as Value;
        target.set.call(this, computed);
        inst.$configInitialized?.add(name);
        return computed;
      }

      // Cached: return cached value if still valid
      if (meta!.cached) {
        const cacheMap = getCacheEntry(inst);
        const entry = cacheMap.get(name);
        if (entry?.valid) {
          return entry.value as Value;
        }
        const value = target.get.call(this);
        cacheMap.set(name, { valid: true, value });
        return value;
      }

      return target.get.call(this);
    };

    // ── set: apply → store → invalidate cache → update ──
    const setFn = function (this: This, value: Value): void {
      const inst = this as any;
      const oldValue = target.get.call(this);

      // Merge: deep-merge with current value for plain objects
      if (meta!.merge && isPlainObject(value) && isPlainObject(oldValue)) {
        value = deepMerge(
          {} as Record<string, unknown>,
          oldValue,
          value as Record<string, unknown>,
        ) as unknown as Value;
      }

      // Apply hook
      if (typeof inst[applyName] === 'function') {
        value = inst[applyName](value, oldValue);
      }

      target.set.call(this, value);

      // Invalidate cache
      if (meta!.cached) {
        const cacheMap = getCacheEntry(inst);
        cacheMap.set(name, { valid: false, value: undefined });
      }

      inst.$configInitialized?.add(name);

      // Update hook (only if value actually changed)
      if (typeof inst[updateName] === 'function' && value !== oldValue) {
        inst[updateName](value, oldValue);
      }
    };

    return { init: initFn, get: getFn, set: setFn };
  };
}

// ---------------------------------------------------------------------------
// @config (with sub-decorators)
// ---------------------------------------------------------------------------

interface ConfigDecorator {
  <This extends Base, Value>(
    target: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>,
  ): ClassAccessorDecoratorResult<This, Value>;

  required: <This extends Base, Value>(
    target: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>,
  ) => ClassAccessorDecoratorResult<This, Value>;

  lazy: (
    factory: (this: any) => unknown,
  ) => <This extends Base, Value>(
    target: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>,
  ) => ClassAccessorDecoratorResult<This, Value>;

  cached: <This extends Base, Value>(
    target: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>,
  ) => ClassAccessorDecoratorResult<This, Value>;

  merge: <This extends Base, Value>(
    target: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>,
  ) => ClassAccessorDecoratorResult<This, Value>;
}

export const config: ConfigDecorator = Object.assign(createConfigDecorator(), {
  required: createConfigDecorator({ required: true }),
  lazy(factory: (this: any) => unknown) {
    return createConfigDecorator({ lazyFactory: factory });
  },
  cached: createConfigDecorator({ cached: true }),
  merge: createConfigDecorator({ merge: true }),
});

// ---------------------------------------------------------------------------
// @observable
// ---------------------------------------------------------------------------

/**
 * Marks a `@config` accessor as observable.  Stores metadata only;
 * event firing is Phase 2.
 */
export function observable<This extends Base, Value>(
  _target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>,
): void {
  const name = String(context.name);
  const metaMap = getOrCreateMetaMap(context.metadata as DecoratorMetadataObject);
  let meta = metaMap.get(name);
  if (!meta) {
    meta = {
      name,
      required: false,
      cached: false,
      merge: false,
      observable: true,
    };
    metaMap.set(name, meta);
  } else {
    meta.observable = true;
  }
  // Return void — don't wrap get/set.  @config handles the accessor logic.
}

// ---------------------------------------------------------------------------
// @alias — class decorator
// ---------------------------------------------------------------------------

export function alias(aliasName: string) {
  return function <T extends abstract new (...args: any[]) => any>(
    target: T,
    _context: ClassDecoratorContext<T>,
  ): T {
    ClassManager.registerAlias(aliasName, target as unknown as typeof Base);
    return target;
  };
}

// ---------------------------------------------------------------------------
// @mixin — class decorator
// ---------------------------------------------------------------------------

export function mixin(mixinClass: typeof Base) {
  return function <T extends abstract new (...args: any[]) => any>(
    target: T,
    _context: ClassDecoratorContext<T>,
  ): T {
    const targetCls = target as unknown as typeof Base;

    if (!targetCls.$mixins) targetCls.$mixins = new Set();
    if (targetCls.$mixins.has(mixinClass)) return target;

    targetCls.$mixins.add(mixinClass);
    if (mixinClass.$mixins) {
      for (const m of mixinClass.$mixins) targetCls.$mixins.add(m);
    }

    for (const name of Object.getOwnPropertyNames(mixinClass.prototype)) {
      if (name === 'constructor') continue;
      if (name in targetCls.prototype) continue;
      const desc = Object.getOwnPropertyDescriptor(mixinClass.prototype, name);
      if (desc) Object.defineProperty(targetCls.prototype, name, desc);
    }

    return target;
  };
}

// ---------------------------------------------------------------------------
// @override — class decorator
// ---------------------------------------------------------------------------

export function override(targetClass: typeof Base) {
  return function <T extends abstract new (...args: any[]) => any>(
    patchClass: T,
    _context: ClassDecoratorContext<T>,
  ): T {
    const patchProto = (patchClass as unknown as typeof Base).prototype;

    for (const name of Object.getOwnPropertyNames(patchProto)) {
      if (name === 'constructor') continue;
      const desc = Object.getOwnPropertyDescriptor(patchProto, name);
      if (desc) Object.defineProperty(targetClass.prototype, name, desc);
    }

    return patchClass;
  };
}
