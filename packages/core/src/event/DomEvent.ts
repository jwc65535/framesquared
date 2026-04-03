/**
 * @framesquared/core – EventManager (DomEvent)
 *
 * Thin layer over native DOM events providing:
 *  - Tracked listener registration with bulk cleanup
 *  - Event delegation via closest()
 *  - DOM-ready callback
 *  - Utility helpers for coordinates, keys, stopEvent
 */

import type { Destroyable } from './Destroyable.js';

// ---------------------------------------------------------------------------
// Internal tracking
// ---------------------------------------------------------------------------

interface TrackedListener {
  element: Element | Document;
  eventName: string;
  handler: EventListener;
  options?: AddEventListenerOptions;
}

const tracked: TrackedListener[] = [];

// ---------------------------------------------------------------------------
// EventManager singleton
// ---------------------------------------------------------------------------

export const EventManager = {
  // ----- on -----

  /**
   * Registers a DOM event listener.  The listener is tracked for
   * bulk removal via {@link removeAll}.
   *
   * Returns a {@link Destroyable} handle.
   */
  on(
    element: Element | Document,
    eventName: string,
    handler: EventListener,
    options?: AddEventListenerOptions,
  ): Destroyable {
    element.addEventListener(eventName, handler, options);
    const entry: TrackedListener = { element, eventName, handler, options };
    tracked.push(entry);

    return {
      destroy() {
        element.removeEventListener(eventName, handler, options);
        const idx = tracked.indexOf(entry);
        if (idx !== -1) tracked.splice(idx, 1);
      },
    };
  },

  // ----- un -----

  /**
   * Removes a DOM event listener.
   */
  un(element: Element | Document, eventName: string, handler: EventListener): void {
    element.removeEventListener(eventName, handler);
    const idx = tracked.findIndex(
      (t) => t.element === element && t.eventName === eventName && t.handler === handler,
    );
    if (idx !== -1) tracked.splice(idx, 1);
  },

  // ----- delegate -----

  /**
   * Event delegation: listens on `element` and fires `handler` only when
   * the event target (or an ancestor up to `element`) matches `selector`.
   *
   * Uses `Element.closest()` — no IE polyfill needed.
   */
  delegate(
    element: Element,
    eventName: string,
    selector: string,
    handler: (e: Event, matchedTarget: Element) => void,
  ): Destroyable {
    const delegateHandler: EventListener = (e: Event) => {
      const target = e.target as Element | null;
      if (!target) return;
      const matched = target.closest(selector);
      if (matched && element.contains(matched)) {
        handler(e, matched);
      }
    };

    return EventManager.on(element, eventName, delegateHandler);
  },

  // ----- onReady -----

  /**
   * Calls `fn` when the DOM is ready.  If it's already ready (interactive
   * or complete), fires immediately.
   */
  onReady(fn: () => void): void {
    if (
      typeof document !== 'undefined' &&
      (document.readyState === 'interactive' || document.readyState === 'complete')
    ) {
      fn();
    } else if (typeof document !== 'undefined') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    }
  },

  // ----- utility helpers -----

  /** Prevents default and stops propagation. */
  stopEvent(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
  },

  /** Returns `e.pageX` (or `e.clientX` as fallback). */
  getPageX(e: MouseEvent): number {
    return e.pageX ?? e.clientX;
  },

  /** Returns `e.pageY` (or `e.clientY` as fallback). */
  getPageY(e: MouseEvent): number {
    return e.pageY ?? e.clientY;
  },

  /** Returns `e.relatedTarget`. */
  getRelatedTarget(e: MouseEvent): Element | null {
    return e.relatedTarget as Element | null;
  },

  /** Returns `e.key` (modern key value). */
  getKeyCode(e: KeyboardEvent): string {
    return e.key;
  },

  // ----- bulk cleanup -----

  /**
   * Removes all listeners registered via {@link on} and {@link delegate}.
   */
  removeAll(): void {
    for (const entry of tracked) {
      entry.element.removeEventListener(entry.eventName, entry.handler, entry.options);
    }
    tracked.length = 0;
  },
};
