/**
 * @framesquared/app – Scheduler
 *
 * Batches multiple state changes into a single notification cycle.
 * Uses microtask (queueMicrotask) for async batching.  Provides
 * synchronous flush() for immediate processing.  Detects circular
 * dependencies during formula evaluation.
 */

let pending = false;
let flushing = false;
const flushListeners: (() => void)[] = [];
const processing = new Set<string>();

export const Scheduler = {
  /**
   * Schedule a flush.  Multiple calls before the flush coalesce
   * into a single notification cycle.
   */
  schedule(): void {
    if (pending) return;
    pending = true;
    queueMicrotask(() => {
      if (pending) Scheduler.flush();
    });
  },

  /**
   * Synchronous flush — process all pending notifications immediately.
   */
  flush(): void {
    if (flushing) return;
    flushing = true;
    pending = false;
    for (const fn of flushListeners) fn();
    flushing = false;
  },

  /** Register a flush callback. */
  onFlush(fn: () => void): void {
    if (!flushListeners.includes(fn)) flushListeners.push(fn);
  },

  /** Unregister a flush callback. */
  offFlush(fn: () => void): void {
    const idx = flushListeners.indexOf(fn);
    if (idx >= 0) flushListeners.splice(idx, 1);
  },

  // -----------------------------------------------------------------------
  // Circular dependency detection
  // -----------------------------------------------------------------------

  /** Begin a formula evaluation cycle. */
  beginCycle(): void {
    processing.clear();
  },

  /** End a formula evaluation cycle. */
  endCycle(): void {
    processing.clear();
  },

  /**
   * Mark a stub as currently being processed.  If it's already
   * being processed, we have a circular dependency.
   */
  markProcessing(name: string): void {
    if (processing.has(name)) {
      throw new Error(`Circular dependency detected: "${name}" is already being evaluated`);
    }
    processing.add(name);
  },

  /** Unmark a stub after processing completes. */
  unmarkProcessing(name: string): void {
    processing.delete(name);
  },

  /** Reset all state (for tests). */
  reset(): void {
    pending = false;
    flushing = false;
    flushListeners.length = 0;
    processing.clear();
  },
};
