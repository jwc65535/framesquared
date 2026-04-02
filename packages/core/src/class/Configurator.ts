/**
 * @framesquared/core – Configurator
 *
 * Central metadata registry for the `@config` decorator family.
 * Uses TC39 `context.metadata` (Symbol.metadata) so metadata is
 * available immediately after class definition — no instance needed.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConfigMeta {
  /** Property name. */
  name: string;
  /** True when the config MUST be provided at construction time. */
  required: boolean;
  /** Factory function for lazy configs (computed on first access). */
  lazyFactory?: (this: any) => unknown;
  /** True when the getter result should be cached until next set. */
  cached: boolean;
  /** True when object values should be deep-merged with defaults. */
  merge: boolean;
  /** True when a change event should fire (Phase 2 integration). */
  observable: boolean;
}

// ---------------------------------------------------------------------------
// Metadata symbol
// ---------------------------------------------------------------------------

/**
 * Key inside `context.metadata` that holds the per-class config Map.
 */
export const CONFIG_META_KEY = Symbol('framesquared:configMeta');

/**
 * Runtime Symbol.metadata (or its esbuild polyfill).
 */
export const METADATA_SYMBOL: unique symbol =
  (Symbol as any).metadata ?? Symbol.for('Symbol.metadata');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Gets or creates the per-class config map inside `context.metadata`.
 */
export function getOrCreateMetaMap(metadata: DecoratorMetadataObject): Map<string, ConfigMeta> {
  let map = (metadata as any)[CONFIG_META_KEY] as Map<string, ConfigMeta> | undefined;
  if (!map) {
    map = new Map();
    (metadata as any)[CONFIG_META_KEY] = map;
  }
  return map;
}

/** A class constructor type used for prototype-chain walking. */
type ClassConstructor = abstract new (...args: unknown[]) => unknown;

/**
 * Reads the metadata object from a class constructor.
 */
function getClassMetadata(Ctor: ClassConstructor): object | undefined {
  return (Ctor as unknown as Record<symbol, object>)[METADATA_SYMBOL];
}

// ---------------------------------------------------------------------------
// ConfiguratorImpl
// ---------------------------------------------------------------------------

class ConfiguratorImpl {
  /**
   * Returns the ConfigMeta for a single config on the given class,
   * walking the prototype chain.
   */
  getConfigMeta(Ctor: ClassConstructor, configName: string): ConfigMeta | undefined {
    let cur: ClassConstructor | null = Ctor;
    while (cur) {
      const md = getClassMetadata(cur);
      if (md) {
        const map = (md as any)[CONFIG_META_KEY] as Map<string, ConfigMeta> | undefined;
        if (map?.has(configName)) return map.get(configName)!;
      }
      cur = Object.getPrototypeOf(cur) as ClassConstructor | null;
    }
    return undefined;
  }

  /**
   * Collects all ConfigMeta entries for `Ctor`, including inherited.
   */
  getAllConfigMeta(Ctor: ClassConstructor): ConfigMeta[] {
    const chain: ClassConstructor[] = [];
    let cur: ClassConstructor | null = Ctor;
    while (cur) {
      chain.unshift(cur);
      cur = Object.getPrototypeOf(cur) as ClassConstructor | null;
    }
    const merged = new Map<string, ConfigMeta>();
    for (const cls of chain) {
      const md = getClassMetadata(cls);
      if (md) {
        const map = (md as any)[CONFIG_META_KEY] as Map<string, ConfigMeta> | undefined;
        if (map) {
          for (const [name, meta] of map) merged.set(name, meta);
        }
      }
    }
    return [...merged.values()];
  }
}

/** Singleton. */
export const Configurator = new ConfiguratorImpl();
