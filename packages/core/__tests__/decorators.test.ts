import { describe, it, expect, vi } from 'vitest';
import { Base, define, ClassManager } from '../src/class/index.js';
import { config, observable, alias, mixin, override } from '../src/class/decorators.js';
import { Configurator } from '../src/class/Configurator.js';

// ═══════════════════════════════════════════════════════════════════════════
// @config — basic accessor decorator
// ═══════════════════════════════════════════════════════════════════════════

describe('@config basic', () => {
  it('auto-generates getX() and setX() methods', () => {
    class Widget extends Base {
      @config accessor title: string = 'Untitled';
    }
    const w = new Widget();
    expect(typeof w.getTitle).toBe('function');
    expect(typeof w.setTitle).toBe('function');
  });

  it('getter returns the initial default value', () => {
    class Widget extends Base {
      @config accessor title: string = 'Default';
    }
    const w = new Widget();
    expect(w.getTitle()).toBe('Default');
  });

  it('setter updates the value', () => {
    class Widget extends Base {
      @config accessor count: number = 0;
    }
    const w = new Widget();
    w.setCount(42);
    expect(w.getCount()).toBe(42);
  });

  it('accessor property reflects changes via set', () => {
    class Widget extends Base {
      @config accessor count: number = 0;
    }
    const w = new Widget();
    w.count = 10;
    expect(w.getCount()).toBe(10);
    w.setCount(20);
    expect(w.count).toBe(20);
  });

  it('initConfig applies provided values', () => {
    class Widget extends Base {
      @config accessor name: string = '';
      @config accessor age: number = 0;
    }
    const w = new Widget({ name: 'Alice', age: 30 });
    expect(w.getName()).toBe('Alice');
    expect(w.getAge()).toBe(30);
  });

  it('calls applyX hook to transform the value', () => {
    class Widget extends Base {
      @config accessor label: string = '';
      applyLabel(value: string): string {
        return value.trim().toUpperCase();
      }
    }
    const w = new Widget({ label: '  hello  ' });
    expect(w.getLabel()).toBe('HELLO');
  });

  it('calls updateX hook after the value changes', () => {
    const spy = vi.fn();
    class Widget extends Base {
      @config accessor score: number = 0;
      updateScore(newVal: number, oldVal: number) {
        spy(newVal, oldVal);
      }
    }
    const w = new Widget({ score: 10 });
    expect(spy).toHaveBeenCalledWith(10, 0);
  });

  it('updateX receives newValue and oldValue', () => {
    const spy = vi.fn();
    class Widget extends Base {
      @config accessor score: number = 0;
      updateScore(newVal: number, oldVal: number) {
        spy(newVal, oldVal);
      }
    }
    const w = new Widget({ score: 5 });
    spy.mockClear();
    w.setScore(15);
    expect(spy).toHaveBeenCalledWith(15, 5);
  });

  it('updateX is NOT called when value does not change', () => {
    const spy = vi.fn();
    class Widget extends Base {
      @config accessor value: number = 0;
      updateValue(newVal: number, oldVal: number) {
        spy(newVal, oldVal);
      }
    }
    const w = new Widget({ value: 7 });
    spy.mockClear();
    w.setValue(7);
    expect(spy).not.toHaveBeenCalled();
  });

  it('applyX can reject a value by returning the old value', () => {
    class Widget extends Base {
      @config accessor age: number = 0;
      applyAge(newVal: number, oldVal: number): number {
        return newVal >= 0 ? newVal : oldVal;
      }
    }
    const w = new Widget({ age: 25 });
    w.setAge(-1);
    expect(w.getAge()).toBe(25);
  });

  it('supports multiple configs on one class', () => {
    class Panel extends Base {
      @config accessor title: string = '';
      @config accessor width: number = 100;
      @config accessor collapsed: boolean = false;
    }
    const p = new Panel({ title: 'Test', width: 200, collapsed: true });
    expect(p.getTitle()).toBe('Test');
    expect(p.getWidth()).toBe(200);
    expect(p.getCollapsed()).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// @config.required
// ═══════════════════════════════════════════════════════════════════════════

describe('@config.required', () => {
  it('throws if the required config is not provided', () => {
    class Widget extends Base {
      @config.required accessor name: string = '';
    }
    expect(() => new Widget()).toThrow(/name/);
  });

  it('does not throw when the required config IS provided', () => {
    class Widget extends Base {
      @config.required accessor name: string = '';
    }
    expect(() => new Widget({ name: 'Alice' })).not.toThrow();
  });

  it('works alongside non-required configs', () => {
    class Widget extends Base {
      @config.required accessor name: string = '';
      @config accessor color: string = 'red';
    }
    const w = new Widget({ name: 'Test' });
    expect(w.getName()).toBe('Test');
    expect(w.getColor()).toBe('red');
  });

  it('lists all missing required configs in the error', () => {
    class Widget extends Base {
      @config.required accessor firstName: string = '';
      @config.required accessor lastName: string = '';
    }
    expect(() => new Widget()).toThrow(/firstName/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// @config.lazy
// ═══════════════════════════════════════════════════════════════════════════

describe('@config.lazy', () => {
  it('does not compute the factory until first access', () => {
    const factory = vi.fn(() => ({ complex: true }));
    class Widget extends Base {
      @config.lazy(factory) accessor data: object = {};
    }
    const w = new Widget();
    expect(factory).not.toHaveBeenCalled();
    const val = w.getData();
    expect(factory).toHaveBeenCalledOnce();
    expect(val).toEqual({ complex: true });
  });

  it('caches the factory result after first access', () => {
    let callCount = 0;
    class Widget extends Base {
      @config.lazy(() => {
        callCount++;
        return 'computed';
      })
      accessor label: string = '';
    }
    const w = new Widget();
    w.getLabel();
    w.getLabel();
    expect(callCount).toBe(1);
  });

  it('factory is NOT called if value is explicitly set before access', () => {
    const factory = vi.fn(() => 'lazy');
    class Widget extends Base {
      @config.lazy(factory) accessor tag: string = '';
    }
    const w = new Widget({ tag: 'explicit' });
    expect(w.getTag()).toBe('explicit');
    expect(factory).not.toHaveBeenCalled();
  });

  it('factory receives the instance as `this`', () => {
    class Widget extends Base {
      @config accessor prefix: string = 'W';
      @config.lazy(function (this: Widget) {
        return `${this.getPrefix()}-item`;
      })
      accessor label: string = '';
    }
    const w = new Widget({ prefix: 'Panel' });
    expect(w.getLabel()).toBe('Panel-item');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// @config.cached
// ═══════════════════════════════════════════════════════════════════════════

describe('@config.cached', () => {
  it('caches the getter result', () => {
    let readCount = 0;
    class Widget extends Base {
      @config.cached accessor fullName: string = '';
      applyFullName(v: string): string {
        readCount++;
        return v.toUpperCase();
      }
    }
    const w = new Widget({ fullName: 'john' });
    // First get → cache miss → reads from accessor, caches
    expect(w.getFullName()).toBe('JOHN');
    expect(readCount).toBe(1);
    // Second get → cache hit
    expect(w.getFullName()).toBe('JOHN');
    expect(readCount).toBe(1);
  });

  it('invalidates cache when set is called', () => {
    let applyCount = 0;
    class Widget extends Base {
      @config.cached accessor fullName: string = '';
      applyFullName(v: string): string {
        applyCount++;
        return v.toUpperCase();
      }
    }
    const w = new Widget({ fullName: 'john' });
    w.getFullName(); // cache the value
    expect(applyCount).toBe(1);
    w.setFullName('Alice');
    expect(applyCount).toBe(2);
    w.getFullName(); // re-read after invalidation
    w.getFullName(); // cached again
    expect(applyCount).toBe(2);
  });

  it('cache is per-instance', () => {
    let applyCount = 0;
    class Widget extends Base {
      @config.cached accessor fullName: string = '';
      applyFullName(v: string): string {
        applyCount++;
        return v.toUpperCase();
      }
    }
    const a = new Widget({ fullName: 'a' });
    const b = new Widget({ fullName: 'b' });
    a.getFullName();
    b.getFullName();
    expect(applyCount).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// @config.merge
// ═══════════════════════════════════════════════════════════════════════════

describe('@config.merge', () => {
  it('deep-merges config values with defaults instead of replacing', () => {
    class Widget extends Base {
      @config.merge accessor style: Record<string, unknown> = {
        color: 'red',
        font: { size: 12 },
      };
    }
    const w = new Widget({
      style: { font: { weight: 'bold' } },
    });
    const s = w.getStyle() as Record<string, unknown>;
    expect(s.color).toBe('red');
    expect((s.font as Record<string, unknown>).size).toBe(12);
    expect((s.font as Record<string, unknown>).weight).toBe('bold');
  });

  it('provided top-level keys override defaults', () => {
    class Widget extends Base {
      @config.merge accessor style: Record<string, unknown> = {
        color: 'red',
        margin: 10,
      };
    }
    const w = new Widget({ style: { color: 'blue' } });
    const s = w.getStyle() as Record<string, unknown>;
    expect(s.color).toBe('blue');
    expect(s.margin).toBe(10);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// @observable
// ═══════════════════════════════════════════════════════════════════════════

describe('@observable', () => {
  it('marks the config as observable in metadata', () => {
    class Widget extends Base {
      @observable @config accessor title: string = '';
    }
    const meta = Configurator.getConfigMeta(Widget, 'title');
    expect(meta).toBeDefined();
    expect(meta!.observable).toBe(true);
  });

  it('does not affect get/set behaviour (event integration is Phase 2)', () => {
    class Widget extends Base {
      @observable @config accessor title: string = 'hi';
    }
    const w = new Widget();
    expect(w.getTitle()).toBe('hi');
    w.setTitle('bye');
    expect(w.getTitle()).toBe('bye');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// @alias class decorator
// ═══════════════════════════════════════════════════════════════════════════

describe('@alias class decorator', () => {
  it('registers the class with ClassManager under the given alias', () => {
    @alias('widget.fancy')
    class FancyWidget extends Base {
      static override $className = 'test.dec.FancyWidget';
    }
    expect(ClassManager.getByAlias('widget.fancy')).toBe(FancyWidget);
  });

  it('supports multiple aliases via multiple decorators', () => {
    @alias('widget.multi1dec')
    @alias('widget.multi2dec')
    class MultiWidget extends Base {
      static override $className = 'test.dec.MultiWidget';
    }
    expect(ClassManager.getByAlias('widget.multi1dec')).toBe(MultiWidget);
    expect(ClassManager.getByAlias('widget.multi2dec')).toBe(MultiWidget);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// @mixin class decorator
// ═══════════════════════════════════════════════════════════════════════════

describe('@mixin class decorator', () => {
  it('applies a mixin class to the target', () => {
    const Serializable = define('test.dec.Serializable', {
      serialize() {
        return 'serialized';
      },
    });
    @mixin(Serializable)
    class Widget extends Base {}
    const w = new Widget();
    expect(typeof (w as any).serialize).toBe('function');
    expect((w as any).serialize()).toBe('serialized');
    expect(w.hasMixin(Serializable)).toBe(true);
  });

  it('applies multiple mixins via stacked decorators', () => {
    const M1 = define('test.dec.Mixin1', {
      m1() {
        return 'm1';
      },
    });
    const M2 = define('test.dec.Mixin2', {
      m2() {
        return 'm2';
      },
    });
    @mixin(M1)
    @mixin(M2)
    class Widget extends Base {}
    const w = new Widget();
    expect((w as any).m1()).toBe('m1');
    expect((w as any).m2()).toBe('m2');
  });

  it('does not overwrite existing methods on the target', () => {
    const M = define('test.dec.MixinOverwrite', {
      greet() {
        return 'from mixin';
      },
    });
    @mixin(M)
    class Widget extends Base {
      greet() {
        return 'from class';
      }
    }
    expect(new Widget().greet()).toBe('from class');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// @override class decorator
// ═══════════════════════════════════════════════════════════════════════════

describe('@override class decorator', () => {
  it('patches methods onto the target class prototype', () => {
    class Original extends Base {
      greet() {
        return 'original';
      }
    }

    @override(Original)
    class _Patch extends Base {
      greet() {
        return 'patched';
      }
    }

    expect(new Original().greet()).toBe('patched');
  });

  it('can add new methods to the target class', () => {
    class Original extends Base {
      value() {
        return 1;
      }
    }

    @override(Original)
    class _Patch extends Base {
      extra() {
        return 'added';
      }
    }

    expect((new Original() as any).extra()).toBe('added');
  });

  it('preserves methods not overridden', () => {
    class Original extends Base {
      kept() {
        return 'kept';
      }
      replaced() {
        return 'old';
      }
    }

    @override(Original)
    class _Patch extends Base {
      replaced() {
        return 'new';
      }
    }

    const o = new Original();
    expect(o.kept()).toBe('kept');
    expect(o.replaced()).toBe('new');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Configurator
// ═══════════════════════════════════════════════════════════════════════════

describe('Configurator', () => {
  describe('getConfigMeta', () => {
    it('returns metadata for a decorated config', () => {
      class Widget extends Base {
        @config accessor title: string = '';
      }
      const meta = Configurator.getConfigMeta(Widget, 'title');
      expect(meta).toBeDefined();
      expect(meta!.name).toBe('title');
    });

    it('returns undefined for a non-existent config', () => {
      class Widget extends Base {}
      expect(Configurator.getConfigMeta(Widget, 'missing')).toBeUndefined();
    });
  });

  describe('getAllConfigMeta', () => {
    it('returns all config meta for a class including inherited', () => {
      class Parent extends Base {
        @config accessor x: number = 0;
      }
      class Child extends Parent {
        @config accessor y: number = 0;
      }
      const allMeta = Configurator.getAllConfigMeta(Child);
      const names = allMeta.map((m) => m.name);
      expect(names).toContain('x');
      expect(names).toContain('y');
    });
  });

  describe('config dependency ordering', () => {
    it('initialises configs in the order they are declared', () => {
      const order: string[] = [];
      class Widget extends Base {
        @config accessor first: string = '';
        @config accessor second: string = '';
        applyFirst(v: string): string {
          order.push('first');
          return v;
        }
        applySecond(v: string): string {
          order.push('second');
          return v;
        }
      }
      new Widget({ first: 'a', second: 'b' });
      expect(order).toEqual(['first', 'second']);
    });
  });

  describe('required validation', () => {
    it('validates all required configs at construction time', () => {
      class Widget extends Base {
        @config.required accessor a: string = '';
        @config.required accessor b: string = '';
      }
      expect(() => new Widget({ a: 'yes' })).toThrow(/b/);
    });

    it('passes when all required configs are provided', () => {
      class Widget extends Base {
        @config.required accessor a: string = '';
        @config.required accessor b: string = '';
      }
      expect(() => new Widget({ a: '1', b: '2' })).not.toThrow();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Inheritance of decorated configs
// ═══════════════════════════════════════════════════════════════════════════

describe('Decorated config inheritance', () => {
  it('subclass inherits parent @config accessors', () => {
    class Parent extends Base {
      @config accessor name: string = 'parent';
    }
    class Child extends Parent {
      @config accessor age: number = 0;
    }
    const c = new Child({ name: 'Alice', age: 25 });
    expect(c.getName()).toBe('Alice');
    expect(c.getAge()).toBe(25);
  });

  it('subclass default overrides parent default', () => {
    class Parent extends Base {
      @config accessor color: string = 'red';
    }
    class Child extends Parent {
      @config override accessor color: string = 'blue';
    }
    const c = new Child();
    expect(c.getColor()).toBe('blue');
  });

  it('three-level inheritance works', () => {
    class A extends Base {
      @config accessor x: number = 1;
    }
    class B extends A {
      @config accessor y: number = 2;
    }
    class C extends B {
      @config accessor z: number = 3;
    }
    const c = new C();
    expect(c.getX()).toBe(1);
    expect(c.getY()).toBe(2);
    expect(c.getZ()).toBe(3);
  });

  it('parent apply hooks are inherited', () => {
    const spy = vi.fn((v: string) => v.toUpperCase());
    class Parent extends Base {
      @config accessor label: string = '';
      applyLabel(v: string) {
        return spy(v);
      }
    }
    class Child extends Parent {
      @config accessor extra: number = 0;
    }
    const c = new Child({ label: 'test' });
    expect(c.getLabel()).toBe('TEST');
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Combined decorators on a single class
// ═══════════════════════════════════════════════════════════════════════════

describe('Combined decorators', () => {
  it('class with @alias, @mixin, and @config all together', () => {
    const Loggable = define('test.dec.Loggable', {
      log(msg: string) {
        return `[LOG] ${msg}`;
      },
    });

    @alias('widget.superpanel')
    @mixin(Loggable)
    class SuperPanel extends Base {
      static override $className = 'test.dec.SuperPanel';
      @config accessor title: string = 'Default';
      @config.required accessor id: string = '';
      @observable @config accessor theme: string = 'light';
    }

    // Alias works
    expect(ClassManager.getByAlias('widget.superpanel')).toBe(SuperPanel);

    // Construction with required config
    const sp = new SuperPanel({ id: 'sp-1', title: 'My Panel' });
    expect(sp.getTitle()).toBe('My Panel');
    expect(sp.getId()).toBe('sp-1');
    expect(sp.getTheme()).toBe('light');

    // Mixin works
    expect(sp.hasMixin(Loggable)).toBe(true);
    expect((sp as any).log('hi')).toBe('[LOG] hi');

    // Observable metadata
    const meta = Configurator.getConfigMeta(SuperPanel, 'theme');
    expect(meta!.observable).toBe(true);
  });

  it('define()-based class and decorator-based class coexist', () => {
    const DefClass = define('test.dec.DefClass', {
      config: { defProp: 'from-define' },
    });

    class DecClass extends Base {
      @config accessor decProp: string = 'from-decorator';
    }

    expect(new (DefClass as any)().getDefProp()).toBe('from-define');
    expect(new DecClass().getDecProp()).toBe('from-decorator');
  });
});
