import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Base, define} from '../src/class/index.js';
import { Identifiable, IdentityMap } from '../src/mixin/Identifiable.js';
import { Factoryable } from '../src/mixin/Factoryable.js';
import { Inheritable } from '../src/mixin/Inheritable.js';
import { Hookable } from '../src/mixin/Hookable.js';
import { Pluggable } from '../src/mixin/Pluggable.js';
import { Plugin } from '../src/Plugin.js';

// ═══════════════════════════════════════════════════════════════════════════
// Identifiable
// ═══════════════════════════════════════════════════════════════════════════

describe('Identifiable', () => {
  describe('id config', () => {
    it('accepts an explicit id', () => {
      const Cls = define('test.id.Explicit', {
        mixins: [Identifiable],
      });
      const inst = new Cls({ id: 'my-id' });
      expect(inst.getId()).toBe('my-id');
    });

    it('auto-generates an id when none is provided', () => {
      const Cls = define('test.id.Auto', {
        mixins: [Identifiable],
      });
      const inst = new Cls();
      expect(inst.getId()).toBeDefined();
      expect(typeof inst.getId()).toBe('string');
      expect(inst.getId().length).toBeGreaterThan(0);
    });

    it('auto-generated ids are unique across instances', () => {
      const Cls = define('test.id.Unique', {
        mixins: [Identifiable],
      });
      const a = new Cls();
      const b = new Cls();
      expect(a.getId()).not.toBe(b.getId());
    });

    it('getId() returns string type', () => {
      const Cls = define('test.id.Type', {
        mixins: [Identifiable],
      });
      const inst = new Cls();
      expect(typeof inst.getId()).toBe('string');
    });
  });

  describe('IdentityMap', () => {
    it('registered instance can be looked up by id', () => {
      const Cls = define('test.id.Lookup', {
        mixins: [Identifiable],
      });
      const inst = new Cls({ id: 'lookup-1' });
      expect(IdentityMap.get('lookup-1')).toBe(inst);
    });

    it('returns undefined for unknown id', () => {
      expect(IdentityMap.get('nonexistent-id-xyz')).toBeUndefined();
    });

    it('removing by destroy unregisters from IdentityMap', () => {
      const Cls = define('test.id.Destroy', {
        mixins: [Identifiable],
      });
      const inst = new Cls({ id: 'destroy-1' });
      expect(IdentityMap.get('destroy-1')).toBe(inst);
      inst.destroy();
      expect(IdentityMap.get('destroy-1')).toBeUndefined();
    });

    it('has() returns true for registered, false after destroy', () => {
      const Cls = define('test.id.Has', {
        mixins: [Identifiable],
      });
      const inst = new Cls({ id: 'has-check' });
      expect(IdentityMap.has('has-check')).toBe(true);
      inst.destroy();
      expect(IdentityMap.has('has-check')).toBe(false);
    });

    it('auto-generated ids are also registered', () => {
      const Cls = define('test.id.AutoReg', {
        mixins: [Identifiable],
      });
      const inst = new Cls();
      const id = inst.getId();
      expect(IdentityMap.get(id)).toBe(inst);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Factoryable
// ═══════════════════════════════════════════════════════════════════════════

describe('Factoryable', () => {
  // Set up some classes with aliases for factory tests
  beforeEach(() => {
    define('test.fact.Button', {
      alias: 'widget.factbutton',
      config: { text: 'Click' },
    });
    define('test.fact.Panel', {
      alias: 'widget.factpanel',
      config: { title: 'Panel' },
    });
  });

  describe('create from config object with xtype', () => {
    it('creates instance using xtype alias', () => {
      const inst = Factoryable.create({ xtype: 'widget.factbutton', text: 'OK' });
      expect(inst).toBeInstanceOf(Base);
      expect(inst.getText()).toBe('OK');
    });

    it('creates instance using type alias', () => {
      const inst = Factoryable.create({ type: 'widget.factpanel', title: 'My Panel' });
      expect(inst).toBeInstanceOf(Base);
      expect(inst.getTitle()).toBe('My Panel');
    });

    it('xtype takes precedence over type', () => {
      const inst = Factoryable.create({
        xtype: 'widget.factbutton',
        type: 'widget.factpanel',
        text: 'Priority',
      });
      expect(inst.getText()).toBe('Priority');
    });
  });

  describe('create from string shorthand', () => {
    it('treats a string as an alias', () => {
      const inst = Factoryable.create('widget.factbutton');
      expect(inst).toBeInstanceOf(Base);
      expect(inst.getText()).toBe('Click'); // default
    });
  });

  describe('error handling', () => {
    it('throws for unknown xtype', () => {
      expect(() => Factoryable.create({ xtype: 'widget.nonexistent' })).toThrow();
    });

    it('throws for unknown string alias', () => {
      expect(() => Factoryable.create('widget.nonexistent')).toThrow();
    });
  });

  describe('passthrough for Base instances', () => {
    it('returns the instance as-is if already a Base instance', () => {
      const Cls = define('test.fact.Passthrough', {});
      const existing = new Cls();
      const result = Factoryable.create(existing);
      expect(result).toBe(existing);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Inheritable
// ═══════════════════════════════════════════════════════════════════════════

describe('Inheritable', () => {
  it('initInheritedState stores inherited state', () => {
    const Cls = define('test.inh.Init', {
      mixins: [Inheritable],
    });
    const inst = new Cls();
    inst.initInheritedState({ theme: 'dark', fontSize: 14 });
    expect(inst.getInherited()).toEqual({ theme: 'dark', fontSize: 14 });
  });

  it('getInheritedConfig retrieves a single key', () => {
    const Cls = define('test.inh.Single', {
      mixins: [Inheritable],
    });
    const inst = new Cls();
    inst.initInheritedState({ color: 'blue' });
    expect(inst.getInheritedConfig('color')).toBe('blue');
  });

  it('returns undefined for missing inherited key', () => {
    const Cls = define('test.inh.Missing', {
      mixins: [Inheritable],
    });
    const inst = new Cls();
    inst.initInheritedState({});
    expect(inst.getInheritedConfig('missing')).toBeUndefined();
  });

  it('child inherits from parent when parent is set', () => {
    const Cls = define('test.inh.Chain', {
      mixins: [Inheritable],
    });
    const parent = new Cls();
    parent.initInheritedState({ theme: 'dark', size: 'large' });

    const child = new Cls();
    child.setInheritedParent(parent);
    child.initInheritedState({ size: 'small' }); // override size

    expect(child.getInheritedConfig('theme')).toBe('dark'); // from parent
    expect(child.getInheritedConfig('size')).toBe('small'); // own overrides
  });

  it('grandchild inherits through multiple levels', () => {
    const Cls = define('test.inh.GrandChain', {
      mixins: [Inheritable],
    });
    const root = new Cls();
    root.initInheritedState({ a: 1, b: 2 });

    const mid = new Cls();
    mid.setInheritedParent(root);
    mid.initInheritedState({ b: 20, c: 30 });

    const leaf = new Cls();
    leaf.setInheritedParent(mid);
    leaf.initInheritedState({});

    expect(leaf.getInheritedConfig('a')).toBe(1); // from root
    expect(leaf.getInheritedConfig('b')).toBe(20); // mid overrides root
    expect(leaf.getInheritedConfig('c')).toBe(30); // from mid
  });

  it('getInherited returns merged state from full chain', () => {
    const Cls = define('test.inh.Merged', {
      mixins: [Inheritable],
    });
    const parent = new Cls();
    parent.initInheritedState({ x: 1, y: 2 });

    const child = new Cls();
    child.setInheritedParent(parent);
    child.initInheritedState({ y: 20, z: 30 });

    expect(child.getInherited()).toEqual({ x: 1, y: 20, z: 30 });
  });

  it('works with no parent (standalone)', () => {
    const Cls = define('test.inh.Standalone', {
      mixins: [Inheritable],
    });
    const inst = new Cls();
    inst.initInheritedState({ solo: true });
    expect(inst.getInherited()).toEqual({ solo: true });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Hookable
// ═══════════════════════════════════════════════════════════════════════════

describe('Hookable', () => {
  describe('before hooks', () => {
    it('fires before the original method', () => {
      const order: string[] = [];
      const Cls = define('test.hook.Before', {
        mixins: [Hookable],
        greet() {
          order.push('original');
          return 'hello';
        },
      });
      const inst = new Cls();
      inst.addBeforeHook('greet', () => order.push('before'));
      inst.greet();
      expect(order).toEqual(['before', 'original']);
    });

    it('multiple before hooks fire in registration order', () => {
      const order: string[] = [];
      const Cls = define('test.hook.MultiB', {
        mixins: [Hookable],
        run() {
          order.push('run');
        },
      });
      const inst = new Cls();
      inst.addBeforeHook('run', () => order.push('b1'));
      inst.addBeforeHook('run', () => order.push('b2'));
      inst.run();
      expect(order).toEqual(['b1', 'b2', 'run']);
    });

    it('passes arguments to before hooks', () => {
      const spy = vi.fn();
      const Cls = define('test.hook.ArgsB', {
        mixins: [Hookable],
        process(a: number, b: number) {
          return a + b;
        },
      });
      const inst = new Cls();
      inst.addBeforeHook('process', spy);
      inst.process(3, 4);
      expect(spy).toHaveBeenCalledWith(3, 4);
    });
  });

  describe('after hooks', () => {
    it('fires after the original method', () => {
      const order: string[] = [];
      const Cls = define('test.hook.After', {
        mixins: [Hookable],
        greet() {
          order.push('original');
          return 'hello';
        },
      });
      const inst = new Cls();
      inst.addAfterHook('greet', () => order.push('after'));
      inst.greet();
      expect(order).toEqual(['original', 'after']);
    });

    it('after hook receives the return value', () => {
      const spy = vi.fn();
      const Cls = define('test.hook.ReturnA', {
        mixins: [Hookable],
        compute() {
          return 42;
        },
      });
      const inst = new Cls();
      inst.addAfterHook('compute', spy);
      inst.compute();
      expect(spy).toHaveBeenCalledWith(42);
    });

    it('multiple after hooks fire in registration order', () => {
      const order: string[] = [];
      const Cls = define('test.hook.MultiA', {
        mixins: [Hookable],
        run() {
          order.push('run');
        },
      });
      const inst = new Cls();
      inst.addAfterHook('run', () => order.push('a1'));
      inst.addAfterHook('run', () => order.push('a2'));
      inst.run();
      expect(order).toEqual(['run', 'a1', 'a2']);
    });
  });

  describe('before + after combined', () => {
    it('before → original → after ordering', () => {
      const order: string[] = [];
      const Cls = define('test.hook.Combined', {
        mixins: [Hookable],
        action() {
          order.push('action');
        },
      });
      const inst = new Cls();
      inst.addBeforeHook('action', () => order.push('before'));
      inst.addAfterHook('action', () => order.push('after'));
      inst.action();
      expect(order).toEqual(['before', 'action', 'after']);
    });
  });

  describe('removeHook', () => {
    it('removes a before hook', () => {
      const spy = vi.fn();
      const Cls = define('test.hook.RemB', {
        mixins: [Hookable],
        run() {},
      });
      const inst = new Cls();
      inst.addBeforeHook('run', spy);
      inst.removeHook('run', spy);
      inst.run();
      expect(spy).not.toHaveBeenCalled();
    });

    it('removes an after hook', () => {
      const spy = vi.fn();
      const Cls = define('test.hook.RemA', {
        mixins: [Hookable],
        run() {},
      });
      const inst = new Cls();
      inst.addAfterHook('run', spy);
      inst.removeHook('run', spy);
      inst.run();
      expect(spy).not.toHaveBeenCalled();
    });

    it('does not remove other hooks when removing one', () => {
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      const Cls = define('test.hook.RemPartial', {
        mixins: [Hookable],
        run() {},
      });
      const inst = new Cls();
      inst.addBeforeHook('run', spy1);
      inst.addBeforeHook('run', spy2);
      inst.removeHook('run', spy1);
      inst.run();
      expect(spy1).not.toHaveBeenCalled();
      expect(spy2).toHaveBeenCalledOnce();
    });
  });

  describe('hooks are per-instance', () => {
    it('hook on one instance does not affect another', () => {
      const spy = vi.fn();
      const Cls = define('test.hook.PerInst', {
        mixins: [Hookable],
        run() {},
      });
      const a = new Cls();
      const b = new Cls();
      a.addBeforeHook('run', spy);
      b.run();
      expect(spy).not.toHaveBeenCalled();
      a.run();
      expect(spy).toHaveBeenCalledOnce();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Plugin
// ═══════════════════════════════════════════════════════════════════════════

describe('Plugin', () => {
  it('extends Base', () => {
    const p = new Plugin();
    expect(p).toBeInstanceOf(Base);
  });

  it('has id config', () => {
    const p = new Plugin({ id: 'my-plugin' });
    expect(p.getId()).toBe('my-plugin');
  });

  it('auto-generates id if none provided', () => {
    const p = new Plugin();
    expect(p.getId()).toBeDefined();
    expect(typeof p.getId()).toBe('string');
  });

  it('has init() method', () => {
    const p = new Plugin();
    expect(typeof p.init).toBe('function');
  });

  it('init() stores owner reference', () => {
    const owner = new Base();
    const p = new Plugin();
    p.init(owner);
    expect(p.getOwner()).toBe(owner);
  });

  it('destroy() sets isDestroyed', () => {
    const p = new Plugin();
    p.destroy();
    expect(p.isDestroyed).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Pluggable
// ═══════════════════════════════════════════════════════════════════════════

describe('Pluggable', () => {
  describe('plugins config', () => {
    it('instantiates plugins from the plugins config array', () => {
      const initSpy = vi.fn();
      const _TestPlugin = define('test.plug.TestPlugin', {
        extend: Plugin,
        alias: 'plugin.test',
        config: { id: '' },
        init(owner: Base) {
          (this as Plugin).callParent([owner]);
          initSpy(owner);
        },
      });
      const Cls = define('test.plug.Host', {
        mixins: [Pluggable],
      });
      const host = new Cls({
        plugins: [{ type: 'plugin.test', id: 'p1' }],
      });
      expect(initSpy).toHaveBeenCalledWith(host);
    });

    it('accepts Plugin instances directly', () => {
      const Cls = define('test.plug.DirectHost', {
        mixins: [Pluggable],
      });
      const p = new Plugin({ id: 'direct-p' });
      const host = new Cls({ plugins: [p] });
      expect(host.getPlugin('direct-p')).toBe(p);
    });
  });

  describe('getPlugin', () => {
    it('returns a plugin by id', () => {
      const Cls = define('test.plug.GetById', {
        mixins: [Pluggable],
      });
      const p = new Plugin({ id: 'find-me' });
      const host = new Cls({ plugins: [p] });
      expect(host.getPlugin('find-me')).toBe(p);
    });

    it('returns undefined for unknown plugin id', () => {
      const Cls = define('test.plug.GetUnknown', {
        mixins: [Pluggable],
      });
      const host = new Cls();
      expect(host.getPlugin('nope')).toBeUndefined();
    });
  });

  describe('addPlugin / removePlugin', () => {
    it('addPlugin registers and initialises a plugin', () => {
      const Cls = define('test.plug.Add', {
        mixins: [Pluggable],
      });
      const host = new Cls();
      const p = new Plugin({ id: 'added' });
      host.addPlugin(p);
      expect(host.getPlugin('added')).toBe(p);
      expect(p.getOwner()).toBe(host);
    });

    it('removePlugin removes and destroys the plugin', () => {
      const Cls = define('test.plug.Remove', {
        mixins: [Pluggable],
      });
      const host = new Cls();
      const p = new Plugin({ id: 'removable' });
      host.addPlugin(p);
      host.removePlugin(p);
      expect(host.getPlugin('removable')).toBeUndefined();
      expect(p.isDestroyed).toBe(true);
    });
  });

  describe('owner destroy cascades to plugins', () => {
    it('destroying the owner destroys all plugins', () => {
      const Cls = define('test.plug.Cascade', {
        mixins: [Pluggable],
      });
      const p1 = new Plugin({ id: 'cp1' });
      const p2 = new Plugin({ id: 'cp2' });
      const host = new Cls({ plugins: [p1, p2] });
      host.destroy();
      expect(p1.isDestroyed).toBe(true);
      expect(p2.isDestroyed).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Combined mixins
// ═══════════════════════════════════════════════════════════════════════════

describe('Combined mixins', () => {
  it('Identifiable + Hookable + Pluggable on one class', () => {
    const Cls = define('test.combined.All', {
      mixins: [Identifiable, Hookable, Pluggable],
      config: { name: 'default' },
      greet() {
        return `Hello from ${this.getName()}`;
      },
    });

    const hook = vi.fn();
    const inst = new Cls({ id: 'combo-1', name: 'Alice' });
    inst.addBeforeHook('greet', hook);
    expect(inst.greet()).toBe('Hello from Alice');
    expect(hook).toHaveBeenCalledOnce();
    expect(inst.getId()).toBe('combo-1');
    expect(IdentityMap.get('combo-1')).toBe(inst);

    const p = new Plugin({ id: 'combo-plugin' });
    inst.addPlugin(p);
    expect(inst.getPlugin('combo-plugin')).toBe(p);

    inst.destroy();
    expect(IdentityMap.has('combo-1')).toBe(false);
    expect(p.isDestroyed).toBe(true);
  });

  it('Identifiable + Inheritable together', () => {
    const Cls = define('test.combined.IdInh', {
      mixins: [Identifiable, Inheritable],
    });
    const parent = new Cls({ id: 'parent-1' });
    parent.initInheritedState({ theme: 'dark' });

    const child = new Cls({ id: 'child-1' });
    child.setInheritedParent(parent);
    child.initInheritedState({});

    expect(child.getId()).toBe('child-1');
    expect(child.getInheritedConfig('theme')).toBe('dark');
  });
});
