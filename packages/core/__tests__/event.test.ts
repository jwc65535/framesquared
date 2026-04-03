import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { define } from '../src/class/index.js';
import { ExtEvent } from '../src/event/Event.js';
import { Observable } from '../src/event/Observable.js';

// Helper: create a fresh Observable class for each test block
function createObservableClass(name: string, extra: Record<string, unknown> = {}) {
  return define(name, { mixins: [Observable], ...extra });
}

// ═══════════════════════════════════════════════════════════════════════════
// ExtEvent
// ═══════════════════════════════════════════════════════════════════════════

describe('ExtEvent', () => {
  it('stores eventName and source', () => {
    const source = {};
    const e = new ExtEvent('click', source);
    expect(e.eventName).toBe('click');
    expect(e.source).toBe(source);
  });

  it('has a timestamp', () => {
    const e = new ExtEvent('test', {});
    expect(typeof e.timestamp).toBe('number');
    expect(e.timestamp).toBeGreaterThan(0);
  });

  it('defaultPrevented is false initially', () => {
    const e = new ExtEvent('test', {});
    expect(e.defaultPrevented).toBe(false);
  });

  it('preventDefault() sets defaultPrevented', () => {
    const e = new ExtEvent('test', {});
    e.preventDefault();
    expect(e.defaultPrevented).toBe(true);
  });

  it('propagationStopped is false initially', () => {
    const e = new ExtEvent('test', {});
    expect(e.propagationStopped).toBe(false);
  });

  it('stopPropagation() sets propagationStopped', () => {
    const e = new ExtEvent('test', {});
    e.stopPropagation();
    expect(e.propagationStopped).toBe(true);
  });

  it('stopEvent() sets both flags', () => {
    const e = new ExtEvent('test', {});
    e.stopEvent();
    expect(e.defaultPrevented).toBe(true);
    expect(e.propagationStopped).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Basic on / fireEvent / un
// ═══════════════════════════════════════════════════════════════════════════

describe('Basic on / fireEvent / un', () => {
  it('fires a listener when event is triggered', () => {
    const Cls = createObservableClass('test.ev.Basic');
    const inst = new Cls();
    const spy = vi.fn();
    inst.on('click', spy);
    inst.fireEvent('click');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('passes arguments to listeners', () => {
    const Cls = createObservableClass('test.ev.Args');
    const inst = new Cls();
    const spy = vi.fn();
    inst.on('data', spy);
    inst.fireEvent('data', 1, 'two', { three: 3 });
    expect(spy).toHaveBeenCalledWith(1, 'two', { three: 3 });
  });

  it('un removes a specific listener', () => {
    const Cls = createObservableClass('test.ev.Un');
    const inst = new Cls();
    const spy = vi.fn();
    inst.on('click', spy);
    inst.un('click', spy);
    inst.fireEvent('click');
    expect(spy).not.toHaveBeenCalled();
  });

  it('multiple listeners on same event all fire', () => {
    const Cls = createObservableClass('test.ev.Multi');
    const inst = new Cls();
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    inst.on('change', spy1);
    inst.on('change', spy2);
    inst.fireEvent('change');
    expect(spy1).toHaveBeenCalledOnce();
    expect(spy2).toHaveBeenCalledOnce();
  });

  it('un only removes the specific handler, not others', () => {
    const Cls = createObservableClass('test.ev.UnSpecific');
    const inst = new Cls();
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    inst.on('change', spy1);
    inst.on('change', spy2);
    inst.un('change', spy1);
    inst.fireEvent('change');
    expect(spy1).not.toHaveBeenCalled();
    expect(spy2).toHaveBeenCalledOnce();
  });

  it('event names are case-sensitive', () => {
    const Cls = createObservableClass('test.ev.Case');
    const inst = new Cls();
    const spy = vi.fn();
    inst.on('Click', spy);
    inst.fireEvent('click');
    expect(spy).not.toHaveBeenCalled();
    inst.fireEvent('Click');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('firing unknown event does not throw', () => {
    const Cls = createObservableClass('test.ev.Unknown');
    const inst = new Cls();
    expect(() => inst.fireEvent('nonexistent')).not.toThrow();
  });

  it('addListener is an alias for on', () => {
    const Cls = createObservableClass('test.ev.Alias');
    const inst = new Cls();
    const spy = vi.fn();
    inst.addListener('test', spy);
    inst.fireEvent('test');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('removeListener is an alias for un', () => {
    const Cls = createObservableClass('test.ev.AliasRm');
    const inst = new Cls();
    const spy = vi.fn();
    inst.on('test', spy);
    inst.removeListener('test', spy);
    inst.fireEvent('test');
    expect(spy).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Scope binding
// ═══════════════════════════════════════════════════════════════════════════

describe('Scope binding', () => {
  it('binds handler to provided scope', () => {
    const Cls = createObservableClass('test.ev.Scope');
    const inst = new Cls();
    const scope = { name: 'ctx' };
    inst.on(
      'test',
      function (this: typeof scope) {
        expect(this).toBe(scope);
      },
      scope,
    );
    inst.fireEvent('test');
  });

  it('un matches on scope as well', () => {
    const Cls = createObservableClass('test.ev.ScopeUn');
    const inst = new Cls();
    const spy = vi.fn();
    const scope1 = {};
    const scope2 = {};
    inst.on('test', spy, scope1);
    inst.on('test', spy, scope2);
    inst.un('test', spy, scope1);
    inst.fireEvent('test');
    // Only scope2 listener should fire
    expect(spy).toHaveBeenCalledOnce();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// options.single
// ═══════════════════════════════════════════════════════════════════════════

describe('options.single', () => {
  it('fires only once and then auto-removes', () => {
    const Cls = createObservableClass('test.ev.Single');
    const inst = new Cls();
    const spy = vi.fn();
    inst.on('click', spy, undefined, { single: true });
    inst.fireEvent('click');
    inst.fireEvent('click');
    inst.fireEvent('click');
    expect(spy).toHaveBeenCalledOnce();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// options.delay and options.buffer (fake timers)
// ═══════════════════════════════════════════════════════════════════════════

describe('options.delay', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('delays handler execution', () => {
    const Cls = createObservableClass('test.ev.Delay');
    const inst = new Cls();
    const spy = vi.fn();
    inst.on('tick', spy, undefined, { delay: 100 });
    inst.fireEvent('tick');
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('each fire schedules its own independent delay', () => {
    const Cls = createObservableClass('test.ev.DelayMulti');
    const inst = new Cls();
    const spy = vi.fn();
    inst.on('tick', spy, undefined, { delay: 50 });
    inst.fireEvent('tick');
    inst.fireEvent('tick');
    vi.advanceTimersByTime(50);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe('options.buffer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('debounces rapid fires', () => {
    const Cls = createObservableClass('test.ev.Buffer');
    const inst = new Cls();
    const spy = vi.fn();
    inst.on('resize', spy, undefined, { buffer: 100 });
    inst.fireEvent('resize', 'a');
    inst.fireEvent('resize', 'b');
    inst.fireEvent('resize', 'c');
    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith('c');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// options.priority
// ═══════════════════════════════════════════════════════════════════════════

describe('options.priority', () => {
  it('higher priority fires first', () => {
    const Cls = createObservableClass('test.ev.Priority');
    const inst = new Cls();
    const order: string[] = [];
    inst.on('test', () => order.push('default')); // priority 0
    inst.on('test', () => order.push('high'), undefined, { priority: 100 });
    inst.on('test', () => order.push('low'), undefined, { priority: -50 });
    inst.fireEvent('test');
    expect(order).toEqual(['high', 'default', 'low']);
  });

  it('same priority preserves registration order', () => {
    const Cls = createObservableClass('test.ev.PriOrder');
    const inst = new Cls();
    const order: string[] = [];
    inst.on('test', () => order.push('a'), undefined, { priority: 10 });
    inst.on('test', () => order.push('b'), undefined, { priority: 10 });
    inst.fireEvent('test');
    expect(order).toEqual(['a', 'b']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Event cancellation (return false)
// ═══════════════════════════════════════════════════════════════════════════

describe('Event cancellation', () => {
  it('fireEvent returns true when no listener cancels', () => {
    const Cls = createObservableClass('test.ev.NoCancel');
    const inst = new Cls();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    inst.on('test', () => {});
    expect(inst.fireEvent('test')).toBe(true);
  });

  it('fireEvent returns false when a listener returns false', () => {
    const Cls = createObservableClass('test.ev.Cancel');
    const inst = new Cls();
    inst.on('test', () => false);
    expect(inst.fireEvent('test')).toBe(false);
  });

  it('subsequent listeners still fire after one returns false', () => {
    const Cls = createObservableClass('test.ev.CancelCont');
    const inst = new Cls();
    const spy = vi.fn();
    inst.on('test', () => false);
    inst.on('test', spy);
    inst.fireEvent('test');
    expect(spy).toHaveBeenCalledOnce();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// fireEventArgs
// ═══════════════════════════════════════════════════════════════════════════

describe('fireEventArgs', () => {
  it('passes args array to listeners', () => {
    const Cls = createObservableClass('test.ev.FEA');
    const inst = new Cls();
    const spy = vi.fn();
    inst.on('data', spy);
    inst.fireEventArgs('data', [1, 2, 3]);
    expect(spy).toHaveBeenCalledWith(1, 2, 3);
  });

  it('returns boolean like fireEvent', () => {
    const Cls = createObservableClass('test.ev.FEABool');
    const inst = new Cls();
    inst.on('test', () => false);
    expect(inst.fireEventArgs('test', [])).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// suspendEvents / resumeEvents
// ═══════════════════════════════════════════════════════════════════════════

describe('suspendEvents / resumeEvents', () => {
  it('suspendEvents stops listeners from firing', () => {
    const Cls = createObservableClass('test.ev.Suspend');
    const inst = new Cls();
    const spy = vi.fn();
    inst.on('test', spy);
    inst.suspendEvents();
    inst.fireEvent('test');
    expect(spy).not.toHaveBeenCalled();
  });

  it('resumeEvents re-enables firing', () => {
    const Cls = createObservableClass('test.ev.Resume');
    const inst = new Cls();
    const spy = vi.fn();
    inst.on('test', spy);
    inst.suspendEvents();
    inst.fireEvent('test');
    inst.resumeEvents();
    inst.fireEvent('test');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('queueSuspended=true replays queued events on resume', () => {
    const Cls = createObservableClass('test.ev.Queue');
    const inst = new Cls();
    const spy = vi.fn();
    inst.on('test', spy);
    inst.suspendEvents(true);
    inst.fireEvent('test', 'a');
    inst.fireEvent('test', 'b');
    expect(spy).not.toHaveBeenCalled();
    inst.resumeEvents();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(1, 'a');
    expect(spy).toHaveBeenNthCalledWith(2, 'b');
  });

  it('discardQueue=true discards queued events', () => {
    const Cls = createObservableClass('test.ev.Discard');
    const inst = new Cls();
    const spy = vi.fn();
    inst.on('test', spy);
    inst.suspendEvents(true);
    inst.fireEvent('test');
    inst.resumeEvents(true);
    expect(spy).not.toHaveBeenCalled();
  });

  it('isSuspended returns correct state', () => {
    const Cls = createObservableClass('test.ev.IsSusp');
    const inst = new Cls();
    expect(inst.isSuspended()).toBe(false);
    inst.suspendEvents();
    expect(inst.isSuspended()).toBe(true);
    inst.resumeEvents();
    expect(inst.isSuspended()).toBe(false);
  });

  it('nested suspend requires matching resume count', () => {
    const Cls = createObservableClass('test.ev.Nested');
    const inst = new Cls();
    const spy = vi.fn();
    inst.on('test', spy);
    inst.suspendEvents();
    inst.suspendEvents();
    inst.resumeEvents();
    inst.fireEvent('test');
    expect(spy).not.toHaveBeenCalled();
    inst.resumeEvents();
    inst.fireEvent('test');
    expect(spy).toHaveBeenCalledOnce();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// hasListener / clearListeners
// ═══════════════════════════════════════════════════════════════════════════

describe('hasListener / clearListeners', () => {
  it('hasListener returns true when listeners exist', () => {
    const Cls = createObservableClass('test.ev.HasL');
    const inst = new Cls();
    expect(inst.hasListener('click')).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    inst.on('click', () => {});
    expect(inst.hasListener('click')).toBe(true);
  });

  it('hasListener returns false after un', () => {
    const Cls = createObservableClass('test.ev.HasLUn');
    const inst = new Cls();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const fn = () => {};
    inst.on('click', fn);
    inst.un('click', fn);
    expect(inst.hasListener('click')).toBe(false);
  });

  it('clearListeners removes all listeners on all events', () => {
    const Cls = createObservableClass('test.ev.Clear');
    const inst = new Cls();
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    inst.on('a', spy1);
    inst.on('b', spy2);
    inst.clearListeners();
    inst.fireEvent('a');
    inst.fireEvent('b');
    expect(spy1).not.toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();
    expect(inst.hasListener('a')).toBe(false);
    expect(inst.hasListener('b')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Listener map overload
// ═══════════════════════════════════════════════════════════════════════════

describe('Listener map overload (on with object)', () => {
  it('accepts a map of eventName → handler', () => {
    const Cls = createObservableClass('test.ev.Map');
    const inst = new Cls();
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    inst.on({ click: spy1, hover: spy2 });
    inst.fireEvent('click');
    inst.fireEvent('hover');
    expect(spy1).toHaveBeenCalledOnce();
    expect(spy2).toHaveBeenCalledOnce();
  });

  it('applies scope to all handlers in the map', () => {
    const Cls = createObservableClass('test.ev.MapScope');
    const inst = new Cls();
    const scope = { id: 'scope' };
    inst.on(
      {
        click(this: typeof scope) {
          expect(this).toBe(scope);
        },
        hover(this: typeof scope) {
          expect(this).toBe(scope);
        },
      },
      scope,
    );
    inst.fireEvent('click');
    inst.fireEvent('hover');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// relayEvents
// ═══════════════════════════════════════════════════════════════════════════

describe('relayEvents', () => {
  it('re-fires events from origin on this', () => {
    const Cls = createObservableClass('test.ev.Relay');
    const origin = new Cls();
    const relay = new Cls();
    const spy = vi.fn();
    relay.on('click', spy);
    relay.relayEvents(origin, ['click']);
    origin.fireEvent('click', 'data');
    expect(spy).toHaveBeenCalledWith('data');
  });

  it('applies prefix to relayed event names', () => {
    const Cls = createObservableClass('test.ev.RelayPrefix');
    const origin = new Cls();
    const relay = new Cls();
    const spy = vi.fn();
    relay.on('child.click', spy);
    relay.relayEvents(origin, ['click'], 'child.');
    origin.fireEvent('click', 42);
    expect(spy).toHaveBeenCalledWith(42);
  });

  it('returns a destroyable that stops relaying', () => {
    const Cls = createObservableClass('test.ev.RelayDestroy');
    const origin = new Cls();
    const relay = new Cls();
    const spy = vi.fn();
    relay.on('click', spy);
    const handle = relay.relayEvents(origin, ['click']);
    handle.destroy();
    origin.fireEvent('click');
    expect(spy).not.toHaveBeenCalled();
  });

  it('relays multiple events', () => {
    const Cls = createObservableClass('test.ev.RelayMulti');
    const origin = new Cls();
    const relay = new Cls();
    const clickSpy = vi.fn();
    const hoverSpy = vi.fn();
    relay.on('click', clickSpy);
    relay.on('hover', hoverSpy);
    relay.relayEvents(origin, ['click', 'hover']);
    origin.fireEvent('click');
    origin.fireEvent('hover');
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(hoverSpy).toHaveBeenCalledOnce();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Managed listeners (mon / mun)
// ═══════════════════════════════════════════════════════════════════════════

describe('Managed listeners (mon / mun)', () => {
  it('mon registers listener on the target', () => {
    const Cls = createObservableClass('test.ev.Mon');
    const target = new Cls();
    const listener = new Cls();
    const spy = vi.fn();
    listener.mon(target, 'click', spy);
    target.fireEvent('click');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('mun removes the managed listener', () => {
    const Cls = createObservableClass('test.ev.Mun');
    const target = new Cls();
    const listener = new Cls();
    const spy = vi.fn();
    listener.mon(target, 'click', spy);
    listener.mun(target, 'click', spy);
    target.fireEvent('click');
    expect(spy).not.toHaveBeenCalled();
  });

  it('destroying the listener auto-removes all managed listeners', () => {
    const Cls = createObservableClass('test.ev.MonDestroy');
    const target = new Cls();
    const listener = new Cls();
    const spy = vi.fn();
    listener.mon(target, 'click', spy);
    listener.destroy();
    target.fireEvent('click');
    expect(spy).not.toHaveBeenCalled();
  });

  it('multiple managed listeners are all cleaned up', () => {
    const Cls = createObservableClass('test.ev.MonMulti');
    const t1 = new Cls();
    const t2 = new Cls();
    const listener = new Cls();
    const s1 = vi.fn();
    const s2 = vi.fn();
    listener.mon(t1, 'a', s1);
    listener.mon(t2, 'b', s2);
    listener.destroy();
    t1.fireEvent('a');
    t2.fireEvent('b');
    expect(s1).not.toHaveBeenCalled();
    expect(s2).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// options.destroyable
// ═══════════════════════════════════════════════════════════════════════════

describe('options.destroyable', () => {
  it('returns a Destroyable handle', () => {
    const Cls = createObservableClass('test.ev.Dable');
    const inst = new Cls();
    const spy = vi.fn();
    const handle = inst.on('test', spy, undefined, { destroyable: true });
    expect(handle).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(typeof handle!.destroy).toBe('function');
  });

  it('destroying the handle removes the listener', () => {
    const Cls = createObservableClass('test.ev.DableRm');
    const inst = new Cls();
    const spy = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const handle = inst.on('test', spy, undefined, { destroyable: true })!;
    handle.destroy();
    inst.fireEvent('test');
    expect(spy).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// options.prepend
// ═══════════════════════════════════════════════════════════════════════════

describe('options.prepend', () => {
  it('prepend inserts at the front within the same priority', () => {
    const Cls = createObservableClass('test.ev.Prepend');
    const inst = new Cls();
    const order: string[] = [];
    inst.on('test', () => order.push('first'));
    inst.on('test', () => order.push('prepended'), undefined, { prepend: true });
    inst.fireEvent('test');
    expect(order).toEqual(['prepended', 'first']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// options.args
// ═══════════════════════════════════════════════════════════════════════════

describe('options.args', () => {
  it('prepends extra args to the handler call', () => {
    const Cls = createObservableClass('test.ev.ExtraArgs');
    const inst = new Cls();
    const spy = vi.fn();
    inst.on('test', spy, undefined, { args: ['extra1', 'extra2'] });
    inst.fireEvent('test', 'event-arg');
    expect(spy).toHaveBeenCalledWith('extra1', 'extra2', 'event-arg');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// fireEventedAction
// ═══════════════════════════════════════════════════════════════════════════

describe('fireEventedAction', () => {
  it('fires "before" + eventName → beforeFn → eventName → afterFn', () => {
    const Cls = createObservableClass('test.ev.FEAct');
    const inst = new Cls();
    const order: string[] = [];
    inst.on('beforesave', () => order.push('before-listener'));
    inst.on('save', () => order.push('save-listener'));
    inst.fireEventedAction(
      'save',
      ['data'],
      () => order.push('beforeFn'),
      () => order.push('afterFn'),
    );
    expect(order).toEqual(['before-listener', 'beforeFn', 'save-listener', 'afterFn']);
  });

  it('cancellation in before event skips everything', () => {
    const Cls = createObservableClass('test.ev.FEActCancel');
    const inst = new Cls();
    const beforeFn = vi.fn();
    const afterFn = vi.fn();
    const saveSpy = vi.fn();
    inst.on('beforesave', () => false);
    inst.on('save', saveSpy);
    inst.fireEventedAction('save', [], beforeFn, afterFn);
    expect(beforeFn).not.toHaveBeenCalled();
    expect(saveSpy).not.toHaveBeenCalled();
    expect(afterFn).not.toHaveBeenCalled();
  });

  it('passes args to both before event and main event', () => {
    const Cls = createObservableClass('test.ev.FEActArgs');
    const inst = new Cls();
    const beforeSpy = vi.fn();
    const mainSpy = vi.fn();
    inst.on('beforesave', beforeSpy);
    inst.on('save', mainSpy);
    inst.fireEventedAction(
      'save',
      ['payload'],
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
    );
    expect(beforeSpy).toHaveBeenCalledWith('payload');
    expect(mainSpy).toHaveBeenCalledWith('payload');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Removing listener during fireEvent iteration
// ═══════════════════════════════════════════════════════════════════════════

describe('Remove during iteration', () => {
  it('removing a listener during fire does not corrupt the iteration', () => {
    const Cls = createObservableClass('test.ev.IterSafe');
    const inst = new Cls();
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    const spy3 = vi.fn();
    const selfRemover = () => {
      spy2();
      inst.un('test', selfRemover);
    };
    inst.on('test', spy1);
    inst.on('test', selfRemover);
    inst.on('test', spy3);
    inst.fireEvent('test');
    expect(spy1).toHaveBeenCalledOnce();
    expect(spy2).toHaveBeenCalledOnce();
    expect(spy3).toHaveBeenCalledOnce();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Memory: destroy releases references
// ═══════════════════════════════════════════════════════════════════════════

describe('Memory cleanup on destroy', () => {
  it('clearListeners is called on destroy, releasing listener refs', () => {
    const Cls = createObservableClass('test.ev.MemDestroy');
    const inst = new Cls();
    const spy = vi.fn();
    inst.on('test', spy);
    inst.destroy();
    expect(inst.hasListener('test')).toBe(false);
    inst.fireEvent('test');
    expect(spy).not.toHaveBeenCalled();
  });

  it('WeakRef to handler is collectable after destroy', () => {
    const Cls = createObservableClass('test.ev.WeakRef');
    const inst = new Cls();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const handler: (() => void) | null = () => {};
    const _ref = new WeakRef(handler);
    inst.on('test', handler);
    inst.destroy();
    // We can't force GC, but we can verify the handler is no longer
    // held by the event system by checking hasListener
    expect(inst.hasListener('test')).toBe(false);
  });
});
