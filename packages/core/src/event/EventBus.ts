/**
 * @framesquared/core – EventBus
 *
 * Global singleton event bus with publish / subscribe semantics.
 * Supports dot-separated namespaced channels and wildcards:
 *
 *  - `"user.login"`     — exact match
 *  - `"user.*"`         — matches one segment after "user."
 *  - `"user.**"`        — matches one or more segments after "user."
 *  - `"**"`             — matches any channel
 */

/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import type { Destroyable } from './Destroyable.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Subscription {
  pattern: string;
  handler: Function;
  scope: object | undefined;
}

// ---------------------------------------------------------------------------
// Wildcard matching
// ---------------------------------------------------------------------------

/**
 * Returns `true` if `channel` matches the subscription `pattern`.
 *
 *  - Exact match:  `"a.b.c"` matches `"a.b.c"`
 *  - Single wild:  `"a.*"` matches `"a.x"` but not `"a"` or `"a.x.y"`
 *  - Deep wild:    `"a.**"` matches `"a.x"`, `"a.x.y"`, `"a.x.y.z"`
 *  - Global deep:  `"**"` matches everything
 */
function matchPattern(pattern: string, channel: string): boolean {
  // Global deep wildcard
  if (pattern === '**') return true;

  // Deep wildcard suffix
  if (pattern.endsWith('.**')) {
    const prefix = pattern.slice(0, -3); // "user" from "user.**"
    return channel.startsWith(prefix + '.');
  }

  // Single wildcard suffix
  if (pattern.endsWith('.*')) {
    const prefix = pattern.slice(0, -2); // "user" from "user.*"
    if (!channel.startsWith(prefix + '.')) return false;
    // Must have exactly one more segment
    const rest = channel.slice(prefix.length + 1);
    return rest.length > 0 && !rest.includes('.');
  }

  // Exact match
  return pattern === channel;
}

// ---------------------------------------------------------------------------
// EventBus singleton
// ---------------------------------------------------------------------------

class EventBusImpl {
  private subscriptions: Subscription[] = [];

  /**
   * Publishes a message to a channel.  All matching subscribers are called.
   */
  publish(channel: string, ...args: unknown[]): void {
    // Snapshot for safe iteration
    const snapshot = [...this.subscriptions];
    for (const sub of snapshot) {
      if (matchPattern(sub.pattern, channel)) {
        sub.handler.apply(sub.scope, args);
      }
    }
  }

  /**
   * Subscribes to a channel (exact or wildcard pattern).
   * Returns a {@link Destroyable} handle.
   */
  subscribe(
    channel: string,
    handler: Function,
    scope?: object,
  ): Destroyable {
    const sub: Subscription = { pattern: channel, handler, scope };
    this.subscriptions.push(sub);

    return {
      destroy: () => {
        const idx = this.subscriptions.indexOf(sub);
        if (idx !== -1) this.subscriptions.splice(idx, 1);
      },
    };
  }

  /**
   * Removes a specific subscription by handler reference.
   */
  unsubscribe(channel: string, handler: Function): void {
    const idx = this.subscriptions.findIndex(
      (s) => s.pattern === channel && s.handler === handler,
    );
    if (idx !== -1) this.subscriptions.splice(idx, 1);
  }
}

/** Singleton global event bus. */
export const EventBus = new EventBusImpl();
