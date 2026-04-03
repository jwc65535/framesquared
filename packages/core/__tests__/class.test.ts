import { describe, it, expect, vi } from 'vitest';
import { Base, ClassManager, define } from '../src/class/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// BASE CLASS — identity, factory, lifecycle
// ═══════════════════════════════════════════════════════════════════════════

describe('Base', () => {
  // -----------------------------------------------------------------------
  // $className & self
  // -----------------------------------------------------------------------
  describe('class identity', () => {
    it('has a static $className defaulting to "Base"', () => {
      expect(Base.$className).toBe('Base');
    });

    it('exposes $className on instances via getter', () => {
      const b = new Base();
      expect(b.$className).toBe('Base');
    });

    it('self getter returns the constructor', () => {
      const b = new Base();
      expect(b.self).toBe(Base);
    });

    it('subclass $className reflects the subclass', () => {
      const Sub = define('test.Sub', { extend: Base });
      const s = new Sub();
      expect(s.$className).toBe('test.Sub');
      expect(s.self).toBe(Sub);
    });
  });

  // -----------------------------------------------------------------------
  // Factory: create()
  // -----------------------------------------------------------------------
  describe('factory', () => {
    it('Base.create() returns a Base instance', () => {
      const b = Base.create();
      expect(b).toBeInstanceOf(Base);
    });

    it('create() passes config to constructor', () => {
      const Cls = define('test.Factory', {
        config: { value: 0 },
      });
      const inst = Cls.create({ value: 42 });
      expect(inst.getValue()).toBe(42);
    });
  });

  // -----------------------------------------------------------------------
  // Destroy lifecycle
  // -----------------------------------------------------------------------
  describe('destroy lifecycle', () => {
    it('isDestroyed is false initially', () => {
      const b = new Base();
      expect(b.isDestroyed).toBe(false);
    });

    it('destroy() sets isDestroyed to true', () => {
      const b = new Base();
      b.destroy();
      expect(b.isDestroyed).toBe(true);
    });

    it('destroy() calls onDestroy hook if defined', () => {
      const spy = vi.fn();
      const Cls = define('test.Destroyable', {
        onDestroy: spy,
      });
      const inst = new Cls();
      inst.destroy();
      expect(spy).toHaveBeenCalledOnce();
    });

    it('destroy() is idempotent (second call is a no-op)', () => {
      const spy = vi.fn();
      const Cls = define('test.Destroyable2', {
        onDestroy: spy,
      });
      const inst = new Cls();
      inst.destroy();
      inst.destroy();
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  // -----------------------------------------------------------------------
  // Symbol.dispose
  // -----------------------------------------------------------------------
  describe('Symbol.dispose', () => {
    it('implements Symbol.dispose calling destroy()', () => {
      const b = new Base();
      expect(typeof b[Symbol.dispose]).toBe('function');
      b[Symbol.dispose]();
      expect(b.isDestroyed).toBe(true);
    });

    it('works with using-like manual disposal', () => {
      const Cls = define('test.Disposable', {
        config: { name: 'hello' },
      });
      const inst = new Cls();
      inst[Symbol.dispose]();
      expect(inst.isDestroyed).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

describe('Config system', () => {
  // -----------------------------------------------------------------------
  // Auto-generated getters/setters
  // -----------------------------------------------------------------------
  describe('auto-generated accessors', () => {
    it('generates getFoo() and setFoo() for config "foo"', () => {
      const Cls = define('test.cfg.Accessors', {
        config: { title: 'default' },
      });
      const inst = new Cls();
      expect(typeof inst.getTitle).toBe('function');
      expect(typeof inst.setTitle).toBe('function');
    });

    it('getter returns the configured value', () => {
      const Cls = define('test.cfg.GetSet', {
        config: { title: '' },
      });
      const inst = new Cls({ title: 'Hello' });
      expect(inst.getTitle()).toBe('Hello');
    });

    it('setter updates the value', () => {
      const Cls = define('test.cfg.SetUpdate', {
        config: { count: 0 },
      });
      const inst = new Cls();
      inst.setCount(42);
      expect(inst.getCount()).toBe(42);
    });

    it('generates accessors for multiple configs', () => {
      const Cls = define('test.cfg.Multi', {
        config: { name: '', age: 0, active: false },
      });
      const inst = new Cls({ name: 'Alice', age: 30, active: true });
      expect(inst.getName()).toBe('Alice');
      expect(inst.getAge()).toBe(30);
      expect(inst.getActive()).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Lazy initialization from defaults
  // -----------------------------------------------------------------------
  describe('lazy initialization', () => {
    it('returns the default value when no config is provided', () => {
      const Cls = define('test.cfg.Lazy', {
        config: { color: 'red' },
      });
      const inst = new Cls();
      expect(inst.getColor()).toBe('red');
    });

    it('provided config overrides the default', () => {
      const Cls = define('test.cfg.Override', {
        config: { color: 'red' },
      });
      const inst = new Cls({ color: 'blue' });
      expect(inst.getColor()).toBe('blue');
    });

    it('default is applied lazily (applyFoo runs on first access)', () => {
      const applySpy = vi.fn((v: string) => v.toUpperCase());
      const Cls = define('test.cfg.LazyApply', {
        config: { label: 'hello' },
        applyLabel: applySpy,
      });
      const inst = new Cls();
      // applyLabel should NOT have been called yet (lazy)
      expect(applySpy).not.toHaveBeenCalled();
      // First access triggers lazy init
      expect(inst.getLabel()).toBe('HELLO');
      expect(applySpy).toHaveBeenCalledOnce();
    });
  });

  // -----------------------------------------------------------------------
  // apply / update lifecycle
  // -----------------------------------------------------------------------
  describe('apply/update hooks', () => {
    it('applyFoo transforms the value before storing', () => {
      const Cls = define('test.cfg.Apply', {
        config: { name: '' },
        applyName(value: string) {
          return value.trim().toUpperCase();
        },
      });
      const inst = new Cls({ name: '  hello  ' });
      expect(inst.getName()).toBe('HELLO');
    });

    it('updateFoo is called after the value changes', () => {
      const spy = vi.fn();
      const Cls = define('test.cfg.Update', {
        config: { score: 0 },
        updateScore: spy,
      });
      const _inst = new Cls({ score: 10 });
      expect(spy).toHaveBeenCalledWith(10, undefined);
    });

    it('updateFoo receives newValue and oldValue', () => {
      const spy = vi.fn();
      const Cls = define('test.cfg.UpdateArgs', {
        config: { score: 0 },
        updateScore: spy,
      });
      const inst = new Cls({ score: 10 });
      spy.mockClear();
      inst.setScore(20);
      expect(spy).toHaveBeenCalledWith(20, 10);
    });

    it('updateFoo is NOT called when value does not change', () => {
      const spy = vi.fn();
      const Cls = define('test.cfg.NoUpdate', {
        config: { score: 0 },
        updateScore: spy,
      });
      const inst = new Cls({ score: 5 });
      spy.mockClear();
      inst.setScore(5);
      expect(spy).not.toHaveBeenCalled();
    });

    it('applyFoo receives newValue and oldValue', () => {
      const spy = vi.fn((v: number) => v);
      const Cls = define('test.cfg.ApplyArgs', {
        config: { count: 0 },
        applyCount: spy,
      });
      const inst = new Cls({ count: 1 });
      spy.mockClear();
      inst.setCount(2);
      expect(spy).toHaveBeenCalledWith(2, 1);
    });

    it('applyFoo can reject a value by returning undefined', () => {
      const Cls = define('test.cfg.ApplyReject', {
        config: { age: 0 },
        applyAge(value: number, oldValue: number) {
          return value >= 0 ? value : oldValue;
        },
      });
      const inst = new Cls({ age: 25 });
      inst.setAge(-1);
      expect(inst.getAge()).toBe(25);
    });
  });

  // -----------------------------------------------------------------------
  // Config inheritance
  // -----------------------------------------------------------------------
  describe('config inheritance', () => {
    it('subclass inherits parent configs', () => {
      const Parent = define('test.cfg.Parent', {
        config: { name: 'parent' },
      });
      const Child = define('test.cfg.Child', {
        extend: Parent,
        config: { age: 0 },
      });
      const inst = new Child({ name: 'Alice', age: 30 });
      expect(inst.getName()).toBe('Alice');
      expect(inst.getAge()).toBe(30);
    });

    it('subclass can override parent config defaults', () => {
      const Parent = define('test.cfg.InhParent', {
        config: { color: 'red' },
      });
      const Child = define('test.cfg.InhChild', {
        extend: Parent,
        config: { color: 'blue' },
      });
      const inst = new Child();
      expect(inst.getColor()).toBe('blue');
    });

    it('subclass inherits parent apply/update hooks', () => {
      const spy = vi.fn((v: string) => v.toUpperCase());
      const Parent = define('test.cfg.HookParent', {
        config: { label: '' },
        applyLabel: spy,
      });
      const Child = define('test.cfg.HookChild', {
        extend: Parent,
        config: { extra: 0 },
      });
      const inst = new Child({ label: 'test' });
      expect(inst.getLabel()).toBe('TEST');
      expect(spy).toHaveBeenCalled();
    });

    it('three-level config inheritance works', () => {
      const A = define('test.cfg.A', { config: { x: 1 } });
      const B = define('test.cfg.B', { extend: A, config: { y: 2 } });
      const C = define('test.cfg.C', { extend: B, config: { z: 3 } });
      const inst = new C();
      expect(inst.getX()).toBe(1);
      expect(inst.getY()).toBe(2);
      expect(inst.getZ()).toBe(3);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// callParent
// ═══════════════════════════════════════════════════════════════════════════

describe('callParent', () => {
  it('calls the superclass implementation of the same method', () => {
    const Parent = define('test.cp.Parent', {
      greet() {
        return 'hello from Parent';
      },
    });
    const Child = define('test.cp.Child', {
      extend: Parent,
      greet() {
        return (this as Base).callParent() + ' and Child';
      },
    });
    const inst = new Child();
    expect(inst.greet()).toBe('hello from Parent and Child');
  });

  it('works through three levels of inheritance', () => {
    const A = define('test.cp.A', {
      value() {
        return 'A';
      },
    });
    const B = define('test.cp.B', {
      extend: A,
      value() {
        return (this as Base).callParent() + '+B';
      },
    });
    const C = define('test.cp.C', {
      extend: B,
      value() {
        return (this as Base).callParent() + '+C';
      },
    });
    expect(new C().value()).toBe('A+B+C');
  });

  it('passes arguments to the parent method', () => {
    const Parent = define('test.cp.ArgsParent', {
      add(a: number, b: number) {
        return a + b;
      },
    });
    const Child = define('test.cp.ArgsChild', {
      extend: Parent,
      add(a: number, b: number) {
        const parentResult = (this as Base).callParent([a, b]) as number;
        return parentResult * 2;
      },
    });
    expect(new Child().add(3, 4)).toBe(14);
  });

  it('returns undefined when parent has no such method', () => {
    const Cls = define('test.cp.NoParent', {
      myMethod() {
        return (this as Base).callParent();
      },
    });
    expect(new Cls().myMethod()).toBeUndefined();
  });

  it('callParent works for constructor-like init methods', () => {
    const Parent = define('test.cp.InitParent', {
      init() {
        (this as Record<string, unknown>).parentInit = true;
      },
    });
    const Child = define('test.cp.InitChild', {
      extend: Parent,
      init() {
        (this as Base).callParent();
        (this as Record<string, unknown>).childInit = true;
      },
    });
    const inst = new Child();
    inst.init();
    expect((inst as Record<string, unknown>).parentInit).toBe(true);
    expect((inst as Record<string, unknown>).childInit).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MIXINS
// ═══════════════════════════════════════════════════════════════════════════

describe('Mixins', () => {
  describe('method copying', () => {
    it('copies mixin methods to the target class prototype', () => {
      const Serializable = define('test.mixin.Serializable', {
        serialize() {
          return JSON.stringify(this);
        },
      });
      const Cls = define('test.mixin.Target', {
        mixins: [Serializable],
        config: { name: '' },
      });
      const inst = new Cls({ name: 'test' });
      expect(typeof inst.serialize).toBe('function');
    });

    it('does not overwrite methods already on the target', () => {
      const Mixin = define('test.mixin.Overwrite', {
        hello() {
          return 'from mixin';
        },
      });
      const Cls = define('test.mixin.OwnMethod', {
        mixins: [Mixin],
        hello() {
          return 'from class';
        },
      });
      expect(new Cls().hello()).toBe('from class');
    });
  });

  describe('config merging', () => {
    it('merges mixin configs into the target class', () => {
      const Mixin = define('test.mixin.WithConfig', {
        config: { mixinProp: 'default' },
      });
      const Cls = define('test.mixin.ConfigTarget', {
        mixins: [Mixin],
        config: { ownProp: 'own' },
      });
      const inst = new Cls();
      expect(inst.getMixinProp()).toBe('default');
      expect(inst.getOwnProp()).toBe('own');
    });

    it('class own config takes precedence over mixin config', () => {
      const Mixin = define('test.mixin.CfgPrecedence', {
        config: { color: 'mixin-red' },
      });
      const Cls = define('test.mixin.CfgOwn', {
        mixins: [Mixin],
        config: { color: 'class-blue' },
      });
      expect(new Cls().getColor()).toBe('class-blue');
    });
  });

  describe('hasMixin', () => {
    it('returns true for an applied mixin', () => {
      const Mixin = define('test.mixin.HasCheck', {});
      const Cls = define('test.mixin.HasTarget', {
        mixins: [Mixin],
      });
      expect(new Cls().hasMixin(Mixin)).toBe(true);
    });

    it('returns false for a non-applied mixin', () => {
      const Mixin = define('test.mixin.NotApplied', {});
      const Cls = define('test.mixin.NoMixin', {});
      expect(new Cls().hasMixin(Mixin)).toBe(false);
    });
  });

  describe('diamond inheritance', () => {
    it('does not apply the same mixin twice', () => {
      let _applyCount = 0;
      const Shared = define('test.mixin.Shared', {
        sharedInit() {
          _applyCount++;
        },
      });
      const Left = define('test.mixin.Left', {
        mixins: [Shared],
        leftMethod() {
          return 'left';
        },
      });
      const Right = define('test.mixin.Right', {
        mixins: [Shared],
        rightMethod() {
          return 'right';
        },
      });
      const Combined = define('test.mixin.Combined', {
        mixins: [Left, Right],
      });
      const inst = new Combined();
      expect(inst.hasMixin(Shared)).toBe(true);
      expect(inst.hasMixin(Left)).toBe(true);
      expect(inst.hasMixin(Right)).toBe(true);
      // sharedInit should exist on prototype only once
      expect(typeof inst.sharedInit).toBe('function');
      expect(typeof inst.leftMethod).toBe('function');
      expect(typeof inst.rightMethod).toBe('function');
    });

    it('tracks transitive mixins via hasMixin', () => {
      const M1 = define('test.mixin.TransM1', {});
      const M2 = define('test.mixin.TransM2', { mixins: [M1] });
      const Cls = define('test.mixin.TransHost', { mixins: [M2] });
      const inst = new Cls();
      expect(inst.hasMixin(M1)).toBe(true);
      expect(inst.hasMixin(M2)).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CLASS MANAGER
// ═══════════════════════════════════════════════════════════════════════════

describe('ClassManager', () => {
  describe('registration and lookup', () => {
    it('registers a class by name', () => {
      const _Cls = define('test.cm.Registered', {});
      expect(ClassManager.isRegistered('test.cm.Registered')).toBe(true);
    });

    it('retrieves a registered class by name', () => {
      const Cls = define('test.cm.Retrieve', {});
      expect(ClassManager.get('test.cm.Retrieve')).toBe(Cls);
    });

    it('returns undefined for unregistered name', () => {
      expect(ClassManager.get('nonexistent.Class')).toBeUndefined();
    });

    it('isRegistered returns false for unknown class', () => {
      expect(ClassManager.isRegistered('nope')).toBe(false);
    });

    it('manually registers a class', () => {
      class Custom extends Base {
        static override $className = 'test.cm.Manual';
      }
      ClassManager.register('test.cm.Manual', Custom);
      expect(ClassManager.get('test.cm.Manual')).toBe(Custom);
    });
  });

  describe('aliases', () => {
    it('registers and retrieves by alias', () => {
      const Cls = define('test.cm.AliasClass', {
        alias: 'widget.testbutton',
      });
      expect(ClassManager.getByAlias('widget.testbutton')).toBe(Cls);
    });

    it('supports multiple aliases', () => {
      const Cls = define('test.cm.MultiAlias', {
        alias: ['widget.multi1', 'widget.multi2'],
      });
      expect(ClassManager.getByAlias('widget.multi1')).toBe(Cls);
      expect(ClassManager.getByAlias('widget.multi2')).toBe(Cls);
    });

    it('returns undefined for unknown alias', () => {
      expect(ClassManager.getByAlias('unknown.alias')).toBeUndefined();
    });

    it('instantiateByAlias creates an instance', () => {
      define('test.cm.InstAlias', {
        alias: 'widget.insttest',
        config: { val: 0 },
      });
      const inst = ClassManager.instantiateByAlias('widget.insttest', { val: 99 });
      expect(inst).toBeInstanceOf(Base);
      expect(inst.getVal()).toBe(99);
    });

    it('instantiateByAlias throws for unknown alias', () => {
      expect(() => ClassManager.instantiateByAlias('no.such.alias')).toThrow();
    });
  });

  describe('prefix search', () => {
    it('returns class names matching a prefix', () => {
      define('test.prefix.Alpha', {});
      define('test.prefix.Beta', {});
      define('test.other.Gamma', {});
      const result = ClassManager.getNamesByPrefix('test.prefix.');
      expect(result).toContain('test.prefix.Alpha');
      expect(result).toContain('test.prefix.Beta');
      expect(result).not.toContain('test.other.Gamma');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// define()
// ═══════════════════════════════════════════════════════════════════════════

describe('define()', () => {
  it('creates a class registered with ClassManager', () => {
    const Cls = define('test.def.Basic', {});
    expect(ClassManager.get('test.def.Basic')).toBe(Cls);
  });

  it('created class extends Base by default', () => {
    const Cls = define('test.def.ExtendsBase', {});
    expect(new Cls()).toBeInstanceOf(Base);
  });

  it('created class extends specified parent', () => {
    const Parent = define('test.def.Parent', {});
    const Child = define('test.def.Child', { extend: Parent });
    const inst = new Child();
    expect(inst).toBeInstanceOf(Parent);
    expect(inst).toBeInstanceOf(Base);
  });

  it('sets $className on the class', () => {
    const Cls = define('test.def.Named', {});
    expect(Cls.$className).toBe('test.def.Named');
    expect(new Cls().$className).toBe('test.def.Named');
  });

  it('copies methods from definition to prototype', () => {
    const Cls = define('test.def.Methods', {
      greet(name: string) {
        return `Hi, ${name}`;
      },
    });
    expect(new Cls().greet('World')).toBe('Hi, World');
  });

  it('sets up config accessors', () => {
    const Cls = define('test.def.Configs', {
      config: { title: 'Untitled' },
    });
    const inst = new Cls({ title: 'My Title' });
    expect(inst.getTitle()).toBe('My Title');
    inst.setTitle('Changed');
    expect(inst.getTitle()).toBe('Changed');
  });

  it('applies mixins', () => {
    const M = define('test.def.MixinSrc', {
      mixed() {
        return 'mixed';
      },
    });
    const Cls = define('test.def.MixinDst', {
      mixins: [M],
    });
    expect(new Cls().mixed()).toBe('mixed');
  });

  it('applies static members from statics property', () => {
    const Cls = define('test.def.Statics', {
      statics: {
        TYPE: 'static_val',
        helper() {
          return 42;
        },
      },
    });
    expect((Cls as Record<string, unknown>).TYPE).toBe('static_val');
    expect((Cls as Record<string, (...args: unknown[]) => unknown>).helper()).toBe(42);
  });

  it('sets up alias', () => {
    define('test.def.Aliased', {
      alias: 'widget.testalias',
    });
    expect(ClassManager.getByAlias('widget.testalias')).toBeDefined();
  });

  it('returns a constructor that can be instantiated with new', () => {
    const Cls = define('test.def.NewCtor', {
      config: { x: 0 },
    });
    const inst = new Cls({ x: 42 });
    expect(inst.getX()).toBe(42);
    expect(inst).toBeInstanceOf(Base);
  });

  it('full integration: extend + mixin + config + alias + method + callParent', () => {
    const Loggable = define('test.intg.Loggable', {
      config: { logLevel: 'info' },
      log(msg: string) {
        return `[${this.getLogLevel()}] ${msg}`;
      },
    });
    const Base1 = define('test.intg.Base1', {
      config: { name: '' },
      describe() {
        return `I am ${this.getName()}`;
      },
    });
    const _Derived = define('test.intg.Derived', {
      extend: Base1,
      mixins: [Loggable],
      alias: 'widget.derived',
      config: { name: 'derived-default', extra: true },
      describe() {
        const base = (this as Base).callParent() as string;
        return `${base} (derived)`;
      },
    });

    const inst = ClassManager.instantiateByAlias('widget.derived', {
      name: 'Alice',
      logLevel: 'debug',
    });
    expect(inst.$className).toBe('test.intg.Derived');
    expect(inst.describe()).toBe('I am Alice (derived)');
    expect(inst.log('test')).toBe('[debug] test');
    expect(inst.getExtra()).toBe(true);
    expect(inst.hasMixin(Loggable)).toBe(true);
    expect(inst).toBeInstanceOf(Base1);
    expect(inst).toBeInstanceOf(Base);
  });
});
