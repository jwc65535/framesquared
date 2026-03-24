/**
 * @framesquared/core – Pluggable mixin
 *
 * Adds plugin management to any class.  Plugins are instantiated from
 * config objects (using Factoryable semantics) or accepted as instances.
 * All plugins are destroyed when the owner is destroyed.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Base } from '../class/Base.js';
import { define } from '../class/ClassManager.js';
import { Factoryable } from './Factoryable.js';
import { Plugin } from '../Plugin.js';

/** Per-instance plugin list. */
const pluginStore = new WeakMap<Base, Plugin[]>();

function getPlugins(inst: Base): Plugin[] {
  let list = pluginStore.get(inst);
  if (!list) {
    list = [];
    pluginStore.set(inst, list);
  }
  return list;
}

export const Pluggable: typeof Base = define('Ext.mixin.Pluggable', {
  config: {
    plugins: null,
  },

  /**
   * applyPlugins: processes the raw plugins config array.
   * Each entry can be a Plugin instance, a config object with type/xtype,
   * or will be passed through Factoryable.
   */
  applyPlugins(this: Base, plugins: any[] | null): any[] | null {
    if (!plugins || !Array.isArray(plugins)) return null;

    const list = getPlugins(this);
    for (const pluginCfg of plugins) {
      let plugin: Plugin;

      if (pluginCfg instanceof Plugin) {
        plugin = pluginCfg;
      } else if (typeof pluginCfg === 'object') {
        // Use Factoryable to create from config.
        // If no type/xtype, create a base Plugin.
        if (pluginCfg.xtype || pluginCfg.type) {
          plugin = Factoryable.create(pluginCfg) as Plugin;
        } else {
          plugin = new Plugin(pluginCfg);
        }
      } else {
        continue;
      }

      plugin.init(this);
      list.push(plugin);
    }

    // Install destroy hook (only once per instance)
    if (!(this as any).$pluggableHooked) {
      (this as any).$pluggableHooked = true;
      this.$destroyHooks.push(() => {
        const l = pluginStore.get(this);
        if (l) {
          for (const p of l) {
            if (!p.isDestroyed) p.destroy();
          }
          l.length = 0;
        }
      });
    }

    return plugins;
  },

  /**
   * Returns the plugin with the given id, or undefined.
   */
  getPlugin(this: Base, id: string): Plugin | undefined {
    const list = pluginStore.get(this);
    if (!list) return undefined;
    return list.find((p) => !p.isDestroyed && p.getId() === id);
  },

  /**
   * Adds a plugin to this instance.  Calls plugin.init(this).
   */
  addPlugin(this: Base, plugin: Plugin): void {
    const list = getPlugins(this);
    plugin.init(this);
    list.push(plugin);

    // Install destroy hook if not already done
    if (!(this as any).$pluggableHooked) {
      (this as any).$pluggableHooked = true;
      this.$destroyHooks.push(() => {
        const l = pluginStore.get(this);
        if (l) {
          for (const p of l) {
            if (!p.isDestroyed) p.destroy();
          }
          l.length = 0;
        }
      });
    }
  },

  /**
   * Removes a plugin from this instance.  Destroys the plugin.
   */
  removePlugin(this: Base, plugin: Plugin): void {
    const list = pluginStore.get(this);
    if (!list) return;
    const idx = list.indexOf(plugin);
    if (idx !== -1) {
      list.splice(idx, 1);
    }
    plugin.destroy();
  },
});
