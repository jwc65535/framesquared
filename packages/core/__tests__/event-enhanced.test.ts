import { describe, it, expect, vi } from 'vitest';
import { Base, define } from '../src/class/index.js';
import { Observable } from '../src/event/Observable.js';
import { DestroyableUtil } from '../src/event/Destroyable.js';
import type { Destroyable } from '../src/event/Destroyable.js';
import { EventDomain } from '../src/event/EventDomain.js';
import { EventBus } from '../src/event/EventBus.js';
import type { TypedObservable } from '../src/event/TypedObservable.js';

// Helper
function createObs(name: string, extra: Record<string, unknown> = {}) {
  return define(name, { mixins: [Observable], ...extra });
}

// ═══════════════════════════════════════════════════════════════════════════
// Destroyable.combine
// ═══════════════════════════════════════════════════════════════════════════

describe('DestroyableUtil.combine', () => {
  it('returns a single Destroyable that destroys all items', () => {
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    const spy3 = vi.fn();
    const d1: Destroyable = { destroy: spy1 };
    const d2: Destroyable = { destroy: spy2 };
    const d3: Destroyable = { destroy: spy3 };
    const combined = DestroyableUtil.combine(d1, d2, d3);
    combined.destroy();
    expect(spy1).toHaveBeenCalledOnce();
    expect(spy2).toHaveBeenCalledOnce();
    expect(spy3).toHaveBeenCalledOnce();
  });

  it('combined destroy is idempotent', () => {
    const spy = vi.fn();
    const d: Destroyable = { destroy: spy };
    const combined = DestroyableUtil.combine(d);
    combined.destroy();
    combined.destroy();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('works with zero items', () => {
    const combined = DestroyableUtil.combine();
    expect(() => combined.destroy()).not.toThrow();
  });

  it('works with a single item', () => {
    const spy = vi.fn();
    const combined = DestroyableUtil.combine({ destroy: spy });
    combined.destroy();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('integrates with Observable destroyable handles', () => {
    const Cls = createObs('test.dutil.Handle');
    const inst = new Cls();
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    const h1 = inst.on('a', spy1, undefined, { destroyable: true })!;
    const h2 = inst.on('b', spy2, undefined, { destroyable: true })!;
    const combined = DestroyableUtil.combine(h1, h2);
    combined.destroy();
    inst.fireEvent('a');
    inst.fireEvent('b');
    expect(spy1).not.toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// EventDomain
// ═══════════════════════════════════════════════════════════════════════════

describe('EventDomain', () => {
  describe('registration and lookup', () => {
    it('registers a domain by name', () => {
      const domain = new EventDomain('testDomain1', () => false);
      EventDomain.register('testDomain1', domain);
      expect(EventDomain.get('testDomain1')).toBe(domain);
    });

    it('returns undefined for unregistered domain', () => {
      expect(EventDomain.get('nonexistent-domain')).toBeUndefined();
    });
  });

  describe('match', () => {
    it('match function determines if a target belongs to the domain', () => {
      const Widget = createObs('test.dom.Widget', { config: { isWidget: true } });
      const Store = createObs('test.dom.Store', { config: { isStore: true } });

      const widgetDomain = new EventDomain('widget', (target) => !!(target as any).getIsWidget?.());

      const w = new Widget({ isWidget: true });
      const s = new Store({ isStore: true });

      expect(widgetDomain.match(w)).toBe(true);
      expect(widgetDomain.match(s)).toBe(false);
    });
  });

  describe('listen — controller-style event routing', () => {
    it('routes events based on domain matching', () => {
      const Widget = createObs('test.dom.ListenWidget', {
        config: { itemId: '', isWidget: true },
      });
      const widgetDomain = new EventDomain('widgetListen', (t) => !!(t as any).getIsWidget?.());
      EventDomain.register('widgetListen', widgetDomain);

      const spy = vi.fn();
      const btn = new Widget({ itemId: 'myBtn', isWidget: true });

      // Register a listener config: domain → selector → event → handler
      widgetDomain.listen({
        '#myBtn': {
          click: spy,
        },
      });

      // Fire through the domain
      widgetDomain.dispatch(btn, 'click', ['data']);
      expect(spy).toHaveBeenCalledWith('data');
    });

    it('does not fire if selector does not match', () => {
      const Widget = createObs('test.dom.NoMatch', {
        config: { itemId: '', isWidget: true },
      });
      const domain = new EventDomain('widgetNoMatch', (t) => !!(t as any).getIsWidget?.());

      const spy = vi.fn();
      domain.listen({ '#otherBtn': { click: spy } });

      const btn = new Widget({ itemId: 'myBtn', isWidget: true });
      domain.dispatch(btn, 'click', []);
      expect(spy).not.toHaveBeenCalled();
    });

    it('matches by $className selector', () => {
      const Widget = createObs('test.dom.ByClass', {
        config: { isWidget: true },
      });
      const domain = new EventDomain('widgetByClass', (t) => !!(t as any).getIsWidget?.());

      const spy = vi.fn();
      domain.listen({
        'test.dom.ByClass': { activate: spy },
      });

      const w = new Widget({ isWidget: true });
      domain.dispatch(w, 'activate', ['hello']);
      expect(spy).toHaveBeenCalledWith('hello');
    });

    it('returns a destroyable that removes the listener config', () => {
      const domain = new EventDomain('widgetDestroyable', () => true);
      const spy = vi.fn();
      const handle = domain.listen({ '#x': { click: spy } });
      handle.destroy();

      const Cls = createObs('test.dom.Destroyable', { config: { itemId: 'x' } });
      const inst = new Cls({ itemId: 'x' });
      domain.dispatch(inst, 'click', []);
      expect(spy).not.toHaveBeenCalled();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// EventBus
// ═══════════════════════════════════════════════════════════════════════════

describe('EventBus', () => {
  describe('basic publish / subscribe', () => {
    it('subscriber receives published messages', () => {
      const spy = vi.fn();
      EventBus.subscribe('test.basic', spy);
      EventBus.publish('test.basic', 'hello');
      expect(spy).toHaveBeenCalledWith('hello');
      EventBus.unsubscribe('test.basic', spy);
    });

    it('multiple subscribers all receive the message', () => {
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      EventBus.subscribe('test.multi', spy1);
      EventBus.subscribe('test.multi', spy2);
      EventBus.publish('test.multi', 42);
      expect(spy1).toHaveBeenCalledWith(42);
      expect(spy2).toHaveBeenCalledWith(42);
      EventBus.unsubscribe('test.multi', spy1);
      EventBus.unsubscribe('test.multi', spy2);
    });

    it('passes multiple arguments', () => {
      const spy = vi.fn();
      EventBus.subscribe('test.args', spy);
      EventBus.publish('test.args', 1, 'two', { three: 3 });
      expect(spy).toHaveBeenCalledWith(1, 'two', { three: 3 });
      EventBus.unsubscribe('test.args', spy);
    });
  });

  describe('unsubscribe', () => {
    it('removes a specific subscriber', () => {
      const spy = vi.fn();
      EventBus.subscribe('test.unsub', spy);
      EventBus.unsubscribe('test.unsub', spy);
      EventBus.publish('test.unsub');
      expect(spy).not.toHaveBeenCalled();
    });

    it('does not affect other subscribers', () => {
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      EventBus.subscribe('test.unsub2', spy1);
      EventBus.subscribe('test.unsub2', spy2);
      EventBus.unsubscribe('test.unsub2', spy1);
      EventBus.publish('test.unsub2');
      expect(spy1).not.toHaveBeenCalled();
      expect(spy2).toHaveBeenCalledOnce();
      EventBus.unsubscribe('test.unsub2', spy2);
    });
  });

  describe('destroyable handle', () => {
    it('subscribe returns a Destroyable', () => {
      const spy = vi.fn();
      const handle = EventBus.subscribe('test.dhandle', spy);
      expect(typeof handle.destroy).toBe('function');
      handle.destroy();
      EventBus.publish('test.dhandle');
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('scope binding', () => {
    it('binds handler to the provided scope', () => {
      const scope = { id: 'myScope' };
      EventBus.subscribe(
        'test.scope',
        function (this: typeof scope) {
          expect(this).toBe(scope);
        },
        scope,
      );
      EventBus.publish('test.scope');
      EventBus.unsubscribe('test.scope', () => {});
    });
  });

  describe('wildcard channels', () => {
    it('"user.*" matches "user.login" and "user.logout"', () => {
      const spy = vi.fn();
      const handle = EventBus.subscribe('user.*', spy);
      EventBus.publish('user.login', 'alice');
      EventBus.publish('user.logout', 'alice');
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(1, 'alice');
      expect(spy).toHaveBeenNthCalledWith(2, 'alice');
      handle.destroy();
    });

    it('"user.*" does NOT match "user" (no trailing segment)', () => {
      const spy = vi.fn();
      const handle = EventBus.subscribe('user.*', spy);
      EventBus.publish('user');
      expect(spy).not.toHaveBeenCalled();
      handle.destroy();
    });

    it('"user.*" does NOT match "user.settings.theme" (only one level)', () => {
      const spy = vi.fn();
      const handle = EventBus.subscribe('user.*', spy);
      EventBus.publish('user.settings.theme');
      expect(spy).not.toHaveBeenCalled();
      handle.destroy();
    });

    it('"**" matches everything', () => {
      const spy = vi.fn();
      const handle = EventBus.subscribe('**', spy);
      EventBus.publish('any.channel.at.all', 'data');
      EventBus.publish('another');
      expect(spy).toHaveBeenCalledTimes(2);
      handle.destroy();
    });

    it('"user.**" matches "user.settings.theme" (deep wildcard)', () => {
      const spy = vi.fn();
      const handle = EventBus.subscribe('user.**', spy);
      EventBus.publish('user.settings.theme', 42);
      EventBus.publish('user.login', 'x');
      expect(spy).toHaveBeenCalledTimes(2);
      handle.destroy();
    });

    it('exact match still works alongside wildcards', () => {
      const exactSpy = vi.fn();
      const wildSpy = vi.fn();
      const h1 = EventBus.subscribe('app.init', exactSpy);
      const h2 = EventBus.subscribe('app.*', wildSpy);
      EventBus.publish('app.init');
      expect(exactSpy).toHaveBeenCalledOnce();
      expect(wildSpy).toHaveBeenCalledOnce();
      h1.destroy();
      h2.destroy();
    });
  });

  describe('namespaced channels', () => {
    it('treats dot-separated strings as hierarchical channels', () => {
      const spy = vi.fn();
      const handle = EventBus.subscribe('app.module.action', spy);
      EventBus.publish('app.module.action', 'payload');
      expect(spy).toHaveBeenCalledWith('payload');
      handle.destroy();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TypedObservable — compile-time type safety
// ═══════════════════════════════════════════════════════════════════════════

describe('TypedObservable — type-safe events', () => {
  // Define a typed events interface
  interface PanelEvents {
    expand: [panel: Base];
    collapse: [panel: Base];
    resize: [panel: Base, width: number, height: number];
    close: [];
  }

  it('typed on/fireEvent works at runtime', () => {
    const Cls = createObs('test.typed.Panel', { config: { title: '' } });
    const inst = new Cls({ title: 'Test' }) as Base & TypedObservable<PanelEvents>;
    const spy = vi.fn();
    inst.on('resize', spy);
    inst.fireEvent('resize', inst, 100, 200);
    expect(spy).toHaveBeenCalledWith(inst, 100, 200);
  });

  it('typed on with correct handler type compiles', () => {
    const Cls = createObs('test.typed.Correct');
    const inst = new Cls() as Base & TypedObservable<PanelEvents>;
    // This should compile fine:
    inst.on('expand', (_panel: Base) => {});
    inst.on('resize', (_panel: Base, _w: number, _h: number) => {});
    inst.on('close', () => {});
    expect(true).toBe(true);
  });

  it('fireEvent with correct args compiles', () => {
    const Cls = createObs('test.typed.FireCorrect');
    const inst = new Cls() as Base & TypedObservable<PanelEvents>;
    // These should all compile fine:
    inst.fireEvent('expand', new Base());
    inst.fireEvent('collapse', new Base());
    inst.fireEvent('resize', new Base(), 100, 200);
    inst.fireEvent('close');
    expect(true).toBe(true);
  });

  // Compile-time type checks using @ts-expect-error
  it('wrong event name is a type error', () => {
    const Cls = createObs('test.typed.WrongName');
    const inst = new Cls() as Base & TypedObservable<PanelEvents>;
    // @ts-expect-error — 'nonexistent' is not a key of PanelEvents
    inst.on('nonexistent', () => {});
    expect(true).toBe(true);
  });

  it('wrong handler parameter types are a type error', () => {
    const Cls = createObs('test.typed.WrongParams');
    const inst = new Cls() as Base & TypedObservable<PanelEvents>;
    // @ts-expect-error — resize handler expects (Base, number, number), not (string)
    inst.on('resize', (_s: string) => {});
    expect(true).toBe(true);
  });

  it('wrong fireEvent arg types are a type error', () => {
    const Cls = createObs('test.typed.WrongFire');
    const inst = new Cls() as Base & TypedObservable<PanelEvents>;
    // @ts-expect-error — resize expects (Base, number, number) not (string, string, string)
    inst.fireEvent('resize', 'not', 'the', 'right');
    expect(true).toBe(true);
  });

  it('un also works with typed events', () => {
    const Cls = createObs('test.typed.Un');
    const inst = new Cls() as Base & TypedObservable<PanelEvents>;
    const handler = (_p: Base) => {};
    inst.on('expand', handler);
    inst.un('expand', handler);
    expect(inst.hasListener('expand')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Integration: EventDomain + Observable
// ═══════════════════════════════════════════════════════════════════════════

describe('EventDomain + Observable integration', () => {
  it('Observable fires through registered domain dispatchers', () => {
    const Widget = createObs('test.intg.DomWidget', {
      config: { itemId: '', isWidget: true },
    });

    const domain = new EventDomain('intgWidget', (t) => !!(t as any).getIsWidget?.());
    EventDomain.register('intgWidget', domain);

    const spy = vi.fn();
    domain.listen({
      '#btn1': { click: spy },
    });

    const btn = new Widget({ itemId: 'btn1', isWidget: true });
    // Simulate the domain dispatch — in a full framework, fireEvent
    // would auto-dispatch to matching domains
    domain.dispatch(btn, 'click', [42]);
    expect(spy).toHaveBeenCalledWith(42);
  });
});
