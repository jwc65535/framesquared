/**
 * @framesquared/core – TypedObservable
 *
 * A generic interface that overlays type-safe event signatures on top
 * of the runtime Observable mixin.
 *
 * Usage:
 * ```ts
 * interface PanelEvents {
 *   expand:   [panel: Panel];
 *   collapse: [panel: Panel];
 *   resize:   [panel: Panel, width: number, height: number];
 *   close:    [];
 * }
 *
 * class Panel extends Base implements TypedObservable<PanelEvents> { ... }
 *
 * const p = new Panel();
 * p.on('resize', (panel, width, height) => { ... }); // fully typed
 * p.fireEvent('resize', p, 100, 200);                // args checked
 * ```
 *
 * The interface only constrains the type checker — at runtime the
 * untyped Observable methods are used.
 */

import type { Destroyable } from './Destroyable.js';
import type { ListenerOptions } from './Observable.js';

/**
 * Constraint for event maps.  Every key must map to a tuple of handler
 * argument types.  Works with both `type` aliases and `interface`s.
 *
 * ```ts
 * interface MyEvents {
 *   click: [x: number, y: number];
 *   load:  [];
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EventMap {}

/**
 * Overlay interface that narrows Observable's string-based API to a
 * concrete event map `Events`.
 */
export interface TypedObservable<Events extends { [K in keyof Events]: unknown[] }> {
  on<E extends keyof Events & string>(
    eventName: E,
    handler: (...args: Events[E]) => false | undefined,
    scope?: object,
    options?: ListenerOptions,
  ): Destroyable | void;

  un<E extends keyof Events & string>(
    eventName: E,
    handler: (...args: Events[E]) => false | undefined,
    scope?: object,
  ): void;

  addListener<E extends keyof Events & string>(
    eventName: E,
    handler: (...args: Events[E]) => false | undefined,
    scope?: object,
    options?: ListenerOptions,
  ): Destroyable | void;

  removeListener<E extends keyof Events & string>(
    eventName: E,
    handler: (...args: Events[E]) => false | undefined,
    scope?: object,
  ): void;

  fireEvent<E extends keyof Events & string>(eventName: E, ...args: Events[E]): boolean;

  fireEventArgs<E extends keyof Events & string>(eventName: E, args: Events[E]): boolean;

  hasListener<E extends keyof Events & string>(eventName: E): boolean;
}
