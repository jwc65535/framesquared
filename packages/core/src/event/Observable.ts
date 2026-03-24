/**
 * @ext-ts/core – Observable mixin
 *
 * The event system backbone.  Mix into any Base subclass to gain full
 * event management: `on`, `un`, `fireEvent`, suspend/resume, relay,
 * managed listeners, and more.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import { Base } from '../class/Base.js';
import { define } from '../class/ClassManager.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ListenerOptions {
  /** Fire only once, then auto-remove. */
  single?: boolean;
  /** Delay in ms before the handler is called. */
  delay?: number;
  /** Buffer (debounce) in ms — resets on each fire. */
  buffer?: number;
  /** Higher priority fires first. Default is 0. */
  priority?: number;
  /** Extra arguments prepended to handler call. */
  args?: unknown[];
  /** Insert at front within the same priority band. */
  prepend?: boolean;
  /** Return a Destroyable handle from `on()`. */
  destroyable?: boolean;
}

export interface Destroyable {
  destroy(): void;
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface ListenerEntry {
  fn: Function;
  scope: object | undefined;
  priority: number;
  single: boolean;
  delay: number;
  buffer: number;
  args: unknown[] | undefined;
  /** For buffered listeners — active debounce timer. */
  bufferTimerId?: ReturnType<typeof setTimeout>;
}

interface QueuedEvent {
  eventName: string;
  args: unknown[];
}

interface ManagedListenerEntry {
  target: any;
  eventName: string;
  fn: Function;
  scope: object | undefined;
}

// ---------------------------------------------------------------------------
// Per-instance state (WeakMap based — no property pollution)
// ---------------------------------------------------------------------------

interface ObservableState {
  /** eventName → sorted listener array */
  listeners: Map<string, ListenerEntry[]>;
  /** Suspend depth counter */
  suspendCount: number;
  /** Whether to queue events during suspension */
  queueSuspended: boolean;
  /** Queued events during suspension */
  eventQueue: QueuedEvent[];
  /** Managed listener records for auto-cleanup */
  managedListeners: ManagedListenerEntry[];
}

const stateMap = new WeakMap<Base, ObservableState>();

function getState(inst: Base): ObservableState {
  let state = stateMap.get(inst);
  if (!state) {
    state = {
      listeners: new Map(),
      suspendCount: 0,
      queueSuspended: false,
      eventQueue: [],
      managedListeners: [],
    };
    stateMap.set(inst, state);
  }
  return state;
}

function getListeners(state: ObservableState, eventName: string): ListenerEntry[] {
  let list = state.listeners.get(eventName);
  if (!list) {
    list = [];
    state.listeners.set(eventName, list);
  }
  return list;
}

/**
 * Insert a listener entry into the sorted array.
 * Entries are sorted by priority descending.
 * If prepend=true, insert before existing entries with the same priority.
 */
function insertListener(
  list: ListenerEntry[],
  entry: ListenerEntry,
  prepend: boolean,
): void {
  const p = entry.priority;
  let idx: number;

  if (prepend) {
    // Find first entry with priority < p (insert before)
    idx = list.findIndex((e) => e.priority < p);
  } else {
    // Find first entry with priority strictly less than p
    // but after all existing entries with same priority
    idx = list.findIndex((e) => e.priority < p);
  }

  if (idx === -1) {
    if (prepend) {
      // Insert before entries with same priority
      idx = list.findIndex((e) => e.priority <= p);
      if (idx === -1) list.push(entry);
      else list.splice(idx, 0, entry);
    } else {
      list.push(entry);
    }
  } else {
    if (prepend) {
      // Walk backwards to find the start of this priority band
      while (idx > 0 && list[idx - 1].priority === p) idx--;
      list.splice(idx, 0, entry);
    } else {
      list.splice(idx, 0, entry);
    }
  }
}

// ---------------------------------------------------------------------------
// The actual fire logic
// ---------------------------------------------------------------------------

function doFireEvent(inst: Base, eventName: string, args: unknown[]): boolean {
  const state = getState(inst);

  // Check suspension
  if (state.suspendCount > 0) {
    if (state.queueSuspended) {
      state.eventQueue.push({ eventName, args });
    }
    return true;
  }

  const list = state.listeners.get(eventName);
  if (!list || list.length === 0) return true;

  // Snapshot for safe iteration (listeners may remove themselves)
  const snapshot = [...list];
  let cancelled = false;

  for (const entry of snapshot) {
    // Check if entry was removed during iteration
    if (!list.includes(entry)) continue;

    const callArgs = entry.args ? [...entry.args, ...args] : args;
    const scope = entry.scope;

    // --- delay ---
    if (entry.delay > 0) {
      setTimeout(() => entry.fn.apply(scope, callArgs), entry.delay);
      if (entry.single) removeEntry(list, entry);
      continue;
    }

    // --- buffer ---
    if (entry.buffer > 0) {
      if (entry.bufferTimerId !== undefined) {
        clearTimeout(entry.bufferTimerId);
      }
      entry.bufferTimerId = setTimeout(() => {
        entry.bufferTimerId = undefined;
        entry.fn.apply(scope, callArgs);
      }, entry.buffer);
      if (entry.single) removeEntry(list, entry);
      continue;
    }

    // --- immediate ---
    const result = entry.fn.apply(scope, callArgs);

    if (entry.single) {
      removeEntry(list, entry);
    }

    if (result === false) {
      cancelled = true;
    }
  }

  return !cancelled;
}

function removeEntry(list: ListenerEntry[], entry: ListenerEntry): void {
  const idx = list.indexOf(entry);
  if (idx !== -1) list.splice(idx, 1);
}

function findEntry(
  list: ListenerEntry[],
  fn: Function,
  scope: object | undefined,
): ListenerEntry | undefined {
  return list.find(
    (e) => e.fn === fn && e.scope === scope,
  );
}

// ---------------------------------------------------------------------------
// Observable mixin definition
// ---------------------------------------------------------------------------

export const Observable: typeof Base = define('Ext.mixin.Observable', {
  // ----- on (with overloads) -----
  on(
    this: Base,
    eventNameOrMap: string | Record<string, Function>,
    handlerOrScope?: Function | object,
    scope?: object,
    options?: ListenerOptions,
  ): Destroyable | void {
    // Map overload: on({ click: fn, hover: fn }, scope)
    if (typeof eventNameOrMap === 'object' && eventNameOrMap !== null) {
      const map = eventNameOrMap as Record<string, Function>;
      const mapScope = handlerOrScope as object | undefined;
      for (const [evName, handler] of Object.entries(map)) {
        (this as any).on(evName, handler, mapScope);
      }
      return;
    }

    const eventName = eventNameOrMap as string;
    const handler = handlerOrScope as Function;
    const opts = options ?? {};
    const state = getState(this);
    const list = getListeners(state, eventName);

    const entry: ListenerEntry = {
      fn: handler,
      scope: scope,
      priority: opts.priority ?? 0,
      single: opts.single ?? false,
      delay: opts.delay ?? 0,
      buffer: opts.buffer ?? 0,
      args: opts.args,
    };

    insertListener(list, entry, opts.prepend ?? false);

    if (opts.destroyable) {
      return {
        destroy: () => {
          removeEntry(list, entry);
        },
      };
    }
  },

  // ----- un -----
  un(this: Base, eventName: string, handler: Function, scope?: object): void {
    const state = getState(this);
    const list = state.listeners.get(eventName);
    if (!list) return;
    const entry = findEntry(list, handler, scope);
    if (entry) removeEntry(list, entry);
  },

  // ----- aliases -----
  addListener(
    this: any,
    ...args: unknown[]
  ): Destroyable | void {
    return this.on(...args);
  },

  removeListener(this: any, ...args: unknown[]): void {
    return this.un(...args);
  },

  // ----- fireEvent -----
  fireEvent(this: Base, eventName: string, ...args: unknown[]): boolean {
    return doFireEvent(this, eventName, args);
  },

  // ----- fireEventArgs -----
  fireEventArgs(this: Base, eventName: string, args: unknown[]): boolean {
    return doFireEvent(this, eventName, args);
  },

  // ----- fireEventedAction -----
  fireEventedAction(
    this: Base,
    eventName: string,
    args: unknown[],
    beforeFn: Function,
    afterFn: Function,
    scope?: object,
  ): void {
    // 1. Fire "before" + eventName
    const beforeResult = doFireEvent(this, `before${eventName}`, args);
    if (!beforeResult) return; // cancelled

    // 2. Call beforeFn
    beforeFn.apply(scope, args);

    // 3. Fire eventName
    doFireEvent(this, eventName, args);

    // 4. Call afterFn
    afterFn.apply(scope, args);
  },

  // ----- suspendEvents -----
  suspendEvents(this: Base, queueSuspended?: boolean): void {
    const state = getState(this);
    state.suspendCount++;
    if (queueSuspended) {
      state.queueSuspended = true;
    }
  },

  // ----- resumeEvents -----
  resumeEvents(this: Base, discardQueue?: boolean): void {
    const state = getState(this);
    if (state.suspendCount > 0) {
      state.suspendCount--;
    }

    if (state.suspendCount === 0) {
      if (!discardQueue && state.queueSuspended) {
        // Replay queued events
        const queue = state.eventQueue.splice(0);
        state.queueSuspended = false;
        for (const qe of queue) {
          doFireEvent(this, qe.eventName, qe.args);
        }
      } else {
        state.eventQueue.length = 0;
        state.queueSuspended = false;
      }
    }
  },

  // ----- isSuspended -----
  isSuspended(this: Base): boolean {
    return getState(this).suspendCount > 0;
  },

  // ----- hasListener -----
  hasListener(this: Base, eventName: string): boolean {
    const state = stateMap.get(this);
    if (!state) return false;
    const list = state.listeners.get(eventName);
    return !!list && list.length > 0;
  },

  // ----- clearListeners -----
  clearListeners(this: Base): void {
    const state = stateMap.get(this);
    if (state) {
      state.listeners.clear();
      state.eventQueue.length = 0;
    }
  },

  // ----- relayEvents -----
  relayEvents(
    this: Base,
    origin: Base,
    events: string[],
    prefix?: string,
  ): Destroyable {
    const handlers: { eventName: string; fn: Function }[] = [];
    const self = this;

    for (const eventName of events) {
      const targetName = (prefix ?? '') + eventName;
      const fn = (...args: unknown[]) => {
        doFireEvent(self, targetName, args);
      };
      (origin as any).on(eventName, fn);
      handlers.push({ eventName, fn });
    }

    return {
      destroy() {
        for (const { eventName, fn } of handlers) {
          (origin as any).un(eventName, fn);
        }
        handlers.length = 0;
      },
    };
  },

  // ----- mon (managed listener) -----
  mon(
    this: Base,
    target: Base,
    eventName: string,
    handler: Function,
    scope?: object,
  ): void {
    const state = getState(this);
    (target as any).on(eventName, handler, scope);
    state.managedListeners.push({ target, eventName, fn: handler, scope });
  },

  // ----- mun (remove managed listener) -----
  mun(
    this: Base,
    target: Base,
    eventName: string,
    handler: Function,
  ): void {
    const state = getState(this);
    (target as any).un(eventName, handler);
    state.managedListeners = state.managedListeners.filter(
      (ml) => !(ml.target === target && ml.eventName === eventName && ml.fn === handler),
    );
  },
});

// ---------------------------------------------------------------------------
// Destroy hook — install via $destroyHooks for composability with other mixins
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Destroy hook — lazily installed on first on() / mon() call per instance
// ---------------------------------------------------------------------------

const hookedInstances = new WeakSet<Base>();

// We patch Observable's `on` and `mon` to lazily install the $destroyHooks
// callback the first time any listener is registered on an instance.

const obsProto = Observable.prototype as any;

function installDestroyHook(inst: Base): void {
  if (hookedInstances.has(inst)) return;
  hookedInstances.add(inst);
  inst.$destroyHooks.push(() => {
    const state = stateMap.get(inst);
    if (state) {
      state.listeners.clear();
      state.eventQueue.length = 0;
      for (const ml of state.managedListeners) {
        (ml.target as any).un(ml.eventName, ml.fn, ml.scope);
      }
      state.managedListeners.length = 0;
    }
  });
}

const origOn = obsProto.on;
obsProto.on = function (
  this: Base,
  ...args: any[]
): Destroyable | void {
  installDestroyHook(this);
  return origOn.apply(this, args);
};

const origMon = obsProto.mon;
obsProto.mon = function (
  this: Base,
  ...args: any[]
): void {
  installDestroyHook(this);
  return origMon.apply(this, args);
};
