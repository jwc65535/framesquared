/**
 * @framesquared/core – EventDomain
 *
 * A domain groups events by category (e.g. 'component', 'store').
 * Controllers can use `domain.listen({ '#myButton': { click: handler } })`
 * to route events by selector.
 *
 * Selectors:
 *  - `#itemId`  — matches target.getItemId() === 'itemId'
 *  - `ClassName` — matches target.$className === 'ClassName'
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import type { Base } from '../class/Base.js';
import type { Destroyable } from './Destroyable.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Selector → { eventName → handler } */
export type ListenerConfig = Record<string, Record<string, Function>>;

interface RegisteredListener {
  selector: string;
  eventName: string;
  handler: Function;
}

// ---------------------------------------------------------------------------
// Static domain registry
// ---------------------------------------------------------------------------

const domainRegistry = new Map<string, EventDomain>();

// ---------------------------------------------------------------------------
// EventDomain
// ---------------------------------------------------------------------------

export class EventDomain {
  readonly name: string;
  private readonly matchFn: (target: Base) => boolean;
  private registeredListeners: RegisteredListener[] = [];

  constructor(name: string, matchFn: (target: Base) => boolean) {
    this.name = name;
    this.matchFn = matchFn;
  }

  // -- Static registry ----------------------------------------------------

  static register(name: string, domain: EventDomain): void {
    domainRegistry.set(name, domain);
  }

  static get(name: string): EventDomain | undefined {
    return domainRegistry.get(name);
  }

  // -- Instance API -------------------------------------------------------

  /**
   * Returns `true` if `target` belongs to this domain.
   */
  match(target: Base): boolean {
    return this.matchFn(target);
  }

  /**
   * Registers a controller-style listener config.
   *
   * ```ts
   * domain.listen({
   *   '#myButton': { click: handler },
   *   'MyApp.view.Panel': { collapse: handler },
   * });
   * ```
   *
   * Returns a {@link Destroyable} that removes all registered listeners.
   */
  listen(config: ListenerConfig): Destroyable {
    const entries: RegisteredListener[] = [];

    for (const [selector, events] of Object.entries(config)) {
      for (const [eventName, handler] of Object.entries(events)) {
        const entry: RegisteredListener = { selector, eventName, handler };
        entries.push(entry);
        this.registeredListeners.push(entry);
      }
    }

    return {
      destroy: () => {
        for (const entry of entries) {
          const idx = this.registeredListeners.indexOf(entry);
          if (idx !== -1) this.registeredListeners.splice(idx, 1);
        }
        entries.length = 0;
      },
    };
  }

  /**
   * Dispatches an event from `source` through this domain.
   * All registered listeners whose selector matches are called.
   */
  dispatch(source: Base, eventName: string, args: unknown[]): void {
    if (!this.match(source)) return;

    for (const entry of this.registeredListeners) {
      if (entry.eventName !== eventName) continue;
      if (!this.matchesSelector(source, entry.selector)) continue;
      entry.handler.apply(undefined, args);
    }
  }

  // -- Selector matching --------------------------------------------------

  private matchesSelector(target: Base, selector: string): boolean {
    // #itemId selector
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      const targetId =
        typeof (target as any).getItemId === 'function'
          ? (target as any).getItemId()
          : typeof (target as any).getId === 'function'
            ? (target as any).getId()
            : undefined;
      return targetId === id;
    }

    // ClassName selector
    return (target as any).$className === selector;
  }
}
